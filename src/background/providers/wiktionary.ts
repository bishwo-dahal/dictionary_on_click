import type { Definition } from "../../shared/types.js";
import type { DictionaryLanguageId } from "../../shared/languages.js";
import {
  getLanguage,
  WIKIMEDIA_USER_AGENT,
  wiktionaryHost,
} from "../../shared/languages.js";
import { fetchJson, toWikiTitle } from "./fetch-http.js";
import type { LookupProvider, ProviderOutcome } from "./types.js";
import type { LookupResult } from "../../shared/types.js";

const WIKI_HEADERS = { "User-Agent": WIKIMEDIA_USER_AGENT };

interface RestDefinitionItem {
  partOfSpeech?: string;
  language?: string;
  definitions?: Array<{
    definition?: string;
    example?: string;
  }>;
}

interface WikiQueryResponse {
  query?: {
    pages?: Record<
      string,
      {
        title?: string;
        missing?: string;
        extract?: string;
      }
    >;
  };
}

function parseRestDefinitions(data: RestDefinitionItem[]): Definition[] {
  const defs: Definition[] = [];
  for (const entry of data) {
    const pos = entry.partOfSpeech;
    for (const d of entry.definitions ?? []) {
      if (!d.definition?.trim()) {
        continue;
      }
      defs.push({
        partOfSpeech: pos,
        text: d.definition.trim(),
        examples: d.example ? [d.example] : undefined,
      });
    }
  }
  return defs;
}

function parseExtractDefinitions(extract: string): Definition[] {
  const lines = extract
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("From Wiktionary"));

  const defs: Definition[] = [];
  for (const line of lines.slice(0, 12)) {
    if (line.length < 3) {
      continue;
    }
    defs.push({ text: line });
  }
  return defs;
}

function buildResult(
  word: string,
  language: DictionaryLanguageId,
  wikiCode: string,
  definitions: Definition[],
  provider: LookupProvider["id"],
): LookupResult | null {
  if (definitions.length === 0) {
    return null;
  }
  const title = toWikiTitle(word);
  return {
    word,
    lemma: word,
    language,
    definitions,
    translations: [],
    sourceUrl: `${wiktionaryHost(wikiCode)}/wiki/${encodeURIComponent(title)}`,
    provider,
  };
}

export const wiktionaryRestProvider: LookupProvider = {
  id: "wiktionary-rest",
  async lookup(word, language, signal) {
    const lang = getLanguage(language);
    if (!lang.restLang) {
      return { kind: "miss" };
    }

    const url = `${wiktionaryHost(lang.wikiCode)}/api/rest_v1/page/definition/${encodeURIComponent(word)}`;
    const res = await fetchJson<RestDefinitionItem[]>(url, {
      signal,
      headers: WIKI_HEADERS,
    });

    if (!res.ok) {
      if (res.code === "NOT_FOUND") {
        return { kind: "miss" };
      }
      return {
        kind: "error",
        code: res.code,
        retryable: res.retryable,
        retryAfterSec: res.retryAfterSec,
      };
    }

    if (!Array.isArray(res.data) || res.data.length === 0) {
      return { kind: "miss" };
    }

    const definitions = parseRestDefinitions(res.data);
    const result = buildResult(word, language, lang.wikiCode, definitions, "wiktionary-rest");
    return result ? { kind: "hit", result } : { kind: "miss" };
  },
};

export const wiktionaryActionProvider: LookupProvider = {
  id: "wiktionary-action",
  async lookup(word, language, signal) {
    const lang = getLanguage(language);
    const title = toWikiTitle(word);
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      prop: "extracts",
      exintro: "1",
      explaintext: "1",
      redirects: "1",
      titles: title,
      origin: "*",
    });

    const url = `${wiktionaryHost(lang.wikiCode)}/w/api.php?${params}`;
    const res = await fetchJson<WikiQueryResponse>(url, {
      signal,
      headers: WIKI_HEADERS,
    });

    if (!res.ok) {
      if (res.code === "NOT_FOUND") {
        return { kind: "miss" };
      }
      return {
        kind: "error",
        code: res.code,
        retryable: res.retryable,
        retryAfterSec: res.retryAfterSec,
      };
    }

    const pages = res.data.query?.pages;
    if (!pages) {
      return { kind: "miss" };
    }

    const page = Object.values(pages)[0];
    if (!page || page.missing !== undefined || !page.extract?.trim()) {
      return { kind: "miss" };
    }

    const definitions = parseExtractDefinitions(page.extract);
    const lemma = page.title?.replace(/_/g, " ") ?? word;
    const result = buildResult(lemma, language, lang.wikiCode, definitions, "wiktionary-action");
    return result ? { kind: "hit", result } : { kind: "miss" };
  },
};
