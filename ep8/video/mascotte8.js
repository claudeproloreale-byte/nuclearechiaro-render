// Puntata 8 — espressioni e gesti della mascotte (bozza 1, tempi di scaletta). Senza saluto, come nelle puntate 5–7:
// compare nell'angolo con un piccolo "pop".
//   B1 su «non è fumo» sopracciglia alzate e dito alzato · B2 sorride · B3 pensierosa (guarda in alto a sinistra)
//   B7 annuisce · B13 un po' accaldata (occhi socchiusi, sorriso) · B14 soddisfatta · B15 indica i commenti, saluta, esce
import { track, backOut, smooth, ramp, win } from '/comune/base.js';
import { CORNER, R0, WAVE, POINT, creaLabiale, creaBlink } from '/comune/mascotte.js';
import { END, EXIT, SPEECH, LIP } from './tempi.js';

const DITO = [1.12, 0.62, 0.3];
const T_ = {
  smile: track([[0, 0.7], [3.4, 0.7], [3.8, 0.45], [5.2, 0.45], [5.8, 1], [10.0, 1], [10.6, 0.35], [14.4, 0.35], [15.0, 0.75], [76.4, 0.75], [77.0, 0.9], [84.0, 0.9], [85.0, 1], [END, 1]]),
  browY: track([[0, 0.07], [3.4, 0.07], [3.7, 0.15], [5.2, 0.15], [5.6, 0.07], [10.6, 0.07], [11.0, 0.11], [14.4, 0.11], [14.8, 0.07], [END, 0.07]]),
  gaze: track([[0, [-0.6, 0.6]], [10.5, [-0.6, 0.6]], [10.9, [-0.75, 0.85]], [14.3, [-0.75, 0.85]], [14.7, [-0.6, 0.6]], [90.0, [-0.6, 0.6]], [90.4, [0.85, 0.25]], [91.3, [0.85, 0.25]], [91.6, [0, 0]], [END, [0, 0]]]),
  handR: track([[0, R0], [3.4, R0], [3.75, DITO], [5.1, DITO], [5.5, R0], [90.0, R0], [90.4, POINT], [91.3, POINT], [91.6, R0], [91.8, WAVE], [END, WAVE]]),
};
const lip = creaLabiale(SPEECH, LIP), blink = creaBlink(END);

export function posa(tn, t) {
  let [mx, my, ms] = CORNER;
  ms *= backOut(ramp(t, 0.2, 0.55)) * (1 - smooth(ramp(t, EXIT - 0.25, EXIT)));
  const g = T_.gaze(t), nod = win(t, 37.4, 39.6, 0.3);
  return {
    pos: [mx, my, ms], lift: smooth(ramp(t, EXIT - 0.4, EXIT)) * 0.08, visible: ms > 0.001 && t < EXIT,
    lip: lip(tn, t), gaze: [g[0], g[1] - nod * (0.35 + 0.35 * Math.sin(t * 7.5))], blink: blink(t), smile: T_.smile(t), browY: T_.browY(t),
    wide: 1 + 0.12 * win(t, 3.6, 5.2, 0.3) - 0.06 * win(t, 77, 83.8, 0.5),
    handR: T_.handR(t), wave: win(t, 91.8, 92.35, 0.15), point: win(t, 90.4, 91.3, 0.25) + 0.4 * win(t, 3.8, 5.0, 0.2),
  };
}
