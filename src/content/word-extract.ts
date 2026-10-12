const WORD_CHAR = /[\p{L}\p{M}][\p{L}\p{M}\p{N}'-]*/u;
const WORD_EDGE = /[\p{L}\p{M}\p{N}'-]/u;

/** True for inputs, textareas, selects, and contenteditable regions. */
export function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el?.closest) {
    return false;
  }
  return !!el.closest(
    'input, textarea, select, option, [contenteditable=""], [contenteditable="true"]',
  );
}

/** Password fields are never looked up. */
export function isPasswordInput(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el?.closest) {
    return false;
  }
  const input = el.closest("input");
  return input instanceof HTMLInputElement && input.type === "password";
}

/** Selects are editable for forms but not useful for word lookup. */
export function isSelectTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el?.closest) {
    return false;
  }
  return !!el.closest("select, option");
}

/**
 * Word from a plain text control value and selection range
 * (input/textarea after double-click).
 */
export function wordFromTextControl(
  value: string,
  selectionStart: number | null,
  selectionEnd: number | null,
): string {
  if (selectionStart == null || selectionEnd == null) {
    return "";
  }

  if (selectionEnd > selectionStart) {
    const selected = value.slice(selectionStart, selectionEnd).trim();
    if (selected && WORD_CHAR.test(selected) && !/\s/.test(selected)) {
      return selected.match(WORD_CHAR)?.[0] ?? selected;
    }
  }

  return wordAtOffsetInText(value, selectionStart);
}

/** Extract word around an offset in a plain string (for tests and text nodes). */
export function wordAtOffsetInText(text: string, offset: number): string {
  if (!text) {
    return "";
  }

  let start = offset;
  let end = offset;

  if (start > text.length) {
    start = text.length;
  }
  if (end > text.length) {
    end = text.length;
  }

  while (start > 0 && WORD_EDGE.test(text[start - 1]!)) {
    start--;
  }
  while (end < text.length && WORD_EDGE.test(text[end]!)) {
    end++;
  }

  return text.slice(start, end).trim();
}

function wordFromTextNode(node: Text, offset: number): string {
  return wordAtOffsetInText(node.data, offset);
}

/** Expand a DOM range to the word under the caret. */
export function wordFromRange(range: Range): string {
  const node = range.startContainer;
  if (node.nodeType === Node.TEXT_NODE) {
    return wordFromTextNode(node as Text, range.startOffset);
  }
  return "";
}

/** Get the word at viewport coordinates (double-click). */
export function wordAtPoint(clientX: number, clientY: number): string {
  if (typeof document.caretRangeFromPoint === "function") {
    const range = document.caretRangeFromPoint(clientX, clientY);
    if (range) {
      const word = wordFromRange(range);
      if (word) {
        return word;
      }
    }
  }

  if (typeof (document as Document & { caretPositionFromPoint?: (x: number, y: number) => CaretPosition | null }).caretPositionFromPoint === "function") {
    const pos = (
      document as Document & {
        caretPositionFromPoint: (x: number, y: number) => CaretPosition | null;
      }
    ).caretPositionFromPoint(clientX, clientY);
    if (pos?.offsetNode?.nodeType === Node.TEXT_NODE) {
      return wordFromTextNode(pos.offsetNode as Text, pos.offset);
    }
  }

  return "";
}

/** Prefer selection after double-click, then caret position. */
export function wordFromDoubleClick(event: MouseEvent): string {
  const selection = window.getSelection()?.toString().trim() ?? "";
  if (selection && WORD_CHAR.test(selection) && !/\s/.test(selection)) {
    return selection.match(WORD_CHAR)?.[0] ?? selection;
  }

  return wordAtPoint(event.clientX, event.clientY);
}

/**
 * Word from a double-click inside an editable: input/textarea selection, else
 * the same selection/caret path used for page text.
 */
export function wordFromEditableDoubleClick(event: MouseEvent): string {
  if (isPasswordInput(event.target) || isSelectTarget(event.target)) {
    return "";
  }

  const el = event.target as HTMLElement | null;
  const control = el?.closest?.("input, textarea");
  if (
    control instanceof HTMLInputElement ||
    control instanceof HTMLTextAreaElement
  ) {
    return wordFromTextControl(
      control.value,
      control.selectionStart,
      control.selectionEnd,
    );
  }

  return wordFromDoubleClick(event);
}

export function selectionTextForPrefetch(): string | null {
  const text = window.getSelection()?.toString().trim() ?? "";
  if (!text || text.length > 120) {
    return null;
  }
  if (!WORD_CHAR.test(text)) {
    return null;
  }
  return text;
}
