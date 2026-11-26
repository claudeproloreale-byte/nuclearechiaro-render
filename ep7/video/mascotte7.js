// Puntata 7 — espressioni e gesti della mascotte (bozza 1, tempi di scaletta).
// B1: grande al centro, saluta ("Ciao!"); su "fa paura" sorriso giù e occhi un po' più grandi (preoccupata); poi scivola nell'angolo.
// B4: sorpresa (occhi grandi) quando scopre che anche il corpo è radioattivo. B8: sorride quando il nucleo si calma.
// B16: indica i commenti su "fammela", saluta ed esce a EXIT.
import { track, backOut, smooth, ramp, win, lerp } from '/comune/base.js';
import { CORNER, R0, WAVE, POINT, creaLabiale, creaBlink } from '/comune/mascotte.js';
import { END, EXIT, SPEECH, LIP } from './tempi.js';

const BIG = [0, 0.45, 1], VERSO_ANGOLO = [2.95, 3.55];
const T_ = {
  smile: track([[0, 0.85], [2.4, 0.85], [2.7, 0.2], [3.7, 0.2], [4.4, 0.8], [17.2, 0.8], [17.5, 0.55], [21.5, 0.55], [22.0, 0.8], [39.3, 0.8], [39.7, 1], [46.5, 1], [47.0, 0.85], [END, 1]]),
  browY: track([[0, 0.07], [2.4, 0.07], [2.7, 0.03], [3.7, 0.03], [4.4, 0.07], [END, 0.07]]),
  gaze: track([[0, [0, 0]], [2.9, [0, 0]], [3.5, [-0.6, 0.6]], [90.5, [-0.6, 0.6]], [90.9, [0.85, 0.25]], [91.8, [0.85, 0.25]], [92.1, [0, 0]], [END, [0, 0]]]),
  handR: track([[0, WAVE], [1.6, WAVE], [1.9, R0], [90.5, R0], [90.9, POINT], [91.8, POINT], [92.1, R0], [92.3, WAVE], [END, WAVE]]),
};
const lip = creaLabiale(SPEECH, LIP), blink = creaBlink(END);

export function posa(tn, t) {
  const u = smooth(ramp(t, ...VERSO_ANGOLO));
  let mx = lerp(BIG[0], CORNER[0], u), my = lerp(BIG[1], CORNER[1], u), ms = lerp(BIG[2], CORNER[2], u);
  ms *= backOut(ramp(t, 0.15, 0.55)) * (1 - smooth(ramp(t, EXIT - 0.25, EXIT)));   // entra "a molla", esce rimpicciolendo
  return {
    pos: [mx, my, ms], lift: smooth(ramp(t, EXIT - 0.4, EXIT)) * 0.08, visible: ms > 0.001 && t < EXIT,
    lip: lip(tn, t), gaze: T_.gaze(t), blink: blink(t), smile: T_.smile(t), browY: T_.browY(t),
    wide: 1 + 0.1 * win(t, 2.5, 3.8, 0.3) + 0.18 * win(t, 17.2, 21.6, 0.3),
    handR: T_.handR(t), wave: win(t, 0.55, 1.75, 0.2) + win(t, 92.3, 92.85, 0.15), point: win(t, 90.9, 91.8, 0.25),
  };
}
