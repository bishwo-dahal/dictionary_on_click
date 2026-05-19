import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getProviderHealth,
  isProviderAvailable,
  recordProviderOutcome,
  resetProviderHealth,
} from "../../src/background/health.js";

describe("provider health", () => {
  afterEach(() => {
    resetProviderHealth();
    vi.useRealTimers();
  });

  it("opens circuit after sustained failures", () => {
    for (let i = 0; i < 6; i++) {
      recordProviderOutcome("wiktionary-rest", "fail", 100, "API_ERROR");
    }

    expect(isProviderAvailable("wiktionary-rest")).toBe(false);

    const info = getProviderHealth().find((p) => p.id === "wiktionary-rest");
    expect(info?.status).toBe("unavailable");
  });

  it("recovers after circuit timeout", () => {
    vi.useFakeTimers();

    for (let i = 0; i < 6; i++) {
      recordProviderOutcome("free-dictionary", "fail", 50, "TIMEOUT");
    }

    expect(isProviderAvailable("free-dictionary")).toBe(false);

    vi.advanceTimersByTime(5 * 60 * 1000 + 1);

    expect(isProviderAvailable("free-dictionary")).toBe(true);
  });

  it("closes circuit on success", () => {
    for (let i = 0; i < 6; i++) {
      recordProviderOutcome("datamuse", "fail", 50, "API_ERROR");
    }

    expect(isProviderAvailable("datamuse")).toBe(false);

    recordProviderOutcome("datamuse", "ok", 20);

    expect(isProviderAvailable("datamuse")).toBe(true);
  });

  it("always allows cache provider", () => {
    for (let i = 0; i < 10; i++) {
      recordProviderOutcome("cache", "fail", 1, "API_ERROR");
    }
    expect(isProviderAvailable("cache")).toBe(true);
  });
});
