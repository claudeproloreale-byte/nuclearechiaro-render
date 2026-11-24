// Puntata 6 — B3-B4, zona B "bomba" (intorno a x = 0, 8,55–20,6): 167 nuclei fitti, 9 su 10 U-235.
// Un neutrone entra da sinistra e spacca il primo nucleo; la catena si allarga velocissima e finisce nel lampo bianco.
import { V, hash, xy, dirTo, smooth, ramp } from '/comune/base.js';
import { FLASH_UP, FLASH_FULL, CUT, FLASH_DOWN } from '../tempi.js';

export const B_IN = 15.1, B_HIT = 16.0, B_LAST = 19.25;   // il neutrone entra e spacca il primo nucleo; nessuna fissione dopo B_LAST
const VB = 4.2;                                            // velocità dei neutroni (unità al secondo)
export const START = V(0, 0.3, 0), FROM = V(-9, 0.8, 0);   // primo nucleo, punto di partenza del primo neutrone

// zona dei nuclei sparsi: distanza minima 1,3, corridoio libero per il primo neutrone
export const zona = n0 => ({ zone: 'B', x0: -8, x1: 8, y0: -12, y1: 12, tries: 30000, md: 1.3, caps: [[FROM, n0.c]], capDist: 0.7, fu: 0.9 });

// reazione a catena: ogni fissione manda 2 o 3 neutroni ai nuclei vicini, quasi tutti U-235
export function costruisci(at, n0) {
  at.neutron([[V(-9, 0.8, 0.15), B_IN], [n0.c.clone().addScaledVector(dirTo(FROM, n0.c), -0.25).setZ(0.15), B_HIT]], 'hit', { trail: 6 });
  n0.hitAt = B_HIT; const queue = [n0];
  while (queue.length) {
    queue.sort((a, b) => a.hitAt - b.hitAt); const e = queue.shift(), t = e.hitAt;
    const a = hash(t * 5.3 + e.c.x) * 6.28; at.fission(e, t, V(Math.cos(a), Math.sin(a), 0), 0.38, 0.9, 0.2);
    const k = hash(t * 2.9 + e.c.y) < 0.5 ? 2 : 3;
    const cands = at.NUCS.filter(n => n.zone === 'B' && n.u && n.hitAt === undefined).map(n => [xy(n.c, e.c), n])
      .filter(([d, n]) => d > 1.0 && d < 2.9 && at.clearLine(e.c, n.c, [e, n])).sort((p, q) => p[0] - q[0]);
    let links = 0; const used = [];
    for (const [d, n] of cands) {
      if (links >= k) break;
      const dir = dirTo(e.c, n.c); if (used.some(u => u.dot(dir) > 0.6)) continue;
      const t1 = t + 0.05 + d / VB; if (t1 > B_LAST) continue;
      n.hitAt = t1; queue.push(n); used.push(dir); links++;
      at.neutron([[e.c.clone().addScaledVector(dir, 0.32).setZ(0.15), t + 0.05], [n.c.clone().addScaledVector(dir, -0.25).setZ(0.15), t1]], 'hit', { trail: 4 });
    }
    if (links < k) at.emitOthers(e, t, k - links, VB, used, false, 4);
  }
}

// lampo bianco a tutto schermo, davanti anche alla mascotte: sale da 19,2 a 19,95, resta pieno, scende da 20,7 a 21,6 (sotto c'è già la centrale)
export const lampo = t => smooth(ramp(t, FLASH_UP, FLASH_FULL)) * (1 - smooth(ramp(t, CUT + 0.1, FLASH_DOWN)));
