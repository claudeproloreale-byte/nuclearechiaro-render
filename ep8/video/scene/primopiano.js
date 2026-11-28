// Puntata 8 — PRIMO PIANO (davanti al mondo, camera fissa del palco): icone in dischi bianchi con bordo blu.
//   B2  pentola con lo stesso vapore del pennacchio (in alto a destra, accanto alla nuvola)
//   B4  torta piatta: 1/3 giallo (elettricità, fulmine) che si disegna in senso orario dalle ore 12, 2/3 arancione (calore)
//   B5  lo spicchio arancione esce dalla torta e diventa un termometro che sale; poi icone della centrale a carbone e a gas
//   B11 omino con berretto e sciarpa che fa una nuvoletta di fiato
//   B13 termometro del fiume che sale (estate)
// Coordinate del primo piano: centro (0; 0,2), metà altezza 2,95, metà larghezza 1,66. Fascia libera: y fra −1,3 e 2,5;
// a destra, sotto y ≈ −0,1, c'è la colonna dei pulsanti.
import { THREE, V, ramp, smooth, pop, clamp01, lerp, hash, std, basic, mesh, win, setSeed, rnd } from '/comune/base.js';
import { TRAME } from './fumo.js';

export const PENTOLA = [5.7, 10.4], TORTA = [18.6, 26.6], TERZO = 19.7, STACCO = 22.9, TERMO = [23.3, 26.6], CARBONE = [27.0, 29.4], GAS = [28.1, 29.4];
export const OMINO = [68.9, 71.4], TERMO_FIUME = [77.3, 83.9];

// sbuffi di vapore dentro un'icona (sprite del primo piano)
function vapore(parent, n, o = {}) {
  const { x = 0, y = 0, sale = 0.45, larg = 0.12, s0 = 0.12, vita = 2.2, col = 0xffffff, op = 0.85, vento = 0.05, seme = 1 } = o;
  setSeed(700 + seme);
  const sb = Array.from({ length: n }, (_, i) => { const m = new THREE.SpriteMaterial({ map: TRAME[i % 4], color: col, transparent: true, opacity: 0, depthWrite: false }); const s = new THREE.Sprite(m); parent.add(s); s.userData = { ph: i / n, a: rnd() - 0.5, w: rnd() * 6 }; return s; });
  return (tn, k = 1) => sb.forEach(s => {
    const d = s.userData, ph = (tn / vita + d.ph) % 1;
    s.position.set(x + d.a * larg * (1 + ph) + Math.sin(tn * 2 + d.w) * 0.02 * ph + vento * ph * ph, y + sale * (1 - (1 - ph) ** 1.6), 0.08);
    s.scale.setScalar(s0 * (1 + ph * 2.2)); s.material.rotation = d.w + tn * 0.3;
    s.material.opacity = op * k * smooth(ph / 0.12) * (1 - smooth((ph - 0.45) / 0.55));
  });
}

