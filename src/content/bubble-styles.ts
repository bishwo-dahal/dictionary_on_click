import { POS_AND_ICON_STYLES } from "../shared/pos-styles.js";

export const BUBBLE_STYLES = `
:host {
  all: initial;
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
  font-size: 14px;
  line-height: 1.45;
  color-scheme: light dark;
}

.card {
  box-sizing: border-box;
  max-width: 560px;
  min-width: 380px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, canvastext 18%, transparent);
  background: canvas;
  color: canvastext;
  box-shadow: 0 8px 28px color-mix(in srgb, canvastext 22%, transparent);
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
  opacity: 0.65;
}

.status {
  margin: 0;
  font-size: 13px;
  opacity: 0.75;
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
  border: 1px solid color-mix(in srgb, canvastext 20%, transparent);
  background: color-mix(in srgb, canvastext 6%, canvas);
  color: canvastext;
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
    color-mix(in srgb, canvastext 10%, transparent) 25%,
    color-mix(in srgb, canvastext 18%, transparent) 50%,
    color-mix(in srgb, canvastext 10%, transparent) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
}

@keyframes shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}
${POS_AND_ICON_STYLES}
`;
