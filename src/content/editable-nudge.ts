/** How many times to offer turning off editor lookups. */
export const EDITABLE_NUDGE_MAX = 3;

export const EDITABLE_NUDGE_COUNT_KEY = "editableLookupNudgeCount";

/** Show the note while the user has seen it fewer than EDITABLE_NUDGE_MAX times. */
export function shouldShowEditableNudge(count: number): boolean {
  return Number.isFinite(count) && count >= 0 && count < EDITABLE_NUDGE_MAX;
}

export async function getEditableNudgeCount(): Promise<number> {
  const stored = await browser.storage.local.get(EDITABLE_NUDGE_COUNT_KEY);
  const n = stored[EDITABLE_NUDGE_COUNT_KEY];
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0) {
    return 0;
  }
  return Math.min(Math.floor(n), EDITABLE_NUDGE_MAX);
}

/** Record that the nudge was shown once (up to EDITABLE_NUDGE_MAX). */
export async function incrementEditableNudgeCount(): Promise<number> {
  const current = await getEditableNudgeCount();
  const next = Math.min(current + 1, EDITABLE_NUDGE_MAX);
  await browser.storage.local.set({ [EDITABLE_NUDGE_COUNT_KEY]: next });
  return next;
}

/** Turn off / Options change: never show the note again. */
export async function dismissEditableNudgeForever(): Promise<void> {
  await browser.storage.local.set({
    [EDITABLE_NUDGE_COUNT_KEY]: EDITABLE_NUDGE_MAX,
  });
}
