import { anchorFromSelection, isBubbleVisible, runLookup } from "./controller.js";
import { selectionTextForPrefetch } from "./word-extract.js";

const DEBOUNCE_MS = 300;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

document.addEventListener("selectionchange", () => {
  if (isBubbleVisible()) {
    return;
  }

  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    debounceTimer = null;

    const text = selectionTextForPrefetch();
    if (!text) {
      return;
    }

    const anchor = anchorFromSelection();
    if (!anchor) {
      return;
    }

    const singleToken = !/\s/.test(text);
    void runLookup(text, anchor, {
      prefetch: true,
      singleToken,
    });
  }, DEBOUNCE_MS);
});
