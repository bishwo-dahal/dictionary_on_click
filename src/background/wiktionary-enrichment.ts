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
const MAX_RELATED = 8;

const TRANSLATIONS_SECTION =
  /^={2,6}[^=\n]*(?:Translations|Traductions|Übersetzungen|Traducciones|Traduzioni|Vertalingen|Переводы)[^=\n]*={2,6}\s*$/im;

const SYNONYM_SECTION =
  /^={2,6}[^=\n]*(?:Synonyms|Synonymes|Sinónimos|Sinónimo|Synonyme|Синонимы|مرادفات|類義語|同義語)[^=\n]*={2,6}\s*$/gim;

const ANTONYM_SECTION =
  /^={2,6}[^=\n]*(?:Antonyms|Antonymes|Antónimos|Antónimo|Gegenteile|Antonyme|Антонимы|ضد|対義語|反義語)[^=\n]*={2,6}\s*$/gim;

const TRANSLATION_TEMPLATE =
  /\{\{(?:t{1,2}|trad)[+-]?\|([^|}\s]+)\|([^}|]+)/gi;

const SYNONYM_TEMPLATE = /\{\{(?:syn|sinónimo|sinonimo)\|([^}]+)\}\}/gi;
const ANTONYM_TEMPLATE = /\{\{(?:ant|antónimo|antonimo)\|([^}]+)\}\}/gi;

