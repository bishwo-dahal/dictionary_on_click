import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../src/background/providers/fetch-http.js", () => ({
  fetchJson: vi.fn(),
}));

import { fetchJson } from "../../src/background/providers/fetch-http.js";
import { datamuseProvider } from "../../src/background/providers/datamuse.js";

const mockedFetch = vi.mocked(fetchJson);

describe("datamuseProvider", () => {
  beforeEach(() => {
    mockedFetch.mockReset();
  });

  it("parses tab-separated POS and text into structured definitions", async () => {
    mockedFetch.mockResolvedValue({
      ok: true,
      data: [
        {
          word: "different",
          defs: [
            "adj\tNot the same; exhibiting a difference.",
            "adj\tVarious, assorted, diverse.",
          ],
        },
      ],
    });

    const outcome = await datamuseProvider.lookup("different", "en-us", new AbortController().signal);

    expect(outcome.kind).toBe("hit");
    if (outcome.kind !== "hit") {
      return;
    }

    expect(outcome.result.definitions).toEqual([
      {
        partOfSpeech: "adj",
        text: "Not the same; exhibiting a difference.",
      },
      {
        partOfSpeech: "adj",
        text: "Various, assorted, diverse.",
      },
    ]);
    expect(outcome.result.partial).toBe(true);
  });
});
