// Puntata 6 — "Una centrale può esplodere come una bomba?" (animazione di prova sui tempi della scaletta, bozza 1)
// Parte da ep5.js: stessa mascotte, stessa centrale, stessi nuclei e molecole d'acqua. Due mondi, con un breve lampo chiaro a ogni passaggio:
//  - CENTRALE (apertura e chiusura);
//  - ATOMI, in due zone lontane: zona B ("bomba", nuclei fitti quasi tutti U-235, catena velocissima che finisce in un lampo bianco)
//    e zona R ("centrale", nuclei radi quasi tutti U-238, acqua che rallenta i neutroni e che, scaldandosi, si dilata e frena meno).
// Si passa dalla zona B alla zona R sotto il lampo bianco della bomba.
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


// ============================================================ MONDO 3: ATOMI
const atomScene = new THREE.Scene();
const atomCam = new THREE.PerspectiveCamera(30, W / H, 0.05, 300); atomScene.add(atomCam); addFade(atomCam);
const atomBg = gradientBg(atomScene, 0x24305e, 0x120f2a);
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

// ---------------- MONDO DEGLI ATOMI della puntata 6: due zone lontane (si passa dall'una all'altra sotto il lampo bianco)
// Zona B ("bomba", intorno a x = 0): nuclei fitti, 9 su 10 sono U-235. Catena velocissima che finisce nel lampo bianco.
// Zona R ("centrale", intorno a x = XR): nuclei radi, quasi tutti U-238; dalla B8 le molecole d'acqua.
const XR = 30, YR = 1, PR = (dx, dy) => V(XR + dx, YR + dy, 0);
const segAt = (a, b, u) => a.clone().lerp(b, u);

// ---------------- tempi (secondi di scaletta)
const B_IN = 14.6, B_HIT = 15.5, B_LAST = 18.75;                 // B5: il neutrone entra e spacca il primo nucleo; nessuna fissione dopo B_LAST
const FLASH_UP = 18.7, FLASH_FULL = 19.45, CUT = 20.25, FLASH_DOWN = 21.3;   // lampo bianco della bomba; sotto il bianco si passa alla zona R
const A_IN = 24.0, A_HIT = 26.6;                                  // B7: un neutrone lento spacca A; due neutroni finiscono negli U-238
const MOL_IN = 30.2, W_IN = 30.8, B8_HIT = 33.6;                  // B8: le molecole d'acqua; il neutrone rimbalza e spacca BB
const TH_UP = [35.2, 36.6], EXP = [36.0, 37.2], N9 = [36.9, 38.7], TH_DOWN = [38.8, 39.9];   // B9

// ---------------- posizioni scritte a mano (zona R)
const A = PR(-0.9, 1.7), A_FROM = PR(-0.55, -6.6);
const BB = PR(0.45, -0.35);
const W_FROM = PR(-3.6, 3.0);
const W_PTS = (() => { const d = dirTo(W_FROM, BB), pr = V(-d.y, d.x, 0), L = W_FROM.distanceTo(BB);
  return Array.from({ length: 5 }, (_, i) => W_FROM.clone().addScaledVector(d, L * (i + 1) / 6.2).addScaledVector(pr, 0.5 * (i % 2 ? -1 : 1))); })();
const N9_A = PR(-2.0, -5.6), N9_B = PR(2.3, 6.4);
const C9 = segAt(N9_A, N9_B, 0.72).addScaledVector(V(-(N9_B.y - N9_A.y), N9_B.x - N9_A.x, 0).normalize(), -0.75);   // U-235 vicino al percorso: il neutrone veloce non lo spacca

// ---------------- nuclei
const NUCS = [];
const special = (c, u, zone) => { const n = { c: c.clone(), u, zone }; NUCS.push(n); return n; };
const nB0 = special(V(0, 0.3, 0), true, 'B');
const nA = special(A, true, 'R'), nBB = special(BB, true, 'R'), nC9 = special(C9, true, 'R');
const polySegs = pts => pts.slice(1).map((p, i) => [pts[i], p]);
const CAPS_B = [[V(-9, 0.8, 0), nB0.c]];
const CAPS_R = [[A_FROM, A], ...polySegs([W_FROM, ...W_PTS, BB]), [N9_A, N9_B]];
const MASCOT_R = PR(1.3, -2.6), behindMascot = p => xy(p, MASCOT_R) < 1.15;   // nella zona R niente dietro la mascotte in angolo
seed = 6060;
// [zona, x0, x1, y0, y1, tentativi, distanza minima, corridoi, quota di U-235]
[['B', -8, 8, -12, 12, 30000, 1.3, CAPS_B, 0.9], ['R', XR - 7, XR + 7, YR - 9, YR + 10, 20000, 1.45, CAPS_R, 0]].forEach(([zone, x0, x1, y0, y1, tries, md, caps, fu]) => {
  for (let k = 0; k < tries; k++) {
    const p = V(lerp(x0, x1, rnd()), lerp(y0, y1, rnd()), 0);
    if (NUCS.some(n => xy(n.c, p) < md)) continue;
    if (caps.some(([a, b]) => segDist(p, a, b) < (zone === 'R' ? 0.58 : 0.7))) continue;
    if (zone === 'R' && behindMascot(p)) continue;
    p.z = (rnd() - 0.5) * 0.4; NUCS.push({ c: p, u: rnd() < fu, zone });
  }
});
// zona R: qualche altro U-235 fermo (circa 1 su 12), lontano dai percorsi, perché si veda che sono pochi
{ const free = NUCS.filter(n => n.zone === 'R' && !n.u), U = NUCS.filter(n => n.zone === 'R' && n.u).map(n => n.c);
  seed = 77;
  for (const n of free) if (false && U.every(c => xy(c, n.c) > 3.2) && CAPS_R.every(([a, b]) => segDist(n.c, a, b) > 1.1)) { n.u = true; U.push(n.c); } }
