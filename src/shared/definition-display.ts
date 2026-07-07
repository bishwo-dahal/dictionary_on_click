import type { Definition } from "./types.js";

/** Canonical POS keys, in display/selection priority order. */
export const POS_PRIORITY = ["verb", "noun", "adjective", "adverb", "other"] as const;

export type CanonicalPos = (typeof POS_PRIORITY)[number];

export interface PosGroup {
  pos: CanonicalPos;
  label: string;
  items: Definition[];
}

export interface PickBubbleSummaryOptions {
  maxTotal: number;
  /** Max senses taken from each POS when multiple POS buckets exist. */
  maxPerPos?: number;
}

export interface PickBubbleSummaryResult {
  shown: Definition[];
  hiddenCount: number;
}

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

/** Map provider POS strings to canonical keys for grouping and selection. */
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

/** Human-readable POS label for section headers. */
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
 * Pick senses for the collapsed double-click bubble.
 * Multiple POS: up to one sense per POS (priority order), capped by maxTotal.
 * Single POS: up to maxTotal senses from that POS (API order).
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
