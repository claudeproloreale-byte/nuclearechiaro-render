// Puntata 7 — ATOMI (B5–B9), dentro un puntino luminoso del corpo.
//   B5 (23,3–25,4): zoom da lontano (scala logaritmica) su un campo di nuclei sparsi, fino al nucleo instabile U1
//   B6 (25,0–30,5): U1 al centro, alone rosa e nucleoni che tremano; intorno nuclei calmi
//   B7 (31,0–38,0): la camera si allarga; U1 lancia un pezzetto di nucleo (alfa, su "pezzetto"), U2 un elettrone (beta),
//                   U3 un lampo di energia (gamma, su "lampo")
//   B8 (38,5–46,5): U2 e U3 si calmano; U1 resta un po' instabile ("può essere a sua volta ancora instabile"), torna a tremare
//                   e decade di nuovo (beta) per poi calmarsi ("oppure stabile")
//   B9 (47,0–54,5): zoom indietro su 16 nuclei instabili: ogni 1,8 s se ne trasforma la metà (16 → 8 → 4 → 2), cronometro in alto
import { V, track, smooth, ramp, lerp, hash, setSeed, rnd } from '/comune/base.js';
import { creaNuclei } from '../nuclei7.js';
import { rt, fwarp, unwarp, ATOM_IN } from '../tempi.js';

export const U1 = V(0, 0.55, 0), U2 = V(-0.95, -0.7, 0), U3 = V(0.98, -0.1, 0);
export const T_ALFA = 34.0, T_BETA = 34.8, T_GAMMA = 35.6, T_BETA2 = 43.6, U1_SALE = [42.0, 43.2];
export const ONDATE = [49.8, 51.6, 53.4];
export const OROLOGIO = [47.8, 54.7];

// mascotte in angolo vista dalla camera degli atomi, a distanza d: (cx + 0,0746 d, cy − 0,108 d), raggio circa 0,016 d
const dietroMascotte = (p, cx, cy, d) => Math.hypot(p.x - (cx + 0.0746 * d), p.y - (cy - 0.108 * d)) < 0.016 * d + 0.75;
const INQ = [[0, 0.3, 8], [0, 0, 11], [0, 0.4, 24]];   // inquadrature principali (B6, B7–B8, B9)

export function creaScena(at) {
  const K = creaNuclei(at.scene);
  const u1 = K.add(U1, 1), u2 = K.add(U2, 1), u3 = K.add(U3, 1);
  K.decay(u1, T_ALFA, 'alfa', V(-0.55, 0.85), 0.5);
  K.decay(u2, T_BETA, 'beta', V(-1, -0.25), 0);
  K.decay(u3, T_GAMMA, 'gamma', V(0.35, 1), 0);
  K.decay(u1, T_BETA2, 'beta', V(1, 0.55), 0);
  u1.preRise = (t, d) => (d.t === T_BETA2 ? 0.5 + 0.5 * smooth(ramp(t, ...U1_SALE)) : 0);   // B8: torna a tremare prima del secondo decadimento
  // campo di nuclei sparsi, che non si toccano e non stanno dietro la mascotte
  setSeed(7201);
  const field = [];
  for (let k = 0; k < 20000 && field.length < 320; k++) {
    const p = V(lerp(-7, 7, rnd()), lerp(-11, 12, rnd()), 0);
    if (K.NUCS.some(n => Math.hypot(n.c.x - p.x, n.c.y - p.y) < 0.95)) continue;
    if (INQ.some(([cx, cy, d]) => dietroMascotte(p, cx, cy, d))) continue;
    p.z = (rnd() - 0.5) * 0.4; field.push(K.add(p, 0));
  }
  // B9: 16 nuclei instabili nell'inquadratura larga, fuori da quella della B7 (lì sono già tutti calmi)
  const inB9 = n => Math.abs(n.c.x) < 3.3 && n.c.y > -3.6 && n.c.y < 5.4 && !(Math.abs(n.c.x) < 2.35 && Math.abs(n.c.y) < 3.6);
  const gruppo = field.filter(inB9).sort((a, b) => hash(a.c.x * 7 + a.c.y) - hash(b.c.x * 7 + b.c.y)).slice(0, 16);
  gruppo.forEach(n => { n.lev0 = 1; });
  // metà alla volta: 10, poi 5, poi 2 (ne restano 3); ogni ondata dura mezzo secondo; tipi a rotazione
  const tipi = ['alfa', 'beta', 'gamma'], quanti = [8, 4, 2];   // 16 → 8 → 4 → 2
  let j = 0;
  quanti.forEach((q, w) => { for (let i = 0; i < q; i++, j++) { const n = gruppo[j], dir = V(n.c.x + 0.3 * Math.sin(j * 2.1), n.c.y - 0.8 + 0.3 * Math.cos(j * 1.7), 0); K.decay(n, ONDATE[w] + 0.5 * hash(j * 3.7), tipi[j % 3], dir, 0); } });
  console.log('nuclei', K.NUCS.length, '· instabili B9', gruppo.length, );
  K.completa();
  return K;
}

// camera degli atomi
const view = (x, y, z) => [x, y, z, x, y];
const logZ = (z0, z1, u) => z0 * Math.pow(z1 / z0, u);
const CAM = track(rt([[25.4, view(0, 0.3, 8)], [31.2, view(0, 0.3, 8.6)], [33.4, view(0, 0, 11)], [41.3, view(0, 0, 11)], [42.3, view(0.1, 0.4, 9.2)], [44.0, view(0.1, 0.4, 9.2)], [45.0, view(0, 0.1, 11)], [47.0, view(0, 0.1, 11.3)]]));
export function camAt(tn) {
  const t = unwarp(tn);
  if (t < 25.4) { const u = smooth(ramp(tn, fwarp(ATOM_IN), fwarp(25.4))); return view(0, lerp(0.55, 0.3, u), logZ(40, 8, u)); }
  if (t < 47.0) return CAM(tn);
  const u = smooth(ramp(tn, fwarp(47.0), fwarp(48.8))); return view(0, lerp(0.1, 0.4, u), logZ(11.3, 24, u) + 0.4 * ramp(tn, fwarp(48.8), fwarp(55.1)));
}
