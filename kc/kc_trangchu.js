// ================================================================
// FILE: kc_trangchu.js
// CHỨC NĂNG: Số liệu THẬT cho Trang chủ (index.html ở gốc):
//   - BÉ: 💎 kim cương, hạng Cờ Vua của chính bé (đọc lay_thong_tin_ca_nhan sẵn
//     có, chỉ ĐỌC), 🎁 quà chưa nhận (kc_lay_qua_chua_nhan) + nút "Nhận quà!"
//     (kc_nhan_qua): kim cương rơi, con số nhảy lên.
//   - PHỤ HUYNH: trang chủ riêng - danh sách các con (kc_lay_danh_sach_tre của
//     TT_01) + "Việc chờ duyệt" (sắp có). Không có Cờ Vua.
// BƯỚC: KC_00C-2
// NGÀY: 15/10/2026
// PHỤ THUỘC: kc_config.js, kc_api.js, kc_auth.js (sự kiện kcSanSang, biến
//   kcTaiKhoanHienTai, kcThongTinCaNhan, hàm kcLuuPhien) phải nạp TRƯỚC.
// SQL: supabase_kc00c_qua_tang.sql (lưu ở repo riêng, thư mục SQL/ - TC_01) (chưa chạy SQL thì khu quà tự ẩn,
//   trang không vỡ).
// QUY ƯỚC: hạng KHÔNG so giữa các bé - chỉ hiện hạng của chính bé (KẾ HOẠCH
//   KC_00C). Kim cương chỉ cộng khi bé tự bấm nhận quà (HƯỚNG DẪN 3.0).
// ================================================================

var TC_HINH_NGUON = {
  thu_thach: "🎯", tro_choi: "🎮", hoc_tap: "📚", kham_pha: "🧭", bo_me: "💝", he_thong: "🎁"
};

var tcDangNhanQua = false; // chặn bấm dồn 2 quà cùng lúc

function tcLay(id) { return document.getElementById(id); }

// Avatar là emoji HOẶC URL ảnh (Sổ Tay D7)
function tcVeAvatar(o, av, macDinh) {
  o.textContent = macDinh;
  if (av && av.indexOf("http") === 0) {
    var img = document.createElement("img");
    img.src = av; img.alt = "";
    o.textContent = ""; o.appendChild(img);
  } else if (av) { o.textContent = av; }
}

// ================================================================
// PHẦN 1: CHỌN GIAO DIỆN BÉ / PHỤ HUYNH
// ================================================================

function tcVeTrangChu(tk) {
  if (!tk || !tk.tenDangNhap) return;
  var laPhuHuynh = tk.vaiTro === "phu_huynh";
  tcLay("tcLoiChao").textContent = "Chào " + tk.tenDangNhap + "!";
  tcLay("tcLoiChaoPhu").textContent = laPhuHuynh ? "Hôm nay các con thế nào rồi?" : "Hôm nay con muốn đi đâu nào?";
  tcVeAvatar(tcLay("tcChaoAvatar"), tk.avatarDaChon, laPhuHuynh ? "👨‍👩‍👧" : "🙂");

  tcLay("tcKhuBe").style.display = laPhuHuynh ? "none" : "";
  tcLay("tcKhuPhuHuynh").style.display = laPhuHuynh ? "" : "none";
  tcLay("tcDongCoVua").style.display = laPhuHuynh ? "none" : "";

  if (laPhuHuynh) {
    tcTaiDanhSachCon(tk);
  } else {
    tcVeKimCuong(tk.diemSo, false);
    tcVeHangCoVua(kcThongTinCaNhan);
    tcTaiQua(tk);
  }
}

// ================================================================
// PHẦN 2: KIM CƯƠNG + HẠNG CỜ VUA (của chính bé)
// ================================================================

var tcKimCuongDangHien = null;

function tcVeKimCuong(so, nhayLen) {
  so = Number(so) || 0;
  var o = tcLay("tcSoKimCuong");
  if (!nhayLen || tcKimCuongDangHien === null || so <= tcKimCuongDangHien) {
    tcKimCuongDangHien = so;
    o.textContent = so;
    return;
  }
  // Con số nhảy dần lên cho bé thấy kim cương đang vào túi
  var batDau = tcKimCuongDangHien, thoiGian = 1200, t0 = null;
  tcKimCuongDangHien = so;
  var the = tcLay("tcOKimCuong");
  the.classList.add("tcNay");
  function buoc(t) {
    if (t0 === null) t0 = t;
    var tiLe = Math.min(1, (t - t0) / thoiGian);
    o.textContent = Math.round(batDau + (so - batDau) * tiLe);
    if (tiLe < 1) requestAnimationFrame(buoc);
    else setTimeout(function () { the.classList.remove("tcNay"); }, 300);
  }
  requestAnimationFrame(buoc);
}

