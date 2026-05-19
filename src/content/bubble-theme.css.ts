/** Bubble card colors (shadow DOM — uses data-theme on .card). */
export const BUBBLE_THEME_CSS = `
.card[data-theme="light"] {
  color-scheme: light;
  --bubble-bg: #ffffff;
  --bubble-fg: #0f172a;
  --bubble-border: #e2e8f0;
  --bubble-muted: #64748b;
  --bubble-btn-bg: #f1f5f9;
  --bubble-btn-border: #cbd5e1;
  --bubble-shadow: rgb(15 23 42 / 0.18);
}

.card[data-theme="dark"] {
  color-scheme: dark;
  --bubble-bg: #1e293b;
  --bubble-fg: #f1f5f9;
  --bubble-border: #334155;
  --bubble-muted: #94a3b8;
  --bubble-btn-bg: #334155;
  --bubble-btn-border: #475569;
  --bubble-shadow: rgb(0 0 0 / 0.45);
}
`;
