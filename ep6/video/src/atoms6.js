// ---------------- MONDO DEGLI ATOMI della puntata 6: due zone lontane (si passa dall'una all'altra sotto il lampo bianco)
// Zona B ("bomba", intorno a x = 0): nuclei fitti, 9 su 10 sono U-235. Catena velocissima che finisce nel lampo bianco.
// Zona R ("centrale", intorno a x = XR): nuclei radi, quasi tutti U-238; dalla B8 le molecole d'acqua.
const XR = 30, YR = 1, PR = (dx, dy) => V(XR + dx, YR + dy, 0);
const segAt = (a, b, u) => a.clone().lerp(b, u);

// ---------------- tempi (secondi di scaletta)
const B_IN = 14.6, B_HIT = 15.5, B_LAST = 18.75;                 // B5: il neutrone entra e spacca il primo nucleo; nessuna fissione dopo B_LAST
const FLASH_UP = 18.7, FLASH_FULL = 19.45, CUT = 20.25, FLASH_DOWN = 21.3;   // lampo bianco della bomba; sotto il bianco si passa alla zona R
const A_IN = 24.0, A_HIT = 26.6;                                  // B7: un neutrone lento spacca A; due neutroni finiscono negli U-238
const MOL_IN = 30.2, W_IN = 30.8, B8_HIT = 33.6;                  // B8: le molecole d'acqua; il neutrone rimbalza e spacca BB
const TH_UP = [35.2, 36.6], EXP = [36.0, 37.2], N9 = [36.9, 38.7], TH_DOWN = [38.8, 39.9];   // B9

// ---------------- posizioni scritte a mano (zona R)
const A = PR(-0.9, 1.7), A_FROM = PR(-0.55, -6.6);
const BB = PR(0.45, -0.35);
const W_FROM = PR(-3.6, 3.0);
const W_PTS = (() => { const d = dirTo(W_FROM, BB), pr = V(-d.y, d.x, 0), L = W_FROM.distanceTo(BB);
  return Array.from({ length: 5 }, (_, i) => W_FROM.clone().addScaledVector(d, L * (i + 1) / 6.2).addScaledVector(pr, 0.5 * (i % 2 ? -1 : 1))); })();
const N9_A = PR(-2.0, -5.6), N9_B = PR(2.3, 6.4);
const C9 = segAt(N9_A, N9_B, 0.72).addScaledVector(V(-(N9_B.y - N9_A.y), N9_B.x - N9_A.x, 0).normalize(), -0.75);   // U-235 vicino al percorso: il neutrone veloce non lo spacca

// ---------------- nuclei
const NUCS = [];
const special = (c, u, zone) => { const n = { c: c.clone(), u, zone }; NUCS.push(n); return n; };
const nB0 = special(V(0, 0.3, 0), true, 'B');
const nA = special(A, true, 'R'), nBB = special(BB, true, 'R'), nC9 = special(C9, true, 'R');
const polySegs = pts => pts.slice(1).map((p, i) => [pts[i], p]);
const CAPS_B = [[V(-9, 0.8, 0), nB0.c]];
const CAPS_R = [[A_FROM, A], ...polySegs([W_FROM, ...W_PTS, BB]), [N9_A, N9_B]];
const MASCOT_R = PR(1.3, -2.6), behindMascot = p => xy(p, MASCOT_R) < 1.15;   // nella zona R niente dietro la mascotte in angolo
seed = 6060;
// [zona, x0, x1, y0, y1, tentativi, distanza minima, corridoi, quota di U-235]
[['B', -8, 8, -12, 12, 30000, 1.3, CAPS_B, 0.9], ['R', XR - 7, XR + 7, YR - 9, YR + 10, 20000, 1.45, CAPS_R, 0]].forEach(([zone, x0, x1, y0, y1, tries, md, caps, fu]) => {
  for (let k = 0; k < tries; k++) {
    const p = V(lerp(x0, x1, rnd()), lerp(y0, y1, rnd()), 0);
    if (NUCS.some(n => xy(n.c, p) < md)) continue;
    if (caps.some(([a, b]) => segDist(p, a, b) < (zone === 'R' ? 0.58 : 0.7))) continue;
    if (zone === 'R' && behindMascot(p)) continue;
    p.z = (rnd() - 0.5) * 0.4; NUCS.push({ c: p, u: rnd() < fu, zone });
  }
});
// zona R: qualche altro U-235 fermo (circa 1 su 12), lontano dai percorsi, perché si veda che sono pochi
{ const free = NUCS.filter(n => n.zone === 'R' && !n.u), U = NUCS.filter(n => n.zone === 'R' && n.u).map(n => n.c);
  seed = 77;
  for (const n of free) if (false && U.every(c => xy(c, n.c) > 3.2) && CAPS_R.every(([a, b]) => segDist(n.c, a, b) > 1.1)) { n.u = true; U.push(n.c); } }
