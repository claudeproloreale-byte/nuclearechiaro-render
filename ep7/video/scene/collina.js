// Puntata 7 — COLLINA: la centrale della libreria comune (comune/centrale.js) con, sul lato DESTRO della collina (dalla v4;
// prima era a sinistra), un angolo "solo natura": scene/natura.js (rocce, banano, raggi cosmici, omino).
//   B2–B5 e B10–B12: camera sul lato natura (CAM_NAT)
//   B13 (71,4–73,8): la camera scorre verso sinistra fino alla centrale, come se la collina girasse (v4: nell'altro senso,
//        così il cavo elettrico che esce dalla centrale verso sinistra non attraversa l'inquadratura)
//   B14: la cupola si apre, zoom sul vessel; le barriere si illuminano una dopo l'altra (pastiglia, barra, vessel, cupola), poi zoom indietro
//   B15: la cupola si richiude
import { THREE, V, track, std, mesh, glow, smooth, ramp, clamp01 } from '/comune/base.js';
import { CAM_WIDE, CAM_CORE } from '/comune/centrale.js';
import { rt } from '../tempi.js';
import { creaNatura, CAM_NAT } from './natura.js';

const CLOSE = [2.9, 2.3, -36.3, 2.88, 2.25, -39.7];
const CAM_B13 = [1, 4.5, 11, 1, 4.3, -40];   // la centrale un po' più in basso, sotto i pesi
const CAM = track(rt([[0, CAM_NAT], [71.4, CAM_NAT], [73.8, CAM_B13], [76.8, CAM_B13], [77.6, CAM_WIDE], [79.2, CAM_CORE], [83.2, CAM_CORE], [83.9, CLOSE], [84.5, CLOSE],
  [85.2, CAM_CORE], [85.6, CAM_CORE], [86.6, CAM_WIDE]]));
const CUPOLA = track(rt([[77.8, 1], [78.8, 0.1], [86.7, 0.1], [87.6, 1]]));
// barriere (B14): quando si accendono, sulle parole
export const BARRIERE = { pastiglia: 84.2, barra: 84.9, vessel: 85.5, cupola: 86.0, spente: [86.7, 87.6] };

export function creaCollina(C) {
  const world = C.scene;
  const N = creaNatura(C);

  // barriere della B14, dentro la cupola: gusci azzurri che si accendono
  const { inside, VX, VY, VZ } = C.nocciolo;
  const shell = (geo, pos, op) => { const m = mesh(geo, new THREE.MeshBasicMaterial({ color: 0x7fe8ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }), inside, pos); m.renderOrder = 8; m.userData.op = op; return m; };
  const BX = VX - 0.085, BZ = VZ + 0.17;
  const past = shell(new THREE.CylinderGeometry(0.066, 0.066, 0.13, 20), V(BX, VY - 0.35, BZ), 0.85);
  const barra = shell(new THREE.CylinderGeometry(0.062, 0.062, 0.99, 20), V(BX, VY - 0.25, BZ), 0.45);
  const vessel = shell(new THREE.CapsuleGeometry(0.56, 1.15, 8, 32), V(VX, VY, VZ), 0.22);
  const domo = new THREE.Group(); inside.add(domo);
  const cup = [shell(new THREE.CylinderGeometry(2.4, 2.4, 3.2, 48, 1, true), V(0, 1.6, 0), 0.16), shell(new THREE.SphereGeometry(2.4, 48, 20, 0, Math.PI * 2, 0, Math.PI / 2), V(0, 3.2, 0), 0.16)];
  const pGlow = glow(0x9ff0ff, inside, 0.5); pGlow.position.set(BX, VY - 0.35, BZ + 0.1);
  const items = [[past, BARRIERE.pastiglia], [barra, BARRIERE.barra], [vessel, BARRIERE.vessel], ...cup.map(m => [m, BARRIERE.cupola])];
  function barriere(t) {
    const off = 1 - smooth(ramp(t, ...BARRIERE.spente));
    for (const [m, t0] of items) {
      const on = smooth(ramp(t, t0, t0 + 0.35)), puls = 1 + 0.6 * clamp01(1 - Math.abs(t - t0 - 0.3) / 0.4);
      m.material.opacity = m.userData.op * on * off * puls * (1 + 0.1 * Math.sin(t * 6));
      m.visible = m.material.opacity > 0.002;
    }
    pGlow.material.opacity = 0.8 * smooth(ramp(t, BARRIERE.pastiglia, BARRIERE.pastiglia + 0.3)) * off;
  }
  return { aggiorna(tn, t) {
    N.aggiorna(t, tn); barriere(t);
    const o = N.camera(t, CAM(tn));
    C.update(tn, o ? o.c : CAM(tn), CUPOLA(tn), 1);
    if (o && o.exact) { const e = o.exact; C.camera.position.set(e[0], e[1], e[2]); C.camera.lookAt(e[3], e[4], e[5]); }
  } };
}
