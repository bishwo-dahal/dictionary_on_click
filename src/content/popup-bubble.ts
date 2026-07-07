import type { LookupResponse, LookupResult } from "../shared/types.js";
import { groupDefinitionsByPos, pickBubbleSummary } from "../shared/definition-display.js";
import { createHeadwordHeader } from "../shared/headword-header.js";
import { markReportButtonDone } from "../shared/pos.js";
import {
  appendGlossLines,
  createExpandMeaningsToggle,
  createGlossList,
  createPosGroup,
} from "../shared/render-definitions.js";
import { getSettings } from "./messaging.js";
import { watchTheme } from "../shared/theme-bind.js";
import { BUBBLE_STYLES } from "./bubble-styles.js";

const FAILSAFE_MS = 15_000;
const REPORT_KEY = "brokenWordReports";

export interface BubbleAnchor {
  x: number;
  y: number;
}

interface ReportEntry {
  timestamp: number;
  word: string;
  language: string;
  pageUrl: string;
}

export class DefinitionBubble {
  private host: HTMLDivElement | null = null;
  private shadow: ShadowRoot | null = null;
  private card: HTMLDivElement | null = null;
  private failsafeTimer: number | null = null;
  private onDismiss: (() => void) | null = null;
  private themeBound = false;
  private meaningsExpanded = false;

  showLoading(word: string, anchor: BubbleAnchor): void {
    this.meaningsExpanded = false;
    this.mount(anchor);
    if (!this.card) {
      return;
    }

    this.card.replaceChildren();

    const header = document.createElement("div");
    header.className = "card-header";
    const head = document.createElement("p");
    head.className = "headword";
    head.textContent = word;
    header.append(head);

    const sk1 = document.createElement("div");
    sk1.className = "skeleton";
    const sk2 = document.createElement("div");
    sk2.className = "skeleton";

    const status = document.createElement("p");
    status.className = "status";
    status.textContent = "Looking up…";

    this.card.append(header, sk1, sk2, status);
  }

  showResult(response: LookupResponse, anchor: BubbleAnchor): void {
    this.mount(anchor);
    if (!this.card) {
      return;
    }

    void this.populateResult(response, anchor);
  }

  dismiss(): void {
    if (this.failsafeTimer !== null) {
      window.clearTimeout(this.failsafeTimer);
      this.failsafeTimer = null;
    }
    this.host?.remove();
    this.host = null;
    this.shadow = null;
    this.card = null;
    this.themeBound = false;
    this.meaningsExpanded = false;
    this.onDismiss?.();
    this.onDismiss = null;
  }

  isVisible(): boolean {
    return this.host !== null;
  }

  bindLifecycle(onDismiss: () => void): void {
    this.onDismiss = onDismiss;
  }

  private async populateResult(
    response: LookupResponse,
    anchor: BubbleAnchor,
  ): Promise<void> {
    if (!this.card) {
      return;
    }

    this.card.replaceChildren();
    this.meaningsExpanded = false;

    if (!response.ok) {
      const header = document.createElement("div");
      header.className = "card-header";
      const head = document.createElement("p");
      head.className = "headword";
      head.textContent = response.word;
      header.append(head);

      const err = document.createElement("p");
      err.className = "status status--error";
      err.textContent = response.message;
      this.card.append(header, err);
      this.reposition(anchor);
      return;
    }

    const { result } = response;
    const settings = await getSettings();

    this.card.append(
      createHeadwordHeader({
        word: result.word,
        language: result.language,
        phonetic: result.phonetic,
        audioUrl: result.audioUrl,
        headerClass: "card-header",
        headTag: "p",
        headClass: "headword",
        onReport: (btn) => {
          void this.queueReport(result.word, result.language);
          markReportButtonDone(btn);
        },
      }),
    );

    this.card.append(
      this.buildMeaningsRegion(
        result,
        settings.bubblePreviewMax,
        settings.bubblePreviewPerPos,
        anchor,
      ),
    );

    if (result.partial || result.stale) {
      const meta = document.createElement("p");
      meta.className = "meta";
      meta.textContent = result.stale
        ? "Showing cached definition"
        : "Partial result";
      this.card.append(meta);
    }

    const actions = document.createElement("div");
    actions.className = "actions";

    const full = document.createElement("a");
    full.className = "btn primary";
    full.href = result.sourceUrl;
    full.target = "_blank";
    full.rel = "noopener noreferrer";
    full.textContent = "See full definition";

    actions.append(full);
    this.card.append(actions);
    this.reposition(anchor);
  }

