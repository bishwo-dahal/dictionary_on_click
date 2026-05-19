import type { LookupErrorCode } from "../../shared/errors.js";

export interface FetchJsonOptions {
  signal: AbortSignal;
  headers?: Record<string, string>;
}

export function mapHttpStatus(status: number, retryAfterSec?: number): LookupErrorCode {
  if (status === 429) {
    return "RATE_LIMIT";
  }
  if (status === 404) {
    return "NOT_FOUND";
  }
  if (status >= 500) {
    return "API_ERROR";
  }
  if (status >= 400) {
    return "API_ERROR";
  }
  return "API_ERROR";
}

export function parseRetryAfter(response: Response): number | undefined {
  const header = response.headers.get("Retry-After");
  if (!header) {
    return undefined;
  }
  const seconds = Number(header);
  return Number.isFinite(seconds) ? seconds : undefined;
}

export async function fetchJson<T>(
  url: string,
  options: FetchJsonOptions,
): Promise<
  | { ok: true; data: T }
  | { ok: false; code: LookupErrorCode; retryable: boolean; retryAfterSec?: number }
> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { ok: false, code: "OFFLINE", retryable: false };
  }

  try {
    const response = await fetch(url, {
      signal: options.signal,
      headers: options.headers,
      cache: "default",
    });

    if (!response.ok) {
      const code = mapHttpStatus(response.status);
      return {
        ok: false,
        code,
        retryable: code === "RATE_LIMIT" || code === "API_ERROR",
        retryAfterSec: parseRetryAfter(response),
      };
    }

    const data = (await response.json()) as T;
    return { ok: true, data };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { ok: false, code: "TIMEOUT", retryable: true };
    }
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return { ok: false, code: "OFFLINE", retryable: false };
    }
    return { ok: false, code: "API_ERROR", retryable: true };
  }
}

export function toWikiTitle(word: string): string {
  return word.trim().replace(/\s+/g, "_");
}