// tutti i nucleoni in due InstancedMesh (protoni, neutroni); gli U-235 hanno anche l'alone giallo
let NP = 0, NN = 0;
NUCS.forEach((n, k) => {
  n.parts = rotated(k * 13 + 7).map(pt => ({ ...pt, idx: pt.isP ? NP++ : NN++ }));
  n.ph = hash(k) * 6.28;
  if (n.u) n.halo = glow(0xffd23a, atomScene, 1.25);
});
const instP = new THREE.InstancedMesh(instGeo, std(0xffffff, { roughness: 0.55 }), NP), instN = new THREE.InstancedMesh(instGeo, std(0xffffff, { roughness: 0.55 }), NN);
instP.frustumCulled = instN.frustumCulled = false;
atomScene.add(instP, instN);
const C_P = new THREE.Color(0xf06a52), C_N = new THREE.Color(0x5aa8f0), C_HOT = new THREE.Color(0xffa040);
NUCS.forEach(n => n.parts.forEach(pt => (pt.isP ? instP : instN).setColorAt(pt.idx, pt.isP ? C_P : C_N)));
console.log('nuclei zona B', NUCS.filter(n => n.zone === 'B').length, 'di cui U-235', NUCS.filter(n => n.zone === 'B' && n.u).length,
  '· zona R', NUCS.filter(n => n.zone === 'R').length, 'di cui U-235', NUCS.filter(n => n.zone === 'R' && n.u).length);

// ---------------- fissione: i nucleoni si dividono in due frammenti (24 e 16) lungo un asse; i frammenti si fermano e dissolvono
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
const FISS = [];
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