  private buildMeaningsRegion(
    result: LookupResult,
    previewMax: number,
    previewPerPos: number,
    anchor: BubbleAnchor,
  ): HTMLDivElement {
    const region = document.createElement("div");
    region.className = "meanings-region";

    if (result.definitions.length === 0) {
      return region;
    }

    const { shown, hiddenCount } = pickBubbleSummary(result.definitions, {
      maxTotal: previewMax,
      maxPerPos: previewPerPos,
    });
    const list = createGlossList({ expandable: this.meaningsExpanded });

    if (this.meaningsExpanded) {
      for (const group of groupDefinitionsByPos(result.definitions)) {
        list.append(createPosGroup(group, { variant: "bubble" }));
      }
    } else {
      appendGlossLines(list, shown, { clamp: true });
    }

    region.append(list);

    if (hiddenCount > 0 || this.meaningsExpanded) {
      region.append(
        createExpandMeaningsToggle(hiddenCount, this.meaningsExpanded, () => {
          this.meaningsExpanded = !this.meaningsExpanded;
          this.card
            ?.querySelector(".meanings-region")
            ?.replaceWith(
              this.buildMeaningsRegion(result, previewMax, previewPerPos, anchor),
            );
          requestAnimationFrame(() => this.reposition(anchor));
        }),
      );
    }

    return region;
  }

  private mount(anchor: BubbleAnchor): void {
    if (!this.host) {
      this.host = document.createElement("div");
      this.host.id = "dictionary-on-click-bubble-host";
      Object.assign(this.host.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "0",
        height: "0",
        zIndex: "2147483647",
        pointerEvents: "none",
      });
      this.shadow = this.host.attachShadow({ mode: "closed" });
      const style = document.createElement("style");
      style.textContent = BUBBLE_STYLES;
      this.shadow.append(style);
      this.card = document.createElement("div");
      this.card.className = "card";
      this.card.style.pointerEvents = "auto";
      this.shadow.append(this.card);
      document.documentElement.append(this.host);
      this.bindCardTheme();
    }

    this.reposition(anchor);
    this.resetFailsafe();
  }

  private bindCardTheme(): void {
    if (this.themeBound || !this.card) {
      return;
    }
    this.themeBound = true;
    watchTheme(this.card, async () => (await getSettings()).theme);
  }

  private reposition(anchor: BubbleAnchor): void {
    if (!this.host || !this.card) {
      return;
    }

    const margin = 8;
    const cardWidth = Math.min(560, Math.max(380, this.card.offsetWidth || 440));
    const cardHeight = this.card.offsetHeight || 140;

    let left = anchor.x - cardWidth / 2;
    let top = anchor.y + margin + 16;

    left = Math.max(margin, Math.min(left, window.innerWidth - cardWidth - margin));

    if (top + cardHeight > window.innerHeight - margin) {
      top = anchor.y - cardHeight - margin - 8;
    }
    top = Math.max(margin, top);

    this.host.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
  }

  private resetFailsafe(): void {
    if (this.failsafeTimer !== null) {
      window.clearTimeout(this.failsafeTimer);
    }
    this.failsafeTimer = window.setTimeout(() => this.dismiss(), FAILSAFE_MS);
  }

  private async queueReport(word: string, language: string): Promise<void> {
    const stored = await browser.storage.local.get(REPORT_KEY);
    const list = (stored[REPORT_KEY] as ReportEntry[] | undefined) ?? [];
    list.push({
      timestamp: Date.now(),
      word,
      language,
      pageUrl: location.href,
    });
    await browser.storage.local.set({ [REPORT_KEY]: list.slice(-500) });
  }
}
