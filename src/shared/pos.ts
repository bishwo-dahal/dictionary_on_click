/** Normalize part-of-speech (POS) string for CSS class, e.g. "Noun" → "noun". */
export function posClassName(partOfSpeech: string): string {
  const key = partOfSpeech
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return key ? `pos pos--${key}` : "pos";
}

/** Short label shown inside POS pills across bubble and popup. */
export function posDisplayLabel(partOfSpeech: string): string {
  const key = partOfSpeech
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "");
  switch (key) {
    case "noun":
    case "n":
      return "noun";
    case "verb":
    case "v":
      return "verb";
    case "adjective":
    case "adj":
    case "a":
      return "adj";
    case "adverb":
    case "adv":
      return "adv";
    case "preposition":
    case "prep":
      return "prep";
    case "conjunction":
    case "conj":
      return "conj";
    case "pronoun":
    case "pron":
      return "pron";
    case "interjection":
    case "intj":
      return "intj";
    case "determiner":
    case "det":
      return "det";
    default:
      return key || partOfSpeech.toLowerCase();
  }
}

import { createReportIcon, createReportDoneIcon } from "./ui-icons.ts";

export function markReportButtonDone(btn: HTMLButtonElement): void {
  btn.classList.add("report-btn--done");
  btn.disabled = true;
  btn.title = "Reported — thank you";
  btn.setAttribute("aria-label", "Reported — thank you");
  btn.replaceChildren(createReportDoneIcon());
}

export function createReportIconButton(
  onReport: (btn: HTMLButtonElement) => void,
): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "icon-btn report-btn";
  btn.title = "Report broken word";
  btn.setAttribute("aria-label", "Report broken word");
  btn.append(createReportIcon());
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    onReport(btn);
  });
  return btn;
}

export function createPosSpan(partOfSpeech: string): HTMLSpanElement {
  const span = document.createElement("span");
  span.className = posClassName(partOfSpeech);
  span.textContent = posDisplayLabel(partOfSpeech);
  return span;
}
