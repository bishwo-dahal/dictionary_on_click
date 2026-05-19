import { cacheProvider } from "./cache.js";
import { datamuseProvider } from "./datamuse.js";
import { freeDictionaryProvider } from "./free-dictionary.js";
import type { LookupProvider } from "./types.js";
import { wiktionaryActionProvider, wiktionaryRestProvider } from "./wiktionary.js";

/** Default provider chain: cache → Wiktionary → Free Dictionary → Datamuse. */
export function createDefaultProviders(): LookupProvider[] {
  return [
    cacheProvider,
    wiktionaryRestProvider,
    wiktionaryActionProvider,
    freeDictionaryProvider,
    datamuseProvider,
  ];
}

export { saveToCache } from "./cache.js";
export { datamuseSpellSuggest } from "./datamuse.js";
