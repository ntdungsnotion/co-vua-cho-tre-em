/* ================================================================
   FILE: caro/cr_giao_dien.js
   CHỨC NĂNG: Giao diện trang game_caro.html: chọn đối thủ, vẽ bàn, bé đặt quân, máy
              đi, khung kết quả, gửi kết quả ván + nhận kim cương (qua chung/vc_van_co.js).
              - Điện thoại (màn cảm ứng): chạm 1 lần hiện bóng quân, chạm lần nữa đúng ô
                đó mới đặt - ô nhỏ nên tránh bấm nhầm. Máy tính: rê chuột thấy bóng, bấm là đặt.
              - Ván đang dở lưu localStorage (kc_caro_van_do_<tên>): tải lại trang / đổi đối
                thủ vẫn chơi tiếp được.
              - Chỉ tài khoản bé (vai trò 'tre') mới gửi kết quả lên máy chủ; phụ huynh /
                admin vẫn chơi thử được.
   BƯỚC: TC_02A
   NGÀY: 21/10/2026 18:20
   PHỤ THUỘC: kc_auth.js (sự kiện kcSanSang, kcDocPhien, kcLuuPhien), kc_api.js (kcGoiRpc),
              chung/vc_van_co.js (VC), caro/cr_logic.js (CR).
   ================================================================ */
