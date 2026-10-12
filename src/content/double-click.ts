import {
  anchorFromEvent,
  anchorFromSelection,
  dismissBubble,
  runLookup,
} from "./controller.js";
import { getSettings } from "./messaging.js";
import {
  isEditableTarget,
  isPasswordInput,
  isSelectTarget,
  wordFromDoubleClick,
  wordFromEditableDoubleClick,
} from "./word-extract.js";

let allowEditableLookups = true;
let settingsReady = false;

const SETTINGS_KEY = "userSettings";

export async function initDoubleClick(): Promise<void> {
  try {
    const settings = await getSettings();
    allowEditableLookups = settings.allowEditableLookups;
  } catch {
    allowEditableLookups = true;
  }
  settingsReady = true;

  browser.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync" || !changes[SETTINGS_KEY]) {
      return;
    }
    const next = changes[SETTINGS_KEY].newValue as
      | { allowEditableLookups?: boolean }
      | undefined;
    if (typeof next?.allowEditableLookups === "boolean") {
      allowEditableLookups = next.allowEditableLookups;
    }
  });
}

document.addEventListener(
  "dblclick",
  (event) => {
    if (event.defaultPrevented) {
      return;
    }

    const fromEditable = isEditableTarget(event.target);
    if (fromEditable) {
      if (isPasswordInput(event.target) || isSelectTarget(event.target)) {
        return;
      }
      if (settingsReady && !allowEditableLookups) {
        return;
      }
    }

    const word = fromEditable
      ? wordFromEditableDoubleClick(event)
      : wordFromDoubleClick(event);
    if (!word || word.length < 2) {
      return;
    }

    const anchor = anchorFromSelection() ?? anchorFromEvent(event);
    dismissBubble();
    void runLookup(word, anchor, { singleToken: true, fromEditable });
  },
  true,
);
