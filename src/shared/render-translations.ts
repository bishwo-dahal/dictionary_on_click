import type { Translation } from "./types.js";

/** Render a translations block, or null when there are no glosses. */
export function createTranslationsSection(
  translations: readonly Translation[],
  targetLabel: string,
): HTMLElement | null {
  if (translations.length === 0) {
    return null;
  }

  const section = document.createElement("section");
  section.className = "translations-section";

  const head = document.createElement("h3");
  head.className = "translations-head";
  head.textContent = `Translations (${targetLabel})`;

  const body = document.createElement("p");
  body.className = "translations-body";
  body.textContent = translations.map((item) => item.text).join(", ");

  section.append(head, body);
  return section;
}

/** Plain-text lines for clipboard copy. */
export function formatTranslationsForCopy(translations: readonly Translation[]): string {
  if (translations.length === 0) {
    return "";
  }
  return `\n\nTranslations: ${translations.map((t) => t.text).join(", ")}`;
}
