/**
 * Rasterize assets/icons/icon.svg → PNG sizes for the extension manifest.
 * Requires ImageMagick (`magick` command).
 */
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svg = join(root, "assets/icons/icon.svg");
const sizes = [48, 96, 128];

for (const size of sizes) {
  const out = join(root, `assets/icons/icon-${size}.png`);
  execSync(
    `magick -background none -density 384 "${svg}" -resize ${size}x${size} "${out}"`,
    { stdio: "inherit" },
  );
  console.log(`Wrote ${out}`);
}
