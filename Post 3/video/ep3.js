// Puntata 3 — "Come funziona una centrale nucleare"
// Stessa mascotte e stesso mondo di ep2.js. Novità:
//  - la mascotte saluta grande al centro, poi resta piccola in basso a destra (ruolo marginale);
//  - due scene sovrapposte: il MONDO (camera libera, che si avvicina alla centrale) e il PRIMO PIANO
//    (mascotte, icone, lente), disegnato sopra con una camera fissa: così la camera del mondo può
//    avvicinarsi quanto vuole senza toccare mascotte e icone;
//  - cupola e sala turbine si aprono e mostrano circuito primario, generatore di vapore, turbina,
//    alternatore e condensatore.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import LIP_DATA from './lip3.js';

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
const scene = new THREE.Scene();                                   // mondo
const camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 400); scene.add(camera);
const hud = new THREE.Scene();                                     // primo piano (mascotte, icone)
const hudCam = new THREE.PerspectiveCamera(30, W / H, 0.1, 100); hudCam.position.set(0, 0.2, 11); hudCam.lookAt(0, 0.2, 0); hud.add(hudCam);
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

// ------------------------------------------------------------ cielo e luci (sempre giorno)
const skyMat = new THREE.ShaderMaterial({
  uniforms: { top: { value: new THREE.Color(0x2f86e6) }, bottom: { value: new THREE.Color(0xc6ebff) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 1.0, 1.0); }',
  fragmentShader: 'uniform vec3 top; uniform vec3 bottom; varying vec2 vUv; void main(){ gl_FragColor = vec4(mix(bottom, top, smoothstep(0.15, 0.95, vUv.y)), 1.0); }',
  depthTest: false, depthWrite: false,
});
const sky = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), skyMat); sky.frustumCulled = false; sky.renderOrder = -1000; scene.add(sky);
scene.add(new THREE.HemisphereLight(0xcfe6ff, 0x4a6a4a, 1.32));
{ const s = new THREE.DirectionalLight(0xfff3de, 2.45); s.position.set(8, 14, 12); scene.add(s); }
hud.add(new THREE.HemisphereLight(0xcfe6ff, 0x4a6a4a, 1.32));
{ const s = new THREE.DirectionalLight(0xfff3de, 2.45); s.position.set(8, 14, 12); hud.add(s);
  const key = new THREE.PointLight(0xffffff, 30); key.position.set(3, 4, 9); hud.add(key);
  const fill = new THREE.PointLight(0x9fc8ff, 30); fill.position.set(-5, -1, 7); hud.add(fill); }
const sun = glow(0xfff0b0, scene, 34); sun.position.set(9, 22, -85); sun.material.opacity = 0.95;

// ------------------------------------------------------------ mondo: colline, alberi, nuvole
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

// ------------------------------------------------------------ centrale
const steelM = std(0x9fb0c8, { metalness: 0.4, roughness: 0.4 });
const darkBlueM = std(0x4a6fa8);
// torri di raffreddamento (solo sfondo: se ne parlerà nella puntata 8)
const prof = []; for (let i = 0; i <= 30; i++) { const y = i / 30 * 8; prof.push(new THREE.Vector2(1.45 * Math.sqrt(1 + ((y - 5.6) / 3.3) ** 2), y)); }
const towerM = std(0xeef1f6, { side: THREE.DoubleSide, roughness: 0.9 });
const stripeM = std(0xe8604a, { roughness: 0.8 });
const TOWERS = [[-5.6, -43.5, 1], [-1.6, -48.5, 0.95]];
const towers = TOWERS.map(([x, z, s]) => {
  const g = new THREE.Group(); g.position.set(x, hillY(x, z) - 0.1, z); g.userData.s = s; world.add(g);
  mesh(new THREE.LatheGeometry(prof, 48), towerM, g);
  mesh(new THREE.CylinderGeometry(1.62, 1.6, 0.35, 48, 1, true), stripeM, g, V(0, 7.83, 0));
  return g;
});
const puffs = [];
TOWERS.forEach(([x, z, s], ti) => {
  for (let k = 0; k < 12; k++) {
    const m = mesh(new THREE.SphereGeometry(1, 16, 12), basic(0xffffff, { transparent: true, opacity: 0.5, depthWrite: false }), world);
    m.userData = { x, z, base: hillY(x, z) + 8 * s, ph: k / 12 + ti * 0.37, a: rnd() * 6.28, r: rnd() * 0.5, s: 0.7 + rnd() * 0.4 };
    puffs.push(m);
  }
});

