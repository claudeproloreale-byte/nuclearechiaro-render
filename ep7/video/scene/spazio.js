// Puntata 7 — SPAZIO (B1): fondo blu notte con stelle e bagliori sfocati. Dalla v2 (senza saluto) al centro c'è un nucleo
// instabile grande, con l'alone rosa che pulsa e i nucleoni che tremano: anticipa il tema.
// Dal 4,25 si passa alla collina con il lampo chiaro (tempi.js, SWITCH).
import { THREE, W, H, V, std, mesh, glow, gradientBg, lights, addFade, setSeed, rnd } from '/comune/base.js';

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
  // nucleo in alto a destra (40 nucleoni, protoni corallo e neutroni azzurri)
  const nuc = new THREE.Group(); nuc.position.set(0, 0.75, 0); nuc.scale.setScalar(2.2); scene.add(nuc);
  const pM = std(0xf06a52, { roughness: 0.55 }), nM = std(0x5aa8f0, { roughness: 0.55 }), geo = new THREE.SphereGeometry(0.075, 12, 10);
  const pts = []; while (pts.length < 40) { const p = V(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).multiplyScalar(0.26); if (p.length() > 0.26) continue; if (pts.every(o => o.distanceTo(p) > 0.098)) pts.push(p); }
  const parts = pts.map((p, i) => ({ m: mesh(geo, i % 5 < 2 ? pM : nM, nuc, p), p }));
  const nGlow = glow(0xff5fd2, nuc, 1.5); nGlow.material.opacity = 0.5;
  return { scene, camera, aggiorna(tn) {
    starM.opacity = 0.75 + 0.15 * Math.sin(tn * 2.1);
    nuc.rotation.set(tn * 0.25, tn * 0.35, 0);
    parts.forEach(({ m, p }, k) => m.position.set(p.x + Math.sin(tn * 31 + k * 1.7) * 0.018, p.y + Math.cos(tn * 27 + k * 2.3) * 0.018, p.z + Math.sin(tn * 23 + k) * 0.018));
    nGlow.material.opacity = 0.5 * (1 + 0.3 * Math.sin(tn * 7)); nGlow.scale.setScalar(1.5 * (1 + 0.12 * Math.sin(tn * 5.3)));
    blobs.forEach((b, i) => { b.material.opacity = 0.2 + 0.05 * Math.sin(tn * 0.7 + i); });
    camera.position.set(Math.sin(tn * 0.3) * 0.05, Math.sin(tn * 0.23) * 0.04, 12); camera.lookAt(0, 0, 0);
  } };
}
