// ================================================================
// FILE: dt/3d/dt3d_chieu_them.js  (ES module) - PHẦN VẼ 3D: KHO CHIÊU THÊM (phụ tá làm)
// CHỨC NĂNG: Kho chiêu chiến đấu bổ sung, mỗi chiêu một mục trong mảng ds. Sân đấu (dt3d_tran.js)
//            tự nạp file này; trang đấu thử tự hiện một nút cho mỗi mục. File lỗi => sân bỏ qua, vẫn chạy.
//            Việc giao: claude_code/GEMINI.md mục 3, việc A6.
// HÀM KHAI RA:
//   taoChieuThem({ ctx, hu, bo, cv, nhe, layCamera }) -> { ds, capNhat(dt, t) }
//     ctx: cảnh (ctx.canh, ctx.renderer, ctx.nang, ctx.moiKhung) - dt3d_canh.js
//     hu : hiệu ứng điểm dt3d_hieu_ung.js (chop, tia, songXung, vetChem, phong, set, cotLua, khien, khoi, gio, rung...)
//     bo : bộ hạt card đồ hoạ dt3d_hat.js  -> bo.hat("sang" | "lua" | "no" | "khoi", { p, v, g, can, song, co, coCuoi,
//          mau, mauCuoi, mo, hienDan, moCuoi, xoay, tocXoay, keoDai, sang, quy }), bo.so(n) (máy yếu ít hạt hơn)
//     cv : 7 chiêu vùng dt3d_chieu_vung.js (muaLua, thienThach, locXoay, damDat, voKhongGian, muaTen, chuongNangLuong)
//     nhe: máy yếu (giảm hạt / bỏ chi tiết)    layCamera(): camera đang dùng
//   ds[i] = { ma (chữ thường không dấu), nut (chữ trên nút thử, có biểu tượng), ten (tên chiêu hiện to, IN HOA),
//             chay(tran) -> số giây diễn, trung (tuỳ chọn: giây tới lúc đòn chạm đối thủ, trang hiện số trừ máu khi đó),
//             tenTrenDau (tuỳ chọn: true = tên chiêu hiện trên đầu Thủ lĩnh thay giữa sân, cho chiêu lia camera về Thủ lĩnh) }
//     tran = { be:   { tam, chan, cao, nhom }             (Vector3 giữa thân / dưới chân người ra chiêu, chiều cao,
//                                                           nhom = vỏ 3D của Thủ lĩnh để tìm xương tay; có thể null)
//              quai: { nhom, tam, chan, cao, chop(giay) }  (nhom = THREE.Group của đối thủ: được dời / xoay / ẩn TẠM,
//                                                           diễn xong PHẢI trả về như cũ)
//              camNhin,       (Vector3 điểm camera sân nhìn vào; chiêu có lia camera thì trả camera về điểm này)
//              dongTac(kieu)  (động tác tướng: "phep" | "phepLon" | "chem" | "chemLon" | "mung" | "thu")
//              them(giay, fn(p 0..1), tre)  (hoạt cảnh theo thời gian của sân: khựng hình thì chậm theo)
//              mau,           (màu chiêu theo tộc người ra chiêu)
//              am }           (bộ tiếng dt3d_am_thanh.js, TC_D05B3: gọi tiếng có sẵn, vd tran.am.thachNo(x), tran.am.keng(x))
// CHIÊU CÓ: vi_du (khung); plasma_beam ⚡ HOẢ LONG PHÓNG XẠ (Antigravity 08/11/2026, thư viện thu_vien/plasma-skill.js;
//           TC_D05E: đòn kết liễu của Thủ lĩnh Nhân tộc trong trận thật, dt3d_tran.js ketQua)
// BƯỚC: TC_D05B2 (khung + chiêu ví dụ, Claude Code); A6 (phụ tá thêm chiêu);
//       TC_D05E (Claude Code: tích hợp Plasma Beam; camera tính theo vị trí thật + khổ màn hình, xương tay chỉ tìm
//       trong người Thủ lĩnh, trả camera về đúng góc sân)
// NGÀY: 30/10/2026; 08/11/2026 (Antigravity); 25/11/2026 (TC_D05E)
// ================================================================
import * as THREE from "three";
import { PlasmaSkill } from "../../thu_vien/plasma-skill.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const ngau = (a, b) => a + Math.random() * (b - a);
const muot = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const lerp = (a, b, t) => a + (b - a) * t;

