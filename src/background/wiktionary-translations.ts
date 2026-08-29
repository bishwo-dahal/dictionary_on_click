import type { DictionaryLanguageId } from "../shared/languages.js";
import {
  getLanguage,
  getLanguageLabel,
  translationCodesForTarget,
  WIKIMEDIA_USER_AGENT,
  wiktionaryHost,
} from "../shared/languages.js";
import type { Translation } from "../shared/types.js";
import { fetchJson, toWikiTitle } from "./providers/fetch-http.js";

const WIKI_HEADERS = { "User-Agent": WIKIMEDIA_USER_AGENT };
const MAX_GLOSSES = 8;

const TRANSLATIONS_SECTION =
  /^={2,6}[^=\n]*(?:Translations|Traductions|Übersetzungen|Traducciones|Traduzioni|Vertalingen|Переводы)[^=\n]*={2,6}\s*$/im;

/** MediaWiki revision content (legacy `*` or slot-based). */
const TRANSLATION_TEMPLATE =
  /\{\{(?:t{1,2}|trad)[+-]?\|([^|}\s]+)\|([^}|]+)/gi;

interface WikiRevision {
  "*"?: string;
  slots?: {
    main?: {
      "*"?: string;
    };
  };
}

interface WikiRevisionsResponse {
  query?: {
    pages?: Record<
      string,
      {
        title?: string;
        missing?: string;
        revisions?: WikiRevision[];
      }
    >;
  };
}

function extractRevisionWikitext(revision: WikiRevision | undefined): string | undefined {
  const slotted = revision?.slots?.main?.["*"];
  if (slotted?.trim()) {
    return slotted;
  }
  return revision?.["*"];
}

/** Extract the Translations section from full page wikitext. */
export function extractTranslationsSection(wikitext: string): string {
  const match = TRANSLATIONS_SECTION.exec(wikitext);
  if (!match || match.index === undefined) {
    return "";
  }

  const start = match.index + match[0].length;
  const rest = wikitext.slice(start);
  const nextSection = rest.search(/^={2,6}[^=].*={2,6}\s*$/m);
  return nextSection === -1 ? rest : rest.slice(0, nextSection);
}

/** Strip wikitext markup from a gloss string. */
export function cleanGlossText(raw: string): string {
  return raw
    .replace(/\{\{[^}]+\}\}/g, " ")
    .replace(/\[\[([^|\]]+\|)?([^\]]+)\]\]/g, "$2")
    .replace(/''+/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parse `{{t|lang|gloss}}` templates for a target Wiktionary language code.
 * Exported for unit tests.
 */
export function parseTranslationGlosses(
  wikitext: string,
  targetLanguage: DictionaryLanguageId,
  targetLabel: string = getLanguageLabel(targetLanguage),
): Translation[] {
  const scoped = extractTranslationsSection(wikitext);
  const fromScoped = collectTranslationGlosses(scoped, targetLanguage, targetLabel);
  if (fromScoped.length > 0) {
    return fromScoped;
  }
  return collectTranslationGlosses(wikitext, targetLanguage, targetLabel);
}

function collectTranslationGlosses(
  wikitext: string,
  targetLanguage: DictionaryLanguageId,
  targetLabel: string,
): Translation[] {
  if (!wikitext.trim()) {
    return [];
  }

  const codes = new Set(translationCodesForTarget(targetLanguage));

  const seen = new Set<string>();
  const out: Translation[] = [];

  const templateRe = new RegExp(TRANSLATION_TEMPLATE.source, TRANSLATION_TEMPLATE.flags);
  let m: RegExpExecArray | null;
  while ((m = templateRe.exec(wikitext)) !== null) {
    const lang = m[1]!.trim().toLowerCase();
    if (!codes.has(lang)) {
      continue;
    }
    const gloss = cleanGlossText(m[2]!);
    if (gloss.length < 1) {
      continue;
    }
    const key = gloss.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push({ language: targetLabel, text: gloss });
    if (out.length >= MAX_GLOSSES) {
      break;
    }
  }

  return out;
}

export async function fetchWiktionaryTranslations(
  word: string,
  dictionaryLanguage: DictionaryLanguageId,
  targetLanguage: DictionaryLanguageId,
  signal: AbortSignal,
): Promise<Translation[]> {
  const source = getLanguage(dictionaryLanguage);
  const targetLabel = getLanguageLabel(targetLanguage);
  const title = toWikiTitle(word);

  const params = new URLSearchParams({
    action: "query",
    format: "json",
    prop: "revisions",
    rvprop: "content",
    rvslots: "main",
    redirects: "1",
    titles: title,
    origin: "*",
  });

  const url = `${wiktionaryHost(source.wikiCode)}/w/api.php?${params}`;
  const res = await fetchJson<WikiRevisionsResponse>(url, {
    signal,
    headers: WIKI_HEADERS,
  });

  if (!res.ok) {
    return [];
  }

  const pages = res.data.query?.pages;
  if (!pages) {
    return [];
  }

  const page = Object.values(pages)[0];
  const wikitext = extractRevisionWikitext(page?.revisions?.[0]);
  if (!page || page.missing !== undefined || !wikitext?.trim()) {
    return [];
  }

  return parseTranslationGlosses(wikitext, targetLanguage, targetLabel);
}
