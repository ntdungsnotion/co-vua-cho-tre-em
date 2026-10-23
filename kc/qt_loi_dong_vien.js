// ================================================================
// FILE: kc/qt_loi_dong_vien.js
// CHỨC NĂNG: Mục "💬 Lời động viên" của từng GAME CỜ Kids Challenge trong TRANG QUẢN TRỊ CHUNG
//   (quantri_NC.html) - hiện có Cờ Tướng (TC_03D). Cùng cách làm màn "Lời động viên" của Cờ Vua
//   (admin_NC.js): thêm câu theo tình huống, sửa / ẩn / xoá, nghe thử, gắn file MP3 dự phòng.
//   Câu lưu ở bảng RIÊNG kc_loi_dong_vien (cột tro_choi), KHÔNG đụng bảng loi_dong_vien của Cờ Vua.
//   Mỗi màn là 1 <section id="manhinh-<tên>" data-ldv-tro-choi="<mã game>">; thêm game khác chỉ cần
//   thêm section + mục thanh bên + mã tình huống trong SQL (kc_ldv_loai_hop_le).
// BƯỚC: TC_03D - NGÀY: 22/10/2026
// CẬP NHẬT: 23/10/2026 - TC_03E: thêm tình huống hoi_goi_y (câu nhắc "Con có cần gợi ý không?")
// PHỤ THUỘC: ../admin_NC.js (adminTaiKhoan, adminGoiRpc, adminBaoTin, adminXuLyLoi, adminThoat,
//   adminTaiFileLen, adminNgheThu, sự kiện "adminDaChuyenManHinh").
//   RPC (SQL repo riêng supabase_tc03d_loi_dong_vien_co_tuong.sql): kc_admin_lay_loi_dong_vien,
//   kc_admin_luu_loi_dong_vien, kc_admin_xoa_loi_dong_vien.
// ================================================================

// Tên dễ hiểu của từng mã tình huống (mã nào máy chủ cho phép thì mới hiện trong ô chọn)
var QL_TEN_TINH_HUONG = {
  chao_hoi: "Chào hỏi / bật trợ lý 🦉",
  bat_dau_van: "Bắt đầu ván mới",
  nuoc_thuong: "Bé đi nước bình thường",
  an_quan: "Bé ĂN quân của máy",
  chieu_tuong: "Bé chiếu tướng máy",
  bi_an_quan: "Bé BỊ ăn quân (động viên)",
  bi_chieu: "Bé BỊ chiếu (cảnh báo nhẹ)",
  thang_van: "Bé thắng ván",
  thua_van: "Bé thua ván",
  hoa_van: "Ván hoà",
  len_cap: "Bé lên cấp",
  hoi_goi_y: "Hỏi khi bé lâu không đi (💡 Gợi Ý)"
};
// Thứ tự hiện trong ô chọn khi máy chủ chưa trả danh sách mã
var QL_MA_MAC_DINH = Object.keys(QL_TEN_TINH_HUONG);

// Trạng thái từng màn: { troChoi, khung, ds: [...], loaiHopLe: [...], daTai }
var QL_MAN = {};

document.addEventListener("DOMContentLoaded", function () {
  if (typeof adminTaiKhoan === "undefined" || !adminTaiKhoan) return;
  var cacKhung = document.querySelectorAll("[data-ldv-tro-choi]");
  for (var i = 0; i < cacKhung.length; i++) qlGanMan(cacKhung[i]);

  document.addEventListener("adminDaChuyenManHinh", function (su) {
    var man = QL_MAN[su.detail.ten];
    if (man && !man.daTai) { man.daTai = true; qlTai(man); }
  });
  // Mở thẳng bằng địa chỉ #tên-màn: quantri_NC.js đã mở trước khi file này kịp nghe sự kiện
  Object.keys(QL_MAN).forEach(function (ten) {
    var man = QL_MAN[ten];
    if (man.khung.classList.contains("dangHien") && !man.daTai) { man.daTai = true; qlTai(man); }
  });
});

function qlEl(man, ten) { return man.khung.querySelector('[data-ldv="' + ten + '"]'); }

