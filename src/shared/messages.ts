import type { DictionaryLanguageId } from "./languages.js";
import type {
  BrokenWordReport,
  HistoryEntry,
  ProviderHealthInfo,
  TelemetrySnapshot,
} from "./telemetry-types.js";
import type { LookupResponse, UserSettings } from "./types.js";

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

export function isLookupResponse(
  response: BackgroundResponse,
): response is LookupResponse {
  return "ok" in response;
}
