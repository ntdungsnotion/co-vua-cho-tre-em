// plasma-skill.js — Hiệu ứng "tụ cầu lửa -> phóng beam -> nổ trúng đích" cho Three.js
// Không cần texture/ảnh/video: toàn bộ vẽ bằng shader. Cần three r150+.
import * as THREE from 'three';

/* ------------------------------------------------------------------ */
/* GLSL                                                                */
/* ------------------------------------------------------------------ */
const VERT = `varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const HEAD = `varying vec2 vUv;\n`;

const COMMON = `
uniform float uTime;
uniform float uHue;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p){
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 4; i++){ s += a * noise(p); p = p * 2.03 + vec2(17.1, 9.2); a *= 0.5; }
  return s;
}
vec3 hueShift(vec3 c, float a){
  const vec3 k = vec3(0.57735);
  float ca = cos(a), sa = sin(a);
  return c * ca + cross(k, c) * sa + k * dot(k, c) * (1.0 - ca);
}
`;

// Quả cầu lửa: lõi trắng nóng, thân cam xoáy, viền sáng, quầng
const SPHERE_FRAG = `
uniform float uAlpha;
uniform float uPower;
void main(){
  vec2 p = (vUv - 0.5) * 2.0;
  float r = length(p);
  float sw = uTime * 0.9 + r * 2.5;
  mat2 R = mat2(cos(sw), -sin(sw), sin(sw), cos(sw));
  vec2 q = R * p;
  float n  = fbm(q * 2.6 + vec2(uTime * 0.5, 0.0));
  float n2 = fbm(q * 5.0 - vec2(0.0, uTime * 0.8));
  float body = 1.0 - smoothstep(0.50, 0.80, r);
  vec3 fire = mix(vec3(0.95, 0.22, 0.03), vec3(1.0, 0.62, 0.14), n);
  fire = mix(fire, vec3(1.0, 0.9, 0.55), n2 * n2);
  vec3 col = fire * body * (0.8 + 0.9 * n);
  col += vec3(1.0, 0.95, 0.85) * exp(-r * r * 14.0) * (1.6 + 1.6 * uPower);
  col += vec3(1.0, 0.85, 0.6) * (1.0 - smoothstep(0.0, 0.07, abs(r - 0.78))) * 1.7;
  col += vec3(1.0, 0.4, 0.05) * exp(-max(r - 0.7, 0.0) * 6.0) * 0.5;
  col = hueShift(col, uHue) * uAlpha * (1.0 - smoothstep(0.9, 1.0, r));
  gl_FragColor = vec4(col, 1.0);
}`;

// Tia sáng hình sao (đầu tay lúc phóng, điểm va chạm)
const FLARE_FRAG = `
uniform float uAlpha;
uniform float uSeed;
void main(){
  vec2 p = (vUv - 0.5) * 2.0;
  float r = length(p);
  float a = atan(p.y, p.x + 1e-6);
  float s1 = pow(max(abs(cos(a * 4.0 + uSeed + uTime * 1.5)), 0.0), 24.0) * exp(-r * 3.2);
  float s2 = pow(max(abs(cos(a * 7.0 - uSeed * 2.0 - uTime * 2.0)), 0.0), 30.0) * exp(-r * 4.5);
  vec3 col = vec3(1.0, 0.95, 0.85) * exp(-r * r * 10.0) * 2.0
           + vec3(1.0, 0.55, 0.15) * (s1 + s2) * 1.5
           + vec3(1.0, 0.4, 0.05) * exp(-r * 2.8) * 0.5;
  col = hueShift(col, uHue) * uAlpha * (1.0 - smoothstep(0.85, 1.0, r));
  gl_FragColor = vec4(col, 1.0);
}`;

// Vòng sóng xung kích
const RING_FRAG = `
uniform float uAlpha;
uniform float uProg;
void main(){
  vec2 p = (vUv - 0.5) * 2.0;
  float r = length(p);
  float ring = 1.0 - smoothstep(0.0, 0.14, abs(r - uProg * 0.9));
  vec3 col = mix(vec3(1.0, 0.45, 0.1), vec3(1.0, 0.9, 0.7), ring) * ring * 1.6;
  col = hueShift(col, uHue) * uAlpha * (1.0 - smoothstep(0.9, 1.0, r));
  gl_FragColor = vec4(col, 1.0);
}`;

// Beam: lõi trắng mảnh + thân lửa cam có mép rách chảy dọc theo tia
const BEAM_FRAG = `
uniform float uAlpha;
uniform float uReach;
uniform float uTail;
uniform float uAspect;
void main(){
  float x = vUv.x;
  float y = (vUv.y - 0.5) * 2.0;
  float env = 0.6 * (0.22 + 0.78 * smoothstep(0.0, 0.12, x)) * (1.0 - 0.2 * x);
  float d = abs(y) / max(env, 0.001);
  vec2 q = vec2(x * uAspect * 0.55 - uTime * 7.0, y * 1.4);
  float n  = fbm(q);
  float n2 = fbm(q * 2.1 + vec2(-uTime * 5.0, 3.7));
  float body  = 1.0 - smoothstep(0.25, 1.0, d + (n - 0.5) * 0.9);
  float inner = 1.0 - smoothstep(0.0, 0.55, d + (n2 - 0.5) * 0.4);
  float core  = exp(-d * d * 12.0);
  vec3 col = mix(vec3(0.95, 0.28, 0.04), vec3(1.0, 0.62, 0.15), inner) * body * 1.4;
  col += vec3(1.0, 0.93, 0.8) * core * 1.8;
  float head = 1.0 - smoothstep(uReach - 0.06, uReach, x);
  float tail = smoothstep(uTail, min(1.0, uTail + 0.1), x);
  float start = smoothstep(0.0, 0.03, x);
  col = hueShift(col, uHue) * head * tail * start * uAlpha;
  gl_FragColor = vec4(col, 1.0);
}`;

const SPARK_VERT = `
attribute float aLife;
attribute float aSize;
uniform float uPx;
varying float vLife;
void main(){
  if (aLife <= 0.001 || aSize <= 0.0001) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    vLife = 0.0;
    return;
  }
  vLife = aLife;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = max(aSize * uPx / max(-mv.z, 0.1), 0.0);
  gl_Position = projectionMatrix * mv;
}`;

const SPARK_FRAG = `
varying float vLife;
` + COMMON + `
void main(){
  if (vLife <= 0.001) discard;
  float d = length(gl_PointCoord - 0.5) * 2.0;
  if (d > 1.0) discard;
  float a = 1.0 - d;
  a *= a;
  vec3 col = mix(vec3(1.0, 0.35, 0.05), vec3(1.0, 0.85, 0.4), vLife);
  col = hueShift(col, uHue) * a * (0.4 + vLife * 0.6) * 1.6 * vLife;
  gl_FragColor = vec4(col, 1.0);
}`;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const clamp = THREE.MathUtils.clamp;
const rnd = (a, b) => a + Math.random() * (b - a);
const easeOut3 = (k) => 1 - Math.pow(1 - k, 3);
const randDir = (o) => {
  const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u);
  return o.set(s * Math.cos(a), u, s * Math.sin(a));
};

/** Tìm xương bàn tay (Mixamo: mixamorigLeftHand / mixamorigRightHand). */
export function findHandBones(root) {
  const hands = [];
  root.traverse((o) => {
    if (o.isBone && /(Left|Right)Hand$|Hand[._]?[LR]$/i.test(o.name)) hands.push(o);
  });
  return hands;
}

const _A = new THREE.Vector3(), _H = new THREE.Vector3(), _D = new THREE.Vector3();
const _T = new THREE.Vector3(), _S = new THREE.Vector3(), _Z = new THREE.Vector3();
const _X = new THREE.Vector3(), _Y = new THREE.Vector3(), _V = new THREE.Vector3(), _W = new THREE.Vector3();
const _M = new THREE.Matrix4(), _sz = new THREE.Vector2();

/* ------------------------------------------------------------------ */
/* PlasmaSkill                                                         */
/* ------------------------------------------------------------------ */
export class PlasmaSkill {
  /**
   * @param {object} o
   * @param {THREE.Scene} o.scene
   * @param {THREE.PerspectiveCamera} o.camera
   * @param {THREE.WebGLRenderer} o.renderer
   * @param {THREE.Object3D[]} o.hands   xương bàn tay (1 hoặc 2), vd findHandBones(model)
   * @param {number} [o.scale=1]         1 = nhân vật cao ~1.8 đơn vị. Model to/nhỏ hơn thì chỉnh số này
   * @param {number} [o.hue=0]           xoay màu (radian). 0 = cam lửa, ~3.14 = xanh dương, ~2.1 = tím
   * @param {object} [o.timing]          {charge, fire, hold, fade} tính bằng giây
   */
  constructor({
    scene, camera, renderer, hands = [], scale = 1, hue = 0, shake = true,
    sphereRadius = 0.42, beamWidth = 0.5, targetLift = 0.5, timing = {},
  } = {}) {
    this.scene = scene; this.camera = camera; this.renderer = renderer;
    this.hands = hands; this.scale = scale; this.shakeOn = shake;
    this.R = sphereRadius * scale; this.beamW = beamWidth * scale; this.targetLift = targetLift * scale;
    this.timing = { charge: 0.9, fire: 0.22, hold: 0.75, fade: 0.35, ...timing };
    this.shared = { uTime: { value: 0 }, uHue: { value: hue } };

    this.playing = false; this.t = 0; this.hit = false; this.tHit = 0;
    this.shakeT = 0; this._shakeOff = new THREE.Vector3(); this._acc = 0;
    this.target = null; this.onHit = null; this.onEnd = null;
    this._dirFallback = new THREE.Vector3(1, 0, 0); this._range = 6 * scale;

    const mat = (frag, uni) => new THREE.ShaderMaterial({
      uniforms: { ...this.shared, ...uni },
      vertexShader: VERT, fragmentShader: HEAD + COMMON + frag,
      transparent: true, depthTest: false, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    const quad = new THREE.PlaneGeometry(1, 1);
    this._quad = quad;
    this._beamGeo = new THREE.PlaneGeometry(1, 1).translate(0.5, 0, 0);

    this.root = new THREE.Group();
    this.sphere = new THREE.Mesh(quad, mat(SPHERE_FRAG, { uAlpha: { value: 0 }, uPower: { value: 0 } }));
    this.muzzle = new THREE.Mesh(quad, mat(FLARE_FRAG, { uAlpha: { value: 0 }, uSeed: { value: 0.0 } }));
    this.impact = new THREE.Mesh(quad, mat(FLARE_FRAG, { uAlpha: { value: 0 }, uSeed: { value: 2.1 } }));
    this.ring = new THREE.Mesh(quad, mat(RING_FRAG, { uAlpha: { value: 0 }, uProg: { value: 0 } }));
    this.beam = new THREE.Mesh(this._beamGeo, mat(BEAM_FRAG, {
      uAlpha: { value: 0 }, uReach: { value: 0 }, uTail: { value: 0 }, uAspect: { value: 10 },
    }));
    this.beam.matrixAutoUpdate = false;

    this.beam.renderOrder = 11; this.sphere.renderOrder = 12; this.muzzle.renderOrder = 13;
    this.impact.renderOrder = 14; this.ring.renderOrder = 14;
    for (const m of [this.beam, this.sphere, this.muzzle, this.impact, this.ring]) {
      m.frustumCulled = false; m.visible = false; this.root.add(m);
    }

    // Tia lửa (hạt)
    const N = 240;
    this.sp = {
      N, i: 0,
      pos: new Float32Array(N * 3), vel: new Float32Array(N * 3),
      age: new Float32Array(N), life: new Float32Array(N).fill(0),
      size0: new Float32Array(N), aLife: new Float32Array(N), aSize: new Float32Array(N),
    };
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.sp.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aLife', new THREE.BufferAttribute(this.sp.aLife, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aSize', new THREE.BufferAttribute(this.sp.aSize, 1).setUsage(THREE.DynamicDrawUsage));
    this.sparkMat = new THREE.ShaderMaterial({
      uniforms: { ...this.shared, uPx: { value: 600 } },
      vertexShader: SPARK_VERT, fragmentShader: SPARK_FRAG,
      transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.sparks = new THREE.Points(g, this.sparkMat);
    this.sparks.frustumCulled = false; this.sparks.renderOrder = 15;
    this.root.add(this.sparks);

    scene.add(this.root);
  }

  /** Đổi màu: 0 = cam lửa, Math.PI = xanh dương, 2.1 = tím... */
  setHue(rad) { this.shared.uHue.value = rad; }

  /**
   * Bắt đầu skill.
   * @param {object} o
   * @param {THREE.Object3D|THREE.Vector3|Function} [o.target]  đích (quái). Object3D sẽ được nâng lên targetLift
   * @param {THREE.Vector3} [o.direction]  nếu không có target: hướng bắn (mặc định +X)
   * @param {Function} [o.onHit]  gọi đúng lúc beam chạm đích (trừ máu, nháy trắng quái...)
   * @param {Function} [o.onEnd]  gọi khi skill kết thúc
   */
  play({ target = null, direction = null, range = null, onHit = null, onEnd = null } = {}) {
    this.target = target; this.onHit = onHit; this.onEnd = onEnd;
    if (direction) this._dirFallback.copy(direction).normalize();
    if (range) this._range = range;
    this.t = 0; this.hit = false; this.tHit = 0; this.playing = true; this._acc = 0;
    this.sparks.visible = true;
  }

  stop() { this._finish(false); }

  _anchor(out) {
    if (!this.hands.length) return out.set(0, 1, 0);
    out.set(0, 0, 0);
    for (const h of this.hands) { h.getWorldPosition(_T); out.add(_T); }
    return out.multiplyScalar(1 / this.hands.length);
  }

  _targetPoint(out, A) {
    const t = this.target;
    if (t && t.isObject3D) { t.getWorldPosition(out); out.y += this.targetLift; }
    else if (t && t.isVector3) out.copy(t);
    else if (typeof t === 'function') out.copy(t());
    else out.copy(A).addScaledVector(this._dirFallback, this._range);
    return out;
  }

  _emit(px, py, pz, vx, vy, vz, life, size) {
    const s = this.sp, k = s.i++ % s.N, k3 = k * 3;
    s.pos[k3] = px; s.pos[k3 + 1] = py; s.pos[k3 + 2] = pz;
    s.vel[k3] = vx; s.vel[k3 + 1] = vy; s.vel[k3 + 2] = vz;
    s.age[k] = 0; s.life[k] = life; s.size0[k] = size;
    s.aLife[k] = 1; s.aSize[k] = size;
  }

  _simSparks(dt) {
    const s = this.sp, up = 0.6 * this.scale;
    for (let k = 0; k < s.N; k++) {
      if (s.life[k] <= 0) continue;
      s.age[k] += dt;
      if (s.age[k] >= s.life[k]) { s.life[k] = 0; s.aSize[k] = 0; s.aLife[k] = 0; continue; }
      const k3 = k * 3, drag = Math.max(0, 1 - 2.2 * dt);
      s.vel[k3] *= drag; s.vel[k3 + 1] = s.vel[k3 + 1] * drag + up * dt; s.vel[k3 + 2] *= drag;
      s.pos[k3] += s.vel[k3] * dt; s.pos[k3 + 1] += s.vel[k3 + 1] * dt; s.pos[k3 + 2] += s.vel[k3 + 2] * dt;
      const l = 1 - s.age[k] / s.life[k];
      s.aLife[k] = l; s.aSize[k] = s.size0[k] * (0.4 + 0.6 * l);
    }
    const g = this.sparks.geometry;
    g.attributes.position.needsUpdate = true;
    g.attributes.aLife.needsUpdate = true;
    g.attributes.aSize.needsUpdate = true;
  }

  _rate(rate, dt) { this._acc += rate * dt; const n = Math.floor(this._acc); this._acc -= n; return n; }

  _applyShake(dt) {
    if (this._shakeOff.lengthSq() > 0) { this.camera.position.sub(this._shakeOff); this._shakeOff.set(0, 0, 0); }
    if (this.shakeOn && this.shakeT > 0) {
      const k = this.shakeT / 0.32, a = 0.05 * this.scale * k * k;
      this._shakeOff.set(rnd(-a, a), rnd(-a, a), rnd(-a, a));
      this.camera.position.add(this._shakeOff);
      this.shakeT -= dt;
    }
  }

  _billboard(mesh, pos, size, alpha) {
    mesh.visible = alpha > 0.001 && size > 0.0001;
    if (!mesh.visible) return;
    mesh.position.copy(pos); mesh.quaternion.copy(this.camera.quaternion); mesh.scale.setScalar(size);
    mesh.material.uniforms.uAlpha.value = alpha;
  }

  _updateBeam(origin, end, width, reach, tail, alpha) {
    const dir = _D.copy(end).sub(origin), len = Math.max(dir.length(), 0.001);
    dir.divideScalar(len);
    _V.copy(this.camera.position).sub(origin);
    const side = _S.crossVectors(dir, _V);
    if (side.lengthSq() < 1e-6) side.set(0, 1, 0);
    side.normalize();
    _Z.crossVectors(dir, side);
    _X.copy(dir).multiplyScalar(len);
    _Y.copy(side).multiplyScalar(width);
    _M.makeBasis(_X, _Y, _Z).setPosition(origin);
    this.beam.matrix.copy(_M);
    this.beam.matrixWorldNeedsUpdate = true;
    const u = this.beam.material.uniforms;
    u.uReach.value = reach; u.uTail.value = tail; u.uAspect.value = len / width; u.uAlpha.value = alpha;
    this.beam.visible = reach > 0.001 && tail < 0.999;
  }

  /** Gọi mỗi frame, SAU mixer.update() và TRƯỚC render. dt tính bằng giây. */
  update(dt) {
    dt = Math.min(dt, 0.05);
    this.shared.uTime.value += dt;
    this._simSparks(dt);
    this._applyShake(dt);
    if (!this.playing) return;

    // hệ số quy đổi pixel cho hạt
    this.renderer.getDrawingBufferSize(_sz);
    this.sparkMat.uniforms.uPx.value = _sz.y / (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2));

    this.t += dt;
    const t = this.t, T = this.timing, R = this.R, sc = this.scale;
    const tFire = T.charge + T.fire, tEnd = tFire + T.hold, tDone = tEnd + T.fade;

    const A = this._anchor(_A);
    const H = this._targetPoint(_H, A);
    const dir = _W.copy(H).sub(A).normalize();
    const flicker = 0.92 + 0.08 * Math.sin(t * 47) + 0.04 * Math.sin(t * 91);

    // --- Cầu tụ chiêu ---
    let sSize = 0, sAlpha = 0;
    if (t < T.charge) {
      const p = clamp(t / T.charge, 0, 1), g = easeOut3(p);
      sSize = R * (0.12 + 0.88 * g) * (1 + 0.05 * Math.sin(t * 28));
      sAlpha = Math.min(1, t / 0.15);
      this.sphere.material.uniforms.uPower.value = p;
    } else if (t < T.charge + 0.14) {
      const k = (t - T.charge) / 0.14;
      sSize = R * (1 + 0.3 * k); sAlpha = 1 - k;
    }
    this._billboard(this.sphere, A, sSize * 2.56, sAlpha);

    // --- Hạt hút vào lúc tụ chiêu ---
    if (t < T.charge) {
      const n = this._rate(150, dt);
      for (let i = 0; i < n; i++) {
        randDir(_V).multiplyScalar(rnd(0.9, 1.8) * R);
        const sp = rnd(1.0, 2.2) * sc, L = _V.length();
        this._emit(A.x + _V.x, A.y + _V.y, A.z + _V.z,
          -_V.x / L * sp + rnd(-0.2, 0.2) * sc, -_V.y / L * sp + rnd(-0.2, 0.2) * sc, -_V.z / L * sp + rnd(-0.2, 0.2) * sc,
          rnd(0.35, 0.7), rnd(0.025, 0.06) * sc);
      }
    }

    // --- Beam ---
    const reach = t < T.charge ? 0 : easeOut3(clamp((t - T.charge) / T.fire, 0, 1));
    const tail = t > tEnd ? clamp((t - tEnd) / T.fade, 0, 1) : 0;
    const width = (this.beamW / 0.6) * (1 - 0.5 * tail);
    this._updateBeam(A, H, width, reach, tail, flicker);

    // --- Chớp sáng ở tay lúc phóng ---
    if (t >= T.charge) {
      const burst = Math.max(0, 1 - (t - T.charge) / 0.18);
      const fade = 1 - tail;
      this._billboard(this.muzzle, A, R * (2.4 + 1.6 * burst + 0.15 * Math.sin(t * 40)), (0.75 + 0.25 * burst) * fade * flicker);
      if (t < tEnd) {
        const n = this._rate(130, dt);
        for (let i = 0; i < n; i++) {
          randDir(_V);
          const sp = rnd(2, 6) * sc;
          this._emit(A.x + dir.x * rnd(0, 0.5) * sc, A.y + dir.y * rnd(0, 0.5) * sc, A.z + dir.z * rnd(0, 0.5) * sc,
            dir.x * sp + _V.x * 0.9 * sc, dir.y * sp + _V.y * 0.9 * sc, dir.z * sp + _V.z * 0.9 * sc,
            rnd(0.25, 0.55), rnd(0.02, 0.05) * sc);
        }
      }
    } else { this.muzzle.visible = false; }

    // --- Va chạm ---
    if (!this.hit && reach >= 0.97) {
      this.hit = true; this.tHit = t; this.shakeT = 0.32;
      for (let i = 0; i < 70; i++) {
        randDir(_V).multiplyScalar(rnd(1.5, 4.5) * sc);
        this._emit(H.x, H.y, H.z, _V.x, _V.y, _V.z, rnd(0.4, 0.9), rnd(0.025, 0.07) * sc);
      }
      if (this.onHit) this.onHit(H.clone());
    }
    if (this.hit) {
      const ti = t - this.tHit, fade = 1 - tail, burst = Math.max(0, 1 - ti / 0.18);
      this._billboard(this.impact, H, R * (2.2 + 2.6 * burst + 0.2 * Math.sin(t * 35)), (0.55 + 0.45 * burst) * fade * flicker);
      const prog = clamp(ti / 0.5, 0, 1);
      this.ring.material.uniforms.uProg.value = prog;
      this._billboard(this.ring, H, R * 6, (1 - prog) * fade);
      if (t < tEnd) {
        const n = this._rate(50, dt);
        for (let i = 0; i < n; i++) {
          randDir(_V).multiplyScalar(rnd(1, 3) * sc);
          this._emit(H.x, H.y, H.z, _V.x, Math.abs(_V.y) + 0.5 * sc, _V.z, rnd(0.3, 0.7), rnd(0.02, 0.05) * sc);
        }
      }
    }

    if (t >= tDone) this._finish(true);
  }

  _finish(callEnd) {
    this.playing = false;
    for (const m of [this.beam, this.sphere, this.muzzle, this.impact, this.ring, this.sparks]) m.visible = false;
    if (callEnd && this.onEnd) this.onEnd();
  }

  dispose() {
    this.scene.remove(this.root);
    this._quad.dispose(); this._beamGeo.dispose(); this.sparks.geometry.dispose();
    for (const m of [this.beam, this.sphere, this.muzzle, this.impact, this.ring]) m.material.dispose();
    this.sparkMat.dispose();
  }
}
