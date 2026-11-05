// ================================================================
// FILE: dt/dt_tien_do.js
// CHỨC NĂNG: Tiến độ game Đấu Trường Tri Thức của từng bé (theo tên đăng nhập):
//            tên vương quốc, tên Thủ lĩnh, chủng loại (chỉ số), lớp đang học, thời kỳ.
//            TC_D09: LƯU THEO TÀI KHOẢN trên Supabase (bảng kc_dt_tien_do + kc_nhan_vat, mỗi bé một
//            dòng, mỗi thuộc tính một cột; SQL repo_rieng/SQL/supabase_tc_d09_tien_do.sql).
//            localStorage "kc_dt_tien_do_<tenDangNhap>" chỉ còn là BỘ ĐỆM (mở trang nhanh, mất mạng vẫn chơi).
//            - dongBo(): mở sảnh thì hỏi máy chủ; máy chủ có thì chép về máy (đổi máy vẫn còn Thủ lĩnh);
//              máy có bản chưa gửi được (chuaGui) hoặc máy chủ chưa có thì gửi bản của máy lên.
//            - gui(): tạo / sửa Thủ lĩnh xong thì gửi; lỗi mạng thì đánh dấu chuaGui, lần mở sau gửi lại.
//            NGOẠI HÌNH nhân vật dùng chung toàn app (chung/nv_ho_so.js) cũng gửi kèm ở đây.
// BƯỚC: TC_D01; TC_D09
// NGÀY: 21/10/2026; 05/11/2026
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
      capNhat: td.capNhat || null,
      chuaGui: !!td.chuaGui // TC_D09: bản trên máy chưa gửi được lên máy chủ
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

  // ---------------- TC_D09: máy chủ ----------------
  // goiRpc(tenHam, thamSo) -> Promise (kcGoiRpc); maPhien: mã phiên đăng nhập chung.
  function hoSoCua(ten, td) {
    var HS = goc.KC_NV_HO_SO, NV = goc.KC_NV;
    var h = HS ? HS.doc(ten) : null;
    if (!h && NV) h = NV.chuanHoa({ chungLoai: td.chungLoai });
    return h || { chungLoai: td.chungLoai, gioi: "nam", kieuToc: 0, mauToc: 1, mauDa: 0, mauAo: 0 };
  }

  // Máy chủ trả bản đã lưu -> chép về máy (không đánh dấu chuaGui). Trả { tienDo, hoSo }.
  function chepVe(ten, kq, kho) {
    if (kq.tienDo) luu(ten, kq.tienDo, kho);
    if (kq.hoSo && goc.KC_NV_HO_SO) goc.KC_NV_HO_SO.luu(ten, kq.hoSo, kho);
    return { tienDo: doc(ten, kho), hoSo: goc.KC_NV_HO_SO ? goc.KC_NV_HO_SO.doc(ten, kho) : null };
  }

  function gui(ten, maPhien, goiRpc, kho) {
    var td = doc(ten, kho);
    if (!ten || !td || typeof goiRpc !== "function") return Promise.resolve(null);
    var h = hoSoCua(ten, td);
    return Promise.resolve(goiRpc("kc_dt_luu_tien_do", {
      p_ten: ten, p_ma_phien: maPhien || "",
      p_ten_vuong_quoc: td.tenVuongQuoc, p_ten_thu_linh: td.tenThuLinh, p_chung_loai: td.chungLoai, p_lop: td.lop,
      p_gioi: h.gioi, p_kieu_toc: h.kieuToc, p_mau_toc: h.mauToc, p_mau_da: h.mauDa, p_mau_ao: h.mauAo
    })).then(function (kq) {
      if (kq && kq.thanhCong) return chepVe(ten, kq, kho);
      td.chuaGui = true; luu(ten, td, kho);
      return null;
    }, function () { td.chuaGui = true; luu(ten, td, kho); return null; });
  }

  function dongBo(ten, maPhien, goiRpc, kho) {
    var trenMay = function () { return { tienDo: doc(ten, kho), hoSo: goc.KC_NV_HO_SO ? goc.KC_NV_HO_SO.doc(ten, kho) : null }; };
    if (!ten || typeof goiRpc !== "function") return Promise.resolve(trenMay());
    return Promise.resolve(goiRpc("kc_dt_doc_tien_do", { p_ten: ten, p_ma_phien: maPhien || "" })).then(function (kq) {
      if (!kq || !kq.thanhCong) return trenMay(); // mất mạng / phiên hết hạn: dùng bộ đệm
      var td = doc(ten, kho);
      if (td && (td.chuaGui || !kq.tienDo)) return gui(ten, maPhien, goiRpc, kho).then(function (r) { return r || trenMay(); });
      if (kq.tienDo) return chepVe(ten, kq, kho);
      return trenMay();
    }, trenMay);
  }

  goc.KC_DT_TIEN_DO = { khoa: khoa, doc: doc, luu: luu, chuanHoa: chuanHoa, gui: gui, dongBo: dongBo };
})(typeof window !== "undefined" ? window : globalThis);
