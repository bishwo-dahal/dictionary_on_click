import type { LookupErrorCode } from "../shared/errors.js";
import type { ProviderId } from "../shared/languages.js";
import type { ProviderHealthInfo, ProviderHealthStatus } from "../shared/telemetry-types.js";

const WINDOW_SIZE = 100;
const FAILURE_RATE_THRESHOLD = 0.4;
const MIN_SAMPLES_FOR_BREAKER = 5;
const CIRCUIT_OPEN_MS = 5 * 60 * 1000;

type OutcomeKind = "ok" | "miss" | "fail";

interface Sample {
  outcome: OutcomeKind;
  latencyMs: number;
  errorCode?: LookupErrorCode;
  at: number;
}

interface ProviderState {
  samples: Sample[];
  skippedUntil: number;
  lastError?: LookupErrorCode;
}

const PROVIDER_LABELS: Record<ProviderId, string> = {
  cache: "Local cache",
  "english-parallel": "English providers (parallel)",
  "wiktionary-rest": "Wiktionary REST",
  "wiktionary-action": "Wiktionary API",
  "free-dictionary": "Free Dictionary API",
  datamuse: "Datamuse",
};

const states = new Map<ProviderId, ProviderState>();

function getState(id: ProviderId): ProviderState {
  let state = states.get(id);
  if (!state) {
    state = { samples: [], skippedUntil: 0 };
    states.set(id, state);
  }
  return state;
}

function pushSample(state: ProviderState, sample: Sample): void {
  state.samples.push(sample);
  if (state.samples.length > WINDOW_SIZE) {
    state.samples.shift();
  }
}

function failureRate(samples: Sample[]): number {
  const failures = samples.filter((s) => s.outcome === "fail").length;
  return samples.length === 0 ? 0 : failures / samples.length;
}

function percentile(latencies: number[], p: number): number {
  if (latencies.length === 0) {
    return 0;
  }
  const sorted = [...latencies].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return Math.round(sorted[idx]!);
}

function evaluateCircuit(state: ProviderState): void {
  const now = Date.now();
  if (now < state.skippedUntil) {
    return;
  }

  const rate = failureRate(state.samples);
  if (state.samples.length >= MIN_SAMPLES_FOR_BREAKER && rate > FAILURE_RATE_THRESHOLD) {
    state.skippedUntil = now + CIRCUIT_OPEN_MS;
  }
}

/** Whether the orchestrator should call this provider now. */
export function isProviderAvailable(id: ProviderId): boolean {
  if (id === "cache") {
    return true;
  }

  const state = getState(id);
  return Date.now() >= state.skippedUntil;
}

export function recordProviderOutcome(
  id: ProviderId,
  outcome: OutcomeKind,
  latencyMs: number,
  errorCode?: LookupErrorCode,
): void {
  const state = getState(id);
  pushSample(state, {
    outcome,
    latencyMs,
    errorCode,
    at: Date.now(),
  });

  if (errorCode) {
    state.lastError = errorCode;
  }

  if (outcome === "ok") {
    // Successful probe — close circuit early.
    state.skippedUntil = 0;
  } else if (outcome === "fail") {
    evaluateCircuit(state);
  }
}

function statusFor(state: ProviderState): ProviderHealthStatus {
  const now = Date.now();
  if (now < state.skippedUntil) {
    return "unavailable";
  }

  const rate = failureRate(state.samples);
  if (state.samples.length >= MIN_SAMPLES_FOR_BREAKER && rate > FAILURE_RATE_THRESHOLD) {
    return "degraded";
  }

  return "healthy";
}

export function getProviderHealth(): ProviderHealthInfo[] {
  const ids = Object.keys(PROVIDER_LABELS) as ProviderId[];

  return ids.map((id) => {
    const state = getState(id);
    const okSamples = state.samples.filter((s) => s.outcome === "ok");
    const latencies = okSamples.map((s) => s.latencyMs);
    const successes = state.samples.filter((s) => s.outcome === "ok" || s.outcome === "miss").length;

    return {
      id,
      label: PROVIDER_LABELS[id],
      status: statusFor(state),
      successRate:
        state.samples.length === 0 ? 1 : successes / state.samples.length,
      p50Ms: percentile(latencies, 50),
      p95Ms: percentile(latencies, 95),
      recentCalls: state.samples.length,
      lastError: state.lastError,
      skippedUntil: state.skippedUntil > Date.now() ? state.skippedUntil : undefined,
    };
  });
}

/** Reset health state (for tests). */
export function resetProviderHealth(): void {
  states.clear();
}
