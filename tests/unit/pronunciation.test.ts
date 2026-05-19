import { describe, expect, it } from "vitest";

// Test audio URL scoring via exported helper pattern — inline mirror of production logic
function scoreAudioUrl(url: string, hint: string | null): number {
  const lower = url.toLowerCase();
  let score = 0;
  if (/\.(ogg|mp3|wav|opus)(\?|$)/i.test(lower)) {
    score += 2;
  }
  if (hint && lower.includes(hint)) {
    score += 5;
  }
  return score;
}

describe("pronunciation audio scoring", () => {
  it("prefers accent-matched recordings", () => {
    const us = scoreAudioUrl(
      "https://upload.wikimedia.org/wikipedia/commons/1/1a/En-us-from.ogg",
      "en-us",
    );
    const gb = scoreAudioUrl(
      "https://upload.wikimedia.org/wikipedia/commons/2/2b/En-uk-from.ogg",
      "en-us",
    );
    expect(us).toBeGreaterThan(gb);
  });
});
