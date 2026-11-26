// Puntata 6 — B8 (v2): l'inquadratura va sul bordo della pastiglia (barra C), fuori c'è l'acqua.
// Un neutrone veloce scende dall'alto ed esce dalla barra, rimbalza 5 volte sugli idrogeni (a ogni urto la velocità
// si moltiplica per 0,74), rientra nella barra e spacca BB a 37,4. Dei due neutroni nati da BB (v11) uno esce a sinistra
// verso il centro della pastiglia, l'altro rimbalza due volte nell'acqua ed esce a destra (nella B9 non si vedono più).
// v4: neutroni nati e frammenti veloci ("supersonici"); i frammenti escono dall'inquadratura in verticale, dentro la barra.
import { V, xy, dirTo, polySegs, segDist, setSeed, rnd } from '/comune/base.js';
import { YR, PE, E, gapL, gapR, behindMascot } from './zonaR.js';
import { puntiCattura, lunghezzaCurva, fattore, alonePulsa } from '../cattura.js';
import { fwarp, unwarp } from '../tempi.js';

export const W_IN = 34.6, B8_HIT = 37.4;
export const BB = PE(-1.1, -1.6);
export const W_FROM = PE(-2.4, 6.5);
// punti di rimbalzo, tutti nell'acqua
export const W_PTS = [PE(2.2, 3.6), PE(0.9, 2.5), PE(2.8, 1.6), PE(1.1, 0.5), PE(2.4, -0.5)];
export const caps = [...polySegs([W_FROM, ...W_PTS, BB]), [PE(-1.1, -7), PE(-1.1, 5)]];
// v7: ultimo tratto curvo (cattura da parte di BB), anche lui libero dalle molecole
const CURVA = puntiCattura(W_PTS[W_PTS.length - 1], BB, -1).pts;
// v11: percorso del neutrone nato da BB che va nell'acqua: due rimbalzi, poi esce a destra (sopra la mascotte)
const DESTRA = [PE(1.0, -2.3), PE(2.5, -1.5), PE(7.2, -3.07)];   // v12: l'ultimo tratto va ben oltre il bordo destro

export function costruisci(at, acqua, nBB) {
  // v7 (idea dell'autore sulla v6, nota a 37,2): dopo l'ultimo rimbalzo il neutrone lento non punta dritto a BB, passerebbe
  // sotto; entrato nell'alone giallo la traiettoria si piega verso BB, che lo cattura (cattura.js). Stessa velocità dell'ultimo tratto.
  const K = 0.74, P = [W_FROM, ...W_PTS], curva = CURVA;
  const tratti = P.slice(1).map((p, i) => P[i].distanceTo(p) / Math.pow(K, i));
  const v0 = (tratti.reduce((a, b) => a + b, 0) + (curva[1].distanceTo(P[P.length - 1]) + lunghezzaCurva(curva)) / Math.pow(K, P.length - 1)) / (B8_HIT - W_IN);
  const nz = acqua.zigNeutron([...P, curva[1]], W_IN, { v0, K, trail: 10 }), vF = v0 * Math.pow(K, P.length - 1);
  let tk = nz.keys[nz.keys.length - 1][1];
  for (let i = 2; i < curva.length; i++) { tk += curva[i].distanceTo(curva[i - 1]) / (vF * fattore(i - 1, curva.length - 2)); nz.keys.push([curva[i].clone().setZ(0.15), tk]); }
  alonePulsa(at, nBB, nz);
  nBB.hitAt = B8_HIT; at.fission(nBB, B8_HIT, V(0, 1, 0), 6.5, 1.3, 0.3);
  // v11 (nota dell'autore a 0:56 della v10): i due neutroni nati da BB non vengono più assorbiti. Uno va verso il centro
  // della pastiglia ed esce dall'inquadratura a sinistra (senza mostrare dove finisce); l'altro va nell'acqua, rimbalza su
  // due molecole ed esce a destra prima che la camera si allarghi sulla B9, poi sparisce.
  let dirL = null;
  for (const da of [0, 0.15, -0.15, 0.3, -0.3, 0.45, -0.45]) {
    const d = V(-Math.cos(da), Math.sin(da), 0), a = BB.clone().addScaledVector(d, 0.32), b = BB.clone().addScaledVector(d, 4.2);
    if (at.clearLine(a, b, [nBB])) { dirL = d; break; }
  }
  dirL = dirL || V(-1, 0, 0);
  at.neutron(at.seg(BB.clone().addScaledVector(dirL, 0.32).setZ(0.15), BB.clone().addScaledVector(dirL, 4.2).setZ(0.15), B8_HIT + 0.05, 9), 'out', { trail: 8 });
  const d0 = dirTo(BB, DESTRA[0]);
  // v12 (nota dell'autore a 0:56 della v11: rallentava in modo innaturale e spariva troppo presto): dopo la fissione la voce
  // fa una pausa e la WARP lì è lenta, quindi il moto di questo neutrone segue il tempo del video (7 u/s, x0,85 a ogni urto),
  // con chiavi fitte riportate in tempo di scaletta; sparisce a PE(7,2), quando è già fuori dall'inquadratura da circa 0,6 s.
  const PD = [BB.clone().addScaledVector(d0, 0.32), ...DESTRA].map(p => p.clone().setZ(0.15));
  const nd = acqua.zigNeutron(PD, B8_HIT + 0.05, { v0: 11, K: 0.85, end: 'out', trail: 8 });
  const vk = [[PD[0], fwarp(B8_HIT + 0.05)]], tb = [];
  for (let i = 0; i < PD.length - 1; i++) {
    const L = PD[i].distanceTo(PD[i + 1]), dur = L / (7 * Math.pow(0.85, i)), n = Math.max(2, Math.ceil(dur / 0.04)), tv0 = vk[vk.length - 1][1];
    for (let j = 1; j <= n; j++) vk.push([PD[i].clone().lerp(PD[i + 1], j / n), tv0 + dur * j / n]);
    tb.push(vk[vk.length - 1][1]);
  }
  const vecchi = nd.keys.map(k => k[1]);
  nd.keys = vk.map(([p, tv]) => [p, unwarp(tv)]);
  nd.bounces.forEach((b, i) => { const tn = unwarp(tb[i]); acqua.MOLS.forEach(m => { if (m.hitT === vecchi[i + 1]) m.hitT = tn; }); b.t = tn; });
  console.log('B8: neutrone a sinistra verso', dirL.toArray().map(x => x.toFixed(2)).join(','), '; neutrone a destra con 2 rimbalzi');
}

