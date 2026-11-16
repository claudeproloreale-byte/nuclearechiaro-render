// Puntata 5 — "Chi tiene il volante della reazione?" (animazione di prova sui tempi della scaletta, bozza 2)
// Parte da ep4.js: stessa mascotte, stessa centrale, stesse barrette, stessi nuclei. Tre mondi disegnati uno alla volta
// sotto il primo piano, con un breve lampo chiaro a ogni passaggio:
//  - CENTRALE (apertura e chiusura);
//  - BARRETTE nell'acqua, con le BARRE DI CONTROLLO (novità) appese agli elettromagneti;
//  - ATOMI: nuclei sparsi e, dalla B6, MOLECOLE D'ACQUA (novità) su cui i neutroni rimbalzano e rallentano.
// Zone del mondo degli atomi: R1 (x -10..10) reazione a catena dell'apertura; R2 (x 14..25) neutroni veloci,
// moderazione, catena "in fila" (la zona 1 arriva fino a x 13,5: nella panoramica non c'è un vuoto). Le barre di controllo sono lunghe quanto le barrette.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

await document.fonts.load('700 64px Poppins');
const q = new URLSearchParams(location.search);
const W = +(q.get('w') || 1080), H = +(q.get('h') || 1920);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp01 = x => Math.min(1, Math.max(0, x));
const smooth = x => { x = clamp01(x); return x * x * (3 - 2 * x); };
const ramp = (t, a, b) => clamp01((t - a) / (b - a));
const lerp = (a, b, u) => a + (b - a) * u;
const hash = k => { const s = Math.sin(k * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const backOut = x => { x = clamp01(x); const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const win = (t, a, b, f = 0.3) => Math.min(ramp(t, a, a + f), 1 - ramp(t, b - f, b));
const pop = (t, a, b, din = 0.35, dout = 0.3) => backOut(ramp(t, a, a + din)) * (1 - smooth(ramp(t, b - dout, b)));
let seed = 777; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
function track(keys) {
  return t => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 0; i < keys.length - 1; i++) {
      const [t0, a] = keys[i], [t1, b] = keys[i + 1];
      if (t <= t1) { const u = smooth((t - t0) / (t1 - t0)); return Array.isArray(a) ? a.map((v, k) => lerp(v, b[k], u)) : lerp(a, b, u); }
    }
    return keys[keys.length - 1][1];
  };
}

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
document.body.appendChild(renderer.domElement);
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.0, ...o });
const basic = (color, o = {}) => new THREE.MeshBasicMaterial({ color, ...o });
function mesh(geo, mat, parent, pos) { const m = new THREE.Mesh(geo, mat); if (pos) m.position.copy(pos); parent.add(m); return m; }
const UP = V(0, 1, 0);
function bar(a, b, r, mat, parent) {
  const d = b.clone().sub(a), m = mesh(new THREE.CylinderGeometry(r, r, d.length(), 8), mat, parent, a.clone().add(b).multiplyScalar(0.5));
  m.quaternion.setFromUnitVectors(UP, d.normalize()); return m;
}
const glowTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'), gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.5)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c);
})();
const glow = (color, parent, scale = 1) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); s.scale.setScalar(scale); parent.add(s); return s; };
const pipeCurve = (pts, closed = false) => new THREE.CatmullRomCurve3(pts, closed, 'catmullrom', 0.08);
const tube = (curve, r, mat, parent, seg = 240) => mesh(new THREE.TubeGeometry(curve, seg, r, 10, curve.closed), mat, parent);
function gradientBg(scene, top, bottom) {
  const m = new THREE.ShaderMaterial({
    uniforms: { top: { value: new THREE.Color(top) }, bottom: { value: new THREE.Color(bottom) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 1.0, 1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 bottom; varying vec2 vUv; void main(){ gl_FragColor = vec4(mix(bottom, top, smoothstep(0.0, 1.0, vUv.y)), 1.0); }',
    depthTest: false, depthWrite: false,
  });
  const s = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), m); s.frustumCulled = false; s.renderOrder = -1000; scene.add(s); return m;
}
function lights(scene, k = 1) {
  scene.add(new THREE.HemisphereLight(0xcfe6ff, 0x4a6a4a, 1.32 * k));
  const s = new THREE.DirectionalLight(0xfff3de, 2.45 * k); s.position.set(8, 14, 12); scene.add(s);
}
const fadeMat = basic(0xfff4dc, { transparent: true, opacity: 0, depthTest: false, depthWrite: false });
const addFade = cam => { const m = mesh(new THREE.PlaneGeometry(10, 10), fadeMat, cam, V(0, 0, -0.5)); m.renderOrder = 9999; };

// ============================================================ MONDO 1: CENTRALE (come nella puntata 4)
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, W / H, 0.05, 400); scene.add(camera); addFade(camera);
gradientBg(scene, 0x2f86e6, 0xc6ebff);
lights(scene);
const sun = glow(0xfff0b0, scene, 34); sun.position.set(9, 22, -85); sun.material.opacity = 0.95;
const world = new THREE.Group(); scene.add(world);
mesh(new THREE.SphereGeometry(30, 160, 80), std(0x58b060, { roughness: 0.95 }), world, V(-9, -32.2, -22));
mesh(new THREE.SphereGeometry(30, 160, 80), std(0x4aa256, { roughness: 0.95 }), world, V(9, -33.6, -17));
mesh(new THREE.SphereGeometry(60, 240, 120), std(0x6cc070, { roughness: 0.95 }), world, V(0, -58.5, -40));
const hillY = (x, z) => -58.5 + Math.sqrt(3600 - x * x - (z + 40) ** 2);
const trunkM = std(0x7a5236), leafM = std(0x3f9a50, { roughness: 0.9 }), leafM2 = std(0x55b060, { roughness: 0.9 });
[[-8.9, -37.5, 1], [-9.6, -35.5, 0.8], [9.2, -37, 1.1], [9.9, -35, 0.85], [7.4, -35.5, 0.75], [-11, -39, 0.9]].forEach(([x, z, s], i) => {
  const y = hillY(x, z);
  mesh(new THREE.CylinderGeometry(0.1 * s, 0.14 * s, 0.9 * s, 8), trunkM, world, V(x, y + 0.4 * s, z));
  mesh(new THREE.SphereGeometry(0.62 * s, 16, 12), i % 2 ? leafM : leafM2, world, V(x, y + 1.15 * s, z));
});
const cloudM = std(0xffffff, { roughness: 1, emissive: 0xdde8f5, emissiveIntensity: 0.3 });
const clouds = [[-6, 13.5, -58, 1.3], [13.5, 16, -62, 1.4], [3.8, 17.5, -66, 1.2], [-11.5, 15.2, -70, 1.5], [9.5, 11.8, -56, 1.0]].map(([x, y, z, s]) => {
  const g = new THREE.Group(); g.position.set(x, y, z); g.scale.set(s, s * 0.62, s); g.userData.x = x; world.add(g);
  [[0, 0, 0, 1.5], [1.6, -0.2, 0, 1.1], [-1.6, -0.25, 0, 1.15], [0.7, 0.55, -0.3, 1.0], [-0.8, 0.4, 0.2, 0.9]].forEach(([a, b, c, r]) => mesh(new THREE.SphereGeometry(r, 20, 14), cloudM, g, V(a, b, c)));
  return g;
});
const steelM = std(0x9fb0c8, { metalness: 0.4, roughness: 0.4 });
const darkBlueM = std(0x4a6fa8);
const prof = []; for (let i = 0; i <= 30; i++) { const y = i / 30 * 8; prof.push(new THREE.Vector2(1.45 * Math.sqrt(1 + ((y - 5.6) / 3.3) ** 2), y)); }
const towerM = std(0xeef1f6, { side: THREE.DoubleSide, roughness: 0.9 });
const stripeM = std(0xe8604a, { roughness: 0.8 });
const TOWERS = [[-5.6, -43.5, 1], [-1.6, -48.5, 0.95]];
TOWERS.forEach(([x, z, s]) => {
  const g = new THREE.Group(); g.position.set(x, hillY(x, z) - 0.1, z); g.scale.setScalar(s); world.add(g);
  mesh(new THREE.LatheGeometry(prof, 48), towerM, g);
  mesh(new THREE.CylinderGeometry(1.62, 1.6, 0.35, 48, 1, true), stripeM, g, V(0, 7.83, 0));
});
const puffs = [];
TOWERS.forEach(([x, z, s], ti) => {
  for (let k = 0; k < 12; k++) {
    const m = mesh(new THREE.SphereGeometry(1, 16, 12), basic(0xffffff, { transparent: true, opacity: 0.5, depthWrite: false }), world);
    m.userData = { x, z, base: hillY(x, z) + 8 * s, ph: k / 12 + ti * 0.37, a: rnd() * 6.28, r: rnd() * 0.5, s: 0.7 + rnd() * 0.4 };
    puffs.push(m);
  }
});
const DX = 3.7, DZ = -40, DY = hillY(DX, DZ) - 0.1;
const domeG = new THREE.Group(); domeG.position.set(DX, DY, DZ); world.add(domeG);
const domeM = std(0xf2f4f8, { roughness: 0.85, side: THREE.DoubleSide, emissive: 0xdfe8f5, emissiveIntensity: 0.32 });
const domeFront = std(0xf2f4f8, { roughness: 0.85, transparent: true, opacity: 1 });
const bandFront = std(0x3f8fe0, { transparent: true, opacity: 1 });
mesh(new THREE.CylinderGeometry(2.3, 2.3, 3.2, 48, 1, true, Math.PI / 2, Math.PI), domeM, domeG, V(0, 1.6, 0));
mesh(new THREE.SphereGeometry(2.3, 48, 20, Math.PI, Math.PI, 0, Math.PI / 2), domeM, domeG, V(0, 3.2, 0));
mesh(new THREE.CylinderGeometry(2.36, 2.36, 0.3, 48, 1, true, Math.PI / 2, Math.PI), std(0x3f8fe0), domeG, V(0, 3.1, 0));
[mesh(new THREE.CylinderGeometry(2.3, 2.3, 3.2, 48, 1, true, -Math.PI / 2, Math.PI), domeFront, domeG, V(0, 1.6, 0)),
 mesh(new THREE.SphereGeometry(2.3, 48, 20, 0, Math.PI, 0, Math.PI / 2), domeFront, domeG, V(0, 3.2, 0)),
 mesh(new THREE.CylinderGeometry(2.36, 2.36, 0.3, 48, 1, true, -Math.PI / 2, Math.PI), bandFront, domeG, V(0, 3.1, 0))].forEach(m => { m.renderOrder = 5; });
