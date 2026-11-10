// ================================================================
// FILE: kc/qt_dt_tai_khoan.js
// CHỨC NĂNG: Mục "⚔️ Đấu Trường Tri Thức › 👤 Tài khoản" của trang quản trị (quantri_NC.html#dautruong-taikhoan, TC_D18A).
//   Xem và sửa cài đặt Đấu Trường của TỪNG BÉ: chủng tộc, giới tính, tên vương quốc, tên Thủ lĩnh, lớp, tài nguyên đang có,
//   số nông dân; xem công trình, túi đồ. Các phần chưa có trong game (Lv Thủ lĩnh, tướng chiêu mộ, lính cung / kỵ binh /
//   bộ binh) ĐẶT CHỖ TRƯỚC: hiện thẻ "sắp có".
//   Máy tính rộng (>= 1280): danh sách bé bên trái, chi tiết bên phải (lưới thẻ). Điện thoại + máy tính nhỏ: danh sách -> bấm một
//   bé -> chi tiết (nút ‹ quay lại); máy tính nhỏ trải thẻ nhiều cột.
// CÁCH GẮN THÊM MỘT KHỐI vào trang chi tiết (không sửa file này cũng được: gọi từ file khác nạp SAU file này):
//   QTK.dangKyKhoi({
//     ma: "tuong", ten: "Tướng chiêu mộ", bieuTuong: "🧙",
//     ve: function (tk) { return "html"; },   // tk = dữ liệu kc_dt_admin_tai_khoan
//     rong: true,                             // tuỳ chọn: thẻ chiếm cả hàng
//     sapCo: true, seCo: ["..."]              // khối đặt chỗ trước (không cần ve)
//   });
//   Ô SỬA ĐƯỢC: dùng QTK.oSo("kho.go", tk, {min, max}) / QTK.oChu("tenThuLinh", tk) / QTK.oChon("gioi", tk, [[giá trị, chữ]...]).
//   Khoá ô = đường dẫn trong p_sua của kc_dt_admin_sua_tai_khoan; khung tự tô ô chưa lưu, đếm, gom lại và lưu.
//   Thêm khoá mới = thêm vào SQL kc_dt_qt_tk_sua_duoc + kc_dt_admin_sua_tai_khoan (repo_rieng SQL/supabase_tc_d18a_thong_so.sql).
// BƯỚC: TC_D18A - NGÀY: 10/11/2026
// PHỤ THUỘC: qt_dt_khung.js (QDT), ../admin_NC.js, qt_dau_truong.css; dt/du_lieu/cau_hinh.json + thoi_ky.json (tên tài nguyên,
//   công trình, thời kỳ); RPC kc_dt_admin_ds_tai_khoan / kc_dt_admin_tai_khoan / kc_dt_admin_sua_tai_khoan.
// ================================================================

var QTK = {
  khoi: [], ds: [], chon: null, tk: null, sua: {}, loi: {}, tim: "", dangLuu: false,
  tenTn: {}, tenCt: {}, tenTk: {},
  CHUNG_LOAI: [["nhan", "🧑 Nhân tộc"], ["quy", "😈 Quỷ tộc"], ["tien", "🧝 Tiên tộc"]],
  GIOI: [["nam", "👦 Nam"], ["nu", "👧 Nữ"]],

  dangKyKhoi: function (k) { if (k && k.ma) QTK.khoi.push(k); },

  lay: function (o, khoa) { var d = khoa.split("."); for (var i = 0; i < d.length; i++) { if (o === null || o === undefined) return undefined; o = o[d[i]]; } return o; },
  giaTri: function (khoa, tk) { return Object.prototype.hasOwnProperty.call(QTK.sua, khoa) ? QTK.sua[khoa] : QTK.lay(tk, khoa); },
  _lop: function (khoa) { return "qtkO" + (Object.prototype.hasOwnProperty.call(QTK.sua, khoa) ? " chuaLuu" : "") + (QTK.loi[khoa] ? " loi" : ""); },

  oSo: function (khoa, tk, tc) {
    tc = tc || {};
    var v = QTK.giaTri(khoa, tk);
    return '<input class="qtkNhap" type="number" inputmode="numeric" step="1" data-khoa="' + khoa + '" data-kieu="so"'
      + (tc.min !== undefined ? ' min="' + tc.min + '"' : "") + (tc.max !== undefined ? ' max="' + tc.max + '"' : "")
      + ' value="' + QDT.html(v === undefined || v === null ? "" : v) + '">';
  },
  oChu: function (khoa, tk, tc) {
    var v = QTK.giaTri(khoa, tk);
    return '<input class="qtkNhap" type="text" maxlength="' + ((tc && tc.dai) || 24) + '" data-khoa="' + khoa + '" data-kieu="chu" value="' + QDT.html(v || "") + '">';
  },
  oChon: function (khoa, tk, ds) {
    var v = QTK.giaTri(khoa, tk);
    return '<select class="qtkNhap" data-khoa="' + khoa + '" data-kieu="chon">'
      + (v === undefined || v === null ? '<option value="" selected>(chưa chọn)</option>' : "")
      + ds.map(function (c) { return '<option value="' + c[0] + '"' + (c[0] === v ? " selected" : "") + ">" + QDT.html(c[1]) + "</option>"; }).join("") + "</select>";
  },
  // Một dòng: tên | ô (hoặc chữ chỉ đọc)
  dong: function (ten, noiDung, khoa) {
    return '<div class="' + (khoa ? QTK._lop(khoa) : "qtkO") + '"' + (khoa ? ' data-o="' + khoa + '"' : "") + '><span class="qtkTen">' + ten
      + '</span><span class="qtkGt">' + noiDung + "</span></div>";
  },
  sapCo: function (chu) { return '<span class="qtSapCo">' + QDT.html(chu || "sắp có") + "</span>"; }
};

