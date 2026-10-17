// ================================================================
// FILE: quantri_NC.js
// CHỨC NĂNG: Khung TRANG QUẢN TRỊ CHUNG (quantri_NC.html, HƯỚNG DẪN 3.13):
//   - menu thanh bên trên điện thoại (nút ☰ mở, bấm nền mờ / ✕ / chọn mục thì đóng);
//   - dòng "Nhóm › Mục" cho biết đang ở đâu;
//   - ghi #tên-màn-hình lên địa chỉ: tải lại trang vẫn ở đúng mục, gửi link được;
//   - màn hình Tổng quan: số quà chờ trao, ý tưởng mới, số tài khoản.
// BƯỚC: KC_00D-1 - NGÀY: 17/10/2026
// PHỤ THUỘC: ../admin_NC.js nạp TRƯỚC (adminTaiKhoan, adminGoiRpc, apiGoiRpc,
//   adminChuyenManHinh, sự kiện "adminDaChuyenManHinh"). File này KHÔNG xác thực
//   lại: admin_NC.js đã chặn người không phải admin (adminTaiKhoan = null).
// ================================================================

document.addEventListener("DOMContentLoaded", function () {
  // admin_NC.js chạy DOMContentLoaded trước (nạp trước) -> đã biết có quyền hay không
  if (!adminTaiKhoan) return;
  document.body.classList.add("qtCoQuyen");

  qtGanMenu();
  qtGanTongQuan();
  document.addEventListener("adminDaChuyenManHinh", qtSauKhiChuyenManHinh);

  // Màn hình đầu (Tổng quan) đã mở trước khi file này kịp nghe sự kiện
  qtCapNhatDuongDan("tongquan");
  qtTaiTongQuan();

  // Có #tên-màn-hình trên địa chỉ (tải lại trang, link gửi nhau) -> mở mục đó
  qtMoTheoDiaChi();
  window.addEventListener("hashchange", qtMoTheoDiaChi);
});

// ================================================================
// PHẦN 1: MENU THANH BÊN (điện thoại)
// ================================================================

function qtGanMenu() {
  document.getElementById("qtNutMenu").addEventListener("click", function () { qtDatMenu(true); });
  document.getElementById("qtNutDong").addEventListener("click", function () { qtDatMenu(false); });
  document.getElementById("qtNenMo").addEventListener("click", function () { qtDatMenu(false); });
  document.addEventListener("keydown", function (su) {
    if (su.key === "Escape") qtDatMenu(false);
  });
}

function qtDatMenu(mo) {
  document.getElementById("qtThanhBen").classList.toggle("mo", mo);
  document.getElementById("qtNenMo").classList.toggle("hien", mo);
  document.getElementById("qtNutMenu").setAttribute("aria-expanded", mo ? "true" : "false");
}

// ================================================================
// PHẦN 2: SAU MỖI LẦN CHUYỂN MÀN HÌNH
// ================================================================

function qtSauKhiChuyenManHinh(su) {
  var ten = su.detail.ten;
  qtDatMenu(false);
  qtCapNhatDuongDan(ten);
  if (window.location.hash !== "#" + ten) {
    history.replaceState(null, "", "#" + ten);
  }
  window.scrollTo(0, 0);
  // Tổng quan luôn lấy số mới mỗi lần mở (admin_NC.js chỉ tải lần đầu)
  if (ten === "tongquan") qtTaiTongQuan();
}

/** Dòng "Nhóm › Mục" lấy từ chính thanh bên (thêm mục mới không phải sửa file này) */
function qtCapNhatDuongDan(ten) {
  var nut = document.querySelector('.adminNutManHinh[data-manhinh="' + ten + '"]');
  if (!nut) return;
  var tenMuc = nut.childNodes[0].textContent.trim();   // bỏ nhãn "sắp có"
  var khoiNhom = nut.closest("[data-ten-nhom]");
  var tenNhom = khoiNhom ? khoiNhom.getAttribute("data-ten-nhom") : "Quản trị chung";
  var o = document.getElementById("qtDuongDan");
  o.textContent = tenNhom + " › ";
  var dam = document.createElement("strong");
  dam.textContent = tenMuc;
  o.appendChild(dam);
}

function qtMoTheoDiaChi() {
  var ten = decodeURIComponent(window.location.hash.replace(/^#/, ""));
  if (!ten) return;
  qtMoManHinh(ten);
}

/** Mở 1 màn hình theo tên (dùng đúng đường của admin_NC.js) */
function qtMoManHinh(ten) {
  var nut = document.querySelector('.adminNutManHinh[data-manhinh="' + ten + '"]');
  if (!nut || nut.classList.contains("dangChon")) return;
  adminChuyenManHinh(ten, nut);
}

// ================================================================
// PHẦN 3: TỔNG QUAN
// ================================================================

function qtGanTongQuan() {
  var cacThe = document.querySelectorAll("#manhinh-tongquan [data-den]");
  for (var i = 0; i < cacThe.length; i++) {
    cacThe[i].addEventListener("click", function () {
      qtMoManHinh(this.getAttribute("data-den"));
    });
  }
  document.getElementById("tqLamMoi").addEventListener("click", qtTaiTongQuan);
}

/** Ghi 1 con số lên thẻ; canLam = tô vàng khi còn việc cần làm (số > 0) */
function qtGhiSo(idSo, so, idThe) {
  document.getElementById(idSo).textContent = (so === null) ? "?" : String(so);
  if (idThe) document.getElementById(idThe).classList.toggle("canLam", so !== null && so > 0);
}

function qtTaiTongQuan() {
  ["tqQuaChoTrao", "tqYTuongMoi", "tqSoTaiKhoan"].forEach(function (id) {
    document.getElementById(id).textContent = "…";
  });

  // Dùng lại đúng các RPC màn hình cũ đang gọi (không cần SQL mới)
  adminGoiRpc("admin_lay_lich_su", {}).then(function (ph) {
    if (!ph || !ph.thanhCong) { qtGhiSo("tqQuaChoTrao", null, "tqTheQua"); return; }
    var so = (ph.lichSu || []).filter(function (ls) { return ls.trangThai === "cho_trao"; }).length;
    qtGhiSo("tqQuaChoTrao", so, "tqTheQua");
  });

  adminGoiRpc("admin_lay_y_tuong", {}).then(function (ph) {
    if (!ph || !ph.thanhCong) { qtGhiSo("tqYTuongMoi", null, "tqTheYTuong"); return; }
    var so = (ph.danhSachYTuong || []).filter(function (yt) { return yt.trangThai === "moi"; }).length;
    qtGhiSo("tqYTuongMoi", so, "tqTheYTuong");
  });

  apiGoiRpc("lay_xep_hang", {}).then(function (ph) {
    if (!ph || !ph.thanhCong) { qtGhiSo("tqSoTaiKhoan", null); return; }
    qtGhiSo("tqSoTaiKhoan", (ph.danhSachXepHang || []).length);
  });
}
