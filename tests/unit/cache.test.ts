import { beforeEach, describe, expect, it } from "vitest";
import {
  cacheKey,
  enrichmentMatchesSettings,
  readEnrichment,
  saveEnrichment,
  saveToCache,
} from "../../src/background/providers/cache.js";
import { DEFAULT_SETTINGS } from "../../src/shared/types.js";

describe("cache enrichment", () => {
  beforeEach(async () => {
    const key = cacheKey("en-us", "hello");
    await saveToCache({
      word: "hello",
      lemma: "hello",
      language: "en-us",
      definitions: [{ text: "greeting" }],
      translations: [],
      synonyms: [],
      antonyms: [],
      sourceUrl: "https://example.com",
      provider: "wiktionary-rest",
    });
    void key;
  });

  it("round-trips enrichment data", async () => {
    await saveEnrichment("en-us", "hello", {
      targetLanguage: "fr",
      translationsEnabled: true,
      synonymsAntonymsEnabled: true,
      translations: [{ language: "French", text: "bonjour" }],
      synonyms: ["hi"],
      antonyms: ["bye"],
      enrichedAt: Date.now(),
    });

    const settings = {
      ...DEFAULT_SETTINGS,
      translationsEnabled: true,
      synonymsAntonymsEnabled: true,
      targetLanguage: "fr" as const,
    };

    const enrichment = await readEnrichment("en-us", "hello", settings);
    expect(enrichment?.translations).toEqual([{ language: "French", text: "bonjour" }]);
    expect(enrichment?.synonyms).toEqual(["hi"]);
    expect(enrichment?.antonyms).toEqual(["bye"]);
  });

  it("returns null when settings do not match cached enrichment", async () => {
    await saveEnrichment("en-us", "hello", {
      targetLanguage: "fr",
      translationsEnabled: true,
      synonymsAntonymsEnabled: false,
      translations: [{ language: "French", text: "bonjour" }],
      synonyms: [],
      antonyms: [],
      enrichedAt: Date.now(),
    });

    const settings = {
      ...DEFAULT_SETTINGS,
      translationsEnabled: true,
      synonymsAntonymsEnabled: true,
      targetLanguage: "fr" as const,
    };

    expect(await readEnrichment("en-us", "hello", settings)).toBeNull();
  });

  it("matches enrichment when only synonyms are enabled", async () => {
    await saveEnrichment("en-us", "hello", {
      targetLanguage: "en-us",
      translationsEnabled: false,
      synonymsAntonymsEnabled: true,
      translations: [],
      synonyms: ["hi"],
      antonyms: [],
      enrichedAt: Date.now(),
    });

    const settings = {
      ...DEFAULT_SETTINGS,
      translationsEnabled: false,
      synonymsAntonymsEnabled: true,
    };

    const enrichment = await readEnrichment("en-us", "hello", settings);
    expect(enrichment?.synonyms).toEqual(["hi"]);
  });
});

describe("enrichmentMatchesSettings", () => {
  it("requires matching target language for translations", () => {
    const enrichment = {
      targetLanguage: "fr" as const,
      translationsEnabled: true,
      synonymsAntonymsEnabled: false,
      translations: [],
      synonyms: [],
      antonyms: [],
      enrichedAt: 0,
    };
    const settings = {
      ...DEFAULT_SETTINGS,
      translationsEnabled: true,
      targetLanguage: "de" as const,
    };

    expect(enrichmentMatchesSettings(enrichment, settings, "en-us")).toBe(false);
  });
});
