// Puntata 6 — "Una centrale può esplodere come una bomba?" — MONTAGGIO (v2, scaletta dell'app di produzione del 24/11/2026).
// Qui si mettono insieme i pezzi della libreria comune (/comune) e le scene della puntata (scene/*.js):
//  - APERTURA, bomba 3D con carri armati e artiglieria (B1-B2, l'involucro diventa trasparente): scene/bomba3d.js
//  - ATOMI, zona B "bomba" (B3-B4): scene/bomba.js — sotto il lampo bianco si passa alla centrale
//  - CENTRALE (B5 e zoom nel nocciolo della B6; B10 e chiusura): scene/centrale.js
//  - ATOMI, zona R: barre di uranio con l'acqua in mezzo (scene/zonaR.js); B7 dentro la pastiglia (scene/b7.js),
//    B8 sul bordo della pastiglia con l'acqua (scene/b8.js), B9 acqua che si dilata e termometro (scene/b9.js)
//  - mascotte: mascotte6.js; tempi comuni: tempi.js
// Per correggere una scena si cambia solo il suo file. L'ordine delle costruzioni qui sotto conta (decide forme e posizioni casuali).
import { clamp01, ramp, track, fadeMat, lerp, smooth } from '/comune/base.js';
import { creaCentrale } from '/comune/centrale.js';
import { creaAtomi } from '/comune/atomi.js';
import { creaAcqua } from '/comune/acqua.js';
import { creaMascotte } from '/comune/mascotte.js';
import { creaIcone } from '/comune/icone.js';
import { creaRenderer, creaPrimoPiano, creaPalco } from '/comune/palco.js';
import { WARP, unwarp, fwarp, rt, SWITCH, CUT, START_WORLD, BAR_IN } from './tempi.js';
import * as centrale from './scene/centrale.js';
import { creaBomba3d } from './scene/bomba3d.js';
import * as bomba from './scene/bomba.js';
import * as zonaR from './scene/zonaR.js';
import * as b7 from './scene/b7.js';
import * as b8 from './scene/b8.js';
import * as b9 from './scene/b9.js';
import { posa } from './mascotte6.js';

await document.fonts.load('700 64px Poppins');
const renderer = creaRenderer();

// ---------------- mondo 1: centrale; mondo 0: la bomba dell'apertura
const C = creaCentrale();
const B3 = creaBomba3d();

// ---------------- mondo 2: atomi (zona B intorno a x = 0, zona R: le barre intorno a x = 60)
const at = creaAtomi(), acqua = creaAcqua(at, { free: p => zonaR.inWater(p) && b9.liberoPerMolecole(p) });
// nuclei scritti a mano, in quest'ordine
const nB0 = at.special(bomba.START, true, 'B');
const nA = at.special(b7.A, true, 'R'), nBB = at.special(b8.BB, true, 'R'), nC9 = at.special(b9.C9, true, 'R');
const nA2 = at.special(b7.A2, true, 'R'), nT7 = at.special(b7.T7, false, 'R');   // v3: U-235 "saltato" e U-238 che assorbe
at.sparsi(6060, [bomba.zona(nB0), ...zonaR.zona([...b7.caps, ...b8.caps, ...b9.caps])]);
at.completa();
zonaR.creaBarre(at.scene);
const N = at.NUCS;
console.log('nuclei zona B', N.filter(n => n.zone === 'B').length, 'di cui U-235', N.filter(n => n.zone === 'B' && n.u).length,
  '· zona R', N.filter(n => n.zone === 'R').length, 'di cui U-235', N.filter(n => n.zone === 'R' && n.u).length);
bomba.costruisci(at, nB0);
console.log('fissioni nella zona B', at.FISS.length);
b7.costruisci(at, nA, nA2, nT7);
b8.costruisci(at, acqua, nBB);
b9.costruisci(at, nC9);
console.log('neutroni', at.NEUT.length);
b8.molecole(at, acqua);
b9.dilata(acqua);
acqua.completa();
console.log('molecole', acqua.MOLS.length);
at.segnaAssorbiti();