// tutti i nucleoni in due InstancedMesh (protoni, neutroni); gli U-235 hanno anche l'alone giallo
let NP = 0, NN = 0;
NUCS.forEach((n, k) => {
  n.parts = rotated(k * 13 + 7).map(pt => ({ ...pt, idx: pt.isP ? NP++ : NN++ }));
  n.ph = hash(k) * 6.28;
  if (n.u) n.halo = glow(0xffd23a, atomScene, 1.25);
});
const instP = new THREE.InstancedMesh(instGeo, std(0xffffff, { roughness: 0.55 }), NP), instN = new THREE.InstancedMesh(instGeo, std(0xffffff, { roughness: 0.55 }), NN);
instP.frustumCulled = instN.frustumCulled = false;
atomScene.add(instP, instN);
const C_P = new THREE.Color(0xf06a52), C_N = new THREE.Color(0x5aa8f0), C_HOT = new THREE.Color(0xffa040);
NUCS.forEach(n => n.parts.forEach(pt => (pt.isP ? instP : instN).setColorAt(pt.idx, pt.isP ? C_P : C_N)));
console.log('nuclei zona B', NUCS.filter(n => n.zone === 'B').length, 'di cui U-235', NUCS.filter(n => n.zone === 'B' && n.u).length,
  '· zona R', NUCS.filter(n => n.zone === 'R').length, 'di cui U-235', NUCS.filter(n => n.zone === 'R' && n.u).length);

