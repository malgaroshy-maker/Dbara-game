import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

function createStaticServer(distDir, port = 4173) {
  const server = http.createServer((req, res) => {
    const safeUrl = req.url ? req.url.split('?')[0] : '/';
    let filePath = path.join(distDir, safeUrl === '/' ? 'index.html' : safeUrl);

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distDir, 'index.html');
    }

    try {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const content = fs.readFileSync(filePath);
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      });
      res.end(content);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });

  return new Promise((resolve, reject) => {
    server.listen(port, '127.0.0.1', () => {
      resolve(server);
    });
    server.on('error', reject);
  });
}

async function runLighthouseAudit() {
  const distDir = path.resolve('dist');
  if (!fs.existsSync(distDir)) {
    console.error('❌ مجلد dist غير موجود، يرجى تشغيل npm run build أولاً.');
    process.exit(1);
  }

  const port = 4173;
  console.log(`🚀 تشغيل خادم محلي مدمج للملفات المبنية على المنفذ ${port}...`);
  const server = await createStaticServer(distDir, port);
  const targetUrl = `http://127.0.0.1:${port}/`;
  console.log(`✓ الخادم جاهز على: ${targetUrl}`);

  try {
    console.log('🌐 جاري تشغيل متصفح Chrome في وضع الفحص المكتوم (Headless)...');
    const chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless=new', '--disable-gpu', '--no-sandbox'],
    });

    console.log('📊 جاري تشغيل تدقيق Lighthouse (Performance, Accessibility, Best Practices, SEO)...');
    const options = {
      logLevel: 'error',
      output: 'json',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      port: chrome.port,
      formFactor: 'mobile',
      screenEmulation: {
        mobile: true,
        width: 390,
        height: 844,
        deviceScaleFactor: 3,
        disabled: false,
      },
    };

    const runnerResult = await lighthouse(targetUrl, options);
    const reportJson = JSON.parse(runnerResult.report);

    // Save report
    const reportPath = path.resolve('scripts/lighthouse-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportJson, null, 2));

    const categories = runnerResult.lhr.categories;
    const performance = Math.round((categories.performance?.score || 0) * 100);
    const accessibility = Math.round((categories.accessibility?.score || 0) * 100);
    const bestPractices = Math.round((categories['best-practices']?.score || 0) * 100);
    const seo = Math.round((categories.seo?.score || 0) * 100);

    const audits = runnerResult.lhr.audits;
    const fcp = audits['first-contentful-paint']?.displayValue;
    const lcp = audits['largest-contentful-paint']?.displayValue;
    const tbt = audits['total-blocking-time']?.displayValue;
    const cls = audits['cumulative-layout-shift']?.displayValue;
    const si = audits['speed-index']?.displayValue;

    console.log('\n======================================================');
    console.log('🏆 نتائج تدقيق Lighthouse الرسمي (Mobile Emulation)');
    console.log('======================================================');
    console.log(`⚡ الأداء (Performance):          ${performance} / 100`);
    console.log(`♿ إمكانية الوصول (Accessibility):  ${accessibility} / 100`);
    console.log(`🛡️ أفضل الممارسات (Best Practices): ${bestPractices} / 100`);
    console.log(`🔍 تحسين محركات البحث (SEO):        ${seo} / 100`);
    console.log('------------------------------------------------------');
    console.log('📈 مؤشرات الأداء الحيوية (Core Web Vitals):');
    console.log(`  • FCP (First Contentful Paint):    ${fcp}`);
    console.log(`  • LCP (Largest Contentful Paint):  ${lcp}`);
    console.log(`  • TBT (Total Blocking Time):       ${tbt}`);
    console.log(`  • CLS (Cumulative Layout Shift):   ${cls}`);
    console.log(`  • SI  (Speed Index):               ${si}`);
    console.log('======================================================\n');
    console.log(`📁 تم حفظ التقرير الكامل في: ${reportPath}`);

    try {
      await chrome.kill();
    } catch {
      // Ignored on Windows if temp files are briefly retained
    }
  } finally {
    server.close();
  }
}

runLighthouseAudit().catch((err) => {
  console.error('❌ خطأ أثناء تشغيل تدقيق Lighthouse:', err);
  process.exit(1);
});
