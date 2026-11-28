// Puntata 8 — tempi comuni a tutto il video (secondi "di scaletta", bozza 1 dalla scaletta dell'app di produzione, 28/11/2026).
// I tempi dei singoli eventi stanno nel file della scena che li usa (scene/*.js).
import { creaWarp } from '/comune/base.js';

// battute, mezzo secondo di pausa fra una e l'altra (durate della scaletta scalette/p8)
export const B = {
  b1: [0.5, 5.0], b2: [5.5, 10.0], b3: [10.5, 14.5], b4: [15.0, 22.0], b5: [22.5, 29.0], b6: [29.5, 36.0], b7: [36.5, 42.0], b8: [42.5, 48.5],
  b9: [49.0, 56.0], b10: [56.5, 64.0], b11: [64.5, 71.0], b12: [71.5, 75.5], b13: [76.0, 84.0], b14: [84.5, 89.0], b15: [89.5, 91.9],
};
export const NOMI = Object.keys(B);
// paesaggio pulito da EXIT alla fine
export const EXIT = 92.4, END = 93.9;
// labiale simulato finché non c'è la voce
export const SPEECH = Object.values(B);
export const LIP = null;
// senza voce la WARP non sposta nulla
export const WARP = [[0, 0], [END, END]];
export const VIDEO_END = END;
export const { unwarp, fwarp, rt } = creaWarp(WARP, END);