// màu tộc (CSS) -> góc xoay màu (radian) của PlasmaSkill: xanh -> Tiên, vàng sáng -> Nhân, cam đỏ -> Quỷ
function gocMau(mauCSS) {
  const hsl = { h: 0, s: 0, l: 0 };
  new THREE.Color(mauCSS).getHSL(hsl);
  if (hsl.h > 0.40) return Math.PI;
  if (hsl.l > 0.60) return 0.42;
  return 0;
}

// Plasma: thời gian từng pha (giây). Tụ 1,8 -> phóng 0,25 -> giữ 0,9 -> tan 0,45 = 3,4 giây
const PL = { charge: 1.80, fire: 0.25, hold: 0.90, fade: 0.45 };
const PL_TONG = PL.charge + PL.fire + PL.hold + PL.fade;
// lúc tia chạm đích: thư viện báo trúng khi tia vươn >= 97 % (easeOut3) -> 0,69 thời gian phóng
const PL_TRUNG = PL.charge + PL.fire * 0.69;
// camera (lệch so với chân Thủ lĩnh; đối thủ đứng bên phải, cách ~3,1): người dùng nghiệm thu góc này trên sân thử
const CAM_TU = { pos: V(0.70, 1.15, 3.90), nhin: V(0.15, 0, 0) };      // tụ chiêu: thấy trọn người (nhin.y = nửa chiều cao)
const CAM_CHEO = { pos: V(-2.55, 1.45, 3.30), nhin: V(1.75, 0.75, -1.0), fov: 38 }; // phóng: chéo 45° sau lưng
const KHO_CHUAN = 1.5; // khổ ngang / dọc mà góc chéo đã chỉnh; màn hẹp hơn (điện thoại dựng) thì mở rộng fov cho đủ ngang

