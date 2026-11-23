// Puntata 4 — "Cosa succede quando colpisco un atomo" (versione finale, allineata alla voce dell'autore con WARP e lip4.js)
// Stessa mascotte e stesso mondo della puntata 3 (ep3.js). Tre "mondi" disegnati uno alla volta sotto il primo piano:
//  - CENTRALE: la centrale della puntata 3 con la cupola aperta (apertura e chiusura);
//  - BARRETTE: barrette di combustibile nell'acqua, con le pastiglie dentro la guaina;
//  - ATOMI: l'interno di una pastiglia, nuclei di uranio sparsi che non si toccano mai (1 su 10 di U-235, con l'alone giallo).
// Si passa da un mondo all'altro con un breve lampo chiaro, come uno zoom che entra nella luce.
// Il PRIMO PIANO (mascotte, targhette, icone) ha una camera fissa ed è disegnato sopra, come nella puntata 3.
import * as THREE from 'three';
import LIP4 from './lip4.js';
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
const grow = (t, a, d = 0.45) => backOut(ramp(t, a, a + d));
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
// lampo di passaggio fra i mondi: un velo davanti a ogni camera dei mondi (non copre il primo piano)
const fadeMat = basic(0xfff4dc, { transparent: true, opacity: 0, depthTest: false, depthWrite: false });
const addFade = cam => { const m = mesh(new THREE.PlaneGeometry(10, 10), fadeMat, cam, V(0, 0, -0.5)); m.renderOrder = 9999; };

// ============================================================ MONDO 1: CENTRALE (dalla puntata 3, senza l'interno della sala turbine)
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
// edificio del reattore: la metà davanti diventa trasparente
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
// sala turbine (chiusa) e collegamenti esterni
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

// ============================================================ MONDO 2: BARRETTE nell'acqua
const rodScene = new THREE.Scene();
const rodCam = new THREE.PerspectiveCamera(30, W / H, 0.05, 100); rodScene.add(rodCam); addFade(rodCam);
const waterBg = gradientBg(rodScene, 0x4aa8ec, 0x1050a0);
lights(rodScene, 0.8);
{ const p = new THREE.PointLight(0xffffff, 40); p.position.set(2, 3, 6); rodScene.add(p); }
const RODS = [[-2.6, 0], [-1.3, 0], [0, 0], [1.3, 0], [2.6, 0], [-1.95, -2.2], [-0.65, -2.2], [0.65, -2.2], [1.95, -2.2]];
const PEL_N = 31, PEL_DY = 0.44;
const pelM = new THREE.MeshStandardMaterial({ color: 0x46464f, roughness: 0.75, emissive: 0xff6a10, emissiveIntensity: 0.06 });
const pellets = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.36, 0.36, 0.4, 32), pelM, RODS.length * PEL_N); rodScene.add(pellets);
{ const m4 = new THREE.Matrix4(); let n = 0; RODS.forEach(([x, z]) => { for (let k = 0; k < PEL_N; k++) { m4.makeTranslation(x, (k - 15) * PEL_DY, z); pellets.setMatrixAt(n++, m4); } }); }
const cladM = new THREE.MeshStandardMaterial({ color: 0xbfcad8, metalness: 0.5, roughness: 0.35, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide });
const cladMid = cladM.clone();
const rodGlows = RODS.map(([x, z], i) => {
  mesh(new THREE.CylinderGeometry(0.42, 0.42, 14, 40, 1, true), i === 2 ? cladMid : cladM, rodScene, V(x, 0, z)).renderOrder = 3;
  const g = glow(0xff8a30, rodScene, 1); g.scale.set(1.9, 16, 1); g.position.set(x, 0, z + 0.3); return g;
});
const rodBubbles = Array.from({ length: 46 }, (_, i) => { const m = mesh(new THREE.SphereGeometry(0.05 + 0.04 * hash(i), 10, 8), basic(0xdff2ff, { transparent: true, opacity: 0.7 }), rodScene); m.userData = { x: (hash(i + 3) - 0.5) * 5.4, z: 0.5 - hash(i + 9) * 0.6 - (i % 3) * 1.1, ph: hash(i + 17) }; return m; });
// righe d'acqua che salgono fra le barrette (l'acqua scorre)
const flowLines = Array.from({ length: 44 }, (_, i) => { const m = mesh(new THREE.CapsuleGeometry(0.014, 0.55, 4, 8), basic(0xe8f6ff, { transparent: true, opacity: 0.25, depthWrite: false }), rodScene); m.userData = { x: [-1.95, -0.65, 0.65, 1.95, -3.25, 3.25][i % 6] + (hash(i + 5) - 0.5) * 0.5, z: 0.45 - hash(i + 8) * 1.4, v: 0.22 + 0.1 * hash(i + 2), ph: hash(i + 31) }; return m; });
const heatPuffs = Array.from({ length: 50 }, (_, i) => { const s = glow(0xff9a40, rodScene, 0.9); s.userData = { r: RODS[i % 5][0], ph: hash(i + 40), y: (hash(i + 70) - 0.5) * 6 }; return s; });
const WATER_C = [new THREE.Color(0x4aa8ec), new THREE.Color(0x1050a0)], WARM_C = [new THREE.Color(0x7ab4e0), new THREE.Color(0x5a4a90)];

// ============================================================ MONDO 3: ATOMI dentro la pastiglia
// Nuclei sparsi (distanza minima 1,45 fra i centri: nessun nucleo tocca un altro), con zone lasciate libere
// per targhette, neutroni in attesa, percorsi dei neutroni e per la mascotte nell'angolo.
// Neutroni in linea retta: ognuno provoca un'altra fissione, viene assorbito da un U-238 o esce dall'inquadratura.
// Frammenti: moto a biliardo (fragSim): rimbalzano sui nuclei, nella catena si fermano e poi dissolvono; quelli della prima
// fissione, di F e del plutonio escono dall'inquadratura. I nuclei urtati dai frammenti di F si scaldano (anche B e i neutroni assorbiti).
const atomScene = new THREE.Scene();
const atomCam = new THREE.PerspectiveCamera(30, W / H, 0.05, 300); atomScene.add(atomCam); addFade(atomCam);
gradientBg(atomScene, 0x24305e, 0x120f2a);
lights(atomScene, 0.95);
{ const p = new THREE.PointLight(0xffffff, 60); p.position.set(2, 4, 9); atomScene.add(p); const f = new THREE.PointLight(0x9fc8ff, 30); f.position.set(-5, -2, 6); atomScene.add(f); }
const protM = std(0xf06a52, { roughness: 0.5 }), neutM = new THREE.MeshStandardMaterial({ color: 0x58b0ff, roughness: 0.6, emissive: 0x1c5fb8, emissiveIntensity: 0.35 });
const NR = 0.075;                                                // raggio di un nucleone
const nucGeo = new THREE.SphereGeometry(NR, 16, 12), instGeo = new THREE.SphereGeometry(NR, 10, 8), freeGeo = new THREE.SphereGeometry(NR * 1.15, 16, 12);
// modello di nucleo: 40 nucleoni in una palla (16 protoni, 24 neutroni ≈ 92 : 143)
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
// i neutroni vanno dritti: si preferiscono bersagli raggiungibili senza passare sopra altri nuclei
const clearLine = (a, b, skip) => NUCS.every(n => skip.includes(n) || segDist(n.c, a, b) > 0.4);
const line = (a, b) => new THREE.LineCurve3(a, b);
const easeOut = (u, k = 2.2) => 1 - Math.pow(1 - clamp01(u), k);

// ---------------- posizioni chiave
// prima scena: A = U-235 colpito dalla mascotte · B = U-238 che cattura un neutrone · C = secondo U-235
const PA = V(0.3, 1.1, 0), PB = V(-0.8, -0.2, 0), PC = V(1.4, 3.5, 0);
// scena del plutonio (B12–B13), in un'altra zona della pastiglia: G = U-238 che assorbe un neutrone e diventa plutonio
const PG = V(21, -0.2, 0);
const AXA = V(1, 0, 0);
const HOLD = 0.62;                                                         // distanza da A di frammenti e neutroni "in attesa"
const NHOV = [260, 130, 75].map(a => PA.clone().addScaledVector(ang(a), HOLD).setZ(0.12));   // n1 → B, n2 → esce, n3 → C
const CAPT_DIR = NHOV[0].clone().sub(PB).setZ(0).normalize(), CAPT_P = PB.clone().addScaledVector(CAPT_DIR, 0.27).setZ(0.12);
const ESC = V(-11.5, 2.3, 0.12), TGT_C = PC.clone().addScaledVector(NHOV[2].clone().sub(PC).setZ(0).normalize(), 0.24).setZ(0.12);
const G_FROM = PG.clone().add(V(-2.6, 1.4, 0.12)), G_DIR = G_FROM.clone().sub(PG).setZ(0).normalize(), G_CAPT = PG.clone().addScaledVector(G_DIR, 0.27).setZ(0.12);
const PU_FROM = PG.clone().add(V(-3.4, 2.4, 0.12)), PU_TO = PG.clone().addScaledVector(PU_FROM.clone().sub(PG).setZ(0).normalize(), 0.24).setZ(0.12);
const KEEP = [[PA.clone().add(V(0, 0.55, 0)), 1.0], [PB.clone().add(V(0, 0.55, 0)), 1.05], [PG.clone().add(V(0, 0.55, 0)), 1.1], ...NHOV.map(p => [p, 0.75]),
  [PA.clone().addScaledVector(AXA, HOLD), 0.75], [PA.clone().addScaledVector(AXA, -HOLD), 0.75],
  [V(1.27, -1.54, 0), 0.9], [V(0.62, -0.59, 0), 0.6], [V(21.46, -0.92, 0), 0.55], [V(21.95, -0.88, 0), 0.7]];   // angoli della mascotte
