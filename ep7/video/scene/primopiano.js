// Puntata 7 — PRIMO PIANO (davanti al mondo, camera fissa del palco): icone e oggetti "giocattolo".
//   B3  (dalla v3 niente icone: si illuminano rocce e banane nella collina, scene/collina.js)
//   B4–B5 l'omino e lo zoom nel puntino sono nella collina dalla v4 (scene/natura.js); qui resta il lampo bianco (23,3)
//   B9  cronometro: un giro ogni tempo di dimezzamento (scene/atomi.js, ONDATE)
//   B10 bilancia
//   B11 tre icone in alto (roccia, banana, stella vera: palla di gas luminosa) e 52 pesi gialli a forma di simbolo della
//       radioattività (un anno di radioattività naturale = 52 settimane; v4, prima erano cubetti)
//   B12 un aereo di linea passa e lascia cadere un peso azzurro (un volo ≈ una settimana)
//   B13 dalla centrale cade un simbolo arancione minuscolo
//   B15 fusto giallo delle scorie con il simbolo della radioattività (v4: icona più grande)
// Coordinate del primo piano: centro (0; 0,2), metà altezza 2,95, metà larghezza 1,66. Fascia libera: y fra −1,3 e 2,5.
import { THREE, V, ramp, smooth, pop, backOut, clamp01, lerp, hash, std, basic, mesh, glow } from '/comune/base.js';
import { ONDATE, OROLOGIO } from './atomi.js';
import { trifoglio } from '../simbolo7.js';
import { ZOOM } from './natura.js';

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
  // stella vera (v4): palla di gas luminosa con la superficie a granuli e la corona; ne escono raggi cosmici
  const solTex = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 256; const x = cv.getContext('2d');
    const gr = x.createRadialGradient(128, 128, 10, 128, 128, 128); gr.addColorStop(0, '#fff3b0'); gr.addColorStop(0.7, '#ffb428'); gr.addColorStop(1, '#f07818'); x.fillStyle = gr; x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 900; i++) { const px = hash(i * 1.3) * 256, py = hash(i * 2.7 + 1) * 256, r = 2 + hash(i * 5.1) * 6; x.fillStyle = hash(i * 7.7) < 0.5 ? 'rgba(255,250,200,0.35)' : 'rgba(200,80,10,0.3)'; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill(); }
    for (let i = 0; i < 5; i++) { x.fillStyle = 'rgba(150,50,10,0.55)'; x.beginPath(); x.arc(hash(i * 11.1) * 256, 70 + hash(i * 13.3) * 120, 4 + hash(i * 3.1) * 5, 0, 7); x.fill(); }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  function stella(c) {
    const g = new THREE.Group(); g.position.set(0.04, 0.06, 0); c.add(g);
    const sfera = mesh(new THREE.SphereGeometry(0.15, 40, 30), new THREE.MeshBasicMaterial({ map: solTex }), g);
    const cor = glow(0xffa030, g, 0.5); cor.material.opacity = 0.7; const cor2 = glow(0xfff0a0, g, 0.4); cor2.material.opacity = 0.5; cor2.position.z = 0.1;
    const rays = [0, 1, 2].map(i => { const r = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.12, 6), rayM, c); r.rotation.z = -0.6; r.userData.i = i; return r; });
    return { anima: t => { sfera.rotation.y = t * 0.4; cor.scale.setScalar(0.5 * (1 + 0.05 * Math.sin(t * 3)));
      rays.forEach(r => { const u = (t * 1.1 + r.userData.i / 3) % 1; r.position.set(-0.06 + r.userData.i * 0.07 - u * 0.16, -0.12 - u * 0.2, 0.05); r.visible = u < 0.85; }); } };
  }
  const fabbrica = [roccia, banana, stella];
  const B11 = [[-0.7, 2.2], [0, 2.2], [0.7, 2.2]].map(([x, y], i) => { const ic = I.icon(x, y, 0.26); const mod = fabbrica[i](ic.c); icone.push(ic); return { ic, mod }; });

  // lampo bianco dell'entrata negli atomi
  const lampo = t => clamp01(1 - Math.abs(t - ZOOM[1]) / 0.35) ** 0.8 * smooth(ramp(t, ZOOM[0] + 0.6, ZOOM[1]));

  // ---------------- cronometro (B9)
  const icW = I.icon(0, 2.1, 0.32), watch = I.makeWatch(icW.c); icone.push(icW);
  // ---------------- bilancia (B10)
  const icB = I.icon(0, 1.2, 0.55), bil = I.makeBalance(icB.c); icone.push(icB);
  // ---------------- cubetti (B11–B13)
  const cubeG = new THREE.Group(); hud.add(cubeG);
  const cubeM = std(0xffd23a, { roughness: 0.45, metalness: 0.15, emissive: 0xffb020, emissiveIntensity: 0.15 }), cubeGeo = trifoglio(0.017, 0.035);   // pesi a forma di simbolo (v4)
  const cubi = Array.from({ length: 52 }, (_, i) => { const m = mesh(cubeGeo, cubeM, cubeG); m.userData.p = V(-1.23 + (i % 13) * 0.205, 1.55 - Math.floor(i / 13) * 0.205, 0); return m; });
  const voloM = std(0x8fd0ff, { roughness: 0.5, emissive: 0x3f9fe0, emissiveIntensity: 0.25 }), cuboVolo = mesh(cubeGeo, voloM, cubeG);
  const granM = std(0xff8a3a, { emissive: 0xff6a10, emissiveIntensity: 0.6 }), granello = mesh(trifoglio(0.0045, 0.01), granM, cubeG);
  const granGlow = glow(0xffb070, cubeG, 0.3);
  const VOLO_P = V(-0.3, 0.8, 0), GRAN_P = V(0.3, 0.75, 0), SALE = [65.3, 65.9];   // dopo le icone la griglia sale di 0,55
  // aereo di linea (v4, più realistico): fusoliera affusolata con finestrini, ali a freccia con due motori, deriva e piani di coda
  const plane = new THREE.Group(); hud.add(plane);
  { const w = std(0xf6f8fb, { roughness: 0.35, metalness: 0.1, side: THREE.DoubleSide }), grey = std(0xb8c2cf, { roughness: 0.4, metalness: 0.3 }), bl = std(0x2f6fd0, { roughness: 0.5 }), win = std(0x23344d, { roughness: 0.3 });
    const prof = [[0, -0.36], [0.022, -0.35], [0.04, -0.325], [0.052, -0.29], [0.058, -0.24], [0.06, -0.15], [0.06, 0.16], [0.056, 0.22], [0.045, 0.28], [0.028, 0.33], [0.012, 0.355], [0, 0.36]].map(([r, y]) => new THREE.Vector2(r, y));
    const fus = new THREE.Group(); fus.rotation.z = Math.PI / 2; plane.add(fus);   // muso (punta corta) verso +x
    mesh(new THREE.LatheGeometry(prof, 32), w, fus);
    for (let i = 0; i < 16; i++) mesh(new THREE.SphereGeometry(0.008, 8, 6), win, plane, V(0.24 - i * 0.03, 0.018, 0.058));
    { const cw = mesh(new THREE.BoxGeometry(0.03, 0.012, 0.075), win, plane, V(0.315, 0.025, 0)); cw.rotation.z = -0.5; }
    const sweptW = (span, root, tip, sweep, th) => { const sh = new THREE.Shape(); sh.moveTo(root / 2, 0); sh.lineTo(root / 2 - sweep, span); sh.lineTo(root / 2 - sweep - tip, span); sh.lineTo(-root / 2, 0); sh.closePath();
      const g = new THREE.ExtrudeGeometry(sh, { depth: th, bevelEnabled: false }); g.translate(0, 0, -th / 2); return g; };
    [-1, 1].forEach(sd => {
      const wg = mesh(sweptW(0.3, 0.13, 0.04, 0.13, 0.012), grey, plane, V(0.02, -0.03, 0)); wg.rotation.x = sd * Math.PI / 2;
      const eng = mesh(new THREE.CylinderGeometry(0.022, 0.018, 0.08, 16), grey, plane, V(0.02, -0.055, sd * 0.11)); eng.rotation.z = Math.PI / 2;
      mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.004, 16), win, plane, V(0.061, -0.055, sd * 0.11)).rotation.z = Math.PI / 2;
      const hs = mesh(sweptW(0.11, 0.06, 0.025, 0.05, 0.008), grey, plane, V(-0.31, 0.01, 0)); hs.rotation.x = sd * Math.PI / 2;
    });
    mesh(sweptW(0.13, 0.09, 0.035, 0.08, 0.008), bl, plane, V(-0.3, 0.04, 0));   // deriva
  }
  plane.rotation.set(0.3, -0.15, 0.03); plane.scale.setScalar(1.15);
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
    const a = ramp(t, ...AEREO); plane.visible = a > 0 && a < 1; plane.position.set(lerp(-2.4, 2.4, a), 1.1 + 0.04 * Math.sin(tn * 3), 0.3);
  }
  // ---------------- fusto delle scorie (B15)
  const icF = I.icon(0, 1.3, 0.62); icone.push(icF);   // v4: più grande
  { const y = std(0xffc928, { roughness: 0.45, metalness: 0.2 }), d = std(0x2a2f3a);
    const g = new THREE.Group(); icF.c.add(g); icF.fusto = g; g.rotation.x = 0.25; g.scale.setScalar(1.35);
    mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.4, 32), y, g);
    [-0.12, 0.12].forEach(h => { const r = mesh(new THREE.TorusGeometry(0.172, 0.014, 8, 40), d, g, V(0, h, 0)); r.rotation.x = Math.PI / 2; });
    mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.012, 32), d, g, V(0, 0.205, 0));
    const tf = mesh(trifoglio(0.018, 0.01), d, g, V(0, 0, 0.168)); }

  function aggiorna(t, tn) {
    B11.forEach(({ ic }, i) => I.showIcon(ic, pop(t, ICONE_B11[0] + i * 0.2, ICONE_B11[1])));
    B11.forEach(({ mod }) => { if (mod.pulse) mod.pulse(tn); if (mod.anima) mod.anima(tn); if (mod.isMesh) mod.rotation.y = 0.35 * Math.sin(tn * 1.1); });
    I.showIcon(icW, pop(t, ...OROLOGIO)); watch.set((t - (ONDATE[0] - 1.8)) / 1.8);
    I.showIcon(icB, pop(t, ...BILANCIA, 0.4, 0.3)); bil.set(0.22 * Math.sin(t * 2.4) * Math.exp(-(t - BILANCIA[0]) * 0.5));
    dose(t, tn);
    I.showIcon(icF, pop(t, ...FUSTO)); icF.fusto.rotation.y = 0.3 * Math.sin(tn * 1.2);
    I.centerIcons(icone);
  }
  return { aggiorna, lampo };
}
