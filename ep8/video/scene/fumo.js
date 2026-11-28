// Puntata 8 — NUVOLE DI VAPORE e FUMO: sbuffi morbidi (sprite con una trama di nuvola disegnata nel canvas),
// che salgono, si allargano, piegano col vento e svaniscono. Usati per i pennacchi delle torri, la pentola, il fiato,
// il fumo grigio del camino a carbone.
//
// const p = creaPennacchio(parent, { r, n, sale, vento, vita, colore, ombra, op, seme })
//   p.aggiorna(tn, k)   k = intensità (0 spento, 1 pieno): moltiplica opacità e quantità
import { THREE, V, hash, clamp01, smooth, setSeed, rnd } from '/comune/base.js';

// trame: 4 varianti di sbuffo, con un po' di ombra in basso a destra (luce dall'alto a sinistra)
function trama(k) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  setSeed(900 + k * 17);
  const blobs = [];
  for (let i = 0; i < 9; i++) { const a = rnd() * 6.28, d = rnd() * 52; blobs.push([128 + Math.cos(a) * d, 132 + Math.sin(a) * d * 0.8, 38 + rnd() * 34]); }
  blobs.push([128, 128, 70]);
  // ombra
  for (const [x, y, r] of blobs) {
    const gr = g.createRadialGradient(x + 8, y + 10, 0, x + 8, y + 10, r);
    gr.addColorStop(0, 'rgba(150,165,190,0.55)'); gr.addColorStop(0.7, 'rgba(150,165,190,0.25)'); gr.addColorStop(1, 'rgba(150,165,190,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x + 8, y + 10, r, 0, 7); g.fill();
  }
  // corpo chiaro
  for (const [x, y, r] of blobs) {
    const gr = g.createRadialGradient(x - 6, y - 8, 0, x - 6, y - 8, r);
    gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(0.55, 'rgba(250,252,255,0.6)'); gr.addColorStop(1, 'rgba(245,248,255,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x - 6, y - 8, r, 0, 7); g.fill();
  }
  // bordo sfumato: maschera radiale
  g.globalCompositeOperation = 'destination-in';
  const m = g.createRadialGradient(128, 128, 60, 128, 128, 127);
  m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = m; g.fillRect(0, 0, 256, 256);
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx;
}
export const TRAME = [0, 1, 2, 3].map(trama);

export function creaPennacchio(parent, o = {}) {
  const { r = 1.6, n = 60, sale = 9, vento = [2.6, 0], vita = 11, colore = 0xffffff, op = 0.92, cresce = 2.6, seme = 1, giro = 0.35, inizioOp = 0.05 } = o;
  setSeed(5000 + seme * 31);
  const g = new THREE.Group(); parent.add(g);
  const col = new THREE.Color(colore);
  const sb = Array.from({ length: n }, (_, i) => {
    const m = new THREE.SpriteMaterial({ map: TRAME[i % 4], color: col.clone().multiplyScalar(0.93 + rnd() * 0.07), transparent: true, opacity: 0, depthWrite: false, rotation: rnd() * 6.28 });
    const s = new THREE.Sprite(m); g.add(s);
    s.userData = { ph: i / n + rnd() * 0.5 / n, a: rnd() * 6.28, d: Math.sqrt(rnd()) * r * 0.8, s0: 0.8 + rnd() * 0.45, w: rnd() * 6.28, rot: (rnd() - 0.5) * 0.3 };
    return s;
  });
  function aggiorna(tn, k = 1, kVento = 1) {
    g.visible = k > 0.002;
    if (!g.visible) return;
    for (const s of sb) {
      const d = s.userData, ph = (tn / vita + d.ph) % 1;
      const rise = sale * (1 - Math.pow(1 - ph, 1.7));
      const drift = Math.pow(ph, 1.6);
      const sw = Math.sin(tn * 0.7 + d.w) * giro * ph;
      s.position.set(Math.cos(d.a) * d.d * (1 + ph * 1.4) + vento[0] * kVento * drift + sw, rise, Math.sin(d.a) * d.d * (1 + ph * 1.2) + vento[1] * kVento * drift);
      s.scale.setScalar(r * 1.5 * d.s0 * (1 + ph * cresce) * (0.75 + 0.25 * k));
      s.material.rotation += 0; s.material.rotation = d.rot * tn + d.w;
      s.material.opacity = op * k * smooth(ph / Math.max(0.001, inizioOp + 0.04)) * (1 - smooth((ph - 0.5) / 0.5));
    }
  }
  return { g, sb, aggiorna };
}
