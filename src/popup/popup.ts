import { LANGUAGES, getLanguageLabel } from "../shared/languages.js";
import type { BackgroundRequest, BackgroundResponse } from "../shared/messages.js";
import { isLookupResponse } from "../shared/messages.js";
import { formatDefinition } from "../shared/render.js";
import type { DictionaryLanguageId } from "../shared/languages.js";
import type { LookupResult } from "../shared/types.js";

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

function renderSuccess(result: LookupResult): void {
  resultEl.className = "result";
  resultEl.replaceChildren();

  const head = document.createElement("h2");
  head.className = "result-head";
  head.textContent = result.word;

  const meta = document.createElement("p");
  meta.className = "result-meta";
  const parts = [getLanguageLabel(result.language), result.provider];
  if (result.stale) {
    parts.push("cached");
  }
  if (result.partial) {
    parts.push("partial");
  }
  meta.textContent = parts.join(" · ");

  const list = document.createElement("ol");
  list.className = "def-list";
  for (const def of result.definitions) {
    const li = document.createElement("li");
    li.textContent = formatDefinition(def);
    list.appendChild(li);
  }

  if (result.definitions.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "No definition text available.";
    resultEl.append(head, meta, empty);
    return;
  }

  const actions = document.createElement("div");
  actions.className = "result-actions";

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.textContent = "Copy";
  copyBtn.addEventListener("click", () => {
    const text = result.definitions.map((d) => formatDefinition(d)).join("\n");
    void navigator.clipboard.writeText(`${result.word}\n${text}`);
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
  resultEl.append(head, meta, list, actions);
}

function renderError(message: string, word: string): void {
  resultEl.className = "result result--error";
  resultEl.replaceChildren();
  const head = document.createElement("h2");
  head.className = "result-head";
  head.textContent = word;
  const p = document.createElement("p");
  p.textContent = message;
  resultEl.append(head, p);
}

async function runLookup(): Promise<void> {
  const word = wordInput.value.trim();
  if (!word) {
    return;
  }

  resultEl.className = "result result--muted";
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
