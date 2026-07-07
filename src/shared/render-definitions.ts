import type { PosGroup } from "./definition-display.js";
import { createPosSpan } from "./pos.js";
import type { Definition } from "./types.js";

export interface GlossLineOptions {
  /** Limit gloss text to two lines (collapsed bubble preview). */
  clamp?: boolean;
}

export interface PosGroupRenderOptions {
  clamp?: boolean;
  /** Show part-of-speech (POS) section header, e.g. "Verb". */
  showHeader?: boolean;
  variant?: "bubble" | "popup";
}

export interface DefinitionListItemOptions {
  showPos?: boolean;
}

/** Single meaning line for the double-click bubble. */
export function createGlossLine(
  partOfSpeech: string | undefined,
  text: string,
  options: GlossLineOptions = {},
): HTMLParagraphElement {
  const line = document.createElement("p");
  line.className = "gloss-line";

  if (partOfSpeech) {
    line.append(createPosSpan(partOfSpeech));
  }

  const span = document.createElement("span");
  span.className = options.clamp ? "gloss-text gloss-text--clamp" : "gloss-text";
  span.textContent = text;
  line.append(span);

  return line;
}

/** Container for bubble meaning lines (optionally scrollable when expanded). */
export function createGlossList(options?: { expandable?: boolean }): HTMLDivElement {
  const list = document.createElement("div");
  list.className = options?.expandable
    ? "gloss-list gloss-list--expandable"
    : "gloss-list";
  return list;
}

/** Append flat meaning lines (collapsed bubble summary). */
export function appendGlossLines(
  container: HTMLElement,
  definitions: readonly Definition[],
  options: GlossLineOptions = {},
): void {
  for (const def of definitions) {
    container.append(createGlossLine(def.partOfSpeech, def.text, options));
  }
}

/**
 * Render a part-of-speech (POS) group — expanded bubble or grouped popup.
 * Each meaning line includes the colored POS pill when `partOfSpeech` is set.
 */
export function createPosGroup(
  group: PosGroup,
  options: PosGroupRenderOptions = {},
): HTMLElement {
  const { clamp = false, showHeader = false, variant = "bubble" } = options;
  const container = document.createElement(showHeader ? "section" : "div");
  container.className = showHeader ? "pos-group" : "pos-group pos-group--flat";

  if (showHeader) {
    const head = document.createElement("h3");
    head.className = "pos-group-head";
    head.textContent = group.label;
    container.append(head);
  }

  if (variant === "popup") {
    const list = document.createElement("ol");
    list.className = "pos-group-list";
    for (const def of group.items) {
      const pos = def.partOfSpeech ?? (group.pos !== "other" ? group.label : undefined);
      list.append(createDefinitionListItem({ ...def, partOfSpeech: pos }, { showPos: true }));
    }
    container.append(list);
    return container;
  }

  for (const def of group.items) {
    const pos = def.partOfSpeech ?? (group.pos !== "other" ? group.label : undefined);
    container.append(createGlossLine(pos, def.text, { clamp }));
  }
  return container;
}

/** Single meaning row for the toolbar popup list (same inline pill + text as the bubble). */
export function createDefinitionListItem(
  def: Definition,
  options: DefinitionListItemOptions = {},
): HTMLLIElement {
  const { showPos = true } = options;
  const li = document.createElement("li");
  li.className = "def-item";

  const partOfSpeech = showPos ? def.partOfSpeech : undefined;
  li.append(createGlossLine(partOfSpeech, def.text));

  return li;
}

/** Toggle for hidden meanings in the collapsed bubble. */
export function createExpandMeaningsToggle(
  hiddenCount: number,
  expanded: boolean,
  onClick: () => void,
): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "expand-meanings-btn";
  btn.textContent = expanded
    ? "Show less"
    : `+ ${hiddenCount} more meaning${hiddenCount === 1 ? "" : "s"}`;
  btn.addEventListener("click", (event) => {
    event.stopPropagation();
    onClick();
  });
  return btn;
}
