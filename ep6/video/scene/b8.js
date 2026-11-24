// Puntata 6 — B8 (zona R): compaiono le molecole d'acqua da 30,2; un neutrone entra da sinistra a 30,8,
// rimbalza 5 volte sugli idrogeni (a ogni urto la velocità si moltiplica per 0,74) e spacca BB a 33,6.
import { V, lerp, dirTo, polySegs } from '/comune/base.js';
import { XR, YR, PR, behindMascot } from './zonaR.js';

export const MOL_IN = 30.2, W_IN = 30.8, B8_HIT = 33.6;
export const BB = PR(0.45, -0.35);
export const W_FROM = PR(-3.6, 3.0);
// punti di rimbalzo: a zig-zag lungo la retta da W_FROM a BB
export const W_PTS = (() => { const d = dirTo(W_FROM, BB), pr = V(-d.y, d.x, 0), L = W_FROM.distanceTo(BB);
  return Array.from({ length: 5 }, (_, i) => W_FROM.clone().addScaledVector(d, L * (i + 1) / 6.2).addScaledVector(pr, 0.5 * (i % 2 ? -1 : 1))); })();
export const caps = polySegs([W_FROM, ...W_PTS, BB]);

export function costruisci(at, acqua, nBB) {
  acqua.zigNeutron([W_FROM, ...W_PTS, BB.clone().addScaledVector(dirTo(W_PTS[W_PTS.length - 1], BB), -0.25)], W_IN, { t1: B8_HIT, K: 0.74, trail: 10 });
  nBB.hitAt = B8_HIT; at.fission(nBB, B8_HIT, V(1, -0.6, 0), 0.75, 1.5, 0.6);
  at.emitOthers(nBB, B8_HIT, 2, 2.4, [dirTo(BB, W_PTS[W_PTS.length - 1])], true);   // anche questi rimbalzano sull'acqua
}

// le altre molecole, sparse negli spazi liberi della zona R e lontane dai percorsi dei neutroni ancora in volo
// (da chiamare dopo aver creato tutti i neutroni, anche quello della B9)
export function molecole(at, acqua) {
  const paths = at.NEUT.filter(n => at.tEnd(n) > MOL_IN && n.keys[0][0].x > 15).flatMap(n => n.keys.slice(1).map((k, i) => [n.keys[i][0], k[0]]));
  acqua.sparse(99, { x0: XR - 4, x1: XR + 4, y0: YR - 6, y1: YR + 7, tries: 6000, paths, avoid: behindMascot });
}
// le molecole compaiono dal basso verso l'alto
export const appare = m => MOL_IN + (m.c.y - YR + 6) * 0.035;