// ---------------- camera degli atomi
// zona B (8,55–20,6): da lontano dentro la palla di uranio, poi da vicino; zona R: le barre viste da lontano (25,5),
// zoom lento (scala logaritmica) fino al centro di una pastiglia della barra C (28,3), poi B7, B8 (bordo), B9 (acqua)
const view = (x, y, z) => [x, y, z, x, y];
const cv = ([x, y, z]) => view(x, y, z);
const { CAM_B7, CAM_B8, CAM_B9, E } = zonaR;
const ATOM_B = track(rt([[8.55, view(0, 0.3, 44)], [11.3, view(0, 0.3, 16)], [15.9, view(0, 0.3, 15)], [19.3, view(0, 0.3, 30)], [20.6, view(0, 0.3, 31)]]));
const ATOM_R = track(rt([[28.3, cv(CAM_B7)], [33.3, cv([CAM_B7[0] - 0.15, CAM_B7[1] + 0.1, CAM_B7[2]])], [34.4, cv(CAM_B8)], [37.9, cv([CAM_B8[0], CAM_B8[1], CAM_B8[2] + 0.4])],
  [39.4, cv(CAM_B9)], [44.5, cv([CAM_B9[0], CAM_B9[1], CAM_B9[2] + 1])]]));
const logZ = (z0, z1, u) => z0 * Math.pow(z1 / z0, u);
function atomCamAt(tn) {
  const t = unwarp(tn);
  if (t < BAR_IN) return ATOM_B(tn);
  const Z = [fwarp(BAR_IN), fwarp(26.1), fwarp(28.3)];
  if (tn < Z[1]) { const u = ramp(tn, Z[0], Z[1]); return view(lerp(E - 2, E - 4, u), lerp(1, 0, u), lerp(150, 140, u)); }
  if (tn < Z[2]) { const u = smooth(ramp(tn, Z[1], Z[2])); return view(lerp(E - 4, CAM_B7[0], u), lerp(0, CAM_B7[1], u), logZ(140, CAM_B7[2], u)); }
  return ATOM_R(tn);
}

// ---------------- primo piano: mascotte e icone
const { hud, hudCam } = creaPrimoPiano();
const M = creaMascotte(hud);
const I = creaIcone(hud), termo = b9.creaIcona(I);
const P = creaPalco(renderer, hud, hudCam, B3.scene, B3.camera);

const worldAt = t => { let w = START_WORLD; for (const [s, n] of SWITCH) if (t >= s) w = n; return w; };
const fadeAt = t => { let f = 0; for (const [s, , k, d] of SWITCH) f = Math.max(f, k * clamp01(1 - Math.abs(t - s) / d) ** 0.8); return f; };
window.WARP = WARP;

window.renderFrame = function (tn) {
  const t = unwarp(tn);
  const where = worldAt(t);
  fadeMat.opacity = fadeAt(t);
  P.lampo.opacity = bomba.lampo(t);
  if (where === 'bomba') { P.mondo(B3.scene, B3.camera); B3.aggiorna(t, tn); }
  if (where === 'world') { P.mondo(C.scene, C.camera); centrale.aggiorna(C, tn); }
  if (where === 'atom') {
    P.mondo(at.scene, at.cam);
    const zoomK = at.camera(tn, atomCamAt(tn));
    const zone = t < CUT ? 'B' : 'R';
    at.hideZone(zone === 'B' ? 'R' : 'B'); at.placeNucs(zone, t, tn, zoomK);
    zonaR.aggiornaBarre(t, tn, zone === 'R');
    acqua.visible(zone === 'R'); if (zone === 'R') acqua.place(t, tn, { E: b9.expand(t), appearAt: b8.appare });
    // neutroni liberi: con la camera lontana si ingrandiscono poco (nota 19 s della v2: erano enormi)
    at.placeNeutrons(t, Math.min(1 + (zoomK - 1) * 0.3, 1.35));
    at.scaldaFondo(b9.expand(t));   // B9: il fondo si scalda un po' mentre l'acqua si dilata
  }
  termo.aggiorna(t);
  M.update(tn, t, posa(tn, t));
  I.centerIcons([termo.ic]);
  P.inizio.opacity = 1 - ramp(t, 0, 0.3);
  P.render();
};
window.DURATION = WARP[WARP.length - 1][1];
window.renderFrame(0);
window.ready = true;
