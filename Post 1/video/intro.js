import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const q = new URLSearchParams(location.search);
const W = +(q.get('w') || 1080), H = +(q.get('h') || 1920);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp01 = x => Math.min(1, Math.max(0, x));
const smooth = x => { x = clamp01(x); return x * x * (3 - 2 * x); };
const ramp = (t, a, b) => clamp01((t - a) / (b - a));
const lerp = (a, b, u) => a + (b - a) * u;
const hash = k => { const s = Math.sin(k * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const backOut = x => { x = clamp01(x); const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
let seed = 777; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
// keyframe tracks (scalars or arrays), smooth interpolation, held outside range
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

const glowTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'), gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.5)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c);
})();

// ------------------------------------------------------------ sky
const skyMat = new THREE.ShaderMaterial({
  uniforms: { top: { value: new THREE.Color() }, bottom: { value: new THREE.Color() }, flash: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 1.0, 1.0); }',
  fragmentShader: 'uniform vec3 top; uniform vec3 bottom; uniform float flash; varying vec2 vUv; void main(){ vec3 c = mix(bottom, top, smoothstep(0.15, 0.95, vUv.y)); gl_FragColor = vec4(c + flash * vec3(0.5,0.45,0.6), 1.0); }',
  depthTest: false, depthWrite: false,
});
const sky = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), skyMat); sky.frustumCulled = false; sky.renderOrder = -1000; scene.add(sky);
const SKY = {
  space: [new THREE.Color(0x070b2a), new THREE.Color(0x24348a)],
  fear: [new THREE.Color(0x0c070f), new THREE.Color(0x70242c)],
  day: [new THREE.Color(0x2f86e6), new THREE.Color(0xc6ebff)],
};

const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x4a6a4a, 1); scene.add(hemi);
const sunL = new THREE.DirectionalLight(0xffffff, 2); sunL.position.set(8, 14, 12); scene.add(sunL);
const key = new THREE.PointLight(0xffffff, 85); key.position.set(3, 4, 9); scene.add(key);
const fill = new THREE.PointLight(0x9fc8ff, 30); fill.position.set(-5, -1, 7); scene.add(fill);
const SUN_FEAR = new THREE.Color(0xff5a4a), SUN_DAY = new THREE.Color(0xfff3de);

// ------------------------------------------------------------ space (scene 1)
const space = new THREE.Group(); scene.add(space);
{
  const n = 420, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { pos[i * 3] = (rnd() - 0.5) * 70; pos[i * 3 + 1] = (rnd() - 0.5) * 110; pos[i * 3 + 2] = -90 - rnd() * 30; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  space.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xcfdcff, size: 3.2 * W / 1080, sizeAttenuation: false, transparent: true, opacity: 0.9 })));
}
const bokeh = [];
for (let i = 0; i < 34; i++) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: [0x6fa8ff, 0x9d8cff, 0x58d0ff][i % 3], transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending }));
  s.userData = { x: (rnd() - 0.5) * 16, z: -6 - rnd() * 22, ph: rnd(), sp: 0.03 + rnd() * 0.04, sc: 0.8 + rnd() * 2.2 };
  space.add(s); bokeh.push(s);
}
const PROT = std(0xf06a52, { roughness: 0.4 }), NEUT = std(0x6db8ff, { roughness: 0.4 });
const bgNucleus = new THREE.Group(); bgNucleus.position.set(3.2, 6.2, -16); space.add(bgNucleus);
const bgParts = [];
for (let i = 0; i < 46; i++) {
  let p; do { p = V(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1); } while (p.lengthSq() > 1);
  const m = mesh(new THREE.SphereGeometry(0.62, 20, 14), i % 5 < 2 ? PROT : NEUT, bgNucleus, p.multiplyScalar(2.3));
  bgParts.push({ m, p: m.position.clone(), f: 2 + rnd() * 3, o: rnd() * 6.28 });
}

// ------------------------------------------------------------ world (hill + plant)
const world = new THREE.Group(); scene.add(world);
const hillMat = std(0x6cc070, { roughness: 0.95 }), hill2 = std(0x58b060, { roughness: 0.95 }), hill3 = std(0x4aa256, { roughness: 0.95 });
mesh(new THREE.SphereGeometry(60, 400, 200), hillMat, world, V(0, -58.5, -40));
mesh(new THREE.SphereGeometry(30, 400, 200), hill2, world, V(-9, -32.2, -22));
mesh(new THREE.SphereGeometry(30, 400, 200), hill3, world, V(9, -33.6, -17));
const hillY = (x, z) => -58.5 + Math.sqrt(3600 - x * x - (z + 40) ** 2);
const trunkM = std(0x7a5236), leafM = std(0x3f9a50, { roughness: 0.9 }), leafM2 = std(0x55b060, { roughness: 0.9 });
[[-7.2, -37, 1], [-6.3, -35.5, 0.8], [6.9, -37, 1.1], [7.6, -35, 0.85], [1.4, -33, 0.7], [-2.6, -32.5, 0.75], [5.2, -31, 0.6], [-5, -30.5, 0.65]].forEach(([x, z, s], i) => {
  const y = hillY(x, z);
  mesh(new THREE.CylinderGeometry(0.1 * s, 0.14 * s, 0.9 * s, 8), trunkM, world, V(x, y + 0.4 * s, z));
  mesh(new THREE.SphereGeometry(0.62 * s, 16, 12), i % 2 ? leafM : leafM2, world, V(x, y + 1.15 * s, z));
});
// cooling towers
const prof = []; for (let i = 0; i <= 30; i++) { const y = i / 30 * 8; prof.push(new THREE.Vector2(1.45 * Math.sqrt(1 + ((y - 5.6) / 3.3) ** 2), y)); }
const towerM = std(0xeef1f6, { side: THREE.DoubleSide, roughness: 0.9 });
const stripeM = std(0xe8604a, { roughness: 0.8 });
function tower(x, z, s) {
  const g = new THREE.Group(); g.position.set(x, hillY(x, z) - 0.1, z); g.scale.setScalar(s); world.add(g);
  mesh(new THREE.LatheGeometry(prof, 48), towerM, g);
  mesh(new THREE.CylinderGeometry(1.62, 1.6, 0.35, 48, 1, true), stripeM, g, V(0, 7.83, 0));
  return g;
}
tower(-4.3, -40, 1); tower(-1.0, -47, 0.95);
const puffs = [];
const puffMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false });
[[-4.3, -40, 1], [-1.0, -47, 0.95]].forEach(([x, z, s], ti) => {
  for (let k = 0; k < 12; k++) {
    const m = mesh(new THREE.SphereGeometry(1, 16, 12), puffMat.clone(), world);
    m.userData = { x, z, base: hillY(x, z) + 8 * s, ph: k / 12 + ti * 0.37, a: rnd() * 6.28, r: rnd() * 0.5, s: 0.7 + rnd() * 0.4 };
    puffs.push(m);
  }
});
// containment with cut-away front
const DX = 3.7, DZ = -40, DY = hillY(DX, DZ) - 0.1;
const domeM = std(0xf2f4f8, { roughness: 0.85, side: THREE.DoubleSide });
const domeFront = std(0xf2f4f8, { roughness: 0.85, transparent: true, opacity: 1 });
mesh(new THREE.CylinderGeometry(2.3, 2.3, 3.2, 48, 1, true, Math.PI / 2, Math.PI), domeM, world, V(DX, DY + 1.6, DZ));
mesh(new THREE.SphereGeometry(2.3, 48, 20, Math.PI, Math.PI, 0, Math.PI / 2), domeM, world, V(DX, DY + 3.2, DZ));
mesh(new THREE.CylinderGeometry(2.3, 2.3, 3.2, 48, 1, true, -Math.PI / 2, Math.PI), domeFront, world, V(DX, DY + 1.6, DZ));
mesh(new THREE.SphereGeometry(2.3, 48, 20, 0, Math.PI, 0, Math.PI / 2), domeFront, world, V(DX, DY + 3.2, DZ));
mesh(new THREE.CylinderGeometry(2.36, 2.36, 0.3, 48, 1, true), std(0x3f8fe0), world, V(DX, DY + 3.1, DZ));
const coreM = new THREE.MeshStandardMaterial({ color: 0xff9a3a, emissive: 0xff6a18, emissiveIntensity: 0 });
mesh(new THREE.CapsuleGeometry(0.5, 1.2, 8, 24), coreM, world, V(DX - 0.5, DY + 1.4, DZ));
mesh(new THREE.CapsuleGeometry(0.6, 1.3, 8, 24), new THREE.MeshStandardMaterial({ color: 0xb8d4f0, transparent: true, opacity: 0.35, depthWrite: false }), world, V(DX - 0.5, DY + 1.4, DZ));
mesh(new THREE.CapsuleGeometry(0.36, 1.9, 8, 20), std(0x9fb0c8, { metalness: 0.4, roughness: 0.4 }), world, V(DX + 0.85, DY + 1.9, DZ - 0.2));
const coreGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffa040, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
coreGlow.position.set(DX - 0.5, DY + 1.5, DZ + 1); coreGlow.scale.setScalar(5); world.add(coreGlow);
// turbine hall
const hallM = std(0x8fc0ee, { roughness: 0.8 });
mesh(new THREE.BoxGeometry(3.2, 1.7, 2.2), hallM, world, V(0.2, hillY(0.2, -39) + 0.75, -39));
mesh(new THREE.BoxGeometry(3.4, 0.2, 2.4), std(0x4a6fa8), world, V(0.2, hillY(0.2, -39) + 1.68, -39));
const winM = new THREE.MeshStandardMaterial({ color: 0xfff0a0, emissive: 0xffd860, emissiveIntensity: 0.6 });
for (let i = 0; i < 5; i++) mesh(new THREE.BoxGeometry(0.34, 0.5, 0.05), winM, world, V(-1.0 + i * 0.6, hillY(0.2, -39) + 0.95, -37.88));
// clouds
const cloudM = std(0xffffff, { roughness: 1, emissive: 0xdde8f5, emissiveIntensity: 0 });
const clouds = [];
[[-6, 12.5, -58, 1.3], [5.5, 14.5, -62, 1.6], [0, 17.5, -66, 1.2], [-8, 16, -70, 1.5], [8.5, 10.8, -56, 1.0]].forEach(([x, y, z, s]) => {
  const g = new THREE.Group(); g.position.set(x, y, z); g.scale.set(s, s * 0.62, s); g.userData.x = x; world.add(g);
  [[0, 0, 0, 1.5], [1.6, -0.2, 0, 1.1], [-1.6, -0.25, 0, 1.15], [0.7, 0.55, -0.3, 1.0], [-0.8, 0.4, 0.2, 0.9]].forEach(([a, b, c, r]) => mesh(new THREE.SphereGeometry(r, 20, 14), cloudM, g, V(a, b, c)));
  clouds.push(g);
});
const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xfff0b0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
sun.scale.setScalar(34); world.add(sun);

