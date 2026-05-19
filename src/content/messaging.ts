import type { BackgroundRequest, BackgroundResponse } from "../shared/messages.js";
import { isLookupResponse } from "../shared/messages.js";
import type { LookupResponse } from "../shared/types.js";
import type { DictionaryLanguageId } from "../shared/languages.js";
import type { UserSettings } from "../shared/types.js";

export async function getSettings(): Promise<UserSettings> {
  const response = (await browser.runtime.sendMessage({
    type: "getSettings",
  } satisfies BackgroundRequest)) as BackgroundResponse;

  if (response.type !== "settings") {
    throw new Error("Expected settings response");
  }
  return response.settings;
}

export async function lookupWord(
  word: string,
  language: DictionaryLanguageId,
  options: { prefetch?: boolean; singleToken?: boolean; requestId: string },
): Promise<LookupResponse | null> {
  const message: BackgroundRequest = options.prefetch
    ? {
        type: "prefetch",
        word,
        language,
        requestId: options.requestId,
        singleToken: options.singleToken,
      }
    : {
        type: "lookup",
        word,
        language,
        requestId: options.requestId,
        singleToken: options.singleToken,
      };

  const response = (await browser.runtime.sendMessage(message)) as BackgroundResponse;

  if (!isLookupResponse(response)) {
    return null;
  }

  if (!response.ok && response.code === "CANCELLED") {
    return null;
  }

  return response;
}
