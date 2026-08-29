import { fetchJson } from "./providers/fetch-http.js";

const MAX_RELATED = 8;

interface DatamuseWord {
  word?: string;
}

function collectWords(
  items: DatamuseWord[],
  headword: string,
  limit: number,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const head = headword.toLowerCase();

  for (const item of items) {
    const word = item.word?.trim();
    if (!word) {
      continue;
    }
    const key = word.toLowerCase();
    if (key === head || seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(word);
    if (out.length >= limit) {
      break;
    }
  }

  return out;
}

/** Fetch English synonyms and antonyms via Datamuse (supplement when Wiktionary is sparse). */
export async function fetchDatamuseRelated(
  word: string,
  signal: AbortSignal,
): Promise<{ synonyms: string[]; antonyms: string[] }> {
  const params = (rel: string) =>
    new URLSearchParams({ [rel]: word, max: String(MAX_RELATED) });

  const [synRes, antRes] = await Promise.all([
    fetchJson<DatamuseWord[]>(
      `https://api.datamuse.com/words?${params("rel_syn")}`,
      { signal },
    ),
    fetchJson<DatamuseWord[]>(
      `https://api.datamuse.com/words?${params("rel_ant")}`,
      { signal },
    ),
  ]);

  return {
    synonyms: synRes.ok ? collectWords(synRes.data, word, MAX_RELATED) : [],
    antonyms: antRes.ok ? collectWords(antRes.data, word, MAX_RELATED) : [],
  };
}
