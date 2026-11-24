// Puntata 6 — espressioni e gesti della mascotte (tempi di scaletta).
// Grande al centro per il saluto, poi in angolo. Sopracciglia decise sul "No" (B3), occhi più grandi davanti al lampo,
// preoccupata quando il nocciolo si scalda (B9); indica i commenti 45,9–46,8, saluta ed esce a 47,9.
import { track, backOut, smooth, ramp, win } from '/comune/base.js';
import { CORNER, R0, WAVE, POINT, creaLabiale, creaBlink } from '/comune/mascotte.js';
import { END, EXIT, SPEECH, LIP } from './tempi.js';

const T_ = {
  pos: track([[0, [0, 0.2, 0.8]], [0.92, [0, 0.2, 0.8]], [1.45, CORNER]]),
  smile: track([[0, 1], [1.4, 0.95], [5.2, 0.8], [5.4, 0.55], [8.6, 0.55], [9.0, 0.8], [18.6, 0.8], [19.0, 0.2], [21.0, 0.2], [21.6, 0.8], [36.0, 0.8], [36.4, 0.45], [38.8, 0.45], [39.4, 0.9], [END, 1]]),
  browY: track([[0, 0.1], [1.4, 0.07], [5.2, 0.07], [5.4, 0.15], [8.6, 0.15], [9.0, 0.07], [18.6, 0.07], [19.0, 0.16], [21.0, 0.16], [21.6, 0.07], [36.0, 0.07], [36.4, 0.13], [38.8, 0.13], [39.4, 0.08], [END, 0.09]]),
  gaze: track([[0, [0, 0]], [1.3, [0, 0]], [1.8, [-0.6, 0.6]], [34.6, [-0.6, 0.6]], [35.0, [-0.85, 0.9]], [36.4, [-0.85, 0.9]], [36.8, [-0.6, 0.6]], [44.6, [-0.6, 0.6]], [45.0, [0, 0]], [45.6, [0, 0]], [45.9, [0.85, 0.25]], [46.8, [0.85, 0.25]], [47.1, [0, 0]], [END, [0, 0]]]),
  handR: track([[0, R0], [0.12, WAVE], [0.9, WAVE], [1.35, R0], [45.5, R0], [45.9, POINT], [46.8, POINT], [47.1, R0], [47.3, WAVE], [END, WAVE]]),
};
const lip = creaLabiale(SPEECH, LIP), blink = creaBlink(END);

export function posa(tn, t) {
  let [mx, my, ms] = T_.pos(t);
  ms *= backOut(ramp(t, 0.0, 0.35)) * (1 - smooth(ramp(t, EXIT - 0.25, EXIT)));   // entra "a molla", esce rimpicciolendo
  return {
    pos: [mx, my, ms], lift: smooth(ramp(t, EXIT - 0.4, EXIT)) * 0.08, visible: ms > 0.001 && t < EXIT,
    lip: lip(tn, t), gaze: T_.gaze(t), blink: blink(t), smile: T_.smile(t), browY: T_.browY(t),
    wide: 1 + 0.12 * smooth(ramp(t, 18.6, 19.0)) * (1 - smooth(ramp(t, 21.0, 21.6))),   // occhi più grandi davanti al lampo della bomba
    handR: T_.handR(t), wave: win(t, 0.15, 1.0, 0.2) + win(t, 47.3, 47.85, 0.15), point: win(t, 45.9, 46.8, 0.25),
  };
}
