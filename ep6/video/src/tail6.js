// ---------------- icona del termometro (B9): sale quando il nocciolo si scalda, scende quando la reazione rallenta da sola
const icThermo = icon(0.98, 1.25, 0.4), thermo = makeThermo(icThermo.c);
const PAR = 1 - (11 - 0.2) / (11 + 0.1);
const centerIcons = () => [icThermo].forEach(ic => ic.c.position.set(-ic.g.position.x * PAR, -(ic.g.position.y - 0.2) * PAR, 0));

const composer = new EffectComposer(renderer); composer.setSize(W, H);
const worldPass = new RenderPass(scene, camera); composer.addPass(worldPass);
{ const p = new RenderPass(hud, hudCam); p.clear = false; p.clearDepth = true; composer.addPass(p); }
composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), 0.45, 0.5, 1.0));
composer.addPass(new OutputPass());
const startOverlay = mesh(new THREE.PlaneGeometry(4, 4), basic(0x2f86e6, { transparent: true, opacity: 0, depthTest: false, depthWrite: false }), hudCam, V(0, 0, -1)); startOverlay.renderOrder = 1000;
// lampo bianco della bomba: sta davanti a tutto, anche davanti alla mascotte
const flashM = basic(0xffffff, { transparent: true, opacity: 0, depthTest: false, depthWrite: false });
mesh(new THREE.PlaneGeometry(4, 4), flashM, hudCam, V(0, 0, -1)).renderOrder = 1001;

// ============================================================ TEMPI (secondi "di scaletta", bozza 1)
// B1 0,2–0,8 · B2 1,3–4,8 · B3 5,3–8,8 · B4 9,3–13,6 · B5 14,1–19,9 · B6 20,4–25,0 · B7 25,5–29,4 · B8 29,9–34,0 · B9 34,5–40,0
// centrale da 40,6: B10 40,5–44,0 · B11 44,5–46,9 · paesaggio fino a 49,4
const SPEECH = [[0.2, 0.8], [1.3, 4.8], [5.3, 5.7], [5.9, 8.8], [9.3, 13.6], [14.1, 16.3], [16.45, 19.9], [20.4, 25.0], [25.5, 29.4],
  [29.9, 34.0], [34.5, 37.0], [37.15, 40.0], [40.5, 44.0], [44.5, 45.6], [45.75, 46.9]];
const speechEnv = t => { let e = 0; for (const [a, b] of SPEECH) e = Math.max(e, Math.min(ramp(t, a, a + 0.07), 1 - ramp(t, b - 0.09, b))); return e; };
let LIP = null;   // quando arriva la voce: { open, narrow, env } a 30 fps
function lip(tn, t) {
  if (LIP) { const fi = Math.min(LIP.open.length - 1, Math.max(0, Math.round(tn * 30))); return { open: LIP.open[fi], narrow: LIP.narrow[fi], env: LIP.env[fi] }; }
  const env = speechEnv(t), syl = Math.floor(t * 5.5), u = t * 5.5 - syl;
  return { env, open: env * Math.sin(u * Math.PI) ** 0.7 * (0.55 + 0.45 * hash(syl)), narrow: env * (0.25 + 0.6 * hash(syl + 50)) };
}
const END = 49.4;
const BLINKS = []; for (let b = 3.1; b < END - 2; b += 3.3 + hash(b) * 0.8) BLINKS.push(b);
const WARP = [[0, 0], [END, END]];
function unwarp(tn) { for (let i = 0; i < WARP.length - 1; i++) { const [o0, n0] = WARP[i], [o1, n1] = WARP[i + 1]; if (tn <= n1) return o0 + (o1 - o0) * (tn - n0) / (n1 - n0); } return END; }
function fwarp(t) { for (let i = 0; i < WARP.length - 1; i++) { const [o0, n0] = WARP[i], [o1, n1] = WARP[i + 1]; if (t <= o1) return n0 + (n1 - n0) * (t - o0) / (o1 - o0); } return WARP[WARP.length - 1][1]; }
const rt = keys => keys.map(([k, v]) => [fwarp(k), v]);
window.WARP = WARP;

