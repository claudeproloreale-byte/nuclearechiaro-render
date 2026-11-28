// Puntata 8 — il MONDO: una collina che ruota come un piccolo pianeta (come nella puntata 2) con tre luoghi:
//   - centro (φ = 0): la centrale con le torri e un fiume davanti (B1–B7, B9, B10–B15)
//   - a sinistra (φ = +0,8): la centrale in riva al mare, senza torri: presa e scarico dell'acqua (B8)
//   - a destra (φ = −0,8): una centrale a carbone con camino (fumo grigio) e torre (vapore bianco) (B9)
// Cielo, sole e nuvole restano fermi; d'estate (B13) il cielo si scalda e il sole si allarga.
//
// const W = creaMondo()   → { scene, camera, aggiorna(tn, t, st) }
//   st = { cam: [x,y,z, gx,gy,gz], fov, giro (rotazione della collina), estate (0..1), pesci (0..1), centrale: {...},
//          carbone: k, mare: k }
import { THREE, W, H, V, std, basic, mesh, glow, gradientBg, addFade, setSeed, rnd, hash, lerp, clamp01, smooth } from '/comune/base.js';
import { creaCentrale8, T1, T2 } from './centrale8.js';
import { creaTorre } from './torre.js';
import { creaPennacchio } from './fumo.js';
import { acquaMat } from './acqua8.js';

const R = 60, HC = V(0, -58.5, -40);
export const PHI_MARE = 0.8, PHI_CARBONE = -0.8;
export const hillY = (x, z) => HC.y + Math.sqrt(R * R - x * x - (z - HC.z) ** 2);

// striscia di superficie sulla sfera: per x da x0 a x1, z da zA(x) a zB(x), alzata di dy (coordinate "interne" del sito)
function striscia(x0, x1, zA, zB, dy, nx = 160, nz = 24) {
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) {
    const x = lerp(x0, x1, i / nx), z = lerp(zA(x), zB(x), j / nz), y = hillY(x, z) + dy;
    pos.push(x, y, z); uv.push(i / nx, j / nz);
  }
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) { const a = i * (nz + 1) + j, b = a + nz + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}

// pesciolino giocattolo (si vede "sott'acqua": disegnato dopo l'acqua, un po' trasparente)
function pesce(parent, col, s = 1) {
  const g = new THREE.Group(); g.scale.setScalar(s); parent.add(g);
  const m = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85, depthTest: false, depthWrite: false });
  const b = mesh(new THREE.SphereGeometry(0.16, 16, 12), m, g); b.scale.set(1, 0.6, 0.45);
  const tail = mesh(new THREE.ConeGeometry(0.09, 0.14, 3), m, g, V(-0.19, 0, 0)); tail.rotation.z = Math.PI / 2; tail.scale.z = 0.35;
  const fin = mesh(new THREE.ConeGeometry(0.05, 0.08, 3), m, g, V(0.02, 0.09, 0)); fin.scale.z = 0.3;
  mesh(new THREE.SphereGeometry(0.022, 8, 6), new THREE.MeshBasicMaterial({ color: 0x14203c, transparent: true, opacity: 0.9, depthTest: false }), g, V(0.1, 0.025, 0.05));
  g.traverse(o => { if (o.isMesh) o.renderOrder = 20; });
  return { g, m, tail };
}
// alga: nastro verde che ondeggia (anche lei "sott'acqua")
function alga(parent, x, y, z, h, col = 0x3faa6a) {
  const pts = Array.from({ length: 6 }, (_, i) => V(0, i / 5 * h, 0));
  const curve = new THREE.CatmullRomCurve3(pts);
  const m = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.75, depthTest: false, depthWrite: false });
  const me = mesh(new THREE.TubeGeometry(curve, 16, 0.035, 6), m, parent, V(x, y, z)); me.renderOrder = 19;
  return { me, base: me.geometry.attributes.position.array.slice(), h, ph: hash(x * 3 + z) * 6 };
}
function ondeggiaAlga(a, tn) {
  const P = a.me.geometry.attributes.position.array, B = a.base;
  for (let i = 0; i < P.length; i += 3) { const u = B[i + 1] / a.h; P[i] = B[i] + Math.sin(tn * 1.6 + a.ph + u * 2.5) * 0.12 * u * u; P[i + 2] = B[i + 2] + Math.cos(tn * 1.3 + a.ph) * 0.05 * u; }
  a.me.geometry.attributes.position.needsUpdate = true;
}

