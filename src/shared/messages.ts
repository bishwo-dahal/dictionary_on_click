import type { DictionaryLanguageId } from "./languages.js";
import type {
  BrokenWordReport,
  HistoryEntry,
  ProviderHealthInfo,
  TelemetrySnapshot,
} from "./telemetry-types.js";
import type { LookupResponse, LookupResult, Translation, UserSettings } from "./types.js";

export type { BrokenWordReport, HistoryEntry, ProviderHealthInfo, TelemetrySnapshot };

/** Messages sent from content scripts / popup / options to the background worker. */
export type BackgroundRequest =
  | {
      type: "lookup";
      word: string;
      language: DictionaryLanguageId;
      requestId: string;
      singleToken?: boolean;
    }
  | {
      type: "prefetch";
      word: string;
      language: DictionaryLanguageId;
      requestId: string;
      singleToken?: boolean;
    }
  | { type: "getSettings" }
  | { type: "saveSettings"; settings: Partial<UserSettings> }
  | { type: "getHistory" }
  | { type: "clearHistory" }
  | { type: "getTelemetry" }
  | { type: "getProviderHealth" }
  | { type: "clearTelemetry" }
  | { type: "recordPopupDismissal" }
  | { type: "getBrokenReports" }
  | { type: "clearBrokenReports" }
  | {
      type: "pronounce";
      word: string;
      language: DictionaryLanguageId;
      audioUrl?: string;
    }
  | { type: "ping" };

export type BackgroundResponse =
  | LookupResponse
  | { type: "settings"; settings: UserSettings }
  | { type: "history"; entries: HistoryEntry[] }
  | { type: "telemetry"; snapshot: TelemetrySnapshot }
  | { type: "providerHealth"; providers: ProviderHealthInfo[] }
  | { type: "brokenReports"; reports: BrokenWordReport[] }
  | { type: "pronunciationAudio"; buffer: ArrayBuffer; mime: string }
  | { type: "pronunciationTts" }
  | { type: "ok" }
  | { type: "pong" };

/** Background → UI push when translations/synonyms finish loading after the definition. */
export type LookupEnrichmentMessage = {
  type: "lookupEnrichment";
  requestId: string;
  translations: Translation[];
  synonyms: string[];
  antonyms: string[];
};

/** Background → UI push when a stale cached definition is refreshed. */
export type LookupRefreshMessage = {
  type: "lookupRefresh";
  requestId: string;
  result: LookupResult;
};

export function isLookupEnrichmentMessage(
  message: unknown,
): message is LookupEnrichmentMessage {
  return (
    typeof message === "object" &&
    message !== null &&
    (message as { type?: string }).type === "lookupEnrichment"
  );
}

export function isLookupRefreshMessage(
  message: unknown,
): message is LookupRefreshMessage {
  return (
    typeof message === "object" &&
    message !== null &&
    (message as { type?: string }).type === "lookupRefresh"
  );
}

export function isLookupResponse(
  response: BackgroundResponse,
): response is LookupResponse {
  return "ok" in response;
}