// ---------------- molecole d'acqua (solo zona R): nei rimbalzi c'è un idrogeno esattamente sul punto d'urto
const MOLS = [];
const OH = 0.19, HA = 52 * Math.PI / 180;
function addMol(c, a, extra = {}) { MOLS.push({ c: c.clone(), a, ph: hash(MOLS.length * 1.7) * 6.28, ...extra }); }
const bounceMol = (p, din, dout, hitT) => { const nrm = din.clone().sub(dout).normalize(), c = p.clone().addScaledVector(nrm, OH); addMol(c.setZ(0.15), Math.atan2(-nrm.y, -nrm.x) + HA, { hitT, nrm, fixed: true }); };
function zigNeutron(pts, t0, { t1, v0, K = 0.8, end = 'hit', trail = 0 }) {
  pts = pts.map(p => p.clone().setZ(0.15));
  if (!v0) { let s = 0; for (let i = 0; i < pts.length - 1; i++) s += pts[i].distanceTo(pts[i + 1]) / Math.pow(K, i); v0 = s / (t1 - t0); }
  let t = t0; const keys = [[pts[0], t]];
  for (let i = 0; i < pts.length - 1; i++) { t += pts[i].distanceTo(pts[i + 1]) / (v0 * Math.pow(K, i)); keys.push([pts[i + 1], t]); }
  const n = neutron(keys, end, trail ? { trail } : {});
  n.bounces = pts.slice(1, -1).map((p, i) => { bounceMol(p, dirTo(pts[i], p), dirTo(p, pts[i + 2]), keys[i + 1][1]); return { p, t: keys[i + 1][1], s: glow(0xdff4ff, atomScene, 0.7) }; });
  n.v0 = v0; return n;
}
const freeForMol = p => NUCS.every(n => xy(n.c, p) > 0.8) && MOLS.every(m => xy(m.c, p) > 0.6) && segDist(p, N9_A, N9_B) > 0.6;
// neutroni che non portano avanti la catena: assorbiti da un U-238 vicino o fuori dall'inquadratura
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
      if (freeForMol(m)) { mid = m; if (kind === 'exit') end = m.clone().addScaledVector(dir.clone().applyAxisAngle(Z0, -0.6 * sd), 16); break; }
    }
    const nn = mid ? zigNeutron([start, mid, end], t + 0.05, { v0: v, K: 0.8, end: kind }) : neutron(seg(start.setZ(0.15), end.setZ(0.15), t + 0.05, v), kind, trail ? { trail } : {});
    if (tgt) nn.host = tgt[1];
    done++;
  }
}
const Z0 = V(0, 0, 1);

// ---------------- zona B: reazione a catena della bomba. Ogni fissione manda i neutroni ai nuclei vicini, quasi tutti U-235.
{ const VB = 4.2;
  neutron([[V(-9, 0.8, 0.15), B_IN], [nB0.c.clone().addScaledVector(dirTo(V(-9, 0.8, 0), nB0.c), -0.25).setZ(0.15), B_HIT]], 'hit', { trail: 6 });
  nB0.hitAt = B_HIT; const queue = [nB0];
  while (queue.length) {
    queue.sort((a, b) => a.hitAt - b.hitAt); const e = queue.shift(), t = e.hitAt;
    const a = hash(t * 5.3 + e.c.x) * 6.28; fission(e, t, V(Math.cos(a), Math.sin(a), 0), 0.38, 0.9, 0.2);
    const k = hash(t * 2.9 + e.c.y) < 0.5 ? 2 : 3;
    const cands = NUCS.filter(n => n.zone === 'B' && n.u && n.hitAt === undefined).map(n => [xy(n.c, e.c), n])
      .filter(([d, n]) => d > 1.0 && d < 2.9 && clearLine(e.c, n.c, [e, n])).sort((p, q) => p[0] - q[0]);
    let links = 0; const used = [];
    for (const [d, n] of cands) {
      if (links >= k) break;
      const dir = dirTo(e.c, n.c); if (used.some(u => u.dot(dir) > 0.6)) continue;
      const t1 = t + 0.05 + d / VB; if (t1 > B_LAST) continue;
      n.hitAt = t1; queue.push(n); used.push(dir); links++;
      neutron([[e.c.clone().addScaledVector(dir, 0.32).setZ(0.15), t + 0.05], [n.c.clone().addScaledVector(dir, -0.25).setZ(0.15), t1]], 'hit', { trail: 4 });
    }
    if (links < k) emitOthers(e, t, k - links, VB, used, false, 4);
  } }
console.log('fissioni nella zona B', FISS.length);

