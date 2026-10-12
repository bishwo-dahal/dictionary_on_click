import { describe, expect, it } from "vitest";
import {
  EDITABLE_NUDGE_MAX,
  shouldShowEditableNudge,
} from "../../src/content/editable-nudge.js";

describe("shouldShowEditableNudge", () => {
  it("shows for the first three visits (count 0, 1, 2)", () => {
    expect(shouldShowEditableNudge(0)).toBe(true);
    expect(shouldShowEditableNudge(1)).toBe(true);
    expect(shouldShowEditableNudge(2)).toBe(true);
  });

  it("stops after EDITABLE_NUDGE_MAX", () => {
    expect(shouldShowEditableNudge(EDITABLE_NUDGE_MAX)).toBe(false);
    expect(shouldShowEditableNudge(EDITABLE_NUDGE_MAX + 1)).toBe(false);
  });

  it("rejects invalid counts", () => {
    expect(shouldShowEditableNudge(-1)).toBe(false);
    expect(shouldShowEditableNudge(Number.NaN)).toBe(false);
  });
});