function tcVeHangCoVua(tt) {
  var o = tcLay("tcHangCoVua");
  if (tt && tt.hangThu) {
    o.textContent = "♟️ Cờ Vua: 🏅 Hạng " + tt.hangThu + (tt.danhHieu ? " · " + tt.danhHieu : "");
    return;
  }
  o.textContent = "♟️ Cờ Vua: đang xem hạng...";
  var tk = kcTaiKhoanHienTai;
  if (!tk) return;
  kcGoiRpc("lay_thong_tin_ca_nhan", { p_ten: tk.tenDangNhap }).then(function (kq) {
    if (!kq || !kq.thanhCong || !kq.thongTin) { o.textContent = "♟️ Cờ Vua: chơi ván đầu để có hạng nhé!"; return; }
    kcThongTinCaNhan = kq.thongTin;
    tcVeKimCuong(kq.thongTin.diemSo, false);
    tcVeHangCoVua(kq.thongTin);
  });
}

// ================================================================
// PHẦN 3: QUÀ TẶNG CHƯA NHẬN (dùng chung toàn app)
// ================================================================

function tcTaiQua(tk) {
  kcGoiRpc("kc_lay_qua_chua_nhan", { p_ten: tk.tenDangNhap, p_ma_phien: tk.maPhien || "" }).then(function (kq) {
    if (!kq || !kq.thanhCong) { tcVeDanhSachQua([]); return; }
    tcVeDanhSachQua(kq.danhSachQua || []);
  });
}

function tcVeSoQua(n) {
  var chip = tcLay("tcOQua");
  tcLay("tcSoQua").textContent = n > 0 ? n + " quà mới" : "Chưa có quà";
  chip.classList.toggle("tcCoQua", n > 0);
  chip.disabled = n === 0;
}

function tcVeDanhSachQua(ds) {
  var khu = tcLay("tcKhuQua");
  var vung = tcLay("tcDanhSachQua");
  vung.innerHTML = "";
  tcVeSoQua(ds.length);
  khu.style.display = ds.length ? "" : "none";
  ds.forEach(function (q) { vung.appendChild(tcTaoTheQua(q)); });
}

function tcTaoTheQua(q) {
  var the = document.createElement("div");
  the.className = "tcTheQua";

  var hinh = document.createElement("div");
  hinh.className = "tcQuaHinh";
  hinh.textContent = TC_HINH_NGUON[q.nguon] || "🎁";

  var giua = document.createElement("div");
  giua.className = "tcQuaGiua";
  var td = document.createElement("strong");
  td.textContent = q.tieuDe;
  giua.appendChild(td);
  if (q.loiNhan) {
    var ln = document.createElement("p");
    ln.textContent = "“" + q.loiNhan + "”" + (q.nguoiTang ? " - " + q.nguoiTang : "");
    giua.appendChild(ln);
  } else if (q.nguoiTang) {
    var nt = document.createElement("p");
    nt.textContent = "Từ " + q.nguoiTang;
    giua.appendChild(nt);
  }
  var kc = document.createElement("span");
  kc.className = "tcQuaKimCuong";
  kc.textContent = "💎 +" + q.soKimCuong;
  giua.appendChild(kc);

  var nut = document.createElement("button");
  nut.type = "button";
  nut.className = "tcNutNhanQua";
  nut.textContent = "Nhận quà!";
  nut.addEventListener("click", function () { tcNhanQua(q, the, nut); });

  the.appendChild(hinh); the.appendChild(giua); the.appendChild(nut);
  return the;
}

function tcNhanQua(q, the, nut) {
  var tk = kcTaiKhoanHienTai;
  if (!tk || tcDangNhanQua) return;
  tcDangNhanQua = true;
  nut.disabled = true;
  nut.textContent = "Đang mở...";
  the.classList.add("tcDangMo");

  kcGoiRpc("kc_nhan_qua", { p_ten: tk.tenDangNhap, p_ma_phien: tk.maPhien || "", p_id: q.id }).then(function (kq) {
    tcDangNhanQua = false;
    the.classList.remove("tcDangMo");
    if (!kq || !kq.thanhCong) {
      // Đã nhận ở máy khác / lỗi mạng: tải lại danh sách cho đúng
      tcHienLoiQua(kq && kq.thongBao && kq.thongBao.indexOf("nhan roi") !== -1
        ? "Quà này con nhận rồi nhé!" : "Chưa mở được quà, con thử lại nhé.");
      tcTaiQua(tk);
      return;
    }
    // Cập nhật phiên chung để Cờ Vua (Cửa Hàng) thấy ngay số kim cương mới
    tk.diemSo = kq.diemSoMoi;
    kcLuuPhien(tk);

    tcMuaKimCuong(Math.min(24, 6 + kq.soKimCuong * 2));
    tcVeKimCuong(kq.diemSoMoi, true);
    tcHienChucMung(kq.soKimCuong);

    nut.textContent = "Đã nhận ✓";
    the.classList.add("tcDaNhan");
    setTimeout(function () {
      if (the.parentNode) the.parentNode.removeChild(the);
      var conLai = tcLay("tcDanhSachQua").children.length;
      tcVeSoQua(conLai);
      if (!conLai) tcLay("tcKhuQua").style.display = "none";
    }, 900);
  });
}

