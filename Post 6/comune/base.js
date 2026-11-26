// Libreria comune — base: dimensioni del video, funzioni matematiche, tempi, mattoncini three.js.
// Usata da tutti gli altri file di `comune/` e dalle puntate. Nessun oggetto di scena qui, solo strumenti.
import * as THREE from 'three';
export { THREE };

// dimensioni del video: 1080×1920; per i fotogrammi di prova a metà risoluzione la pagina si apre con ?w=540&h=960
const q = new URLSearchParams(location.search);
export const W = +(q.get('w') || 1080), H = +(q.get('h') || 1920);

// ---------------- matematica
export const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const clamp01 = x => Math.min(1, Math.max(0, x));
export const smooth = x => { x = clamp01(x); return x * x * (3 - 2 * x); };
export const ramp = (t, a, b) => clamp01((t - a) / (b - a));
export const lerp = (a, b, u) => a + (b - a) * u;
export const hash = k => { const s = Math.sin(k * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
export const backOut = x => { x = clamp01(x); const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
export const easeOut = (u, k = 2.2) => 1 - Math.pow(1 - clamp01(u), k);
// finestra: sale in f secondi da a, scende in f secondi fino a b
export const win = (t, a, b, f = 0.3) => Math.min(ramp(t, a, a + f), 1 - ramp(t, b - f, b));
// comparsa "a molla" (icone): entra con rimbalzo da a, esce sfumando fino a b
export const pop = (t, a, b, din = 0.35, dout = 0.3) => backOut(ramp(t, a, a + din)) * (1 - smooth(ramp(t, b - dout, b)));
// numeri casuali ripetibili: ogni costruzione fissa il suo seme con setSeed, così il risultato non dipende dall'ordine dei file
let seed = 777;
export const setSeed = s => { seed = s; };
export const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
// geometria nel piano xy
export const xy = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const segDist = (p, a, b) => { const abx = b.x - a.x, aby = b.y - a.y, u = clamp01(((p.x - a.x) * abx + (p.y - a.y) * aby) / (abx * abx + aby * aby)); return Math.hypot(p.x - a.x - u * abx, p.y - a.y - u * aby); };
export const dirTo = (a, b) => V(b.x - a.x, b.y - a.y, 0).normalize();
export const segAt = (a, b, u) => a.clone().lerp(b, u);
export const polySegs = pts => pts.slice(1).map((p, i) => [pts[i], p]);

// ---------------- tempi
// traccia a chiavi [[t, valore], ...] con passaggio morbido; il valore può essere un numero o un array
export function track(keys) {
  return t => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 0; i < keys.length - 1; i++) {
      const [t0, a] = keys[i], [t1, b] = keys[i + 1];
      if (t <= t1) { const u = smooth((t - t0) / (t1 - t0)); return Array.isArray(a) ? a.map((v, k) => lerp(v, b[k], u)) : lerp(a, b, u); }
    }
    return keys[keys.length - 1][1];
  };
}
// tabella WARP [[t scaletta, t video], ...]: unwarp porta il tempo del video a quello della scaletta (per gli eventi),
// fwarp fa il contrario, rt sposta le chiavi di una traccia (camere, rotazioni). Vedi regole.md, "Tempi".
export function creaWarp(WARP, END) {
  const unwarp = tn => { for (let i = 0; i < WARP.length - 1; i++) { const [o0, n0] = WARP[i], [o1, n1] = WARP[i + 1]; if (tn <= n1) return o0 + (o1 - o0) * (tn - n0) / (n1 - n0); } return END; };
  const fwarp = t => { for (let i = 0; i < WARP.length - 1; i++) { const [o0, n0] = WARP[i], [o1, n1] = WARP[i + 1]; if (t <= o1) return n0 + (n1 - n0) * (t - o0) / (o1 - o0); } return WARP[WARP.length - 1][1]; };
  return { unwarp, fwarp, rt: keys => keys.map(([k, v]) => [fwarp(k), v]) };
}

// ---------------- mattoncini three.js
export const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.0, ...o });
export const basic = (color, o = {}) => new THREE.MeshBasicMaterial({ color, ...o });
export function mesh(geo, mat, parent, pos) { const m = new THREE.Mesh(geo, mat); if (pos) m.position.copy(pos); parent.add(m); return m; }
const UP = V(0, 1, 0);
export function bar(a, b, r, mat, parent) {
  const d = b.clone().sub(a), m = mesh(new THREE.CylinderGeometry(r, r, d.length(), 8), mat, parent, a.clone().add(b).multiplyScalar(0.5));
  m.quaternion.setFromUnitVectors(UP, d.normalize()); return m;
}
export const glowTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'), gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.5)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c);
})();
// bagliore sfocato (sprite additivo), parte spento: opacity 0
export const glow = (color, parent, scale = 1) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); s.scale.setScalar(scale); parent.add(s); return s; };
export const pipeCurve = (pts, closed = false) => new THREE.CatmullRomCurve3(pts, closed, 'catmullrom', 0.08);
export const tube = (curve, r, mat, parent, seg = 240) => mesh(new THREE.TubeGeometry(curve, seg, r, 10, curve.closed), mat, parent);
export function gradientBg(scene, top, bottom) {
  const m = new THREE.ShaderMaterial({
    uniforms: { top: { value: new THREE.Color(top) }, bottom: { value: new THREE.Color(bottom) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 1.0, 1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 bottom; varying vec2 vUv; void main(){ gl_FragColor = vec4(mix(bottom, top, smoothstep(0.0, 1.0, vUv.y)), 1.0); }',
    depthTest: false, depthWrite: false,
  });
  const s = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), m); s.frustumCulled = false; s.renderOrder = -1000; scene.add(s); return m;
}
export function lights(scene, k = 1) {
  scene.add(new THREE.HemisphereLight(0xcfe6ff, 0x4a6a4a, 1.32 * k));
  const s = new THREE.DirectionalLight(0xfff3de, 2.45 * k); s.position.set(8, 14, 12); scene.add(s);
}
// lampo chiaro nei passaggi fra un mondo e l'altro: un piano davanti a ogni camera, con un solo materiale
export const fadeMat = basic(0xfff4dc, { transparent: true, opacity: 0, depthTest: false, depthWrite: false });
export const addFade = cam => { const m = mesh(new THREE.PlaneGeometry(10, 10), fadeMat, cam, V(0, 0, -0.5)); m.renderOrder = 9999; };
