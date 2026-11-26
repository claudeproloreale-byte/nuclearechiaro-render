// Libreria comune — MOLECOLE D'ACQUA fra i nuclei (puntate 5–6): ossigeno azzurro, due idrogeni bianchi.
// I neutroni rimbalzano sull'acqua e rallentano: in ogni rimbalzo c'è un idrogeno esattamente sul punto d'urto.
//
// const W = creaAcqua(A, { free })      A = creaAtomi(); free(p) = condizione in più per i posti delle molecole di rimbalzo
//   W.zigNeutron(punti, t0, { t1 | v0, K, end, trail })   neutrone a zig-zag: rimbalza su ogni punto intermedio,
//                                       a ogni urto la velocità si moltiplica per K (0,74–0,8)
//   W.sparse(seme, { x0, x1, y0, y1, tries, paths, avoid })   le altre molecole, negli spazi liberi, lontane dai percorsi
//   W.MOLS                              elenco delle molecole (m.c centro, m.push spostamento per la "dilatazione")
//   W.completa()                        crea le molecole (dopo tutti i rimbalzi e W.sparse)
//   W.place(t, tn, { E, appearAt })     ogni fotogramma: E = dilatazione 0..1 (si allontanano e tremano di più),
//                                       appearAt(m) = quando compare la molecola m;
//                                       scaleAt(m, p) facoltativo = fattore 0..1 sulla grandezza (es. 0 dietro la mascotte)
import { THREE, V, ramp, lerp, hash, backOut, setSeed, rnd, xy, segDist, dirTo, std, glow } from './base.js';

export const OH = 0.19, HA = 52 * Math.PI / 180;   // distanza ossigeno-idrogeno, mezzo angolo fra i due idrogeni

export function creaAcqua(A, { free = () => true } = {}) {
  const MOLS = [];
  function addMol(c, a, extra = {}) { MOLS.push({ c: c.clone(), a, ph: hash(MOLS.length * 1.7) * 6.28, ...extra }); }
  const bounceMol = (p, din, dout, hitT) => { const nrm = din.clone().sub(dout).normalize(), c = p.clone().addScaledVector(nrm, OH); addMol(c.setZ(0.15), Math.atan2(-nrm.y, -nrm.x) + HA, { hitT, nrm, fixed: true }); };
  function zigNeutron(pts, t0, { t1, v0, K = 0.8, end = 'hit', trail = 0 }) {
    pts = pts.map(p => p.clone().setZ(0.15));
    if (!v0) { let s = 0; for (let i = 0; i < pts.length - 1; i++) s += pts[i].distanceTo(pts[i + 1]) / Math.pow(K, i); v0 = s / (t1 - t0); }
    let t = t0; const keys = [[pts[0], t]];
    for (let i = 0; i < pts.length - 1; i++) { t += pts[i].distanceTo(pts[i + 1]) / (v0 * Math.pow(K, i)); keys.push([pts[i + 1], t]); }
    const n = A.neutron(keys, end, trail ? { trail } : {});
    n.bounces = pts.slice(1, -1).map((p, i) => { bounceMol(p, dirTo(pts[i], p), dirTo(p, pts[i + 2]), keys[i + 1][1]); return { p, t: keys[i + 1][1], s: glow(0xdff4ff, A.scene, 0.7) }; });
    n.v0 = v0; return n;
  }
  const freeForMol = p => A.NUCS.every(n => xy(n.c, p) > 0.8) && MOLS.every(m => xy(m.c, p) > 0.6) && free(p);
  function sparse(s, { x0, x1, y0, y1, tries, paths = [], avoid }) {
    setSeed(s);
    for (let k = 0; k < tries; k++) {
      const c = V(lerp(x0, x1, rnd()), lerp(y0, y1, rnd()), 0);
      if (A.NUCS.some(n => xy(n.c, c) < 0.72)) continue;
      if (MOLS.some(m => xy(m.c, c) < 0.95)) continue;
      if (avoid && avoid(c)) continue;
      if (paths.some(([a, b]) => segDist(c, a, b) < 0.42)) continue;
      c.z = -0.1 + rnd() * 0.3; addMol(c, rnd() * 6.28);
    }
  }
  let molO, molH;
  function completa() {
    MOLS.forEach(m => { if (!m.push) m.push = V(0, 0, 0); });
    molO = new THREE.InstancedMesh(new THREE.SphereGeometry(0.15, 18, 14), std(0x6fa8e0, { roughness: 0.6 }), MOLS.length);
    molH = new THREE.InstancedMesh(new THREE.SphereGeometry(0.085, 14, 10), std(0xc9d6e6, { roughness: 0.6 }), MOLS.length * 2);
    A.scene.add(molO, molH);
  }
  const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
  function place(t, tn, { E = 0, appearAt, scaleAt }) {
    MOLS.forEach((m, i) => {
      const d0 = appearAt(m), sc = Math.max(0.001, backOut(ramp(t, d0, d0 + 0.45)));
      _p.copy(m.c).addScaledVector(m.push, E);
      const jig = (m.fixed ? 0.006 : 0.015) + 0.05 * E;
      _p.x += Math.sin(tn * (7 + 6 * E) + m.ph) * jig; _p.y += Math.cos(tn * (6 + 5 * E) + m.ph * 1.3) * jig;
      if (m.hitT !== undefined) { const k = ramp(t, m.hitT, m.hitT + 0.1) * (1 - ramp(t, m.hitT + 0.1, m.hitT + 0.9)); _p.addScaledVector(m.nrm, 0.13 * k); }
      const a = m.a + (m.fixed ? 0 : Math.sin(tn * 0.8 + m.ph) * 0.25) + E * Math.sin(tn * 3 + m.ph) * 0.5;
      if (scaleAt) { const k = scaleAt(m, _p); if (k < 1) { _s.setScalar(Math.max(0.001, sc * k)); _m4.compose(_p, _q.identity(), _s); molO.setMatrixAt(i, _m4);
        [-1, 1].forEach((sd, j) => { const b = a + sd * HA; _m4.compose(V(_p.x + Math.cos(b) * OH * sc * k, _p.y + Math.sin(b) * OH * sc * k, _p.z + 0.02), _q, _s); molH.setMatrixAt(2 * i + j, _m4); }); return; } }
      _s.setScalar(sc); _m4.compose(_p, _q.identity(), _s); molO.setMatrixAt(i, _m4);
      [-1, 1].forEach((sd, k) => { const b = a + sd * HA; _m4.compose(V(_p.x + Math.cos(b) * OH * sc, _p.y + Math.sin(b) * OH * sc, _p.z + 0.02), _q, _s); molH.setMatrixAt(2 * i + k, _m4); });
    });
    molO.instanceMatrix.needsUpdate = molH.instanceMatrix.needsUpdate = true;
  }
  const visible = v => { molO.visible = molH.visible = v; };
  const W = { MOLS, addMol, zigNeutron, freeForMol, sparse, completa, place, visible };
  A.acqua = W;
  return W;
}
