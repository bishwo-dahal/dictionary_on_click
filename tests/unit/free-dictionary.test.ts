import { afterEach, describe, expect, it, vi } from "vitest";
import { freeDictionaryProvider } from "../../src/background/providers/free-dictionary.js";

describe("freeDictionaryProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses API response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers(),
        json: async () => [
          {
            word: "test",
            meanings: [
              {
                partOfSpeech: "noun",
                definitions: [{ definition: "A procedure to check quality." }],
              },
            ],
          },
        ],
      }),
    );

    const outcome = await freeDictionaryProvider.lookup(
      "test",
      "en-us",
      new AbortController().signal,
    );

    expect(outcome.kind).toBe("hit");
    if (outcome.kind === "hit") {
      expect(outcome.result.definitions[0]?.text).toContain("procedure");
    }
  });
});
