import * as esbuild from "esbuild";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const watch = process.argv.includes("--watch");

const browserArg = process.argv.find((a) => a.startsWith("--browser="));
const browserTarget = browserArg?.split("=")[1] ?? "firefox";

const BROWSERS = {
  firefox: {
    outdir: join(root, "dist"),
    manifestOverlay: "manifest.firefox.json",
    esbuildTarget: "firefox120",
  },
  chrome: {
    outdir: join(root, "dist-chrome"),
    manifestOverlay: "manifest.chrome.json",
    esbuildTarget: "chrome120",
  },
};

const entryPoints = {
  background: join(root, "src/background/service-worker.ts"),
  content: join(root, "src/content/index.ts"),
  "popup/popup": join(root, "src/popup/popup.ts"),
  "options/options": join(root, "src/options/options.ts"),
  "audio/speak": join(root, "src/audio/speak.ts"),
};

const shimPath = join(root, "scripts/browser-global-shim.ts");

function mergeManifest(browser) {
  const base = JSON.parse(readFileSync(join(root, "manifest.base.json"), "utf8"));
  const overlay = JSON.parse(
    readFileSync(join(root, BROWSERS[browser].manifestOverlay), "utf8"),
  );
  return { ...base, ...overlay };
}

function ensureIcon16() {
  const icon16 = join(root, "assets/icons/icon-16.png");
  const icon48 = join(root, "assets/icons/icon-48.png");
  if (!existsSync(icon16) && existsSync(icon48)) {
    cpSync(icon48, icon16);
  }
}

async function copyStaticAssets(outdir) {
  mkdirSync(outdir, { recursive: true });
  ensureIcon16();

  const { SURFACE_THEME_CSS } = await import(
    pathToFileURL(join(root, "src/shared/surface-theme.css.ts")).href,
  );
  const { POS_AND_ICON_STYLES } = await import(
    pathToFileURL(join(root, "src/shared/pos-styles.ts")).href,
  );

  const sharedUiCss = SURFACE_THEME_CSS + POS_AND_ICON_STYLES;

  cpSync(join(root, "src/popup/index.html"), join(outdir, "popup/index.html"));
  const popupCss = readFileSync(join(root, "src/popup/popup.css"), "utf8") + sharedUiCss;
  writeFileSync(join(outdir, "popup/popup.css"), popupCss);
  cpSync(join(root, "src/options/index.html"), join(outdir, "options/index.html"));
  const optionsCss =
    readFileSync(join(root, "src/options/options.css"), "utf8") + sharedUiCss;
  writeFileSync(join(outdir, "options/options.css"), optionsCss);
  cpSync(join(root, "assets"), join(outdir, "assets"), { recursive: true });
  mkdirSync(join(outdir, "audio"), { recursive: true });
  cpSync(join(root, "src/audio/speak.html"), join(outdir, "audio/speak.html"));
}

async function buildBrowser(browser) {
  const { outdir, esbuildTarget } = BROWSERS[browser];
  mkdirSync(outdir, { recursive: true });
  const manifest = mergeManifest(browser);
  writeFileSync(join(outdir, "manifest.json"), JSON.stringify(manifest, null, 2));

  await copyStaticAssets(outdir);

  const buildOptions = {
    entryPoints,
    bundle: true,
    outdir,
    format: "esm",
    target: esbuildTarget,
    sourcemap: true,
    logLevel: "info",
    inject: [shimPath],
  };

  if (watch) {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    console.log(`Watching ${browser} → ${outdir}`);
  } else {
    await esbuild.build(buildOptions);
    console.log(`Build complete (${browser}) → ${outdir}/`);
  }
}

async function build() {
  const targets =
    browserTarget === "all" ? ["firefox", "chrome"] : [browserTarget];

  for (const target of targets) {
    if (!BROWSERS[target]) {
      console.error(`Unknown browser: ${target}. Use firefox, chrome, or all.`);
      process.exit(1);
    }
    if (!watch) {
      rmSync(BROWSERS[target].outdir, { recursive: true, force: true });
    }
    await buildBrowser(target);
  }

  if (browserTarget === "firefox" || browserTarget === "all") {
    writeFileSync(
      join(root, "manifest.json"),
      JSON.stringify(mergeManifest("firefox"), null, 2),
    );
  }
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
