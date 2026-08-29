import type { DictionaryLanguageId } from "../shared/languages.js";
import {
  isLookupEnrichmentMessage,
  isLookupRefreshMessage,
} from "../shared/messages.js";
import { getSettings, lookupWord } from "./messaging.js";
import { DefinitionBubble, type BubbleAnchor } from "./popup-bubble.js";

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
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) {
    return null;
  }
  const rect = sel.getRangeAt(0).getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    return null;
  }
  return {
    x: rect.left + rect.width / 2,
    y: rect.bottom,
  };
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

  document.addEventListener("scroll", () => dismissBubble(), true);
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
