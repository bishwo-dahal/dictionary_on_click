import type { BackgroundRequest, BackgroundResponse } from "../shared/messages.js";
import {
  DEFAULT_SETTINGS,
  type LookupFailure,
  type UserSettings,
} from "../shared/types.js";
import { formatErrorMessage } from "../shared/errors.js";
import { getLanguageLabel } from "../shared/languages.js";

const SETTINGS_KEY = "userSettings";

async function loadSettings(): Promise<UserSettings> {
  const stored = await browser.storage.sync.get(SETTINGS_KEY);
  const raw = stored[SETTINGS_KEY] as Partial<UserSettings> | undefined;
  return { ...DEFAULT_SETTINGS, ...raw };
}

async function saveSettings(partial: Partial<UserSettings>): Promise<UserSettings> {
  const current = await loadSettings();
  const next = { ...current, ...partial };
  await browser.storage.sync.set({ [SETTINGS_KEY]: next });
  return next;
}

function notImplementedFailure(
  word: string,
  language: UserSettings["dictionaryLanguage"],
): LookupFailure {
  return {
    ok: false,
    code: "API_ERROR",
    message: formatErrorMessage("API_ERROR", {
      word,
      languageLabel: getLanguageLabel(language),
    }),
    word,
    language,
    retryable: true,
  };
}

browser.runtime.onMessage.addListener(
  (message: BackgroundRequest, _sender): Promise<BackgroundResponse> => {
    return handleMessage(message);
  },
);

async function handleMessage(message: BackgroundRequest): Promise<BackgroundResponse> {
  switch (message.type) {
    case "ping":
      return { type: "pong" };

    case "getSettings": {
      const settings = await loadSettings();
      return { type: "settings", settings };
    }

    case "saveSettings": {
      const settings = await saveSettings(message.settings);
      return { type: "settings", settings };
    }

    case "lookup":
    case "prefetch": {
      const settings = await loadSettings();
      const language = message.language ?? settings.dictionaryLanguage;
      // LookupOrchestrator wired in todo 2
      return notImplementedFailure(message.word, language);
    }

    default: {
      const _exhaustive: never = message;
      return _exhaustive;
    }
  }
}

console.info("[Dictionary on Click] background service worker ready");
