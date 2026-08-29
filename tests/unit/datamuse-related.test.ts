import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchDatamuseRelated } from "../../src/background/datamuse-related.js";

describe("datamuse-related", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches synonyms and antonyms in parallel", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        const body =
          typeof url === "string" && url.includes("rel_syn")
            ? [{ word: "joyful" }, { word: "happy" }]
            : [{ word: "sad" }, { word: "unhappy" }];
        return Promise.resolve({
          ok: true,
          headers: new Headers(),
          json: async () => body,
        });
      }),
    );

    const related = await fetchDatamuseRelated("happy", new AbortController().signal);
    expect(related.synonyms).toEqual(["joyful"]);
    expect(related.antonyms).toEqual(["sad", "unhappy"]);
  });
});
