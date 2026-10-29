// ================================================================
// FILE: dt/3d/dt3d_hat.js  (ES module) - PHẦN VẼ 3D: BỘ HẠT CHẠY TRÊN CARD ĐỒ HOẠ
// CHỨC NĂNG: Vẽ hàng nghìn hạt (lửa, khói, bụi, tia sáng) trong MỘT lệnh vẽ mỗi lớp: mỗi hạt chỉ
//            ghi một lần lúc sinh (vị trí, vận tốc, trọng lực, sức cản, quỹ đạo xoáy...), card đồ hoạ
//            tự tính vị trí theo tuổi => máy không phải cập nhật từng hạt mỗi khung.
//            Lớp có ảnh nhiều khung (flipbook) tự lật khung theo tuổi hạt (ảnh ở dt/hieu_ung/*.png,
//            dựng bằng repo_rieng/dau_truong_tri_thuc/cong_cu/tao_anh_nhieu_khung.mjs).
// HÀM KHAI RA:
//   taoBoHat(ctx, { nhe }) -> bo = { capNhat(dt), hat(lop, tuy chon), so(n), thoiGian(), dem() }
//     lop: "sang" (chấm sáng cộng màu), "lua" (lửa cháy, lật khung), "no" (nổ lửa, lật khung),
//          "khoi" (khói / bụi, lật khung, tô màu theo mau)
//     tuy chon: { p, v, g (trọng lực), can (sức cản), song (giây), co, coCuoi, mau, mauCuoi, mo,
//                 hienDan (phần đầu hiện dần 0..1), (lớp lửa mặc định dựng đứng, không xoay ngẫu nhiên) moCuoi (từ đâu bắt đầu mờ, 0 = theo lớp), xoay, tocXoay, keoDai (kéo dài theo hướng bay),
//                 sang (nhân độ sáng, > 1 thì Bloom toả quầng), quy: { r, a, w, vr } quay quanh tâm }
// BƯỚC: TC_D05B2 (người dùng 29/10/2026: "cần có hiệu ứng với vùng tác động nhiều hơn")
// NGÀY: 30/10/2026
// ================================================================
import * as THREE from "three";

const duongDan = p => new URL(p, import.meta.url).href;

