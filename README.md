# Dictionary on Click

Firefox extension: double-click any word for a definition bubble, or use the toolbar dictionary for full entries. Built for reliability with free, keyless APIs (Wiktionary, Free Dictionary API, Datamuse).

## Status

**v0.1.0** — double-click bubble, full toolbar dictionary, options (history CSV, local telemetry, broken-word reports), and multi-provider lookups with IndexedDB cache.

## Requirements

- Node.js 20+
- Firefox 120+

## Development

```bash
npm install
npm run build    # output → dist/
npm test
npm start        # build + launch Firefox with extension loaded (temp profile copy)
npm run load     # build only; prints path for manual install

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
  options/        Settings, history, telemetry (later todos)
  shared/         Types, errors, languages, message protocol
dist/             Built extension (gitignored)
```

## Privacy

- No remote telemetry in v1 (local stats only, later todo)
- Lookup history is opt-in and stored locally
- Offline support uses an IndexedDB cache of words you have already looked up (no bundled language packs)

## License

MPL-2.0 for extension code. Dictionary content from [Wiktionary](https://www.wiktionary.org/) (CC BY-SA) — attribution shown in the options page.