// ------------------------------------------------------------ mascot
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
const brows = [-1, 1].map(sd => {
  const m = mesh(new THREE.CapsuleGeometry(0.04, 0.22, 6, 12), darkM, head); m.geometry.rotateZ(Math.PI / 2);
  return { m, sd };
});
const cheekM = new THREE.MeshStandardMaterial({ color: 0xff8fa8, roughness: 0.6, transparent: true, opacity: 0.75 });
[-1, 1].forEach(sd => {
  const x = sd * 0.62, y = -0.12; const c = mesh(new THREE.SphereGeometry(0.13, 20, 14), cheekM, head, V(x, y, onSphere(x, y) - 0.005));
  c.quaternion.setFromUnitVectors(Z, V(x, y, onSphere(x, y)).normalize()); c.scale.set(1, 0.75, 0.12);
});
// mouth: grid patch projected on the sphere
const MX = 28, MY = 6;
const mouthGeo = new THREE.BufferGeometry();
const mouthPos = new Float32Array((MX + 1) * (MY + 1) * 3);
mouthGeo.setAttribute('position', new THREE.BufferAttribute(mouthPos, 3));
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
const hands = [-1, 1].map(sd => mesh(new THREE.SphereGeometry(0.2, 24, 18), bodyM, mascot));
// hard hat
const hat = new THREE.Group(); head.add(hat);
const hatM = std(0xffc928, { roughness: 0.35 });
{ const d = mesh(new THREE.SphereGeometry(0.8, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), hatM, hat); d.scale.y = 0.82;
  mesh(new THREE.CylinderGeometry(0.98, 1.0, 0.07, 40), hatM, hat, V(0, 0.02, 0.08));
  const r = mesh(new THREE.TorusGeometry(0.66, 0.07, 10, 40, Math.PI), hatM, hat, V(0, 0.0, 0)); r.rotation.y = Math.PI / 2; r.scale.y = 1.02; }

// ------------------------------------------------------------ topic icons (scene 4)
const icons = new THREE.Group(); scene.add(icons);
const discM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.93 });
const ringM = new THREE.MeshBasicMaterial({ color: 0x2f7df0 });
function icon(x, y) {
  const g = new THREE.Group(); g.position.set(x, y, 0.2); icons.add(g);
  mesh(new THREE.CircleGeometry(0.5, 64), discM, g, V(0, 0, -0.3));
  mesh(new THREE.RingGeometry(0.5, 0.535, 64), ringM, g, V(0, 0, -0.3));
  const c = new THREE.Group(); g.add(c); return { g, c };
}
const ICONS = [icon(-0.76, 1.72), icon(0.76, 1.72), icon(-0.76, 0.58), icon(0.76, 0.58)];
const ICON_T = [30.7, 31.8, 32.9, 34.0];
// 1 fission
const fisA = new THREE.Group(), fisB = new THREE.Group(); ICONS[0].c.add(fisA, fisB);
[fisA, fisB].forEach((g, gi) => { for (let i = 0; i < 9; i++) { let p; do { p = V(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1); } while (p.lengthSq() > 1); mesh(new THREE.SphereGeometry(0.07, 16, 12), (i + gi) % 2 ? PROT : NEUT, g, p.multiplyScalar(0.11)); } });
const fisN = [0, 1, 2].map(() => mesh(new THREE.SphereGeometry(0.045, 12, 10), new THREE.MeshStandardMaterial({ color: 0xbfe2ff, emissive: 0x6db8ff, emissiveIntensity: 1.5 }), ICONS[0].c));
const fisFlash = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffb050, transparent: true, opacity: 0, depthWrite: false })); ICONS[0].c.add(fisFlash);
// 2 reactor
{ const c = ICONS[1].c;
  mesh(new THREE.CapsuleGeometry(0.19, 0.3, 10, 28), new THREE.MeshStandardMaterial({ color: 0x8fb4dc, transparent: true, opacity: 0.4, roughness: 0.2, depthWrite: false }), c);
  const fm = new THREE.MeshStandardMaterial({ color: 0xff8a2a, emissive: 0xff5a10, emissiveIntensity: 1.6 });
  [[-0.08, 0], [0, 0.03], [0.08, 0], [-0.04, -0.06], [0.04, -0.06], [0, 0.09]].forEach(([x, z]) => mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.28, 8), fm, c, V(x, -0.05, z)));
  mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.1, 20), std(0x5f7396, { metalness: 0.4 }), c, V(0, 0.36, 0));
  mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.16, 12), std(0x5f7396), c, V(0.22, 0.08, 0)).rotation.z = Math.PI / 2;
  mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.16, 12), std(0x5f7396), c, V(-0.22, -0.08, 0)).rotation.z = Math.PI / 2; }
