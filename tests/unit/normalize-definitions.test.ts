import { describe, expect, it } from "vitest";
import {
  normalizeDefinitions,
  splitEmbeddedPartOfSpeech,
} from "../../src/shared/normalize-definitions.js";

describe("splitEmbeddedPartOfSpeech", () => {
  it("leaves definitions that already have partOfSpeech", () => {
    const def = { partOfSpeech: "noun", text: "A thing" };
    expect(splitEmbeddedPartOfSpeech(def)).toEqual(def);
  });

  it("splits Datamuse tab-separated lines", () => {
    expect(
      splitEmbeddedPartOfSpeech({
        text: "adj\tNot the same; exhibiting a difference.",
      }),
    ).toEqual({
      partOfSpeech: "adj",
      text: "Not the same; exhibiting a difference.",
    });
  });

  it("splits colon-separated lines", () => {
    expect(
      splitEmbeddedPartOfSpeech({ text: "verb: to run quickly" }),
    ).toEqual({
      partOfSpeech: "verb",
      text: "to run quickly",
    });
  });

  it("does not split normal sentences", () => {
    const def = { text: "The quick brown fox" };
    expect(splitEmbeddedPartOfSpeech(def)).toEqual(def);
  });
});

describe("normalizeDefinitions", () => {
  it("normalizes every definition in a list", () => {
    expect(
      normalizeDefinitions([
        { text: "n\tfood" },
        { partOfSpeech: "verb", text: "to eat" },
      ]),
    ).toEqual([
      { partOfSpeech: "n", text: "food" },
      { partOfSpeech: "verb", text: "to eat" },
    ]);
  });
});
