const http = require('http'), fs = require('fs'), path = require('path');
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/npm-tools/node_modules/playwright')); }
const ROOT = __dirname, mime = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const server = http.createServer((req, res) => { const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': mime[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); });
(async () => {
  await new Promise(r => server.listen(0, r));
  const browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1600 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('PAGEERR', e.message));
  await page.goto(`http://localhost:${server.address().port}/intro.html?w=1600&h=1600`);
  await page.waitForFunction('window.ready === true', null, { timeout: 60000 });
  for (const [name, t] of [['open', 30.1], ['smile', 32.65]]) {
    await page.evaluate(t => {
      window.renderFrame(t); const d = window.__dbg;
      d.world.visible = false; d.space.visible = false; d.hands.forEach(h => h.visible = false);
      d.skyMat.uniforms.top.value.set(0xffd84a); d.skyMat.uniforms.bottom.value.set(0xff9a2e);
      d.halo.material.opacity = 0.0;
      d.mascot.position.set(0, 0.0, 0); d.mascot.scale.setScalar(1.0);
      d.camera.position.set(0, 0.05, 5.6); d.camera.lookAt(0, 0.0, 0);
      d.composer.render();
    }, t);
    fs.writeFileSync(`avatar_${name}_raw.png`, await page.screenshot({ type: 'png' }));
  }
  await browser.close(); server.close();
})();
