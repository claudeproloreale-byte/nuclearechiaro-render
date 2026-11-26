// Libreria comune — ICONE del primo piano: dischi bianchi con bordo blu e dentro un modellino 3D.
// Modellini pronti: termometro (calore: mai fiamme), bilancia (equilibrio), cronometro (neutroni ritardati).
//
// const I = creaIcone(hud);
//   const ic = I.icon(x, y, r)            disco nel primo piano; i modellini vanno in ic.c
//   const th = I.makeThermo(ic.c)         th.set(u): u da 0 (freddo, blu) a 1 (caldo, rosso)
//   I.makeBalance(parent).set(angolo), I.makeWatch(parent).set(giri)
//   I.showIcon(ic, a)                     a = scala (0 nascosta), di solito pop(t, da, a) di base.js
//   I.centerIcons([ic, ...])              a ogni fotogramma: compensa la prospettiva, il modellino resta al centro del disco
import { THREE, V, lerp, std, basic, mesh } from './base.js';

export function creaIcone(hud) {
  const discM = basic(0xffffff, { transparent: true, opacity: 0.95 });
  const ringM = basic(0x2f7df0);
  function icon(x, y, r = 0.42) {
    const g = new THREE.Group(); g.position.set(x, y, 0.2); hud.add(g);
    mesh(new THREE.CircleGeometry(r, 64), discM, g, V(0, 0, -0.3)); mesh(new THREE.RingGeometry(r, r + 0.035, 64), ringM, g, V(0, 0, -0.3));
    const c = new THREE.Group(); c.scale.setScalar(r / 0.42); g.add(c); return { g, c, r };
  }
  const showIcon = (ic, a) => { ic.g.visible = a > 0.001; ic.g.scale.setScalar(Math.max(0.001, a)); };
  const COLD = new THREE.Color(0x3f9be8), HOT = new THREE.Color(0xff5a2a);
  const edgeM = std(0x2f5fb0, { roughness: 0.5 });
  function makeThermo(parent) {
    const g = new THREE.Group(); g.position.x = -0.035; parent.add(g);
    const glass = std(0xf4f7fc, { roughness: 0.3 });
    mesh(new THREE.CapsuleGeometry(0.078, 0.4, 6, 20), edgeM, g, V(0, 0.06, -0.04)); mesh(new THREE.SphereGeometry(0.13, 24, 16), edgeM, g, V(0, -0.22, -0.04));
    mesh(new THREE.CapsuleGeometry(0.055, 0.4, 6, 20), glass, g, V(0, 0.06, 0));
    const liqM = new THREE.MeshStandardMaterial({ color: 0x3f9be8, emissive: 0x3f9be8, emissiveIntensity: 0.45, roughness: 0.4 });
    mesh(new THREE.SphereGeometry(0.1, 24, 16), liqM, g, V(0, -0.22, 0.02));
    const geo = new THREE.CylinderGeometry(0.033, 0.033, 1, 16); geo.translate(0, 0.5, 0);
    const liq = mesh(geo, liqM, g, V(0, -0.2, 0.05));
    const cap = mesh(new THREE.SphereGeometry(0.033, 12, 10), liqM, g, V(0, 0, 0.05));
    for (let i = 0; i < 4; i++) mesh(new THREE.BoxGeometry(i % 2 ? 0.06 : 0.09, 0.016, 0.02), edgeM, g, V(0.15 + (i % 2 ? -0.015 : 0), -0.04 + i * 0.095, 0));
    return { g, set(u) { const h = lerp(0.1, 0.46, u); liq.scale.y = h; cap.position.y = -0.2 + h; liqM.color.copy(COLD).lerp(HOT, u); liqM.emissive.copy(liqM.color); } };
  }
  // bilancia (equilibrio): giogo che si inclina, piatti che restano orizzontali
  function makeBalance(parent) {
    const g = new THREE.Group(); parent.add(g);
    const gold = std(0xffc93a, { roughness: 0.45 });
    mesh(new THREE.CylinderGeometry(0.15, 0.19, 0.05, 32), edgeM, g, V(0, -0.27, 0));
    mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.44, 12), edgeM, g, V(0, -0.04, 0));
    const beam = new THREE.Group(); beam.position.set(0, 0.17, 0); g.add(beam);
    mesh(new THREE.BoxGeometry(0.6, 0.032, 0.04), edgeM, beam);
    mesh(new THREE.SphereGeometry(0.038, 16, 12), gold, g, V(0, 0.17, 0.02));
    const L = 0.17;
    const pans = [-1, 1].map(sd => {
      const p = new THREE.Group(); g.add(p);
      [-1, 1].forEach(k => { const s = mesh(new THREE.CylinderGeometry(0.006, 0.006, Math.hypot(L, 0.09), 6), edgeM, p, V(k * 0.045, -L / 2, 0)); s.rotation.z = k * Math.atan2(0.09, L); });
      mesh(new THREE.CylinderGeometry(0.115, 0.08, 0.035, 32), gold, p, V(0, -L, 0));
      return { p, sd };
    });
    return { g, set(a) { beam.rotation.z = a; pans.forEach(({ p, sd }) => p.position.set(0.28 * sd * Math.cos(a), 0.17 + 0.28 * sd * Math.sin(a), 0)); } };
  }
  // cronometro
  function makeWatch(parent) {
    const g = new THREE.Group(); parent.add(g);
    mesh(new THREE.CircleGeometry(0.27, 64), basic(0xf4f7fc), g, V(0, -0.03, 0));
    mesh(new THREE.TorusGeometry(0.27, 0.032, 12, 64), edgeM, g, V(0, -0.03, 0));
    mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.07, 16), edgeM, g, V(0, 0.29, 0));
    mesh(new THREE.BoxGeometry(0.11, 0.04, 0.05), edgeM, g, V(0, 0.34, 0));
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, m = mesh(new THREE.BoxGeometry(0.014, i % 3 ? 0.03 : 0.055, 0.01), edgeM, g, V(Math.sin(a) * 0.21, -0.03 + Math.cos(a) * 0.21, 0.01)); m.rotation.z = -a; }
    const hand = new THREE.Group(); hand.position.set(0, -0.03, 0.02); g.add(hand);
    const red = std(0xe8604a, { roughness: 0.5 });
    mesh(new THREE.BoxGeometry(0.02, 0.2, 0.012), red, hand, V(0, 0.09, 0));
    mesh(new THREE.SphereGeometry(0.026, 12, 10), red, g, V(0, -0.03, 0.03));
    return { g, set(u) { hand.rotation.z = -u * Math.PI * 2; } };
  }
  // la camera del primo piano è a z = 11 e guarda y = 0,2: lontano dal centro dello schermo la prospettiva sposterebbe il modellino verso l'esterno
  const PAR = 1 - (11 - 0.2) / (11 + 0.1);
  const centerIcons = list => list.forEach(ic => ic.c.position.set(-ic.g.position.x * PAR, -(ic.g.position.y - 0.2) * PAR, 0));
  return { icon, showIcon, makeThermo, makeBalance, makeWatch, centerIcons };
}