const CAPS = [[NHOV[0], CAPT_P], [NHOV[1], V(-3.4, 1.9, 0)], [NHOV[2], TGT_C], [G_FROM, G_CAPT], [PU_FROM, PU_TO]];
// ---------------- riempimento casuale (seme fisso) con distanza minima; U-235 1 su 10 (più che nella realtà, per la catena)
const MIN_D = 1.45;
const NUCS = [{ c: PA.clone(), u: true, key: 'A' }, { c: PB.clone(), u: false, key: 'B' }, { c: PC.clone(), u: true, key: 'C' }, { c: PG.clone(), u: false, key: 'G' }];
seed = 2024;
[[-10.5, 9.5, -14.5, 19.5, 40000], [16, 26.5, -7.5, 7.5, 8000]].forEach(([x0, x1, y0, y1, tries]) => {
  for (let k = 0; k < tries; k++) {
    const p = V(lerp(x0, x1, rnd()), lerp(y0, y1, rnd()), 0);
    if (NUCS.some(n => xy(n.c, p) < MIN_D)) continue;
    if (KEEP.some(([c, r]) => xy(c, p) < r + 0.3)) continue;
    if (CAPS.some(([a, b]) => segDist(p, a, b) < 0.62)) continue;
    p.z = (rnd() - 0.5) * 0.4; NUCS.push({ c: p, u: false });
  }
});
// U-235: 1 su 10, distribuiti in modo uniforme (due U-235 non stanno mai a meno di 3,4 l'uno dall'altro)
{ const main = NUCS.slice(4).filter(n => n.c.x < 12), want = Math.round(main.length * 0.1), U = [PA, PC];
  for (const n of main.map((n, i) => [hash(i * 3.7 + 11), n]).sort((a, b) => a[0] - b[0]).map(x => x[1])) {
    if (U.length - 2 >= want) break;
    if (U.every(c => xy(c, n.c) > 3.4)) { n.u = true; U.push(n.c); }
  }
  // vuoti senza U-235 nella vista della reazione a catena (B9): se ne aggiunge qualcuno, fuori dalla vista larga di B5 (che resta com'era)
  let added = 0;
  for (let y = 18.5; y >= -13.5; y -= 0.8) for (let x = -9.5; x <= 8.5; x += 0.8) {
    const g = V(x, y, 0); if (U.some(c => xy(c, g) < 4.4)) continue;
    const cand = main.filter(n => !n.u && !(Math.abs(n.c.x) < 6.4 && n.c.y > -10.6 && n.c.y < 7.5) && xy(n.c, g) < 1.8 && U.every(c => xy(c, n.c) > 3.4)).sort((a, b) => xy(a.c, g) - xy(b.c, g))[0];
    if (cand) { cand.u = true; U.push(cand.c); added++; }
  }
  console.log('U-235 aggiunti nei vuoti', added, 'totale', U.length); }
// ---------------- nuclei speciali (oggetti separati: si possono spaccare); gli U-238 "di sfondo" sono due InstancedMesh
function makeNucleus(c, k) {
  const g = new THREE.Group(); g.position.copy(c); atomScene.add(g);
  const parts = rotated(k + 500).map(({ p, isP }) => { const m = mesh(nucGeo, isP ? protM : neutM.clone(), g, p); return { p, isP, m, orig: m.material }; });
  const halo = glow(0xffd23a, g, 1.25);
  const hot = [0, 1].map(() => glow(0xffb060, g, 0.9));
  return { g, parts, halo, hot, hit: null };
}
const bg = [];
NUCS.forEach((n, k) => { if (n.u || n.key) n.obj = makeNucleus(n.c, k); else bg.push(n); });
const [nA, nB, nC, nG] = NUCS, NA = nA.obj, NB = nB.obj, NC = nC.obj, NG = nG.obj;
NG.halo.material.color.setHex(0x5ee08a);                                    // il plutonio avrà l'alone verde
bg.forEach((n, k) => { n.parts = rotated(k * 13 + 7); n.ph = hash(k) * 6.28; });
const nP = bg.reduce((s, n) => s + n.parts.filter(p => p.isP).length, 0), nN = bg.length * 40 - nP;
const instP = new THREE.InstancedMesh(instGeo, std(0xffffff, { roughness: 0.55 }), nP), instN = new THREE.InstancedMesh(instGeo, std(0xffffff, { roughness: 0.55 }), nN);
atomScene.add(instP, instN);
const C_P = new THREE.Color(0xf06a52), C_N = new THREE.Color(0x5aa8f0), C_HOT = new THREE.Color(0xffa040), C_EM_N = new THREE.Color(0x1c5fb8), C_EM_HOT = new THREE.Color(0x6a2a00);
const _m4 = new THREE.Matrix4(), _c = new THREE.Color();
function placeBg(n, ox = 0, oy = 0, h = 0) {
  for (const pt of n.parts) {
    _m4.makeTranslation(n.c.x + pt.p.x + ox, n.c.y + pt.p.y + oy, n.c.z + pt.p.z);
    _c.copy(pt.isP ? C_P : C_N).lerp(C_HOT, h * (pt.isP ? 0.6 : 0.75));
    const im = pt.isP ? instP : instN; im.setMatrixAt(pt.idx, _m4); im.setColorAt(pt.idx, _c);
  }
}
{ let ip = 0, iN = 0; bg.forEach(n => { n.parts.forEach(pt => { pt.idx = pt.isP ? ip++ : iN++; }); placeBg(n); }); }

// ---------------- frammenti di fissione: moto "a biliardo". Partono veloci e rallentano; quando toccano un nucleo
// rimbalzano come palle (riflessione rispetto alla normale nel punto di contatto) e perdono velocità. Mai sovrapposti a un nucleo.
const REST = [];                                                            // frammenti fermi (con .until: fino a quando restano in scena)
const FR_R = 0.6, FR_REST_R = 0.56;                                         // distanza di contatto frammento-nucleo e frammento-frammento fermo
function fragSim(start, dir, t0, o) {
  const { v0, drag, keep, vmin = 0, stopV = 0.35, maxT = 6, skip = [], box = null } = o;   // box: uscito da qui, non urta più (non rientra)
  let out = false;
  const obs = NUCS.filter(n => !skip.includes(n) && xy(n.c, start) < 16).map(n => ({ c: n.c, n, r: FR_R }))
    .concat(REST.filter(r => xy(r, start) < 16).map(c => ({ c, n: null, r: FR_REST_R, until: c.until })));
  const p = start.clone().setZ(0.1), d = dir.clone().setZ(0).normalize(); let v = v0, t = t0, k = 0, stopped = false;
  const S = [[t0, p.x, p.y]], contacts = [], dt = 1 / 240;
  while (t < t0 + maxT) {
    p.x += d.x * v * dt; p.y += d.y * v * dt; t += dt;
    if (box && (Math.abs(p.x - box[0]) > box[2] || Math.abs(p.y - box[1]) > box[3])) out = true;
    for (const ob of out ? [] : obs) {
      if (ob.n && ob.n.u && ob.n.hit != null && ob.n.hit < t) continue;      // nucleo già spaccato: non c'è più
      if (ob.until !== undefined && t > ob.until) continue;                  // frammento fermo già dissolto
      const dx = p.x - ob.c.x, dy = p.y - ob.c.y, L = Math.hypot(dx, dy);
      if (L < ob.r) {
        const nx = dx / L, ny = dy / L, dn = d.x * nx + d.y * ny;
        if (dn < 0) { d.x -= 2 * dn * nx; d.y -= 2 * dn * ny; v *= keep; contacts.push({ n: ob.n, t, c: ob.c }); }
        p.x = ob.c.x + nx * ob.r; p.y = ob.c.y + ny * ob.r;
      }
    }
    v *= Math.exp(-drag * dt); if (vmin) v = Math.max(v, vmin);
    if (++k % 3 === 0) S.push([t, p.x, p.y]);
    if (!vmin && v < stopV) { stopped = true; break; }
  }
  S.push([t, p.x, p.y]);
  const at = tq => {
    if (tq <= S[0][0]) return V(S[0][1], S[0][2], 0.1);
    if (tq >= S[S.length - 1][0]) { const q = S[S.length - 1]; return V(q[1], q[2], 0.1); }
    let lo = 0, hi = S.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (S[m][0] <= tq) lo = m; else hi = m; }
    const a = S[lo], b = S[hi], u = (tq - a[0]) / (b[0] - a[0]); return V(lerp(a[1], b[1], u), lerp(a[2], b[2], u), 0.1);
  };
  return { S, at, contacts, tEnd: t, end: V(p.x, p.y, 0.1), stopped };
}
// primo istante in cui un frammento è fuori da un riquadro [cx, cy, mezza larghezza, mezza altezza]
const exitTime = (sim, [cx, cy, hw, hh]) => { for (const [t, x, y] of sim.S) if (Math.abs(x - cx) > hw || Math.abs(y - cy) > hh) return t; return sim.tEnd; };
// ---------------- fissione: i nucleoni si dividono in due frammenti (24 e 16, come bario e kripton) lungo un asse
function prepFission(n, hit, axis) {
  n.hit = hit; n.axis = axis.clone().normalize();
  const order = n.parts.map((pt, k) => [pt.p.dot(n.axis), k]).sort((a, b) => b[0] - a[0]);
  const nSmall = Math.round(n.parts.length * 0.4);
  order.forEach(([, k], r) => { n.parts[k].frag = r < nSmall ? 1 : 0; });
  n.cent = [0, 1].map(f => { const c = V(0, 0, 0); let cnt = 0; n.parts.forEach(pt => { if (pt.frag === f) { c.add(pt.p); cnt++; } }); return c.multiplyScalar(1 / cnt); });
  n.parts.forEach(pt => { pt.q = pt.p.clone().sub(n.cent[pt.frag]).multiplyScalar(0.92); });
}
// frammenti delle fissioni della catena: schizzano via, rimbalzano sui nuclei, si fermano e poi dissolvono (la scena resta pulita).
// Non dissolvono mai mentre la camera è vicina: aspettano lo zoom all'indietro di B9. Quelli che restano nell'inquadratura
// della fissione F (B10–B11) restano fino allo zoom indietro verso le barrette.
const ZOOM_OUT_DONE = 37.9, BEFORE_F = 41.9, AFTER_F = 55.4;
function settle(entry, t0) {
  const o = entry.obj, c = entry.c.clone().setZ(0.1);
  o.sims = [0, 1].map(f => fragSim(c.clone().add(o.cent[f]), o.axis.clone().multiplyScalar(f ? 1 : -1), t0, { v0: 6.5, drag: 1.1, keep: 0.55, skip: [entry], maxT: 4 }));
  o.tRest = Math.max(...o.sims.map(q => q.tEnd));
  const nearF = o.sims.some(q => Math.abs(q.end.x - FN.c.x) < 3.2 && Math.abs(q.end.y - FN.c.y) < 4.6);
  const f0 = o.tRest + 0.2 > BEFORE_F && nearF ? AFTER_F : Math.min(Math.max(o.tRest + 0.2, ZOOM_OUT_DONE), BEFORE_F);
  o.sims.forEach(q => { const r = q.end.clone(); r.until = f0 + 0.6; REST.push(r); });
  o.fragFn = (f, t) => o.sims[f].at(t).sub(entry.c);
  o.fade = t => 1 - smooth(ramp(t, f0, f0 + 0.6));
}
// il neutrone catturato da un U-238 diventa un nucleone in più sulla sua superficie
const addCapture = (obj, dir) => { const pt = { p: dir.clone().multiplyScalar(0.27), isP: false, m: mesh(nucGeo, neutM.clone(), obj.g, dir.clone().multiplyScalar(0.27)) }; pt.orig = pt.m.material; obj.parts.push(pt); return pt; };
const captB = addCapture(NB, CAPT_DIR), captG = addCapture(NG, G_DIR);
// i 3 neutroni "in più" dell'U-238 (B4): i tre più vicini alla camera; due neutroni di G diventeranno protoni (B12)
const frontN = o => o.parts.filter(pt => !pt.isP && pt !== captB && pt !== captG).sort((a, b) => b.p.z - a.p.z);
// scelti dall'autore sul fotogramma di B4: a sinistra, al centro e in alto a destra (posizioni nel modello del nucleo B)
const pick = (o, x, y) => frontN(o).sort((a, b) => Math.hypot(a.p.x - x, a.p.y - y) - Math.hypot(b.p.x - x, b.p.y - y))[0];
const EXTRA3 = [pick(NB, -0.2, 0.06), pick(NB, -0.02, -0.1), pick(NB, 0.18, 0.14)], FLIP = frontN(NG).slice(0, 2);
const extraGlows = EXTRA3.map(() => glow(0x9fd8ff, NB.g, 0.28));