const SWITCH = [[5.0, 'atom', 1, 0.3], [40.6, 'world', 0.8, 0.3]];
const worldAt = t => { let w = 'world'; for (const [s, n] of SWITCH) if (t >= s) w = n; return w; };
const fadeAt = t => { let f = 0; for (const [s, , k, d] of SWITCH) f = Math.max(f, k * clamp01(1 - Math.abs(t - s) / d) ** 0.8); return f; };
const bombWhite = t => smooth(ramp(t, FLASH_UP, FLASH_FULL)) * (1 - smooth(ramp(t, CUT + 0.1, FLASH_DOWN)));
const CAM_WIDE = [-1, 3.8, 11, -1, 3.0, -40], CAM_CORE = [2.95, 2.45, -33.0, 2.95, 2.34, -39.75], CAM_PUSH = [2.95, 2.34, -38.8, 2.95, 2.34, -39.75];
const CAM_W = track(rt([[1.4, CAM_WIDE], [4.3, CAM_CORE], [5.05, CAM_PUSH], [40.6, CAM_PUSH], [41.5, CAM_CORE], [43.4, CAM_WIDE]]));
const DOME = track(rt([[1.6, 1], [2.8, 0.1], [41.9, 0.1], [42.9, 1]]));
const view = (x, y, z) => [x, y, z, x, y];
const ATOM_TRACK = track(rt([[5.0, view(0, 0.3, 50)], [9.0, view(0, 0.3, 44)], [11.8, view(0, 0.3, 16)], [15.4, view(0, 0.3, 15)], [18.8, view(0, 0.3, 30)],
  [CUT - 0.02, view(0, 0.3, 31)], [CUT, view(XR, YR - 0.6, 26)], [22.8, view(XR, YR - 0.8, 17)], [29.5, view(XR - 0.15, YR - 0.7, 16.5)], [34.2, view(XR + 0.1, YR - 0.9, 16.5)], [40.0, view(XR + 0.1, YR - 0.8, 17.5)]]));
