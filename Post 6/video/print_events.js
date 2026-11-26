// Legge i tempi degli eventi stampati da ep6.js all'avvio (riga "EVENTI ...") e li scrive in ../audio/events6.json.
// Servono a audio/music6.py per gli effetti sonori (fissioni, neutroni assorbiti, urti sulle molecole d'acqua).
// uso: node print_events.js   (usa il rendering comune per un solo fotogramma di prova)
const { spawnSync } = require('child_process'), fs = require('fs'), path = require('path'), os = require('os');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ev6-'));
const r = spawnSync('node', [path.join(__dirname, 'render.js'), 'still', '0.1'], {
  cwd: tmp, env: { ...process.env, ROOT: __dirname, PAGE: 'ep6.html?w=270&h=480', VW: '270', VH: '480', PREFIX: 'ev' }, maxBuffer: 1 << 26 });
const out = r.stdout.toString() + r.stderr.toString();   // la console della pagina esce su stderr
const line = out.split('\n').find(l => l.includes('EVENTI '));
if (!line) { console.error('riga EVENTI non trovata'); process.exit(1); }
fs.writeFileSync(path.join(__dirname, '../audio/events6.json'), line.slice(line.indexOf('EVENTI ') + 7).trim() + '\n');
fs.rmSync(tmp, { recursive: true, force: true }); console.log('events6.json scritto');