// ============================================================ TEMPI DELLA SEQUENZA ATOMI (secondi di scaletta)
const HIT = 23.0;               // la mascotte colpisce A
const GO = 29.5;                // neutroni e frammenti della prima fissione partono tutti insieme (inizio B8)
const N3_SPEED = 2.0;           // velocità dei tre neutroni della prima fissione dopo la partenza
const C_HIT = 33.7;             // il terzo neutrone spacca C (sulla parola "spacca" della seconda frase di B8): da qui la reazione a catena
const GO3 = C_HIT - NHOV[2].distanceTo(TGT_C) / N3_SPEED;   // il terzo resta accanto ad A finché la voce non dice "il terzo"
const CHAIN_END = 41.0;         // ultime fissioni della catena prima dello zoom su F
const F_HIT = 43.0, F_GO = 46.3, F_END = 53.0;   // fissione "inquadrata": frammenti fermi, poi partono, rimbalzano e si fermano
const G_IN = [63.0, 64.2], FLIP_T = [65.1, 66.7], PU_ON = 67.4, PU_HIT = 72.6;
// ---------------- neutroni: ognuno ha un percorso e un destino ('hit' = nuova fissione, 'abs' = assorbito da un U-238, 'exit' = esce)
const NEUT = [];
const addNeutron = (curve, t0, t1, end) => NEUT.push({ curve, t0, t1, end, m: mesh(freeGeo, neutM, atomScene), flash: end === 'abs' || end === 'cap' ? glow(0xbfe4ff, atomScene, 0.8) : null });
// prima fissione: frammenti fermi accanto ad A durante B7, poi partono e escono dall'inquadratura
prepFission(NA, HIT, AXA); nA.hit = HIT;
NA.sims = [0, 1].map(f => { const dir = AXA.clone().multiplyScalar(f ? 1 : -1); return fragSim(PA.clone().addScaledVector(dir, HOLD), dir, GO, { v0: 6, drag: 0.5, keep: 0.75, vmin: 2.8, skip: [nA], maxT: 5, box: [0, 0.3, 3.2, 5.2] }); });
NA.fragFn = (f, t) => {
  if (t < GO) return NA.cent[f].clone().addScaledVector(AXA, (f ? 1 : -1) * (HOLD - NA.cent[f].length()) * smooth(ramp(t, HIT + 0.2, HIT + 1.3)));
  return NA.sims[f].at(t).sub(PA);
};
NA.tRest = Math.max(...NA.sims.map(q => exitTime(q, [0, 0.3, 3.2, 5.2])));   // fuori dalla vista ACTION (con margine)
NA.fade = t => 1 - smooth(ramp(t, NA.tRest, NA.tRest + 0.3));
// i tre neutroni della prima fissione: fermi accanto ad A, poi partono insieme
const N3 = [
  { hov: NHOV[0], curve: line(NHOV[0], CAPT_P), end: 'abs' },
  { hov: NHOV[1], curve: line(NHOV[1], ESC), end: 'exit' },
  { hov: NHOV[2], curve: line(NHOV[2], TGT_C), end: 'hit' },
].map((o, k) => ({ ...o, go: k === 2 ? GO3 : GO, t1: (k === 2 ? GO3 : GO) + o.curve.getLength() / N3_SPEED, m: mesh(freeGeo, neutM, atomScene), flash: o.end === 'abs' ? glow(0xbfe4ff, atomScene, 0.8) : null }));
// ---------------- reazione a catena: simulazione semplice, decisa all'avvio (seme fisso)
const SPN = 4.0;                                                            // velocità dei neutroni (unità al secondo)
const u235Free = n => n.u && n.hit === undefined && !n.key;
// la fissione su cui si zooma in B10 (F): un U-235 vicino al centro della vista larga, con tanti U-238 attorno (per i rimbalzi)
const CH = V(-0.5, 2.5, 0);
const FN = NUCS.filter(n => u235Free(n) && Math.abs(n.c.x - CH.x) < 4.5 && Math.abs(n.c.y - CH.y) < 8 && xy(n.c, PC) > 4.5)
  .map(n => [NUCS.filter(o => !o.u && xy(o.c, n.c) < 2.4).length, n]).sort((a, b) => b[0] - a[0])[0][1];
FN.hit = F_HIT;
let absorbed = new Set();
function emit(entry, t, k, allowLinks, exitOnly = false) {
  const out = [];
  // neutroni che portano avanti la catena: verso un U-235 libero vicino
  let links = 0; const wantLinks = allowLinks ? (hash(t * 7.7) < 0.45 && t < 39.6 ? 2 : 1) : 0;
  const cands = NUCS.filter(u235Free).map(n => [xy(n.c, entry.c) + (clearLine(entry.c, n.c, [entry, n]) ? 0 : 100), n]).filter(([d]) => (d % 100) > 1.4 && (d % 100) < 7.5).sort((a, b) => a[0] - b[0]);
  for (const [, n] of cands) {
    if (links >= Math.min(wantLinks, k)) break;
    const dir = n.c.clone().sub(entry.c).setZ(0).normalize(), start = entry.c.clone().addScaledVector(dir, 0.32).setZ(0.15), end = n.c.clone().addScaledVector(dir, -0.25).setZ(0.15);
    const curve = line(start, end), t1 = t + 0.05 + curve.getLength() / SPN;
    if (t1 > CHAIN_END) continue;
    n.hit = t1; out.push(n); links++; addNeutron(curve, t + 0.05, t1, 'hit');
  }
  // gli altri: assorbiti da un U-238 vicino, oppure escono
  for (let i = links; i < k; i++) {
    const a = hash(t * 13.1 + i * 3.3) * 6.28, dir = V(Math.cos(a), Math.sin(a), 0), start = entry.c.clone().addScaledVector(dir, 0.32).setZ(0.15);
    const tgt = NUCS.filter(n => !n.u && !n.key && !absorbed.has(n)).map(n => [xy(n.c, entry.c), n]).filter(([d, n]) => d > 1.2 && d < 4.5 && n.c.clone().sub(entry.c).setZ(0).normalize().dot(dir) > 0.55).map(([d, n]) => [d + (clearLine(entry.c, n.c, [entry, n]) ? 0 : 100), n]).sort((p, q) => p[0] - q[0])[0];
    if (tgt && !exitOnly) {
      const n = tgt[1]; absorbed.add(n);
      const end = n.c.clone().addScaledVector(start.clone().sub(n.c).setZ(0).normalize(), 0.3).setZ(0.15);
      const curve = line(start, end); addNeutron(curve, t + 0.05, t + 0.05 + curve.getLength() / SPN, 'abs'); NEUT[NEUT.length - 1].nuc = n;
    } else {
      const curve = line(start, start.clone().addScaledVector(dir, 16)); addNeutron(curve, t + 0.05, t + 0.05 + curve.getLength() / SPN, 'exit');
    }
  }
  return out;
}
const EVENTS = [];
function fission(entry, t, links) {
  const a = hash(t * 5.3 + entry.c.x) * 6.28;
  prepFission(entry.obj, t, V(Math.cos(a), Math.sin(a), 0));
  settle(entry, t + 0.1);
  EVENTS.push(entry);
  return emit(entry, t, hash(t * 2.9) < 0.5 ? 2 : 3, links);
}
nC.hit = C_HIT;
{ const queue = [nC];
  while (queue.length) { queue.sort((a, b) => a.hit - b.hit); const e = queue.shift(); queue.push(...fission(e, e.hit, true)); } }
