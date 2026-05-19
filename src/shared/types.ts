import type { DictionaryLanguageId, ProviderId } from "./languages.js";
import type { LookupErrorCode } from "./errors.js";
import type { ThemeMode } from "./theme.js";

/** A single sense or gloss line. */
export interface Definition {
  partOfSpeech?: string;
  text: string;
  examples?: string[];
}

/** Translation gloss for a foreign headword. */
export interface Translation {
  language: string;
  text: string;
}

/** Successful lookup payload (may be partial / cached). */
export interface LookupResult {
  word: string;
  lemma: string;
  language: DictionaryLanguageId;
  definitions: Definition[];
  translations: Translation[];
  sourceUrl: string;
  provider: ProviderId;
  cachedAt?: number;
  partial?: boolean;
  stale?: boolean;
}

/** Lookup failure with a specific error code (never generic). */
export interface LookupFailure {
  ok: false;
  code: LookupErrorCode;
  message: string;
  word: string;
  language: DictionaryLanguageId;
  retryable: boolean;
}

export interface LookupSuccess {
  ok: true;
  result: LookupResult;
}

export type LookupResponse = LookupSuccess | LookupFailure;

export interface UserSettings {
  dictionaryLanguage: DictionaryLanguageId;
  targetLanguage: DictionaryLanguageId;
  theme: ThemeMode;
  saveHistory: boolean;
  allowExternalHistory: boolean;
  allowedExtensionIds: string[];
}

export const DEFAULT_SETTINGS: UserSettings = {
  dictionaryLanguage: "en-us",
  targetLanguage: "en-us",
  theme: "system",
  saveHistory: false,
  allowExternalHistory: false,
  allowedExtensionIds: [],
};
