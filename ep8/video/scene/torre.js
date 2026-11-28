// Puntata 8 — TORRE DI RAFFREDDAMENTO a tiraggio naturale, con l'interno che si vede quando la metà davanti diventa trasparente:
//   - in basso le colonnine a X (le aperture da cui entra l'aria) e la vasca dove si raccoglie l'acqua raffreddata;
//   - il riempimento (lamelle su cui l'acqua si sparpaglia), i tubi di distribuzione con gli ugelli;
//   - la pioggia: calda (arancio chiaro) dagli ugelli, poi sempre più blu man mano che scende;
//   - frecce d'aria fresca che entrano dal basso e salgono; filini di vapore quasi invisibili che salgono dentro;
//   - in cima il pennacchio (fumo.js) che diventa bianco appena esce.
//
// const T = creaTorre(parent, { x, y, z, s, interno, seme })
//   T.aggiorna(tn, { apre, pioggia, aria, vapore, pennacchio, fresca, vento })
//   T.pos(u, v) → punto del mondo: utile per le camere (u = altezza 0..1)
import { THREE, V, std, basic, mesh, bar, glow, clamp01, smooth, ramp, hash, setSeed, rnd, pipeCurve, tube, lerp } from '/comune/base.js';
import { creaPennacchio, TRAME } from './fumo.js';
import { acquaMat } from './acqua8.js';

export const H = 8, BASE = 0.62;
export const raggio = y => 1.45 * Math.sqrt(1 + ((y - 5.6) / 3.3) ** 2);

function guscio(y0, y1, phi0, phiL, mat, parent, dr = 0) {
  const pts = []; for (let i = 0; i <= 40; i++) { const y = y0 + (y1 - y0) * i / 40; pts.push(new THREE.Vector2(raggio(y) + dr, y)); }
  const geo = new THREE.LatheGeometry(pts, 72, phi0, phiL);
  // colori: un po' più scuro e macchiato in basso, strisce verticali di colature leggere
  const P = geo.attributes.position, C = new Float32Array(P.count * 3);
  for (let i = 0; i < P.count; i++) {
    const y = P.getY(i), a = Math.atan2(P.getX(i), P.getZ(i)), u = (y - y0) / (y1 - y0 || 1);
    const streak = 0.035 * Math.max(0, Math.sin(a * 23 + 1.3) * Math.sin(a * 7.1)) * (1 - u * 0.6);
    const k = lerp(0.86, 1.0, Math.pow(clamp01(u * 1.3), 0.6)) - streak;
    C[i * 3] = k * 0.985; C[i * 3 + 1] = k * 0.99; C[i * 3 + 2] = k;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(C, 3));
  return mesh(geo, mat, parent);
}

