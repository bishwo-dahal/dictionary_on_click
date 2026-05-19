import type { Definition, LookupResult } from "./types.js";

export function formatDefinition(def: Definition): string {
  const pos = def.partOfSpeech ? `(${def.partOfSpeech}) ` : "";
  return `${pos}${def.text}`;
}

export function snippetFromResult(result: LookupResult, max = 3): string {
  return result.definitions
    .slice(0, max)
    .map((d) => d.text)
    .join(" · ");
}
