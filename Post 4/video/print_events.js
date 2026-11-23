// Apre ep4.html, legge i tempi degli eventi stampati da ep4.js (riga "EVENTI ...") e li scrive in ../audio/events4.json.
// Servono a audio/music4.py per gli effetti sonori (fissioni della catena, catture, rimbalzi dei frammenti).
// uso: node print_events.js   (stessi requisiti di render.js)
const http = require('http'), fs = require('fs'), path = require('path');
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/npm-tools/node_modules/playwright')); }
const ROOT = __dirname, CHROME = process.env.CHROME || '/usr/bin/google-chrome';
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': mime[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
(async () => {
  await new Promise(r => server.listen(0, r));
  const b = await chromium.launch({ executablePath: CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 540, height: 960 } });
  let ev = null;
  p.on('console', m => { const t = m.text(); if (t.startsWith('EVENTI ')) ev = t.slice(7); else console.log(t); });
  p.on('pageerror', e => console.error('ERR', e.message));
  await p.goto(`http://localhost:${server.address().port}/ep4.html?w=540&h=960`);
  await p.waitForFunction('window.ready === true', null, { timeout: 120000 });
  await b.close(); server.close();
  if (!ev) { console.error('riga EVENTI non trovata'); process.exit(1); }
  fs.writeFileSync(path.join(ROOT, '../audio/events4.json'), ev + '\n'); console.log('events4.json scritto');
})();
