import { cacheProvider } from "./cache.js";
import { datamuseProvider } from "./datamuse.js";
import { englishParallelProvider } from "./english-parallel.js";
import type { LookupProvider } from "./types.js";
import { wiktionaryActionProvider } from "./wiktionary.js";

/** Default provider chain: cache → English race → Wiktionary action → Datamuse. */
export function createDefaultProviders(): LookupProvider[] {
  return [
    cacheProvider,
    englishParallelProvider,
    wiktionaryActionProvider,
    datamuseProvider,
  ];
}

export {
  cacheKey,
  enrichmentMatchesSettings,
  readEnrichment,
  saveEnrichment,
  saveToCache,
} from "./cache.js";
export { datamuseSpellSuggest } from "./datamuse.js";
