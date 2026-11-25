// Puntata 6 — B7 (v6, zona R, dentro la barra C): un neutrone lento (moderato) arriva dal basso a destra e spacca A a 30,6.
// Neutroni nati e frammenti sono VELOCI ("supersonici", nota dell'autore sulla v3): i frammenti escono subito dall'inquadratura
// (rallentano e svaniscono solo fuori campo), i neutroni volano a V_VELOCE.
// Tutti i neutroni nati da A partono insieme (v5). Uno scende, passa accanto all'U-235 A2 senza spaccarlo (l'alone sobbalza) e si attacca all'U-238 T7
// (posizioni indicate dall'autore sul fotogramma a 30,75 della v3); due finiscono assorbiti da altri U-238; uno esce a sinistra.
import { V, xy, dirTo } from '/comune/base.js';
import { XR, YR, PR } from './zonaR.js';

export const A_IN = 28.0, A_HIT = 30.6;
// v6: il neutrone lento arriva dal basso a destra (freccia dell'autore sul fotogramma a 29,1 della v5), da fuori campo;
// passa dove di solito sta la mascotte, che per quel tratto si sposta (mascotte6.js)
export const A = PR(-0.9, 1.7), A_FROM = PR(2.96, -5.38);
// v5: posizioni cambiate dall'autore sul fotogramma a 30,8 della v4 (cerchio bianco = U-238 che cattura, giallo = U-235 mancato);
// A2 è spostato di poco (0,45 a sinistra) perché il neutrone gli passi a 0,6 di lato e non lo colpisca
export const T7 = PR(1.1, -4.1);
const dAT = T7.clone().sub(A).normalize();
export const A2 = A.clone().addScaledVector(T7.clone().sub(A), 0.652).addScaledVector(V(dAT.y, -dAT.x, 0), 0.6);   // a sinistra del percorso (lontano dalla mascotte)
const FRAG_AX = V(-0.6, 0.8, 0).normalize();               // i due frammenti: in alto a sinistra e in basso a destra (lungo il corridoio del neutrone in arrivo), fuori campo
export const caps = [[A_FROM, A], [A, T7], [A.clone().addScaledVector(FRAG_AX, -4), A.clone().addScaledVector(FRAG_AX, 4)]];
const V_VELOCE = 9;

export function costruisci(at, nA, nA2, nT7) {
  at.neutron([[A_FROM.clone().setZ(0.15), A_IN], [A.clone().addScaledVector(dirTo(A_FROM, A), -0.25).setZ(0.15), A_HIT]], 'hit');
  nA.hitAt = A_HIT; at.fission(nA, A_HIT, FRAG_AX, 6, 1.3, 0.3);
  // il neutrone che passa accanto ad A2 e si attacca a T7
  const dP = dirTo(A, T7); at.absorbed.add(nT7);
  const np = at.neutron(at.seg(A.clone().addScaledVector(dP, 0.32).setZ(0.15), T7.clone().addScaledVector(dP, -0.3).setZ(0.15), A_HIT + 0.05, V_VELOCE), 'abs', { trail: 8 }); np.host = nT7;
  // l'alone di A2 sobbalza quando il neutrone passa, e si calma piano (il neutrone è velocissimo)
  const prev = at.haloNear;
  at.haloNear = (n, t) => { if (n !== nA2) return prev ? prev(n, t) : 0;
    let m = 0; for (let k = 0; k < 8; k++) { const pn = at.npos(np, t - k * 0.06); if (pn) m = Math.max(m, Math.exp(-(xy(pn, n.c) ** 2) / 0.35) * (1 - k / 8)); } return m; };
  // due U-238 vicini, in direzioni diverse, ben dentro l'inquadratura e lontani dalla mascotte e dai frammenti
  const vis = n => Math.abs(n.c.x - XR) < 2.3 && n.c.y > YR - 3.6 && n.c.y < YR + 3.5 && !(n.c.x > XR + 0.4 && n.c.y < YR - 1.4);
  const cands = at.NUCS.filter(n => n.zone === 'R' && !n.u && vis(n) && !at.absorbed.has(n)).map(n => [xy(n.c, A), n]).filter(([d, n]) => d > 1.3 && d < 5 && at.clearLine(A, n.c, [nA, n])).sort((p, q) => p[0] - q[0]);
  const used = [dP, FRAG_AX, FRAG_AX.clone().negate()];
  for (const [, n] of cands) {
    if (used.length >= 4) break;
    const dir = dirTo(A, n.c); if (used.some(u => u.dot(dir) > 0.8)) continue;
    used.push(dir); at.absorbed.add(n);
    const nn = at.neutron(at.seg(A.clone().addScaledVector(dir, 0.32).setZ(0.15), n.c.clone().addScaledVector(dir, -0.3).setZ(0.15), A_HIT + 0.05, V_VELOCE), 'abs', { trail: 8 }); nn.host = n;
  }
  console.log('B7: neutroni assorbiti', used.length - 3, '+ quello che salta A2; candidati', cands.map(([d, n]) => [d.toFixed(2), (n.c.x - XR).toFixed(2), (n.c.y - YR).toFixed(2)].join(' ')).join(' | '));
  // l'ultimo esce dall'inquadratura verso sinistra (lontano dall'acqua della barra C, dove nella B8 e B9 si guarda)
  at.emitOthers(nA, A_HIT, 1, V_VELOCE, [...used, V(1, 0, 0), V(0.7, 0.7, 0).normalize(), V(0.7, -0.7, 0).normalize()], false, 8);
}
