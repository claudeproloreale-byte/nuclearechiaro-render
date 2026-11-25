// Puntata 6 — B7 (v3, zona R, dentro la barra C): un neutrone lento arriva dal basso e spacca A a 30,6.
// Tutto più lento che nella v2 (nota dell'autore: sembrava velocissimo): frammenti che si allontanano piano, neutroni lenti.
// Dei neutroni nati da A: uno passa vicino a un altro U-235 (A2) senza spaccarlo (l'alone sobbalza) e si attacca
// a un U-238 più in là (T7); due finiscono assorbiti da altri U-238 (piccolo lampo e sobbalzo); uno esce verso sinistra.
import { V, xy, dirTo, segAt } from '/comune/base.js';
import { XR, YR, PR } from './zonaR.js';

export const A_IN = 28.0, A_HIT = 30.6;
export const A = PR(-0.9, 1.7), A_FROM = PR(-0.55, -6.6);
// il neutrone che "salta" l'U-235: da A verso T7 (U-238), passando a 0,6 da A2 (U-235)
export const T7 = PR(1.9, 0.9);
export const A2 = segAt(A, T7, 0.5).addScaledVector(V(-(T7.y - A.y), T7.x - A.x, 0).normalize(), -0.6);
export const caps = [[A_FROM, A], [A, T7]];
const V_LENTO = 1.3;

export function costruisci(at, nA, nA2, nT7) {
  at.neutron([[A_FROM.clone().setZ(0.15), A_IN], [A.clone().addScaledVector(dirTo(A_FROM, A), -0.25).setZ(0.15), A_HIT]], 'hit');
  nA.hitAt = A_HIT; at.fission(nA, A_HIT, V(0.35, 1, 0), 0.9, 2.6, 1.0);
  // il neutrone che passa accanto ad A2 e si attacca a T7
  const dP = dirTo(A, T7); at.absorbed.add(nT7);
  const np = at.neutron(at.seg(A.clone().addScaledVector(dP, 0.32).setZ(0.15), T7.clone().addScaledVector(dP, -0.3).setZ(0.15), A_HIT + 0.08, V_LENTO), 'abs', { trail: 8 }); np.host = nT7;
  const prev = at.haloNear;
  at.haloNear = (n, t) => { if (n !== nA2) return prev ? prev(n, t) : 0; const pn = at.npos(np, t); return pn ? Math.exp(-(xy(pn, n.c) ** 2) / 0.35) : 0; };
  // due U-238 vicini, in direzioni diverse, ben dentro l'inquadratura e lontani dalla mascotte
  const vis = n => Math.abs(n.c.x - XR) < 2.2 && n.c.y > YR - 2.6 && n.c.y < YR + 3.4 && !(n.c.x > XR + 0.6 && n.c.y < YR - 1.6);
  const cands = at.NUCS.filter(n => n.zone === 'R' && !n.u && vis(n) && !at.absorbed.has(n)).map(n => [xy(n.c, A), n]).filter(([d, n]) => d > 1.3 && d < 4.2 && at.clearLine(A, n.c, [nA, n])).sort((p, q) => p[0] - q[0]);
  const used = [dP];
  for (const [, n] of cands) {
    if (used.length >= 3) break;
    const dir = dirTo(A, n.c); if (used.some(u => u.dot(dir) > 0.5)) continue;
    used.push(dir); at.absorbed.add(n);
    const nn = at.neutron(at.seg(A.clone().addScaledVector(dir, 0.32).setZ(0.15), n.c.clone().addScaledVector(dir, -0.3).setZ(0.15), A_HIT + 0.05 + used.length * 0.12, V_LENTO), 'abs', { trail: 8 }); nn.host = n;
  }
  console.log('B7: neutroni assorbiti', used.length - 1, '+ quello che salta A2');
  // l'ultimo esce dall'inquadratura verso sinistra (lontano dall'acqua della barra C, dove nella B8 e B9 si guarda)
  at.emitOthers(nA, A_HIT, 1, 1.6, [...used, V(1, 0, 0), V(0.7, 0.7, 0).normalize(), V(0.7, -0.7, 0).normalize()], false, 8);
}