// 3 shield
{ const c = ICONS[2].c, s = new THREE.Shape();
  s.moveTo(0, 0.34); s.bezierCurveTo(0.12, 0.3, 0.22, 0.27, 0.29, 0.25); s.lineTo(0.29, 0.02); s.bezierCurveTo(0.29, -0.16, 0.16, -0.28, 0, -0.36);
  s.bezierCurveTo(-0.16, -0.28, -0.29, -0.16, -0.29, 0.02); s.lineTo(-0.29, 0.25); s.bezierCurveTo(-0.22, 0.27, -0.12, 0.3, 0, 0.34);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.07, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 3 }); g.translate(0, 0, -0.035);
  mesh(g, std(0x2f7df0, { roughness: 0.35 }), c);
  const ck = std(0xffffff, { roughness: 0.4, emissive: 0xffffff, emissiveIntensity: 0.3 });
  const a = mesh(new THREE.BoxGeometry(0.06, 0.17, 0.04), ck, c, V(-0.085, -0.045, 0.07)); a.rotation.z = 0.8;
  const b = mesh(new THREE.BoxGeometry(0.06, 0.3, 0.04), ck, c, V(0.055, 0.0, 0.07)); b.rotation.z = -0.62; }
// 4 waste drum
{ const c = ICONS[3].c, ym = std(0xffcc22, { roughness: 0.45 });
  mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 36), ym, c);
  [-0.25, -0.08, 0.08, 0.25].forEach(y => mesh(new THREE.TorusGeometry(0.2, 0.014, 8, 36), std(0xe0a810), c, V(0, y, 0)).rotation.x = Math.PI / 2);
  mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.03, 36), std(0x4a4f5a), c, V(0, 0.262, 0));
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; const x = cv.getContext('2d');
  x.fillStyle = '#ffcc22'; x.beginPath(); x.arc(128, 128, 126, 0, 6.3); x.fill(); x.fillStyle = '#1a1a1a';
  x.beginPath(); x.arc(128, 128, 22, 0, 6.3); x.fill();
  [90, 210, 330].forEach(d => { const a = d * Math.PI / 180; x.beginPath(); x.arc(128, 128, 112, a - Math.PI / 6, a + Math.PI / 6); x.arc(128, 128, 36, a + Math.PI / 6, a - Math.PI / 6, true); x.closePath(); x.fill(); });
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace;
  mesh(new THREE.CircleGeometry(0.105, 40), new THREE.MeshBasicMaterial({ map: tx, transparent: true }), c, V(0, 0, 0.203)); }

// white flash / fades
const overlay = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthTest: false, depthWrite: false }));
overlay.position.z = -1; overlay.renderOrder = 1000; camera.add(overlay);

const composer = new EffectComposer(renderer); composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), 0.45, 0.5, 1.0));
composer.addPass(new OutputPass());

// ------------------------------------------------------------ timeline
const SPEECH = [[1.0, 1.5], [1.9, 3.5], [3.8, 7.2], [8.2, 8.8], [9.2, 11.2], [11.5, 12.8], [13.6, 14.7], [15.2, 18.0], [18.5, 21.9],
  [22.8, 24.6], [25.1, 30.2], [30.7, 31.5], [31.8, 32.6], [32.9, 33.7], [34.0, 34.7], [35.4, 36.9], [37.1, 38.1], [38.6, 39.5], [40.1, 40.6], [40.8, 41.4]];