// il neutrone che arriva a F: da una delle ultime fissioni vicine, abbastanza lento da arrivare a F_HIT
{ const par = EVENTS.filter(e => e.hit > 38.5).map(e => [xy(e.c, FN.c) + (clearLine(e.c, FN.c, [e, FN]) ? 0 : 100), e]).filter(([d]) => (d % 100) > 1.4).sort((a, b) => a[0] - b[0])[0][1];
  const dir = FN.c.clone().sub(par.c).setZ(0).normalize();
  const curve = line(par.c.clone().addScaledVector(dir, 0.32).setZ(0.15), FN.c.clone().addScaledVector(dir, -0.25).setZ(0.15));
  addNeutron(curve, par.hit + 0.05, F_HIT, 'hit'); }
// ---------------- fissione inquadrata (F): frammenti fermi, poi rimbalzano fra i nuclei vicini senza toccarli e si fermano
const FO = FN.obj, PF = FN.c.clone().setZ(0);
emit(FN, F_HIT, 2, false);
const obstacles = [...NUCS.filter(n => n !== FN && !(n.hit !== undefined && n.hit !== null && n.hit < F_GO && n.u)).map(n => n.c), ...REST.filter(r => r.until > F_GO)];
// inquadratura della fissione F: spostata quanto basta perché la mascotte nell'angolo non copra nessun nucleo
const FV_Z = 13, FVC = (() => {
  const k = FV_Z / 11, need = 0.32 + 0.3 * k; let best = [PF.x, PF.y], bd = 1e9;
  for (let dx = -0.9; dx <= 0.9; dx += 0.1) for (let dy = -0.9; dy <= 0.9; dy += 0.1) {
    const m = V(PF.x + dx + 0.82 * k, PF.y + dy - 1.19 * k, 0);
    if ([...obstacles, ...REST].every(c => xy(c, m) > need) && Math.hypot(dx, dy) < bd) { bd = Math.hypot(dx, dy); best = [PF.x + dx, PF.y + dy]; }
  }
  return best;
})();
const FV_HH = FV_Z * Math.tan(15 * Math.PI / 180), FV_HW = FV_HH * W / H;
// FBOX: dove contano gli urti per scegliere l'asse; fuori dalla vista (+0,3) i frammenti non urtano più e non rientrano
const FBOX = [FVC[0], FVC[1], FV_HW - 0.2, FV_HH - 0.35], F_OPT = { v0: 8, drag: 0.3, keep: 0.8, vmin: 4.2, skip: [FN], maxT: 4, box: [FVC[0], FVC[1], FV_HW + 0.3, FV_HH + 0.3] };
const inBox = (c, [cx, cy, hw, hh]) => Math.abs(c.x - cx) < hw && Math.abs(c.y - cy) < hh;
const fSims = ax => [-1, 1].map(sg => { const dir = ax.clone().multiplyScalar(sg); return fragSim(PF.clone().addScaledVector(dir, HOLD), dir, F_GO, F_OPT); });
const FAX = (() => {
  let best = null, bs = -1e9;
  for (let a = -80; a <= 80; a += 2) {   // con +asse verso destra: il frammento di destra è FS[1]
    const ax = ang(a), sm = fSims(ax), ex = sm.map(q => exitTime(q, FBOX)), nc = sm.map((q, i) => q.contacts.filter(ct => ct.n && !ct.n.u && inBox(ct.c, FBOX) && ct.t < ex[i] + 0.05).length);
    // entrambi devono uscire presto dall'inquadratura (niente frammenti intrappolati), il destro dopo 2-3 urti, il sinistro dopo almeno 1
    const late = Math.max(0, ex[0] - F_GO - 1.4) + Math.max(0, ex[1] - F_GO - 1.8);
    const sc = Math.min(nc[0], 2) * 1.0 + Math.min(nc[1], 3) * 1.6 - (nc[0] < 1 || nc[1] < 2 ? 10 : 0) - late * 8 - Math.abs(ax.y) * 0.3;
    if (sc > bs) { bs = sc; best = ax; }
  }
  return best;
})();
prepFission(FO, F_HIT, FAX);
const FS = fSims(FAX);
const F_OUT = Math.max(...FS.map(q => exitTime(q, [FVC[0], FVC[1], FV_HW + 0.6, FV_HH + 0.6])));   // usciti dall'inquadratura: dissolvono fuori campo
FO.fade = t => t < F_GO ? 1 : 1 - smooth(ramp(t, F_OUT, F_OUT + 0.3)); FO.tRest = F_END;
console.log('distanza minima frammenti-nuclei', Math.min(...FS.flatMap(q => q.S.filter(([t]) => t < F_OUT).map(([, x, y]) => Math.min(...obstacles.map(o => Math.hypot(x - o.x, y - o.y)))))).toFixed(2), 'urti di F', FS.map(q => q.contacts.filter(ct => ct.t < exitTime(q, FBOX)).length).join('+'), 'uscita', FS.map(q => (exitTime(q, FBOX) - F_GO).toFixed(2)).join('/'), 'fissioni nella catena', EVENTS.length, 'neutroni', NEUT.length);
// tempi degli eventi (secondi di scaletta) per gli effetti sonori: audio/music4.py li legge da audio/events4.json (stampati da probe.js)
console.log('EVENTI ' + JSON.stringify({ chain: EVENTS.map(e => +e.hit.toFixed(3)), abs: NEUT.filter(n => n.end === 'abs').map(n => +n.t1.toFixed(3)), n3: N3.map(n => +n.t1.toFixed(3)), go3: +GO3.toFixed(3), f_in: +NEUT.filter(n => n.t1 === F_HIT)[0].t0.toFixed(3),
  f_bounce: FS.flatMap(q => q.contacts.filter(ct => ct.t < exitTime(q, FBOX)).map(ct => +ct.t.toFixed(3))).sort((a, b) => a - b), na_bounce: NA.sims.flatMap(q => q.contacts.map(ct => +ct.t.toFixed(3))) }));
FO.fragFn = (f, t) => t < F_GO ? FO.cent[f].clone().addScaledVector(FAX, (f ? 1 : -1) * (HOLD - FO.cent[f].length()) * smooth(ramp(t, F_HIT + 0.2, F_HIT + 1.3)))
  : FS[f].at(t).sub(PF);
