// Puntata 2 — "Perché in Italia si riparla di nucleare?"
// Stessa mascotte e stesso mondo di intro.js. Novità: la collina ruota come un piccolo pianeta
// per passare da un sito all'altro (rinnovabili a sinistra, centrale al centro, fossili a destra).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import LIP_DATA from './lip2.js';

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
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 400);
scene.add(camera);
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.0, ...o });
function mesh(geo, mat, parent, pos) { const m = new THREE.Mesh(geo, mat); if (pos) m.position.copy(pos); parent.add(m); return m; }
const UP = V(0, 1, 0);
function bar(a, b, r, mat, parent) { // cilindro tra due punti
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

// ------------------------------------------------------------ cielo e luci
const skyMat = new THREE.ShaderMaterial({
  uniforms: { top: { value: new THREE.Color() }, bottom: { value: new THREE.Color() } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 1.0, 1.0); }',
  fragmentShader: 'uniform vec3 top; uniform vec3 bottom; varying vec2 vUv; void main(){ gl_FragColor = vec4(mix(bottom, top, smoothstep(0.15, 0.95, vUv.y)), 1.0); }',
  depthTest: false, depthWrite: false,
});
const sky = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), skyMat); sky.frustumCulled = false; sky.renderOrder = -1000; scene.add(sky);
const SKY = {
  day: [new THREE.Color(0x2f86e6), new THREE.Color(0xc6ebff)],
  night: [new THREE.Color(0x091033), new THREE.Color(0x2c4190)],
  smog: [new THREE.Color(0x4b4f59), new THREE.Color(0xa89e8e)],
};
const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x4a6a4a, 1); scene.add(hemi);
const sunL = new THREE.DirectionalLight(0xffffff, 2); sunL.position.set(8, 14, 12); scene.add(sunL);
const key = new THREE.PointLight(0xffffff, 85); key.position.set(3, 4, 9); scene.add(key);
const fill = new THREE.PointLight(0x9fc8ff, 30); fill.position.set(-5, -1, 7); scene.add(fill);
const SUN_DAY = new THREE.Color(0xfff3de), SUN_NIGHT = new THREE.Color(0x8fa8ff), SUN_SMOG = new THREE.Color(0xd9c7ac);

// sole, luna, stelle: restano fermi mentre la collina ruota
const skyObj = new THREE.Group(); scene.add(skyObj);
const sun = glow(0xfff0b0, skyObj, 34);
const moon = new THREE.Group(); skyObj.add(moon);
mesh(new THREE.CircleGeometry(2.3, 48), new THREE.MeshBasicMaterial({ color: 0xf6f2dc }), moon);
[[-0.7, 0.6, 0.5], [0.6, -0.3, 0.38], [-0.2, -0.9, 0.3], [0.9, 0.9, 0.24]].forEach(([x, y, r]) => mesh(new THREE.CircleGeometry(r, 24), new THREE.MeshBasicMaterial({ color: 0xdcd8c2 }), moon, V(x, y, 0.01)));
const moonGlow = glow(0xbfd0ff, moon, 16); moonGlow.position.z = -0.5;
const starsM = new THREE.PointsMaterial({ color: 0xdfe8ff, size: 3.4 * W / 1080, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false });
{ const n = 260, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { pos[i * 3] = (rnd() - 0.5) * 44; pos[i * 3 + 1] = 2 + rnd() * 30; pos[i * 3 + 2] = -100; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); skyObj.add(new THREE.Points(g, starsM)); }

// ------------------------------------------------------------ mondo: colline fisse davanti + "pianeta" che ruota
const front = new THREE.Group(); scene.add(front);
mesh(new THREE.SphereGeometry(30, 200, 100), std(0x58b060, { roughness: 0.95 }), front, V(-9, -32.2, -22));
mesh(new THREE.SphereGeometry(30, 200, 100), std(0x4aa256, { roughness: 0.95 }), front, V(9, -33.6, -17));
const PIV = V(0, -58.5, -40);
const planet = new THREE.Group(); planet.position.copy(PIV); scene.add(planet);
mesh(new THREE.SphereGeometry(60, 320, 160), std(0x6cc070, { roughness: 0.95 }), planet);
function makeSite(angle) { const a = new THREE.Group(); a.rotation.z = angle; planet.add(a); const b = new THREE.Group(); b.position.copy(PIV).multiplyScalar(-1); a.add(b); return b; }
const SITE_A = 0.30;
const world = makeSite(0), siteR = makeSite(SITE_A), siteF = makeSite(-SITE_A);
const hillY = (x, z) => -58.5 + Math.sqrt(3600 - x * x - (z + 40) ** 2);
const trunkM = std(0x7a5236), leafM = std(0x3f9a50, { roughness: 0.9 }), leafM2 = std(0x55b060, { roughness: 0.9 });
function tree(parent, x, z, s, i) {
  const y = hillY(x, z);
  mesh(new THREE.CylinderGeometry(0.1 * s, 0.14 * s, 0.9 * s, 8), trunkM, parent, V(x, y + 0.4 * s, z));
  mesh(new THREE.SphereGeometry(0.62 * s, 16, 12), i % 2 ? leafM : leafM2, parent, V(x, y + 1.15 * s, z));
}
[[-7.2, -37, 1], [-6.3, -35.5, 0.8], [9.2, -37, 1.1], [9.9, -35, 0.85], [1.4, -33, 0.7], [-2.6, -32.5, 0.75], [5.2, -31, 0.6], [-5, -30.5, 0.65]].forEach(([x, z, s], i) => tree(world, x, z, s, i));
[[-6.8, -35, 0.9], [6.6, -36, 1.0], [-0.6, -32, 0.7], [3.4, -31.5, 0.65]].forEach(([x, z, s], i) => tree(siteR, x, z, s, i));
[[-7.0, -35.5, 0.9], [6.9, -34, 0.8], [-1.8, -32, 0.6]].forEach(([x, z, s], i) => tree(siteF, x, z, s, i));
// nuvole
const cloudM = std(0xffffff, { roughness: 1, emissive: 0xdde8f5, emissiveIntensity: 0 });
const clouds = [];
function cloud(parent, x, y, z, s) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.scale.set(s, s * 0.62, s); g.userData.x = x; parent.add(g);
  [[0, 0, 0, 1.5], [1.6, -0.2, 0, 1.1], [-1.6, -0.25, 0, 1.15], [0.7, 0.55, -0.3, 1.0], [-0.8, 0.4, 0.2, 0.9]].forEach(([a, b, c, r]) => mesh(new THREE.SphereGeometry(r, 20, 14), cloudM, g, V(a, b, c)));
  clouds.push(g);
}
[[-6, 12.5, -58, 1.3], [13.5, 16, -62, 1.4], [1.8, 16.5, -66, 1.2], [-9.5, 13.2, -70, 1.5], [8.5, 10.8, -56, 1.0]].forEach(c => cloud(world, ...c));
[[-7.8, 12.8, -60, 1.3], [9.5, 12.5, -64, 1.3], [-2, 19.5, -68, 1.1]].forEach(c => cloud(siteR, ...c));
[[-6.5, 16.5, -62, 1.2], [7, 18, -66, 1.3]].forEach(c => cloud(siteF, ...c));

