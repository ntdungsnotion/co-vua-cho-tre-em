/* ================================================================
   FILE: chung/nv_ho_so.js
   CHỨC NĂNG: LƯU NGOẠI HÌNH NHÂN VẬT CỦA BÉ, DÙNG CHUNG TOÀN APP (người dùng yêu cầu
              21/10/2026: hình nhân vật dùng chung, vd Giải Cứu Mèo Con).
              Mỗi tài khoản một hồ sơ ngoại hình (chủng loại, giới, tóc, da, áo) ở
              localStorage "kc_nhan_vat_<tenDangNhap>". Game nào cũng đọc được để vẽ bằng
              chung/nv_ve.js. Tên vương quốc, tên Thủ lĩnh, lớp... là của từng game,
              KHÔNG để ở đây. Sau này (TC_D09) chuyển lên Supabase, localStorage làm bộ đệm.
   BƯỚC: TC_D01
   NGÀY: 21/10/2026
   PHỤ THUỘC: chung/nv_ve.js (KC_NV.chuanHoa)
   ================================================================ */
(function (goc) {
  "use strict";
  const TIEN_TO = "kc_nhan_vat_";
  const khoa = ten => TIEN_TO + String(ten || "").trim().toLowerCase();

  function doc(ten, kho) {
    kho = kho || goc.localStorage;
    if (!ten || !kho) return null;
    try {
      const tho = kho.getItem(khoa(ten));
      if (!tho) return null;
      const h = JSON.parse(tho);
      return h && typeof h === "object" ? goc.KC_NV.chuanHoa(h) : null;
    } catch (e) { return null; }
  }

  function luu(ten, hoSo, kho) {
    kho = kho || goc.localStorage;
    if (!ten || !kho) return false;
    const h = goc.KC_NV.chuanHoa(hoSo);
    h.phienBan = 1;
    h.capNhat = new Date().toISOString();
    try { kho.setItem(khoa(ten), JSON.stringify(h)); return true; } catch (e) { return false; }
  }

  goc.KC_NV_HO_SO = { khoa, doc, luu };
})(typeof window !== "undefined" ? window : globalThis);
