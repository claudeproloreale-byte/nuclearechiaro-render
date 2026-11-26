// Puntata 6 — "cattura" del neutrone lento da parte di un U-235 (v7, idea dell'autore sulla v6, note a 30,5 e 37,2).
// Il neutrone lento non punta dritto al nucleo: passerebbe di lato (a MISS dal centro). Quando entra nell'alone giallo
// (a R_IN dal centro) la sua traiettoria si piega dolcemente verso il nucleo e lo spacca: per un neutrone lento
// il "bersaglio" dell'U-235 è molto più grande del nucleo (nella realtà circa 585 barn contro circa 1 per i veloci).
// I neutroni veloci invece attraversano l'alone dritti, senza essere catturati (B7: A2; B9: C9).
//
// curvaCattura(da, nucleo, lato, t0 | v0, t1) → { chiavi, ingresso }
//   da = punto di partenza del tratto dritto; lato = +1 / -1 (da che parte passa: destra / sinistra rispetto al moto)
//   restituisce le chiavi [[punto, tempo], ...] dal punto "da" fino al nucleo (a R_END dal centro), velocità costante.
import { V, dirTo, xy, smooth, clamp01 } from '/comune/base.js';

// v8 (autore: "accentuare un po' di più"): passa più lontano (0,85 invece di 0,6), la curva comincia appena dentro l'alone
// ed è più stretta; nella curva il neutrone accelera (fino a ACC volte), come tirato dal nucleo; l'alone si illumina (alonePulsa)
export const MISS = 0.85, R_IN = 1.1, R_END = 0.25, ACC = 1.7;
// fattore di velocità sul tratto i della curva (n tratti): da 1 a ACC
export const fattore = (i, n) => 1 + (ACC - 1) * smooth(i / n);

// punti della traiettoria (senza tempi): tratto dritto fino all'alone, poi curva di Bézier quadratica fino al nucleo
export function puntiCattura(da, nucleo, lato) {
  const d0 = dirTo(da, nucleo), perp = V(d0.y, -d0.x, 0).multiplyScalar(lato);
  const mira = nucleo.clone().addScaledVector(perp, MISS), d = dirTo(da, mira);
  const sMin = nucleo.clone().sub(da).dot(d), dmin = Math.hypot(...nucleo.clone().sub(da.clone().addScaledVector(d, sMin)).toArray().slice(0, 2));
  const sIn = sMin - Math.sqrt(Math.max(0, R_IN * R_IN - dmin * dmin));
  const S = da.clone().addScaledVector(d, sIn), B1 = da.clone().addScaledVector(d, sIn + 0.45 * R_IN);
  const B2 = nucleo.clone().addScaledVector(dirTo(nucleo, B1), R_END);
  const pts = [da.clone()];
  for (let i = 0; i <= 14; i++) { const u = i / 14, a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u;
    pts.push(V(a * S.x + b * B1.x + c * B2.x, a * S.y + b * B1.y + c * B2.y, 0)); }
  return { pts, ingresso: S };
}
const lunghezza = pts => pts.slice(1).reduce((s, p, i) => s + p.distanceTo(pts[i]), 0);

// chiavi fra t0 e t1: velocità costante sul tratto dritto, poi accelera nella curva
export function curvaCattura(da, nucleo, lato, t0, t1, z = 0.15) {
  const { pts, ingresso } = puntiCattura(da, nucleo, lato), n = pts.length - 2;
  const w = pts.slice(1).map((p, i) => p.distanceTo(pts[i]) / (i === 0 ? 1 : fattore(i, n))), W = w.reduce((a, b) => a + b, 0);
  let s = 0; const chiavi = [[pts[0].clone().setZ(z), t0]];
  for (let i = 1; i < pts.length; i++) { s += w[i - 1]; chiavi.push([pts[i].clone().setZ(z), t0 + (t1 - t0) * s / W]); }
  return { chiavi, ingresso, pts };
}
// lunghezza "pesata" della curva (pts[1..]) per chi calcola i tempi da sé (B8): tempo = questa / velocità d'ingresso
export const lunghezzaCurva = pts => pts.slice(2).reduce((s, p, i) => s + p.distanceTo(pts[i + 1]) / fattore(i + 1, pts.length - 2), 0);
// l'alone del nucleo si accende mentre il neutrone lento ci è dentro (fino alla fissione)
export function alonePulsa(at, nucleo, neutrone) {
  const prev = at.haloNear;
  at.haloNear = (n, t) => { const p0 = prev ? prev(n, t) : 0; if (n !== nucleo) return p0;
    const p = at.npos(neutrone, t); return p ? Math.max(p0, 1.1 * smooth(clamp01((R_IN + 0.15 - xy(p, n.c)) / 0.7))) : p0; };
}
export { lunghezza };
