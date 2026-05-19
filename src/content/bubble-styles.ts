import { BUBBLE_THEME_CSS } from "./bubble-theme.css.js";
import { POS_AND_ICON_STYLES } from "../shared/pos-styles.js";

export const BUBBLE_STYLES = `
:host {
  all: initial;
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
  font-size: 14px;
  line-height: 1.45;
}

.card {
  box-sizing: border-box;
  max-width: 560px;
  min-width: 380px;
  padding: 12px 14px;
  border-radius: 10px;
  --bubble-bg: #ffffff;
  --bubble-fg: #0f172a;
  --bubble-border: #e2e8f0;
  --bubble-muted: #64748b;
  --bubble-btn-bg: #f1f5f9;
  --bubble-btn-border: #cbd5e1;
  --bubble-shadow: rgb(15 23 42 / 0.18);
  border: 1px solid var(--bubble-border);
  background: var(--bubble-bg);
  color: var(--bubble-fg);
  box-shadow: 0 8px 28px var(--bubble-shadow);
  pointer-events: auto;
}

.headword {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 700;
}

.gloss {
  margin: 0 0 4px;
  font-size: 13px;
  opacity: 0.92;
}

.gloss:last-of-type {
  margin-bottom: 10px;
}

.meta {
  margin: 0 0 10px;
  font-size: 11px;
  color: var(--bubble-muted);
}

.status {
  margin: 0;
  font-size: 13px;
  color: var(--bubble-muted);
}

.status--error {
  color: #b91c1c;
  opacity: 1;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.actions button,
a.btn {
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  border-radius: 6px;
  padding: 5px 10px;
  text-decoration: none;
  border: 1px solid var(--bubble-btn-border);
  background: var(--bubble-btn-bg);
  color: var(--bubble-fg);
}

.actions button.primary,
a.btn.primary {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
}

.actions button:hover,
a.btn:hover {
  filter: brightness(1.05);
}

.skeleton {
  height: 12px;
  margin: 6px 0;
  border-radius: 4px;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--bubble-fg) 10%, transparent) 25%,
    color-mix(in srgb, var(--bubble-fg) 18%, transparent) 50%,
    color-mix(in srgb, var(--bubble-fg) 10%, transparent) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
}

@keyframes shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}
${BUBBLE_THEME_CSS}
${POS_AND_ICON_STYLES}
`;
