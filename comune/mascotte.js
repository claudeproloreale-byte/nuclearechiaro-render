// Libreria comune — la MASCOTTE (il neutrone che parla) e il suo labiale. Aspetto: regole.md, "Mascotte".
//
// const M = creaMascotte(hud);         hud = scena del primo piano (palco.js)
// M.update(tn, t, s) a ogni fotogramma, con s = {
//   pos: [x, y, scala],  lift (spostamento in alto, es. all'uscita),  visible,
//   lip: { open, narrow, env } (da creaLabiale),  gaze: [x, y] (sguardo),  blink (0..1, da blinkAt),
//   smile (0..1),  browY (sopracciglia: 0,07 normali, oltre 0,12 decise),  wide (occhi più grandi, 1 = normali),
//   handR: [x, y, z] mano destra,  wave (saluto 0..1),  point (indica a destra 0..1) }
// Pose della mano: R0 a riposo, WAVE saluto, POINT verso i commenti. CORNER = mascotte "in angolo" [x, y, scala].
import { THREE, V, ramp, lerp, hash, std, basic, mesh, glowTex } from './base.js';

export const CORNER = [0.82, -0.99, 0.17];
export const R0 = [1.2, -0.3, 0.35], WAVE = [1.32, 0.8, 0.3], POINT = [1.62, 0.32, 0.3];

export function creaMascotte(hud) {
  const mascot = new THREE.Group(); hud.add(mascot);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x7cc4ff, transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.scale.setScalar(4.4); halo.position.z = -0.8; mascot.add(halo);
  const head = new THREE.Group(); mascot.add(head);
  const bodyM = new THREE.MeshStandardMaterial({ color: 0x58b0ff, roughness: 0.6, metalness: 0.0, emissive: 0x1c5fb8, emissiveIntensity: 0.35 });
  mesh(new THREE.SphereGeometry(1, 64, 48), bodyM, head);
  const onSphere = (x, y, r = 1) => Math.sqrt(Math.max(0.01, r * r - x * x - y * y));
  const Z = V(0, 0, 1);
  const whiteM = new THREE.MeshStandardMaterial({ color: 0xdfe4ee, roughness: 1.0, emissive: 0xffffff, emissiveIntensity: 0.1 });
  const darkM = std(0x14203c, { roughness: 0.3 });
  const eyes = [-1, 1].map(sd => {
    const g = new THREE.Group(); const x = sd * 0.34, y = 0.2;
    g.position.set(x, y, onSphere(x, y) - 0.05);
    g.quaternion.setFromUnitVectors(Z, V(x * 0.55, y * 0.55, 1).normalize());
    head.add(g);
    const ball = mesh(new THREE.SphereGeometry(0.25, 32, 24), whiteM, g); ball.scale.set(1, 1.18, 0.42);
    const pupil = new THREE.Group(); g.add(pupil);
    const p = mesh(new THREE.SphereGeometry(0.135, 24, 18), darkM, pupil, V(0, 0, 0.075)); p.scale.set(1, 1.1, 0.4);
    mesh(new THREE.SphereGeometry(0.045, 12, 10), basic(0xffffff), pupil, V(0.05, 0.06, 0.125));
    mesh(new THREE.SphereGeometry(0.022, 10, 8), basic(0xffffff), pupil, V(-0.04, -0.05, 0.12));
    return { g, pupil, sd };
  });
  const brows = [-1, 1].map(sd => { const m = mesh(new THREE.CapsuleGeometry(0.04, 0.22, 6, 12), darkM, head); m.geometry.rotateZ(Math.PI / 2); return { m, sd }; });
  const cheekM = new THREE.MeshStandardMaterial({ color: 0xff8fa8, roughness: 0.6, transparent: true, opacity: 0.75 });
  [-1, 1].forEach(sd => {
    const x = sd * 0.62, y = -0.12; const c = mesh(new THREE.SphereGeometry(0.13, 20, 14), cheekM, head, V(x, y, onSphere(x, y) - 0.005));
    c.quaternion.setFromUnitVectors(Z, V(x, y, onSphere(x, y)).normalize()); c.scale.set(1, 0.75, 0.12);
  });
  // bocca e lingua: griglia appoggiata sulla sfera, deformata da larghezza, sorriso e apertura
  const MX = 28, MY = 6;
  const mouthGeo = new THREE.BufferGeometry();
  mouthGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((MX + 1) * (MY + 1) * 3), 3));
  { const idx = []; for (let i = 0; i < MX; i++) for (let j = 0; j < MY; j++) { const a = i * (MY + 1) + j, b = a + MY + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); } mouthGeo.setIndex(idx); }
  const mouth = new THREE.Mesh(mouthGeo, basic(0x4a1024, { side: THREE.DoubleSide })); mouth.frustumCulled = false; head.add(mouth);
  const tongueGeo = mouthGeo.clone();
  const tongue = new THREE.Mesh(tongueGeo, basic(0xff7088, { side: THREE.DoubleSide })); tongue.frustumCulled = false; head.add(tongue);
  function setMouth(w, s, o) {
    const cy = -0.36, th = 0.024;
    const P = mouthGeo.attributes.position.array, Tg = tongueGeo.attributes.position.array;
    for (let i = 0; i <= MX; i++) {
      const u = i / MX * 2 - 1, x = u * w, k = 1 - u * u;
      const yb = cy + s * 0.13 * u * u - s * 0.05;
      const yu = yb + (th + o * 0.045) * k, yl = yb - (th + o * 0.36) * Math.pow(k, 0.75);
      for (let j = 0; j <= MY; j++) {
        const y = lerp(yl, yu, j / MY), n = (i * (MY + 1) + j) * 3;
        P[n] = x; P[n + 1] = y; P[n + 2] = onSphere(x, y, 1.012);
        const ty = lerp(yl, lerp(yl, yu, 0.42), j / MY), tx = x * 0.62;
        Tg[n] = tx; Tg[n + 1] = ty; Tg[n + 2] = onSphere(tx, ty, 1.016);
      }
    }
    mouthGeo.attributes.position.needsUpdate = true; tongueGeo.attributes.position.needsUpdate = true;
    tongue.visible = o > 0.3;
  }
  const hands = [-1, 1].map(() => mesh(new THREE.SphereGeometry(0.2, 24, 18), bodyM, mascot));

  function update(tn, t, s) {
    const [mx, my, ms] = s.pos;
    const bob = Math.sin(tn * 1.9) * 0.07 * ms;
    mascot.position.set(mx, my + bob + (s.lift || 0), 0); mascot.scale.setScalar(Math.max(0.001, ms)); mascot.visible = s.visible;
    const L = s.lip, env = L.env;
    const [gx, gy] = s.gaze;
    head.rotation.set(-gy * 0.3 + env * Math.sin(tn * 5.2) * 0.035, gx * 0.36, Math.sin(tn * 1.1) * 0.05 + env * Math.sin(tn * 2.6) * 0.04 - gx * 0.06);
    const blink = s.blink;
    const smile = s.smile, squint = 0.1 * Math.max(0, smile - 0.6) / 0.4;
    const wide = s.wide;
    for (const e of eyes) { e.g.scale.set(1.05 * wide, 1.05 * wide * Math.max(0.07, (1 - blink) * (1 - squint)), 1); e.pupil.position.set(gx * 0.075 - e.sd * 0.018, gy * 0.085, 0); }
    const by = s.browY;
    for (const b of brows) { const x = b.sd * 0.35, y = 0.535 + by + blink * -0.015; b.m.position.set(x, y, onSphere(x, y, 1.03)); b.m.rotation.set(-0.45, b.sd * 0.3, b.sd * 0.03 + b.sd * -0.06 + (by > 0.12 ? b.sd * 0.18 : 0)); }
    const open = L.open * 0.78, narrow = L.narrow * 0.32;
    setMouth((0.29 + 0.06 * Math.max(0, smile)) * (1 - narrow), smile * (1 - 0.35 * open), open);
    const hr = s.handR, wave = s.wave, point = s.point, talk = env * 0.04;
    hands[1].position.set(hr[0] + wave * Math.sin(t * 13) * 0.2 + point * Math.abs(Math.sin(t * 6.5)) * 0.1, hr[1] + Math.sin(tn * 2.3) * 0.03 + talk * Math.sin(tn * 6.1) + bob * 0.3, hr[2]);
    hands[0].position.set(-R0[0], R0[1] + Math.sin(tn * 2.3 + 1.7) * 0.03 + talk * Math.sin(tn * 5.3 + 2) + bob * 0.3, R0[2]);
  }
  return { group: mascot, update };
}

