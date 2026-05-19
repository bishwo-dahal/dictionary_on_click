import type { LookupErrorCode } from "../shared/errors.js";
import type { ProviderId } from "../shared/languages.js";
import type { TelemetrySnapshot } from "../shared/telemetry-types.js";

export type { TelemetrySnapshot };

const TELEMETRY_KEY = "localTelemetry";

function emptySnapshot(): TelemetrySnapshot {
  return {
    lookups: 0,
    cacheHits: 0,
    failuresByCode: {},
    timeouts: 0,
    popupDismissals: 0,
    parseErrors: 0,
    latencyBuckets: {
      under100ms: 0,
      ms100to300: 0,
      ms300to1000: 0,
      over1000ms: 0,
    },
    providerCalls: {},
    updatedAt: Date.now(),
  };
}

async function load(): Promise<TelemetrySnapshot> {
  const stored = await browser.storage.local.get(TELEMETRY_KEY);
  const raw = stored[TELEMETRY_KEY] as TelemetrySnapshot | undefined;
  return raw ? { ...emptySnapshot(), ...raw } : emptySnapshot();
}

async function save(snapshot: TelemetrySnapshot): Promise<void> {
  snapshot.updatedAt = Date.now();
  await browser.storage.local.set({ [TELEMETRY_KEY]: snapshot });
}

export async function getTelemetry(): Promise<TelemetrySnapshot> {
  return load();
}

export async function recordLookupComplete(params: {
  success: boolean;
  durationMs: number;
  code?: LookupErrorCode;
  fromCache?: boolean;
  provider?: ProviderId;
}): Promise<void> {
  const snap = await load();
  snap.lookups++;

  if (params.fromCache) {
    snap.cacheHits++;
  }

  if (params.success) {
    bucketLatency(snap, params.durationMs);
    if (params.provider) {
      const stats = snap.providerCalls[params.provider] ?? { ok: 0, fail: 0 };
      stats.ok++;
      snap.providerCalls[params.provider] = stats;
    }
  } else if (params.code) {
    snap.failuresByCode[params.code] = (snap.failuresByCode[params.code] ?? 0) + 1;
    if (params.code === "TIMEOUT") {
      snap.timeouts++;
    }
    if (params.code === "PARSE_ERROR") {
      snap.parseErrors++;
    }
    if (params.provider) {
      const stats = snap.providerCalls[params.provider] ?? { ok: 0, fail: 0 };
      stats.fail++;
      snap.providerCalls[params.provider] = stats;
    }
  }

  await save(snap);
}

export async function recordPopupDismissal(): Promise<void> {
  const snap = await load();
  snap.popupDismissals++;
  await save(snap);
}

function bucketLatency(snap: TelemetrySnapshot, ms: number): void {
  if (ms < 100) {
    snap.latencyBuckets.under100ms++;
  } else if (ms < 300) {
    snap.latencyBuckets.ms100to300++;
  } else if (ms < 1000) {
    snap.latencyBuckets.ms300to1000++;
  } else {
    snap.latencyBuckets.over1000ms++;
  }
}

export function telemetryFailureRate(snap: TelemetrySnapshot): number {
  const failures = Object.values(snap.failuresByCode).reduce((a, b) => a + (b ?? 0), 0);
  if (snap.lookups === 0) {
    return 0;
  }
  return failures / snap.lookups;
}

export async function clearTelemetry(): Promise<void> {
  await browser.storage.local.remove(TELEMETRY_KEY);
}
