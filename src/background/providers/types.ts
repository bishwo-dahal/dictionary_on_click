import type { DictionaryLanguageId, ProviderId } from "../../shared/languages.js";
import type { LookupErrorCode } from "../../shared/errors.js";
import type { LookupResult } from "../../shared/types.js";

export type ProviderOutcome =
  | { kind: "hit"; result: LookupResult }
  | { kind: "miss" }
  | {
      kind: "error";
      code: LookupErrorCode;
      retryable: boolean;
    };

export interface LookupProvider {
  readonly id: ProviderId;
  lookup(
    word: string,
    language: DictionaryLanguageId,
    signal: AbortSignal,
  ): Promise<ProviderOutcome>;
}
