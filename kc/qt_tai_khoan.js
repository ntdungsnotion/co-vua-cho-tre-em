// ================================================================
// FILE: kc/qt_tai_khoan.js
// CHỨC NĂNG: Quản trị › 👥 Tài khoản (Thiet_Ke_Tai_Khoan.md mục 5, repo riêng):
//   - Danh sách mọi tài khoản (bé, phụ huynh, quản trị): tìm theo tên đăng nhập / tên hiển thị, lọc vai + trạng thái,
//     đếm, cảnh báo tên trùng hoa thường, phân trang ở máy chủ (RPC kc_tk_admin_ds).
//   - Bấm một tài khoản: khối tài khoản (kc_tk_admin_xem: vai, phiên, liên kết, ghi chú) + với bé thì hồ sơ chi tiết
//     cũ (#khoiChiTietTre của admin_NC.js, dùng lại mã, chuyển vào đây) + khu thao tác cuối hồ sơ (sửa tên hiển thị,
//     ghi chú quản trị: kc_tk_admin_sua) + 📜 nhật ký của tài khoản (kc_tk_admin_nhat_ky).
//   - Nhật ký mọi tài khoản ở cuối màn.
//   - Bọc adminMoHoSoTre: nơi khác (vd 👥 Người sở hữu ở Cửa hàng) mở hồ sơ bé thì sang màn này.
//   - Khóa cấu hình kc_tk_* vào nhóm "taikhoan" (bảng chung với 🔐 Phiên đăng nhập, qt_phien.js).
// PHỤ THUỘC: ../admin_NC.js (adminGoiRpc, adminThoat, adminDinhDangGio, adminLaDuongDanAnh, adminLaThieuHamSql,
//   adminDemChoTrao, adminXuLyLoi, adminMoHoSoTre, ADMIN_KHOA_LINH_VUC), quantri_NC.js (qtMoManHinh) nạp trước;
//   qt_ghi_nho.js nạp SAU (bọc tiếp adminMoHoSoTre, vẫn chạy đúng).
// SQL: repo riêng SQL/supabase_kc00d2_c1_tai_khoan.sql.
// BƯỚC: KC_00D2-C1 · NGÀY: 28/11/2026
// ================================================================
(function () {
  if (typeof adminGoiRpc !== "function" || !document.getElementById("tkKhung")) return;

  // Địa chỉ cũ #hosotre (dấu trang) -> màn Tài khoản
  if (window.location.hash === "#hosotre") history.replaceState(null, "", "#taikhoan");

  if (typeof ADMIN_KHOA_LINH_VUC !== "undefined") {
    ["kc_tk_so_dong", "kc_tk_ten_hien_thi_toi_da", "kc_tk_ghi_chu_toi_da"].forEach(function (k) { ADMIN_KHOA_LINH_VUC[k] = "taikhoan"; });
  }

  var $ = function (id) { return document.getElementById(id); };
  var T = adminThoat;
  var TEN_VAI = { tre: "👦 Bé", phu_huynh: "👪 Phụ huynh", admin: "🛠️ Quản trị" };
  var TEN_PHIEN = { con: "🟢 Còn phiên", khong: "⚪ Không còn phiên", chua_tung: "✨ Chưa từng đăng nhập" };
  var LY_DO_PHIEN = { may_khac: "đăng nhập máy khác", doi_mk: "đổi mật khẩu", doi_vai: "đổi vai", khoa: "bị khóa",
    dang_xuat: "đăng xuất", het_han: "hết hạn" };
  var TEN_VIEC = { sua_ten_hien_thi: "✏️ Sửa tên hiển thị", sua_ghi_chu: "📝 Sửa ghi chú" };
  var TIN_CAN_SQL = "⚠️ Cần chạy SQL <strong>supabase_kc00d2_c1_tai_khoan.sql</strong> (repo riêng, thư mục SQL) trên Supabase để dùng màn này.";

  var trangThai = { tim: "", vai: "", loc: "", trang: 1 };
  var dsHienTai = [], choTrao = {}, dangXem = null, luotTai = 0, luotXem = 0, nkTrang = 1;
  var gioiHan = { tenHienThi: 30, ghiChu: 500 };

  // ---------- tiện ích ----------
  function avatar(av) {
    return '<span class="tkAv">' + (adminLaDuongDanAnh(av || "") ? '<img src="' + T(av) + '" alt="">' : (av ? T(av) : "🙂")) + "</span>";
  }
  function luc(chuoi) {
    if (!chuoi) return "—";
    var giay = (Date.now() - Date.parse(chuoi)) / 1000;
    if (!(giay >= 0)) return adminDinhDangGio(chuoi);
    if (giay < 60) return "vừa xong";
    if (giay < 3600) return Math.floor(giay / 60) + " phút trước";
    if (giay < 86400) return Math.floor(giay / 3600) + " giờ trước";
    if (giay < 2 * 86400) return "hôm qua";
    if (giay < 30 * 86400) return Math.floor(giay / 86400) + " ngày trước";
    return adminDinhDangGio(chuoi);
  }
  function tenChinh(t) { return t.tenHienThi || t.tenDangNhap; }
  function bao(id, chu, xau) { var o = $(id); o.textContent = chu || ""; o.classList.toggle("xau", !!xau); }

  // ---------- danh sách ----------
  function taiDanhSach() {
    var luot = ++luotTai;
    $("tkDs").innerHTML = '<p class="adminDangTai">Đang tải...</p>';
    Promise.all([
      adminGoiRpc("kc_tk_admin_ds", { p_tim: trangThai.tim || null, p_vai: trangThai.vai || null,
        p_loc: trangThai.loc || null, p_trang: trangThai.trang }),
      trangThai.trang === 1 ? adminGoiRpc("admin_lay_lich_su", {}) : Promise.resolve(null)
    ]).then(function (kq) {
      if (luot !== luotTai) return;
      var ph = kq[0];
      if (kq[1]) choTrao = adminDemChoTrao(kq[1]);
      $("tkCanSql").hidden = true;
      if (!ph || !ph.thanhCong) {
        if (adminLaThieuHamSql(ph)) { $("tkCanSql").innerHTML = TIN_CAN_SQL; $("tkCanSql").hidden = false; }
        else adminXuLyLoi(ph);
        $("tkDs").innerHTML = '<p class="adminRong">Không tải được danh sách.</p>';
        $("tkDem").textContent = ""; $("tkTrang").innerHTML = "";
        return;
      }
      var d = ph.dem || {};
      $("tkDem").textContent = (d.tong || 0) + " tài khoản · " + (d.tre || 0) + " bé · " + (d.phuHuynh || 0) + " phụ huynh · " + (d.admin || 0) + " quản trị";
      var trung = ph.trungHoaThuong || [];
      $("tkTrung").hidden = !trung.length;
      $("tkTrung").innerHTML = trung.length ? "⚠️ <b>Tên trùng nhau khi không kể chữ hoa / thường</b> (cần xử lý): " +
        trung.map(function (nhom) { return nhom.map(T).join(" = "); }).join(" · ") : "";
      dsHienTai = ph.danhSach || [];
      veDanhSach();
      var soTrang = Math.max(1, Math.ceil((ph.soKetQua || 0) / (ph.soDong || 30)));
      $("tkTrang").innerHTML = soTrang <= 1 ? (ph.soKetQua ? '<span class="adminGhiChu">' + ph.soKetQua + " kết quả</span>" : "") :
        '<button class="adminNut adminNutPhu" data-trang="-1" type="button"' + (trangThai.trang <= 1 ? " disabled" : "") + ">‹ Trước</button>" +
        '<span class="adminGhiChu">Trang ' + trangThai.trang + " / " + soTrang + " · " + ph.soKetQua + " kết quả</span>" +
        '<button class="adminNut adminNutPhu" data-trang="1" type="button"' + (trangThai.trang >= soTrang ? " disabled" : "") + ">Sau ›</button>";
    });
  }

  function veDanhSach() {
    if (!dsHienTai.length) {
      $("tkDs").innerHTML = '<p class="adminRong">' + (trangThai.tim || trangThai.vai || trangThai.loc ? "Không có tài khoản nào khớp." : "Chưa có tài khoản nào.") + "</p>";
      return;
    }
    $("tkDs").innerHTML = dsHienTai.map(function (t) {
      var phu = "@" + T(t.tenDangNhap) + " · " + (TEN_VAI[t.vaiTro] || T(t.vaiTro));
      if (t.vaiTro !== "admin") phu += " · 🔗 " + (t.soLienKet || 0);
      var qua = (t.soQuaChuaNhan || 0) + (choTrao[t.tenDangNhap] || 0);
      return '<button class="tkDong' + (t.tenDangNhap === dangXem ? " chon" : "") + '" role="listitem" type="button" data-ten="' + T(t.tenDangNhap) +
        '" data-vai="' + T(t.vaiTro) + '">' + avatar(t.avatarDaChon) +
        '<span class="tkTen"><b>' + T(tenChinh(t)) + "</b><small>" + phu + "</small></span>" +
        '<span class="tkPhai"><b>' + (TEN_PHIEN[t.phien] || "").split(" ")[0] + " " + luc(t.hoatDongCuoi) + "</b>" +
        (t.vaiTro === "tre" ? (t.diemSo || 0) + " 💎" : "") + (qua ? ' <span class="tkHuy">🎁 ' + qua + "</span>" : "") + "</span></button>";
    }).join("");
  }

  // ---------- một tài khoản ----------
  // vai: vai đã biết (từ danh sách / liên kết) để mở hồ sơ bé song song; daMoBe: nơi gọi đã mở hồ sơ bé rồi
  var dangGoiBe = false;
  function moTaiKhoan(ten, vai, daMoBe) {
    var nut = document.querySelector('.adminNutManHinh[data-manhinh="taikhoan"]');
    if (nut && !nut.classList.contains("dangChon")) adminChuyenManHinh("taikhoan", nut);
    dangXem = ten;
    var luot = ++luotXem;
    $("tkKhung").classList.add("dangXem");
    $("manhinh-taikhoan").classList.add("tkDangXem");
    $("tkTrong").hidden = true; $("tkHoSo").hidden = false;
    var cacDong = $("tkDs").querySelectorAll(".tkDong");
    for (var i = 0; i < cacDong.length; i++) cacDong[i].classList.toggle("chon", cacDong[i].getAttribute("data-ten") === ten);
    $("tkKhoiTk").innerHTML = '<p class="adminDangTai">Đang tải ' + T(ten) + "...</p>";
    $("tkNhatKyMot").innerHTML = "";
    bao("tkTb", "");
    $("tkLyDo").value = "";
    var khoiBe = $("khoiChiTietTre");
    var daGoiBe = !!daMoBe;
    if (vai === "tre" && !daMoBe) { goiHoSoBe(ten); daGoiBe = true; }
    else if (vai && vai !== "tre" && khoiBe) khoiBe.style.display = "none";
    if (window.innerWidth < 1024) $("manhinh-taikhoan").scrollIntoView({ block: "start" });

    adminGoiRpc("kc_tk_admin_xem", { p_ten: ten }).then(function (ph) {
      if (luot !== luotXem) return;
      if (!ph || !ph.thanhCong) {
        if (adminLaThieuHamSql(ph)) $("tkKhoiTk").innerHTML = '<p class="adminGhiChu htCanSql">' + TIN_CAN_SQL + "</p>";
        else { adminXuLyLoi(ph); $("tkKhoiTk").innerHTML = '<p class="adminRong">Không tải được tài khoản này.</p>'; }
        return;
      }
      var t = ph.taiKhoan;
      if (t.vaiTro === "tre" && !daGoiBe) goiHoSoBe(ten);
      if (t.vaiTro !== "tre" && khoiBe) khoiBe.style.display = "none";
      veTaiKhoan(t);
    });
    taiNhatKy($("tkNhatKyMot"), ten, 1, false);
  }

  function goiHoSoBe(ten) {
    dangGoiBe = true;
    try { window.adminMoHoSoTre(ten); } finally { dangGoiBe = false; }
  }

  function veTaiKhoan(t) {
    gioiHan = t.gioiHan || gioiHan;
    var p = t.phien || {};
    var chuPhien = TEN_PHIEN[t.phienTinhTrang] || "", phuPhien = "";
    if (t.phienTinhTrang === "con") {
      chuPhien = "🟢 " + (p.soCon || 0) + " / " + (p.soMayToiDa || 1) + " máy";
      if ((p.danhSach || [])[0]) phuPhien = "dùng cuối " + luc(p.danhSach[0].dungCuoi);
    } else if (p.lanCuoiKetThuc) phuPhien = "kết thúc " + luc(p.lanCuoiKetThuc.luc) + " (" + (LY_DO_PHIEN[p.lanCuoiKetThuc.lyDo] || T(p.lanCuoiKetThuc.lyDo)) + ")";
    chuPhien = T(chuPhien) + (phuPhien ? '<br><small class="adminGhiChu">' + T(phuPhien) + "</small>" : "");
    var lk = (t.lienKet || []).map(function (l) {
      return '<button class="tkLk" type="button" data-lk="' + T(l.ten) + '" data-vai="' + T(l.vaiTro) + '" title="Liên kết từ ' +
        T(adminDinhDangGio(l.ngayTao)) + '">' + (l.vaiTro === "tre" ? "👦 " : "👪 ") + T(l.ten) + "</button>";
    }).join("");
    $("tkKhoiTk").innerHTML =
      '<div class="tkDau">' + avatar(t.avatarDaChon) + "<div><h3>" + T(tenChinh(t)) + "</h3><small>@" + T(t.tenDangNhap) + "</small> " +
        '<span class="tkVai">' + (TEN_VAI[t.vaiTro] || T(t.vaiTro)) + "</span></div></div>" +
      '<div class="adminLuoiThe">' +
        (t.vaiTro === "tre" ? adminTheThongTin("Kim cương", (t.diemSo || 0) + " 💎") : "") +
        adminTheThongTin("Phiên đăng nhập", chuPhien) +
        adminTheThongTin(t.vaiTro === "tre" ? "Lần chơi cuối" : "Đăng nhập cuối", t.lanChoiCuoi ? adminDinhDangGio(t.lanChoiCuoi) : "—") +
        adminTheThongTin("Ngày tạo", t.ngayTao ? adminDinhDangGio(t.ngayTao) : "—") +
        (t.vaiTro !== "admin" ? adminTheThongTin(t.vaiTro === "phu_huynh" ? "Con đã liên kết" : "Phụ huynh", lk || "chưa liên kết") : "") +
      "</div>" +
      (t.ghiChu ? '<p class="tkGhiChuHien">📝 ' + T(t.ghiChu) + "</p>" : "");
    $("tkTenHienThi").value = t.tenHienThi || "";
    $("tkTenHienThi").maxLength = gioiHan.tenHienThi;
    $("tkGhiChu").value = t.ghiChu || "";
    $("tkGhiChu").maxLength = gioiHan.ghiChu;
    $("tkTenHienThi").setAttribute("data-cu", t.tenHienThi || "");
    $("tkGhiChu").setAttribute("data-cu", t.ghiChu || "");
    demChu();
  }

  function demChu() {
    $("tkDemTen").textContent = $("tkTenHienThi").value.length + " / " + gioiHan.tenHienThi;
    $("tkDemGhiChu").textContent = $("tkGhiChu").value.length + " / " + gioiHan.ghiChu;
  }

  function luu() {
    if (!dangXem) return;
    var ten = dangXem, nut = $("tkLuu");
    var tenMoi = $("tkTenHienThi").value, gcMoi = $("tkGhiChu").value;
    if (tenMoi === $("tkTenHienThi").getAttribute("data-cu") && gcMoi === $("tkGhiChu").getAttribute("data-cu")) {
      bao("tkTb", "Chưa có gì thay đổi."); return;
    }
    nut.disabled = true; bao("tkTb", "Đang lưu...");
    adminGoiRpc("kc_tk_admin_sua", { p_ten: ten, p_ten_hien_thi: tenMoi, p_ghi_chu: gcMoi, p_ly_do: $("tkLyDo").value || null }).then(function (ph) {
      nut.disabled = false;
      if (!ph || !ph.thanhCong) {
        if (ph && ph.ma === "qua_dai") bao("tkTb", "❌ Dài quá: tên hiển thị tối đa " + gioiHan.tenHienThi + ", ghi chú tối đa " + gioiHan.ghiChu + " ký tự.", true);
        else if (adminLaThieuHamSql(ph)) bao("tkTb", "❌ Cần chạy SQL kc00d2_c1 trước.", true);
        else { bao("tkTb", "❌ Không lưu được.", true); adminXuLyLoi(ph); }
        return;
      }
      if (ten !== dangXem) return;
      bao("tkTb", ph.soThayDoi ? "✅ Đã lưu (" + ph.soThayDoi + " thay đổi)." : "Không có gì thay đổi.");
      $("tkLyDo").value = "";
      dsHienTai.forEach(function (d) { if (d.tenDangNhap === ten) d.tenHienThi = ph.tenHienThi; });
      veDanhSach();
      moLaiKhoiTk(ten);
      taiNhatKy($("tkNhatKyMot"), ten, 1, false);
      nkTrang = 1; taiNhatKy($("tkNhatKyTatCa"), null, 1, false);
    });
  }

  // Vẽ lại khối tài khoản sau khi lưu (không tải lại hồ sơ bé)
  function moLaiKhoiTk(ten) {
    adminGoiRpc("kc_tk_admin_xem", { p_ten: ten }).then(function (ph) {
      if (ph && ph.thanhCong && ten === dangXem) veTaiKhoan(ph.taiKhoan);
    });
  }

  // ---------- nhật ký ----------
  function giaTri(v) {
    if (v === null || v === undefined || v === "") return '<i class="adminGhiChu">(trống)</i>';
    return T(typeof v === "string" ? v : JSON.stringify(v));
  }
  function taiNhatKy(o, ten, trang, noiThem) {
    if (!noiThem) o.innerHTML = '<p class="adminDangTai">Đang tải...</p>';
    adminGoiRpc("kc_tk_admin_nhat_ky", { p_ten: ten, p_trang: trang, p_so_dong: 30 }).then(function (ph) {
      if (ten && ten !== dangXem) return;
      if (!ph || !ph.thanhCong) {
        o.innerHTML = adminLaThieuHamSql(ph) ? '<p class="adminGhiChu htCanSql">' + TIN_CAN_SQL + "</p>" : '<p class="adminRong">Không tải được nhật ký.</p>';
        return;
      }
      var ds = ph.danhSach || [];
      if (!ds.length && !noiThem) { o.innerHTML = '<p class="adminRong">Chưa có thao tác nào.</p>'; return; }
      var dong = ds.map(function (n) {
        return "<tr><td>" + T(adminDinhDangGio(n.luc)) + "</td><td>" + T(n.ai) + "</td>" +
          (ten ? "" : '<td><button class="tkLk" type="button" data-lk="' + T(n.taiKhoan) + '">' + T(n.taiKhoan) + "</button></td>") +
          "<td>" + (TEN_VIEC[n.viec] || T(n.viec)) + '</td><td class="tkDoi"><del>' + giaTri(n.truoc) + "</del> → <ins>" + giaTri(n.sau) + "</ins>" +
          (n.lyDo ? '<br><small class="adminGhiChu">Lý do: ' + T(n.lyDo) + "</small>" : "") + "</td></tr>";
      }).join("");
      var bang = o.querySelector("tbody");
      if (noiThem && bang) bang.insertAdjacentHTML("beforeend", dong);
      else o.innerHTML = '<div class="adminCuonNgang"><table class="tkNk"><thead><tr><th>Lúc</th><th>Ai</th>' + (ten ? "" : "<th>Tài khoản</th>") +
        "<th>Việc</th><th>Trước → Sau</th></tr></thead><tbody>" + dong + "</tbody></table></div>";
      var cu = o.querySelector(".tkThem"); if (cu) cu.remove();
      if (trang * (ph.soDong || 30) < (ph.tong || 0)) {
        o.insertAdjacentHTML("beforeend", '<p class="tkThem"><button class="adminNut adminNutPhu" type="button">Xem thêm</button></p>');
        o.querySelector(".tkThem button").addEventListener("click", function () {
          if (ten) return taiNhatKy(o, ten, trang + 1, true);
          nkTrang = trang + 1; taiNhatKy(o, null, nkTrang, true);
        });
      }
    });
  }

  // ---------- gắn sự kiện ----------
  function khoiTao() {
    var khoiBe = $("khoiChiTietTre");
    if (khoiBe) $("tkChoHoSoBe").appendChild(khoiBe);

    var hen = null;
    $("tkTim").addEventListener("input", function () {
      clearTimeout(hen);
      hen = setTimeout(function () { trangThai.tim = $("tkTim").value.trim(); trangThai.trang = 1; taiDanhSach(); }, 350);
    });
    $("tkVai").addEventListener("change", function () { trangThai.vai = this.value; trangThai.trang = 1; taiDanhSach(); });
    $("tkLocThem").addEventListener("change", function () { trangThai.loc = this.value; trangThai.trang = 1; taiDanhSach(); });
    $("tkLamMoi").addEventListener("click", function () { taiDanhSach(); nkTrang = 1; taiNhatKy($("tkNhatKyTatCa"), null, 1, false); });
    $("tkTrang").addEventListener("click", function (su) {
      var b = su.target.closest("[data-trang]"); if (!b || b.disabled) return;
      trangThai.trang = Math.max(1, trangThai.trang + Number(b.getAttribute("data-trang"))); taiDanhSach();
    });
    $("tkDs").addEventListener("click", function (su) {
      var b = su.target.closest(".tkDong"); if (!b) return;
      moTaiKhoan(b.getAttribute("data-ten"), b.getAttribute("data-vai"));
    });
    $("manhinh-taikhoan").addEventListener("click", function (su) {
      var b = su.target.closest("[data-lk]"); if (!b) return;
      moTaiKhoan(b.getAttribute("data-lk"), b.getAttribute("data-vai") || null);
    });
    $("tkVe").addEventListener("click", function () {
      $("tkKhung").classList.remove("dangXem");
      $("manhinh-taikhoan").classList.remove("tkDangXem");
      $("manhinh-taikhoan").scrollIntoView({ block: "start" });
    });
    $("tkLuu").addEventListener("click", luu);
    $("tkTenHienThi").addEventListener("input", demChu);
    $("tkGhiChu").addEventListener("input", demChu);
    daSan = true;
    if (canTai || $("manhinh-taikhoan").classList.contains("dangHien")) taiLanDau();
  }

  // Màn có thể được mở (theo #taikhoan trên địa chỉ) trước khi khoiTao chạy -> nghe ngay từ lúc nạp file
  var daSan = false, canTai = false, daTai = false;
  function taiLanDau() {
    if (daTai) return;
    daTai = true;
    taiDanhSach();
    taiNhatKy($("tkNhatKyTatCa"), null, 1, false);
  }
  document.addEventListener("adminDaChuyenManHinh", function (su) {
    if (!su.detail || su.detail.ten !== "taikhoan") return;
    if (daSan) taiLanDau(); else canTai = true;
  });

  // Nơi khác mở hồ sơ một bé (vd 👥 Người sở hữu ở Cửa hàng) -> sang màn Tài khoản
  var moBeGoc = window.adminMoHoSoTre;
  window.adminMoHoSoTre = function (ten) {
    if (!dangGoiBe) moTaiKhoan(ten, "tre", true);
    return moBeGoc.apply(this, arguments);
  };

  window.KC_TK = { mo: moTaiKhoan, taiDanhSach: taiDanhSach };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", khoiTao);
  else khoiTao();
})();
