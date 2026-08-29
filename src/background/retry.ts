import type { LookupErrorCode } from "../shared/errors.js";

export const PROVIDER_TIMEOUT_MS = 4_000;
export const TOTAL_LOOKUP_BUDGET_MS = 12_000;
export const MAX_PROVIDER_ATTEMPTS = 3;
export const BASE_BACKOFF_MS = 400;

export function isBackoffError(code: LookupErrorCode): boolean {
  return code === "RATE_LIMIT" || code === "API_ERROR";
}

export function backoffDelayMs(attempt: number, retryAfterSec?: number): number {
  if (retryAfterSec != null && retryAfterSec > 0) {
    return retryAfterSec * 1000;
  }
  return BASE_BACKOFF_MS * 2 ** attempt;
}

export function sleep(ms: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) {
    return Promise.reject(new DOMException("Aborted", "AbortError"));
  }
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    const onAbort = (): void => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

/** Race a promise against a timeout; aborts via linked AbortController. */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  parentSignal: AbortSignal,
): Promise<T> {
  const controller = new AbortController();
  const onParentAbort = (): void => controller.abort();
  parentSignal.addEventListener("abort", onParentAbort, { once: true });

  const timer = setTimeout(() => controller.abort(), ms);

  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener(
          "abort",
          () => reject(new DOMException("Timeout", "AbortError")),
          { once: true },
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
    parentSignal.removeEventListener("abort", onParentAbort);
  }
}
