import * as esbuild from "esbuild";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dist = join(root, "dist");
const watch = process.argv.includes("--watch");

const entryPoints = {
  background: join(root, "src/background/service-worker.ts"),
  content: join(root, "src/content/index.ts"),
  "popup/popup": join(root, "src/popup/popup.ts"),
  "options/options": join(root, "src/options/options.ts"),
};

function copyStaticAssets() {
  mkdirSync(dist, { recursive: true });

  const manifest = JSON.parse(
    readFileSync(join(root, "manifest.json"), "utf8"),
  );
  writeFileSync(join(dist, "manifest.json"), JSON.stringify(manifest, null, 2));

  cpSync(join(root, "src/popup/index.html"), join(dist, "popup/index.html"));
  cpSync(join(root, "src/popup/popup.css"), join(dist, "popup/popup.css"));
  cpSync(join(root, "src/options/index.html"), join(dist, "options/index.html"));
  cpSync(join(root, "src/options/options.css"), join(dist, "options/options.css"));
  cpSync(join(root, "assets"), join(dist, "assets"), { recursive: true });
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
  copyStaticAssets();
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
