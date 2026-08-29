# Dictionary on Click

Browser extension for **Firefox** and **Chrome**: double-click any word for a definition bubble, or use the toolbar dictionary for full entries. Built for reliability with free, keyless APIs (Wiktionary, Free Dictionary API, Datamuse).

Website: [dictionary-on-click.bishwodahal.com](https://dictionary-on-click.bishwodahal.com)

Try it at: [Firefox](https://addons.mozilla.org/en-US/firefox/addon/dictionary-on-click/) · [Chrome](https://chromewebstore.google.com/detail/dictionary-on-click/hmjpafbglgihbbfamlljmcempfhfchjm)

## Status

**v0.2.0**: optional translations and synonyms/antonyms (beta), faster lookups, and a scroll-friendlier definition bubble.

```bash
npm run ci    # test + build (Firefox + Chrome) + lint
npm start     # load in Firefox
```

## Requirements

- Node.js 20+
- ImageMagick 7 (`magick`) — optional; for icon regeneration
- Firefox 142+ or Chrome 120+

## Build from source

**Human-readable source** is in `src/` (TypeScript). **Built add-ons**:

| Browser | Output | Command |
|---------|--------|---------|
| Firefox | `dist/` | `npm run build` |
| Chrome | `dist-chrome/` | `npm run build:chrome` |
| Both | both folders | `npm run build:all` |

```bash
npm ci
npm run build:all
```

Full instructions: **[BUILD.md](./BUILD.md)**.

## Development

```bash
npm install
npm run build        # Firefox → dist/
npm run build:chrome # Chrome → dist-chrome/
npm test
npm start            # build + launch Firefox
npm run load         # build Firefox; prints path for manual install
```

### Load in Firefox

1. `npm run load`
2. `about:debugging` → **This Firefox** → **Load Temporary Add-on…** → `dist/manifest.json`

### Load in Chrome

1. `npm run build:chrome`
2. `chrome://extensions` → **Developer mode** → **Load unpacked** → select the `dist-chrome/` folder

### Package for stores

```bash
npm run package         # Firefox zip (web-ext)
npm run package:chrome  # Chrome zip → web-ext-artifacts/
```

## Project layout

```
src/
  background/     Service worker, lookup orchestration, providers
  content/        Double-click bubble, selection prefetch
  popup/          Toolbar dictionary UI
  options/        Settings, history, telemetry, reports
  shared/         Types, errors, languages, message protocol
dist/             Built Firefox extension (gitignored)
dist-chrome/      Built Chrome extension (gitignored)
```

## Privacy

- No remote telemetry in v1 (local stats only, later todo)
- Lookup history is opt-in and stored locally
- Offline support uses an IndexedDB cache of words you have already looked up (no bundled language packs)

## License

MPL-2.0 for extension code. Dictionary content from [Wiktionary](https://www.wiktionary.org/) (CC BY-SA) — attribution shown in the options page.