// ----------------------------------------------------------------
// CÁC KHỐI CÓ SẴN (thứ tự đăng ký = thứ tự trên trang)
// ----------------------------------------------------------------
QTK.dangKyKhoi({
  ma: "hoso", ten: "Hồ sơ", bieuTuong: "🪪",
  ve: function (tk) {
    return QTK.dong("Chủng tộc", QTK.oChon("chungLoai", tk, QTK.CHUNG_LOAI), "chungLoai")
      + QTK.dong("Giới tính", QTK.oChon("gioi", tk, QTK.GIOI), "gioi")
      + (tk.coHoSo ? QTK.dong("Tên vương quốc", QTK.oChu("tenVuongQuoc", tk), "tenVuongQuoc")
        + QTK.dong("Lớp", QTK.oSo("lop", tk, { min: 1, max: 12 }), "lop")
        + QTK.dong("Thời kỳ", QDT.html(QTK.tenTk[tk.thoiKy] || tk.thoiKy || "Đồ đá"))
        : QTK.dong("Hồ sơ Thủ lĩnh", "<em>bé chưa tạo (chưa đặt tên vương quốc)</em>"))
      + QTK.dong("Thung lũng", tk.coLang ? QDT.html((tk.maVung || "") + (tk.banSao ? " · bản " + tk.banSao : "")) : "<em>chưa vào</em>");
  }
});

QTK.dangKyKhoi({
  ma: "thulinh", ten: "Thủ lĩnh", bieuTuong: "👑",
  ve: function (tk) {
    var nghi = tk.nghiDen && tk.gio && tk.nghiDen > tk.gio ? "đang nghỉ thêm " + Math.ceil((tk.nghiDen - tk.gio) / 1000) + " giây" : "khoẻ";
    return (tk.coHoSo ? QTK.dong("Tên Thủ lĩnh", QTK.oChu("tenThuLinh", tk), "tenThuLinh") : "")
      + QTK.dong("Cấp (Lv)", QTK.sapCo())
      + QTK.dong("Máu", tk.thuLinh ? QDT.html(tk.thuLinh.mau === null || tk.thuLinh.mau === undefined ? "đầy" : tk.thuLinh.mau) : "<em>chưa ra làng</em>")
      + QTK.dong("Tình trạng", tk.coLang ? nghi : "<em>chưa vào thung lũng</em>");
  }
});

QTK.dangKyKhoi({
  ma: "tainguyen", ten: "Tài nguyên đang có", bieuTuong: "📦",
  ve: function (tk) {
    if (!tk.coLang || !tk.kho) return '<p class="adminGhiChu">Bé chưa vào thung lũng nên chưa có kho.</p>';
    return Object.keys(tk.kho).map(function (k) {
      var t = QTK.tenTn[k] || { ten: k, bieuTuong: "" };
      return QTK.dong(QDT.html((t.bieuTuong ? t.bieuTuong + " " : "") + t.ten), QTK.oSo("kho." + k, tk, { min: 0, max: 10000000 }), "kho." + k);
    }).join("") + '<p class="qtkNho">Sửa ở đây vượt được sức chứa của kho; bé thu thêm thì vẫn bị chặn ở sức chứa.</p>';
  }
});

