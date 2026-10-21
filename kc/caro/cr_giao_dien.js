/* ================================================================
   FILE: caro/cr_giao_dien.js
   CHỨC NĂNG: Giao diện trang game_caro.html, 3 chế độ chơi:
              - "may"     : bé đấu với máy (Gà Con / Cáo Nhỏ / Hổ Lớn), thắng được kim cương
                            (TC_02A, gửi kết quả qua chung/vc_van_co.js);
              - "mot_may" : 2 bạn chung 1 máy, thay phiên bấm, không tính kim cương (TC_02B);
              - "hai_may" : mỗi bạn 1 máy, qua phòng chơi chung game cờ chung/vc_phong_co.js
                            (TC_02B). Máy chủ giữ luật + tự cộng kim cương cho cả 2 bé khi hết
                            ván (thắng / hoà / thua - người dùng chốt "theo luật Cờ Vua").
                            Mỗi ván mới đổi người đi trước; người đi trước cầm ❌.
              Điện thoại (màn cảm ứng): chạm 1 lần hiện bóng quân, chạm lần nữa đúng ô đó mới
              đặt - ô nhỏ nên tránh bấm nhầm. Máy tính: rê chuột thấy bóng, bấm là đặt.
              Ván với máy đang dở lưu localStorage (kc_caro_van_do_<tên>); ván 2 máy nằm trên
              máy chủ, tải lại trang thì vào lại được.
              Chỉ tài khoản bé (vai trò 'tre') mới nhận kim cương; phụ huynh / admin vẫn chơi được.
   BƯỚC: TC_02A | TC_02B (chơi 2 người chung 1 máy + 2 máy)
   NGÀY: 21/10/2026 18:20 | 21/10/2026 21:00
   PHỤ THUỘC: kc_auth.js (sự kiện kcSanSang, kcDocPhien, kcLuuPhien), kc_api.js (kcGoiRpc),
              kc_config.js (kcSupabaseClient), chung/vc_van_co.js + chung/vc_phong_co.js (VC),
              caro/cr_logic.js (CR).
   ================================================================ */
