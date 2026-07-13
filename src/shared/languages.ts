/** User-facing dictionary language identifiers. */
export type DictionaryLanguageId =
  | "ar"
  | "pt-br"
  | "zh-hans"
  | "zh-hant"
  | "cs"
  | "nl"
  | "en-uk"
  | "en-us"
  | "fr"
  | "de"
  | "hi"
  | "it"
  | "ja"
  | "ko"
  | "ru"
  | "sk"
  | "es"
  | "tr";

export type ProviderId =
  | "cache"
  | "wiktionary-rest"
  | "wiktionary-action"
  | "free-dictionary"
  | "datamuse";

export interface LanguageConfig {
  id: DictionaryLanguageId;
  label: string;
  /** Wiktionary subdomain, e.g. `en` for en.wiktionary.org */
  wikiCode: string;
  /** BCP-47-ish tag for Wiktionary REST (English only today). */
  restLang: string | null;
}

export const LANGUAGES: readonly LanguageConfig[] = [
  { id: "ar", label: "Arabic", wikiCode: "ar", restLang: null },
  { id: "pt-br", label: "Brazilian Portuguese", wikiCode: "pt", restLang: null },
  { id: "zh-hans", label: "Chinese (Simplified)", wikiCode: "zh", restLang: null },
  { id: "zh-hant", label: "Chinese (Traditional)", wikiCode: "zh", restLang: null },
  { id: "cs", label: "Czech", wikiCode: "cs", restLang: null },
  { id: "nl", label: "Dutch", wikiCode: "nl", restLang: null },
  { id: "en-uk", label: "English (UK)", wikiCode: "en", restLang: "en" },
  { id: "en-us", label: "English (US)", wikiCode: "en", restLang: "en" },
  { id: "fr", label: "French", wikiCode: "fr", restLang: null },
  { id: "de", label: "German", wikiCode: "de", restLang: null },
  { id: "hi", label: "Hindi", wikiCode: "hi", restLang: null },
  { id: "it", label: "Italian", wikiCode: "it", restLang: null },
  { id: "ja", label: "Japanese", wikiCode: "ja", restLang: null },
  { id: "ko", label: "Korean", wikiCode: "ko", restLang: null },
  { id: "ru", label: "Russian", wikiCode: "ru", restLang: null },
  { id: "sk", label: "Slovak", wikiCode: "sk", restLang: null },
  { id: "es", label: "Spanish", wikiCode: "es", restLang: null },
  { id: "tr", label: "Turkish", wikiCode: "tr", restLang: null },
] as const;

export function getLanguage(id: DictionaryLanguageId): LanguageConfig {
  const lang = LANGUAGES.find((l) => l.id === id);
  if (!lang) {
    throw new Error(`Unknown language: ${id}`);
  }
  return lang;
}

export function getLanguageLabel(id: DictionaryLanguageId): string {
  return getLanguage(id).label;
}

export function wiktionaryHost(wikiCode: string): string {
  return `https://${wikiCode}.wiktionary.org`;
}

/** Compliant User-Agent for Wikimedia API requests. */
export const WIKIMEDIA_USER_AGENT =
  "DictionaryOnClick/0.1.2 (Firefox extension; https://github.com/bishwo-dahal/dictionary-on-click)";