// ---------------- fissione: i nucleoni si dividono in due frammenti (24 e 16) lungo un asse; i frammenti si fermano e dissolvono
function fission(n, t, axis, dist = 0.7, dur = 1.4, fadeAfter = 0.5) {
  n.hit = t; n.axis = axis.clone().normalize();
  const order = n.parts.map((pt, k) => [pt.p.dot(n.axis), k]).sort((a, b) => b[0] - a[0]);
  order.forEach(([, k], r) => { n.parts[k].frag = r < 16 ? 1 : 0; });
  n.cent = [0, 1].map(f => { const c = V(0, 0, 0); let cnt = 0; n.parts.forEach(pt => { if (pt.frag === f) { c.add(pt.p); cnt++; } }); return c.multiplyScalar(1 / cnt); });
  n.parts.forEach(pt => { pt.q = pt.p.clone().sub(n.cent[pt.frag]).multiplyScalar(0.92); });
  n.fragFn = (f, tt) => n.cent[f].clone().addScaledVector(n.axis, (f ? 1 : -1) * dist * easeOut(ramp(tt, t + 0.05, t + dur), 2.2));
  n.fade = tt => 1 - smooth(ramp(tt, t + dur + fadeAfter, t + dur + fadeAfter + 0.7));
  n.hot = [0, 1].map(() => glow(0xffb060, atomScene, 0.9));
  n.flash = glow(0xfff0c0, atomScene, 2.2); n.flash.position.copy(n.c); n.flash.position.z += 0.3;
  FISS.push(n);
}
const FISS = [];
// ---------------- neutroni: percorso a tratti [[punto, tempo], ...]; 'hit' spacca, 'abs' assorbito (resta attaccato), 'exit' esce
const NEUT = [];
function neutron(keys, end, o = {}) {
  const n = { keys, end, m: mesh(freeGeo, neutM, atomScene), flash: end === 'abs' ? glow(0xbfe4ff, atomScene, 0.8) : null, bounces: [], ...o };
  n.m.visible = false;
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
const clearLine = (a, b, skip) => NUCS.every(n => skip.includes(n) || segDist(n.c, a, b) > 0.42);
const absorbed = new Set();

// ---------------- molecole d'acqua (solo zona R): nei rimbalzi c'è un idrogeno esattamente sul punto d'urto
const MOLS = [];
const OH = 0.19, HA = 52 * Math.PI / 180;
function addMol(c, a, extra = {}) { MOLS.push({ c: c.clone(), a, ph: hash(MOLS.length * 1.7) * 6.28, ...extra }); }
const bounceMol = (p, din, dout, hitT) => { const nrm = din.clone().sub(dout).normalize(), c = p.clone().addScaledVector(nrm, OH); addMol(c.setZ(0.15), Math.atan2(-nrm.y, -nrm.x) + HA, { hitT, nrm, fixed: true }); };
function zigNeutron(pts, t0, { t1, v0, K = 0.8, end = 'hit', trail = 0 }) {
  pts = pts.map(p => p.clone().setZ(0.15));
  if (!v0) { let s = 0; for (let i = 0; i < pts.length - 1; i++) s += pts[i].distanceTo(pts[i + 1]) / Math.pow(K, i); v0 = s / (t1 - t0); }
  let t = t0; const keys = [[pts[0], t]];
  for (let i = 0; i < pts.length - 1; i++) { t += pts[i].distanceTo(pts[i + 1]) / (v0 * Math.pow(K, i)); keys.push([pts[i + 1], t]); }
  const n = neutron(keys, end, trail ? { trail } : {});
  n.bounces = pts.slice(1, -1).map((p, i) => { bounceMol(p, dirTo(pts[i], p), dirTo(p, pts[i + 2]), keys[i + 1][1]); return { p, t: keys[i + 1][1], s: glow(0xdff4ff, atomScene, 0.7) }; });
  n.v0 = v0; return n;
}
const freeForMol = p => NUCS.every(n => xy(n.c, p) > 0.8) && MOLS.every(m => xy(m.c, p) > 0.6) && segDist(p, N9_A, N9_B) > 0.6;
// neutroni che non portano avanti la catena: assorbiti da un U-238 vicino o fuori dall'inquadratura
function emitOthers(e, t, k, v, avoid = [], water = false, trail = 0) {
  const tries = Array.from({ length: 16 }, (_, i) => hash(t * 13.1 + i * 3.3 + e.c.x) * 6.28);
  let done = 0;
  for (const a of tries) {
    if (done >= k) break;
    const dir = V(Math.cos(a), Math.sin(a), 0);
    if (avoid.some(d => d.dot(dir) > 0.7)) continue;
    avoid.push(dir);
    const start = e.c.clone().addScaledVector(dir, 0.32);
    const tgt = NUCS.filter(n => n.zone === e.zone && !n.u && !absorbed.has(n)).map(n => [xy(n.c, e.c), n])
      .filter(([d, n]) => d > 1.2 && d < 4.0 && dirTo(e.c, n.c).dot(dir) > 0.8 && clearLine(e.c, n.c, [e, n])).sort((p, q) => p[0] - q[0])[0];
    let end, kind;
    if (tgt) { absorbed.add(tgt[1]); end = tgt[1].c.clone().addScaledVector(dirTo(tgt[1].c, start), 0.3); kind = 'abs'; }
    else { end = start.clone().addScaledVector(dir, 16); kind = 'exit'; }
    let mid = null;
    if (water) for (const sd of [1, -1]) {
      const L = Math.min(1.1, start.distanceTo(end) * 0.5), m = start.clone().addScaledVector(dir, L).addScaledVector(V(-dir.y, dir.x, 0), 0.35 * sd);
      if (freeForMol(m)) { mid = m; if (kind === 'exit') end = m.clone().addScaledVector(dir.clone().applyAxisAngle(Z0, -0.6 * sd), 16); break; }
    }
    const nn = mid ? zigNeutron([start, mid, end], t + 0.05, { v0: v, K: 0.8, end: kind }) : neutron(seg(start.setZ(0.15), end.setZ(0.15), t + 0.05, v), kind, trail ? { trail } : {});
    if (tgt) nn.host = tgt[1];
    done++;
  }
}
const Z0 = V(0, 0, 1);

// ---------------- zona B: reazione a catena della bomba. Ogni fissione manda i neutroni ai nuclei vicini, quasi tutti U-235.
{ const VB = 4.2;
  neutron([[V(-9, 0.8, 0.15), B_IN], [nB0.c.clone().addScaledVector(dirTo(V(-9, 0.8, 0), nB0.c), -0.25).setZ(0.15), B_HIT]], 'hit', { trail: 6 });
  nB0.hitAt = B_HIT; const queue = [nB0];
  while (queue.length) {
    queue.sort((a, b) => a.hitAt - b.hitAt); const e = queue.shift(), t = e.hitAt;
    const a = hash(t * 5.3 + e.c.x) * 6.28; fission(e, t, V(Math.cos(a), Math.sin(a), 0), 0.38, 0.9, 0.2);
    const k = hash(t * 2.9 + e.c.y) < 0.5 ? 2 : 3;
    const cands = NUCS.filter(n => n.zone === 'B' && n.u && n.hitAt === undefined).map(n => [xy(n.c, e.c), n])
      .filter(([d, n]) => d > 1.0 && d < 2.9 && clearLine(e.c, n.c, [e, n])).sort((p, q) => p[0] - q[0]);
    let links = 0; const used = [];
    for (const [d, n] of cands) {
      if (links >= k) break;
      const dir = dirTo(e.c, n.c); if (used.some(u => u.dot(dir) > 0.6)) continue;
      const t1 = t + 0.05 + d / VB; if (t1 > B_LAST) continue;
      n.hitAt = t1; queue.push(n); used.push(dir); links++;
      neutron([[e.c.clone().addScaledVector(dir, 0.32).setZ(0.15), t + 0.05], [n.c.clone().addScaledVector(dir, -0.25).setZ(0.15), t1]], 'hit', { trail: 4 });
    }
    if (links < k) emitOthers(e, t, k - links, VB, used, false, 4);
  } }
console.log('fissioni nella zona B', FISS.length);

// ---------------- zona R, B7: un neutrone lento spacca A; due neutroni finiscono assorbiti da U-238, uno esce
neutron([[A_FROM.clone().setZ(0.15), A_IN], [A.clone().addScaledVector(dirTo(A_FROM, A), -0.25).setZ(0.15), A_HIT]], 'hit');
nA.hitAt = A_HIT; fission(nA, A_HIT, V(1, 0.35, 0), 0.8, 1.6, 0.8);
{ // i due U-238 più vicini, in direzioni diverse, ben dentro l'inquadratura
  const vis = n => Math.abs(n.c.x - XR) < 2.2 && n.c.y > YR - 2.6 && n.c.y < YR + 3.4 && !(n.c.x > XR + 0.6 && n.c.y < YR - 1.6);   // lontano dalla mascotte
  const cands = NUCS.filter(n => n.zone === 'R' && !n.u && vis(n)).map(n => [xy(n.c, A), n]).filter(([d, n]) => d > 1.3 && d < 4.2 && clearLine(A, n.c, [nA, n])).sort((p, q) => p[0] - q[0]);
  const used = [];
  for (const [d, n] of cands) {
    if (used.length >= 2) break;
    const dir = dirTo(A, n.c); if (used.some(u => u.dot(dir) > 0.5)) continue;
    used.push(dir); absorbed.add(n);
    const nn = neutron(seg(A.clone().addScaledVector(dir, 0.32).setZ(0.15), n.c.clone().addScaledVector(dir, -0.3).setZ(0.15), A_HIT + 0.05 + used.length * 0.12, 2.4), 'abs', { trail: 8 }); nn.host = n;
  }
  console.log('B7: neutroni assorbiti', used.length);
  emitOthers(nA, A_HIT, 1, 3.2, used, false, 8);
}
// ---------------- zona R, B8: il neutrone entra da sinistra, rimbalza sull'acqua, rallenta e spacca BB
const n8 = zigNeutron([W_FROM, ...W_PTS, BB.clone().addScaledVector(dirTo(W_PTS[W_PTS.length - 1], BB), -0.25)], W_IN, { t1: B8_HIT, K: 0.74, trail: 10 });
nBB.hitAt = B8_HIT; fission(nBB, B8_HIT, V(1, -0.6, 0), 0.75, 1.5, 0.6);
emitOthers(nBB, B8_HIT, 2, 2.4, [dirTo(BB, W_PTS[W_PTS.length - 1])], true);
// ---------------- zona R, B9: acqua calda e dilatata; un neutrone veloce attraversa tutto senza rimbalzare ed esce
const n9 = neutron(seg(N9_A.clone().setZ(0.15), N9_B.clone().setZ(0.15), N9[0], N9_A.distanceTo(N9_B) / (N9[1] - N9[0])), 'exit', { trail: 12 });
console.log('neutroni', NEUT.length);

// ---------------- le altre molecole d'acqua, sparse negli spazi liberi della zona R, lontane dai percorsi dei neutroni
{ const paths = NEUT.filter(n => tEnd(n) > MOL_IN && n.keys[0][0].x > 15).flatMap(n => n.keys.slice(1).map((k, i) => [n.keys[i][0], k[0]]));
  seed = 99;
  for (let k = 0; k < 6000; k++) {
    const c = V(lerp(XR - 4, XR + 4, rnd()), lerp(YR - 6, YR + 7, rnd()), 0);
    if (NUCS.some(n => xy(n.c, c) < 0.72)) continue;
    if (MOLS.some(m => xy(m.c, c) < 0.95)) continue;
    if (behindMascot(c)) continue;
    if (paths.some(([a, b]) => segDist(c, a, b) < 0.42)) continue;
    c.z = -0.1 + rnd() * 0.3; addMol(c, rnd() * 6.28);
  } }
// dilatazione (B9): ogni molecola si allontana dal percorso del neutrone della B9 e un po' dal centro, e trema di più
{ const d = dirTo(N9_A, N9_B), pr = V(-d.y, d.x, 0);
  MOLS.forEach(m => { const s = Math.sign(V(m.c.x - N9_A.x, m.c.y - N9_A.y, 0).dot(pr)) || 1, near = Math.exp(-(segDist(m.c, N9_A, N9_B) ** 2) / 1.2);
    m.push = pr.clone().multiplyScalar(s * 0.5 * near).add(V(m.c.x - XR, m.c.y - YR, 0).multiplyScalar(0.12)); }); }
const molO = new THREE.InstancedMesh(new THREE.SphereGeometry(0.15, 18, 14), std(0x6fa8e0, { roughness: 0.6 }), MOLS.length);
const molH = new THREE.InstancedMesh(new THREE.SphereGeometry(0.085, 14, 10), std(0xc9d6e6, { roughness: 0.6 }), MOLS.length * 2);
atomScene.add(molO, molH);
console.log('molecole', MOLS.length);
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
const expand = t => smooth(ramp(t, EXP[0], EXP[1])) * (1 - 0.55 * smooth(ramp(t, TH_DOWN[0], TH_DOWN[1])));
function placeMols(t, tn) {
  const E = expand(t);
  MOLS.forEach((m, i) => {
    const d0 = MOL_IN + (m.c.y - YR + 6) * 0.035, sc = Math.max(0.001, backOut(ramp(t, d0, d0 + 0.45)));
    _p.copy(m.c).addScaledVector(m.push, E);
    const jig = (m.fixed ? 0.006 : 0.015) + 0.05 * E;
    _p.x += Math.sin(tn * (7 + 6 * E) + m.ph) * jig; _p.y += Math.cos(tn * (6 + 5 * E) + m.ph * 1.3) * jig;
    if (m.hitT !== undefined) { const k = ramp(t, m.hitT, m.hitT + 0.1) * (1 - ramp(t, m.hitT + 0.1, m.hitT + 0.9)); _p.addScaledVector(m.nrm, 0.13 * k); }
    const a = m.a + (m.fixed ? 0 : Math.sin(tn * 0.8 + m.ph) * 0.25) + E * Math.sin(tn * 3 + m.ph) * 0.5;
    _s.setScalar(sc); _m4.compose(_p, _q.identity(), _s); molO.setMatrixAt(i, _m4);
    [-1, 1].forEach((sd, k) => { const b = a + sd * HA; _m4.compose(V(_p.x + Math.cos(b) * OH * sc, _p.y + Math.sin(b) * OH * sc, _p.z + 0.02), _q, _s); molH.setMatrixAt(2 * i + k, _m4); });
  });
  molO.instanceMatrix.needsUpdate = molH.instanceMatrix.needsUpdate = true;
}
// ---------------- disegno dei nuclei di una zona
const _m4b = new THREE.Matrix4(), _cb = new THREE.Color(), _v = new THREE.Vector3();
function placeNucs(zone, t, tn, zoomK) {
  for (const n of NUCS) {
    if (n.zone !== zone) continue;
    const hit = n.hitAt, e = hit !== undefined ? smooth(ramp(t, hit, hit + 0.45)) : 0, wob = hit !== undefined ? ramp(t, hit - 0.2, hit) * (1 - ramp(t, hit, hit + 0.12)) : 0;
    const fade = hit !== undefined && t >= hit ? n.fade(t) : 1;
    // U-238 che ha appena assorbito un neutrone: piccolo sobbalzo
    let jolt = 0; if (n.absT !== undefined) jolt = ramp(t, n.absT, n.absT + 0.08) * (1 - ramp(t, n.absT + 0.08, n.absT + 0.6));
    const sc = Math.max(0.001, fade);
    n.parts.forEach((pt, k) => {
      if (hit === undefined || t < hit) _v.copy(pt.p).multiplyScalar(1 + 0.16 * wob * Math.sin(t * 45 + k) + 0.1 * jolt * Math.sin(t * 50 + k));
      else _v.copy(pt.p).lerp(n.fragFn(pt.frag, t).add(pt.q), e);
      _v.x += n.c.x + Math.sin(tn * 31 + k * 1.7 + n.ph) * 0.006; _v.y += n.c.y + Math.cos(tn * 27 + k * 2.3 + n.ph) * 0.006; _v.z += n.c.z;
      _s.setScalar(sc); _m4b.compose(_v, _q.identity(), _s); (pt.isP ? instP : instN).setMatrixAt(pt.idx, _m4b);
    });
    if (n.halo) {
      const hal = hit !== undefined ? 1 - ramp(t, hit, hit + 0.15) : 1;
      let near = 0; if (n === nC9) { const pn = npos(n9, t); if (pn) near = Math.exp(-(xy(pn, n.c) ** 2) / 0.5); }
      n.halo.position.set(n.c.x, n.c.y, n.c.z); n.halo.visible = hal > 0.001;
      n.halo.material.opacity = 0.6 * hal * (1 + 0.15 * Math.sin(tn * 5 + n.ph) + 0.8 * near); n.halo.scale.setScalar(1.25 * Math.min(zoomK, 2.2) * (1 + 0.25 * near));
    }
    if (n.hot) n.hot.forEach((s, f) => {
      s.visible = t > hit && fade > 0.001; if (!s.visible) return;
      s.position.copy(n.fragFn(f, t)).add(n.c); s.position.z += 0.15;
      s.material.opacity = fade * 0.6; s.scale.setScalar(0.9 * Math.min(zoomK, 2));
    });
    if (n.flash) { n.flash.material.opacity = t > hit ? 0.95 * Math.max(0, 1 - (t - hit) / 0.5) : 0; n.flash.scale.setScalar((2.2 + 2 * ramp(t, hit, hit + 0.5)) * Math.min(zoomK, 2.5)); }
  }
  instP.instanceMatrix.needsUpdate = instN.instanceMatrix.needsUpdate = true;
}
NEUT.forEach(n => { if (n.host) n.host.absT = tEnd(n); });
// nuclei dell'altra zona: nascosti (la camera non li vede comunque, ma così non pesano sul disegno)
function hideZone(zone) {
  _m4b.makeScale(0, 0, 0);
  for (const n of NUCS) if (n.zone === zone) { n.parts.forEach(pt => (pt.isP ? instP : instN).setMatrixAt(pt.idx, _m4b)); if (n.halo) n.halo.visible = false; if (n.hot) n.hot.forEach(s => { s.visible = false; }); if (n.flash) n.flash.material.opacity = 0; }
}
function placeNeutrons(t, zoomK) {
  NEUT.forEach(n => {
    const p = npos(n, t), t1 = tEnd(n);
    n.m.visible = !!p; if (p) { n.m.position.copy(p); n.m.scale.setScalar(t < t1 ? Math.min(zoomK, 2.2) : 1); }
    if (n.flash) { n.flash.position.copy(n.keys[n.keys.length - 1][0]); n.flash.material.opacity = t > t1 ? 0.8 * Math.max(0, 1 - (t - t1) / 0.45) : 0; }
    if (n.trailS) n.trailS.forEach((s, k) => {
      const tt = t - (k + 1) * 0.028, q = npos(n, tt), q2 = npos(n, tt - 0.02);
      s.visible = !!(p && q && q2 && t < t1); if (!s.visible) return;
      const sp = q.distanceTo(q2) / 0.02;
      s.position.copy(q); s.material.opacity = clamp01((sp - 0.8) / 4) * 0.6 * (1 - k / n.trailS.length); s.scale.setScalar(0.42 * (1 - k / n.trailS.length * 0.5) * Math.min(zoomK, 2));
    });
    n.bounces.forEach(b => { b.s.position.copy(b.p); b.s.material.opacity = t > b.t ? 0.9 * Math.max(0, 1 - (t - b.t) / 0.35) : 0; });
  });
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
// ---------------- icona del termometro (B9): sale quando il nocciolo si scalda, scende quando la reazione rallenta da sola
const icThermo = icon(0.98, 1.25, 0.4), thermo = makeThermo(icThermo.c);
const PAR = 1 - (11 - 0.2) / (11 + 0.1);
const centerIcons = () => [icThermo].forEach(ic => ic.c.position.set(-ic.g.position.x * PAR, -(ic.g.position.y - 0.2) * PAR, 0));

const composer = new EffectComposer(renderer); composer.setSize(W, H);
const worldPass = new RenderPass(scene, camera); composer.addPass(worldPass);
{ const p = new RenderPass(hud, hudCam); p.clear = false; p.clearDepth = true; composer.addPass(p); }
composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), 0.45, 0.5, 1.0));
composer.addPass(new OutputPass());
const startOverlay = mesh(new THREE.PlaneGeometry(4, 4), basic(0x2f86e6, { transparent: true, opacity: 0, depthTest: false, depthWrite: false }), hudCam, V(0, 0, -1)); startOverlay.renderOrder = 1000;
// lampo bianco della bomba: sta davanti a tutto, anche davanti alla mascotte
const flashM = basic(0xffffff, { transparent: true, opacity: 0, depthTest: false, depthWrite: false });
mesh(new THREE.PlaneGeometry(4, 4), flashM, hudCam, V(0, 0, -1)).renderOrder = 1001;

