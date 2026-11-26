// Libreria comune — il MONDO DEGLI ATOMI (puntate 4–6): fondo blu notte, nuclei di 40 nucleoni (protoni corallo,
// neutroni azzurri, U-235 con alone giallo), neutroni liberi con la scia, fissioni con i due frammenti.
// Regole delle scene di atomi: regole.md, "Atomi".
//
// const A = creaAtomi();
//   A.special(c, u235, zona)          nucleo scritto a mano (prima di A.sparsi, perché gli altri gli stiano lontano)
//   A.sparsi(seme, [zone])            riempie le zone con nuclei sparsi che non si toccano (vedi sotto)
//   A.completa()                      crea alone e nucleoni (da chiamare una volta, dopo A.sparsi)
//   A.fission(n, t, asse, ...)        il nucleo n si spacca al tempo t
//   A.neutron(chiavi, fine, opz)      neutrone libero: chiavi [[punto, t], ...]; fine 'hit' | 'abs' (assorbito) | 'exit'
//   A.emitOthers(...)                 neutroni "in più" di una fissione: assorbiti da un U-238 vicino o fuori campo
//   A.segnaAssorbiti()                dopo aver creato tutti i neutroni: i nuclei che li assorbono sobbalzano
//   A.camera(tn, c) → zoomK           c = [x, y, z, guardaX, guardaY]
//   A.hideZone(z), A.placeNucs(z, t, tn, zoomK), A.placeNeutrons(t, zoomK)   ogni fotogramma
//   A.scaldaFondo(E)                  fondo dal blu notte verso il viola (E da 0 a 1)
//   A.haloNear = (n, t) => 0..1       facoltativo: l'alone di un U-235 sobbalza quando un neutrone gli passa vicino
import { THREE, W, H, V, clamp01, smooth, ramp, lerp, hash, easeOut, setSeed, rnd, xy, segDist, dirTo, std, mesh, glow, gradientBg, lights, addFade } from './base.js';

export const NR = 0.075;                 // raggio di un nucleone
const Z0 = V(0, 0, 1);

