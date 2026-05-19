import type { LookupResponse } from "../shared/types.js";
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

  showLoading(word: string, anchor: BubbleAnchor): void {
    this.mount(anchor);
    if (!this.card) {
      return;
    }

    this.card.replaceChildren();

    const head = document.createElement("p");
    head.className = "headword";
    head.textContent = word;

    const sk1 = document.createElement("div");
    sk1.className = "skeleton";
    const sk2 = document.createElement("div");
    sk2.className = "skeleton";

    const status = document.createElement("p");
    status.className = "status";
    status.textContent = "Looking up…";

    this.card.append(head, sk1, sk2, status);
  }

  showResult(response: LookupResponse, anchor: BubbleAnchor): void {
    this.mount(anchor);
    if (!this.card) {
      return;
    }

    this.card.replaceChildren();

    if (!response.ok) {
      const head = document.createElement("p");
      head.className = "headword";
      head.textContent = response.word;
      const err = document.createElement("p");
      err.className = "status status--error";
      err.textContent = response.message;
      this.card.append(head, err);
      this.reposition(anchor);
      return;
    }

    const { result } = response;
    const head = document.createElement("p");
    head.className = "headword";
    head.textContent = result.word;
    this.card.append(head);

    for (const def of result.definitions.slice(0, 2)) {
      const p = document.createElement("p");
      p.className = "gloss";
      const pos = def.partOfSpeech ? `${def.partOfSpeech}: ` : "";
      p.textContent = `${pos}${def.text}`;
      this.card.append(p);
    }

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

    const report = document.createElement("button");
    report.type = "button";
    report.textContent = "Report broken word";
    report.addEventListener("click", () => {
      void this.queueReport(result.word, result.language);
      report.textContent = "Reported — thanks";
      report.disabled = true;
    });

    actions.append(full, report);
    this.card.append(actions);
    this.reposition(anchor);
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
    this.onDismiss?.();
    this.onDismiss = null;
  }

  isVisible(): boolean {
    return this.host !== null;
  }

  bindLifecycle(onDismiss: () => void): void {
    this.onDismiss = onDismiss;
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
    }

    this.reposition(anchor);
    this.resetFailsafe();
  }

  private reposition(anchor: BubbleAnchor): void {
    if (!this.host || !this.card) {
      return;
    }

    const margin = 8;
    const cardWidth = Math.min(360, Math.max(200, this.card.offsetWidth || 280));
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