mesh(new THREE.CylinderGeometry(2.27, 2.27, 0.6, 48), std(0xc3cedf, { roughness: 0.9 }), domeG, V(0, -0.08, 0));
const inside = new THREE.Group(); domeG.add(inside);
const VX = -0.75, VY = 1.3, VZ = 0.25;
const glassM = new THREE.MeshStandardMaterial({ color: 0x9fc4e8, transparent: true, opacity: 0.3, roughness: 0.2, depthWrite: false });
mesh(new THREE.CapsuleGeometry(0.52, 1.15, 8, 32), glassM, inside, V(VX, VY, VZ)).renderOrder = 2;
mesh(new THREE.TorusGeometry(0.535, 0.05, 10, 40), darkBlueM, inside, V(VX, VY + 0.72, VZ)).rotation.x = Math.PI / 2;
[-1, 1].forEach(sd => mesh(new THREE.BoxGeometry(0.14, 0.3, 0.5), darkBlueM, inside, V(VX + sd * 0.42, 0.16, VZ)));
const coreM = new THREE.MeshStandardMaterial({ color: 0xff9a3a, emissive: 0xff6a18, emissiveIntensity: 2.3 });
for (let i = 0; i < 4; i++) for (let k = 0; k < 3; k++) mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.95, 12), coreM, inside, V(VX - 0.255 + i * 0.17, VY - 0.25, VZ - 0.17 + k * 0.17));
[-0.76, 0.26].forEach(dy => mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.04, 28), steelM, inside, V(VX, VY + dy, VZ)));
const coreGlow = glow(0xffa040, inside, 3.2); coreGlow.position.set(VX, VY - 0.25, VZ + 0.7);
const SGX = 0.95, SGY = 2.6, SGZ = 0.1;
mesh(new THREE.CapsuleGeometry(0.42, 1.7, 8, 32), glassM, inside, V(SGX, SGY, SGZ)).renderOrder = 3;
mesh(new THREE.CylinderGeometry(0.37, 0.37, 1.75, 24), new THREE.MeshStandardMaterial({ color: 0x6fb4ee, transparent: true, opacity: 0.6, roughness: 0.3, depthWrite: false, emissive: 0x2a7fe0, emissiveIntensity: 0.55 }), inside, V(SGX, 2.4, SGZ)).renderOrder = 2;
const PZ = 0.25, pp = (x, y, z = PZ) => V(x, y, z);
const primPts = [pp(-0.3, 1.78), pp(0.5, 1.78), pp(0.8, 2.05), pp(0.8, 3.2), pp(0.95, 3.42), pp(1.1, 3.2), pp(1.1, 1.4), pp(1.1, 0.85), pp(0.9, 0.62), pp(0.3, 0.62), pp(-0.3, 0.62)];
tube(pipeCurve(primPts), 0.07, new THREE.MeshStandardMaterial({ color: 0xff6a3a, roughness: 0.45, metalness: 0.2, emissive: 0xff4a1a, emissiveIntensity: 0.55 }), inside);
const primLoop = pipeCurve([pp(-0.75, 0.8, 0.6), pp(-0.75, 1.7, 0.6), ...primPts], true);
mesh(new THREE.SphereGeometry(0.17, 20, 14), std(0x3f6fb8), inside, pp(0.3, 0.62));
const dropM = new THREE.MeshStandardMaterial({ color: 0xff7a3a, emissive: 0xff4a10, emissiveIntensity: 1.6 });
const primDrops = Array.from({ length: 12 }, () => mesh(new THREE.SphereGeometry(0.075, 14, 10), dropM, inside));
const HX = -1.2, HZ = -39.6, HG = hillY(HX, HZ) - 0.05;
const hallG = new THREE.Group(); hallG.position.set(HX, HG, HZ); world.add(hallG);
mesh(new THREE.BoxGeometry(3.6, 2.4, 2.4), std(0x8fc0ee, { roughness: 0.8 }), hallG, V(0, 1.2, 0));
mesh(new THREE.BoxGeometry(3.8, 0.2, 2.6), darkBlueM, hallG, V(0, 2.5, 0));
for (let i = 0; i < 5; i++) mesh(new THREE.BoxGeometry(0.36, 0.55, 0.05), new THREE.MeshStandardMaterial({ color: 0xfff0a0, emissive: 0xffd860, emissiveIntensity: 0.7 }), hallG, V(-1.3 + i * 0.65, 1.35, 1.22));
const AX = 2.94, TZ = -39.3;
const SGW = V(DX + SGX, DY + SGY, DZ + SGZ);
const steamPts = [V(SGW.x, DY + 3.85, -39.9), V(SGW.x, DY + 4.15, -39.9), V(0.85, DY + 4.15, -39.55), V(0.85, 3.55, -39.4), V(0.2, 3.55, TZ)];
tube(pipeCurve(steamPts), 0.075, new THREE.MeshStandardMaterial({ color: 0xdfe6f0, roughness: 0.5, emissive: 0xffffff, emissiveIntensity: 0.25 }), world);
const pylonM = std(0x6f7c93, { roughness: 0.5, metalness: 0.3 });
const PYX = -5.4, PYZ = -38, PYS = 1.3;
const pylon = new THREE.Group(); pylon.position.set(PYX, hillY(PYX, PYZ) - 0.1, PYZ); pylon.scale.setScalar(PYS); world.add(pylon);
{ const P = (x, y) => V(x, y, 0), r = 0.05;
  [-1, 1].forEach(sd => {
    bar(P(sd * 0.6, 0), P(sd * 0.16, 2.3), 0.065, pylonM, pylon); bar(P(sd * 0.16, 2.3), P(0, 3.3), 0.055, pylonM, pylon);
    bar(P(sd * 0.6, 0), P(-sd * 0.38, 1.15), r * 0.8, pylonM, pylon); bar(P(sd * 0.38, 1.15), P(-sd * 0.16, 2.3), r * 0.8, pylonM, pylon);
    [[2.3, 0.95], [2.85, 0.62]].forEach(([y, w]) => { mesh(new THREE.SphereGeometry(0.07, 10, 8), std(0xdfe6f0), pylon, P(sd * w, y - 0.14)); });
  });
  bar(P(-0.38, 1.15), P(0.38, 1.15), r * 0.8, pylonM, pylon); bar(P(-0.95, 2.3), P(0.95, 2.3), r, pylonM, pylon); bar(P(-0.62, 2.85), P(0.62, 2.85), r, pylonM, pylon); }
const cableCurve = new THREE.CatmullRomCurve3([V(-1.97, AX + 0.44, TZ), V(-1.97, 4.5, TZ), V(-3.4, 5.1, -38.6), V(PYX, pylon.position.y + 3.3 * PYS, PYZ), V(-9.5, 5.2, -36.5), V(-14, 4.6, -35)]);
mesh(new THREE.TubeGeometry(cableCurve, 160, 0.03, 6), std(0x3b4558), world);
const sparkM = new THREE.MeshStandardMaterial({ color: 0xfff2a0, emissive: 0xffd040, emissiveIntensity: 2.4 });
const cableDots = Array.from({ length: 6 }, () => mesh(new THREE.SphereGeometry(0.11, 12, 10), sparkM, world));
const flags = [];
function makeFlag(parent, x, y, z, colors, sc = 1, poleH = 3.7) {
  const FLW = 1.9, FLH = 1.25, geo = new THREE.PlaneGeometry(FLW, FLH, 26, 8);
  const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(sc); parent.add(g);
  mesh(new THREE.CylinderGeometry(0.045, 0.06, poleH, 12), std(0xdfe3ea, { metalness: 0.3, roughness: 0.4 }), g, V(0, poleH / 2, 0));
  mesh(new THREE.SphereGeometry(0.1, 16, 12), std(0xffc928, { roughness: 0.35 }), g, V(0, poleH + 0.05, 0));
  const c = document.createElement('canvas'); c.width = 96; c.height = 8; const k = c.getContext('2d');
  colors.forEach((col, i) => { k.fillStyle = col; k.fillRect(i * 32, 0, 32, 8); });
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.magFilter = THREE.NearestFilter;
  const f = mesh(geo, new THREE.MeshStandardMaterial({ map: tx, side: THREE.DoubleSide, roughness: 0.8, emissive: 0xffffff, emissiveMap: tx, emissiveIntensity: 0.22 }), g, V(FLW / 2 + 0.05, poleH - 0.7, 0));
  f.frustumCulled = false; flags.push({ geo, base: geo.attributes.position.array.slice(), FLW, ph: flags.length * 1.3 }); return g;
}
makeFlag(world, -7.5, hillY(-7.5, -36.5) - 0.05, -36.5, ['#0a9246', '#f7f7f2', '#d42b36']);
function waveFlag(t) {
  for (const fl of flags) {
    const P = fl.geo.attributes.position.array, B = fl.base, FLW = fl.FLW;
    for (let i = 0; i < P.length; i += 3) {
      const u = (B[i] + FLW / 2) / FLW, ph = u * 7.5 - t * 6.5 + fl.ph;
      P[i] = B[i] - u * u * 0.08 * (1 + Math.sin(ph * 0.5)); P[i + 1] = B[i + 1] + Math.sin(ph + 0.8) * 0.05 * u - u * u * 0.1; P[i + 2] = Math.sin(ph) * 0.2 * u + Math.sin(ph * 1.7 + B[i + 1] * 2) * 0.05 * u;
    }
    fl.geo.attributes.position.needsUpdate = true; fl.geo.computeVertexNormals();
  }
}

