import type { DictionaryLanguageId } from "./languages.js";
import type { LookupResponse, UserSettings } from "./types.js";

/** Messages sent from content scripts / popup / options to the background worker. */
export type BackgroundRequest =
  | { type: "lookup"; word: string; language: DictionaryLanguageId; requestId: string }
  | { type: "prefetch"; word: string; language: DictionaryLanguageId; requestId: string }
  | { type: "getSettings" }
  | { type: "saveSettings"; settings: Partial<UserSettings> }
  | { type: "ping" };

export type BackgroundResponse =
  | LookupResponse
  | { type: "settings"; settings: UserSettings }
  | { type: "pong" };

export function isLookupResponse(
  response: BackgroundResponse,
): response is LookupResponse {
  return "ok" in response;
}