// ---------------- centrale nucleare (sito centrale)
const prof = []; for (let i = 0; i <= 30; i++) { const y = i / 30 * 8; prof.push(new THREE.Vector2(1.45 * Math.sqrt(1 + ((y - 5.6) / 3.3) ** 2), y)); }
const towerM = std(0xeef1f6, { side: THREE.DoubleSide, roughness: 0.9 });
const stripeM = std(0xe8604a, { roughness: 0.8 });
function tower(parent, x, z, s, y0) {
  const g = new THREE.Group(); g.position.set(x, (y0 ?? hillY(x, z)) - 0.1, z); g.scale.setScalar(s); parent.add(g);
  mesh(new THREE.LatheGeometry(prof, 48), towerM, g);
  mesh(new THREE.CylinderGeometry(1.62, 1.6, 0.35, 48, 1, true), stripeM, g, V(0, 7.83, 0));
  return g;
}
tower(world, -4.3, -40, 1); tower(world, -1.0, -47, 0.95);
const puffs = [];
[[-4.3, -40, 1], [-1.0, -47, 0.95]].forEach(([x, z, s], ti) => {
  for (let k = 0; k < 12; k++) {
    const m = mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false }), world);
    m.userData = { x, z, base: hillY(x, z) + 8 * s, ph: k / 12 + ti * 0.37, a: rnd() * 6.28, r: rnd() * 0.5, s: 0.7 + rnd() * 0.4 };
    puffs.push(m);
  }
});
const DX = 3.7, DZ = -40, DY = hillY(DX, DZ) - 0.1;
const domeM = std(0xf2f4f8, { roughness: 0.85, side: THREE.DoubleSide });
const domeFront = std(0xf2f4f8, { roughness: 0.85, transparent: true, opacity: 1 });
function containment(parent, x, y, z, s, frontMat) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s); parent.add(g);
  mesh(new THREE.CylinderGeometry(2.3, 2.3, 3.2, 48, 1, true, Math.PI / 2, Math.PI), domeM, g, V(0, 1.6, 0));
  mesh(new THREE.SphereGeometry(2.3, 48, 20, Math.PI, Math.PI, 0, Math.PI / 2), domeM, g, V(0, 3.2, 0));
  mesh(new THREE.CylinderGeometry(2.3, 2.3, 3.2, 48, 1, true, -Math.PI / 2, Math.PI), frontMat, g, V(0, 1.6, 0));
  mesh(new THREE.SphereGeometry(2.3, 48, 20, 0, Math.PI, 0, Math.PI / 2), frontMat, g, V(0, 3.2, 0));
  mesh(new THREE.CylinderGeometry(2.36, 2.36, 0.3, 48, 1, true), std(0x3f8fe0), g, V(0, 3.1, 0));
  return g;
}
containment(world, DX, DY, DZ, 1, domeFront);
const coreM = new THREE.MeshStandardMaterial({ color: 0xff9a3a, emissive: 0xff6a18, emissiveIntensity: 0 });
mesh(new THREE.CapsuleGeometry(0.5, 1.2, 8, 24), coreM, world, V(DX - 0.5, DY + 1.4, DZ));
mesh(new THREE.CapsuleGeometry(0.6, 1.3, 8, 24), new THREE.MeshStandardMaterial({ color: 0xb8d4f0, transparent: true, opacity: 0.35, depthWrite: false }), world, V(DX - 0.5, DY + 1.4, DZ));
mesh(new THREE.CapsuleGeometry(0.36, 1.9, 8, 20), std(0x9fb0c8, { metalness: 0.4, roughness: 0.4 }), world, V(DX + 0.85, DY + 1.9, DZ - 0.2));
const coreGlow = glow(0xffa040, world, 5); coreGlow.position.set(DX - 0.5, DY + 1.5, DZ + 1);
mesh(new THREE.BoxGeometry(3.2, 1.7, 2.2), std(0x8fc0ee, { roughness: 0.8 }), world, V(0.2, hillY(0.2, -39) + 0.75, -39));
mesh(new THREE.BoxGeometry(3.4, 0.2, 2.4), std(0x4a6fa8), world, V(0.2, hillY(0.2, -39) + 1.68, -39));
const winM = new THREE.MeshStandardMaterial({ color: 0xfff0a0, emissive: 0xffd860, emissiveIntensity: 0.6 });
for (let i = 0; i < 5; i++) mesh(new THREE.BoxGeometry(0.34, 0.5, 0.05), winM, world, V(-1.0 + i * 0.6, hillY(0.2, -39) + 0.95, -37.88));

// bandiere che sventolano: italiana davanti alla centrale, francese sulla cupola dei vicini (aggiunta più sotto)
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
  f.frustumCulled = false; flags.push({ geo, base: geo.attributes.position.array.slice(), FLW, ph: flags.length * 1.3 });
}
makeFlag(world, -1.7, hillY(-1.7, -35.5) - 0.05, -35.5, ['#0a9246', '#f7f7f2', '#d42b36']);
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

// centrale dei vicini, dietro le colline, e linea elettrica (battuta 7)
const far = new THREE.Group(); world.add(far);
mesh(new THREE.SphereGeometry(12, 64, 32), std(0x63b382, { roughness: 0.95 }), far, V(11, -8, -64));
containment(far, 12.0, 3.6, -63, 0.9, domeM);
tower(far, 8.2, -64, 0.72, 3.5);
makeFlag(far, 10.9, 8.2, -63, ['#0055a4', '#f7f7f2', '#ef4135'], 1.05, 2.7);
const pylonM = std(0x6f7c93, { roughness: 0.5, metalness: 0.3 });
const PYL = [[7.4, -41]].map(([x, z]) => {
  const g = new THREE.Group(); g.position.set(x, hillY(x, z) - 0.1, z); world.add(g);
  const P = (x, y) => V(x, y, 0), r = 0.05;
  [-1, 1].forEach(sd => {
    bar(P(sd * 0.6, 0), P(sd * 0.16, 2.3), 0.065, pylonM, g); bar(P(sd * 0.16, 2.3), P(0, 3.3), 0.055, pylonM, g);
    bar(P(sd * 0.6, 0), P(-sd * 0.38, 1.15), r * 0.8, pylonM, g); bar(P(sd * 0.38, 1.15), P(-sd * 0.16, 2.3), r * 0.8, pylonM, g);
    [[2.3, 0.95], [2.85, 0.62]].forEach(([y, w]) => { mesh(new THREE.SphereGeometry(0.07, 10, 8), std(0xdfe6f0), g, P(sd * w, y - 0.14)); });
  });
  bar(P(-0.38, 1.15), P(0.38, 1.15), r * 0.8, pylonM, g);
  bar(P(-0.95, 2.3), P(0.95, 2.3), r, pylonM, g); bar(P(-0.62, 2.85), P(0.62, 2.85), r, pylonM, g);
  g.userData.s = 1.5; return g;
});
const pylTop = PYL[0].position.clone().add(V(0, 3.3 * 1.5, 0));
const cableCurve = new THREE.CatmullRomCurve3([V(11.4, 5.4, -62), V(9.6, 4.6, -52), pylTop, V(5.5, 3.5, -20), V(4.0, 0.06, 0.2)]);
const cable = mesh(new THREE.TubeGeometry(cableCurve, 160, 0.03, 6), std(0x3b4558), world);
const sparkM = new THREE.MeshStandardMaterial({ color: 0xfff2a0, emissive: 0xffd040, emissiveIntensity: 2.4 });
const cableDots = Array.from({ length: 5 }, () => mesh(new THREE.SphereGeometry(0.13, 12, 10), sparkM, world));

// ---------------- sito rinnovabili
const turbM = std(0xf4f6fa, { roughness: 0.7 });
const turbines = [[-4.6, -41, 1.0, 0.0], [-0.9, -45, 1.05, 1.3], [3.9, -42, 0.95, 2.4], [1.6, -39.5, 0.8, 0.7]].map(([x, z, s, ph], i) => {
  const g = new THREE.Group(); g.position.set(x, hillY(x, z) - 0.1, z); siteR.add(g);
  mesh(new THREE.CylinderGeometry(0.1, 0.2, 6, 16), turbM, g, V(0, 3, 0));
  mesh(new THREE.CapsuleGeometry(0.2, 0.5, 6, 12), turbM, g, V(0, 6, 0.05)).rotation.x = Math.PI / 2;
  const rotor = new THREE.Group(); rotor.position.set(0, 6, 0.5); g.add(rotor);
  mesh(new THREE.SphereGeometry(0.2, 16, 12), turbM, rotor);
  for (let k = 0; k < 3; k++) { const geo = new THREE.CylinderGeometry(0.05, 0.22, 2.7, 8); geo.scale(1, 1, 0.3); geo.translate(0, 1.45, 0); mesh(geo, turbM, rotor).rotation.z = k * 2.094; }
  return { g, rotor, s, ph, grow: i === 3 };
});
const panelM = new THREE.MeshStandardMaterial({ color: 0x21427f, roughness: 0.35, emissive: 0x2a63c8, emissiveIntensity: 0.25 });
const frameM = std(0xdfe6f0);
function solarPanel(parent, x, z) {
  const g = new THREE.Group(); g.position.set(x, hillY(x, z) + 1.0, z); g.rotation.x = 1.0; g.scale.setScalar(1.5); parent.add(g);
  mesh(new THREE.BoxGeometry(1.45, 0.06, 1.0), frameM, g);
  for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) mesh(new THREE.BoxGeometry(0.42, 0.03, 0.42), panelM, g, V(-0.47 + a * 0.47, 0.04, -0.24 + b * 0.48));
  mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.0, 8), frameM, parent, V(x, hillY(x, z) + 0.4, z - 0.2));
}
[[-6.0, -38.2], [-3.7, -38.0], [-1.4, -37.9]].forEach(([x, z]) => solarPanel(siteR, x, z));
// diga
{ const x = 5.0, z = -38.0, y = hillY(x, z);
  const waterM = new THREE.MeshStandardMaterial({ color: 0x3f9be8, roughness: 0.2, emissive: 0x1d5fb0, emissiveIntensity: 0.35 });
  mesh(new THREE.BoxGeometry(4.4, 2.4, 0.5), std(0xb9bfc9, { roughness: 0.9 }), siteR, V(x, y + 1.0, z));
  mesh(new THREE.BoxGeometry(4.7, 0.25, 0.7), std(0x8d949f, { roughness: 0.9 }), siteR, V(x, y + 2.25, z));
  [-1.3, 0, 1.3].forEach(dx => mesh(new THREE.BoxGeometry(0.6, 1.9, 0.08), new THREE.MeshStandardMaterial({ color: 0xcfeaff, emissive: 0x7fc4ff, emissiveIntensity: 0.5 }), siteR, V(x + dx, y + 0.95, z + 0.29)));
  const pool = mesh(new THREE.SphereGeometry(2.5, 32, 16), waterM, siteR, V(x, y - 0.05, z + 1.3)); pool.scale.set(1, 0.16, 0.6);
}

