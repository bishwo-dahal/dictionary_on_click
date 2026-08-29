import type { Definition } from "./types.js";

/** Tokens Datamuse and similar APIs use as part-of-speech prefixes. */
const POS_TOKENS = new Set([
  "n",
  "v",
  "a",
  "adj",
  "adv",
  "noun",
  "verb",
  "adjective",
  "adverb",
  "prep",
  "preposition",
  "conj",
  "conjunction",
  "pron",
  "pronoun",
  "intj",
  "interjection",
  "det",
  "determiner",
]);

function isPosToken(token: string): boolean {
  return POS_TOKENS.has(token.toLowerCase());
}

/**
 * Split a leading POS token from gloss text when providers embed it inline
 * (e.g. Datamuse `adj\\tNot the same…` or legacy cache rows).
 */
export function splitEmbeddedPartOfSpeech(def: Definition): Definition {
  if (def.partOfSpeech?.trim()) {
    return def;
  }

  const trimmed = def.text.trim();

  const tabMatch = trimmed.match(/^(\w+)\t+(.+)$/s);
  if (tabMatch && isPosToken(tabMatch[1]!)) {
    return {
      ...def,
      partOfSpeech: tabMatch[1]!.toLowerCase(),
      text: tabMatch[2]!.trim(),
    };
  }

  const colonMatch = trimmed.match(/^(\w+):\s*(.+)$/s);
  if (colonMatch && isPosToken(colonMatch[1]!)) {
    return {
      ...def,
      partOfSpeech: colonMatch[1]!.toLowerCase(),
      text: colonMatch[2]!.trim(),
    };
  }

  return def;
}

export function normalizeDefinitions(definitions: readonly Definition[]): Definition[] {
  return definitions.map(splitEmbeddedPartOfSpeech);
}