// le molecole d'acqua (v4, nota dell'autore: distribuzione davvero omogenea, niente spazi vuoti): nelle strisce d'acqua accanto
// alla barra C, per tutta l'altezza vista da lontano, con il metodo "miglior candidato" (ogni nuova molecola, fra 12 posti
// a caso, prende quello più lontano dalle altre): distanze quasi uguali, niente grumi né buchi.
// Lasciato libero solo uno stretto corridoio lungo il neutrone a zig-zag della B8; dietro la mascotte le molecole
// non si tolgono più qui: si rimpiccioliscono mentre le passano dietro (ep6.js, dietroMascotte).
export function molecole(at, acqua) {
  const strisce = [[gapL(-1) + 0.35, gapR(-1) - 0.35], [gapL(0) + 0.35, gapR(0) - 0.35]], Y0 = YR - 46, Y1 = YR + 50;
  const lane = [...polySegs([W_FROM, ...W_PTS, BB]), ...polySegs(CURVA), ...polySegs([BB, ...DESTRA])];
  const area = strisce.reduce((s, [a, b]) => s + (b - a), 0) * (Y1 - Y0), N = Math.round(area / 1.3);
  setSeed(99);
  const cell = 2, grid = new Map(), key = (x, y) => Math.floor(x / cell) + ',' + Math.floor(y / cell);
  const addG = p => { const k = key(p.x, p.y); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(p); };
  acqua.MOLS.forEach(m => addG(m.c));
  const nearest = p => { let d = 9; const cx = Math.floor(p.x / cell), cy = Math.floor(p.y / cell);
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const q of grid.get((cx + i) + ',' + (cy + j)) || []) d = Math.min(d, xy(p, q)); return d; };
  for (let k = 0; k < N; k++) {
    let best = null, bd = -1;
    for (let c = 0; c < 12; c++) {
      const [a, b] = strisce[rnd() < 0.5 ? 0 : 1], p = V(a + (b - a) * rnd(), Y0 + (Y1 - Y0) * rnd(), 0);
      if (lane.some(([u, v]) => segDist(p, u, v) < 0.36)) continue;
      const d = nearest(p); if (d > bd) { bd = d; best = p; }
    }
    if (best && bd > 0.7) { best.z = -0.1 + rnd() * 0.3; acqua.addMol(best, rnd() * 6.28); addG(best); }
  }
}
// le molecole ci sono sempre (l'acqua sta fra le barre fin dalla prima inquadratura)
export const appare = () => -10;
