// Puntata 6 — zona R (v2): BARRE DI URANIO CON L'ACQUA IN MEZZO, come nella puntata 5 (dalla B6 alla B9).
// Barre verticali larghe RW con l'acqua in mezzo (larga GAP); i nuclei stanno solo nelle barre, le molecole solo nell'acqua.
// Barra C (centro XR) = la pastiglia dove si entra; E = suo bordo destro; G0 = centro dell'acqua fra la barra C e la barra R.
// Da lontano si vedono le pastiglie color rame (guaina lucida, bagliori arancioni); entrando nella barra C diventano trasparenti
// e compaiono i nuclei (radi, quasi tutti U-238). Qui ciò che vale per tutte le scene della zona; ogni scena ha posizioni e tempi suoi.
import { THREE, V, xy, std, basic, mesh, glow, smooth, ramp, setSeed, rnd } from '/comune/base.js';

export const XR = 60, YR = 0, PR = (dx, dy) => V(XR + dx, YR + dy, 0);
export const RW = 14, GAP = 8, PITCH = RW + GAP, RODK = [-1, 0, 1, 2];
export const rodC = k => XR + PITCH * k, gapL = k => rodC(k) + RW / 2, gapR = k => rodC(k) + RW / 2 + GAP;
export const E = gapL(0), G0 = E + GAP / 2;
export const PE = (dx, dy) => V(E + dx, YR + dy, 0);                 // posizione rispetto al bordo destro della barra C
export const inWater = (p, m = 0.35) => RODK.some(k => p.x > gapL(k) + m && p.x < gapR(k) - m);

// inquadrature ferme della zona [x, y, distanza]: B7 dentro la barra C, B8 sul bordo della pastiglia, B9 sull'acqua fra C e R
export const CAM_B7 = [XR, YR - 0.8, 16.5], CAM_B8 = [E + 0.5, YR - 1, 20], CAM_B9 = [E + 5, YR + 1, 38];
// nessun nucleo dietro la mascotte in angolo, in nessuna delle tre inquadrature (si confonde con lei); per le molecole vedi ep6.js
// (v4: raggio quasi uguale a quello della mascotte vista con quella camera, così non resta un buco visibile intorno a lei)
const hole = ([x, y, z]) => [V(x + 0.074 * z, y - 0.107 * z, 0), 0.026 * z + 0.45];
export const MASCOTTE_SCHERMO = [0.074, -0.107];   // centro della mascotte rispetto al centro dell'inquadratura, in unità di distanza della camera
const HOLES = [CAM_B7, CAM_B8, CAM_B9].map(hole);
export const behindMascot = p => HOLES.some(([c, r]) => xy(p, c) < r);

// zone dei nuclei sparsi: barra C (dove si guarda da vicino) e il bordo sinistro della barra R (si vede nella B9).
// Distanza minima 1,45; pochi U-235 (circa 3 su 100), più i tre scritti a mano (A, BB, C9); corridoi liberi lungo i percorsi.
export const zona = caps => [
  { zone: 'R', x0: XR - RW / 2 + 0.45, x1: XR + RW / 2 - 0.45, y0: YR - 12, y1: YR + 14, tries: 20000, md: 1.45, caps, capDist: 0.58, fu: 0.03, avoid: behindMascot },
  { zone: 'R', x0: gapR(0) + 0.45, x1: gapR(0) + 6, y0: YR - 12, y1: YR + 14, tries: 8000, md: 1.45, caps, capDist: 0.58, fu: 0.03, avoid: behindMascot },
];

