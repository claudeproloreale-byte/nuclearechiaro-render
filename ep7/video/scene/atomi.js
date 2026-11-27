// Puntata 7 — ATOMI (B5–B9), dentro un puntino luminoso del corpo.
//   B5 (23,3–25,4): zoom da lontano (scala logaritmica) su un campo di nuclei sparsi e ben distanziati (v3), fino al nucleo instabile U1
//   B6 (25,0–30,5): U1 al centro, alone rosa e nucleoni che tremano; intorno nuclei calmi
//   B7 (31,0–38,0): lo stesso U1 lancia prima un pezzetto di nucleo (alfa, su "pezzetto"), poi un elettrone (beta),
//                   poi un'onda luminosa (gamma, su "radiazione elettromagnetica") (v3; nella v2 erano tre nuclei diversi)
//   B8 (38,5–46,5): U1 smette di vibrare e l'alone si spegne ("più stabile"): il gamma è l'ultimo decadimento (v4)
//   B9 (47,0–54,5): zoom indietro: intorno si vedono altri nuclei instabili sparsi (16); ogni 1,8 s se ne trasforma la metà
//                   (16 → 8 → 4 → 2), cronometro in alto
import { V, track, smooth, ramp, lerp, hash, setSeed, rnd } from '/comune/base.js';
import { creaNuclei } from '../nuclei7.js';
import { rt, fwarp, unwarp, ATOM_IN } from '../tempi.js';

export const U1 = V(0, 0.55, 0);
export const T_ALFA = 33.6, T_BETA = 34.6, T_GAMMA = 35.7, CALMA = [39.4, 40.2];
const DIST = 1.65;   // distanza minima fra i nuclei del campo (v5; v3 1,35; v2 0,95)
export const ONDATE = [49.8, 51.6, 53.4];
export const OROLOGIO = [47.8, 54.7];

// mascotte in angolo vista dalla camera degli atomi, a distanza d: (cx + 0,0746 d, cy − 0,108 d), raggio circa 0,016 d
const dietroMascotte = (p, cx, cy, d) => Math.hypot(p.x - (cx + 0.0746 * d), p.y - (cy - 0.108 * d)) < 0.016 * d + 0.75;
const INQ = [[0, 0.3, 8], [0, 0.35, 9.6], [0, 0.1, 11.3], [0, 0.4, 24]];   // inquadrature principali (B6, B7–B8, inizio B9, B9)

