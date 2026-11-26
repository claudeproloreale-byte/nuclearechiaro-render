// Puntata 7 — PRIMO PIANO (davanti al mondo, camera fissa del palco): icone e oggetti "giocattolo".
//   B3  (dalla v3 niente icone: si illuminano rocce e banane nella collina, scene/collina.js)
//   B4  un omino entra da sinistra camminando, su «dentro» si gira verso di noi sorpreso e sul corpo si accendono puntini luminosi
//   B5  zoom dentro un puntino della sagoma, fino al lampo bianco (23,3): si entra negli atomi
//   B9  cronometro: un giro ogni tempo di dimezzamento (scene/atomi.js, ONDATE)
//   B10 bilancia
//   B11 tre icone in alto (roccia, banana, stella; v3: senza l'aria) e 52 cubetti gialli (un anno di radioattività naturale = 52 settimane)
//   B12 un aeroplanino passa e lascia cadere un cubetto azzurro (un volo ≈ una settimana)
//   B13 dalla centrale cade un granellino arancione, molto più piccolo di un cubetto
//   B15 fusto giallo delle scorie con il simbolo della radioattività
// Coordinate del primo piano: centro (0; 0,2), metà altezza 2,95, metà larghezza 1,66. Fascia libera: y fra −1,3 e 2,5.
import { THREE, V, ramp, smooth, pop, backOut, clamp01, lerp, hash, std, basic, mesh, glow } from '/comune/base.js';
import { ONDATE, OROLOGIO } from './atomi.js';
import { trifoglio } from '../simbolo7.js';

export const SAGOMA = [15.6, 23.35], ZOOM = [22.0, 23.3];
export const CAMMINA = [15.6, 17.9], GIRA = [17.9, 18.45], PUNTINI = 18.4;   // «dentro» circa a 18,2
export const BILANCIA = [55.4, 60.3], ICONE_B11 = [60.2, 65.3], CUBI = [61.0, 64.2], FINE_DOSE = [76.4, 77.3];
export const AEREO = [65.8, 68.8], CUBO_VOLO = 67.15, GRANELLO = 74.0, FUSTO = [87.4, 89.7];