// ============================================================ MONDO 2: BARRETTE nell'acqua + BARRE DI CONTROLLO
const rodScene = new THREE.Scene();
const rodCam = new THREE.PerspectiveCamera(30, W / H, 0.05, 100); rodScene.add(rodCam); addFade(rodCam);
const waterBg = gradientBg(rodScene, 0x4aa8ec, 0x1050a0);
lights(rodScene, 0.8);
{ const p = new THREE.PointLight(0xffffff, 40); p.position.set(2, 3, 6); rodScene.add(p); const p2 = new THREE.PointLight(0xffffff, 40); p2.position.set(-2, 12, 8); rodScene.add(p2); }
const RODS = [[-2.6, 0], [-1.3, 0], [0, 0], [1.3, 0], [2.6, 0], [-1.95, -2.2], [-0.65, -2.2], [0.65, -2.2], [1.95, -2.2]];
const PEL_N = 31, PEL_DY = 0.44;
const pelM = new THREE.MeshStandardMaterial({ color: 0x46464f, roughness: 0.75, emissive: 0xff6a10, emissiveIntensity: 0.06 });
const pellets = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.36, 0.36, 0.4, 32), pelM, RODS.length * PEL_N); rodScene.add(pellets);
{ const m4 = new THREE.Matrix4(); let n = 0; RODS.forEach(([x, z]) => { for (let k = 0; k < PEL_N; k++) { m4.makeTranslation(x, (k - 15) * PEL_DY, z); pellets.setMatrixAt(n++, m4); } }); }
const cladM = new THREE.MeshStandardMaterial({ color: 0xbfcad8, metalness: 0.5, roughness: 0.35, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide });
const cladMid = cladM.clone();
const rodGlows = RODS.map(([x, z], i) => {
  mesh(new THREE.CylinderGeometry(0.42, 0.42, 14, 40, 1, true), i === 2 ? cladMid : cladM, rodScene, V(x, 0, z)).renderOrder = 3;
  mesh(new THREE.SphereGeometry(0.42, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), std(0xbfcad8, { metalness: 0.5, roughness: 0.35 }), rodScene, V(x, 7, z));   // tappo in cima
  const g = glow(0xff8a30, rodScene, 1); g.scale.set(1.9, 16, 1); g.position.set(x, 0, z + 0.3); return g;
});
const rodBubbles = Array.from({ length: 46 }, (_, i) => { const m = mesh(new THREE.SphereGeometry(0.05 + 0.04 * hash(i), 10, 8), basic(0xdff2ff, { transparent: true, opacity: 0.7 }), rodScene); m.userData = { x: (hash(i + 3) - 0.5) * 5.4, z: 0.5 - hash(i + 9) * 0.6 - (i % 3) * 1.1, ph: hash(i + 17) }; return m; });
const flowLines = Array.from({ length: 44 }, (_, i) => { const m = mesh(new THREE.CapsuleGeometry(0.014, 0.55, 4, 8), basic(0xe8f6ff, { transparent: true, opacity: 0.25, depthWrite: false }), rodScene); m.userData = { x: [-1.95, -0.65, 0.65, 1.95, -3.25, 3.25][i % 6] + (hash(i + 5) - 0.5) * 0.5, z: 0.45 - hash(i + 8) * 1.4, v: 0.22 + 0.1 * hash(i + 2), ph: hash(i + 31) }; return m; });
const heatPuffs = Array.from({ length: 50 }, (_, i) => { const s = glow(0xff9a40, rodScene, 0.9); s.userData = { r: RODS[i % 5][0], ph: hash(i + 40), y: (hash(i + 70) - 0.5) * 6 }; return s; });
const WATER_C = [new THREE.Color(0x4aa8ec), new THREE.Color(0x1050a0)], WARM_C = [new THREE.Color(0x7ab4e0), new THREE.Color(0x5a4a90)];
// barre di controllo: 4 barre grigio scuro, lunghe quanto le barrette, fra le due file; ognuna con un'asta che passa nell'elettromagnete in cima.
// Fuori (ins = 0) l'assorbitore sta tutto sopra le pastiglie; dentro (ins = 1) copre tutta l'altezza delle pastiglie.
const CR_X = [-1.95, -0.65, 0.65, 1.95], CR_Z = -1.1, CR_L = 14.0, CR_OUT = 7.05, CR_IN = -6.8, MAG_Y = 21.7;   // lunghe quanto le barrette di combustibile
const crM = std(0x2c313c, { metalness: 0.55, roughness: 0.38 }), crBand = std(0xffc93a, { roughness: 0.5 }), shaftM = std(0x9aa6b8, { metalness: 0.6, roughness: 0.3 });
const ctrlRods = CR_X.map(x => {
  const g = new THREE.Group(); rodScene.add(g);
  mesh(new THREE.CylinderGeometry(0.3, 0.3, CR_L, 28), crM, g, V(0, CR_L / 2, 0));
  mesh(new THREE.SphereGeometry(0.3, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), crM, g, V(0, 0, 0));
  mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.22, 28), crBand, g, V(0, CR_L - 0.35, 0));
  mesh(new THREE.CylinderGeometry(0.07, 0.07, 14, 10), shaftM, g, V(0, CR_L + 7, 0));
  g.position.set(x, CR_OUT, CR_Z); return g;
});
// elettromagneti: scatola blu con bobina color rame e luce azzurra quando sono accesi
const magM = std(0x4a6fa8, { roughness: 0.5 }), coilM = new THREE.MeshStandardMaterial({ color: 0xc87533, roughness: 0.4, metalness: 0.4, emissive: 0x59b8ff, emissiveIntensity: 0 });
mesh(new THREE.BoxGeometry(5.4, 0.22, 0.5), std(0x6f7c93, { metalness: 0.4, roughness: 0.4 }), rodScene, V(0, MAG_Y + 0.42, CR_Z));
const magGlows = CR_X.map(x => {
  mesh(new THREE.BoxGeometry(0.62, 0.62, 0.62), magM, rodScene, V(x, MAG_Y, CR_Z));
  const c = mesh(new THREE.TorusGeometry(0.33, 0.07, 10, 28), coilM, rodScene, V(x, MAG_Y, CR_Z)); c.rotation.x = Math.PI / 2;
  const g = glow(0x7cc8ff, rodScene, 1.8); g.position.set(x, MAG_Y, CR_Z + 0.5); return g;
});

// ============================================================ MONDO 3: ATOMI
const atomScene = new THREE.Scene();
const atomCam = new THREE.PerspectiveCamera(30, W / H, 0.05, 300); atomScene.add(atomCam); addFade(atomCam);
gradientBg(atomScene, 0x24305e, 0x120f2a);
lights(atomScene, 0.95);
{ const p = new THREE.PointLight(0xffffff, 60); p.position.set(2, 4, 9); atomScene.add(p); const f = new THREE.PointLight(0x9fc8ff, 30); f.position.set(-5, -2, 6); atomScene.add(f); }
const atomKey = new THREE.DirectionalLight(0xffffff, 1.2); atomKey.position.set(3, 5, 10); atomScene.add(atomKey);
const protM = std(0xf06a52, { roughness: 0.5 }), neutM = new THREE.MeshStandardMaterial({ color: 0x58b0ff, roughness: 0.6, emissive: 0x1c5fb8, emissiveIntensity: 0.35 });
const NR = 0.075;
const nucGeo = new THREE.SphereGeometry(NR, 16, 12), instGeo = new THREE.SphereGeometry(NR, 10, 8), freeGeo = new THREE.SphereGeometry(NR * 1.15, 16, 12);
const TEMPLATE = (() => {
  seed = 4242; const pts = [];
  while (pts.length < 40) { const p = V(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).multiplyScalar(0.26); if (p.length() > 0.26) continue; if (pts.every(o => o.distanceTo(p) > 0.098)) pts.push(p); }
  pts.sort((a, b) => a.length() - b.length());
  return pts.map((p, i) => ({ p, isP: hash(i * 7.3) < 0.4 }));
})();
const rotated = k => { const e = new THREE.Euler(hash(k) * 6.28, hash(k + 1) * 6.28, hash(k + 2) * 6.28), m = new THREE.Matrix4().makeRotationFromEuler(e); return TEMPLATE.map(({ p, isP }) => ({ p: p.clone().applyMatrix4(m), isP })); };
const xy = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const segDist = (p, a, b) => { const abx = b.x - a.x, aby = b.y - a.y, u = clamp01(((p.x - a.x) * abx + (p.y - a.y) * aby) / (abx * abx + aby * aby)); return Math.hypot(p.x - a.x - u * abx, p.y - a.y - u * aby); };
const ang = a => V(Math.cos(a * Math.PI / 180), Math.sin(a * Math.PI / 180), 0);
const easeOut = (u, k = 2.2) => 1 - Math.pow(1 - clamp01(u), k);
const dirTo = (a, b) => V(b.x - a.x, b.y - a.y, 0).normalize();

// ---------------- posizioni chiave (scritte a mano)
// Zona 1 (x da −10 a 13,5): nuclei fitti, reazione a catena dell'apertura. Zona 2 (x da 13,5 a 25,5, centro X2): nuclei radi,
// neutroni veloci, moderazione e catena "in fila" che sale verso l'alto. Le due zone si toccano: nella panoramica non c'è un vuoto.
const X2 = 19.5, P2 = (dx, y) => V(X2 + dx, y, 0);
const S0 = V(0, 2, 0);
// B4: S viene colpito da un neutrone lento che arriva dal basso, si spacca e i frammenti schizzano via
const SB4 = P2(-0.5, -4.0), S_FROM = P2(-0.15, -8.4);
// B5: un neutrone veloce passa accanto a U1 e U2 senza spaccarli
const A5 = P2(1.5, -9.0), B5 = P2(-2.1, 6.0);
const perp5 = V(-(B5.y - A5.y), B5.x - A5.x, 0).normalize(), along5 = y => A5.clone().lerp(B5, (y - A5.y) / (B5.y - A5.y));
const U1 = along5(-1.8).addScaledVector(perp5, 0.5), U2 = along5(1.2).addScaledVector(perp5, -0.5);
// B6: il neutrone entra e rimbalza sugli idrogeni (un idrogeno su ogni punto WP), poi spacca T (B7)
const E6 = P2(2.7, 1.6);
const WP = [[1.0, 2.8], [-1.6, 3.5], [0.9, 4.3], [-1.4, 5.1], [0.6, 5.8], [-1.2, 6.4], [0.3, 7.0], [-0.9, 7.5], [0.05, 8.0]].map(([dx, y]) => P2(dx, y));
const T = P2(-0.6, 8.9);
// B8-B9: catena "in fila" verso l'alto (anche qui i neutroni rimbalzano sull'acqua prima di spaccare il nucleo seguente), poi due rami, poi si spegne
const TCH = [T, P2(0.9, 11.8), P2(-0.8, 14.7), P2(0.8, 17.6), P2(-0.7, 20.5), P2(0.6, 23.4)], T7 = [P2(-1.0, 26.4), P2(1.9, 26.2)];
const zigzag = (a, b, nB, amp, sgn) => { const d = dirTo(a, b), pr = V(-d.y, d.x, 0), L = a.distanceTo(b); return Array.from({ length: nB }, (_, i) => a.clone().addScaledVector(d, L * (i + 1) / (nB + 1)).addScaledVector(pr, amp * (i % 2 ? -sgn : sgn))); };
const LINKS = [...TCH.slice(0, 5).map((p, i) => [p, TCH[i + 1]]), [TCH[5], T7[0]], [TCH[5], T7[1]]];
const LINK_WP = LINKS.map(([a, b], i) => zigzag(a, b, i % 2 ? 3 : 2, 0.6, i % 2 ? 1 : -1));

// ---------------- tempi della sequenza atomi (secondi di scaletta)
const S0_IN = 3.8, CHAIN0 = 6.6, CHAIN_END = 10.6;   // catena dell'apertura: S0 colpito da un neutrone lento che arriva dal basso
const S_IN = 10.0, S_HIT = 12.6, FAST1 = 7.0;
const N5_0 = 17.6;
const MOL_IN = 21.9, N6_0 = 23.6, T_HIT = 31.4;
const TCH_HIT = [T_HIT, 33.2, 34.9, 36.6, 38.3, 40.0], T7_HIT = [41.4, 41.7];

// ---------------- nuclei: speciali (si spaccano) + riempimento casuale con distanza minima
const NUCS = [];
const special = (c, u, key) => { const n = { c: c.clone(), u, key }; NUCS.push(n); return n; };
const nS0 = special(S0, true, 'S0'), nSB4 = special(SB4, true, 'S'), nU1 = special(U1, true, 'U1'), nU2 = special(U2, true, 'U2');
const nT = TCH.map((p, i) => special(p, true, 'T' + i)), nT7 = T7.map((p, i) => special(p, true, 'T7' + i));
// corridoi lasciati liberi: percorsi dei neutroni scritti a mano
const polySegs = pts => pts.slice(1).map((p, i) => [pts[i], p]);
const CAPS = [[S_FROM, SB4], [A5, B5], ...polySegs([E6, ...WP, T]), ...LINKS.flatMap(([a, b], i) => polySegs([a, ...LINK_WP[i], b]))];
seed = 2025;
// [x0, x1, y0, y1, tentativi, distanza minima, corridoi]
[[-10, 13.5, -12, 16, 34000, 1.45, false], [13.5, 25.5, -9.5, 29.5, 12000, 2.25, true]].forEach(([x0, x1, y0, y1, tries, md, caps]) => {
  for (let k = 0; k < tries; k++) {
    const p = V(lerp(x0, x1, rnd()), lerp(y0, y1, rnd()), 0);
    if (NUCS.some(n => xy(n.c, p) < md)) continue;
    if (caps && CAPS.some(([a, b]) => segDist(p, a, b) < 0.7)) continue;
    p.z = (rnd() - 0.5) * 0.4; NUCS.push({ c: p, u: false });
  }
});
// U-235 della catena dell'apertura (1 su 10, mai a meno di 3,4 l'uno dall'altro). Nella zona 2 ci sono solo quelli scritti a mano.
{ const free = NUCS.filter(n => !n.key && n.c.x < 12), U = [S0], want = Math.round(free.length * 0.14);
  let got = 0;
  for (const n of free.map((n, i) => [hash(i * 3.7 + 11), n]).sort((a, b) => a[0] - b[0]).map(x => x[1])) {
    if (got >= want) break;
    if (U.every(c => xy(c, n.c) > 2.6)) { n.u = true; U.push(n.c); got++; }
  } }
