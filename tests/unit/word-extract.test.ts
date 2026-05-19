import { describe, expect, it } from "vitest";
import { wordAtOffsetInText } from "../../src/content/word-extract.js";

describe("wordAtOffsetInText", () => {
  it("extracts the word under the offset", () => {
    expect(wordAtOffsetInText("The quick brown fox", 4)).toBe("quick");
  });

  it("strips surrounding punctuation", () => {
    expect(wordAtOffsetInText('"hello," she said', 1)).toBe("hello");
  });
});
