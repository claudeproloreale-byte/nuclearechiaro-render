// Libreria comune — il PALCO: disegnatore, primo piano (mascotte e icone, camera fissa) sopra il mondo di sfondo,
// bagliore (bloom), dissolvenza dal blu all'inizio e lampo bianco a tutto schermo (davanti anche alla mascotte).
//
// const { hud, hudCam } = creaPrimoPiano();
// const renderer = creaRenderer();                  (da creare per primo)
// const P = creaPalco(renderer, hud, hudCam, scena, camera)    scena e camera del primo mondo inquadrato
//   P.mondo(scena, camera)     cambia il mondo di sfondo
//   P.inizio.opacity           dissolvenza dal blu dell'apertura (1 → 0)
//   P.lampo.opacity            lampo bianco a tutto schermo (0..1)
//   P.render()
import { THREE, W, H, V, basic, mesh } from './base.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export function creaRenderer() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H);
  document.body.appendChild(renderer.domElement);
  return renderer;
}

export function creaPrimoPiano() {
  const hud = new THREE.Scene();
  const hudCam = new THREE.PerspectiveCamera(30, W / H, 0.1, 100); hudCam.position.set(0, 0.2, 11); hudCam.lookAt(0, 0.2, 0); hud.add(hudCam);
  hud.add(new THREE.HemisphereLight(0xcfe6ff, 0x4a6a4a, 1.32));
  { const s = new THREE.DirectionalLight(0xfff3de, 2.45); s.position.set(8, 14, 12); hud.add(s);
    const key = new THREE.PointLight(0xffffff, 30); key.position.set(3, 4, 9); hud.add(key);
    const fill = new THREE.PointLight(0x9fc8ff, 30); fill.position.set(-5, -1, 7); hud.add(fill); }
  return { hud, hudCam };
}

export function creaPalco(renderer, hud, hudCam, scene, camera) {
  const composer = new EffectComposer(renderer); composer.setSize(W, H);
  const worldPass = new RenderPass(scene, camera); composer.addPass(worldPass);
  { const p = new RenderPass(hud, hudCam); p.clear = false; p.clearDepth = true; composer.addPass(p); }
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), 0.45, 0.5, 1.0));
  composer.addPass(new OutputPass());
  const startOverlay = mesh(new THREE.PlaneGeometry(4, 4), basic(0x2f86e6, { transparent: true, opacity: 0, depthTest: false, depthWrite: false }), hudCam, V(0, 0, -1)); startOverlay.renderOrder = 1000;
  const flashM = basic(0xffffff, { transparent: true, opacity: 0, depthTest: false, depthWrite: false });
  mesh(new THREE.PlaneGeometry(4, 4), flashM, hudCam, V(0, 0, -1)).renderOrder = 1001;
  return {
    mondo(s, c) { worldPass.scene = s; worldPass.camera = c; },
    inizio: startOverlay.material, lampo: flashM,
    render: () => composer.render(),
  };
}
