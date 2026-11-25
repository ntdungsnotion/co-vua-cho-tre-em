// ================================================================
// FILE: kc/kc_cua_hang.js
// CHỨC NĂNG: Logic CỬA HÀNG CHUNG TOÀN APP (kc/cuahang_NC.html), 2 ngăn:
//   🎁 Quà thật (đổi bằng 💎) + 🙂 Avatar chung (mua bằng 🪙 xu vàng).
// BƯỚC: KC_05 - NGÀY: 25/11/2026 06:xx
// CẬP NHẬT: 25/11/2026 07:xx - KC_05A: ngăn 🙂 Avatar (avatar chung bán bằng xu vàng; avatar miễn phí vẫn ở Cờ Vua).
// TIỀN TỐ: chq - tránh trùng "ch" của cuahang_NC.js (Cờ Vua).
//
// LUẬT (HƯỚNG DẪN 3.19 "MỘT CỬA HÀNG CHUNG"):
//   - Nơi DUY NHẤT bán QUÀ THẬT (vat_pham.loai = 'qua') và AVATAR CHUNG (kc_avatar_chung).
//     Game / mảng nào cũng KHÔNG tự làm cửa hàng quà thật / avatar chung riêng.
//   - 💎 (tai_khoan.diem_so) và 🪙 (kc_vi_vang) là kho chung toàn app.
//   - Máy chủ mới tính giá + trừ; trang chỉ hiển thị.
//
// RPC:
//   Quà (Cờ Vua, có sẵn - chỉ GỌI): lay_danh_sach_vat_pham (lọc 'qua'), lay_ho_so (lichSuDoiQua lọc 'qua'), doi_vat_pham.
//   Avatar (KC_05A, SQL supabase_kc05a_avatar_vang.sql): kc_avatar_chung_ds, kc_avatar_chung_mua, kc_avatar_chung_dung.
// PHỤ THUỘC: kc_api.js (kcGoiRpc), kc_auth.js (kcSanSang, kcCapNhatTui, kcLuuPhien, kcTaiKhoanHienTai).
// ================================================================

var chqTaiKhoan = null;
var chqDsQua = [];
var chqDaDoi = [];
var chqDsAvatar = [];
var chqAvatarLoi = "";
var chqSoVang = 0;
var chqNgan = "qua";          // "qua" | "avatar"
var chqDangDoi = false;
var chqHang = null;           // { loai: "qua"|"avatar", vp } đang hỏi trong hộp

function chqEl(id) { return document.getElementById(id); }

