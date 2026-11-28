// Puntata 8 — "Dove finisce l'acqua calda?" — MONTAGGIO (bozza 1, scaletta dell'app di produzione del 28/11/2026).
//  - MONDO: collina-pianeta con la centrale (torri, fiume), la centrale sul mare e quella a carbone: scene/mondo.js
//    (centrale: scene/centrale8.js, torre con l'interno: scene/torre.js, pennacchi: scene/fumo.js, acqua: scene/acqua8.js)
//  - REGIA (camere, rotazioni, aperture, circuiti, estate): scene/regia.js
//  - PRIMO PIANO (pentola, torta, termometri, carbone e gas, omino): scene/primopiano.js
//  - mascotte: mascotte8.js; tempi comuni: tempi.js
import { fadeMat, ramp } from '/comune/base.js';
import { creaMascotte } from '/comune/mascotte.js';
import { creaIcone } from '/comune/icone.js';
import { creaRenderer, creaPrimoPiano, creaPalco } from '/comune/palco.js';
import { WARP, unwarp } from './tempi.js';
import { creaMondo } from './scene/mondo.js';
import { stato } from './scene/regia.js';
import { creaPrimoPiano8 } from './scene/primopiano.js';
import { posa } from './mascotte8.js';

await document.fonts.load('700 64px Poppins');
const renderer = creaRenderer();
const W = creaMondo();
const { hud, hudCam } = creaPrimoPiano();
const M = creaMascotte(hud);
const I = creaIcone(hud), PP = creaPrimoPiano8(I, hud);
const P = creaPalco(renderer, hud, hudCam, W.scene, W.camera);
window.WARP = WARP;
const cover = new URLSearchParams(location.search).get('cover') === '1';

window.renderFrame = function (tn) {
  const t = unwarp(tn);
  fadeMat.opacity = 0;
  W.aggiorna(tn, t, stato(tn, t));
  PP.aggiorna(cover ? -10 : t, tn);
  M.update(tn, t, posa(tn, cover ? -10 : t));
  P.lampo.opacity = PP.lampo(t);
  P.inizio.opacity = cover ? 0 : 1 - ramp(t, 0, 0.3);
  P.render();
};
window.DURATION = WARP[WARP.length - 1][1];
window.renderFrame(0);
window.ready = true;
