import * as esbuild from "esbuild";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dist = join(root, "dist");
const watch = process.argv.includes("--watch");

const entryPoints = {
  background: join(root, "src/background/service-worker.ts"),
  content: join(root, "src/content/index.ts"),
  "popup/popup": join(root, "src/popup/popup.ts"),
  "options/options": join(root, "src/options/options.ts"),
  "audio/speak": join(root, "src/audio/speak.ts"),
};

async function copyStaticAssets() {
  mkdirSync(dist, { recursive: true });

  const manifest = JSON.parse(
    readFileSync(join(root, "manifest.json"), "utf8"),
  );
  writeFileSync(join(dist, "manifest.json"), JSON.stringify(manifest, null, 2));

  const { SURFACE_THEME_CSS } = await import(
    pathToFileURL(join(root, "src/shared/surface-theme.css.ts")).href,
  );
  const { POS_AND_ICON_STYLES } = await import(
    pathToFileURL(join(root, "src/shared/pos-styles.ts")).href,
  );

  const sharedUiCss = SURFACE_THEME_CSS + POS_AND_ICON_STYLES;

  cpSync(join(root, "src/popup/index.html"), join(dist, "popup/index.html"));
  const popupCss = readFileSync(join(root, "src/popup/popup.css"), "utf8") + sharedUiCss;
  writeFileSync(join(dist, "popup/popup.css"), popupCss);
  cpSync(join(root, "src/options/index.html"), join(dist, "options/index.html"));
  const optionsCss =
    readFileSync(join(root, "src/options/options.css"), "utf8") + sharedUiCss;
  writeFileSync(join(dist, "options/options.css"), optionsCss);
  cpSync(join(root, "assets"), join(dist, "assets"), { recursive: true });
  mkdirSync(join(dist, "audio"), { recursive: true });
  cpSync(join(root, "src/audio/speak.html"), join(dist, "audio/speak.html"));
}

const buildOptions = {
  entryPoints,
  bundle: true,
  outdir: dist,
  format: "esm",
  target: "firefox120",
  sourcemap: true,
  logLevel: "info",
};

async function build() {
  rmSync(dist, { recursive: true, force: true });
  await copyStaticAssets();
  if (watch) {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    console.log("Watching for changes…");
  } else {
    await esbuild.build(buildOptions);
    console.log("Build complete → dist/");
  }
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
