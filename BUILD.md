# Build instructions (source review)

This document explains how to reproduce the **exact** built extension from human-readable source.

| Browser | Build command | Output folder | Store package |
|---------|---------------|---------------|---------------|
| Firefox | `npm run build` | `dist/` | `npm run package` |
| Chrome | `npm run build:chrome` | `dist-chrome/` | `npm run package:chrome` |
| Both | `npm run build:all` | both | — |

## Source vs. build output

| Human-readable source (review these) | Generated output (do not edit) |
|--------------------------------------|--------------------------------|
| `src/**/*.ts` — TypeScript source     | `dist/**/*.js` / `dist-chrome/**/*.js` — bundled JavaScript |
| `src/**/*.html`, `src/**/*.css`      | `dist/**/*.html`, `dist/**/*.css` (CSS partly concatenated at build time) |
| `manifest.base.json` + browser overlay | `dist*/manifest.json` (merged at build time) |
| `assets/icons/icon.svg`              | `assets/icons/icon-*.png` (rasterized), then copied to `dist*/assets/` |

Runtime dependency bundled into JS: **`webextension-polyfill`** (cross-browser `browser.*` API).

Third-party build tools (esbuild, TypeScript, test tools) are installed under `node_modules/` from `package-lock.json`. They are **not** included in the extension package.

## Operating system

The build was tested on **Linux**. It should work on any OS that supports:

- **Node.js 20 or newer**
- **npm 10 or newer** (bundled with Node 20+)
- **ImageMagick 7** (`magick` command) — optional; only needed when changing `assets/icons/icon.svg`

## Step-by-step build

From the **root of this repository**:

### 1. Install Node dependencies

```bash
npm ci
```

### 2. Run the build

```bash
# Firefox only
npm run build

# Chrome only
npm run build:chrome

# Both (CI default)
npm run build:all
```

That executes:

1. `node scripts/generate-icons.mjs` — rasterize SVG → PNG (or use committed PNGs)
2. `node scripts/build.mjs --browser=…` — merge manifest, bundle TypeScript with esbuild + polyfill inject, copy static assets

### 3. Confirm output

**Firefox** (`dist/`):

```text
dist/manifest.json    # background.scripts + gecko settings
dist/background.js
dist/content.js
...
```

**Chrome** (`dist-chrome/`):

```text
dist-chrome/manifest.json    # background.service_worker
dist-chrome/background.js
...
```

### 4. Optional: tests, lint, package

```bash
npm test
npm run lint              # Firefox manifest (web-ext)
npm run package           # Firefox .zip
npm run package:chrome    # Chrome .zip → web-ext-artifacts/
```

Submit **`dist/`** or **`dist-chrome/`** contents as the extension package — not `src/` or `node_modules/`.

## Manifest layout

- [`manifest.base.json`](manifest.base.json) — shared fields (permissions, content scripts, icons, …)
- [`manifest.firefox.json`](manifest.firefox.json) — `background.scripts`, `browser_specific_settings.gecko`
- [`manifest.chrome.json`](manifest.chrome.json) — `background.service_worker`, `externally_connectable`

Root [`manifest.json`](manifest.json) is regenerated as the Firefox merge on `npm run build`.

## Build tools used (disclosure)

| Tool | Role |
|------|------|
| **TypeScript** (`src/`) | Human-authored source language |
| **esbuild** (`scripts/build.mjs`) | Bundles `.ts` → `.js`; injects `webextension-polyfill` shim |
| **`scripts/build.mjs`** | Merges manifests, copies HTML/assets, appends shared CSS |
| **`scripts/generate-icons.mjs`** | ImageMagick → PNG icons (optional) |

No Webpack, minifier, or HTML/CSS template engine. esbuild `minify` is **not** enabled.

## Reproducibility

- Pin dependencies: commit **`package-lock.json`**, use **`npm ci`**
- Version is in **`manifest.base.json`** (`version` field)
- Tagged release: `git checkout <tag>` then build

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `magick: command not found` | Install ImageMagick 7, or ensure committed `icon-*.png` files exist |
| Node too old | Upgrade to Node.js 20+ |
| Empty `dist-chrome/` | Run `npm run build:chrome` and check for errors |

## License

Extension source: MPL-2.0. See `LICENSE`.
