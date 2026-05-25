/**
 * ContactForge — Icon Rasterizer
 *
 * Converts assets/premium-icon.svg → 1024×1024 PNGs:
 *   - assets/icon.png          (main app icon)
 *   - assets/adaptive-icon.png (Android adaptive foreground)
 *   - assets/favicon.png       (web favicon, 64×64)
 *
 * Run: node scripts/rasterize-icon.mjs
 */

import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const svgBuffer = readFileSync(join(ROOT, 'assets', 'premium-icon.svg'));

async function rasterize() {
  // 1024×1024 main icon
  await sharp(svgBuffer)
    .resize(1024, 1024)
    .png({ compressionLevel: 9 })
    .toFile(join(ROOT, 'assets', 'icon.png'));
  console.log('✅  assets/icon.png          — 1024×1024');

  // 1024×1024 adaptive icon (Android)
  await sharp(svgBuffer)
    .resize(1024, 1024)
    .png({ compressionLevel: 9 })
    .toFile(join(ROOT, 'assets', 'adaptive-icon.png'));
  console.log('✅  assets/adaptive-icon.png — 1024×1024');

  // 64×64 favicon (web)
  await sharp(svgBuffer)
    .resize(64, 64)
    .png({ compressionLevel: 9 })
    .toFile(join(ROOT, 'assets', 'favicon.png'));
  console.log('✅  assets/favicon.png       — 64×64');

  console.log('\n🎉  All icons generated successfully.');
}

rasterize().catch((err) => {
  console.error('❌  Rasterization failed:', err.message);
  process.exit(1);
});