function makeNucleus(c, k) {
  const g = new THREE.Group(); g.position.copy(c); atomScene.add(g);
  const parts = rotated(k + 500).map(({ p, isP }) => { const m = mesh(nucGeo, isP ? protM : neutM, g, p); return { p, isP, m }; });
  const halo = glow(0xffd23a, g, 1.25);
  const hot = [0, 1].map(() => glow(0xffb060, g, 0.9));
  return { g, parts, halo, hot, hit: null };
}
const bg = [];
NUCS.forEach((n, k) => { if (n.u) n.obj = makeNucleus(n.c, k); else bg.push(n); });
bg.forEach((n, k) => { n.parts = rotated(k * 13 + 7); n.ph = hash(k) * 6.28; });
const nP = bg.reduce((s, n) => s + n.parts.filter(p => p.isP).length, 0), nN = bg.length * 40 - nP;
const instP = new THREE.InstancedMesh(instGeo, std(0xffffff, { roughness: 0.55 }), nP), instN = new THREE.InstancedMesh(instGeo, std(0xffffff, { roughness: 0.55 }), nN);
atomScene.add(instP, instN);
const C_P = new THREE.Color(0xf06a52), C_N = new THREE.Color(0x5aa8f0), C_HOT = new THREE.Color(0xffa040);
const _m4b = new THREE.Matrix4(), _cb = new THREE.Color();
function placeBg(n, ox = 0, oy = 0, h = 0) {
  for (const pt of n.parts) {
    _m4b.makeTranslation(n.c.x + pt.p.x + ox, n.c.y + pt.p.y + oy, n.c.z + pt.p.z);
    _cb.copy(pt.isP ? C_P : C_N).lerp(C_HOT, h * (pt.isP ? 0.6 : 0.75));
    const im = pt.isP ? instP : instN; im.setMatrixAt(pt.idx, _m4b); im.setColorAt(pt.idx, _cb);
  }
}
{ let ip = 0, iN = 0; bg.forEach(n => { n.parts.forEach(pt => { pt.idx = pt.isP ? ip++ : iN++; }); placeBg(n); }); }

// ---------------- fissione: i nucleoni si dividono in due frammenti (24 e 16) lungo un asse
function prepFission(n, hit, axis) {
  n.hit = hit; n.axis = axis.clone().normalize();
  const order = n.parts.map((pt, k) => [pt.p.dot(n.axis), k]).sort((a, b) => b[0] - a[0]);
  order.forEach(([, k], r) => { n.parts[k].frag = r < 16 ? 1 : 0; });
  n.cent = [0, 1].map(f => { const c = V(0, 0, 0); let cnt = 0; n.parts.forEach(pt => { if (pt.frag === f) { c.add(pt.p); cnt++; } }); return c.multiplyScalar(1 / cnt); });
  n.parts.forEach(pt => { pt.q = pt.p.clone().sub(n.cent[pt.frag]).multiplyScalar(0.92); });
}
// frammenti in linea retta: si allontanano, si fermano e (se fade) dissolvono
function fragments(entry, t, axis, dist = 0.75, dur = 1.6, fade = true, k = 2.2) {
  const o = entry.obj; prepFission(o, t, axis); entry.hit = t;
  o.fragFn = (f, tt) => o.cent[f].clone().addScaledVector(o.axis, (f ? 1 : -1) * dist * easeOut(ramp(tt, t + 0.05, t + dur), k));
  o.fade = fade ? tt => 1 - smooth(ramp(tt, t + dur + 0.4, t + dur + 1.1)) : () => 1;
  o.rest = t + dur;
}
// rimbalzi (dalla puntata 4): il frammento va verso un nucleo vicino, ci passa accanto senza toccarlo e cambia direzione
function bounceFrom(start, dir, nB, obst, reach = 2.3, turn = 0.4) {
  const pts = [start.clone()]; let p = start.clone(), h = dir.clone(); const used = new Set();
  for (let k = 0; k < nB; k++) {
    let best = null, bd = 1e9;
    for (const c of obst) { if (used.has(c)) continue; const d = V(c.x - p.x, c.y - p.y, 0), L = d.length(); if (L > reach || L < 0.3) continue; if (d.normalize().dot(h) < turn) continue; if (L < bd) { bd = L; best = c; } }
    if (!best) break; used.add(best);
    const nrm = V(p.x - best.x, p.y - best.y, 0).normalize(), b = V(best.x, best.y, 0).addScaledVector(nrm, 0.6);
    pts.push(b); h = h.clone().addScaledVector(nrm, -2 * h.dot(nrm)).normalize(); p = b;
  }
  pts.push(p.clone().addScaledVector(h, 0.5));
  let S = pipeCurve(pts).getSpacedPoints(300);
  for (let it = 0; it < 8; it++) {
    S = S.map((q, i) => (i === 0 || i === S.length - 1) ? q : q.clone().add(S[i - 1]).add(S[i + 1]).multiplyScalar(1 / 3));
    for (const q of S) for (const c of obst) { const dx = q.x - c.x, dy = q.y - c.y, L = Math.hypot(dx, dy); if (L < 0.58) { q.x = c.x + dx / Math.max(L, 1e-3) * 0.58; q.y = c.y + dy / Math.max(L, 1e-3) * 0.58; } }
  }
  S.forEach(q => { q.z = 0.1; });
  return new THREE.CatmullRomCurve3(S.filter((_, i) => i % 5 === 0 || i === S.length - 1));
}
// frammenti della catena dell'apertura: partono veloci, rimbalzano fra i nuclei vicini, rallentano e li scaldano; poi dissolvono
function fragmentsBounce(entry, t, axis, dur = 2.4) {
  const o = entry.obj; prepFission(o, t, axis); entry.hit = t;
  const obst = NUCS.filter(n => n !== entry && Math.abs(n.c.x - entry.c.x) < 5 && Math.abs(n.c.y - entry.c.y) < 5).map(n => n.c);
  o.fp = [0, 1].map(f => bounceFrom(entry.c.clone().add(o.cent[f]).setZ(0.1), o.axis.clone().multiplyScalar(f ? 1 : -1), 3, obst, 2.0, 0.2));
  const S = u => easeOut(u, 2.8);
  o.fragFn = (f, tt) => o.fp[f].getPointAt(S(ramp(tt, t + 0.05, t + dur))).sub(entry.c);
  o.fade = () => 1;                       // i frammenti restano dove si fermano (richiesta dell'autore)
  o.rest = t + dur;
  for (let k = 0; k <= 48; k++) {
    const tt = t + 0.05 + dur * k / 48;
    for (const f of [0, 1]) {
      const p = o.fp[f].getPointAt(S(k / 48));
      for (const n of bg) {
        if (Math.abs(n.c.x - p.x) > 1.5 || Math.abs(n.c.y - p.y) > 1.5) continue;
        const h = Math.exp(-(Math.max(0, xy(n.c, p) - 0.55) ** 2) / 0.3) * (1 - 0.4 * k / 48);   // il frammento scalda di più finché è veloce
        if (h > 0.08) (n.heat ||= []).push([tt, h]);
      }
    }
  }
}
// ---------------- neutroni: percorso a tratti [[punto, tempo], ...] e destino
// 'hit' = spacca un nucleo, 'abs' = assorbito da un U-238 (resta attaccato, piccolo lampo), 'exit' = esce
const NEUT = [];
function neutron(keys, end, o = {}) {
  const n = { keys, end, m: mesh(freeGeo, neutM, atomScene), flash: end === 'abs' ? glow(0xbfe4ff, atomScene, 0.8) : null, bounces: [], ...o };
  if (o.trail) n.trailS = Array.from({ length: o.trail }, () => glow(0xbfe4ff, atomScene, 0.42));
  NEUT.push(n); return n;
}
const seg = (a, b, t0, v) => [[a, t0], [b, t0 + a.distanceTo(b) / v]];
function npos(n, t) {
  const K = n.keys; if (t < K[0][1]) return null;
  for (let i = 0; i < K.length - 1; i++) { const [a, ta] = K[i], [b, tb] = K[i + 1]; if (t <= tb) return a.clone().lerp(b, (t - ta) / Math.max(1e-6, tb - ta)); }
  return n.end === 'abs' ? K[K.length - 1][0].clone() : null;
}
const tEnd = n => n.keys[n.keys.length - 1][1];
// ---------------- molecole d'acqua (ossigeno azzurro con due idrogeni): nei rimbalzi c'è un idrogeno esattamente sul punto d'urto
const MOLS = [];
const OH = 0.19, HA = 52 * Math.PI / 180;
function addMol(c, a, extra = {}) { MOLS.push({ c: c.clone(), a, ph: hash(MOLS.length * 1.7) * 6.28, ...extra }); }
const bounceMol = (p, din, dout, hitT) => {
  const nrm = din.clone().sub(dout).normalize(), c = p.clone().addScaledVector(nrm, OH);
  addMol(c.setZ(0.15), Math.atan2(-nrm.y, -nrm.x) + HA, { hitT, nrm, fixed: true });
};
// neutrone che rimbalza sull'acqua: pts = [partenza, punti d'urto..., arrivo]; rallenta di K a ogni urto.
// Si dà il tempo d'arrivo (t1) oppure la velocità iniziale (v0).
function zigNeutron(pts, t0, { t1, v0, K = 0.8, end = 'hit', trail = 0 }) {
  pts = pts.map(p => p.clone().setZ(0.15));
  if (!v0) { let s = 0; for (let i = 0; i < pts.length - 1; i++) s += pts[i].distanceTo(pts[i + 1]) / Math.pow(K, i); v0 = s / (t1 - t0); }
  let t = t0; const keys = [[pts[0], t]];
  for (let i = 0; i < pts.length - 1; i++) { t += pts[i].distanceTo(pts[i + 1]) / (v0 * Math.pow(K, i)); keys.push([pts[i + 1], t]); }
  const n = neutron(keys, end, trail ? { trail } : {});
  n.bounces = pts.slice(1, -1).map((p, i) => { bounceMol(p, dirTo(pts[i], p), dirTo(p, pts[i + 2]), keys[i + 1][1]); return { p, t: keys[i + 1][1], s: glow(0xdff4ff, atomScene, 0.7) }; });
  n.v0 = v0; return n;
}
const absorbed = new Set();
const clearLine = (a, b, skip) => NUCS.every(n => skip.includes(n) || segDist(n.c, a, b) > 0.4);
const freeForMol = p => NUCS.every(n => xy(n.c, p) > 0.8) && MOLS.every(m => xy(m.c, p) > 0.6);
// neutroni "che non portano avanti la catena": assorbiti da un U-238 vicino o fuori dall'inquadratura.
// Con water = true (zona 2, dopo la B6) rimbalzano una volta su una molecola d'acqua prima di arrivare.
function emitOthers(entry, t, k, v, avoid = [], water = false) {
  const tries = Array.from({ length: 14 }, (_, i) => hash(t * 13.1 + i * 3.3 + entry.c.x) * 6.28);
  let done = 0;
  for (const a of tries) {
    if (done >= k) break;
    const dir = V(Math.cos(a), Math.sin(a), 0);
    if (avoid.some(d => d.dot(dir) > 0.7)) continue;
    avoid.push(dir);
    const start = entry.c.clone().addScaledVector(dir, 0.32);
    const tgt = bg.filter(n => !absorbed.has(n) && Math.abs(n.c.x - entry.c.x) < 6).map(n => [xy(n.c, entry.c), n])
      .filter(([d, n]) => d > 1.2 && d < 4.2 && dirTo(entry.c, n.c).dot(dir) > 0.8 && clearLine(entry.c, n.c, [entry, n])).sort((p, q) => p[0] - q[0])[0];
    let end, kind;
    let host = null;
    if (tgt) { const n = tgt[1]; absorbed.add(n); host = n; end = n.c.clone().addScaledVector(dirTo(n.c, start), 0.3); kind = 'abs'; }
    else { end = start.clone().addScaledVector(dir, 16); kind = 'exit'; }
    let mid = null;
    if (water) for (const sd of [1, -1]) {
      const L = Math.min(1.1, start.distanceTo(end) * 0.5), m = start.clone().addScaledVector(dir, L).addScaledVector(V(-dir.y, dir.x, 0), 0.35 * sd);
      if (kind === 'exit') end = m.clone().addScaledVector(dir.clone().applyAxisAngle(Z0, -0.6 * sd), 16);
      if (freeForMol(m)) { mid = m; break; }
      if (kind === 'exit') end = start.clone().addScaledVector(dir, 16);
    }
    const nn = mid ? zigNeutron([start, mid, end], t + 0.05, { v0: v, K: 0.8, end: kind }) : neutron(seg(start.setZ(0.15), end.setZ(0.15), t + 0.05, v), kind);
    if (host) { nn.host = host; nn.m.material = neutM.clone(); }   // il neutrone assorbito diventa parte del nucleo: trema e si scalda con lui
    done++;
  }
}
const Z0 = V(0, 0, 1);
const linkTo = (a, b, t0, t1) => { const d = dirTo(a.c, b.c); return neutron([[a.c.clone().addScaledVector(d, 0.32).setZ(0.15), t0], [b.c.clone().addScaledVector(d, -0.25).setZ(0.15), t1]], 'hit'); };
const FISS = [];
// ---------------- zona 1: reazione a catena dell'apertura (seme fisso). Neutroni veloci, frammenti che rimbalzano e scaldano.
{ const SPN = 6.5, u235Free = n => n.u && n.hit === undefined && !n.key && n.c.x < 12;
  nS0.hit = CHAIN0; const queue = [nS0];
  { const from = V(0.45, -4.4, 0); neutron([[from.clone().setZ(0.15), S0_IN], [S0.clone().addScaledVector(dirTo(from, S0), -0.25).setZ(0.15), CHAIN0]], 'hit'); }
  while (queue.length) {
    queue.sort((a, b) => a.hit - b.hit); const e = queue.shift(), t = e.hit;
    const a = hash(t * 5.3 + e.c.x) * 6.28; fragmentsBounce(e, t, V(Math.cos(a), Math.sin(a), 0)); FISS.push(e);
    const k = hash(t * 2.9) < 0.5 ? 2 : 3, want = FISS.length > 30 ? 0 : Math.min(k, hash(t * 7.7) < 0.8 ? 2 : 1);
    const cands = NUCS.filter(u235Free).map(n => [xy(n.c, e.c), n]).filter(([d, n]) => d > 1.4 && d < 9 && clearLine(e.c, n.c, [e, n])).sort((p, q) => p[0] - q[0]);
    let links = 0; const used = [];
    for (const [, n] of cands) {
      if (links >= want) break;
      const t1 = t + 0.05 + n.c.distanceTo(e.c) / SPN; if (t1 > CHAIN_END) continue;
      n.hit = t1; queue.push(n); linkTo(e, n, t + 0.05, t1); used.push(dirTo(e.c, n.c)); links++;
    }
    emitOthers(e, t, k - links, SPN, used);
  } }
