// Puntata 6 — CENTRALE (v2): compare sotto il lampo bianco della bomba (B5, 20,6: campo largo, cielo azzurro);
// a 23,3 lo zoom verso il nocciolo con la cupola che si apre, fino al passaggio alle barre (25,5);
// B10 (44,5–55,4): dal nocciolo si torna al campo largo e la cupola si richiude.
// La centrale è quella della libreria comune (comune/centrale.js), sempre accesa.
import { track } from '/comune/base.js';
import { CAM_WIDE, CAM_CORE, CAM_PUSH } from '/comune/centrale.js';
import { rt } from '../tempi.js';

const CAM = track(rt([[20.6, CAM_WIDE], [23.3, CAM_WIDE], [24.9, CAM_CORE], [25.55, CAM_PUSH], [44.5, CAM_PUSH], [45.4, CAM_CORE], [47.3, CAM_WIDE]]));
const CUPOLA = track(rt([[23.5, 1], [24.5, 0.1], [45.8, 0.1], [46.8, 1]]));   // metà frontale della cupola: si apre e si richiude

export const aggiorna = (C, tn) => C.update(tn, CAM(tn), CUPOLA(tn));
