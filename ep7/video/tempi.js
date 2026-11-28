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
export const WARP = [[0.0, 0.0], [0.5, 0.5], [1.9, 1.4], [4.0, 3.5], [4.5, 3.8], [10.0, 8.19], [10.5, 8.94], [11.1, 10.03], [12.1, 10.78], [13.3, 12.38], [15.0, 14.08], [15.5, 14.38], [18.4, 16.85], [21.5, 20.91], [22.0, 21.91], [24.5, 24.41], [25.0, 24.71], [30.5, 30.21], [31.0, 31.02], [33.6, 34.41], [35.7, 35.86], [38.0, 42.47], [38.5, 43.47], [46.5, 51.47], [47.0, 52.34], [54.5, 62.02], [55.0, 63.02], [59.5, 67.59], [60.0, 68.59], [65.0, 75.75], [65.5, 76.75], [67.15, 79.72], [70.5, 83.07], [71.0, 83.37], [74.0, 86.01], [77.0, 89.01], [77.5, 89.31], [84.2, 95.58], [84.9, 97.16], [85.5, 98.26], [86.0, 99.42], [86.5, 100.79], [89.5, 106.95], [90.0, 107.95], [90.9, 109.58], [91.8, 110.37], [92.9, 111.64], [94.4, 113.14]];
export const VIDEO_END = WARP[WARP.length - 1][1];   // durata del video con la voce: 113.14 s
export const { unwarp, fwarp, rt } = creaWarp(WARP, END);

// passaggi fra i mondi [tempo, mondo, forza del lampo chiaro, durata]:
// spazio (B1, senza saluto dalla v2) → collina (natura) → atomi dentro un puntino del corpo → collina (bilancia, aereo, centrale)
export const ATOM_IN = 23.3, ATOM_OUT = 55.1;
export const SWITCH = [[4.25, 'world', 1, 0.3], [ATOM_IN, 'atom', 1, 0.3], [ATOM_OUT, 'world', 1, 0.3]];
export const START_WORLD = 'spazio';
