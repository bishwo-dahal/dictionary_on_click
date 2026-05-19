import { describe, expect, it } from "vitest";
import { getLanguage, LANGUAGES, wiktionaryHost } from "../../src/shared/languages.js";

describe("languages", () => {
  it("lists all supported dictionary languages", () => {
    expect(LANGUAGES.length).toBe(18);
  });

  it("maps English US to en wiki", () => {
    expect(getLanguage("en-us").wikiCode).toBe("en");
    expect(wiktionaryHost("en")).toBe("https://en.wiktionary.org");
  });
});