// ============================================================ TEMPI (secondi "di scaletta", bozza 1)
// B1 0,2–0,8 · B2 1,3–4,8 · B3 5,3–8,8 · B4 9,3–13,6 · B5 14,1–19,9 · B6 20,4–25,0 · B7 25,5–29,4 · B8 29,9–34,0 · B9 34,5–40,0
// centrale da 40,6: B10 40,5–44,0 · B11 44,5–46,9 · paesaggio fino a 49,4
const SPEECH = [[0.2, 0.8], [1.3, 4.8], [5.3, 5.7], [5.9, 8.8], [9.3, 13.6], [14.1, 16.3], [16.45, 19.9], [20.4, 25.0], [25.5, 29.4],
  [29.9, 34.0], [34.5, 37.0], [37.15, 40.0], [40.5, 44.0], [44.5, 45.6], [45.75, 46.9]];
const speechEnv = t => { let e = 0; for (const [a, b] of SPEECH) e = Math.max(e, Math.min(ramp(t, a, a + 0.07), 1 - ramp(t, b - 0.09, b))); return e; };
let LIP = null;   // quando arriva la voce: { open, narrow, env } a 30 fps
function lip(tn, t) {
  if (LIP) { const fi = Math.min(LIP.open.length - 1, Math.max(0, Math.round(tn * 30))); return { open: LIP.open[fi], narrow: LIP.narrow[fi], env: LIP.env[fi] }; }
  const env = speechEnv(t), syl = Math.floor(t * 5.5), u = t * 5.5 - syl;
  return { env, open: env * Math.sin(u * Math.PI) ** 0.7 * (0.55 + 0.45 * hash(syl)), narrow: env * (0.25 + 0.6 * hash(syl + 50)) };
}
const END = 49.4;
const BLINKS = []; for (let b = 3.1; b < END - 2; b += 3.3 + hash(b) * 0.8) BLINKS.push(b);
const WARP = [[0, 0], [END, END]];
function unwarp(tn) { for (let i = 0; i < WARP.length - 1; i++) { const [o0, n0] = WARP[i], [o1, n1] = WARP[i + 1]; if (tn <= n1) return o0 + (o1 - o0) * (tn - n0) / (n1 - n0); } return END; }
function fwarp(t) { for (let i = 0; i < WARP.length - 1; i++) { const [o0, n0] = WARP[i], [o1, n1] = WARP[i + 1]; if (t <= o1) return n0 + (n1 - n0) * (t - o0) / (o1 - o0); } return WARP[WARP.length - 1][1]; }
const rt = keys => keys.map(([k, v]) => [fwarp(k), v]);
window.WARP = WARP;