// riscaldamento: un nucleo si scalda quando un frammento lo urta (molto) o gli passa vicino (un po'); poi resta caldo
// (anche i nuclei speciali che non si spaccano, come B: in B11 un frammento di F lo urta)
const heated = [...bg, ...NUCS.filter(n => n.obj && !n.u && n !== nG)].map(n => {
  if (xy(n.c, PF) > 5.5) return null;
  let tc = null, tp = null;
  FS.forEach(q => { q.contacts.forEach(ct => { if (ct.n === n && (tc === null || ct.t < tc)) tc = ct.t; });
    for (const [t, x, y] of q.S) if (Math.hypot(x - n.c.x, y - n.c.y) < 1.0) { if (tp === null || t < tp) tp = t; break; } });
  return tc === null && tp === null ? null : { n, tc, tp };
}).filter(Boolean);
const heatOf = (h, t) => Math.max(h.tc !== null ? smooth(ramp(t, h.tc, h.tc + 0.35)) : 0, h.tp !== null ? 0.5 * smooth(ramp(t, h.tp, h.tp + 0.5)) : 0);
const fSpeed = (f, t) => t <= F_GO ? 0 : FS[f].at(t).distanceTo(FS[f].at(t - 0.04)) / 0.04;
const heatGlows = heated.map(() => glow(0xff8a30, atomScene, 1.0));
// ---------------- plutonio (G): assorbe un neutrone che arriva da fuori, due decadimenti beta, poi si spacca
addNeutron(new THREE.LineCurve3(G_FROM, G_CAPT), G_IN[0], G_IN[1], 'cap');   // 'cap': all'arrivo diventa il nucleone in più di G (captG) e il neutrone libero sparisce
addNeutron(new THREE.LineCurve3(PU_FROM, PU_TO), 70.9, PU_HIT, 'hit');
// fissione del plutonio: frammenti e neutroni escono dall'inquadratura (niente dissolvenze, niente neutroni che restano fermi)
nG.hit = PU_HIT; prepFission(NG, PU_HIT, V(1, 1, 0)); emit(nG, PU_HIT, 2, false, true);
// frammenti del plutonio: non dissolvono, escono dall'inquadratura (rallentando appena)
NG.sims = [0, 1].map(f => { const dir = NG.axis.clone().multiplyScalar(f ? 1 : -1); return fragSim(PG.clone().add(NG.cent[f]), dir, PU_HIT + 0.1, { v0: 6, drag: 0.4, keep: 0.75, vmin: 2.8, skip: [nG], maxT: 5, box: [PG.x + 0.2, PG.y + 0.4, 1.8, 3.0] }); });
NG.fragFn = (f, t) => NG.sims[f].at(t).sub(PG); NG.tRest = PU_HIT + 1.5;
const PU_OUT = Math.max(...NG.sims.map(q => exitTime(q, [PG.x + 0.2, PG.y + 0.4, 2.0, 3.2])));   // fuori campo: dissolvono dove non si vede
NG.fade = t => 1 - smooth(ramp(t, PU_OUT, PU_OUT + 0.3));
const FISSIONED = [nA, ...EVENTS, FN, nG];
const flashes = FISSIONED.map(e => { const s = glow(0xfff0c0, atomScene, 2.2); s.position.copy(e.c); s.position.z += 0.3; s.userData.o = e.obj; return s; });
// scie dei frammenti di F (B10–B11)
const TRAIL = 9;
const trails = [0, 1].map(() => Array.from({ length: TRAIL }, () => glow(0xffc070, atomScene, 0.5)));
// decadimenti beta (B12): un neutrone diventa protone ed esce un elettrone
const betas = FLIP_T.map(() => mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshStandardMaterial({ color: 0xfff6c0, emissive: 0xffe060, emissiveIntensity: 2.5 }), atomScene));
const flipFlash = FLIP_T.map(() => glow(0xfff0a0, NG.g, 0.7));
// targhette (solo in questa puntata): ovali, senza punta
function makeLabel(text) {
  const font = '700 84px Poppins', c = document.createElement('canvas'), g0 = c.getContext('2d'); g0.font = font;
  const w = Math.ceil(g0.measureText(text).width) + 150, h = 172; c.width = w; c.height = h;
  const g = c.getContext('2d'), lw = 10, r = h / 2;
  g.beginPath(); g.arc(r, r, r - lw / 2, Math.PI / 2, -Math.PI / 2); g.lineTo(w - r, lw / 2); g.arc(w - r, r, r - lw / 2, -Math.PI / 2, Math.PI / 2); g.closePath();
  g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = lw; g.strokeStyle = '#0c1c4a'; g.stroke();
  g.fillStyle = '#0c1c4a'; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 6);
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, transparent: true, depthTest: false, depthWrite: false }));
  s.renderOrder = 50; s.userData.ar = w / h; atomScene.add(s); return s;
}
const LABELS = [[makeLabel('Uranio 235'), NA, 8.9, 11.9], [makeLabel('Uranio 238'), NB, 10.9, 13.6], [makeLabel('Uranio 238'), NG, 62.5, 63.9], [makeLabel('Plutonio 239'), NG, PU_ON + 0.2, PU_ON + 3.4]];

// ============================================================ PRIMO PIANO: mascotte e icone (camera fissa)
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
  const P = mouthGeo.attributes.position.array, T = tongueGeo.attributes.position.array;
  for (let i = 0; i <= MX; i++) {
    const u = i / MX * 2 - 1, x = u * w, k = 1 - u * u;
    const yb = cy + s * 0.13 * u * u - s * 0.05;
    const yu = yb + (th + o * 0.045) * k, yl = yb - (th + o * 0.36) * Math.pow(k, 0.75);
    for (let j = 0; j <= MY; j++) {
      const y = lerp(yl, yu, j / MY), n = (i * (MY + 1) + j) * 3;
      P[n] = x; P[n + 1] = y; P[n + 2] = onSphere(x, y, 1.012);
      const ty = lerp(yl, lerp(yl, yu, 0.42), j / MY), tx = x * 0.62;
      T[n] = tx; T[n + 1] = ty; T[n + 2] = onSphere(tx, ty, 1.016);
    }
  }
  mouthGeo.attributes.position.needsUpdate = true; tongueGeo.attributes.position.needsUpdate = true;
  tongue.visible = o > 0.3;
}
const hands = [-1, 1].map(() => mesh(new THREE.SphereGeometry(0.2, 24, 18), bodyM, mascot));
// icone (dischi bianchi con bordo blu, come nella puntata 3)
const discM = basic(0xffffff, { transparent: true, opacity: 0.95 });
const ringM = basic(0x2f7df0);
function icon(x, y, r = 0.42) {
  const g = new THREE.Group(); g.position.set(x, y, 0.2); hud.add(g);
  mesh(new THREE.CircleGeometry(r, 64), discM, g, V(0, 0, -0.3)); mesh(new THREE.RingGeometry(r, r + 0.035, 64), ringM, g, V(0, 0, -0.3));
  const c = new THREE.Group(); c.scale.setScalar(r / 0.42); g.add(c); return { g, c, r };
}
const showIcon = (ic, a) => { ic.g.visible = a > 0.001; ic.g.scale.setScalar(Math.max(0.001, a)); };
const COLD = new THREE.Color(0x3f9be8), HOT = new THREE.Color(0xff5a2a);
function makeThermo(parent) {
  const g = new THREE.Group(); g.position.x = -0.035; parent.add(g);
  const edge = std(0x2f5fb0, { roughness: 0.5 }), glass = std(0xf4f7fc, { roughness: 0.3 });
  mesh(new THREE.CapsuleGeometry(0.078, 0.4, 6, 20), edge, g, V(0, 0.06, -0.04)); mesh(new THREE.SphereGeometry(0.13, 24, 16), edge, g, V(0, -0.22, -0.04));
  mesh(new THREE.CapsuleGeometry(0.055, 0.4, 6, 20), glass, g, V(0, 0.06, 0));
  const liqM = new THREE.MeshStandardMaterial({ color: 0x3f9be8, emissive: 0x3f9be8, emissiveIntensity: 0.45, roughness: 0.4 });
  mesh(new THREE.SphereGeometry(0.1, 24, 16), liqM, g, V(0, -0.22, 0.02));
  const geo = new THREE.CylinderGeometry(0.033, 0.033, 1, 16); geo.translate(0, 0.5, 0);
  const liq = mesh(geo, liqM, g, V(0, -0.2, 0.05));
  const cap = mesh(new THREE.SphereGeometry(0.033, 12, 10), liqM, g, V(0, 0, 0.05));
  for (let i = 0; i < 4; i++) mesh(new THREE.BoxGeometry(i % 2 ? 0.06 : 0.09, 0.016, 0.02), edge, g, V(0.15 + (i % 2 ? -0.015 : 0), -0.04 + i * 0.095, 0));
  return { g, set(u) { const h = lerp(0.1, 0.46, u); liq.scale.y = h; cap.position.y = -0.2 + h; liqM.color.copy(COLD).lerp(HOT, u); liqM.emissive.copy(liqM.color); } };
}
// torta: un terzo dell'energia viene dal plutonio (B13). Disco piatto azzurro (uranio) e spicchio verde di 120° (plutonio, come il suo alone)
// che si apre in senso orario a partire dalle ore 12; due righe bianche separano gli spicchi.
function makePie(parent) {
  const g = new THREE.Group(); parent.add(g);
  const R = 0.31, TH = 2 * Math.PI / 3;
  mesh(new THREE.CircleGeometry(R, 72), basic(0x58b0ff), g, V(0, 0, 0.01));
  const slice = mesh(new THREE.CircleGeometry(R, 72, Math.PI / 2 - TH, TH), basic(0x4ccf78), g, V(0, 0, 0.02));
  const sep = [Math.PI / 2, Math.PI / 2 - TH].map(a => { const m = mesh(new THREE.PlaneGeometry(R, 0.016), basic(0xffffff), g, V(Math.cos(a) * R / 2, Math.sin(a) * R / 2, 0.03)); m.rotation.z = a; return m; });
  return { g, set(u) {
    const th = Math.max(0.001, TH * u); slice.geometry.dispose(); slice.geometry = new THREE.CircleGeometry(R, 72, Math.PI / 2 - th, th);
    sep[1].position.set(Math.cos(Math.PI / 2 - th) * R / 2, Math.sin(Math.PI / 2 - th) * R / 2, 0.03); sep[1].rotation.z = Math.PI / 2 - th; sep.forEach(m => { m.visible = u > 0.02; });
  } };
}
const icT2 = icon(-1.14, -0.97, 0.31), thermo2 = makeThermo(icT2.c);
const icPie = icon(0, 1.55, 0.5), pie = makePie(icPie.c);
const PAR = 1 - (11 - 0.2) / (11 + 0.1);
const centerIcons = () => [icT2, icPie].forEach(ic => ic.c.position.set(-ic.g.position.x * PAR, -(ic.g.position.y - 0.2) * PAR, 0));

const composer = new EffectComposer(renderer); composer.setSize(W, H);
const worldPass = new RenderPass(scene, camera); composer.addPass(worldPass);
{ const p = new RenderPass(hud, hudCam); p.clear = false; p.clearDepth = true; composer.addPass(p); }
composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), 0.45, 0.5, 1.0));
composer.addPass(new OutputPass());
const startOverlay = mesh(new THREE.PlaneGeometry(4, 4), basic(0x2f86e6, { transparent: true, opacity: 0, depthTest: false, depthWrite: false }), hudCam, V(0, 0, -1)); startOverlay.renderOrder = 1000;

