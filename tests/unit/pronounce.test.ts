import { describe, expect, it } from "vitest";
import { speechLangFor } from "../../src/shared/pronounce.js";

describe("speechLangFor", () => {
  it("maps dictionary languages to BCP-47 tags", () => {
    expect(speechLangFor("en-us")).toBe("en-US");
    expect(speechLangFor("en-uk")).toBe("en-GB");
    expect(speechLangFor("ja")).toBe("ja-JP");
    expect(speechLangFor("es")).toBe("es-ES");
  });
});
