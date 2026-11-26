// Puntata 7 — "Cos'è davvero la radioattività" — MONTAGGIO (bozza 1, scaletta dell'app di produzione del 26/11/2026).
//  - SPAZIO, saluto (B1): scene/spazio.js
//  - COLLINA: lato natura (B2–B4, B10–B12), la centrale (B13), barriere nella cupola (B14–B16): scene/collina.js
//  - ATOMI (B5–B9): nuclei instabili, decadimenti alfa, beta e gamma, tempo di dimezzamento: scene/atomi.js con nuclei7.js
//  - PRIMO PIANO: icone, sagoma, bilancia, cubetti, aeroplanino, fusto: scene/primopiano.js
//  - mascotte: mascotte7.js; tempi comuni: tempi.js
import { clamp01, ramp, fadeMat } from '/comune/base.js';
import { creaCentrale } from '/comune/centrale.js';
import { creaAtomi } from '/comune/atomi.js';
import { creaMascotte } from '/comune/mascotte.js';
import { creaIcone } from '/comune/icone.js';
import { creaRenderer, creaPrimoPiano, creaPalco } from '/comune/palco.js';
import { WARP, unwarp, SWITCH, START_WORLD } from './tempi.js';
import { creaSpazio } from './scene/spazio.js';
import { creaCollina } from './scene/collina.js';
import * as atomi from './scene/atomi.js';
import { creaPrimoPiano7 } from './scene/primopiano.js';
import { posa } from './mascotte7.js';

await document.fonts.load('700 64px Poppins');
const renderer = creaRenderer();

const S = creaSpazio();
const C = creaCentrale(), COL = creaCollina(C);
const at = creaAtomi(), K = atomi.creaScena(at);

const { hud, hudCam } = creaPrimoPiano();
const M = creaMascotte(hud);
const I = creaIcone(hud), PP = creaPrimoPiano7(I, hud);
const P = creaPalco(renderer, hud, hudCam, S.scene, S.camera);

const worldAt = t => { let w = START_WORLD; for (const [s, n] of SWITCH) if (t >= s) w = n; return w; };
const fadeAt = t => { let f = 0; for (const [s, , k, d] of SWITCH) f = Math.max(f, k * clamp01(1 - Math.abs(t - s) / d) ** 0.8); return f; };
window.WARP = WARP;

window.renderFrame = function (tn) {
  const t = unwarp(tn);
  const where = worldAt(t);
  fadeMat.opacity = fadeAt(t);
  P.lampo.opacity = PP.lampo(t);
  if (where === 'spazio') { P.mondo(S.scene, S.camera); S.aggiorna(tn); }
  if (where === 'world') { P.mondo(C.scene, C.camera); COL.aggiorna(tn, t); }
  if (where === 'atom') {
    P.mondo(at.scene, at.cam);
    const zoomK = at.camera(tn, atomi.camAt(tn));
    K.place(t, tn, Math.min(1 + (zoomK - 1) * 0.3, 1.35));
  }
  PP.aggiorna(t, tn);
  M.update(tn, t, posa(tn, t));
  P.inizio.opacity = 1 - ramp(t, 0, 0.3);
  P.render();
};
window.DURATION = WARP[WARP.length - 1][1];
window.renderFrame(0);
window.ready = true;
