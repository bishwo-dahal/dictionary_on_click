import { describe, expect, it } from "vitest";
import {
  englishAffixVariants,
  generateVariants,
  normalizeInput,
} from "../../src/background/normalize.js";

describe("normalizeInput", () => {
  it("lowercases and trims", () => {
    expect(normalizeInput("  Hello  ")).toBe("hello");
  });

  it("extracts a single token for double-click mode", () => {
    expect(normalizeInput('"running,"', { singleToken: true })).toBe("running");
  });

  it("preserves multi-word phrases", () => {
    expect(normalizeInput("  break down  ")).toBe("break down");
  });

  it("returns empty for punctuation-only input", () => {
    expect(normalizeInput("...", { singleToken: true })).toBe("");
  });
});

describe("generateVariants", () => {
  it("includes original and -ing stem", () => {
    const variants = generateVariants("running");
    expect(variants[0]).toBe("running");
    expect(variants).toContain("run");
  });

  it("deduplicates variants", () => {
    const variants = generateVariants("test");
    expect(new Set(variants).size).toBe(variants.length);
  });
});

describe("englishAffixVariants", () => {
  it("maps studies to study", () => {
    expect(englishAffixVariants("studies")).toContain("study");
  });
});
