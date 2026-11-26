// Puntata 7 — COLLINA: la centrale della libreria comune (comune/centrale.js) con, sul lato sinistro della collina, un angolo
// "solo natura" (rocce, alberi, prato) dove la centrale non si vede.
//   B2–B4 e B10–B12: camera sul lato natura (CAM_NAT): sole, gruppo di rocce in primo piano, banano (v3)
//   B3: si illuminano di verde le rocce («rocce»), poi le banane («cibo»); su «spazio» arrivano dal cielo i raggi cosmici
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
// B3 (v3): quando si accendono rocce e banane, raggi cosmici, spegnimento lento durante la B4
export const FOSF = { rocce: 11.1, banane: 12.1, raggi: [13.3, 15.4], spente: [15.8, 17.0] };
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

  // ---------------- v3: sole del lato natura, rocce in primo piano, banano; bagliori fosforescenti e raggi cosmici (B2–B3)
  const sun = glow(0xfff0b0, world, 17); sun.position.set(-34, 18, -95); sun.material.opacity = 0.9;
  mesh(new THREE.SphereGeometry(1.9, 32, 20), new THREE.MeshBasicMaterial({ color: 0xfff6c8 }), world, V(-34, 18, -96));
  const fosC = new THREE.Color(0x6dff5a);
  const fosf = [];   // { mats, glows, t0 }
  // gruppo di rocce in primo piano, a sinistra
  const rocks = { mats: [], glows: [], t0: FOSF.rocce };
  [[-28.6, -27.6, 0.78], [-27.4, -28.4, 0.58], [-29.7, -28.9, 0.66], [-27.9, -26.8, 0.38], [-26.7, -27.4, 0.33], [-29.4, -26.9, 0.32]].forEach(([x, z, s0], i) => {
    const m = std(i % 2 ? 0x8a92a0 : 0x9ea5b2, { roughness: 0.85, flatShading: true, emissive: 0x6dff5a, emissiveIntensity: 0 });
    const r = mesh(new THREE.DodecahedronGeometry(s0, 0), m, world, V(x, hillY(x, z) + s0 * 0.3, z));
    r.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); r.scale.y = 0.72;
    rocks.mats.push(m);
    const g = glow(0x8dff6a, world, s0 * 3.2); g.position.set(x, hillY(x, z) + s0 * 0.4, z + 0.4); rocks.glows.push(g);
  });
  fosf.push(rocks);
  // banano a destra, con un casco di banane sotto le foglie
  const bananaTree = new THREE.Group(); { const x = -24.4, z = -33.5; bananaTree.position.set(x, hillY(x, z) - 0.05, z); bananaTree.scale.setScalar(1.6); } world.add(bananaTree);
  const bark = std(0x8c7a46, { roughness: 0.9 }), leafB = std(0x4cb84e, { roughness: 0.8, side: THREE.DoubleSide }), leafB2 = std(0x3e9f45, { roughness: 0.8, side: THREE.DoubleSide });
  { const tr = mesh(new THREE.CylinderGeometry(0.17, 0.26, 3.0, 12), bark, bananaTree, V(0, 1.5, 0)); tr.rotation.z = 0.04;
    for (let k = 0; k < 4; k++) { const r = mesh(new THREE.TorusGeometry(0.2 - k * 0.012, 0.035, 6, 16), bark, bananaTree, V(0, 0.5 + k * 0.65, 0)); r.rotation.x = Math.PI / 2; } }
  const leaves = [];
  for (let k = 0; k < 7; k++) {
    const a = k / 7 * Math.PI * 2 + 0.3, piv = new THREE.Group(); piv.position.set(0, 3.0, 0); piv.rotation.y = a; bananaTree.add(piv);
    const tilt = new THREE.Group(); tilt.rotation.z = 0.2 - (k % 3) * 0.2; piv.add(tilt);
    const lf = mesh(new THREE.SphereGeometry(1, 20, 10), k % 2 ? leafB : leafB2, tilt, V(0.95, 0, 0)); lf.scale.set(0.95, 0.05, 0.28);
    lf.rotation.z = -0.25; leaves.push(piv);
  }
  const bananaM = std(0xffd23a, { roughness: 0.5, emissive: 0x6dff5a, emissiveIntensity: 0 });
  const bunch = { mats: [bananaM], glows: [], t0: FOSF.banane };
  { const BX = 0.1, BZ = 0.36;   // casco davanti al tronco, sotto le foglie
    const stem = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.55, 8), bark, bananaTree, V(BX, 2.62, BZ - 0.12)); stem.rotation.x = 0.5;
    for (let row = 0; row < 3; row++) for (let k = 0; k < 7; k++) {
      const a = k / 7 * Math.PI * 2 + row * 0.45, y = 2.3 - row * 0.21, b = mesh(new THREE.CapsuleGeometry(0.06, 0.3, 4, 10), bananaM, bananaTree, V(BX + Math.cos(a) * 0.14, y, BZ + Math.sin(a) * 0.14));
      b.rotation.set(Math.sin(a) * 0.75, 0, -Math.cos(a) * 0.75);
    }
    const g = glow(0x8dff6a, bananaTree, 1.3); g.position.set(BX, 2.1, BZ + 0.35); bunch.glows.push(g); }
  fosf.push(bunch);
  // raggi cosmici: arrivano dal cielo da tutte le direzioni e finiscono sul prato (scia di puntini luminosi)
  const raggi = [];
  for (let k = 0; k < 16; k++) {
    const t0 = FOSF.raggi[0] + (k / 16) * (FOSF.raggi[1] - FOSF.raggi[0] - 0.8) + 0.15 * rnd();
    const side = k % 4, z = -48 - rnd() * 14, d = 11 - z, hw = 0.152 * d * 1.15, hh = 0.268 * d;
    const A = side === 0 ? V(-26 - hw, 2.7 + hh * (0.2 + 0.6 * rnd()), z) : side === 1 ? V(-26 + hw, 2.7 + hh * (0.2 + 0.6 * rnd()), z) : V(-26 + (rnd() - 0.5) * 2 * hw, 2.7 + hh * 0.85, z);
    const bx = -26 + (rnd() - 0.5) * 1.4 * hw, bz = -30 - rnd() * 12, B = V(bx, hillY(bx, bz) + 0.2, bz);
    raggi.push({ A, B, t0, dur: 0.75 + 0.2 * rnd(), trail: Array.from({ length: 18 }, () => glow(k % 3 ? 0xb8d4ff : 0xd8b8ff, world, 1.5)), hit: glow(0xc8e0ff, world, 1.6) });
  }
  function natura(t, tn) {
    const off = 1 - smooth(ramp(t, ...FOSF.spente));
    for (const f of fosf) {
      const on = smooth(ramp(t, f.t0, f.t0 + 0.4)) * off, puls = 1 + 0.5 * clamp01(1 - Math.abs(t - f.t0 - 0.35) / 0.4) + 0.12 * Math.sin(tn * 3.1 + f.t0);
      f.mats.forEach(m => { m.emissiveIntensity = 0.75 * on * puls; });
      f.glows.forEach(g => { g.material.opacity = 0.55 * on * puls; g.visible = on > 0.001; });
    }
    for (const r of raggi) {
      const u = (t - r.t0) / r.dur;
      r.trail.forEach((g, k) => { const v = u - k * 0.022; g.visible = v >= 0 && v <= 1 && u <= 1.35; if (!g.visible) return; g.position.copy(r.A).lerp(r.B, v); g.material.opacity = 0.9 * (1 - k / 18) * (u > 1 ? clamp01(1 - (u - 1) / 0.35) : 1); });
      const h = clamp01(1 - Math.abs(u - 1) / 0.35); r.hit.visible = h > 0; r.hit.position.copy(r.B); r.hit.material.opacity = 0.8 * h;
    }
    leaves.forEach((l, k) => { l.rotation.y = k / 7 * Math.PI * 2 + 0.3 + 0.04 * Math.sin(tn * 1.1 + k); });
  }

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
  return { aggiorna(tn, t) { natura(t, tn); barriere(t); C.update(tn, CAM(tn), CUPOLA(tn), 1); } };
}
