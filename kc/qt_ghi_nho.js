// ================================================================
// FILE: kc/qt_ghi_nho.js
// CHỨC NĂNG: Khối "📒 Ghi nhớ" trong Quản trị › ⚔️ Đấu Trường Tri Thức › 👤 Tài khoản (từng bé) - KC_03A.
//   Xem Sổ Ghi Nhớ chung của bé (bảng kc_ghi_nho_be): bao nhiêu từ / thẻ đã thuộc, đang học, tới hạn ôn;
//   các từ bé hay sai (chưa thuộc); các từ mới thuộc gần đây; số lượt trả lời 7 ngày qua.
//   Chỉ xem (không sửa). Đọc bằng RPC kc_ghi_nho_admin_xem (kiểm quyền admin ở máy chủ).
//   Khối gắn vào khung qt_dt_tai_khoan.js (QTK.dangKyKhoi), đứng trước các khối "sắp có".
// BƯỚC: KC_03A - NGÀY: 11/11/2026
// PHỤ THUỘC: qt_dt_khung.js (QDT), qt_dt_tai_khoan.js (QTK) nạp TRƯỚC file này; qt_dau_truong.css.
// ================================================================
(function () {
  if (typeof QTK === "undefined" || typeof QDT === "undefined") return;
  var TEN_LOAI = { tu: "📖 Từ vựng tiếng Anh", the: "🃏 Thẻ nhớ", cau: "❓ Câu hỏi" };
  var lanGoi = 0;

  function veKetQua(o, kq) {
    var tt = kq.tomTat || [];
    if (!tt.length) {
      o.innerHTML = '<p class="adminGhiChu">Bé chưa có gì trong Sổ Ghi Nhớ (chưa chơi Giải Cứu Mèo Con từ khi có sổ chung).</p>';
      return;
    }
    var html = tt.map(function (t) {
      return '<div class="qtkO"><span class="qtkTen"><strong>' + QDT.html(TEN_LOAI[t.loai] || t.loai) + '</strong></span><span class="qtkGt">'
        + "✅ thuộc " + QDT.html(t.daThuoc) + " · 📚 đang học " + QDT.html(t.dangHoc)
        + (t.denHan ? " · ⏰ tới hạn ôn " + QDT.html(t.denHan) : "") + "</span></div>";
    }).join("");
    var l7 = kq.luot7 || { so: 0, dung: 0 };
    html += QTK.dong("Lượt trả lời 7 ngày qua", QDT.html(l7.so) + (l7.so ? " (đúng " + Math.round(100 * l7.dung / l7.so) + "%)" : ""));
    if (kq.lanCuoi) html += QTK.dong("Lần học gần nhất", QDT.html(QDT.ngay(kq.lanCuoi)));
    var chip = function (x, them) {
      return "<li>" + QDT.html(x.ma + (x.manh ? " · " + x.manh : "")) + (them ? " " + them : "") + "</li>";
    };
    html += '<p class="qtkNho"><strong>Hay sai</strong> (chưa thuộc, sai nhiều nhất):</p>'
      + ((kq.haySai || []).length ? '<ul class="qtkThe">' + kq.haySai.map(function (x) {
        return chip(x, '<small>✗' + QDT.html(x.soSai) + " ✓" + QDT.html(x.soDung) + "</small>");
      }).join("") + "</ul>" : '<p class="qtkNho">Không có từ nào bé hay sai. 👏</p>');
    html += '<p class="qtkNho"><strong>Mới thuộc</strong> (gần đây nhất):</p>'
      + ((kq.moiThuoc || []).length ? '<ul class="qtkThe">' + kq.moiThuoc.map(function (x) { return chip(x, ""); }).join("") + "</ul>"
        : '<p class="qtkNho">Chưa thuộc từ nào.</p>');
    html += '<p class="qtkNho">Thuộc = trả lời đúng ngay lần đầu 3 lần liên tiếp; sai một lần thì học lại. Tiến độ đi theo tài khoản, chơi máy nào cũng chung một sổ.</p>';
    o.innerHTML = html;
  }

  function tai(ten, so) {
    QDT.goi("kc_ghi_nho_admin_xem", { p_ten: ten }).then(function (kq) {
      var o = document.getElementById("qtkGhiNho");
      if (!o || so !== lanGoi) return;
      if (!kq || !kq.thanhCong) {
        o.innerHTML = '<p class="adminGhiChu">❌ Chưa đọc được Sổ Ghi Nhớ: ' + QDT.html((kq && kq.thongBao) || "máy chủ chưa có (cần chạy SQL KC_03A)") + "</p>";
        return;
      }
      veKetQua(o, kq);
    });
  }

  var khoi = {
    ma: "ghinho", ten: "Ghi nhớ", bieuTuong: "📒", rong: true,
    ve: function (tk) {
      var so = ++lanGoi, ten = tk && tk.ten;
      if (ten) setTimeout(function () { tai(ten, so); }, 0);
      return '<div id="qtkGhiNho"><p class="adminDangTai">Đang tải Sổ Ghi Nhớ...</p></div>';
    }
  };
  // Đứng trước các khối "sắp có" (tướng, lính)
  var i = 0;
  while (i < QTK.khoi.length && !QTK.khoi[i].sapCo) i++;
  QTK.khoi.splice(i, 0, khoi);
})();
