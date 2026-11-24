// Libreria comune — rendering di una pagina in fotogrammi o in video (uguale per tutte le puntate).
// Si lancia dalla cartella della puntata, attraverso il suo render.js:
//   node render.js still t1,t2,...          fotogrammi (JPEG; FMT=png per confronti pixel per pixel)
//   node render.js seg f0 f1 out.mp4        video dal fotogramma f0 al f1 (escluso), 30 fps
// Variabili: PAGE (es. 'ep6.html' o 'ep6.html?w=540&h=960'), VW, VH (dimensioni della finestra), PREFIX, CHROME.
// Il server serve la cartella della puntata e, sotto /comune/, questa cartella.
const http = require('http'), fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const ROOT = process.env.ROOT || process.cwd(), COMUNE = __dirname, FPS = 30;
// Playwright: quello della puntata (node_modules) se c'è, altrimenti quello di sistema dell'ambiente di Claude
let chromium; try { ({ chromium } = require(require.resolve('playwright', { paths: [ROOT] }))); } catch { ({ chromium } = require('/opt/npm-tools/node_modules/playwright')); }
const PAGE = process.env.PAGE || 'index.html', VW = +(process.env.VW || 1280), VH = +(process.env.VH || 720);
const CHROME = process.env.CHROME || '/usr/bin/google-chrome';
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  const [base, rel] = u.startsWith('/comune/') ? [COMUNE, u.slice(8)] : [ROOT, u];
  const f = path.join(base, rel);
  if (!f.startsWith(base) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
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
  const draw = t => page.evaluate(t => window.renderFrame(t), t);
  const shot = async t => { await draw(t); return page.screenshot({ type: 'jpeg', quality: 92 }); };
  const [mode, a, b, out] = process.argv.slice(2);
  const T0 = Date.now();
  if (mode === 'still') {
    const png = process.env.FMT === 'png';
    for (const t of a.split(',')) {
      const t0 = Date.now(), name = `${process.env.PREFIX || 'still'}_${t}.${png ? 'png' : 'jpg'}`;
      if (png) { await draw(+t); fs.writeFileSync(name, await page.screenshot({ type: 'png' })); } else fs.writeFileSync(name, await shot(+t));
      console.log(t, Date.now() - t0, 'ms');
    }
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
