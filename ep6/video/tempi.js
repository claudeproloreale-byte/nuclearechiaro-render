// Puntata 6 — tempi comuni a tutto il video (secondi "di scaletta", bozza 1).
// I tempi dei singoli eventi stanno nel file della scena che li usa (scene/*.js).
import { creaWarp } from '/comune/base.js';

export const END = 49.4;
// battute: B1 0,2–0,8 · B2 1,3–4,8 · B3 5,3–8,8 · B4 9,3–13,6 · B5 14,1–19,9 · B6 20,4–25,0 · B7 25,5–29,4 · B8 29,9–34,0 · B9 34,5–40,0
// centrale da 40,6: B10 40,5–44,0 · B11 44,5–46,9 · paesaggio fino a 49,4
export const SPEECH = [[0.2, 0.8], [1.3, 4.8], [5.3, 5.7], [5.9, 8.8], [9.3, 13.6], [14.1, 16.3], [16.45, 19.9], [20.4, 25.0], [25.5, 29.4],
  [29.9, 34.0], [34.5, 37.0], [37.15, 40.0], [40.5, 44.0], [44.5, 45.6], [45.75, 46.9]];
export const LIP = null;   // quando arriva la voce: { open, narrow, env } a 30 fps
// tabella WARP [[t scaletta, t video], ...]: per ora è l'identità (niente voce ancora)
export const WARP = [[0, 0], [END, END]];
export const { unwarp, fwarp, rt } = creaWarp(WARP, END);

// passaggi fra i mondi [tempo, mondo, forza del lampo chiaro, durata]
export const SWITCH = [[5.0, 'atom', 1, 0.3], [40.6, 'world', 0.8, 0.3]];
// lampo bianco della bomba (B5); sotto il bianco, a CUT, si passa dalla zona B alla zona R
export const FLASH_UP = 18.7, FLASH_FULL = 19.45, CUT = 20.25, FLASH_DOWN = 21.3;
// la mascotte saluta ed esce
export const EXIT = 47.9;