// ============================================================ TEMPI (secondi "di scaletta", bozza 1 con le modifiche dell'autore e le correzioni dell'animazione)
// B1 0,2–0,8 · B2 1,3–4,0 · B3 5,0–12,1 · B4 12,6–16,2 · B5 16,7–21,2 · B6 (muta) 21,7–23,9 · B7 24,0–28,9 · B8 29,4–35,6
// B9 36,1–41,4 (reazione a catena) · B10 43,5–49,1 · B11 49,6–54,9 · barrette che si scaldano 56,6–61,0
// B12 62,8–68,3 · B13 68,8–77,5 · B14 78,0–82,7 · paesaggio fino a 84,2
const SPEECH = [[0.2, 0.8], [1.3, 4.0], [5.0, 7.0], [7.15, 8.6], [8.7, 12.1], [12.6, 13.7], [13.85, 16.2], [16.7, 17.8], [17.95, 21.2],
  [24.0, 26.7], [26.85, 28.9], [29.4, 31.5], [31.65, 33.2], [33.35, 35.6], [36.1, 37.7], [37.85, 41.4],
  [43.5, 44.6], [44.75, 46.2], [46.35, 49.1], [49.6, 51.8], [51.95, 54.9],
  [62.8, 64.4], [64.55, 66.4], [66.55, 68.3], [68.8, 70.0], [70.15, 72.9], [73.05, 77.5], [78.0, 78.6], [78.75, 82.7]];
const speechEnv = t => { let e = 0; for (const [a, b] of SPEECH) e = Math.max(e, Math.min(ramp(t, a, a + 0.07), 1 - ramp(t, b - 0.09, b))); return e; };
let LIP = LIP4;   // labiale dalla voce reale (audio/voice_ep4.py), 30 fps in tempo reale
function lip(tn, t) {
  if (LIP) { const fi = Math.min(LIP.open.length - 1, Math.max(0, Math.round(tn * 30))); return { open: LIP.open[fi], narrow: LIP.narrow[fi], env: LIP.env[fi] }; }
  const env = speechEnv(t), syl = Math.floor(t * 5.5), u = t * 5.5 - syl;
  return { env, open: env * Math.sin(u * Math.PI) ** 0.7 * (0.55 + 0.45 * hash(syl)), narrow: env * (0.25 + 0.6 * hash(syl + 50)) };
}
const END = 84.2;
const BLINKS = []; for (let b = 3.1; b < END - 2; b += 3.3 + hash(b) * 0.8) if (b < 21.4 || b > 25.2) BLINKS.push(b);
// WARP: [tempo di scaletta, tempo reale], dai tempi reali delle frasi registrate.
const WARP = [[0,  0],  [0.2,  0.3],  [0.8,  0.81],  [1.3,  1.59],  [4.0,  3.74],  [5.0,  4.92],  [7.0,  6.55],  [7.15,  7.11],  [8.6,  8.07],  [8.7,  8.46],  [12.1,  11.44],  [12.6,  12.34],  [16.2,  16.43],  [16.7,  17.33],  [21.2,  21.38],  [21.3,  22.28],  [21.7,  24.65],  [23.0,  25.95],  [24.0,  27.1],  [28.9,  32.7],  [29.4,  33.6],  [33.7,  38.64],  [35.6,  40.82],  [36.1,  41.72],  [41.4,  45.8],  [43.5,  47.9],  [46.3,  50.9],  [49.1,  53.9],  [49.6,  54.8],  [54.9,  60.21],  [62.8,  68.11],  [68.3,  72.91],  [68.8,  73.73],  [72.6,  76.48],  [77.5,  82.77],  [78.0,  83.67],  [78.85,  84.62],  [82.7,  87.9],  [84.2,  89.4]];   // da audio/warp4.py (voce dell'autore)
function unwarp(tn) { for (let i = 0; i < WARP.length - 1; i++) { const [o0, n0] = WARP[i], [o1, n1] = WARP[i + 1]; if (tn <= n1) return o0 + (o1 - o0) * (tn - n0) / (n1 - n0); } return END; }
function fwarp(t) { for (let i = 0; i < WARP.length - 1; i++) { const [o0, n0] = WARP[i], [o1, n1] = WARP[i + 1]; if (t <= o1) return n0 + (n1 - n0) * (t - o0) / (o1 - o0); } return WARP[WARP.length - 1][1]; }
const rt = keys => keys.map(([k, v]) => [fwarp(k), v]);
window.WARP = WARP;

// quale mondo si vede: passaggi con un lampo chiaro centrato sul cambio. [tempo, mondo, intensità del lampo, mezza durata]
const SWITCH = [[3.35, 'rod', 1, 0.28], [4.75, 'atom', 1, 0.28], [56.6, 'rod', 0.5, 0.22], [61.0, 'atom', 0.5, 0.22], [78.85, 'rod', 0.6, 0.25], [79.95, 'world', 0.8, 0.28]];
const worldAt = t => { let w = 'world'; for (const [s, n] of SWITCH) if (t >= s) w = n; return w; };
const fadeAt = t => { let f = 0; for (const [s, , k, d] of SWITCH) f = Math.max(f, k * clamp01(1 - Math.abs(t - s) / d) ** 0.8); return f; };
// zoom "a velocità costante": la distanza cambia in proporzione (scala logaritmica), così entrare e uscire sembra fluido
const logZ = (z0, z1, u) => z0 * Math.pow(z1 / z0, u);
const ein = u => clamp01(u) ** 2, eout = u => 1 - (1 - clamp01(u)) ** 2;
// camere (tempo reale con chiavi spostate da WARP)
const CAM_WIDE = [-1, 3.8, 11, -1, 3.0, -40], CAM_CORE = [2.95, 2.45, -33.0, 2.95, 2.34, -39.75], CAM_PUSH = [2.95, 2.34, -38.8, 2.95, 2.34, -39.75];
const CAM_W = track(rt([[1.2, CAM_WIDE], [2.75, CAM_CORE], [3.4, CAM_PUSH], [79.95, CAM_PUSH], [80.7, CAM_CORE], [82.4, CAM_WIDE]]));
const DOME = track(rt([[1.0, 1], [2.0, 0.1], [81.3, 0.1], [82.2, 1]]));
// barrette: entrata (B2); in B11 si esce lentamente fino a vedere le barrette nell'acqua che si scalda, poi si rientra in una pastiglia; uscita (B14)
const ROD_IN = track(rt([[3.35, [0, 0.5, 30, 0, 0.3]], [4.75, [0, 0.0, 0.95, 0, 0]]]));
function rodCamAt(tn) {
  const R1 = [fwarp(56.6), fwarp(59.2), fwarp(59.8), fwarp(61.0)], R2 = [fwarp(78.85), fwarp(79.95)];
  if (tn < R1[0] - 1) return ROD_IN(tn);
  if (tn < R1[1]) { const u = eout(ramp(tn, R1[0], R1[1])); return [lerp(0, 0.2, u), lerp(0, 0.6, u), logZ(0.9, 26, u), 0, lerp(0, 0.4, u)]; }
  if (tn < R1[2]) { const u = ramp(tn, R1[1], R1[2]); return [0.2 - 0.03 * u, 0.6 - 0.03 * u, 26 - 0.6 * u, 0, 0.4]; }
  if (tn < R2[0] - 1) { const u = ein(ramp(tn, R1[2], R1[3])); return [lerp(0.17, 0, u), lerp(0.57, 0, u), logZ(25.4, 0.95, u), 0, lerp(0.4, 0, u)]; }
  const u = eout(ramp(tn, R2[0], R2[1])); return [lerp(0, 0.2, u), lerp(0, 0.7, u), logZ(1.2, 29, u), 0, lerp(0, 0.5, u)];
}
const view = (x, y, z) => [x, y, z, x, y];
const CLOSE_AB = view(-0.2, 0.6, 11), CLOSE_B = view(-0.8, -0.25, 6.2), WIDE = view(0, 0.3, 38), ACTION = view(0, 0.3, 17), CHAINV = view(CH.x, CH.y, 60),
  CLOSE_G = view(PG.x, PG.y - 0.05, 6.2), PU_V = view(PG.x + 0.2, PG.y + 0.4, 10);
const FV = view(FVC[0], FVC[1], FV_Z);
const ATOM_TRACK = track(rt([[4.75, view(-0.2, 0.6, 26)], [5.9, CLOSE_AB], [12.4, CLOSE_AB], [13.3, CLOSE_B], [16.5, CLOSE_B], [17.9, WIDE], [20.3, WIDE], [21.5, ACTION],
  [35.7, ACTION], [37.8, CHAINV], [41.3, CHAINV], [43.0, FV], [54.9, FV], [62.6, CLOSE_G], [68.6, CLOSE_G], [69.6, PU_V], [78.0, PU_V]]));