// ---------------- zona R, B7: un neutrone lento spacca A; due neutroni finiscono assorbiti da U-238, uno esce
neutron([[A_FROM.clone().setZ(0.15), A_IN], [A.clone().addScaledVector(dirTo(A_FROM, A), -0.25).setZ(0.15), A_HIT]], 'hit');
nA.hitAt = A_HIT; fission(nA, A_HIT, V(1, 0.35, 0), 0.8, 1.6, 0.8);
{ // i due U-238 più vicini, in direzioni diverse, ben dentro l'inquadratura
  const vis = n => Math.abs(n.c.x - XR) < 2.2 && n.c.y > YR - 2.6 && n.c.y < YR + 3.4 && !(n.c.x > XR + 0.6 && n.c.y < YR - 1.6);   // lontano dalla mascotte
  const cands = NUCS.filter(n => n.zone === 'R' && !n.u && vis(n)).map(n => [xy(n.c, A), n]).filter(([d, n]) => d > 1.3 && d < 4.2 && clearLine(A, n.c, [nA, n])).sort((p, q) => p[0] - q[0]);
  const used = [];
  for (const [d, n] of cands) {
    if (used.length >= 2) break;
    const dir = dirTo(A, n.c); if (used.some(u => u.dot(dir) > 0.5)) continue;
    used.push(dir); absorbed.add(n);
    const nn = neutron(seg(A.clone().addScaledVector(dir, 0.32).setZ(0.15), n.c.clone().addScaledVector(dir, -0.3).setZ(0.15), A_HIT + 0.05 + used.length * 0.12, 2.4), 'abs', { trail: 8 }); nn.host = n;
  }
  console.log('B7: neutroni assorbiti', used.length);
  emitOthers(nA, A_HIT, 1, 3.2, used, false, 8);
}
// ---------------- zona R, B8: il neutrone entra da sinistra, rimbalza sull'acqua, rallenta e spacca BB
const n8 = zigNeutron([W_FROM, ...W_PTS, BB.clone().addScaledVector(dirTo(W_PTS[W_PTS.length - 1], BB), -0.25)], W_IN, { t1: B8_HIT, K: 0.74, trail: 10 });
nBB.hitAt = B8_HIT; fission(nBB, B8_HIT, V(1, -0.6, 0), 0.75, 1.5, 0.6);
emitOthers(nBB, B8_HIT, 2, 2.4, [dirTo(BB, W_PTS[W_PTS.length - 1])], true);
// ---------------- zona R, B9: acqua calda e dilatata; un neutrone veloce attraversa tutto senza rimbalzare ed esce
const n9 = neutron(seg(N9_A.clone().setZ(0.15), N9_B.clone().setZ(0.15), N9[0], N9_A.distanceTo(N9_B) / (N9[1] - N9[0])), 'exit', { trail: 12 });
console.log('neutroni', NEUT.length);

// ---------------- le altre molecole d'acqua, sparse negli spazi liberi della zona R, lontane dai percorsi dei neutroni
{ const paths = NEUT.filter(n => tEnd(n) > MOL_IN && n.keys[0][0].x > 15).flatMap(n => n.keys.slice(1).map((k, i) => [n.keys[i][0], k[0]]));
  seed = 99;
  for (let k = 0; k < 6000; k++) {
    const c = V(lerp(XR - 4, XR + 4, rnd()), lerp(YR - 6, YR + 7, rnd()), 0);
    if (NUCS.some(n => xy(n.c, c) < 0.72)) continue;
    if (MOLS.some(m => xy(m.c, c) < 0.95)) continue;
    if (behindMascot(c)) continue;
    if (paths.some(([a, b]) => segDist(c, a, b) < 0.42)) continue;
    c.z = -0.1 + rnd() * 0.3; addMol(c, rnd() * 6.28);
  } }
// dilatazione (B9): ogni molecola si allontana dal percorso del neutrone della B9 e un po' dal centro, e trema di più
{ const d = dirTo(N9_A, N9_B), pr = V(-d.y, d.x, 0);
  MOLS.forEach(m => { const s = Math.sign(V(m.c.x - N9_A.x, m.c.y - N9_A.y, 0).dot(pr)) || 1, near = Math.exp(-(segDist(m.c, N9_A, N9_B) ** 2) / 1.2);
    m.push = pr.clone().multiplyScalar(s * 0.5 * near).add(V(m.c.x - XR, m.c.y - YR, 0).multiplyScalar(0.12)); }); }
