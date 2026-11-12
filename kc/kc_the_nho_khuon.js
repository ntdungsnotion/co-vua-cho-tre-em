// ================================================================
// FILE: kc/kc_the_nho_khuon.js
// CHỨC NĂNG: Khuôn 9 hình dạng của THẺ NHỚ (kho tri thức chung toàn app, bảng kc_the_nho trên Supabase).
//   - kiemThe(the)  : kiểm một thẻ theo Chuẩn Dữ Liệu (repo_rieng/Thiet_Ke_Kho_Tri_Thuc.md mục 5), trả { loi: [...], manh: [{ma, ten}] }.
//                     Danh sách MẢNH NHỚ (đơn vị nhỏ nhất ghi tiến độ trong Sổ Ghi Nhớ) tính ở đây, kể cả mảnh sinh tự động
//                     (bảng tính). Máy chủ lưu danh sách mảnh vào cột manh để chấm câu / ghi tiến độ không phải tính lại.
//   - sinhCap(sinh) : bung luật sinh "bang_tinh" thành các cặp hỏi đáp (7 × 8 = 56 -> mảnh 7x8).
//   - chu(pt)       : đổi một "phương tiện" (chữ, công thức, hoá học, hình, âm thanh, mã, màu, IPA) ra chữ thường để hiển thị tạm.
//   Dùng ở: trang Quản trị › 📚 Kho tri thức (xem thẻ), công cụ nạp thẻ repo_rieng/kho_tri_thuc/cong_cu/nap_the.js (Node),
//   sau này trang Ôn thẻ (KC_03C) và ô nhập JSON (KC_03B2).
// BƯỚC: KC_03B1 - NGÀY: 12/11/2026
// ================================================================
(function (goc) {
  "use strict";

  var HINH_DANG = {
    hoi_dap: "Hỏi đáp", nhieu_mat: "Nhiều mặt", cong_thuc: "Công thức", quy_tac: "Quy tắc", thu_tu: "Thứ tự",
    nhom: "Nhóm", thuoc_long: "Thuộc lòng", tren_hinh: "Trên hình", quy_trinh: "Quy trình"
  };
  // Chiều hỏi mặc định của mỗi khuôn, từ dễ đến khó (Thiet_Ke_So_Ghi_Nho.md 5.2)
  var CHIEU_MAC_DINH = {
    hoi_dap: ["nhan_ra", "nho_lai", "dien_khuyet"], nhieu_mat: ["nhan_ra", "ghep_cap", "nho_lai"],
    cong_thuc: ["nhan_ra", "dien_khuyet", "nho_lai", "ap_dung"], quy_tac: ["nhan_ra", "ap_dung", "tim_loi", "dien_khuyet"],
    thu_tu: ["sap_xep", "nhan_ra", "dat_len_truc"], nhom: ["keo_tha", "nhan_ra"], thuoc_long: ["dien_khuyet", "sap_xep", "noi", "nghe"],
    tren_hinh: ["cham_hinh", "keo_tha", "nhan_ra"], quy_trinh: ["sap_xep", "tinh_huong", "mo_phong"]
  };
  var CHIEU = ["nhan_ra", "ghep_cap", "nghe", "nghe_so_sanh", "tinh_huong", "sap_xep", "keo_tha", "dat_len_truc", "cham_hinh",
    "nho_lai", "dien_khuyet", "viet_dung", "bam_so", "go_phim", "tim_loi", "ap_dung", "tinh_nhanh", "mo_phong", "noi"];
  var LOAI_PT = ["cong_thuc", "hoa_hoc", "hinh", "am_thanh", "ma", "mau", "ipa"];
  var RE_ID = /^[a-z0-9_]{3,80}$/, RE_MANH = /^[a-z0-9_-]{1,40}$/, RE_MA = /^[a-z0-9_]{1,40}$/;
  var PHEP = { "+": ["p", "+"], "-": ["t", "−"], "x": ["x", "×"], ":": ["c", ":"] };
  var TOI_DA_MANH = 300;

  // ---------------- phương tiện ----------------
  var SO_DUOI = { 0: "₀", 1: "₁", 2: "₂", 3: "₃", 4: "₄", 5: "₅", 6: "₆", 7: "₇", 8: "₈", 9: "₉" };
  var SO_TREN = { 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹", "+": "⁺", "-": "⁻" };
  // "H2SO4" -> H₂SO₄ ; "SO4^2-" -> SO₄²⁻ ; "->" -> → ; "<=>" -> ⇌
  function hoaHoc(ct) {
    return String(ct || "").replace(/<=>/g, "⇌").replace(/->/g, "→")
      .replace(/\^([0-9]*[+-])/g, function (_, d) { return d.split("").map(function (k) { return SO_TREN[k] || k; }).join(""); })
      .replace(/([A-Za-z)\]])(\d+)/g, function (_, a, d) { return a + d.split("").map(function (k) { return SO_DUOI[k]; }).join(""); });
  }
  function chu(pt) {
    if (pt === null || pt === undefined) return "";
    if (typeof pt === "string" || typeof pt === "number") return String(pt);
    if (Array.isArray(pt)) return pt.map(chu).join(", ");
    switch (pt.loai) {
      case "cong_thuc": return pt.chu || pt.tex || "";
      case "hoa_hoc": return hoaHoc(pt.ct);
      case "hinh": return pt.chu || "🖼️";
      case "am_thanh": return pt.chu || "🔊";
      case "ma": return pt.ma || "";
      case "mau": return pt.ten || pt.ma || "";
      case "ipa": return "/" + (pt.ipa || "") + "/";
      default: return "";
    }
  }
  function kiemPt(pt, cho, loi, batBuoc) {
    if (pt === null || pt === undefined || pt === "") { if (batBuoc) loi.push(cho + ": thiếu"); return; }
    if (typeof pt === "number") return;
    if (typeof pt === "string") { if (pt.length > 2000) loi.push(cho + ": dài quá 2000 ký tự"); return; }
    if (typeof pt !== "object" || Array.isArray(pt)) { loi.push(cho + ": phải là chữ hoặc {loai, ...}"); return; }
    if (LOAI_PT.indexOf(pt.loai) < 0) { loi.push(cho + ": loại phương tiện lạ '" + pt.loai + "'"); return; }
    var can = { cong_thuc: "tex", hoa_hoc: "ct", hinh: "url", ma: "ma", mau: "ma", ipa: "ipa" }[pt.loai];
    if (can && !pt[can]) loi.push(cho + ": " + pt.loai + " thiếu '" + can + "'");
    if (pt.loai === "am_thanh" && !pt.chu && !pt.url && !pt.cao_do) loi.push(cho + ": âm thanh cần chu, url hoặc cao_do");
    if (pt.loai === "mau" && pt.ma && !/^#[0-9a-fA-F]{6}$/.test(pt.ma)) loi.push(cho + ": mã màu phải dạng #rrggbb");
  }

  // ---------------- luật sinh ----------------
  // { loai: "bang_tinh", phep: "x", so: 7, tu: 1, den: 10 } -> 7 × 1 ... 7 × 10. Chia: (so·i) : so. Trừ: (so + i) − so.
  function sinhCap(s) {
    var p = PHEP[s.phep], ra = [];
    for (var i = s.tu; i <= s.den; i++) {
      var a, b, kq;
      if (s.phep === "+") { a = s.so; b = i; kq = a + b; }
      else if (s.phep === "-") { a = s.so + i; b = s.so; kq = i; }
      else if (s.phep === "x") { a = s.so; b = i; kq = a * b; }
      else { a = s.so * i; b = s.so; kq = i; }
      ra.push({ ma: a + p[0] + b, hoi: a + " " + p[1] + " " + b + " = ?", dap: String(kq), ten: a + " " + p[1] + " " + b });
    }
    return ra;
  }
  function kiemSinh(s, loi) {
    if (!s || s.loai !== "bang_tinh") { loi.push("sinh.loai chỉ nhận 'bang_tinh'"); return false; }
    if (!PHEP[s.phep]) loi.push("sinh.phep phải là + - x :");
    ["so", "tu", "den"].forEach(function (k) { if (!Number.isInteger(s[k]) || s[k] < 0 || s[k] > 1000) loi.push("sinh." + k + " phải là số nguyên 0-1000"); });
    if (s.den < s.tu || s.den - s.tu > 100) loi.push("sinh: tu ≤ den, tối đa 100 phép");
    if (s.phep === ":" && s.so === 0) loi.push("sinh: không chia cho 0");
    return !loi.length;
  }

  // ---------------- kiểm một thẻ ----------------
  function mang(x) { return Array.isArray(x) ? x : []; }
  function kiemMa(ds, cho, loi, re) {
    var gap = {};
    ds.forEach(function (x, i) {
      var ma = x && x.ma;
      if (typeof ma !== "string" || !(re || RE_MANH).test(ma)) loi.push(cho + "[" + i + "].ma '" + ma + "' chỉ gồm a-z, 0-9, _ , - (≤ 40)");
      else if (gap[ma]) loi.push(cho + ": trùng mã '" + ma + "'"); else gap[ma] = 1;
    });
    return gap;
  }

  function kiemThe(t) {
    var loi = [], manh = [];
    if (!t || typeof t !== "object") return { loi: ["thẻ phải là đối tượng JSON"], manh: [] };
    if (typeof t.id !== "string" || !RE_ID.test(t.id)) loi.push("id '" + t.id + "' chỉ gồm a-z, 0-9, _ (3-80 ký tự)");
    if (typeof t.mon !== "string" || !/^[a-z_]{2,20}$/.test(t.mon)) loi.push("mon thiếu hoặc sai");
    if (typeof t.chuDe !== "string" || !RE_MA.test(t.chuDe)) loi.push("chuDe thiếu hoặc sai (a-z, 0-9, _)");
    if (t.bo !== undefined && t.bo !== null && (typeof t.bo !== "string" || !RE_ID.test(t.bo))) loi.push("bo sai mã");
    if (!Number.isInteger(t.lopTu) || t.lopTu < 0 || t.lopTu > 12) loi.push("lopTu phải 0-12");
    if (t.lopDen !== undefined && t.lopDen !== null && (!Number.isInteger(t.lopDen) || t.lopDen < t.lopTu || t.lopDen > 12)) loi.push("lopDen phải từ lopTu đến 12");
    if (!HINH_DANG[t.hinhDang]) loi.push("hinhDang phải là 1 trong: " + Object.keys(HINH_DANG).join(", "));
    if (typeof t.tieuDe !== "string" || !t.tieuDe.trim() || t.tieuDe.length > 120) loi.push("tieuDe thiếu hoặc dài quá 120");
    if ((t.hinhDang === "cong_thuc" || t.hinhDang === "quy_tac") && !(t.nguCanh && String(t.nguCanh).trim()))
      loi.push("nguCanh (ví dụ / ngữ cảnh) bắt buộc với " + t.hinhDang);
    ["hieuLucTu", "kiemLai"].forEach(function (k) { if (t[k] && !/^\d{4}-\d{2}-\d{2}$/.test(t[k])) loi.push(k + " phải dạng YYYY-MM-DD"); });
    if (t.vung && !/^(bac|trung|nam|[a-z_]{2,30})$/.test(t.vung)) loi.push("vung sai");
    mang(t.lienQuan).forEach(function (l, i) {
      if (!l || ["the", "tu", "bo"].indexOf(l.loai) < 0 || !l.ma) loi.push("lienQuan[" + i + "] cần {loai: the|tu|bo, ma}");
    });
    if (t.lienQuan !== undefined && !Array.isArray(t.lienQuan)) loi.push("lienQuan phải là mảng");
    var nd = t.noiDung;
    if (!nd || typeof nd !== "object" || Array.isArray(nd)) { loi.push("noiDung phải là đối tượng"); return { loi: loi, manh: [] }; }
    if (nd.chieu !== undefined) mang(nd.chieu).forEach(function (c) { if (CHIEU.indexOf(c) < 0) loi.push("chiều hỏi lạ '" + c + "'"); });

    var k = t.hinhDang;
    if (k === "hoi_dap") {
      if (nd.sinh) {
        if (kiemSinh(nd.sinh, loi)) sinhCap(nd.sinh).forEach(function (c) { manh.push({ ma: c.ma, ten: c.ten }); });
      } else {
        var cap = mang(nd.cap);
        if (!cap.length) loi.push("hoi_dap cần cap: [{ma, hoi, dap}] hoặc sinh");
        kiemMa(cap, "cap", loi);
        cap.forEach(function (c, i) {
          kiemPt(c.hoi, "cap[" + i + "].hoi", loi, true); kiemPt(c.dap, "cap[" + i + "].dap", loi, true);
          mang(c.dap_khac).forEach(function (d, j) { kiemPt(d, "cap[" + i + "].dap_khac[" + j + "]", loi, true); });
          manh.push({ ma: c.ma, ten: c.ten || chu(c.hoi) });
        });
      }
    } else if (k === "nhieu_mat") {
      var tr = mang(nd.truong);
      if (tr.length < 2) loi.push("nhieu_mat cần ít nhất 2 trường: truong: [{ma, ten}]");
      var coTr = kiemMa(tr, "truong", loi, RE_MA);
      tr.forEach(function (x, i) { if (!x.ten) loi.push("truong[" + i + "].ten thiếu"); });
      mang(nd.hoi).forEach(function (h, i) {
        if (!Array.isArray(h) || h.length !== 2 || !coTr[h[0]] || !coTr[h[1]] || h[0] === h[1]) loi.push("hoi[" + i + "] phải là [trường hỏi, trường đáp] có trong truong");
      });
      var mu = mang(nd.muc);
      if (!mu.length) loi.push("nhieu_mat cần muc: [{ma, gia_tri: {...}}]");
      kiemMa(mu, "muc", loi);
      mu.forEach(function (m, i) {
        var g = m.gia_tri || {};
        tr.slice(0, 2).forEach(function (x) { kiemPt(g[x.ma], "muc[" + i + "].gia_tri." + x.ma, loi, true); });
        tr.slice(2).forEach(function (x) { kiemPt(g[x.ma], "muc[" + i + "].gia_tri." + x.ma, loi, false); });
        Object.keys(g).forEach(function (kk) { if (!coTr[kk]) loi.push("muc[" + i + "]: trường lạ '" + kk + "'"); });
        manh.push({ ma: m.ma, ten: chu(g[(tr[0] || {}).ma]) + (tr[1] ? " ↔ " + chu(g[tr[1].ma]) : "") });
      });
    } else if (k === "cong_thuc") {
      if (["toan", "phuong_trinh", "ma"].indexOf(nd.kieu) < 0) loi.push("cong_thuc.kieu phải là toan / phuong_trinh / ma");
      kiemPt(nd.bieu_thuc, "bieu_thuc", loi, true);
      manh.push({ ma: "bieu_thuc", ten: "Công thức" });
      var kh = mang(nd.ki_hieu);
      kh.forEach(function (x, i) { if (!x.kh || !x.nghia) loi.push("ki_hieu[" + i + "] cần kh + nghia"); });
      if (kh.length) manh.push({ ma: "ki_hieu", ten: "Ý nghĩa ký hiệu" });
      if (nd.dieu_kien) { kiemPt(nd.dieu_kien, "dieu_kien", loi, true); manh.push({ ma: "dieu_kien", ten: "Điều kiện dùng" }); }
      mang(nd.dang_tuong_duong).forEach(function (d, i) { kiemPt(d, "dang_tuong_duong[" + i + "]", loi, true); });
      if (nd.sinh_so) manh.push({ ma: "ap_dung", ten: "Áp dụng" });
    } else if (k === "quy_tac") {
      kiemPt(nd.phat_bieu, "phat_bieu", loi, true);
      var ct = mang(nd.cau_truc), nl = mang(nd.ngoai_le);
      kiemMa(ct.concat(nl), "cau_truc + ngoai_le", loi);
      ct.forEach(function (x, i) { kiemPt(x.mau, "cau_truc[" + i + "].mau", loi, true); manh.push({ ma: x.ma, ten: x.ten || chu(x.mau) }); });
      if (!ct.length) manh.push({ ma: "phat_bieu", ten: "Phát biểu" });
      if (mang(nd.dau_hieu).length) manh.push({ ma: "dau_hieu", ten: "Dấu hiệu nhận biết" });
      nl.forEach(function (x, i) { kiemPt(x.noi_dung, "ngoai_le[" + i + "].noi_dung", loi, true); manh.push({ ma: x.ma, ten: "Ngoại lệ: " + chu(x.noi_dung) }); });
      mang(nd.vi_du).forEach(function (v, i) { kiemPt(v, "vi_du[" + i + "]", loi, true); });
    } else if (k === "thu_tu") {
      var pt = mang(nd.phan_tu);
      if (pt.length < 2) loi.push("thu_tu cần ít nhất 2 phần tử");
      kiemMa(pt, "phan_tu", loi);
      pt.forEach(function (x, i) {
        kiemPt(x.ten, "phan_tu[" + i + "].ten", loi, true);
        if (x.moc !== undefined && typeof x.moc !== "number" && typeof x.moc !== "string") loi.push("phan_tu[" + i + "].moc phải là số năm hoặc chữ");
        manh.push({ ma: x.ma, ten: chu(x.ten) });
      });
      if (pt.some(function (x) { return x.ma === "ca_day"; })) loi.push("mã 'ca_day' dành cho mảnh cả dãy");
      manh.push({ ma: "ca_day", ten: "Cả dãy" });
    } else if (k === "nhom") {
      var nh = mang(nd.nhom), ph = mang(nd.phan_tu);
      if (nh.length < 2) loi.push("nhom cần ít nhất 2 nhóm");
      var coNh = kiemMa(nh, "nhom", loi, RE_MA);
      kiemMa(ph, "phan_tu", loi);
      if (!ph.length) loi.push("nhom cần phan_tu");
      ph.forEach(function (x, i) {
        kiemPt(x.ten, "phan_tu[" + i + "].ten", loi, true);
        if (!coNh[x.nhom]) loi.push("phan_tu[" + i + "].nhom '" + x.nhom + "' không có trong danh sách nhóm");
        manh.push({ ma: x.ma, ten: chu(x.ten) });
      });
    } else if (k === "thuoc_long") {
      var vb = mang(nd.van_ban);
      if (!vb.length) loi.push("thuoc_long cần van_ban: [{ma, dong: [...]}]");
      kiemMa(vb, "van_ban", loi);
      vb.forEach(function (x, i) {
        if (!mang(x.dong).length) loi.push("van_ban[" + i + "].dong trống");
        manh.push({ ma: x.ma, ten: x.ten || ("Đoạn " + (i + 1)) });
      });
    } else if (k === "tren_hinh") {
      if (!nd.hinh && !nd.hinh_nen) loi.push("tren_hinh cần hinh {loai:'hinh', url} hoặc hinh_nen (mã hình dùng chung)");
      if (nd.hinh) kiemPt(nd.hinh, "hinh", loi, true);
      if (nd.hinh_nen && !RE_MA.test(nd.hinh_nen)) loi.push("hinh_nen sai mã");
      var di = mang(nd.diem), vu = mang(nd.vung);
      if (!di.length && !vu.length) loi.push("tren_hinh cần diem hoặc vung");
      kiemMa(di.concat(vu), "diem + vung", loi);
      di.forEach(function (x, i) {
        if (typeof x.x !== "number" || typeof x.y !== "number" || x.x < 0 || x.x > 100 || x.y < 0 || x.y > 100) loi.push("diem[" + i + "]: x, y tính theo % (0-100)");
        manh.push({ ma: x.ma, ten: chu(x.ten) });
      });
      vu.forEach(function (x, i) {
        if (mang(x.da_giac).length < 3) loi.push("vung[" + i + "].da_giac cần ≥ 3 điểm [x, y]");
        manh.push({ ma: x.ma, ten: chu(x.ten) });
      });
    } else if (k === "quy_trinh") {
      var bu = mang(nd.buoc);
      if (bu.length < 2) loi.push("quy_trinh cần ít nhất 2 bước");
      var coB = kiemMa(bu, "buoc", loi);
      bu.forEach(function (x, i) {
        kiemPt(x.viec, "buoc[" + i + "].viec", loi, true);
        mang(x.neu).forEach(function (n, j) { if (!n.dieu_kien || !coB[n.den]) loi.push("buoc[" + i + "].neu[" + j + "] cần dieu_kien + den (mã bước có thật)"); });
        manh.push({ ma: x.ma, ten: chu(x.viec) });
      });
    }
    if (manh.length > TOI_DA_MANH) loi.push("quá " + TOI_DA_MANH + " mảnh, hãy tách thẻ");
    return { loi: loi, manh: manh };
  }

  var API = { HINH_DANG: HINH_DANG, CHIEU_MAC_DINH: CHIEU_MAC_DINH, CHIEU: CHIEU, kiemThe: kiemThe, sinhCap: sinhCap, chu: chu, hoaHoc: hoaHoc };
  if (typeof module !== "undefined" && module.exports) module.exports = API; else goc.KC_THE_NHO = API;
})(typeof window !== "undefined" ? window : this);
// 12/11/2026 - BƯỚC: KC_03B1
