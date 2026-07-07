import { describe, expect, it } from "vitest";
import {
  groupDefinitionsByPos,
  normalizePos,
  pickBubbleSummary,
  posLabel,
} from "../../src/shared/definition-display.js";
import type { Definition } from "../../src/shared/types.js";

function def(partOfSpeech: string | undefined, text: string): Definition {
  return { partOfSpeech, text };
}

describe("normalizePos", () => {
  it("maps common aliases", () => {
    expect(normalizePos("Noun")).toBe("noun");
    expect(normalizePos("v")).toBe("verb");
    expect(normalizePos("adj")).toBe("adjective");
    expect(normalizePos("adv")).toBe("adverb");
  });

  it("returns other for missing or unknown POS", () => {
    expect(normalizePos(undefined)).toBe("other");
    expect(normalizePos("")).toBe("other");
    expect(normalizePos("interjection")).toBe("other");
  });
});

describe("posLabel", () => {
  it("returns title-case labels", () => {
    expect(posLabel("verb")).toBe("Verb");
    expect(posLabel("other")).toBe("Other");
  });
});

describe("groupDefinitionsByPos", () => {
  it("groups by POS in priority order", () => {
    const definitions = [
      def("noun", "n1"),
      def("verb", "v1"),
      def("noun", "n2"),
      def("verb", "v2"),
    ];

    const groups = groupDefinitionsByPos(definitions);
    expect(groups.map((g) => g.pos)).toEqual(["verb", "noun"]);
    expect(groups[0].items.map((d) => d.text)).toEqual(["v1", "v2"]);
    expect(groups[1].items.map((d) => d.text)).toEqual(["n1", "n2"]);
  });

  it("puts definitions without POS in other", () => {
    const groups = groupDefinitionsByPos([def(undefined, "plain")]);
    expect(groups).toEqual([
      { pos: "other", label: "Other", items: [def(undefined, "plain")] },
    ]);
  });
});

describe("pickBubbleSummary", () => {
  const churnLike = [
    def("noun", "A vessel used for churning."),
    def("noun", "Massive turnover of customers."),
    def("verb", "To agitate rapidly."),
    def("verb", "To produce butter by agitating milk."),
  ];

  it("prefers one sense per POS when multiple POS exist (churn-like)", () => {
    const { shown, hiddenCount } = pickBubbleSummary(churnLike, { maxTotal: 4 });

    expect(shown).toHaveLength(2);
    expect(shown.map((d) => normalizePos(d.partOfSpeech))).toEqual(["verb", "noun"]);
    expect(shown[0].text).toBe("To agitate rapidly.");
    expect(shown[1].text).toBe("A vessel used for churning.");
    expect(hiddenCount).toBe(2);
  });

  it("respects maxTotal across POS priority", () => {
    const definitions = [
      def("adverb", "adv1"),
      def("verb", "v1"),
      def("noun", "n1"),
      def("adjective", "adj1"),
    ];

    const { shown, hiddenCount } = pickBubbleSummary(definitions, { maxTotal: 3 });
    expect(shown.map((d) => normalizePos(d.partOfSpeech))).toEqual(["verb", "noun", "adjective"]);
    expect(hiddenCount).toBe(1);
  });

  it("uses single-POS fallback when only one POS bucket exists", () => {
    const definitions = [
      def("noun", "n1"),
      def("noun", "n2"),
      def("noun", "n3"),
      def("noun", "n4"),
      def("noun", "n5"),
    ];

    const { shown, hiddenCount } = pickBubbleSummary(definitions, { maxTotal: 4 });
    expect(shown.map((d) => d.text)).toEqual(["n1", "n2", "n3", "n4"]);
    expect(hiddenCount).toBe(1);
  });

  it("returns empty shown when maxTotal is zero", () => {
    const { shown, hiddenCount } = pickBubbleSummary(churnLike, { maxTotal: 0 });
    expect(shown).toEqual([]);
    expect(hiddenCount).toBe(4);
  });

  it("caps at maxTotal of 2 with verb before noun", () => {
    const { shown, hiddenCount } = pickBubbleSummary(churnLike, { maxTotal: 2 });
    expect(shown.map((d) => normalizePos(d.partOfSpeech))).toEqual(["verb", "noun"]);
    expect(hiddenCount).toBe(2);
  });
});
