import type { DictionaryLanguageId } from "../shared/languages.js";
import {
  isEnglishDictionary,
  shouldFetchTranslations,
} from "../shared/languages.js";
import type {
  LookupEnrichmentMessage,
  LookupRefreshMessage,
} from "../shared/messages.js";
import type { LookupResult, UserSettings } from "../shared/types.js";
import { fetchDatamuseRelated } from "./datamuse-related.js";
import { getLookupOrchestrator } from "./lookup-orchestrator.js";
import type { EnrichmentCache } from "./providers/cache.js";
import {
  cacheKey,
  readEnrichment,
  saveEnrichment,
} from "./providers/index.js";
import { fetchWiktionaryEnrichment } from "./wiktionary-enrichment.js";

const ENRICHMENT_FETCH_MS = 3_500;
const DATAMUSE_FETCH_MS = 3_000;

export interface EnrichmentContext {
  requestId: string;
  result: LookupResult;
  language: DictionaryLanguageId;
  settings: UserSettings;
  tabId?: number;
}

function wantsTranslations(
  settings: UserSettings,
  language: DictionaryLanguageId,
): boolean {
  return (
    settings.translationsEnabled &&
    shouldFetchTranslations(language, settings.targetLanguage)
  );
}

function wantsSynAnt(settings: UserSettings): boolean {
  return settings.synonymsAntonymsEnabled;
}

export function needsAsyncEnrichment(
  result: LookupResult,
  settings: UserSettings,
  language: DictionaryLanguageId,
): boolean {
  const fetchTranslations = wantsTranslations(settings, language);
  const fetchSynAnt = wantsSynAnt(settings);

  if (!fetchTranslations && !fetchSynAnt) {
    return false;
  }

  if (fetchTranslations && result.translations.length === 0) {
    return true;
  }

  if (fetchSynAnt && result.synonyms.length === 0 && result.antonyms.length === 0) {
    return true;
  }

  return false;
}

export function applyCachedEnrichmentToResult(
  result: LookupResult,
  enrichment: EnrichmentCache,
): LookupResult {
  const next = { ...result };
  if (enrichment.translationsEnabled) {
    next.translations = enrichment.translations;
  }
  if (enrichment.synonymsAntonymsEnabled) {
    next.synonyms = enrichment.synonyms;
    next.antonyms = enrichment.antonyms;
  }
  return next;
}

export async function applyCachedEnrichmentFromStore(
  result: LookupResult,
  settings: UserSettings,
  language: DictionaryLanguageId,
): Promise<LookupResult> {
  const cached = await readEnrichment(language, result.lemma, settings);
  if (!cached) {
    return result;
  }
  return applyCachedEnrichmentToResult(result, cached);
}

function pushToUi(
  tabId: number | undefined,
  message: LookupEnrichmentMessage | LookupRefreshMessage,
): void {
  if (tabId != null) {
    void browser.tabs.sendMessage(tabId, message).catch(() => {
      void browser.runtime.sendMessage(message).catch(() => {});
    });
    return;
  }
  void browser.runtime.sendMessage(message).catch(() => {});
}

function buildEnrichmentCache(
  settings: UserSettings,
  translations: LookupResult["translations"],
  synonyms: string[],
  antonyms: string[],
): EnrichmentCache {
  return {
    targetLanguage: settings.targetLanguage,
    translationsEnabled: settings.translationsEnabled,
    synonymsAntonymsEnabled: settings.synonymsAntonymsEnabled,
    translations,
    synonyms,
    antonyms,
    enrichedAt: Date.now(),
  };
}

