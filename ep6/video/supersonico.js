// Puntata 6 — effetto "supersonico" sui neutroni veloci (v4, nota dell'autore sulla v3).
// Ogni neutrone che va più veloce di V_MIN lascia una scia luminosa dritta dietro di sé (più lunga quanto più è veloce)
// e ha davanti un piccolo "cono d'urto" a V, come gli aerei supersonici nei cartoni. I neutroni lenti (moderati
// dall'acqua) non hanno effetto: così si vede bene quando un neutrone rallenta.
// Uso: const S = creaSupersonico(at); a ogni fotogramma degli atomi S.aggiorna(t, nK) (nK = grandezza dei neutroni).
import { THREE, clamp01 } from '/comune/base.js';

const V_MIN = 6, V_PIENA = 12;
export function creaSupersonico(at) {
  // sfumatura: trasparente a sinistra, piena a destra
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 32;
  const g = cv.getContext('2d'), gr = g.createLinearGradient(0, 0, 256, 0);
  gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.7, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,1)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 32);
  const vg = g.createLinearGradient(0, 0, 0, 32); g.globalCompositeOperation = 'destination-in';   // bordi morbidi in altezza
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(0.5, 'rgba(0,0,0,1)'); vg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = vg; g.fillRect(0, 0, 256, 32);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const geo = new THREE.PlaneGeometry(1, 1);
  const mk = col => { const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
    m.renderOrder = 20; m.visible = false; at.scene.add(m); return m; };
  const FX = new Map();
  const fx = n => { if (!FX.has(n)) FX.set(n, { scia: mk(0xbfe4ff), v1: mk(0xe8f6ff), v2: mk(0xe8f6ff) }); return FX.get(n); };
  const DT = 0.03;
  function aggiorna(t, nK) {
    for (const n of at.NEUT) {
      const p = at.npos(n, t), q = p && at.npos(n, t - DT);
      const sp = p && q ? Math.hypot(p.x - q.x, p.y - q.y) / DT : 0;
      if (sp < V_MIN && !FX.has(n)) continue;
      const f = fx(n), k = clamp01((sp - V_MIN) / (V_PIENA - V_MIN));
      const on = k > 0.001; f.scia.visible = f.v1.visible = f.v2.visible = on; if (!on) continue;
      const dx = (p.x - q.x) / (sp * DT), dy = (p.y - q.y) / (sp * DT), ang = Math.atan2(dy, dx);
      // scia: dalla coda alla testa del neutrone
      const L = Math.min(0.11 * sp, 2.6) * nK, w = 0.16 * nK;
      f.scia.position.set(p.x - dx * L / 2, p.y - dy * L / 2, 0.12); f.scia.rotation.z = ang; f.scia.scale.set(L, w, 1); f.scia.material.opacity = 0.75 * k;
      // cono d'urto: due trattini che partono un po' davanti al neutrone e vanno indietro a V
      const hx = p.x + dx * 0.14 * nK, hy = p.y + dy * 0.14 * nK, lc = 0.6 * nK;
      [[f.v1, 1], [f.v2, -1]].forEach(([m, sd]) => {
        const a = ang + Math.PI + sd * 0.55, wx = Math.cos(a), wy = Math.sin(a);
        m.position.set(hx + wx * lc / 2, hy + wy * lc / 2, 0.13); m.rotation.z = a + Math.PI; m.scale.set(lc, 0.07 * nK, 1); m.material.opacity = 0.7 * k;
      });
    }
  }
  return { aggiorna };
}
