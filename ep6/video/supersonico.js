// Puntata 6 — effetto "supersonico" sui neutroni veloci (v4, nota dell'autore sulla v3).
// Ogni neutrone che va più veloce di V_MIN lascia una scia luminosa dritta dietro di sé (più lunga quanto più è veloce).
// (v5: tolto il "cono d'urto" a V davanti al neutrone, su richiesta dell'autore.) I neutroni lenti (moderati
// dall'acqua) non hanno effetto: così si vede bene quando un neutrone rallenta.
// Uso: const S = creaSupersonico(at); a ogni fotogramma degli atomi S.aggiorna(t, nK) (nK = grandezza dei neutroni).
import { THREE, clamp01 } from '/comune/base.js';
import { fwarp } from './tempi.js';

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
  const fx = n => { if (!FX.has(n)) FX.set(n, { scia: mk(0xbfe4ff) }); return FX.get(n); };
  const DT = 0.03;
  function aggiorna(t, nK) {
    for (const n of at.NEUT) {
      const p = at.npos(n, t), q = p && at.npos(n, t - DT);
      // v13 (bug a 0:57 della v12): un neutrone che si muove nel tempo del video (n.tempoVideo) ha la velocità misurata nel
      // tempo del video; prima, nel tratto lento della WARP, sembrava velocissimo e la scia diventava una lunga riga dritta
      const dtm = n.tempoVideo ? Math.max(1e-4, fwarp(t) - fwarp(t - DT)) : DT;
      const sp = p && q ? Math.hypot(p.x - q.x, p.y - q.y) / dtm : 0;
      if (sp < V_MIN && !FX.has(n)) continue;
      const f = fx(n), k = clamp01((sp - V_MIN) / (V_PIENA - V_MIN));
      const on = k > 0.001; f.scia.visible = on; if (!on) continue;
      const dd = Math.hypot(p.x - q.x, p.y - q.y) || 1, dx = (p.x - q.x) / dd, dy = (p.y - q.y) / dd, ang = Math.atan2(dy, dx);
      // scia: dalla coda alla testa del neutrone
      let L = Math.min(0.11 * sp, 2.6) * nK; const w = 0.16 * nK;
      // v13: la scia non va mai oltre l'ultimo rimbalzo (dopo un urto riparte da zero)
      const bu = n.bounces && n.bounces.filter(b => b.t <= t).pop(); if (bu) L = Math.min(L, Math.hypot(p.x - bu.p.x, p.y - bu.p.y));
      f.scia.position.set(p.x - dx * L / 2, p.y - dy * L / 2, 0.12); f.scia.rotation.z = ang; f.scia.scale.set(L, w, 1); f.scia.material.opacity = 0.75 * k;
    }
  }
  return { aggiorna };
}
