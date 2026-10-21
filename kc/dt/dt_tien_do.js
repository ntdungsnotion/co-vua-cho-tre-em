// ================================================================
// FILE: dt/dt_tien_do.js
// CHỨC NĂNG: Tiến độ game Đấu Trường Tri Thức của từng bé (theo tên đăng nhập):
//            tên vương quốc, tên Thủ lĩnh, chủng loại (chỉ số), lớp đang học, thời kỳ.
//            Lưu localStorage "kc_dt_tien_do_<tenDangNhap>"; TC_D09 chuyển lên Supabase
//            (bảng kc_dt_tien_do), localStorage làm bộ đệm.
//            NGOẠI HÌNH nhân vật KHÔNG lưu ở đây: dùng chung toàn app (chung/nv_ho_so.js).
// BƯỚC: TC_D01
// NGÀY: 21/10/2026
// ================================================================
(function (goc) {
  "use strict";
  var TIEN_TO = "kc_dt_tien_do_";
  var THOI_KY = ["do_da", "do_dong", "do_sat", "de_quoc"];
  var CHUNG_LOAI = ["nhan", "quy", "tien"];

  function khoa(ten) { return TIEN_TO + String(ten || "").trim().toLowerCase(); }

  function chuanHoa(td) {
    if (!td || typeof td !== "object" || !td.tenVuongQuoc || !td.tenThuLinh) return null;
    var lop = Math.floor(Number(td.lop));
    return {
      phienBan: 1,
      tenVuongQuoc: String(td.tenVuongQuoc).slice(0, 20),
      tenThuLinh: String(td.tenThuLinh).slice(0, 20),
      chungLoai: CHUNG_LOAI.indexOf(td.chungLoai) >= 0 ? td.chungLoai : "nhan",
      lop: lop >= 1 && lop <= 12 ? lop : 1,
      thoiKy: THOI_KY.indexOf(td.thoiKy) >= 0 ? td.thoiKy : "do_da",
      taoLuc: td.taoLuc || new Date().toISOString(),
      capNhat: td.capNhat || null
    };
  }

  function doc(ten, kho) {
    kho = kho || goc.localStorage;
    if (!ten || !kho) return null;
    try { return chuanHoa(JSON.parse(kho.getItem(khoa(ten)) || "null")); } catch (e) { return null; }
  }

  function luu(ten, td, kho) {
    kho = kho || goc.localStorage;
    var sach = chuanHoa(td);
    if (!ten || !kho || !sach) return false;
    sach.capNhat = new Date().toISOString();
    try { kho.setItem(khoa(ten), JSON.stringify(sach)); return true; } catch (e) { return false; }
  }

  goc.KC_DT_TIEN_DO = { khoa: khoa, doc: doc, luu: luu, chuanHoa: chuanHoa };
})(typeof window !== "undefined" ? window : globalThis);
