// Puntata 6 — "cattura" del neutrone lento da parte di un U-235 (v7, idea dell'autore sulla v6, note a 30,5 e 37,2).
// Il neutrone lento non punta dritto al nucleo: passerebbe di lato (a MISS dal centro). Quando entra nell'alone giallo
// (a R_IN dal centro) la sua traiettoria si piega dolcemente verso il nucleo e lo spacca: per un neutrone lento
// il "bersaglio" dell'U-235 è molto più grande del nucleo (nella realtà circa 585 barn contro circa 1 per i veloci).
// I neutroni veloci invece attraversano l'alone dritti, senza essere catturati (B7: A2; B9: C9).
//
// curvaCattura(da, nucleo, lato, t0 | v0, t1) → { chiavi, ingresso }
//   da = punto di partenza del tratto dritto; lato = +1 / -1 (da che parte passa: destra / sinistra rispetto al moto)
//   restituisce le chiavi [[punto, tempo], ...] dal punto "da" fino al nucleo (a R_END dal centro), velocità costante.
import { V, dirTo } from '/comune/base.js';

export const MISS = 0.6, R_IN = 0.95, R_END = 0.25;

// punti della traiettoria (senza tempi): tratto dritto fino all'alone, poi curva di Bézier quadratica fino al nucleo
export function puntiCattura(da, nucleo, lato) {
  const d0 = dirTo(da, nucleo), perp = V(d0.y, -d0.x, 0).multiplyScalar(lato);
  const mira = nucleo.clone().addScaledVector(perp, MISS), d = dirTo(da, mira);
  const sMin = nucleo.clone().sub(da).dot(d), dmin = Math.hypot(...nucleo.clone().sub(da.clone().addScaledVector(d, sMin)).toArray().slice(0, 2));
  const sIn = sMin - Math.sqrt(Math.max(0, R_IN * R_IN - dmin * dmin));
  const S = da.clone().addScaledVector(d, sIn), B1 = da.clone().addScaledVector(d, sIn + 0.62 * R_IN);
  const B2 = nucleo.clone().addScaledVector(dirTo(nucleo, B1), R_END);
  const pts = [da.clone()];
  for (let i = 0; i <= 14; i++) { const u = i / 14, a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u;
    pts.push(V(a * S.x + b * B1.x + c * B2.x, a * S.y + b * B1.y + c * B2.y, 0)); }
  return { pts, ingresso: S };
}
const lunghezza = pts => pts.slice(1).reduce((s, p, i) => s + p.distanceTo(pts[i]), 0);

// chiavi a velocità costante fra t0 e t1
export function curvaCattura(da, nucleo, lato, t0, t1, z = 0.15) {
  const { pts, ingresso } = puntiCattura(da, nucleo, lato), L = lunghezza(pts);
  let s = 0; const chiavi = [[pts[0].clone().setZ(z), t0]];
  for (let i = 1; i < pts.length; i++) { s += pts[i].distanceTo(pts[i - 1]); chiavi.push([pts[i].clone().setZ(z), t0 + (t1 - t0) * s / L]); }
  return { chiavi, ingresso, pts };
}
export { lunghezza };