// ---------------- barre viste da lontano (come nella puntata 5, "voce 7")
let pelStack, pelM3, cladM3, pelLight; const pelGlows = [];
export function creaBarre(scene) {
  // fondo: interno delle barre grigio-viola, acqua azzurra, guaina metallica ai bordi
  const pelM2 = basic(0x5a5f80, { transparent: true, opacity: 0.3, depthWrite: false }), watM2 = basic(0x4fa3f5, { transparent: true, opacity: 0.3, depthWrite: false });
  const wallM = std(0xc3cedf, { metalness: 0.5, roughness: 0.35, transparent: true, opacity: 0.8 });
  RODK.forEach(k => {
    const c = rodC(k); mesh(new THREE.PlaneGeometry(RW, 170), pelM2, scene, V(c, YR + 12, -0.7)).renderOrder = -10;
    [-1, 1].forEach(sd => mesh(new THREE.BoxGeometry(0.14, 170, 0.3), wallM, scene, V(c + sd * (RW / 2 + 0.07), YR + 12, -0.25)));
    mesh(new THREE.PlaneGeometry(GAP - 0.28, 170), watM2, scene, V(gapL(k) + GAP / 2, YR + 12, -0.7)).renderOrder = -10;
  });
  // pastiglie: un solo cilindro per barra, con le pastiglie basse e smussate (passo PP); guaina lucida; bagliori arancioni
  pelStack = new THREE.Group(); scene.add(pelStack);
  pelM3 = new THREE.MeshStandardMaterial({ color: 0x76290e, roughness: 0.7, metalness: 0, transparent: true, emissive: 0xff6a10, emissiveIntensity: 0.06 });
  cladM3 = new THREE.MeshStandardMaterial({ color: 0xbfcad8, metalness: 0.5, roughness: 0.42, transparent: true, opacity: 0.3, depthWrite: false });
  const PP = 7.8, PJ0 = -10, PJ1 = 12;
  const pelGeo = (() => { const R = RW / 2, Hh = (PP - 0.2) / 2, c = 0.6, g = 0.1, pts = [new THREE.Vector2(0, PJ0 * PP - Hh - 0.1)];
    for (let j = PJ0; j <= PJ1; j++) { const y0 = j * PP - Hh, y1 = j * PP + Hh;
      pts.push(new THREE.Vector2(R - g, y0 - 0.1), new THREE.Vector2(R - c, y0), new THREE.Vector2(R, y0 + c), new THREE.Vector2(R, y1 - c), new THREE.Vector2(R - c, y1), new THREE.Vector2(R - g, y1 + 0.1)); }
    pts.push(new THREE.Vector2(0, PJ1 * PP + Hh + 0.1)); return new THREE.LatheGeometry(pts, 72); })();
  RODK.forEach(k => { mesh(pelGeo, pelM3, pelStack, V(rodC(k), YR, 0)).renderOrder = 6;   // y = YR: si entra al centro di una pastiglia
    mesh(new THREE.CylinderGeometry(RW / 2 + 0.12, RW / 2 + 0.12, 170, 72, 1, true), cladM3, pelStack, V(rodC(k), YR + 12, 0)).renderOrder = 7; });
  setSeed(4242);
  for (let i = 0; i < 70; i++) { const k = RODK[Math.floor(rnd() * RODK.length)], g = glow(0xff7a30, pelStack, 4 + 4 * rnd());
    g.position.set(rodC(k) + (rnd() - 0.5) * (RW - 3), YR - 45 + 90 * rnd(), RW / 2 + 0.5); g.material.depthTest = false; g.renderOrder = 8; pelGlows.push({ g, ph: rnd() * 6.28, a: 0.25 + 0.3 * rnd() }); }
  pelLight = new THREE.DirectionalLight(0xffffff, 0); pelLight.position.set(-6, 2, 8); scene.add(pelLight);   // luce di lato: la superficie si vede curva
}
// le pastiglie diventano trasparenti mentre la camera entra nella barra C (dissolvenza lenta e uniforme)
export const PEL_FADE = [27.0, 28.4];
export function aggiornaBarre(t, tn, visibile) {
  const po = visibile ? 1 - smooth(ramp(t, PEL_FADE[0], PEL_FADE[1])) : 0;
  pelStack.visible = po > 0.003; pelM3.opacity = po; cladM3.opacity = 0.3 * po; pelLight.intensity = 1.4 * po;
  for (const p of pelGlows) p.g.material.opacity = po * p.a * (0.75 + 0.25 * Math.sin(tn * 2.3 + p.ph));
  return po;
}