function tcHienChucMung(soKc) {
  var o = tcLay("tcChucMung");
  o.textContent = "🎉 Con nhận được " + soKc + " kim cương!";
  o.classList.add("hien");
  clearTimeout(o._hen);
  o._hen = setTimeout(function () { o.classList.remove("hien"); }, 2600);
}

function tcHienLoiQua(text) {
  var o = tcLay("tcChucMung");
  o.textContent = text;
  o.classList.add("hien");
  clearTimeout(o._hen);
  o._hen = setTimeout(function () { o.classList.remove("hien"); }, 2200);
}

// Mưa kim cương rơi từ trên xuống (tắt khi máy đặt "giảm chuyển động")
function tcMuaKimCuong(soHat) {
  try {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  } catch (loi) { /* bỏ qua */ }
  for (var i = 0; i < soHat; i++) {
    var h = document.createElement("span");
    h.className = "tcHatKimCuong";
    h.textContent = "💎";
    h.style.left = (Math.random() * 92 + 2) + "vw";
    h.style.animationDelay = (Math.random() * 0.6) + "s";
    h.style.fontSize = (1.2 + Math.random() * 1.2) + "rem";
    document.body.appendChild(h);
    setTimeout((function (x) { return function () { if (x.parentNode) x.parentNode.removeChild(x); }; })(h), 2600);
  }
}

// ================================================================
// PHẦN 4: TRANG CHỦ PHỤ HUYNH
// ================================================================

function tcTaiDanhSachCon(tk) {
  var vung = tcLay("tcDanhSachCon");
  vung.textContent = "Đang tải...";
  kcGoiRpc("kc_lay_danh_sach_tre", { p_ten_phu_huynh: tk.tenDangNhap, p_ma_phien: tk.maPhien || "" }).then(function (kq) {
    vung.innerHTML = "";
    if (!kq || !kq.thanhCong) {
      vung.textContent = (kq && kq.thongBao) || "Chưa tải được danh sách các con.";
      return;
    }
    var ds = kq.danhSachTre || [];
    if (!ds.length) {
      var p = document.createElement("p");
      p.className = "tcRong";
      p.innerHTML = 'Chưa liên kết con nào. <a href="kc/thuthach_NC.html">Liên kết con ở trang Thử Thách</a>';
      vung.appendChild(p);
      return;
    }
    ds.forEach(function (con) {
      var d = document.createElement("div");
      d.className = "tcTheCon";
      var av = document.createElement("div");
      av.className = "tcConAvatar";
      tcVeAvatar(av, con.avatarDaChon, "🙂");
      var ten = document.createElement("strong");
      ten.textContent = con.tenDangNhap;
      var kc = document.createElement("span");
      kc.className = "tcConKimCuong";
      kc.textContent = "💎 " + (Number(con.diemSo) || 0);
      d.appendChild(av); d.appendChild(ten); d.appendChild(kc);
      vung.appendChild(d);
    });
  });
}

// ================================================================
// PHẦN 5: KHỞI ĐỘNG
// ================================================================

document.addEventListener("DOMContentLoaded", function () {
  tcLay("tcOQua").addEventListener("click", function () {
    var khu = tcLay("tcKhuQua");
    if (khu.style.display !== "none") khu.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  // Vẽ ngay từ phiên đã lưu (lời chào, kim cương tạm), chờ kcSanSang để có số mới
  if (kcTaiKhoanHienTai) {
    var tk = kcTaiKhoanHienTai;
    tcLay("tcLoiChao").textContent = "Chào " + tk.tenDangNhap + "!";
    tcVeAvatar(tcLay("tcChaoAvatar"), tk.avatarDaChon, "🙂");
    if (tk.vaiTro !== "phu_huynh") tcVeKimCuong(tk.diemSo, false);
  }
});

document.addEventListener("kcSanSang", function (su) {
  if (su.detail && su.detail.daDangNhap) tcVeTrangChu(su.detail.taiKhoan);
});

// 15/10/2026 - BƯỚC: KC_00C-2
