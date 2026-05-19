/**
 * Inline UI icons — same open-book motif as assets/icons/icon.svg (scaled to 24×24).
 */

const BOOK_24 = `<path fill="currentColor" d="M6 5h5a4 4 0 0 1 4 4v10H10a4 4 0 0 1-4-4V5zm7 0h5v10a4 4 0 0 1-4 4h-1V9a4 4 0 0 0-4-4z"/><path fill="currentColor" fill-opacity="0.35" d="M11.25 5h1.5v14h-1.5z"/>`;

function icon24(inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">${inner}</svg>`;
}

/** Open book (toolbar-sized). */
export const BOOK_ICON_SVG = icon24(BOOK_24);

/** Book + sound waves. */
export const SPEAK_ICON_SVG = icon24(
  `${BOOK_24}<path fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" d="M19 9.5a3 3 0 0 1 0 5M21.5 7a5.5 5.5 0 0 1 0 10"/>`,
);

/** Book + alert badge for “report broken word”. */
export const REPORT_ICON_SVG = icon24(
  `${BOOK_24}<path fill="currentColor" d="M17.25 13.5a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0zm.375 2.25h1.5l-.5 4.5-1.75.75-.75-3.75h1.5z"/>`,
);
