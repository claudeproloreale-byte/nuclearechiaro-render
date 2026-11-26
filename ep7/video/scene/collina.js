// Puntata 7 — COLLINA: la centrale della libreria comune (comune/centrale.js) con, sul lato sinistro della collina, un angolo
// "solo natura" (rocce, alberi, prato) dove la centrale non si vede.
//   B2–B4 e B10–B12: camera sul lato natura (CAM_NAT)
//   B13 (71,4–73,8): la camera scorre verso la centrale, come se la collina girasse
//   B14: la cupola si apre, zoom sul vessel; le barriere si illuminano una dopo l'altra (pastiglia, barra, vessel, cupola), poi zoom indietro
//   B15: la cupola si richiude
import { THREE, V, track, std, mesh, glow, smooth, ramp, setSeed, rnd, clamp01 } from '/comune/base.js';
import { CAM_WIDE, CAM_CORE } from '/comune/centrale.js';
import { rt } from '../tempi.js';

export const CAM_NAT = [-26, 3.6, 11, -26, 2.7, -40];
const CLOSE = [2.9, 2.3, -36.3, 2.88, 2.25, -39.7];
const CAM_B13 = [-1, 4.5, 11, -1, 4.3, -40];   // la centrale un po' più in basso, sotto i cubetti
const CAM = track(rt([[0, CAM_NAT], [71.4, CAM_NAT], [73.8, CAM_B13], [76.8, CAM_B13], [77.6, CAM_WIDE], [79.2, CAM_CORE], [83.2, CAM_CORE], [83.9, CLOSE], [84.5, CLOSE],
  [85.2, CAM_CORE], [85.6, CAM_CORE], [86.6, CAM_WIDE]]));
const CUPOLA = track(rt([[77.8, 1], [78.8, 0.1], [86.7, 0.1], [87.6, 1]]));
// barriere (B14): quando si accendono, sulle parole
export const BARRIERE = { pastiglia: 84.2, barra: 84.9, vessel: 85.5, cupola: 86.0, spente: [86.7, 87.6] };

export function creaCollina(C) {
  setSeed(7101);
  const world = C.scene;
  // collina del lato natura (a sinistra della centrale, fuori dalla sua inquadratura)
  const NX = -26, NYc = -38.2, NZ = -44, NR = 40;
  mesh(new THREE.SphereGeometry(NR, 200, 100), std(0x62b868, { roughness: 0.95 }), world, V(NX, NYc, NZ));
  const hillY = (x, z) => Math.max(C.hillY(x, z), NYc + Math.sqrt(Math.max(0, NR * NR - (x - NX) ** 2 - (z - NZ) ** 2)));
  // lato natura: rocce e alberi in più
  const rockM = std(0x9aa0ad, { roughness: 0.9, flatShading: true }), rockM2 = std(0x7f8796, { roughness: 0.9, flatShading: true });
  [[-26.5, -37.5, 0.75], [-23.2, -36.2, 0.5], [-21.4, -41, 0.9], [-28.8, -42.5, 1.1], [-24.6, -43.5, 0.65], [-19.8, -37.8, 0.4]].forEach(([x, z, s], i) => {
    const r = mesh(new THREE.DodecahedronGeometry(s, 0), i % 2 ? rockM : rockM2, world, V(x, hillY(x, z) + s * 0.35, z));
    r.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); r.scale.y = 0.7;
  });
  const trunkM = std(0x7a5236), leafM = std(0x3f9a50, { roughness: 0.9 }), leafM2 = std(0x55b060, { roughness: 0.9 });
  [[-29.5, -39.5, 1.1], [-27.6, -35.4, 0.8], [-22.5, -44.5, 1.2], [-20.6, -35.0, 0.85], [-25.4, -40.6, 0.95], [-31.5, -36.5, 0.9], [-18.6, -41.5, 1.0]].forEach(([x, z, s], i) => {
    const y = hillY(x, z);
    mesh(new THREE.CylinderGeometry(0.1 * s, 0.14 * s, 0.9 * s, 8), trunkM, world, V(x, y + 0.4 * s, z));
    mesh(new THREE.SphereGeometry(0.62 * s, 16, 12), i % 2 ? leafM : leafM2, world, V(x, y + 1.15 * s, z));
  });
  // fiorellini nel prato
  const flM = [std(0xffffff), std(0xffd23a), std(0xff8fa8)];
  for (let i = 0; i < 40; i++) { const x = -31 + rnd() * 13, z = -34 - rnd() * 10; mesh(new THREE.SphereGeometry(0.07, 8, 6), flM[i % 3], world, V(x, hillY(x, z) + 0.05, z)); }

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
  return { aggiorna(tn, t) { barriere(t); C.update(tn, CAM(tn), CUPOLA(tn), 1); } };
}