const atomCamAt = tn => { const t = unwarp(tn); if (t < CUT) { const c = ATOM_TRACK(Math.min(tn, fwarp(CUT - 0.02))); return c; } return ATOM_TRACK(Math.max(tn, fwarp(CUT))); };
const ATOM_TOP = [new THREE.Color(0x24305e), new THREE.Color(0x120f2a)], ATOM_HOT = [new THREE.Color(0x4a3466), new THREE.Color(0x2a1430)];
// mascotte
const CORNER = [0.82, -0.99, 0.17];
const R0 = [1.2, -0.3, 0.35], WAVE = [1.32, 0.8, 0.3], POINT = [1.62, 0.32, 0.3];
const T_ = {
  pos: track([[0, [0, 0.2, 0.8]], [0.92, [0, 0.2, 0.8]], [1.45, CORNER]]),
  smile: track([[0, 1], [1.4, 0.95], [5.2, 0.8], [5.4, 0.55], [8.6, 0.55], [9.0, 0.8], [18.6, 0.8], [19.0, 0.2], [21.0, 0.2], [21.6, 0.8], [36.0, 0.8], [36.4, 0.45], [38.8, 0.45], [39.4, 0.9], [END, 1]]),
  browY: track([[0, 0.1], [1.4, 0.07], [5.2, 0.07], [5.4, 0.15], [8.6, 0.15], [9.0, 0.07], [18.6, 0.07], [19.0, 0.16], [21.0, 0.16], [21.6, 0.07], [36.0, 0.07], [36.4, 0.13], [38.8, 0.13], [39.4, 0.08], [END, 0.09]]),
  gaze: track([[0, [0, 0]], [1.3, [0, 0]], [1.8, [-0.6, 0.6]], [34.6, [-0.6, 0.6]], [35.0, [-0.85, 0.9]], [36.4, [-0.85, 0.9]], [36.8, [-0.6, 0.6]], [44.6, [-0.6, 0.6]], [45.0, [0, 0]], [45.6, [0, 0]], [45.9, [0.85, 0.25]], [46.8, [0.85, 0.25]], [47.1, [0, 0]], [END, [0, 0]]]),
  handR: track([[0, R0], [0.12, WAVE], [0.9, WAVE], [1.35, R0], [45.5, R0], [45.9, POINT], [46.8, POINT], [47.1, R0], [47.3, WAVE], [END, WAVE]]),
};
const EXIT = 47.9;
window.renderFrame = function (tn) {
  const t = unwarp(tn);
  const where = worldAt(t);
  fadeMat.opacity = fadeAt(t);
  flashM.opacity = bombWhite(t);
  // ---------------- MONDO 1: centrale
  if (where === 'world') {
    worldPass.scene = scene; worldPass.camera = camera;
    const c = CAM_W(tn);
    camera.position.set(c[0] + Math.sin(tn * 0.21) * 0.1, c[1] + Math.sin(tn * 0.17) * 0.05, c[2]); camera.lookAt(c[3], c[4], c[5]);
    clouds.forEach((cl, i) => { cl.position.x = cl.userData.x + Math.sin(tn * 0.05 + i) * 0.8 + tn * 0.02; });
    for (const m of puffs) {
      const d = m.userData, ph = (tn * 0.085 + d.ph) % 1;
      m.position.set(d.x + Math.cos(d.a) * d.r * (1 + ph) + ph * ph * 2.2, d.base + ph * 6.5, d.z + Math.sin(d.a) * d.r);
      m.scale.setScalar(d.s * (0.95 + ph * 1.9)); m.material.opacity = 0.55 * Math.min(1, ph * 6) * (1 - ph);
    }
    waveFlag(tn);
    const dOp = DOME(tn); domeFront.opacity = bandFront.opacity = dOp; domeFront.depthWrite = bandFront.depthWrite = dOp > 0.99;
    coreM.emissiveIntensity = 2.3 * (1 + 0.08 * Math.sin(tn * 7)); coreGlow.material.opacity = 0.38 * (1 - dOp);
    primDrops.forEach((m, i) => { primLoop.getPointAt((i / primDrops.length + tn * 0.19) % 1, m.position); m.position.z += 0.02; });
    cableDots.forEach((d, i) => { cableCurve.getPointAt((tn * 0.42 + i / cableDots.length) % 1, d.position); });
  }
  // ---------------- MONDO 3: atomi
  if (where === 'atom') {
    worldPass.scene = atomScene; worldPass.camera = atomCam;
    const c = atomCamAt(tn); atomCam.position.set(c[0] + Math.sin(tn * 0.3) * 0.04, c[1] + Math.sin(tn * 0.23) * 0.03, c[2]); atomCam.lookAt(c[3], c[4], 0); atomCam.updateMatrixWorld();
    const zoomK = 1 + Math.max(0, atomCam.position.z - 12) / 12;
    const zone = t < CUT ? 'B' : 'R';
    hideZone(zone === 'B' ? 'R' : 'B'); placeNucs(zone, t, tn, zoomK);
    molO.visible = molH.visible = zone === 'R'; if (zone === 'R') placeMols(t, tn);
    placeNeutrons(t, zoomK);
    // B9: il fondo si scalda un po' mentre l'acqua si dilata
    const E = expand(t);
    atomBg.uniforms.top.value.copy(ATOM_TOP[0]).lerp(ATOM_HOT[0], E); atomBg.uniforms.bottom.value.copy(ATOM_TOP[1]).lerp(ATOM_HOT[1], E);
  }
  // ---------------- PRIMO PIANO: termometro
  showIcon(icThermo, pop(t, 34.6, 40.3)); thermo.set(0.35 + 0.55 * smooth(ramp(t, TH_UP[0], TH_UP[1])) - 0.45 * smooth(ramp(t, TH_DOWN[0], TH_DOWN[1])));
  // ---------------- mascotte: grande al centro per il saluto, poi piccola in basso a destra
  let [mx, my, ms] = T_.pos(t);
  ms *= backOut(ramp(t, 0.0, 0.35)) * (1 - smooth(ramp(t, EXIT - 0.25, EXIT)));
  const bob = Math.sin(tn * 1.9) * 0.07 * ms;
  mascot.position.set(mx, my + bob + smooth(ramp(t, EXIT - 0.4, EXIT)) * 0.08, 0); mascot.scale.setScalar(Math.max(0.001, ms)); mascot.visible = ms > 0.001 && t < EXIT;
  const L = lip(tn, t), env = L.env;
  const [gx, gy] = T_.gaze(t);
  head.rotation.set(-gy * 0.3 + env * Math.sin(tn * 5.2) * 0.035, gx * 0.36, Math.sin(tn * 1.1) * 0.05 + env * Math.sin(tn * 2.6) * 0.04 - gx * 0.06);
  let blink = 0; for (const b of BLINKS) blink = Math.max(blink, 1 - Math.abs(t - b) / 0.085);
  blink = clamp01(blink);
  const smile = T_.smile(t), squint = 0.1 * Math.max(0, smile - 0.6) / 0.4;
  const wide = 1 + 0.12 * smooth(ramp(t, 18.6, 19.0)) * (1 - smooth(ramp(t, 21.0, 21.6)));   // occhi più grandi davanti al lampo della bomba
  for (const e of eyes) { e.g.scale.set(1.05 * wide, 1.05 * wide * Math.max(0.07, (1 - blink) * (1 - squint)), 1); e.pupil.position.set(gx * 0.075 - e.sd * 0.018, gy * 0.085, 0); }
  const by = T_.browY(t);
  for (const b of brows) { const x = b.sd * 0.35, y = 0.535 + by + blink * -0.015; b.m.position.set(x, y, onSphere(x, y, 1.03)); b.m.rotation.set(-0.45, b.sd * 0.3, b.sd * 0.03 + b.sd * -0.06 + (by > 0.12 ? b.sd * 0.18 : 0)); }
  const open = L.open * 0.78, narrow = L.narrow * 0.32;
  setMouth((0.29 + 0.06 * Math.max(0, smile)) * (1 - narrow), smile * (1 - 0.35 * open), open);
  const hr = T_.handR(t), wave = win(t, 0.15, 1.0, 0.2) + win(t, 47.3, 47.85, 0.15), point = win(t, 45.9, 46.8, 0.25), talk = env * 0.04;
  hands[1].position.set(hr[0] + wave * Math.sin(t * 13) * 0.2 + point * Math.abs(Math.sin(t * 6.5)) * 0.1, hr[1] + Math.sin(tn * 2.3) * 0.03 + talk * Math.sin(tn * 6.1) + bob * 0.3, hr[2]);
  hands[0].position.set(-R0[0], R0[1] + Math.sin(tn * 2.3 + 1.7) * 0.03 + talk * Math.sin(tn * 5.3 + 2) + bob * 0.3, R0[2]);
  centerIcons();
  startOverlay.material.opacity = 1 - ramp(t, 0, 0.3);
  composer.render();
};
window.DURATION = WARP[WARP.length - 1][1];
window.renderFrame(0);
window.ready = true;
