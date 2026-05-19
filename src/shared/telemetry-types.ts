import type { LookupErrorCode } from "./errors.js";
import type { ProviderId } from "./languages.js";

export interface TelemetrySnapshot {
  lookups: number;
  cacheHits: number;
  failuresByCode: Partial<Record<LookupErrorCode, number>>;
  timeouts: number;
  popupDismissals: number;
  parseErrors: number;
  latencyBuckets: {
    under100ms: number;
    ms100to300: number;
    ms300to1000: number;
    over1000ms: number;
  };
  providerCalls: Partial<Record<ProviderId, { ok: number; fail: number }>>;
  updatedAt: number;
}

export interface HistoryEntry {
  timestamp: number;
  word: string;
  lemma: string;
  language: import("./languages.js").DictionaryLanguageId;
  definitionSnippet: string;
  sourceUrl: string;
  provider: string;
}

export interface BrokenWordReport {
  timestamp: number;
  word: string;
  language: string;
  pageUrl: string;
}

export type ProviderHealthStatus = "healthy" | "degraded" | "unavailable";

export interface ProviderHealthInfo {
  id: ProviderId;
  label: string;
  status: ProviderHealthStatus;
  successRate: number;
  p50Ms: number;
  p95Ms: number;
  recentCalls: number;
  lastError?: LookupErrorCode;
  skippedUntil?: number;
}
