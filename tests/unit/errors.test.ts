import { describe, expect, it } from "vitest";
import { formatErrorMessage, isRetryable } from "../../src/shared/errors.js";

describe("errors", () => {
  const params = { word: "xyzzy", languageLabel: "English (US)" };

  it("formats NOT_FOUND with word and language", () => {
    expect(formatErrorMessage("NOT_FOUND", params)).toBe(
      'No entry for "xyzzy" in English (US).',
    );
  });

  it("marks transient errors as retryable", () => {
    expect(isRetryable("API_ERROR")).toBe(true);
    expect(isRetryable("NOT_FOUND")).toBe(false);
    expect(isRetryable("CANCELLED")).toBe(false);
  });
});