const heated = bg.filter(n => n.heat);
const heatOf = (n, t) => { let h = 0; for (const [tt, v] of n.heat) if (t > tt) h = Math.max(h, v * ramp(t, tt, tt + 0.25)); return h; };
const heatGlows = heated.map(() => glow(0xff8a30, atomScene, 1.0));
// ---------------- zona 2, B4: un neutrone lento arriva dal basso e spacca S; i frammenti schizzano via, i neutroni nati escono velocissimi
neutron([[S_FROM.clone().setZ(0.15), S_IN], [SB4.clone().addScaledVector(dirTo(S_FROM, SB4), -0.25).setZ(0.15), S_HIT]], 'hit');
fragments(nSB4, S_HIT, V(1, -0.3, 0), 7.5, 1.4, true, 2.0); FISS.push(nSB4);
[105, 215, 330].forEach(a => { const d = ang(a), s = SB4.clone().addScaledVector(d, 0.32).setZ(0.15); neutron(seg(s, s.clone().addScaledVector(d, 14), S_HIT + 0.05, FAST1), 'exit', { trail: 12 }); });
// ---------------- zona 2, B5: un neutrone veloce entra dal basso, passa accanto a U1 e U2 ed esce
const n5 = neutron(seg(A5.clone().setZ(0.15), B5.clone().addScaledVector(dirTo(A5, B5), 6).setZ(0.15), N5_0, FAST1), 'exit', { trail: 12 });
// ---------------- zona 2, B6: rimbalzi sugli idrogeni, sempre più lento; poi spacca T (B7)
const n6 = zigNeutron([E6, ...WP, T.clone().addScaledVector(dirTo(WP[WP.length - 1], T), -0.25)], N6_0, { t1: T_HIT, K: 0.74, trail: 12 });
console.log('B6: velocità iniziale', n6.v0.toFixed(2), 'finale', (n6.v0 * Math.pow(0.74, WP.length)).toFixed(2));
// ---------------- zona 2, B7-B9: catena in fila con rimbalzi sull'acqua, poi due rami, poi si spegne
const linkZig = (i, t0, t1) => { const [a, b] = LINKS[i], wp = LINK_WP[i], d = dirTo(wp[wp.length - 1], b);
  return zigNeutron([a.clone().addScaledVector(dirTo(a, wp[0]), 0.32), ...wp, b.clone().addScaledVector(d, -0.25)], t0, { t1, K: 0.8 }); };
nT.forEach((e, i) => {
  const t = TCH_HIT[i]; fragments(e, t, V(1, hash(i + 3) - 0.5, 0)); FISS.push(e);
  const used = [];
  if (i < 5) { linkZig(i, t + 0.1, TCH_HIT[i + 1]); used.push(dirTo(e.c, LINK_WP[i][0])); emitOthers(e, t, 2, 2.6, used, true); }
  else { [5, 6].forEach((li, k) => { linkZig(li, t + 0.1, T7_HIT[k]); used.push(dirTo(e.c, LINK_WP[li][0])); }); emitOthers(e, t, 1, 2.6, used, true); }
});
nT7.forEach((e, i) => { fragments(e, T7_HIT[i], V(1, 0.4 - i * 0.8, 0)); FISS.push(e); emitOthers(e, T7_HIT[i], 3, 2.4, [dirTo(e.c, nT[5].c)], true); });
const fissFlash = FISS.map(e => { const s = glow(0xfff0c0, atomScene, 2.2); s.position.copy(e.c); s.position.z += 0.3; s.userData.e = e; return s; });
console.log('fissioni', FISS.length, 'neutroni', NEUT.length, 'nuclei', NUCS.length, 'nuclei scaldati', heated.length);

// ---------------- le altre molecole d'acqua, sparse negli spazi liberi della zona 2, lontane dai percorsi dei neutroni
{ const paths = NEUT.filter(n => tEnd(n) > MOL_IN && n.keys[0][0].x > 12).flatMap(n => n.keys.slice(1).map((k, i) => [n.keys[i][0], k[0]]));
  seed = 99;
  for (let k = 0; k < 5000; k++) {
    const c = V(lerp(13.5, 25.5, rnd()), lerp(1.0, 29.5, rnd()), 0);
    if (NUCS.some(n => xy(n.c, c) < 0.72)) continue;
    if (MOLS.some(m => xy(m.c, c) < 0.95)) continue;
    if (paths.some(([a, b]) => segDist(c, a, b) < 0.42)) continue;
    c.z = -0.1 + rnd() * 0.3; addMol(c, rnd() * 6.28);
  } }
const molO = new THREE.InstancedMesh(new THREE.SphereGeometry(0.15, 18, 14), std(0x6fa8e0, { roughness: 0.6 }), MOLS.length);
const molH = new THREE.InstancedMesh(new THREE.SphereGeometry(0.085, 14, 10), std(0xc9d6e6, { roughness: 0.6 }), MOLS.length * 2);
atomScene.add(molO, molH);
console.log('molecole', MOLS.length);
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
function placeMols(t, tn) {
  MOLS.forEach((m, i) => {
    const d0 = MOL_IN + (m.c.y - 1) * 0.04, sc = Math.max(0.001, backOut(ramp(t, d0, d0 + 0.45)));
    _p.copy(m.c);
    const jig = m.fixed ? 0.006 : 0.015;
    _p.x += Math.sin(tn * 7 + m.ph) * jig; _p.y += Math.cos(tn * 6 + m.ph * 1.3) * jig;
    if (m.hitT !== undefined) { const k = ramp(t, m.hitT, m.hitT + 0.1) * (1 - ramp(t, m.hitT + 0.1, m.hitT + 0.9)); _p.addScaledVector(m.nrm, 0.13 * k); }
    const a = m.a + (m.fixed ? 0 : Math.sin(tn * 0.8 + m.ph) * 0.25);
    _s.setScalar(sc); _m4.compose(_p, _q.identity(), _s); molO.setMatrixAt(i, _m4);
    [-1, 1].forEach((sd, k) => { const b = a + sd * HA; _m4.compose(V(_p.x + Math.cos(b) * OH * sc, _p.y + Math.sin(b) * OH * sc, _p.z + 0.02), _q, _s); molH.setMatrixAt(2 * i + k, _m4); });
  });
  molO.instanceMatrix.needsUpdate = molH.instanceMatrix.needsUpdate = true;
}
// ============================================================ PRIMO PIANO: mascotte e icone (camera fissa, come nella puntata 4)
const hud = new THREE.Scene();
const hudCam = new THREE.PerspectiveCamera(30, W / H, 0.1, 100); hudCam.position.set(0, 0.2, 11); hudCam.lookAt(0, 0.2, 0); hud.add(hudCam);
hud.add(new THREE.HemisphereLight(0xcfe6ff, 0x4a6a4a, 1.32));
{ const s = new THREE.DirectionalLight(0xfff3de, 2.45); s.position.set(8, 14, 12); hud.add(s);
  const key = new THREE.PointLight(0xffffff, 30); key.position.set(3, 4, 9); hud.add(key);
  const fill = new THREE.PointLight(0x9fc8ff, 30); fill.position.set(-5, -1, 7); hud.add(fill); }
