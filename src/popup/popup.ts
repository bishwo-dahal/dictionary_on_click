import {
  defaultTranslationTarget,
  getLanguageLabel,
  LANGUAGES,
  shouldFetchTranslations,
} from "../shared/languages.js";
import type { DictionaryLanguageId } from "../shared/languages.js";
import type { BackgroundRequest, BackgroundResponse } from "../shared/messages.js";
import { isLookupEnrichmentMessage, isLookupRefreshMessage, isLookupResponse } from "../shared/messages.js";
import type { ThemeMode } from "../shared/theme.js";
import { watchTheme } from "../shared/theme-bind.js";
import { groupDefinitionsByPos } from "../shared/definition-display.js";
import { createHeadwordHeader } from "../shared/headword-header.js";
import { markReportButtonDone } from "../shared/pos.js";
import { createPosGroup } from "../shared/render-definitions.js";
import {
  createRelatedWordsSections,
  formatRelatedWordsForCopy,
} from "../shared/render-related-words.js";
import {
  createTranslationsSection,
  formatTranslationsForCopy,
} from "../shared/render-translations.js";
import type { LookupResult, UserSettings } from "../shared/types.js";

const REPORT_KEY = "brokenWordReports";
let activeRequestId: string | null = null;

const form = document.getElementById("lookup-form") as HTMLFormElement;
const wordInput = document.getElementById("word-input") as HTMLInputElement;
const languageSelect = document.getElementById(
  "language-select",
) as HTMLSelectElement;
const translationsEnabledCheck = document.getElementById(
  "translations-enabled",
) as HTMLInputElement;
const synonymsAntonymsEnabledCheck = document.getElementById(
  "synonyms-antonyms-enabled",
) as HTMLInputElement;
const targetLanguageSelect = document.getElementById(
  "target-language-select",
) as HTMLSelectElement;
const translationTargetLabel = document.getElementById(
  "translation-target-label",
) as HTMLLabelElement;
const resultEl = document.getElementById("result") as HTMLDivElement;
const openOptions = document.getElementById("open-options") as HTMLAnchorElement;
const themeSelect = document.getElementById("theme-select") as HTMLSelectElement;

function populateLanguages(): void {
  for (const lang of LANGUAGES) {
    const dictOpt = document.createElement("option");
    dictOpt.value = lang.id;
    dictOpt.textContent = lang.label;
    languageSelect.appendChild(dictOpt);

    const targetOpt = document.createElement("option");
    targetOpt.value = lang.id;
    targetOpt.textContent = lang.label;
    targetLanguageSelect.appendChild(targetOpt);
  }
}

function syncTranslationControls(enabled: boolean): void {
  translationTargetLabel.hidden = !enabled;
  targetLanguageSelect.disabled = !enabled;
}

function ensureTranslationTarget(
  dictionaryLanguage: DictionaryLanguageId,
  targetLanguage: DictionaryLanguageId,
): DictionaryLanguageId {
  if (!shouldFetchTranslations(dictionaryLanguage, targetLanguage)) {
    return defaultTranslationTarget(dictionaryLanguage);
  }
  return targetLanguage;
}

async function send(message: BackgroundRequest): Promise<BackgroundResponse> {
  return browser.runtime.sendMessage(message) as Promise<BackgroundResponse>;
}

function createDefinitionsBody(result: LookupResult): HTMLDivElement {
  const body = document.createElement("div");
  body.className = "definitions-body";

  for (const group of groupDefinitionsByPos(result.definitions)) {
    body.append(createPosGroup(group, { variant: "popup" }));
  }

  return body;
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
    const translationBlock = formatTranslationsForCopy(result.translations);
    const relatedBlock = formatRelatedWordsForCopy(result.synonyms, result.antonyms);
    void navigator.clipboard.writeText(`${result.word}\n\n${lines.join("\n\n")}${translationBlock}${relatedBlock}`);
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

  const header = createHeadwordHeader({
    word: result.word,
    language: result.language,
    phonetic: result.phonetic,
    audioUrl: result.audioUrl,
    headerClass: "result-header",
    headTag: "h2",
    headClass: "result-head",
    onReport: (btn) => {
      void queueReport(result.word, result.language);
      markReportButtonDone(btn);
    },
  });

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
    card.append(createDefinitionsBody(result));
    for (const section of createRelatedWordsSections(result.synonyms, result.antonyms)) {
      card.append(section);
    }
    if (result.translations.length > 0) {
      const translations = createTranslationsSection(
        result.translations,
        result.translations[0]!.language,
      );
      if (translations) {
        card.append(translations);
      }
    }
    card.append(createActions(result));
  }

  resultEl.append(card);
}