export function taoChieuThem({ ctx, hu, bo, cv, nhe, layCamera }) {
  const { canh, renderer } = ctx;

  // vật tự xoá sau "giay" giây; cap(k 0..1, dt, t) gọi mỗi khung. Mọi lưới / vật liệu tạo mới phải đi qua đây
  // (hoặc tự dispose) để không rò bộ nhớ.
  const vat = [];
  function them(o, giay, cap) { canh.add(o); vat.push({ o, con: giay, tong: giay, cap }); return o; }

  // ---------------- PLASMA BEAM ----------------
  // Một bộ PlasmaSkill dùng lại cho mọi lần bắn (vật liệu tạo một lần, không rò bộ nhớ)
  const neoTay = new THREE.Object3D(); canh.add(neoTay);
  let plasma = null, pl = null; // pl: trạng thái lần bắn đang diễn
  function damBaoPlasma(cam) {
    if (!plasma) plasma = new PlasmaSkill({ scene: canh, camera: cam, renderer, hands: [neoTay], scale: 1.35, sphereRadius: 0.40, beamWidth: 0.60, targetLift: 0.45, hue: 0, shake: false, timing: PL });
    plasma.camera = cam;
    return plasma;
  }
  // xương bàn tay phải CHỈ trong người Thủ lĩnh (tướng Mixamo: RightHand; KayKit: handslot.r)
  function timTay(nhom) {
    let tay = null;
    if (nhom) nhom.traverse(o => {
      if (tay || !o.isBone) return;
      const t = o.name.toLowerCase();
      if (t.includes("righthand") || t.includes("handslot.r") || t.includes("handslotr") || t === "hand.r" || t === "right_hand") tay = o;
    });
    return tay;
  }
  const LECH_TAY = V(0.08, 0.04, 0.02);
  function viTriTay(out) {
    if (pl.tay) return pl.tay.getWorldPosition(out).add(LECH_TAY);
    const b = pl.tran.be; return out.set(b.chan.x + 0.44, b.cao * 0.68, b.chan.z + 0.15);
  }
  // fov dọc để màn hẹp vẫn thấy đủ bề ngang như khổ chuẩn
  function fovTheoKho(fov, cam) {
    const a = cam.aspect || KHO_CHUAN;
    if (a >= KHO_CHUAN) return fov;
    const tanNgang = Math.tan(THREE.MathUtils.degToRad(fov / 2)) * KHO_CHUAN;
    return Math.min(70, THREE.MathUtils.radToDeg(2 * Math.atan(tanNgang / a)));
  }

  function batDauPlasma(tran, cam) {
    const c = tran.be.chan;
    pl = {
      t: 0, tran, cam, tay: timTay(tran.be.nhom), tichHat: 0,
      fovGoc: cam.fov,
      nhinGoc: (tran.camNhin || V(0, 0.92, 0)).clone(),
      posTu: c.clone().add(CAM_TU.pos), nhinTu: c.clone().add(CAM_TU.nhin).setY(tran.be.cao * 0.5),
      posCheo: c.clone().add(CAM_CHEO.pos), nhinCheo: c.clone().add(CAM_CHEO.nhin)
    };
    viTriTay(neoTay.position);
  }

  // hạt sáng hút vào quả cầu + bụi xoáy dưới chân + rung nhẹ tăng dần (chỉ pha tụ)
  function capNhatTuChieu(dt) {
    const { t, tran } = pl;
    viTriTay(neoTay.position);
    if (t >= PL.charge) return;
    const cau = neoTay.position;
    pl.tichHat += dt * bo.so(nhe ? 45 : 95);
    while (pl.tichHat >= 1) {
      pl.tichHat -= 1;
      const huong = V(ngau(-1, 1), ngau(-0.8, 1), ngau(-1, 1)).normalize(), kc = ngau(1.2, 2.8), song = ngau(0.32, 0.58);
      bo.hat("sang", { p: cau.clone().addScaledVector(huong, kc), v: huong.clone().multiplyScalar(-kc / song), song, co: ngau(0.06, 0.12), coCuoi: 0.02, keoDai: 0.04, mau: tran.mau, sang: 2.6, mo: 0.9, moCuoi: 1.0, hienDan: 0.2 });
    }
    if (Math.random() < 0.25) bo.hat("khoi", { p: V(tran.be.chan.x, 0.08, tran.be.chan.z), song: 0.75, co: 0.35, coCuoi: 1.1, mau: "#9fb0bb", mo: 0.22, quy: { r: ngau(0.5, 1.0), a: ngau(0, 6.28), w: 5, vr: -0.5 } });
    const nen = t / PL.charge;
    if (Math.random() < 0.15) hu.rung(0.01 + 0.025 * nen, 0.10);
    if (nen > 0.6 && Math.random() < 0.2) hu.tia(cau, tran.mau, 4, 1.2);
  }

  // Camera điện ảnh: chạy SAU dòng camera của sân (dt3d_tran.js đặt camera.position = góc sân + rung mỗi khung),
  // nên vị trí đọc được ở đầu hàm là góc sân hiện tại (đổi khổ màn hình giữa chiêu vẫn đúng).
  function capNhatCamera() {
    if (!pl) return;
    const { t, cam } = pl, posSan = cam.position.clone();
    const tPhong = PL.charge + PL.fire, tTan = tPhong + PL.hold;
    const fovCheo = fovTheoKho(CAM_CHEO.fov, cam), fovTu = fovTheoKho(pl.fovGoc * 0.94, cam);
    let pos, nhin, fov;
    if (t < PL.charge) { const k = muot(t / PL.charge); pos = posSan.lerp(pl.posTu, k); nhin = pl.nhinGoc.clone().lerp(pl.nhinTu, k); fov = lerp(pl.fovGoc, fovTu, k); }
    else if (t < tPhong) { const k = muot((t - PL.charge) / PL.fire); pos = pl.posTu.clone().lerp(pl.posCheo, k); nhin = pl.nhinTu.clone().lerp(pl.nhinCheo, k); fov = lerp(fovTu, fovCheo, k); }
    else if (t < tTan) { pos = pl.posCheo.clone(); nhin = pl.nhinCheo.clone(); fov = fovCheo; }
    else if (t < PL_TONG) { const k = muot((t - tTan) / (PL_TONG - tTan)); pos = pl.posCheo.clone().lerp(posSan, k); nhin = pl.nhinCheo.clone().lerp(pl.nhinGoc, k); fov = lerp(fovCheo, pl.fovGoc, k); }
    else { // xong: trả camera về đúng hướng nhìn + fov của sân (vị trí do sân tự đặt mỗi khung)
      cam.lookAt(pl.nhinGoc); cam.fov = pl.fovGoc; cam.updateProjectionMatrix();
      pl = null; return;
    }
    cam.position.copy(pos); cam.lookAt(nhin); cam.fov = fov; cam.updateProjectionMatrix();
  }
  if (ctx.moiKhung) ctx.moiKhung(capNhatCamera);

  const ds = [
    // CHIÊU VÍ DỤ (khung, Claude Code): mẫu cho phụ tá
    {
      ma: "vi_du", nut: "🧪 Ví dụ", ten: "CHIÊU VÍ DỤ",
      chay(tran) {
        tran.dongTac("phep");
        const p = tran.quai.tam;
        const vong = them(new THREE.Mesh(new THREE.RingGeometry(0.6, 0.8, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: tran.mau, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })), 1.2, k => {
          vong.scale.setScalar(1 + k * 1.5); vong.material.opacity = 1 - k;
        });
        vong.position.set(tran.quai.chan.x, 0.05, tran.quai.chan.z);
        for (let i = 0; i < bo.so(20); i++) bo.hat("sang", { p: p.clone(), v: V(ngau(-2, 2), ngau(1, 3), ngau(-1, 1)), g: 5, song: 0.8, co: 0.08, mau: tran.mau, sang: 1.8 });
        tran.them(0.01, () => tran.quai.chop(0.2), 0.3);
        return 1.2;
      }
    },
    // ⚡ PLASMA BEAM (Antigravity): tụ cầu năng lượng ở tay 1,8 giây (camera lấy trọn người) -> phóng tia xuyên
    // đối thủ (camera chéo 45° sau lưng thấy cả người, tia, đối thủ) -> tia tan, camera về góc sân
    {
      ma: "plasma_beam", nut: "⚡ Plasma Beam", ten: "HOẢ LONG PHÓNG XẠ", trung: PL_TRUNG, tenTrenDau: true,
      chay(tran) {
        const cam = layCamera();
        if (!cam) return 0;
        damBaoPlasma(cam);
        batDauPlasma(tran, cam);
        plasma.setHue(gocMau(tran.mau));
        tran.dongTac("phepLon");
        plasma.play({
          target: tran.quai.nhom,
          onHit: () => {
            const p = tran.quai.tam.clone();
            tran.quai.chop(0.50);
            hu.chop(p, tran.mau, 2.2, 0.40, 0.60);
            hu.tia(p, tran.mau, nhe ? 14 : 26, nhe ? 4 : 7);
            hu.songXung(V(tran.quai.chan.x, 0, tran.quai.chan.z), tran.mau, 2.4, 0.65);
            hu.rung(0.08, 0.45);
            for (let i = 0; i < bo.so(nhe ? 18 : 36); i++)
              bo.hat("no", { p, v: V(ngau(-3.5, 3.5), ngau(0.5, 4.5), ngau(-1.8, 1.8)), g: 6, song: ngau(0.5, 0.95), co: ngau(0.18, 0.35), mau: tran.mau, sang: 2.4 });
            if (tran.am && tran.am.thachNo) tran.am.thachNo(tran.quai.chan.x, 0.90);
          }
        });
        return PL_TONG;
      }
    }
  ];

  function capNhat(dt, t) {
    if (plasma) plasma.update(dt);
    if (pl) { pl.t += dt; capNhatTuChieu(dt); }
    for (let i = vat.length - 1; i >= 0; i--) {
      const v = vat[i]; v.con -= dt;
      v.cap(Math.min(1, 1 - Math.max(0, v.con) / v.tong), dt, t);
      if (v.con <= 0) { canh.remove(v.o); v.o.traverse(m => { if (m.geometry) m.geometry.dispose(); if (m.material) m.material.dispose(); }); vat.splice(i, 1); }
    }
  }

  return { ds, capNhat };
}
// 30/10/2026 - BƯỚC: TC_D05B2
// 08/11/2026 - Antigravity: chiêu plasma_beam + camera điện ảnh (nhánh agy/chieu-plasma-nhan-toc)
// 25/11/2026 - BƯỚC: TC_D05E (tích hợp: camera theo vị trí thật + khổ màn hình, tay trong người Thủ lĩnh, trúng = PL_TRUNG)
