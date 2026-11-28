// Puntata 7 — tempi comuni a tutto il video (secondi "di scaletta", bozza 1 dalla scaletta dell'app di produzione, 26/11/2026).
// I tempi dei singoli eventi stanno nel file della scena che li usa (scene/*.js).
import { creaWarp } from '/comune/base.js';
import LIP7 from './lip7.js';

// battute, mezzo secondo di pausa fra una e l'altra (durate della scaletta scalette/p7):
export const B = {
  b1: [0.5, 4.0], b2: [4.5, 10.0], b3: [10.5, 15.0], b4: [15.5, 21.5], b5: [22.0, 24.5], b6: [25.0, 30.5], b7: [31.0, 38.0], b8: [38.5, 46.5],
  b9: [47.0, 54.5], b10: [55.0, 59.5], b11: [60.0, 65.0], b12: [65.5, 70.5], b13: [71.0, 77.0], b14: [77.5, 86.0], b15: [86.5, 89.5], b16: [90.0, 92.4],
};
// paesaggio pulito da EXIT alla fine
export const EXIT = 92.9, END = 94.4;
// labiale simulato: la B1 (v2) è corta, «La radioattività ti fa paura?» dura circa 1,9 s
export const SPEECH = Object.values(B).map((b, i) => (i === 0 ? [0.5, 2.4] : b));
export const LIP = LIP7;   // labiale dalla voce vera (audio/voice_ep7.py), a 30 fps, letto con il tempo del video
// tabella WARP [[t scaletta, t video], ...] dalla voce dell'autore (seconda registrazione completa del 28/11/2026, audio/voice_ep7.py -> audio/warp7.json);
// prima (v3–v9, senza voce) allungava solo la B7, la B11 e la B15.
export const WARP = [[0.0, 0.0], [0.5, 0.5], [1.9, 1.4], [4.0, 3.5], [4.5, 3.8], [10.0, 9.3], [10.5, 9.6], [11.1, 10.69], [12.1, 11.44], [13.3, 13.04], [15.0, 14.74], [15.5, 15.04], [18.4, 17.51], [21.5, 21.57], [22.0, 22.57], [24.5, 25.07], [25.0, 25.37], [30.5, 30.87], [31.0, 31.68], [33.6, 35.07], [35.7, 36.52], [38.0, 43.13], [38.5, 44.13], [46.5, 52.13], [47.0, 53.0], [54.5, 62.68], [55.0, 63.68], [59.5, 68.25], [60.0, 69.25], [65.0, 76.41], [65.5, 77.41], [67.15, 80.38], [70.5, 83.73], [71.0, 84.03], [74.0, 86.67], [77.0, 89.67], [77.5, 89.97], [84.2, 96.24], [84.9, 97.82], [85.5, 98.92], [86.0, 100.08], [86.5, 101.45], [89.5, 107.61], [90.0, 108.61], [90.9, 110.24], [91.8, 111.03], [92.9, 112.3], [94.4, 113.8]];
export const VIDEO_END = WARP[WARP.length - 1][1];   // durata del video con la voce: 113.80 s
export const { unwarp, fwarp, rt } = creaWarp(WARP, END);

// passaggi fra i mondi [tempo, mondo, forza del lampo chiaro, durata]:
// spazio (B1, senza saluto dalla v2) → collina (natura) → atomi dentro un puntino del corpo → collina (bilancia, aereo, centrale)
export const ATOM_IN = 23.3, ATOM_OUT = 55.1;
export const SWITCH = [[4.25, 'world', 1, 0.3], [ATOM_IN, 'atom', 1, 0.3], [ATOM_OUT, 'world', 1, 0.3]];
export const START_WORLD = 'spazio';
