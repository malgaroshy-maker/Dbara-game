import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

// Master high-res generated icon
const masterIconPath = 'C:\\Users\\masal\\.gemini\\antigravity-ide\\brain\\3749e4a3-0b24-4532-ae11-07999eceb7e0\\dbara_app_icon_1786736005645.jpg';
const imageBase64 = fs.readFileSync(masterIconPath).toString('base64');
const dataUrl = `data:image/jpeg;base64,${imageBase64}`;

async function generate() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const renderIcon = async (size, isMaskable, filename, borderRadius = '0px') => {
    // For maskable icons, standard safe zone is ~80% inner circle/square
    const padding = isMaskable ? Math.round(size * 0.1) : 0;
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
          .icon-img {
            width: ${iconSize}px;
            height: ${iconSize}px;
            object-fit: cover;
            border-radius: ${borderRadius};
          }
        </style>
      </head>
      <body>
        <img class="icon-img" src="${dataUrl}" alt="icon" />
      </body>
      </html>
    `;

    await page.setViewportSize({ width: size, height: size });
    await page.setContent(html);
    const outPath = path.join(publicDir, filename);
    await page.screenshot({ path: outPath, type: 'png' });
    console.log(`Generated ${filename} (${size}x${size})`);
  };

  await renderIcon(512, false, 'icon-512.png');
  await renderIcon(192, false, 'icon-192.png');
  await renderIcon(512, true, 'icon-512-maskable.png', '18%');
  await renderIcon(192, true, 'icon-192-maskable.png', '18%');
  await renderIcon(180, false, 'apple-touch-icon.png');
  await renderIcon(64, false, 'favicon.png');

  await browser.close();
  console.log('All PWA and iOS icons generated successfully from master graphic!');
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
