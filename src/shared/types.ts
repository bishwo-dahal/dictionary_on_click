import type { DictionaryLanguageId, ProviderId } from "./languages.js";
import type { LookupErrorCode } from "./errors.js";
import type { ThemeMode } from "./theme.js";

/** A single definition (gloss line). */
export interface Definition {
  /** Part of speech (POS), e.g. noun, verb — when the provider supplies it. */
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
  /** IPA or similar, when the provider supplies it. */
  phonetic?: string;
  /** MP3 URL (e.g. Free Dictionary API), when available. */
  audioUrl?: string;
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

export type BubblePreviewMax = 2 | 3 | 4 | 5;

export interface UserSettings {
  dictionaryLanguage: DictionaryLanguageId;
  targetLanguage: DictionaryLanguageId;
  theme: ThemeMode;
  /** Collapsed double-click bubble: max meanings before "+ more". Prefers diverse parts of speech (POS) when possible. */
  bubblePreviewMax: BubblePreviewMax;
  saveHistory: boolean;
  allowExternalHistory: boolean;
  allowedExtensionIds: string[];
}

export const DEFAULT_SETTINGS: UserSettings = {
  dictionaryLanguage: "en-us",
  targetLanguage: "en-us",
  theme: "system",
  bubblePreviewMax: 3,
  saveHistory: false,
  allowExternalHistory: false,
  allowedExtensionIds: [],
};