const speechEnv = t => { let e = 0; for (const [a, b] of SPEECH) e = Math.max(e, Math.min(ramp(t, a, a + 0.07), 1 - ramp(t, b - 0.09, b))); return e; };
const BLINKS = [3.6, 6.4, 10.1, 12.2, 16.3, 19.2, 24.0, 28.6, 33.4, 37.0, 42.9];
const T = {
  day: track([[7.3, 1], [7.65, 0], [18.5, 0], [22.3, 1]]),
  sp: track([[7.3, 1], [8.3, 0]]),
  pos: track([[0.9, [0, 0.25, 1.1]], [7.3, [0, 0.25, 1.1]], [8.2, [-0.38, -0.62, 0.8]], [13.0, [-0.38, -0.62, 0.8]], [13.8, [0, -0.55, 0.86]], [22.4, [0, -0.55, 0.86]], [23.0, [0, -0.48, 0.92]],
    [30.2, [0, -0.48, 0.92]], [30.8, [0, -0.8, 0.7]], [35.1, [0, -0.8, 0.7]], [35.8, [0, 0.05, 1.05]], [41.4, [0, 0.05, 1.05]]]),
  smile: track([[0, 0.9], [7.2, 0.9], [8.0, -0.6], [12.9, -0.6], [13.6, 0.2], [14.8, 0.25], [15.3, -0.2], [18.0, -0.15], [18.7, 0.5], [20.5, 0.95], [22.7, 0.75], [35, 0.85], [38.4, 0.7], [39.5, 1], [43.5, 1]]),
  sad: track([[0, -0.03], [7.2, -0.03], [8.0, 0.5], [12.9, 0.5], [13.7, 0.0], [15.3, 0.22], [18.0, 0.18], [18.7, -0.28], [20.5, -0.03], [39.8, -0.03], [40.3, -0.3], [43.5, -0.15]]),
  browY: track([[0, 0.07], [7.2, 0.05], [8, 0.02], [13.6, 0.09], [14.8, 0.09], [15.3, 0.0], [18.7, 0.02], [20.5, 0.09], [25.6, 0.05], [26, 0.1], [30, 0.06], [38.5, 0.1], [40.3, 0.04]]),
  browAsym: track([[13.4, 0], [13.8, 0.09], [14.8, 0.09], [15.2, 0], [38.5, 0], [38.8, 0.09], [39.8, 0.09], [40.1, 0]]),
  eyeS: track([[0, 1.05], [7.3, 1], [8, 1.14], [12.9, 1.12], [13.6, 1], [20.4, 1], [21.2, 1.16], [22.4, 1.04], [25.7, 1.04], [26.0, 1.16], [26.8, 1.04], [43.5, 1.05]]),
  gaze: track([[0, [0, -0.5]], [0.9, [0, 0]], [7.4, [0, 0]], [7.9, [0.75, 0.85]], [9.3, [0.75, 0.85]], [9.7, [0, 0]], [10.6, [0, 0]], [11.0, [0.75, 0.85]], [12.9, [0.6, 0.6]], [13.5, [0, 0]], [14.0, [-0.5, 0.6]], [14.6, [-0.5, 0.6]],
    [15.1, [0, 0]], [20.5, [0, 0]], [20.9, [0.7, 0.85]], [21.9, [0.7, 0.85]], [22.3, [0, 0]], [25.6, [0, 0]], [25.9, [0, 0.9]], [26.5, [0, 0.9]], [27.0, [0, 0]], [30.5, [0, 0]], [30.8, [-0.8, 0.95]], [31.6, [-0.8, 0.95]], [31.9, [0.8, 0.95]], [32.7, [0.8, 0.95]],
    [33.0, [-0.9, 0.55]], [33.8, [-0.9, 0.55]], [34.1, [0.9, 0.55]], [34.8, [0.9, 0.55]], [35.3, [0, 0]]]),
  handR: track([[0, [1.2, -0.3, 0.35]], [0.9, [1.2, -0.3, 0.35]], [1.2, [1.32, 0.8, 0.3]], [2.7, [1.32, 0.8, 0.3]], [3.2, [1.2, -0.3, 0.35]], [4.2, [1.25, 0.0, 0.5]], [6.8, [1.25, -0.1, 0.5]], [7.4, [1.2, -0.3, 0.35]], [8.1, [0.42, -0.5, 0.92]], [12.9, [0.42, -0.5, 0.92]],
    [13.6, [1.15, 0.72, 0.4]], [14.8, [1.15, 0.72, 0.4]], [15.4, [1.25, -0.1, 0.5]], [18.4, [1.25, -0.15, 0.5]], [18.9, [1.35, 0.1, 0.4]], [20.3, [1.42, 0.8, 0.2]], [22.2, [1.42, 0.8, 0.2]], [22.8, [1.2, -0.3, 0.35]], [23.3, [0.75, -0.2, 0.95]], [24.6, [0.75, -0.2, 0.95]],
    [25.1, [1.2, -0.3, 0.35]], [26.7, [1.2, -0.3, 0.35]], [27.1, [1.0, 1.0, 0.45]], [27.9, [1.0, 1.0, 0.45]], [28.4, [1.25, 0.0, 0.5]], [30.4, [1.2, -0.3, 0.35]], [31.6, [1.2, -0.3, 0.35]], [31.9, [1.25, 0.95, 0.3]], [32.6, [1.25, 0.95, 0.3]], [32.9, [1.2, -0.3, 0.35]],
    [33.8, [1.2, -0.3, 0.35]], [34.1, [1.35, 0.45, 0.3]], [34.8, [1.35, 0.45, 0.3]], [35.3, [1.2, -0.3, 0.35]], [35.6, [1.25, 0.0, 0.55]], [38.2, [1.25, 0.0, 0.55]], [38.6, [1.02, -0.55, 0.4]], [39.8, [1.02, -0.55, 0.4]], [40.1, [1.2, 0.55, 0.65]], [40.7, [1.2, 0.55, 0.65]], [41.1, [1.32, 0.95, 0.2]]]),
  handL: track([[0, [-1.2, -0.3, 0.35]], [4.0, [-1.2, -0.3, 0.35]], [4.4, [-1.25, 0.0, 0.5]], [6.8, [-1.25, -0.1, 0.5]], [7.4, [-1.2, -0.3, 0.35]], [8.1, [-0.42, -0.5, 0.92]], [12.9, [-0.42, -0.5, 0.92]], [13.6, [-1.15, -0.45, 0.4]], [14.8, [-1.15, -0.45, 0.4]],
    [15.4, [-1.25, -0.1, 0.5]], [18.4, [-1.25, -0.15, 0.5]], [18.9, [-1.35, 0.1, 0.4]], [20.3, [-1.42, 0.8, 0.2]], [22.2, [-1.42, 0.8, 0.2]], [22.8, [-1.2, -0.3, 0.35]], [23.3, [-0.75, -0.2, 0.95]], [24.6, [-0.75, -0.2, 0.95]], [25.1, [-1.2, -0.3, 0.35]],
    [28.0, [-1.2, -0.3, 0.35]], [28.4, [-1.25, 0.0, 0.5]], [30.4, [-1.2, -0.3, 0.35]], [30.8, [-1.25, 0.95, 0.3]], [31.5, [-1.25, 0.95, 0.3]], [31.8, [-1.2, -0.3, 0.35]], [32.7, [-1.2, -0.3, 0.35]], [33.0, [-1.35, 0.45, 0.3]], [33.7, [-1.35, 0.45, 0.3]], [34.0, [-1.2, -0.3, 0.35]],
    [35.6, [-1.25, 0.0, 0.55]], [38.2, [-1.25, 0.0, 0.55]], [38.6, [-1.02, -0.55, 0.4]], [40.7, [-1.02, -0.55, 0.4]], [41.1, [-1.32, 0.95, 0.2]]]),
  dome: track([[20.6, 1], [22.2, 0.12]]),
};
const LIP = {"open": [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.106, 0.517, 0.906, 1.0, 1.0, 1.0, 1.0, 0.983, 0.887, 0.649, 0.302, 0.055, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.2, 0.799, 1.0, 1.0, 0.955, 0.733, 0.378, 0.301, 0.731, 0.97, 0.99, 0.971, 0.99, 0.994, 0.978, 0.975, 0.968, 0.965, 0.986, 0.993, 0.947, 0.747, 0.467, 0.581, 0.81, 0.95, 0.954, 0.903, 0.843, 0.833, 0.821, 0.764, 0.548, 0.131, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.138, 0.613, 0.938, 1.0, 1.0, 1.0, 1.0, 0.989, 0.943, 0.913, 0.975, 1.0, 1.0, 0.971, 0.78, 0.565, 0.812, 0.865, 0.758, 0.458, 0.488, 0.714, 0.594, 0.421, 0.438, 0.851, 1.0, 1.0, 1.0, 1.0, 1.0, 0.984, 0.91, 0.738, 0.496, 0.538, 0.843, 0.872, 0.553, 0.512, 0.873, 0.966, 0.879, 0.895, 0.869, 0.628, 0.356, 0.481, 0.856, 0.85, 0.506, 0.251, 0.352, 0.828, 0.986, 0.983, 0.969, 0.979, 0.966, 0.989, 1.0, 0.961, 0.873, 0.928, 0.976, 0.842, 0.481, 0.304, 0.355, 0.567, 0.9, 0.992, 0.968, 0.963, 0.964, 0.976, 0.942, 0.763, 0.57, 0.694, 0.903, 0.988, 0.977, 0.895, 0.816, 0.816, 0.823, 0.81, 0.83, 0.818, 0.677, 0.34, 0.064, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.121, 0.769, 0.977, 0.818, 0.358, 0.257, 0.8, 1.0, 0.909, 0.527, 0.109, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.068, 0.404, 0.868, 1.0, 1.0, 0.894, 0.482, 0.294, 0.8, 1.0, 0.915, 0.737, 0.889, 0.99, 0.996, 0.94, 0.623, 0.341, 0.8, 0.998, 0.993, 0.998, 1.0, 0.956, 0.845, 0.868, 0.848, 0.631, 0.523, 0.729, 0.941, 0.997, 1.0, 0.999, 0.998, 0.979, 0.94, 0.98, 0.914, 0.59, 0.26, 0.049, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.098, 0.482, 0.861, 0.937, 0.663, 0.379, 0.78, 0.989, 0.983, 0.949, 0.957, 0.724, 0.348, 0.719, 0.973, 0.994, 0.982, 0.994, 1.0, 0.905, 0.514, 0.166, 0.369, 0.794, 0.912, 0.966, 0.997, 1.0, 0.991, 0.924, 0.803, 0.758, 0.697, 0.599, 0.395, 0.091, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.181, 0.742, 0.927, 0.649, 0.369, 0.803, 0.998, 0.967, 0.702, 0.333, 0.697, 0.966, 1.0, 0.951, 0.839, 0.903, 0.899, 0.668, 0.365, 0.077, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.2, 0.8, 0.982, 0.792, 0.32, 0.246, 0.8, 1.0, 1.0, 0.992, 0.963, 0.908, 0.712, 0.526, 0.856, 1.0, 1.0, 1.0, 1.0, 1.0, 0.991, 0.932, 0.854, 0.907, 0.753, 0.262, 0.319, 0.773, 0.862, 0.527, 0.494, 0.868, 0.968, 0.875, 0.834, 0.735, 0.63, 0.732, 0.819, 0.845, 0.803, 0.648, 0.312, 0.056, 0.133, 0.598, 0.933, 0.984, 0.899, 0.774, 0.763, 0.79, 0.727, 0.447, 0.113, 0.006, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.164, 0.693, 0.963, 0.995, 0.998, 1.0, 1.0, 0.989, 0.944, 0.918, 0.952, 0.925, 0.965, 0.996, 1.0, 1.0, 1.0, 0.998, 0.994, 0.923, 0.638, 0.507, 0.819, 0.91, 0.919, 0.915, 0.959, 0.875, 0.582, 0.221, 0.267, 0.719, 0.817, 0.828, 0.747, 0.39, 0.359, 0.823, 0.996, 1.0, 1.0, 0.982, 0.94, 0.921, 0.776, 0.512, 0.119, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.191, 0.728, 0.653, 0.33, 0.728, 0.915, 0.619, 0.332, 0.776, 0.992, 1.0, 0.975, 0.889, 0.801, 0.636, 0.339, 0.068, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.2, 0.8, 1.0, 0.919, 0.694, 0.726, 0.935, 0.897, 0.491, 0.097, 0.2, 0.8, 1.0, 0.99, 0.97, 0.978, 0.874, 0.521, 0.111, 0.2, 0.728, 0.652, 0.532, 0.868, 0.906, 0.518, 0.301, 0.786, 0.885, 0.585, 0.643, 0.896, 0.912, 0.884, 0.858, 0.829, 0.864, 0.931, 0.959, 0.856, 0.638, 0.37, 0.081, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.156, 0.667, 0.956, 1.0, 1.0, 1.0, 0.959, 0.752, 0.412, 0.166, 0.031, 0.0, 0.078, 0.429, 0.861, 0.986, 0.975, 0.98, 0.967, 0.97, 0.938, 0.889, 0.949, 0.945, 0.961, 0.992, 1.0, 0.992, 0.97, 0.974, 0.974, 0.841, 0.576, 0.693, 0.836, 0.962, 1.0, 0.987, 0.956, 0.945, 0.721, 0.284, 0.523, 0.883, 0.92, 0.878, 0.85, 0.837, 0.855, 0.962, 0.999, 0.996, 0.956, 0.819, 0.793, 0.921, 0.953, 0.762, 0.388, 0.075, 0.163, 0.689, 0.957, 0.929, 0.71, 0.372, 0.075, 0.0, 0.0, 0.0, 0.0, 0.004, 0.012, 0.004, 0.0, 0.0, 0.017, 0.247, 0.758, 0.675, 0.19, 0.211, 0.8, 0.995, 0.954, 0.903, 0.969, 1.0, 1.0, 1.0, 0.984, 0.953, 0.984, 0.905, 0.629, 0.643, 0.895, 0.993, 0.995, 0.943, 0.668, 0.323, 0.696, 0.957, 0.882, 0.512, 0.298, 0.773, 0.979, 0.965, 0.98, 0.93, 0.858, 0.947, 0.916, 0.768, 0.743, 0.801, 0.95, 0.971, 0.881, 0.847, 0.779, 0.507, 0.23, 0.044, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.197, 0.79, 0.997, 0.978, 0.775, 0.365, 0.417, 0.72, 0.51, 0.109, 0.0, 0.146, 0.638, 0.946, 1.0, 0.981, 0.936, 0.96, 0.978, 0.933, 0.912, 0.953, 0.991, 1.0, 1.0, 0.927, 0.582, 0.127, 0.0, 0.197, 0.79, 0.997, 1.0, 0.999, 0.996, 0.999, 0.96, 0.697, 0.212, 0.017, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.143, 0.629, 0.894, 0.695, 0.276, 0.242, 0.765, 0.799, 0.675, 0.903, 1.0, 1.0, 1.0, 0.887, 0.46, 0.097, 0.072, 0.229, 0.53, 0.866, 0.786, 0.403, 0.078, 0.0, 0.0, 0.101, 0.503, 0.901, 1.0, 1.0, 0.936, 0.613, 0.187, 0.253, 0.643, 0.935, 0.987, 0.946, 0.932, 0.953, 0.914, 0.749, 0.442, 0.096, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.193, 0.778, 0.993, 0.995, 0.986, 0.989, 0.976, 0.977, 0.992, 0.936, 0.818, 0.906, 0.984, 0.948, 0.802, 0.769, 0.921, 0.994, 0.948, 0.747, 0.456, 0.103, 0.075, 0.403, 0.805, 0.965, 0.996, 1.0, 1.0, 1.0, 1.0, 0.973, 0.905, 0.926, 0.984, 0.971, 0.787, 0.394, 0.074, 0.0, 0.0, 0.0, 0.0, 0.008, 0.069, 0.347, 0.846, 0.851, 0.425, 0.366, 0.58, 0.903, 1.0, 1.0, 0.977, 0.903, 0.841, 0.693, 0.403, 0.086, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.12, 0.559, 0.913, 0.817, 0.509, 0.839, 0.928, 0.583, 0.261, 0.6, 0.933, 1.0, 1.0, 0.946, 0.833, 0.933, 0.994, 0.962, 0.812, 0.491, 0.207, 0.465, 0.761, 0.753, 0.476, 0.105, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.193, 0.78, 0.993, 1.0, 1.0, 1.0, 1.0, 0.897, 0.54, 0.416, 0.697, 0.695, 0.725, 0.93, 0.999, 0.98, 0.89, 0.666, 0.346, 0.491, 0.885, 0.98, 0.862, 0.623, 0.356, 0.078, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.086, 0.425, 0.785, 0.966, 1.0, 0.961, 0.84, 0.813, 0.893, 0.975, 0.999, 0.975, 0.848, 0.695, 0.739, 0.707, 0.438, 0.095, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], "narrow": [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.203, 0.526, 0.555, 0.53, 0.715, 0.904, 0.986, 0.989, 0.95, 0.918, 0.692, 0.235, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.158, 0.567, 0.908, 0.988, 0.977, 0.921, 0.615, 0.182, 0.224, 0.698, 0.974, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.947, 0.894, 0.947, 1.0, 1.0, 1.0, 1.0, 0.959, 0.91, 0.943, 0.89, 0.546, 0.148, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.25, 0.75, 1.0, 1.0, 1.0, 1.0, 1.0, 0.966, 0.932, 0.966, 1.0, 0.991, 0.983, 0.991, 1.0, 1.0, 0.992, 0.982, 0.988, 0.998, 1.0, 1.0, 1.0, 0.75, 0.25, 0.243, 0.675, 0.811, 0.812, 0.93, 0.996, 1.0, 0.95, 0.9, 0.95, 0.75, 0.5, 0.75, 0.764, 0.278, 0.23, 0.644, 0.89, 0.962, 1.0, 1.0, 0.799, 0.481, 0.565, 0.883, 0.75, 0.25, 0.0, 0.25, 0.75, 0.868, 0.584, 0.441, 0.549, 0.737, 0.84, 0.896, 0.967, 0.975, 0.95, 0.943, 0.937, 0.968, 1.0, 0.75, 0.5, 0.75, 1.0, 0.816, 0.541, 0.634, 0.909, 1.0, 1.0, 0.828, 0.655, 0.828, 0.995, 0.971, 0.925, 0.877, 0.868, 0.906, 0.949, 0.982, 0.834, 0.586, 0.66, 0.66, 0.25, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.206, 0.75, 1.0, 0.75, 0.25, 0.25, 0.74, 0.95, 0.848, 0.779, 0.612, 0.222, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.25, 0.75, 0.969, 0.939, 0.944, 0.699, 0.225, 0.25, 0.75, 1.0, 0.969, 0.689, 0.469, 0.75, 0.958, 0.88, 0.859, 0.888, 0.896, 0.909, 0.932, 0.915, 0.921, 0.975, 1.0, 1.0, 1.0, 0.811, 0.578, 0.722, 0.956, 0.954, 0.79, 0.571, 0.508, 0.682, 0.862, 0.896, 0.909, 0.837, 0.508, 0.137, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.13, 0.511, 0.88, 1.0, 1.0, 0.922, 0.832, 0.895, 0.983, 0.998, 1.0, 1.0, 1.0, 0.983, 0.928, 0.908, 0.963, 1.0, 1.0, 0.998, 0.993, 0.961, 0.923, 0.947, 0.99, 0.997, 0.994, 0.997, 0.991, 0.94, 0.907, 0.927, 0.886, 0.795, 0.693, 0.675, 0.584, 0.224, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.25, 0.665, 0.733, 0.471, 0.403, 0.736, 0.971, 0.986, 1.0, 0.855, 0.709, 0.849, 0.989, 0.995, 1.0, 1.0, 1.0, 1.0, 0.995, 0.74, 0.245, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.116, 0.482, 0.849, 0.959, 0.824, 0.504, 0.458, 0.802, 1.0, 0.952, 0.859, 0.863, 0.955, 0.937, 0.873, 0.92, 0.967, 0.983, 1.0, 0.986, 0.951, 0.943, 0.978, 1.0, 1.0, 0.968, 0.685, 0.384, 0.56, 0.798, 0.615, 0.435, 0.656, 0.919, 0.988, 1.0, 1.0, 0.948, 0.897, 0.948, 1.0, 0.99, 0.73, 0.24, 0.0, 0.0, 0.201, 0.561, 0.678, 0.702, 0.856, 0.973, 0.943, 0.821, 0.754, 0.567, 0.191, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.122, 0.465, 0.803, 0.923, 0.935, 0.972, 0.986, 0.9, 0.842, 0.928, 1.0, 1.0, 1.0, 0.934, 0.788, 0.774, 0.92, 1.0, 1.0, 1.0, 1.0, 0.96, 0.92, 0.96, 1.0, 1.0, 0.968, 0.924, 0.946, 0.739, 0.25, 0.249, 0.746, 0.995, 0.995, 0.977, 0.893, 0.842, 0.921, 0.983, 0.992, 1.0, 1.0, 0.944, 0.85, 0.792, 0.753, 0.562, 0.195, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.13, 0.45, 0.602, 0.382, 0.139, 0.304, 0.747, 0.951, 0.925, 0.945, 0.988, 1.0, 1.0, 0.896, 0.577, 0.336, 0.473, 0.516, 0.198, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.115, 0.392, 0.687, 0.911, 0.988, 0.917, 0.87, 0.941, 0.97, 0.769, 0.527, 0.628, 0.9, 1.0, 1.0, 0.909, 0.723, 0.47, 0.156, 0.0, 0.25, 0.75, 0.994, 0.988, 0.994, 0.832, 0.532, 0.568, 0.868, 1.0, 0.853, 0.637, 0.652, 0.723, 0.676, 0.637, 0.671, 0.801, 0.945, 0.982, 0.964, 0.94, 0.916, 0.708, 0.25, 0.0, 0.0, 0.0, 0.0, 0.0, 0.209, 0.668, 0.959, 1.0, 1.0, 1.0, 1.0, 1.0, 0.99, 0.98, 0.74, 0.25, 0.25, 0.75, 0.98, 0.961, 0.98, 1.0, 1.0, 1.0, 1.0, 0.75, 0.464, 0.678, 0.964, 1.0, 0.925, 0.797, 0.764, 0.837, 0.943, 0.996, 0.998, 0.938, 0.876, 0.938, 0.962, 0.841, 0.769, 0.865, 0.974, 0.984, 0.878, 0.805, 0.91, 1.0, 1.0, 1.0, 1.0, 0.993, 0.953, 0.928, 0.942, 0.95, 0.975, 1.0, 1.0, 1.0, 0.895, 0.541, 0.145, 0.127, 0.5, 0.819, 0.895, 0.909, 0.767, 0.406, 0.098, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.004, 0.257, 0.66, 0.805, 0.89, 0.992, 0.968, 0.857, 0.687, 0.674, 0.81, 0.867, 0.883, 0.899, 0.95, 1.0, 0.996, 0.942, 0.807, 0.771, 0.91, 1.0, 0.994, 0.821, 0.411, 0.1, 0.282, 0.766, 0.922, 0.594, 0.316, 0.539, 0.823, 0.759, 0.714, 0.867, 0.983, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.984, 0.922, 0.86, 0.844, 0.806, 0.567, 0.182, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.25, 0.75, 1.0, 0.954, 0.834, 0.613, 0.289, 0.306, 0.745, 0.763, 0.291, 0.023, 0.0, 0.25, 0.75, 0.968, 0.932, 0.96, 0.983, 0.965, 0.968, 0.916, 0.851, 0.872, 0.886, 0.902, 0.873, 0.821, 0.632, 0.467, 0.741, 0.996, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.75, 0.25, 0.0, 0.0, 0.0, 0.0, 0.0, 0.154, 0.558, 0.904, 0.968, 0.725, 0.295, 0.289, 0.75, 0.971, 0.943, 0.971, 0.985, 0.939, 0.922, 0.955, 0.932, 0.707, 0.401, 0.403, 0.698, 0.912, 0.931, 0.869, 0.612, 0.195, 0.2, 0.59, 0.832, 0.941, 1.0, 1.0, 0.956, 0.721, 0.41, 0.232, 0.336, 0.734, 0.917, 0.881, 0.949, 0.995, 0.991, 0.952, 0.878, 0.635, 0.214, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.25, 0.75, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.899, 0.623, 0.551, 0.826, 0.975, 0.949, 0.975, 1.0, 0.999, 0.956, 0.852, 0.795, 0.815, 0.863, 0.948, 1.0, 1.0, 1.0, 0.938, 0.759, 0.682, 0.836, 0.971, 0.99, 0.995, 0.972, 0.929, 0.862, 0.575, 0.17, 0.0, 0.0, 0.0, 0.25, 0.75, 1.0, 0.893, 0.742, 0.725, 0.63, 0.59, 0.816, 0.881, 0.764, 0.806, 0.943, 0.803, 0.506, 0.552, 0.547, 0.198, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.25, 0.75, 1.0, 1.0, 0.937, 0.864, 0.918, 0.975, 0.732, 0.307, 0.355, 0.796, 0.997, 0.987, 0.982, 0.992, 0.998, 0.997, 0.998, 1.0, 1.0, 0.92, 0.841, 0.881, 0.903, 0.896, 0.675, 0.221, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.069, 0.298, 0.565, 0.764, 0.927, 0.996, 0.987, 0.961, 0.916, 0.742, 0.621, 0.825, 0.993, 0.986, 0.991, 0.997, 0.977, 0.958, 0.974, 0.874, 0.762, 0.874, 0.952, 0.932, 0.921, 0.769, 0.438, 0.119, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.094, 0.438, 0.844, 0.998, 0.922, 0.781, 0.74, 0.835, 0.952, 1.0, 0.993, 0.911, 0.769, 0.767, 0.91, 0.992, 0.878, 0.667, 0.449, 0.16, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], "env": [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.015, 0.069, 0.177, 0.34, 0.542, 0.758, 0.96, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.96, 0.758, 0.542, 0.34, 0.177, 0.069, 0.015, 0.015, 0.069, 0.177, 0.34, 0.542, 0.758, 0.96, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.96, 0.758, 0.542, 0.34, 0.177, 0.069, 0.029, 0.069, 0.177, 0.34, 0.542, 0.758, 0.96, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.96, 0.758, 0.542, 0.34, 0.177, 0.069, 0.015, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.015, 0.054, 0.108, 0.163, 0.202, 0.217, 0.202, 0.177, 0.177, 0.231, 0.354, 0.542, 0.758, 0.96, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.96, 0.758, 0.542, 0.34, 0.177, 0.069, 0.015, 0.0, 0.0, 0.0, 0.015, 0.069, 0.177, 0.34, 0.542, 0.758, 0.96, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.96, 0.758, 0.542, 0.34, 0.177, 0.069, 0.029, 0.069, 0.177, 0.34, 0.542, 0.758, 0.96, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.96, 0.758, 0.542, 0.34, 0.177, 0.069, 0.015, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.015, 0.069, 0.177, 0.34, 0.542, 0.758, 0.96, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.96, 0.758, 0.556, 0.394, 0.285, 0.231, 0.217, 0.217, 0.202, 0.177, 0.163, 0.177, 0.246, 0.379, 0.556, 0.744, 0.921, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.96, 0.758, 0.542, 0.34, 0.177, 0.069, 0.015, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.015, 0.069, 0.177, 0.34, 0.542, 0.758, 0.96, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.96, 0.758, 0.542, 0.34, 0.177, 0.069, 0.029, 0.069, 0.177, 0.34, 0.542, 0.758, 0.96, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.96, 0.758, 0.542, 0.34, 0.177, 0.069, 0.015, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.015, 0.069, 0.177, 0.34, 0.542, 0.758, 0.96, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.96, 0.758, 0.542, 0.34, 0.177, 0.069, 0.029, 0.069, 0.177, 0.34, 0.542, 0.758, 0.96, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.935, 0.881, 0.867, 0.881, 0.921, 0.975, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.96, 0.758, 0.542, 0.34, 0.177, 0.069, 0.015, 0.0, 0.0, 0.015, 0.069, 0.177, 0.34, 0.542, 0.758, 0.96, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.935, 0.881, 0.881, 0.935, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.935, 0.881, 0.881, 0.935, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.96, 0.758, 0.542, 0.34, 0.177, 0.083, 0.083, 0.177, 0.34, 0.542, 0.758, 0.96, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.975, 0.827, 0.719, 0.679, 0.719, 0.827, 0.975, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.96, 0.758, 0.542, 0.34, 0.177, 0.069, 0.015, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.015, 0.069, 0.177, 0.34, 0.542, 0.758, 0.96, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.96, 0.758, 0.542, 0.354, 0.246, 0.246, 0.354, 0.542, 0.758, 0.96, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.96, 0.758, 0.542, 0.34, 0.177, 0.069, 0.015, 0.0, 0.0, 0.0, 0.0, 0.0, 0.015, 0.069, 0.177, 0.34, 0.542, 0.758, 0.96, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.96, 0.758, 0.542, 0.34, 0.177, 0.069, 0.015, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.015, 0.069, 0.177, 0.34, 0.542, 0.758, 0.96, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.96, 0.758, 0.542, 0.34, 0.177, 0.069, 0.015, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.015, 0.069, 0.177, 0.34, 0.542, 0.758, 0.96, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.96, 0.758, 0.542, 0.34, 0.177, 0.069, 0.015, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]};
const WARP = [[0,0],[1.0,1.18],[1.5,1.54],[1.9,1.85],[3.5,2.92],[3.8,3.34],[7.2,6.33],[7.3,6.4],[8.2,7.17],[8.8,7.49],[9.2,7.99],[11.2,9.31],[11.5,9.66],[12.8,10.77],[13.6,11.72],[14.7,12.28],[15.2,12.69],[18.0,14.55],[18.5,15.25],[21.9,17.75],[22.8,18.96],[24.6,20.32],[25.1,20.66],[25.75,21.1],[27.0,22.15],[27.9,23.05],[28.0,23.17],[30.2,24.75],[30.7,25.15],[31.8,25.54],[32.6,26.42],[32.9,26.70],[33.7,27.38],[34.0,27.56],[34.7,28.11],[35.1,28.4],[35.4,29.04],[36.9,30.97],[37.1,31.52],[38.1,32.31],[38.6,33.01],[39.5,33.80],[40.1,34.39],[41.4,34.89],[41.45,34.95],[43.5,37.0]];
function unwarp(tn) { for (let i = 0; i < WARP.length - 1; i++) { const [o0, n0] = WARP[i], [o1, n1] = WARP[i + 1]; if (tn <= n1) return o0 + (o1 - o0) * (tn - n0) / (n1 - n0); } return 43.5; }
window.WARP = WARP;
const C1 = new THREE.Color(), C2 = new THREE.Color();
const END = 37.0;

