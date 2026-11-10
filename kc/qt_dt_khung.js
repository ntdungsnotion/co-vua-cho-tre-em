// ================================================================
// FILE: kc/qt_dt_khung.js
// CHỨC NĂNG: KHUNG trang cài đặt Đấu Trường Tri Thức trong trang quản trị (quantri_NC.html, TC_D18A; người dùng 10/11/2026:
//   "thiết kế trước bố cục trang cài đặt để sau này bổ sung tính năng thì chỉ gắn vào, không phải viết lại").
//   Mỗi MỤC cài đặt = một file JS riêng gọi QDT.dangKyMuc(...). Khung tự thêm nút vào thanh bên (nhóm "⚔️ Đấu Trường Tri Thức")
//   và một màn hình có sẵn vỏ (tiêu đề, mô tả, thân). Thêm tính năng mới = thêm MỘT file + MỘT dòng <script> trong
//   quantri_NC.html, không sửa file nào khác.
// CÁCH GẮN MỘT MỤC (gọi ngay khi file được nạp, TRƯỚC DOMContentLoaded):
//   QDT.dangKyMuc({
//     ma: "thongso",            // địa chỉ: quantri_NC.html#dautruong-thongso
//     ten: "Thông số", bieuTuong: "🎛️",
//     moTa: "một hai câu cho người lớn (HTML được)",
//     dung: function (than) {},       // tuỳ chọn: dựng vỏ riêng trong thân ngay lúc đăng ký
//     mo: function (than) {},         // lần ĐẦU mở mục: tải dữ liệu, gắn sự kiện
//     soChuaLuu: function () {},      // tuỳ chọn: số ô chưa lưu (hỏi lại khi rời trang)
//     sapCo: true, seCo: ["..."]      // mục ĐẶT CHỖ TRƯỚC: chỉ hiện thẻ "sắp có" + danh sách sẽ có
//   });
//   Thứ tự trên thanh bên = thứ tự đăng ký (thứ tự <script>).
// TIỆN ÍCH CHUNG: QDT.el, QDT.html, QDT.chep, QDT.giong, QDT.goi (RPC quản trị), QDT.bao (thông báo), QDT.ngay.
// BƯỚC: TC_D18A - NGÀY: 10/11/2026
// PHỤ THUỘC: nạp SAU ../admin_NC.js + quantri_NC.js, TRƯỚC các file mục (qt_dau_truong.js, qt_dt_tai_khoan.js...).
//   quantri_NC.html có sẵn 2 chỗ gắn: #qdtMenu (thanh bên) và #qdtManHinh (trong <main>).
// ================================================================

var QDT = {
  TIEN_TO: "dautruong-",
  muc: [],

  el: function (id) { return document.getElementById(id); },
  html: function (s) {
    return String(s === null || s === undefined ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  },
  chep: function (v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); },
  giong: function (a, b) { return JSON.stringify(a) === JSON.stringify(b); },
  goi: function (ham, ts) { return adminGoiRpc(ham, ts || {}); },
  bao: function (chu, tot) { adminBaoTin(chu, !!tot); },
  ngay: function (iso) { return typeof adminDinhDangGio === "function" ? adminDinhDangGio(iso) : String(iso || ""); },

  dangKyMuc: function (m) {
    var menu = QDT.el("qdtMenu"), cho = QDT.el("qdtManHinh");
    if (!menu || !cho || !m || !m.ma) return;
    m.man = QDT.TIEN_TO + m.ma;
    QDT.muc.push(m);

    var nut = document.createElement("button");
    nut.type = "button";
    nut.className = "adminNutManHinh qtMuc";
    nut.setAttribute("data-manhinh", m.man);
    nut.appendChild(document.createTextNode((m.bieuTuong ? m.bieuTuong + " " : "") + m.ten + " "));
    if (m.sapCo) { var nhan = document.createElement("span"); nhan.className = "qtSapCo"; nhan.textContent = "sắp có"; nut.appendChild(nhan); }
    menu.appendChild(nut);

    var man = document.createElement("section");
    man.className = "adminManHinh";
    man.id = "manhinh-" + m.man;
    man.innerHTML = '<div class="adminKhoi qdKhoi"><h3>' + QDT.html((m.bieuTuong ? m.bieuTuong + " " : "") + (m.tieuDe || m.ten)) + "</h3>"
      + (m.moTa ? '<p class="adminGhiChu">' + m.moTa + "</p>" : "") + '<div class="qdtThan"></div></div>';
    cho.appendChild(man);
    m.than = man.querySelector(".qdtThan");

    if (m.sapCo) {
      m.than.innerHTML = '<div class="qtSapCoKhoi"><div class="qtHinhLon">' + QDT.html(m.bieuTuong || "🧩") + "</div><p><strong>Sắp có.</strong> Chỗ này đã đặt trước cho:</p>"
        + '<ul class="qdtSeCo">' + (m.seCo || []).map(function (s) { return "<li>" + QDT.html(s) + "</li>"; }).join("") + "</ul></div>";
    } else if (typeof m.dung === "function") {
      m.dung(m.than);
    }
  },

  _mo: function (m) {
    if (m.daMo || m.sapCo) return;
    m.daMo = true;
    if (typeof m.mo === "function") m.mo(m.than);
  }
};

document.addEventListener("DOMContentLoaded", function () {
  if (typeof adminTaiKhoan === "undefined" || !adminTaiKhoan) return;
  document.addEventListener("adminDaChuyenManHinh", function (su) {
    QDT.muc.forEach(function (m) { if (m.man === su.detail.ten) QDT._mo(m); });
  });
  // Mở thẳng bằng địa chỉ #dautruong-...: quantri_NC.js đã mở màn hình trước khi file này kịp nghe sự kiện
  QDT.muc.forEach(function (m) {
    var man = QDT.el("manhinh-" + m.man);
    if (man && man.classList.contains("dangHien")) QDT._mo(m);
  });
  window.addEventListener("beforeunload", function (su) {
    var so = 0;
    QDT.muc.forEach(function (m) { if (m.daMo && typeof m.soChuaLuu === "function") so += m.soChuaLuu(); });
    if (so > 0) { su.preventDefault(); su.returnValue = ""; }
  });
});