// ---------------- sito fossili
const derrickM = std(0x8e3a36, { roughness: 0.6 });
{ const x = -4.4, z = -39.5, g = new THREE.Group(); g.position.set(x, hillY(x, z) - 0.1, z); siteF.add(g);
  const c = (sx, sz, y) => { const k = lerp(0.95, 0.2, y / 6.2); return V(sx * k, y, sz * k); };
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sz], i, arr) => {
    bar(c(sx, sz, 0), c(sx, sz, 6.2), 0.08, derrickM, g);
    const [nx, nz] = arr[(i + 1) % 4];
    [0, 1.55, 3.1, 4.65, 6.2].forEach((y, k) => { bar(c(sx, sz, y), c(nx, nz, y), 0.05, derrickM, g); if (k < 4) bar(c(sx, sz, y), c(nx, nz, y + 1.55), 0.04, derrickM, g); });
  });
  mesh(new THREE.BoxGeometry(0.75, 0.4, 0.75), std(0x4a4f5a), g, V(0, 6.4, 0));
  mesh(new THREE.CylinderGeometry(0.09, 0.09, 6.2, 8), std(0x3c4048), g, V(0, 3.1, 0));
  mesh(new THREE.BoxGeometry(2.4, 0.3, 2.4), std(0x5a5f6a), g, V(0, 0.15, 0));
}
const flare = new THREE.Group(); { const x = -0.7, z = -44; flare.position.set(x, hillY(x, z) - 0.1, z); siteF.add(flare);
  mesh(new THREE.CylinderGeometry(0.16, 0.22, 5.2, 12), std(0x7a808c, { metalness: 0.3 }), flare, V(0, 2.6, 0));
  mesh(new THREE.CylinderGeometry(0.3, 0.2, 0.3, 12), std(0x5a5f6a), flare, V(0, 5.3, 0)); }
const flameOut = mesh(new THREE.ConeGeometry(0.55, 1.9, 20), new THREE.MeshStandardMaterial({ color: 0x2f8fff, emissive: 0x1f6fff, emissiveIntensity: 2.0, transparent: true, opacity: 0.9 }), flare, V(0, 6.4, 0));
const flameIn = mesh(new THREE.ConeGeometry(0.3, 1.1, 16), new THREE.MeshStandardMaterial({ color: 0xbfe6ff, emissive: 0x9fd8ff, emissiveIntensity: 2.4 }), flare, V(0, 6.0, 0));
const flameGlow = glow(0x4f9fff, flare, 6); flameGlow.position.set(0, 6.3, 0.6);
const FPX = 3.8, FPZ = -43.5, FPY = hillY(FPX, FPZ) - 0.1;
mesh(new THREE.BoxGeometry(4.2, 2.3, 2.6), std(0x8d8f99, { roughness: 0.85 }), siteF, V(FPX, FPY + 1.1, FPZ));
mesh(new THREE.BoxGeometry(4.4, 0.22, 2.8), std(0x5d606a), siteF, V(FPX, FPY + 2.3, FPZ));
const fWinM = new THREE.MeshStandardMaterial({ color: 0xffc070, emissive: 0xff9a30, emissiveIntensity: 0.8 });
for (let i = 0; i < 4; i++) mesh(new THREE.BoxGeometry(0.4, 0.55, 0.05), fWinM, siteF, V(FPX - 1.2 + i * 0.8, FPY + 1.2, FPZ + 1.32));
mesh(new THREE.CylinderGeometry(0.42, 0.6, 8.4, 24), std(0xcfd1d7, { roughness: 0.9 }), siteF, V(FPX + 1.2, FPY + 4.2, FPZ - 0.4));
[6.4, 7.6].forEach(y => mesh(new THREE.CylinderGeometry(0.47, 0.49, 0.5, 24), stripeM, siteF, V(FPX + 1.2, FPY + y, FPZ - 0.4)));
const smoke = [];
for (let k = 0; k < 16; k++) { const m = mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshBasicMaterial({ color: 0x2b272c, transparent: true, opacity: 0, depthWrite: false }), siteF);
  m.userData = { ph: k / 16, a: rnd() * 6.28, r: rnd() * 0.4, s: 0.55 + rnd() * 0.4 }; smoke.push(m); }
const coalM = std(0x25242b, { roughness: 0.75 });
[[0, 0, 0.5], [0.5, -0.05, 0.42], [-0.45, -0.05, 0.4], [0.15, 0.3, 0.36], [0.2, -0.1, 0.45, 0.4], [-0.2, -0.1, 0.4, 0.45]].forEach(([a, b, r, dz = 0]) => mesh(new THREE.SphereGeometry(r, 14, 10), coalM, siteF, V(1.1 + a, hillY(1.1, -40.3) + 0.2 + b, -40.3 + dz)));
const truck = new THREE.Group(); siteF.add(truck);
const wheels = [];
{ const yel = std(0xf2b01e, { roughness: 0.5 });
  mesh(new THREE.BoxGeometry(2.0, 0.55, 1.15), std(0x7d8492, { roughness: 0.7 }), truck, V(0.35, 0.95, 0));
  mesh(new THREE.BoxGeometry(2.1, 0.14, 1.25), std(0x4c515c), truck, V(0.35, 0.62, 0));
  mesh(new THREE.BoxGeometry(0.85, 1.0, 1.1), yel, truck, V(-1.2, 0.98, 0));
  mesh(new THREE.BoxGeometry(0.06, 0.4, 0.8), new THREE.MeshStandardMaterial({ color: 0xbfe2ff, emissive: 0x9fd0ff, emissiveIntensity: 0.3 }), truck, V(-1.64, 1.15, 0));
  mesh(new THREE.BoxGeometry(0.5, 0.4, 0.06), new THREE.MeshStandardMaterial({ color: 0xbfe2ff, emissive: 0x9fd0ff, emissiveIntensity: 0.3 }), truck, V(-1.25, 1.15, 0.56));
  [[-0.3, 0.25, 0.48], [0.3, 0.3, 0.52], [0.9, 0.22, 0.46], [0.0, 0.5, 0.4, 0.2], [0.6, 0.5, 0.38, -0.15], [0.3, 0.2, 0.45, 0.3], [0.75, 0.2, 0.4, -0.3]].forEach(([a, b, r, dz = 0]) => mesh(new THREE.SphereGeometry(r, 14, 10), coalM, truck, V(a, 1.1 + b, dz)));
  [[-1.15, 0.6], [-1.15, -0.6], [0.1, 0.6], [0.1, -0.6], [0.95, 0.6], [0.95, -0.6]].forEach(([x, z]) => { const w = mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 20), std(0x22242a, { roughness: 0.9 }), truck, V(x, 0.34, z)); w.rotation.x = Math.PI / 2; mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.26, 16), std(0x9aa0aa), w); mesh(new THREE.BoxGeometry(0.07, 0.27, 0.2), std(0x5a606c), w); wheels.push(w); });
  truck.scale.setScalar(1.25); }

