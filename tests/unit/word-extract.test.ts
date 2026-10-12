import { describe, expect, it } from "vitest";
import {
  wordAtOffsetInText,
  wordFromTextControl,
} from "../../src/content/word-extract.js";

describe("wordAtOffsetInText", () => {
  it("extracts the word under the offset", () => {
    expect(wordAtOffsetInText("The quick brown fox", 4)).toBe("quick");
  });

  it("strips surrounding punctuation", () => {
    expect(wordAtOffsetInText('"hello," she said', 1)).toBe("hello");
  });
});

describe("wordFromTextControl", () => {
  it("uses a single-word selection from an input/textarea", () => {
    expect(wordFromTextControl("hello world", 0, 5)).toBe("hello");
  });

  it("expands around the caret when nothing is selected", () => {
    expect(wordFromTextControl("hello world", 1, 1)).toBe("hello");
  });

  it("returns empty when selection indices are missing", () => {
    expect(wordFromTextControl("hello", null, null)).toBe("");
  });
});