function chqThoat(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Giống luật board.js / cuahang_NC.js: bắt đầu "http" hoặc chứa "/" là ảnh */
function chqLaAnh(s) {
  return typeof s === "string" && (s.indexOf("http") === 0 || s.indexOf("/") >= 0);
}

function chqHtmlHinh(urlHinh, duPhong) {
  if (chqLaAnh(urlHinh)) return '<img src="' + chqThoat(urlHinh) + '" alt="" loading="lazy">';
  if (urlHinh) return chqThoat(urlHinh);   // emoji
  return duPhong || "🎁";
}

function chqTk() {
  return (typeof kcTaiKhoanHienTai !== "undefined" && kcTaiKhoanHienTai) || chqTaiKhoan;
}

/** Số 💎 đọc từ phiên chung của kc_auth.js (kcCapNhatTui ghi vào đó) */
function chqSoDu() {
  var tk = chqTk();
  return Number(tk && tk.diemSo) || 0;
}

function chqVeSoDu(nay) {
  var laAvatar = (chqNgan === "avatar");
  chqEl("chqSoDuHinh").textContent = laAvatar ? "🪙" : "💎";
  chqEl("chqSoKimCuong").textContent = laAvatar ? chqSoVang : chqSoDu();
  chqEl("chqSoDu").title = laAvatar ? "Xu vàng của con" : "Kim cương của con";
  chqEl("chqBangLoi").textContent = laAvatar
    ? "Xu vàng con kiếm khi trả lời đúng ở mọi nơi trong app dùng để mua avatar ở đây."
    : "Kim cương con kiếm ở mọi trò chơi, bài học, thử thách đều gom về đây.";
  if (nay) {
    var o = chqEl("chqSoDu");
    o.classList.remove("chqNay"); void o.offsetWidth; o.classList.add("chqNay");
  }
}

var chqHenTB = null;
function chqThongBao(text, tot) {
  var o = chqEl("chqThongBao");
  o.textContent = text;
  o.className = "chqThongBao hien " + (tot ? "tot" : "xau");
  if (chqHenTB) clearTimeout(chqHenTB);
  chqHenTB = setTimeout(function () { o.className = "chqThongBao"; }, 6000);
}

/** Ghi avatar mới vào phiên chung để thanh trên / Trang chủ thấy ngay */
function chqGhiAvatar(kq) {
  var tk = chqTk();
  if (!tk || !kq) return;
  if (typeof kq.avatarDaChon === "string") tk.avatarDaChon = kq.avatarDaChon;
  if (kq.trangBi) tk.trangBi = kq.trangBi;
  if (typeof kcLuuPhien === "function") kcLuuPhien(tk);
}

// ----------------------------------------------------------------
// TẢI DỮ LIỆU
// ----------------------------------------------------------------
function chqTai() {
  var tk = chqTk();
  var ten = tk.tenDangNhap;
  Promise.all([
    kcGoiRpc("lay_danh_sach_vat_pham", {}),
    kcGoiRpc("lay_ho_so", { p_ten: ten }),
    kcGoiRpc("kc_avatar_chung_ds", { p_ten: ten, p_ma_phien: tk.maPhien || "" })
  ]).then(function (kq) {
    var ds = kq[0] || {}, hs = kq[1] || {}, av = kq[2] || {};
    chqEl("chqDangTai").style.display = "none";
    if (hs.thanhCong && hs.hoSo) {
      var tt = hs.hoSo.thongTin || {};
      if (typeof tt.diemSo === "number") kcCapNhatTui({ diemSo: tt.diemSo });  // ghi phiên chung + túi trên thanh
      chqDaDoi = (hs.hoSo.lichSuDoiQua || []).filter(function (ls) { return ls.loai === "qua"; });
    }
    if (ds.thanhCong) {
      chqDsQua = (ds.danhSachVatPham || []).filter(function (vp) { return vp.loai === "qua"; });
    } else {
      chqDsQua = [];
      chqThongBao(ds.thongBao || "Chưa mở được cửa hàng, con thử lại nhé.", false);
    }
    if (av.thanhCong) {
      chqDsAvatar = av.ds || [];
      chqSoVang = Number(av.soVang) || 0;
      chqAvatarLoi = "";
      kcCapNhatTui({ viVang: chqSoVang });
    } else {
      chqDsAvatar = [];
      chqAvatarLoi = av.ma === "phien_het_han" ? "Phiên đăng nhập đã hết, con đăng nhập lại giúp nhé."
        : "Ngăn avatar đang chuẩn bị, con quay lại sau nhé!";
    }
    chqVeSoDu(false);
    chqVeLuoi();
    chqVeDaDoi();
  });
}

// ----------------------------------------------------------------
// LƯỚI (theo ngăn)
// ----------------------------------------------------------------
function chqVeLuoi() {
  var nut = document.querySelectorAll(".chqNganNut");
  for (var i = 0; i < nut.length; i++) nut[i].classList.toggle("dangChon", nut[i].getAttribute("data-ngan") === chqNgan);
  if (chqNgan === "avatar") chqVeLuoiAvatar(); else chqVeLuoiQua();
}

function chqTheRong(hinh, loi) {
  return '<div class="chqRong" style="grid-column:1/-1;"><span class="chqRongHinh">' + hinh + '</span>' + loi + '</div>';
}

function chqVeLuoiQua() {
  var luoi = chqEl("chqLuoi");
  luoi.innerHTML = "";
  if (!chqDsQua.length) {
    luoi.innerHTML = chqTheRong("🎀", "Cửa hàng đang chờ quà mới! Con cứ chăm chơi, chăm học để gom thật nhiều 💎 nhé.");
    return;
  }
  var soDu = chqSoDu();
  chqDsQua.forEach(function (vp) {
    var gia = Number(vp.giaKimCuong) || 0;
    var het = (vp.conLai === 0);
    var duTien = soDu >= gia;
    var the = document.createElement("div");
    the.className = "chqThe" + (het ? " chqHet" : (duTien ? " chqDuTien" : ""));
    var phanTram = gia > 0 ? Math.min(100, Math.round(soDu * 100 / gia)) : 100;
    var html =
      '<div class="chqHinh">' + chqHtmlHinh(vp.urlHinh) + '</div>' +
      '<div class="chqThan">' +
        '<p class="chqTen">' + chqThoat(vp.ten || "Quà") + '</p>' +
        '<p class="chqMoTa">' + chqThoat(vp.moTa || "") + '</p>' +
        '<div class="chqGia">💎 ' + gia + '</div>';
    if (!het && !duTien) {
      html += '<div class="chqThanh"><span style="width:' + phanTram + '%"></span></div>' +
        '<div class="chqConThieu">Gom thêm ' + (gia - soDu) + ' 💎 nữa là đổi được!</div>';
    } else if (!het && vp.conLai != null) {
      html += '<div class="chqConThieu">Còn ' + vp.conLai + ' phần quà</div>';
    }
    html += '<button class="chqNut" type="button"' + ((het || !duTien) ? " disabled" : "") + '>' +
      (het ? "Hết quà rồi" : (duTien ? "🎁 Đổi quà" : "🔒 Chưa đủ 💎")) + '</button></div>';
    the.innerHTML = html;
    if (!het && duTien) {
      the.querySelector("button").addEventListener("click", function () { chqHoi("qua", vp); });
    }
    luoi.appendChild(the);
  });
}

function chqVeLuoiAvatar() {
  var luoi = chqEl("chqLuoi");
  luoi.innerHTML = "";
  if (chqAvatarLoi) { luoi.innerHTML = chqTheRong("🙂", chqThoat(chqAvatarLoi)); return; }
  if (!chqDsAvatar.length) {
    luoi.innerHTML = chqTheRong("🙂", "Sắp có avatar mới! Con cứ trả lời đúng thật nhiều để gom 🪙 xu vàng nhé.");
    return;
  }
  chqDsAvatar.forEach(function (av) {
    var gia = Number(av.giaVang) || 0;
    var duTien = chqSoVang >= gia;
    var the = document.createElement("div");
    the.className = "chqThe" + (av.dangDung ? " chqDangDung" : ((av.daCo || duTien) ? " chqDuTien" : ""));
    var html =
      '<div class="chqHinh chqHinhAvatar">' + chqHtmlHinh(av.urlHinh, "🙂") + '</div>' +
      '<div class="chqThan">' +
        '<p class="chqTen">' + chqThoat(av.ten || "Avatar") + '</p>' +
        '<p class="chqMoTa">' + chqThoat(av.moTa || "") + '</p>';
    var nut;
    if (av.dangDung) {
      html += '<div class="chqGhiChu">⭐ Con đang dùng avatar này</div>';
      nut = '<button class="chqNut" type="button" disabled>⭐ Đang dùng</button>';
    } else if (av.daCo) {
      html += '<div class="chqGhiChu">✅ Con đã có</div>';
      nut = '<button class="chqNut chqNutDung" type="button" data-hanh="dung">😎 Dùng avatar này</button>';
    } else {
      html += '<div class="chqGia">🪙 ' + gia + '</div>';
      if (!duTien) {
        var phanTram = gia > 0 ? Math.min(100, Math.round(chqSoVang * 100 / gia)) : 100;
        html += '<div class="chqThanh"><span style="width:' + phanTram + '%"></span></div>' +
          '<div class="chqConThieu">Gom thêm ' + (gia - chqSoVang) + ' 🪙 nữa là mua được!</div>';
      }
      nut = '<button class="chqNut" type="button" data-hanh="mua"' + (duTien ? "" : " disabled") + '>' +
        (duTien ? "🪙 Mua avatar" : "🔒 Chưa đủ 🪙") + '</button>';
    }
    the.innerHTML = html + nut + '</div>';
    var b = the.querySelector("button[data-hanh]");
    if (b && !b.disabled) {
      b.addEventListener("click", function () {
        if (this.getAttribute("data-hanh") === "dung") chqDungAvatar(av, this);
        else chqHoi("avatar", av);
      });
    }
    luoi.appendChild(the);
  });
}

// ----------------------------------------------------------------
// QUÀ CON ĐÃ ĐỔI
// ----------------------------------------------------------------
function chqVeDaDoi() {
  var khung = chqEl("chqDaDoi");
  if (!chqDaDoi.length) {
    khung.innerHTML = '<div class="chqRong"><span class="chqRongHinh">📦</span>Con chưa đổi quà nào. Chọn một món con thích nhất nhé!</div>';
    return;
  }
  var html = "";
  chqDaDoi.forEach(function (ls) {
    var daNhan = (ls.trangThai === "da_nhan");   // HƯỚNG DẪN Cờ Vua 4.6: 'cho_trao' | 'da_nhan'
    var ngay = "";
    if (ls.thoiGianDoi) {
      var d = new Date(ls.thoiGianDoi);
      if (!isNaN(d)) ngay = d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
    }
    html += '<div class="chqDong"><div class="chqDongHinh">' + chqHtmlHinh(ls.urlHinh) + '</div>' +
      '<div class="chqDongTen">' + chqThoat(ls.tenVatPham || "Quà") + (ngay ? '<small>Đổi ngày ' + ngay + '</small>' : "") + '</div>' +
      '<span class="chqNhan ' + (daNhan ? "chqNhanXong" : "chqNhanCho") + '">' + (daNhan ? "✅ Đã nhận" : "⏳ Chờ trao") + '</span></div>';
  });
  khung.innerHTML = html;
}

// ----------------------------------------------------------------
// HỘP HỎI LẠI -> ĐỔI QUÀ / MUA AVATAR
// ----------------------------------------------------------------
function chqHoi(loai, vp) {
  if (chqDangDoi) return;
  chqHang = { loai: loai, vp: vp };
  var laAvatar = (loai === "avatar");
  chqEl("chqHopHinh").innerHTML = chqHtmlHinh(vp.urlHinh, laAvatar ? "🙂" : "🎁");
  chqEl("chqHopTieuDe").textContent = (laAvatar ? "Mua avatar \"" : "Đổi \"") + (vp.ten || (laAvatar ? "Avatar" : "Quà")) + "\"?";
  chqEl("chqHopLoi").textContent = laAvatar
    ? "Con dùng " + (Number(vp.giaVang) || 0) + " 🪙 xu vàng. Mua xong avatar hiện ngay ở mọi nơi trong app!"
    : "Con dùng " + (Number(vp.giaKimCuong) || 0) + " 💎 để đổi món quà này. Bố mẹ / thầy cô sẽ trao quà tận tay con nhé!";
  chqEl("chqHopKhong").hidden = false;
  chqEl("chqHopKhong").textContent = "Để sau";
  chqEl("chqHopCo").textContent = laAvatar ? "🪙 Mua luôn!" : "🎁 Đổi luôn!";
  chqEl("chqHopCo").disabled = false;
  chqEl("chqPhu").classList.add("hien");
}

function chqDongHop() {
  chqEl("chqPhu").classList.remove("hien");
  chqHang = null;
}

function chqChucMung(tieuDe, loi) {
  chqHang = null;
  chqEl("chqHopTieuDe").textContent = tieuDe;
  chqEl("chqHopLoi").textContent = loi;
  chqEl("chqHopKhong").hidden = true;
  chqEl("chqHopCo").disabled = false;
  chqEl("chqHopCo").textContent = "Tuyệt vời! 🥳";
}

function chqBamCo() {
  var hang = chqHang;
  if (!hang) { chqDongHop(); return; }   // hộp đang ở dạng chúc mừng
  if (chqDangDoi) return;
  chqDangDoi = true;
  chqEl("chqHopCo").disabled = true;
  chqEl("chqHopCo").textContent = "Đang xử lý...";
  var tk = chqTk();
  var vp = hang.vp;

  if (hang.loai === "avatar") {
    kcGoiRpc("kc_avatar_chung_mua", { p_ten: tk.tenDangNhap, p_ma_phien: tk.maPhien || "", p_vat_pham_id: vp.id }).then(function (kq) {
      chqDangDoi = false;
      kq = kq || {};
      if (!kq.thanhCong) {
        chqDongHop();
        chqThongBao(chqDichLoiAvatar(kq), false);
        chqTai();
        return;
      }
      chqSoVang = Number(kq.soVang) || 0;
      kcCapNhatTui({ viVang: chqSoVang });
      chqGhiAvatar(kq);
      chqVeSoDu(true);
      chqChucMung("🎉 Avatar mới của con!", "\"" + (vp.ten || "Avatar") + "\" đã được gắn cho con. Ở đâu trong app cũng thấy nhé!");
      chqTai();
    });
    return;
  }

  kcGoiRpc("doi_vat_pham", { p_ten: tk.tenDangNhap, p_vat_pham_id: vp.id }).then(function (kq) {
    chqDangDoi = false;
    kq = kq || {};
    if (!kq.thanhCong) {
      chqDongHop();
      chqThongBao(chqDichLoi(kq.thongBao), false);
      chqTai();
      return;
    }
    if (typeof kq.diemMoi === "number") kcCapNhatTui({ diemSo: kq.diemMoi });
    chqVeSoDu(true);
    chqChucMung("🎉 Đổi quà thành công!", "\"" + (vp.ten || "Quà") + "\" đang chờ được trao. Con nhớ báo bố mẹ / thầy cô nhé!");
    chqTai();
  });
}

/** Dùng (gắn) avatar chung con đã có */
function chqDungAvatar(av, nut) {
  if (chqDangDoi) return;
  chqDangDoi = true;
  nut.disabled = true;
  var tk = chqTk();
  kcGoiRpc("kc_avatar_chung_dung", { p_ten: tk.tenDangNhap, p_ma_phien: tk.maPhien || "", p_vat_pham_id: av.id }).then(function (kq) {
    chqDangDoi = false;
    kq = kq || {};
    if (!kq.thanhCong) { chqThongBao(chqDichLoiAvatar(kq), false); chqTai(); return; }
    chqGhiAvatar(kq);
    chqThongBao("😎 Đã gắn avatar \"" + (av.ten || "") + "\" cho con!", true);
    chqTai();
  });
}

/** Thông báo không dấu của máy chủ -> câu thân thiện cho bé */
function chqDichLoi(thongBao) {
  var s = (thongBao || "").toLowerCase();
  if (s.indexOf("khong du kim cuong") >= 0) return "Con chưa đủ kim cương cho món quà này, gom thêm chút nữa nhé!";
  if (s.indexOf("het hang") >= 0) return "Tiếc quá, món quà này vừa hết rồi.";
  if (s.indexOf("khong ton tai") >= 0 || s.indexOf("dang an") >= 0) return "Món quà này tạm thời không còn trong cửa hàng.";
  if (s.indexOf("khong tim thay tai khoan") >= 0) return "Phiên đăng nhập có vấn đề, con đăng nhập lại giúp nhé.";
  return thongBao || "Đổi quà chưa được, con thử lại nhé.";
}

function chqDichLoiAvatar(kq) {
  switch (kq.ma) {
    case "thieu_vang": return "Con chưa đủ 🪙 xu vàng cho avatar này, gom thêm chút nữa nhé!";
    case "da_co": return "Con có avatar này rồi, bấm \"Dùng\" là được!";
    case "khong_ban": return "Avatar này tạm thời không còn trong cửa hàng.";
    case "chua_co": return "Con chưa có avatar này.";
    case "khong_phai_be": return "Avatar dành cho các bé nhé.";
    case "phien_het_han": return "Phiên đăng nhập đã hết, con đăng nhập lại giúp nhé.";
  }
  return kq.thongBao || "Chưa mua được, con thử lại nhé.";
}

// ----------------------------------------------------------------
// KHỞI ĐỘNG
// ----------------------------------------------------------------
document.addEventListener("DOMContentLoaded", function () {
  chqEl("chqHopKhong").addEventListener("click", chqDongHop);
  chqEl("chqHopCo").addEventListener("click", chqBamCo);
  chqEl("chqPhu").addEventListener("click", function (e) { if (e.target === this && !chqDangDoi) chqDongHop(); });
  // Ngăn mở sẵn theo địa chỉ: cuahang_NC.html#avatar
  if (window.location.hash === "#avatar") chqNgan = "avatar";
  var nut = document.querySelectorAll(".chqNganNut");
  for (var i = 0; i < nut.length; i++) {
    nut[i].addEventListener("click", function () {
      chqNgan = this.getAttribute("data-ngan");
      try { history.replaceState(null, "", chqNgan === "avatar" ? "#avatar" : "#"); } catch (e) { /* bỏ qua */ }
      chqVeSoDu(false);
      chqVeLuoi();
    });
  }
});

document.addEventListener("kcSanSang", function (su) {
  var d = su.detail || {};
  if (!d.daDangNhap || !d.taiKhoan) return;
  chqTaiKhoan = d.taiKhoan;
  if (chqTaiKhoan.vaiTro === "phu_huynh") {
    chqEl("chqPhuHuynh").hidden = false;
    chqEl("chqKhuBe").hidden = true;
    return;
  }
  chqVeSoDu(false);
  chqTai();
});
