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
// tabella WARP [[t scaletta, t video], ...] dalla voce dell'autore (27/11/2026, audio/voice_ep7.py -> audio/warp7.json);
// prima (v3–v9, senza voce) allungava solo la B7, la B11 e la B15.
export const WARP = [[0.0, 0.0], [0.5, 0.5], [1.9, 1.35], [4.0, 3.45], [4.5, 3.75], [10.0, 9.25], [10.5, 9.97], [11.1, 10.69], [12.1, 11.52], [13.3, 13.14], [15.0, 14.84], [15.5, 15.14], [18.4, 17.19], [21.5, 20.89], [22.0, 21.89], [24.5, 24.39], [25.0, 24.69], [30.5, 30.19], [31.0, 30.62], [33.6, 34.07], [35.7, 35.53], [38.0, 41.4], [38.5, 42.4], [46.5, 50.4], [47.0, 51.24], [54.5, 59.75], [55.0, 60.75], [59.5, 65.66], [60.0, 66.66], [65.0, 74.03], [65.5, 75.03], [67.15, 77.48], [70.5, 80.83], [71.0, 81.13], [74.0, 83.47], [77.0, 86.47], [77.5, 86.77], [84.2, 92.97], [84.9, 94.08], [85.5, 94.83], [86.0, 95.83], [86.5, 97.3], [89.5, 103.4], [90.0, 104.4], [90.9, 106.03], [91.8, 106.84], [92.9, 107.99], [94.4, 109.49]];
export const VIDEO_END = WARP[WARP.length - 1][1];   // durata del video con la voce: 109.49 s
export const { unwarp, fwarp, rt } = creaWarp(WARP, END);

// passaggi fra i mondi [tempo, mondo, forza del lampo chiaro, durata]:
// spazio (B1, senza saluto dalla v2) → collina (natura) → atomi dentro un puntino del corpo → collina (bilancia, aereo, centrale)
export const ATOM_IN = 23.3, ATOM_OUT = 55.1;
export const SWITCH = [[4.25, 'world', 1, 0.3], [ATOM_IN, 'atom', 1, 0.3], [ATOM_OUT, 'world', 1, 0.3]];
export const START_WORLD = 'spazio';