export function creaMondo() {
  setSeed(8000);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, W / H, 0.05, 500); scene.add(camera); addFade(camera);
  const sky = gradientBg(scene, 0x2f86e6, 0xc6ebff);
  const SKY = { top: new THREE.Color(0x2f86e6), bot: new THREE.Color(0xc6ebff), topE: new THREE.Color(0x3f8ee0), botE: new THREE.Color(0xffe2b0) };
  const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x4a6a4a, 1.32); scene.add(hemi);
  const sunL = new THREE.DirectionalLight(0xfff3de, 2.45); sunL.position.set(8, 14, 12); scene.add(sunL);
  const SUNC = new THREE.Color(0xfff3de), SUNE = new THREE.Color(0xffd9a0);
  const sun = glow(0xfff0b0, scene, 34); sun.position.set(9, 22, -85); sun.material.opacity = 0.95;
  const sunHalo = glow(0xffd070, scene, 70); sunHalo.position.set(9, 22, -86);
  // nuvole vere (ferme nel cielo): alcune vicine ai pennacchi, per la B14
  const cloudM = std(0xffffff, { roughness: 1, emissive: 0xdde8f5, emissiveIntensity: 0.3 });
  const clouds = [[-6, 13.5, -58, 1.3], [13.5, 16, -62, 1.4], [3.8, 17.5, -66, 1.2], [-11.5, 15.2, -70, 1.5], [9.5, 11.8, -56, 1.0], [-17, 21, -66, 1.6], [6, 24, -70, 1.5], [-4, 27, -75, 1.8]].map(([x, y, z, s]) => {
    const g = new THREE.Group(); g.position.set(x, y, z); g.scale.set(s, s * 0.62, s); g.userData.x = x; scene.add(g);
    [[0, 0, 0, 1.5], [1.6, -0.2, 0, 1.1], [-1.6, -0.25, 0, 1.15], [0.7, 0.55, -0.3, 1.0], [-0.8, 0.4, 0.2, 0.9]].forEach(([a, b, c, r]) => mesh(new THREE.SphereGeometry(r, 20, 14), cloudM, g, V(a, b, c)));
    return g;
  });

  // ---------------- la collina-pianeta
  const pivot = new THREE.Group(); pivot.position.copy(HC); scene.add(pivot);
  mesh(new THREE.SphereGeometry(R, 256, 128), std(0x6cc070, { roughness: 0.95 }), pivot);
  const sito = phi => { const s = new THREE.Group(); s.rotation.z = phi; pivot.add(s); const inn = new THREE.Group(); inn.position.set(0, -HC.y, -HC.z); s.add(inn); return inn; };
  const trunkM = std(0x7a5236), leafM = std(0x3f9a50, { roughness: 0.9 }), leafM2 = std(0x55b060, { roughness: 0.9 });
  const albero = (inn, x, z, s, i) => { const y = hillY(x, z); mesh(new THREE.CylinderGeometry(0.1 * s, 0.14 * s, 0.9 * s, 8), trunkM, inn, V(x, y + 0.4 * s, z)); mesh(new THREE.SphereGeometry(0.62 * s, 16, 12), i % 2 ? leafM : leafM2, inn, V(x, y + 1.15 * s, z)); };
  // cespugli bassi e sassolini per dare consistenza al prato
  const bushM = std(0x4aa256, { roughness: 0.95 });
  const prato = (inn, n, x0, x1, z0, z1, seed) => { setSeed(seed); for (let i = 0; i < n; i++) { const x = lerp(x0, x1, rnd()), z = lerp(z0, z1, rnd()), s = 0.18 + rnd() * 0.22; const m = mesh(new THREE.SphereGeometry(s, 10, 8), bushM, inn, V(x, hillY(x, z) + s * 0.25, z)); m.scale.y = 0.6; } };

  // ===== SITO 0: centrale con le torri e il fiume
  const S0 = sito(0);
  mesh(new THREE.SphereGeometry(30, 160, 80), std(0x58b060, { roughness: 0.95 }), S0, V(-9, -32.6, -20));
  mesh(new THREE.SphereGeometry(30, 160, 80), std(0x4aa256, { roughness: 0.95 }), S0, V(10, -34.2, -15));
  [[-11.4, -38.2, 1], [-12.4, -36, 0.8], [9.6, -37, 1.1], [10.4, -35, 0.85], [8.2, -35.2, 0.75], [-13, -41, 0.9], [-10.6, -47, 1.0], [6.5, -46, 0.9]].forEach(([x, z, s], i) => albero(S0, x, z, s, i));
  prato(S0, 40, -12, 12, -35.5, -30.5, 81);
  const C = creaCentrale8(S0, { torri: true, interno: true, uscita: 'torre', hillY, seme: 1 });
  // fiume davanti alla centrale, da sinistra a destra, con le sponde
  const fz = x => -32.6 + 0.9 * Math.sin(x * 0.23 + 0.6) + 0.35 * Math.sin(x * 0.61);
  const fiumeM = acquaMat({ fondo: 0x2a78cc, chiaro: 0x6cc0f2, op: 0.9, scala: 1.4, flusso: [0.45, 0], caldo: 0xffd8a8 });
  mesh(striscia(-30, 30, x => fz(x) - 1.05, x => fz(x) + 1.05, 0.03, 400), std(0x7fa860, { roughness: 1 }), S0);   // sponde
  mesh(striscia(-30, 30, x => fz(x) - 0.75, x => fz(x) + 0.75, 0.05, 400), fiumeM, S0).renderOrder = 4;
  const canne = new THREE.Group(); S0.add(canne);
  { setSeed(83); const cm = std(0x5f9a3a, { roughness: 0.9 }), tm = std(0x7a5236);
    for (let i = 0; i < 46; i++) { const x = lerp(-14, 14, rnd()), sd = rnd() < 0.5 ? -1 : 1, z = fz(x) + sd * (0.85 + rnd() * 0.15), y = hillY(x, z), h = 0.35 + rnd() * 0.3;
      const c = mesh(new THREE.CylinderGeometry(0.012, 0.016, h, 5), cm, canne, V(x, y + h / 2, z)); c.rotation.z = (rnd() - 0.5) * 0.25;
      if (rnd() < 0.4) mesh(new THREE.CapsuleGeometry(0.03, 0.08, 3, 6), tm, canne, V(x + c.rotation.z * -h / 2, y + h, z)); } }
  const pesciF = [[0xff8a3a, -4.6, 0.9], [0xffc93a, -2.8, 1.0], [0xff6a6a, -5.6, 0.8], [0x9fd0ff, -3.6, 0.85], [0xffa860, -1.6, 0.9]].map(([c, x, s], i) => ({ ...pesce(S0, c, s), x, i }));
  const algheF = []; { setSeed(85); for (let i = 0; i < 16; i++) { const x = lerp(-7.5, 0.5, rnd()), z = fz(x) + (rnd() - 0.5) * 1.1; algheF.push(alga(S0, x, hillY(x, z) - 0.02, z, 0.35 + rnd() * 0.3)); } }

  // ===== SITO MARE (a sinistra): centrale senza torri, presa e scarico nel mare
  const SM = sito(PHI_MARE);
  // riva: dritta davanti alla centrale, poi ai lati piega verso l'orizzonte (una baia), così ruotando non si vede uno spigolo
  const riva = x => -35.6 + 0.35 * Math.sin(x * 0.5) + 0.2 * Math.sin(x * 1.3) + Math.pow(Math.max(0, Math.abs(x) - 16), 1.7) * 0.55;
  mesh(striscia(-30, 30, x => riva(x) - 0.9, x => riva(x) + 0.35, 0.025, 400), std(0xf0dca0, { roughness: 1 }), SM);   // spiaggia
  const mareM = acquaMat({ fondo: 0x1660b8, chiaro: 0x4fb0ec, op: 0.9, scala: 0.9, flusso: [0.05, -0.12], caldo: 0x9ff4ff });
  mesh(striscia(-30, 30, x => riva(x) + 0.05, x => Math.max(riva(x) + 0.06, -40 + Math.sqrt(Math.max(1, 59.6 * 59.6 - x * x))), 0.06, 300, 80), mareM, SM).renderOrder = 4;
  // schiuma della battigia
  const schiumaM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, depthWrite: false });
  const schiuma = mesh(striscia(-30, 30, x => riva(x) + 0.03, x => riva(x) + 0.16, 0.07, 400, 2), schiumaM, SM); schiuma.renderOrder = 5;
  [[-11, -38.5, 1], [-12.6, -41, 0.9], [9.4, -38.2, 1.0], [10.8, -40.4, 0.85], [-8.6, -44.5, 1.0]].forEach(([x, z, s], i) => albero(SM, x, z, s, i));
  prato(SM, 24, -10, 10, -37.5, -36.2, 87);
  // sott'acqua i tubi stanno appena sotto la superficie (l'acqua li copre); si vedono le bocche e le ondine
  const AIN = [V(-4.4, hillY(-4.4, -31.6) - 0.03, -31.6), V(-4.2, hillY(-4.2, -34.4) - 0.03, -34.4), V(-3.6, hillY(-3.6, -37.0) + 0.12, -37.0), V(-3.6, hillY(-3.6, -38.4) + 0.2, -38.4), V(-3.0, 1.6, -39.3)];
  const AOUT = [V(-3.2, 1.75, -39.9), V(-2.2, hillY(-2.2, -38.6) + 0.2, -38.6), V(1.2, hillY(1.2, -37.0) + 0.12, -37.0), V(2.2, hillY(2.2, -34.6) - 0.03, -34.6), V(2.6, hillY(2.6, -31.2) - 0.03, -31.2)];
  const CM = creaCentrale8(SM, { torri: false, interno: false, uscita: 'mare', hillY, seme: 2, mareA: AIN, mareB: AOUT });
  // bocche di presa e di scarico (blocchi di cemento sull'acqua)
  const cemM = std(0xc8ced8, { roughness: 0.9 });
  [AIN[0], AOUT[4]].forEach(p => { const b = mesh(new THREE.BoxGeometry(0.7, 0.3, 0.7), cemM, SM, p.clone().add(V(0, 0.08, 0))); });
  // posizione dello scarico nelle coordinate del materiale del mare (= coordinate interne del sito)
  mareM.uniforms.uCaldo.value.copy(AOUT[4]); mareM.uniforms.uCaldoR.value = 3.2;
  const pesciM = [[0xff8a3a, 1.0], [0xffc93a, 0.9], [0xff6a8a, 0.8], [0x7fd8ff, 1.0], [0xffa860, 0.85], [0xffe06a, 0.9]].map(([c, s], i) => ({ ...pesce(SM, c, s), i }));
  const algheM = []; { setSeed(89); for (let i = 0; i < 22; i++) { const x = lerp(-7, 5, rnd()), z = lerp(-33.5, -27, rnd()); algheM.push(alga(SM, x, hillY(x, z) - 0.02, z, 0.4 + rnd() * 0.4, rnd() < 0.5 ? 0x3faa6a : 0x5fbf7a)); } }
  // bollicine/frecce dell'acqua: presa (blu che entra) e scarico (chiara che esce e si allarga)
  const ondine = Array.from({ length: 14 }, (_, i) => { const m = mesh(new THREE.RingGeometry(0.2, 0.26, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }), SM); m.renderOrder = 6; m.userData = { ph: i / 14, out: i % 2 }; return m; });

  // ===== SITO CARBONE (a destra): edificio della caldaia, camino con fumo grigio, mucchio di carbone, torre con vapore bianco
  const SC = sito(PHI_CARBONE);
  [[-10.4, -38, 1], [-12, -41.5, 0.85], [9.8, -36.6, 1.0], [11.2, -39.6, 0.9]].forEach(([x, z, s], i) => albero(SC, x, z, s, i));
  prato(SC, 20, -10, 10, -36, -31, 91);
  const bG = new THREE.Group(); bG.position.set(-0.4, hillY(-0.4, -40) - 0.05, -40); SC.add(bG);
  const brick = std(0x9a6a5a, { roughness: 0.9 }), grey = std(0x7d8594, { roughness: 0.85 }), dark = std(0x4a505c, { roughness: 0.8 });
  mesh(new THREE.BoxGeometry(3.2, 3.4, 2.4), grey, bG, V(0, 1.7, 0));
  mesh(new THREE.BoxGeometry(3.4, 0.2, 2.6), dark, bG, V(0, 3.45, 0));
  mesh(new THREE.BoxGeometry(2.2, 2.0, 2.0), brick, bG, V(2.6, 1.0, 0.1));
  for (let i = 0; i < 4; i++) mesh(new THREE.BoxGeometry(0.34, 0.5, 0.05), new THREE.MeshStandardMaterial({ color: 0xfff0a0, emissive: 0xffd860, emissiveIntensity: 0.6 }), bG, V(-1.1 + i * 0.72, 2.2, 1.22));
  // camino a fasce bianche e rosse
  const chim = new THREE.Group(); chim.position.set(2.6, 0, -1.6); bG.add(chim);
  for (let i = 0; i < 10; i++) mesh(new THREE.CylinderGeometry(0.34 - i * 0.012, 0.36 - i * 0.012, 1.0, 24), i % 2 ? std(0xe8604a) : std(0xf2f4f8), chim, V(0, 0.5 + i, 0));
  const fumoGrigio = creaPennacchio(chim, { r: 0.5, n: 40, sale: 10, vento: [3.5, -0.8], vita: 9, colore: 0x6d7380, op: 0.85, cresce: 4, seme: 9 });
  fumoGrigio.g.position.y = 10;
  // mucchio di carbone e nastro trasportatore
  const coalM = std(0x2a2d33, { roughness: 0.7, flatShading: true });
  [[-3.2, -37.8, 1.0], [-2.3, -37.2, 0.7], [-3.9, -38.6, 0.6]].forEach(([x, z, s]) => { const c = mesh(new THREE.ConeGeometry(0.9 * s, 0.9 * s, 9), coalM, SC, V(x, hillY(x, z) + 0.4 * s, z)); c.rotation.y = s * 3; });
  { const a = V(-3.0, hillY(-3, -38) + 0.9, -38), b = V(-1.6, 2.9, -39.0); const nb = mesh(new THREE.BoxGeometry(a.distanceTo(b), 0.08, 0.3), dark, SC, a.clone().lerp(b, 0.5)); nb.rotation.z = Math.atan2(b.y - a.y, b.x - a.x); nb.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x); }
  const torreC = creaTorre(SC, { x: -6.8, y: hillY(-6.8, -44.5) - 0.1, z: -44.5, s: 0.92, interno: false, seme: 3 });
  mesh(new THREE.SphereGeometry(30, 160, 80), std(0x58b060, { roughness: 0.95 }), SC, V(-9, -32.6, -20));
  mesh(new THREE.SphereGeometry(30, 160, 80), std(0x4aa256, { roughness: 0.95 }), SC, V(10, -34.2, -15));

  const tmpV = new THREE.Vector3();
  function aggiorna(tn, t, st) {
    const c = st.cam;
    camera.fov = st.fov || 30; camera.updateProjectionMatrix();
    camera.position.set(c[0] + Math.sin(tn * 0.21) * 0.08, c[1] + Math.sin(tn * 0.17) * 0.04, c[2]); camera.lookAt(c[3], c[4], c[5]);
    pivot.rotation.z = st.giro || 0;
    const e = st.estate || 0;
    sky.uniforms.top.value.copy(SKY.top).lerp(SKY.topE, e); sky.uniforms.bottom.value.copy(SKY.bot).lerp(SKY.botE, e);
    sunL.color.copy(SUNC).lerp(SUNE, e); sunL.intensity = 2.45 * (1 + 0.25 * e);
    sun.scale.setScalar(34 * (1 + 0.45 * e)); sunHalo.material.opacity = 0.55 * e * (0.9 + 0.1 * Math.sin(tn * 2));
    clouds.forEach((cl, i) => { cl.position.x = cl.userData.x + Math.sin(tn * 0.05 + i) * 0.8 + tn * 0.02; });
    C.aggiorna(tn, t, st.centrale || {});
    CM.aggiorna(tn, t, { circ: [0, 0, st.mare || 0] });
    fiumeM.uniforms.uT.value = tn; mareM.uniforms.uT.value = tn;
    fiumeM.uniforms.uLuce.value = 1 + 0.08 * e;
    // macchia tiepida dello scarico in mare: pulsa piano e si allarga
    mareM.uniforms.uCaldoK.value = 0.55 + 0.1 * Math.sin(tn * 1.2);
    // pesci nel fiume: nuotano avanti e indietro lungo la corrente
    const pf = st.pesci || 0;
    pesciF.forEach(p => {
      const u = tn * 0.22 + p.i * 1.7, x = p.x + Math.sin(u) * 1.3, dir = Math.cos(u) >= 0 ? 1 : -1, z = fz(x) + Math.sin(u * 2.3 + p.i) * 0.32;
      p.g.position.set(x, hillY(x, z) + 0.07, z); p.g.rotation.set(0, dir > 0 ? 0 : Math.PI, Math.sin(tn * 3 + p.i) * 0.08);
      p.tail.rotation.y = Math.sin(tn * 9 + p.i) * 0.5; p.g.visible = pf > 0.01; p.m.opacity = 0.85 * pf;
    });
    algheF.forEach(a => { ondeggiaAlga(a, tn); a.me.visible = pf > 0.01; a.me.material.opacity = 0.75 * pf; });
    const pm = st.pesciMare || 0;
    pesciM.forEach(p => {
      const a = tn * 0.25 + p.i * 1.05, cx = -2.2 + (p.i % 3) * 1.6, cz = -31.2 - (p.i % 2) * 1.4, rr = 0.9 + (p.i % 3) * 0.3;
      const x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr * 0.6;
      p.g.position.set(x, hillY(x, z) + 0.08, z); p.g.rotation.set(0, -a - Math.PI / 2, 0);
      p.tail.rotation.y = Math.sin(tn * 9 + p.i) * 0.5; p.g.visible = pm > 0.01; p.m.opacity = 0.85 * pm;
    });
    algheM.forEach(a => { ondeggiaAlga(a, tn); a.me.visible = pm > 0.01; a.me.material.opacity = 0.75 * pm; });
    ondine.forEach(m => {
      const d = m.userData, u = (tn * 0.35 + d.ph) % 1, p = d.out ? AOUT[4] : AIN[0];
      m.position.set(p.x, hillY(p.x, p.z) + 0.09, p.z); m.rotation.x = -Math.PI / 2;
      const s = d.out ? 0.6 + u * 3.2 : 2.6 - u * 2.2; m.scale.setScalar(s); m.material.opacity = (d.out ? 0.5 : 0.4) * Math.sin(u * Math.PI) * (st.mare ? 1 : 0.5);
      m.material.color.setHex(d.out ? 0xe0fbff : 0xd0ecff);
    });
    schiumaM.opacity = 0.55 + 0.2 * Math.sin(tn * 1.4);
    fumoGrigio.aggiorna(tn, 1); torreC.aggiorna(tn, {});
  }
  return { scene, camera, aggiorna, C, hillY };
}
