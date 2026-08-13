import fs from 'fs';
import path from 'path';

const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE, 'AppData', 'Local');
const destDir = path.join(localAppData, 'ms-playwright-go', '1.57.0');
const packageDest = path.join(destDir, 'package');

console.log('Target driver directory:', destDir);

fs.mkdirSync(packageDest, { recursive: true });

// Copy node.exe
const nodeExeSource = process.execPath;
const nodeExeDest = path.join(destDir, 'node.exe');
fs.copyFileSync(nodeExeSource, nodeExeDest);
console.log('Copied node.exe from', nodeExeSource, 'to', nodeExeDest);

// Copy playwright-core to package
const playwrightCoreSource = path.resolve('node_modules', 'playwright-core');

function copyDirRecursive(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const dstPath = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, dstPath);
    } else {
      fs.copyFileSync(srcPath, dstPath);
    }
  }
}

copyDirRecursive(playwrightCoreSource, packageDest);
console.log('Successfully copied playwright-core package files to', packageDest);

// Verify cli.js exists
const cliJsPath = path.join(packageDest, 'cli.js');
if (fs.existsSync(cliJsPath) && fs.existsSync(nodeExeDest)) {
  console.log('Playwright-go driver is successfully configured and ready!');
} else {
  console.error('Verification failed! cli.js or node.exe missing.');
}
