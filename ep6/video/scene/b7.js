// Puntata 6 — B7 (zona R): un neutrone lento arriva dal basso e spacca A a 26,6;
// due neutroni finiscono assorbiti da U-238 (piccolo lampo e sobbalzo), uno esce.
import { V, xy, dirTo } from '/comune/base.js';
import { XR, YR, PR } from './zonaR.js';

export const A_IN = 24.0, A_HIT = 26.6;
export const A = PR(-0.9, 1.7), A_FROM = PR(-0.55, -6.6);
export const caps = [[A_FROM, A]];

export function costruisci(at, nA) {
  at.neutron([[A_FROM.clone().setZ(0.15), A_IN], [A.clone().addScaledVector(dirTo(A_FROM, A), -0.25).setZ(0.15), A_HIT]], 'hit');
  nA.hitAt = A_HIT; at.fission(nA, A_HIT, V(1, 0.35, 0), 0.8, 1.6, 0.8);
  // i due U-238 più vicini, in direzioni diverse, ben dentro l'inquadratura e lontani dalla mascotte
  const vis = n => Math.abs(n.c.x - XR) < 2.2 && n.c.y > YR - 2.6 && n.c.y < YR + 3.4 && !(n.c.x > XR + 0.6 && n.c.y < YR - 1.6);
  const cands = at.NUCS.filter(n => n.zone === 'R' && !n.u && vis(n)).map(n => [xy(n.c, A), n]).filter(([d, n]) => d > 1.3 && d < 4.2 && at.clearLine(A, n.c, [nA, n])).sort((p, q) => p[0] - q[0]);
  const used = [];
  for (const [d, n] of cands) {
    if (used.length >= 2) break;
    const dir = dirTo(A, n.c); if (used.some(u => u.dot(dir) > 0.5)) continue;
    used.push(dir); at.absorbed.add(n);
    const nn = at.neutron(at.seg(A.clone().addScaledVector(dir, 0.32).setZ(0.15), n.c.clone().addScaledVector(dir, -0.3).setZ(0.15), A_HIT + 0.05 + used.length * 0.12, 2.4), 'abs', { trail: 8 }); nn.host = n;
  }
  console.log('B7: neutroni assorbiti', used.length);
  at.emitOthers(nA, A_HIT, 1, 3.2, used, false, 8);
}
