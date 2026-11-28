// Puntata 8 — REGIA del mondo: camera, rotazioni della collina, aperture (cupola, sala turbine, torre), circuiti, estate.
// Tempi di scaletta (bozza 1): le chiavi delle camere passano per rt() (vedi regole.md, "Tempi").
//   B1  0,5–5,0   torre dal basso, camera che sale lungo il pennacchio          B2  5,5–10   pennacchio (icona della pentola)
//   B3  10,5–14,5 la camera scende e si allarga su tutta la centrale             B4  15–22    cupola e sala turbine aperte, torta
//   B5  22,5–29   termometro, icone carbone e gas                                 B6  29,5–36  condensatore, tre circuiti che si accendono
//   B7  36,5–42   zoom indietro: i tre circuiti e le "pareti"                    B8  42,5–48,5 la collina gira: centrale sul mare
//   B9  49–56     ritorno al fiume, giro verso il carbone e ritorno              B10 56,5–64  torre trasparente: pioggia, aria, vapore
//   B11 64,5–71   camera alla bocca della torre                                  B12 71,5–75,5 acqua fresca che torna, torre che si richiude
//   B13 76–84     estate sul fiume: pesci, pennacchio più piccolo                B14 84,5–89  inquadratura larga, pennacchi fra le nuvole
//   B15 89,5–91,9 saluto; paesaggio pulito fino a 93,9
import { track, smooth, ramp, win, clamp01 } from '/comune/base.js';
import { rt, B } from '../tempi.js';
import { PHI_MARE, PHI_CARBONE } from './mondo.js';

const CAM_B1a = [-3.9, 1.5, -28.0, -7.2, 6.5, -44.2], CAM_B1b = [-4.3, 3.0, -28.4, -7.0, 11.5, -44.2];
const CAM_B2 = [-4.6, 3.8, -28.6, -6.4, 14.0, -44.4];
const CAM_W = [-1.8, 4.4, 14, -1.8, 4.8, -40];
const CAM_IMPIANTO = [0.9, 3.6, -8.5, 0.9, 2.6, -40];
const CAM_COND = [-0.6, 2.6, -31.2, -0.6, 2.35, -39.3];
const CAM_TRE = [-1.4, 4.0, 2, -1.4, 2.8, -40];
const CAM_MARE = [1.6, 6.2, -12, 1.6, 0.5, -37.5];
const CAM_FIUME = [-1.8, 4.2, 6, -1.8, 3.4, -40];
const CAM_TORRE = [-6.9, 1.9, -33.2, -7.2, 2.1, -44.2];
const CAM_BOCCA = [-6.3, 8.4, -29.0, -7.0, 10.8, -44.2];
const CAM_RITORNO = [-4.0, 2.9, -27.5, -5.6, 1.5, -43.0];
const CAM_ESTATE = [-3.0, 2.6, -25.6, -3.6, 3.5, -44];
const CAM_FINE = [-2.6, 1.9, -22.5, -4.4, 9.5, -46];

export const CAM = track(rt([
  [0, CAM_B1a], [5.0, CAM_B1b], [5.6, CAM_B1b], [9.6, CAM_B2], [10.6, CAM_B2], [14.2, CAM_W], [15.6, CAM_W], [17.4, CAM_IMPIANTO],
  [29.6, CAM_IMPIANTO], [31.4, CAM_COND], [36.2, CAM_COND], [38.4, CAM_TRE], [42.6, CAM_TRE], [44.4, CAM_MARE], [48.8, CAM_MARE],
  [50.8, CAM_FIUME], [56.4, CAM_FIUME], [58.2, CAM_TORRE], [64.6, CAM_TORRE], [67.2, CAM_BOCCA], [71.4, CAM_BOCCA], [73.2, CAM_RITORNO],
  [75.6, CAM_RITORNO], [77.4, CAM_ESTATE], [84.4, CAM_ESTATE], [86.4, CAM_FINE], [93.9, CAM_FINE],
]));
export const FOV = track(rt([[0, 44], [10.6, 44], [14.2, 30], [56.4, 30], [58.2, 36], [64.6, 36], [67.2, 40], [71.4, 40], [73.2, 34], [75.6, 34], [77.4, 38], [84.4, 38], [86.4, 44], [93.9, 44]]));
// rotazione della collina: mare a sinistra (gira in senso orario), carbone a destra
export const GIRO = track(rt([[0, 0], [42.7, 0], [44.5, -PHI_MARE], [49.0, -PHI_MARE], [50.8, 0], [53.0, 0], [54.4, -PHI_CARBONE], [55.9, -PHI_CARBONE], [57.2, 0]]));
const CUPOLA = track(rt([[15.4, 1], [16.6, 0.1], [41.6, 0.1], [42.6, 1]]));
const SALA = track(rt([[15.8, 1], [17.0, 0.1], [41.6, 0.1], [42.6, 1]]));
const TORRE_APRE = track(rt([[57.2, 1], [58.3, 0.08], [74.4, 0.08], [75.6, 1]]));
// circuiti (B6: si accendono uno dopo l'altro sulle parole; B7 restano accesi)
export const CIRC = { primario: 31.9, secondario: 33.1, terzo: 34.9, spenti: [41.4, 42.4] };

export function stato(tn, t) {
  const off = 1 - smooth(ramp(t, ...CIRC.spenti));
  const on = k => smooth(ramp(t, k, k + 0.5)) * off;
  const estate = smooth(ramp(t, 76.0, 77.2)) * (1 - smooth(ramp(t, 84.2, 85.4)));
  const ridotta = smooth(ramp(t, 80.4, 81.6)) * (1 - smooth(ramp(t, 84.2, 85.6)));
  const pennacchio = (1 - 0.55 * ridotta);
  return {
    cam: CAM(tn), fov: FOV(tn), giro: GIRO(tn), estate,
    pesci: win(t, 76.3, 84.3, 0.5), pesciMare: win(t, 43.6, 49.2, 0.5), mare: win(t, 45.0, 48.6, 0.4),
    centrale: {
      cupola: CUPOLA(tn), sala: SALA(tn), circ: [on(CIRC.primario), on(CIRC.secondario), Math.max(on(CIRC.terzo), win(t, 71.8, 75.6, 0.5))], pareti: win(t, 38.3, 41.8, 0.5),
      torre: {
        apre: TORRE_APRE(tn),
        pioggia: smooth(ramp(t, 58.4, 60.0)), aria: win(t, 60.3, 64.4, 0.4), vapore: smooth(ramp(t, 61.8, 62.8)) * (1 - smooth(ramp(t, 74, 75))),
        pennacchio, fresca: smooth(ramp(t, 72.0, 73.2)),
      },
      torre2: { pennacchio },
    },
  };
}
