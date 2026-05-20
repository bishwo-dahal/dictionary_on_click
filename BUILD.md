# Build instructions (Firefox Add-ons source review)

This document explains how to reproduce the **exact** built extension from human-readable source. The submitted add-on is the contents of the `dist/` directory after running the build script.

## Source vs. build output

| Human-readable source (review these) | Generated output (do not edit) |
|--------------------------------------|--------------------------------|
| `src/**/*.ts` — TypeScript source     | `dist/**/*.js` — bundled JavaScript |
| `src/**/*.html`, `src/**/*.css`      | `dist/**/*.html`, `dist/**/*.css` (CSS partly concatenated at build time) |
| `manifest.json`                      | `dist/manifest.json` (copied) |
| `assets/icons/icon.svg`              | `assets/icons/icon-*.png` (rasterized), then copied to `dist/assets/` |

Third-party libraries (esbuild, TypeScript types, test tools) are installed under `node_modules/` from `package-lock.json`. They are **not** included in the extension package.

## Operating system

The build was tested on **Linux**. It should work on any OS that supports:

- **Node.js 20 or newer**
- **npm 10 or newer** (bundled with Node 20+)
- **ImageMagick 7** (`magick` command) — required to regenerate PNG icons from `assets/icons/icon.svg`

Supported environments: Linux, macOS, Windows (with the above tools in `PATH`).

## Required programs

| Program | Minimum version | Install |
|---------|-----------------|--------|
| [Node.js](https://nodejs.org/) | **20.x** | https://nodejs.org/ or your package manager (`dnf install nodejs`, `brew install node`, etc.) |
| npm | **10.x** (comes with Node 20+) | Included with Node.js |
| [ImageMagick](https://imagemagick.org/) | **7.x** (optional) | Only needed when changing `assets/icons/icon.svg`. CI and normal builds use the committed `icon-*.png` files if `magick` is not installed. |

Verify installations:

```bash
node --version    # v20.x.x or higher
npm --version     # 10.x.x or higher
magick --version  # optional — ImageMagick 7.x, for icon regeneration only
```

## Step-by-step build (exact copy of the add-on)

From the **root of this repository** (where `package.json` and `manifest.json` live):

### 1. Install Node dependencies

Use a clean install so versions match `package-lock.json`:

```bash
npm ci
```

If `package-lock.json` is missing, use `npm install` instead (not recommended for reproducible AMO builds).

### 2. Run the full build script

This is the **only** command required to produce the extension. It runs all technical steps in order:

```bash
npm run build
```

That executes:

1. `node scripts/generate-icons.mjs` — rasterize `assets/icons/icon.svg` → `icon-48.png`, `icon-96.png`, `icon-128.png`
2. `node scripts/build.mjs` — bundle TypeScript, copy static files, append shared CSS, write `dist/`

### 3. Confirm output

After a successful build you should have:

```text
dist/
  manifest.json
  background.js
  content.js
  popup/
  options/
  audio/
  assets/icons/
```

Load or package from `dist/manifest.json`:

```bash
# Optional: run tests and linter (same as CI)
npm test
npm run lint

# Optional: create a .zip for sideloading
npx web-ext build -s dist
# → web-ext-artifacts/*.zip
```

The **`dist/`** folder is the exact add-on code to submit or sign. Do not submit `src/` or `node_modules/` as the extension package.

## Build tools used (disclosure)

| Tool | Role |
|------|------|
| **TypeScript** (`src/`) | Human-authored source language |
| **esbuild** (via `scripts/build.mjs`) | Bundles multiple `.ts` files into single `.js` entry points; generates source maps |
| **`scripts/build.mjs`** | Orchestrates esbuild, copies HTML/assets, appends CSS from `src/shared/*-styles.ts` into popup/options CSS |
| **`scripts/generate-icons.mjs`** | Calls ImageMagick to produce PNG icons from SVG |

No Webpack, minifier, or HTML/CSS template engine is used. esbuild is **not** configured with `minify: true` for release builds.

## Reproducibility

- Pin dependency versions: commit **`package-lock.json`** and use **`npm ci`**.
- Extension version is set in root **`manifest.json`** (`version` field).
- To match a tagged release: `git checkout <tag>` then follow steps above.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `magick: command not found` | Install ImageMagick 7 and ensure `magick` is on your `PATH` |
| Node too old | Upgrade to Node.js 20+ |
| `npm ci` fails | Ensure you are in the repo root and `package-lock.json` exists |
| Empty `dist/` | Run `npm run build` and check the terminal for errors |

## License

Extension source: MPL-2.0. See `LICENSE`.
