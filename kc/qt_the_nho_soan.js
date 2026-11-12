// ================================================================
// FILE: kc/qt_the_nho_soan.js
// CHỨC NĂNG: THÊM / SỬA thẻ nhớ + KIỂM TRÙNG TRƯỚC KHI LƯU trong Quản trị › 📚 Kho tri thức (KC_03B2,
//   repo_rieng/Thiet_Ke_Kho_Tri_Thuc.md mục 7B). Luật người dùng 12/11/2026: mỗi tri thức (mảnh nhớ) chỉ có MỘT bản trong kho.
//   - ➕ Thêm thẻ / ✏️ Sửa: ô soạn một thẻ. Nội dung soạn nhanh theo dòng cho 6 khuôn (hỏi đáp, nhiều mặt, thứ tự, nhóm, thuộc lòng,
//     quy trình), JSON cho mọi khuôn. Mã mảnh cũ được GIỮ khi sửa (tiến độ của bé không đứt). Xem trước đúng khuôn + lỗi khuôn ngay khi gõ.
//   - 📥 Nhập nhiều thẻ: dán / chọn tệp JSON ({bo, hinhNen, the} hoặc mảng thẻ), kiểm khuôn từng thẻ trên trình duyệt (kc_the_nho_khuon.js).
//   - Kiểm trùng ở máy chủ (kc_the_nho_admin_kiem_trung): trùng mã, trùng / gần giống tiêu đề, mảnh đã có ở thẻ khác, trùng trong lô.
//     Mỗi chỗ trùng hiện thẻ cũ (xem trước) và cho chọn: sửa thẻ cũ, bỏ thẻ mới, ghi đè (trùng mã), bỏ các mảnh trùng, vẫn lưu (chỉ khi
//     tiêu đề trùng mà nội dung khác). Lưu bằng kc_the_nho_admin_luu: máy chủ kiểm lại, trùng mảnh thì không bao giờ lưu.
// BƯỚC: KC_03B2 - NGÀY: 12/11/2026
// PHỤ THUỘC: ../admin_NC.js (adminThoat), kc_the_nho_khuon.js (KC_THE_NHO), qt_kho_tri_thuc.js (window.QTT, #qtsKhung),
//   qt_kho_tri_thuc.css (phần KC_03B2). SQL: repo_rieng/SQL/supabase_kc03b2_them_the.sql.
// ================================================================
(function () {
  "use strict";
  if (!window.QTT || !window.KC_THE_NHO || typeof adminThoat !== "function") return;
  var Q = window.QTT, K = window.KC_THE_NHO, T = adminThoat;
  var VIET_TAT = { toan: "toan", tieng_viet: "tv", tieng_anh: "ta", khoa_hoc: "kh", vat_ly: "vl", hoa_hoc: "hh", lich_su: "ls", dia_ly: "dl",
    do_vui: "dv", tnxh: "tnxh", khtn: "khtn", sinh_hoc: "sh", dao_duc_gdcd: "gdcd", tin_hoc: "th", cong_nghe: "cn", ky_nang_song: "kns",
    am_nhac: "an", mi_thuat: "mt", co_vua: "cv" };
  var TEN_HD = { hoi_dap: "❓ Hỏi đáp", nhieu_mat: "🔀 Nhiều mặt (bảng)", cong_thuc: "🧮 Công thức", quy_tac: "📏 Quy tắc", thu_tu: "🔢 Thứ tự",
    nhom: "🗂️ Nhóm", thuoc_long: "📜 Thuộc lòng", tren_hinh: "🖼️ Trên hình", quy_trinh: "🪜 Quy trình" };
  // Khuôn JSON mẫu cho thẻ mới (khuôn không có soạn nhanh, hoặc khi bấm "{ } JSON")
  var MAU = {
    hoi_dap: { cap: [{ ma: "cau_1", hoi: "Câu hỏi?", dap: "Đáp án" }] },
    nhieu_mat: { truong: [{ ma: "ten", ten: "Tên" }, { ma: "y_nghia", ten: "Ý nghĩa" }], muc: [{ ma: "muc_1", gia_tri: { ten: "...", y_nghia: "..." } }] },
    cong_thuc: { kieu: "toan", bieu_thuc: { loai: "cong_thuc", tex: "S = a \\times b", chu: "S = a × b" },
      ki_hieu: [{ kh: "S", nghia: "diện tích", don_vi: "cm²" }, { kh: "a, b", nghia: "chiều dài, chiều rộng" }], dieu_kien: "a, b cùng đơn vị đo" },
    quy_tac: { phat_bieu: "Phát biểu quy tắc", cau_truc: [{ ma: "cau_truc_1", ten: "Tên cấu trúc", mau: "Mẫu" }], dau_hieu: ["dấu hiệu"],
      vi_du: ["Ví dụ"], ngoai_le: [] },
    thu_tu: { phan_tu: [{ ma: "mot", ten: "Thứ nhất" }, { ma: "hai", ten: "Thứ hai" }] },
    nhom: { nhom: [{ ma: "nhom_a", ten: "Nhóm A" }, { ma: "nhom_b", ten: "Nhóm B" }], phan_tu: [{ ma: "pt_1", ten: "Phần tử 1", nhom: "nhom_a" }] },
    thuoc_long: { van_ban: [{ ma: "doan_1", dong: ["Dòng 1", "Dòng 2"] }] },
    tren_hinh: { hinh_nen: "cay_xanh", diem: [{ ma: "diem_1", ten: "Tên điểm", x: 50, y: 50 }] },
    quy_trinh: { buoc: [{ ma: "buoc_1", viec: "Bước 1" }, { ma: "buoc_2", viec: "Bước 2" }] }
  };

  // ---------------- chữ ----------------
  function boDau(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D"); }
  function slug(s, max) { return boDau(s).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, max || 30).replace(/_+$/, ""); }
  function chuan(s) { return String(s === undefined || s === null ? "" : s).toLowerCase().replace(/\s+/g, " ").trim(); }
  function laChu(x) { return typeof x === "string" || typeof x === "number"; }
  function maMoi(chu, daDung) {
    var goc = slug(chu, 30) || "m", ma = goc, i = 2;
    while (daDung[ma]) ma = goc + "_" + i++;
    daDung[ma] = 1; return ma;
  }
  function dong(van) { return String(van || "").split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean); }
  function chiaGach(d) { return d.split("|").map(function (x) { return x.trim(); }); }
  // Gán mã cho các mục mới, GIỮ mã của mục cũ (tiến độ học của bé gắn với mã mảnh):
  //   lượt 1 khớp theo nội dung (khoá); lượt 2 mục chưa khớp lấy mã của mục cũ cùng vị trí (vừa sửa chữ tại chỗ); còn lại mã mới từ chữ.
  function ganMa(cu, khoaCu, khoaMoi, chuMa) {
    cu = cu || [];
    var daDung = { ca_day: 1 }, theoKhoa = {}, ra = [], dungCu = {};
    cu.forEach(function (x, i) { var k = chuan(khoaCu(x)); if (k && theoKhoa[k] === undefined) theoKhoa[k] = i; });
    khoaMoi.forEach(function (k, j) {
      var i = theoKhoa[chuan(k)];
      if (i !== undefined && !dungCu[i] && cu[i].ma && !daDung[cu[i].ma]) { dungCu[i] = 1; daDung[cu[i].ma] = 1; ra[j] = cu[i]; }
    });
    khoaMoi.forEach(function (k, j) {
      if (ra[j]) return;
      var x = cu[j];
      if (x && !dungCu[j] && x.ma && !daDung[x.ma] && theoKhoa[chuan(khoaCu(x))] === j && khoaMoi.map(chuan).indexOf(chuan(khoaCu(x))) < 0) {
        dungCu[j] = 1; daDung[x.ma] = 1; ra[j] = x;
      }
    });
    khoaMoi.forEach(function (k, j) { if (!ra[j]) ra[j] = { ma: maMoi((chuMa && chuMa[j]) || k, daDung) }; });
    return ra;
  }
  function laSo(v) { return /^-?(0|[1-9]\d*)(\.\d+)?$/.test(v) ? Number(v) : v; }

  // ---------------- soạn nhanh theo dòng (6 khuôn) ----------------
  // docRa(noiDung) -> chữ (null nếu nội dung có phần soạn nhanh không giữ được: công thức, hình, bảng tính...)
  // ghiVao(chữ, noiDungCu) -> noiDung mới (giữ các trường khác của nội dung cũ)
  var NHANH = {
    hoi_dap: {
      goiY: "Mỗi dòng một cặp: câu hỏi | đáp án | đáp án khác (nếu có)\nVí dụ:\nThủ đô của Lào? | Viêng Chăn | Vientiane\n1 km = ? m | 1000",
      docRa: function (n) {
        if (n.sinh || !Array.isArray(n.cap)) return n.sinh ? null : "";
        if (!n.cap.every(function (c) { return laChu(c.hoi) && laChu(c.dap) && (c.dap_khac || []).every(laChu); })) return null;
        return n.cap.map(function (c) { return [c.hoi, c.dap].concat(c.dap_khac || []).join(" | "); }).join("\n");
      },
      ghiVao: function (van, n) {
        var ds = dong(van).map(chiaGach), cu = ganMa(n.cap, function (c) { return c.hoi; }, ds.map(function (p) { return p[0]; }));
        return Object.assign({}, n, { cap: ds.map(function (p, j) {
          var c = Object.assign({}, cu[j], { hoi: p[0], dap: p[1] || "" });
          var khac = p.slice(2).filter(Boolean);
          if (khac.length) c.dap_khac = khac; else delete c.dap_khac;
          return c;
        }) });
      }
    },
    thu_tu: {
      goiY: "Mỗi dòng một phần tử, theo đúng thứ tự. Có mốc (năm) thì viết: mốc | tên\nVí dụ:\nSao Thuỷ\nSao Kim\n…hoặc: 1010 | Dời đô về Thăng Long",
      docRa: function (n) {
        if (!(n.phan_tu || []).every(function (x) { return laChu(x.ten); })) return null;
        return (n.phan_tu || []).map(function (x) { return (x.moc !== undefined && x.moc !== null && x.moc !== "" ? x.moc + " | " : "") + x.ten; }).join("\n");
      },
      ghiVao: function (van, n) {
        var ds = dong(van).map(chiaGach), ten = ds.map(function (p) { return p.length > 1 ? p.slice(1).join(" | ") : p[0]; });
        var cu = ganMa(n.phan_tu, function (x) { return x.ten; }, ten);
        return Object.assign({}, n, { phan_tu: ds.map(function (p, j) {
          var x = Object.assign({}, cu[j], { ten: ten[j] });
          if (p.length > 1 && p[0] !== "") x.moc = /^-?\d+$/.test(p[0]) ? Number(p[0]) : p[0]; else delete x.moc;
          return x;
        }) });
      }
    },
    nhom: {
      goiY: "Mỗi dòng một nhóm: Tên nhóm: phần tử, phần tử, ...\nVí dụ:\nThể rắn: đá, gỗ, sắt\nThể lỏng: nước, dầu ăn",
      docRa: function (n) {
        if (!(n.nhom || []).every(function (g) { return laChu(g.ten) && String(g.ten).indexOf(":") < 0; })) return null;
        if (!(n.phan_tu || []).every(function (x) { return laChu(x.ten) && String(x.ten).indexOf(",") < 0; })) return null;
        return (n.nhom || []).map(function (g) {
          return g.ten + ": " + (n.phan_tu || []).filter(function (x) { return x.nhom === g.ma; }).map(function (x) { return x.ten; }).join(", ");
        }).join("\n");
      },
      ghiVao: function (van, n) {
        var dsN = [], dsP = [];
        dong(van).forEach(function (d) {
          var i = d.indexOf(":"); dsN.push((i < 0 ? d : d.slice(0, i)).trim());
          (i < 0 ? "" : d.slice(i + 1)).split(",").map(function (x) { return x.trim(); }).filter(Boolean).forEach(function (x) { dsP.push([x, dsN.length - 1]); });
        });
        var cn = ganMa(n.nhom, function (x) { return x.ten; }, dsN), cp = ganMa(n.phan_tu, function (x) { return x.ten; }, dsP.map(function (p) { return p[0]; }));
        var nhom = dsN.map(function (t, j) { return Object.assign({}, cn[j], { ten: t }); });
        return Object.assign({}, n, { nhom: nhom, phan_tu: dsP.map(function (p, j) { return Object.assign({}, cp[j], { ten: p[0], nhom: nhom[p[1]].ma }); }) });
      }
    },
    thuoc_long: {
      goiY: "Mỗi dòng một câu thơ / câu văn. Cách một dòng trống giữa hai khổ (mỗi khổ là một mảnh nhớ).\nVí dụ:\nCông cha như núi Thái Sơn\nNghĩa mẹ như nước trong nguồn chảy ra",
      docRa: function (n) {
        if (!(n.van_ban || []).every(function (k) { return (k.dong || []).every(laChu); })) return null;
        return (n.van_ban || []).map(function (k) { return (k.dong || []).join("\n"); }).join("\n\n");
      },
      ghiVao: function (van, n) {
        var kho = String(van || "").split(/\r?\n\s*\r?\n/).map(dong).filter(function (x) { return x.length; });
        var cu = ganMa(n.van_ban, function (k) { return (k.dong || [])[0]; }, kho.map(function (d) { return d[0]; }), kho.map(function (d, j) { return "doan_" + (j + 1); }));
        return Object.assign({}, n, { van_ban: kho.map(function (d, j) { return Object.assign({}, cu[j], { dong: d }); }) });
      }
    },
    quy_trinh: {
      goiY: "Mỗi dòng một bước, theo đúng thứ tự.\nVí dụ:\nĐứng yên tại chỗ\nTìm cô chú bảo vệ hoặc người bán hàng\nĐọc số điện thoại của bố mẹ",
      docRa: function (n) {
        if (!(n.buoc || []).every(function (b) { return laChu(b.viec); })) return null;
        return (n.buoc || []).map(function (b) { return b.viec; }).join("\n");
      },
      ghiVao: function (van, n) {
        var ds = dong(van), cu = ganMa(n.buoc, function (b) { return b.viec; }, ds);
        return Object.assign({}, n, { buoc: ds.map(function (d, j) { return Object.assign({}, cu[j], { viec: d }); }) });
      }
    },
    nhieu_mat: {
      goiY: "Dòng đầu: tên các cột, cách nhau bằng |. Mỗi dòng sau: một mục (mỗi mục là một mảnh nhớ).\nVí dụ:\nKí hiệu | Tên | Số hiệu\nH | Hydrogen | 1\nHe | Helium | 2",
      docRa: function (n) {
        var tr = n.truong || [];
        if (!tr.every(function (x) { return laChu(x.ten); })) return null;
        if (!(n.muc || []).every(function (m) { return tr.every(function (x) { var v = (m.gia_tri || {})[x.ma]; return v === undefined || laChu(v); }); })) return null;
        return [tr.map(function (x) { return x.ten; }).join(" | ")].concat((n.muc || []).map(function (m) {
          return tr.map(function (x) { var v = (m.gia_tri || {})[x.ma]; return v === undefined ? "" : v; }).join(" | ");
        })).join("\n");
      },
      ghiVao: function (van, n) {
        var ds = dong(van); if (!ds.length) return Object.assign({}, n, { truong: [], muc: [] });
        var dau = chiaGach(ds[0]), ct = ganMa(n.truong, function (x) { return x.ten; }, dau);
        var tr = dau.map(function (t, j) { return Object.assign({}, ct[j], { ten: t }); });
        var tr0 = (n.truong || [])[0], hang = ds.slice(1).map(chiaGach);
        var cm = ganMa(n.muc, function (m) { return tr0 ? (m.gia_tri || {})[tr0.ma] : ""; }, hang.map(function (p) { return p[0]; }));
        var muc = hang.map(function (p, j) {
          var g = {};
          tr.forEach(function (t, i) { if (p[i] !== undefined && p[i] !== "") g[t.ma] = laSo(p[i]); });
          return Object.assign({}, cm[j], { gia_tri: g });
        });
        var coMa = {}; tr.forEach(function (t) { coMa[t.ma] = 1; });
        var hoi = (n.hoi || []).filter(function (h) { return coMa[h[0]] && coMa[h[1]]; });
        var r = Object.assign({}, n, { truong: tr, muc: muc });
        if (hoi.length) r.hoi = hoi; else delete r.hoi;
        return r;
      }
    }
  };

  // ---------------- bỏ các mảnh trùng khỏi một thẻ ----------------
  var DS_MANH = { hoi_dap: ["cap"], nhieu_mat: ["muc"], nhom: ["phan_tu"], thuoc_long: ["van_ban"], tren_hinh: ["diem", "vung"], quy_tac: ["cau_truc", "ngoai_le"] };
  function boManh(t, maBo) {
    var ds = DS_MANH[t.hinhDang]; if (!ds || (t.noiDung || {}).sinh) return null;
    var nd = Object.assign({}, t.noiDung), bo = {}; maBo.forEach(function (m) { bo[m] = 1; });
    ds.forEach(function (k) { if (Array.isArray(nd[k])) nd[k] = nd[k].filter(function (x) { return !bo[x.ma]; }); });
    var r = Object.assign({}, t, { noiDung: nd }); r.manh = K.kiemThe(r).manh;
    return r.manh.length ? r : null;
  }
  function boDuocManh(t) { return !!DS_MANH[t.hinhDang] && !(t.noiDung || {}).sinh; }

  // ---------------- máy chủ ----------------
  function goi(ham, ts) { return Q.goi(ham, ts); }
  function canSql(kq) { return kq && kq.thongBao && /function|does not exist|schema cache|chưa có hàm/i.test(kq.thongBao) ? " Hãy chạy SQL KC_03B2 trong Supabase." : ""; }
  function guiThe(t) { // bỏ các trường chỉ để hiển thị
    var r = Object.assign({}, t);
    ["soManh", "phienBan", "ngaySua", "rieng", "nguoiTao"].forEach(function (k) { delete r[k]; });
    r.manh = K.kiemThe(r).manh;
    return r;
  }

  // ---------------- khung ----------------
  function khung() { return document.getElementById("qtsKhung"); }
  function monDs() { return Q.mon(); }
  function monCua(ma) { return monDs().filter(function (m) { return m.ma === ma; })[0] || { ma: ma, ten: ma, bieuTuong: "📘", chuDe: [] }; }
  function cuon(o) { if (o && o.scrollIntoView) o.scrollIntoView({ block: "start", behavior: "smooth" }); }

  // Mô tả một chỗ trùng + nút chọn. ctx: {theCu: map, cheDo: 'mot'|'lo', viTri, the}
  function trungHtml(x, ctx) {
    var cu = x.theCu ? ctx.theCu[x.theCu] : null, h = "", nut = "";
    var tenCu = cu ? "<b>" + T(cu.tieuDe) + "</b> <code>" + T(cu.id) + "</code>" + (cu.hien === false ? " (🙈 đang ẩn)" : "") + (cu.chiChoBe ? " (🔒 riêng của " + T(cu.chiChoBe) + ")" : "") : "";
    var xem = cu ? '<details class="qtsXemCu"><summary>👁 Xem thẻ cũ</summary>' + Q.theHtml(cu, true) + "</details>" : "";
    var suaCu = cu ? '<button type="button" class="adminNut adminNutPhu" data-qts="suaCu" data-id="' + T(cu.id) + '">✏️ Sửa thẻ cũ</button>' : "";
    var boMoi = '<button type="button" class="adminNut adminNutNguyHiem" data-qts="boMoi" data-vt="' + ctx.viTri + '">🗑 Bỏ thẻ mới</button>';
    var lo = ctx.cheDo === "lo", qd = ctx.quyet || {};
    if (x.loai === "ma") {
      if (ctx.sua) return "";
      h = "🆔 <b>Mã thẻ đã có</b>: " + tenCu;
      nut = qd.ghiDe ? '<span class="qtsDaChon">✔ Sẽ ghi đè thẻ cũ</span> <button type="button" class="adminNut adminNutPhu" data-qts="ghiDe" data-vt="' + ctx.viTri + '" data-gt="0">↺ Thôi</button>'
        : '<button type="button" class="adminNut adminNutPhu" data-qts="ghiDe" data-vt="' + ctx.viTri + '" data-gt="1">♻️ Ghi đè thẻ cũ bằng thẻ này</button>'
          + (lo ? boMoi : '<button type="button" class="adminNut adminNutPhu" data-qts="doiMa">🔤 Đổi mã thẻ mới</button>');
      return '<li class="qtsTrung' + (qd.ghiDe ? " daXong" : " vuong") + '">' + h + xem + '<div class="qtsNutTrung">' + nut + "</div></li>";
    }
    if (x.loai === "tieu_de") {
      h = "📛 <b>Trùng tiêu đề</b> (cùng môn, lớp giao nhau) với " + tenCu;
      nut = qd.tieuDe ? '<span class="qtsDaChon">✔ Bạn xác nhận đây là tri thức khác</span> <button type="button" class="adminNut adminNutPhu" data-qts="tieuDe" data-vt="' + ctx.viTri + '" data-gt="0">↺ Thôi</button>'
        : '<button type="button" class="adminNut adminNutPhu" data-qts="tieuDe" data-vt="' + ctx.viTri + '" data-gt="1">✅ Vẫn lưu: nội dung khác thẻ cũ</button>' + suaCu + (lo ? boMoi : "");
      return '<li class="qtsTrung' + (qd.tieuDe ? " daXong" : " vuong") + '">' + h + xem + '<div class="qtsNutTrung">' + nut + "</div></li>";
    }
    if (x.loai === "gan_giong") {
      return '<li class="qtsTrung nhac">🔎 Tiêu đề <b>gần giống</b> (' + (x.doGiong | 0) + "%) " + tenCu + ". Hãy xem thẻ cũ có phải cùng tri thức không." + xem
        + (suaCu ? '<div class="qtsNutTrung">' + suaCu + "</div>" : "") + "</li>";
    }
    var dsManh = (x.manh || []).map(function (m) { return '<span class="qttChip">' + T(m.ten) + "</span>"; }).join("");
    var catManh = boDuocManh(ctx.the) && !x.tatCa ? '<button type="button" class="adminNut adminNutPhu" data-qts="catManh" data-vt="' + ctx.viTri + '" data-manh="'
      + T((x.manh || []).map(function (m) { return m.moi; }).join(",")) + '">✂️ Bỏ các mảnh trùng khỏi thẻ mới</button>' : "";
    if (x.loai === "manh") {
      h = x.tatCa ? "🧩 <b>Toàn bộ nội dung đã có</b> ở " + tenCu : "🧩 <b>" + (x.manh || []).length + " mảnh nhớ đã có</b> ở " + tenCu;
      return '<li class="qtsTrung vuong">' + h + '<div class="qtsChipTrung">' + dsManh + "</div>" + xem + '<div class="qtsNutTrung">' + catManh + suaCu + boMoi + "</div></li>";
    }
    if (x.loai === "trong_lo") {
      h = x.trungMa ? "🔁 <b>Trùng mã</b> với thẻ <code>" + T(x.voi) + "</code> ở trên trong cùng lô" : "🔁 <b>Trùng mảnh</b> với thẻ <code>" + T(x.voi) + "</code> ở trên trong cùng lô";
      return '<li class="qtsTrung vuong">' + h + '<div class="qtsChipTrung">' + dsManh + '</div><div class="qtsNutTrung">' + (x.trungMa ? "" : catManh) + boMoi + "</div></li>";
    }
    return "";
  }
  // Thẻ còn vướng (chưa lưu được) theo kết quả kiểm + lựa chọn
  function conVuong(trung, qd, sua) {
    return (trung || []).some(function (x) {
      return (x.loai === "ma" && !sua && !qd.ghiDe) || (x.loai === "tieu_de" && !qd.tieuDe) || x.loai === "manh" || x.loai === "trong_lo";
    });
  }

  // ================================================================
  // 1. Ô SOẠN MỘT THẺ
  // ================================================================
  var S = null; // { sua: bool, goc: thẻ cũ, the: thẻ đang soạn, nhanh: bool, maTay: bool, kq: kết quả kiểm, quyet: {}, thamKhao }
  function moSoan(the, sua, thamKhao) {
    var k = khung(); if (!k) return;
    var t = the ? JSON.parse(JSON.stringify(the)) : { id: "", mon: (monDs()[0] || {}).ma || "toan", chuDe: "khac", lopTu: 1, lopDen: null, hinhDang: "hoi_dap",
      tieuDe: "", noiDung: { cap: [] }, nguCanh: "" };
    var nh = NHANH[t.hinhDang], van = nh ? nh.docRa(t.noiDung || {}) : null;
    S = { sua: !!sua, goc: sua ? the : null, the: t, nen: JSON.parse(JSON.stringify(t.noiDung || {})), nhanh: van !== null && van !== undefined && !!nh,
      maTay: !!sua || !!t.id, kq: null, quyet: {}, thamKhao: thamKhao || null };
    var o = document.getElementById("qtsSoan");
    if (!o) { o = document.createElement("div"); o.id = "qtsSoan"; k.insertBefore(o, k.firstChild); }
    veSoan();
    cuon(o);
  }
  function luaChon(ds, chon) { return ds.map(function (x) { return '<option value="' + T(x[0]) + '"' + (String(x[0]) === String(chon) ? " selected" : "") + ">" + T(x[1]) + "</option>"; }).join(""); }
  function veSoan() {
    var t = S.the, o = document.getElementById("qtsSoan"), m = monCua(t.mon), lop = [];
    for (var i = 0; i <= 12; i++) lop.push([i, i === 0 ? "Trước lớp 1" : "Lớp " + i]);
    var cd = (m.chuDe || []).map(function (c) { return [c.ma, c.ten]; });
    if (!cd.some(function (c) { return c[0] === t.chuDe; }) && t.chuDe) cd.unshift([t.chuDe, t.chuDeTen || t.chuDe]);
    var bo = Q.bo().filter(function (b) { return b.mon === t.mon; }).map(function (b) { return [b.ma, (b.bieuTuong || "📦") + " " + b.ten]; });
    var nh = NHANH[t.hinhDang];
    o.className = "qtsKhung";
    o.innerHTML = '<div class="qtsDau"><h4>' + (S.sua ? "✏️ Sửa thẻ <code>" + T(t.id) + "</code>" : "➕ Thêm thẻ mới") + "</h4>"
      + '<button type="button" class="adminNut adminNutPhu" data-qts="dongSoan">✖ Đóng</button></div>'
      + (S.thamKhao ? '<details class="qtsThamKhao" open><summary>📋 Thẻ mới bạn vừa soạn (để chép phần còn thiếu sang thẻ cũ)</summary>' + Q.theHtml(S.thamKhao, true) + "</details>" : "")
      + '<div class="qtsLuoi"><div class="qtsCot">'
      + '<div class="qtsO4">'
      + '<label>Môn<select id="qtsMon"' + (S.sua ? "" : "") + ">" + luaChon(monDs().map(function (x) { return [x.ma, x.bieuTuong + " " + x.ten]; }), t.mon) + "</select></label>"
      + '<label>Học từ<select id="qtsLopTu">' + luaChon(lop, t.lopTu) + "</select></label>"
      + '<label>Phải nhớ đến<select id="qtsLopDen">' + luaChon([["", "Hết lớp 12"]].concat(lop.slice(1)), t.lopDen === null || t.lopDen === undefined ? "" : t.lopDen) + "</select></label>"
      + '<label>Hình dạng<select id="qtsHd"' + (S.sua ? " disabled title=\"Không đổi hình dạng của thẻ đã có (bé đang học theo mảnh)\"" : "") + ">"
      + luaChon(Object.keys(TEN_HD).map(function (k) { return [k, TEN_HD[k]]; }), t.hinhDang) + "</select></label></div>"
      + '<label class="qtsDai">Tiêu đề (bé nhìn thấy)<input id="qtsTieuDe" maxlength="120" value="' + T(t.tieuDe) + '" placeholder="Vd: Thủ đô các nước châu Âu"></label>'
      + '<div class="qtsO2"><label>Chủ đề<select id="qtsChuDe">' + luaChon(cd.concat([["__moi", "➕ Chủ đề mới…"]]), t.chuDe) + "</select>"
      + '<input id="qtsChuDeMoi" class="an" maxlength="80" placeholder="Tên chủ đề mới"></label>'
      + '<label>Bộ thẻ<select id="qtsBo">' + luaChon([["", "(không thuộc bộ nào)"]].concat(bo), t.bo || "") + "</select></label></div>"
      + '<div class="qtsNoiDungDau"><b>Nội dung</b>' + (nh ? '<span class="qtsChe"><button type="button" data-qts="che" data-gt="nhanh" class="' + (S.nhanh ? "dangChon" : "") + '">✍️ Soạn nhanh</button>'
        + '<button type="button" data-qts="che" data-gt="json" class="' + (S.nhanh ? "" : "dangChon") + '">{ } JSON</button></span>' : '<span class="qtsGhi">khuôn này soạn bằng JSON (sửa trên mẫu)</span>') + "</div>"
      + '<textarea id="qtsNoiDung" class="qtsNoiDung' + (S.nhanh ? "" : " qtsJson") + '" rows="9" spellcheck="false" placeholder="' + T(S.nhanh ? nh.goiY : "") + '"></textarea>'
      + '<p class="qtsGhi" id="qtsGoiY">' + (S.nhanh ? T(nh.goiY.split("\n")[0]) : 'JSON theo Chuẩn Dữ Liệu (Thiet_Ke_Kho_Tri_Thuc.md mục 5.2). Không cần viết "manh": máy tự tính.') + "</p>"
      + '<label class="qtsDai">Ví dụ / ngữ cảnh đời thường' + (t.hinhDang === "cong_thuc" || t.hinhDang === "quy_tac" ? " (bắt buộc)" : "")
      + '<textarea id="qtsNguCanh" rows="2" maxlength="600" placeholder="Vd: Mẹ đi chợ mua 7 túi, mỗi túi 8 quả cam…">' + T(t.nguCanh || "") + "</textarea></label>"
      + '<details class="qtsThem"><summary>⚙️ Tuỳ chọn thêm</summary><div class="qtsO2">'
      + '<label>Mã thẻ (không đổi sau khi lưu)<input id="qtsId" maxlength="80" value="' + T(t.id) + '"' + (S.sua ? " disabled" : "") + "></label>"
      + '<label>Nguồn<input id="qtsNguon" maxlength="200" value="' + T(t.nguon || "") + '" placeholder="Vd: SGK Toán 3"></label>'
      + '<label>Hẹn soát lại (dữ liệu có thể đổi)<input id="qtsKiemLai" type="date" value="' + T(t.kiemLai || "") + '"></label>'
      + '<label>Thẻ riêng của bé (tên đăng nhập)<input id="qtsChiChoBe" maxlength="60" value="' + T(t.chiChoBe || "") + '" placeholder="để trống = thẻ chung"></label>'
      + '<label>Nhánh / chuyên đề<input id="qtsNhanh" maxlength="40" value="' + T(t.nhanh || "") + '" placeholder="để trống = mọi bé"></label>'
      + '<label>Vùng<select id="qtsVung">' + luaChon([["", "Mọi vùng"], ["bac", "Miền Bắc"], ["trung", "Miền Trung"], ["nam", "Miền Nam"]], t.vung || "") + "</select></label>"
      + '<label class="qtsHop"><input type="checkbox" id="qtsCanDuyet"' + (t.canDuyet ? " checked" : "") + "> ⚠️ Chủ đề nhạy cảm (phụ huynh bật mới hiện)</label>"
      + '<label class="qtsHop"><input type="checkbox" id="qtsSuotDoi"' + (t.onSuotDoi ? " checked" : "") + "> ♾️ Ôn suốt đời (an toàn sống)</label>"
      + "</div></details>"
      + '</div><div class="qtsCot qtsCotXem">'
      + '<div id="qtsLoi"></div><div class="qtsNhanXem">👀 Bé sẽ thấy thẻ như sau</div><div id="qtsXem"></div>'
      + '<div id="qtsKetQua"></div>'
      + '<div class="qtsNutLuu"><button type="button" class="adminNut adminNutThanhCong" id="qtsLuu" data-qts="luuMot">💾 Kiểm trùng và lưu</button></div>'
      + "</div></div>";
    document.getElementById("qtsNoiDung").value = S.nhanh ? nh.docRa(t.noiDung || {}) : JSON.stringify(t.noiDung || MAU[t.hinhDang], null, 2);
    if (!S.nhanh && !S.sua && isRong(t.noiDung)) document.getElementById("qtsNoiDung").value = JSON.stringify(MAU[t.hinhDang], null, 2);
    var hen = null;
    o.oninput = function (su) {
      if (su.target.id === "qtsId") S.maTay = !!su.target.value.trim();
      clearTimeout(hen); hen = setTimeout(capNhatSoan, 250);
    };
    o.onchange = function (su) {
      var id = su.target.id;
      if (id === "qtsMon") { docForm(); S.the.chuDe = "khac"; S.the.bo = null; veSoanGiu(); return; }
      if (id === "qtsHd") { docForm(); S.the.hinhDang = su.target.value; S.the.noiDung = {}; S.nen = {}; S.nhanh = !!NHANH[S.the.hinhDang]; veSoanGiu(); return; }
      if (id === "qtsChuDe") document.getElementById("qtsChuDeMoi").classList.toggle("an", su.target.value !== "__moi");
      capNhatSoan();
    };
    capNhatSoan();
  }
  function isRong(nd) { return !nd || !Object.keys(nd).length || Object.keys(nd).every(function (k) { return Array.isArray(nd[k]) && !nd[k].length; }); }
  function veSoanGiu() { var y = window.scrollY; veSoan(); window.scrollTo(0, y); }
  function gtri(id) { var e = document.getElementById(id); return e ? e.value.trim() : ""; }
  // đọc form vào S.the; trả lỗi nhập (JSON hỏng...)
  function docForm() {
    var t = S.the, loi = [];
    t.mon = gtri("qtsMon") || t.mon; t.lopTu = Number(gtri("qtsLopTu")); t.lopDen = gtri("qtsLopDen") === "" ? null : Number(gtri("qtsLopDen"));
    if (!S.sua) t.hinhDang = gtri("qtsHd") || t.hinhDang;
    t.tieuDe = gtri("qtsTieuDe");
    var cd = gtri("qtsChuDe");
    if (cd === "__moi") { var ten = gtri("qtsChuDeMoi"); t.chuDe = slug(ten, 40) || ""; if (ten) t.chuDeTen = ten; else { delete t.chuDeTen; loi.push("Gõ tên chủ đề mới"); } }
    else { t.chuDe = cd; delete t.chuDeTen; }
    t.bo = gtri("qtsBo") || null;
    var van = document.getElementById("qtsNoiDung") ? document.getElementById("qtsNoiDung").value : "";
    if (S.nhanh) t.noiDung = NHANH[t.hinhDang].ghiVao(van, S.nen || {});
    else {
      try { var nd = JSON.parse(van || "{}"); t.noiDung = nd; } catch (e) { loi.push("Nội dung JSON chưa đúng: " + e.message); }
    }
    t.nguCanh = gtri("qtsNguCanh");
    t.nguon = gtri("qtsNguon"); t.kiemLai = gtri("qtsKiemLai") || null; t.chiChoBe = gtri("qtsChiChoBe") || null;
    t.nhanh = gtri("qtsNhanh") || null; t.vung = gtri("qtsVung") || null;
    t.canDuyet = !!(document.getElementById("qtsCanDuyet") || {}).checked; t.onSuotDoi = !!(document.getElementById("qtsSuotDoi") || {}).checked;
    if (!S.sua) {
      if (!S.maTay) { t.id = goiYMa(t); var e = document.getElementById("qtsId"); if (e) e.value = t.id; }
      else t.id = gtri("qtsId");
    }
    return loi;
  }
  function goiYMa(t) { return ((VIET_TAT[t.mon] || slug(t.mon, 6)) + "_" + t.lopTu + "_" + (slug(t.tieuDe, 60) || "the_moi")).slice(0, 80).replace(/_+$/, ""); }
  function capNhatSoan() {
    if (!S || !document.getElementById("qtsSoan")) return;
    var loiNhap = docForm(), kt = K.kiemThe(S.the), loi = loiNhap.concat(kt.loi);
    S.the.manh = kt.manh; S.kq = null; S.quyet = {};
    document.getElementById("qtsLoi").innerHTML = loi.length ? '<div class="qtsLoiKhuon"><b>⚠️ Chưa đúng khuôn (' + loi.length + ")</b><ul>"
      + loi.slice(0, 12).map(function (x) { return "<li>" + T(x) + "</li>"; }).join("") + "</ul></div>" : "";
    var xemT = Object.assign({}, S.the, { hien: S.sua ? S.goc.hien : true, phienBan: 0 });
    try { document.getElementById("qtsXem").innerHTML = S.the.tieuDe || kt.manh.length ? Q.theHtml(xemT, true) : '<p class="adminGhiChu">Gõ tiêu đề và nội dung để xem trước.</p>'; }
    catch (e) { document.getElementById("qtsXem").innerHTML = ""; }
    document.getElementById("qtsKetQua").innerHTML = "";
    document.getElementById("qtsLuu").disabled = loi.length > 0;
    document.getElementById("qtsLuu").textContent = "💾 Kiểm trùng và lưu";
  }
  function veKetQuaMot() {
    var o = document.getElementById("qtsKetQua"), r = S.kq; if (!r) { o.innerHTML = ""; return; }
    var trung = (r.ketQua[0] || {}).trung || [], ctx = { theCu: r.theCu || {}, cheDo: "mot", viTri: 0, the: S.the, quyet: S.quyet, sua: S.sua };
    var h = trung.map(function (x) { return trungHtml(x, ctx); }).filter(Boolean).join("");
    var vuong = conVuong(trung, S.quyet, S.sua);
    o.innerHTML = h ? '<div class="qtsKetQuaKhung"><b>' + (vuong ? "⛔ Chưa lưu: kho đã có tri thức này" : "🔎 Lưu ý trước khi lưu") + "</b><ul>" + h + "</ul></div>"
      : '<p class="qtsKhongTrung">✅ Không trùng thẻ nào trong kho.</p>';
    var nut = document.getElementById("qtsLuu");
    nut.disabled = vuong;
    nut.textContent = h ? (vuong ? "💾 Chọn cách xử lý ở trên rồi lưu" : "💾 Lưu thẻ") : "💾 Lưu thẻ";
  }
  function luuMot() {
    var nut = document.getElementById("qtsLuu"), t = guiThe(S.the);
    nut.disabled = true;
    var xn = { ghiDe: S.sua || S.quyet.ghiDe ? [t.id] : [], tieuDe: S.quyet.tieuDe ? [t.id] : [] };
    if (!S.kq) { // lần bấm đầu: kiểm trùng; không có gì thì lưu luôn
      nut.textContent = "🔎 Đang kiểm trùng…";
      goi("kc_the_nho_admin_kiem_trung", { p_ds: { the: [t] } }).then(function (kq) {
        if (!kq.thanhCong) { nut.disabled = false; nut.textContent = "💾 Kiểm trùng và lưu"; baoLoi("qtsKetQua", kq); return; }
        S.kq = kq;
        var trung = ((kq.ketQua[0] || {}).trung || []).filter(function (x) { return !(S.sua && x.loai === "ma"); });
        if (!trung.length) { luuThat(t, xn); return; }
        veKetQuaMot();
      });
      return;
    }
    luuThat(t, xn);
  }
  function luuThat(t, xn) {
    var nut = document.getElementById("qtsLuu");
    nut.disabled = true; nut.textContent = "💾 Đang lưu…";
    goi("kc_the_nho_admin_luu", { p_ds: { the: [t] }, p_xac_nhan: xn }).then(function (kq) {
      if (!kq.thanhCong) {
        if (kq.trung && kq.kiemTrung) { S.kq = { ketQua: kq.kiemTrung.ketQua, theCu: kq.kiemTrung.theCu }; veKetQuaMot(); return; }
        nut.disabled = false; nut.textContent = "💾 Kiểm trùng và lưu"; baoLoi("qtsKetQua", kq); return;
      }
      var o = document.getElementById("qtsSoan");
      o.innerHTML = '<div class="qtsXong">✅ Đã lưu thẻ <b>' + T(t.tieuDe) + "</b> (" + (kq.them ? "thẻ mới" : kq.sua ? "đã sửa, phiên bản mới" : "không có gì thay đổi") + ', '
        + t.manh.length + ' mảnh nhớ). <button type="button" class="adminNut adminNutThanhCong" data-qts="moiNua">➕ Thêm thẻ khác</button>'
        + '<button type="button" class="adminNut adminNutPhu" data-qts="dongSoan">✖ Đóng</button></div>';
      Q.taiLai();
    });
  }
  function baoLoi(id, kq) {
    var o = document.getElementById(id); if (!o) return;
    var ds = (kq.loi || []).map(function (l) { return "<li>" + T((l.ma ? l.ma + ": " : "") + (l.loi || []).join("; ")) + "</li>"; }).join("");
    o.innerHTML = '<div class="qtsLoiKhuon">❌ ' + T(kq.thongBao || "Lỗi") + T(canSql(kq)) + (ds ? "<ul>" + ds + "</ul>" : "") + "</div>";
  }

  // ================================================================
  // 2. NHẬP NHIỀU THẺ (JSON)
  // ================================================================
  var N = null; // { lo: {bo, hinhNen}, ds: [{the, loi, bo: bool, quyet: {}, trung: []}], theCu: {} }
  function moNhap() {
    var k = khung(); if (!k) return;
    var o = document.getElementById("qtsNhap");
    if (!o) { o = document.createElement("div"); o.id = "qtsNhap"; k.appendChild(o); }
    o.className = "qtsKhung";
    o.innerHTML = '<div class="qtsDau"><h4>📥 Nhập nhiều thẻ một lần</h4><button type="button" class="adminNut adminNutPhu" data-qts="dongNhap">✖ Đóng</button></div>'
      + '<p class="adminGhiChu">Dán khối JSON theo Chuẩn Dữ Liệu thẻ nhớ (<code>{"bo": [...], "the": [...]}</code> hoặc một mảng thẻ), ví dụ do AI soạn theo lời nhờ ở '
      + "Thiet_Ke_Kho_Tri_Thuc.md mục 5.5. Máy kiểm khuôn từng thẻ và kiểm trùng với cả kho trước khi lưu.</p>"
      + '<div class="qtsNhapO"><textarea id="qtsNhapVan" rows="8" spellcheck="false" placeholder=\'{ "the": [ { "id": "dl_7_thu_do_chau_au", "mon": "dia_ly", ... } ] }\'></textarea>'
      + '<div class="qtsNhapNut"><label class="adminNut adminNutPhu qtsTep">📂 Chọn tệp .json<input type="file" id="qtsTep" accept=".json,application/json"></label>'
      + '<button type="button" class="adminNut adminNutThanhCong" data-qts="docNhap">🔍 Đọc và kiểm trùng</button></div></div>'
      + '<div id="qtsNhapKq"></div>';
    document.getElementById("qtsTep").onchange = function (su) {
      var f = su.target.files && su.target.files[0]; if (!f) return;
      var r = new FileReader(); r.onload = function () { document.getElementById("qtsNhapVan").value = r.result; docNhap(); }; r.readAsText(f, "utf-8");
    };
    cuon(o);
  }
  function docNhap() {
    var van = document.getElementById("qtsNhapVan").value.trim(), o = document.getElementById("qtsNhapKq"), du;
    if (!van) { o.innerHTML = '<p class="qtsLoiKhuon">Hãy dán JSON hoặc chọn tệp.</p>'; return; }
    try { du = JSON.parse(van); } catch (e) { o.innerHTML = '<p class="qtsLoiKhuon">❌ JSON chưa đúng: ' + T(e.message) + "</p>"; return; }
    var the = Array.isArray(du) ? du : Array.isArray(du.the) ? du.the : du && du.id ? [du] : null;
    if (!the) { o.innerHTML = '<p class="qtsLoiKhuon">❌ Không thấy danh sách thẻ ("the": [...]).</p>'; return; }
    if (the.length > 2000) { o.innerHTML = '<p class="qtsLoiKhuon">❌ Tối đa 2000 thẻ một lần.</p>'; return; }
    N = { lo: { bo: Array.isArray(du.bo) ? du.bo : [], hinhNen: Array.isArray(du.hinhNen) ? du.hinhNen : [] }, theCu: {},
      ds: the.map(function (t) { var k = K.kiemThe(t), x = Object.assign({}, t); x.manh = k.manh; return { the: x, loi: k.loi, bo: false, quyet: {}, trung: [] }; }) };
    kiemNhap();
  }
  function dsGui() { return N.ds.filter(function (x) { return !x.bo && !x.loi.length; }); }
  function kiemNhap() {
    var o = document.getElementById("qtsNhapKq"), gui = dsGui();
    N.ds.forEach(function (x) { x.trung = []; });
    if (!gui.length) { veNhap(); return; }
    o.insertAdjacentHTML("afterbegin", '<p class="adminDangTai" id="qtsDangKiem">🔎 Đang kiểm trùng ' + gui.length + " thẻ…</p>");
    goi("kc_the_nho_admin_kiem_trung", { p_ds: { the: gui.map(function (x) { return guiThe(x.the); }) } }).then(function (kq) {
      if (!kq.thanhCong) { baoLoi("qtsNhapKq", kq); return; }
      N.theCu = kq.theCu || {};
      (kq.ketQua || []).forEach(function (r, i) { if (gui[i]) gui[i].trung = r.trung || []; });
      veNhap();
    });
  }
  function trangThai(x) {
    if (x.bo) return ["bo", "🗑 Đã bỏ"];
    if (x.loi.length) return ["sai", "❌ Sai khuôn"];
    if (conVuong(x.trung, x.quyet)) return ["vuong", "⛔ Vướng trùng"];
    if (x.trung.length) return ["nhac", "⚠️ Lưu được (có lưu ý)"];
    return ["moi", "✅ Mới, không trùng"];
  }
  function veNhap() {
    var o = document.getElementById("qtsNhapKq"), dem = { moi: 0, nhac: 0, vuong: 0, sai: 0, bo: 0 };
    var h = N.ds.map(function (x, i) {
      var tt = trangThai(x), t = x.the, m = monCua(t.mon); dem[tt[0]]++;
      var ctx = { theCu: N.theCu, cheDo: "lo", viTri: i, the: t, quyet: x.quyet };
      return '<article class="qtsDong qtsDong_' + tt[0] + '"><div class="qtsDongDau"><span class="qtsTT">' + tt[1] + "</span>"
        + "<b>" + T(t.tieuDe || t.id || "(không tên)") + "</b></div>"
        + '<div class="qttNhanDong"><span class="qttNhan qttNhanMon">' + T((m.bieuTuong || "") + " " + (m.ten || t.mon || "?")) + '</span><span class="qttNhan">Lớp ' + T(t.lopTu)
        + (t.lopDen ? "-" + T(t.lopDen) : "+") + '</span><span class="qttNhan qttNhanHd">' + T(TEN_HD[t.hinhDang] || t.hinhDang || "?") + "</span>"
        + '<span class="qttNhan">🧩 ' + (t.manh || []).length + ' mảnh</span><code class="qtsMaNho">' + T(t.id || "") + "</code></div>"
        + (x.loi.length ? '<div class="qtsLoiKhuon"><ul>' + x.loi.slice(0, 6).map(function (l) { return "<li>" + T(l) + "</li>"; }).join("") + "</ul></div>" : "")
        + (!x.bo && x.trung.length ? '<ul class="qtsDsTrung">' + x.trung.map(function (y) { return trungHtml(y, ctx); }).join("") + "</ul>" : "")
        + '<div class="qtsNutTrung">' + (x.bo ? '<button type="button" class="adminNut adminNutPhu" data-qts="layLai" data-vt="' + i + '">↺ Lấy lại thẻ này</button>'
          : (x.loi.length ? '<button type="button" class="adminNut adminNutPhu" data-qts="soanLo" data-vt="' + i + '">✏️ Sửa trong ô soạn</button>'
            + '<button type="button" class="adminNut adminNutNguyHiem" data-qts="boMoi" data-vt="' + i + '">🗑 Bỏ thẻ này</button>' : ""))
        + (x.bo || x.loi.length ? "" : '<details class="qtsXemCu"><summary>👁 Xem thẻ mới</summary>' + safeThe(t) + "</details>") + "</div></article>";
    }).join("");
    var soLuu = dem.moi + dem.nhac, chan = dem.vuong > 0;
    o.innerHTML = '<div class="qtsTomNhap"><b>' + N.ds.length + " thẻ</b>: ✅ " + dem.moi + " mới · ⚠️ " + dem.nhac + " có lưu ý · ⛔ " + dem.vuong + " vướng trùng · ❌ "
      + dem.sai + " sai khuôn · 🗑 " + dem.bo + " đã bỏ" + (N.lo.bo.length ? " · 📦 " + N.lo.bo.length + " bộ thẻ" : "") + "</div>"
      + '<div class="qtsNutTrung">' + (dem.vuong ? '<button type="button" class="adminNut adminNutNguyHiem" data-qts="boHetVuong">🗑 Bỏ mọi thẻ còn vướng trùng</button>' : "")
      + '<button type="button" class="adminNut adminNutThanhCong" data-qts="luuNhap"' + (chan || !soLuu ? " disabled" : "") + ">💾 Lưu " + soLuu + " thẻ"
      + (dem.sai ? " (bỏ qua thẻ sai khuôn)" : "") + "</button>" + (chan ? '<span class="qtsGhi">Xử lý hết thẻ ⛔ rồi mới lưu được.</span>' : "") + "</div>"
      + '<div class="qtsDsNhap">' + h + "</div>";
  }
  function safeThe(t) { try { return Q.theHtml(Object.assign({ hien: true }, t), true); } catch (e) { return ""; } }
  function luuNhap(nut) {
    var gui = dsGui(), xn = { ghiDe: [], tieuDe: [] };
    gui.forEach(function (x) { if (x.quyet.ghiDe) xn.ghiDe.push(x.the.id); if (x.quyet.tieuDe) xn.tieuDe.push(x.the.id); });
    var boDung = {}; gui.forEach(function (x) { if (x.the.bo) boDung[x.the.bo] = 1; });
    nut.disabled = true; nut.textContent = "💾 Đang lưu…";
    goi("kc_the_nho_admin_luu", { p_ds: { bo: N.lo.bo.filter(function (b) { return boDung[b.ma]; }), hinhNen: N.lo.hinhNen, the: gui.map(function (x) { return guiThe(x.the); }) }, p_xac_nhan: xn })
      .then(function (kq) {
        if (!kq.thanhCong) {
          if (kq.trung && kq.kiemTrung) { (kq.kiemTrung.ketQua || []).forEach(function (r, i) { if (gui[i]) gui[i].trung = r.trung || []; }); N.theCu = kq.kiemTrung.theCu || {}; veNhap(); return; }
          baoLoi("qtsNhapKq", kq); return;
        }
        document.getElementById("qtsNhapKq").innerHTML = '<div class="qtsXong">✅ Đã lưu: <b>' + (kq.them | 0) + " thẻ mới</b>, " + (kq.sua | 0) + " thẻ sửa, " + (kq.giu | 0)
          + " thẻ không đổi" + (kq.bo ? ", " + kq.bo + " bộ thẻ" : "") + ".</div>";
        document.getElementById("qtsNhapVan").value = ""; N = null;
        Q.taiLai();
      });
  }

  // ---------------- bấm nút ----------------
  function bam(su) {
    var n = su.target.closest("[data-qts]"); if (!n) return;
    var v = n.getAttribute("data-qts"), vt = Number(n.getAttribute("data-vt")), trongNhap = !!n.closest("#qtsNhap");
    if (v === "dongSoan") { var s = document.getElementById("qtsSoan"); if (s) s.remove(); S = null; return; }
    if (v === "dongNhap") { var p = document.getElementById("qtsNhap"); if (p) p.remove(); N = null; return; }
    if (v === "moiNua") { moSoan(null, false); return; }
    if (v === "che") { docForm(); S.nhanh = n.getAttribute("data-gt") === "nhanh"; if (S.nhanh && NHANH[S.the.hinhDang].docRa(S.the.noiDung || {}) === null) {
      window.alert("Thẻ này có phần nội dung đặc biệt (công thức, hình, bảng tính…) nên chỉ sửa được bằng JSON."); S.nhanh = false; return; }
      if (S.nhanh) S.nen = JSON.parse(JSON.stringify(S.the.noiDung || {})); veSoanGiu(); return; }
    if (v === "luuMot") { luuMot(); return; }
    if (v === "docNhap") { docNhap(); return; }
    if (v === "luuNhap") { luuNhap(n); return; }
    if (v === "suaCu") {
      var cu = (trongNhap ? N.theCu : (S && S.kq ? S.kq.theCu : {}))[n.getAttribute("data-id")]; if (!cu) return;
      moSoan(cu, true, trongNhap ? null : guiThe(S.the));
      return;
    }
    if (v === "doiMa") { var d = document.querySelector("#qtsSoan .qtsThem"); if (d) d.open = true; var e = document.getElementById("qtsId"); if (e) { S.maTay = true; e.focus(); e.select(); } return; }
    if (trongNhap) {
      var x = N && N.ds[vt]; if (!x) return;
      if (v === "boMoi") { x.bo = true; kiemNhap(); return; }
      if (v === "layLai") { x.bo = false; kiemNhap(); return; }
      if (v === "ghiDe") { x.quyet.ghiDe = n.getAttribute("data-gt") === "1"; veNhap(); return; }
      if (v === "tieuDe") { x.quyet.tieuDe = n.getAttribute("data-gt") === "1"; veNhap(); return; }
      if (v === "catManh") { var m = boManh(x.the, n.getAttribute("data-manh").split(",")); if (m) x.the = m; else x.bo = true; kiemNhap(); return; }
      if (v === "boHetVuong") { N.ds.forEach(function (y) { if (!y.bo && !y.loi.length && conVuong(y.trung, y.quyet)) y.bo = true; }); kiemNhap(); return; }
      if (v === "soanLo") { x.bo = true; moSoan(x.the, false); kiemNhap(); return; }
      return;
    }
    if (!S) return;
    if (v === "boMoi") { var so = document.getElementById("qtsSoan"); if (so) so.remove(); S = null; return; }
    if (v === "ghiDe") { S.quyet.ghiDe = n.getAttribute("data-gt") === "1"; veKetQuaMot(); return; }
    if (v === "tieuDe") { S.quyet.tieuDe = n.getAttribute("data-gt") === "1"; veKetQuaMot(); return; }
    if (v === "catManh") {
      var mm = boManh(S.the, n.getAttribute("data-manh").split(","));
      if (!mm) { window.alert("Bỏ hết mảnh trùng thì thẻ không còn gì: hãy sửa thẻ cũ hoặc bỏ thẻ mới."); return; }
      S.the = mm; S.nen = JSON.parse(JSON.stringify(mm.noiDung)); S.nhanh = !!NHANH[mm.hinhDang] && NHANH[mm.hinhDang].docRa(mm.noiDung) !== null; veSoanGiu(); return;
    }
  }
  document.addEventListener("click", function (su) { if (su.target.closest("#qtsKhung")) bam(su); });

  window.QTS = { moi: function () { moSoan(null, false); }, sua: function (t) { moSoan(t, true); }, nhap: moNhap,
    _nhanh: NHANH, _boManh: boManh, _goiYMa: goiYMa };
})();
// 12/11/2026 - BƯỚC: KC_03B2
