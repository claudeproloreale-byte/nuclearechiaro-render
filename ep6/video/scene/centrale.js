// Puntata 6 — CENTRALE (v2): compare dopo il fungo (B5, campo largo, cielo azzurro);
// a 23,3 lo zoom verso il nocciolo con la cupola che si apre, fino al passaggio alle barre (25,5).
// B10 (v14, carta bianca dell'autore: prima nella B10 non succedeva niente):
//   44,5 dal nocciolo si torna alla vista del vessel e la camera resta lì fino a 47,9;
//   "Un incidente, anche se molto, molto improbabile" → compare il termometro e sale un po';
//   "…può succedere" (47,0–47,6) → le barre di controllo (6, scure) scendono fra le barre di uranio, il nocciolo si spegne
//   quasi del tutto e il termometro torna giù: anche se qualcosa va storto, la reazione si ferma;
//   "ma un'esplosione atomica è fisicamente impossibile" (48,0–50,5) → campo largo e cupola che si richiude; due icone
//   affiancate: a sinistra un grappolo di nuclei quasi tutti gialli (la bomba) con un lampo su "esplosione", a destra un
//   grappolo con un solo nucleo giallo (la centrale) con la spunta verde su "impossibile".
// La centrale è quella della libreria comune (comune/centrale.js).
import { THREE, V, track, std, mesh, glow, smooth, ramp, pop, clamp01 } from '/comune/base.js';
import { CAM_WIDE, CAM_CORE, CAM_PUSH } from '/comune/centrale.js';
import { rt } from '../tempi.js';

const CAM = track(rt([[20.6, CAM_WIDE], [23.3, CAM_WIDE], [24.9, CAM_CORE], [25.55, CAM_PUSH], [44.5, CAM_PUSH], [45.4, CAM_CORE], [47.9, CAM_CORE], [49.8, CAM_WIDE]]));
const CUPOLA = track(rt([[23.5, 1], [24.5, 0.1], [47.9, 0.1], [48.9, 1]]));   // metà frontale della cupola: si apre e si richiude
export const RODS = [47.0, 47.6], SPEGNE = [47.15, 48.0], TERMO = [45.0, 48.45], TERMO_SU = [45.4, 46.8], TERMO_GIU = [47.4, 48.3];
export const CONFRONTO = [48.35, 50.55], BOOM = 48.6, SPUNTA = 49.75;

// barre di controllo: in alto, sopra le barre di uranio; scendono negli spazi fra le colonne
export function creaBarre(C) {
  const { inside, VX, VY, VZ } = C.nocciolo, rodM = std(0x2b3442, { roughness: 0.45, metalness: 0.4 }), G = new THREE.Group(); inside.add(G);
  for (let i = 0; i < 3; i++) for (let k = 0; k < 2; k++) mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.95, 12), rodM, G, V(VX - 0.17 + i * 0.17, VY - 0.25, VZ - 0.085 + k * 0.17));
  mesh(new THREE.BoxGeometry(0.46, 0.04, 0.3), rodM, G, V(VX, VY + 0.25, VZ));   // traversa che le tiene insieme
  return t => { G.position.y = 0.98 * (1 - smooth(ramp(t, RODS[0], RODS[1]))); };
}
export const potenza = t => 1 - smooth(ramp(t, SPEGNE[0], SPEGNE[1]));

// icone del confronto e termometro della B10
export function creaIconeB10(I) {
  const th = I.icon(0.98, 1.25, 0.4), tm = I.makeThermo(th.c);
  const icB = I.icon(-0.6, 1.05, 0.48), icC = I.icon(0.6, 1.05, 0.48);
  const gialloM = std(0xffc928, { roughness: 0.45, emissive: 0xffa800, emissiveIntensity: 0.45 }), grigioM = std(0x7f9fca, { roughness: 0.5 });
  // grappolo di 19 nuclei (palla esagonale): nella bomba 17 gialli, nella centrale 1 giallo
  const posti = []; [[0, 0, 7], [0.13, 0.115, 6], [-0.13, 0.115, 6]].forEach(([z0, rr, n]) => {
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + (z0 ? 0.5 : 0); posti.push(i === 0 && rr === 0 ? [0, 0, z0] : [Math.cos(a) * (n === 7 ? 0.17 : rr), Math.sin(a) * (n === 7 ? 0.17 : rr), z0]); } });
  posti[0] = [0, 0, 0];
  const grappolo = (parent, gialli) => posti.forEach(([x, y, z], i) => mesh(new THREE.SphereGeometry(0.075, 18, 12), gialli.includes(i) ? gialloM : grigioM, parent, V(x, y, z)));
  grappolo(icB.c, posti.map((_, i) => i).filter(i => i !== 4 && i !== 11));
  grappolo(icC.c, [7]);   // il giallo nello strato davanti, così si vede
  const lampoB = glow(0xffe680, icB.g, 1.5); lampoB.position.z = -0.05; lampoB.material.depthTest = false;
  const verdeM = std(0x2fbf5a, { roughness: 0.4, emissive: 0x1f9f45, emissiveIntensity: 0.4 }), spunta = new THREE.Group(); icC.g.add(spunta);
  mesh(new THREE.BoxGeometry(0.1, 0.24, 0.06), verdeM, spunta, V(-0.08, -0.03, 0)).rotation.z = 0.75;
  mesh(new THREE.BoxGeometry(0.1, 0.46, 0.06), verdeM, spunta, V(0.08, 0.06, 0)).rotation.z = -0.62;
  spunta.position.set(0.33, -0.3, 0.35);
  return { icone: [th, icB, icC], aggiorna(t) {
    I.showIcon(th, pop(t, TERMO[0], TERMO[1]));
    tm.set(0.4 + 0.42 * smooth(ramp(t, TERMO_SU[0], TERMO_SU[1])) - 0.62 * smooth(ramp(t, TERMO_GIU[0], TERMO_GIU[1])));
    const a = pop(t, CONFRONTO[0], CONFRONTO[1], 0.4, 0.35); I.showIcon(icB, a); I.showIcon(icC, pop(t, CONFRONTO[0] + 0.12, CONFRONTO[1], 0.4, 0.35));
    const b = clamp01(1 - Math.abs(t - BOOM - 0.15) / 0.35); lampoB.material.opacity = 0.9 * b; lampoB.scale.setScalar(0.6 + 1.6 * smooth(ramp(t, BOOM, BOOM + 0.5)));
    const sp = pop(t, SPUNTA, CONFRONTO[1] + 0.2, 0.35, 0.3); spunta.visible = sp > 0.001; spunta.scale.setScalar(Math.max(0.001, sp));
    icB.c.rotation.y = icC.c.rotation.y = 0.3 * Math.sin(t * 0.8);
  } };
}

export const aggiorna = (C, tn, t, barre) => { if (barre) barre(t); C.update(tn, CAM(tn), CUPOLA(tn), potenza(t)); };