// ---------------- edificio del reattore (cupola): la metà davanti diventa trasparente
const DX = 3.7, DZ = -40, DY = hillY(DX, DZ) - 0.1;
const domeG = new THREE.Group(); domeG.position.set(DX, DY, DZ); world.add(domeG);
const domeM = std(0xf2f4f8, { roughness: 0.85, side: THREE.DoubleSide, emissive: 0xdfe8f5, emissiveIntensity: 0.32 });
const domeFront = std(0xf2f4f8, { roughness: 0.85, transparent: true, opacity: 1 });
const bandFront = std(0x3f8fe0, { transparent: true, opacity: 1 });
mesh(new THREE.CylinderGeometry(2.3, 2.3, 3.2, 48, 1, true, Math.PI / 2, Math.PI), domeM, domeG, V(0, 1.6, 0));
mesh(new THREE.SphereGeometry(2.3, 48, 20, Math.PI, Math.PI, 0, Math.PI / 2), domeM, domeG, V(0, 3.2, 0));
mesh(new THREE.CylinderGeometry(2.36, 2.36, 0.3, 48, 1, true, Math.PI / 2, Math.PI), std(0x3f8fe0), domeG, V(0, 3.1, 0));
const domeFrontMeshes = [
  mesh(new THREE.CylinderGeometry(2.3, 2.3, 3.2, 48, 1, true, -Math.PI / 2, Math.PI), domeFront, domeG, V(0, 1.6, 0)),
  mesh(new THREE.SphereGeometry(2.3, 48, 20, 0, Math.PI, 0, Math.PI / 2), domeFront, domeG, V(0, 3.2, 0)),
  mesh(new THREE.CylinderGeometry(2.36, 2.36, 0.3, 48, 1, true, -Math.PI / 2, Math.PI), bandFront, domeG, V(0, 3.1, 0)),
];
domeFrontMeshes.forEach(m => { m.renderOrder = 5; });
mesh(new THREE.CylinderGeometry(2.27, 2.27, 0.6, 48), std(0xc3cedf, { roughness: 0.9 }), domeG, V(0, -0.08, 0));   // pavimento: copre la collina che sale dentro la cupola
const inside = new THREE.Group(); domeG.add(inside);
// recipiente del reattore (vessel) con il nocciolo: un fascio di barrette
const VX = -0.75, VY = 1.3, VZ = 0.25;
const glassM = new THREE.MeshStandardMaterial({ color: 0x9fc4e8, transparent: true, opacity: 0.3, roughness: 0.2, depthWrite: false });
mesh(new THREE.CapsuleGeometry(0.52, 1.15, 8, 32), glassM, inside, V(VX, VY, VZ)).renderOrder = 2;
mesh(new THREE.TorusGeometry(0.535, 0.05, 10, 40), darkBlueM, inside, V(VX, VY + 0.72, VZ)).rotation.x = Math.PI / 2;
[-1, 1].forEach(sd => mesh(new THREE.BoxGeometry(0.14, 0.3, 0.5), darkBlueM, inside, V(VX + sd * 0.42, 0.16, VZ)));
const coreM = new THREE.MeshStandardMaterial({ color: 0xff9a3a, emissive: 0xff6a18, emissiveIntensity: 0.25 });
for (let i = 0; i < 4; i++) for (let k = 0; k < 3; k++) mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.95, 12), coreM, inside, V(VX - 0.255 + i * 0.17, VY - 0.25, VZ - 0.17 + k * 0.17));
[-0.76, 0.26].forEach(dy => mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.04, 28), steelM, inside, V(VX, VY + dy, VZ)));
const coreGlow = glow(0xffa040, inside, 3.2); coreGlow.position.set(VX, VY - 0.25, VZ + 0.7);
// generatore di vapore: guscio di vetro, dentro l'acqua del secondo circuito e il tubo a U del primo
const SGX = 0.95, SGY = 2.6, SGZ = 0.1;
mesh(new THREE.CapsuleGeometry(0.42, 1.7, 8, 32), glassM, inside, V(SGX, SGY, SGZ)).renderOrder = 3;
const sgWaterM = new THREE.MeshStandardMaterial({ color: 0x6fb4ee, transparent: true, opacity: 0.42, roughness: 0.3, depthWrite: false, emissive: 0x2a7fe0, emissiveIntensity: 0 });
mesh(new THREE.CylinderGeometry(0.37, 0.37, 1.75, 24), sgWaterM, inside, V(SGX, 2.4, SGZ)).renderOrder = 2;
// circuito primario (chiuso, tutto dentro la cupola)
const PZ = 0.25, pp = (x, y, z = PZ) => V(x, y, z);
const primM = new THREE.MeshStandardMaterial({ color: 0x9fb0c8, roughness: 0.45, metalness: 0.2, emissive: 0xff4a1a, emissiveIntensity: 0 });
const primPts = [pp(-0.3, 1.78), pp(0.5, 1.78), pp(0.8, 2.05), pp(0.8, 3.2), pp(0.95, 3.42), pp(1.1, 3.2), pp(1.1, 1.4), pp(1.1, 0.85), pp(0.9, 0.62), pp(0.3, 0.62), pp(-0.3, 0.62)];
tube(pipeCurve(primPts), 0.07, primM, inside);
const primLoop = pipeCurve([pp(-0.75, 0.8, 0.6), pp(-0.75, 1.7, 0.6), ...primPts], true);
mesh(new THREE.SphereGeometry(0.17, 20, 14), std(0x3f6fb8), inside, pp(0.3, 0.62));          // pompa
mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.26, 14), std(0x3f6fb8), inside, pp(0.3, 0.86));
const dropM = new THREE.MeshStandardMaterial({ color: 0xff7a3a, emissive: 0xff4a10, emissiveIntensity: 1.6 });
const primDrops = Array.from({ length: 12 }, () => mesh(new THREE.SphereGeometry(0.075, 14, 10), dropM, inside));
const loopGlow = glow(0xff8a4a, inside, 6.5); loopGlow.position.set(0.2, 1.9, -0.6);
const bubbles = Array.from({ length: 10 }, (_, i) => { const m = mesh(new THREE.SphereGeometry(0.06, 10, 8), basic(0xffffff), inside); m.userData = { ph: i / 10, x: SGX + (hash(i) - 0.5) * 0.5 }; return m; });
const heats = Array.from({ length: 6 }, () => glow(0xffb040, inside, 0.5));

// ---------------- sala turbine: la parete davanti diventa trasparente
const HX = -1.2, HZ = -39.6, HG = hillY(HX, HZ) - 0.05;
const hallG = new THREE.Group(); hallG.position.set(HX, HG, HZ); world.add(hallG);
const hl = (x, y, z) => V(x - HX, y - HG, z - HZ);             // da coordinate del mondo a coordinate della sala
const hallFront = std(0x8fc0ee, { roughness: 0.8, transparent: true, opacity: 1 });
const winFront = new THREE.MeshStandardMaterial({ color: 0xfff0a0, emissive: 0xffd860, emissiveIntensity: 0.7, transparent: true, opacity: 1 });
mesh(new THREE.BoxGeometry(3.7, 0.12, 2.5), std(0x7f95b5), hallG, V(0, 0.06, 0));
mesh(new THREE.BoxGeometry(3.6, 2.4, 0.1), std(0xb7d8f4, { roughness: 0.9 }), hallG, V(0, 1.2, -1.15));
[-1, 1].forEach(sd => mesh(new THREE.BoxGeometry(0.1, 2.4, 2.4), std(0x8fc0ee, { roughness: 0.8 }), hallG, V(sd * 1.75, 1.2, 0)));
mesh(new THREE.BoxGeometry(3.8, 0.2, 2.6), darkBlueM, hallG, V(0, 2.5, 0));
const hallFrontMeshes = [mesh(new THREE.BoxGeometry(3.6, 2.4, 0.1), hallFront, hallG, V(0, 1.2, 1.15))];
for (let i = 0; i < 5; i++) hallFrontMeshes.push(mesh(new THREE.BoxGeometry(0.36, 0.55, 0.05), winFront, hallG, V(-1.3 + i * 0.65, 1.35, 1.22)));
hallFrontMeshes.forEach(m => { m.renderOrder = 5; });
const AX = 2.94, TZ = -39.3;                                    // altezza dell'asse turbina-alternatore
bar(hl(0.42, AX, TZ), hl(-2.7, AX, TZ), 0.06, steelM, hallG);  // albero
[0.34, -1.17].forEach(x => mesh(new THREE.BoxGeometry(0.14, AX - HG, 0.4), darkBlueM, hallG, hl(x, (AX + HG) / 2, TZ)));
const rotor = new THREE.Group(); rotor.position.copy(hl(0, AX, TZ)); hallG.add(rotor);
const bladeA = std(0xeef2f8, { roughness: 0.4 }), bladeB = std(0x3f8fe0, { roughness: 0.4 });
[[0.15, 0.28], [-0.11, 0.36], [-0.37, 0.44], [-0.63, 0.52], [-0.89, 0.6]].forEach(([x, r], d) => {
  mesh(new THREE.CylinderGeometry(r * 0.4, r * 0.4, 0.17, 24), steelM, rotor, V(x, 0, 0)).rotation.z = Math.PI / 2;
  for (let k = 0; k < 10; k++) {
    const piv = new THREE.Group(); piv.position.x = x; piv.rotation.x = k * Math.PI / 5 + d * 0.2; rotor.add(piv);
    const geo = new THREE.BoxGeometry(0.17, r * 0.62, 0.035); geo.translate(0, r * 0.69, 0);
    mesh(geo, k % 2 ? bladeA : bladeB, piv).rotation.y = 0.6;        // pala inclinata rispetto all'asse
  }
});
const genM = new THREE.MeshStandardMaterial({ color: 0xffc928, roughness: 0.4, emissive: 0xffa800, emissiveIntensity: 0 });
{ const c = mesh(new THREE.CylinderGeometry(0.46, 0.46, 1.2, 32), genM, hallG, hl(-1.97, AX, TZ)); c.rotation.z = Math.PI / 2;
  [-0.42, 0.42].forEach(dx => { mesh(new THREE.CylinderGeometry(0.475, 0.475, 0.12, 32), darkBlueM, hallG, hl(-1.97 + dx, AX, TZ)).rotation.z = Math.PI / 2; });
  mesh(new THREE.BoxGeometry(1.0, AX - 0.42 - HG, 0.6), darkBlueM, hallG, hl(-1.97, (AX - 0.42 + HG) / 2, TZ)); }
