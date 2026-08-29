import { describe, expect, it } from "vitest";
import {
  defaultTranslationTarget,
  getLanguage,
  LANGUAGES,
  shouldFetchTranslations,
  toWiktionaryTranslationCode,
  translationCodesForTarget,
  wiktionaryHost,
} from "../../src/shared/languages.js";

describe("languages", () => {
  it("lists all supported dictionary languages", () => {
    expect(LANGUAGES.length).toBe(18);
  });

  it("maps English US to en wiki", () => {
    expect(getLanguage("en-us").wikiCode).toBe("en");
    expect(wiktionaryHost("en")).toBe("https://en.wiktionary.org");
  });

  it("maps dictionary ids to Wiktionary translation codes", () => {
    expect(toWiktionaryTranslationCode("en-us")).toBe("en");
    expect(toWiktionaryTranslationCode("pt-br")).toBe("pt");
    expect(toWiktionaryTranslationCode("zh-hans")).toBe("zh");
    expect(toWiktionaryTranslationCode("zh-hant")).toBe("zh-Hant");
    expect(toWiktionaryTranslationCode("fr")).toBe("fr");
  });

  it("skips translation fetch when dictionary and target are equivalent", () => {
    expect(shouldFetchTranslations("en-us", "en-us")).toBe(false);
    expect(shouldFetchTranslations("en-us", "en-uk")).toBe(false);
    expect(shouldFetchTranslations("zh-hans", "zh-hant")).toBe(false);
    expect(shouldFetchTranslations("en-us", "fr")).toBe(true);
  });

  it("picks a different default target language", () => {
    expect(defaultTranslationTarget("en-us")).toBe("fr");
    expect(defaultTranslationTarget("fr")).toBe("en-us");
  });

  it("matches Mandarin template codes for Chinese targets", () => {
    expect(translationCodesForTarget("zh-hans")).toEqual(["zh", "cmn"]);
  });
});
