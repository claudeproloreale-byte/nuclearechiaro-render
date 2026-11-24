// Puntata 6 — zona R "centrale" (intorno a x = 30, dalla B6 alla B9): nuclei radi, quasi tutti U-238, solo 3 U-235 (A, BB, C9).
// Qui ciò che vale per tutte le scene della zona; ogni scena (b7.js, b8.js, b9.js) ha le sue posizioni e i suoi tempi.
import { V, xy } from '/comune/base.js';

export const XR = 30, YR = 1, PR = (dx, dy) => V(XR + dx, YR + dy, 0);
// nessun nucleo né molecola dietro la mascotte in angolo (si confonde con lei)
const MASCOT_R = PR(1.3, -2.6);
export const behindMascot = p => xy(p, MASCOT_R) < 1.15;

// zona dei nuclei sparsi: distanza minima 1,45, corridoi liberi lungo i percorsi dei neutroni delle scene
export const zona = caps => ({ zone: 'R', x0: XR - 7, x1: XR + 7, y0: YR - 9, y1: YR + 10, tries: 20000, md: 1.45, caps, capDist: 0.58, fu: 0, avoid: behindMascot });