export function creaScena(at) {
  const K = creaNuclei(at.scene);
  const u1 = K.add(U1, 1);
  K.decay(u1, T_ALFA, 'alfa', V(-0.55, 0.85), 0.8);
  K.decay(u1, T_BETA, 'beta', V(-1, -0.3), 0.65);
  K.decay(u1, T_GAMMA, 'gamma', V(0.45, 1), 0.45);
  // B8: dopo il gamma vibra ancora un po' e si calma su "più stabile" (CALMA): da lì resta stabile
  u1.mod = (t, L) => (t > 36.3 ? 0.45 * (1 - smooth(ramp(t, ...CALMA))) : L);
  // campo di nuclei sparsi, che non si toccano e non stanno dietro la mascotte (distanza minima DIST)
  // B9 (v5): 16 nuclei instabili distribuiti in modo uniforme su tutta l'inquadratura larga (griglia 4×4 con un po' di
  // casualità); quelli che stanno anche nelle inquadrature della B6–B8 sono calmi fino allo zoom indietro (ACCENDI).
  const libero = (p, dd = DIST) => !K.NUCS.some(n => Math.hypot(n.c.x - p.x, n.c.y - p.y) < dd) && !INQ.some(([cx, cy, d]) => dietroMascotte(p, cx, cy, d))
    && !(Math.abs(p.x) < 1.25 && Math.abs(p.y - 4.6) < 1.25);   // v5: niente dietro il cronometro della B9
  setSeed(7202);
  const gruppo = [], GX = [-3.3, 3.3], GY = [-3.2, 5.8];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    const cx = lerp(GX[0], GX[1], (c + 0.5) / 4), cy = lerp(GY[0], GY[1], (r + 0.5) / 4);
    for (let k = 0; k < 400; k++) {
      const j = k < 200 ? 0.35 : 0.8, p = V(cx + (rnd() - 0.5) * 2 * j, cy + (rnd() - 0.5) * 2 * j * 1.3, 0);
      if (!libero(p)) continue;
      p.z = (rnd() - 0.5) * 0.4; gruppo.push(K.add(p, 1)); break;
    }
  }
  // se una cella era piena (U1, mascotte), il nucleo mancante va nel posto libero più lontano dagli altri instabili
  for (let dd = DIST; gruppo.length < 16; dd *= 0.92) {   // se non c'è posto, si accetta una distanza un po' minore
    let best = null, bd = -1;
    for (let k = 0; k < 3000; k++) { const p = V(lerp(GX[0], GX[1], rnd()), lerp(GY[0], GY[1], rnd()), 0); if (!libero(p, dd)) continue;
      const d = Math.min(...gruppo.map(n => Math.hypot(n.c.x - p.x, n.c.y - p.y))); if (d > bd) { bd = d; best = p; } }
    if (best) { best.z = (rnd() - 0.5) * 0.4; gruppo.push(K.add(best, 1)); }
  }
  setSeed(7201);
  const field = [];
  for (let k = 0; k < 20000 && field.length < 320; k++) {
    const p = V(lerp(-7, 7, rnd()), lerp(-11, 12, rnd()), 0);
    if (!libero(p)) continue;
    p.z = (rnd() - 0.5) * 0.4; field.push(K.add(p, 0));
  }
  const ACCENDI = [45.6, 46.8];
  gruppo.forEach(n => { n.lev0 = 1; n.mod = (t, L) => L * smooth(ramp(t, ...ACCENDI)); });
  gruppo.sort((a, b) => hash(a.c.x * 13.1 + a.c.y * 7.7) - hash(b.c.x * 13.1 + b.c.y * 7.7));   // ondate mescolate su tutto lo schermo
  // metà alla volta: 10, poi 5, poi 2 (ne restano 3); ogni ondata dura mezzo secondo; tipi a rotazione
  const tipi = ['alfa', 'beta', 'gamma'], quanti = [8, 4, 2];   // 16 → 8 → 4 → 2
  let j = 0;
  quanti.forEach((q, w) => { for (let i = 0; i < q; i++, j++) { const n = gruppo[j], dir = V(n.c.x + 0.3 * Math.sin(j * 2.1), n.c.y - 0.8 + 0.3 * Math.cos(j * 1.7), 0); K.decay(n, ONDATE[w] + 0.5 * hash(j * 3.7), tipi[j % 3], dir, 0); } });
  console.log('nuclei', K.NUCS.length, '· instabili B9', gruppo.length);
  K.completa();
  return K;
}

// camera degli atomi
const view = (x, y, z) => [x, y, z, x, y];
const logZ = (z0, z1, u) => z0 * Math.pow(z1 / z0, u);
const CAM = track(rt([[25.4, view(0, 0.3, 8)], [31.2, view(0, 0.3, 8.6)], [33.0, view(0, 0.35, 9.6)], [44.5, view(0, 0.35, 9.6)], [47.0, view(0, 0.1, 11.3)]]));
export function camAt(tn) {
  const t = unwarp(tn);
  if (t < 25.4) { const u = smooth(ramp(tn, fwarp(ATOM_IN), fwarp(25.4))); return view(0, lerp(0.55, 0.3, u), logZ(40, 8, u)); }
  if (t < 47.0) return CAM(tn);
  const u = smooth(ramp(tn, fwarp(47.0), fwarp(48.8))); return view(0, lerp(0.1, 0.4, u), logZ(11.3, 24, u) + 0.4 * ramp(tn, fwarp(48.8), fwarp(55.1)));
}