// ------------------------------------------------------------ mascotte (identica a intro.js)
const mascot = new THREE.Group(); scene.add(mascot);
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
  mesh(new THREE.SphereGeometry(0.045, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffffff }), pupil, V(0.05, 0.06, 0.125));
  mesh(new THREE.SphereGeometry(0.022, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }), pupil, V(-0.04, -0.05, 0.12));
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
const mouth = new THREE.Mesh(mouthGeo, new THREE.MeshBasicMaterial({ color: 0x4a1024, side: THREE.DoubleSide })); mouth.frustumCulled = false; head.add(mouth);
const tongueGeo = mouthGeo.clone();
const tongue = new THREE.Mesh(tongueGeo, new THREE.MeshBasicMaterial({ color: 0xff7088, side: THREE.DoubleSide })); tongue.frustumCulled = false; head.add(tongue);
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
const hat = new THREE.Group(); head.add(hat);
const hatM = std(0xffc928, { roughness: 0.35 });
{ const d = mesh(new THREE.SphereGeometry(0.8, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), hatM, hat); d.scale.y = 0.82;
  mesh(new THREE.CylinderGeometry(0.98, 1.0, 0.07, 40), hatM, hat, V(0, 0.02, 0.08));
  const r = mesh(new THREE.TorusGeometry(0.66, 0.07, 10, 40, Math.PI), hatM, hat, V(0, 0.0, 0)); r.rotation.y = Math.PI / 2; r.scale.y = 1.02; }

// oggetti in mano: moneta, clessidra, foglio di progetto
const goldM = std(0xffc928, { roughness: 0.3, metalness: 0.35, emissive: 0x6a4a00, emissiveIntensity: 0.5 });
const bigCoin = new THREE.Group(); mascot.add(bigCoin);
{ const c = mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.06, 40), goldM, bigCoin); c.rotation.x = Math.PI / 2;
  const r = mesh(new THREE.TorusGeometry(0.22, 0.025, 8, 40), std(0xe09a10, { metalness: 0.3, roughness: 0.4 }), bigCoin, V(0, 0, 0.035)); }
const hourglass = new THREE.Group(); mascot.add(hourglass);
{ const wood = std(0x9a6a3c), glass = new THREE.MeshStandardMaterial({ color: 0xdff1ff, transparent: true, opacity: 0.55, roughness: 0.15 }), sand = std(0xf0c060);
  [-0.36, 0.36].forEach(y => mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.06, 28), wood, hourglass, V(0, y, 0)));
  const a = mesh(new THREE.ConeGeometry(0.22, 0.34, 28), glass, hourglass, V(0, 0.17, 0)); a.rotation.x = Math.PI;
  mesh(new THREE.ConeGeometry(0.22, 0.34, 28), glass, hourglass, V(0, -0.17, 0));
  mesh(new THREE.ConeGeometry(0.15, 0.2, 20), sand, hourglass, V(0, -0.22, 0));
  const s2 = mesh(new THREE.ConeGeometry(0.12, 0.16, 20), sand, hourglass, V(0, 0.2, 0)); s2.rotation.x = Math.PI;
  mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 6), sand, hourglass, V(0, -0.05, 0));
  [[-0.23, 0], [0.23, 0]].forEach(([x, z]) => mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.7, 8), wood, hourglass, V(x, 0, z))); }
const sheet = new THREE.Group(); mascot.add(sheet);
const SHW = 2.5, SHH = 1.45;
const paper = (() => {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 594; const x = c.getContext('2d');
  x.fillStyle = '#2a6fd6'; x.fillRect(0, 0, 1024, 594);
  x.strokeStyle = 'rgba(255,255,255,0.22)'; x.lineWidth = 2;
  for (let i = 1; i < 16; i++) { x.beginPath(); x.moveTo(i * 64, 0); x.lineTo(i * 64, 594); x.stroke(); }
  for (let i = 1; i < 9; i++) { x.beginPath(); x.moveTo(0, i * 66); x.lineTo(1024, i * 66); x.stroke(); }
  x.strokeStyle = '#ffffff'; x.lineWidth = 9; x.lineJoin = 'round'; x.lineCap = 'round';
  x.beginPath(); x.moveTo(60, 470); x.lineTo(964, 470); x.stroke();                                        // terreno
  x.beginPath(); x.moveTo(560, 470); x.lineTo(560, 300); x.arc(690, 300, 130, Math.PI, 0); x.lineTo(820, 470); x.stroke(); // cupola
  x.beginPath(); x.moveTo(560, 300); x.lineTo(820, 300); x.stroke();
  const tw = (cx, s) => { x.beginPath(); x.moveTo(cx - 95 * s, 470); x.quadraticCurveTo(cx - 30 * s, 470 - 190 * s, cx - 62 * s, 470 - 330 * s); x.lineTo(cx + 62 * s, 470 - 330 * s); x.quadraticCurveTo(cx + 30 * s, 470 - 190 * s, cx + 95 * s, 470); x.stroke(); };
  tw(190, 1); tw(390, 0.8);
  x.lineWidth = 5; x.setLineDash([16, 14]); x.beginPath(); x.moveTo(690, 150); x.lineTo(690, 520); x.stroke(); x.beginPath(); x.moveTo(520, 520); x.lineTo(860, 520); x.stroke(); x.setLineDash([]);
  x.beginPath(); x.arc(900, 90, 44, 0, 6.3); x.stroke(); x.beginPath(); x.moveTo(900, 46); x.lineTo(900, 134); x.moveTo(856, 90); x.lineTo(944, 90); x.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
})();
const paperMesh = mesh(new THREE.PlaneGeometry(SHW, SHH), new THREE.MeshBasicMaterial({ map: paper, side: THREE.DoubleSide }), sheet);
const rolls = [-1, 1].map(() => mesh(new THREE.CylinderGeometry(0.07, 0.07, SHH + 0.12, 16), std(0xf4f6fa), sheet));

// ------------------------------------------------------------ oggetti in primo piano
const fg = new THREE.Group(); scene.add(fg);
function bulb(x, y, r) {
  const g = new THREE.Group(); g.position.set(x, y, 0.2); g.scale.setScalar(r); fg.add(g);
  const m = new THREE.MeshStandardMaterial({ color: 0xf2f5fa, roughness: 0.35, emissive: 0x000000, emissiveIntensity: 0 });
  mesh(new THREE.SphereGeometry(1, 32, 24), m, g, V(0, 0.25, 0));
  mesh(new THREE.CylinderGeometry(0.52, 0.66, 0.5, 24), m, g, V(0, -0.62, 0));
  mesh(new THREE.CylinderGeometry(0.46, 0.4, 0.55, 20), std(0x8892a4, { metalness: 0.5, roughness: 0.4 }), g, V(0, -1.08, 0));
  const gl = glow(0xffffff, g, 5.2); gl.position.set(0, 0.25, -0.6);
  return { g, m, gl, r };
}
const WARM = new THREE.Color(0xffc62e), GREEN = new THREE.Color(0x58e07a), OFF = new THREE.Color(0xf2f5fa);
function setBulb(b, scale, lit, col) {
  b.g.visible = scale > 0.001; b.g.scale.setScalar(Math.max(0.001, scale) * b.r);
  b.m.color.copy(OFF).lerp(col, lit); b.m.emissive.copy(col); b.m.emissiveIntensity = lit * 1.05;
  b.gl.material.color.copy(col); b.gl.material.opacity = lit * 0.42;
}
const BY = 0.14;
const B4 = [-1.05, -0.35, 0.35, 1.05].map(x => bulb(x, BY, 0.19));
const B1 = bulb(1.05, BY, 0.19);
const B10 = Array.from({ length: 10 }, (_, i) => bulb(-1.35 + i * 0.3, 0.06, 0.105));
// dischi-icona: nave gasiera e gasdotto
const discM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.93 });
const ringM = new THREE.MeshBasicMaterial({ color: 0x2f7df0 });
function icon(x, y, r = 0.42) {
  const g = new THREE.Group(); g.position.set(x, y, 0.2); fg.add(g);
  mesh(new THREE.CircleGeometry(r, 64), discM, g, V(0, 0, -0.3)); mesh(new THREE.RingGeometry(r, r + 0.035, 64), ringM, g, V(0, 0, -0.3));
  const c = new THREE.Group(); g.add(c); return { g, c, x, y };
}
const icShip = icon(-1.14, 1.18), icPipe = icon(1.14, 1.18);
{ const c = icShip.c, s = new THREE.Shape(); s.moveTo(-0.3, 0.05); s.lineTo(0.3, 0.05); s.lineTo(0.22, -0.1); s.lineTo(-0.24, -0.1); s.closePath();
  const hg = new THREE.ExtrudeGeometry(s, { depth: 0.16, bevelEnabled: false }); hg.translate(0, 0, -0.08); mesh(hg, std(0xd8493a), c, V(0, -0.08, 0));
  mesh(new THREE.BoxGeometry(0.6, 0.03, 0.17), std(0x1e3a6a), c, V(0, -0.02, 0));
  [-0.15, 0.0, 0.15].forEach(x => mesh(new THREE.SphereGeometry(0.07, 18, 12), std(0xf4f6fa, { roughness: 0.4 }), c, V(x - 0.03, 0.02, 0)));
  mesh(new THREE.BoxGeometry(0.09, 0.14, 0.13), std(0xf4f6fa), c, V(0.22, 0.06, 0));
  mesh(new THREE.BoxGeometry(0.62, 0.04, 0.3), new THREE.MeshStandardMaterial({ color: 0x3f9be8, emissive: 0x1d5fb0, emissiveIntensity: 0.4 }), c, V(0, -0.2, 0)); }
{ const c = icPipe.c, pm = std(0xf2b01e, { roughness: 0.4 }), fl = std(0x7d8492, { metalness: 0.4 });
  const a = mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.62, 20), pm, c, V(0, -0.05, 0)); a.rotation.z = Math.PI / 2;
  [-0.2, 0.2].forEach(x => { const f = mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.035, 20), fl, c, V(x, -0.05, 0)); f.rotation.z = Math.PI / 2; });
  mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.16, 8), fl, c, V(0, 0.07, 0));
  const w = mesh(new THREE.TorusGeometry(0.085, 0.02, 8, 24), std(0xd8493a), c, V(0, 0.16, 0)); w.rotation.x = Math.PI / 2;
  mesh(new THREE.BoxGeometry(0.17, 0.02, 0.02), std(0xd8493a), c, V(0, 0.16, 0)); }