const SWITCH = [[5.0, 'atom', 1, 0.3], [40.6, 'world', 0.8, 0.3]];
const worldAt = t => { let w = 'world'; for (const [s, n] of SWITCH) if (t >= s) w = n; return w; };
const fadeAt = t => { let f = 0; for (const [s, , k, d] of SWITCH) f = Math.max(f, k * clamp01(1 - Math.abs(t - s) / d) ** 0.8); return f; };
const bombWhite = t => smooth(ramp(t, FLASH_UP, FLASH_FULL)) * (1 - smooth(ramp(t, CUT + 0.1, FLASH_DOWN)));
const CAM_WIDE = [-1, 3.8, 11, -1, 3.0, -40], CAM_CORE = [2.95, 2.45, -33.0, 2.95, 2.34, -39.75], CAM_PUSH = [2.95, 2.34, -38.8, 2.95, 2.34, -39.75];
const CAM_W = track(rt([[1.4, CAM_WIDE], [4.3, CAM_CORE], [5.05, CAM_PUSH], [40.6, CAM_PUSH], [41.5, CAM_CORE], [43.4, CAM_WIDE]]));
const DOME = track(rt([[1.6, 1], [2.8, 0.1], [41.9, 0.1], [42.9, 1]]));
const view = (x, y, z) => [x, y, z, x, y];
const ATOM_TRACK = track(rt([[5.0, view(0, 0.3, 50)], [9.0, view(0, 0.3, 44)], [11.8, view(0, 0.3, 16)], [15.4, view(0, 0.3, 15)], [18.8, view(0, 0.3, 30)],
  [CUT - 0.02, view(0, 0.3, 31)], [CUT, view(XR, YR - 0.6, 26)], [22.8, view(XR, YR - 0.8, 17)], [29.5, view(XR - 0.15, YR - 0.7, 16.5)], [34.2, view(XR + 0.1, YR - 0.9, 16.5)], [40.0, view(XR + 0.1, YR - 0.8, 17.5)]]));
