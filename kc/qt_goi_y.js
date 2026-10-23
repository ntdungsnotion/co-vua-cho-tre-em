// ================================================================
// FILE: kc/qt_goi_y.js
// CHỨC NĂNG: Mục "💡 Gợi ý" của từng GAME CỜ Kids Challenge trong TRANG QUẢN TRỊ CHUNG
//   (quantri_NC.html) - hiện có Cờ Tướng (TC_03E). Bảng theo CẤP của bé: số lần gợi ý mỗi ván
//   (để trống = không giới hạn, 0 = không cho gợi ý) + kim cương trừ mỗi lần. Giống cột
//   goiYGioiHan / goiYChiPhi trong bảng cấp của Cờ Vua, nhưng lưu ở bảng RIÊNG kc_goi_y_cap
//   (cột tro_choi), KHÔNG đụng cau_hinh_cap_do của Cờ Vua.
//   Mỗi màn là 1 <section id="manhinh-<tên>" data-goi-y-tro-choi="<mã game>">.
// BƯỚC: TC_03E - NGÀY: 23/10/2026
// PHỤ THUỘC: ../admin_NC.js (adminTaiKhoan, adminGoiRpc, adminBaoTin, adminXuLyLoi,
//   sự kiện "adminDaChuyenManHinh").
//   RPC (SQL repo riêng supabase_tc03e_goi_y_co_tuong.sql): kc_admin_lay_goi_y_cap, kc_admin_luu_goi_y_cap.
// ================================================================

// Trạng thái từng màn: { troChoi, khung, bang: [{cap, gioiHan, chiPhi}], daTai }
var QG_MAN = {};

document.addEventListener("DOMContentLoaded", function () {
  if (typeof adminTaiKhoan === "undefined" || !adminTaiKhoan) return;
  var cacKhung = document.querySelectorAll("[data-goi-y-tro-choi]");
  for (var i = 0; i < cacKhung.length; i++) qgGanMan(cacKhung[i]);

  document.addEventListener("adminDaChuyenManHinh", function (su) {
    var man = QG_MAN[su.detail.ten];
    if (man && !man.daTai) { man.daTai = true; qgTai(man); }
  });
  // Mở thẳng bằng địa chỉ #tên-màn: quantri_NC.js đã mở trước khi file này kịp nghe sự kiện
  Object.keys(QG_MAN).forEach(function (ten) {
    var man = QG_MAN[ten];
    if (man.khung.classList.contains("dangHien") && !man.daTai) { man.daTai = true; qgTai(man); }
  });
});

function qgEl(man, ten) { return man.khung.querySelector('[data-goi-y="' + ten + '"]'); }

function qgGanMan(khung) {
  var man = { troChoi: khung.getAttribute("data-goi-y-tro-choi"), khung: khung, bang: [], daTai: false };
  QG_MAN[khung.id.replace(/^manhinh-/, "")] = man;
  qgEl(man, "lamMoi").addEventListener("click", function () { qgTai(man); });
  qgEl(man, "luu").addEventListener("click", function () { qgLuu(man, this); });
}

function qgTai(man) {
  qgEl(man, "bang").innerHTML = '<tr><td colspan="3" class="adminDangTai">Đang tải...</td></tr>';
  adminGoiRpc("kc_admin_lay_goi_y_cap", { p_tro_choi: man.troChoi }).then(function (ph) {
    if (!ph || !ph.thanhCong) {
      adminXuLyLoi(ph);
      qgEl(man, "bang").innerHTML = '<tr><td colspan="3" class="adminRong">Không tải được bảng. ' +
        "Nếu vừa cập nhật app: nhờ chạy file SQL TC_03E trên Supabase.</td></tr>";
      return;
    }
    man.bang = ph.bang || [];
    qgVeBang(man);
  });
}

function qgVeBang(man) {
  var than = qgEl(man, "bang");
  if (!man.bang.length) { than.innerHTML = '<tr><td colspan="3" class="adminRong">Chưa có cấp nào.</td></tr>'; return; }
  var html = "";
  man.bang.forEach(function (d) {
    var gh = (d.gioiHan === null || d.gioiHan === undefined) ? "" : d.gioiHan;
    html += "<tr>" +
      "<td><strong>Cấp " + d.cap + "</strong></td>" +
      '<td><input type="number" min="0" max="99" step="1" data-cap-gh="' + d.cap + '" value="' + gh + '" placeholder="không giới hạn" style="width:100%; max-width:160px; min-width:64px; box-sizing:border-box;"></td>' +
      '<td><input type="number" min="0" max="999" step="1" data-cap-cp="' + d.cap + '" value="' + (d.chiPhi || 0) + '" style="width:100%; max-width:90px; min-width:56px; box-sizing:border-box;"></td>' +
      "</tr>";
  });
  than.innerHTML = html;
}

function qgLuu(man, nut) {
  var bang = [], loi = "";
  man.bang.forEach(function (d) {
    if (loi) return;
    var oGh = man.khung.querySelector('[data-cap-gh="' + d.cap + '"]');
    var oCp = man.khung.querySelector('[data-cap-cp="' + d.cap + '"]');
    var gh = oGh.value.trim(), cp = oCp.value.trim();
    if (gh !== "" && !/^\d{1,2}$/.test(gh)) { loi = "Cấp " + d.cap + ": số lần mỗi ván để trống (không giới hạn) hoặc từ 0 đến 99."; return; }
    if (!/^\d{1,3}$/.test(cp)) { loi = "Cấp " + d.cap + ": kim cương mỗi lần phải từ 0 đến 999."; return; }
    bang.push({ cap: d.cap, gioiHan: gh === "" ? null : parseInt(gh, 10), chiPhi: parseInt(cp, 10) });
  });
  if (loi) { adminBaoTin("❌ " + loi, false); return; }
  if (!bang.length) return;
  nut.disabled = true;
  adminGoiRpc("kc_admin_luu_goi_y_cap", { p_tro_choi: man.troChoi, p_bang: bang }).then(function (ph) {
    nut.disabled = false;
    if (!ph || !ph.thanhCong) { adminXuLyLoi(ph); return; }
    adminBaoTin("✅ Đã lưu bảng gợi ý (" + ph.soDong + " cấp). Bé dùng số mới từ lần bấm Gợi Ý kế tiếp.", true);
    qgTai(man);
  });
}
// 23/10/2026 07:40 - BƯỚC: TC_03E