const DINH = `
uniform float uT, uKhung, uMoCuoi, uDoc;
attribute vec4 aP, aV, aDong, aCo, aMau, aMau2, aQuy;
varying vec2 vUv; varying vec4 vMau;
void main(){
  float tuoi = uT - aP.w, k = tuoi / aV.w;
  if (k < 0.0 || k > 1.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  float d = aDong.y, tt = d > 0.001 ? (1.0 - exp(-d * tuoi)) / d : tuoi;
  vec3 p = aP.xyz + aV.xyz * tt; p.y -= 0.5 * aDong.x * tuoi * tuoi;
  if (aQuy.x >= 0.0) { float a = aQuy.y + aQuy.z * tuoi, r = max(0.0, aQuy.x + aQuy.w * tuoi); p.x += cos(a) * r; p.z += sin(a) * r * 0.8; }
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float co = mix(aCo.x, aCo.y, k);
  vec2 g = position.xy, q;
  if (aDong.z > 0.0) {
    vec3 vn = aV.xyz * exp(-d * tuoi) - vec3(0.0, aDong.x * tuoi, 0.0);
    vec2 vs = (modelViewMatrix * vec4(vn, 0.0)).xy; float l = length(vs);
    vec2 h = l > 1e-4 ? vs / l : vec2(1.0, 0.0);
    // lớp lửa (uDoc = 1): ngọn lửa dựng dọc theo đường bay, đầu lửa quay ngược hướng bay; lớp khác: kéo dài theo chiều ngang ảnh
    if (uDoc > 0.5) q = vec2(-h.y, h.x) * g.x * co - h * g.y * (co + l * aDong.z);
    else q = h * g.x * (co + l * aDong.z) + vec2(-h.y, h.x) * g.y * co;
  } else {
    float r = aCo.z + aCo.w * tuoi, c = cos(r), s = sin(r);
    q = vec2(c * g.x - s * g.y, s * g.x + c * g.y) * co;
  }
  mv.xy += q;
  mv.z += co * 0.5; // kéo hạt về phía camera nửa cỡ: khói to không bị mặt đất cắt thành đường thẳng
  gl_Position = projectionMatrix * mv;
  vec2 uv = g + 0.5;
  if (uKhung > 1.0) { float n = uKhung * uKhung, f = min(floor(k * n), n - 1.0); uv = (vec2(mod(f, uKhung), uKhung - 1.0 - floor(f / uKhung)) + uv) / uKhung; }
  vUv = uv;
  float vao = aMau2.w > 0.0 ? min(1.0, k / aMau2.w) : 1.0;
  float moC = (aQuy.x < 0.0 && aQuy.y > 0.0) ? aQuy.y : uMoCuoi;
  vMau = vec4(mix(aMau.rgb, aMau2.rgb, k) * aDong.w, aMau.a * vao * (1.0 - smoothstep(moC, 1.0001, k)));
}`;
const MANH = `
uniform sampler2D uTex; varying vec2 vUv; varying vec4 vMau;
void main(){
  vec4 t = texture2D(uTex, vUv);
  gl_FragColor = vec4(vMau.rgb * t.rgb, t.a * vMau.a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

function anhSang() {
  const n = 64, cv = document.createElement("canvas"); cv.width = cv.height = n;
  const g = cv.getContext("2d"), gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.2, "rgba(255,255,255,.8)"); gr.addColorStop(0.5, "rgba(255,255,255,.22)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, n, n);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function taoBoHat(ctx, { nhe } = {}) {
  const { canh } = ctx;
  let T = 0;
  const giam = nhe ? 0.45 : 1;
  const tai = new THREE.TextureLoader();
  const taiAnh = ten => { const t = tai.load(duongDan("../hieu_ung/" + ten + ".png")); t.colorSpace = THREE.SRGBColorSpace; return t; };
  // lớp: ảnh, số khung mỗi cạnh, cách trộn, số hạt tối đa, phần cuối đời bắt đầu mờ
  const LOP = {
    sang: { tex: anhSang(), khung: 1, cong: true, toiDa: 4000, moCuoi: 0.55 },
    lua: { tex: taiAnh("lua"), khung: 6, cong: true, toiDa: 1600, moCuoi: 0.7 },
    no: { tex: taiAnh("no_lua"), khung: 6, cong: false, toiDa: 400, moCuoi: 0.85 },
    khoi: { tex: taiAnh("khoi"), khung: 6, cong: false, toiDa: 1400, moCuoi: 0.8 }
  };
  const TEN_TT = ["aP", "aV", "aDong", "aCo", "aMau", "aMau2", "aQuy"];
  for (const [ten, L] of Object.entries(LOP)) {
    L.toiDa = Math.round(L.toiDa * giam);
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    L.tt = {};
    for (const a of TEN_TT) {
      const arr = new Float32Array(L.toiDa * 4);
      if (a === "aP") for (let i = 0; i < L.toiDa; i++) arr[i * 4 + 3] = -1e6; // hạt chưa sinh = đã chết
      if (a === "aV") for (let i = 0; i < L.toiDa; i++) arr[i * 4 + 3] = 1;
      const b = new THREE.InstancedBufferAttribute(arr, 4); b.setUsage(THREE.DynamicDrawUsage); g.setAttribute(a, b); L.tt[a] = b;
    }
    g.instanceCount = L.toiDa;
    L.vl = new THREE.ShaderMaterial({
      uniforms: { uT: { value: 0 }, uDoc: { value: ten === "lua" ? 1 : 0 }, uKhung: { value: L.khung }, uMoCuoi: { value: L.moCuoi }, uTex: { value: L.tex } },
      vertexShader: DINH, fragmentShader: MANH, transparent: true, depthWrite: false,
      depthTest: true, blending: L.cong ? THREE.AdditiveBlending : THREE.NormalBlending
    });
    L.m = new THREE.Mesh(g, L.vl); L.m.frustumCulled = false; L.m.renderOrder = L.cong ? 12 : 11;
    L.ke = 0; L.tu = Infinity; L.den = -1; L.songDen = 0;
    canh.add(L.m);
    L.ten = ten;
  }

  const c0 = new THREE.Color(), c1 = new THREE.Color();
  function hat(lop, { p, v = null, g = 0, can = 0, song = 1, co = 0.3, coCuoi = co, mau = "#ffffff", mauCuoi = null, mo = 1, hienDan = 0,
    xoay = lop === "lua" ? (Math.random() - 0.5) * 0.3 : Math.random() * 6.28, tocXoay = 0, keoDai = 0, sang = 1, quy = null, moCuoi = 0 } = {}) {
    const L = LOP[lop]; const i = L.ke; L.ke = (L.ke + 1) % L.toiDa;
    const o = i * 4, a = L.tt;
    c0.set(mau); c1.set(mauCuoi || mau);
    a.aP.array.set([p.x, p.y, p.z, T], o);
    a.aV.array.set([v ? v.x : 0, v ? v.y : 0, v ? v.z : 0, song], o);
    a.aDong.array.set([g, can, keoDai, sang], o);
    a.aCo.array.set([co, coCuoi, xoay, tocXoay], o);
    a.aMau.array.set([c0.r, c0.g, c0.b, mo], o);
    a.aMau2.array.set([c1.r, c1.g, c1.b, hienDan], o);
    a.aQuy.array.set(quy ? [quy.r, quy.a, quy.w, quy.vr || 0] : [-1, moCuoi, 0, 0], o);
    L.tu = Math.min(L.tu, i); L.den = Math.max(L.den, i);
    L.songDen = Math.max(L.songDen, T + song);
  }

  return {
    hat,
    // số hạt nhân theo máy (máy yếu ít hạt hơn)
    so: n => Math.max(1, Math.round(n * giam)),
    thoiGian: () => T,
    // số hạt đang sống mỗi lớp (cho kịch bản thử đo tải)
    dem() { const kq = {}; for (const [ten, L] of Object.entries(LOP)) { const p = L.tt.aP.array, v = L.tt.aV.array; let n = 0; for (let i = 0; i < L.toiDa; i++) if (T - p[i * 4 + 3] < v[i * 4 + 3]) n++; kq[ten] = n; } return kq; },
    capNhat(dt) {
      T += dt;
      for (const L of Object.values(LOP)) {
        L.vl.uniforms.uT.value = T;
        L.m.visible = T < L.songDen; // không còn hạt sống thì không vẽ lớp này
        if (L.den < 0) continue;
        for (const ten of TEN_TT) { const b = L.tt[ten]; b.clearUpdateRanges(); b.addUpdateRange(L.tu * 4, (L.den - L.tu + 1) * 4); b.needsUpdate = true; }
        L.tu = Infinity; L.den = -1;
      }
    }
  };
}
// 30/10/2026 - BƯỚC: TC_D05B2
