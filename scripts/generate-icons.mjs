import sharp from "sharp";
import path from "path";
import { mkdirSync } from "fs";

const root = process.cwd();
const svgPath = path.join(root, "scripts", "icon-source.svg");
const iconsDir = path.join(root, "public", "icons");
mkdirSync(iconsDir, { recursive: true });

const targets = [
  { file: path.join(iconsDir, "icon-192.png"), size: 192 },
  { file: path.join(iconsDir, "icon-512.png"), size: 512 },
  { file: path.join(root, "src", "app", "icon.png"), size: 32 },
  { file: path.join(root, "src", "app", "apple-icon.png"), size: 180 },
];

for (const t of targets) {
  await sharp(svgPath).resize(t.size, t.size).png().toFile(t.file);
  console.log(`created ${t.file} (${t.size}x${t.size})`);
}
