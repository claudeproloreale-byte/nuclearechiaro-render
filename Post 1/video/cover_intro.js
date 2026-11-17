// Copertina del video introduttivo: posa "tranquilla" della mascotte (window.COVER in intro.js), poi titolo con PIL.
// uso: node cover_intro.js out.jpg '<json posa>'
const http = require('http'), fs = require('fs'), path = require('path');
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/npm-tools/node_modules/playwright')); }
const ROOT = __dirname, mime = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const server = http.createServer((req, res) => { const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': mime[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); });
(async () => {
  await new Promise(r => server.listen(0, r));
  const browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('PAGEERR', e.message));
  await page.goto(`http://localhost:${server.address().port}/intro.html`);
  await page.waitForFunction('window.ready === true', null, { timeout: 60000 });
  const [out, pose] = process.argv.slice(2);
  await page.evaluate(p => { window.COVER = JSON.parse(p); window.renderFrame(30.1); }, pose);
  fs.writeFileSync(out, await page.screenshot({ type: 'jpeg', quality: 95 }));
  await browser.close(); server.close();
})();
