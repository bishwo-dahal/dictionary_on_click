import type { BackgroundRequest, BackgroundResponse } from "../shared/messages.js";
import type { BrokenWordReport } from "../shared/telemetry-types.js";
import { DEFAULT_SETTINGS, type UserSettings } from "../shared/types.js";
import { addHistoryEntry, clearHistory, getHistory } from "./history.js";
import { getLookupOrchestrator } from "./lookup-orchestrator.js";
import { getProviderHealth } from "./health.js";
import {
  clearTelemetry,
  getTelemetry,
  recordLookupComplete,
  recordPopupDismissal,
  telemetryFailureRate,
} from "./telemetry.js";

const SETTINGS_KEY = "userSettings";
const REPORT_KEY = "brokenWordReports";
const orchestrator = getLookupOrchestrator();

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

async function getBrokenReports(): Promise<BrokenWordReport[]> {
  const stored = await browser.storage.local.get(REPORT_KEY);
  return (stored[REPORT_KEY] as BrokenWordReport[] | undefined) ?? [];
}

browser.runtime.onMessage.addListener(
  (message: BackgroundRequest, _sender): Promise<BackgroundResponse> => {
    return handleMessage(message);
  },
);

browser.runtime.onMessageExternal.addListener(
  (message: unknown, sender): Promise<unknown> => {
    return handleExternalMessage(message, sender);
  },
);

async function handleExternalMessage(
  message: unknown,
  sender: browser.runtime.MessageSender,
): Promise<unknown> {
  const settings = await loadSettings();
  if (!settings.allowExternalHistory) {
    throw new Error("External history access is disabled");
  }

  const senderId = sender.id ?? "";
  if (!settings.allowedExtensionIds.includes(senderId)) {
    throw new Error("Extension is not allowlisted");
  }

  if (
    typeof message === "object" &&
    message !== null &&
    (message as { type?: string }).type === "getHistory"
  ) {
    const entries = await getHistory();
    return { type: "history", entries };
  }

  if (
    typeof message === "object" &&
    message !== null &&
    (message as { type?: string }).type === "getHistorySince"
  ) {
    const since = (message as { since?: number }).since ?? 0;
    const entries = (await getHistory()).filter((e) => e.timestamp >= since);
    return { type: "history", entries };
  }

  throw new Error("Unknown external message type");
}

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

    case "getHistory":
      return { type: "history", entries: await getHistory() };

    case "clearHistory":
      await clearHistory();
      return { type: "ok" };

    case "getTelemetry":
      return { type: "telemetry", snapshot: await getTelemetry() };

    case "getProviderHealth":
      return { type: "providerHealth", providers: getProviderHealth() };

    case "clearTelemetry":
      await clearTelemetry();
      return { type: "ok" };

    case "recordPopupDismissal":
      await recordPopupDismissal();
      return { type: "ok" };

    case "getBrokenReports":
      return { type: "brokenReports", reports: await getBrokenReports() };

    case "clearBrokenReports":
      await browser.storage.local.remove(REPORT_KEY);
      return { type: "ok" };

    case "lookup":
    case "prefetch": {
      const settings = await loadSettings();
      const language = message.language ?? settings.dictionaryLanguage;
      const start = performance.now();

      const response = await orchestrator.lookup({
        word: message.word,
        language,
        requestId: message.requestId,
        prefetch: message.type === "prefetch",
        singleToken: message.singleToken,
      });

      const durationMs = performance.now() - start;

      if (message.type !== "prefetch") {
        if (response.ok) {
          await recordLookupComplete({
            success: true,
            durationMs,
            fromCache: response.result.provider === "cache",
            provider: response.result.provider,
          });
          if (settings.saveHistory) {
            await addHistoryEntry(response.result);
          }
        } else if (response.code !== "CANCELLED") {
          await recordLookupComplete({
            success: false,
            durationMs,
            code: response.code,
          });
        }
      }

      return response;
    }

    default: {
      const _exhaustive: never = message;
      return _exhaustive;
    }
  }
}

void getTelemetry().then((snap) => {
  const rate = telemetryFailureRate(snap);
  if (rate > 0.2 && snap.lookups >= 10) {
    console.warn(
      `[Dictionary on Click] High lookup failure rate: ${(rate * 100).toFixed(0)}%`,
    );
  }
});

console.info("[Dictionary on Click] background service worker ready");