export async function fetchAndPushEnrichment(ctx: EnrichmentContext): Promise<void> {
  const { requestId, result, language, settings, tabId } = ctx;
  const fetchTranslations = wantsTranslations(settings, language);
  const fetchSynAnt = wantsSynAnt(settings);

  if (!fetchTranslations && !fetchSynAnt) {
    return;
  }

  const priorSynonyms = result.synonyms ?? [];
  const priorAntonyms = result.antonyms ?? [];
  let translations = result.translations ?? [];
  let synonyms = priorSynonyms;
  let antonyms = priorAntonyms;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ENRICHMENT_FETCH_MS);
  try {
    const enriched = await fetchWiktionaryEnrichment(
      result.word,
      language,
      {
        targetLanguage: fetchTranslations ? settings.targetLanguage : null,
        synonymsAntonyms: fetchSynAnt,
      },
      controller.signal,
    );
    if (fetchTranslations) {
      translations = enriched.translations;
    }
    if (fetchSynAnt) {
      synonyms = enriched.synonyms.length > 0 ? enriched.synonyms : priorSynonyms;
      antonyms = enriched.antonyms.length > 0 ? enriched.antonyms : priorAntonyms;
    }
  } catch {
    if (fetchTranslations) {
      translations = [];
    }
    if (fetchSynAnt) {
      synonyms = priorSynonyms;
      antonyms = priorAntonyms;
    }
  } finally {
    clearTimeout(timer);
  }

  if (
    fetchSynAnt &&
    isEnglishDictionary(language) &&
    synonyms.length === 0 &&
    antonyms.length === 0
  ) {
    const datamuseController = new AbortController();
    const datamuseTimer = setTimeout(() => datamuseController.abort(), DATAMUSE_FETCH_MS);
    try {
      const related = await fetchDatamuseRelated(result.word, datamuseController.signal);
      synonyms = related.synonyms;
      antonyms = related.antonyms;
    } catch {
      // Keep any FDA-provided related words.
    } finally {
      clearTimeout(datamuseTimer);
    }
  }

  const shouldPush =
    (fetchTranslations && translations.length > 0) ||
    (fetchSynAnt && (synonyms.length > 0 || antonyms.length > 0));

  if (shouldPush) {
    await saveEnrichment(
      language,
      result.lemma,
      buildEnrichmentCache(settings, translations, synonyms, antonyms),
    );

    pushToUi(tabId, {
      type: "lookupEnrichment",
      requestId,
      translations: fetchTranslations ? translations : [],
      synonyms: fetchSynAnt ? synonyms : [],
      antonyms: fetchSynAnt ? antonyms : [],
    });
  }
}

export function scheduleLookupEnrichment(ctx: EnrichmentContext): void {
  void fetchAndPushEnrichment(ctx);
}

export interface RevalidationContext {
  requestId: string;
  word: string;
  language: DictionaryLanguageId;
  settings: UserSettings;
  tabId?: number;
}

export async function fetchAndPushRevalidation(ctx: RevalidationContext): Promise<void> {
  const orchestrator = getLookupOrchestrator();
  const response = await orchestrator.lookup({
    word: ctx.word,
    language: ctx.language,
    requestId: ctx.requestId,
    skipCache: true,
  });

  if (!response.ok) {
    return;
  }

  let result = response.result;
  result = await applyCachedEnrichmentFromStore(result, ctx.settings, ctx.language);

  pushToUi(ctx.tabId, {
    type: "lookupRefresh",
    requestId: ctx.requestId,
    result,
  });

  if (needsAsyncEnrichment(result, ctx.settings, ctx.language)) {
    scheduleLookupEnrichment({
      requestId: ctx.requestId,
      result,
      language: ctx.language,
      settings: ctx.settings,
      tabId: ctx.tabId,
    });
  }
}

export function scheduleCacheRevalidation(ctx: RevalidationContext): void {
  void fetchAndPushRevalidation(ctx);
}

export function prepareLookupResultForResponse(
  result: LookupResult,
  settings: UserSettings,
  language: DictionaryLanguageId,
): LookupResult {
  const fetchTranslations = wantsTranslations(settings, language);
  const fetchSynAnt = wantsSynAnt(settings);

  if (!fetchTranslations && !fetchSynAnt) {
    return {
      ...result,
      translations: [],
      synonyms: [],
      antonyms: [],
    };
  }

  const next = { ...result };
  if (fetchTranslations && next.translations.length === 0) {
    next.translations = [];
  }
  if (fetchSynAnt) {
    next.synonyms = next.synonyms ?? [];
    next.antonyms = next.antonyms ?? [];
  } else {
    next.synonyms = [];
    next.antonyms = [];
  }
  if (!fetchTranslations) {
    next.translations = [];
  }

  return next;
}

export { cacheKey };
