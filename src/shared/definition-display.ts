/**
 * Definition display helpers: grouping and bubble preview selection.
 *
 * POS = part of speech (noun, verb, adjective, adverb, etc.). Providers attach a
 * `partOfSpeech` string to each Definition; we normalize those into canonical POS
 * buckets for grouping and for picking a diverse collapsed bubble preview.
 */
import type { Definition } from "./types.js";

/** Canonical part-of-speech (POS) keys, in display/selection priority order. */
export const POS_PRIORITY = ["verb", "noun", "adjective", "adverb", "other"] as const;

/** A normalized part-of-speech bucket key (POS). */
export type CanonicalPos = (typeof POS_PRIORITY)[number];

export interface PosGroup {
  /** Normalized part of speech (POS). */
  pos: CanonicalPos;
  label: string;
  items: Definition[];
}

export interface PickBubbleSummaryOptions {
  maxTotal: number;
  /** Max meanings taken from each POS bucket when multiple parts of speech exist. */
  maxPerPos?: number;
}

export interface PickBubbleSummaryResult {
  shown: Definition[];
  hiddenCount: number;
}

/** Maps provider part-of-speech strings to canonical POS keys. */
const POS_ALIASES: Record<string, CanonicalPos> = {
  noun: "noun",
  n: "noun",
  verb: "verb",
  v: "verb",
  adjective: "adjective",
  adj: "adjective",
  a: "adjective",
  adverb: "adverb",
  adv: "adverb",
};

/** Map a provider `partOfSpeech` value to a canonical POS key. */
export function normalizePos(partOfSpeech?: string): CanonicalPos {
  if (!partOfSpeech?.trim()) {
    return "other";
  }
  const key = partOfSpeech
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "");
  return POS_ALIASES[key] ?? "other";
}

/** Human-readable part-of-speech label for section headers. */
export function posLabel(pos: CanonicalPos): string {
  switch (pos) {
    case "noun":
      return "Noun";
    case "verb":
      return "Verb";
    case "adjective":
      return "Adjective";
    case "adverb":
      return "Adverb";
    case "other":
      return "Other";
  }
}

/** Group flat definitions by canonical POS; preserve API order within each group. */
export function groupDefinitionsByPos(definitions: readonly Definition[]): PosGroup[] {
  const buckets = new Map<CanonicalPos, Definition[]>();

  for (const def of definitions) {
    const pos = normalizePos(def.partOfSpeech);
    const list = buckets.get(pos);
    if (list) {
      list.push(def);
    } else {
      buckets.set(pos, [def]);
    }
  }

  const groups: PosGroup[] = [];
  for (const pos of POS_PRIORITY) {
    const items = buckets.get(pos);
    if (!items?.length) {
      continue;
    }
    groups.push({ pos, label: posLabel(pos), items });
  }
  return groups;
}

/**
 * Pick meanings for the collapsed double-click bubble.
 * When multiple POS buckets exist: up to one meaning per part of speech (priority order), capped by maxTotal.
 * When only one POS exists: up to maxTotal meanings from that part of speech (API order).
 */
export function pickBubbleSummary(
  definitions: readonly Definition[],
  options: PickBubbleSummaryOptions,
): PickBubbleSummaryResult {
  const maxTotal = Math.max(0, Math.floor(options.maxTotal));
  const maxPerPos = Math.max(1, Math.floor(options.maxPerPos ?? 1));

  if (definitions.length === 0 || maxTotal === 0) {
    return { shown: [], hiddenCount: definitions.length };
  }

  const groups = groupDefinitionsByPos(definitions);
  const shown: Definition[] = [];

  if (groups.length === 1) {
    shown.push(...groups[0].items.slice(0, maxTotal));
  } else {
    for (const pos of POS_PRIORITY) {
      if (shown.length >= maxTotal) {
        break;
      }
      const group = groups.find((g) => g.pos === pos);
      if (!group) {
        continue;
      }
      const take = Math.min(maxPerPos, group.items.length, maxTotal - shown.length);
      shown.push(...group.items.slice(0, take));
    }
  }

  return {
    shown,
    hiddenCount: definitions.length - shown.length,
  };
}
