// Puntata 6 — APERTURA (v2): una bomba atomica stilizzata, "giocattolo", appoggiata su un pavimento di terra marrone;
// sullo sfondo carri armati che avanzano lentamente e qualche pezzo d'artiglieria. Cielo velato: né azzurro né cupo.
// B1 (0–4,4): campo largo, la camera si avvicina appena. B2 (4,5–8,0): zoom sulla bomba, l'involucro diventa trasparente
// (5,4–6,4) e mostra dentro: guscio, cavi, scatola dei comandi e la palla di uranio al centro; poi ci si avvicina alla palla.
// B3: a 8,0 si entra nella palla e a 8,55, con il lampo chiaro, si passa agli atomi (zona B).
// Solo forme semplici e generiche: nessun dettaglio tecnico reale dell'arma.
import { THREE, W, H, V, std, basic, mesh, bar, glow, gradientBg, lights, addFade, setSeed, rnd, track, smooth, ramp } from '/comune/base.js';
import { rt } from '../tempi.js';

export function creaBomba3d() {
  setSeed(606);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, W / H, 0.05, 400); scene.add(camera); addFade(camera);
  gradientBg(scene, 0x8c9cb0, 0xe0d2b4);                       // cielo velato, grigio-azzurro in alto, sabbia in basso
  scene.fog = new THREE.Fog(0xd8cbb0, 28, 140);
  lights(scene, 0.95);
  { const warm = new THREE.DirectionalLight(0xffe2b8, 0.6); warm.position.set(-10, 8, 6); scene.add(warm); }
  const sun = glow(0xfff0d0, scene, 30); sun.position.set(-14, 26, -95); sun.material.opacity = 0.5; sun.material.fog = false;

  // ---------------- terreno: pavimento di terra marrone, dune basse in lontananza, qualche sasso
  mesh(new THREE.PlaneGeometry(600, 600), std(0x8a6a45, { roughness: 1 }), scene).rotation.x = -Math.PI / 2;
  const duneM = std(0x9c7b52, { roughness: 1 });
  [[-40, -95, 30, 5], [10, -110, 40, 6], [55, -90, 28, 4.5], [-80, -120, 45, 7], [90, -125, 40, 6]].forEach(([x, z, r, h]) => {
    const d = mesh(new THREE.SphereGeometry(1, 48, 24), duneM, scene, V(x, 0, z)); d.scale.set(r, h, r * 0.5); });
  const rockM = std(0x75583a, { roughness: 1 });
  for (let i = 0; i < 26; i++) { const r = mesh(new THREE.DodecahedronGeometry(0.15 + rnd() * 0.35, 0), rockM, scene, V((rnd() - 0.5) * 40, 0.05, -4 - rnd() * 40)); r.rotation.set(rnd() * 3, rnd() * 3, 0); r.scale.y = 0.6; }
  // nuvole pallide
  const cloudM = std(0xece6da, { roughness: 1 });
  for (let i = 0; i < 6; i++) { const g = new THREE.Group(); g.position.set(-45 + i * 18 + rnd() * 6, 24 + rnd() * 10, -90 - rnd() * 20); scene.add(g);
    for (let j = 0; j < 5; j++) mesh(new THREE.SphereGeometry(2.2 + rnd() * 1.8, 20, 14), cloudM, g, V(j * 2.6 - 5, rnd() * 1.2, rnd())); g.userData.x = g.position.x; }

  // ---------------- carri armati (avanzano lentamente verso destra) e artiglieria (ferma)
  const olive = std(0x66704a, { roughness: 0.8 }), oliveD = std(0x4b5336, { roughness: 0.85 }), trackM = std(0x2e2f2c, { roughness: 0.9 }), metal = std(0x3b3d3a, { roughness: 0.5, metalness: 0.3 });
  const wheelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.12, 20);
  function tank(x, z, sc, ry) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(sc); g.rotation.y = ry; scene.add(g);
    const wheels = [];
    [-1, 1].forEach(sd => {
      mesh(new THREE.BoxGeometry(3.4, 0.72, 0.5), trackM, g, V(0, 0.42, sd * 0.85));
      for (let i = 0; i < 5; i++) { const w = mesh(wheelGeo, metal, g, V(-1.3 + i * 0.65, 0.4, sd * 1.12)); w.rotation.x = Math.PI / 2; wheels.push(w); }
    });
    mesh(new THREE.BoxGeometry(3.0, 0.6, 1.5), olive, g, V(0, 0.95, 0));
    mesh(new THREE.BoxGeometry(0.6, 0.35, 1.5), olive, g, V(1.55, 0.85, 0)).rotation.z = -0.5;
    const tur = new THREE.Group(); tur.position.set(-0.2, 1.25, 0); g.add(tur);
    mesh(new THREE.CylinderGeometry(0.62, 0.7, 0.5, 24), oliveD, tur, V(0, 0.15, 0));
    bar(V(0.4, 0.2, 0), V(2.5, 0.28, 0), 0.08, metal, tur);
    mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.18, 12), oliveD, tur, V(-0.15, 0.48, 0.25));
    return { g, wheels, x0: x, tur };
  }
  // tre carri a profondità diverse, un po' di traverso; velocità in unità al secondo
  const TANKS = [[-3.5, -18, 1.0, -0.1, 0.4], [2.2, -26, 1.0, 0.06, 0.34], [-6.5, -34, 1.0, -0.05, 0.3], [4.5, -44, 1.0, 0.1, 0.28]].map(([x, z, s, ry, v]) => ({ ...tank(x, z, s, ry), v, ry }));
  function cannon(x, z, ry, el) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
    [-1, 1].forEach(sd => { const w = mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.18, 24), trackM, g, V(0, 0.55, sd * 0.7)); w.rotation.x = Math.PI / 2; });
    mesh(new THREE.BoxGeometry(0.9, 0.35, 1.2), oliveD, g, V(0, 0.75, 0));
    mesh(new THREE.BoxGeometry(0.08, 0.9, 1.5), olive, g, V(0.45, 1.25, 0));                        // scudo
    bar(V(-0.2, 0.95, -0.3), V(-2.4, 0.08, -0.9), 0.08, oliveD, g); bar(V(-0.2, 0.95, 0.3), V(-2.4, 0.08, 0.9), 0.08, oliveD, g);   // code
    const b = new THREE.Group(); b.position.set(0, 1.0, 0); b.rotation.z = el; g.add(b);
    bar(V(-0.6, 0, 0), V(3.0, 0, 0), 0.11, metal, b); mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 16), metal, b, V(-0.4, 0, 0)).rotation.z = Math.PI / 2;
    return g;
  }
  cannon(4.0, -20, -2.6, 0.35); cannon(-7.0, -27, -0.4, 0.42); cannon(7.5, -36, -2.9, 0.3);

  // ---------------- la bomba: involucro (diventa trasparente), dentro guscio, scatola dei comandi, cavi e palla di uranio
  const B = new THREE.Group(); B.position.set(0, 1.15, 0); B.rotation.y = -0.6; scene.add(B);
  const caseM = std(0x5c6650, { roughness: 0.55, metalness: 0.15, transparent: true, opacity: 1 });
  const bandM = std(0xe8c33a, { roughness: 0.6, transparent: true, opacity: 1 });
  const body = mesh(new THREE.CapsuleGeometry(1.0, 2.2, 16, 48), caseM, B); body.rotation.z = Math.PI / 2; body.renderOrder = 5;
  const band = mesh(new THREE.CylinderGeometry(1.015, 1.015, 0.22, 48, 1, true), bandM, B, V(0.55, 0, 0)); band.rotation.z = Math.PI / 2; band.renderOrder = 6;
  // coda: quattro alette e un telaio quadrato
  const tail = new THREE.Group(); tail.position.set(-2.05, 0, 0); B.add(tail);
  mesh(new THREE.CylinderGeometry(0.55, 0.85, 0.9, 32), caseM, tail, V(0, 0, 0)).rotation.z = Math.PI / 2;
  for (let i = 0; i < 4; i++) { const f = mesh(new THREE.BoxGeometry(1.0, 0.06, 1.8), caseM, tail, V(-0.35, 0, 0)); f.rotation.x = i * Math.PI / 2 + Math.PI / 4; }
  [[0, 0.9], [0, -0.9]].forEach(([, y]) => mesh(new THREE.BoxGeometry(0.4, 0.06, 1.8), caseM, tail, V(-0.75, y * 0.7, 0)));
  [[0.9], [-0.9]].forEach(([z]) => mesh(new THREE.BoxGeometry(0.4, 1.3, 0.06), caseM, tail, V(-0.75, 0, z * 0.7)));
  tail.children.forEach(c => { c.renderOrder = 5; });
  // supporto a culla sul pavimento
  const cradleM = std(0x4a4036, { roughness: 0.9, transparent: true });
  [-0.8, 0.8].forEach(x => { mesh(new THREE.BoxGeometry(0.3, 0.55, 1.7), cradleM, B, V(x, -0.88, 0)); });
  // interno (si vede quando l'involucro è trasparente)
  const inner = new THREE.Group(); B.add(inner);
  const shellM = std(0x9aa3ad, { roughness: 0.4, metalness: 0.5, transparent: true, opacity: 0.32, depthWrite: false });
  const shell = mesh(new THREE.SphereGeometry(0.78, 48, 32), shellM, inner); shell.renderOrder = 4;
  const ringM = std(0x7d858e, { roughness: 0.45, metalness: 0.5 });
  [-0.95, 0.95].forEach(x => { const r = mesh(new THREE.TorusGeometry(0.88, 0.04, 10, 48), ringM, inner, V(x * 0.95, 0, 0)); r.rotation.y = Math.PI / 2; });
  const boxM = std(0x2e3440, { roughness: 0.6 });
  mesh(new THREE.BoxGeometry(0.7, 0.6, 0.6), boxM, inner, V(-1.55, 0, 0));
  const leds = [0x6cff8a, 0xff6a5a, 0xffd23a].map((c, i) => mesh(new THREE.SphereGeometry(0.04, 10, 8), basic(c), inner, V(-1.3, 0.12 - i * 0.12, 0.31)));
  const cableM = std(0xb04a3a, { roughness: 0.6 }), cable2 = std(0x3a6ab0, { roughness: 0.6 });
  [[0.18, 0.18, cableM], [-0.18, 0.15, cable2], [0.1, -0.2, cableM], [-0.12, -0.18, cable2]].forEach(([y, z, m]) => {
    const c = new THREE.CatmullRomCurve3([V(-1.2, y, z), V(-1.0, y * 1.6, z * 1.8), V(-0.7, y * 1.3, z * 1.4)]); mesh(new THREE.TubeGeometry(c, 20, 0.025, 8), m, inner); });
  // la palla di uranio: grigio metallico caldo, con un alone giallo come gli U-235 degli atomi
  const coreM = std(0x8b8378, { roughness: 0.35, metalness: 0.6, emissive: 0xffa040, emissiveIntensity: 0.0 });
  const core = mesh(new THREE.SphereGeometry(0.36, 48, 32), coreM, inner); core.renderOrder = 3;
  const coreGlow = glow(0xffd23a, inner, 1.6); coreGlow.material.fog = false;
  inner.visible = false;

  // ---------------- camera e tempi
  const CAM = track(rt([[0, [-0.8, 5.0, 20.5, 0.05, 2.4, 0]], [4.4, [-0.5, 4.5, 18.0, 0.05, 2.2, 0]],
    [6.0, [0.4, 1.9, 6.6, 0.1, 1.15, 0]], [7.0, [0.25, 1.45, 3.6, 0.0, 1.15, 0]], [8.0, [0.08, 1.2, 1.7, 0.0, 1.15, 0]], [8.6, [0.0, 1.15, 0.55, 0.0, 1.15, 0]]]));
  const OPEN = [5.4, 6.4];
  function aggiorna(t, tn) {
    const c = CAM(tn);
    camera.position.set(c[0] + Math.sin(tn * 0.21) * 0.06, c[1] + Math.sin(tn * 0.17) * 0.03, c[2]); camera.lookAt(c[3], c[4], c[5]);
    TANKS.forEach(k => { const dx = k.v * tn; k.g.position.x = k.x0 + dx * Math.cos(k.ry); k.g.position.z = k.g.position.z; k.wheels.forEach(w => { w.rotation.y = -dx / 0.28; }); k.tur.rotation.y = 0.08 * Math.sin(tn * 0.4 + k.x0); });
    scene.children.forEach(o => { if (o.userData.x !== undefined) o.position.x = o.userData.x + tn * 0.15; });
    const tr = smooth(ramp(t, OPEN[0], OPEN[1]));
    caseM.opacity = 1 - 0.85 * tr; bandM.opacity = 1 - 0.85 * tr; cradleM.opacity = 1 - 0.8 * tr; cradleM.depthWrite = tr < 0.01; caseM.depthWrite = bandM.depthWrite = tr < 0.01;
    inner.visible = tr > 0.001;
    coreM.emissiveIntensity = 0.15 + 0.35 * smooth(ramp(t, 6.4, 8.0)) + 0.05 * Math.sin(tn * 5);
    coreGlow.material.opacity = tr * (0.45 + 0.35 * smooth(ramp(t, 6.4, 8.2)) + 0.08 * Math.sin(tn * 4));
    leds.forEach((l, i) => { l.visible = Math.sin(tn * 3 + i * 2) > -0.3; });
  }
  return { scene, camera, aggiorna };
}
