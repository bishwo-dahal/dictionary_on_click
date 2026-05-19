import type { DictionaryLanguageId } from "../../shared/languages.js";
import type { Definition, LookupResult } from "../../shared/types.js";
import { fetchJson } from "./fetch-http.js";
import type { LookupProvider, ProviderOutcome } from "./types.js";

interface FdaMeaning {
  partOfSpeech?: string;
  definitions?: Array<{
    definition?: string;
    example?: string;
  }>;
}

interface FdaPhonetic {
  text?: string;
  audio?: string;
}

interface FdaEntry {
  word?: string;
  phonetics?: FdaPhonetic[];
  meanings?: FdaMeaning[];
  sourceUrls?: string[];
}

function pickPronunciation(entry: FdaEntry): { phonetic?: string; audioUrl?: string } {
  const phonetics = entry.phonetics ?? [];
  const withAudio = phonetics.find((p) => p.audio?.trim());
  const withText = phonetics.find((p) => p.text?.trim());
  const best = withAudio ?? withText;
  if (!best) {
    return {};
  }
  return {
    phonetic: best.text?.trim(),
    audioUrl: withAudio?.audio?.trim(),
  };
}

function isEnglish(language: DictionaryLanguageId): boolean {
  return language === "en-us" || language === "en-uk";
}

export const freeDictionaryProvider: LookupProvider = {
  id: "free-dictionary",
  async lookup(word, language, signal): Promise<ProviderOutcome> {
    if (!isEnglish(language)) {
      return { kind: "miss" };
    }

    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
    const res = await fetchJson<FdaEntry[]>(url, { signal });

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

    const entry = res.data[0]!;
    const definitions: Definition[] = [];

    for (const meaning of entry.meanings ?? []) {
      for (const d of meaning.definitions ?? []) {
        if (!d.definition?.trim()) {
          continue;
        }
        definitions.push({
          partOfSpeech: meaning.partOfSpeech,
          text: d.definition.trim(),
          examples: d.example ? [d.example] : undefined,
        });
      }
    }

    if (definitions.length === 0) {
      return { kind: "miss" };
    }

    const pronunciation = pickPronunciation(entry);

    const result: LookupResult = {
      word,
      lemma: entry.word ?? word,
      language,
      definitions,
      translations: [],
      sourceUrl: entry.sourceUrls?.[0] ?? `https://en.wiktionary.org/wiki/${encodeURIComponent(word)}`,
      provider: "free-dictionary",
      ...pronunciation,
    };

    return { kind: "hit", result };
  },
};
