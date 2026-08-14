import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

const svgContent = fs.readFileSync(path.join(publicDir, 'favicon.svg'), 'utf-8');

async function generate() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const renderIcon = async (size, isMaskable, filename) => {
    // For maskable icons, standard safe zone is ~80% inner circle/square
    const padding = isMaskable ? Math.round(size * 0.15) : Math.round(size * 0.08);
    const iconSize = size - (padding * 2);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            width: ${size}px;
            height: ${size}px;
            background: #0B0F19;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }
          .icon-wrap {
            width: ${iconSize}px;
            height: ${iconSize}px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          svg {
            width: 100%;
            height: 100%;
            filter: drop-shadow(0 4px 12px rgba(134, 59, 255, 0.4));
          }
        </style>
      </head>
      <body>
        <div class="icon-wrap">
          ${svgContent}
        </div>
      </body>
      </html>
    `;

    await page.setViewportSize({ width: size, height: size });
    await page.setContent(html);
    const outPath = path.join(publicDir, filename);
    await page.screenshot({ path: outPath, type: 'png' });
    console.log(`✓ Generated ${filename} (${size}x${size}${isMaskable ? ', maskable' : ''})`);
  };

  await renderIcon(192, false, 'icon-192.png');
  await renderIcon(512, false, 'icon-512.png');
  await renderIcon(192, true, 'icon-192-maskable.png');
  await renderIcon(512, true, 'icon-512-maskable.png');
  await renderIcon(180, false, 'apple-touch-icon.png');

  await browser.close();
  console.log('🎉 All icons successfully generated in public/ folder.');
}

generate().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
