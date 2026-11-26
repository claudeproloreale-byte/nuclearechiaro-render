// Puntata 6 — espressioni e gesti della mascotte (v2, tempi di scaletta).
// Niente saluto: compare già nell'angolo (0,2–0,55), come nella puntata 5. Un po' seria davanti alla bomba (B1);
// sopracciglia decise sul "No" (B2, 4,4–8,0); occhi più grandi davanti al lampo della bomba; preoccupata quando il nocciolo
// si scalda (B9); indica i commenti 51,9–52,8, saluta ed esce a 53,9.
import { track, backOut, smooth, ramp, win } from '/comune/base.js';
import { CORNER, R0, WAVE, POINT, creaLabiale, creaBlink } from '/comune/mascotte.js';
import { END, EXIT, SPEECH, LIP, fwarp } from './tempi.js';

// posto per la mascotte mentre si sposta (schermo: 80% della larghezza, 40% dell'altezza; sopra la colonna dei pulsanti, in uno spazio libero)
const LATO = [0.99, 0.79, CORNER[2]];
const T_ = {
  // v6: nella B7 si sposta in alto a destra mentre il neutrone lento le passa dove sta di solito, poi torna nell'angolo
  smile: track([[0, 0.7], [4.2, 0.7], [4.4, 0.5], [8.0, 0.5], [8.5, 0.8], [19.0, 0.8], [19.4, 0.2], [21.2, 0.2], [21.8, 0.85], [40.0, 0.85], [40.4, 0.45], [42.8, 0.45], [43.4, 0.9], [END, 1]]),
  browY: track([[0, 0.09], [4.2, 0.09], [4.4, 0.15], [8.0, 0.15], [8.5, 0.07], [19.0, 0.07], [19.4, 0.16], [21.2, 0.16], [21.8, 0.07], [40.0, 0.07], [40.4, 0.13], [42.8, 0.13], [43.4, 0.08], [END, 0.09]]),
  gaze: track([[0, [-0.6, 0.6]], [38.6, [-0.6, 0.6]], [39.0, [-0.85, 0.9]], [40.4, [-0.85, 0.9]], [40.8, [-0.6, 0.6]], [51.0, [-0.6, 0.6]], [51.4, [0, 0]], [51.6, [0, 0]], [51.9, [0.85, 0.25]], [52.8, [0.85, 0.25]], [53.1, [0, 0]], [END, [0, 0]]]),
  handR: track([[0, R0], [51.5, R0], [51.9, POINT], [52.8, POINT], [53.1, R0], [53.3, WAVE], [END, WAVE]]),
};
const lip = creaLabiale(SPEECH, LIP), blink = creaBlink(END);

// v11 (nota dell'autore a 0:42 della v10: il movimento era meccanico e rapido): lo spostamento segue il tempo del video,
// parte e arriva dolcemente (smootherstep), fa un piccolo arco invece della linea retta; andata 1,2 s, ritorno 2,0 s.
const ss5 = u => u * u * u * (u * (u * 6 - 15) + 10);
const VA = fwarp(27.9) - 1.2, VB = fwarp(27.9), VC = fwarp(29.75), VD = VC + 2.0;
function posMascotte(tn) {
  let u, arco;
  if (tn <= VA || tn >= VD) return CORNER;
  if (tn < VB) { u = ss5((tn - VA) / (VB - VA)); arco = Math.sin(Math.PI * u) * 0.05; }
  else if (tn <= VC) return LATO;
  else { u = 1 - ss5((tn - VC) / (VD - VC)); arco = Math.sin(Math.PI * u) * 0.06; }
  return [CORNER[0] + (LATO[0] - CORNER[0]) * u - arco, CORNER[1] + (LATO[1] - CORNER[1]) * u, CORNER[2]];   // l'arco piega verso sinistra, lontano dai pulsanti
}
export function posa(tn, t) {
  let [mx, my, ms] = posMascotte(tn);
  ms *= backOut(ramp(t, 0.2, 0.55)) * (1 - smooth(ramp(t, EXIT - 0.25, EXIT)));   // entra "a molla", esce rimpicciolendo
  return {
    pos: [mx, my, ms], lift: smooth(ramp(t, EXIT - 0.4, EXIT)) * 0.08, visible: ms > 0.001 && t < EXIT,
    lip: lip(tn, t), gaze: T_.gaze(t), blink: blink(t), smile: T_.smile(t), browY: T_.browY(t),
    wide: 1 + 0.12 * smooth(ramp(t, 19.0, 19.4)) * (1 - smooth(ramp(t, 21.2, 21.8))),   // occhi più grandi davanti al lampo della bomba
    handR: T_.handR(t), wave: win(t, 53.3, 53.85, 0.15), point: win(t, 51.9, 52.8, 0.25),
  };
}