function qlTenLoai(ma) { return QL_TEN_TINH_HUONG[ma] ? ma + " — " + QL_TEN_TINH_HUONG[ma] : ma; }

function qlGanMan(khung) {
  var man = { troChoi: khung.getAttribute("data-ldv-tro-choi"), khung: khung, ds: [], loaiHopLe: QL_MA_MAC_DINH, daTai: false };
  QL_MAN[khung.id.replace(/^manhinh-/, "")] = man;
  qlVeOChon(man);

  qlEl(man, "lamMoi").addEventListener("click", function () { qlTai(man); });
  qlEl(man, "them").addEventListener("click", function () { qlThem(man, this); });
  qlEl(man, "locLoai").addEventListener("change", function () { qlVeBang(man); });
  qlEl(man, "ngheMoi").addEventListener("click", function () {
    adminNgheThu(qlEl(man, "noiDungMoi").value, qlEl(man, "linkMoi").value);
  });
  qlEl(man, "fileMoi").addEventListener("change", function () {
    var file = this.files[0];
    if (!file) return;
    adminBaoTin("⏳ Đang tải file âm thanh lên...", true);
    adminTaiFileLen(file, "am-thanh").then(function (url) {
      qlEl(man, "linkMoi").value = url;
      adminBaoTin("✅ Đã tải file âm thanh lên.", true);
    }).catch(function (loi) {
      adminBaoTin("❌ Không tải được file: " + loi.message, false);
    });
  });

  // Bảng: gắn sự kiện 1 lần cho cả bảng (bảng vẽ lại nhiều lần)
  qlEl(man, "bang").addEventListener("click", function (su) {
    var nut = su.target.closest("button[data-hanh-dong]");
    if (!nut) return;
    var id = parseInt(nut.getAttribute("data-id"), 10);
    var hd = nut.getAttribute("data-hanh-dong");
    if (hd === "luu") qlLuu(man, id, nut);
    if (hd === "xoa") qlXoa(man, id, nut);
    if (hd === "nghe") adminNgheThu(qlO(man, "nd", id).value, qlO(man, "link", id).value);
  });
}

function qlO(man, loai, id) { return man.khung.querySelector('[data-o="' + loai + "_" + id + '"]'); }

function qlVeOChon(man) {
  var htmlThem = "", htmlLoc = '<option value="">— Tất cả tình huống —</option>';
  man.loaiHopLe.forEach(function (ma) {
    var tuyChon = '<option value="' + adminThoat(ma) + '">' + adminThoat(qlTenLoai(ma)) + "</option>";
    htmlThem += tuyChon;
    htmlLoc += tuyChon;
  });
  var oThem = qlEl(man, "loaiMoi"), oLoc = qlEl(man, "locLoai");
  var giuThem = oThem.value, giuLoc = oLoc.value;
  oThem.innerHTML = htmlThem;
  oLoc.innerHTML = htmlLoc;
  if (giuThem) oThem.value = giuThem;
  oLoc.value = giuLoc;
}

function qlTai(man) {
  qlEl(man, "bang").innerHTML = '<tr><td colspan="6" class="adminDangTai">Đang tải...</td></tr>';
  adminGoiRpc("kc_admin_lay_loi_dong_vien", { p_tro_choi: man.troChoi }).then(function (ph) {
    if (!ph || !ph.thanhCong) {
      adminXuLyLoi(ph);
      qlEl(man, "bang").innerHTML = '<tr><td colspan="6" class="adminRong">Không tải được danh sách. ' +
        "Nếu vừa cập nhật app: nhờ chạy file SQL TC_03D trên Supabase.</td></tr>";
      return;
    }
    man.ds = ph.loiDongVien || [];
    if (Array.isArray(ph.loaiHopLe) && ph.loaiHopLe.length) {
      man.loaiHopLe = ph.loaiHopLe;
      qlVeOChon(man);
    }
    qlVeBang(man);
  });
}

