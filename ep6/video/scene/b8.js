// Puntata 6 — B8 (v2): l'inquadratura va sul bordo della pastiglia (barra C), fuori c'è l'acqua.
// Un neutrone veloce scende dall'alto ed esce dalla barra, rimbalza 5 volte sugli idrogeni (a ogni urto la velocità
// si moltiplica per 0,74), rientra nella barra e spacca BB a 37,4. I due neutroni nati da BB vanno verso l'interno
// della barra e sono assorbiti da due U-238 (così nella B9 nell'acqua passa solo il neutrone veloce).
import { V, xy, dirTo, polySegs } from '/comune/base.js';
import { XR, YR, PE, E, inWater, behindMascot } from './zonaR.js';

export const W_IN = 34.6, B8_HIT = 37.4;
export const BB = PE(-1.1, -1.6);
export const W_FROM = PE(-2.4, 6.5);
// punti di rimbalzo, tutti nell'acqua
export const W_PTS = [PE(2.2, 3.6), PE(0.9, 2.5), PE(2.8, 1.6), PE(1.1, 0.5), PE(2.4, -0.5)];
export const caps = polySegs([W_FROM, ...W_PTS, BB]);

export function costruisci(at, acqua, nBB) {
  acqua.zigNeutron([W_FROM, ...W_PTS, BB.clone().addScaledVector(dirTo(W_PTS[W_PTS.length - 1], BB), -0.25)], W_IN, { t1: B8_HIT, K: 0.74, trail: 10 });
  nBB.hitAt = B8_HIT; at.fission(nBB, B8_HIT, V(0.4, -1, 0), 0.75, 1.5, 0.6);
  // i due neutroni nati: verso l'interno della barra, assorbiti dai U-238 più vicini (direzioni diverse, lontani dalla mascotte)
  const used = [dirTo(BB, W_PTS[W_PTS.length - 1])];
  const cands = at.NUCS.filter(n => n.zone === 'R' && !n.u && n.c.x < BB.x + 0.3 && !at.absorbed.has(n) && !behindMascot(n.c)).map(n => [xy(n.c, BB), n])
    .filter(([d, n]) => d > 1.3 && d < 3.8 && at.clearLine(BB, n.c, [nBB, n])).sort((p, q) => p[0] - q[0]);
  let k = 0;
  for (const [, n] of cands) {
    if (k >= 2) break;
    const dir = dirTo(BB, n.c); if (used.some(u => u.dot(dir) > 0.5)) continue;
    used.push(dir); at.absorbed.add(n); k++;
    const nn = at.neutron(at.seg(BB.clone().addScaledVector(dir, 0.32).setZ(0.15), n.c.clone().addScaledVector(dir, -0.3).setZ(0.15), B8_HIT + 0.05 + k * 0.1, 2.8), 'abs', { trail: 8 }); nn.host = n;
  }
  console.log('B8: neutroni assorbiti', k);
}

// le molecole d'acqua: densità uniforme nelle due strisce d'acqua accanto alla barra C, per tutta l'altezza vista da lontano, lontane dai percorsi dei neutroni
// (da chiamare dopo aver creato tutti i neutroni, anche quello della B9)
export function molecole(at, acqua) {
  const paths = at.NEUT.filter(n => n.keys[0][0].x > 30).flatMap(n => n.keys.slice(1).map((k, i) => [n.keys[i][0], k[0]]));
  acqua.sparse(99, { x0: XR - 16, x1: XR + 16, y0: YR - 46, y1: YR + 50, tries: 70000, paths, avoid: p => !inWater(p) || behindMascot(p) });
}
// le molecole ci sono sempre (l'acqua sta fra le barre fin dalla prima inquadratura)
export const appare = () => -10;
