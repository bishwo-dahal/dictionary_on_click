import { LANGUAGES } from "../shared/languages.js";
import type { BackgroundRequest } from "../shared/messages.js";
import type { DictionaryLanguageId } from "../shared/languages.js";
import type { UserSettings } from "../shared/types.js";

const dictSelect = document.getElementById(
  "dictionary-language",
) as HTMLSelectElement;
const targetSelect = document.getElementById(
  "target-language",
) as HTMLSelectElement;
const saveHistoryCheck = document.getElementById(
  "save-history",
) as HTMLInputElement;
const statusEl = document.getElementById("status") as HTMLParagraphElement;

function fillSelect(select: HTMLSelectElement): void {
  for (const lang of LANGUAGES) {
    const opt = document.createElement("option");
    opt.value = lang.id;
    opt.textContent = lang.label;
    select.appendChild(opt);
  }
}

async function load(): Promise<UserSettings> {
  const response = await browser.runtime.sendMessage({
    type: "getSettings",
  } satisfies BackgroundRequest);
  if (response.type !== "settings") {
    throw new Error("Expected settings response");
  }
  return response.settings;
}

async function save(partial: Partial<UserSettings>): Promise<void> {
  await browser.runtime.sendMessage({
    type: "saveSettings",
    settings: partial,
  } satisfies BackgroundRequest);
  statusEl.textContent = "Settings saved.";
  window.setTimeout(() => {
    statusEl.textContent = "";
  }, 2000);
}

function bindSelect(
  select: HTMLSelectElement,
  key: keyof Pick<UserSettings, "dictionaryLanguage" | "targetLanguage">,
): void {
  select.addEventListener("change", () => {
    void save({ [key]: select.value as DictionaryLanguageId });
  });
}

async function init(): Promise<void> {
  fillSelect(dictSelect);
  fillSelect(targetSelect);

  const settings = await load();
  dictSelect.value = settings.dictionaryLanguage;
  targetSelect.value = settings.targetLanguage;
  saveHistoryCheck.checked = settings.saveHistory;

  bindSelect(dictSelect, "dictionaryLanguage");
  bindSelect(targetSelect, "targetLanguage");

  saveHistoryCheck.addEventListener("change", () => {
    void save({ saveHistory: saveHistoryCheck.checked });
  });
}

void init();