const mascot = new THREE.Group(); hud.add(mascot);
const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x7cc4ff, transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending }));
halo.scale.setScalar(4.4); halo.position.z = -0.8; mascot.add(halo);
const head = new THREE.Group(); mascot.add(head);
const bodyM = new THREE.MeshStandardMaterial({ color: 0x58b0ff, roughness: 0.6, metalness: 0.0, emissive: 0x1c5fb8, emissiveIntensity: 0.35 });
mesh(new THREE.SphereGeometry(1, 64, 48), bodyM, head);
const onSphere = (x, y, r = 1) => Math.sqrt(Math.max(0.01, r * r - x * x - y * y));
const Z = V(0, 0, 1);
const whiteM = new THREE.MeshStandardMaterial({ color: 0xdfe4ee, roughness: 1.0, emissive: 0xffffff, emissiveIntensity: 0.1 });
const darkM = std(0x14203c, { roughness: 0.3 });
const eyes = [-1, 1].map(sd => {
  const g = new THREE.Group(); const x = sd * 0.34, y = 0.2;
  g.position.set(x, y, onSphere(x, y) - 0.05);
  g.quaternion.setFromUnitVectors(Z, V(x * 0.55, y * 0.55, 1).normalize());
  head.add(g);
  const ball = mesh(new THREE.SphereGeometry(0.25, 32, 24), whiteM, g); ball.scale.set(1, 1.18, 0.42);
  const pupil = new THREE.Group(); g.add(pupil);
  const p = mesh(new THREE.SphereGeometry(0.135, 24, 18), darkM, pupil, V(0, 0, 0.075)); p.scale.set(1, 1.1, 0.4);
  mesh(new THREE.SphereGeometry(0.045, 12, 10), basic(0xffffff), pupil, V(0.05, 0.06, 0.125));
  mesh(new THREE.SphereGeometry(0.022, 10, 8), basic(0xffffff), pupil, V(-0.04, -0.05, 0.12));
  return { g, pupil, sd };
});
const brows = [-1, 1].map(sd => { const m = mesh(new THREE.CapsuleGeometry(0.04, 0.22, 6, 12), darkM, head); m.geometry.rotateZ(Math.PI / 2); return { m, sd }; });
const cheekM = new THREE.MeshStandardMaterial({ color: 0xff8fa8, roughness: 0.6, transparent: true, opacity: 0.75 });
[-1, 1].forEach(sd => {
  const x = sd * 0.62, y = -0.12; const c = mesh(new THREE.SphereGeometry(0.13, 20, 14), cheekM, head, V(x, y, onSphere(x, y) - 0.005));
  c.quaternion.setFromUnitVectors(Z, V(x, y, onSphere(x, y)).normalize()); c.scale.set(1, 0.75, 0.12);
});
const MX = 28, MY = 6;
const mouthGeo = new THREE.BufferGeometry();
mouthGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((MX + 1) * (MY + 1) * 3), 3));
{ const idx = []; for (let i = 0; i < MX; i++) for (let j = 0; j < MY; j++) { const a = i * (MY + 1) + j, b = a + MY + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); } mouthGeo.setIndex(idx); }
const mouth = new THREE.Mesh(mouthGeo, basic(0x4a1024, { side: THREE.DoubleSide })); mouth.frustumCulled = false; head.add(mouth);
const tongueGeo = mouthGeo.clone();
const tongue = new THREE.Mesh(tongueGeo, basic(0xff7088, { side: THREE.DoubleSide })); tongue.frustumCulled = false; head.add(tongue);
function setMouth(w, s, o) {
  const cy = -0.36, th = 0.024;
  const P = mouthGeo.attributes.position.array, Tg = tongueGeo.attributes.position.array;
  for (let i = 0; i <= MX; i++) {
    const u = i / MX * 2 - 1, x = u * w, k = 1 - u * u;
    const yb = cy + s * 0.13 * u * u - s * 0.05;
    const yu = yb + (th + o * 0.045) * k, yl = yb - (th + o * 0.36) * Math.pow(k, 0.75);
    for (let j = 0; j <= MY; j++) {
      const y = lerp(yl, yu, j / MY), n = (i * (MY + 1) + j) * 3;
      P[n] = x; P[n + 1] = y; P[n + 2] = onSphere(x, y, 1.012);
      const ty = lerp(yl, lerp(yl, yu, 0.42), j / MY), tx = x * 0.62;
      Tg[n] = tx; Tg[n + 1] = ty; Tg[n + 2] = onSphere(tx, ty, 1.016);
    }
  }
  mouthGeo.attributes.position.needsUpdate = true; tongueGeo.attributes.position.needsUpdate = true;
  tongue.visible = o > 0.3;
}
const hands = [-1, 1].map(() => mesh(new THREE.SphereGeometry(0.2, 24, 18), bodyM, mascot));
// icone (dischi bianchi con bordo blu)
const discM = basic(0xffffff, { transparent: true, opacity: 0.95 });
const ringM = basic(0x2f7df0);
function icon(x, y, r = 0.42) {
  const g = new THREE.Group(); g.position.set(x, y, 0.2); hud.add(g);
  mesh(new THREE.CircleGeometry(r, 64), discM, g, V(0, 0, -0.3)); mesh(new THREE.RingGeometry(r, r + 0.035, 64), ringM, g, V(0, 0, -0.3));
  const c = new THREE.Group(); c.scale.setScalar(r / 0.42); g.add(c); return { g, c, r };
}
const showIcon = (ic, a) => { ic.g.visible = a > 0.001; ic.g.scale.setScalar(Math.max(0.001, a)); };
const COLD = new THREE.Color(0x3f9be8), HOT = new THREE.Color(0xff5a2a);
const edgeM = std(0x2f5fb0, { roughness: 0.5 });
function makeThermo(parent) {
  const g = new THREE.Group(); g.position.x = -0.035; parent.add(g);
  const glass = std(0xf4f7fc, { roughness: 0.3 });
  mesh(new THREE.CapsuleGeometry(0.078, 0.4, 6, 20), edgeM, g, V(0, 0.06, -0.04)); mesh(new THREE.SphereGeometry(0.13, 24, 16), edgeM, g, V(0, -0.22, -0.04));
  mesh(new THREE.CapsuleGeometry(0.055, 0.4, 6, 20), glass, g, V(0, 0.06, 0));
  const liqM = new THREE.MeshStandardMaterial({ color: 0x3f9be8, emissive: 0x3f9be8, emissiveIntensity: 0.45, roughness: 0.4 });
  mesh(new THREE.SphereGeometry(0.1, 24, 16), liqM, g, V(0, -0.22, 0.02));
  const geo = new THREE.CylinderGeometry(0.033, 0.033, 1, 16); geo.translate(0, 0.5, 0);
  const liq = mesh(geo, liqM, g, V(0, -0.2, 0.05));
  const cap = mesh(new THREE.SphereGeometry(0.033, 12, 10), liqM, g, V(0, 0, 0.05));
  for (let i = 0; i < 4; i++) mesh(new THREE.BoxGeometry(i % 2 ? 0.06 : 0.09, 0.016, 0.02), edgeM, g, V(0.15 + (i % 2 ? -0.015 : 0), -0.04 + i * 0.095, 0));
  return { g, set(u) { const h = lerp(0.1, 0.46, u); liq.scale.y = h; cap.position.y = -0.2 + h; liqM.color.copy(COLD).lerp(HOT, u); liqM.emissive.copy(liqM.color); } };
}
// bilancia (equilibrio, B8-B9): giogo che si inclina, piatti che restano orizzontali
function makeBalance(parent) {
  const g = new THREE.Group(); parent.add(g);
  const gold = std(0xffc93a, { roughness: 0.45 });
  mesh(new THREE.CylinderGeometry(0.15, 0.19, 0.05, 32), edgeM, g, V(0, -0.27, 0));
  mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.44, 12), edgeM, g, V(0, -0.04, 0));
  const beam = new THREE.Group(); beam.position.set(0, 0.17, 0); g.add(beam);
  mesh(new THREE.BoxGeometry(0.6, 0.032, 0.04), edgeM, beam);
  mesh(new THREE.SphereGeometry(0.038, 16, 12), gold, g, V(0, 0.17, 0.02));
  const L = 0.17;
  const pans = [-1, 1].map(sd => {
    const p = new THREE.Group(); g.add(p);
    [-1, 1].forEach(k => { const s = mesh(new THREE.CylinderGeometry(0.006, 0.006, Math.hypot(L, 0.09), 6), edgeM, p, V(k * 0.045, -L / 2, 0)); s.rotation.z = k * Math.atan2(0.09, L); });
    mesh(new THREE.CylinderGeometry(0.115, 0.08, 0.035, 32), gold, p, V(0, -L, 0));
    return { p, sd };
  });
  return { g, set(a) { beam.rotation.z = a; pans.forEach(({ p, sd }) => p.position.set(0.28 * sd * Math.cos(a), 0.17 + 0.28 * sd * Math.sin(a), 0)); } };
}
// cronometro (neutroni ritardati, B14)
function makeWatch(parent) {
  const g = new THREE.Group(); parent.add(g);
  mesh(new THREE.CircleGeometry(0.27, 64), basic(0xf4f7fc), g, V(0, -0.03, 0));
  mesh(new THREE.TorusGeometry(0.27, 0.032, 12, 64), edgeM, g, V(0, -0.03, 0));
  mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.07, 16), edgeM, g, V(0, 0.29, 0));
  mesh(new THREE.BoxGeometry(0.11, 0.04, 0.05), edgeM, g, V(0, 0.34, 0));
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, m = mesh(new THREE.BoxGeometry(0.014, i % 3 ? 0.03 : 0.055, 0.01), edgeM, g, V(Math.sin(a) * 0.21, -0.03 + Math.cos(a) * 0.21, 0.01)); m.rotation.z = -a; }
  const hand = new THREE.Group(); hand.position.set(0, -0.03, 0.02); g.add(hand);
  const red = std(0xe8604a, { roughness: 0.5 });
  mesh(new THREE.BoxGeometry(0.02, 0.2, 0.012), red, hand, V(0, 0.09, 0));
  mesh(new THREE.SphereGeometry(0.026, 12, 10), red, g, V(0, -0.03, 0.03));
  return { g, set(u) { hand.rotation.z = -u * Math.PI * 2; } };
}
const icThermo = icon(-1.14, -0.97, 0.31), thermo = makeThermo(icThermo.c);
const icBal = icon(0, 1.55, 0.5), balance = makeBalance(icBal.c);
const PAR = 1 - (11 - 0.2) / (11 + 0.1);
const centerIcons = () => [icThermo, icBal].forEach(ic => ic.c.position.set(-ic.g.position.x * PAR, -(ic.g.position.y - 0.2) * PAR, 0));

const composer = new EffectComposer(renderer); composer.setSize(W, H);
const worldPass = new RenderPass(scene, camera); composer.addPass(worldPass);
{ const p = new RenderPass(hud, hudCam); p.clear = false; p.clearDepth = true; composer.addPass(p); }
composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), 0.45, 0.5, 1.0));
composer.addPass(new OutputPass());
const startOverlay = mesh(new THREE.PlaneGeometry(4, 4), basic(0x2f86e6, { transparent: true, opacity: 0, depthTest: false, depthWrite: false }), hudCam, V(0, 0, -1)); startOverlay.renderOrder = 1000;

// ============================================================ TEMPI (secondi "di scaletta", bozza 2 con le modifiche dell'autore)
// B1 0,2–0,8 · B2 1,3–5,3 · B3 5,8–10,3 · B4 10,8–16,6 · B5 17,1–21,1 · B6 21,6–29,2 · B7 29,7–32,2 · B8 32,7–39,1 · B9 39,6–44,1
// barrette da 44,9: B10 45,9–54,4 · B11 54,9–58,7 · B12 59,2–67,2 · centrale da 68,4: B13 69,6–72,0 · paesaggio fino a 75,0
const SPEECH = [[0.2, 0.8], [1.3, 5.3], [5.8, 10.3], [10.8, 12.1], [12.25, 16.6], [17.1, 21.1], [21.6, 25.6], [25.75, 29.2], [29.7, 32.2],
  [32.7, 34.9], [35.05, 39.1], [39.6, 41.6], [41.75, 44.1], [45.9, 49.6], [49.75, 54.4], [54.9, 56.4], [56.55, 58.7], [59.2, 62.0], [62.15, 67.2],
  [69.6, 72.0]];
