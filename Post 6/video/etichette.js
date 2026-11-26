// Puntata 6 — targhette (v14, richiesta dell'autore a 0:40 della v13): "Uranio 235" sopra A e "Uranio 238" sopra il nucleo
// U-238 a sinistra a metà altezza, per poco tempo all'inizio della B7. Stesso disegno delle targhette della puntata 4
// (ovale bianco, bordo e testo #0c1c4a, Poppins grassetto), un po' più piccole.
import { THREE, V, pop } from '/comune/base.js';

function makeLabel(scene, text) {
  const font = '700 84px Poppins', c = document.createElement('canvas'), g0 = c.getContext('2d'); g0.font = font;
  const w = Math.ceil(g0.measureText(text).width) + 150, h = 172; c.width = w; c.height = h;
  const g = c.getContext('2d'), lw = 10, r = h / 2;
  g.beginPath(); g.arc(r, r, r - lw / 2, Math.PI / 2, -Math.PI / 2); g.lineTo(w - r, lw / 2); g.arc(w - r, r, r - lw / 2, -Math.PI / 2, Math.PI / 2); g.closePath();
  g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = lw; g.strokeStyle = '#0c1c4a'; g.stroke();
  g.fillStyle = '#0c1c4a'; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 6);
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, transparent: true, depthTest: false, depthWrite: false }));
  s.renderOrder = 50; s.userData.ar = w / h; s.visible = false; scene.add(s); return s;
}

export const ETICHETTE = [['Uranio 235', 28.85, 29.75], ['Uranio 238', 28.97, 29.95]];   // tempi di scaletta: nel video circa 39,8–42,0 e 40,1–42,5
export function creaEtichette(scene, b7) {
  const L = ETICHETTE.map(([txt, a, b]) => [makeLabel(scene, txt), a, b]);
  return { aggiorna(t, inR) {
    const dove = [b7.A, b7.NUC_238 ? b7.NUC_238.c : b7.U238_NOTA];
    L.forEach(([s, a, b], i) => {
      const v = inR ? pop(t, a, b, 0.35, 0.4) : 0; s.visible = v > 0.001; if (!s.visible) return;
      const hgt = 0.42 * v; s.scale.set(hgt * s.userData.ar, hgt, 1); s.position.copy(dove[i]).add(V(0, 0.78, 0.4)); s.material.opacity = Math.min(1, v * 1.5);
    });
  } };
}
