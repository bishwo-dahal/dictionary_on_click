import {
  anchorFromEvent,
  anchorFromSelection,
  dismissBubble,
  runLookup,
} from "./controller.js";
import { isEditableTarget, wordFromDoubleClick } from "./word-extract.js";

document.addEventListener(
  "dblclick",
  (event) => {
    if (event.defaultPrevented) {
      return;
    }
    if (isEditableTarget(event.target)) {
      return;
    }

    const word = wordFromDoubleClick(event);
    if (!word || word.length < 2) {
      return;
    }

    const anchor = anchorFromSelection() ?? anchorFromEvent(event);
    dismissBubble();
    void runLookup(word, anchor, { singleToken: true });
  },
  true,
);
