import { cacheProvider } from "./cache.js";
import { datamuseProvider } from "./datamuse.js";
import { freeDictionaryProvider } from "./free-dictionary.js";
import type { LookupProvider } from "./types.js";
import { wiktionaryActionProvider, wiktionaryRestProvider } from "./wiktionary.js";

/** Default provider chain: cache → Free Dictionary → Wiktionary → Datamuse. */
export function createDefaultProviders(): LookupProvider[] {
  return [
    cacheProvider,
    freeDictionaryProvider,
    wiktionaryRestProvider,
    wiktionaryActionProvider,
    datamuseProvider,
  ];
}

export { saveToCache } from "./cache.js";
export { datamuseSpellSuggest } from "./datamuse.js";
