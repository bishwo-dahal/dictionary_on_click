import type { DictionaryLanguageId } from "../shared/languages.js";
import { getLanguageLabel } from "../shared/languages.js";
import {
  formatErrorMessage,
  isRetryable,
  type LookupErrorCode,
} from "../shared/errors.js";
import type { LookupFailure, LookupResponse, LookupResult } from "../shared/types.js";
import { generateVariants, normalizeInput } from "./normalize.js";
import { createDefaultProviders } from "./providers/stubs.js";
import type { LookupProvider, ProviderOutcome } from "./providers/types.js";
import {
  backoffDelayMs,
  isBackoffError,
  MAX_PROVIDER_ATTEMPTS,
  PROVIDER_TIMEOUT_MS,
  sleep,
  TOTAL_LOOKUP_BUDGET_MS,
  withTimeout,
} from "./retry.js";

export interface LookupRequest {
  word: string;
  language: DictionaryLanguageId;
  requestId: string;
  /** Prefetch is lower priority and yields to in-flight lookups. */
  prefetch?: boolean;
  singleToken?: boolean;
}

interface ActiveSession {
  requestId: string;
  abort: AbortController;
  prefetch: boolean;
}

function isOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

function failure(
  code: LookupErrorCode,
  word: string,
  language: DictionaryLanguageId,
): LookupFailure {
  const languageLabel = getLanguageLabel(language);
  return {
    ok: false,
    code,
    message: formatErrorMessage(code, { word, languageLabel }),
    word,
    language,
    retryable: isRetryable(code),
  };
}

function pickBestFailure(
  errors: LookupErrorCode[],
  word: string,
  language: DictionaryLanguageId,
): LookupFailure {
  if (errors.length === 0) {
    return failure("NOT_FOUND", word, language);
  }

  const priority: LookupErrorCode[] = [
    "OFFLINE",
    "RATE_LIMIT",
    "TIMEOUT",
    "API_ERROR",
    "PARSE_ERROR",
    "NOT_FOUND",
  ];

  for (const code of priority) {
    if (errors.includes(code)) {
      return failure(code, word, language);
    }
  }

  return failure(errors[errors.length - 1]!, word, language);
}

export class LookupOrchestrator {
  private providers: LookupProvider[];
  private active: ActiveSession | null = null;
  private latestLookupId: string | null = null;

  constructor(providers: LookupProvider[] = createDefaultProviders()) {
    this.providers = providers;
  }

  setProviders(providers: LookupProvider[]): void {
    this.providers = providers;
  }

  async lookup(req: LookupRequest): Promise<LookupResponse> {
    const normalized = normalizeInput(req.word, {
      singleToken: req.singleToken ?? !req.word.includes(" "),
    });

    if (!normalized) {
      return failure("NOT_FOUND", req.word.trim() || req.word, req.language);
    }

    let session: ActiveSession;

    if (req.prefetch) {
      if (this.active && !this.active.prefetch) {
        return failure("CANCELLED", normalized, req.language);
      }
      session = {
        requestId: req.requestId,
        abort: new AbortController(),
        prefetch: true,
      };
    } else {
      this.latestLookupId = req.requestId;
      this.cancelActive();
      session = {
        requestId: req.requestId,
        abort: new AbortController(),
        prefetch: false,
      };
      this.active = session;
    }

    const { signal } = session.abort;
    const budgetTimer = setTimeout(() => session.abort.abort(), TOTAL_LOOKUP_BUDGET_MS);

    try {
      const variants = generateVariants(normalized);
      const errors: LookupErrorCode[] = [];

      for (const variant of variants) {
        if (this.isStale(req)) {
          return failure("CANCELLED", normalized, req.language);
        }

        for (const provider of this.providers) {
          if (signal.aborted) {
            if (this.isStale(req)) {
              return failure("CANCELLED", normalized, req.language);
            }
            errors.push("TIMEOUT");
            break;
          }

          const outcome = await this.queryProvider(provider, variant, req.language, signal);

          if (outcome.kind === "hit") {
            return { ok: true, result: outcome.result };
          }

          if (outcome.kind === "error") {
            errors.push(outcome.code);
            if (outcome.code === "OFFLINE") {
              return failure("OFFLINE", normalized, req.language);
            }
          }
        }
      }

      if (isOffline() && errors.length === 0) {
        return failure("OFFLINE", normalized, req.language);
      }

      if (!errors.includes("NOT_FOUND")) {
        errors.push("NOT_FOUND");
      }

      return pickBestFailure(errors, normalized, req.language);
    } finally {
      clearTimeout(budgetTimer);
      if (!req.prefetch && this.active?.requestId === req.requestId) {
        this.active = null;
      }
    }
  }

  cancelActive(): void {
    this.active?.abort.abort();
    this.active = null;
  }

  private isStale(req: LookupRequest): boolean {
    return !req.prefetch && this.latestLookupId !== req.requestId;
  }

  private async queryProvider(
    provider: LookupProvider,
    word: string,
    language: DictionaryLanguageId,
    signal: AbortSignal,
  ): Promise<
    | { kind: "hit"; result: LookupResult }
    | { kind: "error"; code: LookupErrorCode }
    | { kind: "miss" }
  > {
    let lastCode: LookupErrorCode | null = null;

    for (let attempt = 0; attempt < MAX_PROVIDER_ATTEMPTS; attempt++) {
      if (signal.aborted) {
        return { kind: "error", code: "TIMEOUT" };
      }

      try {
        const outcome = await withTimeout(
          provider.lookup(word, language, signal),
          PROVIDER_TIMEOUT_MS,
          signal,
        );

        if (outcome.kind === "hit") {
          return outcome;
        }

        if (outcome.kind === "miss") {
          return { kind: "miss" };
        }

        lastCode = outcome.code;

        if (!isBackoffError(outcome.code) || attempt === MAX_PROVIDER_ATTEMPTS - 1) {
          return { kind: "error", code: outcome.code };
        }

        await sleep(backoffDelayMs(attempt), signal);
      } catch (err) {
        if (signal.aborted || (err instanceof DOMException && err.name === "AbortError")) {
          return { kind: "error", code: "TIMEOUT" };
        }
        lastCode = "API_ERROR";
        if (attempt === MAX_PROVIDER_ATTEMPTS - 1) {
          return { kind: "error", code: "API_ERROR" };
        }
        await sleep(backoffDelayMs(attempt), signal);
      }
    }

    return { kind: "error", code: lastCode ?? "API_ERROR" };
  }
}

let defaultInstance: LookupOrchestrator | null = null;

export function getLookupOrchestrator(): LookupOrchestrator {
  if (!defaultInstance) {
    defaultInstance = new LookupOrchestrator();
  }
  return defaultInstance;
}
