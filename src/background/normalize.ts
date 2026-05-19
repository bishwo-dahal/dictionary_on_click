export interface NormalizeOptions {
  /** When true, keep only the first word-like token (double-click). */
  singleToken?: boolean;
}

const EDGE_PUNCT = /^[\p{P}\p{S}\d]+|[\p{P}\p{S}\d]+$/gu;
const WORD_TOKEN = /[\p{L}\p{M}][\p{L}\p{M}\p{N}'-]*/u;

/**
 * Normalize user input before lookup.
 * - trim, lowercase
 * - strip leading/trailing punctuation
 * - collapse whitespace
 */
export function normalizeInput(
  raw: string,
  options: NormalizeOptions = {},
): string {
  let text = raw.trim().toLowerCase();
  if (!text) {
    return "";
  }

  text = text.replace(/\s+/g, " ");

  if (options.singleToken) {
    const match = text.match(WORD_TOKEN);
    if (!match) {
      return "";
    }
    text = match[0].replace(EDGE_PUNCT, "");
    return text;
  }

  // Multi-word phrase: trim punctuation on each edge of the string only.
  text = text.replace(/^[\p{P}\p{S}\s]+|[\p{P}\p{S}\s]+$/gu, "");
  return text;
}

/**
 * Build ordered lookup variants: original first, then conservative stems.
 */
export function generateVariants(normalized: string): string[] {
  if (!normalized) {
    return [];
  }

  const seen = new Set<string>();
  const ordered: string[] = [];

  const add = (value: string): void => {
    const v = value.trim();
    if (v.length < 2 || seen.has(v)) {
      return;
    }
    seen.add(v);
    ordered.push(v);
  };

  add(normalized);

  for (const stem of englishAffixVariants(normalized)) {
    add(stem);
  }

  return ordered;
}

/**
 * Conservative English affix stripping for lemma fallback.
 * Does not handle irregular verbs (e.g. went → go).
 */
export function englishAffixVariants(word: string): string[] {
  const out: string[] = [];
  const w = word;

  if (w.length < 4) {
    return out;
  }

  if (w.endsWith("ies") && w.length > 4) {
    out.push(`${w.slice(0, -3)}y`);
  }

  if (w.endsWith("ing") && w.length > 5) {
    const base = w.slice(0, -3);
    out.push(base);
    // running → run (doubled consonant)
    if (/([^aeiou])\1$/.test(base)) {
      out.push(base.slice(0, -1));
    }
    // making → make
    out.push(`${base}e`);
  }

  if (w.endsWith("ed") && w.length > 4) {
    const base = w.slice(0, -2);
    out.push(base);
    out.push(`${base}e`);
  }

  if (w.endsWith("es") && w.length > 4) {
    out.push(w.slice(0, -2));
    out.push(w.slice(0, -1)); // watches → watch
  }

  if (w.endsWith("s") && !w.endsWith("ss") && w.length > 3) {
    out.push(w.slice(0, -1));
  }

  return out;
}
