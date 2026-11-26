// Libreria comune — la CENTRALE di giorno (puntate 3–6): colline, alberi, nuvole, due torri con il vapore,
// cupola del reattore con la metà frontale che può diventare trasparente (nocciolo arancione, generatore di vapore,
// circuito primario con le gocce), sala turbine, tubo del vapore, traliccio con il cavo e le scintille, bandiera italiana.
//
// const c = creaCentrale();          → { scene, camera, hillY, update(tn, cam, cupola, potenza = 1), nocciolo: { inside, VX, VY, VZ } }
//   potenza (puntata 6): 1 = nocciolo acceso, 0 = spento (barre di controllo inserite)
//   cam = [x, y, z, guardaX, guardaY, guardaZ]  (la camera ondeggia appena da sola)
//   cupola = opacità della metà frontale della cupola (1 chiusa, 0,1 quasi trasparente)
// Tutto ciò che si muove di continuo (nuvole, vapore, bandiera, gocce, scintille) usa il tempo del video tn.
import { THREE, W, H, V, std, basic, mesh, bar, glow, pipeCurve, tube, gradientBg, lights, addFade, setSeed, rnd } from './base.js';

export function creaCentrale() {
  setSeed(777);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, W / H, 0.05, 400); scene.add(camera); addFade(camera);
  gradientBg(scene, 0x2f86e6, 0xc6ebff);
  lights(scene);
  const sun = glow(0xfff0b0, scene, 34); sun.position.set(9, 22, -85); sun.material.opacity = 0.95;
  const world = new THREE.Group(); scene.add(world);
  // colline e alberi
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
  // nuvole
  const cloudM = std(0xffffff, { roughness: 1, emissive: 0xdde8f5, emissiveIntensity: 0.3 });
  const clouds = [[-6, 13.5, -58, 1.3], [13.5, 16, -62, 1.4], [3.8, 17.5, -66, 1.2], [-11.5, 15.2, -70, 1.5], [9.5, 11.8, -56, 1.0]].map(([x, y, z, s]) => {
    const g = new THREE.Group(); g.position.set(x, y, z); g.scale.set(s, s * 0.62, s); g.userData.x = x; world.add(g);
    [[0, 0, 0, 1.5], [1.6, -0.2, 0, 1.1], [-1.6, -0.25, 0, 1.15], [0.7, 0.55, -0.3, 1.0], [-0.8, 0.4, 0.2, 0.9]].forEach(([a, b, c, r]) => mesh(new THREE.SphereGeometry(r, 20, 14), cloudM, g, V(a, b, c)));
    return g;
  });
  const steelM = std(0x9fb0c8, { metalness: 0.4, roughness: 0.4 });
  const darkBlueM = std(0x4a6fa8);
  // torri di raffreddamento con fascia rossa e vapore
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
  // cupola del reattore: metà posteriore fissa, metà frontale (domeFront, bandFront) che diventa trasparente
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
  mesh(new THREE.CylinderGeometry(2.27, 2.27, 0.6, 48), std(0xc3cedf, { roughness: 0.9 }), domeG, V(0, -0.08, 0));   // pavimento: la collina non affiora
  // dentro la cupola: vessel con le barrette, generatore di vapore, circuito primario
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
  // sala turbine
  const HX = -1.2, HZ = -39.6, HG = hillY(HX, HZ) - 0.05;
  const hallG = new THREE.Group(); hallG.position.set(HX, HG, HZ); world.add(hallG);
  mesh(new THREE.BoxGeometry(3.6, 2.4, 2.4), std(0x8fc0ee, { roughness: 0.8 }), hallG, V(0, 1.2, 0));
  mesh(new THREE.BoxGeometry(3.8, 0.2, 2.6), darkBlueM, hallG, V(0, 2.5, 0));
  for (let i = 0; i < 5; i++) mesh(new THREE.BoxGeometry(0.36, 0.55, 0.05), new THREE.MeshStandardMaterial({ color: 0xfff0a0, emissive: 0xffd860, emissiveIntensity: 0.7 }), hallG, V(-1.3 + i * 0.65, 1.35, 1.22));
  // tubo del vapore, traliccio, cavo con le scintille
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
  // bandiera
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

  function update(tn, c, dOp, pot = 1) {
    camera.position.set(c[0] + Math.sin(tn * 0.21) * 0.1, c[1] + Math.sin(tn * 0.17) * 0.05, c[2]); camera.lookAt(c[3], c[4], c[5]);
    clouds.forEach((cl, i) => { cl.position.x = cl.userData.x + Math.sin(tn * 0.05 + i) * 0.8 + tn * 0.02; });
    for (const m of puffs) {
      const d = m.userData, ph = (tn * 0.085 + d.ph) % 1;
      m.position.set(d.x + Math.cos(d.a) * d.r * (1 + ph) + ph * ph * 2.2, d.base + ph * 6.5, d.z + Math.sin(d.a) * d.r);
      m.scale.setScalar(d.s * (0.95 + ph * 1.9)); m.material.opacity = 0.55 * Math.min(1, ph * 6) * (1 - ph);
    }
    waveFlag(tn);
    domeFront.opacity = bandFront.opacity = dOp; domeFront.depthWrite = bandFront.depthWrite = dOp > 0.99;
    coreM.emissiveIntensity = 2.3 * (1 + 0.08 * Math.sin(tn * 7)) * (0.12 + 0.88 * pot); coreGlow.material.opacity = 0.38 * (1 - dOp) * (0.15 + 0.85 * pot);
    primDrops.forEach((m, i) => { primLoop.getPointAt((i / primDrops.length + tn * 0.19) % 1, m.position); m.position.z += 0.02; });
    cableDots.forEach((d, i) => { cableCurve.getPointAt((tn * 0.42 + i / cableDots.length) % 1, d.position); });
  }
  return { scene, camera, hillY, update, nocciolo: { inside, VX, VY, VZ } };
}
// inquadrature usate più spesso: [x, y, z, guardaX, guardaY, guardaZ]
export const CAM_WIDE = [-1, 3.8, 11, -1, 3.0, -40], CAM_CORE = [2.95, 2.45, -33.0, 2.95, 2.34, -39.75], CAM_PUSH = [2.95, 2.34, -38.8, 2.95, 2.34, -39.75];