const speechEnv = t => { let e = 0; for (const [a, b] of SPEECH) e = Math.max(e, Math.min(ramp(t, a, a + 0.07), 1 - ramp(t, b - 0.09, b))); return e; };
let LIP = null;   // quando arriva la voce: { open, narrow, env } a 30 fps
function lip(tn, t) {
  if (LIP) { const fi = Math.min(LIP.open.length - 1, Math.max(0, Math.round(tn * 30))); return { open: LIP.open[fi], narrow: LIP.narrow[fi], env: LIP.env[fi] }; }
  const env = speechEnv(t), syl = Math.floor(t * 5.5), u = t * 5.5 - syl;
  return { env, open: env * Math.sin(u * Math.PI) ** 0.7 * (0.55 + 0.45 * hash(syl)), narrow: env * (0.25 + 0.6 * hash(syl + 50)) };
}
const END = 75.0;
const BLINKS = []; for (let b = 3.1; b < END - 2; b += 3.3 + hash(b) * 0.8) BLINKS.push(b);
const WARP = [[0, 0], [END, END]];
function unwarp(tn) { for (let i = 0; i < WARP.length - 1; i++) { const [o0, n0] = WARP[i], [o1, n1] = WARP[i + 1]; if (tn <= n1) return o0 + (o1 - o0) * (tn - n0) / (n1 - n0); } return END; }
function fwarp(t) { for (let i = 0; i < WARP.length - 1; i++) { const [o0, n0] = WARP[i], [o1, n1] = WARP[i + 1]; if (t <= o1) return n0 + (n1 - n0) * (t - o0) / (o1 - o0); } return WARP[WARP.length - 1][1]; }
const rt = keys => keys.map(([k, v]) => [fwarp(k), v]);
window.WARP = WARP;

const SWITCH = [[3.35, 'rod', 1, 0.28], [4.75, 'atom', 1, 0.28], [44.9, 'rod', 0.6, 0.25], [68.4, 'world', 0.7, 0.28]];
const worldAt = t => { let w = 'world'; for (const [s, n] of SWITCH) if (t >= s) w = n; return w; };
const fadeAt = t => { let f = 0; for (const [s, , k, d] of SWITCH) f = Math.max(f, k * clamp01(1 - Math.abs(t - s) / d) ** 0.8); return f; };
const logZ = (z0, z1, u) => z0 * Math.pow(z1 / z0, u);
const ein = u => clamp01(u) ** 2, eout = u => 1 - (1 - clamp01(u)) ** 2;
const CAM_WIDE = [-1, 3.8, 11, -1, 3.0, -40], CAM_CORE = [2.95, 2.45, -33.0, 2.95, 2.34, -39.75], CAM_PUSH = [2.95, 2.34, -38.8, 2.95, 2.34, -39.75];
const CAM_W = track(rt([[1.2, CAM_WIDE], [2.75, CAM_CORE], [3.4, CAM_PUSH], [68.4, CAM_PUSH], [69.2, CAM_CORE], [71.0, CAM_WIDE]]));
const DOME = track(rt([[1.0, 1], [2.0, 0.1], [69.8, 0.1], [70.7, 1]]));
const OFF = 63.5;    // dopo la caduta delle barre la centrale è spenta (nocciolo scuro, niente scintille sul cavo)
// barre di controllo: quanto sono dentro (0 = fuori, 1 = tutte dentro)
const INS = track([[0, 0], [48.4, 0], [51.1, 0.38], [55.0, 0.38], [56.0, 0.74], [56.7, 0.74], [57.9, 0.24], [62.0, 0.24]]);
const SCRAM_OFF = 62.2, SCRAM = 62.5, SCRAM_END = 63.9;   // magneti spenti, barre che cadono
const crY = ins => lerp(CR_OUT, CR_IN, ins);
function rodBottom(t) {
  if (t < SCRAM) return crY(INS(t));
  const u = ramp(t, SCRAM, SCRAM_END), f = u < 0.86 ? (u / 0.86) ** 2 * 0.95 : 0.95 + 0.05 * smooth((u - 0.86) / 0.14);
  return lerp(crY(INS(SCRAM)), CR_IN, f);
}
// potenza: segue le barre con un piccolo ritardo; dopo la caduta scende quasi a zero
const power = t => t > SCRAM ? lerp(1 - 0.9 * INS(SCRAM), 0.04, smooth(ramp(t, SCRAM + 0.2, SCRAM_END + 0.8))) : 1 - 0.9 * INS(t - 0.35);
const ROD_IN = track(rt([[3.35, [0, 0.5, 30, 0, 0.3]], [4.75, [0, 0.0, 0.95, 0, 0]]]));
const ROD_MAIN = [0, 5.6, 33, 0, 5.1], ROD_MAG = [0, 18.6, 20, 0, 18.4], ROD_LOW = [0, 3.6, 34, 0, 3.2];
const ROD_HOLD = track(rt([[46.5, ROD_MAIN], [59.2, ROD_MAIN], [60.8, ROD_MAG], [62.6, ROD_MAG], [64.2, ROD_LOW], [67.4, ROD_LOW]]));
function rodCamAt(tn) {
  const R1 = [fwarp(44.9), fwarp(46.5)], R3 = [fwarp(67.4), fwarp(68.4)];
  if (tn < R1[0] - 1) return ROD_IN(tn);
  if (tn < R1[1]) { const u = eout(ramp(tn, R1[0], R1[1])); return [0, lerp(0, ROD_MAIN[1], u), logZ(1.0, ROD_MAIN[2], u), 0, lerp(0, ROD_MAIN[4], u)]; }
  if (tn < R3[0]) return ROD_HOLD(tn);
  const u = ein(ramp(tn, R3[0], R3[1])); return [0, ROD_LOW[1], logZ(ROD_LOW[2], 80, u), 0, ROD_LOW[4]];
}
const view = (x, y, z) => [x, y, z, x, y];
const ATOM_TRACK = track(rt([[4.75, view(0, 1.2, 24)], [5.9, view(0, 1.0, 14)], [7.0, view(0, 1.5, 14)], [9.4, view(0.5, 2.5, 46)], [10.3, view(0.6, 2.5, 48)], [11.6, view(X2 - 0.3, -3.6, 13)],
  [16.6, view(X2 - 0.3, -3.6, 13)], [17.5, view(X2, -1.4, 16)], [21.2, view(X2, -1.4, 16)], [22.6, view(X2, 5.6, 15)], [30.4, view(X2, 6.4, 15)],
  [31.4, view(X2 - 0.4, 8.6, 11)], [32.6, view(X2, 10.0, 16)], [34.9, view(X2, 12.8, 17)], [36.6, view(X2, 15.6, 17)], [38.3, view(X2, 18.4, 17)],
  [40.0, view(X2, 21.3, 18)], [41.7, view(X2 + 0.3, 23.8, 19)], [44.1, view(X2 + 0.3, 24.0, 19)]]));