/** Wiktionary link/mention templates: {{l|en|word}}, {{m+|fr|mot}} */
const LINK_TEMPLATE =
  /\{\{(?:l|m|ll|link)\+?\|(?:[a-z]{2,3}(?:-[a-zA-Z]+)?\|)?([^}|#]+)/gi;

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

export interface WiktionaryEnrichmentOptions {
  targetLanguage: DictionaryLanguageId | null;
  synonymsAntonyms: boolean;
}

export interface WiktionaryEnrichmentResult {
  translations: Translation[];
  synonyms: string[];
  antonyms: string[];
}

export function extractRevisionWikitext(revision: WikiRevision | undefined): string | undefined {
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

function extractAllSections(wikitext: string, headerRe: RegExp): string[] {
  const sections: string[] = [];
  const re = new RegExp(headerRe.source, headerRe.flags);
  let match: RegExpExecArray | null;
  while ((match = re.exec(wikitext)) !== null) {
    if (match.index === undefined) {
      continue;
    }
    const start = match.index + match[0].length;
    const rest = wikitext.slice(start);
    const nextSection = rest.search(/^={2,6}[^=].*={2,6}\s*$/m);
    sections.push(nextSection === -1 ? rest : rest.slice(0, nextSection));
  }
  return sections;
}

/** Strip wikitext markup from a gloss string. */
export function cleanGlossText(raw: string): string {
  return raw
    .replace(/\{\{[^}]*\}\}/g, " ")
    .replace(/\[\[([^|\]]+\|)?([^\]]+)\]\]/g, "$2")
    .replace(/''+/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/[{}[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const WIKI_NAMESPACE_PREFIX =
  /^(?:thesaurus|category|file|image|media|help|template|module|special|wikipedia|wiktionary):/i;

function isValidRelatedWord(word: string): boolean {
  if (word.length < 1 || WIKI_NAMESPACE_PREFIX.test(word)) {
    return false;
  }
  if (/[{}[\]]/.test(word)) {
    return false;
  }
  return true;
}

function mergeUniqueWords(existing: string[], incoming: string[]): string[] {
  const seen = new Set(existing.map((w) => w.toLowerCase()));
  const out = [...existing];

  for (const raw of incoming) {
    const word = cleanGlossText(raw);
    if (!isValidRelatedWord(word)) {
      continue;
    }
    const key = word.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(word);
    if (out.length >= MAX_RELATED) {
      break;
    }
  }

  return out;
}

function parseTemplatePipeWords(captured: string, wikiCode: string): string[] {
  const parts = captured.split("|").map((p) => cleanGlossText(p)).filter(Boolean);
  if (parts.length === 0) {
    return [];
  }
  const first = parts[0]!.toLowerCase();
  if (first === wikiCode || /^[a-z]{2,3}(-[a-z]+)?$/.test(first)) {
    parts.shift();
  }
  return parts.filter((p) => isValidRelatedWord(p));
}

function parseLinkTemplateWords(wikitext: string): string[] {
  const words: string[] = [];
  const re = new RegExp(LINK_TEMPLATE.source, LINK_TEMPLATE.flags);
  let match: RegExpExecArray | null;
  while ((match = re.exec(wikitext)) !== null) {
    const word = cleanGlossText(match[1]!);
    if (isValidRelatedWord(word)) {
      words.push(word);
    }
  }
  return words;
}

function parseWikiLinks(section: string): string[] {
  const words: string[] = [];

  for (const match of section.matchAll(/\[\[([^|\]#]+)(?:\|[^\]]+)?\]\]/g)) {
    const word = cleanGlossText(match[1]!);
    if (isValidRelatedWord(word)) {
      words.push(word);
    }
  }

  return words;
}

function parsePlainListItems(section: string): string[] {
  const words: string[] = [];

  for (const line of section.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("*") || trimmed.includes("{{") || trimmed.includes("[[")) {
      continue;
    }
    const text = trimmed.replace(/^\*+\s*/, "").split(",")[0] ?? "";
    const word = cleanGlossText(text);
    if (isValidRelatedWord(word)) {
      words.push(word);
    }
  }

  return words;
}

function parseTemplateWords(
  wikitext: string,
  templateRe: RegExp,
  wikiCode: string,
): string[] {
  const words: string[] = [];
  const re = new RegExp(templateRe.source, templateRe.flags);
  let match: RegExpExecArray | null;
  while ((match = re.exec(wikitext)) !== null) {
    words.push(...parseTemplatePipeWords(match[1]!, wikiCode));
  }
  return words;
}

function collectRelatedWordsFromText(
  wikitext: string,
  templateRe: RegExp,
  wikiCode: string,
): string[] {
  return [
    ...parseLinkTemplateWords(wikitext),
    ...parseWikiLinks(wikitext),
    ...parsePlainListItems(wikitext),
    ...parseTemplateWords(wikitext, templateRe, wikiCode),
  ];
}

function collectFromSections(
  wikitext: string,
  headerRe: RegExp,
  templateRe: RegExp,
  wikiCode: string,
): string[] {
  let words: string[] = [];
  const sections = extractAllSections(wikitext, headerRe);

  for (const section of sections) {
    words = mergeUniqueWords(words, collectRelatedWordsFromText(section, templateRe, wikiCode));
    if (words.length >= MAX_RELATED) {
      return words.slice(0, MAX_RELATED);
    }
  }

  if (words.length === 0) {
    words = mergeUniqueWords(words, parseTemplateWords(wikitext, templateRe, wikiCode));
  }

  return words.slice(0, MAX_RELATED);
}

export function parseSynonyms(
  wikitext: string,
  dictionaryLanguage: DictionaryLanguageId,
): string[] {
  const wikiCode = getLanguage(dictionaryLanguage).wikiCode.toLowerCase();
  return collectFromSections(wikitext, SYNONYM_SECTION, SYNONYM_TEMPLATE, wikiCode);
}

export function parseAntonyms(
  wikitext: string,
  dictionaryLanguage: DictionaryLanguageId,
): string[] {
  const wikiCode = getLanguage(dictionaryLanguage).wikiCode.toLowerCase();
  return collectFromSections(wikitext, ANTONYM_SECTION, ANTONYM_TEMPLATE, wikiCode);
}

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

async function fetchWikitext(
  word: string,
  dictionaryLanguage: DictionaryLanguageId,
  signal: AbortSignal,
): Promise<string | null> {
  const source = getLanguage(dictionaryLanguage);
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
    return null;
  }

  const pages = res.data.query?.pages;
  if (!pages) {
    return null;
  }

  const page = Object.values(pages)[0];
  const wikitext = extractRevisionWikitext(page?.revisions?.[0]);
  if (!page || page.missing !== undefined || !wikitext?.trim()) {
    return null;
  }

  return wikitext;
}

export async function fetchWiktionaryEnrichment(
  word: string,
  dictionaryLanguage: DictionaryLanguageId,
  options: WiktionaryEnrichmentOptions,
  signal: AbortSignal,
): Promise<WiktionaryEnrichmentResult> {
  const empty: WiktionaryEnrichmentResult = {
    translations: [],
    synonyms: [],
    antonyms: [],
  };

  const needsTranslations = options.targetLanguage !== null;
  if (!needsTranslations && !options.synonymsAntonyms) {
    return empty;
  }

  const wikitext = await fetchWikitext(word, dictionaryLanguage, signal);
  if (!wikitext) {
    return empty;
  }

  const result: WiktionaryEnrichmentResult = { ...empty };

  if (needsTranslations && options.targetLanguage) {
    const targetLabel = getLanguageLabel(options.targetLanguage);
    result.translations = parseTranslationGlosses(
      wikitext,
      options.targetLanguage,
      targetLabel,
    );
  }

  if (options.synonymsAntonyms) {
    result.synonyms = parseSynonyms(wikitext, dictionaryLanguage);
    result.antonyms = parseAntonyms(wikitext, dictionaryLanguage);
  }

  return result;
}

/** @deprecated Use fetchWiktionaryEnrichment */
export async function fetchWiktionaryTranslations(
  word: string,
  dictionaryLanguage: DictionaryLanguageId,
  targetLanguage: DictionaryLanguageId,
  signal: AbortSignal,
): Promise<Translation[]> {
  const result = await fetchWiktionaryEnrichment(
    word,
    dictionaryLanguage,
    { targetLanguage, synonymsAntonyms: false },
    signal,
  );
  return result.translations;
}
