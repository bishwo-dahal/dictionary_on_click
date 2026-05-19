import { LANGUAGES, getLanguageLabel } from "../shared/languages.js";
import type { BackgroundRequest, BackgroundResponse } from "../shared/messages.js";
import { isLookupResponse } from "../shared/messages.js";
import type { DictionaryLanguageId } from "../shared/languages.js";
import {
  createPosSpan,
  createReportIconButton,
  markReportButtonDone,
} from "../shared/pos.js";
import type { Definition, LookupResult } from "../shared/types.js";

const REPORT_KEY = "brokenWordReports";

const form = document.getElementById("lookup-form") as HTMLFormElement;
const wordInput = document.getElementById("word-input") as HTMLInputElement;
const languageSelect = document.getElementById(
  "language-select",
) as HTMLSelectElement;
const resultEl = document.getElementById("result") as HTMLDivElement;
const openOptions = document.getElementById("open-options") as HTMLAnchorElement;

function populateLanguages(): void {
  for (const lang of LANGUAGES) {
    const opt = document.createElement("option");
    opt.value = lang.id;
    opt.textContent = lang.label;
    languageSelect.appendChild(opt);
  }
}

async function send(message: BackgroundRequest): Promise<BackgroundResponse> {
  return browser.runtime.sendMessage(message) as Promise<BackgroundResponse>;
}

function createDefItem(def: Definition): HTMLLIElement {
  const li = document.createElement("li");
  li.className = "def-item";

  if (def.partOfSpeech) {
    li.append(createPosSpan(def.partOfSpeech));
  }

  const text = document.createElement("p");
  text.className = "def-text";
  text.textContent = def.text;
  li.append(text);

  return li;
}

function createActions(result: LookupResult): HTMLDivElement {
  const actions = document.createElement("div");
  actions.className = "result-actions";

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.textContent = "Copy";
  copyBtn.addEventListener("click", () => {
    const lines = result.definitions.map((d) => {
      const pos = d.partOfSpeech ? `(${d.partOfSpeech}) ` : "";
      return `${pos}${d.text}`;
    });
    void navigator.clipboard.writeText(`${result.word}\n\n${lines.join("\n\n")}`);
    copyBtn.textContent = "Copied";
    window.setTimeout(() => {
      copyBtn.textContent = "Copy";
    }, 1500);
  });

  const wiki = document.createElement("a");
  wiki.className = "primary";
  wiki.href = result.sourceUrl;
  wiki.target = "_blank";
  wiki.rel = "noopener noreferrer";
  wiki.textContent = "Open in Wiktionary";

  actions.append(copyBtn, wiki);
  return actions;
}

async function queueReport(word: string, language: string): Promise<void> {
  const stored = await browser.storage.local.get(REPORT_KEY);
  const list =
    (stored[REPORT_KEY] as { timestamp: number; word: string; language: string }[] | undefined) ??
    [];
  list.push({ timestamp: Date.now(), word, language });
  await browser.storage.local.set({ [REPORT_KEY]: list.slice(-500) });
}

function renderSuccess(result: LookupResult): void {
  resultEl.className = "result";
  resultEl.replaceChildren();

  const card = document.createElement("div");
  card.className = "result-card";

  const header = document.createElement("div");
  header.className = "result-header";

  const head = document.createElement("h2");
  head.className = "result-head";
  head.textContent = result.word;
  header.append(head);

  header.append(
    createReportIconButton((btn) => {
      void queueReport(result.word, result.language);
      markReportButtonDone(btn);
    }),
  );

  const meta = document.createElement("p");
  meta.className = "result-meta";
  meta.textContent = `${getLanguageLabel(result.language)} · ${result.provider}`;
  if (result.stale) {
    const b = document.createElement("span");
    b.className = "badge";
    b.textContent = "cached";
    meta.append(b);
  } else if (result.partial) {
    const b = document.createElement("span");
    b.className = "badge";
    b.textContent = "partial";
    meta.append(b);
  }

  card.append(header, meta);

  if (result.definitions.length === 0) {
    const empty = document.createElement("p");
    empty.className = "result-empty";
    empty.textContent = "No definition text available.";
    card.append(empty);
  } else {
    const list = document.createElement("ol");
    list.className = "def-list";
    for (const def of result.definitions) {
      list.append(createDefItem(def));
    }
    card.append(list);
    card.append(createActions(result));
  }

  resultEl.append(card);
}

function renderError(message: string, word: string): void {
  resultEl.className = "result result--error";
  resultEl.replaceChildren();

  const card = document.createElement("div");
  card.className = "result-card";

  const head = document.createElement("h2");
  head.className = "result-head";
  head.textContent = word;

  const msg = document.createElement("p");
  msg.className = "result-error-msg";
  msg.textContent = message;

  card.append(head, msg);
  resultEl.append(card);
}

async function runLookup(): Promise<void> {
  const word = wordInput.value.trim();
  if (!word) {
    return;
  }

  resultEl.className = "result result--loading";
  resultEl.textContent = "Looking up…";

  const response = await send({
    type: "lookup",
    word,
    language: languageSelect.value as DictionaryLanguageId,
    requestId: crypto.randomUUID(),
    singleToken: !word.includes(" "),
  });

  if (!isLookupResponse(response)) {
    renderError("Unexpected response from extension.", word);
    return;
  }

  if (response.ok) {
    renderSuccess(response.result);
    return;
  }

  renderError(response.message, response.word);
}

async function init(): Promise<void> {
  populateLanguages();

  const response = await send({ type: "getSettings" });
  if (response.type === "settings") {
    languageSelect.value = response.settings.dictionaryLanguage;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    void runLookup();
  });

  languageSelect.addEventListener("change", () => {
    void send({
      type: "saveSettings",
      settings: {
        dictionaryLanguage: languageSelect.value as DictionaryLanguageId,
      },
    });
  });

  openOptions.addEventListener("click", (e) => {
    e.preventDefault();
    void browser.runtime.openOptionsPage();
  });

  wordInput.focus();
}

void init();