const genGlow = glow(0xffd860, hallG, 3.4); genGlow.position.copy(hl(-1.97, AX, TZ + 0.9));
// condensatore: scatola di vetro con serpentina di acqua fredda
const CDX = -0.45, CDY = HG + 0.5;
{ const geo = new THREE.BoxGeometry(1.1, 0.68, 0.9);
  mesh(geo, new THREE.MeshStandardMaterial({ color: 0x9fc4e8, transparent: true, opacity: 0.3, roughness: 0.2, depthWrite: false }), hallG, hl(CDX, CDY, TZ)).renderOrder = 2;
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0x3f6fb8 })); e.position.copy(hl(CDX, CDY, TZ)); hallG.add(e); }
const coilM = new THREE.MeshStandardMaterial({ color: 0x4fc8ff, emissive: 0x2fa8ff, emissiveIntensity: 0.2, roughness: 0.4 });
{ const pts = []; for (let i = 0; i < 7; i++) pts.push(hl(CDX - 0.42 + i * 0.14, CDY + (i % 2 ? 0.2 : -0.2), TZ - 0.15));
  tube(pipeCurve([hl(CDX - 0.42, CDY - 0.2, TZ - 1.6), ...pts, hl(CDX + 0.42, CDY - 0.2, TZ - 1.6)]), 0.04, coilM, hallG, 160); }

// ---------------- circuito secondario: vapore dal generatore alla turbina, acqua dal condensatore al generatore
const SGW = V(DX + SGX, DY + SGY, DZ + SGZ);                    // centro del generatore di vapore, nel mondo
const steamPts = [V(SGW.x, DY + 3.85, -39.9), V(SGW.x, DY + 4.15, -39.9), V(0.85, DY + 4.15, -39.55), V(0.85, 3.55, -39.4), V(0.2, 3.55, TZ), V(0.08, 3.22, TZ)];
const feedPts = [V(-0.02, CDY, TZ), V(1.2, CDY, -39.4), V(1.2, DY + 2.75, -39.6), V(SGW.x - 0.4, DY + 2.75, -39.9)];
const steamPipeM = new THREE.MeshStandardMaterial({ color: 0xdfe6f0, roughness: 0.5, emissive: 0xffffff, emissiveIntensity: 0 });
const feedPipeM = new THREE.MeshStandardMaterial({ color: 0xb9c6d8, roughness: 0.5, emissive: 0x2a7fe0, emissiveIntensity: 0 });
const extPipes = new THREE.Group(); world.add(extPipes);
tube(pipeCurve(steamPts), 0.075, steamPipeM, extPipes); tube(pipeCurve(feedPts), 0.065, feedPipeM, extPipes);
mesh(new THREE.SphereGeometry(0.17, 20, 14), std(0x3f6fb8), extPipes, V(0.9, CDY, -39.38));
const secLoop = pipeCurve([V(SGW.x, DY + 3.5, -39.9), ...steamPts, V(0.0, AX, TZ), V(-0.85, AX, TZ), V(-0.62, 2.4, TZ), V(CDX, CDY, TZ), ...feedPts, V(SGW.x - 0.15, DY + 2.75, -39.9), V(SGW.x, DY + 3.1, -39.9)], true);
const secU = target => { let best = 0, bd = 1e9; for (let i = 0; i <= 600; i++) { const d = secLoop.getPointAt(i / 600).distanceTo(target); if (d < bd) { bd = d; best = i / 600; } } return best; };
const U_TURB = secU(V(0.0, AX, TZ)), U_EXH = secU(V(-0.85, AX, TZ)), U_COND = secU(V(CDX, CDY, TZ));
const steamPM = basic(0xffffff, { transparent: true, opacity: 0.92 }), waterPM = new THREE.MeshStandardMaterial({ color: 0x3f9be8, emissive: 0x1d6fd0, emissiveIntensity: 0.9 });
const secParts = Array.from({ length: 28 }, () => mesh(new THREE.SphereGeometry(1, 14, 10), steamPM, world));

// ---------------- traliccio, cavo, bandiera
const pylonM = std(0x6f7c93, { roughness: 0.5, metalness: 0.3 });
const PYX = -5.4, PYZ = -38, PYS = 1.3;
const pylon = new THREE.Group(); pylon.position.set(PYX, hillY(PYX, PYZ) - 0.1, PYZ); world.add(pylon);
{ const P = (x, y) => V(x, y, 0), r = 0.05;
  [-1, 1].forEach(sd => {
    bar(P(sd * 0.6, 0), P(sd * 0.16, 2.3), 0.065, pylonM, pylon); bar(P(sd * 0.16, 2.3), P(0, 3.3), 0.055, pylonM, pylon);
    bar(P(sd * 0.6, 0), P(-sd * 0.38, 1.15), r * 0.8, pylonM, pylon); bar(P(sd * 0.38, 1.15), P(-sd * 0.16, 2.3), r * 0.8, pylonM, pylon);
    [[2.3, 0.95], [2.85, 0.62]].forEach(([y, w]) => { mesh(new THREE.SphereGeometry(0.07, 10, 8), std(0xdfe6f0), pylon, P(sd * w, y - 0.14)); });
  });
  bar(P(-0.38, 1.15), P(0.38, 1.15), r * 0.8, pylonM, pylon); bar(P(-0.95, 2.3), P(0.95, 2.3), r, pylonM, pylon); bar(P(-0.62, 2.85), P(0.62, 2.85), r, pylonM, pylon); }
const cableCurve = new THREE.CatmullRomCurve3([V(-1.97, AX + 0.44, TZ), V(-1.97, 4.5, TZ), V(-3.4, 5.1, -38.6), V(PYX, pylon.position.y + 3.3 * PYS, PYZ), V(-9.5, 5.2, -36.5), V(-14, 4.6, -35)]);
const cable = mesh(new THREE.TubeGeometry(cableCurve, 160, 0.03, 6), std(0x3b4558), world);
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
const flagG = makeFlag(world, -7.5, hillY(-7.5, -36.5) - 0.05, -36.5, ['#0a9246', '#f7f7f2', '#d42b36']);
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

// ------------------------------------------------------------ mascotte (identica alle puntate precedenti)
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

