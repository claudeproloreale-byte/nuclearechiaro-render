// Puntata 8 — materiale dell'ACQUA (mare, fiume, vasca della torre): increspature che si muovono, riflessi di sole,
// e una macchia d'acqua appena più tiepida (più chiara) dove la centrale restituisce l'acqua di raffreddamento.
// Coordinate dell'oggetto (non del mondo): la collina ruota, la macchia resta attaccata al suo posto.
//
// const a = acquaMat({ fondo, chiaro, op, scala, flusso: [x, z] })
//   a.uniforms.uT.value = tn;  a.uniforms.uCaldo.value = [x, y, z] (oggetto), uCaldoK (0..1), uCaldoR (raggio)
import { THREE } from '/comune/base.js';

export function acquaMat(o = {}) {
  const { fondo = 0x1f6fc8, chiaro = 0x5fb8f0, op = 0.86, scala = 1, flusso = [0, 0], caldo = 0x9ff0ff } = o;
  return new THREE.ShaderMaterial({
    transparent: op < 1, depthWrite: op >= 1,
    uniforms: {
      uT: { value: 0 }, uFondo: { value: new THREE.Color(fondo) }, uChiaro: { value: new THREE.Color(chiaro) }, uOp: { value: op },
      uScala: { value: scala }, uFlusso: { value: new THREE.Vector2(...flusso) },
      uCaldo: { value: new THREE.Vector3(0, 0, 0) }, uCaldoK: { value: 0 }, uCaldoR: { value: 1 }, uCaldoCol: { value: new THREE.Color(caldo) },
      uLuce: { value: 1 },
    },
    vertexShader: `varying vec3 vP; varying vec3 vN; varying vec3 vW;
      void main(){ vP = position; vN = normalize(normalMatrix * normal); vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float uT; uniform vec3 uFondo; uniform vec3 uChiaro; uniform float uOp; uniform float uScala; uniform vec2 uFlusso;
      uniform vec3 uCaldo; uniform float uCaldoK; uniform float uCaldoR; uniform vec3 uCaldoCol; uniform float uLuce;
      varying vec3 vP; varying vec3 vN; varying vec3 vW;
      void main(){
        vec2 p = vec2(vP.x, vP.z) * uScala - uFlusso * uT;
        float w1 = sin(p.x * 3.1 + p.y * 1.7 + uT * 1.3);
        float w2 = sin(p.x * -1.9 + p.y * 3.7 + uT * 1.7 + 1.3);
        float w3 = sin(p.x * 6.3 - p.y * 5.1 + uT * 2.3 + 0.7);
        float h = (w1 + w2) * 0.5 + w3 * 0.25;
        vec3 c = mix(uFondo, uChiaro, 0.35 + 0.22 * h);
        float spark = pow(max(0.0, w1 * w2 * w3), 6.0);
        c += vec3(1.0) * spark * 0.55;
        float bordo = 0.0;
        float d = length(vP - uCaldo);
        float k = uCaldoK * exp(-d * d / (uCaldoR * uCaldoR));
        float swirl = 0.75 + 0.25 * sin(d * 9.0 - uT * 2.5 + w2);
        c = mix(c, uCaldoCol, clamp(k * swirl, 0.0, 0.85));
        c *= uLuce;
        gl_FragColor = vec4(c, uOp);
        #include <colorspace_fragment>
      }`,
  });
}