const sparks = Array.from({ length: 3 }, () => mesh(new THREE.SphereGeometry(0.045, 12, 10), sparkM, fg));
// casetta con contatore
const house = new THREE.Group(); house.position.set(-0.72, 0.42, 0.2); fg.add(house);
{ mesh(new THREE.BoxGeometry(0.7, 0.46, 0.5), std(0xfff3dc), house);
  const roof = mesh(new THREE.ConeGeometry(0.58, 0.36, 4), std(0xd8493a), house, V(0, 0.41, 0)); roof.rotation.y = Math.PI / 4; roof.scale.z = 0.8;
  mesh(new THREE.BoxGeometry(0.13, 0.24, 0.03), std(0x7a5236), house, V(-0.18, -0.11, 0.26));
  mesh(new THREE.BoxGeometry(0.16, 0.16, 0.03), winM, house, V(0.16, 0.02, 0.26)); }
const meter = new THREE.Group(); meter.position.set(0.5, 0.0, 0.1); house.add(meter);
mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.05, 32), std(0x5f6b80), meter).rotation.x = Math.PI / 2;
mesh(new THREE.CircleGeometry(0.14, 32), new THREE.MeshBasicMaterial({ color: 0xffffff }), meter, V(0, 0, 0.03));
const needle = mesh(new THREE.BoxGeometry(0.025, 0.13, 0.01), new THREE.MeshBasicMaterial({ color: 0xe0382a }), meter, V(0, 0, 0.04)); needle.geometry.translate(0, 0.05, 0);
const coins = Array.from({ length: 7 }, () => { const g = new THREE.Group(); fg.add(g); mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 24), goldM, g).rotation.x = Math.PI / 2; return g; });
function flyCoins(t, a, b, ox, oy, nUse = 7, per = 1.15) { // monetine che volano via in alto a destra
  coins.forEach((c, i) => {
    const ur = (t - a) / per - i / nUse, u = ur % 1, on = i < nUse && ur >= 0 && (t - u * per) < b - 0.2;
    c.visible = on; if (!on) return;
    const sx = 0.6 + hash(i) * 0.5;
    c.position.set(ox + u * (1.9 + sx), oy + u * (1.5 + hash(i + 9) * 0.6) + Math.sin(u * Math.PI) * 0.35, 0.3);
    c.rotation.set(0, t * 7 + i, 0.2); c.scale.setScalar(Math.min(1, u * 8) * (1 - smooth(ramp(u, 0.75, 1))) * 1.1);
  });
}

// lampo bianco / dissolvenze
const overlay = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthTest: false, depthWrite: false }));
overlay.position.z = -1; overlay.renderOrder = 1000; camera.add(overlay);
const composer = new EffectComposer(renderer); composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), 0.45, 0.5, 1.0));
composer.addPass(new OutputPass());

// ------------------------------------------------------------ tempi (in secondi "di scaletta")
// SPEECH: intervalli di parlato previsti. Quando arriva la voce: riempire WARP con i tempi reali
// e sostituire LIP con i dati ricavati dall'audio (stesso formato di intro.js: open/narrow/env per fotogramma).
const SPEECH = [[0.9, 1.6], [1.9, 4.8], [5.3, 8.2], [8.8, 12.9], [13.3, 14.6], [15.2, 18.2], [18.9, 21.2], [21.5, 24.4], [24.9, 26.2], [26.4, 27.3], [27.5, 28.6],
  [29.4, 31.1], [31.5, 34.2], [34.4, 37.6], [38.3, 41.7], [42.3, 43.0], [43.2, 45.3], [45.8, 49.7], [50.3, 51.8], [52.0, 52.5]];
const speechEnv = t => { let e = 0; for (const [a, b] of SPEECH) e = Math.max(e, Math.min(ramp(t, a, a + 0.07), 1 - ramp(t, b - 0.09, b))); return e; };
let LIP = q.get('lip') === '0' ? null : LIP_DATA; // { open, narrow, env } a 30 fps, da audio/voice3.py
function lip(tn, t) {
  if (LIP) { const fi = Math.min(LIP.open.length - 1, Math.max(0, Math.round(tn * 30))); return { open: LIP.open[fi], narrow: LIP.narrow[fi], env: LIP.env[fi] }; }
  const env = speechEnv(t), syl = Math.floor(t * 5.5), u = t * 5.5 - syl;
  return { env, open: env * Math.sin(u * Math.PI) ** 0.7 * (0.55 + 0.45 * hash(syl)), narrow: env * (0.25 + 0.6 * hash(syl + 50)) };
}
const BLINKS = [3.4, 6.6, 10.2, 12.4, 16.0, 19.6, 22.8, 25.6, 30.2, 33.6, 36.4, 39.8, 44.2, 47.6, 51.0];
const END = 54.5;
// [tempo di scaletta, tempo reale]: tempi reali presi dalle frasi della voce (audio/phrases3.json)
const WARP = [[0, 0], [0.95, 0.72], [1.6, 1.15], [1.9, 1.79], [3.4, 3.95], [4.8, 6.01], [5.3, 6.62], [8.2, 8.80], [8.8, 10.32], [11.5, 12.18], [12.9, 14.70], [13.3, 15.27], [14.6, 16.34],
  [15.2, 17.06], [18.2, 20.43], [18.9, 21.48], [21.2, 24.85], [21.5, 25.44], [22.3, 26.47], [22.6, 26.78], [24.4, 28.74], [24.9, 29.08], [26.2, 30.47], [26.4, 30.83], [27.3, 31.68], [27.5, 31.93], [28.6, 32.57],
  [29.4, 33.46], [31.1, 34.67], [31.5, 35.17], [34.2, 37.49], [34.4, 37.96], [37.6, 41.16], [38.3, 42.31], [41.7, 45.40], [42.3, 47.05], [43.2, 47.50], [44.1, 48.65], [45.3, 49.78], [45.8, 50.25], [49.7, 53.63],
  [50.3, 54.35], [51.8, 55.54], [52.0, 55.96], [52.5, 56.41], [END, 58.40]];
function unwarp(tn) { for (let i = 0; i < WARP.length - 1; i++) { const [o0, n0] = WARP[i], [o1, n1] = WARP[i + 1]; if (tn <= n1) return o0 + (o1 - o0) * (tn - n0) / (n1 - n0); } return END; }
window.WARP = WARP;

const R0 = [1.2, -0.3, 0.35], CHEEK = [0.42, -0.5, 0.92], OPEN = [1.3, 0.15, 0.45], UPP = [1.42, 0.85, 0.2], LOW = [0.55, -0.45, 0.9], HOLD = [1.21, 1.28, 0.5];
const mir = k => k.map(([t, [x, y, z]]) => [t, [-x, y, z]]);
const HR = [[0, R0], [0.9, R0], [1.2, [1.32, 0.8, 0.3]], [2.4, [1.32, 0.8, 0.3]], [2.9, [1.15, 0.75, 0.4]], [4.7, [1.15, 0.75, 0.4]], [5.4, CHEEK], [8.2, CHEEK], [8.9, OPEN], [11.3, OPEN], [11.7, [1.0, 0.95, 0.45]], [12.9, [1.0, 0.95, 0.45]],
  [13.3, UPP], [14.7, UPP], [15.4, LOW], [18.4, LOW], [19.2, [1.3, 0.55, 0.4]], [24.4, [1.3, 0.55, 0.4]], [25.0, [1.25, -0.05, 0.5]], [27.2, [1.25, -0.05, 0.5]], [27.6, [0.3, -0.22, 1.0]], [28.8, [0.3, -0.22, 1.0]],
  [29.4, [0.6, -0.35, 0.95]], [30.4, [0.6, -0.35, 0.95]], [30.8, [1.15, 0.72, 0.4]], [31.4, [1.15, 0.72, 0.4]], [31.8, [1.05, 1.0, 0.45]], [33.0, [1.05, 1.0, 0.45]], [33.5, OPEN], [37.6, OPEN], [38.3, [1.35, 0.75, 0.3]], [41.6, [1.35, 0.75, 0.3]],
  [42.3, [1.15, 0.3, 0.55]], [45.4, [1.15, 0.3, 0.55]], [45.9, R0], [46.3, HOLD], [49.8, HOLD], [50.3, [1.2, 0.55, 0.65]], [52.3, [1.2, 0.55, 0.65]], [52.5, [1.32, 0.95, 0.2]]];
