// Puntata 6 — B8 (v2): l'inquadratura va sul bordo della pastiglia (barra C), fuori c'è l'acqua.
// Un neutrone veloce scende dall'alto ed esce dalla barra, rimbalza 5 volte sugli idrogeni (a ogni urto la velocità
// si moltiplica per 0,74), rientra nella barra e spacca BB a 37,4. I due neutroni nati da BB vanno verso l'interno
// della barra e sono assorbiti da due U-238 (così nella B9 nell'acqua passa solo il neutrone veloce).
// v4: neutroni nati e frammenti veloci ("supersonici"); i frammenti escono dall'inquadratura in verticale, dentro la barra.
import { V, xy, dirTo, polySegs, segDist, setSeed, rnd } from '/comune/base.js';
import { YR, PE, E, gapL, gapR, behindMascot } from './zonaR.js';

export const W_IN = 34.6, B8_HIT = 37.4;
export const BB = PE(-1.1, -1.6);
export const W_FROM = PE(-2.4, 6.5);
// punti di rimbalzo, tutti nell'acqua
export const W_PTS = [PE(2.2, 3.6), PE(0.9, 2.5), PE(2.8, 1.6), PE(1.1, 0.5), PE(2.4, -0.5)];
export const caps = [...polySegs([W_FROM, ...W_PTS, BB]), [PE(-1.1, -7), PE(-1.1, 5)]];

export function costruisci(at, acqua, nBB) {
  acqua.zigNeutron([W_FROM, ...W_PTS, BB.clone().addScaledVector(dirTo(W_PTS[W_PTS.length - 1], BB), -0.25)], W_IN, { t1: B8_HIT, K: 0.74, trail: 10 });
  nBB.hitAt = B8_HIT; at.fission(nBB, B8_HIT, V(0, 1, 0), 6.5, 1.3, 0.3);
  // i due neutroni nati: verso l'interno della barra, assorbiti dai U-238 più vicini (direzioni diverse, lontani dalla mascotte)
  const used = [dirTo(BB, W_PTS[W_PTS.length - 1]), V(0, 1, 0), V(0, -1, 0)];
  const cands = at.NUCS.filter(n => n.zone === 'R' && !n.u && n.c.x < BB.x + 0.3 && !at.absorbed.has(n) && !behindMascot(n.c)).map(n => [xy(n.c, BB), n])
    .filter(([d, n]) => d > 1.3 && d < 4.5 && at.clearLine(BB, n.c, [nBB, n])).sort((p, q) => p[0] - q[0]);
  let k = 0;
  for (const [, n] of cands) {
    if (k >= 2) break;
    const dir = dirTo(BB, n.c); if (used.some(u => u.dot(dir) > 0.8)) continue;
    used.push(dir); at.absorbed.add(n); k++;
    const nn = at.neutron(at.seg(BB.clone().addScaledVector(dir, 0.32).setZ(0.15), n.c.clone().addScaledVector(dir, -0.3).setZ(0.15), B8_HIT + 0.05, 9), 'abs', { trail: 8 }); nn.host = n;
  }
  console.log('B8: neutroni assorbiti', k);
}

// le molecole d'acqua (v4, nota dell'autore: distribuzione davvero omogenea, niente spazi vuoti): nelle strisce d'acqua accanto
// alla barra C, per tutta l'altezza vista da lontano, con il metodo "miglior candidato" (ogni nuova molecola, fra 12 posti
// a caso, prende quello più lontano dalle altre): distanze quasi uguali, niente grumi né buchi.
// Lasciato libero solo uno stretto corridoio lungo il neutrone a zig-zag della B8; dietro la mascotte le molecole
// non si tolgono più qui: si rimpiccioliscono mentre le passano dietro (ep6.js, dietroMascotte).
export function molecole(at, acqua) {
  const strisce = [[gapL(-1) + 0.35, gapR(-1) - 0.35], [gapL(0) + 0.35, gapR(0) - 0.35]], Y0 = YR - 46, Y1 = YR + 50;
  const lane = [...polySegs([W_FROM, ...W_PTS, BB])];
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
