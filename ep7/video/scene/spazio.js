// Puntata 7 — SPAZIO (B1): fondo blu notte con stelle e bagliori sfocati. Dalla v3 al centro c'è il simbolo della
// radioattività, grande, verde chiaro fosforescente (v2: nucleo instabile). Mascotte già nell'angolo (senza saluto).
// Dal 4,25 si passa alla collina con il lampo chiaro (tempi.js, SWITCH).
import { THREE, W, H, V, std, mesh, glow, gradientBg, lights, addFade, setSeed, rnd } from '/comune/base.js';
import { trifoglio } from '../simbolo7.js';

export function creaSpazio() {
  setSeed(7001);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, W / H, 0.05, 300); scene.add(camera); addFade(camera);
  camera.position.set(0, 0, 12); camera.lookAt(0, 0, 0);
  gradientBg(scene, 0x24305e, 0x120f2a);
  lights(scene, 0.95);
  // stelle: puntini che brillano piano
  const N = 260, pos = new Float32Array(N * 3), ph = [];
  for (let i = 0; i < N; i++) { pos[i * 3] = (rnd() - 0.5) * 30; pos[i * 3 + 1] = (rnd() - 0.5) * 50; pos[i * 3 + 2] = -20 - rnd() * 20; ph.push(rnd() * 6.28); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const starM = new THREE.PointsMaterial({ color: 0xffffff, size: 2.2 * W / 1080, sizeAttenuation: false, transparent: true, opacity: 0.85 });
  scene.add(new THREE.Points(g, starM));
  const blobs = [[-3.5, 5.5, -18, 0x5a7cff, 14], [3.8, -4.5, -22, 0x9a5cff, 16], [-2.5, -7, -25, 0x3aa0ff, 12]].map(([x, y, z, c, s]) => { const b = glow(c, scene, s); b.position.set(x, y, z); b.material.opacity = 0.22; return b; });
  // simbolo della radioattività grande al centro (v3), verde chiaro fosforescente, con un alone che respira
  const simb = new THREE.Group(); simb.position.set(0, 0.75, 0); scene.add(simb);
  const fosM = std(0xb6eaa0, { roughness: 0.5, emissive: 0x5fd94a, emissiveIntensity: 0.45 });   // v4: meno luminoso
  mesh(trifoglio(0.2, 0.12), fosM, simb);
  const sGlow = glow(0x7ee860, simb, 3.0); sGlow.position.z = -0.2;
  const sGlow2 = glow(0xc8ffb0, simb, 1.6); sGlow2.position.z = 0.15;
  return { scene, camera, aggiorna(tn) {
    starM.opacity = 0.75 + 0.15 * Math.sin(tn * 2.1);
    simb.rotation.set(0.12 * Math.sin(tn * 0.9), 0.25 * Math.sin(tn * 0.7), 0.05 * Math.sin(tn * 0.5));
    simb.scale.setScalar(1 + 0.03 * Math.sin(tn * 2.2));
    fosM.emissiveIntensity = 0.42 + 0.08 * Math.sin(tn * 2.6);
    sGlow.material.opacity = 0.22 * (1 + 0.2 * Math.sin(tn * 2.6)); sGlow2.material.opacity = 0;
    blobs.forEach((b, i) => { b.material.opacity = 0.2 + 0.05 * Math.sin(tn * 0.7 + i); });
    camera.position.set(Math.sin(tn * 0.3) * 0.05, Math.sin(tn * 0.23) * 0.04, 12); camera.lookAt(0, 0, 0);
  } };
}
