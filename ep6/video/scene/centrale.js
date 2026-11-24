// Puntata 6 — CENTRALE: apertura (0–5,0: dal campo largo dentro la cupola, verso il nocciolo) e chiusura (40,6–49,4: si torna indietro).
// La centrale è quella della libreria comune (comune/centrale.js), sempre accesa.
import { track } from '/comune/base.js';
import { CAM_WIDE, CAM_CORE, CAM_PUSH } from '/comune/centrale.js';
import { rt } from '../tempi.js';

const CAM = track(rt([[1.4, CAM_WIDE], [4.3, CAM_CORE], [5.05, CAM_PUSH], [40.6, CAM_PUSH], [41.5, CAM_CORE], [43.4, CAM_WIDE]]));
const CUPOLA = track(rt([[1.6, 1], [2.8, 0.1], [41.9, 0.1], [42.9, 1]]));   // metà frontale della cupola: si apre e si richiude

export const aggiorna = (C, tn) => C.update(tn, CAM(tn), CUPOLA(tn));