QTK.dangKyKhoi({
  ma: "nongdan", ten: "Nông dân", bieuTuong: "🧑‍🌾",
  ve: function (tk) {
    if (!tk.coLang) return '<p class="adminGhiChu">Bé chưa vào thung lũng nên chưa có nông dân.</p>';
    var ds = tk.nongDanDs || [];
    return QTK.dong("Số nông dân", QTK.oSo("nongDan", tk, { min: 0, max: 60 }), "nongDan")
      + '<p class="qtkNho">' + (tk.coLeu ? "Tăng số: người mới đứng quanh Lều trại. Giảm số: bớt người mới nhất."
        : "Bé chưa dựng xong Lều trại nên chưa thêm nông dân được (chỉ bớt được).") + "</p>"
      + (ds.length ? '<ul class="qtkThe">' + ds.map(function (n, i) {
        return "<li>#" + (i + 1) + " · ❤ " + QDT.html(n.mau === null || n.mau === undefined ? "đầy" : n.mau)
          + (n.viec ? " · đang làm việc" : " · rảnh") + "</li>";
      }).join("") + "</ul>" : "");
  }
});

QTK.dangKyKhoi({
  ma: "congtrinh", ten: "Công trình", bieuTuong: "🏠", rong: true,
  ve: function (tk) {
    if (!tk.coLang) return '<p class="adminGhiChu">Bé chưa vào thung lũng nên chưa có công trình.</p>';
    var ds = tk.congTrinhDs || [];
    if (!ds.length) return '<p class="adminGhiChu">Bé chưa xây công trình nào.</p>';
    var nhom = {}, thuTu = [];
    ds.forEach(function (c) { if (!nhom[c.loai]) { nhom[c.loai] = []; thuTu.push(c.loai); } nhom[c.loai].push(c); });
    return '<div class="qtkCongTrinh">' + thuTu.map(function (loai) {
      var d = nhom[loai];
      return '<div class="qtkCt"><strong>' + QDT.html(QTK.tenCt[loai] || loai) + " × " + d.length + '</strong><ul class="qtkThe">' + d.map(function (c) {
        return "<li>" + (c.cap ? "cấp " + QDT.html(c.cap) + " · " : "") + "ô " + QDT.html(c.x) + "," + QDT.html(c.y)
          + (c.mau !== null && c.mau !== undefined ? " · ❤ " + QDT.html(c.mau) : "")
          + (c.xong ? "" : " · 🔨 đang xây") + (c.hong ? " · 🔥 hỏng" : "") + "</li>";
      }).join("") + "</ul></div>";
    }).join("") + '</div><p class="qtkNho">Hiện mới xem được. Thêm / xoá / nâng cấp công trình cho bé từ đây: ' + QTK.sapCo() + "</p>";
  }
});

QTK.dangKyKhoi({
  ma: "tuido", ten: "Túi đồ", bieuTuong: "🎒",
  ve: function (tk) {
    var ds = tk.tuiDo || [];
    if (!ds.length) return '<p class="adminGhiChu">Túi đồ trống.</p>';
    return '<ul class="qtkThe">' + ds.map(function (d) {
      return "<li>" + QDT.html((d.bieuTuong ? d.bieuTuong + " " : "") + (d.ten || d.ma)) + " × " + QDT.html(d.soLuong) + "</li>";
    }).join("") + "</ul>";
  }
});

QTK.dangKyKhoi({ ma: "tuong", ten: "Tướng chiêu mộ", bieuTuong: "🧙", sapCo: true, seCo: ["Danh sách tướng bé đã chiêu mộ", "Cấp, máu, kỹ năng từng tướng", "Thêm / bớt tướng cho bé"] });
QTK.dangKyKhoi({ ma: "linhcung", ten: "Lính cung", bieuTuong: "🏹", sapCo: true, seCo: ["Số lính cung đang có", "Thêm / bớt lính"] });
QTK.dangKyKhoi({ ma: "kybinh", ten: "Lính kỵ binh", bieuTuong: "🐎", sapCo: true, seCo: ["Số kỵ binh đang có", "Thêm / bớt lính"] });
QTK.dangKyKhoi({ ma: "bobinh", ten: "Lính bộ binh", bieuTuong: "🛡️", sapCo: true, seCo: ["Số bộ binh đang có", "Thêm / bớt lính"] });

