// ================================================================
// FILE: dt/3d/dt3d_chieu_them.js  (ES module) - PHẦN VẼ 3D: KHO CHIÊU THÊM (phụ tá làm)
// CHỨC NĂNG: Kho chiêu chiến đấu bổ sung, mỗi chiêu một mục trong mảng ds. Sân đấu (dt3d_tran.js)
//            tự nạp file này; trang đấu thử tự hiện một nút cho mỗi mục. File lỗi => sân bỏ qua, vẫn chạy.
//            Việc giao: claude_code/GEMINI.md mục 3, việc A6.
// HÀM KHAI RA:
//   taoChieuThem({ ctx, hu, bo, cv, nhe, layCamera }) -> { ds, capNhat(dt, t) }
//     ctx: cảnh (ctx.canh, ctx.renderer, ctx.nang) - dt3d_canh.js
//     hu : hiệu ứng điểm dt3d_hieu_ung.js (chop, tia, songXung, vetChem, phong, set, cotLua, khien, khoi, gio, rung...)
//     bo : bộ hạt card đồ hoạ dt3d_hat.js  -> bo.hat("sang" | "lua" | "no" | "khoi", { p, v, g, can, song, co, coCuoi,
//          mau, mauCuoi, mo, hienDan, moCuoi, xoay, tocXoay, keoDai, sang, quy }), bo.so(n) (máy yếu ít hạt hơn)
//     cv : 7 chiêu vùng dt3d_chieu_vung.js (muaLua, thienThach, locXoay, damDat, voKhongGian, muaTen, chuongNangLuong)
//     nhe: máy yếu (giảm hạt / bỏ chi tiết)    layCamera(): camera đang dùng
//   ds[i] = { ma (chữ thường không dấu), nut (chữ trên nút thử, có biểu tượng), ten (tên chiêu hiện to, IN HOA),
//             chay(tran) -> số giây diễn }
//     tran = { be:   { tam, chan, cao }                   (Vector3 giữa thân / dưới chân người ra chiêu, chiều cao)
//              quai: { nhom, tam, chan, cao, chop(giay) }  (nhom = THREE.Group của đối thủ: được dời / xoay / ẩn TẠM,
//                                                           diễn xong PHẢI trả về như cũ)
//              dongTac(kieu)  (động tác tướng: "phep" | "phepLon" | "chem" | "chemLon" | "mung" | "thu")
//              them(giay, fn(p 0..1), tre)  (hoạt cảnh theo thời gian của sân: khựng hình thì chậm theo)
//              mau }          (màu chiêu theo tộc người ra chiêu)
// BƯỚC: TC_D05B2 (khung + chiêu ví dụ, Claude Code); A6 (phụ tá thêm chiêu)
// NGÀY: 30/10/2026
// ================================================================
import * as THREE from "three";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const ngau = (a, b) => a + Math.random() * (b - a);

export function taoChieuThem({ ctx, hu, bo, cv, nhe, layCamera }) {
  const { canh } = ctx;

  // vật tự xoá sau "giay" giây; cap(k 0..1, dt, t) gọi mỗi khung. Mọi lưới / vật liệu tạo mới phải đi qua đây
  // (hoặc tự dispose) để không rò bộ nhớ.
  const vat = [];
  function them(o, giay, cap) { canh.add(o); vat.push({ o, con: giay, tong: giay, cap }); return o; }

  const ds = [
    // CHIÊU VÍ DỤ (khung, Claude Code): xoá khi đã có chiêu thật.
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
    }
  ];

  function capNhat(dt, t) {
    for (let i = vat.length - 1; i >= 0; i--) {
      const v = vat[i]; v.con -= dt;
      v.cap(Math.min(1, 1 - Math.max(0, v.con) / v.tong), dt, t);
      if (v.con <= 0) { canh.remove(v.o); v.o.traverse(m => { if (m.geometry) m.geometry.dispose(); if (m.material) m.material.dispose(); }); vat.splice(i, 1); }
    }
  }

  return { ds, capNhat };
}
// 30/10/2026 - BƯỚC: TC_D05B2