const HL = [[0, R0], [2.5, R0], [2.9, [1.15, 0.75, 0.4]], [4.7, [1.15, 0.75, 0.4]], [5.4, CHEEK], [8.2, CHEEK], [8.9, OPEN], [12.9, OPEN], [13.3, UPP], [14.7, UPP], [15.4, LOW], [18.4, LOW], [19.2, R0], [24.6, R0], [25.0, [1.25, -0.05, 0.5]], [28.8, [1.25, -0.05, 0.5]],
  [29.4, [0.6, -0.35, 0.95]], [30.4, [0.6, -0.35, 0.95]], [30.8, R0], [33.0, R0], [33.5, OPEN], [37.6, OPEN], [38.3, R0], [41.9, R0], [42.3, [1.15, 0.3, 0.55]], [45.4, [1.15, 0.3, 0.55]], [45.9, R0], [46.3, HOLD], [49.8, HOLD], [50.3, R0], [52.3, R0], [52.5, [1.32, 0.95, 0.2]]];
const T = {
  // rot è in tempo REALE (secondi del video), così la rotazione resta fluida qualunque sia il ritmo della voce
  rot: track([[9.0, 0], [10.45, -SITE_A], [20.55, -SITE_A], [22.0, SITE_A], [32.6, SITE_A], [33.95, 0], [41.6, 0], [42.5, 0.05], [45.7, 0.05], [46.6, 0]]),
  night: track([[15.0, 0], [16.6, 1], [18.8, 1], [20.0, 0], [33.0, 0], [33.9, 1], [35.2, 1], [36.2, 0]]),
  smog: track([[18.8, 0], [20.0, 0.5], [26.8, 0.55], [28.3, 1], [29.2, 1], [30.5, 0]]),
  pos: track([[0, [0, -0.92, 0.7]], [29.2, [0, -0.92, 0.7]], [29.7, [0, -0.66, 0.9]], [31.2, [0, -0.66, 0.9]], [31.8, [0, -0.92, 0.7]], [45.6, [0, -0.92, 0.7]], [46.2, [0, -1.0, 0.64]], [49.9, [0, -1.0, 0.64]], [50.5, [0, -0.5, 1.0]], [53, [0, -0.5, 1.0]]]),
  smile: track([[0, 0.9], [4.8, 0.9], [5.4, -0.5], [8.2, -0.5], [8.9, 0.85], [14.8, 0.95], [15.5, -0.25], [18.4, -0.3], [19.2, -0.45], [28.7, -0.55], [29.4, 0.9], [41.9, 0.95], [42.4, 0.1], [45.4, 0.15], [46, 0.8], [54.5, 1]]),
  sad: track([[0, -0.03], [4.8, -0.03], [5.4, 0.45], [8.2, 0.45], [8.9, -0.03], [14.8, -0.03], [15.5, 0.3], [18.4, 0.3], [19.2, 0.4], [28.7, 0.5], [29.4, -0.28], [31.3, -0.28], [32, -0.05], [42.2, -0.03], [42.6, 0.15], [45.4, 0.12], [46, -0.2], [49.8, -0.1], [54.5, -0.1]]),
  browY: track([[0, 0.07], [5.3, 0.07], [5.6, 0.02], [8.4, 0.02], [8.9, 0.09], [13.2, 0.07], [13.5, 0.12], [14.8, 0.1], [15.5, 0.03], [28.8, 0.02], [29.4, 0.05], [31.4, 0.05], [31.8, 0.1], [41.8, 0.08], [42.4, 0.04], [45.6, 0.04], [46, 0.1], [54.5, 0.08]]),
  browAsym: track([[0, 0], [1, 0]]),
  eyeS: track([[0, 1.05], [5.3, 1.04], [5.7, 1.14], [8.2, 1.12], [8.8, 1.04], [15.3, 1.04], [15.8, 1.16], [18.4, 1.1], [29.2, 1.08], [29.6, 1.02], [31.5, 1.02], [31.9, 1.14], [33.2, 1.04], [54.5, 1.05]]),
  gaze: track([[0, [0, -0.5]], [0.9, [0, 0]], [2.3, [0, 0]], [2.7, [-0.7, 0.9]], [3.2, [-0.7, 0.9]], [3.6, [0.7, 0.9]], [4.2, [0.7, 0.9]], [4.6, [0, 0]], [5.4, [-0.5, 0.9]], [6.3, [0.6, 0.95]], [7.2, [0, 0]], [8.6, [0, 0]], [9.2, [-0.5, 0.95]], [10.2, [0.5, 0.95]], [11.0, [0, 0]],
    [11.8, [0, 0.8]], [12.8, [0, 0.8]], [13.3, [0, 0]], [15.3, [0, 0]], [15.8, [0.3, 0.95]], [17.0, [-0.3, 0.9]], [17.8, [0, 0]], [19.4, [0, 0]], [20.0, [-0.6, 0.9]], [21.2, [-0.6, 0.9]], [21.6, [0, 0.95]], [22.6, [0, 0.95]], [23.0, [0.75, 0.8]], [24.4, [0.75, 0.8]], [24.9, [0, 0]],
    [26.2, [0, 0]], [26.5, [0.7, 0.7]], [27.2, [0.7, 0.7]], [27.6, [0.4, 0.95]], [28.6, [0.4, 0.95]], [29.3, [0, 0]], [31.6, [0, 0]], [32.0, [0.4, 0.95]], [33.0, [0.4, 0.95]], [33.5, [0, 0]], [34.0, [0, 0.9]], [35.2, [0, 0.9]], [35.8, [0, 0]], [38.2, [0, 0]], [38.7, [0.8, 0.9]], [40.4, [0.8, 0.9]], [40.9, [0, 0]],
    [45.9, [0, 0]], [46.4, [0, 0.95]], [47.6, [0, 0.95]], [48.0, [0, 0]], [54.5, [0, 0]]]),
  handR: track(HR), handL: track(mir(HL)),
  dome: track([[31.5, 1], [32.8, 0.12], [37.4, 0.12], [38.2, 1]]),
  far: track([[37.9, 0], [38.8, 1], [41.9, 1], [42.6, 0]]),
};
const C1 = new THREE.Color(), C2 = new THREE.Color(), CW = new THREE.Color(0xffffff), CNP = new THREE.Color(0x8e9cc8);
const turbAngle = t => 2.4 * (t < 15.6 ? t : t < 17.4 ? 15.6 + (t - 15.6) - (t - 15.6) ** 2 / 3.6 : 16.5);

