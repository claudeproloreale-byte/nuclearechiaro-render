// Puntata 7 — LATO NATURA della collina (B2–B5, B10–B12). Dalla v4 sta a DESTRA della centrale (centro NX = +26): nella B13
// la camera scorre verso sinistra e il cavo elettrico, che esce dalla centrale verso sinistra, resta fuori dal movimento.
//   B2   sole, gruppo di rocce in primo piano a sinistra, banano a destra dietro la mascotte (foglie lunghe con nervatura,
//        casco di banane a mani, fiore viola)
//   B3   le rocce si illuminano di verde su «rocce», le banane su «cibo»; su «spazio» arrivano dal cielo i raggi cosmici (sottili)
//   B4   un omino (bambino giocattolo, testa grande) entra da sinistra camminando sul prato, con l'ombra sotto i piedi; si ferma,
//        si gira verso di noi sorpreso, sul corpo si accendono i puntini; la camera si avvicina piano
//   B5   la camera entra in un puntino (ZOOM), fino al lampo bianco del primo piano
// Tutte le x di questo file sono relative a NX (dx); z e y sono quelle del mondo.
import { THREE, V, std, mesh, glow, smooth, ramp, setSeed, rnd, clamp01, lerp, hash, tube, pipeCurve } from '/comune/base.js';
import { ATOM_OUT } from '../tempi.js';

export const NX = 26;
export const CAM_NAT = [NX, 1.0, -12, NX, -0.5, -40];   // v5: ancora più vicina e bassa (omino e rocce in primo piano)
export const FOSF = { rocce: 11.1, banane: 12.1, raggi: [13.3, 15.4], spente: [15.8, 17.0] };
export const SAGOMA = [15.4, 23.35], CAMMINA = [15.6, 17.9], GIRA = [17.9, 18.45], PUNTINI = 18.4, AVVICINA = [18.6, 21.9], ZOOM = [22.0, 23.3];

// ---------------- geometrie
const nz = (p, k) => Math.sin(p.x * 3.1 * k + 1.3) * Math.sin(p.y * 2.7 * k + 0.4) * Math.sin(p.z * 3.7 * k + 2.1);
function rockGeo(r, seed) {
  const g = new THREE.IcosahedronGeometry(r, 2), P = g.attributes.position, p = new THREE.Vector3();
  for (let i = 0; i < P.count; i++) {
    p.fromBufferAttribute(P, i); const d = p.clone().normalize().addScalar(seed);
    let k = 1 + 0.2 * nz(d, 1.6) + 0.08 * nz(d, 4.2);
    p.multiplyScalar(k); p.y *= 0.68; if (p.y < -0.25 * r) p.y = -0.25 * r + (p.y + 0.25 * r) * 0.2;
    P.setXYZ(i, p.x, p.y, p.z);
  }
  g.computeVertexNormals(); return g;
}
// foglia di banano lungo +x: picciolo stretto, lamina larga con i bordi ondulati, piegata a V sulla nervatura, arco che poi ricade
function leafGeo(L, W, rise, droop) {
  const nu = 28, nv = 8, pos = [], idx = [], h = u => L * (rise * u - droop * u * u);
  for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) {
    const u = i / nu, v = j / nv * 2 - 1, b = clamp01((u - 0.16) / 0.84), hw = u < 0.16 ? 0.035 : Math.max(0.035, W / 2 * Math.pow(Math.sin(Math.PI * b), 0.5) * (1 - 0.15 * b));
    const z = v * hw, y = h(u) - Math.abs(v) * hw * 0.3 + 0.025 * Math.abs(v) * Math.sin(u * 46 + v);
    pos.push(L * u, y, z);
  }
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = i * (nv + 1) + j, b = a + nv + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return { g, mid: pipeCurve(Array.from({ length: 9 }, (_, i) => V(L * i / 8, h(i / 8) + 0.01, 0))) };
}
// banana: tubo curvo che parte in fuori e piega verso l'alto, spigoli morbidi (6 lati), punte scure
function bananaGeo(len) {
  const pts = Array.from({ length: 9 }, (_, i) => { const u = i / 8; return V(len * 0.8 * u, len * (-0.05 * u + 0.55 * u * u), 0); });
  const curve = new THREE.CatmullRomCurve3(pts), seg = 24, rad = 6, g = new THREE.TubeGeometry(curve, seg, 1, rad), P = g.attributes.position, cp = new THREE.Vector3(), q = new THREE.Vector3();
  for (let k = 0; k < P.count; k++) {
    const u = Math.floor(k / (rad + 1)) / seg, r = len * 0.13 * Math.max(0.12, Math.pow(Math.sin(Math.PI * (0.04 + 0.92 * u)), 0.55));
    curve.getPointAt(u, cp); q.set(P.getX(k), P.getY(k), P.getZ(k)).sub(cp).normalize().multiplyScalar(r); P.setXYZ(k, cp.x + q.x, cp.y + q.y, cp.z + q.z);
  }
  g.computeVertexNormals(); return { g, tip: pts[8] };
}

