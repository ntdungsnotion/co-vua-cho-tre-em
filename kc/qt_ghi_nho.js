// ================================================================
// FILE: kc/qt_ghi_nho.js
// CHỨC NĂNG: Tiểu mục "📒 Sổ ghi nhớ" trong Quản trị chung › 👦 Hồ sơ các bé › hồ sơ chi tiết từng bé - KC_03A.
//   Sổ Ghi Nhớ là kết quả CHUNG của mọi trò chơi / học tập / khám phá / thử thách (bảng kc_ghi_nho_be), nên đặt ở
//   hồ sơ chung của bé, không nằm trong một game. Xem dạng bảng: tóm tắt theo loại (đã thuộc, đang học, tới hạn ôn),
//   lượt trả lời 7 ngày, các từ bé hay sai, các từ mới thuộc. Chỉ xem (không sửa).
//   Đọc bằng RPC kc_ghi_nho_admin_xem (kiểm quyền admin ở máy chủ).
//   Cách gắn: bọc hàm adminMoHoSoTre (admin_NC.js) để mỗi lần mở hồ sơ một bé thì tải sổ của bé đó vào #htGhiNho.
// BƯỚC: KC_03A - NGÀY: 11/11/2026
// CẬP NHẬT: 11/11/2026 - KC_03A (người dùng thử): chuyển từ ⚔️ Đấu Trường › 👤 Tài khoản sang 👦 Hồ sơ các bé, dạng bảng.
// PHỤ THUỘC: ../admin_NC.js nạp TRƯỚC (adminMoHoSoTre, adminGoiRpc, adminThoat, adminDinhDangGio); quantri_NC.html có
//   nút tiểu mục data-tieumuc="ghinho" + khung #htGhiNho.
// ================================================================
(function () {
  if (typeof adminMoHoSoTre !== "function" || typeof adminGoiRpc !== "function") return;
  var TEN_LOAI = { tu: "📖 Từ vựng tiếng Anh", the: "🃏 Thẻ nhớ", cau: "❓ Câu hỏi" };
  var lanGoi = 0;

  function bang(tieuDe, cot, dong, rong) {
    return '<div class="adminCuonNgang"><table class="adminBang"><thead><tr>' + cot.map(function (c) { return "<th>" + c + "</th>"; }).join("")
      + "</tr></thead><tbody>" + (dong.length ? dong.join("")
        : '<tr><td colspan="' + cot.length + '" class="adminRong">' + rong + "</td></tr>") + "</tbody></table></div>";
  }
  function tenMuc(x) { return adminThoat(x.ma) + (x.manh ? " <small>· " + adminThoat(x.manh) + "</small>" : ""); }

  function veKetQua(o, kq) {
    var tt = kq.tomTat || [], l7 = kq.luot7 || { so: 0, dung: 0 };
    if (!tt.length) {
      o.innerHTML = '<p class="adminGhiChu">Bé chưa có gì trong Sổ Ghi Nhớ (chưa chơi trò nào ghi sổ từ khi có sổ chung, 11/11/2026).</p>';
      return;
    }
    var html = '<h4 style="margin:4px 0;">Tóm tắt</h4>'
      + bang("", ["Loại", "✅ Đã thuộc", "📚 Đang học", "⏰ Tới hạn ôn"], tt.map(function (t) {
        return "<tr><td><strong>" + adminThoat(TEN_LOAI[t.loai] || t.loai) + "</strong></td><td>" + (t.daThuoc | 0) + "</td><td>"
          + (t.dangHoc | 0) + "</td><td>" + (t.denHan | 0) + "</td></tr>";
      }), "")
      + bang("", ["Lượt trả lời 7 ngày qua", "% đúng", "Lần học gần nhất"], ["<tr><td>" + (l7.so | 0) + "</td><td>"
        + (l7.so ? Math.round(100 * l7.dung / l7.so) + "%" : "—") + "</td><td>" + adminDinhDangGio(kq.lanCuoi) + "</td></tr>"], "");
    html += '<h4 style="margin:14px 0 4px;">❗ Hay sai (chưa thuộc, sai nhiều nhất)</h4>'
      + bang("", ["Từ / nội dung", "Loại", "✗ Sai", "✓ Đúng", "Đúng liên tiếp"], (kq.haySai || []).map(function (x) {
        return "<tr><td>" + tenMuc(x) + "</td><td>" + adminThoat(TEN_LOAI[x.loai] || x.loai) + "</td><td>" + (x.soSai | 0) + "</td><td>"
          + (x.soDung | 0) + "</td><td>" + (x.chuoi | 0) + "</td></tr>";
      }), "Không có từ nào bé hay sai. 👏");
    html += '<h4 style="margin:14px 0 4px;">🌟 Mới thuộc (gần đây nhất)</h4>'
      + bang("", ["Từ / nội dung", "Loại", "Thuộc lúc"], (kq.moiThuoc || []).map(function (x) {
        return "<tr><td>" + tenMuc(x) + "</td><td>" + adminThoat(TEN_LOAI[x.loai] || x.loai) + "</td><td>" + adminDinhDangGio(x.luc) + "</td></tr>";
      }), "Chưa thuộc từ nào.");
    html += '<p class="adminGhiChu">Thuộc = trả lời đúng ngay lần đầu 3 lần liên tiếp; sai một lần thì học lại. '
      + "Sổ đi theo tài khoản, gom kết quả của mọi trò chơi ghi sổ (hiện có Giải Cứu Mèo Con), chơi máy nào cũng chung một sổ.</p>";
    o.innerHTML = html;
  }

  function tai(ten) {
    var o = document.getElementById("htGhiNho"), so = ++lanGoi;
    if (!o) return;
    o.innerHTML = '<p class="adminDangTai">Đang tải Sổ Ghi Nhớ...</p>';
    adminGoiRpc("kc_ghi_nho_admin_xem", { p_ten: ten }).then(function (kq) {
      if (so !== lanGoi) return;
      if (!kq || !kq.thanhCong) {
        o.innerHTML = '<p class="adminGhiChu">❌ Chưa đọc được Sổ Ghi Nhớ: ' + adminThoat((kq && kq.thongBao) || "máy chủ chưa có (cần chạy SQL KC_03A)") + "</p>";
        return;
      }
      veKetQua(o, kq);
    }, function () { if (so === lanGoi) o.innerHTML = '<p class="adminGhiChu">❌ Không kết nối được máy chủ.</p>'; });
  }

  var moCu = adminMoHoSoTre;
  window.adminMoHoSoTre = function (ten) {
    var kq = moCu.apply(this, arguments);
    tai(ten);
    return kq;
  };
})();
