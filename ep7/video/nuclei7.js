// Puntata 7 — NUCLEI RADIOATTIVI (solo per questa puntata): nuclei di 40 nucleoni come in comune/atomi.js, ma alcuni sono instabili
// (alone rosa che pulsa, nucleoni che tremano) e decadono emettendo una radiazione:
//   'alfa'  : 2 protoni e 2 neutroni si staccano insieme ed escono lenti
//   'beta'  : un neutrone diventa protone (cambia colore) ed esce un elettrone piccolo e veloce
//   'gamma' : esce un lampo di energia (pacchetto luminoso con la scia ondulata) e un anello si allarga dal nucleo
// Dopo il decadimento il nucleo si calma (livello 0) o resta un po' instabile (livello intermedio) fino al decadimento successivo.
// Niente sparisce senza motivo: le particelle emesse escono dall'inquadratura (percorso di 16 unità).
//
// const K = creaNuclei(scena)
//   K.add(c, livello)                         nucleo nel punto c (livello 1 = instabile, 0 = stabile)
//   K.decay(n, t, tipo, dir, livelloDopo)     decadimento al tempo t (di scaletta), nella direzione dir (vettore nel piano xy)
//   K.completa()                              dopo aver aggiunto tutto
//   K.place(t, tn, zoomK)                     a ogni fotogramma
import { THREE, V, clamp01, smooth, ramp, lerp, hash, easeOut, setSeed, rnd, std, mesh, glow } from '/comune/base.js';

const NR = 0.075, C_P = new THREE.Color(0xf06a52), C_N = new THREE.Color(0x5aa8f0);
export const ROSA = 0xff5fd2;   // alone dei nuclei instabili (diverso dal giallo dell'U-235)

