// ================================================================
// FILE: kc/kc_cua_hang.js
// CHỨC NĂNG: Logic CỬA HÀNG QUÀ CHUNG TOÀN APP (kc/cuahang_NC.html).
// BƯỚC: KC_05 - NGÀY: 25/11/2026 06:xx
// TIỀN TỐ: chq (cửa hàng quà) - tránh trùng "ch" của cuahang_NC.js (Cờ Vua).
//
// LUẬT (HƯỚNG DẪN 3.13 "MỘT CỬA HÀNG QUÀ"):
//   - Đây là nơi DUY NHẤT bán QUÀ THẬT (vat_pham.loai = 'qua'). Game / mảng nào
//     cũng KHÔNG tự làm cửa hàng quà thật riêng; muốn có quà thì thêm vào đây
//     (Quản trị › 🛍️ Cửa hàng quà).
//   - 💎 là kho chung (tai_khoan.diem_so): kiếm ở đâu cũng tiêu ở đây.
//   - Máy chủ (doi_vat_pham) mới tính giá + trừ kim cương; trang chỉ hiển thị.
//
// RPC (của Cờ Vua, có sẵn - chỉ GỌI, không sửa: vùng cấm Sổ Tay B2):
//   lay_danh_sach_vat_pham  -> lọc loai === 'qua'
//   lay_ho_so               -> số dư mới + lichSuDoiQua (lọc loai === 'qua')
//   doi_vat_pham            -> đổi 1 quà, trả diemMoi
// PHỤ THUỘC: kc_api.js (kcGoiRpc), kc_auth.js (sự kiện kcSanSang, kcCapNhatTui).
// ================================================================

var chqTaiKhoan = null;
var chqDsQua = [];
var chqDaDoi = [];
var chqDangDoi = false;
var chqQuaDangHoi = null;

function chqEl(id) { return document.getElementById(id); }

function chqThoat(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Giống luật board.js / cuahang_NC.js: bắt đầu "http" hoặc chứa "/" là ảnh */
function chqLaAnh(s) {
  return typeof s === "string" && (s.indexOf("http") === 0 || s.indexOf("/") >= 0);
}

function chqHtmlHinh(urlHinh) {
  if (chqLaAnh(urlHinh)) return '<img src="' + chqThoat(urlHinh) + '" alt="" loading="lazy">';
  if (urlHinh) return chqThoat(urlHinh);   // emoji
  return "🎁";
}

/** Số dư đọc từ phiên chung của kc_auth.js (kcCapNhatTui ghi vào đó) */
function chqSoDu() {
  var tk = (typeof kcTaiKhoanHienTai !== "undefined" && kcTaiKhoanHienTai) || chqTaiKhoan;
  return Number(tk && tk.diemSo) || 0;
}

function chqVeSoDu(nay) {
  chqEl("chqSoKimCuong").textContent = chqSoDu();
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

// ----------------------------------------------------------------
// TẢI DỮ LIỆU
// ----------------------------------------------------------------
function chqTai() {
  var ten = chqTaiKhoan.tenDangNhap;
  Promise.all([
    kcGoiRpc("lay_danh_sach_vat_pham", {}),
    kcGoiRpc("lay_ho_so", { p_ten: ten })
  ]).then(function (kq) {
    var ds = kq[0] || {}, hs = kq[1] || {};
    chqEl("chqDangTai").style.display = "none";
    if (hs.thanhCong && hs.hoSo) {
      var tt = hs.hoSo.thongTin || {};
      if (typeof tt.diemSo === "number") kcCapNhatTui({ diemSo: tt.diemSo });  // ghi phiên chung + túi trên thanh
      chqDaDoi = (hs.hoSo.lichSuDoiQua || []).filter(function (ls) { return ls.loai === "qua"; });
    }
    chqVeSoDu(false);
    if (ds.thanhCong) {
      chqDsQua = (ds.danhSachVatPham || []).filter(function (vp) { return vp.loai === "qua"; });
    } else {
      chqDsQua = [];
      chqThongBao(ds.thongBao || "Chưa mở được cửa hàng, con thử lại nhé.", false);
    }
    chqVeLuoi();
    chqVeDaDoi();
  });
}

// ----------------------------------------------------------------
// LƯỚI QUÀ
// ----------------------------------------------------------------
function chqVeLuoi() {
  var luoi = chqEl("chqLuoi");
  luoi.innerHTML = "";
  if (!chqDsQua.length) {
    luoi.innerHTML = '<div class="chqRong" style="grid-column:1/-1;"><span class="chqRongHinh">🎀</span>' +
      'Cửa hàng đang chờ quà mới! Con cứ chăm chơi, chăm học để gom thật nhiều 💎 nhé.</div>';
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
      the.querySelector("button").addEventListener("click", function () { chqHoiDoi(vp); });
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
// ĐỔI QUÀ
// ----------------------------------------------------------------
function chqHoiDoi(vp) {
  if (chqDangDoi) return;
  chqQuaDangHoi = vp;
  chqEl("chqHopHinh").innerHTML = chqHtmlHinh(vp.urlHinh);
  chqEl("chqHopTieuDe").textContent = "Đổi \"" + (vp.ten || "Quà") + "\"?";
  chqEl("chqHopLoi").textContent = "Con dùng " + (Number(vp.giaKimCuong) || 0) + " 💎 để đổi món quà này. Bố mẹ / thầy cô sẽ trao quà tận tay con nhé!";
  chqEl("chqHopKhong").hidden = false;
  chqEl("chqHopKhong").textContent = "Để sau";
  chqEl("chqHopCo").textContent = "🎁 Đổi luôn!";
  chqEl("chqHopCo").disabled = false;
  chqEl("chqPhu").classList.add("hien");
}

function chqDongHop() {
  chqEl("chqPhu").classList.remove("hien");
  chqQuaDangHoi = null;
}

function chqBamCo() {
  var vp = chqQuaDangHoi;
  if (!vp) { chqDongHop(); return; }   // hộp đang ở dạng chúc mừng
  if (chqDangDoi) return;
  chqDangDoi = true;
  chqEl("chqHopCo").disabled = true;
  chqEl("chqHopCo").textContent = "Đang đổi...";
  kcGoiRpc("doi_vat_pham", { p_ten: chqTaiKhoan.tenDangNhap, p_vat_pham_id: vp.id }).then(function (kq) {
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
    // Hộp chuyển sang chúc mừng
    chqQuaDangHoi = null;
    chqEl("chqHopTieuDe").textContent = "🎉 Đổi quà thành công!";
    chqEl("chqHopLoi").textContent = "\"" + (vp.ten || "Quà") + "\" đang chờ được trao. Con nhớ báo bố mẹ / thầy cô nhé!";
    chqEl("chqHopKhong").hidden = true;
    chqEl("chqHopCo").disabled = false;
    chqEl("chqHopCo").textContent = "Tuyệt vời! 🥳";
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

// ----------------------------------------------------------------
// KHỞI ĐỘNG
// ----------------------------------------------------------------
document.addEventListener("DOMContentLoaded", function () {
  chqEl("chqHopKhong").addEventListener("click", chqDongHop);
  chqEl("chqHopCo").addEventListener("click", chqBamCo);
  chqEl("chqPhu").addEventListener("click", function (e) { if (e.target === this && !chqDangDoi) chqDongHop(); });
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
