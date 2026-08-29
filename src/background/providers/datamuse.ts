import type { DictionaryLanguageId } from "../../shared/languages.js";
import type { Definition, LookupResult } from "../../shared/types.js";
import { normalizeDefinitions } from "../../shared/normalize-definitions.js";
import { fetchJson } from "./fetch-http.js";
import type { LookupProvider, ProviderOutcome } from "./types.js";

interface DatamuseWord {
  word?: string;
  defs?: string[];
}

function datamuseLang(language: DictionaryLanguageId): string | null {
  if (language === "en-us" || language === "en-uk") {
    return "en";
  }
  if (language === "es") {
    return "es";
  }
  return null;
}

function parseDatamuseDefs(defs: string[]): Definition[] {
  const out: Definition[] = [];
  for (const line of defs) {
    const normalized = normalizeDefinitions([{ text: line }])[0];
    if (normalized && normalized.text.length > 2) {
      out.push(normalized);
    }
  }
  return out;
}

export const datamuseProvider: LookupProvider = {
  id: "datamuse",
  async lookup(word, language, signal): Promise<ProviderOutcome> {
    const vocab = datamuseLang(language);
    if (!vocab) {
      return { kind: "miss" };
    }

    const params = new URLSearchParams({
      sp: word,
      md: "d",
      max: "5",
    });
    if (vocab === "es") {
      params.set("v", "es");
    }

    const url = `https://api.datamuse.com/words?${params}`;
    const res = await fetchJson<DatamuseWord[]>(url, { signal });

    if (!res.ok) {
      return {
        kind: "error",
        code: res.code,
        retryable: res.retryable,
        retryAfterSec: res.retryAfterSec,
      };
    }

    const match = res.data.find((w) => w.word?.toLowerCase() === word.toLowerCase()) ?? res.data[0];
    if (!match?.defs?.length) {
      return { kind: "miss" };
    }

    const definitions = parseDatamuseDefs(match.defs);
    if (definitions.length === 0) {
      return { kind: "miss" };
    }

    const result: LookupResult = {
      word,
      lemma: match.word ?? word,
      language,
      definitions,
      translations: [],
      synonyms: [],
      antonyms: [],
      sourceUrl: `https://www.datamuse.com/words?sp=${encodeURIComponent(word)}`,
      provider: "datamuse",
      partial: true,
    };

    return { kind: "hit", result };
  },
};

/** Suggest spelling correction via Datamuse (used by normalize variants later). */
export async function datamuseSpellSuggest(
  word: string,
  language: DictionaryLanguageId,
  signal: AbortSignal,
): Promise<string | null> {
  const vocab = datamuseLang(language);
  if (!vocab) {
    return null;
  }

  const params = new URLSearchParams({ sp: word, max: "1" });
  if (vocab === "es") {
    params.set("v", "es");
  }

  const res = await fetchJson<DatamuseWord[]>(
    `https://api.datamuse.com/words?${params}`,
    { signal },
  );

  if (!res.ok || res.data.length === 0) {
    return null;
  }

  const suggestion = res.data[0]?.word;
  if (!suggestion || suggestion.toLowerCase() === word.toLowerCase()) {
    return null;
  }
  return suggestion;
}
