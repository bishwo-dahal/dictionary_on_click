import type { DictionaryLanguageId } from "../shared/languages.js";
import {
  isLookupEnrichmentMessage,
  isLookupRefreshMessage,
} from "../shared/messages.js";
import { getSettings, lookupWord } from "./messaging.js";
import { DefinitionBubble } from "./popup-bubble.js";
import {
  anchorFromSelectionRange,
  getSelectionVisibility,
  type BubbleAnchor,
} from "./selection-anchor.js";

let language: DictionaryLanguageId = "en-us";
let activeRequestId: string | null = null;

const bubble = new DefinitionBubble();

export async function initContentController(): Promise<void> {
  try {
    const settings = await getSettings();
    language = settings.dictionaryLanguage;
  } catch {
    // Use default language if background is unavailable.
  }

  bubble.bindLifecycle(() => {
    activeRequestId = null;
  });

  installDismissListeners();
  installPushListeners();
}

export function anchorFromEvent(event: MouseEvent): BubbleAnchor {
  return { x: event.clientX, y: event.clientY };
}

export function anchorFromSelection(): BubbleAnchor | null {
  return anchorFromSelectionRange();
}

export async function runLookup(
  word: string,
  anchor: BubbleAnchor,
  options: { prefetch?: boolean; singleToken?: boolean },
): Promise<void> {
  const requestId = crypto.randomUUID();

  if (!options.prefetch) {
    activeRequestId = requestId;
    bubble.showLoading(word, anchor);
  }

  const response = await lookupWord(word, language, {
    prefetch: options.prefetch,
    singleToken: options.singleToken ?? true,
    requestId,
  });

  if (options.prefetch || requestId !== activeRequestId) {
    return;
  }

  if (!response) {
    bubble.dismiss();
    return;
  }

  bubble.showResult(response, anchor);
}

export function dismissBubble(): void {
  const wasVisible = bubble.isVisible();
  activeRequestId = null;
  bubble.dismiss();
  if (wasVisible) {
    void browser.runtime.sendMessage({ type: "recordPopupDismissal" });
  }
}

export function isBubbleVisible(): boolean {
  return bubble.isVisible();
}

function installPushListeners(): void {
  browser.runtime.onMessage.addListener((message: unknown) => {
    if (
      !isLookupEnrichmentMessage(message) &&
      !isLookupRefreshMessage(message)
    ) {
      return;
    }
    if (message.requestId !== activeRequestId || !bubble.isVisible()) {
      return;
    }

    if (isLookupEnrichmentMessage(message)) {
      bubble.applyEnrichment(
        message.synonyms,
        message.antonyms,
        message.translations,
      );
      return;
    }

    bubble.applyRefresh(message.result);
  });
}

function installDismissListeners(): void {
  const shouldDismiss = (event: Event): void => {
    if (!bubble.isVisible()) {
      return;
    }

    const target = event.target as Node | null;
    const host = document.getElementById("dictionary-on-click-bubble-host");
    // Clicks inside the closed shadow root retarget to the host element.
    if (host && target && (host === target || host.contains(target))) {
      return;
    }

    dismissBubble();
  };

  document.addEventListener(
    "pointerdown",
    (e) => {
      if (e.button !== 0) {
        return;
      }
      shouldDismiss(e);
    },
    true,
  );

  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape") {
        dismissBubble();
      }
    },
    true,
  );

  document.addEventListener("scroll", () => handleScrollWhileBubbleOpen(), true);
  window.addEventListener("blur", () => dismissBubble());

  document.addEventListener("selectionchange", () => {
    if (!bubble.isVisible()) {
      return;
    }
    const sel = window.getSelection()?.toString().trim() ?? "";
    if (!sel) {
      dismissBubble();
    }
  });
}

function handleScrollWhileBubbleOpen(): void {
  if (!bubble.isVisible()) {
    return;
  }

  const visibility = getSelectionVisibility();
  if (visibility !== "visible") {
    dismissBubble();
    return;
  }

  const anchor = anchorFromSelectionRange();
  if (anchor) {
    bubble.updateAnchor(anchor);
  }
}