// ------------------------------------------------------------ primo piano: velo, icone, lente
const veil = mesh(new THREE.PlaneGeometry(14, 14), basic(0xe4f2ff, { transparent: true, opacity: 0, depthWrite: false }), hud, V(0, 0.2, -2));
const discM = basic(0xffffff, { transparent: true, opacity: 0.95 });
const ringM = basic(0x2f7df0);
function icon(x, y, r = 0.42) {   // disco bianco con bordo blu; i modellini sono pensati per r = 0,42 e scalano col disco
  const g = new THREE.Group(); g.position.set(x, y, 0.2); hud.add(g);
  mesh(new THREE.CircleGeometry(r, 64), discM, g, V(0, 0, -0.3)); mesh(new THREE.RingGeometry(r, r + 0.035, 64), ringM, g, V(0, 0, -0.3));
  const c = new THREE.Group(); c.scale.setScalar(r / 0.42); g.add(c); return { g, c, r };
}
const showIcon = (ic, a) => { ic.g.visible = a > 0.001; ic.g.scale.setScalar(Math.max(0.001, a)); };
// termometro che sale (al posto della fiamma)
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
function makeSteam(parent) {
  const g = new THREE.Group(); parent.add(g);
  const m = std(0xa4c8ee, { roughness: 1, emissive: 0x7fb0e6, emissiveIntensity: 0.25 });
  [[0, -0.07, 0, 0.15], [0.15, -0.1, 0, 0.115], [-0.15, -0.1, 0, 0.12], [0.07, 0.04, -0.02, 0.115], [-0.07, 0.03, 0.02, 0.105]].forEach(([x, y, z, r]) => mesh(new THREE.SphereGeometry(r, 20, 14), m, g, V(x, y, z)));
  const wisps = [-0.11, 0.02, 0.13].map(x => { const w = mesh(new THREE.CapsuleGeometry(0.022, 0.07, 4, 10), m, g); w.userData.x = x; return w; });
  return { g, anim(t) { wisps.forEach((w, i) => { const u = (t * 0.9 + i * 0.37) % 1; w.position.set(w.userData.x + Math.sin(u * 6.28 + i) * 0.02, 0.15 + u * 0.14, 0); w.scale.setScalar(Math.sin(u * Math.PI)); }); } };
}
function makeTurbine(parent) {    // rotore di turbina a vapore visto di tre quarti: albero e stadi di pale sempre più grandi
  const g = new THREE.Group(); parent.add(g);
  const tilt = new THREE.Group(); tilt.rotation.x = 0.3; tilt.position.y = -0.03; g.add(tilt);
  const yaw = new THREE.Group(); yaw.rotation.y = -0.72; tilt.add(yaw);
  const rot = new THREE.Group(); yaw.add(rot);
  const shaftM = std(0x8a9ab4, { metalness: 0.4, roughness: 0.4 });
  const bA = std(0x5f8fd0, { roughness: 0.4, metalness: 0.2 }), bB = std(0xdfe6f0, { roughness: 0.4 });
  mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 16), shaftM, rot).rotation.z = Math.PI / 2;
  [[-0.14, 0.13], [0.0, 0.165], [0.14, 0.2]].forEach(([x, r], d) => {
    mesh(new THREE.CylinderGeometry(r * 0.38, r * 0.38, 0.05, 24), shaftM, rot, V(x, 0, 0)).rotation.z = Math.PI / 2;
    for (let k = 0; k < 22; k++) {                                   // ogni stadio è una corona fitta di pale dello stesso colore
      const piv = new THREE.Group(); piv.position.x = x; piv.rotation.x = k * Math.PI / 11; rot.add(piv);
      const geo = new THREE.BoxGeometry(0.05, r * 0.64, 0.01); geo.translate(0, r * 0.69, 0);
      mesh(geo, d % 2 ? bB : bA, piv).rotation.y = 0.35;
    }
    mesh(new THREE.TorusGeometry(r * 1.01, 0.008, 6, 48), d % 2 ? bA : std(0x2f5fb0), rot, V(x, 0, 0)).rotation.y = Math.PI / 2;
  });
  [-0.31, 0.31].forEach(x => mesh(new THREE.BoxGeometry(0.05, 0.09, 0.09), std(0x2f5fb0), yaw, V(x, 0, 0)));
  mesh(new THREE.SphereGeometry(0.04, 16, 12), std(0xffc928, { roughness: 0.35 }), rot, V(0.33, 0, 0));
  return { g, rot };
}
function makeDrop(parent) {
  const g = new THREE.Group(); parent.add(g);
  const m = new THREE.MeshStandardMaterial({ color: 0x3f9be8, roughness: 0.3, emissive: 0x1d6fd0, emissiveIntensity: 0.4 });
  const pts = []; for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI; pts.push(new THREE.Vector2(0.17 * Math.sin(a) * Math.pow(Math.sin(a / 2), 0.9), 0.24 * Math.cos(a))); }
  mesh(new THREE.LatheGeometry(pts.reverse(), 32), m, g, V(0, 0.03, 0));
  return { g };
}
function makeGauge(parent) {      // manometro
  const g = new THREE.Group(); parent.add(g);
  mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.06, 48), std(0x3f5f95), g).rotation.x = Math.PI / 2;
  mesh(new THREE.CircleGeometry(0.265, 48), basic(0xffffff), g, V(0, 0, 0.035));
  const d = Math.PI / 180;
  [[90, 120, 0x58c070], [30, 60, 0xffc928], [-30, 60, 0xe8452f]].forEach(([a, l, col]) => mesh(new THREE.RingGeometry(0.17, 0.235, 32, 1, a * d, l * d), basic(col), g, V(0, 0, 0.04)));
  const geo = new THREE.BoxGeometry(0.03, 0.2, 0.012); geo.translate(0, 0.085, 0);
  const needle = mesh(geo, basic(0x14203c), g, V(0, 0, 0.055));
  mesh(new THREE.CircleGeometry(0.04, 20), basic(0x14203c), g, V(0, 0, 0.065));
  return { g, set(u, t) { needle.rotation.z = (lerp(200, 2, u) - 90 + Math.sin(t * 31) * 2.5 * u) * d; } };
}
function makeBulb(parent) {
  const g = new THREE.Group(); g.scale.setScalar(0.19); parent.add(g);
  const m = new THREE.MeshStandardMaterial({ color: 0xb9c4d6, roughness: 0.35, emissive: 0xffb400, emissiveIntensity: 0 });
  mesh(new THREE.SphereGeometry(1, 32, 24), m, g, V(0, 0.4, 0)); mesh(new THREE.CylinderGeometry(0.52, 0.66, 0.5, 24), m, g, V(0, -0.47, 0));
  mesh(new THREE.CylinderGeometry(0.46, 0.4, 0.55, 20), std(0x8892a4, { metalness: 0.5, roughness: 0.4 }), g, V(0, -0.93, 0));
  const gl = glow(0xffc62e, g, 5.2); gl.position.set(0, 0.4, -0.6);
  const OFF = new THREE.Color(0xb9c4d6), WARM = new THREE.Color(0xffc21e);
  return { g, set(lit) { m.color.copy(OFF).lerp(WARM, lit); m.emissiveIntensity = lit * 0.75; gl.material.opacity = lit * 0.16; } };
}
// icone di B3 / anello del ciclo (B4 e richiamo in B12)
const RCX = 0, RCY = 0.85, RR = 0.9, RING_S = 0.34 / 0.42;
const ROW = [[-1.05, RCY], [0, RCY], [1.05, RCY], [0, RCY - RR]], RING = [[-RR, RCY], [0, RCY + RR], [RR, RCY], [0, RCY - RR]];
const icT = icon(0, 0), icS = icon(0, 0), icTu = icon(0, 0), icD = icon(0, 0);
const thermo = makeThermo(icT.c), steam = makeSteam(icS.c), turb = makeTurbine(icTu.c); makeDrop(icD.c);
const MAIN = [icT, icS, icTu, icD];
const ringG = new THREE.Group(); ringG.position.set(RCX, RCY, 0); hud.add(ringG);
const DELTA = 0.5;                                                // mezzo angolo occupato da un'icona sull'anello
const arcs = [Math.PI, Math.PI / 2, 0, -Math.PI / 2].map(th => {  // frecce in senso orario: da ogni icona alla successiva
  const g = new THREE.Group(); ringG.add(g);
  const end = th - Math.PI / 2 + DELTA, len = Math.PI / 2 - 2 * DELTA;
  mesh(new THREE.TorusGeometry(RR, 0.026, 8, 24, len), ringM, g).rotation.z = end + 0.08;
  const c = mesh(new THREE.ConeGeometry(0.075, 0.15, 16), ringM, g, V(Math.cos(end) * RR, Math.sin(end) * RR, 0)); c.rotation.z = end - Math.PI;
  return g;
});
const ringDots = Array.from({ length: 8 }, () => mesh(new THREE.SphereGeometry(0.05, 12, 10), new THREE.MeshStandardMaterial({ color: 0xffe08a, emissive: 0xffc030, emissiveIntensity: 1.8 }), ringG));
// icone piccole in basso a sinistra: termometro (B7), manometro (B8), lampadina (B11)
const SMALL_Y = -0.97, SMALL_R = 0.31;
const icT2 = icon(-1.14, SMALL_Y, SMALL_R), icM = icon(-0.42, SMALL_Y, SMALL_R), icB = icon(-1.14, SMALL_Y, SMALL_R);
const thermo2 = makeThermo(icT2.c), gauge = makeGauge(icM.c), bulb = makeBulb(icB.c);
// il modellino sta 0,3 più vicino alla camera del disco: lontano dal centro dello schermo la prospettiva lo sposta verso l'esterno.
// Lo si riporta indietro della stessa quantità, così resta al centro del suo cerchio.
const PAR = 1 - (11 - 0.2) / (11 + 0.1);
const centerIcons = () => [icT, icS, icTu, icD, icT2, icM, icB].forEach(ic => ic.c.position.set(-ic.g.position.x * PAR, -(ic.g.position.y - 0.2) * PAR, 0));
// lente: barrette e pastiglie (B5), poi atomo che si divide (B6)
const lens = icon(0, -0.45, 0.7); lens.c.scale.setScalar(1);
const rodsG = new THREE.Group(); lens.c.add(rodsG);
const cladM = std(0xcfd6e2, { metalness: 0.35, roughness: 0.35 }), cladC = std(0xcfd6e2, { metalness: 0.35, roughness: 0.35, transparent: true, opacity: 1 });
const pelM = new THREE.MeshStandardMaterial({ color: 0x3c3a46, roughness: 0.7, emissive: 0xff7a20, emissiveIntensity: 0.05 });
const rodSide = [-1, 1].map(sd => { const g = new THREE.Group(); rodsG.add(g); mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.9, 20), cladM, g); [-0.47, 0.47].forEach(y => mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.05, 20), steelM, g, V(0, y, 0))); g.userData.sd = sd; return g; });
const rodMid = new THREE.Group(); rodsG.add(rodMid);
mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.9, 20, 1, true), cladC, rodMid).renderOrder = 3;
[-0.47, 0.47].forEach(y => mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.05, 20), steelM, rodMid, V(0, y, 0)));
const pellets = [-2, -1, 0, 1, 2].map(i => mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.155, 20), pelM, rodMid, V(0, i * 0.165, 0)));
const pelOut = mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.155, 24), pelM, rodsG);
const pelGlow = glow(0xffa040, rodsG, 0.9);
const atomG = new THREE.Group(); lens.c.add(atomG);
const protM = std(0xf06a52, { roughness: 0.5 }), neutM = new THREE.MeshStandardMaterial({ color: 0x58b0ff, roughness: 0.6, emissive: 0x1c5fb8, emissiveIntensity: 0.35 });
const NUC = V(0.03, 0, 0), ATOM_S = 1.25;
const nucleons = Array.from({ length: 16 }, (_, i) => {
  const a = i * 2.39996, y = 1 - (i + 0.5) / 8, r = Math.sqrt(1 - y * y), p = V(Math.cos(a) * r, y, Math.sin(a) * r).multiplyScalar(0.15);
  const m = mesh(new THREE.SphereGeometry(0.075, 18, 14), i % 2 ? protM : neutM, atomG); m.userData = { p, side: p.x + p.y * 0.4 > 0 ? 1 : -1 }; return m;
});
const neutronIn = mesh(new THREE.SphereGeometry(0.075, 18, 14), neutM, atomG);
const neutronsOut = [V(0.3, 0.3, 0.1), V(0.16, -0.36, 0.1)].map(d => { const m = mesh(new THREE.SphereGeometry(0.075, 18, 14), neutM, atomG); m.userData.d = d; return m; });
const fisFlash = glow(0xffe0a0, atomG, 1.5), fisHeat = glow(0xff8a30, atomG, 0.9);

