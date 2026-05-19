import type { DictionaryLanguageId } from "./languages.js";
import { createReportIconButton } from "./pos.js";
import { createSpeakButton } from "./pronounce.js";

export interface HeadwordHeaderOptions {
  word: string;
  language: DictionaryLanguageId;
  phonetic?: string;
  audioUrl?: string;
  headerClass: "card-header" | "result-header";
  headTag: "p" | "h2";
  headClass: "headword" | "result-head";
  onReport: (btn: HTMLButtonElement) => void;
}

export function createHeadwordHeader(options: HeadwordHeaderOptions): HTMLDivElement {
  const header = document.createElement("div");
  header.className = options.headerClass;

  const block = document.createElement("div");
  block.className = "headword-block";

  const head = document.createElement(options.headTag);
  head.className = options.headClass;
  head.textContent = options.word;
  block.append(head);

  if (options.phonetic) {
    const phonetic = document.createElement("p");
    phonetic.className = "phonetic";
    phonetic.textContent = options.phonetic;
    block.append(phonetic);
  }

  const actions = document.createElement("div");
  actions.className = "header-actions";
  actions.append(
    createSpeakButton(options.word, options.language, options.audioUrl),
    createReportIconButton(options.onReport),
  );

  header.append(block, actions);
  return header;
}
