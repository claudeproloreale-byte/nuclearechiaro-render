// Puntata 7 — tempi comuni a tutto il video (secondi "di scaletta", bozza 1 dalla scaletta dell'app di produzione, 26/11/2026).
// I tempi dei singoli eventi stanno nel file della scena che li usa (scene/*.js).
import { creaWarp } from '/comune/base.js';

// battute, mezzo secondo di pausa fra una e l'altra (durate della scaletta scalette/p7):
export const B = {
  b1: [0.5, 4.0], b2: [4.5, 10.0], b3: [10.5, 15.0], b4: [15.5, 21.5], b5: [22.0, 24.5], b6: [25.0, 30.5], b7: [31.0, 38.0], b8: [38.5, 46.5],
  b9: [47.0, 54.5], b10: [55.0, 59.5], b11: [60.0, 65.0], b12: [65.5, 70.5], b13: [71.0, 77.0], b14: [77.5, 86.0], b15: [86.5, 89.5], b16: [90.0, 92.4],
};
// paesaggio pulito da EXIT alla fine
export const EXIT = 92.9, END = 94.4;
export const SPEECH = Object.values(B);
export const LIP = null;   // finché non c'è la voce il labiale è simulato
// senza voce la tabella WARP è l'identità (arriverà con la registrazione)
export const WARP = [[0, 0], [END, END]];
export const VIDEO_END = END;
export const { unwarp, fwarp, rt } = creaWarp(WARP, END);

// passaggi fra i mondi [tempo, mondo, forza del lampo chiaro, durata]:
// spazio (saluto) → collina (natura) → atomi dentro un puntino del corpo → collina (bilancia, aereo, centrale)
export const ATOM_IN = 23.3, ATOM_OUT = 55.1;
export const SWITCH = [[4.25, 'world', 1, 0.3], [ATOM_IN, 'atom', 1, 0.3], [ATOM_OUT, 'world', 1, 0.3]];
export const START_WORLD = 'spazio';