export function creaPrimoPiano8(I, hud) {
  const icone = [];
  const edgeM = std(0x2f5fb0, { roughness: 0.5 });
  // ---------------- B2 pentola
  const icP = I.icon(0.78, 1.72, 0.46); icone.push(icP);
  const steel = std(0xb9c6d8, { metalness: 0.5, roughness: 0.35 }), steelD = std(0x8a9ab0, { metalness: 0.5, roughness: 0.4 });
  { const g = new THREE.Group(); g.position.y = -0.16; g.rotation.x = 0.32; icP.c.add(g);
    mesh(new THREE.CylinderGeometry(0.25, 0.22, 0.24, 40, 1, true), std(0xb9c6d8, { metalness: 0.5, roughness: 0.35, side: THREE.DoubleSide }), g, V(0, 0, 0));
    mesh(new THREE.CircleGeometry(0.22, 40), steelD, g, V(0, -0.12, 0)).rotation.x = -Math.PI / 2;
    mesh(new THREE.TorusGeometry(0.25, 0.018, 8, 40), steel, g, V(0, 0.12, 0)).rotation.x = Math.PI / 2;
    const w = mesh(new THREE.CircleGeometry(0.235, 40), new THREE.MeshStandardMaterial({ color: 0x6fb4ee, emissive: 0x2f80e0, emissiveIntensity: 0.4 }), g, V(0, 0.07, 0)); w.rotation.x = -Math.PI / 2;
    [-1, 1].forEach(sd => { const h = mesh(new THREE.TorusGeometry(0.05, 0.016, 8, 16, Math.PI), edgeM, g, V(sd * 0.27, 0.06, 0)); h.rotation.z = -sd * Math.PI / 2; });
    // bollicine
    icP.bolle = Array.from({ length: 6 }, (_, i) => { const b = mesh(new THREE.SphereGeometry(0.018, 8, 6), basic(0xffffff), g, V(0, 0.075, 0)); b.userData = { a: hash(i) * 6.28, r: 0.05 + hash(i + 9) * 0.13 }; return b; });
  }
  const vapP = vapore(icP.c, 12, { y: 0.0, sale: 0.42, larg: 0.18, s0: 0.13, vita: 2.0, seme: 1 });

  // ---------------- B4 torta e B5 termometro
  const icT = I.icon(-0.42, 1.72, 0.5); icone.push(icT);
  const R = 0.36, yellowM = std(0xffd23a, { roughness: 0.6, emissive: 0xffb800, emissiveIntensity: 0.25 }), orangeM = std(0xff8a3a, { roughness: 0.6, emissive: 0xff5a10, emissiveIntensity: 0.2 });
  const yel = new THREE.Group(); icT.c.add(yel); const ora = new THREE.Group(); icT.c.add(ora);
  const PI = Math.PI;
  let yelMesh = mesh(new THREE.CylinderGeometry(R, R, 0.06, 64, 1, false, 0, 0.001), yellowM, yel);
  const oraMesh = mesh(new THREE.CylinderGeometry(R, R, 0.06, 64, 1, false, 0, 0.001), orangeM, ora);
  [yelMesh, oraMesh].forEach(m => { m.rotation.x = PI / 2; });
  // fulmine (sul giallo) e onde di calore (sull'arancione)
  const bolt = new THREE.Shape(); [[0.03, 0.12], [-0.05, -0.01], [0.0, -0.01], [-0.03, -0.12], [0.06, 0.02], [0.01, 0.02], [0.04, 0.12]].forEach(([x, y], i) => i ? bolt.lineTo(x, y) : bolt.moveTo(x, y));
  const boltM = mesh(new THREE.ExtrudeGeometry(bolt, { depth: 0.02, bevelEnabled: false }), basic(0x2f4f9a), yel, V(0.16, 0.12, 0.035));
  const ondeM = basic(0xffffff);
  const onde = new THREE.Group(); ora.add(onde); onde.position.set(-0.13, -0.08, 0.035);
  for (let k = 0; k < 3; k++) { const pts = []; for (let i = 0; i <= 16; i++) { const u = i / 16; pts.push(V(-0.07 + k * 0.07 + Math.sin(u * PI * 2) * 0.016, -0.08 + u * 0.16, 0)); } mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.008, 6), ondeM, onde); }
  function settore(m, a0, len) { m.geometry.dispose(); m.geometry = new THREE.CylinderGeometry(R, R, 0.06, 64, 1, false, a0, Math.max(0.001, len)); }
  // nel cilindro ruotato (rotation.x = π/2) l'angolo θ parte dall'asse z, che diventa −y... calcolo con la funzione qui sotto
  // CylinderGeometry: x = r·sin θ, z = r·cos θ; dopo la rotazione x→x, z→−y: θ = 0 punta in basso, θ = π in alto.
  // Ore 12 = θ = π; il senso orario (visto dallo spettatore) è θ decrescente.
  const icTh = I.icon(0.66, 1.72, 0.4); icone.push(icTh);
  const th = I.makeThermo(icTh.c); th.g.scale.setScalar(1.25);

  // ---------------- B5 icone carbone e gas
  const icC = I.icon(-0.48, 1.72, 0.44), icG = I.icon(0.55, 1.72, 0.44); icone.push(icC, icG);
  const grey = std(0x7d8594, { roughness: 0.85 }), redM = std(0xe8604a), white = std(0xf2f4f8), towerM = std(0xeef1f6, { roughness: 0.9 });
  const miniTorre = (p, x, s) => { const prof = []; for (let i = 0; i <= 12; i++) { const y = i / 12 * 0.42; prof.push(new THREE.Vector2(0.07 * Math.sqrt(1 + ((y - 0.29) / 0.17) ** 2), y)); } const m = mesh(new THREE.LatheGeometry(prof, 24), towerM, p, V(x, -0.2, 0)); m.scale.setScalar(s); return m; };
  { const g = new THREE.Group(); g.position.y = -0.03; icC.c.add(g);
    mesh(new THREE.BoxGeometry(0.26, 0.2, 0.16), grey, g, V(-0.08, -0.1, 0));
    for (let i = 0; i < 4; i++) mesh(new THREE.CylinderGeometry(0.035, 0.037, 0.1, 12), i % 2 ? redM : white, g, V(0.04, -0.15 + i * 0.1, -0.05));
    miniTorre(g, 0.18, 1);
    mesh(new THREE.ConeGeometry(0.08, 0.07, 8), std(0x2a2d33, { flatShading: true }), g, V(-0.18, -0.165, 0.06)); }
  const fumoC = vapore(icC.c, 8, { x: 0.05, y: 0.18, sale: 0.22, larg: 0.05, s0: 0.07, vita: 1.8, col: 0x6d7380, op: 0.9, vento: 0.08, seme: 2 });
  const vapC = vapore(icC.c, 8, { x: 0.15, y: 0.2, sale: 0.2, larg: 0.06, s0: 0.08, vita: 2.0, seme: 3, vento: 0.06 });
  { const g = new THREE.Group(); g.position.y = -0.03; icG.c.add(g);
    mesh(new THREE.BoxGeometry(0.24, 0.16, 0.16), std(0xd8dee8, { roughness: 0.8 }), g, V(-0.1, -0.12, 0));
    mesh(new THREE.BoxGeometry(0.25, 0.03, 0.17), std(0x4a6fa8), g, V(-0.1, -0.03, 0));
    mesh(new THREE.CylinderGeometry(0.025, 0.028, 0.32, 12), std(0xb9c6d8, { metalness: 0.4 }), g, V(-0.02, -0.04, -0.06));
    mesh(new THREE.SphereGeometry(0.08, 20, 14), std(0x9fd0ff, { roughness: 0.4 }), g, V(-0.22, -0.13, 0.08));
    miniTorre(g, 0.17, 0.95); }
  const vapG = vapore(icG.c, 8, { x: 0.14, y: 0.19, sale: 0.2, larg: 0.06, s0: 0.08, vita: 2.0, seme: 4, vento: 0.06 });

  // ---------------- B11 omino con il fiato
  const icO = I.icon(0.72, 1.7, 0.46); icone.push(icO);
  { const g = new THREE.Group(); g.position.set(-0.08, -0.06, 0); icO.c.add(g);
    const skin = std(0xffc9a0, { roughness: 0.7 }), coat = std(0x3f8fe0, { roughness: 0.7 }), scarfM = std(0xe8604a, { roughness: 0.8 }), hatM = std(0xffd23a, { roughness: 0.8 });
    mesh(new THREE.SphereGeometry(0.2, 24, 16), coat, g, V(0, -0.3, 0)).scale.set(1, 0.8, 0.7);
    mesh(new THREE.SphereGeometry(0.135, 24, 18), skin, g, V(0, 0.02, 0));
    const hat = mesh(new THREE.SphereGeometry(0.14, 24, 12, 0, PI * 2, 0, PI / 2), hatM, g, V(0, 0.05, 0)); hat.scale.y = 0.9;
    mesh(new THREE.TorusGeometry(0.13, 0.025, 8, 24), hatM, g, V(0, 0.055, 0)).rotation.x = PI / 2;
    mesh(new THREE.SphereGeometry(0.035, 12, 8), basic(0xffffff), g, V(0, 0.19, 0));
    mesh(new THREE.TorusGeometry(0.1, 0.035, 10, 24), scarfM, g, V(0, -0.11, 0)).rotation.x = PI / 2.3;
    mesh(new THREE.BoxGeometry(0.05, 0.12, 0.03), scarfM, g, V(0.05, -0.18, 0.09)).rotation.z = 0.2;
    const eyeM = basic(0x14203c);
    [-1, 1].forEach(sd => mesh(new THREE.SphereGeometry(0.016, 8, 6), eyeM, g, V(0.045 + sd * 0.035, 0.03, 0.125)));
    mesh(new THREE.SphereGeometry(0.02, 8, 6), basic(0x7a2030), g, V(0.08, -0.03, 0.12));
    [-1, 1].forEach(sd => mesh(new THREE.SphereGeometry(0.025, 8, 6), std(0xff9fb0), g, V(0.045 + sd * 0.07, -0.01, 0.11)).scale.z = 0.3); }
  const fiato = vapore(icO.c, 10, { x: 0.06, y: -0.07, sale: 0.05, larg: 0.03, s0: 0.05, vita: 1.6, vento: 0.32, seme: 5, op: 0.9 });

  // ---------------- B13 termometro del fiume
  const icF = I.icon(-0.72, 1.7, 0.4); icone.push(icF);
  const thF = I.makeThermo(icF.c); thF.g.scale.setScalar(1.25); thF.g.position.x = -0.04;
  { // ondine d'acqua alla base del termometro
    const w = new THREE.Group(); w.position.set(0, -0.27, 0.03); icF.c.add(w);
    for (let k = 0; k < 2; k++) { const pts = []; for (let i = 0; i <= 20; i++) { const u = i / 20; pts.push(V(-0.25 + u * 0.5, k * -0.045 + Math.sin(u * PI * 4) * 0.012, 0)); } mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, 0.011, 6), basic(0x3f9be8), w); } }

  function aggiorna(t, tn) {
    // pentola
    I.showIcon(icP, pop(t, ...PENTOLA, 0.4, 0.35)); vapP(tn, 1);
    icP.bolle.forEach((b, i) => { const u = (tn * 1.3 + i / 6) % 1, d = b.userData; b.position.set(Math.cos(d.a + tn) * d.r, 0.075 + u * 0.02, Math.sin(d.a + tn) * d.r * 0.6); b.scale.setScalar(0.5 + u); });
    // torta: compare, poi il giallo si disegna; alla fine lo spicchio arancione si stacca e se ne va a destra
    I.showIcon(icT, pop(t, ...TORTA, 0.4, 0.35));
    const y = smooth(ramp(t, TERZO, TERZO + 0.8));
    const third = 2 * PI / 3 * y;
    settore(yelMesh, PI - third, third);
    settore(oraMesh, PI - 2 * PI, 2 * PI - third);
    boltM.visible = y > 0.6;
    const st = smooth(ramp(t, STACCO, STACCO + 0.6));
    ora.position.set(0.16 * st + 0.9 * smooth(ramp(t, STACCO + 0.3, STACCO + 0.9)), -0.05 * st, 0.05 * st);
    ora.scale.setScalar(Math.max(0.001, 1 - smooth(ramp(t, STACCO + 0.5, STACCO + 0.95))));
    I.showIcon(icTh, pop(t, ...TERMO, 0.4, 0.35)); th.set(smooth(ramp(t, TERMO[0] + 0.4, TERMO[0] + 1.8)));
    // carbone e gas
    I.showIcon(icC, pop(t, ...CARBONE, 0.4, 0.3)); I.showIcon(icG, pop(t, ...GAS, 0.4, 0.3));
    fumoC(tn); vapC(tn); vapG(tn);
    // omino
    I.showIcon(icO, pop(t, ...OMINO, 0.4, 0.3));
    { const u = (tn % 1.8) / 1.8; fiato(tn, 1); }
    // termometro del fiume
    I.showIcon(icF, pop(t, ...TERMO_FIUME, 0.4, 0.35)); thF.set(lerp(0.4, 0.85, smooth(ramp(t, TERMO_FIUME[0] + 0.5, TERMO_FIUME[0] + 2.6))));
    icone.forEach(ic => { ic.g.position.y += 0; });
    I.centerIcons(icone);
  }
  return { aggiorna, lampo: () => 0 };
}
