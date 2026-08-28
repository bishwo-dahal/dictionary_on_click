/**
 * Rasterize assets/icons/icon.svg → PNG sizes for the extension manifest.
 * Requires ImageMagick (`magick`) when regenerating; skips if PNGs already exist.
 */
import { execSync, spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svg = join(root, "assets/icons/icon.svg");
const sizes = [16, 48, 96, 128];

function magickAvailable() {
  const r = spawnSync("magick", ["--version"], { stdio: "ignore" });
  return r.status === 0;
}

function outputs() {
  return sizes.map((size) => join(root, `assets/icons/icon-${size}.png`));
}

function iconsPresent() {
  return outputs().every((out) => existsSync(out));
}

/** True when PNGs exist and are at least as new as icon.svg (local dev only). */
function iconsUpToDate() {
  if (!existsSync(svg) || !iconsPresent()) {
    return false;
  }
  const svgMtime = statSync(svg).mtimeMs;
  return outputs().every((out) => statSync(out).mtimeMs >= svgMtime);
}

if (!magickAvailable()) {
  if (iconsPresent()) {
    console.log("magick not found; using committed PNG icons in assets/icons/");
    process.exit(0);
  }
  console.error(
    "magick (ImageMagick 7) is required to generate icons.\n" +
      "Install it (e.g. dnf install ImageMagick / apt install imagemagick),\n" +
      "or commit assets/icons/icon-16.png, icon-48.png, icon-96.png, and icon-128.png.",
  );
  process.exit(1);
}

if (iconsUpToDate()) {
  console.log("PNG icons are up to date; skipping rasterize");
  process.exit(0);
}

for (const size of sizes) {
  const out = join(root, `assets/icons/icon-${size}.png`);
  execSync(
    `magick -background none -density 384 "${svg}" -resize ${size}x${size} "${out}"`,
    { stdio: "inherit" },
  );
  console.log(`Wrote ${out}`);
}
