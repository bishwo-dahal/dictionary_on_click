/** Normalize POS string for CSS class, e.g. "Noun" → "noun". */
export function posClassName(partOfSpeech: string): string {
  const key = partOfSpeech
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return key ? `pos pos--${key}` : "pos";
}

import { REPORT_ICON_SVG } from "./ui-icons.js";

export { REPORT_ICON_SVG } from "./ui-icons.js";

const REPORT_DONE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>`;

export function markReportButtonDone(btn: HTMLButtonElement): void {
  btn.classList.add("report-btn--done");
  btn.disabled = true;
  btn.title = "Reported — thank you";
  btn.setAttribute("aria-label", "Reported — thank you");
  btn.innerHTML = REPORT_DONE_SVG;
}

export function createReportIconButton(
  onReport: (btn: HTMLButtonElement) => void,
): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "icon-btn report-btn";
  btn.title = "Report broken word";
  btn.setAttribute("aria-label", "Report broken word");
  btn.innerHTML = REPORT_ICON_SVG;
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    onReport(btn);
  });
  return btn;
}

export function createPosSpan(partOfSpeech: string): HTMLSpanElement {
  const span = document.createElement("span");
  span.className = posClassName(partOfSpeech);
  span.textContent = partOfSpeech.toLowerCase();
  return span;
}