function applyEnrichment(
  synonyms: readonly string[],
  antonyms: readonly string[],
  translations: LookupResult["translations"],
): void {
  const card = resultEl.querySelector(".result-card");
  if (!card) {
    return;
  }

  for (const section of card.querySelectorAll(
    ".related-words-section, .translations-section",
  )) {
    section.remove();
  }

  const actions = card.querySelector(".result-actions");
  const fragment = document.createDocumentFragment();

  for (const section of createRelatedWordsSections(synonyms, antonyms)) {
    fragment.append(section);
  }

  if (translations.length > 0) {
    const block = createTranslationsSection(
      translations,
      translations[0]!.language,
    );
    if (block) {
      fragment.append(block);
    }
  }

  if (actions) {
    actions.before(fragment);
  } else {
    card.append(fragment);
  }
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

  const requestId = crypto.randomUUID();
  activeRequestId = requestId;

  const response = await send({
    type: "lookup",
    word,
    language: languageSelect.value as DictionaryLanguageId,
    requestId,
    singleToken: !word.includes(" "),
  });

  if (requestId !== activeRequestId) {
    return;
  }

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
  watchTheme(document.documentElement, async () => {
    const res = await send({ type: "getSettings" });
    if (res.type !== "settings") {
      return "system";
    }
    return res.settings.theme;
  });

  const response = await send({ type: "getSettings" });
  if (response.type === "settings") {
    languageSelect.value = response.settings.dictionaryLanguage;
    const targetLanguage = ensureTranslationTarget(
      response.settings.dictionaryLanguage,
      response.settings.targetLanguage,
    );
    targetLanguageSelect.value = targetLanguage;
    translationsEnabledCheck.checked = response.settings.translationsEnabled;
    synonymsAntonymsEnabledCheck.checked = response.settings.synonymsAntonymsEnabled;
    themeSelect.value = response.settings.theme;
    syncTranslationControls(response.settings.translationsEnabled);
    if (targetLanguage !== response.settings.targetLanguage) {
      void send({
        type: "saveSettings",
        settings: { targetLanguage },
      });
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    void runLookup();
  });

  browser.runtime.onMessage.addListener((message: unknown) => {
    if (
      !isLookupEnrichmentMessage(message) &&
      !isLookupRefreshMessage(message)
    ) {
      return;
    }
    if (message.requestId !== activeRequestId) {
      return;
    }
    if (isLookupEnrichmentMessage(message)) {
      applyEnrichment(message.synonyms, message.antonyms, message.translations);
      return;
    }
    renderSuccess(message.result);
  });

  languageSelect.addEventListener("change", () => {
    const dictionaryLanguage = languageSelect.value as DictionaryLanguageId;
    const settings: Partial<UserSettings> = { dictionaryLanguage };
    if (translationsEnabledCheck.checked) {
      const targetLanguage = ensureTranslationTarget(
        dictionaryLanguage,
        targetLanguageSelect.value as DictionaryLanguageId,
      );
      if (targetLanguage !== targetLanguageSelect.value) {
        targetLanguageSelect.value = targetLanguage;
        settings.targetLanguage = targetLanguage;
      }
    }
    void send({
      type: "saveSettings",
      settings,
    });
  });

  translationsEnabledCheck.addEventListener("change", () => {
    const enabled = translationsEnabledCheck.checked;
    syncTranslationControls(enabled);
    const settings: Partial<UserSettings> = { translationsEnabled: enabled };
    if (enabled) {
      const targetLanguage = ensureTranslationTarget(
        languageSelect.value as DictionaryLanguageId,
        targetLanguageSelect.value as DictionaryLanguageId,
      );
      if (targetLanguage !== targetLanguageSelect.value) {
        targetLanguageSelect.value = targetLanguage;
        settings.targetLanguage = targetLanguage;
      }
    }
    void send({
      type: "saveSettings",
      settings,
    });
  });

  synonymsAntonymsEnabledCheck.addEventListener("change", () => {
    void send({
      type: "saveSettings",
      settings: { synonymsAntonymsEnabled: synonymsAntonymsEnabledCheck.checked },
    });
  });

  targetLanguageSelect.addEventListener("change", () => {
    void send({
      type: "saveSettings",
      settings: {
        targetLanguage: targetLanguageSelect.value as DictionaryLanguageId,
      },
    });
  });

  themeSelect.addEventListener("change", () => {
    void send({
      type: "saveSettings",
      settings: { theme: themeSelect.value as ThemeMode },
    });
  });

  openOptions.addEventListener("click", (e) => {
    e.preventDefault();
    void browser.runtime.openOptionsPage();
  });

  wordInput.focus();
}

void init();
