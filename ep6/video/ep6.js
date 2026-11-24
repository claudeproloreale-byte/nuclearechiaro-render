// Puntata 6 — "Una centrale può esplodere come una bomba?" — MONTAGGIO (bozza 1).
// Qui si mettono insieme i pezzi della libreria comune (/comune) e le scene della puntata (scene/*.js):
//  - CENTRALE (apertura e chiusura): scene/centrale.js
//  - ATOMI, zona B "bomba" (B5): scene/bomba.js — si passa alla zona R sotto il lampo bianco
//  - ATOMI, zona R "centrale": scene/zonaR.js (comune), scene/b7.js, scene/b8.js (acqua), scene/b9.js (acqua che si dilata, termometro)
//  - mascotte: mascotte6.js; tempi comuni: tempi.js
// Per correggere una scena si cambia solo il suo file. L'ordine delle costruzioni qui sotto conta (decide forme e posizioni casuali).
import { clamp01, ramp, track, fadeMat } from '/comune/base.js';
import { creaCentrale } from '/comune/centrale.js';
import { creaAtomi } from '/comune/atomi.js';
import { creaAcqua } from '/comune/acqua.js';
import { creaMascotte } from '/comune/mascotte.js';
import { creaIcone } from '/comune/icone.js';
import { creaRenderer, creaPrimoPiano, creaPalco } from '/comune/palco.js';
import { WARP, unwarp, fwarp, rt, SWITCH, CUT } from './tempi.js';
import * as centrale from './scene/centrale.js';
import * as bomba from './scene/bomba.js';
import * as zonaR from './scene/zonaR.js';
import * as b7 from './scene/b7.js';
import * as b8 from './scene/b8.js';
import * as b9 from './scene/b9.js';
import { posa } from './mascotte6.js';

await document.fonts.load('700 64px Poppins');
const renderer = creaRenderer();

// ---------------- mondo 1: centrale
const C = creaCentrale();

// ---------------- mondo 2: atomi (zona B e zona R, lontane)
const at = creaAtomi(), acqua = creaAcqua(at, { free: b9.liberoPerMolecole });
// nuclei scritti a mano, in quest'ordine
const nB0 = at.special(bomba.START, true, 'B');
const nA = at.special(b7.A, true, 'R'), nBB = at.special(b8.BB, true, 'R'), nC9 = at.special(b9.C9, true, 'R');
at.sparsi(6060, [bomba.zona(nB0), zonaR.zona([...b7.caps, ...b8.caps, ...b9.caps])]);
at.completa();
const N = at.NUCS;
console.log('nuclei zona B', N.filter(n => n.zone === 'B').length, 'di cui U-235', N.filter(n => n.zone === 'B' && n.u).length,
  '· zona R', N.filter(n => n.zone === 'R').length, 'di cui U-235', N.filter(n => n.zone === 'R' && n.u).length);
bomba.costruisci(at, nB0);
console.log('fissioni nella zona B', at.FISS.length);
b7.costruisci(at, nA);
b8.costruisci(at, acqua, nBB);
b9.costruisci(at, nC9);
console.log('neutroni', at.NEUT.length);
b8.molecole(at, acqua);
b9.dilata(acqua);
acqua.completa();
console.log('molecole', acqua.MOLS.length);
at.segnaAssorbiti();
// camera degli atomi: zona B fino a CUT (sotto il lampo bianco), poi zona R
const view = (x, y, z) => [x, y, z, x, y];
const { XR, YR } = zonaR;
const ATOM_TRACK = track(rt([[5.0, view(0, 0.3, 50)], [9.0, view(0, 0.3, 44)], [11.8, view(0, 0.3, 16)], [15.4, view(0, 0.3, 15)], [18.8, view(0, 0.3, 30)],
  [CUT - 0.02, view(0, 0.3, 31)], [CUT, view(XR, YR - 0.6, 26)], [22.8, view(XR, YR - 0.8, 17)], [29.5, view(XR - 0.15, YR - 0.7, 16.5)], [34.2, view(XR + 0.1, YR - 0.9, 16.5)], [40.0, view(XR + 0.1, YR - 0.8, 17.5)]]));
const atomCamAt = tn => unwarp(tn) < CUT ? ATOM_TRACK(Math.min(tn, fwarp(CUT - 0.02))) : ATOM_TRACK(Math.max(tn, fwarp(CUT)));

// ---------------- primo piano: mascotte e icone
const { hud, hudCam } = creaPrimoPiano();
const M = creaMascotte(hud);
const I = creaIcone(hud), termo = b9.creaIcona(I);
const P = creaPalco(renderer, hud, hudCam, C.scene, C.camera);

const worldAt = t => { let w = 'world'; for (const [s, n] of SWITCH) if (t >= s) w = n; return w; };
const fadeAt = t => { let f = 0; for (const [s, , k, d] of SWITCH) f = Math.max(f, k * clamp01(1 - Math.abs(t - s) / d) ** 0.8); return f; };
window.WARP = WARP;

window.renderFrame = function (tn) {
  const t = unwarp(tn);
  const where = worldAt(t);
  fadeMat.opacity = fadeAt(t);
  P.lampo.opacity = bomba.lampo(t);
  if (where === 'world') { P.mondo(C.scene, C.camera); centrale.aggiorna(C, tn); }
  if (where === 'atom') {
    P.mondo(at.scene, at.cam);
    const zoomK = at.camera(tn, atomCamAt(tn));
    const zone = t < CUT ? 'B' : 'R';
    at.hideZone(zone === 'B' ? 'R' : 'B'); at.placeNucs(zone, t, tn, zoomK);
    acqua.visible(zone === 'R'); if (zone === 'R') acqua.place(t, tn, { E: b9.expand(t), appearAt: b8.appare });
    at.placeNeutrons(t, zoomK);
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
