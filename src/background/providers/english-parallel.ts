import type { DictionaryLanguageId } from "../../shared/languages.js";
import { recordProviderOutcome } from "../health.js";
import { withTimeout } from "../retry.js";
import { freeDictionaryProvider } from "./free-dictionary.js";
import type { LookupProvider, ProviderOutcome } from "./types.js";
import { wiktionaryRestProvider } from "./wiktionary.js";

const FDA_RACE_TIMEOUT_MS = 2_000;
const WIKI_REST_RACE_TIMEOUT_MS = 5_000;

function isEnglish(language: DictionaryLanguageId): boolean {
  return language === "en-us" || language === "en-uk";
}

interface Racer {
  provider: LookupProvider;
  timeoutMs: number;
}

const RACERS: Racer[] = [
  { provider: freeDictionaryProvider, timeoutMs: FDA_RACE_TIMEOUT_MS },
  { provider: wiktionaryRestProvider, timeoutMs: WIKI_REST_RACE_TIMEOUT_MS },
];

async function raceEnglishProviders(
  word: string,
  language: DictionaryLanguageId,
  signal: AbortSignal,
): Promise<ProviderOutcome> {
  if (!isEnglish(language)) {
    return { kind: "miss" };
  }

  return new Promise((resolve) => {
    let pending = RACERS.length;
    let settled = false;
    const controllers = RACERS.map(() => new AbortController());

    const onParentAbort = (): void => {
      for (const controller of controllers) {
        controller.abort();
      }
    };
    signal.addEventListener("abort", onParentAbort, { once: true });

    const settle = (outcome: ProviderOutcome): void => {
      if (settled) {
        return;
      }
      if (outcome.kind === "hit" || outcome.kind === "stale") {
        settled = true;
        onParentAbort();
        signal.removeEventListener("abort", onParentAbort);
        resolve(outcome);
        return;
      }
      pending--;
      if (pending === 0) {
        settled = true;
        signal.removeEventListener("abort", onParentAbort);
        resolve({ kind: "miss" });
      }
    };

    for (let i = 0; i < RACERS.length; i++) {
      const racer = RACERS[i]!;
      const controller = controllers[i]!;
      const started = performance.now();

      void withTimeout(
        racer.provider.lookup(word, language, controller.signal),
        racer.timeoutMs,
        signal,
      )
        .then((outcome) => {
          const latencyMs = performance.now() - started;
          if (outcome.kind === "hit" || outcome.kind === "stale") {
            recordProviderOutcome(racer.provider.id, "ok", latencyMs);
            settle(outcome);
            return;
          }
          if (outcome.kind === "miss") {
            recordProviderOutcome(racer.provider.id, "miss", latencyMs);
            settle(outcome);
            return;
          }
          recordProviderOutcome(racer.provider.id, "fail", latencyMs, outcome.code);
          settle({ kind: "miss" });
        })
        .catch(() => {
          recordProviderOutcome(
            racer.provider.id,
            "fail",
            performance.now() - started,
            "TIMEOUT",
          );
          settle({ kind: "miss" });
        });
    }
  });
}

/** Race Free Dictionary and Wiktionary REST for English; first hit wins. */
export const englishParallelProvider: LookupProvider = {
  id: "english-parallel",
  lookup: raceEnglishProviders,
};
