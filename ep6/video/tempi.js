// Puntata 6 — tempi comuni a tutto il video (secondi "di scaletta", v2 dalla scaletta dell'app di produzione, 24/11/2026).
// I tempi dei singoli eventi stanno nel file della scena che li usa (scene/*.js).
import { creaWarp } from '/comune/base.js';
import LIP6 from './lip6.js';

export const END = 55.4;
// battute (niente saluto): B1 0,5–4,0 · B2 4,5–8,0 · B3 8,5–12,8 · B4 13,3–20,3 · B5 20,8–23,8 · B6 24,3–28,9 · B7 29,4–33,3
// B8 33,8–37,9 · B9 38,4–43,9 · B10 44,4–50,4 · B11 50,9–53,3 · paesaggio pulito da 53,9 a 55,4
export const SPEECH = [[0.5, 4.0], [4.5, 4.9], [5.1, 8.0], [8.5, 12.8], [13.3, 15.3], [15.45, 17.0], [17.15, 20.3], [20.8, 23.8], [24.3, 28.9],
  [29.4, 33.3], [33.8, 37.9], [38.4, 40.9], [41.05, 43.9], [44.4, 47.1], [47.25, 50.4], [50.9, 52.0], [52.15, 53.3]];
export const LIP = LIP6;   // labiale dalla voce vera (audio/voice_ep6.py), a 30 fps, letto con il tempo del video
// tabella WARP [[t scaletta, t video], ...] dalla voce dell'autore (v15, 26/11/2026, audio/voice_ep6.py -> audio/warp6.json)
export const WARP = [[0.0, 0.0], [0.5, 0.5], [4.0, 4.0], [4.5, 4.59], [8.0, 8.65], [8.5, 9.65], [12.8, 16.01], [13.3, 17.01], [16.0, 21.06], [19.95, 25.01], [20.6, 25.91], [21.6, 30.31], [21.8, 30.81], [23.8, 33.88], [24.3, 34.88], [28.9, 41.57], [29.4, 42.57], [30.6, 45.38], [33.3, 48.08], [33.8, 49.02], [34.6, 50.13], [36.22, 53.07], [37.4, 57.84], [37.9, 58.44], [38.4, 60.23], [39.1, 61.0], [39.9, 62.36], [40.8, 63.9], [42.7, 65.73], [43.9, 67.38], [44.4, 68.38], [50.4, 76.14], [50.9, 77.14], [51.9, 78.52], [52.8, 79.5], [53.9, 80.5], [55.4, 82.0]];
export const VIDEO_END = WARP[WARP.length - 1][1];   // durata del video con la voce: 82.00 s (2460 fotogrammi)
export const { unwarp, fwarp, rt } = creaWarp(WARP, END);

// passaggi fra i mondi [tempo, mondo, forza del lampo chiaro, durata]:
// bomba 3D → atomi (zona B) dentro la palla di uranio; atomi → centrale sotto il lampo bianco (CUT, senza lampo chiaro);
// centrale → atomi (barre con l'acqua) dopo lo zoom nel nocciolo; atomi → centrale per la B10
export const BAR_IN = 25.5, BACK = 44.5;
// v10: sotto il bianco (CUT) si torna nel deserto per il fungo; a FUNGO_END lampo chiaro e centrale
export const FUNGO_END = 21.6;
export const SWITCH = [[8.55, 'atom', 1, 0.3], [20.6, 'bomba', 0, 0.3], [FUNGO_END, 'world', 1, 0.15], [BAR_IN, 'atom', 1, 0.3], [BACK, 'world', 0.8, 0.3]];
export const START_WORLD = 'bomba';
// lampo bianco della bomba (B4, su "tutta l'energia"); sotto il bianco, a CUT, si passa alla centrale (B5)
export const FLASH_UP = 19.2, FLASH_FULL = 19.95, CUT = 20.6, FLASH_DOWN = 21.0;   // v10: il bianco si dirada prima, sul fungo
// la mascotte saluta ed esce
export const EXIT = 53.9;
