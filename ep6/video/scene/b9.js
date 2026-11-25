// Puntata 6 — B9 (v2, inquadratura sull'acqua fra la barra C e la barra R): il termometro (in alto a destra) sale 39,1–40,5;
// l'acqua "si dilata" 39,9–41,1: le molecole si allontanano l'una dall'altra in modo uniforme (molte escono dall'inquadratura,
// in alto e in basso) e tremano di più; il fondo si scalda un po'.
// Un neutrone veloce esce dalla barra C, attraversa l'acqua senza rimbalzare (40,8–42,6), entra nella barra R
// e passa accanto all'U-235 C9 senza spaccarlo (l'alone sobbalza), poi esce dall'inquadratura. Il termometro scende 42,7–43,8.
import { V, smooth, ramp, pop, xy, segDist, segAt } from '/comune/base.js';
import { PE, CAM_B9 } from './zonaR.js';

export const TH_UP = [39.1, 40.5], EXP = [39.9, 41.1], N9 = [40.8, 42.6], TH_DOWN = [42.7, 43.8];
export const N9_A = PE(-3, -7.5), N9_B = PE(12, 5);
// U-235 nella barra R vicino al percorso: il neutrone veloce non lo spacca
const U9 = (9.6 + 3) / 15;
export const C9 = segAt(N9_A, N9_B, U9).addScaledVector(V(-(N9_B.y - N9_A.y), N9_B.x - N9_A.x, 0).normalize(), 0.75);
export const caps = [[N9_A, N9_B]];
// le molecole dei rimbalzi non vanno sul percorso del neutrone veloce
export const liberoPerMolecole = p => segDist(p, N9_A, N9_B) > 0.6;

let n9 = null;
export function costruisci(at, nC9) {
  n9 = at.neutron(at.seg(N9_A.clone().setZ(0.15), N9_B.clone().setZ(0.15), N9[0], N9_A.distanceTo(N9_B) / (N9[1] - N9[0])), 'exit', { trail: 12 });
  const prev = at.haloNear;
  at.haloNear = (n, t) => { if (n !== nC9) return prev ? prev(n, t) : 0; const pn = at.npos(n9, t); return pn ? Math.exp(-(xy(pn, n.c) ** 2) / 0.5) : 0; };
}

// dilatazione (v3, nota dell'autore: niente spazi vuoti a caso): le molecole si allontanano tutte allo stesso modo,
// in verticale dal centro dell'inquadratura (fattore F): restano distribuite in modo uniforme, solo più rade, e molte escono.
// Quelle che finirebbero sul percorso del neutrone si scostano appena (0,55): il neutrone passa in mezzo senza toccarne nessuna.
const F = 2.5, YC = CAM_B9[1], LIBERO = 0.55;
export function dilata(acqua) {
  const d = V(N9_B.x - N9_A.x, N9_B.y - N9_A.y, 0).normalize(), nrm = V(-d.y, d.x, 0);
  acqua.MOLS.forEach(m => {
    const push = V(0, (m.c.y - YC) * (F - 1), 0), q = m.c.clone().add(push);
    const s = segDist(q, N9_A, N9_B);
    if (s < LIBERO) { const side = Math.sign(q.clone().sub(N9_A).dot(nrm)) || 1; push.addScaledVector(nrm, side * (LIBERO - s + 0.05)); }
    m.push = push;
  });
}
// quanto è dilatata l'acqua (0..1): quando la reazione rallenta torna indietro solo in parte
export const expand = t => smooth(ramp(t, EXP[0], EXP[1])) * (1 - 0.55 * smooth(ramp(t, TH_DOWN[0], TH_DOWN[1])));

// icona del termometro nel primo piano
export function creaIcona(I) {
  const ic = I.icon(0.98, 1.25, 0.4), th = I.makeThermo(ic.c);
  return { ic, aggiorna(t) { I.showIcon(ic, pop(t, 38.5, 44.2)); th.set(0.35 + 0.55 * smooth(ramp(t, TH_UP[0], TH_UP[1])) - 0.45 * smooth(ramp(t, TH_DOWN[0], TH_DOWN[1]))); } };
}
