import { LANGUAGES } from "../shared/languages.js";
import type { BackgroundRequest, BackgroundResponse } from "../shared/messages.js";
import { isLookupResponse } from "../shared/messages.js";
import type { DictionaryLanguageId } from "../shared/languages.js";

const form = document.getElementById("lookup-form") as HTMLFormElement;
const wordInput = document.getElementById("word-input") as HTMLInputElement;
const languageSelect = document.getElementById(
  "language-select",
) as HTMLSelectElement;
const resultEl = document.getElementById("result") as HTMLDivElement;

function populateLanguages(): void {
  for (const lang of LANGUAGES) {
    const opt = document.createElement("option");
    opt.value = lang.id;
    opt.textContent = lang.label;
    languageSelect.appendChild(opt);
  }
}

async function send<T extends BackgroundResponse>(
  message: BackgroundRequest,
): Promise<T> {
  return browser.runtime.sendMessage(message) as Promise<T>;
}

async function init(): Promise<void> {
  populateLanguages();

  const { settings } = await send<{ type: "settings"; settings: { dictionaryLanguage: DictionaryLanguageId } }>({
    type: "getSettings",
  });
  languageSelect.value = settings.dictionaryLanguage;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    void runLookup();
  });
}

async function runLookup(): Promise<void> {
  const word = wordInput.value.trim();
  if (!word) {
    return;
  }

  resultEl.className = "result result--muted";
  resultEl.textContent = "Looking up…";

  const response = await send<BackgroundResponse>({
    type: "lookup",
    word,
    language: languageSelect.value as DictionaryLanguageId,
    requestId: crypto.randomUUID(),
  });

  if (isLookupResponse(response)) {
    if (response.ok) {
      resultEl.className = "result";
      const defs = response.result.definitions
        .slice(0, 3)
        .map((d) => d.text)
        .join(" · ");
      resultEl.textContent = defs || response.result.word;
    } else {
      resultEl.className = "result result--error";
      resultEl.textContent = response.message;
    }
    return;
  }

  resultEl.className = "result result--error";
  resultEl.textContent = "Unexpected response from extension.";
}

void init();