const atomCamAt = tn => { const t = unwarp(tn); if (t < CUT) { const c = ATOM_TRACK(Math.min(tn, fwarp(CUT - 0.02))); return c; } return ATOM_TRACK(Math.max(tn, fwarp(CUT))); };
const ATOM_TOP = [new THREE.Color(0x24305e), new THREE.Color(0x120f2a)], ATOM_HOT = [new THREE.Color(0x4a3466), new THREE.Color(0x2a1430)];
// mascotte
const CORNER = [0.82, -0.99, 0.17];
const R0 = [1.2, -0.3, 0.35], WAVE = [1.32, 0.8, 0.3], POINT = [1.62, 0.32, 0.3];
const T_ = {
  pos: track([[0, [0, 0.2, 0.8]], [0.92, [0, 0.2, 0.8]], [1.45, CORNER]]),
  smile: track([[0, 1], [1.4, 0.95], [5.2, 0.8], [5.4, 0.55], [8.6, 0.55], [9.0, 0.8], [18.6, 0.8], [19.0, 0.2], [21.0, 0.2], [21.6, 0.8], [36.0, 0.8], [36.4, 0.45], [38.8, 0.45], [39.4, 0.9], [END, 1]]),
  browY: track([[0, 0.1], [1.4, 0.07], [5.2, 0.07], [5.4, 0.15], [8.6, 0.15], [9.0, 0.07], [18.6, 0.07], [19.0, 0.16], [21.0, 0.16], [21.6, 0.07], [36.0, 0.07], [36.4, 0.13], [38.8, 0.13], [39.4, 0.08], [END, 0.09]]),
  gaze: track([[0, [0, 0]], [1.3, [0, 0]], [1.8, [-0.6, 0.6]], [34.6, [-0.6, 0.6]], [35.0, [-0.85, 0.9]], [36.4, [-0.85, 0.9]], [36.8, [-0.6, 0.6]], [44.6, [-0.6, 0.6]], [45.0, [0, 0]], [45.6, [0, 0]], [45.9, [0.85, 0.25]], [46.8, [0.85, 0.25]], [47.1, [0, 0]], [END, [0, 0]]]),
  handR: track([[0, R0], [0.12, WAVE], [0.9, WAVE], [1.35, R0], [45.5, R0], [45.9, POINT], [46.8, POINT], [47.1, R0], [47.3, WAVE], [END, WAVE]]),
};
const EXIT = 47.9;
window.renderFrame = function (tn) {
  const t = unwarp(tn);
  const where = worldAt(t);
  fadeMat.opacity = fadeAt(t);
  flashM.opacity = bombWhite(t);
  // ---------------- MONDO 1: centrale
  if (where === 'world') {
    worldPass.scene = scene; worldPass.camera = camera;
    const c = CAM_W(tn);
    camera.position.set(c[0] + Math.sin(tn * 0.21) * 0.1, c[1] + Math.sin(tn * 0.17) * 0.05, c[2]); camera.lookAt(c[3], c[4], c[5]);
    clouds.forEach((cl, i) => { cl.position.x = cl.userData.x + Math.sin(tn * 0.05 + i) * 0.8 + tn * 0.02; });
    for (const m of puffs) {
      const d = m.userData, ph = (tn * 0.085 + d.ph) % 1;
      m.position.set(d.x + Math.cos(d.a) * d.r * (1 + ph) + ph * ph * 2.2, d.base + ph * 6.5, d.z + Math.sin(d.a) * d.r);
      m.scale.setScalar(d.s * (0.95 + ph * 1.9)); m.material.opacity = 0.55 * Math.min(1, ph * 6) * (1 - ph);
    }
    waveFlag(tn);
    const dOp = DOME(tn); domeFront.opacity = bandFront.opacity = dOp; domeFront.depthWrite = bandFront.depthWrite = dOp > 0.99;
    coreM.emissiveIntensity = 2.3 * (1 + 0.08 * Math.sin(tn * 7)); coreGlow.material.opacity = 0.38 * (1 - dOp);
    primDrops.forEach((m, i) => { primLoop.getPointAt((i / primDrops.length + tn * 0.19) % 1, m.position); m.position.z += 0.02; });
    cableDots.forEach((d, i) => { cableCurve.getPointAt((tn * 0.42 + i / cableDots.length) % 1, d.position); });
  }
  // ---------------- MONDO 3: atomi
  if (where === 'atom') {
    worldPass.scene = atomScene; worldPass.camera = atomCam;
    const c = atomCamAt(tn); atomCam.position.set(c[0] + Math.sin(tn * 0.3) * 0.04, c[1] + Math.sin(tn * 0.23) * 0.03, c[2]); atomCam.lookAt(c[3], c[4], 0); atomCam.updateMatrixWorld();
    const zoomK = 1 + Math.max(0, atomCam.position.z - 12) / 12;
    const zone = t < CUT ? 'B' : 'R';
    hideZone(zone === 'B' ? 'R' : 'B'); placeNucs(zone, t, tn, zoomK);
    molO.visible = molH.visible = zone === 'R'; if (zone === 'R') placeMols(t, tn);
    placeNeutrons(t, zoomK);
    // B9: il fondo si scalda un po' mentre l'acqua si dilata
    const E = expand(t);
    atomBg.uniforms.top.value.copy(ATOM_TOP[0]).lerp(ATOM_HOT[0], E); atomBg.uniforms.bottom.value.copy(ATOM_TOP[1]).lerp(ATOM_HOT[1], E);
  }
  // ---------------- PRIMO PIANO: termometro
  showIcon(icThermo, pop(t, 34.6, 40.3)); thermo.set(0.35 + 0.55 * smooth(ramp(t, TH_UP[0], TH_UP[1])) - 0.45 * smooth(ramp(t, TH_DOWN[0], TH_DOWN[1])));
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
  const wide = 1 + 0.12 * smooth(ramp(t, 18.6, 19.0)) * (1 - smooth(ramp(t, 21.0, 21.6)));   // occhi più grandi davanti al lampo della bomba
  for (const e of eyes) { e.g.scale.set(1.05 * wide, 1.05 * wide * Math.max(0.07, (1 - blink) * (1 - squint)), 1); e.pupil.position.set(gx * 0.075 - e.sd * 0.018, gy * 0.085, 0); }
  const by = T_.browY(t);
  for (const b of brows) { const x = b.sd * 0.35, y = 0.535 + by + blink * -0.015; b.m.position.set(x, y, onSphere(x, y, 1.03)); b.m.rotation.set(-0.45, b.sd * 0.3, b.sd * 0.03 + b.sd * -0.06 + (by > 0.12 ? b.sd * 0.18 : 0)); }
  const open = L.open * 0.78, narrow = L.narrow * 0.32;
  setMouth((0.29 + 0.06 * Math.max(0, smile)) * (1 - narrow), smile * (1 - 0.35 * open), open);
  const hr = T_.handR(t), wave = win(t, 0.15, 1.0, 0.2) + win(t, 47.3, 47.85, 0.15), point = win(t, 45.9, 46.8, 0.25), talk = env * 0.04;
  hands[1].position.set(hr[0] + wave * Math.sin(t * 13) * 0.2 + point * Math.abs(Math.sin(t * 6.5)) * 0.1, hr[1] + Math.sin(tn * 2.3) * 0.03 + talk * Math.sin(tn * 6.1) + bob * 0.3, hr[2]);
  hands[0].position.set(-R0[0], R0[1] + Math.sin(tn * 2.3 + 1.7) * 0.03 + talk * Math.sin(tn * 5.3 + 2) + bob * 0.3, R0[2]);
  centerIcons();
  startOverlay.material.opacity = 1 - ramp(t, 0, 0.3);
  composer.render();
};
window.DURATION = WARP[WARP.length - 1][1];
window.renderFrame(0);
window.ready = true;