// ----------------------------------------------------------------
// MỤC + VỎ
// ----------------------------------------------------------------
QDT.dangKyMuc({
  ma: "taikhoan", ten: "Tài khoản", bieuTuong: "👤", tieuDe: "Tài Khoản Đấu Trường Tri Thức",
  moTa: "Cài đặt Đấu Trường của <strong>từng bé</strong>: chủng tộc, giới tính, Thủ lĩnh, tài nguyên, nông dân, công trình. "
    + "Chọn một bé, sửa ô rồi bấm 💾 Lưu. Mọi lần sửa đều ghi vào 🎛️ Thông số › 🕘 Lịch sử sửa và hoàn tác được. "
    + "Bé đang chơi sẽ thấy số mới sau vài giây hoặc khi mở lại trang.",
  dung: function (than) {
    than.innerHTML = '<div class="qdTrangThai" id="qtkTrangThai"></div>'
      + '<div class="qtkKhung" id="qtkKhung">'
      + '<aside class="qtkCotDs"><div class="qdThanhCongCu"><input type="search" id="qtkTim" placeholder="🔍 Tìm bé (tên, vương quốc)" aria-label="Tìm bé">'
      + '<button class="adminNut adminNutPhu" id="qtkLamMoi" type="button" title="Tải lại">🔄</button></div>'
      + '<div class="qtkDs" id="qtkDs"><p class="adminDangTai">Đang tải...</p></div></aside>'
      + '<div class="qtkChiTiet" id="qtkChiTiet"><p class="adminGhiChu qtkTrong">👈 Chọn một bé ở danh sách.</p></div></div>'
      + '<div class="qdThanhLuu" id="qtkThanhLuu"><strong id="qtkSoChuaLuu">0 ô chưa lưu</strong>'
      + '<input type="text" id="qtkGhiChu" maxlength="300" placeholder="Ghi chú lần sửa (không bắt buộc)">'
      + '<button class="adminNut adminNutPhu" id="qtkBo" type="button">Bỏ</button>'
      + '<button class="adminNut" id="qtkLuu" type="button">💾 Lưu</button></div>';
  },
  mo: function (than) { qtkGanSuKien(than); qtkTaiTen(); qtkTaiDs(); },
  soChuaLuu: function () { return qtkSoChuaLuu(); }
});

function qtkSoChuaLuu() { return Object.keys(QTK.sua).length; }

function qtkBaoTrangThai(chu, loi) {
  var o = QDT.el("qtkTrangThai");
  o.textContent = chu || "";
  o.className = "qdTrangThai" + (chu ? " hien" : "") + (loi ? " loi" : "");
}

