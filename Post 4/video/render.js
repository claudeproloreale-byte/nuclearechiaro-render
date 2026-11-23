// usage: node render.js still t1,t2,...   |   node render.js seg f0 f1 out.mp4
// Come quello delle puntate 2-4, con il tipo MIME dei font e un'attesa lunga al caricamento.
// Playwright: quello locale (node_modules) se c'è, altrimenti quello di sistema dell'ambiente di Claude.
const http = require('http'), fs = require('fs'), path = require('path'), { spawn } = require('child_process');
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/npm-tools/node_modules/playwright')); }
const ROOT = __dirname, FPS = 30;
const PAGE = process.env.PAGE || 'index.html', VW = +(process.env.VW || 1280), VH = +(process.env.VH || 720);
const CHROME = process.env.CHROME || '/usr/bin/google-chrome';
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': mime[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
(async () => {
  await new Promise(r => server.listen(0, r));
  const browser = await chromium.launch({ executablePath: CHROME,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('PAGEERR', e.message));
  page.on('console', m => console.error('CONSOLE', m.type(), m.text()));
  await page.goto(`http://localhost:${server.address().port}/${PAGE}`);
  await page.waitForFunction('window.ready === true', null, { timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
  const shot = async t => { await page.evaluate(t => window.renderFrame(t), t); return page.screenshot({ type: 'jpeg', quality: 92 }); };
  const [mode, a, b, out] = process.argv.slice(2);
  const T0 = Date.now();
  if (mode === 'still') {
    for (const t of a.split(',')) { const t0 = Date.now(); fs.writeFileSync(`${process.env.PREFIX || 'still'}_${t}.jpg`, await shot(+t)); console.log(t, Date.now() - t0, 'ms'); }
  } else {
    const tmp = out.replace(/\.mp4$/, '.part.mp4');
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(FPS), '-i', '-',
      '-c:v', 'libx264', '-crf', '18', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-r', String(FPS), tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let f = +a; f < +b; f++) { const buf = await shot(f / FPS); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); }
    ff.stdin.end();
    const code = await new Promise(r => ff.on('close', r));
    if (code === 0) fs.renameSync(tmp, out); else { console.error('ffmpeg failed', code); process.exitCode = 1; }
    console.log(`segmento ${a}-${b}: ${((Date.now() - T0) / 1000).toFixed(1)} s, ${((Date.now() - T0) / (b - a)).toFixed(0)} ms per fotogramma`);
  }
  await browser.close(); server.close();
})();