window.renderFrame = function (tn) {
  const t = unwarp(tn), fi = Math.min(LIP.open.length - 1, Math.max(0, Math.round(tn * 30)));
  const day = T.day(t), sp = T.sp(t);
  // sky + light
  C1.copy(SKY.fear[0]).lerp(SKY.day[0], day).lerp(SKY.space[0], sp); skyMat.uniforms.top.value.copy(C1);
  C2.copy(SKY.fear[1]).lerp(SKY.day[1], day).lerp(SKY.space[1], sp); skyMat.uniforms.bottom.value.copy(C2);
  const lt = t - 10.75; skyMat.uniforms.flash.value = (lt > 0 && lt < 0.5) ? (lt < 0.07 ? 1 : lt < 0.14 ? 0.2 : lt < 0.2 ? 0.8 : Math.max(0, 0.8 - (lt - 0.2) * 3)) : 0;
  const fl = skyMat.uniforms.flash.value;
  hemi.intensity = 0.07 + 1.25 * day + fl * 0.5; sunL.intensity = 0.25 + 2.2 * day; sunL.color.copy(SUN_FEAR).lerp(SUN_DAY, day);
  key.intensity = lerp(40, 46, sp) - 10 * day * (1 - sp); fill.intensity = 30;
  // space
  space.visible = sp > 0.001; space.position.y = (1 - sp) * 26;
  for (const b of bokeh) { const d = b.userData, ph = (d.ph + t * d.sp) % 1; b.position.set(d.x + Math.sin(t * 0.4 + d.ph * 9) * 0.6, -14 + ph * 28, d.z); b.scale.setScalar(d.sc); b.material.opacity = 0.32 * Math.sin(ph * Math.PI); }
  for (const p of bgParts) p.m.position.set(p.p.x + Math.sin(t * p.f + p.o) * 0.06, p.p.y + Math.cos(t * p.f * 1.2 + p.o) * 0.06, p.p.z);
  bgNucleus.rotation.y = t * 0.15; bgNucleus.rotation.x = 0.3 + t * 0.07;
  // world
  world.visible = sp < 0.999; world.position.y = -34 * sp;
  for (const m of puffs) {
    const d = m.userData, ph = (t * 0.085 + d.ph) % 1;
    m.position.set(d.x + Math.cos(d.a) * d.r * (1 + ph) + ph * ph * 2.2, d.base + ph * 6.5, d.z + Math.sin(d.a) * d.r);
    m.scale.setScalar(d.s * (0.95 + ph * 1.9));
    m.material.opacity = 0.55 * Math.min(1, ph * 6) * (1 - ph); m.material.color.setHex(0x241a22).lerp(C1.setHex(0xffffff), day);
  }
  clouds.forEach((c, i) => { c.position.x = c.userData.x + Math.sin(t * 0.05 + i) * 0.8 + t * 0.03; });
  sun.position.set(7.2, lerp(-6, 19, smooth(ramp(t, 18.5, 22.6))), -85); sun.material.opacity = 0.95 * day;
  domeFront.opacity = T.dome(t); domeFront.depthWrite = domeFront.opacity > 0.99;
  const reveal = 1 - (T.dome(t) - 0.12) / 0.88;
  coreM.emissiveIntensity = 2.2 * reveal * (1 + 0.08 * Math.sin(t * 7)); coreGlow.material.opacity = 0.5 * reveal;
  winM.emissiveIntensity = 0.2 + 0.5 * day; cloudM.emissiveIntensity = 0.3 * day;

  // mascot placement
  let [mx, my, ms] = T.pos(t);
  const inU = ramp(t, 0.1, 0.95); my += (1 - backOut(inU)) * 5.2;
  const bob = Math.sin(t * 1.9) * 0.07;
  const fear = 1 - Math.max(day, sp);
  const tremble = fear * ramp(t, 8.3, 8.8) * (1 - ramp(t, 12.9, 13.4));
  const zoom = ramp(t, 41.45, 42.05), zz = zoom * zoom * zoom;
  mascot.position.set(mx + Math.sin(t * 43) * 0.018 * tremble, my + bob + Math.sin(t * 37) * 0.012 * tremble + zz * 0.4, zz * 9.6);
  mascot.scale.setScalar(ms);
  mascot.visible = t < 42.05;
  const env = LIP.env[fi];
  const [gx, gy] = T.gaze(t);
  const nod = env * Math.sin(t * 5.2) * 0.035;
  head.rotation.set(-gy * 0.3 + nod, gx * 0.36, Math.sin(t * 1.1) * 0.05 + env * Math.sin(t * 2.6) * 0.04 - gx * 0.06);
  const anticip = ramp(t, 41.1, 41.45) * (1 - ramp(t, 41.45, 41.6));
  head.scale.set(1 + 0.1 * anticip, 1 - 0.12 * anticip, 1 + 0.1 * anticip);
  // eyes
  let blink = 0; for (const b of BLINKS) blink = Math.max(blink, 1 - Math.abs(t - b) / 0.085);
  blink = clamp01(blink);
  const wink = win(t, 39.45, 39.95, 0.08);
  const es = T.eyeS(t), happySquint = 0.1 * Math.max(0, T.smile(t) - 0.6) / 0.4;
  for (const e of eyes) {
    const closed = Math.max(blink, e.sd === 1 ? wink : 0);
    e.g.scale.set(es, es * Math.max(0.07, (1 - closed) * (1 - happySquint)), 1);
    e.pupil.position.set(gx * 0.075 - e.sd * 0.018, gy * 0.085, 0);
  }
  const sad = T.sad(t), by = T.browY(t), asym = T.browAsym(t);
  for (const b of brows) {
    const x = b.sd * 0.35, y = 0.535 + by + (b.sd === 1 ? asym : 0) + blink * -0.015;
    b.m.position.set(x, y, onSphere(x, y, 1.03));
    b.m.rotation.set(-0.45, b.sd * 0.3, -b.sd * sad + b.sd * -0.06);
  }
  // mouth
  const open = LIP.open[fi] * 0.78, narrow = LIP.narrow[fi] * 0.32, syl = 1;
  const smile = T.smile(t);
  const surprise = win(t, 25.75, 26.4, 0.12) * (1 - env);
  setMouth((0.29 + 0.06 * Math.max(0, smile)) * (1 - narrow) * (1 - 0.45 * surprise), smile * (1 - 0.35 * open), Math.max(open, surprise * 0.55, wink * 0.25 * (1 - env)));
  // hands
  const hr = T.handR(t), hl = T.handL(t);
  const wave = win(t, 1.1, 2.9, 0.25), beckon = win(t, 40.0, 40.8, 0.15), talk = env * 0.05;
  hands[1].position.set(hr[0] + wave * Math.sin(t * 11) * 0.2 + beckon * Math.sin(t * 16) * 0.05, hr[1] + Math.sin(t * 2.3) * 0.03 + talk * Math.sin(t * 6.1) + beckon * Math.cos(t * 16) * 0.12 + bob * 0.3, hr[2]);
  hands[0].position.set(hl[0], hl[1] + Math.sin(t * 2.3 + 1.7) * 0.03 + talk * Math.sin(t * 5.3 + 2) + bob * 0.3, hl[2]);
  // hat
  const hatIn = ramp(t, 25.75, 26.1), hatOut = ramp(t, 35.15, 35.6);
  hat.visible = t > 25.75 && t < 35.6;
  const hb = hatIn < 1 ? (1 - hatIn) * (1 - hatIn) * 4 : Math.max(0, Math.sin((t - 26.1) * 18) * 0.06 * Math.exp(-(t - 26.1) * 7));
  hat.position.set(hatOut * 0.6, 0.66 + hb + hatOut * hatOut * 6, -0.02); hat.rotation.set(-0.2, 0, -0.1 - hatOut * 2);
  // icons
  ICONS.forEach((ic, i) => {
    const a = backOut(ramp(t, ICON_T[i], ICON_T[i] + 0.35)) * (1 - smooth(ramp(t, 35.1 + i * 0.07, 35.5 + i * 0.07)));
    ic.g.visible = a > 0.001; ic.g.scale.setScalar(Math.max(0.001, a));
    ic.g.position.y = [1.92, 1.92, 0.78, 0.78][i] + Math.sin(t * 1.6 + i * 1.3) * 0.03;
    ic.c.rotation.y = Math.sin(t * 1.3 + i) * 0.28;
  });
  { const ph = ((t - ICON_T[0]) % 1.9 + 1.9) % 1.9, d = ph < 0.55 ? 0 : 0.17 * (1 - Math.exp(-4 * (ph - 0.55)));
    const wob = ph < 0.55 ? Math.sin(ph * 30) * 0.012 * (ph / 0.55) : 0;
    fisA.position.set(-d + wob, d * 0.7, 0); fisB.position.set(d - wob, -d * 0.7, 0);
    fisN.forEach((n, i) => { const a = [0.9, 3.4, 5.2][i], r = ph < 0.55 ? 0 : (ph - 0.55) * 0.3; n.visible = ph >= 0.55 && r < 0.36; n.position.set(Math.cos(a) * r, Math.sin(a) * r, 0.05); });
    fisFlash.material.opacity = ph < 0.55 ? 0 : 0.8 * Math.exp(-5 * (ph - 0.55)); fisFlash.scale.setScalar(0.7); }
  
  // camera
  camera.position.set(Math.sin(t * 0.21) * 0.12, 0.2 + Math.sin(t * 0.17) * 0.05, 11 - ramp(t, 8, 13) * 0.0);
  camera.lookAt(0, 0.2, 0);
  // overlay: fade in, exit flash
  const flashA = Math.max(ramp(t, 41.7, 42.05) * (1 - ramp(t, 42.1, 42.8)), 0);
  const fadeIn = 1 - ramp(t, 0, 0.35);
  overlay.material.color.setHex(fadeIn > 0 ? 0x070b2a : 0xffffff);
  overlay.material.opacity = Math.max(flashA, fadeIn);
  composer.render();
};
function win(t, a, b, f = 0.3) { return Math.min(ramp(t, a, a + f), 1 - ramp(t, b - f, b)); }
window.DURATION = END;
window.__dbg = { scene, world, space, skyMat, mascot, hands, halo, camera, composer, hemi, sunL, key, fill, THREE };
window.renderFrame(0);
window.ready = true;