// Tên tài nguyên / công trình / thời kỳ lấy từ file của game (không có cũng chạy: hiện mã)
function qtkTaiTen() {
  function tai(url) { return fetch(url, { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
  return Promise.all([tai("dt/du_lieu/cau_hinh.json"), tai("dt/du_lieu/thoi_ky.json")]).then(function (kq) {
    var ch = kq[0], tk = kq[1];
    if (ch && ch.lang && ch.lang.taiNguyen) QTK.tenTn = ch.lang.taiNguyen;
    if (ch && ch.congTrinh) Object.keys(ch.congTrinh).forEach(function (k) { if (ch.congTrinh[k] && ch.congTrinh[k].ten) QTK.tenCt[k] = ch.congTrinh[k].ten; });
    if (tk && tk.thoiKy) tk.thoiKy.forEach(function (t) { QTK.tenTk[t.ma] = t.ten + " (" + t.danhHieu + ")"; });
    if (QTK.tk) qtkVeChiTiet();
  });
}

function qtkTaiDs() {
  return QDT.goi("kc_dt_admin_ds_tai_khoan").then(function (kq) {
    if (!kq || !kq.thanhCong) {
      QTK.ds = [];
      qtkBaoTrangThai("❌ Chưa đọc được danh sách bé: " + ((kq && kq.thongBao) || "máy chủ không trả lời")
        + ". Nếu vừa cập nhật trang, hãy chạy lại file SQL supabase_tc_d18a_thong_so.sql.", true);
    } else { QTK.ds = kq.ds || []; qtkBaoTrangThai(""); }
    qtkVeDs();
  });
}

function qtkBieuTuongLoai(cl) { return cl === "quy" ? "😈" : cl === "tien" ? "🧝" : cl === "nhan" ? "🧑" : "❔"; }

function qtkVeDs() {
  var tim = QTK.tim.trim().toLowerCase();
  var ds = QTK.ds.filter(function (b) {
    return !tim || (b.ten + " " + (b.tenVuongQuoc || "") + " " + (b.tenThuLinh || "")).toLowerCase().indexOf(tim) >= 0;
  });
  var o = QDT.el("qtkDs");
  if (!QTK.ds.length) { o.innerHTML = '<p class="adminGhiChu">Chưa có bé nào vào Đấu Trường.</p>'; return; }
  if (!ds.length) { o.innerHTML = '<p class="adminGhiChu">Không có bé nào khớp.</p>'; return; }
  o.innerHTML = '<p class="qtkNho">' + ds.length + " / " + QTK.ds.length + " bé</p>" + ds.map(function (b) {
    return '<button type="button" class="qtkBe' + (b.ten === QTK.chon ? " dangChon" : "") + '" data-be="' + QDT.html(b.ten) + '">'
      + '<span class="qtkBeHinh">' + qtkBieuTuongLoai(b.chungLoai) + '</span><span class="qtkBeChu"><strong>' + QDT.html(b.ten) + "</strong>"
      + "<small>" + QDT.html(b.tenVuongQuoc || "chưa đặt tên vương quốc") + (b.lop ? " · lớp " + QDT.html(b.lop) : "") + "</small></span>"
      + '<span class="qtkBeSo">' + (b.coLang ? "🧑‍🌾 " + QDT.html(b.nongDan || 0) + " · 🏠 " + QDT.html(b.soCongTrinh || 0) : "chưa vào") + "</span></button>";
  }).join("");
}

function qtkChon(ten) {
  if (ten !== QTK.chon && qtkSoChuaLuu() > 0 && !confirm("Đang có " + qtkSoChuaLuu() + " ô chưa lưu của bé " + QTK.chon + ". Bỏ các ô đó?")) return;
  QTK.chon = ten; QTK.sua = {}; QTK.loi = {}; QTK.tk = null;
  QDT.el("qtkKhung").classList.add("dangXem");
  QDT.el("qtkChiTiet").innerHTML = '<p class="adminDangTai">Đang tải...</p>';
  qtkVeDs(); qtkVeThanhLuu();
  return qtkTaiChiTiet();
}

function qtkTaiChiTiet() {
  var ten = QTK.chon;
  return QDT.goi("kc_dt_admin_tai_khoan", { p_ten: ten }).then(function (kq) {
    if (ten !== QTK.chon) return;
    if (!kq || !kq.thanhCong) {
      QDT.el("qtkChiTiet").innerHTML = qtkNutVe() + '<p class="adminGhiChu">❌ Chưa đọc được bé này: ' + QDT.html((kq && kq.thongBao) || "máy chủ không trả lời") + "</p>";
      return;
    }
    QTK.tk = kq.tk;
    qtkVeChiTiet();
  });
}

function qtkNutVe() { return '<button type="button" class="adminNut adminNutPhu qtkVe" id="qtkVe">‹ Danh sách bé</button>'; }

function qtkVeChiTiet() {
  var tk = QTK.tk;
  if (!tk) return;
  QDT.el("qtkChiTiet").innerHTML = qtkNutVe()
    + '<h4 class="qtkTieuDe">' + qtkBieuTuongLoai(QTK.giaTri("chungLoai", tk)) + " " + QDT.html(tk.ten)
    + (tk.tenVuongQuoc ? " <small>· " + QDT.html(tk.tenVuongQuoc) + "</small>" : "") + "</h4>"
    + '<div class="qtkLuoi">' + QTK.khoi.map(function (k) {
      var than;
      if (k.sapCo) than = '<ul class="qdtSeCo">' + (k.seCo || []).map(function (s) { return "<li>" + QDT.html(s) + "</li>"; }).join("") + "</ul>";
      else { try { than = k.ve(tk); } catch (e) { than = '<p class="adminGhiChu">❌ Khối này lỗi: ' + QDT.html(e.message) + "</p>"; } }
      return '<section class="qdThe qtkKhoi' + (k.rong ? " qtkRong" : "") + (k.sapCo ? " qtkKhoiSapCo" : "") + '" data-khoi="' + k.ma + '"><h4>'
        + QDT.html((k.bieuTuong ? k.bieuTuong + " " : "") + k.ten) + (k.sapCo ? " " + QTK.sapCo() : "") + "</h4>" + than + "</section>";
    }).join("") + "</div>";
}

function qtkVeThanhLuu() {
  var so = qtkSoChuaLuu();
  QDT.el("qtkThanhLuu").classList.toggle("hien", so > 0);
  QDT.el("qtkSoChuaLuu").textContent = so + " ô chưa lưu" + (QTK.chon ? " (" + QTK.chon + ")" : "");
  QDT.el("qtkLuu").disabled = QTK.dangLuu || Object.keys(QTK.loi).length > 0;
}

// Người dùng đổi một ô: so với số đang lưu, ghi vào QTK.sua (hoặc bỏ nếu về như cũ)
function qtkNhan(o) {
  var khoa = o.getAttribute("data-khoa"), kieu = o.getAttribute("data-kieu"), v, loi = false;
  if (kieu === "so") {
    var chu = o.value.trim();
    v = Number(chu);
    loi = chu === "" || !isFinite(v) || Math.floor(v) !== v || (o.min !== "" && v < Number(o.min)) || (o.max !== "" && v > Number(o.max));
  } else if (kieu === "chu") {
    v = o.value.trim().replace(/\s+/g, " ");
    loi = v === "";
  } else { v = o.value; loi = v === ""; }
  var cu = QTK.lay(QTK.tk, khoa);
  if (loi) { QTK.loi[khoa] = true; QTK.sua[khoa] = v; }
  else {
    delete QTK.loi[khoa];
    if (QDT.giong(v, cu === undefined || cu === null ? (kieu === "chu" ? "" : cu) : cu)) delete QTK.sua[khoa]; else QTK.sua[khoa] = v;
  }
  var dong = o.closest("[data-o]");
  if (dong) dong.className = QTK._lop(khoa);
  qtkVeThanhLuu();
}

function qtkLuu() {
  if (QTK.dangLuu || !QTK.chon || !qtkSoChuaLuu()) return;
  if (Object.keys(QTK.loi).length) { QDT.bao("❌ Còn ô sai (viền đỏ), sửa lại rồi lưu.", false); return; }
  var sua = {};
  Object.keys(QTK.sua).forEach(function (khoa) {
    var d = khoa.split("."), o = sua;
    for (var i = 0; i < d.length - 1; i++) { if (!o[d[i]]) o[d[i]] = {}; o = o[d[i]]; }
    o[d[d.length - 1]] = QTK.sua[khoa];
  });
  QTK.dangLuu = true; qtkVeThanhLuu();
  var ten = QTK.chon;
  QDT.goi("kc_dt_admin_sua_tai_khoan", { p_ten: ten, p_sua: sua, p_ghi_chu: QDT.el("qtkGhiChu").value.trim() || null }).then(function (kq) {
    QTK.dangLuu = false;
    if (!kq || !kq.thanhCong) {
      QDT.bao("❌ " + ((kq && kq.thongBao) || "Không lưu được"), false);
      qtkVeThanhLuu();
      return;
    }
    QDT.bao("✅ Đã lưu cài đặt của bé " + ten + ".", true);
    QTK.sua = {}; QTK.loi = {}; QDT.el("qtkGhiChu").value = "";
    QTK.ds = QTK.ds.map(function (b) { return b.ten === ten && kq.tk ? kq.tk : b; });
    qtkVeDs(); qtkVeThanhLuu();
    return qtkTaiChiTiet();
  });
}

function qtkGanSuKien(than) {
  than.addEventListener("click", function (su) {
    var t = su.target;
    var be = t.closest("[data-be]");
    if (be) { qtkChon(be.getAttribute("data-be")); return; }
    if (t.closest("#qtkVe")) { QDT.el("qtkKhung").classList.remove("dangXem"); return; }
    if (t.closest("#qtkLamMoi")) {
      if (qtkSoChuaLuu() > 0 && !confirm("Tải lại sẽ bỏ " + qtkSoChuaLuu() + " ô chưa lưu. Tiếp tục?")) return;
      QTK.sua = {}; QTK.loi = {}; qtkVeThanhLuu();
      qtkTaiDs(); if (QTK.chon) qtkTaiChiTiet();
      return;
    }
    if (t.closest("#qtkBo")) { QTK.sua = {}; QTK.loi = {}; qtkVeChiTiet(); qtkVeThanhLuu(); return; }
    if (t.closest("#qtkLuu")) { qtkLuu(); return; }
  });
  than.addEventListener("change", function (su) { if (su.target.classList.contains("qtkNhap")) qtkNhan(su.target); });
  than.addEventListener("input", function (su) {
    if (su.target.id === "qtkTim") { QTK.tim = su.target.value; qtkVeDs(); }
    else if (su.target.classList.contains("qtkNhap") && su.target.tagName === "INPUT") qtkNhan(su.target);
  });
}