// dissolvenza iniziale
const overlay = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), basic(0x2f86e6, { transparent: true, opacity: 0, depthTest: false, depthWrite: false }));
overlay.position.z = -1; overlay.renderOrder = 1000; hudCam.add(overlay);
const composer = new EffectComposer(renderer); composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
{ const p = new RenderPass(hud, hudCam); p.clear = false; p.clearDepth = true; composer.addPass(p); }
composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), 0.45, 0.5, 1.0));
composer.addPass(new OutputPass());

// ------------------------------------------------------------ tempi (in secondi "di scaletta")
// BATT: battute della scaletta (bozza 3). SPEECH: intervalli di parlato previsti, per il labiale simulato.
// Quando arriva la voce: riempire WARP con i tempi reali delle frasi e mettere in LIP i dati ricavati dall'audio
// (stesso formato di lip2.js: open / narrow / env per fotogramma).
const SPEECH = [[0.2, 0.8], [1.4, 4.9], [5.4, 7.0], [7.15, 8.0], [8.15, 9.4], [9.5, 11.4], [11.9, 14.6], [14.7, 16.3], [16.8, 20.3], [20.5, 23.3], [23.8, 24.9], [25.0, 28.2],
  [28.7, 31.2], [31.4, 33.4], [33.9, 34.6], [34.7, 36.6], [37.1, 38.9], [39.1, 41.6], [42.1, 44.6], [44.7, 46.8], [47.3, 49.3], [49.4, 52.0], [52.5, 54.3], [54.4, 56.0], [56.5, 59.3], [59.5, 60.4], [60.5, 62.0]];
const speechEnv = t => { let e = 0; for (const [a, b] of SPEECH) e = Math.max(e, Math.min(ramp(t, a, a + 0.07), 1 - ramp(t, b - 0.09, b))); return e; };
let LIP = q.get('lip') === '0' ? null : LIP_DATA;   // { open, narrow, env } a 30 fps, da audio/voice_ep3.py
function lip(tn, t) {
  if (LIP) { const fi = Math.min(LIP.open.length - 1, Math.max(0, Math.round(tn * 30))); return { open: LIP.open[fi], narrow: LIP.narrow[fi], env: LIP.env[fi] }; }
  const env = speechEnv(t), syl = Math.floor(t * 5.5), u = t * 5.5 - syl;
  return { env, open: env * Math.sin(u * Math.PI) ** 0.7 * (0.55 + 0.45 * hash(syl)), narrow: env * (0.25 + 0.6 * hash(syl + 50)) };
}
const BLINKS = [3.1, 6.3, 9.9, 13.2, 17.4, 21.0, 24.6, 27.9, 31.7, 35.2, 38.4, 41.9, 45.3, 48.8, 52.2, 55.6, 58.4, 61.0];
const END = 63.8;
// [tempo di scaletta, tempo reale]: inizio e fine di ogni frase della voce (audio/phrases.json). Dentro le frasi lunghe
// i punti intermedi sono stimati in proporzione alle sillabe.
const WARP = [[0, 0], [0.2, 0.3], [0.8, 0.66], [1.4, 1.53], [4.9, 3.7],
  [5.4, 4.57], [7.0, 6.04], [7.15, 6.56], [8.0, 7.58], [8.15, 7.8], [9.5, 8.73], [11.4, 10.07],
  [11.9, 10.94], [14.6, 13.9], [14.7, 13.96], [16.3, 15.38],
  [16.8, 16.55], [20.3, 19.75], [20.5, 20.28], [23.3, 22.7],
  [23.8, 23.57], [24.9, 24.31], [25.0, 24.36], [28.2, 26.53],
  [28.7, 27.4], [31.2, 30.38], [31.4, 30.63], [33.4, 32.5],
  [33.9, 33.37], [34.6, 33.81], [34.7, 33.86], [36.6, 35.86],
  [37.1, 36.73], [38.9, 38.25], [39.1, 38.65], [41.6, 41.52],
  [42.1, 42.39], [44.6, 44.71], [44.7, 45.08], [46.8, 48.2],
  [47.3, 49.07], [49.3, 50.67], [49.4, 50.99], [52.0, 52.72],
  [52.5, 53.59], [54.3, 55.83], [54.4, 56.01], [56.0, 57.05],
  [56.5, 59.92], [59.3, 62.02], [59.5, 62.29], [60.4, 63.1], [60.5, 63.15], [62.0, 64.35], [END, 66.2]];
