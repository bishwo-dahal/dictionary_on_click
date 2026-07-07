/** Part-of-speech (POS) badges + icon buttons (bubble shadow DOM + appended to popup.css at build). */
export const POS_AND_ICON_STYLES = `
.pos {
  display: inline-block;
  margin-right: 6px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 700;
  font-style: normal;
  letter-spacing: 0.03em;
  text-transform: lowercase;
  border-radius: 4px;
  vertical-align: baseline;
  color: #2563eb;
  background: #eff6ff;
}

.pos--noun, .pos--n { color: #1d4ed8; background: #dbeafe; }
.pos--verb, .pos--v { color: #15803d; background: #dcfce7; }
.pos--adjective, .pos--adj, .pos--a { color: #7e22ce; background: #f3e8ff; }
.pos--adverb, .pos--adv { color: #c2410c; background: #ffedd5; }
.pos--pronoun, .pos--pron { color: #0e7490; background: #cffafe; }
.pos--preposition, .pos--prep { color: #a16207; background: #fef9c3; }
.pos--conjunction, .pos--conj { color: #be185d; background: #fce7f3; }
.pos--interjection, .pos--intj { color: #b45309; background: #fef3c7; }

[data-theme="dark"] .pos {
  color: #93c5fd;
  background: #1e3a8a;
}
[data-theme="dark"] .pos--noun,
[data-theme="dark"] .pos--n {
  color: #93c5fd;
  background: #1e3a5f;
}
[data-theme="dark"] .pos--verb,
[data-theme="dark"] .pos--v {
  color: #86efac;
  background: #14532d;
}
[data-theme="dark"] .pos--adjective,
[data-theme="dark"] .pos--adj,
[data-theme="dark"] .pos--a {
  color: #d8b4fe;
  background: #581c87;
}
[data-theme="dark"] .pos--adverb,
[data-theme="dark"] .pos--adv {
  color: #fdba74;
  background: #7c2d12;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  margin: 0;
  padding: 0;
  font: inherit;
  line-height: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: color-mix(in srgb, currentColor 45%, transparent);
  cursor: pointer;
  transition: color 0.12s ease, background 0.12s ease;
}

.icon-btn svg {
  display: block;
  flex-shrink: 0;
}

.icon-btn:hover {
  color: currentColor;
  background: color-mix(in srgb, currentColor 10%, transparent);
}

.icon-btn:focus-visible {
  outline: 2px solid color-mix(in srgb, currentColor 40%, transparent);
  outline-offset: 2px;
}

.icon-btn:disabled {
  cursor: default;
}

.icon-btn.report-btn--done {
  color: #16a34a;
  background: color-mix(in srgb, #16a34a 12%, transparent);
}

[data-theme="dark"] .icon-btn.report-btn--done {
  color: #4ade80;
  background: color-mix(in srgb, #4ade80 14%, transparent);
}

.card-header, .result-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.headword-block {
  flex: 1;
  min-width: 0;
}

.card-header .headword, .result-header .result-head {
  margin: 0;
}

.phonetic {
  margin: 3px 0 0;
  font-size: 12px;
  line-height: 1.35;
  color: color-mix(in srgb, currentColor 55%, transparent);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.icon-btn.speak-btn--active {
  color: #2563eb;
  background: color-mix(in srgb, #2563eb 14%, transparent);
}

[data-theme="dark"] .icon-btn.speak-btn--active {
  color: #60a5fa;
  background: color-mix(in srgb, #60a5fa 16%, transparent);
}

.gloss-line {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: 0 0 8px;
  font-size: 13px;
  line-height: 1.5;
}
.gloss-line:last-of-type { margin-bottom: 10px; }
.gloss-line .pos {
  flex-shrink: 0;
  margin-right: 0;
}
.gloss-text {
  flex: 1;
  min-width: 0;
}
.gloss-text--clamp {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.gloss-list {
  margin: 0 0 10px;
}

.gloss-list--expandable {
  max-height: 220px;
  overflow-y: auto;
  padding-right: 2px;
}

.pos-group {
  margin: 0 0 10px;
}

.pos-group:last-child {
  margin-bottom: 10px;
}

.pos-group--flat .gloss-line:last-of-type {
  margin-bottom: 8px;
}

.pos-group-head {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: color-mix(in srgb, currentColor 55%, transparent);
}

.def-item .pos {
  display: inline-block;
  margin-right: 6px;
  margin-bottom: 0;
  vertical-align: baseline;
}

.card-header .headword { margin: 0; }
`;
