import { afterEach, describe, expect, it, vi } from "vitest";
import helloFixture from "../fixtures/wiktionary-rest-hello.json";
import { wiktionaryRestProvider } from "../../src/background/providers/wiktionary.js";

describe("wiktionaryRestProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses REST definitions for English", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers(),
        json: async () => helloFixture,
      }),
    );

    const outcome = await wiktionaryRestProvider.lookup(
      "hello",
      "en-us",
      new AbortController().signal,
    );

    expect(outcome.kind).toBe("hit");
    if (outcome.kind === "hit") {
      expect(outcome.result.definitions[0]?.text).toBe("A greeting.");
      expect(outcome.result.provider).toBe("wiktionary-rest");
    }
  });

  it("returns miss for non-English languages", async () => {
    const outcome = await wiktionaryRestProvider.lookup(
      "bonjour",
      "fr",
      new AbortController().signal,
    );
    expect(outcome.kind).toBe("miss");
  });
});
