import { describe, expect, it, vi } from "vitest";
import { resolveTheme } from "../../src/shared/theme.js";

describe("resolveTheme", () => {
  it("returns light or dark for explicit modes", () => {
    expect(resolveTheme("light")).toBe("light");
    expect(resolveTheme("dark")).toBe("dark");
  });

  it("follows prefers-color-scheme when system", () => {
    const mq = { matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() };
    vi.stubGlobal("window", {
      matchMedia: vi.fn(() => mq),
    });
    expect(resolveTheme("system")).toBe("dark");

    mq.matches = false;
    expect(resolveTheme("system")).toBe("light");
    vi.unstubAllGlobals();
  });
});