function unwarp(tn) { for (let i = 0; i < WARP.length - 1; i++) { const [o0, n0] = WARP[i], [o1, n1] = WARP[i + 1]; if (tn <= n1) return o0 + (o1 - o0) * (tn - n0) / (n1 - n0); } return END; }
function fwarp(t) { for (let i = 0; i < WARP.length - 1; i++) { const [o0, n0] = WARP[i], [o1, n1] = WARP[i + 1]; if (t <= o1) return n0 + (n1 - n0) * (t - o0) / (o1 - o0); } return WARP[WARP.length - 1][1]; }
// camera e aperture si muovono in tempo reale: le chiavi si spostano con la voce, il movimento fra due chiavi resta fluido
const rt = keys => keys.map(([k, v]) => [fwarp(k), v]);
window.WARP = WARP;

// camera del mondo: [posizione, punto guardato]. In tempo REALE, come le rotazioni della collina nella puntata 2.
const CAM_WIDE = [-1, 3.8, 11, -1, 3.0, -40], CAM_DOME = [3.9, 3.3, -21, 3.7, 2.82, -40], CAM_CORE = [2.95, 2.0, -31.75, 2.95, 1.86, -39.75], CAM_HALL = [-0.95, 2.7, -24.5, -0.95, 2.3, -39.5];
const CAM = track(rt([[16.9, CAM_WIDE], [18.7, CAM_DOME], [20.0, CAM_DOME], [21.2, CAM_CORE], [28.4, CAM_CORE], [29.9, CAM_DOME], [45.5, CAM_DOME], [47.3, CAM_HALL], [53.9, CAM_HALL], [56.4, CAM_WIDE]]));
const R0 = [1.2, -0.3, 0.35], WAVE = [1.32, 0.8, 0.3], POINT = [1.62, 0.32, 0.3];
const T = {
  dome: track(rt([[17.6, 1], [18.9, 0.1], [56.5, 0.1], [57.5, 1]])),           // opacità della metà davanti della cupola (tempo reale)
  hall: track(rt([[45.8, 1], [46.9, 0.1], [56.5, 0.1], [57.5, 1]])),           // opacità della parete davanti della sala turbine (tempo reale)
  pos: track([[0, [0, 0.2, 0.8]], [0.92, [0, 0.2, 0.8]], [1.45, [0.82, -0.99, 0.17]]]),
  smile: track([[0, 1], [1.4, 0.95], [5, 0.8], [56, 0.8], [56.8, 1], [END, 1]]),
  browY: track([[0, 0.1], [1.4, 0.07], [5.4, 0.1], [7, 0.07], [56.4, 0.07], [56.9, 0.11], [END, 0.09]]),
  gaze: track([[0, [0, 0]], [1.3, [0, 0]], [1.8, [-0.6, 0.6]], [5.2, [-0.6, 0.6]], [5.6, [0, 0]], [6.9, [0, 0]], [7.3, [-0.7, 0.75]], [16.4, [-0.7, 0.75]], [17.0, [-0.6, 0.6]], [33.6, [-0.6, 0.6]], [34.0, [-0.85, 0.05]],
    [36.6, [-0.85, 0.05]], [37.1, [-0.6, 0.6]], [49.6, [-0.6, 0.6]], [50.2, [-0.85, 0.05]], [52.4, [-0.85, 0.05]], [52.8, [-0.6, 0.6]], [56.2, [-0.6, 0.6]], [56.6, [0, 0]], [57.5, [0, 0]], [57.9, [0.85, 0.25]], [59.2, [0.85, 0.25]], [59.6, [0, 0]], [END, [0, 0]]]),
  handR: track([[0, R0], [0.12, WAVE], [0.9, WAVE], [1.35, R0], [57.2, R0], [57.6, POINT], [59.3, POINT], [59.8, R0], [61.2, R0], [61.5, WAVE], [END, WAVE]]),
};
// movimenti continui (rotazioni, flussi, particelle) in tempo REALE: la tabella WARP cambia ritmo da una frase all'altra
// e li farebbe accelerare e rallentare a scatti. Gli eventi (comparse, accensioni) restano in tempo di scaletta.
const SEC_FRONT = track(rt([[44.6, 0], [47.3, U_TURB], [52.3, U_EXH], [53.0, U_COND], [54.8, 1]]));
const SP0 = fwarp(47.2), spinA = r => r < SP0 ? 0 : r < SP0 + 1.4 ? (r - SP0) ** 2 / 2.8 : 0.7 + (r - SP0 - 1.4);
const CAB0 = fwarp(49.7), R2A = fwarp(54.3), R2B = fwarp(56.5) - 0.35;   // seconda apparizione dell'anello: fino a poco prima della battuta 13
const CP = new THREE.Vector3(), CGREY = new THREE.Color(0x9fb0c8), CHOT = new THREE.Color(0xff6a3a), CSTEAM = new THREE.Color(0xdfe6f0), CFEED0 = new THREE.Color(0xb9c6d8), CFEED1 = new THREE.Color(0x4f9fe8);

