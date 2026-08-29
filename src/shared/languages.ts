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

/** Wiktionary `{{t|…}}` template language code for a dictionary language id. */
export function toWiktionaryTranslationCode(id: DictionaryLanguageId): string {
  switch (id) {
    case "en-us":
    case "en-uk":
      return "en";
    case "pt-br":
      return "pt";
    case "zh-hans":
      return "zh";
    case "zh-hant":
      return "zh-Hant";
    default:
      return getLanguage(id).wikiCode;
  }
}

/** Wiktionary template language codes that satisfy a translation target. */
export function translationCodesForTarget(id: DictionaryLanguageId): readonly string[] {
  switch (id) {
    case "zh-hans":
      return ["zh", "cmn"];
    case "zh-hant":
      return ["zh-hant", "zh", "cmn"];
    default: {
      const code = toWiktionaryTranslationCode(id).toLowerCase();
      return code === "zh-hant" ? ["zh-hant", "zh", "cmn"] : [code];
    }
  }
}

/** Whether gloss lookup should run for this dictionary/target pair. */
export function shouldFetchTranslations(
  dictionary: DictionaryLanguageId,
  target: DictionaryLanguageId,
): boolean {
  if (dictionary === target) {
    return false;
  }

  const dictWiki = getLanguage(dictionary).wikiCode;
  const targetWiki = getLanguage(target).wikiCode;
  if (dictWiki === targetWiki) {
    return false;
  }

  return true;
}

/** Sensible default target when dictionary and target would be equivalent. */
export function defaultTranslationTarget(
  dictionary: DictionaryLanguageId,
): DictionaryLanguageId {
  const dictWiki = getLanguage(dictionary).wikiCode;
  if (dictWiki !== "en") {
    for (const english of ["en-us", "en-uk"] as const) {
      if (shouldFetchTranslations(dictionary, english)) {
        return english;
      }
    }
  }

  const preference: DictionaryLanguageId[] = [
    "fr",
    "es",
    "de",
    "ja",
    "it",
    "pt-br",
    "ru",
    "ko",
    "nl",
    "ar",
    "hi",
    "cs",
    "sk",
    "tr",
    "zh-hans",
    "zh-hant",
    "en-us",
    "en-uk",
  ];

  for (const candidate of preference) {
    if (shouldFetchTranslations(dictionary, candidate)) {
      return candidate;
    }
  }

  const fallback = LANGUAGES.find((lang) => shouldFetchTranslations(dictionary, lang.id));
  return fallback?.id ?? "fr";
}

/** Compliant User-Agent for Wikimedia API requests. */
export const WIKIMEDIA_USER_AGENT =
  "DictionaryOnClick/0.1.2 (browser extension; https://github.com/bishwo-dahal/dictionary-on-click)";

export function isEnglishDictionary(id: DictionaryLanguageId): boolean {
  return id === "en-us" || id === "en-uk";
}