const molO = new THREE.InstancedMesh(new THREE.SphereGeometry(0.15, 18, 14), std(0x6fa8e0, { roughness: 0.6 }), MOLS.length);
const molH = new THREE.InstancedMesh(new THREE.SphereGeometry(0.085, 14, 10), std(0xc9d6e6, { roughness: 0.6 }), MOLS.length * 2);
atomScene.add(molO, molH);
console.log('molecole', MOLS.length);
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
const expand = t => smooth(ramp(t, EXP[0], EXP[1])) * (1 - 0.55 * smooth(ramp(t, TH_DOWN[0], TH_DOWN[1])));
function placeMols(t, tn) {
  const E = expand(t);
  MOLS.forEach((m, i) => {
    const d0 = MOL_IN + (m.c.y - YR + 6) * 0.035, sc = Math.max(0.001, backOut(ramp(t, d0, d0 + 0.45)));
    _p.copy(m.c).addScaledVector(m.push, E);
    const jig = (m.fixed ? 0.006 : 0.015) + 0.05 * E;
    _p.x += Math.sin(tn * (7 + 6 * E) + m.ph) * jig; _p.y += Math.cos(tn * (6 + 5 * E) + m.ph * 1.3) * jig;
    if (m.hitT !== undefined) { const k = ramp(t, m.hitT, m.hitT + 0.1) * (1 - ramp(t, m.hitT + 0.1, m.hitT + 0.9)); _p.addScaledVector(m.nrm, 0.13 * k); }
    const a = m.a + (m.fixed ? 0 : Math.sin(tn * 0.8 + m.ph) * 0.25) + E * Math.sin(tn * 3 + m.ph) * 0.5;
    _s.setScalar(sc); _m4.compose(_p, _q.identity(), _s); molO.setMatrixAt(i, _m4);
    [-1, 1].forEach((sd, k) => { const b = a + sd * HA; _m4.compose(V(_p.x + Math.cos(b) * OH * sc, _p.y + Math.sin(b) * OH * sc, _p.z + 0.02), _q, _s); molH.setMatrixAt(2 * i + k, _m4); });
  });
  molO.instanceMatrix.needsUpdate = molH.instanceMatrix.needsUpdate = true;
}
// ---------------- disegno dei nuclei di una zona
const _m4b = new THREE.Matrix4(), _cb = new THREE.Color(), _v = new THREE.Vector3();
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
      let near = 0; if (n === nC9) { const pn = npos(n9, t); if (pn) near = Math.exp(-(xy(pn, n.c) ** 2) / 0.5); }
      n.halo.position.set(n.c.x, n.c.y, n.c.z); n.halo.visible = hal > 0.001;
      n.halo.material.opacity = 0.6 * hal * (1 + 0.15 * Math.sin(tn * 5 + n.ph) + 0.8 * near); n.halo.scale.setScalar(1.25 * Math.min(zoomK, 2.2) * (1 + 0.25 * near));
    }
    if (n.hot) n.hot.forEach((s, f) => {
      s.visible = t > hit && fade > 0.001; if (!s.visible) return;
      s.position.copy(n.fragFn(f, t)).add(n.c); s.position.z += 0.15;
      s.material.opacity = fade * 0.6; s.scale.setScalar(0.9 * Math.min(zoomK, 2));
    });
    if (n.flash) { n.flash.material.opacity = t > hit ? 0.95 * Math.max(0, 1 - (t - hit) / 0.5) : 0; n.flash.scale.setScalar((2.2 + 2 * ramp(t, hit, hit + 0.5)) * Math.min(zoomK, 2.5)); }
  }
  instP.instanceMatrix.needsUpdate = instN.instanceMatrix.needsUpdate = true;
}
NEUT.forEach(n => { if (n.host) n.host.absT = tEnd(n); });
// nuclei dell'altra zona: nascosti (la camera non li vede comunque, ma così non pesano sul disegno)
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
