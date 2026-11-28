// Puntata 8 — la CENTRALE costruita dentro un "sito" della collina che ruota (scene/mondo.js). Coordinate come in
// comune/centrale.js e nella puntata 3 (cupola a x 3,7, sala turbine a x −1,2, z ≈ −40), così le inquadrature si riconoscono.
//   - cupola con la metà davanti apribile: vessel, nocciolo, generatore di vapore, circuito primario con le gocce
//   - sala turbine con la parete davanti apribile: turbina, alternatore, condensatore con la serpentina
//   - circuito secondario (vapore → turbina → condensatore → generatore di vapore) con le particelle (bianche = vapore, blu = acqua)
//   - TERZO circuito: dal condensatore l'acqua scaldata va alla torre (o al mare) e torna fresca
//   - due torri (scene/torre.js), cavo con le scintille (solo senza torri), bandiera italiana
//
// const P = creaCentrale8(inner, { torri: true, interno: true, uscita: 'torre' | 'mare', hillY })
//   P.aggiorna(tn, t, st)   st = { cupola, sala, circ: [p, s, t] (risalto 0..1), pareti, torre: {...}, torre2: {...} }
import { THREE, V, std, basic, mesh, bar, glow, pipeCurve, tube, clamp01, smooth, ramp, lerp, hash, setSeed, rnd } from '/comune/base.js';
import { creaTorre } from './torre.js';

export const DX = 3.7, DZ = -40, HX = -1.2, HZ = -39.6, AX = 2.94, TZ = -39.3, CDX = -0.45;
export const T1 = [-7.2, -44.2], T2 = [-2.6, -49.5];