(function () {
  "use strict";
  const DOI_THU = [
    { muc: "de", ten: "Gà Con", hinh: "🐣", nhan: "Dễ", thuong: 3 },
    { muc: "vua", ten: "Cáo Nhỏ", hinh: "🦊", nhan: "Vừa", thuong: 5 },
    { muc: "kho", ten: "Hổ Lớn", hinh: "🐯", nhan: "Khó", thuong: 8 }
  ];
  const LA_CHAM = !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
  const $ = id => document.getElementById(id);

  let tk = null;              // tài khoản đang đăng nhập
  let laBe = false;           // vai trò 'tre' -> được ghi ván + nhận kim cương
  let van = null;             // CR.VanCaro đang chơi
  let doiThu = DOI_THU[1];
  let dangNghi = false;       // máy đang nghĩ
  let oBong = -1;             // ô đang hiện bóng quân (chạm lần 1)
  let ketQuaVan = null;       // VC.KetQuaVan
  let tapTrung = null;        // VC.TapTrung
  let thanhTich = null;       // kết quả kc_co_thanh_tich
  const oBan = [];

  const timDoiThu = muc => DOI_THU.find(d => d.muc === muc) || DOI_THU[1];
  const khoaVanDo = () => "kc_caro_van_do_" + (tk ? tk.tenDangNhap : "khach");

  /* ---------------- CHỌN ĐỐI THỦ ---------------- */
  function veLuoiDoiThu() {
    const luoi = $("crLuoiDoiThu");
    luoi.innerHTML = "";
    DOI_THU.forEach(d => {
      const thuong = thanhTich && thanhTich.thuong && typeof thanhTich.thuong[d.muc] === "number" ? thanhTich.thuong[d.muc] : d.thuong;
      const soThang = thanhTich && thanhTich.theoMuc && thanhTich.theoMuc[d.muc] ? thanhTich.theoMuc[d.muc].thang : 0;
      const the = document.createElement("button");
      the.type = "button";
      the.className = "vcTheDoiThu";
      the.innerHTML =
        '<span class="vcHinhDoiThu">' + d.hinh + "</span>" +
        '<span class="vcTenDoiThu">' + d.ten + "</span>" +
        '<span class="vcMucDoiThu">Mức ' + d.nhan + "</span>" +
        (laBe ? '<span class="vcThuong" title="Thắng được ' + thuong + ' kim cương">Thắng: ' + thuong + " 💎</span>" : "") +
        '<span class="vcDaThang">' + (soThang ? "🏆 Đã thắng " + soThang + " ván" : "Thử sức nào!") + "</span>";
      the.addEventListener("click", () => batDauVan(d.muc));
      luoi.appendChild(the);
    });
    const ghiChu = $("crGhiChuThuong");
    if (!laBe) ghiChu.textContent = "Chỉ tài khoản của bé mới nhận kim cương khi thắng.";
    else if (thanhTich && thanhTich.thanhCong) ghiChu.textContent = "Hôm nay con đã nhận " + thanhTich.kimCuongHomNay + " / " + thanhTich.tranGame + " 💎 từ Cờ Caro.";
    else ghiChu.textContent = "";
    veNutVanDo();
  }

  function hienKhuChon() {
    if (tapTrung) tapTrung.thoat();
    $("crKhuChoi").style.display = "none";
    $("crKhuChon").style.display = "";
    veLuoiDoiThu();
  }

  /* ---------------- VÁN ĐANG DỞ ---------------- */
  function luuVanDo() {
    try {
      if (van && !van.daXong && van.nuocDi.length) localStorage.setItem(khoaVanDo(), JSON.stringify({ muc: van.muc, nuocDi: van.nuocDi }));
      else localStorage.removeItem(khoaVanDo());
    } catch (e) { /* chặn lưu: bỏ qua */ }
  }
  function docVanDo() {
    try {
      const v = JSON.parse(localStorage.getItem(khoaVanDo()) || "null");
      if (v && CR.MUC[v.muc] && Array.isArray(v.nuocDi) && v.nuocDi.length) return v;
    } catch (e) { /* hỏng thì bỏ */ }
    return null;
  }
  function veNutVanDo() {
    const v = docVanDo();
    $("crVanDo").style.display = v ? "" : "none";
    if (v) {
      const d = timDoiThu(v.muc);
      $("crNutChoiTiep").textContent = "▶ Chơi tiếp ván đang dở với " + d.hinh + " " + d.ten;
    }
  }

  /* ---------------- BÀN CỜ ---------------- */
  function taoBan() {
    const ban = $("crBan");
    for (let o = 0; o < CR.SO_O; o++) {
      const nut = document.createElement("button");
      nut.type = "button";
      nut.className = "crO";
      nut.setAttribute("role", "gridcell");
      nut.setAttribute("aria-label", "Hàng " + (CR.hang(o) + 1) + ", cột " + (CR.cot(o) + 1));
      nut.dataset.o = o;
      ban.appendChild(nut);
      oBan.push(nut);
    }
    ban.addEventListener("click", su => {
      const nut = su.target.closest(".crO");
      if (nut) bamO(Number(nut.dataset.o));
    });
  }

  function veBan() {
    const cuoi = van.nuocDi.length ? van.nuocDi[van.nuocDi.length - 1] : -1;
    const thang = new Set(van.dayThang || []);
    for (let o = 0; o < CR.SO_O; o++) {
      const v = van.ban[o];
      const cl = oBan[o].classList;
      cl.toggle("crX", v === CR.BE);
      cl.toggle("crOO", v === CR.MAY);
      cl.toggle("crMoi", o === cuoi && !thang.size);
      cl.toggle("crThang", thang.has(o));
      cl.toggle("crBong", o === oBong && v === 0);
    }
    $("crBan").classList.toggle("crChoMay", dangNghi);
    $("crBan").classList.toggle("crXong", van.daXong);
  }

  function capNhatLuot() {
    const luotBe = !van.daXong && van.luot === CR.BE && !dangNghi;
    $("crTheBe").classList.toggle("vcDangDi", luotBe);
    $("crTheMay").classList.toggle("vcDangDi", !van.daXong && !luotBe);
    let loi;
    if (van.ketQua === "thang") loi = "🎉 Con xếp được 5 quân rồi!";
    else if (van.ketQua === "thua") loi = doiThu.hinh + " " + doiThu.ten + " xếp được 5 quân!";
    else if (van.ketQua === "hoa") loi = "🤝 Bàn cờ đầy rồi, hoà nhé!";
    else if (luotBe) loi = van.nuocDi.length === 0 ? "Con đi trước! Đặt quân ❌ nào" : "Lượt của con! Đặt quân ❌ nhé";
    else loi = doiThu.hinh + " " + doiThu.ten + " đang nghĩ...";
    $("crLoiLuot").textContent = loi;
    if (tapTrung) tapTrung.capNhatNut();
  }

  function veKimCuong() {
    $("crKimCuongBe").textContent = "💎 " + (tk && typeof tk.diemSo === "number" ? tk.diemSo : 0);
  }

  /* ---------------- CHƠI ---------------- */
  function batDauVan(muc, nuocDiCu) {
    dongKetQua();
    doiThu = timDoiThu(muc);
    van = new CR.VanCaro(doiThu.muc);
    if (nuocDiCu) {
      for (const o of nuocDiCu) { if (!van.di(o)) { van = new CR.VanCaro(doiThu.muc); break; } }
      if (van.daXong) van = new CR.VanCaro(doiThu.muc);
    }
    dangNghi = false; oBong = -1;
    $("crAvatarMay").textContent = doiThu.hinh;
    $("crTenMay").textContent = doiThu.ten;
    $("crMucMay").textContent = "mức " + doiThu.nhan;
    $("crKhuChon").style.display = "none";
    $("crKhuChoi").style.display = "";
    $("crGoiYCham").textContent = LA_CHAM ? "Chạm 1 lần để chọn ô, chạm lần nữa vào ô đó để đặt quân." : "";
    if (tapTrung) tapTrung.batNeuDienThoai();
    luuVanDo();
    veBan(); capNhatLuot();
    if (van.luot === CR.MAY) mayDi();
  }

  function bamO(o) {
    if (!van || van.daXong || dangNghi || van.luot !== CR.BE || van.ban[o] !== 0) return;
    if (LA_CHAM && oBong !== o) { oBong = o; veBan(); return; }
    oBong = -1;
    if (!van.beDi(o)) return;
    sauNuocDi();
  }

  function sauNuocDi() {
    luuVanDo();
    veBan(); capNhatLuot();
    if (van.daXong) ketThucVan();
    else if (van.luot === CR.MAY) mayDi();
  }

  function mayDi() {
    dangNghi = true;
    veBan(); capNhatLuot();
    const vanNay = van;
    setTimeout(() => {
      if (van !== vanNay) return;        // bé đã bấm ván mới trong lúc máy nghĩ
      van.mayDi();
      dangNghi = false;
      sauNuocDi();
    }, 350 + Math.random() * 450);
  }

  /* ---------------- KẾT THÚC VÁN ---------------- */
  function ketThucVan() {
    const vanNay = van;
    let mucGui = null;
    if (laBe && ketQuaVan) {
      mucGui = ketQuaVan.them({ cheDo: "may", muc: van.muc, ketQua: van.ketQua, nuocDi: van.nuocDi, doiThu: doiThu.ten });
    }
    // để bé kịp thấy 5 quân sáng lên rồi mới hiện khung kết quả
    setTimeout(() => {
      if (van !== vanNay) return;
      hienKetQua(mucGui);
    }, van.ketQua === "hoa" ? 400 : 1100);
  }

  function hienKetQua(mucGui) {
    const kq = van.ketQua;
    const d = doiThu;
    if (kq === "thang") {
      $("crKetQuaHinh").textContent = "🏆";
      $("crKetQuaTieuDe").textContent = "Con thắng rồi!";
      $("crKetQuaLoi").textContent = "Con đã thắng " + d.hinh + " " + d.ten + ". Giỏi quá!";
    } else if (kq === "thua") {
      $("crKetQuaHinh").textContent = "💪";
      $("crKetQuaTieuDe").textContent = d.ten + " thắng ván này!";
      $("crKetQuaLoi").textContent = "Mẹo nhỏ: thấy " + d.ten + " có 3 quân ⭕ liền nhau là chặn ngay nhé. Chơi lại phục thù nào!";
    } else {
      $("crKetQuaHinh").textContent = "🤝";
      $("crKetQuaTieuDe").textContent = "Hoà rồi!";
      $("crKetQuaLoi").textContent = "Bàn cờ đầy mà chưa ai xếp được 5 quân. Hai bên ngang tài!";
    }
    const oKc = $("crKetQuaKimCuong");
    oKc.textContent = "";
    if (kq === "thang" && !laBe) oKc.textContent = "Tài khoản của bé mới nhận kim cương nhé.";
    if (kq === "thang" && mucGui) oKc.textContent = "Đang cất kim cương vào kho... 💎";
    $("crKetQua").classList.add("vcHien");
    if (tapTrung) tapTrung.thoat();
    $("crNutChoiLai").focus();
    if (mucGui) guiKetQua(mucGui);
  }

  /* Lời báo kim cương nói RÕ SỐ (người dùng góp ý 21/10/2026): nhận mấy viên, kho giờ có mấy viên;
     bị trần cắt bớt thì nói rõ được bao nhiêu trên bao nhiêu. */
  function loiKimCuong(k) {
    const kho = typeof k.diemSoMoi === "number" ? " Kho của con giờ có " + k.diemSoMoi + " 💎." : "";
    if (k.soCong > 0 && k.soCong >= k.soXin) return "💎 Con nhận được " + k.soCong + " kim cương!" + kho;
    if (k.soCong > 0) return "💎 Con nhận được " + k.soCong + " kim cương (ván này thưởng " + k.soXin +
      " nhưng hôm nay chỉ còn nhận thêm được " + k.soCong + ")." + kho;
    return "Hôm nay con đã nhận đủ kim cương rồi nên ván này không có thêm kim cương, mai chơi tiếp nhé!";
  }

  function guiKetQua(mucGui) {
    ketQuaVan.gui().then(r => {
      const k = r.ketQua[mucGui.maLuot];
      if (typeof r.diemSoMoi === "number") capNhatKimCuong(r.diemSoMoi);
      const oKc = $("crKetQuaKimCuong");
      if (mucGui.ketQua !== "thang") { taiThanhTich(); return; }
      const thuong = thanhTich && thanhTich.thuong && typeof thanhTich.thuong[mucGui.muc] === "number" ? thanhTich.thuong[mucGui.muc] : timDoiThu(mucGui.muc).thuong;
      if (!k) oKc.textContent = "Mạng đang chập chờn, " + thuong + " kim cương của ván này sẽ tự vào kho khi có mạng nhé.";
      else if (k.hopLe === false) oKc.textContent = "Ván này máy chủ chưa ghi nhận được, con chơi ván khác nhé.";
      else oKc.textContent = loiKimCuong(k);
      taiThanhTich();
    });
  }

  function capNhatKimCuong(so) {
    if (!tk) return;
    tk.diemSo = so;
    // phiên dùng chung cả app: các trang khác thấy ngay số kim cương mới
    if (typeof kcTaiKhoanHienTai !== "undefined" && kcTaiKhoanHienTai && typeof kcLuuPhien === "function") {
      kcTaiKhoanHienTai.diemSo = so;
      kcLuuPhien(kcTaiKhoanHienTai);
    }
    veKimCuong();
  }

  function dongKetQua() { $("crKetQua").classList.remove("vcHien"); }

  function taiThanhTich() {
    if (!tk) return;
    VC.layThanhTich(kcGoiRpc, kcDocPhien(), "caro").then(kq => {
      if (kq && kq.thanhCong) thanhTich = kq;
      if ($("crKhuChon").style.display !== "none") veLuoiDoiThu();
    });
  }

  /* ---------------- KHỞI ĐỘNG ---------------- */
  document.addEventListener("DOMContentLoaded", () => {
    taoBan();
    tapTrung = new VC.TapTrung(() => !!(van && !van.daXong && $("crKhuChoi").style.display !== "none"), $("crNutHang"));
    $("crNutVanMoi").addEventListener("click", () => batDauVan(doiThu.muc));
    $("crNutDoiDoiThu").addEventListener("click", hienKhuChon);
    $("crNutChoiTiep").addEventListener("click", () => { const v = docVanDo(); if (v) batDauVan(v.muc, v.nuocDi); });
    $("crNutChoiLai").addEventListener("click", () => batDauVan(doiThu.muc));
    $("crNutXemBan").addEventListener("click", dongKetQua);
    $("crNutKetQuaDoi").addEventListener("click", () => { dongKetQua(); hienKhuChon(); });
    $("crKetQua").addEventListener("click", su => { if (su.target === $("crKetQua")) dongKetQua(); });
    document.addEventListener("keydown", su => { if (su.key === "Escape") dongKetQua(); });
  });

  document.addEventListener("kcSanSang", su => {
    const ct = su.detail || {};
    if (!ct.daDangNhap || !ct.taiKhoan) { tk = null; return; }
    tk = ct.taiKhoan;
    laBe = tk.vaiTro === "tre";
    ketQuaVan = new VC.KetQuaVan("caro", laBe ? tk.tenDangNhap : "", kcGoiRpc, kcDocPhien);
    VC.veAvatar($("crAvatarBe"), tk.avatarDaChon, "🙂");
    $("crTenBe").textContent = tk.tenDangNhap;
    veKimCuong();
    hienKhuChon();
    // ván đã xong lúc mất mạng: gửi bù
    ketQuaVan.gui().then(r => { if (typeof r.diemSoMoi === "number") capNhatKimCuong(r.diemSoMoi); });
    taiThanhTich();
  });
})();
// 21/10/2026 19:20 - BƯỚC: TC_02A (lời báo kim cương nói rõ số) | 21/10/2026 18:20 - BƯỚC: TC_02A
