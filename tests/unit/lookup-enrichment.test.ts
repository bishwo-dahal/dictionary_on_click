import { describe, expect, it } from "vitest";
import {
  needsAsyncEnrichment,
  prepareLookupResultForResponse,
} from "../../src/background/lookup-enrichment.js";
import { DEFAULT_SETTINGS } from "../../src/shared/types.js";
import type { LookupResult } from "../../src/shared/types.js";

const baseResult: LookupResult = {
  word: "hello",
  lemma: "hello",
  language: "en-us",
  definitions: [{ text: "greeting" }],
  translations: [],
  synonyms: ["hi"],
  antonyms: [],
  sourceUrl: "https://example.com",
  provider: "free-dictionary",
};

describe("lookup-enrichment", () => {
  it("needs async enrichment when translations are enabled but missing", () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      translationsEnabled: true,
      targetLanguage: "fr",
    };
    expect(needsAsyncEnrichment(baseResult, settings, "en-us")).toBe(true);
  });

  it("skips async enrichment when FDA already supplied synonyms", () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      synonymsAntonymsEnabled: true,
    };
    expect(needsAsyncEnrichment(baseResult, settings, "en-us")).toBe(false);
  });

  it("prepareLookupResultForResponse keeps FDA synonyms when syn/ant enabled", () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      synonymsAntonymsEnabled: true,
    };
    const prepared = prepareLookupResultForResponse(baseResult, settings, "en-us");
    expect(prepared.synonyms).toEqual(["hi"]);
    expect(prepared.translations).toEqual([]);
  });
});