(function () {
  "use strict";
  const DOI_THU = [
    { muc: "de", ten: "Gà Con", hinh: "🐣", nhan: "Dễ", thuong: 3 },
    { muc: "vua", ten: "Cáo Nhỏ", hinh: "🦊", nhan: "Vừa", thuong: 5 },
    { muc: "kho", ten: "Hổ Lớn", hinh: "🐯", nhan: "Khó", thuong: 8 }
  ];
  const THUONG_2N = { thang: 3, hoa: 2, thua: 1 };   // mặc định khi chưa đọc được cấu hình
  const VANG_LAU = 20;                                 // giây: bạn không còn hỏi phòng -> báo mất kết nối
  const LA_CHAM = !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
  const $ = id => document.getElementById(id);

  let tk = null;              // tài khoản đang đăng nhập
  let laBe = false;           // vai trò 'tre' -> được ghi ván + nhận kim cương
  let cheDo = "may";          // "may" | "mot_may" | "hai_may"
  let van = null;             // CR.VanCaro đang chơi (CR.BE = người đi trước ❌, CR.MAY = người đi sau ⭕)
  let doiThu = DOI_THU[1];
  let dangNghi = false;       // máy đang nghĩ
  let oBong = -1;             // ô đang hiện bóng quân (chạm lần 1)
  let ketQuaVan = null;       // VC.KetQuaVan
  let tapTrung = null;        // VC.TapTrung
  let thanhTich = null;       // kết quả kc_co_thanh_tich
  let phongCo = null;         // VC.PhongCo
  let phong = null;           // phòng 2 máy đang chơi (máy chủ trả về)
  let dangGui = false;        // nước đi 2 máy đang gửi lên máy chủ
  let daBaoKetQua = "";       // "<id>_<vanSo>" của ván 2 máy đã hiện khung kết quả
  let phongCuaToi = null;     // phòng 2 máy chưa xong (từ sảnh) để "Vào lại"
  let hoiLaiViec = null;      // việc chờ bé xác nhận ở khung hỏi lại
  const oBan = [];

  const timDoiThu = muc => DOI_THU.find(d => d.muc === muc) || DOI_THU[1];
  const khoaVanDo = () => "kc_caro_van_do_" + (tk ? tk.tenDangNhap : "khach");
  const thuong2n = () => (thanhTich && thanhTich.thuong2n) || THUONG_2N;

  function hienKhu(ten) {
    $("crKhuChon").style.display = ten === "chon" ? "" : "none";
    $("crKhuSanh").style.display = ten === "sanh" ? "" : "none";
    $("crKhuChoi").style.display = ten === "choi" ? "" : "none";
    if (ten !== "sanh" && phongCo) phongCo.ngungSanh();
  }

  /* ---------------- CHỌN ĐỐI THỦ / CHẾ ĐỘ ---------------- */
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
    // thẻ "Mỗi bạn một máy"
    const t = thuong2n();
    $("crThuong2n").style.display = laBe ? "" : "none";
    $("crThuong2n").textContent = "Thắng " + t.thang + " 💎 · Hoà " + t.hoa + " · Thua " + t.thua;
    const hn = thanhTich && thanhTich.haiNguoi;
    $("crThanhTich2n").textContent = hn && (hn.thang + hn.thua + hn.hoa)
      ? "🏆 Thắng " + hn.thang + " · Hoà " + hn.hoa + " · Thua " + hn.thua : "Rủ bạn chơi nào!";
    veNutVanDo();
  }

  function hienKhuChon() {
    if (tapTrung) tapTrung.thoat();
    hienKhu("chon");
    veLuoiDoiThu();
    if (phongCo) phongCo.dsPhong().then(kq => { if (kq && kq.thanhCong) { phongCuaToi = kq.phongCuaToi; veNutVanDo(); } });
  }

  /* ---------------- VÁN ĐANG DỞ ---------------- */
  function luuVanDo() {
    if (cheDo !== "may") return;
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
    const p = phongCuaToi;
    const coVanBan = !!(p && (p.trangThai === "dang_choi" || p.trangThai === "ket_thuc"));
    $("crVanHaiMay").style.display = coVanBan ? "" : "none";
    if (coVanBan) $("crNutVaoLai").textContent = "▶ Vào lại phòng chơi với " + VC.haiBenPhong(p).ban;
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

  /* Quân của lượt đang tới: ⭕ thì bóng quân vẽ vòng tròn */
  function luotLaO() { return van && van.luot === CR.MAY; }

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
    const ban = $("crBan");
    ban.classList.toggle("crChoMay", dangNghi || (cheDo === "hai_may" && !denLuotToi()));
    ban.classList.toggle("crXong", van.daXong);
    ban.classList.toggle("crLuotO", luotLaO());
  }

  /* ---------------- NGƯỜI CHƠI + LỜI LƯỢT ---------------- */
  /* Thẻ trái = người đi trước (❌), thẻ phải = người đi sau (⭕) */
  function veHaiThe(trai, phai) {
    VC.veAvatar($("crAvatarBe"), trai.avatar, trai.macDinh || "🙂");
    $("crTenBe").textContent = trai.ten;
    $("crPhuBe").innerHTML = trai.phu;
    VC.veAvatar($("crAvatarMay"), phai.avatar, phai.macDinh || "🙂");
    $("crTenMay").textContent = phai.ten;
    $("crPhuMay").innerHTML = phai.phu;
  }

  function veNguoiChoi() {
    const kc = '<span id="crKimCuongBe">💎 ' + (tk && typeof tk.diemSo === "number" ? tk.diemSo : 0) + "</span>";
    if (cheDo === "may") {
      veHaiThe({ ten: tk ? tk.tenDangNhap : "Con", avatar: tk && tk.avatarDaChon, phu: "quân ❌ · " + kc },
               { ten: doiThu.ten, avatar: doiThu.hinh, phu: "quân ⭕ · mức " + doiThu.nhan });
    } else if (cheDo === "mot_may") {
      veHaiThe({ ten: "Bạn ❌", macDinh: "😀", phu: "đi trước" }, { ten: "Bạn ⭕", macDinh: "😎", phu: "đi sau" });
    } else if (phong) {
      const h = VC.haiBenPhong(phong);
      const toi = { ten: h.toi + " (con)", avatar: h.avatarToi, phu: "" };
      const ban = { ten: h.ban || "...", avatar: h.avatarBan, phu: "" };
      if (h.toiDiTruoc) { toi.phu = "quân ❌ · " + kc; ban.phu = "quân ⭕"; veHaiThe(toi, ban); }
      else { ban.phu = "quân ❌"; toi.phu = "quân ⭕ · " + kc; veHaiThe(ban, toi); }
    }
  }

  function denLuotToi() {
    if (cheDo !== "hai_may" || !phong || !van) return false;
    if (phong.trangThai !== "dang_choi" || van.daXong) return false;
    const h = VC.haiBenPhong(phong);
    return (van.luot === CR.BE) === h.toiDiTruoc;
  }

  function capNhatLuot() {
    const luotX = !van.daXong && van.luot === CR.BE;
    $("crTheBe").classList.toggle("vcDangDi", !van.daXong && luotX && !dangNghi);
    $("crTheMay").classList.toggle("vcDangDi", !van.daXong && (!luotX || dangNghi));
    let loi;
    if (cheDo === "may") {
      if (van.ketQua === "thang") loi = "🎉 Con xếp được 5 quân rồi!";
      else if (van.ketQua === "thua") loi = doiThu.hinh + " " + doiThu.ten + " xếp được 5 quân!";
      else if (van.ketQua === "hoa") loi = "🤝 Bàn cờ đầy rồi, hoà nhé!";
      else if (luotX && !dangNghi) loi = van.nuocDi.length === 0 ? "Con đi trước! Đặt quân ❌ nào" : "Lượt của con! Đặt quân ❌ nhé";
      else loi = doiThu.hinh + " " + doiThu.ten + " đang nghĩ...";
    } else if (cheDo === "mot_may") {
      if (van.ketQua === "thang") loi = "🎉 Bạn ❌ xếp được 5 quân!";
      else if (van.ketQua === "thua") loi = "🎉 Bạn ⭕ xếp được 5 quân!";
      else if (van.ketQua === "hoa") loi = "🤝 Bàn cờ đầy rồi, hoà nhé!";
      else loi = luotX ? "Lượt của bạn ❌" : "Lượt của bạn ⭕";
    } else {
      loi = loiLuotHaiMay();
    }
    $("crLoiLuot").textContent = loi;
    if (tapTrung) tapTrung.capNhatNut();
  }

  function loiLuotHaiMay() {
    if (!phong) return "";
    const h = VC.haiBenPhong(phong);
    const quanToi = h.toiDiTruoc ? "❌" : "⭕";
    if (phong.trangThai === "dong") return phong.roiPhong === h.ban ? "🚪 " + h.ban + " đã rời phòng." : "Phòng đã đóng.";
    if (phong.trangThai === "ket_thuc") {
      if (phong.ketQua === "hoa") return "🤝 Hai bạn hoà nhau!";
      return phong.nguoiThang === h.toi ? "🎉 Con thắng rồi!" : "🏆 " + h.ban + " thắng ván này!";
    }
    if (h.banVangGiay > VANG_LAU) return "📶 " + h.ban + " đang mất kết nối, chờ bạn quay lại nhé...";
    if (dangGui) return "Đang gửi nước đi...";
    if (denLuotToi()) return van.nuocDi.length === 0 ? "Con đi trước! Đặt quân " + quanToi + " nào" : "Lượt của con! Đặt quân " + quanToi + " nhé";
    return "Chờ " + h.ban + " đi...";
  }

  function veNutTheoCheDo() {
    const haiMay = cheDo === "hai_may";
    document.querySelectorAll(".crChi2May").forEach(n => { n.style.display = haiMay ? "" : "none"; });
    $("crNutVanMoi").style.display = haiMay ? "none" : "";
    $("crNutDoiDoiThu").style.display = haiMay ? "none" : "";
    $("crNutDoiDoiThu").textContent = cheDo === "may" ? "🎚️ Đổi đối thủ" : "🎚️ Chọn cách chơi khác";
    $("crNutKetQuaDoi").textContent = cheDo === "hai_may" ? "🚪 Rời phòng" : (cheDo === "may" ? "🎚️ Đổi đối thủ" : "🎚️ Chọn cách chơi khác");
    if (haiMay && phong) {
      const dangChoi = phong.trangThai === "dang_choi";
      $("crNutXinHoa").style.display = dangChoi ? "" : "none";
      $("crNutChiuThua").style.display = dangChoi ? "" : "none";
      $("crNutXinHoa").disabled = phong.xinHoa === tk.tenDangNhap;
      $("crNutXinHoa").textContent = phong.xinHoa === tk.tenDangNhap ? "🤝 Đã xin hoà..." : "🤝 Xin hoà";
    }
  }

  function veHoiHoa() {
    const o = $("crHoiHoa");
    if (cheDo !== "hai_may" || !phong || phong.trangThai !== "dang_choi" || !phong.xinHoa) { o.style.display = "none"; return; }
    const h = VC.haiBenPhong(phong);
    o.style.display = "";
    if (phong.xinHoa === h.ban) {
      $("crHoiHoaChu").textContent = "🤝 " + h.ban + " muốn hoà. Con đồng ý không?";
      $("crHoiHoaNut").style.display = "";
    } else {
      $("crHoiHoaChu").textContent = "Đã gửi lời xin hoà, chờ " + h.ban + " trả lời...";
      $("crHoiHoaNut").style.display = "none";
    }
  }

  function veTatCa() {
    veNguoiChoi(); veBan(); capNhatLuot(); veNutTheoCheDo(); veHoiHoa();
  }

  /* ---------------- CHƠI VỚI MÁY / CHUNG 1 MÁY ---------------- */
  function batDauVan(muc, nuocDiCu) {
    roiPhongNeuCo();
    dongKetQua();
    cheDo = "may";
    doiThu = timDoiThu(muc);
    van = new CR.VanCaro(doiThu.muc);
    if (nuocDiCu) {
      for (const o of nuocDiCu) { if (!van.di(o)) { van = new CR.VanCaro(doiThu.muc); break; } }
      if (van.daXong) van = new CR.VanCaro(doiThu.muc);
    }
    vaoBan();
    luuVanDo();
    if (van.luot === CR.MAY) mayDi();
  }

  function batDauMotMay() {
    roiPhongNeuCo();
    dongKetQua();
    cheDo = "mot_may";
    van = new CR.VanCaro("vua");
    vaoBan();
  }

  function vaoBan() {
    dangNghi = false; oBong = -1; dangGui = false;
    hienKhu("choi");
    $("crGoiYCham").textContent = LA_CHAM ? "Chạm 1 lần để chọn ô, chạm lần nữa vào ô đó để đặt quân." : "";
    if (tapTrung) tapTrung.batNeuDienThoai();
    veTatCa();
  }

  function bamO(o) {
    if (!van || van.daXong || dangNghi || van.ban[o] !== 0) return;
    if (cheDo === "may" && van.luot !== CR.BE) return;
    if (cheDo === "hai_may" && (!denLuotToi() || dangGui)) return;
    if (LA_CHAM && oBong !== o) { oBong = o; veBan(); return; }
    oBong = -1;
    if (cheDo === "hai_may") { diHaiMay(o); return; }
    if (!van.di(o)) return;
    sauNuocDi();
  }

  function sauNuocDi() {
    luuVanDo();
    veBan(); capNhatLuot();
    if (van.daXong) ketThucVan();
    else if (cheDo === "may" && van.luot === CR.MAY) mayDi();
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

  /* ---------------- KẾT THÚC VÁN (máy / chung 1 máy) ---------------- */
  function ketThucVan() {
    const vanNay = van;
    let mucGui = null;
    if (cheDo === "may" && laBe && ketQuaVan) {
      mucGui = ketQuaVan.them({ cheDo: "may", muc: van.muc, ketQua: van.ketQua, nuocDi: van.nuocDi, doiThu: doiThu.ten });
    }
    // để bé kịp thấy 5 quân sáng lên rồi mới hiện khung kết quả
    setTimeout(() => {
      if (van !== vanNay) return;
      hienKetQua(mucGui);
    }, van.ketQua === "hoa" ? 400 : 1100);
  }

  function datKetQua(hinh, tieuDe, loi) {
    $("crKetQuaHinh").textContent = hinh;
    $("crKetQuaTieuDe").textContent = tieuDe;
    $("crKetQuaLoi").textContent = loi;
    $("crKetQuaKimCuong").textContent = "";
    $("crKetQuaCho").textContent = "";
    $("crNutChoiLai").disabled = false;
    $("crNutChoiLai").textContent = "▶ Chơi ván nữa";
    $("crNutChoiLai").style.display = "";
  }

  function moKetQua() {
    veNutTheoCheDo();
    $("crKetQua").classList.add("vcHien");
    if (tapTrung) tapTrung.thoat();
    $("crNutChoiLai").focus();
  }

  function hienKetQua(mucGui) {
    const kq = van.ketQua;
    if (cheDo === "mot_may") {
      if (kq === "hoa") datKetQua("🤝", "Hoà rồi!", "Bàn cờ đầy mà chưa ai xếp được 5 quân. Hai bạn ngang tài!");
      else datKetQua("🏆", (kq === "thang" ? "Bạn ❌" : "Bạn ⭕") + " thắng rồi!", "Ván sau đổi lượt đi trước cho công bằng nhé!");
      moKetQua();
      return;
    }
    const d = doiThu;
    if (kq === "thang") datKetQua("🏆", "Con thắng rồi!", "Con đã thắng " + d.hinh + " " + d.ten + ". Giỏi quá!");
    else if (kq === "thua") datKetQua("💪", d.ten + " thắng ván này!", "Mẹo nhỏ: thấy " + d.ten + " có 3 quân ⭕ liền nhau là chặn ngay nhé. Chơi lại phục thù nào!");
    else datKetQua("🤝", "Hoà rồi!", "Bàn cờ đầy mà chưa ai xếp được 5 quân. Hai bên ngang tài!");
    const oKc = $("crKetQuaKimCuong");
    if (kq === "thang" && !laBe) oKc.textContent = "Tài khoản của bé mới nhận kim cương nhé.";
    if (kq === "thang" && mucGui) oKc.textContent = "Đang cất kim cương vào kho... 💎";
    moKetQua();
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
    const o = $("crKimCuongBe");
    if (o) o.textContent = "💎 " + so;
  }

  function dongKetQua() { $("crKetQua").classList.remove("vcHien"); }

  function taiThanhTich() {
    if (!tk) return;
    VC.layThanhTich(kcGoiRpc, kcDocPhien(), "caro").then(kq => {
      if (kq && kq.thanhCong) thanhTich = kq;
      if ($("crKhuChon").style.display !== "none") veLuoiDoiThu();
    });
  }

  /* ---------------- MỖI BẠN MỘT MÁY: SẢNH ---------------- */
  function baoSanh(chu) { $("crSanhBao").textContent = chu || ""; }

  function moSanh() {
    if (!phongCo) return;
    dongKetQua();
    if (tapTrung) tapTrung.thoat();
    phongCo.ngung(); phong = null;
    hienKhu("sanh");
    $("crSanhCho").style.display = "none";
    $("crSanhChon").style.display = "";
    baoSanh("Đang tìm phòng...");
    phongCo.theoDoiSanh(nhanSanh);
  }

  function nhanSanh(kq) {
    if (!kq || !kq.thanhCong) {
      baoSanh(kq && kq.ma === "phien_het_han" ? "Con đăng nhập lại nhé." : "Chưa kết nối được máy chủ, đang thử lại...");
      return;
    }
    baoSanh("");
    phongCuaToi = kq.phongCuaToi;
    const p = kq.phongCuaToi;
    // bạn đã vào phòng con tạo, hoặc con đang có ván dở: vào bàn luôn
    if (p && (p.trangThai === "dang_choi" || (p.trangThai === "ket_thuc" && $("crSanhCho").style.display !== "none"))) {
      vaoPhongHaiMay(p);
      return;
    }
    if (p && p.trangThai === "mo") {
      $("crSanhCho").style.display = "";
      $("crSanhChon").style.display = "none";
      $("crTenPhongCho").textContent = tk.tenDangNhap;
      return;
    }
    $("crSanhCho").style.display = "none";
    $("crSanhChon").style.display = "";
    veDsPhong(kq.danhSach || []);
  }

  function veDsPhong(ds) {
    const khung = $("crDsPhong");
    khung.innerHTML = "";
    if (!ds.length) {
      khung.innerHTML = '<p class="crSanhTrong">Chưa có phòng nào. Con bấm <strong>Tạo phòng</strong> rồi rủ bạn vào nhé!</p>';
      return;
    }
    ds.forEach(p => {
      const the = document.createElement("button");
      the.type = "button";
      the.className = "crThePhong";
      const av = document.createElement("span");
      av.className = "vcAvatar";
      VC.veAvatar(av, p.avatarChu, "🙂");
      const chu = document.createElement("span");
      chu.className = "crThePhongChu";
      chu.innerHTML = '<span class="crThePhongTen"></span><span class="crThePhongPhu">đang chờ bạn vào chơi</span>';
      chu.querySelector(".crThePhongTen").textContent = "Phòng của " + p.chuPhong;
      const vao = document.createElement("span");
      vao.className = "vcNut crThePhongVao";
      vao.textContent = "▶ Vào chơi";
      the.append(av, chu, vao);
      the.addEventListener("click", () => {
        baoSanh("Đang vào phòng...");
        phongCo.vaoPhong(p.id).then(kq => {
          if (kq && kq.thanhCong && kq.phong) vaoPhongHaiMay(kq.phong);
          else baoSanh(kq && kq.ma === "phong_da_day" ? "Phòng này đã có bạn khác vào rồi." : "Chưa vào được phòng, con thử lại nhé.");
        });
      });
      khung.appendChild(the);
    });
  }

  function taoPhong() {
    baoSanh("Đang tạo phòng...");
    phongCo.taoPhong().then(kq => {
      if (kq && kq.ma === "dang_co_phong" && kq.phong) { vaoPhongHaiMay(kq.phong); return; }
      if (!kq || !kq.thanhCong) { baoSanh("Chưa tạo được phòng, con thử lại nhé."); return; }
      baoSanh("");
      $("crSanhCho").style.display = "";
      $("crSanhChon").style.display = "none";
      $("crTenPhongCho").textContent = tk.tenDangNhap;
    });
  }

  function huyPhongCho() {
    const p = phongCuaToi;
    $("crSanhCho").style.display = "none";
    $("crSanhChon").style.display = "";
    if (p && p.trangThai === "mo") {
      phongCo.theoDoi(p, null);
      phongCo.hanhDong("roi_phong").then(() => { phongCo.ngung(); moSanh(); });
    }
  }

  /* ---------------- MỖI BẠN MỘT MÁY: BÀN CỜ ---------------- */
  function vaoPhongHaiMay(p) {
    phongCo.ngungSanh();
    dongKetQua();
    cheDo = "hai_may";
    phong = null;
    van = new CR.VanCaro("vua");
    daBaoKetQua = p.trangThai === "ket_thuc" ? p.id + "_" + p.vanSo : "";   // vào lại ván đã xong: không hiện lại khung
    vaoBan();
    phongCo.theoDoi(p, nhanPhong);
  }

  /* Dựng lại bàn từ danh sách nước đi của phòng */
  function dungVan(nuocDi) {
    const v = new CR.VanCaro("vua");
    for (const o of nuocDi) { if (!v.di(Number(o))) break; }
    return v;
  }

  function nhanPhong(p) {
    if (cheDo !== "hai_may") return;
    const cu = phong;
    // đang gửi nước đi: bỏ qua bản phòng cũ chưa có nước đó (tránh quân nhấp nháy)
    if (dangGui && cu && p.vanSo === cu.vanSo && p.nuocDi.length < van.nuocDi.length) return;
    phong = p;
    if (!cu || p.vanSo !== cu.vanSo || p.nuocDi.length !== van.nuocDi.length) {
      if (cu && p.vanSo !== cu.vanSo) { dongKetQua(); oBong = -1; if (tapTrung) tapTrung.batNeuDienThoai(); }
      van = dungVan(p.nuocDi);
    }
    veTatCa();
    if (p.trangThai === "ket_thuc" || p.trangThai === "dong") ketThucHaiMay();
  }

  function diHaiMay(o) {
    const soNuoc = van.nuocDi.length;
    if (!van.di(o)) return;
    dangGui = true;
    veTatCa();
    phongCo.di(soNuoc, o).then(kq => {
      dangGui = false;
      if (kq && kq.phong) nhanPhong(kq.phong);
      else {
        // mạng lỗi: bỏ nước tạm, hỏi lại máy chủ
        van = dungVan(phong ? phong.nuocDi : []);
        veTatCa();
        $("crLoiLuot").textContent = "Mạng chập chờn, con đặt lại quân nhé.";
        phongCo.hoiNgay();
      }
    });
  }

  function ketThucHaiMay() {
    const p = phong;
    const ma = p.id + "_" + p.vanSo;
    const h = VC.haiBenPhong(p);
    if (p.trangThai === "dong") {
      if (daBaoKetQua === ma + "_dong") return;
      const daBao = daBaoKetQua === ma;
      daBaoKetQua = ma + "_dong";
      if (p.roiPhong === h.toi) return;
      if (!daBao && p.ketQua) { hienKetQuaHaiMay(p); }
      else datKetQua("🚪", h.ban + " đã rời phòng", "Con tạo phòng mới để chơi tiếp nhé!");
      $("crNutChoiLai").style.display = "none";
      $("crKetQuaCho").textContent = "🚪 " + h.ban + " đã rời phòng.";
      moKetQua();
      return;
    }
    if (daBaoKetQua !== ma) {
      daBaoKetQua = ma;
      const vanNay = ma;
      setTimeout(() => {
        if (!phong || phong.id + "_" + phong.vanSo !== vanNay) return;
        hienKetQuaHaiMay(phong);
        moKetQua();
      }, p.lyDo === "nam_quan" ? 1100 : 300);
      return;
    }
    veChoChoiLai();
  }

  function hienKetQuaHaiMay(p) {
    const h = VC.haiBenPhong(p);
    const lyDo = { nam_quan: "xếp được 5 quân", dau_hang: "", roi_phong: "", dong_y_hoa: "", day_ban: "" };
    if (p.ketQua === "hoa") {
      datKetQua("🤝", "Hoà rồi!", p.lyDo === "dong_y_hoa" ? "Hai bạn đồng ý hoà. Ngang tài ngang sức!" : "Bàn cờ đầy mà chưa ai xếp được 5 quân. Hai bạn ngang tài!");
    } else if (p.nguoiThang === h.toi) {
      datKetQua("🏆", "Con thắng rồi!", p.lyDo === "dau_hang" ? h.ban + " chịu thua. Con giỏi quá!"
        : p.lyDo === "roi_phong" ? h.ban + " đã rời phòng nên con thắng ván này."
        : "Con " + lyDo.nam_quan + " trước " + h.ban + ". Giỏi quá!");
    } else {
      datKetQua("💪", h.ban + " thắng ván này!", "Thua một ván không sao! Mẹo nhỏ: thấy bạn có 3 quân liền nhau là chặn ngay. Chơi ván nữa phục thù nào!");
    }
    const oKc = $("crKetQuaKimCuong");
    const k = p.thuong && p.thuong[h.toi];
    if (!laBe) oKc.textContent = "Tài khoản của bé mới nhận kim cương nhé.";
    else if (!k) oKc.textContent = "";
    else if (k.duNuoc === false) oKc.textContent = "Ván ngắn quá nên chưa có kim cương. Chơi ván dài hơn (từ " + ((thanhTich && thanhTich.soNuocToiThieu2n) || 10) + " nước) là có nhé!";
    else {
      oKc.textContent = loiKimCuong(k);
      if (typeof k.diemSoMoi === "number") capNhatKimCuong(k.diemSoMoi);
    }
    veChoChoiLai();
  }

  function veChoChoiLai() {
    const p = phong;
    if (!p || p.trangThai !== "ket_thuc") return;
    const h = VC.haiBenPhong(p);
    const nut = $("crNutChoiLai");
    const cho = $("crKetQuaCho");
    if (p.muonChoiLai === h.toi) {
      nut.disabled = true; nut.textContent = "⏳ Đang chờ " + h.ban + "...";
      cho.textContent = "Con đã bấm chơi ván nữa. Ván sau " + h.ban + " đi trước.";
    } else if (p.muonChoiLai === h.ban) {
      nut.disabled = false; nut.textContent = "▶ Đồng ý chơi ván nữa";
      cho.textContent = "🙋 " + h.ban + " muốn chơi ván nữa với con!";
    } else {
      nut.disabled = false; nut.textContent = "▶ Chơi ván nữa";
      cho.textContent = h.banVangGiay > VANG_LAU ? "📶 " + h.ban + " đang mất kết nối..." : "";
    }
  }

  function choiLai() {
    if (cheDo === "may") { batDauVan(doiThu.muc); return; }
    if (cheDo === "mot_may") { batDauMotMay(); return; }
    if (!phong) return;
    if (phong.trangThai === "dong") { moSanh(); return; }
    $("crNutChoiLai").disabled = true;
    phongCo.hanhDong("choi_lai");
  }

  /* Rời phòng 2 máy (nếu đang ở trong) trước khi sang chế độ khác */
  function roiPhongNeuCo() {
    if (cheDo === "hai_may" && phongCo && phong) {
      if (phong.trangThai !== "dong") phongCo.hanhDong("roi_phong");
      phongCo.ngung();
    }
    phong = null;
    phongCuaToi = null;
  }

  /* ---------------- HỎI LẠI (chịu thua / rời phòng) ---------------- */
  function hoiLai(viec) {
    const h = phong ? VC.haiBenPhong(phong) : { ban: "bạn" };
    const dangChoi = phong && phong.trangThai === "dang_choi";
    hoiLaiViec = viec;
    if (viec === "dau_hang") {
      $("crHoiLaiHinh").textContent = "🏳️";
      $("crHoiLaiTieuDe").textContent = "Con chịu thua ván này?";
      $("crHoiLaiLoi").textContent = h.ban + " sẽ thắng ván này. Còn nước đi thì cứ cố thêm chút nữa nhé!";
      $("crNutHoiLaiCo").textContent = "🏳️ Chịu thua";
    } else {
      $("crHoiLaiHinh").textContent = "🚪";
      $("crHoiLaiTieuDe").textContent = "Con muốn rời phòng?";
      $("crHoiLaiLoi").textContent = dangChoi ? "Ván đang chơi dở, rời phòng là " + h.ban + " thắng ván này." : "Con có thể tạo phòng mới để chơi tiếp sau.";
      $("crNutHoiLaiCo").textContent = "🚪 Rời phòng";
    }
    $("crHoiLai").classList.add("vcHien");
    $("crNutHoiLaiKhong").focus();
  }
  function dongHoiLai() { $("crHoiLai").classList.remove("vcHien"); hoiLaiViec = null; }
  function xacNhanHoiLai() {
    const viec = hoiLaiViec;
    dongHoiLai();
    if (!phongCo || !phong) return;
    if (viec === "dau_hang") { phongCo.hanhDong("dau_hang"); return; }
    if (viec === "roi_phong") {
      const xong = () => { phongCo.ngung(); phong = null; phongCuaToi = null; cheDo = "may"; dongKetQua(); hienKhuChon(); };
      if (phong.trangThai === "dong") xong();
      else phongCo.hanhDong("roi_phong").then(xong);
    }
  }

  /* ---------------- KHỞI ĐỘNG ---------------- */
  document.addEventListener("DOMContentLoaded", () => {
    taoBan();
    tapTrung = new VC.TapTrung(() => !!(van && !van.daXong && $("crKhuChoi").style.display !== "none"), $("crNutHang"));
    $("crNutVanMoi").addEventListener("click", () => (cheDo === "mot_may" ? batDauMotMay() : batDauVan(doiThu.muc)));
    $("crNutDoiDoiThu").addEventListener("click", hienKhuChon);
    $("crNutChoiTiep").addEventListener("click", () => { const v = docVanDo(); if (v) batDauVan(v.muc, v.nuocDi); });
    $("crNutChoiLai").addEventListener("click", choiLai);
    $("crNutXemBan").addEventListener("click", dongKetQua);
    $("crNutKetQuaDoi").addEventListener("click", () => {
      if (cheDo === "hai_may") {
        if (phong && phong.trangThai === "dang_choi") hoiLai("roi_phong");
        else { hoiLaiViec = "roi_phong"; xacNhanHoiLai(); }   // hết ván rồi: rời luôn, khỏi hỏi
        return;
      }
      dongKetQua(); hienKhuChon();
    });
    $("crKetQua").addEventListener("click", su => { if (su.target === $("crKetQua")) dongKetQua(); });
    $("crHoiLai").addEventListener("click", su => { if (su.target === $("crHoiLai")) dongHoiLai(); });
    document.addEventListener("keydown", su => { if (su.key === "Escape") { dongKetQua(); dongHoiLai(); } });
    // TC_02B: chơi với bạn
    $("crTheMotMay").addEventListener("click", batDauMotMay);
    $("crTheHaiMay").addEventListener("click", () => { roiPhongNeuCo(); moSanh(); });
    $("crNutVaoLai").addEventListener("click", () => { if (phongCuaToi) vaoPhongHaiMay(phongCuaToi); });
    $("crNutTaoPhong").addEventListener("click", taoPhong);
    $("crNutHuyPhong").addEventListener("click", huyPhongCho);
    $("crNutRoiSanh").addEventListener("click", () => { cheDo = "may"; hienKhuChon(); });
    $("crNutXinHoa").addEventListener("click", () => { if (phongCo && phong) phongCo.hanhDong("xin_hoa"); });
    $("crNutDongYHoa").addEventListener("click", () => { if (phongCo && phong) phongCo.hanhDong("dong_y_hoa"); });
    $("crNutTuChoiHoa").addEventListener("click", () => { if (phongCo && phong) phongCo.hanhDong("tu_choi_hoa"); });
    $("crNutChiuThua").addEventListener("click", () => hoiLai("dau_hang"));
    $("crNutRoiPhong").addEventListener("click", () => hoiLai("roi_phong"));
    $("crNutHoiLaiCo").addEventListener("click", xacNhanHoiLai);
    $("crNutHoiLaiKhong").addEventListener("click", dongHoiLai);
  });

  document.addEventListener("kcSanSang", su => {
    const ct = su.detail || {};
    if (!ct.daDangNhap || !ct.taiKhoan) { tk = null; return; }
    tk = ct.taiKhoan;
    laBe = tk.vaiTro === "tre";
    ketQuaVan = new VC.KetQuaVan("caro", laBe ? tk.tenDangNhap : "", kcGoiRpc, kcDocPhien);
    phongCo = new VC.PhongCo("caro", kcGoiRpc, kcDocPhien, typeof kcSupabaseClient !== "undefined" ? kcSupabaseClient : null);
    hienKhuChon();
    // ván đã xong lúc mất mạng: gửi bù
    ketQuaVan.gui().then(r => { if (typeof r.diemSoMoi === "number") capNhatKimCuong(r.diemSoMoi); });
    taiThanhTich();
  });
})();
// 21/10/2026 21:00 - BƯỚC: TC_02B (chơi 2 người chung 1 máy + 2 máy) | 21/10/2026 19:20 - BƯỚC: TC_02A (lời báo kim cương nói rõ số) | 21/10/2026 18:20 - BƯỚC: TC_02A
