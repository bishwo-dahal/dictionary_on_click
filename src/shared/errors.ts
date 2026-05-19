/** Specific failure reasons — never collapse into a generic "not found". */
export type LookupErrorCode =
  | "OFFLINE"
  | "TIMEOUT"
  | "RATE_LIMIT"
  | "API_ERROR"
  | "PARSE_ERROR"
  | "NOT_FOUND"
  | "CANCELLED";

export interface ErrorMessageParams {
  word: string;
  languageLabel: string;
}

const MESSAGES: Record<
  LookupErrorCode,
  (p: ErrorMessageParams) => string
> = {
  OFFLINE: () =>
    "You're offline. Look up this word again when you're connected.",
  TIMEOUT: () => "Dictionary is slow right now. Retrying…",
  RATE_LIMIT: () => "Too many lookups. Pausing briefly…",
  API_ERROR: () => "Dictionary service error. Trying backup…",
  PARSE_ERROR: () => "Couldn't read the response. Trying backup…",
  NOT_FOUND: (p) => `No entry for "${p.word}" in ${p.languageLabel}.`,
  CANCELLED: () => "",
};

export function isRetryable(code: LookupErrorCode): boolean {
  return (
    code === "TIMEOUT" ||
    code === "RATE_LIMIT" ||
    code === "API_ERROR" ||
    code === "PARSE_ERROR"
  );
}

export function formatErrorMessage(
  code: LookupErrorCode,
  params: ErrorMessageParams,
): string {
  return MESSAGES[code](params);
}
