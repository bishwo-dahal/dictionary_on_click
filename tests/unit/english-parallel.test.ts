import { describe, expect, it, vi } from "vitest";
import { englishParallelProvider } from "../../src/background/providers/english-parallel.js";
import { freeDictionaryProvider } from "../../src/background/providers/free-dictionary.js";
import { wiktionaryRestProvider } from "../../src/background/providers/wiktionary.js";
import type { LookupResult } from "../../src/shared/types.js";

function delayedHit(
  provider: typeof freeDictionaryProvider,
  delayMs: number,
  word: string,
): void {
  vi.spyOn(provider, "lookup").mockImplementation(
    () =>
      new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            kind: "hit",
            result: {
              word,
              lemma: word,
              language: "en-us",
              definitions: [{ text: `from ${provider.id}` }],
              translations: [],
              synonyms: [],
              antonyms: [],
              sourceUrl: "https://example.com",
              provider: provider.id,
            } satisfies LookupResult,
          });
        }, delayMs);
      }),
  );
}

describe("englishParallelProvider", () => {
  it("returns the first provider that hits", async () => {
    delayedHit(freeDictionaryProvider, 30, "fast");
    vi.spyOn(wiktionaryRestProvider, "lookup").mockResolvedValue({ kind: "miss" });

    const outcome = await englishParallelProvider.lookup(
      "fast",
      "en-us",
      new AbortController().signal,
    );

    expect(outcome.kind).toBe("hit");
    if (outcome.kind === "hit") {
      expect(outcome.result.provider).toBe("free-dictionary");
    }
  });

  it("does not wait for a slow provider when a faster one hits", async () => {
    delayedHit(freeDictionaryProvider, 2_500, "slow-fda");
    delayedHit(wiktionaryRestProvider, 40, "slow-fda");

    const started = performance.now();
    const outcome = await englishParallelProvider.lookup(
      "slow-fda",
      "en-us",
      new AbortController().signal,
    );
    const elapsed = performance.now() - started;

    expect(outcome.kind).toBe("hit");
    if (outcome.kind === "hit") {
      expect(outcome.result.provider).toBe("wiktionary-rest");
    }
    expect(elapsed).toBeLessThan(1_500);
  });

  it("misses for non-English dictionaries", async () => {
    const outcome = await englishParallelProvider.lookup(
      "bonjour",
      "fr",
      new AbortController().signal,
    );
    expect(outcome).toEqual({ kind: "miss" });
  });
});