window.renderFrame = function (tn) {
  const t = unwarp(tn);
  // ---------------- camera del mondo
  const c = CAM(tn);
  camera.position.set(c[0] + Math.sin(tn * 0.21) * 0.1, c[1] + Math.sin(tn * 0.17) * 0.05, c[2]);
  camera.lookAt(c[3], c[4], c[5]);
  clouds.forEach((cl, i) => { cl.position.x = cl.userData.x + Math.sin(tn * 0.05 + i) * 0.8 + tn * 0.02; });
  // ---------------- la centrale entra in scena (B2): gli edifici spuntano uno dopo l'altro
  towers.forEach((g, i) => { const a = grow(t, 1.55 + i * 0.3); g.visible = a > 0.001; g.scale.setScalar(Math.max(0.001, a) * g.userData.s); });
  { const a = grow(t, 2.15); hallG.visible = a > 0.001; hallG.scale.setScalar(Math.max(0.001, a)); }
  { const a = grow(t, 2.45); domeG.visible = a > 0.001; domeG.scale.setScalar(Math.max(0.001, a)); }
  { const a = grow(t, 2.85, 0.4); pylon.visible = a > 0.001; pylon.scale.setScalar(Math.max(0.001, a) * PYS); }
  { const a = grow(t, 3.1, 0.4); flagG.visible = a > 0.001; flagG.scale.setScalar(Math.max(0.001, a)); }
  extPipes.visible = cable.visible = t > 2.9;
  const puffOn = ramp(t, 2.6, 4.2);
  for (const m of puffs) {
    const d = m.userData, ph = (tn * 0.085 + d.ph) % 1;
    m.position.set(d.x + Math.cos(d.a) * d.r * (1 + ph) + ph * ph * 2.2, d.base + ph * 6.5, d.z + Math.sin(d.a) * d.r);
    m.scale.setScalar(d.s * (0.95 + ph * 1.9)); m.material.opacity = 0.55 * puffOn * Math.min(1, ph * 6) * (1 - ph);
  }
  waveFlag(tn);
  // ---------------- cupola e sala turbine che si aprono
  const dOp = T.dome(tn), hOp = T.hall(tn);
  domeFront.opacity = bandFront.opacity = dOp; domeFront.depthWrite = bandFront.depthWrite = dOp > 0.99;
  hallFront.opacity = hOp; winFront.opacity = clamp01((hOp - 0.1) / 0.9); hallFront.depthWrite = winFront.depthWrite = hOp > 0.99;
  // ---------------- nocciolo (B5–B6)
  const coreOn = smooth(ramp(t, 19.2, 20.0)), fisKick = t > 26.5 ? Math.exp(-(t - 26.5) * 1.6) : 0;
  coreM.emissiveIntensity = lerp(0.25, 2.3, coreOn) * (1 + 0.08 * Math.sin(tn * 7)) + 1.3 * fisKick;
  coreGlow.material.opacity = (0.38 * coreOn + 0.3 * fisKick) * (1 - dOp);
  // ---------------- circuito primario (B7–B9)
  const primOn = smooth(ramp(t, 29.2, 30.2)), closedEmph = win(t, 37.2, 41.8, 0.5);
  primM.color.copy(CGREY).lerp(CHOT, primOn); primM.emissiveIntensity = primOn * (0.55 + 0.3 * closedEmph * (0.5 + 0.5 * Math.sin(tn * 5)));
  primDrops.forEach((m, i) => { const u = (i / primDrops.length + tn * 0.19) % 1; primLoop.getPointAt(u, m.position); m.position.z += 0.02; m.scale.setScalar(Math.max(0.001, primOn)); m.visible = primOn > 0.001; });
  loopGlow.material.opacity = 0.22 * closedEmph * (1 - dOp);
  // ---------------- generatore di vapore e secondo circuito (B10)
  const heatOn = win(t, 42.3, 47.2, 0.4), sgOn = smooth(ramp(t, 43.0, 43.8)), boil = smooth(ramp(t, 43.8, 44.5));
  heats.forEach((s, i) => { const u = (tn * 0.8 + i / 6) % 1, sd = i % 2 ? 1 : -1; s.position.set((sd > 0 ? 1.1 : 0.8) + sd * u * 0.22, 2.0 + (i >> 1) * 0.5, 0.55); s.material.opacity = heatOn * Math.sin(u * Math.PI); s.scale.setScalar(0.45 + 0.4 * u); });
  sgWaterM.emissiveIntensity = 0.55 * sgOn; sgWaterM.opacity = 0.42 + 0.2 * sgOn;
  bubbles.forEach(m => { const d = m.userData, u = (tn * 0.7 + d.ph) % 1; m.position.set(d.x + Math.sin(u * 9 + d.ph * 20) * 0.03, 1.75 + u * 1.9, SGZ + 0.5); m.scale.setScalar(Math.max(0.001, boil * (0.6 + u) * Math.sin(u * Math.PI))); m.visible = boil > 0.001; });
  const front = SEC_FRONT(tn), secAll = smooth(ramp(t, 44.6, 45.2));
  steamPipeM.emissiveIntensity = 0.25 * secAll; feedPipeM.color.copy(CFEED0).lerp(CFEED1, smooth(ramp(t, 52.9, 53.6))); feedPipeM.emissiveIntensity = 0.3 * smooth(ramp(t, 52.9, 53.6));
  secParts.forEach((m, i) => {
    const u = (i / secParts.length + tn * 0.085) % 1; m.visible = t > 44.6 && u < front; if (!m.visible) return;
    secLoop.getPointAt(u, m.position);
    const water = u > U_COND, inTurb = u > U_TURB && u <= U_COND, k = inTurb ? 1 - 0.55 * (u - U_TURB) / (U_COND - U_TURB) : 1;
    m.material = water ? waterPM : steamPM; m.scale.setScalar((water ? 0.075 : 0.105 * k) * Math.min(1, (front - u) * 40));
    if (!water) m.position.y += Math.sin(tn * 9 + i * 1.7) * 0.012;
  });
  // ---------------- turbina, alternatore, cavo (B11) e condensatore (B12)
  rotor.rotation.x = -spinA(tn) * 7.5;
  const genOn = smooth(ramp(t, 49.4, 50.0));
  genM.emissiveIntensity = genOn * (0.7 + 0.2 * Math.sin(tn * 11)); genGlow.material.opacity = 0.45 * genOn * (1 - hOp);
  cableDots.forEach((d, i) => { const ur = (tn - CAB0) * 0.42 - i / cableDots.length; d.visible = ur >= 0; if (d.visible) cableCurve.getPointAt(ur % 1, d.position); });
  coilM.emissiveIntensity = 0.2 + 1.1 * smooth(ramp(t, 52.5, 53.1));

  // ---------------- primo piano: velo e icone
  veil.material.opacity = 0.6 * (win(t, 6.7, 16.95, 0.5) + win(tn, fwarp(54.0), R2B + 0.3, 0.5));
  const toRing = t < 30 ? smooth(ramp(t, 11.9, 12.6)) : 1;
  MAIN.forEach((ic, i) => {
    const a = pop(t, [7.1, 8.2, 9.6, 13.3][i], 16.5 + i * 0.05) + pop(tn, R2A + i * 0.07, R2B + i * 0.03);
    showIcon(ic, a * lerp(1, RING_S, toRing));
    ic.g.position.set(lerp(ROW[i][0], RING[i][0], toRing), lerp(ROW[i][1], RING[i][1], toRing) + Math.sin(tn * 1.6 + i * 1.3) * 0.015, 0.2);
  });
  thermo.set(t < 30 ? smooth(ramp(t, 7.3, 8.1)) : 1); steam.anim(tn); turb.rot.rotation.x = -tn * 3.2;
  arcs.forEach((g, k) => { const a = pop(t, 12.55 + k * 0.33, 16.45, 0.3, 0.25) + pop(tn, R2A + 0.2 + k * 0.1, R2B - 0.05, 0.3, 0.25); g.visible = a > 0.001; g.scale.setScalar(Math.max(0.001, a)); });
  const dotsOn = win(t, 13.9, 16.4, 0.3) + win(tn, R2A + 0.5, R2B - 0.1, 0.3);
  ringDots.forEach((m, i) => {
    const th = Math.PI - (tn * 1.7 + i * Math.PI / 4), n = ((th % (Math.PI / 2)) + Math.PI / 2) % (Math.PI / 2), near = Math.min(n, Math.PI / 2 - n);
    const s = dotsOn * clamp01((near - DELTA + 0.04) / 0.1); m.visible = s > 0.001; m.position.set(Math.cos(th) * RR, Math.sin(th) * RR, 0); m.scale.setScalar(Math.max(0.001, s));
  });
  // termometro piccolo, manometro, lampadina
  showIcon(icT2, pop(t, 30.9, 36.95)); thermo2.set(smooth(ramp(t, 31.5, 32.9)));
  showIcon(icM, pop(t, 34.1, 37.0)); gauge.set(smooth(ramp(t, 34.6, 35.7)), t);
  showIcon(icB, pop(t, 50.1, 53.7)); bulb.set(ramp(t, 50.9, 51.15) * (0.92 + 0.08 * Math.sin(t * 5)));
  // lente: barrette → pastiglie → atomo che si divide
  showIcon(lens, pop(t, 21.5, 28.7, 0.4, 0.35)); lens.g.position.y = lerp(0.7, -0.45, smooth(ramp(t, 21.5, 22.0)));
  { const a = pop(t, 21.6, 23.9, 0.3, 0.3); rodsG.visible = a > 0.001; rodsG.scale.setScalar(Math.max(0.001, a));
    const z = smooth(ramp(t, 22.2, 22.7)), u = smooth(ramp(t, 22.8, 23.3));
    rodSide.forEach(g => { g.position.x = g.userData.sd * lerp(0.3, 0.5, z); g.scale.setScalar(Math.max(0.001, 1 - z)); g.visible = z < 0.999; });
    rodMid.scale.setScalar(lerp(1, 1.35, z)); rodMid.position.x = lerp(0, -0.16, u); cladC.opacity = lerp(1, 0.38, smooth(ramp(t, 22.3, 22.8))); cladC.depthWrite = cladC.opacity > 0.99;
    pellets[2].visible = t < 22.8; pelOut.visible = t >= 22.8;
    pelOut.position.set(lerp(0, 0.3, u) + rodMid.position.x * (1 - u), Math.sin(t * 2) * 0.01, 0.1 * u); pelOut.scale.setScalar(1.35 * lerp(1, 2.1, u)); pelOut.rotation.set(0.35 * u, 0, -0.25 * u);
    pelGlow.position.set(pelOut.position.x, 0, -0.1); pelGlow.material.opacity = 0.5 * u; }
  { const a = pop(t, 23.85, 28.7, 0.35, 0.3); atomG.visible = a > 0.001; atomG.scale.setScalar(Math.max(0.001, a) * ATOM_S);
    const hit = 26.5, e = 1 - (1 - ramp(t, hit, hit + 1.0)) ** 3, wob = ramp(t, hit - 0.25, hit) * (1 - ramp(t, hit, hit + 0.1));
    nucleons.forEach((m, i) => { const d = m.userData; m.position.copy(d.p).multiplyScalar(1 + 0.14 * wob * Math.sin(t * 40 + i) - 0.15 * e).add(NUC); m.position.x += d.side * 0.22 * e; m.position.y += d.side * 0.1 * e + Math.sin(t * 3 + d.side) * 0.012; });
    const fl = smooth(ramp(t, 25.3, hit)); neutronIn.visible = t > 25.0 && t < hit; neutronIn.position.set(lerp(-0.42, NUC.x - 0.17, fl), lerp(0.14, 0, fl), 0.05); neutronIn.scale.setScalar(grow(t, 25.0, 0.3));
    neutronsOut.forEach(m => { m.visible = t >= hit; m.position.copy(m.userData.d).multiplyScalar(e).add(NUC); });
    fisFlash.position.copy(NUC); fisFlash.material.opacity = t > hit ? 0.7 * Math.max(0, 1 - (t - hit) / 0.35) : 0; fisHeat.position.copy(NUC); fisHeat.material.opacity = 0.16 * e; }

  // ---------------- mascotte: grande al centro per il saluto, poi piccola in basso a destra
  let [mx, my, ms] = T.pos(t);
  ms *= backOut(ramp(t, 0.0, 0.35)) * (1 - smooth(ramp(t, 62.05, 62.3)));
  const bob = Math.sin(tn * 1.9) * 0.07 * ms;
  mascot.position.set(mx, my + bob + smooth(ramp(t, 61.9, 62.3)) * 0.08, 0); mascot.scale.setScalar(Math.max(0.001, ms)); mascot.visible = t < 62.3;
  const L = lip(tn, t), env = L.env;
  const [gx, gy] = T.gaze(t);
  head.rotation.set(-gy * 0.3 + env * Math.sin(tn * 5.2) * 0.035, gx * 0.36, Math.sin(tn * 1.1) * 0.05 + env * Math.sin(tn * 2.6) * 0.04 - gx * 0.06);
  let blink = 0; for (const b of BLINKS) blink = Math.max(blink, 1 - Math.abs(t - b) / 0.085);
  blink = clamp01(blink);
  const smile = T.smile(t), happySquint = 0.1 * Math.max(0, smile - 0.6) / 0.4;
  for (const e of eyes) { e.g.scale.set(1.05, 1.05 * Math.max(0.07, (1 - blink) * (1 - happySquint)), 1); e.pupil.position.set(gx * 0.075 - e.sd * 0.018, gy * 0.085, 0); }
  const by = T.browY(t);
  for (const b of brows) { const x = b.sd * 0.35, y = 0.535 + by + blink * -0.015; b.m.position.set(x, y, onSphere(x, y, 1.03)); b.m.rotation.set(-0.45, b.sd * 0.3, b.sd * 0.03 + b.sd * -0.06); }
  const open = L.open * 0.78, narrow = L.narrow * 0.32;
  setMouth((0.29 + 0.06 * Math.max(0, smile)) * (1 - narrow), smile * (1 - 0.35 * open), open);
  const hr = T.handR(t), wave = win(t, 0.15, 1.0, 0.2) + win(t, 61.4, 62.3, 0.2), point = win(t, 57.5, 59.4, 0.25), talk = env * 0.04;
  hands[1].position.set(hr[0] + wave * Math.sin(t * 13) * 0.2 + point * Math.abs(Math.sin(t * 6.5)) * 0.1, hr[1] + Math.sin(tn * 2.3) * 0.03 + talk * Math.sin(tn * 6.1) + bob * 0.3, hr[2]);
  hands[0].position.set(-R0[0], R0[1] + Math.sin(tn * 2.3 + 1.7) * 0.03 + talk * Math.sin(tn * 5.3 + 2) + bob * 0.3, R0[2]);
  centerIcons();
  overlay.material.opacity = 1 - ramp(t, 0, 0.3);
  composer.render();
};
window.DURATION = WARP[WARP.length - 1][1];

