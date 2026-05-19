# Dictionary on Click

Firefox extension: double-click any word for a definition bubble, or use the toolbar dictionary for full entries. Built for reliability with free, keyless APIs (Wiktionary, Free Dictionary API, Datamuse).

## Status

**v0.1.0** — feature-complete MVP: double-click bubble, toolbar dictionary, provider health circuit breakers, options (history, telemetry, reports), and multi-provider lookups with IndexedDB cache.

```bash
npm run ci    # test + build + lint
npm start     # load in Firefox
```

## Requirements

- Node.js 20+
- ImageMagick 7 (`magick`) — for icon generation
- Firefox 140+ (see `manifest.json` `strict_min_version`)

## Build from source (AMO / reviewers)

**Human-readable source** is in `src/` (TypeScript). **Built add-on** is in `dist/` after:

```bash
npm ci
npm run build
```

Full step-by-step instructions, tool versions, and environment requirements: **[BUILD.md](./BUILD.md)**.

## Development

```bash
npm install
npm run build    # output → dist/
npm test
npm start        # build + launch Firefox with extension loaded (temp profile copy)
npm run load     # build only; prints path for manual install
```

### Extension not showing?

1. **Confirm it loaded:** open `about:debugging` → **This Firefox** — you should see “Dictionary on Click”.
2. **Pin the icon:** click the puzzle piece in the toolbar → pin “Dictionary on Click”.
3. **If `npm start` fails with `ECONNREFUSED`:** use manual load instead:
   - `npm run load`
   - Firefox → `about:debugging` → **This Firefox** → **Load Temporary Add-on…** → choose `dist/manifest.json`

Do **not** use `--keep-profile-changes` with `web-ext` on Fedora — Firefox opens but the debugger connection often never completes, so the extension is never installed.
```

For watch mode during development:

```bash
npm run watch    # rebuild on file changes
# In another terminal, run web-ext against dist/
```

## Project layout

```
src/
  background/     Service worker, lookup orchestration, providers
  content/        Double-click bubble, selection prefetch
  popup/          Toolbar dictionary UI
  options/        Settings, history, telemetry, reports
  shared/         Types, errors, languages, message protocol
dist/             Built extension (gitignored)
```

## Privacy

- No remote telemetry in v1 (local stats only, later todo)
- Lookup history is opt-in and stored locally
- Offline support uses an IndexedDB cache of words you have already looked up (no bundled language packs)

## License

MPL-2.0 for extension code. Dictionary content from [Wiktionary](https://www.wiktionary.org/) (CC BY-SA) — attribution shown in the options page.