export function creaTorre(parent, o = {}) {
  const { x = 0, y = 0, z = 0, s = 1, interno = false, seme = 1, pennacchio = {} } = o;
  setSeed(3100 + seme * 7);
  const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s); parent.add(g);
  const wallM = std(0xffffff, { vertexColors: true, roughness: 0.92, side: THREE.DoubleSide, emissive: 0xc8d4e4, emissiveIntensity: 0.12 });
  const frontM = std(0xffffff, { vertexColors: true, roughness: 0.92, transparent: true, opacity: 1, emissive: 0xc8d4e4, emissiveIntensity: 0.12 });
  const inM = std(0xe4eaf2, { roughness: 0.95, side: THREE.BackSide, emissive: 0x9fb0c8, emissiveIntensity: 0.3 });
  const redM = std(0xe8604a, { roughness: 0.8 }), redF = std(0xe8604a, { roughness: 0.8, transparent: true, opacity: 1 });
  const PI = Math.PI;
  // guscio: dietro sempre pieno, davanti apribile
  guscio(BASE, H, PI / 2, PI, wallM, g);
  const front = interno ? guscio(BASE, H, -PI / 2, PI, frontM, g) : guscio(BASE, H, -PI / 2, PI, wallM, g);
  front.renderOrder = 6;
  // fasce rosse in alto (davanti apribile) e bordo superiore
  guscio(7.25, 7.7, PI / 2, PI, redM, g, 0.02);
  const redFront = guscio(7.25, 7.7, -PI / 2, PI, interno ? redF : redM, g, 0.02); redFront.renderOrder = 6;
  mesh(new THREE.TorusGeometry(raggio(H) + 0.01, 0.06, 10, 72), std(0xdfe4ec, { roughness: 0.8 }), g, V(0, H, 0)).rotation.x = PI / 2;
  // anello di base su cui poggia il guscio
  mesh(new THREE.TorusGeometry(raggio(BASE), 0.07, 10, 72), std(0xd5dbe4, { roughness: 0.9 }), g, V(0, BASE, 0)).rotation.x = PI / 2;
  // colonnine a X
  const colM = std(0xcfd6e0, { roughness: 0.85 });
  const NC = 36, RB = raggio(BASE);
  for (let i = 0; i < NC; i++) {
    const a0 = i / NC * PI * 2, a1 = (i + 1) / NC * PI * 2;
    const p = (a, yy) => V(Math.sin(a) * RB, yy, Math.cos(a) * RB);
    bar(p(a0, 0.02), p(a1, BASE), 0.035, colM, g); bar(p(a1, 0.02), p(a0, BASE), 0.035, colM, g);
  }
  // vasca: muretto, acqua
  mesh(new THREE.CylinderGeometry(RB + 0.32, RB + 0.36, 0.26, 72, 1, true), std(0xbfc8d4, { roughness: 0.95, side: THREE.DoubleSide }), g, V(0, 0.1, 0));
  mesh(new THREE.TorusGeometry(RB + 0.34, 0.05, 8, 72), std(0xd8dee8), g, V(0, 0.23, 0)).rotation.x = PI / 2;
  const vascaM = acquaMat({ fondo: 0x2f7fd0, chiaro: 0x7fc8f4, op: 1, scala: 2.2, caldo: 0xffc890 });
  const vasca = mesh(new THREE.CircleGeometry(RB + 0.33, 72), vascaM, g, V(0, 0.16, 0)); vasca.rotation.x = -PI / 2;
  vascaM.uniforms.uCaldo.value.set(0, 0, 0); vascaM.uniforms.uCaldoR.value = 2.2;

  const T = { g, vasca: vascaM };
  if (interno) {
    // superficie interna (si vede solo da dentro)
    const ipts = []; for (let i = 0; i <= 30; i++) { const yy = BASE + (H - BASE) * i / 30; ipts.push(new THREE.Vector2(raggio(yy) - 0.03, yy)); }
    mesh(new THREE.LatheGeometry(ipts, 72, PI / 2, PI), inM, g);
    const inner = new THREE.Group(); g.add(inner); inner.visible = false; T.inner = inner;
    // riempimento: tre strati di lamelle incrociate
    const FY0 = 0.82, FY1 = 1.22, RF = raggio(1.0) - 0.08;
    const slatM = std(0xa9bfd8, { roughness: 0.7 });
    const slats = [];
    for (let L = 0; L < 3; L++) for (let k = -14; k <= 14; k++) {
      const c = k * 0.19, half = Math.sqrt(Math.max(0, RF * RF - c * c)); if (half < 0.2) continue;
      slats.push([L, c, half]);
    }
    const sg = new THREE.BoxGeometry(1, 1, 1), sl = new THREE.InstancedMesh(sg, slatM, slats.length), M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), S3 = new THREE.Vector3();
    slats.forEach(([L, c, half], i) => {
      const yy = FY0 + 0.05 + L * 0.15, along = half * 2;
      if (L % 2) { Q.setFromAxisAngle(V(0, 1, 0), PI / 2); M4.compose(V(c, yy, 0), Q, S3.set(0.035, 0.1, along)); }
      else { Q.identity(); M4.compose(V(c, yy, 0), Q, S3.set(0.035, 0.1, along)); }
      sl.setMatrixAt(i, M4);
    });
    inner.add(sl);
    // distribuzione dell'acqua calda: anello, quattro bracci, ugelli
    const pipeM = std(0xe0863a, { roughness: 0.45, metalness: 0.2, emissive: 0xff6a20, emissiveIntensity: 0.25 });
    const HY = 1.62, RR = RF * 0.62;
    mesh(new THREE.TorusGeometry(RR, 0.05, 10, 64), pipeM, inner, V(0, HY, 0)).rotation.x = PI / 2;
    for (let k = 0; k < 4; k++) { const a = k * PI / 2 + PI / 4; bar(V(0, HY, 0), V(Math.sin(a) * RF * 0.95, HY, Math.cos(a) * RF * 0.95), 0.045, pipeM, inner); }
    const NOZ = [];
    for (let k = 0; k < 4; k++) { const a = k * PI / 2 + PI / 4; for (let j = 1; j <= 4; j++) NOZ.push([Math.sin(a) * RF * 0.95 * j / 4.3, Math.cos(a) * RF * 0.95 * j / 4.3]); }
    for (let k = 0; k < 16; k++) { const a = k / 16 * PI * 2; NOZ.push([Math.sin(a) * RR, Math.cos(a) * RR]); }
    NOZ.forEach(([nx, nz]) => { const c = mesh(new THREE.ConeGeometry(0.05, 0.09, 10), pipeM, inner, V(nx, HY - 0.07, nz)); c.rotation.x = PI; });
    // tubo che porta su l'acqua calda dal fondo (riser), dal lato della sala turbine
    const riser = mesh(new THREE.CylinderGeometry(0.11, 0.11, HY - 0.05, 16), pipeM, inner, V(0, (HY + 0.05) / 2, 0));
    // pioggia
    const N = 380, dropGeo = new THREE.CapsuleGeometry(0.02, 0.08, 3, 6), dropM = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const drops = new THREE.InstancedMesh(dropGeo, dropM, N); inner.add(drops);
    const dd = Array.from({ length: N }, (_, i) => {
      const a = rnd() * PI * 2, r = Math.sqrt(rnd()) * RF * 0.97;
      return { x: Math.sin(a) * r, z: Math.cos(a) * r, ph: rnd(), sp: 0.85 + rnd() * 0.3 };
    });
    const HOT = new THREE.Color(0xffa860), MID = new THREE.Color(0xd9c9b8), COLD = new THREE.Color(0x3f9be8), tmpC = new THREE.Color();
    for (let i = 0; i < N; i++) drops.setColorAt(i, HOT);
    // aria: frecce che entrano dalle aperture e salgono
    const arrowM = new THREE.MeshBasicMaterial({ color: 0xbfe9ff, transparent: true, opacity: 0, depthWrite: false });
    const arrowG = () => { const a = new THREE.Group(); const c = mesh(new THREE.ConeGeometry(0.13, 0.26, 12), arrowM, a, V(0, 0.13, 0)); const b = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.34, 10), arrowM, a, V(0, -0.15, 0)); c.renderOrder = b.renderOrder = 7; inner.add(a); return a; };
    const PATHS = [-1.25, -0.75, -0.3, 0.3, 0.75, 1.25].map(a => pipeCurve([V(Math.sin(a) * 4.6, 0.3, Math.cos(a) * 4.6), V(Math.sin(a) * 3.0, 0.32, Math.cos(a) * 3.0), V(Math.sin(a) * 1.9, 0.45, Math.cos(a) * 1.9), V(Math.sin(a) * 1.3, 1.1, Math.cos(a) * 1.3), V(Math.sin(a) * 1.05, 2.4, Math.cos(a) * 1.05), V(Math.sin(a) * 0.95, 4.6, Math.cos(a) * 0.95)]));
    const arrows = []; PATHS.forEach((c, pi) => { for (let k = 0; k < 3; k++) arrows.push({ a: arrowG(), c, ph: k / 3 + pi * 0.11 }); });
    // filini di vapore dentro (quasi invisibili)
    const wisps = Array.from({ length: 26 }, (_, i) => { const m = new THREE.SpriteMaterial({ map: TRAME[i % 4], color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }); const s = new THREE.Sprite(m); inner.add(s); s.userData = { a: rnd() * 6.28, r: rnd() * 1.1, ph: rnd() }; return s; });
    const UP = V(0, 1, 0), tg = new THREE.Vector3();
    T.aggiornaInterno = (tn, st) => {
      inner.visible = st.apre < 0.97;
      if (!inner.visible) return;
      const vis = 1 - st.apre;
      // pioggia: da HY a FY1 calda, dentro il riempimento rallenta, poi da FY0 alla vasca sempre più blu
      for (let i = 0; i < N; i++) {
        const d = dd[i], ph = (tn * 0.55 * d.sp + d.ph) % 1;
        let yy, k;
        if (ph < 0.25) { yy = lerp(HY - 0.1, FY1, ph / 0.25); k = 0; }
        else if (ph < 0.45) { yy = lerp(FY1, FY0, (ph - 0.25) / 0.2); k = 0.3 * (ph - 0.25) / 0.2; }
        else { yy = lerp(FY0, 0.18, (ph - 0.45) / 0.55); k = 0.3 + 0.7 * (ph - 0.45) / 0.55; }
        const on = st.pioggia > (hash(i * 1.37) * 0.9 + 0.05) ? 1 : 0;
        Q.identity(); M4.compose(V(d.x + Math.sin(i + tn) * 0.01, yy, d.z), Q, S3.setScalar(on ? 1 : 0.0001));
        drops.setMatrixAt(i, M4);
        tmpC.copy(HOT).lerp(MID, Math.min(1, k * 2)); if (k > 0.5) tmpC.copy(MID).lerp(COLD, (k - 0.5) * 2);
        tmpC.lerp(COLD, st.fresca * 0.0);
        drops.setColorAt(i, tmpC);
      }
      drops.instanceMatrix.needsUpdate = true; drops.instanceColor.needsUpdate = true;
      arrowM.opacity = 0.75 * st.aria * vis;
      for (const ar of arrows) {
        const u = (tn * 0.16 + ar.ph) % 1; ar.c.getPointAt(u, ar.a.position); ar.c.getTangentAt(u, tg);
        ar.a.quaternion.setFromUnitVectors(UP, tg); const sc = Math.sin(u * PI) ** 0.5; ar.a.scale.setScalar(Math.max(0.001, sc));
        ar.a.visible = st.aria > 0.01;
      }
      for (const w of wisps) {
        const d = w.userData, ph = (tn * 0.13 + d.ph) % 1;
        w.position.set(Math.cos(d.a) * d.r * (1 - ph * 0.4), lerp(1.3, H - 0.2, ph), Math.sin(d.a) * d.r * (1 - ph * 0.4));
        w.scale.setScalar(0.5 + ph * 0.9);
        w.material.opacity = 0.16 * st.vapore * vis * Math.sin(ph * PI);
      }
    };
  }
  const plume = creaPennacchio(g, { r: raggio(H) * 0.9, n: 70, sale: 13, vento: [4.5, -1.2], vita: 13, seme, inizioOp: 0.03, ...pennacchio });
  plume.g.position.y = H - 0.15;
  T.aggiorna = (tn, st = {}) => {
    const s0 = { apre: 1, pioggia: 0, aria: 0, vapore: 0, pennacchio: 1, fresca: 0, vento: 1, ...st };
    if (interno) {
      frontM.opacity = redF.opacity = s0.apre; frontM.depthWrite = redF.depthWrite = s0.apre > 0.99;
      T.aggiornaInterno(tn, s0);
    }
    vascaM.uniforms.uT.value = tn;
    vascaM.uniforms.uCaldoK.value = (1 - s0.fresca) * 0.6;
    plume.aggiorna(tn, s0.pennacchio, s0.vento);
  };
  return T;
}