// labiale: SPEECH = [[inizio, fine], ...] delle frasi (tempi di scaletta). Finché non c'è la voce è simulato (5,5 sillabe al secondo);
// con la voce si passa LIP = { open, narrow, env } a 30 fps, letto con il tempo del video tn.
export function creaLabiale(SPEECH, LIP = null) {
  const speechEnv = t => { let e = 0; for (const [a, b] of SPEECH) e = Math.max(e, Math.min(ramp(t, a, a + 0.07), 1 - ramp(t, b - 0.09, b))); return e; };
  return (tn, t) => {
    if (LIP) { const fi = Math.min(LIP.open.length - 1, Math.max(0, Math.round(tn * 30))); return { open: LIP.open[fi], narrow: LIP.narrow[fi], env: LIP.env[fi] }; }
    const env = speechEnv(t), syl = Math.floor(t * 5.5), u = t * 5.5 - syl;
    return { env, open: env * Math.sin(u * Math.PI) ** 0.7 * (0.55 + 0.45 * hash(syl)), narrow: env * (0.25 + 0.6 * hash(syl + 50)) };
  };
}
// battiti di ciglia: uno ogni 3,3–4,1 s dal secondo 3,1 fino a 2 s dalla fine
export function creaBlink(END) {
  const BLINKS = []; for (let b = 3.1; b < END - 2; b += 3.3 + hash(b) * 0.8) BLINKS.push(b);
  return t => { let blink = 0; for (const b of BLINKS) blink = Math.max(blink, 1 - Math.abs(t - b) / 0.085); return Math.min(1, Math.max(0, blink)); };
}
