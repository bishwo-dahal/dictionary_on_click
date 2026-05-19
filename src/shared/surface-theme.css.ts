/** Shared light/dark CSS variables for popup, options, and bubble. */
export const SURFACE_THEME_CSS = `
:root[data-theme="light"] {
  color-scheme: light;
  --bg: #f8fafc;
  --bg-elevated: #ffffff;
  --fg: #0f172a;
  --fg-muted: #64748b;
  --border: #e2e8f0;
  --accent: #2563eb;
  --accent-hover: #1d4ed8;
  --error: #b91c1c;
}

:root[data-theme="dark"] {
  color-scheme: dark;
  --bg: #0f172a;
  --bg-elevated: #1e293b;
  --fg: #f1f5f9;
  --fg-muted: #94a3b8;
  --border: #334155;
  --accent: #3b82f6;
  --accent-hover: #60a5fa;
  --error: #f87171;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
    --bg: #0f172a;
    --bg-elevated: #1e293b;
    --fg: #f1f5f9;
    --fg-muted: #94a3b8;
    --border: #334155;
    --accent: #3b82f6;
    --accent-hover: #60a5fa;
    --error: #f87171;
  }
}
`;