export function creaCentrale8(world, o = {}) {
  const { torri = true, interno = true, uscita = 'torre', hillY, seme = 1, mareA = null, mareB = null, cavo = 'no' } = o;
  setSeed(8100 + seme);
  const steelM = std(0x9fb0c8, { metalness: 0.4, roughness: 0.4 });
  const darkBlueM = std(0x4a6fa8);
  const DY = hillY(DX, DZ) - 0.1, HG = hillY(HX, HZ) - 0.05, CDY = HG + 0.5;
  const P = { DY, HG, CDY };

  // ---------------- cupola
  const domeG = new THREE.Group(); domeG.position.set(DX, DY, DZ); world.add(domeG);
  const domeM = std(0xf2f4f8, { roughness: 0.85, side: THREE.DoubleSide, emissive: 0xdfe8f5, emissiveIntensity: 0.32 });
  const domeFront = std(0xf2f4f8, { roughness: 0.85, transparent: true, opacity: 1, emissive: 0xdfe8f5, emissiveIntensity: 0.2 });
  const bandFront = std(0x3f8fe0, { transparent: true, opacity: 1 });
  const PI = Math.PI;
  mesh(new THREE.CylinderGeometry(2.3, 2.3, 3.2, 64, 1, true, PI / 2, PI), domeM, domeG, V(0, 1.6, 0));
  mesh(new THREE.SphereGeometry(2.3, 64, 24, PI, PI, 0, PI / 2), domeM, domeG, V(0, 3.2, 0));
  mesh(new THREE.CylinderGeometry(2.36, 2.36, 0.3, 64, 1, true, PI / 2, PI), std(0x3f8fe0), domeG, V(0, 3.1, 0));
  [mesh(new THREE.CylinderGeometry(2.3, 2.3, 3.2, 64, 1, true, -PI / 2, PI), domeFront, domeG, V(0, 1.6, 0)),
   mesh(new THREE.SphereGeometry(2.3, 64, 24, 0, PI, 0, PI / 2), domeFront, domeG, V(0, 3.2, 0)),
   mesh(new THREE.CylinderGeometry(2.36, 2.36, 0.3, 64, 1, true, -PI / 2, PI), bandFront, domeG, V(0, 3.1, 0))].forEach(m => { m.renderOrder = 5; });
  mesh(new THREE.CylinderGeometry(2.27, 2.27, 0.6, 64), std(0xc3cedf, { roughness: 0.9 }), domeG, V(0, -0.08, 0));
  // portellone e piccolo edificio ausiliario accanto alla cupola
  mesh(new THREE.BoxGeometry(1.5, 1.6, 1.4), std(0xdfe6ef, { roughness: 0.85 }), world, V(DX + 2.6, DY + 0.8, DZ - 1.2));
  mesh(new THREE.BoxGeometry(1.6, 0.12, 1.5), darkBlueM, world, V(DX + 2.6, DY + 1.62, DZ - 1.2));
  const inside = new THREE.Group(); domeG.add(inside);
  const VX = -0.75, VY = 1.3, VZ = 0.25;
  const glassM = new THREE.MeshStandardMaterial({ color: 0x9fc4e8, transparent: true, opacity: 0.3, roughness: 0.2, depthWrite: false });
  mesh(new THREE.CapsuleGeometry(0.52, 1.15, 8, 32), glassM, inside, V(VX, VY, VZ)).renderOrder = 2;
  mesh(new THREE.TorusGeometry(0.535, 0.05, 10, 40), darkBlueM, inside, V(VX, VY + 0.72, VZ)).rotation.x = PI / 2;
  [-1, 1].forEach(sd => mesh(new THREE.BoxGeometry(0.14, 0.3, 0.5), darkBlueM, inside, V(VX + sd * 0.42, 0.16, VZ)));
  const coreM = new THREE.MeshStandardMaterial({ color: 0xff9a3a, emissive: 0xff6a18, emissiveIntensity: 2.3 });
  for (let i = 0; i < 4; i++) for (let k = 0; k < 3; k++) mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.95, 12), coreM, inside, V(VX - 0.255 + i * 0.17, VY - 0.25, VZ - 0.17 + k * 0.17));
  [-0.76, 0.26].forEach(dy => mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.04, 28), steelM, inside, V(VX, VY + dy, VZ)));
  const coreGlow = glow(0xffa040, inside, 3.2); coreGlow.position.set(VX, VY - 0.25, VZ + 0.7);
  const SGX = 0.95, SGY = 2.6, SGZ = 0.1;
  mesh(new THREE.CapsuleGeometry(0.42, 1.7, 8, 32), glassM, inside, V(SGX, SGY, SGZ)).renderOrder = 3;
  const sgWaterM = new THREE.MeshStandardMaterial({ color: 0x6fb4ee, transparent: true, opacity: 0.6, roughness: 0.3, depthWrite: false, emissive: 0x2a7fe0, emissiveIntensity: 0.55 });
  mesh(new THREE.CylinderGeometry(0.37, 0.37, 1.75, 24), sgWaterM, inside, V(SGX, 2.4, SGZ)).renderOrder = 2;
  const PZ = 0.25, pp = (x, y, z = PZ) => V(x, y, z);
  const primPts = [pp(-0.3, 1.78), pp(0.5, 1.78), pp(0.8, 2.05), pp(0.8, 3.2), pp(0.95, 3.42), pp(1.1, 3.2), pp(1.1, 1.4), pp(1.1, 0.85), pp(0.9, 0.62), pp(0.3, 0.62), pp(-0.3, 0.62)];
  const primM = new THREE.MeshStandardMaterial({ color: 0xff6a3a, roughness: 0.45, metalness: 0.2, emissive: 0xff4a1a, emissiveIntensity: 0.55 });
  tube(pipeCurve(primPts), 0.07, primM, inside);
  const primLoop = pipeCurve([pp(-0.75, 0.8, 0.6), pp(-0.75, 1.7, 0.6), ...primPts], true);
  mesh(new THREE.SphereGeometry(0.17, 20, 14), std(0x3f6fb8), inside, pp(0.3, 0.62));
  mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.26, 14), std(0x3f6fb8), inside, pp(0.3, 0.86));
  const dropM = new THREE.MeshStandardMaterial({ color: 0xff7a3a, emissive: 0xff4a10, emissiveIntensity: 1.6 });
  const primDrops = Array.from({ length: 14 }, () => mesh(new THREE.SphereGeometry(0.075, 14, 10), dropM, inside));
  const loopGlow = glow(0xff8a4a, inside, 6.5); loopGlow.position.set(0.2, 1.9, -0.6);
  const bubbles = Array.from({ length: 10 }, (_, i) => { const m = mesh(new THREE.SphereGeometry(0.05, 10, 8), basic(0xffffff), inside); m.userData = { ph: i / 10, x: SGX + (hash(i) - 0.5) * 0.5 }; return m; });
  // "pareti" dove i circuiti si passano il calore senza toccarsi: guscio del generatore di vapore e scatola del condensatore
  const wallGlowM = new THREE.MeshBasicMaterial({ color: 0xbff4ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  mesh(new THREE.CapsuleGeometry(0.45, 1.7, 8, 32), wallGlowM, inside, V(SGX, SGY, SGZ)).renderOrder = 9;

  // ---------------- sala turbine
  const hallG = new THREE.Group(); hallG.position.set(HX, HG, HZ); world.add(hallG);
  const hl = (x, y, z) => V(x - HX, y - HG, z - HZ);
  const hallFront = std(0x8fc0ee, { roughness: 0.8, transparent: true, opacity: 1 });
  const winFront = new THREE.MeshStandardMaterial({ color: 0xfff0a0, emissive: 0xffd860, emissiveIntensity: 0.7, transparent: true, opacity: 1 });
  mesh(new THREE.BoxGeometry(3.7, 0.12, 2.5), std(0x7f95b5), hallG, V(0, 0.06, 0));
  mesh(new THREE.BoxGeometry(3.6, 2.4, 0.1), std(0xb7d8f4, { roughness: 0.9 }), hallG, V(0, 1.2, -1.15));
  [-1, 1].forEach(sd => mesh(new THREE.BoxGeometry(0.1, 2.4, 2.4), std(0x8fc0ee, { roughness: 0.8 }), hallG, V(sd * 1.75, 1.2, 0)));
  mesh(new THREE.BoxGeometry(3.8, 0.2, 2.6), darkBlueM, hallG, V(0, 2.5, 0));
  const hallFrontMeshes = [mesh(new THREE.BoxGeometry(3.6, 2.4, 0.1), hallFront, hallG, V(0, 1.2, 1.15))];
  for (let i = 0; i < 5; i++) hallFrontMeshes.push(mesh(new THREE.BoxGeometry(0.36, 0.55, 0.05), winFront, hallG, V(-1.3 + i * 0.65, 1.35, 1.22)));
  hallFrontMeshes.forEach(m => { m.renderOrder = 5; });
  bar(hl(0.42, AX, TZ), hl(-2.7, AX, TZ), 0.06, steelM, hallG);
  [0.34, -1.17].forEach(x => mesh(new THREE.BoxGeometry(0.14, AX - HG, 0.4), darkBlueM, hallG, hl(x, (AX + HG) / 2, TZ)));
  const rotor = new THREE.Group(); rotor.position.copy(hl(0, AX, TZ)); hallG.add(rotor);
  const bladeA = std(0xeef2f8, { roughness: 0.4 }), bladeB = std(0x3f8fe0, { roughness: 0.4 });
  [[0.15, 0.28], [-0.11, 0.36], [-0.37, 0.44], [-0.63, 0.52], [-0.89, 0.6]].forEach(([x, r], d) => {
    mesh(new THREE.CylinderGeometry(r * 0.4, r * 0.4, 0.17, 24), steelM, rotor, V(x, 0, 0)).rotation.z = PI / 2;
    for (let k = 0; k < 10; k++) {
      const piv = new THREE.Group(); piv.position.x = x; piv.rotation.x = k * PI / 5 + d * 0.2; rotor.add(piv);
      const geo = new THREE.BoxGeometry(0.17, r * 0.62, 0.035); geo.translate(0, r * 0.69, 0);
      mesh(geo, k % 2 ? bladeA : bladeB, piv).rotation.y = 0.6;
    }
  });
  const genM = new THREE.MeshStandardMaterial({ color: 0xffc928, roughness: 0.4, emissive: 0xffa800, emissiveIntensity: 0.7 });
  { const c = mesh(new THREE.CylinderGeometry(0.46, 0.46, 1.2, 32), genM, hallG, hl(-1.97, AX, TZ)); c.rotation.z = PI / 2;
    [-0.42, 0.42].forEach(dx => { mesh(new THREE.CylinderGeometry(0.475, 0.475, 0.12, 32), darkBlueM, hallG, hl(-1.97 + dx, AX, TZ)).rotation.z = PI / 2; });
    mesh(new THREE.BoxGeometry(1.0, AX - 0.42 - HG, 0.6), darkBlueM, hallG, hl(-1.97, (AX - 0.42 + HG) / 2, TZ)); }
  const genGlow = glow(0xffd860, hallG, 3.4); genGlow.position.copy(hl(-1.97, AX, TZ + 0.9));
  // condensatore
  const condGeo = new THREE.BoxGeometry(1.1, 0.68, 0.9);
  mesh(condGeo, new THREE.MeshStandardMaterial({ color: 0x9fc4e8, transparent: true, opacity: 0.3, roughness: 0.2, depthWrite: false }), hallG, hl(CDX, CDY, TZ)).renderOrder = 2;
  { const e = new THREE.LineSegments(new THREE.EdgesGeometry(condGeo), new THREE.LineBasicMaterial({ color: 0x3f6fb8 })); e.position.copy(hl(CDX, CDY, TZ)); hallG.add(e); }
  mesh(new THREE.BoxGeometry(1.14, 0.72, 0.94), wallGlowM, hallG, hl(CDX, CDY, TZ)).renderOrder = 9;
  const terM = new THREE.MeshStandardMaterial({ color: 0x3f8fe8, emissive: 0x1f6fe0, emissiveIntensity: 0.25, roughness: 0.4 });
  { const pts = []; for (let i = 0; i < 7; i++) pts.push(hl(CDX - 0.42 + i * 0.14, CDY + (i % 2 ? 0.2 : -0.2), TZ - 0.15));
    tube(pipeCurve([hl(CDX - 0.42, CDY - 0.2, TZ + 0.55), ...pts, hl(CDX + 0.42, CDY - 0.2, TZ + 0.55)]), 0.04, terM, hallG, 160); }

  // ---------------- circuito secondario
  const SGW = V(DX + SGX, DY + SGY, DZ + SGZ);
  const steamPts = [V(SGW.x, DY + 3.85, -39.9), V(SGW.x, DY + 4.15, -39.9), V(0.85, DY + 4.15, -39.55), V(0.85, 3.55, -39.4), V(0.2, 3.55, TZ), V(0.08, 3.22, TZ)];
  const feedPts = [V(-0.02, CDY, TZ), V(1.2, CDY, -39.4), V(1.2, DY + 2.75, -39.6), V(SGW.x - 0.4, DY + 2.75, -39.9)];
  const steamPipeM = new THREE.MeshStandardMaterial({ color: 0xdfe6f0, roughness: 0.5, emissive: 0xbfe6ff, emissiveIntensity: 0.25 });
  const feedPipeM = new THREE.MeshStandardMaterial({ color: 0x8fbfe8, roughness: 0.5, emissive: 0x2a7fe0, emissiveIntensity: 0.25 });
  tube(pipeCurve(steamPts), 0.075, steamPipeM, world); tube(pipeCurve(feedPts), 0.065, feedPipeM, world);
  mesh(new THREE.SphereGeometry(0.17, 20, 14), std(0x3f6fb8), world, V(0.9, CDY, -39.38));
  const secLoop = pipeCurve([V(SGW.x, DY + 3.5, -39.9), ...steamPts, V(0.0, AX, TZ), V(-0.85, AX, TZ), V(-0.62, 2.4, TZ), V(CDX, CDY, TZ), ...feedPts, V(SGW.x - 0.15, DY + 2.75, -39.9), V(SGW.x, DY + 3.1, -39.9)], true);
  const secU = target => { let best = 0, bd = 1e9; for (let i = 0; i <= 600; i++) { const d = secLoop.getPointAt(i / 600).distanceTo(target); if (d < bd) { bd = d; best = i / 600; } } return best; };
  const U_TURB = secU(V(0.0, AX, TZ)), U_COND = secU(V(CDX, CDY, TZ));
  const steamPM = basic(0xffffff, { transparent: true, opacity: 0.95 }), waterPM = new THREE.MeshStandardMaterial({ color: 0x7fc4f8, emissive: 0x3f8fe8, emissiveIntensity: 0.9 });
  const secParts = Array.from({ length: 30 }, () => mesh(new THREE.SphereGeometry(1, 14, 10), steamPM, world));

  // ---------------- terzo circuito: dal condensatore all'esterno (torre o mare) e ritorno
  const terPipeM = new THREE.MeshStandardMaterial({ color: 0x4f9fe8, roughness: 0.45, metalness: 0.15, emissive: 0x1f6fe0, emissiveIntensity: 0.15 });
  const hotPipeM = new THREE.MeshStandardMaterial({ color: 0x6faee8, roughness: 0.45, metalness: 0.15, emissive: 0x1f6fe0, emissiveIntensity: 0.15 });
  let hotC, coldC, torre = null, torre2 = null;
  const g0 = (x, z, dy = 0.18) => V(x, hillY(x, z) + dy, z);
  // i due capi della serpentina escono dalla parete davanti della sala turbine e scendono a terra
  const capoCaldo = [hl(CDX - 0.42, CDY - 0.2, TZ + 0.55).add(hallG.position), V(CDX - 0.42, CDY - 0.2, -38.0), V(CDX - 0.45, HG + 0.22, -37.45)];
  const capoFreddo = [V(CDX + 0.45, HG + 0.14, -37.6), V(CDX + 0.42, CDY - 0.2, -38.0), hl(CDX + 0.42, CDY - 0.2, TZ + 0.55).add(hallG.position)];
  if (uscita === 'torre') {
    // davanti alla centrale, ben in vista: escono dalla sala turbine, corrono a terra verso sinistra ed entrano nella torre T1 dal davanti
    // caldo (fuori) e freddo (dentro) paralleli
    const [tx, tz] = T1, ty = hillY(tx, tz) - 0.1;
    hotC = pipeCurve([...capoCaldo, g0(-1.6, -36.35, 0.22), g0(-4.6, -36.3, 0.22), g0(-6.75, -37.2, 0.22), g0(-7.05, -39.6, 0.22), V(tx - 0.05, ty + 0.3, -41.6), V(tx, ty + 0.45, tz + 1.2), V(tx, ty + 1.1, tz), V(tx, ty + 2.5, tz)]);
    coldC = pipeCurve([V(tx + 0.45, ty + 0.2, -41.3), g0(-6.4, -39.5, 0.14), g0(-6.15, -37.6, 0.14), g0(-4.6, -36.85, 0.14), g0(-1.2, -36.9, 0.14), ...capoFreddo]);
    tube(hotC, 0.085, hotPipeM, world, 240); tube(coldC, 0.085, terPipeM, world, 240);
  } else if (uscita === 'mare') {
    // presa e scarico: tubi che scendono verso l'acqua (mareA = presa, mareB = scarico, punti del sito)
    coldC = pipeCurve([...mareA, ...capoFreddo]);
    hotC = pipeCurve([...capoCaldo, ...mareB]);
    tube(hotC, 0.085, hotPipeM, world, 240); tube(coldC, 0.085, terPipeM, world, 240);
  }
  const terHot = Array.from({ length: 22 }, () => mesh(new THREE.SphereGeometry(0.075, 12, 10), new THREE.MeshStandardMaterial({ color: 0xffb070, emissive: 0xff8040, emissiveIntensity: 1.0 }), world));
  const terCold = Array.from({ length: 22 }, () => mesh(new THREE.SphereGeometry(0.075, 12, 10), new THREE.MeshStandardMaterial({ color: 0x5fb0ff, emissive: 0x2f80f0, emissiveIntensity: 1.0 }), world));

  // ---------------- torri
  if (torri) {
    torre = creaTorre(world, { x: T1[0], y: hillY(...T1) - 0.1, z: T1[1], s: 1, interno, seme: 1 });
    torre2 = creaTorre(world, { x: T2[0], y: hillY(...T2) - 0.1, z: T2[1], s: 0.95, interno: false, seme: 2 });
  }

  // ---------------- cavo dell'elettricità: niente traliccio (nota dell'autore, v1). Con cavo: 'sinistra' esce dall'alternatore e va
  // verso sinistra fuori dall'inquadratura; con cavo: 'no' non c'è (centrale con le torri: davanti alla torre disturbava)
  let cableCurve = null, cableDots = [];
  if (cavo === 'sinistra') {
    cableCurve = new THREE.CatmullRomCurve3([V(-1.97, AX + 0.44, TZ), V(-1.97, 4.3, -39.4), V(-3.2, 4.75, -39.6), V(-8, 4.5, -39.8), V(-14, 4.1, -40), V(-22, 3.4, -40.5)]);
    mesh(new THREE.TubeGeometry(cableCurve, 160, 0.03, 6), std(0x3b4558), world);
    const sparkM = new THREE.MeshStandardMaterial({ color: 0xfff2a0, emissive: 0xffd040, emissiveIntensity: 2.4 });
    cableDots = Array.from({ length: 9 }, () => mesh(new THREE.SphereGeometry(0.11, 12, 10), sparkM, world));
  }

  // ---------------- bandiera (a destra della cupola)
  const flags = [];
  function makeFlag(x, y, z, colors, sc = 1, poleH = 3.7) {
    const FLW = 1.9, FLH = 1.25, geo = new THREE.PlaneGeometry(FLW, FLH, 26, 8);
    const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(sc); world.add(g);
    mesh(new THREE.CylinderGeometry(0.045, 0.06, poleH, 12), std(0xdfe3ea, { metalness: 0.3, roughness: 0.4 }), g, V(0, poleH / 2, 0));
    mesh(new THREE.SphereGeometry(0.1, 16, 12), std(0xffc928, { roughness: 0.35 }), g, V(0, poleH + 0.05, 0));
    const c = document.createElement('canvas'); c.width = 96; c.height = 8; const k = c.getContext('2d');
    colors.forEach((col, i) => { k.fillStyle = col; k.fillRect(i * 32, 0, 32, 8); });
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.magFilter = THREE.NearestFilter;
    const f = mesh(geo, new THREE.MeshStandardMaterial({ map: tx, side: THREE.DoubleSide, roughness: 0.8, emissive: 0xffffff, emissiveMap: tx, emissiveIntensity: 0.22 }), g, V(FLW / 2 + 0.05, poleH - 0.7, 0));
    f.frustumCulled = false; flags.push({ geo, base: geo.attributes.position.array.slice(), FLW, ph: flags.length * 1.3 }); return g;
  }
  makeFlag(7.2, hillY(7.2, -38.2) - 0.05, -38.2, ['#0a9246', '#f7f7f2', '#d42b36'], 0.9);
  function waveFlag(t) {
    for (const fl of flags) {
      const Pa = fl.geo.attributes.position.array, B = fl.base, FLW = fl.FLW;
      for (let i = 0; i < Pa.length; i += 3) {
        const u = (B[i] + FLW / 2) / FLW, ph = u * 7.5 - t * 6.5 + fl.ph;
        Pa[i] = B[i] - u * u * 0.08 * (1 + Math.sin(ph * 0.5)); Pa[i + 1] = B[i + 1] + Math.sin(ph + 0.8) * 0.05 * u - u * u * 0.1; Pa[i + 2] = Math.sin(ph) * 0.2 * u + Math.sin(ph * 1.7 + B[i + 1] * 2) * 0.05 * u;
      }
      fl.geo.attributes.position.needsUpdate = true; fl.geo.computeVertexNormals();
    }
  }

  P.torre = torre; P.torre2 = torre2; P.hotC = hotC; P.coldC = coldC; P.SGW = SGW;
  P.aggiorna = (tn, t, st = {}) => {
    const s = { cupola: 1, sala: 1, circ: [0, 0, 0], pareti: 0, torre: {}, torre2: {}, potenza: 1, ...st };
    domeFront.opacity = bandFront.opacity = s.cupola; domeFront.depthWrite = bandFront.depthWrite = s.cupola > 0.99;
    hallFront.opacity = s.sala; winFront.opacity = clamp01((s.sala - 0.1) / 0.9); hallFront.depthWrite = winFront.depthWrite = s.sala > 0.99;
    const [cp, cs, ct] = s.circ, puls = 0.5 + 0.5 * Math.sin(tn * 5);
    coreM.emissiveIntensity = 2.3 * (1 + 0.08 * Math.sin(tn * 7)) * s.potenza; coreGlow.material.opacity = 0.38 * (1 - s.cupola);
    primM.emissiveIntensity = 0.55 + 0.9 * cp * puls; loopGlow.material.opacity = 0.3 * cp * (1 - s.cupola);
    primDrops.forEach((m, i) => { primLoop.getPointAt((i / primDrops.length + tn * 0.19) % 1, m.position); m.position.z += 0.02; });
    bubbles.forEach(m => { const d = m.userData, u = (tn * 0.7 + d.ph) % 1; m.position.set(d.x + Math.sin(u * 9 + d.ph * 20) * 0.03, 1.75 + u * 1.9, SGZ + 0.5); m.scale.setScalar(Math.max(0.001, (0.6 + u) * Math.sin(u * PI))); });
    steamPipeM.emissiveIntensity = 0.25 + 0.7 * cs * puls; feedPipeM.emissiveIntensity = 0.25 + 0.9 * cs * puls;
    secParts.forEach((m, i) => {
      const u = (i / secParts.length + tn * 0.085) % 1; secLoop.getPointAt(u, m.position);
      const water = u > U_COND, inTurb = u > U_TURB && u <= U_COND, k = inTurb ? 1 - 0.55 * (u - U_TURB) / (U_COND - U_TURB) : 1;
      m.material = water ? waterPM : steamPM; m.scale.setScalar((water ? 0.075 : 0.105 * k) * (1 + 0.25 * cs));
      if (!water) m.position.y += Math.sin(tn * 9 + i * 1.7) * 0.012;
    });
    rotor.rotation.x = -tn * 7.5;
    genM.emissiveIntensity = 0.7 + 0.2 * Math.sin(tn * 11); genGlow.material.opacity = 0.45 * (1 - s.sala);
    cableDots.forEach((d, i) => { cableCurve.getPointAt((tn * 0.3 + i / cableDots.length) % 1, d.position); });
    terM.emissiveIntensity = 0.25 + 1.0 * ct * puls; terPipeM.emissiveIntensity = hotPipeM.emissiveIntensity = 0.15 + 0.9 * ct * puls;
    wallGlowM.opacity = 0.35 * s.pareti * (0.6 + 0.4 * Math.sin(tn * 4));
    if (hotC) {
      terHot.forEach((m, i) => { hotC.getPointAt((i / terHot.length + tn * 0.07) % 1, m.position); m.scale.setScalar(1 + 0.3 * ct); });
      terCold.forEach((m, i) => { coldC.getPointAt((i / terCold.length + tn * 0.07) % 1, m.position); m.scale.setScalar(1 + 0.3 * ct); });
    } else { terHot.concat(terCold).forEach(m => { m.visible = false; }); }
    waveFlag(tn);
    if (torre) torre.aggiorna(tn, s.torre);
    if (torre2) torre2.aggiorna(tn, s.torre2);
  };
  return P;
}