window.renderFrame = function (tn) {
  const t = unwarp(tn);
  const n = T.night(t), s = T.smog(t) * (1 - n), day = clamp01(1 - n - s);
  // cielo e luci
  C1.copy(SKY.day[0]).lerp(SKY.smog[0], s).lerp(SKY.night[0], n); skyMat.uniforms.top.value.copy(C1);
  C2.copy(SKY.day[1]).lerp(SKY.smog[1], s).lerp(SKY.night[1], n); skyMat.uniforms.bottom.value.copy(C2);
  hemi.intensity = 1.32 * day + 0.34 * n + 0.8 * s; sunL.intensity = 2.45 * day + 0.42 * n + 1.1 * s;
  sunL.color.copy(SUN_DAY).lerp(SUN_SMOG, s).lerp(SUN_NIGHT, n);
  key.intensity = 30 + 14 * n + 4 * s; fill.intensity = 30;
  sun.position.set(6.4, lerp(17.5, -12, smooth(n)), -85); sun.material.opacity = 0.95 * (1 - n) * (1 - 0.75 * s);
  moon.position.set(5.4, lerp(-12, 19.3, smooth(n)), -84); moon.visible = n > 0.01; moonGlow.material.opacity = 0.5 * n;
  starsM.opacity = 0.9 * n;
  // collina che ruota
  planet.rotation.z = T.rot(tn);
  clouds.forEach((c, i) => { c.position.x = c.userData.x + Math.sin(t * 0.05 + i) * 0.8 + t * 0.02; });
  cloudM.color.setHex(0xffffff).lerp(C1.setHex(0x8f8a84), s).lerp(C2.setHex(0x6676a8), n); cloudM.emissiveIntensity = 0.3 * day;
  // centrale
  for (const m of puffs) {
    const d = m.userData, ph = (t * 0.085 + d.ph) % 1;
    m.position.set(d.x + Math.cos(d.a) * d.r * (1 + ph) + ph * ph * 2.2, d.base + ph * 6.5, d.z + Math.sin(d.a) * d.r);
    m.scale.setScalar(d.s * (0.95 + ph * 1.9));
    m.material.opacity = 0.55 * Math.min(1, ph * 6) * (1 - ph); m.material.color.copy(CW).lerp(CNP, n);
  }
  domeFront.opacity = T.dome(t); domeFront.depthWrite = domeFront.opacity > 0.99;
  const reveal = 1 - (T.dome(t) - 0.12) / 0.88;
  coreM.emissiveIntensity = 2.2 * reveal * (1 + 0.08 * Math.sin(t * 7)); coreGlow.material.opacity = 0.5 * reveal;
  winM.emissiveIntensity = 0.7 + 1.3 * n;
  waveFlag(tn);
  // vicini e linea elettrica
  const fa = T.far(t);
  far.visible = cable.visible = fa > 0.001; far.position.set(-0.9, (1 - fa) * -9, 0);
  PYL.forEach((g, i) => { const a = backOut(ramp(t, 38.3, 38.75)) * (1 - smooth(ramp(t, 41.9, 42.4))); g.visible = a > 0.001; g.scale.setScalar(Math.max(0.001, a) * g.userData.s); });
  cable.scale.y = 1; cable.material.opacity = 1; cable.visible = t > 38.75 && t < 42.0;
  cableDots.forEach((d, i) => { const ur = (t - 38.9) * 0.65 - i / cableDots.length; d.visible = ur >= 0 && t < 42.0; if (d.visible) { const u = ur % 1; cableCurve.getPointAt(u, d.position); d.scale.setScalar(lerp(1, 0.28, u * u)); } });
  // rinnovabili
  for (const tb of turbines) {
    tb.rotor.rotation.z = -(turbAngle(t) * (1.5 - tb.s * 0.5) + tb.ph);
    const gs = tb.grow ? backOut(ramp(t, 13.4, 14.1)) : 1; tb.g.visible = gs > 0.001; tb.g.scale.setScalar(Math.max(0.001, gs) * tb.s);
  }
  panelM.emissiveIntensity = 0.45 * (1 - n);
  // fossili
  const fl = pop(t, 21.5, 29.6, 0.4, 0.5), fk = 1 + 0.12 * Math.sin(t * 23) + 0.08 * Math.sin(t * 37.3);
  flameOut.visible = flameIn.visible = fl > 0.001;
  flameOut.scale.set(fl * (1 + 0.06 * Math.sin(t * 31)), fl * fk, fl); flameOut.position.y = 5.45 + 0.95 * fl * fk;
  flameIn.scale.set(fl, fl * (2 - fk), fl); flameIn.position.y = 5.45 + 0.55 * fl * (2 - fk);
  flameGlow.material.opacity = 0.55 * clamp01(fl);
  const sm = lerp(0.35, 1, smooth(ramp(t, 26.6, 28.2)));
  for (const m of smoke) {
    const d = m.userData, ph = (t * 0.11 + d.ph) % 1;
    m.position.set(FPX + 1.2 + Math.cos(d.a) * d.r * (1 + ph) - ph * ph * 3.2, FPY + 8.5 + ph * 7.5, FPZ - 0.4 + Math.sin(d.a) * d.r);
    m.scale.setScalar(d.s * (0.8 + ph * 2.4) * (0.7 + 0.6 * sm));
    m.material.opacity = 0.85 * sm * Math.min(1, ph * 6) * (1 - ph);
  }
  { const u = ramp(t, 22.6, 23.9), e = 1 - (1 - u) ** 3, x = lerp(13, 4.5, e), z = -37.2;
    truck.position.set(x, hillY(x, z) - 0.08 + Math.abs(Math.sin(t * 19)) * 0.03 * (1 - u), z); truck.rotation.z = Math.atan2(hillY(x - 0.5, z) - hillY(x + 0.5, z), 1) * -1;
    wheels.forEach(w => { w.rotation.y = x * 2.4; }); }

  // primo piano: lampadine
  B4.forEach((b, i) => {
    const sc = pop(t, 1.9 + i * 0.12, 5.0 + i * 0.05) + pop(t, 32.6 + i * 0.1, 37.9 + i * 0.05);
    let lit, col = WARM;
    if (t < 20) { if (i === 3) { lit = ramp(t, 2.5, 2.8); col = GREEN; } else lit = ramp(t, 3.58 + i * 0.32, 3.8 + i * 0.32); }
    else lit = ramp(t, 33.0 + i * 0.1, 33.25 + i * 0.1) * (0.92 + 0.08 * Math.sin(t * 5 + i));
    setBulb(b, sc, lit, col);
  });
  setBulb(B1, pop(t, 38.6, 42.1), ramp(t, 40.4, 40.6) * (0.92 + 0.08 * Math.sin(t * 5)), WARM);
  B10.forEach((b, i) => {
    const sc = pop(t, 11.3 + i * 0.05, 18.3 + i * 0.02, 0.3, 0.3);
    let lit = i < 4 ? ramp(t, 12.0 + i * 0.16, 12.2 + i * 0.16) : 0;
    if (t > 16.6) { const fli = t < 17.5 ? 0.55 + 0.45 * Math.sign(Math.sin(t * 41 + i * 2.1) + 0.35) : 0; lit *= fli * (1 - ramp(t, 17.3, 17.6)); }
    setBulb(b, sc, lit, GREEN);
  });
  // dischi nave / gasdotto e scintille di energia
  [icShip, icPipe].forEach((ic, i) => {
    const a = pop(t, 2.75 + i * 0.5, 5.0 + i * 0.06) + pop(t, 25.0 + i * 0.2, 26.5 + i * 0.06);
    ic.g.visible = a > 0.001; ic.g.scale.setScalar(Math.max(0.001, a));
    ic.g.position.y = (t > 20 ? 0.62 : ic.y) + Math.sin(t * 1.6 + i * 1.3) * 0.03; ic.c.rotation.y = Math.sin(t * 1.3 + i) * 0.3;
  });
  sparks.forEach((sp, bi) => { // una scintilla per lampadina, un solo passaggio
    const src = bi < 2 ? icShip : icPipe, t0 = 3.1 + bi * 0.32, u = (t - t0) / 0.5;
    sp.visible = u > 0 && u < 1;
    if (sp.visible) sp.position.set(lerp(src.x, B4[bi].g.position.x, u), lerp(src.y - 0.2, BY + 0.25, u) + Math.sin(u * Math.PI) * 0.18, 0.3);
  });
  // casetta, contatore, monetine
  { const a = pop(t, 5.2, 8.4); house.visible = a > 0.001; house.scale.setScalar(Math.max(0.001, a)); needle.rotation.z = -t * 5; }
  if (t < 15) { flyCoins(t, 5.9, 7.6, -0.2, 0.55, 3, 1.5); const k = 1 - smooth(ramp(t, 8.15, 8.4)); coins.forEach(c => c.scale.multiplyScalar(k)); } else flyCoins(t, 26.3, 28.2, -0.5, -0.1);

  // mascotte
  let [mx, my, ms] = T.pos(t);
  my += (1 - backOut(ramp(t, 0.1, 0.95))) * 5.2;
  const bob = Math.sin(t * 1.9) * 0.07;
  const zoom = ramp(t, 52.45, 53.0), zz = zoom * zoom * zoom;
  mascot.position.set(mx, my + bob + zz * 0.4, zz * 9.6); mascot.scale.setScalar(ms); mascot.visible = t < 53.0;
  const L = lip(tn, t), env = L.env;
  const [gx, gy] = T.gaze(t);
  head.rotation.set(-gy * 0.3 + env * Math.sin(t * 5.2) * 0.035, gx * 0.36, Math.sin(t * 1.1) * 0.05 + env * Math.sin(t * 2.6) * 0.04 - gx * 0.06);
  const anticip = ramp(t, 52.15, 52.45) * (1 - ramp(t, 52.45, 52.6));
  head.scale.set(1 + 0.1 * anticip, 1 - 0.12 * anticip, 1 + 0.1 * anticip);
  let blink = 0; for (const b of BLINKS) blink = Math.max(blink, 1 - Math.abs(t - b) / 0.085);
  blink = clamp01(blink);
  const wink = 0;
  const es = T.eyeS(t), happySquint = 0.1 * Math.max(0, T.smile(t) - 0.6) / 0.4;
  for (const e of eyes) {
    const closed = Math.max(blink, e.sd === 1 ? wink : 0);
    e.g.scale.set(es, es * Math.max(0.07, (1 - closed) * (1 - happySquint)), 1);
    e.pupil.position.set(gx * 0.075 - e.sd * 0.018, gy * 0.085, 0);
  }
  const sad = T.sad(t), by = T.browY(t), asym = T.browAsym(t);
  for (const b of brows) {
    const x = b.sd * 0.35, y = 0.535 + by + (b.sd === 1 ? asym : 0) + blink * -0.015;
    b.m.position.set(x, y, onSphere(x, y, 1.03)); b.m.rotation.set(-0.45, b.sd * 0.3, -b.sd * sad + b.sd * -0.06);
  }
  const open = L.open * 0.78, narrow = L.narrow * 0.32, smile = T.smile(t);
  const surprise = win(t, 15.45, 16.1, 0.12) * (1 - env);
  setMouth((0.29 + 0.06 * Math.max(0, smile)) * (1 - narrow) * (1 - 0.45 * surprise), smile * (1 - 0.35 * open), Math.max(open, surprise * 0.55, wink * 0.25 * (1 - env)));
  const hr = T.handR(t), hl = T.handL(t);
  const holding = win(t, 46.2, 49.9, 0.2);
  const wave = win(t, 1.1, 2.5, 0.25), cheer = win(t, 13.3, 14.7, 0.2), beckon = win(t, 50.4, 52.3, 0.15), talk = env * 0.05 * (1 - holding);
  hands[1].position.set(hr[0] + wave * Math.sin(t * 11) * 0.2 + beckon * Math.sin(t * 13) * 0.05, hr[1] + Math.sin(t * 2.3) * 0.03 + talk * Math.sin(t * 6.1) + cheer * Math.abs(Math.sin(t * 9)) * 0.16 + beckon * Math.cos(t * 13) * 0.12 + bob * 0.3, hr[2]);
  hands[0].position.set(hl[0], hl[1] + Math.sin(t * 2.3 + 1.7) * 0.03 + talk * Math.sin(t * 5.3 + 2) + cheer * Math.abs(Math.sin(t * 9 + 0.6)) * 0.16 + bob * 0.3, hl[2]);
  // casco
  const hatIn = ramp(t, 45.75, 46.1), hatOut = ramp(t, 50.0, 50.45);
  hat.visible = t > 45.75 && t < 50.45;
  const hb = hatIn < 1 ? (1 - hatIn) * (1 - hatIn) * 4 : Math.max(0, Math.sin((t - 46.1) * 18) * 0.06 * Math.exp(-(t - 46.1) * 7));
  hat.position.set(hatOut * 0.6, 0.66 + hb + hatOut * hatOut * 6, -0.02); hat.rotation.set(-0.2, 0, -0.1 - hatOut * 2);
  // moneta e clessidra ("costa, e ci vuole tempo")
  { const a = pop(t, 42.5, 45.5, 0.3, 0.25); bigCoin.visible = a > 0.001; bigCoin.scale.setScalar(Math.max(0.001, a));
    bigCoin.position.set(hands[1].position.x + 0.05, hands[1].position.y + 0.55, hands[1].position.z); bigCoin.rotation.y = Math.sin(t * 2.2) * 0.9;
    const b = pop(t, 43.3, 45.6, 0.3, 0.25); hourglass.visible = b > 0.001; hourglass.scale.setScalar(Math.max(0.001, b));
    hourglass.position.set(hands[0].position.x - 0.05, hands[0].position.y + 0.68, hands[0].position.z); hourglass.rotation.z = Math.sin(t * 1.7) * 0.12 + smooth(ramp(t, 44.3, 44.9)) * Math.PI; }
  // foglio di progetto
  { const u = backOut(ramp(t, 46.25, 46.85)) * (1 - smooth(ramp(t, 49.75, 50.1)));
    sheet.visible = u > 0.01; sheet.position.set(0, 2.03 + bob * 0.2, 0.5); paperMesh.scale.x = Math.max(0.01, u);
    rolls.forEach((r, i) => { r.position.x = (i ? 1 : -1) * SHW / 2 * u; });
    if (holding > 0) { hands[1].position.x = lerp(hands[1].position.x, SHW / 2 * u + 0.02, holding); hands[0].position.x = lerp(hands[0].position.x, -SHW / 2 * u - 0.02, holding); } }

  camera.position.set(Math.sin(t * 0.21) * 0.12, 0.2 + Math.sin(t * 0.17) * 0.05, 11);
  camera.lookAt(0, 0.2, 0);
  const flashA = Math.max(ramp(t, 52.7, 53.0) * (1 - ramp(t, 53.0, 53.6)), 0), fadeIn = 1 - ramp(t, 0, 0.35);
  overlay.material.color.setHex(fadeIn > 0 ? 0x2f86e6 : 0xffffff);
  overlay.material.opacity = Math.max(flashA, fadeIn);
  composer.render();
};
window.DURATION = WARP[WARP.length - 1][1];