export function creaNatura(C) {
  setSeed(7102);
  const world = C.scene;
  const NYc = -38.2, NZ = -44, NR = 40;
  mesh(new THREE.SphereGeometry(NR, 200, 100), std(0x62b868, { roughness: 0.95 }), world, V(NX, NYc, NZ));
  const hillY = (x, z) => Math.max(C.hillY(x, z), NYc + Math.sqrt(Math.max(0, NR * NR - (x - NX) ** 2 - (z - NZ) ** 2)));
  const gy = (dx, z) => hillY(NX + dx, z);
  const nat = new THREE.Group(); nat.position.x = NX; world.add(nat);   // tutto ciò che segue è in coordinate dx

  // sfondo: rocce, alberi, fiori
  const rockMs = [0x9a958c, 0x8c8f96, 0xa39d92, 0x878a85].map(c => std(c, { roughness: 0.92, flatShading: true }));
  [[-0.5, -37.5, 0.75], [2.8, -36.2, 0.5], [4.6, -41, 0.9], [-2.8, -42.5, 1.1], [1.4, -43.5, 0.65], [6.2, -37.8, 0.4]].forEach(([x, z, s], i) => {
    const r = mesh(rockGeo(s, i * 0.7), rockMs[i % 4], nat, V(x, gy(x, z) + s * 0.15, z)); r.rotation.y = rnd() * 6;
  });
  const trunkM = std(0x7a5236), leafM = std(0x3f9a50, { roughness: 0.9 }), leafM2 = std(0x55b060, { roughness: 0.9 });
  [[-3.5, -39.5, 1.1], [-1.6, -35.4, 0.8], [3.5, -44.5, 1.2], [5.4, -35.0, 0.85], [0.6, -40.6, 0.95], [-5.5, -36.5, 0.9], [7.4, -41.5, 1.0]].forEach(([x, z, s], i) => {
    const y = gy(x, z);
    mesh(new THREE.CylinderGeometry(0.1 * s, 0.14 * s, 0.9 * s, 8), trunkM, nat, V(x, y + 0.4 * s, z));
    mesh(new THREE.SphereGeometry(0.62 * s, 16, 12), i % 2 ? leafM : leafM2, nat, V(x, y + 1.15 * s, z));
  });
  const flM = [std(0xffffff), std(0xffd23a), std(0xff8fa8)];
  for (let i = 0; i < 46; i++) { const x = -6 + rnd() * 14, z = -31 - rnd() * 13; mesh(new THREE.SphereGeometry(0.07, 8, 6), flM[i % 3], nat, V(x, gy(x, z) + 0.05, z)); }
  // sole (in alto a sinistra di questa inquadratura)
  const sun = glow(0xfff0b0, nat, 15); sun.position.set(-7, 13.5, -95); sun.material.opacity = 0.9;
  mesh(new THREE.SphereGeometry(1.9, 32, 20), new THREE.MeshBasicMaterial({ color: 0xfff6c8 }), nat, V(-7, 13.5, -96));

  const fosf = [];   // { mats, glows, t0 }: cose che si illuminano nella B3
  // ---------------- gruppo di rocce in primo piano (rocce grandi irregolari, sassolini, ciuffi d'erba)
  // v6: rocce e banano in primo piano solo fino all'entrata negli atomi; al ritorno (B10–B12) il prato davanti è libero per i pesi
  const fp = new THREE.Group(); nat.add(fp);
  const rocks = { mats: [], glows: [], t0: FOSF.rocce };
  const grassM = std(0x4e9e44, { roughness: 0.9 });
  [[-1.05, -29.0, 0.85, 0x9a958c], [-0.05, -29.5, 0.65, 0x8c8f96], [-1.95, -29.6, 0.6, 0xa39d92], [-0.55, -28.3, 0.4, 0x908b82], [0.35, -28.6, 0.34, 0x9a958c], [-1.75, -28.4, 0.3, 0x8c8f96],
   [0.15, -27.95, 0.16, 0xa39d92], [-0.85, -27.8, 0.15, 0x878a85], [-2.3, -28.6, 0.16, 0x9a958c], [0.75, -29.2, 0.2, 0x8c8f96]].forEach(([x, z, s, c], i) => {
    const m = std(c, { roughness: 0.92, flatShading: true, emissive: 0x6dff5a, emissiveIntensity: 0 });
    const r = mesh(rockGeo(s, 3 + i * 1.3), m, fp, V(x, gy(x, z) + s * 0.12, z)); r.rotation.y = rnd() * 6;
    rocks.mats.push(m);
    if (s > 0.4) { const g = glow(0x8dff6a, fp, s * 3); g.position.set(x, gy(x, z) + s * 0.35, z + s * 0.6); rocks.glows.push(g); }
  });
  for (let i = 0; i < 16; i++) { const x = -2.5 + rnd() * 3.6, z = -27.7 - rnd() * 2.2, s = 0.18 + rnd() * 0.16; const b = mesh(new THREE.ConeGeometry(0.035, s, 4), grassM, fp, V(x, gy(x, z) + s / 2 - 0.03, z)); b.rotation.set((rnd() - 0.5) * 0.6, 0, (rnd() - 0.5) * 0.6); }
  fosf.push(rocks);

  // ---------------- banano in primo piano a sinistra
  const BT = new THREE.Group(); { const x = 1.75, z = -29.6; BT.position.set(x, gy(x, z) - 0.05, z); BT.scale.set(-1.05, 1.05, 1.05); } fp.add(BT);   // v5: a destra, dietro la mascotte; specchiato (casco verso il centro)
  const stemM = std(0x7f9448, { roughness: 0.85 }), sheathM = std(0x8a6a3a, { roughness: 0.95, side: THREE.DoubleSide }), stemM2 = std(0x6f8a3e, { roughness: 0.85 });
  const TOP = 3.4, UP = TOP - 2.7;   // altezza del fusto; la corona e il casco salgono di UP
  { const s = mesh(new THREE.CylinderGeometry(0.15, 0.25, TOP, 18, 4), stemM, BT, V(0, TOP / 2, 0)); s.rotation.z = 0.03;
    [[0, 0.5, 0.9, 1.6], [2.2, 0.35, 0.7, 1.3], [4.1, 0.9, 0.8, 1.2]].forEach(([a, y, h, w]) => mesh(new THREE.CylinderGeometry(0.235 - y * 0.03, 0.255 - y * 0.03, h, 16, 1, true, a, w), sheathM, BT, V(0, y, 0)));
    for (let k = 0; k < 6; k++) mesh(new THREE.CylinderGeometry(0.2 - k * 0.012, 0.21 - k * 0.012, 0.05, 16, 1, true), stemM2, BT, V(0, 0.75 + k * 0.45, 0)); }
  const leafMs = [std(0x4fae4a, { roughness: 0.75, side: THREE.DoubleSide }), std(0x45a043, { roughness: 0.75, side: THREE.DoubleSide }), std(0x5cb950, { roughness: 0.75, side: THREE.DoubleSide })];
  const ribM = std(0xa6d672, { roughness: 0.7 }), oldM = std(0xb39a48, { roughness: 0.9, side: THREE.DoubleSide });
  const leaves = [];
  [[1.25, 2.5, 0.9, 1.25, 0.9, 0.55], [1.85, 2.3, 0.85, 1.4, 1.0, 0.65], [2.45, 2.6, 0.95, 1.15, 0.8, 0.5], [3.05, 2.2, 0.8, 1.5, 1.05, 0.7], [3.65, 2.45, 0.9, 1.3, 0.95, 0.6],
   [4.25, 2.35, 0.85, 1.35, 1.0, 0.65], [4.85, 2.4, 0.95, 1.2, 0.85, 0.45], [0.75, 1.6, 0.8, 0.6, 1.3, 0]].forEach(([a, L, W, dr, ri, pitch], k) => {
    const piv = new THREE.Group(); piv.position.set(0, TOP - 0.05, 0); piv.rotation.y = a; BT.add(piv);
    const tilt = new THREE.Group(); tilt.rotation.z = pitch < 0 ? -0.9 : 0; piv.add(tilt);
    const { g, mid } = leafGeo(L, W, ri, dr);
    mesh(g, pitch < 0 ? oldM : leafMs[k % 3], tilt); if (pitch >= 0) tube(mid, 0.022, ribM, tilt, 24);
    leaves.push({ piv, a });
  });
  // casco: rachide che scende dalla corona, quattro "mani" di banane rivolte in su, fiore viola in fondo
  const bananaM = std(0xf2cf3a, { roughness: 0.55, emissive: 0x6dff5a, emissiveIntensity: 0 }), tipM = std(0x4a3a22, { roughness: 0.8 });
  const bunch = { mats: [bananaM], glows: [], t0: FOSF.banane };
  { const rach = pipeCurve([V(0.08, 2.6 + UP, 0.12), V(0.32, 2.45 + UP, 0.38), V(0.46, 2.1 + UP, 0.5), V(0.5, 1.5 + UP, 0.52), V(0.5, 1.05 + UP, 0.52)]);
    tube(rach, 0.04, stemM2, BT, 30);
    const bud = mesh(new THREE.SphereGeometry(0.14, 18, 14), std(0x6e2440, { roughness: 0.6 }), BT, V(0.5, 0.9 + UP, 0.52)); bud.scale.set(1, 1.9, 1);
    const { g: bg, tip } = bananaGeo(0.5);
    [[2.08, 1.0], [1.86, 0.95], [1.64, 0.9], [1.43, 0.82]].forEach(([y, s], h) => {
      const c = V(0.49, y + UP, 0.52);
      for (let k = 0; k < 9; k++) {
        const ang = -1.9 + k / 8 * 3.8 + h * 0.15, b = new THREE.Group(); b.position.copy(c); b.rotation.y = ang - Math.PI / 2; b.scale.setScalar(s); BT.add(b);
        const off = new THREE.Group(); off.position.x = 0.04; off.rotation.z = -0.15; b.add(off);
        mesh(bg, bananaM, off); mesh(new THREE.SphereGeometry(0.018, 8, 6), tipM, off, tip);
      }
    });
    const g = glow(0x8dff6a, BT, 1.4); g.position.set(0.5, 1.75 + UP, 0.85); bunch.glows.push(g); }
  fosf.push(bunch);

  // ---------------- raggi cosmici: dal cielo, da tutte le direzioni, fino al prato (scia sottile)
  const raggi = [];
  for (let k = 0; k < 16; k++) {
    const t0 = FOSF.raggi[0] + (k / 16) * (FOSF.raggi[1] - FOSF.raggi[0] - 0.8) + 0.15 * rnd();
    const side = k % 4, z = -48 - rnd() * 14, d = CAM_NAT[2] - z, hw = 0.152 * d * 1.15, hh = 0.268 * d;
    const A = side === 0 ? V(-hw, -0.5 + hh * (0.25 + 0.55 * rnd()), z) : side === 1 ? V(hw, -0.5 + hh * (0.25 + 0.55 * rnd()), z) : V((rnd() - 0.5) * 2 * hw, -0.5 + hh * 0.8, z);
    const bx = (rnd() - 0.5) * 1.4 * hw, bz = -32 - rnd() * 9, B = V(bx, gy(bx, bz) + 0.2, bz);
    raggi.push({ A, B, t0, dur: 0.75 + 0.2 * rnd(), trail: Array.from({ length: 30 }, () => glow(k % 3 ? 0xb8d4ff : 0xd8b8ff, nat, 0.38)), hit: glow(0xc8e0ff, nat, 0.7) });
  }

  // ---------------- omino (B4): bambino giocattolo, testa grande, maglietta arancione; cammina sul prato
  const MZ = -27.0, MX0 = -3.3, MX1 = 0.05;   // v5: più vicino alla camera
  const skin = std(0xf6c9a2, { roughness: 0.7 }), shirt = std(0xff9a3c, { roughness: 0.7 }), pants = std(0x3a5fa8, { roughness: 0.8 }), shoe = std(0xe8504a, { roughness: 0.6 }), sole = std(0xf4f4f4, { roughness: 0.6 });
  const hairM = std(0x6b4226, { roughness: 0.8 }), dark = std(0x241c28, { roughness: 0.4 }), white = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const man = new THREE.Group(); man.scale.setScalar(0.95); nat.add(man);
  const shadow = mesh(new THREE.CircleGeometry(0.5, 32), new THREE.MeshBasicMaterial({ color: 0x1d4a22, transparent: true, opacity: 0.35, depthWrite: false }), nat); shadow.rotation.x = -Math.PI / 2; shadow.scale.set(1, 0.6, 1);
  const body = new THREE.Group(); man.add(body);
  const legs = [-1, 1].map(sd => { const p = new THREE.Group(); p.position.set(sd * 0.15, 0.78, 0); body.add(p);
    mesh(new THREE.CapsuleGeometry(0.12, 0.42, 6, 16), pants, p, V(0, -0.33, 0));
    const f = mesh(new THREE.SphereGeometry(0.14, 16, 12), shoe, p, V(0, -0.68, 0.06)); f.scale.set(0.95, 0.6, 1.4);
    const s2 = mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.03, 16), sole, p, V(0, -0.75, 0.06)); s2.scale.set(0.95, 1, 1.4); return p; });
  mesh(new THREE.CapsuleGeometry(0.33, 0.42, 8, 24), shirt, body, V(0, 1.12, 0));
  mesh(new THREE.CylinderGeometry(0.3, 0.33, 0.16, 24), pants, body, V(0, 0.86, 0));
  const arms = [-1, 1].map(sd => { const p = new THREE.Group(); p.position.set(sd * 0.38, 1.38, 0); p.rotation.z = sd * 0.12; body.add(p);
    mesh(new THREE.CapsuleGeometry(0.1, 0.36, 6, 16), shirt, p, V(0, -0.24, 0));
    mesh(new THREE.SphereGeometry(0.1, 16, 12), skin, p, V(0, -0.52, 0)); return p; });
  const head = new THREE.Group(); head.position.set(0, 1.98, 0); body.add(head);
  mesh(new THREE.SphereGeometry(0.46, 40, 30), skin, head);
  { const h = mesh(new THREE.SphereGeometry(0.485, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.42), hairM, head); h.rotation.x = -0.32;
    [-0.2, 0, 0.2].forEach((x, i) => { const c = mesh(new THREE.SphereGeometry(0.12, 14, 10), hairM, head, V(x, 0.36 - Math.abs(x) * 0.3, 0.3)); c.scale.set(1.2, 0.6, 0.8); }); }
  [-1, 1].forEach(sd => mesh(new THREE.SphereGeometry(0.09, 12, 10), skin, head, V(sd * 0.45, 0, 0)));
  const eyes = [-1, 1].map(sd => { const e = new THREE.Group(); e.position.set(sd * 0.16, 0.02, 0.42); head.add(e);
    const b = mesh(new THREE.SphereGeometry(0.06, 16, 12), dark, e); b.scale.set(1, 1.25, 0.5);
    mesh(new THREE.SphereGeometry(0.018, 8, 6), white, e, V(0.02, 0.03, 0.03)); return e; });
  const brows = [-1, 1].map(sd => { const b = mesh(new THREE.CapsuleGeometry(0.016, 0.08, 4, 8), hairM, head, V(sd * 0.16, 0.15, 0.43)); b.rotation.z = Math.PI / 2 - sd * 0.12; return b; });
  const smile = mesh(new THREE.TorusGeometry(0.07, 0.016, 8, 20, Math.PI), dark, head, V(0, -0.13, 0.43)); smile.rotation.z = Math.PI;
  const oh = mesh(new THREE.SphereGeometry(0.05, 16, 12), std(0x6a2030), head, V(0, -0.16, 0.425)); oh.scale.set(0.8, 1, 0.4);
  [-1, 1].forEach(sd => { const c = glow(0xff7f98, head, 0.2); c.position.set(sd * 0.26, -0.08, 0.44); c.material.opacity = 0.45; });
  // puntini che si accendono: sulla parte davanti di maglietta, testa, gambe e braccia
  const dots = [], spots = [];
  for (let k = 0; spots.length < 44 && k < 3000; k++) {
    const a = hash(k * 1.7), b = hash(k * 2.9 + 3), w = hash(k * 4.1 + 7);
    if (w < 0.45) { const x = (a - 0.5) * 0.6, y = 0.82 + b * 0.7; spots.push(V(x, y, Math.sqrt(Math.max(0, 0.33 ** 2 - x * x)) + 0.03)); }
    else if (w < 0.65) { const x = (a - 0.5) * 0.7, y = 1.78 + b * 0.25; if (Math.abs(x) > 0.1 || y < 1.9) spots.push(V(x, y, Math.sqrt(Math.max(0, 0.46 ** 2 - x * x - (y - 1.98) ** 2)) + 0.03)); }
    else if (w < 0.85) { const sd = a < 0.5 ? -1 : 1; spots.push(V(sd * 0.15 + (b - 0.5) * 0.12, 0.15 + hash(k * 6.3) * 0.55, 0.14)); }
    else { const sd = a < 0.5 ? -1 : 1; spots.push(V(sd * (0.42 + b * 0.04), 0.95 + hash(k * 6.3) * 0.38, 0.11)); }
  }
  spots.forEach((p, k) => { const s = glow(0xfff2a0, body, 0.13); s.position.copy(p); dots.push({ s, ph: hash(k + 9), f: 0.6 + hash(k * 3.3) * 1.4 }); });
  const D = V(0.12, 1.2, 0.36), dz = glow(0xfff2a0, body, 0.12); dz.position.copy(D);   // il puntino dove entra la camera
  const manPos = t => MX0 + (MX1 - MX0) * smooth(ramp(t, ...CAMMINA));
  const Dworld = () => { man.updateMatrixWorld(true); return dz.getWorldPosition(new THREE.Vector3()); };
  const camMan = () => { const y = gy(MX1, MZ); return [NX + MX1, y + 1.55, MZ + 8.5, NX + MX1, y + 1.25, MZ]; };

  function omino(t, tn) {
    man.visible = shadow.visible = t > SAGOMA[0] && t < SAGOMA[1];
    if (!man.visible) return;
    const x = manPos(t), walking = t < CAMMINA[1] ? 1 - smooth(ramp(t, CAMMINA[1] - 0.45, CAMMINA[1])) : 0;
    const ph = tn * 2 * Math.PI * 1.5, sw = 0.55 * walking * Math.sin(ph);
    legs[0].rotation.x = sw; legs[1].rotation.x = -sw; arms[0].rotation.x = -sw * 0.8; arms[1].rotation.x = sw * 0.8;
    man.position.set(x, gy(x, MZ) + 0.05 * walking * Math.abs(Math.sin(ph)), MZ);
    shadow.position.set(x, gy(x, MZ) + 0.02, MZ);
    man.rotation.y = Math.PI / 2 * (1 - smooth(ramp(t, ...GIRA)));
    const sor = smooth(ramp(t, GIRA[1] - 0.25, GIRA[1] + 0.1));
    smile.visible = sor < 0.5; oh.visible = !smile.visible; oh.scale.set(0.8 * (0.6 + 0.4 * sor), 0.6 + 0.4 * sor, 0.4);
    eyes.forEach(e => e.scale.setScalar(1 + 0.35 * sor)); brows.forEach(b => { b.position.y = 0.15 + 0.05 * sor; });
    head.rotation.z = 0.06 * walking * Math.sin(ph);
    const on = smooth(ramp(t, PUNTINI, PUNTINI + 0.4)), u = smooth(ramp(t, ...ZOOM));
    for (const d of dots) { const q = (tn * d.f + d.ph) % 1; d.s.material.opacity = (q < 0.14 ? Math.sin(q / 0.14 * Math.PI) : 0) * 0.95 * on * (1 - u); }
    dz.material.opacity = Math.max((0.5 + 0.4 * Math.sin(tn * 6)) * on, u);
  }
  // camera della B4–B5: avvicinamento lento all'omino, poi dentro il puntino (distanza che cala in modo esponenziale)
  function camera(t, cam) {
    if (t < AVVICINA[0] || t > SAGOMA[1]) return null;
    const cm = camMan(), a = smooth(ramp(t, ...AVVICINA)), c = cam.map((v, i) => lerp(v, cm[i], a));
    const u = smooth(ramp(t, ...ZOOM));
    if (u <= 0) return { c };
    const d = Dworld(), P = V(c[0], c[1], c[2]), T = V(c[3], c[4], c[5]), k = Math.pow(60, -u * u);
    const pos = d.clone().add(P.sub(d).multiplyScalar(k)), look = T.lerp(d, smooth(ramp(u, 0, 0.5)));
    return { c, exact: [pos.x, pos.y, pos.z, look.x, look.y, look.z] };
  }

  function aggiorna(t, tn) {
    fp.visible = t < ATOM_OUT;
    const off = 1 - smooth(ramp(t, ...FOSF.spente));
    for (const f of fosf) {
      const on = smooth(ramp(t, f.t0, f.t0 + 0.4)) * off, puls = 1 + 0.5 * clamp01(1 - Math.abs(t - f.t0 - 0.35) / 0.4) + 0.12 * Math.sin(tn * 3.1 + f.t0);
      f.mats.forEach(m => { m.emissiveIntensity = 0.7 * on * puls; });
      f.glows.forEach(g => { g.material.opacity = 0.5 * on * puls; g.visible = on > 0.001; });
    }
    for (const r of raggi) {
      const u = (t - r.t0) / r.dur;
      r.trail.forEach((g, k) => { const v = u - k * 0.012; g.visible = v >= 0 && v <= 1 && u <= 1.35; if (!g.visible) return; g.position.copy(r.A).lerp(r.B, v); g.material.opacity = 0.85 * (1 - k / 30) * (u > 1 ? clamp01(1 - (u - 1) / 0.35) : 1); });
      const h = clamp01(1 - Math.abs(u - 1) / 0.35); r.hit.visible = h > 0; r.hit.position.copy(r.B); r.hit.material.opacity = 0.7 * h;
    }
    leaves.forEach(({ piv, a }, k) => { piv.rotation.y = a + 0.035 * Math.sin(tn * 1.1 + k); });
    omino(t, tn);
  }
  return { hillY, aggiorna, camera };
}