function qlVeBang(man) {
  var loc = qlEl(man, "locLoai").value;
  var ds = man.ds.filter(function (c) { return !loc || c.loai === loc; });
  var than = qlEl(man, "bang");
  if (!ds.length) {
    than.innerHTML = '<tr><td colspan="6" class="adminRong">Chưa có câu nói nào cho tình huống này.</td></tr>';
    return;
  }
  than.innerHTML = ds.map(function (c) {
    return "<tr>" +
      "<td>" + c.id + "</td>" +
      '<td title="' + adminThoat(QL_TEN_TINH_HUONG[c.loai] || "") + '"><code>' + adminThoat(c.loai) + "</code></td>" +
      '<td><input type="text" maxlength="300" data-o="nd_' + c.id + '" value="' + adminThoat(c.noiDung) + '" aria-label="Nội dung câu ' + c.id + '"></td>' +
      '<td><input type="text" data-o="link_' + c.id + '" value="' + adminThoat(c.duongDanAmThanh) + '" placeholder="(không có)" aria-label="Link âm thanh câu ' + c.id + '"></td>' +
      '<td style="text-align:center;"><input type="checkbox" data-o="hien_' + c.id + '"' + (c.hienThi ? " checked" : "") + ' aria-label="Hiện câu ' + c.id + '"></td>' +
      "<td>" +
        '<button class="adminNut" data-hanh-dong="luu" data-id="' + c.id + '" type="button">💾</button> ' +
        '<button class="adminNut adminNutPhu" data-hanh-dong="nghe" data-id="' + c.id + '" type="button">▶️ Nghe</button> ' +
        '<button class="adminNut adminNutNguyHiem" data-hanh-dong="xoa" data-id="' + c.id + '" type="button">🗑️</button>' +
      "</td>" +
    "</tr>";
  }).join("");
}

function qlThem(man, nut) {
  var noiDung = qlEl(man, "noiDungMoi").value.trim();
  if (!noiDung) { adminBaoTin("❌ Vui lòng nhập nội dung câu nói.", false); return; }
  nut.disabled = true;
  adminGoiRpc("kc_admin_luu_loi_dong_vien", {
    p_id: null, p_tro_choi: man.troChoi, p_loai: qlEl(man, "loaiMoi").value,
    p_noi_dung: noiDung, p_duong_dan: qlEl(man, "linkMoi").value.trim(), p_hien_thi: true
  }).then(function (ph) {
    nut.disabled = false;
    if (!ph || !ph.thanhCong) { adminXuLyLoi(ph); return; }
    adminBaoTin("✅ Đã thêm câu nói (ID " + ph.id + "). Ván mới của bé sẽ dùng câu này.", true);
    qlEl(man, "noiDungMoi").value = "";
    qlEl(man, "linkMoi").value = "";
    qlEl(man, "fileMoi").value = "";
    qlTai(man);
  });
}

function qlLuu(man, id, nut) {
  var cu = man.ds.filter(function (c) { return c.id === id; })[0];
  if (!cu) return;
  nut.disabled = true;
  adminGoiRpc("kc_admin_luu_loi_dong_vien", {
    p_id: id, p_tro_choi: man.troChoi, p_loai: cu.loai,
    p_noi_dung: qlO(man, "nd", id).value.trim(),
    p_duong_dan: qlO(man, "link", id).value.trim(),
    p_hien_thi: qlO(man, "hien", id).checked
  }).then(function (ph) {
    nut.disabled = false;
    if (!ph || !ph.thanhCong) { adminXuLyLoi(ph); return; }
    adminBaoTin("✅ Đã lưu câu nói ID " + id + ".", true);
    qlTai(man);
  });
}

function qlXoa(man, id, nut) {
  if (!confirm("Xóa hẳn câu nói này? (Muốn tạm tắt thì bỏ tick ô \"Hiện\" rồi bấm 💾 — an toàn hơn)")) return;
  nut.disabled = true;
  adminGoiRpc("kc_admin_xoa_loi_dong_vien", { p_id: id }).then(function (ph) {
    if (!ph || !ph.thanhCong) { nut.disabled = false; adminXuLyLoi(ph); return; }
    adminBaoTin("✅ Đã xóa câu nói ID " + id + ".", true);
    qlTai(man);
  });
}
// 23/10/2026 07:40 - BƯỚC: TC_03E