// ------------------------------------------------------------ copertina (ep2.html?cover=1)
// Centrale in primo piano, rinnovabili sullo sfondo a sinistra e fossili a destra, senza mascotte.
if (q.get('cover')) {
  const COVER = { R: V(-7.5, 14, -42), F: V(7.5, 14, -42) };
  [[siteR, COVER.R, 0x5fb56a], [siteF, COVER.F, 0x57ac62]].forEach(([g, off, col]) => {
    g.parent.rotation.z = 0; g.position.copy(PIV).multiplyScalar(-1).add(off);
    mesh(new THREE.SphereGeometry(60, 320, 160), std(col, { roughness: 0.95 }), g, PIV.clone());   // la loro collina
  });
  // qualcosa sta sul pendio davanti alla collina di sfondo (sempre nello sfondo, dietro la centrale)
  [[-2.6, -24.5], [-0.3, -24.2], [2.0, -24.5]].forEach(([x, z]) => solarPanel(siteR, x, z));
  tree(siteR, 4.6, -21.5, 1.2, 0); tree(siteR, -4.6, -20, 1.1, 1); tree(siteF, -4.2, -21, 1.2, 1); tree(siteF, 4.4, -26, 1.0, 0);
  const base = window.renderFrame;
  window.renderFrame = function (tn) {
    base(16.0);                                   // giorno pieno, pale in movimento, quarta pala già spuntata
    const t = 16.0 + tn;
    planet.rotation.z = 0; fg.visible = false; mascot.visible = false; far.visible = false; cable.visible = false; PYL.forEach(g => { g.visible = false; });
    cableDots.forEach(d => { d.visible = false; });
    domeFront.opacity = 1; domeFront.depthWrite = true; coreGlow.material.opacity = 0;   // cupola chiusa
    flameOut.visible = flameIn.visible = true; flameOut.scale.setScalar(1); flameOut.position.y = 6.4; flameIn.scale.setScalar(1); flameIn.position.y = 6.0; flameGlow.material.opacity = 0.55;
    for (const m of smoke) {
      const d = m.userData, ph = (t * 0.11 + d.ph) % 1;
      m.position.set(FPX + 1.2 + Math.cos(d.a) * d.r * (1 + ph) + ph * 4 + ph * ph * 9, FPY + 8.6 + ph * 4.6, FPZ - 0.4 + Math.sin(d.a) * d.r);   // fumo verso destra, fuori quadro
      m.scale.setScalar(d.s * (0.7 + ph * 2.2) * 1.3); m.material.opacity = 0.85 * Math.min(1, ph * 6) * (1 - ph);
    }
    truck.position.set(0.6, hillY(0.6, -18) - 0.05, -18); truck.rotation.set(0.36, 0, 0);   // camion sul pendio
    sun.position.set(-10.5, 27, -90); overlay.material.opacity = 0;
    clouds.forEach(c => { c.visible = c.parent === siteR; });
    for (const m of puffs) { m.material.opacity *= 0.5; m.scale.multiplyScalar(0.6); m.position.y = m.userData.base + (m.position.y - m.userData.base) * 0.45; }
    camera.position.set(0, 5, 8); camera.lookAt(0, 9.5, -43);
    composer.render();
  };
}
window.renderFrame(0);
window.ready = true;
