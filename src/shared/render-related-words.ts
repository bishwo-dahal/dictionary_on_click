/** Render synonym/antonym blocks as comma-separated lines. */
export function createRelatedWordsSections(
  synonyms: readonly string[],
  antonyms: readonly string[],
): HTMLElement[] {
  const sections: HTMLElement[] = [];

  if (synonyms.length > 0) {
    sections.push(createRelatedSection("Synonyms", synonyms));
  }
  if (antonyms.length > 0) {
    sections.push(createRelatedSection("Antonyms", antonyms));
  }

  return sections;
}

function createRelatedSection(label: string, words: readonly string[]): HTMLElement {
  const section = document.createElement("section");
  section.className = "related-words-section";

  const head = document.createElement("h3");
  head.className = "related-words-head";
  head.textContent = label;

  const body = document.createElement("p");
  body.className = "related-words-body";
  body.textContent = words.join(", ");

  section.append(head, body);
  return section;
}

/** Plain-text block for clipboard copy. */
export function formatRelatedWordsForCopy(
  synonyms: readonly string[],
  antonyms: readonly string[],
): string {
  const lines: string[] = [];
  if (synonyms.length > 0) {
    lines.push(`\n\nSynonyms: ${synonyms.join(", ")}`);
  }
  if (antonyms.length > 0) {
    lines.push(`\nAntonyms: ${antonyms.join(", ")}`);
  }
  return lines.join("");
}
