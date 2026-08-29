import { describe, expect, it } from "vitest";
import { rectIntersectsViewport } from "../../src/content/selection-anchor.js";

const viewport = { width: 800, height: 600 };

describe("rectIntersectsViewport", () => {
  it("returns true when rect overlaps the viewport", () => {
    expect(
      rectIntersectsViewport(
        {
          top: 10,
          bottom: 30,
          left: 10,
          right: 80,
        },
        viewport,
      ),
    ).toBe(true);
  });

  it("returns false when rect is entirely above the viewport", () => {
    expect(
      rectIntersectsViewport(
        {
          top: -50,
          bottom: -10,
          left: 10,
          right: 80,
        },
        viewport,
      ),
    ).toBe(false);
  });

  it("returns false when rect is entirely below the viewport", () => {
    const below = viewport.height + 100;
    expect(
      rectIntersectsViewport(
        {
          top: below,
          bottom: below + 20,
          left: 10,
          right: 80,
        },
        viewport,
      ),
    ).toBe(false);
  });
});