export function creaNuclei(scene) {
  // stessa forma di nucleo della libreria comune (seme 4242), ruotata in modo diverso per ogni nucleo
  const TEMPLATE = (() => {
    setSeed(4242); const pts = [];
    while (pts.length < 40) { const p = V(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).multiplyScalar(0.26); if (p.length() > 0.26) continue; if (pts.every(o => o.distanceTo(p) > 0.098)) pts.push(p); }
    pts.sort((a, b) => a.length() - b.length());
    return pts.map((p, i) => ({ p, isP: hash(i * 7.3) < 0.4 }));
  })();
  const rotated = k => { const e = new THREE.Euler(hash(k) * 6.28, hash(k + 1) * 6.28, hash(k + 2) * 6.28), m = new THREE.Matrix4().makeRotationFromEuler(e); return TEMPLATE.map(({ p, isP }) => ({ p: p.clone().applyMatrix4(m), isP })); };
  const NUCS = [], EMIT = [];
  const add = (c, lev = 0) => { const n = { c: c.clone(), lev0: lev, decays: [] }; NUCS.push(n); return n; };
  const decay = (n, t, type, dir, after = 0) => { const d = { t, type, dir: V(dir.x, dir.y, 0).normalize(), after }; n.decays.push(d); n.decays.sort((a, b) => a.t - b.t); return d; };

  let inst;
  const tetra = [V(1, 1, 1), V(-1, -1, 1), V(-1, 1, -1), V(1, -1, -1)].map(v => v.multiplyScalar(0.05));
  function completa() {
    let NI = 0;
    NUCS.forEach((n, k) => {
      n.parts = rotated(k * 13 + 7).map(pt => ({ ...pt, idx: NI++ }));
      n.ph = hash(k) * 6.28;
      if (n.lev0 > 0 || n.decays.length) { n.halo = glow(ROSA, scene, 1.2); n.flash = glow(0xfff0f8, scene, 1.6); }
      for (const d of n.decays) {
        d.c = n.c.clone();
        if (d.type === 'alfa') {
          // i 2 protoni e i 2 neutroni più esterni dalla parte di dir
          const by = isP => n.parts.filter(pt => pt.isP === isP && !pt.gone).sort((a, b) => b.p.dot(d.dir) - a.p.dot(d.dir)).slice(0, 2);
          d.four = [...by(true), ...by(false)]; d.four.forEach((pt, i) => { pt.gone = d; pt.off = tetra[i]; });
          d.trail = Array.from({ length: 8 }, () => glow(0xffd0c0, scene, 0.5));
        }
        if (d.type === 'beta') {
          const pt = n.parts.filter(q => !q.isP && !q.gone && !q.beta).sort((a, b) => b.p.dot(d.dir) - a.p.dot(d.dir))[0]; pt.beta = d; d.pt = pt;
          d.e = mesh(new THREE.SphereGeometry(NR * 0.5, 12, 10), new THREE.MeshStandardMaterial({ color: 0xfff2a0, emissive: 0xffe060, emissiveIntensity: 1.6 }), scene); d.e.visible = false;
          d.trail = Array.from({ length: 8 }, () => glow(0xfff2a0, scene, 0.3));
        }
        if (d.type === 'gamma') {
          d.trail = Array.from({ length: 14 }, () => glow(0xbff4ff, scene, 0.34));
          d.ring = mesh(new THREE.RingGeometry(0.9, 1, 64), new THREE.MeshBasicMaterial({ color: 0xbff4ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }), scene, n.c);
        }
        EMIT.push(d);
      }
    });
    inst = new THREE.InstancedMesh(new THREE.SphereGeometry(NR, 10, 8), std(0xffffff, { roughness: 0.55 }), NI);
    inst.frustumCulled = false; scene.add(inst);
    NUCS.forEach(n => n.parts.forEach(pt => inst.setColorAt(pt.idx, pt.isP ? C_P : C_N)));
  }
  // livello di instabilità al tempo t (si calma in 0,6 s dopo un decadimento; può risalire prima del successivo)
  function livello(n, t) {
    let L = n.lev0;
    for (const d of n.decays) { if (t < d.t) { L = Math.max(L, (n.preRise && n.preRise(t, d)) || 0); break; } L = lerp(L, d.after, smooth(ramp(t, d.t, d.t + 0.6))); }
    return L;
  }
  const V_ = { alfa: 1.5, beta: 3.6, gamma: 4.6 };
  // posizione della particella emessa al tempo t (null prima dell'emissione o fuori dal percorso)
  function emitPos(d, t) {
    if (t < d.t) return null;
    const s = 0.3 + V_[d.type] * (t - d.t) * (d.type === 'alfa' ? easeOut(ramp(t, d.t, d.t + 0.4), 1.4) * 0.8 + 0.2 : 1);
    if (s > 16) return null;
    const p = d.c.clone().addScaledVector(d.dir, s); p.z = 0.15;
    if (d.type === 'gamma') p.addScaledVector(V(-d.dir.y, d.dir.x, 0), 0.07 * Math.sin(s * 26));
    return p;
  }
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(1, 1, 1), _v = new THREE.Vector3(), _c = new THREE.Color();
  function place(t, tn, zoomK = 1) {
    for (const n of NUCS) {
      const L = livello(n, t), shake = 0.022 * L;
      // piccolo rinculo all'ultimo decadimento passato
      const last = n.decays.filter(d => t >= d.t).pop();
      const rec = last ? -0.06 * Math.sin(Math.PI * clamp01((t - last.t) / 0.3)) : 0;
      n.parts.forEach((pt, k) => {
        const d = pt.gone;
        if (d && t >= d.t) {
          // nucleone della particella alfa: raggiunge il gruppetto in 0,12 s, poi viaggia con lui
          const e = emitPos(d, t); if (!e) { _m.makeScale(0, 0, 0); inst.setMatrixAt(pt.idx, _m); return; }
          _v.copy(pt.p).add(n.c).lerp(e.clone().add(pt.off), smooth(ramp(t, d.t, d.t + 0.12)));
        } else {
          _v.copy(pt.p);
          _v.x += n.c.x + Math.sin(tn * 31 + k * 1.7 + n.ph) * (0.006 + shake) + (last ? last.dir.x * rec : 0);
          _v.y += n.c.y + Math.cos(tn * 27 + k * 2.3 + n.ph) * (0.006 + shake) + (last ? last.dir.y * rec : 0);
          _v.z += n.c.z + Math.sin(tn * 23 + k) * shake;
        }
        _m.compose(_v, _q.identity(), _s); inst.setMatrixAt(pt.idx, _m);
        if (pt.beta) { const u = smooth(ramp(t, pt.beta.t, pt.beta.t + 0.25)); inst.setColorAt(pt.idx, _c.copy(C_N).lerp(C_P, u)); }
      });
      if (n.halo) {
        n.halo.position.copy(n.c); n.halo.visible = L > 0.01;
        n.halo.material.opacity = 0.62 * L * (1 + 0.3 * Math.sin(tn * 7 + n.ph)); n.halo.scale.setScalar(1.2 * Math.min(zoomK, 2.2) * (1 + 0.12 * Math.sin(tn * 5.3 + n.ph)));
        const f = n.decays.reduce((m, d) => Math.max(m, t >= d.t ? 1 - (t - d.t) / 0.45 : 0), 0);
        n.flash.position.copy(n.c); n.flash.position.z += 0.3; n.flash.material.opacity = 0.9 * clamp01(f); n.flash.scale.setScalar(1.6 * Math.min(zoomK, 2.5) * (1 + (1 - clamp01(f))));
      }
    }
    inst.instanceMatrix.needsUpdate = true; inst.instanceColor.needsUpdate = true;
    for (const d of EMIT) {
      const p = emitPos(d, t);
      if (d.e) { d.e.visible = !!p; if (p) { d.e.position.copy(p); d.e.scale.setScalar(Math.min(zoomK, 2)); } }
      d.trail.forEach((s, k) => {
        const q = d.type === 'gamma' ? emitPos(d, t - k * 0.012) : emitPos(d, t - (k + 1) * 0.03);   // il lampo gamma è tutto scia
        s.visible = !!(p && q); if (!s.visible) return;
        s.position.copy(q); s.material.opacity = (d.type === 'gamma' ? 0.85 : d.type === 'alfa' ? 0.75 : 0.55) * (1 - k / d.trail.length); s.scale.setScalar((d.type === 'gamma' ? 0.34 : d.type === 'alfa' ? 0.5 : 0.3) * Math.min(zoomK, 2));
      });
      if (d.ring) { const u = ramp(t, d.t, d.t + 0.9); d.ring.visible = u > 0 && u < 1; d.ring.material.opacity = 0.7 * (1 - u); d.ring.scale.setScalar(0.25 + 1.4 * u); }
    }
  }
  return { NUCS, EMIT, add, decay, completa, place, livello };
}
