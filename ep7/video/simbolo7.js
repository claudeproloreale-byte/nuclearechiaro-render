// Puntata 7 — SIMBOLO DELLA RADIOATTIVITÀ (trifoglio): disco al centro e tre pale a 120°, proporzioni standard
// (disco di raggio R, pale fra 1,5 R e 5 R, larghe 60°). Usato grande nella B1 (scene/spazio.js) e sul fusto della B15.
//   trifoglio(R, spessore) → THREE.ExtrudeGeometry centrata nell'origine, nel piano xy, rivolta verso +z
import { THREE } from '/comune/base.js';

export function trifoglio(R = 0.2, depth = 0.05) {
  const shapes = [];
  const disc = new THREE.Shape(); disc.absarc(0, 0, R, 0, Math.PI * 2, false); shapes.push(disc);
  const r1 = 1.5 * R, r2 = 5 * R, half = Math.PI / 6;
  for (let k = 0; k < 3; k++) {
    // una pala in basso, due in alto (come il simbolo ufficiale)
    const c = -Math.PI / 2 + k * 2 * Math.PI / 3, a0 = c - half, a1 = c + half;
    const s = new THREE.Shape();
    s.moveTo(Math.cos(a0) * r1, Math.sin(a0) * r1);
    s.absarc(0, 0, r2, a0, a1, false);
    s.lineTo(Math.cos(a1) * r1, Math.sin(a1) * r1);
    s.absarc(0, 0, r1, a1, a0, true);
    shapes.push(s);
  }
  const bev = depth * 0.3;
  const g = new THREE.ExtrudeGeometry(shapes, { depth, bevelEnabled: true, bevelSize: bev, bevelThickness: bev, bevelSegments: 3, curveSegments: 32 });
  g.translate(0, 0, -depth / 2);
  return g;
}