// ------------------------------------------------------------ copertina (ep3.html?cover=1)
// Centrale intera con cupola e sala turbine trasparenti e tutti i componenti in funzione; niente mascotte e niente icone.
// Il titolo si aggiunge dopo, con make_cover3.py. Parametri facoltativi: cx, cy, cz, ly (camera).
if (q.get('cover')) {
  const base = window.renderFrame;
  window.renderFrame = function (tn) {
    base(58.6 + tn);                                  // momento in cui è tutto acceso: nocciolo, circuiti, vapore, turbina, alternatore
    hud.visible = false;
    domeFront.opacity = bandFront.opacity = 0.1; domeFront.depthWrite = bandFront.depthWrite = false;
    hallFront.opacity = 0.1; winFront.opacity = 0; hallFront.depthWrite = winFront.depthWrite = false;
    coreGlow.material.opacity = 0.38; genGlow.material.opacity = 0.4; loopGlow.material.opacity = 0.12;
    camera.position.set(+(q.get('cx') || 1.3), +(q.get('cy') || 5.2), +(q.get('cz') || -14));
    camera.lookAt(+(q.get('cx') || 1.3), +(q.get('ly') || 4.6), -40);
    overlay.material.opacity = 0;
    composer.render();
  };
}
window.renderFrame(0);
window.ready = true;
