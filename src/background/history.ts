import type { HistoryEntry } from "../shared/telemetry-types.js";
import type { LookupResult } from "../shared/types.js";

export type { HistoryEntry };

const HISTORY_KEY = "lookupHistory";
const MAX_ENTRIES = 5_000;

export async function getHistory(): Promise<HistoryEntry[]> {
  const stored = await browser.storage.local.get(HISTORY_KEY);
  return (stored[HISTORY_KEY] as HistoryEntry[] | undefined) ?? [];
}

export async function addHistoryEntry(result: LookupResult): Promise<void> {
  const snippet =
    result.definitions[0]?.text.slice(0, 200) ?? "(no definition text)";

  const entry: HistoryEntry = {
    timestamp: Date.now(),
    word: result.word,
    lemma: result.lemma,
    language: result.language,
    definitionSnippet: snippet,
    sourceUrl: result.sourceUrl,
    provider: result.provider,
  };

  const list = await getHistory();
  list.unshift(entry);
  const trimmed = list.slice(0, MAX_ENTRIES);
  await browser.storage.local.set({ [HISTORY_KEY]: trimmed });
}

export async function clearHistory(): Promise<void> {
  await browser.storage.local.remove(HISTORY_KEY);
}

export function historyToCsv(entries: HistoryEntry[]): string {
  const header = "timestamp,word,lemma,language,definitionSnippet,sourceUrl,provider";
  const rows = entries.map((e) =>
    [
      new Date(e.timestamp).toISOString(),
      csvEscape(e.word),
      csvEscape(e.lemma),
      csvEscape(e.language),
      csvEscape(e.definitionSnippet),
      csvEscape(e.sourceUrl),
      csvEscape(e.provider),
    ].join(","),
  );
  return [header, ...rows].join("\n");
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
