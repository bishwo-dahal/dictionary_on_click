import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanGlossText,
  extractTranslationsSection,
  fetchWiktionaryTranslations,
  parseAntonyms,
  parseSynonyms,
  parseTranslationGlosses,
} from "../../src/background/wiktionary-translations.js";

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const bonjourFixture = readFileSync(
  join(fixtureDir, "../fixtures/wiktionary-translations-bonjour.txt"),
  "utf8",
);

describe("wiktionary-translations", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("extracts the Translations section from wikitext", () => {
    const section = extractTranslationsSection(bonjourFixture);
    expect(section).toContain("{{trans-top|greeting}}");
    expect(section).not.toContain("==References==");
  });

  it("parses English glosses from {{t|}} templates", () => {
    const glosses = parseTranslationGlosses(bonjourFixture, "en-us", "English (US)");
    expect(glosses).toEqual([
      { language: "English (US)", text: "hello" },
      { language: "English (US)", text: "hi" },
    ]);
  });

  it("deduplicates glosses and respects the max limit", () => {
    const wikitext = `
==Translations==
* {{t+|en|hello}}
* {{t+|en|hello}}
* {{t+|en|hi}}
* {{t+|en|hey}}
* {{t+|en|howdy}}
* {{t+|en|greetings}}
* {{t+|en|good day}}
* {{t+|en|good morning}}
* {{t+|en|good afternoon}}
* {{t+|en|good evening}}
`;
    const glosses = parseTranslationGlosses(wikitext, "en-us", "English (US)");
    expect(glosses).toHaveLength(8);
    expect(glosses.map((g) => g.text)).not.toContain("good evening");
  });

  it("cleans nested wikitext from gloss text", () => {
    expect(cleanGlossText("[[hello|Hello]]")).toBe("Hello");
    expect(cleanGlossText("''hello''")).toBe("hello");
  });

  it("parses {{tt|}} glosses from multitrans tables", () => {
    const wikitext = `
====Translations====
{{trans-top|greeting}}{{multitrans|data=
* French: {{tt+|fr|bonjour}}, {{tt+|fr|salut}}
* German: {{tt+|de|hallo}}
}}
`;
    const glosses = parseTranslationGlosses(wikitext, "fr", "French");
    expect(glosses).toEqual([
      { language: "French", text: "bonjour" },
      { language: "French", text: "salut" },
    ]);
  });

  it("parses French Wiktionary {{trad|}} templates", () => {
    const wikitext = `
==== {{S|traductions}} ====
{{trad-début|Formule pour saluer|1}}
* {{T|en}} : {{trad+|en|hello}}, {{trad+|en|hi}}
* {{T|de}} : {{trad+|de|guten Tag}}
`;
    const section = extractTranslationsSection(wikitext);
    expect(section).toContain("{{trad+|en|hello}}");

    const glosses = parseTranslationGlosses(wikitext, "en-us", "English (US)");
    expect(glosses).toEqual([
      { language: "English (US)", text: "hello" },
      { language: "English (US)", text: "hi" },
    ]);
  });

  it("parses French glosses for core from a trans-top table", () => {
    const wikitext = `
=====Translations=====
{{trans-top|central part of fruit, containing the kernels or seeds}}
* French: {{t+|fr|trognon|m}}, {{t+|fr|noyau|m}}, {{t+|fr|cœur|m}}
* German: {{t+|de|Kerngehäuse|m}}
{{trans-bottom}}
`;
    const glosses = parseTranslationGlosses(wikitext, "fr", "French");
    expect(glosses.map((g) => g.text)).toEqual([
      "trognon",
      "noyau",
      "cœur",
    ]);
  });

  it("falls back to the full page when the first translation section is trans-see only", () => {
    const wikitext = `
=====Translations=====
{{trans-see|forming the most important or essential part|nuclear}}

=====Translations=====
{{trans-top|To remove the core of an apple or other fruit.}}
* French: {{t+|fr|évider}}
`;
    const glosses = parseTranslationGlosses(wikitext, "fr", "French");
    expect(glosses).toEqual([{ language: "French", text: "évider" }]);
  });

  it("parses {{l|}} templates in synonym sections (search-style)", () => {
    const wikitext = `
====Synonyms====
* {{sense|transitive: look throughout (a place) for something}} {{l|en|comb}}, {{l|en|scour}}
* {{sense|intransitive: look thoroughly}} {{l|en|look for}}, {{l|en|seek}}, {{l|en|comb}}, {{l|en|scour}}
`;
    const synonyms = parseSynonyms(wikitext, "en-us");
    expect(synonyms).toEqual(["comb", "scour", "look for", "seek"]);
    expect(synonyms.some((s) => s.includes("{"))).toBe(false);
  });

  it("rejects stray wiki bracket artifacts in synonym lists", () => {
    const wikitext = `
====Synonyms====
* foo]], bar
* ]]
`;
    const synonyms = parseSynonyms(wikitext, "en-us");
    expect(synonyms).toEqual(["foo"]);
    expect(synonyms.some((s) => /[\[\]]/.test(s))).toBe(false);
  });

  it("parses {{l|}} templates and skips Thesaurus links (know-style)", () => {
    const wikitext = `
====Synonyms====
* {{sense|have sexual relations with}} {{l|en|coitize}}, {{l|en|go to bed with}}, {{l|en|sleep with}}; see also [[Thesaurus:copulate with]]
`;
    const synonyms = parseSynonyms(wikitext, "en-us");
    expect(synonyms).toEqual(["coitize", "go to bed with", "sleep with"]);
    expect(synonyms.some((s) => /[\[\]]/.test(s))).toBe(false);
  });

  it("parses English synonyms and antonyms from templates", () => {
    const wikitext = `
====Adjective====
{{syn|en|ample|huge|large|Thesaurus:large}}
{{ant|en|little|small|tiny}}
`;
    expect(parseSynonyms(wikitext, "en-us")).toEqual(["ample", "huge", "large"]);
    expect(parseAntonyms(wikitext, "en-us")).toEqual(["little", "small", "tiny"]);
  });

  it("fetches glosses via the MediaWiki API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers(),
        json: async () => ({
          query: {
            pages: {
              "1": {
                revisions: [
                  {
                    slots: {
                      main: {
                        contentmodel: "wikitext",
                        contentformat: "text/x-wiki",
                        "*": bonjourFixture,
                      },
                    },
                  },
                ],
              },
            },
          },
        }),
      }),
    );

    const glosses = await fetchWiktionaryTranslations(
      "bonjour",
      "fr",
      "en-us",
      new AbortController().signal,
    );

    expect(glosses).toEqual([
      { language: "English (US)", text: "hello" },
      { language: "English (US)", text: "hi" },
    ]);
  });
});
