// Puntata 6 — CENTRALE (v2): compare dopo il fungo (B5, campo largo, cielo azzurro);
// a 23,3 lo zoom verso il nocciolo con la cupola che si apre, fino al passaggio alle barre (25,5).
// B10 (v14, carta bianca dell'autore: prima nella B10 non succedeva niente):
//   44,5 dal nocciolo si torna alla vista del vessel e la camera resta lì fino a 47,9;
//   "Un incidente, anche se molto, molto improbabile" → compare il termometro e sale un po';
//   "…può succedere" (47,0–47,6) → le barre di controllo (6, scure) scendono fra le barre di uranio, il nocciolo si spegne
//   quasi del tutto e il termometro torna giù: anche se qualcosa va storto, la reazione si ferma;
//   "ma un'esplosione atomica è fisicamente impossibile" → campo largo e cupola che si richiude; un cerchio con un piccolo
//   fungo atomico (lampo su "esplosione") e, su "fisicamente impossibile", una croce rossa spessa e piena sopra il cerchio (v15).
// La centrale è quella della libreria comune (comune/centrale.js).
import { THREE, V, track, std, mesh, glow, smooth, ramp, pop, clamp01 } from '/comune/base.js';
import { CAM_WIDE, CAM_CORE, CAM_PUSH } from '/comune/centrale.js';
import { rt } from '../tempi.js';

const CAM = track(rt([[20.6, CAM_WIDE], [23.3, CAM_WIDE], [24.9, CAM_CORE], [25.55, CAM_PUSH], [44.5, CAM_PUSH], [45.4, CAM_CORE], [47.9, CAM_CORE], [49.8, CAM_WIDE]]));
const CUPOLA = track(rt([[23.5, 1], [24.5, 0.1], [47.9, 0.1], [48.9, 1]]));   // metà frontale della cupola: si apre e si richiude
export const RODS = [47.0, 47.6], SPEGNE = [47.15, 48.0], TERMO = [45.0, 48.45], TERMO_SU = [45.4, 46.8], TERMO_GIU = [47.4, 48.3];
export const CONFRONTO = [48.35, 50.55], BOOM = 48.6, SPUNTA = 49.45;

// barre di controllo: in alto, sopra le barre di uranio; scendono negli spazi fra le colonne
export function creaBarre(C) {
  const { inside, VX, VY, VZ } = C.nocciolo, rodM = std(0x2b3442, { roughness: 0.45, metalness: 0.4 }), G = new THREE.Group(); inside.add(G);
  for (let i = 0; i < 3; i++) for (let k = 0; k < 2; k++) mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.95, 12), rodM, G, V(VX - 0.17 + i * 0.17, VY - 0.25, VZ - 0.085 + k * 0.17));
  mesh(new THREE.BoxGeometry(0.46, 0.04, 0.3), rodM, G, V(VX, VY + 0.25, VZ));   // traversa che le tiene insieme
  return t => { G.position.y = 0.98 * (1 - smooth(ramp(t, RODS[0], RODS[1]))); };
}
export const potenza = t => 1 - smooth(ramp(t, SPEGNE[0], SPEGNE[1]));

// icona e termometro della B10 (v15, richiesta dell'autore: i due cerchi del confronto non erano chiari): un solo cerchio con un
// piccolo fungo atomico; su "fisicamente impossibile" una croce rossa spessa e piena sopra il cerchio.
export function creaIconeB10(I) {
  const th = I.icon(0.98, 1.25, 0.4), tm = I.makeThermo(th.c);
  const ic = I.icon(0, 1.15, 0.56);
  const fM = std(0xe8b27a, { roughness: 0.8, emissive: 0xff7a2a, emissiveIntensity: 0.35 }), pM = std(0xc9a57a, { roughness: 0.9 });
  const F = new THREE.Group(); F.position.y = -0.04; ic.c.add(F);
  mesh(new THREE.CylinderGeometry(0.055, 0.1, 0.36, 20), fM, F, V(0, -0.1, 0));                       // gambo
  [[0, 0.12, 0, 0.16, 0.7], [0, 0.2, 0, 0.11, 0.8]].forEach(([x, y, z, r, sy]) => { const m = mesh(new THREE.SphereGeometry(r, 24, 16), fM, F, V(x, y, z)); m.scale.y = sy; });
  for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2; mesh(new THREE.SphereGeometry(0.075, 16, 12), fM, F, V(Math.cos(a) * 0.15, 0.1 + (k % 2) * 0.03, Math.sin(a) * 0.15)); }   // cappello
  const anello = mesh(new THREE.TorusGeometry(0.085, 0.03, 10, 24), fM, F, V(0, -0.04, 0)); anello.rotation.x = Math.PI / 2;
  for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2; const m = mesh(new THREE.SphereGeometry(0.06, 14, 10), pM, F, V(Math.cos(a) * 0.2, -0.28, Math.sin(a) * 0.12)); m.scale.y = 0.55; }   // polvere a terra
  const lampo = glow(0xffd070, ic.g, 1.4); lampo.position.z = -0.05; lampo.material.depthTest = false;
  // croce rossa: due barre spesse e piene, davanti a tutto il cerchio
  const rossoM = std(0xe02a2a, { roughness: 0.35, emissive: 0xb01010, emissiveIntensity: 0.35 }), X = new THREE.Group(); ic.g.add(X); X.position.z = 0.45;
  [0.785, -0.785].forEach(a => { const b = mesh(new THREE.BoxGeometry(1.12, 0.17, 0.1), rossoM, X); b.rotation.z = a; });
  return { icone: [th, ic], aggiorna(t) {
    I.showIcon(th, pop(t, TERMO[0], TERMO[1]));
    tm.set(0.4 + 0.42 * smooth(ramp(t, TERMO_SU[0], TERMO_SU[1])) - 0.62 * smooth(ramp(t, TERMO_GIU[0], TERMO_GIU[1])));
    I.showIcon(ic, pop(t, CONFRONTO[0], CONFRONTO[1], 0.4, 0.35));
    const b = clamp01(1 - Math.abs(t - BOOM - 0.15) / 0.4); lampo.material.opacity = 0.7 * b; lampo.scale.setScalar(0.8 + 1.2 * smooth(ramp(t, BOOM, BOOM + 0.5)));
    F.scale.setScalar(0.85 + 0.15 * smooth(ramp(t, BOOM - 0.1, BOOM + 0.4))); F.rotation.y = 0.35 * Math.sin(t * 0.8);
    // la croce arriva con un piccolo rimbalzo e resta fino a quando il cerchio sparisce
    const x = pop(t, SPUNTA, CONFRONTO[1] + 0.05, 0.3, 0.35); X.visible = x > 0.001; X.scale.setScalar(Math.max(0.001, x));
  } };
}

export const aggiorna = (C, tn, t, barre) => { if (barre) barre(t); C.update(tn, CAM(tn), CUPOLA(tn), potenza(t)); };
