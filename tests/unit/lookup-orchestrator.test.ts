import { describe, expect, it, vi } from "vitest";
import { LookupOrchestrator } from "../../src/background/lookup-orchestrator.js";
import type { LookupProvider } from "../../src/background/providers/types.js";
import type { LookupResult } from "../../src/shared/types.js";

function hitProvider(
  id: LookupProvider["id"],
  words: string[],
  result: Partial<LookupResult> = {},
): LookupProvider {
  return {
    id,
    async lookup(word) {
      if (words.includes(word)) {
        return {
          kind: "hit",
          result: {
            word,
            lemma: word,
            language: "en-us",
            definitions: [{ text: "definition" }],
            translations: [],
            synonyms: [],
            antonyms: [],
            sourceUrl: "https://example.com",
            provider: id,
            ...result,
          },
        };
      }
      return { kind: "miss" };
    },
  };
}

function errorProvider(
  id: LookupProvider["id"],
  code: "API_ERROR" | "RATE_LIMIT",
): LookupProvider {
  return {
    id,
    async lookup() {
      return { kind: "error", code, retryable: true };
    },
  };
}

describe("LookupOrchestrator", () => {
  it("returns NOT_FOUND when all providers miss", async () => {
    const orch = new LookupOrchestrator([
      hitProvider("cache", []),
      hitProvider("wiktionary-rest", []),
    ]);

    const res = await orch.lookup({
      word: "xyzzy",
      language: "en-us",
      requestId: "1",
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe("NOT_FOUND");
    }
  });

  it("returns first provider hit", async () => {
    const orch = new LookupOrchestrator([
      hitProvider("cache", []),
      hitProvider("wiktionary-rest", ["hello"]),
    ]);

    const res = await orch.lookup({
      word: "Hello",
      language: "en-us",
      requestId: "1",
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.result.provider).toBe("wiktionary-rest");
    }
  });

  it("tries lemma variants", async () => {
    const orch = new LookupOrchestrator([
      hitProvider("wiktionary-rest", ["run"]),
    ]);

    const res = await orch.lookup({
      word: "running",
      language: "en-us",
      requestId: "1",
    });

    expect(res.ok).toBe(true);
  });

  it("cancels stale lookups", async () => {
    const slow: LookupProvider = {
      id: "wiktionary-rest",
      async lookup(word, _lang, signal) {
        await new Promise((r) => setTimeout(r, 50));
        if (signal.aborted) {
          return { kind: "error", code: "TIMEOUT", retryable: true };
        }
        return hitProvider("wiktionary-rest", ["slow"]).lookup(word, "en-us", signal);
      },
    };

    const orch = new LookupOrchestrator([slow]);

    const first = orch.lookup({
      word: "slow",
      language: "en-us",
      requestId: "a",
    });

    const second = await orch.lookup({
      word: "other",
      language: "en-us",
      requestId: "b",
    });

    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.code).toBe("NOT_FOUND");
    }

    await first;
  });

  it("surfaces API_ERROR before NOT_FOUND when providers fail", async () => {
    const orch = new LookupOrchestrator([errorProvider("wiktionary-rest", "API_ERROR")]);

    const res = await orch.lookup({
      word: "fail",
      language: "en-us",
      requestId: "1",
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe("API_ERROR");
      expect(res.retryable).toBe(true);
    }
  });

  it("skips cache when skipCache is set", async () => {
    const cacheHits = vi.fn().mockResolvedValue({
      kind: "hit",
      result: {
        word: "hello",
        lemma: "hello",
        language: "en-us",
        definitions: [{ text: "cached" }],
        translations: [],
        synonyms: [],
        antonyms: [],
        sourceUrl: "https://example.com",
        provider: "cache",
      },
    });

    const cache: LookupProvider = {
      id: "cache",
      lookup: cacheHits,
    };

    const orch = new LookupOrchestrator([
      cache,
      hitProvider("wiktionary-rest", ["hello"], {
        definitions: [{ text: "fresh" }],
      }),
    ]);

    const res = await orch.lookup({
      word: "hello",
      language: "en-us",
      requestId: "1",
      skipCache: true,
    });

    expect(cacheHits).not.toHaveBeenCalled();
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.result.definitions[0]?.text).toBe("fresh");
    }
  });

  it("skips prefetch when a full lookup is active", async () => {
    let resolveLookup!: () => void;
    const gate = new Promise<void>((r) => {
      resolveLookup = r;
    });

    const blocking: LookupProvider = {
      id: "wiktionary-rest",
      async lookup() {
        await gate;
        return { kind: "miss" };
      },
    };

    const orch = new LookupOrchestrator([blocking]);

    const full = orch.lookup({
      word: "block",
      language: "en-us",
      requestId: "full",
    });

    const prefetch = await orch.lookup({
      word: "prefetch",
      language: "en-us",
      requestId: "pre",
      prefetch: true,
    });

    resolveLookup();
    await full;

    expect(prefetch.ok).toBe(false);
    if (!prefetch.ok) {
      expect(prefetch.code).toBe("CANCELLED");
    }
  });
});
