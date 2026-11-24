// Puntata 6 — B9 (zona R): il termometro (in alto a destra) sale 35,2–36,6; l'acqua "si dilata" 36,0–37,2
// (le molecole si allontanano dal percorso del neutrone e dal centro, tremano di più, il fondo si scalda);
// un neutrone veloce attraversa senza rimbalzare (36,9–38,7) e passa accanto a C9 senza spaccarlo (l'alone sobbalza);
// il termometro scende 38,8–39,9.
import { V, smooth, ramp, pop, xy, segDist, segAt, dirTo } from '/comune/base.js';
import { XR, YR, PR } from './zonaR.js';

export const TH_UP = [35.2, 36.6], EXP = [36.0, 37.2], N9 = [36.9, 38.7], TH_DOWN = [38.8, 39.9];
export const N9_A = PR(-2.0, -5.6), N9_B = PR(2.3, 6.4);
// U-235 vicino al percorso: il neutrone veloce non lo spacca
export const C9 = segAt(N9_A, N9_B, 0.72).addScaledVector(V(-(N9_B.y - N9_A.y), N9_B.x - N9_A.x, 0).normalize(), -0.75);
export const caps = [[N9_A, N9_B]];
// le molecole dei rimbalzi della B8 non vanno sul percorso del neutrone veloce
export const liberoPerMolecole = p => segDist(p, N9_A, N9_B) > 0.6;

let n9 = null;
export function costruisci(at, nC9) {
  n9 = at.neutron(at.seg(N9_A.clone().setZ(0.15), N9_B.clone().setZ(0.15), N9[0], N9_A.distanceTo(N9_B) / (N9[1] - N9[0])), 'exit', { trail: 12 });
  at.haloNear = (n, t) => { if (n !== nC9) return 0; const pn = at.npos(n9, t); return pn ? Math.exp(-(xy(pn, n.c) ** 2) / 0.5) : 0; };
}

// dilatazione: ogni molecola si allontana dal percorso del neutrone e un po' dal centro
export function dilata(acqua) {
  const d = dirTo(N9_A, N9_B), pr = V(-d.y, d.x, 0);
  acqua.MOLS.forEach(m => { const s = Math.sign(V(m.c.x - N9_A.x, m.c.y - N9_A.y, 0).dot(pr)) || 1, near = Math.exp(-(segDist(m.c, N9_A, N9_B) ** 2) / 1.2);
    m.push = pr.clone().multiplyScalar(s * 0.5 * near).add(V(m.c.x - XR, m.c.y - YR, 0).multiplyScalar(0.12)); });
}
// quanto è dilatata l'acqua (0..1): quando la reazione rallenta torna indietro solo in parte
export const expand = t => smooth(ramp(t, EXP[0], EXP[1])) * (1 - 0.55 * smooth(ramp(t, TH_DOWN[0], TH_DOWN[1])));

// icona del termometro nel primo piano
export function creaIcona(I) {
  const ic = I.icon(0.98, 1.25, 0.4), th = I.makeThermo(ic.c);
  return { ic, aggiorna(t) { I.showIcon(ic, pop(t, 34.6, 40.3)); th.set(0.35 + 0.55 * smooth(ramp(t, TH_UP[0], TH_UP[1])) - 0.45 * smooth(ramp(t, TH_DOWN[0], TH_DOWN[1]))); } };
}
