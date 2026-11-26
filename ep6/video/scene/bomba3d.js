// Puntata 6 — APERTURA (v3): una bomba atomica stilizzata, "giocattolo", appoggiata su un pavimento di terra marrone;
// sullo sfondo, lontani, 2 carri armati, una jeep e una camionetta militari che avanzano lentamente. Cielo velato: né azzurro né cupo.
// B1 (0–4,4): campo largo, la camera si avvicina appena. Da 4,4 a 8,6 UN SOLO ZOOM continuo (distanza in scala logaritmica,
// così la velocità sembra uguale da lontano e da vicino): l'involucro diventa trasparente (5,4–6,4) e mostra dentro guscio,
// cavi, scatola dei comandi e la palla di uranio; la camera entra nella palla e a 8,55, con il lampo chiaro, si passa agli atomi.
// Solo forme semplici e generiche: nessun dettaglio tecnico reale dell'arma.
import { THREE, W, H, V, std, basic, mesh, bar, glow, gradientBg, lights, addFade, setSeed, rnd, track, smooth, ramp, clamp01, lerp, easeOut } from '/comune/base.js';
import { rt, fwarp, CUT, FUNGO_END } from '../tempi.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

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

  // ---------------- veicoli militari sullo sfondo (avanzano lentamente verso destra): 2 carri armati, una jeep, una camionetta.
  // Forme arrotondate e un po' di dettagli (cingoli con le ruote, parafanghi, torretta sfaccettata, botola, antenna, telone),
  // così non sembrano fatti di blocchi. Nessuna insegna.
  const olive = std(0x66704a, { roughness: 0.75 }), oliveD = std(0x4d5537, { roughness: 0.8 }), oliveL = std(0x7c8458, { roughness: 0.8 });
  const khaki = std(0x8d8a5e, { roughness: 0.95 }), trackM = std(0x2b2c29, { roughness: 0.9 }), metal = std(0x50534f, { roughness: 0.45, metalness: 0.4 });
  const tyreM = std(0x222322, { roughness: 0.95 }), glassM = std(0x8fb4c8, { roughness: 0.15, metalness: 0.2, transparent: true, opacity: 0.55 });
  const rbox = (w, h, d, r, m, parent, pos) => mesh(new RoundedBoxGeometry(w, h, d, 3, r), m, parent, pos);
  const extr = (pts, depth, m, parent, z, bev = 0.04) => {
    const sh = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
    const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 2, curveSegments: 16 });
    g.translate(0, 0, -depth / 2); return mesh(g, m, parent, V(0, 0, z));
  };
  const stadium = (L, h) => { const r = h / 2, pts = [];
    for (let i = 0; i <= 12; i++) { const a = -Math.PI / 2 + Math.PI * i / 12; pts.push([L / 2 - r + r * Math.cos(a), r + r * Math.sin(a)]); }
    for (let i = 0; i <= 12; i++) { const a = Math.PI / 2 + Math.PI * i / 12; pts.push([-L / 2 + r + r * Math.cos(a), r + r * Math.sin(a)]); }
    return pts; };
  const wheel = (r, w, m, parent, pos, hub = metal) => { const g = new THREE.Group(); g.position.copy(pos); parent.add(g);
    mesh(new THREE.CylinderGeometry(r, r, w, 24), m, g).rotation.x = Math.PI / 2;
    const hb = mesh(new THREE.CylinderGeometry(r * 0.5, r * 0.5, w + 0.02, 12), hub, g); hb.rotation.x = Math.PI / 2;
    mesh(new THREE.BoxGeometry(r * 1.2, r * 0.18, w + 0.03), hub, g); return g; };
  // ombra morbida a terra (senza ombre la bomba e i mezzi sembrano galleggiare)
  const shTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g2 = c.getContext('2d'), r = g2.createRadialGradient(64, 64, 4, 64, 64, 64);
    r.addColorStop(0, 'rgba(0,0,0,0.75)'); r.addColorStop(0.55, 'rgba(0,0,0,0.45)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g2.fillStyle = r; g2.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  const ombra = (parent, x, z, sx, sz, op = 0.6) => { const m = mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false, opacity: op }), parent, V(x, 0.015, z));
    m.rotation.x = -Math.PI / 2; m.scale.set(sx, sz, 1); m.renderOrder = 1; return m; };
  const VEH = [];

  // ---------------- v11 (nota dell'autore: il cielo della scena iniziale era vuoto): un jet militare stilizzato (grigio, senza
  // insegne) attraversa il cielo da sinistra a destra nei primi secondi, lasciando una scia bianca che si allarga e svanisce.
  const JET = new THREE.Group(); scene.add(JET);
  { const jm = std(0x8a929b, { roughness: 0.55, metalness: 0.2 }), jd = std(0x5d646c, { roughness: 0.6 }), cab = std(0x2f3d4d, { roughness: 0.2, metalness: 0.3 });
    const fus = mesh(new THREE.CapsuleGeometry(0.16, 1.5, 6, 16), jm, JET); fus.rotation.z = Math.PI / 2;
    const nose = mesh(new THREE.ConeGeometry(0.16, 0.5, 16), jm, JET, V(1.0, 0, 0)); nose.rotation.z = -Math.PI / 2;
    const c = mesh(new THREE.SphereGeometry(0.14, 16, 10), cab, JET, V(0.45, 0.11, 0)); c.scale.set(1.9, 0.75, 0.8);
    const wing = (pts, th, z, y = 0) => { const sh = new THREE.Shape(pts.map(([x, q]) => new THREE.Vector2(x, q)));
      const g = new THREE.ExtrudeGeometry(sh, { depth: th, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 1 }); g.translate(0, 0, -th / 2);
      return mesh(g, jd, JET, V(0, y, z)); };
    const wL = wing([[0.35, 0], [-0.45, 0], [-0.6, 1.0], [-0.35, 1.0]], 0.04, 0); wL.rotation.x = Math.PI / 2;     // ala sinistra e destra (piano orizzontale)
    const wR = wing([[0.35, 0], [-0.45, 0], [-0.6, -1.0], [-0.35, -1.0]], 0.04, 0); wR.rotation.x = Math.PI / 2;
    const tL = wing([[-0.55, 0], [-0.85, 0], [-0.95, 0.4], [-0.8, 0.4]], 0.03, 0); tL.rotation.x = Math.PI / 2;
    const tR = wing([[-0.55, 0], [-0.85, 0], [-0.95, -0.4], [-0.8, -0.4]], 0.03, 0); tR.rotation.x = Math.PI / 2;
    wing([[-0.45, 0.1], [-0.85, 0.1], [-0.95, 0.55], [-0.75, 0.55]], 0.03, 0);                                        // deriva
  }
  JET.scale.setScalar(1.25); JET.rotation.x = 0.35;   // un po' inclinato verso la camera, si vedono le ali
  // v12 (nota dell'autore: la scia a palline era brutta): nastro continuo rivolto alla camera, sfumato ai bordi (texture),
  // che nasce poco dietro il motore, si allarga con l'età, ondeggia appena e svanisce piano (alfa per vertice).
  const NS = 120, DT = 0.035;   // 120 tratti da 35 ms: circa 4,2 s di scia
  const sTex = (() => { const c = document.createElement('canvas'); c.width = 4; c.height = 64; const g2 = c.getContext('2d'), r = g2.createLinearGradient(0, 0, 0, 64);
    r.addColorStop(0, 'rgba(255,255,255,0)'); r.addColorStop(0.3, 'rgba(255,255,255,0.75)'); r.addColorStop(0.5, 'rgba(255,255,255,1)'); r.addColorStop(0.7, 'rgba(255,255,255,0.75)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g2.fillStyle = r; g2.fillRect(0, 0, 4, 64); return new THREE.CanvasTexture(c); })();
  const sGeo = new THREE.BufferGeometry(), sPos = new Float32Array((NS + 1) * 2 * 3), sCol = new Float32Array((NS + 1) * 2 * 4), sUv = new Float32Array((NS + 1) * 2 * 2), sIdx = [];
  for (let i = 0; i <= NS; i++) { sUv.set([i / NS, 0, i / NS, 1], i * 4); if (i < NS) { const a = i * 2; sIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3)); sGeo.setAttribute('color', new THREE.BufferAttribute(sCol, 4)); sGeo.setAttribute('uv', new THREE.BufferAttribute(sUv, 2)); sGeo.setIndex(sIdx);
  const scia = new THREE.Mesh(sGeo, new THREE.MeshBasicMaterial({ map: sTex, vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  scia.frustumCulled = false; scene.add(scia);
  const J0 = 0.2, J1 = 3.6,   // v14: ancora più veloce (v12: 5,6; v13: 4,4)
        jetAt = tn => { const u = (tn - J0) / (J1 - J0); return V(-12 + 25 * u, 7.2 + 0.4 * u, -26); };   // v12: più in alto (circa 14% dell'altezza)
  function jet(tn, on) {
    JET.visible = on && tn > J0 - 0.1 && tn < J1 + 0.1; if (JET.visible) JET.position.copy(jetAt(tn));
    scia.visible = on && tn > J0;
    if (!scia.visible) return;
    for (let i = 0; i <= NS; i++) {
      const age = i * DT, ts = tn - age, p = jetAt(ts), w = 0.035 + 0.07 * age + 0.012 * age * age;
      const y = p.y + 0.03 * Math.sin(ts * 3.1) * Math.min(1, age) - 0.06 * age;   // scende appena e ondeggia mentre si allarga
      sPos.set([p.x - 1.15, y - w, p.z, p.x - 1.15, y + w, p.z], i * 6);
      let a = 0.85 * smooth(clamp01((age - 0.04) / 0.18)) * Math.max(0, 1 - age / (NS * DT)) ** 1.3;   // nasce poco dietro il motore, svanisce piano
      if (ts < J0 || ts > J1) a = 0;   // la scia esiste solo dove il jet è passato; dopo J1 la vecchia svanisce da sola
      sCol.set([1, 1, 1, a, 1, 1, 1, a], i * 8);
    }
    sGeo.attributes.position.needsUpdate = true; sGeo.attributes.color.needsUpdate = true;
  }
  function veicolo(x, z, ry, v) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g); ombra(g, 0, 0, 5.2, 3.0, 0.5); const o = { g, wheels: [], x0: x, ry, v }; VEH.push(o); return o; }

  function carro(x, z, ry, v) {
    const o = veicolo(x, z, ry, v), g = o.g;
    [-1, 1].forEach(sd => {
      extr(stadium(3.9, 0.78), 0.46, trackM, g, sd * 0.98, 0.03).position.y = 0.06;                     // cingolo
      for (let i = 0; i < 6; i++) o.wheels.push(wheel(0.25, 0.12, oliveD, g, V(-1.45 + i * 0.58, 0.42, sd * 1.24)));
      [-1, 1].forEach(e => o.wheels.push(wheel(0.3, 0.12, metal, g, V(e * 1.62, 0.5, sd * 1.24), oliveD)));
      for (let i = 0; i < 3; i++) mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 10), metal, g, V(-0.9 + i * 0.9, 0.76, sd * 1.24)).rotation.x = Math.PI / 2;
      rbox(4.0, 0.06, 0.58, 0.02, olive, g, V(0.05, 0.9, sd * 0.98));                                       // parafango
      rbox(0.5, 0.22, 0.4, 0.05, oliveD, g, V(-1.1, 1.02, sd * 0.98));                                       // cassetta
    });
    extr([[-1.85, 0.55], [1.55, 0.55], [2.0, 0.82], [1.35, 1.12], [-1.75, 1.12], [-1.9, 0.9]], 1.5, olive, g, 0);   // scafo inclinato
    [-0.45, 0.45].forEach(zz => mesh(new THREE.SphereGeometry(0.06, 10, 8), basic(0xfff2c0), g, V(1.85, 0.9, zz)));   // fari
    const tur = new THREE.Group(); tur.position.set(-0.25, 1.15, 0); g.add(tur); o.tur = tur;
    const tb = mesh(new THREE.CylinderGeometry(0.72, 0.95, 0.5, 7), oliveL, tur, V(0, 0.25, 0)); tb.scale.set(1.35, 1, 1);
    rbox(0.6, 0.3, 0.8, 0.06, oliveD, tur, V(-1.2, 0.25, 0));                                              // cesta posteriore
    rbox(0.35, 0.36, 0.55, 0.06, olive, tur, V(1.05, 0.24, 0));                                            // mantelletto
    bar(V(1.2, 0.24, 0), V(3.6, 0.3, 0), 0.075, metal, tur);                                                // cannone
    mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.28, 14), metal, tur, V(3.5, 0.3, 0)).rotation.z = Math.PI / 2;
    mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.2, 16), oliveD, tur, V(-0.25, 0.58, 0.3));                 // cupola del capocarro
    mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.04, 16), olive, tur, V(-0.35, 0.72, 0.3)).rotation.z = 0.5;   // botola aperta
    bar(V(-0.2, 0.68, 0.3), V(0.35, 0.72, 0.3), 0.025, metal, tur);                                         // mitragliatrice
    bar(V(-0.8, 0.5, -0.45), V(-0.95, 1.9, -0.5), 0.012, metal, tur);                                       // antenna
    return o;
  }
  function jeep(x, z, ry, v) {
    const o = veicolo(x, z, ry, v), g = o.g;
    rbox(2.5, 0.5, 1.35, 0.08, olive, g, V(0, 0.72, 0));
    rbox(0.9, 0.28, 1.25, 0.08, olive, g, V(0.85, 1.05, 0));                                                // cofano
    rbox(0.08, 0.3, 1.0, 0.03, trackM, g, V(1.3, 0.75, 0));                                                 // griglia
    [-0.42, 0.42].forEach(zz => mesh(new THREE.SphereGeometry(0.07, 10, 8), basic(0xfff2c0), g, V(1.33, 0.9, zz)));
    [[0.85, 1], [-0.85, 1], [0.85, -1], [-0.85, -1]].forEach(([xx, sd]) => {
      o.wheels.push(wheel(0.34, 0.26, tyreM, g, V(xx, 0.34, sd * 0.6), oliveD));
      rbox(0.82, 0.06, 0.36, 0.025, olive, g, V(xx, 0.74, sd * 0.6));                                     // parafango piatto sopra la ruota
    });
    // parabrezza con telaio
    [-0.6, 0.6].forEach(zz => bar(V(0.35, 1.0, zz), V(0.25, 1.55, zz), 0.03, oliveD, g)); bar(V(0.25, 1.55, -0.6), V(0.25, 1.55, 0.6), 0.03, oliveD, g);
    const gl = mesh(new THREE.PlaneGeometry(1.15, 0.5), glassM, g, V(0.3, 1.28, 0)); gl.rotation.set(0, Math.PI / 2, 0.18);
    [0.15, -0.6].forEach(xx => [-0.33, 0.33].forEach(zz => rbox(0.38, 0.32, 0.4, 0.06, oliveD, g, V(xx - 0.1, 1.08, zz))));   // sedili
    const sw = mesh(new THREE.TorusGeometry(0.13, 0.02, 8, 20), trackM, g, V(0.05, 1.25, 0.33)); sw.rotation.y = Math.PI / 2 + 0.4;
    const sp = wheel(0.3, 0.2, tyreM, g, V(-1.33, 0.95, 0), oliveD); sp.rotation.y = Math.PI / 2;            // ruota di scorta
    bar(V(-0.9, 0.98, -0.55), V(-1.0, 2.1, -0.6), 0.012, metal, g);                                         // antenna
    return o;
  }
  function camionetta(x, z, ry, v) {
    const o = veicolo(x, z, ry, v), g = o.g;
    rbox(4.2, 0.25, 1.4, 0.04, trackM, g, V(0, 0.62, 0));                                                   // telaio
    rbox(1.3, 1.05, 1.7, 0.12, olive, g, V(1.05, 1.25, 0));                                                // cabina
    rbox(0.75, 0.55, 1.6, 0.1, olive, g, V(1.95, 0.98, 0));                                                // muso
    rbox(0.06, 0.38, 1.3, 0.02, trackM, g, V(2.33, 0.98, 0));
    const ws = mesh(new THREE.PlaneGeometry(1.4, 0.42), glassM, g, V(1.72, 1.52, 0)); ws.rotation.set(0, Math.PI / 2, 0.12);
    [-1, 1].forEach(sd => { const w = mesh(new THREE.PlaneGeometry(0.6, 0.38), glassM, g, V(1.05, 1.5, sd * 0.86)); if (sd < 0) w.rotation.y = Math.PI; });
    [-0.6, 0.6].forEach(zz => mesh(new THREE.SphereGeometry(0.08, 10, 8), basic(0xfff2c0), g, V(2.35, 1.1, zz)));
    rbox(2.7, 0.4, 1.85, 0.05, oliveD, g, V(-0.95, 0.95, 0));                                              // cassone
    const tel = mesh(new THREE.CylinderGeometry(0.92, 0.92, 2.7, 28, 1, false, 0, Math.PI), khaki, g, V(-0.95, 1.15, 0)); tel.rotation.set(0, 0, Math.PI / 2); tel.rotation.order = 'ZXY'; tel.rotation.x = -Math.PI / 2;   // telone
    for (let i = 0; i < 4; i++) { const r = mesh(new THREE.TorusGeometry(0.93, 0.025, 6, 24, Math.PI), oliveD, g, V(-2.15 + i * 0.8, 1.15, 0)); r.rotation.y = Math.PI / 2; }
    [[1.55, 0], [-0.55, 0], [-1.45, 0]].forEach(([xx]) => [-1, 1].forEach(sd => {
      o.wheels.push(wheel(0.4, 0.3, tyreM, g, V(xx, 0.4, sd * 0.78), oliveD)); }));
    return o;
  }
  // in fondo, oltre la bomba; velocità in unità al secondo
  // v4: ancora più lontani (nota dell'autore)
  carro(-7.5, -50, -0.08, 0.32); carro(5.5, -68, 0.06, 0.28);
  jeep(2.5, -42, 0.05, 0.6); camionetta(-12, -60, -0.04, 0.42);

  // ---------------- la bomba: involucro (diventa trasparente), dentro guscio, scatola dei comandi, cavi e palla di uranio
  const B = new THREE.Group(); B.position.set(0, 1.15, 0); B.rotation.y = -0.6; scene.add(B);
  const ombraB = ombra(scene, -0.3, 0.1, 6.4, 2.9, 0.7); ombraB.rotation.z = 0.6;
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
  // (v7, nota dell'autore a 7,2 della v6: riflesso ridotto, superficie meno lucida)
  const coreM = std(0x8b8378, { roughness: 0.48, metalness: 0.55, emissive: 0xffa040, emissiveIntensity: 0.0 });
  const core = mesh(new THREE.SphereGeometry(0.36, 48, 32), coreM, inner); core.renderOrder = 3;
  const coreGlow = glow(0xffd23a, inner, 1.6); coreGlow.material.fog = false;
  inner.visible = false;

  // ---------------- camera e tempi
  // B1: leggero avvicinamento; poi lo zoom unico verso il centro della palla (CORE)
  const CAM1 = track(rt([[0, [-1.4, 5.0, 20.5, -0.6, 2.4, 0]], [4.4, [-1.1, 4.5, 18.0, -0.55, 2.2, 0]]]));   // v4: bomba un po' più a destra
  const CORE = V(0, 1.15, 0), Z0 = 4.4, Z1 = 8.6, DEND = 0.42;   // finisce appena fuori dalla superficie della palla (raggio 0,36): la palla riempie lo schermo
  const Z0v = fwarp(Z0), Z1v = fwarp(Z1);   // v10: lo zoom segue la voce (prima usava il tempo del video come se fosse quello della scaletta)
  function camAt(tn) {
    const c = CAM1(tn);
    if (tn <= Z0v) return c;
    const u = Math.pow(ramp(tn, Z0v, Z1v), 1.5);   // parte piano e accelera fino a tuffarsi nella palla (niente frenata finale)
    const p0 = V(c[0], c[1], c[2]), d0 = p0.distanceTo(CORE), dir0 = p0.clone().sub(CORE).normalize(), dir1 = V(0.12, 0.08, 1).normalize();
    const d = d0 * Math.pow(DEND / d0, u), dir = dir0.clone().lerp(dir1, smooth(clamp01(u * 1.4))).normalize();
    const p = CORE.clone().addScaledVector(dir, d), k = smooth(clamp01(u * 2));
    return [p.x, p.y, p.z, lerp(c[3], CORE.x, k), lerp(c[4], CORE.y, k), lerp(c[5], CORE.z, k)];
  }
  // ---------------- v10 (richiesta dell'autore): dopo il lampo bianco, inquadratura breve del fungo nel deserto, in stile giocattolo.
  // La bomba e i mezzi non si vedono più (niente distruzione visibile); camera lontana, il fungo sale e si allarga mentre il bianco si dirada.
  const F = new THREE.Group(); F.visible = false; scene.add(F);
  const hotM = (c) => std(c, { roughness: 1, emissive: 0xff7a2a, emissiveIntensity: 0.8 });
  const stemM = hotM(0xdcc4a0), capM = hotM(0xe6c79c), dustM = std(0xc9ab82, { roughness: 1 });
  const stem = mesh(new THREE.CylinderGeometry(1.5, 2.8, 1, 28, 1, true), stemM, F); stem.material.side = THREE.DoubleSide;
  const cap = new THREE.Group(); F.add(cap);
  const capParts = [[0, 0, 0, 5.2, 0.62], [0, 2.2, 0, 3.6, 0.8]];
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; capParts.push([Math.cos(a) * 4.6, -0.6 + (i % 2) * 0.5, Math.sin(a) * 4.6, 2.5 + (i % 3) * 0.3, 0.85]); }
  const capM2 = capParts.map(([x, y, z, r, sy]) => { const m = mesh(new THREE.SphereGeometry(r, 24, 16), capM, cap, V(x, y, z)); m.scale.y = sy; m.userData.s = [1, sy, 1]; return m; });
  const collar = mesh(new THREE.TorusGeometry(3.4, 1.1, 14, 32), capM, F); collar.rotation.x = Math.PI / 2;
  const dust = []; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2 + rnd() * 0.3; const m = mesh(new THREE.SphereGeometry(2.2 + rnd(), 18, 12), dustM, F); m.userData.a = a; m.scale.y = 0.4; dust.push(m); }
  const fGlow = glow(0xffb060, F, 22); fGlow.material.fog = false;
  const CAMF = [0, 6, 78, 0, 13.5, 0];
  function fungo(tn) {
    const u = clamp01((tn - fwarp(CUT)) / (fwarp(FUNGO_END) - fwarp(CUT))), g = easeOut(0.18 + 0.82 * u, 2.0), H = 25 * g;
    stem.scale.set(0.55 + 0.45 * g, H, 0.55 + 0.45 * g); stem.position.y = H / 2;
    cap.position.y = H + 1.5 * g; cap.scale.setScalar(0.35 + 0.65 * g); cap.rotation.y = tn * 0.25;
    capM2.forEach((m, i) => { const w = 1 + 0.05 * Math.sin(tn * 2.2 + i * 1.7); m.scale.set(w, m.userData.s[1] * w, w); });
    collar.position.y = H * 0.62; collar.scale.setScalar(0.3 + 0.7 * smooth(ramp(u, 0.25, 1)));
    dust.forEach(m => { const r = 3 + 11 * easeOut(0.1 + 0.9 * u); m.position.set(Math.cos(m.userData.a) * r, 0.4, Math.sin(m.userData.a) * r * 0.7); m.scale.set(0.6 + 0.6 * u, 0.3 + 0.25 * u, 0.6 + 0.6 * u); });
    const heat = 1 - smooth(u);   // all'inizio caldo e arancione, poi color sabbia
    stemM.emissiveIntensity = capM.emissiveIntensity = 0.12 + 0.7 * heat;
    fGlow.position.set(0, H + 1.5 * g, 3); fGlow.material.opacity = 0.15 + 0.5 * heat;
    camera.position.set(CAMF[0], CAMF[1], CAMF[2] - 4 * u); camera.lookAt(CAMF[3], CAMF[4] + 1.5 * u, CAMF[5]);
  }
  const OPEN = [5.4, 6.4];
  function aggiorna(t, tn) {
    const dopo = t >= CUT;   // dopo il lampo: il fungo
    jet(tn, !dopo);
    F.visible = dopo; B.visible = !dopo; ombraB.visible = !dopo; VEH.forEach(k => { k.g.visible = !dopo; });
    scene.fog.near = dopo ? 70 : 28; scene.fog.far = dopo ? 320 : 140;
    if (dopo) { fungo(tn); return; }
    const c = camAt(tn), sw = 1 - ramp(tn, Z0v, Z0v + 1);   // l'ondeggiamento si spegne durante lo zoom
    camera.position.set(c[0] + Math.sin(tn * 0.21) * 0.06 * sw, c[1] + Math.sin(tn * 0.17) * 0.03 * sw, c[2]); camera.lookAt(c[3], c[4], c[5]);
    VEH.forEach(k => { const dx = k.v * tn; k.g.position.x = k.x0 + dx * Math.cos(k.ry); k.wheels.forEach(w => { w.rotation.z = -dx / 0.32; }); if (k.tur) k.tur.rotation.y = 0.08 * Math.sin(tn * 0.4 + k.x0); });
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