export function creaAtomi() {
  const A = {};
  const atomScene = new THREE.Scene();
  const atomCam = new THREE.PerspectiveCamera(30, W / H, 0.05, 300); atomScene.add(atomCam); addFade(atomCam);
  const atomBg = gradientBg(atomScene, 0x24305e, 0x120f2a);
  lights(atomScene, 0.95);
  { const p = new THREE.PointLight(0xffffff, 60); p.position.set(2, 4, 9); atomScene.add(p); const f = new THREE.PointLight(0x9fc8ff, 30); f.position.set(-5, -2, 6); atomScene.add(f); }
  const atomKey = new THREE.DirectionalLight(0xffffff, 1.2); atomKey.position.set(3, 5, 10); atomScene.add(atomKey);
  const neutM = new THREE.MeshStandardMaterial({ color: 0x58b0ff, roughness: 0.6, emissive: 0x1c5fb8, emissiveIntensity: 0.35 });   // come la mascotte
  const instGeo = new THREE.SphereGeometry(NR, 10, 8), freeGeo = new THREE.SphereGeometry(NR * 1.15, 16, 12);
  // forma di un nucleo: 40 nucleoni che non si compenetrano, 4 su 10 protoni; ogni nucleo è la stessa forma ruotata
  const TEMPLATE = (() => {
    setSeed(4242); const pts = [];
    while (pts.length < 40) { const p = V(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).multiplyScalar(0.26); if (p.length() > 0.26) continue; if (pts.every(o => o.distanceTo(p) > 0.098)) pts.push(p); }
    pts.sort((a, b) => a.length() - b.length());
    return pts.map((p, i) => ({ p, isP: hash(i * 7.3) < 0.4 }));
  })();
  const rotated = k => { const e = new THREE.Euler(hash(k) * 6.28, hash(k + 1) * 6.28, hash(k + 2) * 6.28), m = new THREE.Matrix4().makeRotationFromEuler(e); return TEMPLATE.map(({ p, isP }) => ({ p: p.clone().applyMatrix4(m), isP })); };

  // ---------------- nuclei
  const NUCS = [];
  const special = (c, u, zone) => { const n = { c: c.clone(), u, zone }; NUCS.push(n); return n; };
  // zone: [{ zone, x0, x1, y0, y1, tries, md (distanza minima fra nuclei), caps (corridoi [[a, b], ...] da lasciare liberi),
  //          capDist (larghezza dei corridoi), fu (quota di U-235), avoid (p => true dove non mettere nuclei, es. dietro la mascotte) }]
  function sparsi(s, zones) {
    setSeed(s);
    for (const { zone, x0, x1, y0, y1, tries, md, caps, capDist, fu, avoid } of zones) {
      for (let k = 0; k < tries; k++) {
        const p = V(lerp(x0, x1, rnd()), lerp(y0, y1, rnd()), 0);
        if (NUCS.some(n => xy(n.c, p) < md)) continue;
        if (caps.some(([a, b]) => segDist(p, a, b) < capDist)) continue;
        if (avoid && avoid(p)) continue;
        p.z = (rnd() - 0.5) * 0.4; NUCS.push({ c: p, u: rnd() < fu, zone });
      }
    }
  }
  // tutti i nucleoni in due InstancedMesh (protoni, neutroni); gli U-235 hanno anche l'alone giallo
  let instP, instN;
  function completa() {
    let NP = 0, NN = 0;
    NUCS.forEach((n, k) => {
      n.parts = rotated(k * 13 + 7).map(pt => ({ ...pt, idx: pt.isP ? NP++ : NN++ }));
      n.ph = hash(k) * 6.28;
      if (n.u) n.halo = glow(0xffd23a, atomScene, 1.25);
    });
    instP = new THREE.InstancedMesh(instGeo, std(0xffffff, { roughness: 0.55 }), NP); instN = new THREE.InstancedMesh(instGeo, std(0xffffff, { roughness: 0.55 }), NN);
    instP.frustumCulled = instN.frustumCulled = false;
    atomScene.add(instP, instN);
    const C_P = new THREE.Color(0xf06a52), C_N = new THREE.Color(0x5aa8f0);
    NUCS.forEach(n => n.parts.forEach(pt => (pt.isP ? instP : instN).setColorAt(pt.idx, pt.isP ? C_P : C_N)));
  }

  // ---------------- fissione: i nucleoni si dividono in due frammenti (24 e 16) lungo un asse; i frammenti si fermano e dissolvono
  const FISS = [];
  function fission(n, t, axis, dist = 0.7, dur = 1.4, fadeAfter = 0.5) {
    n.hit = t; n.axis = axis.clone().normalize();
    const order = n.parts.map((pt, k) => [pt.p.dot(n.axis), k]).sort((a, b) => b[0] - a[0]);
    order.forEach(([, k], r) => { n.parts[k].frag = r < 16 ? 1 : 0; });
    n.cent = [0, 1].map(f => { const c = V(0, 0, 0); let cnt = 0; n.parts.forEach(pt => { if (pt.frag === f) { c.add(pt.p); cnt++; } }); return c.multiplyScalar(1 / cnt); });
    n.parts.forEach(pt => { pt.q = pt.p.clone().sub(n.cent[pt.frag]).multiplyScalar(0.92); });
    n.fragFn = (f, tt) => n.cent[f].clone().addScaledVector(n.axis, (f ? 1 : -1) * dist * easeOut(ramp(tt, t + 0.05, t + dur), 2.2));
    n.fade = tt => 1 - smooth(ramp(tt, t + dur + fadeAfter, t + dur + fadeAfter + 0.7));
    n.hot = [0, 1].map(() => glow(0xffb060, atomScene, 0.9));
    n.flash = glow(0xfff0c0, atomScene, 2.2); n.flash.position.copy(n.c); n.flash.position.z += 0.3;
    FISS.push(n);
  }
  // ---------------- neutroni: percorso a tratti [[punto, tempo], ...]; 'hit' spacca, 'abs' assorbito (resta attaccato), 'exit' esce
  const NEUT = [];
  function neutron(keys, end, o = {}) {
    const n = { keys, end, m: mesh(freeGeo, neutM, atomScene), flash: end === 'abs' ? glow(0xbfe4ff, atomScene, 0.8) : null, bounces: [], ...o };
    n.m.visible = false;
    if (o.trail) n.trailS = Array.from({ length: o.trail }, () => glow(0xbfe4ff, atomScene, 0.42));
    NEUT.push(n); return n;
  }
  const seg = (a, b, t0, v) => [[a, t0], [b, t0 + a.distanceTo(b) / v]];
  function npos(n, t) {
    const K = n.keys; if (t < K[0][1]) return null;
    for (let i = 0; i < K.length - 1; i++) { const [a, ta] = K[i], [b, tb] = K[i + 1]; if (t <= tb) return a.clone().lerp(b, (t - ta) / Math.max(1e-6, tb - ta)); }
    return n.end === 'abs' ? K[K.length - 1][0].clone() : null;
  }
  const tEnd = n => n.keys[n.keys.length - 1][1];
  const clearLine = (a, b, skip) => NUCS.every(n => skip.includes(n) || segDist(n.c, a, b) > 0.42);
  const absorbed = new Set();
  // neutroni che non portano avanti la catena: assorbiti da un U-238 vicino o fuori dall'inquadratura.
  // water = true: rimbalzano anche su una molecola d'acqua (serve creaAcqua(A), che imposta A.acqua)
  function emitOthers(e, t, k, v, avoid = [], water = false, trail = 0) {
    const tries = Array.from({ length: 16 }, (_, i) => hash(t * 13.1 + i * 3.3 + e.c.x) * 6.28);
    let done = 0;
    for (const a of tries) {
      if (done >= k) break;
      const dir = V(Math.cos(a), Math.sin(a), 0);
      if (avoid.some(d => d.dot(dir) > 0.7)) continue;
      avoid.push(dir);
      const start = e.c.clone().addScaledVector(dir, 0.32);
      const tgt = NUCS.filter(n => n.zone === e.zone && !n.u && !absorbed.has(n)).map(n => [xy(n.c, e.c), n])
        .filter(([d, n]) => d > 1.2 && d < 4.0 && dirTo(e.c, n.c).dot(dir) > 0.8 && clearLine(e.c, n.c, [e, n])).sort((p, q) => p[0] - q[0])[0];
      let end, kind;
      if (tgt) { absorbed.add(tgt[1]); end = tgt[1].c.clone().addScaledVector(dirTo(tgt[1].c, start), 0.3); kind = 'abs'; }
      else { end = start.clone().addScaledVector(dir, 16); kind = 'exit'; }
      let mid = null;
      if (water) for (const sd of [1, -1]) {
        const L = Math.min(1.1, start.distanceTo(end) * 0.5), m = start.clone().addScaledVector(dir, L).addScaledVector(V(-dir.y, dir.x, 0), 0.35 * sd);
        if (A.acqua.freeForMol(m)) { mid = m; if (kind === 'exit') end = m.clone().addScaledVector(dir.clone().applyAxisAngle(Z0, -0.6 * sd), 16); break; }
      }
      const nn = mid ? A.acqua.zigNeutron([start, mid, end], t + 0.05, { v0: v, K: 0.8, end: kind }) : neutron(seg(start.setZ(0.15), end.setZ(0.15), t + 0.05, v), kind, trail ? { trail } : {});
      if (tgt) nn.host = tgt[1];
      done++;
    }
  }
  const segnaAssorbiti = () => NEUT.forEach(n => { if (n.host) n.host.absT = tEnd(n); });

  // ---------------- disegno, a ogni fotogramma
  const _m4b = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _v = new THREE.Vector3();
  function placeNucs(zone, t, tn, zoomK) {
    for (const n of NUCS) {
      if (n.zone !== zone) continue;
      const hit = n.hitAt, e = hit !== undefined ? smooth(ramp(t, hit, hit + 0.45)) : 0, wob = hit !== undefined ? ramp(t, hit - 0.2, hit) * (1 - ramp(t, hit, hit + 0.12)) : 0;
      const fade = hit !== undefined && t >= hit ? n.fade(t) : 1;
      // U-238 che ha appena assorbito un neutrone: piccolo sobbalzo
      let jolt = 0; if (n.absT !== undefined) jolt = ramp(t, n.absT, n.absT + 0.08) * (1 - ramp(t, n.absT + 0.08, n.absT + 0.6));
      const sc = Math.max(0.001, fade);
      n.parts.forEach((pt, k) => {
        if (hit === undefined || t < hit) _v.copy(pt.p).multiplyScalar(1 + 0.16 * wob * Math.sin(t * 45 + k) + 0.1 * jolt * Math.sin(t * 50 + k));
        else _v.copy(pt.p).lerp(n.fragFn(pt.frag, t).add(pt.q), e);
        _v.x += n.c.x + Math.sin(tn * 31 + k * 1.7 + n.ph) * 0.006; _v.y += n.c.y + Math.cos(tn * 27 + k * 2.3 + n.ph) * 0.006; _v.z += n.c.z;
        _s.setScalar(sc); _m4b.compose(_v, _q.identity(), _s); (pt.isP ? instP : instN).setMatrixAt(pt.idx, _m4b);
      });
      if (n.halo) {
        const hal = hit !== undefined ? 1 - ramp(t, hit, hit + 0.15) : 1;
        const near = A.haloNear ? A.haloNear(n, t) : 0;
        n.halo.position.set(n.c.x, n.c.y, n.c.z); n.halo.visible = hal > 0.001;
        n.halo.material.opacity = 0.6 * hal * (1 + 0.15 * Math.sin(tn * 5 + n.ph) + 0.8 * near); n.halo.scale.setScalar(1.25 * Math.min(zoomK, 2.2) * (1 + 0.25 * near));
      }
      if (n.hot) n.hot.forEach((s, f) => {
        s.visible = t > hit && fade > 0.001; if (!s.visible) return;
        // il bagliore sta sul centro del frammento così come lo si vede (i nucleoni lo raggiungono in 0,45 s: e)
        s.position.copy(n.cent[f]).lerp(n.fragFn(f, t), e).add(n.c); s.position.z += 0.15;
        s.material.opacity = fade * 0.6; s.scale.setScalar(0.9 * Math.min(zoomK, 2));
      });
      if (n.flash) { n.flash.material.opacity = t > hit ? 0.95 * Math.max(0, 1 - (t - hit) / 0.5) : 0; n.flash.scale.setScalar((2.2 + 2 * ramp(t, hit, hit + 0.5)) * Math.min(zoomK, 2.5)); }
    }
    instP.instanceMatrix.needsUpdate = instN.instanceMatrix.needsUpdate = true;
  }
  // nuclei di un'altra zona: nascosti (la camera non li vede comunque, ma così non pesano sul disegno)
  function hideZone(zone) {
    _m4b.makeScale(0, 0, 0);
    for (const n of NUCS) if (n.zone === zone) { n.parts.forEach(pt => (pt.isP ? instP : instN).setMatrixAt(pt.idx, _m4b)); if (n.halo) n.halo.visible = false; if (n.hot) n.hot.forEach(s => { s.visible = false; }); if (n.flash) n.flash.material.opacity = 0; }
  }
  function placeNeutrons(t, zoomK) {
    NEUT.forEach(n => {
      const p = npos(n, t), t1 = tEnd(n);
      n.m.visible = !!p; if (p) { n.m.position.copy(p); n.m.scale.setScalar(t < t1 ? Math.min(zoomK, 2.2) : 1); }
      if (n.flash) { n.flash.position.copy(n.keys[n.keys.length - 1][0]); n.flash.material.opacity = t > t1 ? 0.8 * Math.max(0, 1 - (t - t1) / 0.45) : 0; }
      if (n.trailS) n.trailS.forEach((s, k) => {
        const tt = t - (k + 1) * 0.028, q = npos(n, tt), q2 = npos(n, tt - 0.02);
        s.visible = !!(p && q && q2 && t < t1); if (!s.visible) return;
        const sp = q.distanceTo(q2) / 0.02;
        s.position.copy(q); s.material.opacity = clamp01((sp - 0.8) / 4) * 0.6 * (1 - k / n.trailS.length); s.scale.setScalar(0.42 * (1 - k / n.trailS.length * 0.5) * Math.min(zoomK, 2));
      });
      n.bounces.forEach(b => { b.s.position.copy(b.p); b.s.material.opacity = t > b.t ? 0.9 * Math.max(0, 1 - (t - b.t) / 0.35) : 0; });
    });
  }
  function camera(tn, c) {
    atomCam.position.set(c[0] + Math.sin(tn * 0.3) * 0.04, c[1] + Math.sin(tn * 0.23) * 0.03, c[2]); atomCam.lookAt(c[3], c[4], 0); atomCam.updateMatrixWorld();
    return 1 + Math.max(0, atomCam.position.z - 12) / 12;   // zoomK: più la camera è lontana, più bagliori e neutroni si ingrandiscono
  }
  const ATOM_TOP = [new THREE.Color(0x24305e), new THREE.Color(0x120f2a)], ATOM_HOT = [new THREE.Color(0x4a3466), new THREE.Color(0x2a1430)];
  const scaldaFondo = E => { atomBg.uniforms.top.value.copy(ATOM_TOP[0]).lerp(ATOM_HOT[0], E); atomBg.uniforms.bottom.value.copy(ATOM_TOP[1]).lerp(ATOM_HOT[1], E); };

  Object.assign(A, { scene: atomScene, cam: atomCam, NUCS, FISS, NEUT, absorbed, special, sparsi, completa, fission, neutron, seg, npos, tEnd, clearLine,
    emitOthers, segnaAssorbiti, placeNucs, hideZone, placeNeutrons, camera, scaldaFondo, haloNear: null, acqua: null });
  return A;
}
