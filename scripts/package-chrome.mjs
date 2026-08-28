/**
 * Zip dist-chrome/ for Chrome Web Store upload.
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const distChrome = join(root, "dist-chrome");
const artifacts = join(root, "web-ext-artifacts");

if (!existsSync(join(distChrome, "manifest.json"))) {
  console.error("dist-chrome/ not found. Run: npm run build:chrome");
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(join(distChrome, "manifest.json"), "utf8"));
const version = pkg.version ?? "0.0.0";
const out = join(artifacts, `dictionary-on-click-chrome-${version}.zip`);

mkdirSync(artifacts, { recursive: true });
execSync(`zip -r "${out}" .`, { cwd: distChrome, stdio: "inherit" });
console.log(`Wrote ${out}`);