function atomCamAt(tn) {
  const A1 = [fwarp(44.1), fwarp(44.9)];
  if (tn > A1[0]) { const u = ein(ramp(tn, A1[0], A1[1])); const v = ATOM_TRACK(A1[0]); return [v[0], v[1], logZ(v[2], 44, u), v[3], v[4]]; }
  return ATOM_TRACK(tn);
}
// mascotte
const CORNER = [0.82, -0.99, 0.17];
const R0 = [1.2, -0.3, 0.35], WAVE = [1.32, 0.8, 0.3], POINT = [1.62, 0.32, 0.3];
const T_ = {
  pos: track([[0, [0, 0.2, 0.8]], [0.92, [0, 0.2, 0.8]], [1.45, CORNER]]),
  smile: track([[0, 1], [1.4, 0.95], [5, 0.8], [6.8, 0.8], [7.3, 0.3], [10.3, 0.3], [10.8, 0.8], [62.2, 0.8], [62.5, 0.5], [64.0, 0.5], [64.5, 0.85], [68.4, 0.85], [68.9, 1], [END, 1]]),
  browY: track([[0, 0.1], [1.4, 0.07], [6.8, 0.07], [7.3, 0.14], [10.3, 0.14], [10.8, 0.07], [62.2, 0.07], [62.5, 0.13], [64.0, 0.13], [64.5, 0.07], [68.4, 0.07], [68.9, 0.11], [END, 0.09]]),
  gaze: track([[0, [0, 0]], [1.3, [0, 0]], [1.8, [-0.6, 0.6]], [69.2, [-0.6, 0.6]], [69.6, [0, 0]], [70.4, [0, 0]], [70.7, [0.85, 0.25]], [71.9, [0.85, 0.25]], [72.2, [0, 0]], [END, [0, 0]]]),
  handR: track([[0, R0], [0.12, WAVE], [0.9, WAVE], [1.35, R0], [70.3, R0], [70.7, POINT], [71.8, POINT], [72.1, R0], [72.4, WAVE], [END, WAVE]]),
};
const EXIT = 73.3;
window.renderFrame = function (tn) {
  const t = unwarp(tn);
  const where = worldAt(t);
  fadeMat.opacity = fadeAt(t);
  // ---------------- MONDO 1: centrale
  if (where === 'world') {
    worldPass.scene = scene; worldPass.camera = camera;
    const c = CAM_W(tn);
    camera.position.set(c[0] + Math.sin(tn * 0.21) * 0.1, c[1] + Math.sin(tn * 0.17) * 0.05, c[2]); camera.lookAt(c[3], c[4], c[5]);
    clouds.forEach((cl, i) => { cl.position.x = cl.userData.x + Math.sin(tn * 0.05 + i) * 0.8 + tn * 0.02; });
    for (const m of puffs) {
      const d = m.userData, ph = (tn * 0.085 + d.ph) % 1;
      m.position.set(d.x + Math.cos(d.a) * d.r * (1 + ph) + ph * ph * 2.2, d.base + ph * 6.5, d.z + Math.sin(d.a) * d.r);
      m.scale.setScalar(d.s * (0.95 + ph * 1.9)); m.material.opacity = 0.55 * Math.min(1, ph * 6) * (1 - ph) * (t < OFF ? 1 : 0.35);
    }
    waveFlag(tn);
    const dOp = DOME(tn); domeFront.opacity = bandFront.opacity = dOp; domeFront.depthWrite = bandFront.depthWrite = dOp > 0.99;
    const on = t < OFF, tf = on ? tn : fwarp(OFF);   // centrale spenta: nocciolo scuro, acqua del primario ferma, niente scintille sul cavo
    coreM.emissiveIntensity = on ? 2.3 * (1 + 0.08 * Math.sin(tn * 7)) : 0.12; coreGlow.material.opacity = on ? 0.38 * (1 - dOp) : 0;
    dropM.emissiveIntensity = on ? 1.6 : 0.25;
    primDrops.forEach((m, i) => { primLoop.getPointAt((i / primDrops.length + tf * 0.19) % 1, m.position); m.position.z += 0.02; });
    cableDots.forEach((d, i) => { d.visible = on; cableCurve.getPointAt((tn * 0.42 + i / cableDots.length) % 1, d.position); });
  }
  // ---------------- MONDO 2: barrette e barre di controllo
  if (where === 'rod') {
    worldPass.scene = rodScene; worldPass.camera = rodCam;
    const c = rodCamAt(tn); rodCam.position.set(c[0] + Math.sin(tn * 0.3) * 0.03, c[1], c[2]); rodCam.lookAt(c[3], c[4], 0);
    const near = clamp01((4 - rodCam.position.z) / 2.6); cladMid.opacity = 0.3 * (1 - near); cladMid.visible = near < 0.99;
    const P = power(t), warm = P;
    waterBg.uniforms.top.value.copy(WATER_C[0]).lerp(WARM_C[0], 0.75 * warm); waterBg.uniforms.bottom.value.copy(WATER_C[1]).lerp(WARM_C[1], 0.75 * warm);
    pelM.emissiveIntensity = 0.05 + 0.24 * warm + 0.04 * warm * Math.sin(tn * 7);
    rodGlows.forEach((g, i) => { g.material.opacity = (i < 5 ? 0.17 : 0.09) * warm; });
    rodBubbles.forEach(m => { const d = m.userData, u = (tn * 0.3 + d.ph) % 1; m.position.set(d.x + Math.sin(u * 12 + d.ph * 9) * 0.05, -5 + u * 10, d.z); });
    flowLines.forEach(m => { const d = m.userData, u = (tn * d.v + d.ph) % 1; m.position.set(d.x, -6 + u * 12, d.z); m.material.opacity = 0.28 * Math.sin(u * Math.PI); });
    heatPuffs.forEach(s => { const d = s.userData, u = (tn * 0.45 + d.ph) % 1; s.position.set(d.r + (d.ph > 0.5 ? 1 : -1) * (0.35 + u * 0.3), d.y + u * 2.2, 0.5); s.material.opacity = 0.85 * warm * Math.sin(u * Math.PI); s.scale.setScalar(0.7 + 0.6 * u); });
    const yb = rodBottom(t); ctrlRods.forEach(g => { g.position.y = yb; });
    const mag = t < SCRAM_OFF ? 1 : 0;
    coilM.emissiveIntensity = 0.9 * mag; magGlows.forEach(g => { g.material.opacity = 0.75 * mag * (1 + 0.08 * Math.sin(tn * 9)); });
  }
  // ---------------- MONDO 3: atomi
  if (where === 'atom') {
    worldPass.scene = atomScene; worldPass.camera = atomCam;
    const c = atomCamAt(tn); atomCam.position.set(c[0] + Math.sin(tn * 0.3) * 0.04, c[1] + Math.sin(tn * 0.23) * 0.03, c[2]); atomCam.lookAt(c[3], c[4], 0); atomCam.updateMatrixWorld();
    const zoomK = 1 + Math.max(0, atomCam.position.z - 12) / 12;
    placeMols(t, tn);
    // U-238 scaldati dai frammenti della catena dell'apertura: tremano, diventano arancioni e brillano
    if (t < 12) heated.forEach((n, k) => { const h = heatOf(n, t), vib = 0.06 * h; n.vx = Math.sin(tn * 23 + n.ph) * vib; n.vy = Math.cos(tn * 19 + n.ph * 1.3) * vib; n.hh = h; placeBg(n, n.vx, n.vy, h); heatGlows[k].position.set(n.c.x, n.c.y, n.c.z + 0.2); heatGlows[k].material.opacity = 0.5 * h; heatGlows[k].scale.setScalar((0.9 + 0.3 * h) * Math.min(zoomK, 2)); });
    instP.instanceMatrix.needsUpdate = instN.instanceMatrix.needsUpdate = true; instP.instanceColor.needsUpdate = instN.instanceColor.needsUpdate = true;
    // nuclei speciali (U-235): alone giallo finché non si spaccano
    NUCS.forEach((sn, si) => {
      const n = sn.obj; if (!n) return;
      let hal = 1; if (n.hit) hal = 1 - ramp(t, n.hit, n.hit + 0.15);
      // B5: quando il neutrone veloce passa vicino, l'alone sobbalza (ma il nucleo non si spacca)
      let near = 0; if (sn === nU1 || sn === nU2) { const pn = npos(n5, t); if (pn) near = Math.exp(-(xy(pn, sn.c) ** 2) / 0.5); }
      n.halo.material.opacity = 0.6 * hal * (1 + 0.15 * Math.sin(tn * 5 + si) + 0.8 * near); n.halo.scale.setScalar(1.25 * Math.min(zoomK, 2.2) * (1 + 0.25 * near));
      const hit = n.hit, e = hit ? smooth(ramp(t, hit, hit + 0.45)) : 0, wob = hit ? ramp(t, hit - 0.2, hit) * (1 - ramp(t, hit, hit + 0.12)) : 0;
      const fade = hit && t >= hit ? n.fade(t) : 1;
      n.g.visible = fade > 0.001; if (!n.g.visible) return;
      const jig = 0.008;
      n.parts.forEach((pt, k) => {
        let p;
        if (!hit || t < hit) p = pt.p.clone().multiplyScalar(1 + 0.16 * wob * Math.sin(t * 45 + k));
        else { const fp = n.fragFn(pt.frag, t).add(pt.q); p = pt.p.clone().lerp(fp, e); }
        p.x += Math.sin(tn * 31 + k * 1.7) * jig; p.y += Math.cos(tn * 27 + k * 2.3) * jig;
        pt.m.position.copy(p); pt.m.scale.setScalar(Math.max(0.001, fade));
      });
      n.hot.forEach((s, f) => {
        s.visible = !!hit && t > hit; if (!s.visible) return;
        s.position.copy(n.fragFn(f, t)); s.position.z += 0.15;
        s.material.opacity = fade * lerp(0.75, 0.22, smooth(ramp(t, n.rest - 0.6, n.rest + 0.4))); s.scale.setScalar(0.9 * Math.min(zoomK, 2));
      });
    });
    // neutroni
    NEUT.forEach(n => {
      const p = npos(n, t), t1 = tEnd(n);
      n.m.visible = !!p; if (p) { n.m.position.copy(p); n.m.scale.setScalar(t < t1 ? Math.min(zoomK, 2.2) : 1); }
      if (p && n.host && t >= t1 && n.host.heat && t < 12) { n.m.position.x += n.host.vx || 0; n.m.position.y += n.host.vy || 0; n.m.material.color.copy(C_N).lerp(C_HOT, 0.75 * (n.host.hh || 0)); n.m.material.emissiveIntensity = 0.35 * (1 - (n.host.hh || 0)); }
      if (n.flash) { n.flash.position.copy(n.keys[n.keys.length - 1][0]); n.flash.material.opacity = t > t1 ? 0.8 * Math.max(0, 1 - (t - t1) / 0.45) : 0; }
      if (n.trailS) n.trailS.forEach((s, k) => {
        const tt = t - (k + 1) * 0.028, q = npos(n, tt), q2 = npos(n, tt - 0.02);
        s.visible = !!(p && q && q2); if (!s.visible) return;
        const sp = q.distanceTo(q2) / 0.02;                      // velocità in quel punto: la scia si accorcia quando il neutrone rallenta
        s.position.copy(q); s.material.opacity = clamp01((sp - 0.8) / 4) * 0.6 * (1 - k / n.trailS.length); s.scale.setScalar(0.42 * (1 - k / n.trailS.length * 0.5) * Math.min(zoomK, 2));
      });
      n.bounces.forEach(b => { b.s.position.copy(b.p); b.s.material.opacity = t > b.t ? 0.9 * Math.max(0, 1 - (t - b.t) / 0.35) : 0; });
    });
    fissFlash.forEach(s => { const h = s.userData.e.hit; s.material.opacity = t > h ? 0.95 * Math.max(0, 1 - (t - h) / 0.5) : 0; s.scale.setScalar((2.2 + 2 * ramp(t, h, h + 0.5)) * Math.min(zoomK, 2.5)); });
  }

  // ---------------- PRIMO PIANO: icone
  // bilancia in equilibrio (B8), poi pende da una parte (di più) e dall'altra (di meno); il termometro sale e scende (B9)
  showIcon(icBal, pop(t, 33.2, 44.6)); balance.set(0.34 * smooth(ramp(t, 39.8, 40.4)) - 0.68 * smooth(ramp(t, 41.9, 42.5)) + 0.03 * Math.sin(tn * 2.2) * (1 - ramp(t, 39.6, 39.8)));
  showIcon(icThermo, pop(t, 39.7, 44.6)); thermo.set(0.45 + 0.45 * smooth(ramp(t, 39.9, 41.0)) - 0.75 * smooth(ramp(t, 42.0, 43.2)));
  // ---------------- mascotte: grande al centro per il saluto, poi piccola in basso a destra
  let [mx, my, ms] = T_.pos(t);
  ms *= backOut(ramp(t, 0.0, 0.35)) * (1 - smooth(ramp(t, EXIT - 0.25, EXIT)));
  const bob = Math.sin(tn * 1.9) * 0.07 * ms;
  mascot.position.set(mx, my + bob + smooth(ramp(t, EXIT - 0.4, EXIT)) * 0.08, 0); mascot.scale.setScalar(Math.max(0.001, ms)); mascot.visible = ms > 0.001 && t < EXIT;
  const L = lip(tn, t), env = L.env;
  const [gx, gy] = T_.gaze(t);
  head.rotation.set(-gy * 0.3 + env * Math.sin(tn * 5.2) * 0.035, gx * 0.36, Math.sin(tn * 1.1) * 0.05 + env * Math.sin(tn * 2.6) * 0.04 - gx * 0.06);
  let blink = 0; for (const b of BLINKS) blink = Math.max(blink, 1 - Math.abs(t - b) / 0.085);
  blink = clamp01(blink);
  const smile = T_.smile(t), squint = 0.1 * Math.max(0, smile - 0.6) / 0.4;
  for (const e of eyes) { e.g.scale.set(1.05, 1.05 * Math.max(0.07, (1 - blink) * (1 - squint)), 1); e.pupil.position.set(gx * 0.075 - e.sd * 0.018, gy * 0.085, 0); }
  const by = T_.browY(t);
  for (const b of brows) { const x = b.sd * 0.35, y = 0.535 + by + blink * -0.015; b.m.position.set(x, y, onSphere(x, y, 1.03)); b.m.rotation.set(-0.45, b.sd * 0.3, b.sd * 0.03 + b.sd * -0.06 + (by > 0.12 ? b.sd * 0.18 : 0)); }
  const open = L.open * 0.78, narrow = L.narrow * 0.32;
  setMouth((0.29 + 0.06 * Math.max(0, smile)) * (1 - narrow), smile * (1 - 0.35 * open), open);
  const hr = T_.handR(t), wave = win(t, 0.15, 1.0, 0.2) + win(t, 72.4, 73.2, 0.2), point = win(t, 70.7, 71.8, 0.25), talk = env * 0.04;
  hands[1].position.set(hr[0] + wave * Math.sin(t * 13) * 0.2 + point * Math.abs(Math.sin(t * 6.5)) * 0.1, hr[1] + Math.sin(tn * 2.3) * 0.03 + talk * Math.sin(tn * 6.1) + bob * 0.3, hr[2]);
  hands[0].position.set(-R0[0], R0[1] + Math.sin(tn * 2.3 + 1.7) * 0.03 + talk * Math.sin(tn * 5.3 + 2) + bob * 0.3, R0[2]);
  centerIcons();
  startOverlay.material.opacity = 1 - ramp(t, 0, 0.3);
  composer.render();
};
window.DURATION = WARP[WARP.length - 1][1];
window.renderFrame(0);
window.ready = true;