function atomCamAt(tn) {
  const A1 = [fwarp(54.9), fwarp(56.6)], A2 = [fwarp(61.0), fwarp(62.6)], A3 = [fwarp(78.0), fwarp(78.85)];
  if (tn > A1[0] && tn < A1[1] + 0.5) { const u = ein(ramp(tn, A1[0], A1[1])); return [FV[0], FV[1], logZ(13, 34, u), FV[3], FV[4]]; }
  if (tn > A2[0] - 0.5 && tn < A2[1]) { const u = eout(ramp(tn, A2[0], A2[1])); return [CLOSE_G[0], CLOSE_G[1], logZ(30, 6.2, u), CLOSE_G[3], CLOSE_G[4]]; }
  if (tn > A3[0]) { const u = ein(ramp(tn, A3[0], A3[1])); return [PU_V[0], PU_V[1], logZ(10, 32, u), PU_V[3], PU_V[4]]; }
  return ATOM_TRACK(tn);
}
// mascotte
const CORNER = [0.82, -0.99, 0.17];
const R0 = [1.2, -0.3, 0.35], WAVE = [1.32, 0.8, 0.3], POINT = [1.62, 0.32, 0.3];
const T = {
  pos: track([[0, [0, 0.2, 0.8]], [0.92, [0, 0.2, 0.8]], [1.45, CORNER]]),
  smile: track([[0, 1], [1.4, 0.95], [5, 0.8], [21.2, 0.8], [21.6, 0.55], [23.0, 0.55], [23.8, 0.25], [24.9, 0.25], [25.4, 0.8], [77.8, 0.8], [78.4, 1], [END, 1]]),
  browY: track([[0, 0.1], [1.4, 0.07], [21.2, 0.07], [21.5, -0.01], [23.0, -0.01], [23.8, 0.12], [24.9, 0.12], [25.4, 0.07], [78.0, 0.07], [78.5, 0.11], [END, 0.09]]),
  gaze: track([[0, [0, 0]], [1.3, [0, 0]], [1.8, [-0.6, 0.6]], [21.3, [-0.6, 0.6]], [21.6, [-0.7, 0.75]], [23.8, [0, 0]], [24.9, [0, 0]], [25.3, [-0.6, 0.6]],
    [77.8, [-0.6, 0.6]], [78.2, [0, 0]], [78.4, [0.85, 0.25]], [80.6, [0.85, 0.25]], [81.0, [0, 0]], [END, [0, 0]]]),
  handR: track([[0, R0], [0.12, WAVE], [0.9, WAVE], [1.35, R0], [78.2, R0], [78.6, POINT], [80.4, POINT], [80.9, R0], [81.6, R0], [81.9, WAVE], [END, WAVE]]),
};
const FLY0 = 21.7, BACK = 23.8, EXIT = 82.7;
const _v = new THREE.Vector3();
const toHud = p => { _v.copy(p).project(atomCam); const k = 11 * Math.tan(15 * Math.PI / 180); return [_v.x * k * W / H, 0.2 + _v.y * k]; };
const SPECIALS = NUCS.filter(n => n.obj);
// quando i frammenti di ogni nucleo hanno finito di muoversi (poi brillano meno)
const restAt = e => e.obj && e.obj.tRest !== undefined ? e.obj.tRest : (e.hit || 0) + 2.1;

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
      m.scale.setScalar(d.s * (0.95 + ph * 1.9)); m.material.opacity = 0.55 * Math.min(1, ph * 6) * (1 - ph);
    }
    waveFlag(tn);
    const dOp = DOME(tn); domeFront.opacity = bandFront.opacity = dOp; domeFront.depthWrite = bandFront.depthWrite = dOp > 0.99;
    coreM.emissiveIntensity = 2.3 * (1 + 0.08 * Math.sin(tn * 7)); coreGlow.material.opacity = 0.38 * (1 - dOp);
    primDrops.forEach((m, i) => { primLoop.getPointAt((i / primDrops.length + tn * 0.19) % 1, m.position); m.position.z += 0.02; });
    cableDots.forEach((d, i) => cableCurve.getPointAt((tn * 0.42 + i / cableDots.length) % 1, d.position));
  }
  // ---------------- MONDO 2: barrette
  if (where === 'rod') {
    worldPass.scene = rodScene; worldPass.camera = rodCam;
    const c = rodCamAt(tn); rodCam.position.set(c[0], c[1], c[2]); rodCam.lookAt(c[3], c[4], 0);
    const near = clamp01((4 - rodCam.position.z) / 2.6); cladMid.opacity = 0.3 * (1 - near); cladMid.visible = near < 0.99;
    const warm = t < 70 ? smooth(ramp(t, 56.9, 58.6)) : 0.15;
    waterBg.uniforms.top.value.copy(WATER_C[0]).lerp(WARM_C[0], warm); waterBg.uniforms.bottom.value.copy(WATER_C[1]).lerp(WARM_C[1], warm);
    pelM.emissiveIntensity = 0.06 + 0.16 * warm + 0.05 * Math.sin(tn * 7);
    rodGlows.forEach((g, i) => { g.material.opacity = (i < 5 ? 0.16 : 0.08) * warm; });
    rodBubbles.forEach(m => { const d = m.userData, u = (tn * 0.3 + d.ph) % 1; m.position.set(d.x + Math.sin(u * 12 + d.ph * 9) * 0.05, -5 + u * 10, d.z); });
    flowLines.forEach(m => { const d = m.userData, u = (tn * d.v + d.ph) % 1; m.position.set(d.x, -6 + u * 12, d.z); m.material.opacity = 0.28 * Math.sin(u * Math.PI); });
    heatPuffs.forEach(s => { const d = s.userData, u = (tn * 0.45 + d.ph) % 1; s.position.set(d.r + (d.ph > 0.5 ? 1 : -1) * (0.35 + u * 0.3), d.y + u * 2.2, 0.5); s.material.opacity = 0.85 * warm * Math.sin(u * Math.PI); s.scale.setScalar(0.7 + 0.6 * u); });
  }
  // ---------------- MONDO 3: atomi
  if (where === 'atom') {
    worldPass.scene = atomScene; worldPass.camera = atomCam;
    const c = atomCamAt(tn); atomCam.position.set(c[0] + Math.sin(tn * 0.3) * 0.04, c[1] + Math.sin(tn * 0.23) * 0.03, c[2]); atomCam.lookAt(c[3], c[4], 0); atomCam.updateMatrixWorld();
    const zoomK = 1 + Math.max(0, atomCam.position.z - 12) / 12;          // da lontano aloni e neutroni si ingrandiscono, per restare visibili
    // nuclei di sfondo vicini ai frammenti di F: tremano e diventano arancioni (B11)
    heated.forEach((hd, k) => {
      const h = heatOf(hd, t), vib = 0.06 * h, ph = hd.n.ph || k; hd.n.heat = h;
      hd.n.ox = Math.sin(tn * 23 + ph) * vib; hd.n.oy = Math.cos(tn * 19 + ph * 1.3) * vib;
      if (hd.n.obj) {   // nucleo speciale (oggetto a sé): si sposta il gruppo e si scaldano i colori dei suoi nucleoni
        const o = hd.n.obj; o.g.position.set(hd.n.c.x + hd.n.ox, hd.n.c.y + hd.n.oy, hd.n.c.z);
        if (h > 0.001) o.parts.forEach(pt => { if (!pt.hm) pt.hm = pt.m.material.clone(); pt.m.material = pt.hm; pt.hm.color.copy(pt.isP ? C_P : C_N).lerp(C_HOT, h * (pt.isP ? 0.6 : 0.75)); if (!pt.isP) pt.hm.emissive.copy(C_EM_N).lerp(C_EM_HOT, h); });
      } else placeBg(hd.n, hd.n.ox, hd.n.oy, h);
      heatGlows[k].position.set(hd.n.c.x, hd.n.c.y, hd.n.c.z + 0.2); heatGlows[k].material.opacity = 0.5 * h; heatGlows[k].scale.setScalar(0.9 + 0.3 * h);
    });
    instP.instanceMatrix.needsUpdate = instN.instanceMatrix.needsUpdate = true; instP.instanceColor.needsUpdate = instN.instanceColor.needsUpdate = true;
    // nuclei speciali: U-235 (alone giallo), G (alone verde quando diventa plutonio)
    const haloOn = smooth(ramp(t, 8.9, 9.4));
    SPECIALS.forEach((sn, si) => {
      const n = sn.obj;
      let hal = sn.u ? haloOn : sn === nG ? smooth(ramp(t, PU_ON, PU_ON + 0.5)) : 0;
      if (n.hit) hal *= 1 - ramp(t, n.hit, n.hit + 0.15);
      n.halo.material.opacity = 0.6 * hal * (1 + 0.15 * Math.sin(tn * 5 + si)); n.halo.scale.setScalar(1.25 * Math.min(zoomK, 2.2));
      const jig = 0.008 * hal;
      const hit = n.hit, e = hit ? smooth(ramp(t, hit, hit + 0.45)) : 0, wob = hit ? ramp(t, hit - 0.2, hit) * (1 - ramp(t, hit, hit + 0.12)) : 0;
      const fade = hit && n.fade && t >= hit ? n.fade(t) : 1;
      n.g.visible = fade > 0.001; if (!n.g.visible) return;
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
        const ra = restAt(sn); s.material.opacity = fade * lerp(0.75, 0.22, smooth(ramp(t, ra - 0.6, ra + 0.4))); s.scale.setScalar(0.9 * Math.min(zoomK, 2));
      });
    });
    // neutroni catturati: compaiono come nucleone in più quando il neutrone arriva
    captB.m.visible = t >= N3[0].t1; captG.m.visible = t >= G_IN[1];
    // B4: i 3 neutroni in più dell'U-238 lampeggiano
    const ex = win(t, 14.4, 16.4, 0.3) * (0.5 + 0.5 * Math.sin((t - 14.4) * 9));
    EXTRA3.forEach((pt, k) => { pt.m.material.emissive.setHex(ex > 0.001 ? 0x9fd8ff : 0x1c5fb8); pt.m.material.emissiveIntensity = 0.35 + 1.4 * ex; pt.m.scale.setScalar(1 + 0.3 * ex); extraGlows[k].position.copy(pt.m.position); extraGlows[k].material.opacity = 0.7 * ex; });
    // B12: due neutroni di G diventano protoni (decadimenti beta), con un elettrone che scappa
    FLIP.forEach((pt, k) => {
      const tf = FLIP_T[k];
      pt.m.material = t >= tf ? protM : pt.orig;
      flipFlash[k].position.copy(pt.m.position); flipFlash[k].material.opacity = t > tf ? 0.9 * Math.max(0, 1 - (t - tf) / 0.5) : 0;
      const b = betas[k], u = t - tf; b.visible = u > 0 && u < 0.9 && t < PU_HIT;
      if (b.visible) { const dir = k === 0 ? V(0.25, -1, 0.05) : V(pt.p.x, pt.p.y, 0).normalize().add(V(0, 0, 0.05)); b.position.copy(PG).add(pt.p).addScaledVector(dir.normalize(), u * 2.6); }
    });
    // neutroni della prima fissione: fermi accanto ad A durante B7, poi partono tutti insieme
    N3.forEach((n, k) => {
      const t0 = HIT + 0.55;
      n.m.visible = t > t0 && t < n.t1; if (!n.m.visible) return;
      if (t < n.go) { const out = 1 - (1 - ramp(t, t0, t0 + 1.1)) ** 3; n.m.position.copy(PA).setZ(0.12).lerp(n.hov, out).add(V(Math.sin(tn * 2.1 + k * 2) * 0.03, Math.cos(tn * 1.7 + k) * 0.03, 0)); }
      else n.m.position.copy(n.curve.getPointAt(ramp(t, n.go, n.t1)));
      if (n.flash) { n.flash.position.copy(n.curve.getPointAt(1)); }
    });
    N3.forEach(n => { if (n.flash) n.flash.material.opacity = t > n.t1 ? 0.8 * Math.max(0, 1 - (t - n.t1) / 0.45) : 0; });
    // tutti gli altri neutroni: viaggiano lungo il loro percorso; quelli assorbiti restano attaccati al nucleo
    NEUT.forEach(n => {
      const u = ramp(t, n.t0, n.t1);
      n.m.visible = t > n.t0 && (n.end === 'abs' || t < n.t1);
      if (!n.m.visible) { if (n.flash) { n.flash.position.copy(n.curve.getPointAt(1)); n.flash.material.opacity = t > n.t1 ? 0.8 * Math.max(0, 1 - (t - n.t1) / 0.45) : 0; } return; }
      n.m.position.copy(n.curve.getPointAt(u)); n.m.scale.setScalar(t < n.t1 ? Math.min(zoomK, 2.2) : 1);
      if (n.nuc && t >= n.t1 && n.nuc.ox !== undefined) {   // assorbito da un nucleo caldo: vibra e si scalda con lui
        n.m.position.x += n.nuc.ox; n.m.position.y += n.nuc.oy;
        if (n.nuc.heat > 0.001) { if (!n.hm) n.hm = neutM.clone(); n.m.material = n.hm; n.hm.color.copy(C_N).lerp(C_HOT, n.nuc.heat * 0.75); n.hm.emissive.copy(C_EM_N).lerp(C_EM_HOT, n.nuc.heat); }
      }
      if (n.flash) { n.flash.position.copy(n.m.position); n.flash.material.opacity = t > n.t1 ? 0.8 * Math.max(0, 1 - (t - n.t1) / 0.45) : 0; }
    });
    flashes.forEach(s => { const o = s.userData.o; s.material.opacity = o.hit && t > o.hit ? 0.95 * Math.max(0, 1 - (t - o.hit) / 0.5) : 0; s.scale.setScalar((2.2 + 2 * ramp(t, o.hit, o.hit + 0.5)) * Math.min(zoomK, 2.5)); });
    // scie dei frammenti di F
    trails.forEach((tr, f) => tr.forEach((s, k) => {
      const tt = t - (k + 1) * 0.03, sp = fSpeed(f, t);
      s.visible = sp > 0.5; if (!s.visible) return;
      s.position.copy(FO.fragFn(f, tt)).add(PF); s.position.z += 0.1; s.material.opacity = Math.min(1, sp / 4) * 0.55 * (1 - k / TRAIL); s.scale.setScalar(0.5 * (1 - k / TRAIL * 0.6));
    }));
    // targhette: ovali, sopra il nucleo, circa 3 s
    LABELS.forEach(([s, n, a, b]) => {
      const v = pop(t, a, b, 0.35, 0.45); s.visible = v > 0.001; if (!s.visible) return;
      const hgt = 0.3 * v; s.scale.set(hgt * s.userData.ar, hgt, 1); s.position.copy(n.g.position).add(V(0, 0.55, 0.3)); s.material.opacity = Math.min(1, v * 1.5);
    });
  }

  // ---------------- PRIMO PIANO: icone
  showIcon(icT2, pop(t, 50.2, 58.9)); thermo2.set(smooth(ramp(t, 50.8, 53.6)));
  showIcon(icPie, pop(t, 73.4, 77.6, 0.4, 0.35)); pie.set(smooth(ramp(t, 74.2, 75.0)));
  // ---------------- mascotte: grande al centro per il saluto, poi piccola in basso a destra; in B6 diventa il proiettile
  let [mx, my, ms] = T.pos(t);
  if (t > FLY0 && t < BACK) {
    if (t < HIT) {
      const u = ramp(t, FLY0, HIT) ** 1.6, [tx, ty] = toHud(PA), cx = 0.55, cy = 1.6;
      mx = (1 - u) ** 2 * CORNER[0] + 2 * u * (1 - u) * cx + u * u * tx; my = (1 - u) ** 2 * CORNER[1] + 2 * u * (1 - u) * cy + u * u * ty; ms = lerp(0.17, 0.1, u);
    } else ms = 0;
  }
  if (t >= BACK) ms *= backOut(ramp(t, BACK, BACK + 0.35));
  ms *= backOut(ramp(t, 0.0, 0.35)) * (1 - smooth(ramp(t, EXIT - 0.25, EXIT)));
  const bob = Math.sin(tn * 1.9) * 0.07 * ms;
  mascot.position.set(mx, my + bob + smooth(ramp(t, EXIT - 0.4, EXIT)) * 0.08, 0); mascot.scale.setScalar(Math.max(0.001, ms)); mascot.visible = ms > 0.001 && t < EXIT;
  mascot.rotation.z = t > FLY0 && t < HIT ? -0.5 * ramp(t, FLY0, HIT) : 0;
  const L = lip(tn, t), env = L.env;
  const [gx, gy] = T.gaze(t);
  const dazed = win(t, BACK, 24.9, 0.15);
  head.rotation.set(-gy * 0.3 + env * Math.sin(tn * 5.2) * 0.035, gx * 0.36 + dazed * Math.sin(tn * 14) * 0.35, Math.sin(tn * 1.1) * 0.05 + env * Math.sin(tn * 2.6) * 0.04 - gx * 0.06 + dazed * Math.sin(tn * 9) * 0.15);
  let blink = 0; for (const b of BLINKS) blink = Math.max(blink, 1 - Math.abs(t - b) / 0.085);
  blink = clamp01(blink);
  const smile = T.smile(t), squint = 0.1 * Math.max(0, smile - 0.6) / 0.4 + 0.5 * dazed;
  for (const e of eyes) { e.g.scale.set(1.05, 1.05 * Math.max(0.07, (1 - blink) * (1 - squint)), 1); e.pupil.position.set(gx * 0.075 - e.sd * 0.018 + dazed * Math.sin(tn * 11 + e.sd) * 0.05, gy * 0.085 + dazed * Math.cos(tn * 11) * 0.05, 0); }
  const by = T.browY(t);
  for (const b of brows) { const x = b.sd * 0.35, y = 0.535 + by + blink * -0.015; b.m.position.set(x, y, onSphere(x, y, 1.03)); b.m.rotation.set(-0.45, b.sd * 0.3, b.sd * 0.03 + b.sd * -0.06 + (by < 0.03 ? -b.sd * 0.25 : 0)); }
  const open = L.open * 0.78, narrow = L.narrow * 0.32;
  setMouth((0.29 + 0.06 * Math.max(0, smile)) * (1 - narrow), smile * (1 - 0.35 * open), open);
  const hr = T.handR(t), wave = win(t, 0.15, 1.0, 0.2) + win(t, 81.8, 82.6, 0.2), point = win(t, 78.6, 80.5, 0.25), talk = env * 0.04;
  hands[1].position.set(hr[0] + wave * Math.sin(t * 13) * 0.2 + point * Math.abs(Math.sin(t * 6.5)) * 0.1, hr[1] + Math.sin(tn * 2.3) * 0.03 + talk * Math.sin(tn * 6.1) + bob * 0.3, hr[2]);
  hands[0].position.set(-R0[0], R0[1] + Math.sin(tn * 2.3 + 1.7) * 0.03 + talk * Math.sin(tn * 5.3 + 2) + bob * 0.3, R0[2]);
  centerIcons();
  startOverlay.material.opacity = 1 - ramp(t, 0, 0.3);
  composer.render();
};
window.DURATION = WARP[WARP.length - 1][1];
// ------------------------------------------------------------ copertina (ep4.html?cover=1&t=..&cx=..&cy=..&cz=..)
// t è il tempo reale del video (dopo WARP); niente mascotte e niente icone. Il titolo si aggiunge con make_cover4.py.
if (q.get('cover')) {
  const base = window.renderFrame;
  window.renderFrame = function () {
    base(+(q.get('t') || 24.6));
    hud.visible = false; fadeMat.opacity = 0;
    if (q.get('cx')) {   // senza cx resta l'inquadratura del video in quell'istante
      const cx = +q.get('cx'), cy = +(q.get('cy') || PA.y + 0.9), cz = +(q.get('cz') || 7);
      atomCam.position.set(cx, cy, cz); atomCam.lookAt(cx, cy, 0); atomCam.updateMatrixWorld();
    }
    composer.render();
  };
}
window.renderFrame(0);
window.ready = true;
