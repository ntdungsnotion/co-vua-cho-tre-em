// ================================================================
// FILE: dt/3d/dt3d_tuong_ban_do.js  (ES module) - PHẦN VẼ 3D: TƯỚNG THẬT TRÊN BẢN ĐỒ THUNG LŨNG
// CHỨC NĂNG: Thủ lĩnh trên bản đồ là đúng tướng trong trận (đặc tả repo_rieng dau_truong_tri_thuc/dac_ta_tuong.md mục 8):
//            hỏi SỔ TƯỚNG (dt/dt_tuong.js) "hồ sơ này là mẫu nào", tải file .glb qua bộ lưu sẵn (taiGlb -> dt3d_luu_san.js),
//            mỗi file đọc vào bộ nhớ MỘT lần (ai trùng mẫu dùng chung), dựng bằng dt3d_tuong.js (SkeletonUtils.clone,
//            mỗi Thủ lĩnh một AnimationMixer). Bộ nhân vật (dt3d_nhan_vat.js) gọi tao() và chạy động tác.
//            Không hình tạm: Thủ lĩnh của bé chờ ở màn tải đầu; Thủ lĩnh bạn chưa có file thì chưa hiện, tải xong mới hiện.
//            Chế độ đồ hoạ Nhẹ: Thủ lĩnh BẠN vẽ bằng KayKit (lựa chọn cố định của chế độ Nhẹ, người dùng 25/11/2026).
// HÀM KHAI RA:
//   taoTuongBanDo({ ctx, so, dongTac, taiTep(tep) -> Promise<gltf>, cauHinh, nhe }) -> tb = {
//     mau(hoSo) -> mẫu (so.thuLinh; tep null = KayKit)
//     cua(hoSo, laBe) -> undefined (KayKit) | { glb, mau } (đã có) | Promise<{ glb, mau } | null>   (đối số thứ 4 của boNv.tao)
//     choBe(hoSo) -> Promise<{ glb, mau } | null>   (màn tải đầu chờ tướng của chính bé)
//     tao(glb, mau) -> tuong (dt3d_tuong.js; vo chưa gắn vào cảnh)
//     tocChan(kieu "di" | "chay") -> ô / giây của động tác ở tướng cao 1 ô;  muc() -> { dayDu }
//     cao -> chiều cao tướng trên bản đồ (ô) }
//   Số trong cau_hinh.json banDo.tuongThat (Quản trị sửa được): cao, dayDu (số tướng chạy hoạt ảnh mỗi khung), tocDi, tocChay.
// LUẬT NỐI: chỉ ctx (dt3d_canh.js) + sổ tướng; không đọc thẳng tuong.json, không viết tên file / tộc trong mã (LUAT_DAU_TRUONG.md luật 3).
// BƯỚC: TC_D05C0b2 - NGÀY: 26/11/2026
// ================================================================
import { taoBoTuong } from "./dt3d_tuong.js";

// dự phòng khi cau_hinh.json thiếu khối; tocDi / tocChay đo bằng repo_rieng kiem_thu/tc_d05c0b2_sai_chan_chrome.mjs (6 tướng: 0,72-0,82 / 1,48-1,67)
const MAC_DINH = { cao: 1.35, dayDu: 8, tocDi: 0.77, tocChay: 1.58 };

export function taoTuongBanDo({ ctx, so, dongTac, taiTep, cauHinh, nhe }) {
  const S = Object.assign({}, MAC_DINH, ((cauHinh || {}).banDo || {}).tuongThat || {});
  const boTuong = taoBoTuong(ctx, dongTac);
  const daCo = new Map(), dangTai = new Map(); // tep -> gltf / Promise
  function tai(tep) {
    if (daCo.has(tep)) return Promise.resolve(daCo.get(tep));
    if (!dangTai.has(tep)) dangTai.set(tep, taiTep(tep).then(g => { daCo.set(tep, g); return g; }, e => { dangTai.delete(tep); throw e; }));
    return dangTai.get(tep);
  }
  const mau = hoSo => so.thuLinh(hoSo || {});
  // mẫu không có file, hoặc file hỏng -> null (KayKit); file của duPhong cũng hỏng thì KayKit
  function theoMau(m) {
    if (!m.tep) return null;
    if (daCo.has(m.tep)) return { glb: daCo.get(m.tep), mau: m };
    return tai(m.tep).then(glb => ({ glb, mau: m }), () => {
      const d = so.du && so.du.tuong && so.mau(so.du.tuong.duPhong);
      return d && d.tep && d.tep !== m.tep ? tai(d.tep).then(glb => ({ glb, mau: d }), () => null) : null;
    });
  }
  return {
    cao: S.cao,
    mau,
    cua(hoSo, laBe) { if (nhe && !laBe) return undefined; const m = mau(hoSo); return m.tep ? theoMau(m) : undefined; },
    choBe(hoSo) { return Promise.resolve(theoMau(mau(hoSo))); },
    tao(glb, m) {
      const dt = m.dongTac || {};
      // cao trên bản đồ theo tỉ lệ chiều cao của mẫu (sổ tướng `cao`, mặc định 1,85 m = S.cao ô)
      const t = boTuong.tao(glb, { boDongTac: dt.bo, dungTay: dt.dungTay, dungTran: dt.dungTran }, S.cao * (m.cao || 1.85) / 1.85);
      ctx.canh.remove(t.vo); // bộ nhân vật gắn vào vỏ của nó
      return t;
    },
    tocChan: kieu => (kieu === "chay" ? S.tocChay : S.tocDi),
    muc: () => ({ dayDu: S.dayDu })
  };
}
// 26/11/2026 - BƯỚC: TC_D05C0b2 (tạo mới)