export function creaPrimoPiano7(I, hud) {
  const icone = [];
  // ---------------- modellini delle icone della B11
  const rockM = std(0x8f97a6, { roughness: 0.9, flatShading: true });
  const yellow = std(0xffd23a, { roughness: 0.5 }), brown = std(0x7a5236), rayM = std(0x7fc4ff, { emissive: 0x3f8fe0, emissiveIntensity: 0.6 });
  function roccia(c) { const m = mesh(new THREE.DodecahedronGeometry(0.22, 0), rockM, c); m.scale.y = 0.75; m.rotation.set(0.4, 0.6, 0.2); return m; }
  function banana(c) {
    const pts = []; for (let i = 0; i <= 20; i++) { const a = -0.95 + i / 20 * 1.9; pts.push(V(Math.sin(a) * 0.24, -Math.cos(a) * 0.24 + 0.14, 0)); }
    const curve = new THREE.CatmullRomCurve3(pts), r = i => 0.035 + 0.05 * Math.sin(Math.PI * i);
    const g = new THREE.TubeGeometry(curve, 40, 1, 12); const P = g.attributes.position, cp = new THREE.Vector3();
    for (let k = 0; k < P.count; k++) { const seg = Math.floor(k / 13), u = seg / 40; curve.getPointAt(u, cp); const v = V(P.getX(k), P.getY(k), P.getZ(k)).sub(cp).normalize().multiplyScalar(r(u)); P.setXYZ(k, cp.x + v.x, cp.y + v.y, cp.z + v.z); }
    g.computeVertexNormals(); const m = mesh(g, yellow, c); m.rotation.z = 0.15;
    [pts[0], pts[20]].forEach(p => mesh(new THREE.SphereGeometry(0.03, 10, 8), brown, m, p));
    return m;
  }
  function stella(c) {
    const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.075 : 0.17; const x = Math.cos(a) * r, y = Math.sin(a) * r; i ? s.lineTo(x, y) : s.moveTo(x, y); }
    const m = mesh(new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2 }), std(0xffd23a, { emissive: 0xffb020, emissiveIntensity: 0.4 }), c, V(0.06, 0.1, -0.03));
    const rays = [-0.5, -0.2, 0.1].map((dx, i) => { const r = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 8), rayM, c, V(-0.05 + dx * 0.4, -0.15, 0)); r.rotation.z = -0.5; r.userData.i = i; return r; });
    return { m, anima: t => { m.rotation.y = 0.3 * Math.sin(t * 1.3); rays.forEach(r => { const u = (t * 1.2 + r.userData.i / 3) % 1; r.position.y = 0.0 - u * 0.25; r.position.x = -0.12 + r.userData.i * 0.08 - u * 0.12; }); } };
  }
  const fabbrica = [roccia, banana, stella];
  const B11 = [[-0.7, 2.2], [0, 2.2], [0.7, 2.2]].map(([x, y], i) => { const ic = I.icon(x, y, 0.26); const mod = fabbrica[i](ic.c); icone.push(ic); return { ic, mod }; });

  // ---------------- omino (B4) e zoom nel puntino (B5)
  // L'omino cammina di profilo da sinistra (gambe e braccia che oscillano), si ferma al centro e si gira verso di noi:
  // faccia sorpresa (occhi grandi, bocca a «o»), poi i puntini che si accendono e si spengono.
  const skin = std(0xf3c9a4, { roughness: 0.75 }), shirt = std(0x3f8fe0, { roughness: 0.7 }), pants = std(0x2c3e6b, { roughness: 0.8 }), dark = std(0x2a2230, { roughness: 0.5 });
  const sag = new THREE.Group(); hud.add(sag);
  const body = new THREE.Group(); body.scale.z = 0.7; sag.add(body);
  const head = mesh(new THREE.SphereGeometry(0.36, 32, 24), skin, body, V(0, 1.05, 0));
  mesh(new THREE.CapsuleGeometry(0.4, 0.62, 8, 24), shirt, body, V(0, 0.12, 0));
  const limb = (geo, mat, px, py, dy) => { const piv = new THREE.Group(); piv.position.set(px, py, 0); body.add(piv); mesh(geo, mat, piv, V(0, dy, 0)); return piv; };
  const arms = [-1, 1].map(sd => { const a = limb(new THREE.CapsuleGeometry(0.12, 0.62, 6, 16), shirt, sd * 0.55, 0.5, -0.38); a.rotation.z = sd * 0.18; mesh(new THREE.SphereGeometry(0.12, 16, 12), skin, a, V(0, -0.78, 0)); return a; });
  const legs = [-1, 1].map(sd => limb(new THREE.CapsuleGeometry(0.15, 0.5, 6, 16), pants, sd * 0.2, -0.45, -0.37));
  // faccia (sul davanti della testa): occhi, sopracciglia, bocca che passa da sorriso a «o»
  const face = new THREE.Group(); face.position.set(0, 1.05, 0); body.add(face);
  const eyes = [-1, 1].map(sd => { const e = mesh(new THREE.SphereGeometry(0.045, 14, 10), dark, face, V(sd * 0.12, 0.06, 0.33)); return e; });
  const brows = [-1, 1].map(sd => { const b = mesh(new THREE.CapsuleGeometry(0.018, 0.08, 4, 8), dark, face, V(sd * 0.12, 0.16, 0.33)); b.rotation.z = Math.PI / 2 + sd * 0.15; return b; });
  const smileG = new THREE.Group(); face.add(smileG); { const m = mesh(new THREE.TorusGeometry(0.08, 0.016, 8, 20, Math.PI), dark, smileG, V(0, -0.08, 0.33)); m.rotation.z = Math.PI; }
  const ohM = mesh(new THREE.TorusGeometry(0.045, 0.02, 8, 20), dark, face, V(0, -0.11, 0.335));
  [-1, 1].forEach(sd => { const c = glow(0xff8fa8, face, 0.16); c.position.set(sd * 0.21, -0.04, 0.36); c.material.opacity = 0.5; });
  const P0 = V(0, 0.78, 0.1), D = V(0.1, 0.25, 0.3), CC = V(0, 0.2, 0.1);
  const inside = (x, y) => Math.hypot(x, (y - 1.05)) < 0.3 || (Math.abs(x) < 0.36 && y > -0.3 && y < 0.55) || (Math.abs(Math.abs(x) - 0.2) < 0.1 && y < -0.5 && y > -1.15) || (Math.abs(Math.abs(x) - 0.6) < 0.08 && y > -0.2 && y < 0.45);
  const dots = [];
  for (let k = 0; dots.length < 60 && k < 2000; k++) { const x = (hash(k * 1.31) - 0.5) * 1.4, y = -1.15 + hash(k * 2.17 + 5) * 2.5; if (inside(x, y) && Math.hypot(x, y - 1.11) > 0.2) { const s = glow(0xfff2a0, sag, 0.2); s.position.set(x, y, 0.32); dots.push({ s, ph: hash(k + 9), f: 0.6 + hash(k * 3.3) * 1.4 }); } }
  const dz = glow(0xfff2a0, sag, 0.16); dz.position.copy(D);   // il puntino dove si entra
  function sagoma(t, tn) {
    sag.visible = t > SAGOMA[0] && t < SAGOMA[1];
    if (!sag.visible) return;
    const w = smooth(ramp(t, ...CAMMINA)), walking = ramp(t, CAMMINA[0], CAMMINA[1] - 0.15) < 1 ? 1 - smooth(ramp(t, CAMMINA[1] - 0.5, CAMMINA[1])) : 0;
    const ph = tn * 2 * Math.PI * 1.6, sw = 0.5 * walking * Math.sin(ph);
    legs[0].rotation.x = sw; legs[1].rotation.x = -sw; arms[0].rotation.x = -sw * 0.8; arms[1].rotation.x = sw * 0.8;
    body.rotation.y = Math.PI / 2 * (1 - smooth(ramp(t, ...GIRA)));
    const sorpresa = smooth(ramp(t, GIRA[1] - 0.2, GIRA[1] + 0.1));
    smileG.visible = sorpresa < 0.5; ohM.visible = !smileG.visible; ohM.scale.setScalar(0.6 + 0.4 * sorpresa);
    eyes.forEach(e => e.scale.setScalar(1 + 0.45 * sorpresa)); brows.forEach(b => { b.position.y = 0.16 + 0.05 * sorpresa; });
    head.rotation.y = 0;
    const u = smooth(ramp(t, ...ZOOM)), s = Math.pow(45, u * u);
    sag.position.copy(CC).addScaledVector(V(P0.x + D.x - CC.x, P0.y + D.y - CC.y, 0), 1 - u).addScaledVector(V(D.x, D.y, 0), -s);
    if (u === 0) sag.position.set(lerp(-2.7, P0.x, w), P0.y + 0.03 * walking * Math.abs(Math.sin(ph)), P0.z);
    sag.position.z = P0.z; sag.scale.set(s, s, 1);
    const on = smooth(ramp(t, PUNTINI, PUNTINI + 0.4));
    for (const d of dots) { const q = (tn * d.f + d.ph) % 1; d.s.material.opacity = (q < 0.14 ? Math.sin(q / 0.14 * Math.PI) : 0) * 0.95 * (1 - u) * on; }
    dz.material.opacity = Math.max((0.5 + 0.4 * Math.sin(tn * 6)) * on, u); dz.scale.setScalar(0.16 * (1 + 2 * u));
  }
  // lampo bianco dell'entrata negli atomi
  const lampo = t => clamp01(1 - Math.abs(t - ZOOM[1]) / 0.35) ** 0.8 * smooth(ramp(t, ZOOM[0] + 0.6, ZOOM[1]));

  // ---------------- cronometro (B9)
  const icW = I.icon(0, 2.1, 0.32), watch = I.makeWatch(icW.c); icone.push(icW);
  // ---------------- bilancia (B10)
  const icB = I.icon(0, 1.2, 0.55), bil = I.makeBalance(icB.c); icone.push(icB);
  // ---------------- cubetti (B11–B13)
  const cubeG = new THREE.Group(); hud.add(cubeG);
  const cubeM = std(0xffd23a, { roughness: 0.5, emissive: 0xffb020, emissiveIntensity: 0.15 }), cubeGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
  const cubi = Array.from({ length: 52 }, (_, i) => { const m = mesh(cubeGeo, cubeM, cubeG); m.userData.p = V(-1.23 + (i % 13) * 0.205, 1.55 - Math.floor(i / 13) * 0.205, 0); return m; });
  const voloM = std(0x8fd0ff, { roughness: 0.5, emissive: 0x3f9fe0, emissiveIntensity: 0.25 }), cuboVolo = mesh(cubeGeo, voloM, cubeG);
  const granM = std(0xff8a3a, { emissive: 0xff6a10, emissiveIntensity: 0.6 }), granello = mesh(new THREE.BoxGeometry(0.03, 0.03, 0.03), granM, cubeG);
  const granGlow = glow(0xffb070, cubeG, 0.3);
  const VOLO_P = V(-0.3, 0.8, 0), GRAN_P = V(0.3, 0.75, 0), SALE = [65.3, 65.9];   // dopo le icone la griglia sale di 0,55
  // aeroplanino giocattolo
  const plane = new THREE.Group(); hud.add(plane);
  { const w = std(0xf4f7fc, { roughness: 0.4 }), bl = std(0x3f8fe0), rd = std(0xe8604a);
    const f = mesh(new THREE.CapsuleGeometry(0.06, 0.4, 6, 16), w, plane); f.rotation.z = Math.PI / 2;
    mesh(new THREE.BoxGeometry(0.12, 0.018, 0.55), bl, plane, V(0.02, 0, 0));
    mesh(new THREE.BoxGeometry(0.07, 0.016, 0.22), bl, plane, V(-0.22, 0.02, 0));
    mesh(new THREE.BoxGeometry(0.07, 0.11, 0.015), rd, plane, V(-0.23, 0.07, 0));
    for (let i = 0; i < 3; i++) mesh(new THREE.SphereGeometry(0.018, 8, 6), bl, plane, V(0.1 - i * 0.07, 0.02, 0.05)); }
  plane.rotation.set(0.35, 0, 0.04);
  function dose(t, tn) {
    const out = 1 - smooth(ramp(t, ...FINE_DOSE));
    cubeG.visible = t > CUBI[0] && t < FINE_DOSE[1];
    cubi.forEach((m, i) => {
      const t0 = CUBI[0] + i * (CUBI[1] - CUBI[0]) / 52, u = ramp(t, t0, t0 + 0.3);
      m.visible = u > 0; m.position.copy(m.userData.p); m.position.y += 0.35 * (1 - backOut(u)) + 0.55 * smooth(ramp(t, ...SALE)); m.scale.setScalar(Math.max(0.001, smooth(ramp(t, t0, t0 + 0.12)) * out));
    });
    { const u = ramp(t, CUBO_VOLO, CUBO_VOLO + 0.45); cuboVolo.visible = u > 0; cuboVolo.position.set(VOLO_P.x, lerp(1.2, VOLO_P.y, u * u), 0); cuboVolo.rotation.z = (1 - u) * 0.6; cuboVolo.scale.setScalar(Math.max(0.001, out)); }
    { const u = ramp(t, GRANELLO, GRANELLO + 0.45); granello.visible = u > 0; granello.position.set(GRAN_P.x, lerp(1.2, GRAN_P.y, u * u), 0); granello.scale.setScalar(Math.max(0.001, out));
      granGlow.position.copy(granello.position); granGlow.material.opacity = u > 0 ? (0.45 + 0.3 * Math.sin(tn * 6)) * out : 0; }
    const a = ramp(t, ...AEREO); plane.visible = a > 0 && a < 1; plane.position.set(lerp(-2.4, 2.4, a), 1.22 + 0.04 * Math.sin(tn * 3), 0.3);
  }
  // ---------------- fusto delle scorie (B15)
  const icF = I.icon(0, 1.3, 0.45); icone.push(icF);
  { const y = std(0xffc928, { roughness: 0.45, metalness: 0.2 }), d = std(0x2a2f3a);
    const g = new THREE.Group(); icF.c.add(g); icF.fusto = g; g.rotation.x = 0.25;
    mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.4, 32), y, g);
    [-0.12, 0.12].forEach(h => { const r = mesh(new THREE.TorusGeometry(0.172, 0.014, 8, 40), d, g, V(0, h, 0)); r.rotation.x = Math.PI / 2; });
    mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.012, 32), d, g, V(0, 0.205, 0));
    const tf = mesh(trifoglio(0.018, 0.01), d, g, V(0, 0, 0.168)); }

  function aggiorna(t, tn) {
    B11.forEach(({ ic }, i) => I.showIcon(ic, pop(t, ICONE_B11[0] + i * 0.2, ICONE_B11[1])));
    B11.forEach(({ mod }) => { if (mod.pulse) mod.pulse(tn); if (mod.anima) mod.anima(tn); if (mod.isMesh) mod.rotation.y = 0.35 * Math.sin(tn * 1.1); });
    sagoma(t, tn);
    I.showIcon(icW, pop(t, ...OROLOGIO)); watch.set((t - (ONDATE[0] - 1.8)) / 1.8);
    I.showIcon(icB, pop(t, ...BILANCIA, 0.4, 0.3)); bil.set(0.22 * Math.sin(t * 2.4) * Math.exp(-(t - BILANCIA[0]) * 0.5));
    dose(t, tn);
    I.showIcon(icF, pop(t, ...FUSTO)); icF.fusto.rotation.y = 0.3 * Math.sin(tn * 1.2);
    I.centerIcons(icone);
  }
  return { aggiorna, lampo };
}
