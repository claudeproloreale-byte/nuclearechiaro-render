// Puntata 7 — espressioni e gesti della mascotte (bozza 1, tempi di scaletta).
// B1 (v2, l'autore ha tolto il saluto): compare già nell'angolo con un piccolo "pop", come nelle puntate 5 e 6;
// su "ti fa paura?" sorriso giù e occhi un po' più grandi (preoccupata).
// B4: sorpresa (occhi grandi) quando l'omino si gira e si accendono i puntini (v3: da 18,2). B8: sorride quando il nucleo si calma.
// B16: indica i commenti su "fammela", saluta ed esce a EXIT.
import { track, backOut, smooth, ramp, win } from '/comune/base.js';
import { CORNER, R0, WAVE, POINT, creaLabiale, creaBlink } from '/comune/mascotte.js';
import { END, EXIT, SPEECH, LIP } from './tempi.js';

const T_ = {
  smile: track([[0, 0.7], [1.2, 0.7], [1.5, 0.2], [3.4, 0.2], [4.4, 0.8], [18.2, 0.8], [18.5, 0.55], [21.5, 0.55], [22.0, 0.8], [39.3, 0.8], [39.7, 1], [46.5, 1], [47.0, 0.85], [END, 1]]),
  browY: track([[0, 0.07], [1.2, 0.07], [1.5, 0.03], [3.4, 0.03], [4.4, 0.07], [END, 0.07]]),
  gaze: track([[0, [-0.6, 0.6]], [90.5, [-0.6, 0.6]], [90.9, [0.85, 0.25]], [91.8, [0.85, 0.25]], [92.1, [0, 0]], [END, [0, 0]]]),
  handR: track([[0, R0], [90.5, R0], [90.9, POINT], [91.8, POINT], [92.1, R0], [92.3, WAVE], [END, WAVE]]),
};
const lip = creaLabiale(SPEECH, LIP), blink = creaBlink(END);

// v9: nella B13 la mascotte scende più in basso a destra, per lasciare il prato ai pesi (primopiano.js); torna su con lo zoom nella cupola
export const GIU = [1.38, -1.36], GIU_T = [70.5, 71.1, 77.3, 78.0];
export function posa(tn, t) {
  let [mx, my, ms] = CORNER;
  { const g = smooth(ramp(t, GIU_T[0], GIU_T[1])) * (1 - smooth(ramp(t, GIU_T[2], GIU_T[3]))); mx += (GIU[0] - mx) * g; my += (GIU[1] - my) * g; }
  ms *= backOut(ramp(t, 0.2, 0.55)) * (1 - smooth(ramp(t, EXIT - 0.25, EXIT)));   // entra "a molla", esce rimpicciolendo
  return {
    pos: [mx, my, ms], lift: smooth(ramp(t, EXIT - 0.4, EXIT)) * 0.08, visible: ms > 0.001 && t < EXIT,
    lip: lip(tn, t), gaze: T_.gaze(t), blink: blink(t), smile: T_.smile(t), browY: T_.browY(t),
    wide: 1 + 0.1 * win(t, 1.3, 3.5, 0.3) + 0.18 * win(t, 18.2, 21.6, 0.3),
    handR: T_.handR(t), wave: win(t, 92.3, 92.85, 0.15), point: win(t, 90.9, 91.8, 0.25),
  };
}
