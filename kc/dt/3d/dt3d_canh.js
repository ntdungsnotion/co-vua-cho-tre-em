// ================================================================
// FILE: dt/3d/dt3d_canh.js  (ES module) - PHẦN VẼ 3D: CẢNH
// CHỨC NĂNG: Bộ dựng hình (renderer), cảnh, sương, ánh sáng, chế độ đồ họa Đẹp / Nhẹ,
//            vòng vẽ (các phần khác đăng ký hàm cập nhật mỗi khung), đo khung / giây.
//            Kèm vài hàm số dùng chung cho phần vẽ (nhiễu, ngẫu nhiên).
// HÀM KHAI RA:
//   docDoHoa() -> "dep" | "nhe";  luuDoHoa(chế độ)
//   taoCanh(vungVe, { nhe }) -> ctx { THREE, renderer, canh, nhe, nang,
//        moiKhung(fn(dt, t)), datNangTheo(vector3), batDau(camera), khiDo(fn({fps, lenhVe, tamGiac})) }
//   bam(x, y), nhieu(x, y), mem(a, b, x), taoNgauNhien(hạt)
// LUẬT NỐI: phần này không gọi phần nào khác.
// BƯỚC: TC_D02A (tách từ dt_lang_3d.js của TC_D01C)
// NGÀY: 23/10/2026 (sửa 29/10/2026 TC_D05: ctx.ve cho hậu kỳ Bloom; 30/10/2026 TC_D06A: ctx.nghiVe)
// ================================================================
import * as THREE from "three";

export const KHOA_DO_HOA = "kc_dt_do_hoa";
export function docDoHoa() {
  try { return localStorage.getItem(KHOA_DO_HOA) || (Math.min(screen.width, screen.height) < 500 && devicePixelRatio > 2.5 ? "nhe" : "dep"); }
  catch (e) { return "dep"; } // chặn bộ nhớ thì dùng mặc định
}
export function luuDoHoa(cheDo) { try { localStorage.setItem(KHOA_DO_HOA, cheDo); } catch (e) { /* thôi */ } }

// --- Số dùng chung cho phần vẽ ---
export function bam(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
export function nhieu(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = bam(xi, yi), b = bam(xi + 1, yi), c = bam(xi, yi + 1), d = bam(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function taoNgauNhien(hat) { let a = hat >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export const mem = (a, b, x) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

export function taoCanh(vungVe, { nhe }) {
  const renderer = new THREE.WebGLRenderer({ antialias: !nhe, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, nhe ? 1 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = !nhe;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  vungVe.appendChild(renderer.domElement);

  const canh = new THREE.Scene();
  canh.background = new THREE.Color("#a9d8ee");
  canh.fog = new THREE.Fog("#a9d8ee", 75, 125);

  canh.add(new THREE.HemisphereLight("#dff2ff", "#6d7a3a", 1.35));
  const nang = new THREE.DirectionalLight("#fff1d6", 2.4);
  nang.castShadow = !nhe;
  nang.shadow.mapSize.set(2048, 2048);
  Object.assign(nang.shadow.camera, { left: -24, right: 24, top: 24, bottom: -24, near: 1, far: 80 });
  nang.shadow.bias = -0.0006; nang.shadow.normalBias = 0.03;
  canh.add(nang, nang.target);
  const lechNang = new THREE.Vector3(-14, 26, 10);

  const dsCapNhat = [], dsDo = [];
  const dongHo = new THREE.Clock();
  const doFps = { khung: 0, tg: 0 };
  const ctx = {
    THREE, renderer, canh, nhe, nang, camera: null,
    moiKhung(fn) { dsCapNhat.push(fn); },
    ve: null, // gán hàm vẽ riêng (vd. qua bộ hậu kỳ Bloom); null = vẽ thẳng
    nghiVe: false, // true: chạy cập nhật nhưng không vẽ (TC_D06A, đang ở màn chiến đấu)
    khiDo(fn) { dsDo.push(fn); },
    datNangTheo(dich) { nang.position.copy(dich).add(lechNang); nang.target.position.copy(dich); },
    batDau(camera) {
      ctx.camera = camera;
      renderer.setAnimationLoop(() => {
        const dt = Math.min(dongHo.getDelta(), 0.1), t = dongHo.elapsedTime;
        for (const f of dsCapNhat) f(dt, t);
        if (ctx.nghiVe) return; // TC_D06A: màn chiến đấu phủ lên: lõi vẫn chạy, thôi vẽ cho nhẹ máy
        if (ctx.ve) ctx.ve(); else renderer.render(canh, camera);
        doFps.khung++; doFps.tg += dt;
        if (doFps.tg >= 1) {
          const so = { fps: Math.round(doFps.khung / doFps.tg), lenhVe: renderer.info.render.calls, tamGiac: renderer.info.render.triangles };
          doFps.khung = 0; doFps.tg = 0;
          for (const f of dsDo) f(so);
        }
      });
    }
  };
  return ctx;
}
// 30/10/2026 13:56 - BƯỚC: TC_D06A (ctx.nghiVe)
