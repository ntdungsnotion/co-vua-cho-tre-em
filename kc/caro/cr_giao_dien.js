/* ================================================================
   FILE: caro/cr_giao_dien.js
   CHỨC NĂNG: Giao diện trang game_caro.html, 3 chế độ chơi:
              - "may"     : bé đấu với máy, thắng được kim cương (TC_02A, gửi kết quả qua
                            chung/vc_van_co.js). TC_02C: THANG 20 CẤP giống Cờ Vua - bé chỉ chọn
                            máy cấp <= cấp của mình (cấp cao hơn có 🔒), mở trang chọn sẵn cấp của
                            bé; thắng máy ĐÚNG cấp của mình thì lên cấp (pháo hoa), máy chủ giữ cấp
                            (kc_co_thanh_tich.cap). Phụ huynh / admin mở sẵn mọi cấp để chơi thử.
                            Cấp 6-20 nghĩ trong Web Worker caro/cr_may_nghi.js (không đơ màn hình);
                            máy luôn "nghĩ" tối thiểu một lúc (giống nhịp Cờ Vua 4.11).
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
   BƯỚC: TC_02A | TC_02B (chơi 2 người chung 1 máy + 2 máy) | TC_02C (20 cấp + Web Worker) | TC_02D (thông báo ghi rõ số 💎)
         | TC_03C (sảnh: xoá thẻ phòng cũ khi mở lại, phòng đã đóng thì báo chứ không vào)
   NGÀY: 21/10/2026 18:20 | 21/10/2026 21:00 | 21/10/2026 23:22 | 22/10/2026 07:20 | 23/10/2026 12:45
   PHỤ THUỘC: kc_auth.js (sự kiện kcSanSang, kcDocPhien, kcLuuPhien), kc_api.js (kcGoiRpc),
              kc_config.js (kcSupabaseClient), chung/vc_van_co.js + chung/vc_phong_co.js (VC),
              caro/cr_logic.js (CR), caro/cr_may_nghi.js (Worker, nạp khi cần).
   ================================================================ */
(function () {
  "use strict";
  const THUONG_CAP = { coBan: 2, moiCap: 1 };          // mặc định: thắng máy cấp N được 2 + N 💎
  /* Nhịp nghĩ tối thiểu của máy (ms) = toiThieu + (cấp - 1) x moiCap + ngẫu nhiên(0..ngauNhien),
     chặn trần toiDa - giống luật Cờ Vua 4.11 nhưng nhanh hơn cho cấp thấp (Caro đi nhiều nước). */
  const NGHI = { toiThieu: 600, moiCap: 50, ngauNhien: 500, toiDa: 4000 };
  const THUONG_2N = { thang: 3, hoa: 2, thua: 1 };   // mặc định khi chưa đọc được cấu hình
  const VANG_LAU = 20;                                 // giây: bạn không còn hỏi phòng -> báo mất kết nối
  const LA_CHAM = !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
  const $ = id => document.getElementById(id);

  let tk = null;              // tài khoản đang đăng nhập
  let laBe = false;           // vai trò 'tre' -> được ghi ván + nhận kim cương
  let cheDo = "may";          // "may" | "mot_may" | "hai_may"
  let van = null;             // CR.VanCaro đang chơi (CR.BE = người đi trước ❌, CR.MAY = người đi sau ⭕)
  let doiThu = CR.CAP[1];     // cấp máy đang đấu (CR.CAP[n]: cap, muc, hinh, ten)
  let capBe = 1;              // cấp của bé (máy chủ giữ; phụ huynh / admin = capToiDa)
  let capToiDa = CR.CAP_TOI_DA;
  let dangNghi = false;       // máy đang nghĩ
  let mayNghi = null;         // Web Worker máy nghĩ (cấp 6-20)
  let mayNghiHong = false;    // Worker không chạy được (vd mở file://) -> nghĩ ở luồng chính
  let choNghi = null;         // {id, xong, hen} câu hỏi đang chờ Worker trả lời
  let soHoiNghi = 0;
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

  const timDoiThu = muc => CR.CAP[CR.capCuaMuc(muc)] || CR.CAP[1];
  const khoaVanDo = () => "kc_caro_van_do_" + (tk ? tk.tenDangNhap : "khach");
  const khoaCap = () => "kc_caro_cap_" + (tk ? tk.tenDangNhap : "khach");
  const thuong2n = () => (thanhTich && thanhTich.thuong2n) || THUONG_2N;
  const thuongCap = cap => {
    const t = (thanhTich && thanhTich.thuongCap) || THUONG_CAP;
    return t.coBan + t.moiCap * cap;
  };

  /* Cấp của bé: nhớ trên máy để mất mạng vẫn thấy đúng cấp đã mở */
  function datCapBe(n) {
    capBe = Math.max(1, Math.min(capToiDa, Number(n) || 1));
    if (!laBe) return;
    try { localStorage.setItem(khoaCap(), String(capBe)); } catch (e) { /* chặn lưu: bỏ qua */ }
  }
  function docCapDaLuu() {
    try { return Number(localStorage.getItem(khoaCap())) || 1; } catch (e) { return 1; }
  }

  function hienKhu(ten) {
    $("crKhuChon").style.display = ten === "chon" ? "" : "none";
    $("crKhuSanh").style.display = ten === "sanh" ? "" : "none";
    $("crKhuChoi").style.display = ten === "choi" ? "" : "none";
    if (ten !== "sanh" && phongCo) phongCo.ngungSanh();
  }

  /* ---------------- CHỌN CẤP MÁY / CHẾ ĐỘ (TC_02C: thang 20 cấp) ---------------- */
  function veLuoiDoiThu() {
    // Thẻ "Cấp của con": cấp hiện tại + đấu ngay + lời nhắc lên cấp
    const c = CR.CAP[capBe];
    $("crCapBeHinh").textContent = c.hinh;
    $("crCapBeSo").textContent = "Cấp " + capBe;
    $("crCapBeTen").textContent = c.ten;
    const sau = CR.CAP[capBe + 1];
    $("crCapBeLoi").textContent = !laBe ? "Tài khoản phụ huynh / quản trị: mở sẵn cả " + capToiDa + " cấp để chơi thử."
      : capBe >= capToiDa ? "Con đã lên cấp cao nhất! Thắng " + c.ten + " thêm nhiều lần nữa nhé."
      : "Thắng " + c.hinh + " " + c.ten + " là con lên cấp " + (capBe + 1) + " và gặp " + sau.hinh + " " + sau.ten + "!";
    $("crNutDauCapBe").textContent = "▶ Đấu " + c.hinh + " " + c.ten;
    $("crCapBeThuong").textContent = laBe ? "Thắng: " + thuongCap(capBe) + " 💎" : "";
    $("crCapBeThuong").style.display = laBe ? "" : "none";

    // Lưới 20 cấp: cấp đã mở bấm là vào ván, cấp chưa mở có 🔒
    const luoi = $("crLuoiCap");
    luoi.innerHTML = "";
    for (let n = 1; n <= capToiDa; n++) {
      const d = CR.CAP[n];
      if (!d) break;
      const mo = n <= capBe;
      const tc = thanhTich && thanhTich.theoCap && thanhTich.theoCap[n];
      const soThang = tc ? tc.thang : 0;
      const the = document.createElement("button");
      the.type = "button";
      the.className = "crTheCap" + (mo ? "" : " crCapKhoa") + (n === capBe && laBe ? " crCapCuaCon" : "");
      the.disabled = !mo;
      the.title = mo ? "Đấu " + d.ten + " (cấp " + n + ")" : "Thắng cấp " + (n - 1) + " để mở";
      the.innerHTML =
        '<span class="crTheCapHinh">' + d.hinh + "</span>" +
        '<span class="crTheCapSo">Cấp ' + n + "</span>" +
        '<span class="crTheCapTen">' + d.ten + "</span>" +
        (mo && laBe ? '<span class="crTheCapThuong">+' + thuongCap(n) + " 💎</span>" : "") +
        (soThang ? '<span class="crTheCapThang">🏆 ' + soThang + "</span>" : "") +
        (mo ? "" : '<span class="crTheCapKhoaHinh">🔒</span>');
      if (mo) the.addEventListener("click", () => batDauVan(d.muc));
      luoi.appendChild(the);
    }
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
  /* Chỉ nhận ván dở theo cấp (TC_02C) và cấp đó đã mở; ván dở kiểu mức cũ (de/vua/kho) bỏ */
  function docVanDo() {
    try {
      const v = JSON.parse(localStorage.getItem(khoaVanDo()) || "null");
      const cap = v ? CR.capCuaMuc(v.muc) : 0;
      if (cap && cap <= capBe && Array.isArray(v.nuocDi) && v.nuocDi.length) return v;
    } catch (e) { /* hỏng thì bỏ */ }
    return null;
  }
  function veNutVanDo() {
    const v = docVanDo();
    $("crVanDo").style.display = v ? "" : "none";
    if (v) {
      const d = timDoiThu(v.muc);
      $("crNutChoiTiep").textContent = "▶ Chơi tiếp ván đang dở với " + d.hinh + " " + d.ten + " (cấp " + d.cap + ")";
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
               { ten: doiThu.ten, avatar: doiThu.hinh, phu: "quân ⭕ · cấp " + doiThu.cap });
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
    $("crNutDoiDoiThu").textContent = cheDo === "may" ? "🎚️ Đổi cấp" : "🎚️ Chọn cách chơi khác";
    $("crNutKetQuaDoi").textContent = cheDo === "hai_may" ? "🚪 Rời phòng" : (cheDo === "may" ? "🎚️ Đổi cấp" : "🎚️ Chọn cách chơi khác");
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
    huyMayNghi();
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
    huyMayNghi();
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

  /* Máy đi: cấp 1-5 nghĩ ngay ở luồng chính (nhẹ); cấp 6-20 hỏi Worker. Dù nghĩ xong sớm,
     vẫn giữ đủ nhịp nghĩ tối thiểu mới đặt quân (giống Cờ Vua 4.11). */
  function mayDi() {
    dangNghi = true;
    veBan(); capNhatLuot();
    const vanNay = van;
    const cap = CR.capCuaMuc(van.muc) || 1;
    const batDau = Date.now();
    const nghiToiThieu = Math.min(NGHI.toiDa, NGHI.toiThieu + (cap - 1) * NGHI.moiCap + Math.random() * NGHI.ngauNhien);
    const datQuan = o => {
      setTimeout(() => {
        if (van !== vanNay) return;        // bé đã bấm ván mới trong lúc máy nghĩ
        if (!(o >= 0 && van.ban[o] === 0 && van.di(o))) van.mayDi();   // Worker lỗi: bộ não cũ
        dangNghi = false;
        sauNuocDi();
      }, Math.max(0, nghiToiThieu - (Date.now() - batDau)));
    };
    if (CR.CAP[cap] && CR.CAP[cap].dungEngine) hoiMayNghi(van.nuocDi, cap).then(datQuan);
    else datQuan(-1);
  }

  /* ---------------- WEB WORKER MÁY NGHĨ (cấp 6-20) ---------------- */
  /* -> Promise<ô máy đi>; -1 = Worker không chạy được / quá lâu (trang tự đi bằng bộ não cũ),
     -2 = đã huỷ vì bé sang ván khác. Mỗi lúc chỉ một câu hỏi. */
  function hoiMayNghi(nuocDi, cap) {
    return new Promise(xong => {
      huyMayNghi();
      if (mayNghiHong || typeof Worker === "undefined") { xong(-1); return; }
      try {
        if (!mayNghi) {
          mayNghi = new Worker("caro/cr_may_nghi.js");
          mayNghi.onmessage = su => {
            const d = su.data || {};
            if (!choNghi || d.id !== choNghi.id) return;
            const c = choNghi; choNghi = null; clearTimeout(c.hen);
            c.xong(typeof d.o === "number" ? d.o : -1);
          };
          mayNghi.onerror = () => {
            mayNghiHong = true;
            const c = choNghi; choNghi = null; boMayNghi();
            if (c) { clearTimeout(c.hen); c.xong(-1); }
          };
        }
      } catch (e) { mayNghiHong = true; xong(-1); return; }
      const id = ++soHoiNghi;
      choNghi = { id, xong, hen: setTimeout(() => {
        if (!choNghi || choNghi.id !== id) return;
        choNghi = null; boMayNghi(); xong(-1);
      }, 15000) };
      mayNghi.postMessage({ id, nuocDi: nuocDi.slice(), cap });
    });
  }
  function boMayNghi() { if (mayNghi) { mayNghi.terminate(); mayNghi = null; } }
  /* Bé sang ván khác khi máy đang nghĩ: dừng hẳn Worker (đỡ tốn pin), lần sau tạo lại */
  function huyMayNghi() {
    if (!choNghi) return;
    const c = choNghi; choNghi = null; clearTimeout(c.hen);
    boMayNghi();
    c.xong(-2);
  }

  /* ---------------- KẾT THÚC VÁN (máy / chung 1 máy) ---------------- */
  function ketThucVan() {
    const vanNay = van;
    let mucGui = null;
    // Giống Cờ Vua: thắng máy ĐÚNG cấp của mình -> lên cấp (máy chủ chốt lại khi nhận kết quả)
    const capVan = CR.capCuaMuc(van.muc);
    const lenCap = cheDo === "may" && laBe && van.ketQua === "thang" && capVan === capBe && capBe < capToiDa;
    if (lenCap) datCapBe(capBe + 1);
    if (cheDo === "may" && laBe && ketQuaVan) {
      mucGui = ketQuaVan.them({ cheDo: "may", muc: van.muc, ketQua: van.ketQua, nuocDi: van.nuocDi, doiThu: doiThu.ten });
    }
    // để bé kịp thấy 5 quân sáng lên rồi mới hiện khung kết quả
    setTimeout(() => {
      if (van !== vanNay) return;
      hienKetQua(mucGui, lenCap);
    }, van.ketQua === "hoa" ? 400 : 1100);
  }

  function datKetQua(hinh, tieuDe, loi) {
    $("crKetQua").classList.remove("crLenCap");
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

  function hienKetQua(mucGui, lenCap) {
    const kq = van.ketQua;
    if (cheDo === "mot_may") {
      if (kq === "hoa") datKetQua("🤝", "Hoà rồi!", "Bàn cờ đầy mà chưa ai xếp được 5 quân. Hai bạn ngang tài!");
      else datKetQua("🏆", (kq === "thang" ? "Bạn ❌" : "Bạn ⭕") + " thắng rồi!", "Ván sau đổi lượt đi trước cho công bằng nhé!");
      moKetQua();
      return;
    }
    const d = doiThu;
    if (kq === "thang" && lenCap) {
      const moi = CR.CAP[capBe];
      datKetQua("🎆", "Lên cấp " + capBe + "!", "Con đã thắng " + d.hinh + " " + d.ten + " và mở khoá cấp " + capBe +
        ": " + moi.hinh + " " + moi.ten + ". Giỏi quá!");
      $("crNutChoiLai").textContent = "▶ Đấu " + moi.hinh + " " + moi.ten;
      $("crKetQua").classList.add("crLenCap");
      phaoHoa();
    }
    else if (kq === "thang") datKetQua("🏆", "Con thắng rồi!", "Con đã thắng " + d.hinh + " " + d.ten + ". Giỏi quá!");
    else if (kq === "thua") datKetQua("💪", d.ten + " thắng ván này!", "Mẹo nhỏ: thấy " + d.ten + " có 3 quân ⭕ liền nhau là chặn ngay nhé. Chơi lại phục thù nào!");
    else datKetQua("🤝", "Hoà rồi!", "Bàn cờ đầy mà chưa ai xếp được 5 quân. Hai bên ngang tài!");
    const oKc = $("crKetQuaKimCuong");
    if (kq === "thang" && !laBe) oKc.textContent = "Tài khoản của bé mới nhận " + thuongCap(d.cap) + " kim cương nhé.";
    if (kq === "thang" && mucGui) oKc.textContent = "Đang cất kim cương vào kho... 💎";
    moKetQua();
    if (mucGui) guiKetQua(mucGui);
  }

  /* Pháo hoa khi lên cấp: emoji rơi vài giây (tắt nếu máy đặt "giảm chuyển động") */
  function phaoHoa() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const khung = document.createElement("div");
    khung.className = "crPhaoHoa";
    khung.setAttribute("aria-hidden", "true");
    const HINH = ["🎉", "✨", "⭐", "🎊", "💎", "🌟"];
    for (let i = 0; i < 30; i++) {
      const s = document.createElement("span");
      s.textContent = HINH[i % HINH.length];
      s.style.left = (Math.random() * 100) + "%";
      s.style.animationDelay = (Math.random() * 0.9).toFixed(2) + "s";
      s.style.animationDuration = (1.8 + Math.random() * 1.2).toFixed(2) + "s";
      s.style.fontSize = (1.2 + Math.random() * 1.3).toFixed(2) + "rem";
      khung.appendChild(s);
    }
    document.body.appendChild(khung);
    setTimeout(() => khung.remove(), 3600);
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
      // máy chủ giữ cấp: nghe theo máy chủ (vd ván bị từ chối thì cấp không đổi)
      if (k && typeof k.cap === "number") { datCapBe(k.cap); if (typeof k.capToiDa === "number") capToiDa = k.capToiDa; }
      if (mucGui.ketQua !== "thang") { taiThanhTich(); return; }
      const thuong = thuongCap(CR.capCuaMuc(mucGui.muc) || 1);
      if (!k) oKc.textContent = "Mạng đang chập chờn, " + thuong + " kim cương của ván này sẽ tự vào kho khi có mạng nhé.";
      else if (k.hopLe === false || k.thanhCong === false) oKc.textContent = "Ván này máy chủ chưa ghi nhận được, con chơi ván khác nhé.";
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
    if (!tk) return Promise.resolve();
    return VC.layThanhTich(kcGoiRpc, kcDocPhien(), "caro").then(kq => {
      if (kq && kq.thanhCong) {
        thanhTich = kq;
        if (typeof kq.capToiDa === "number") capToiDa = Math.max(1, Math.min(CR.CAP_TOI_DA, kq.capToiDa));
        if (typeof kq.cap === "number") datCapBe(kq.cap);
      }
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
    $("crDsPhong").innerHTML = "";        // TC_03C: không để thẻ phòng của lần trước (có thể đã đóng) cho bé bấm nhầm
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
          if (kq && kq.thanhCong && kq.phong && ["dong", "huy"].indexOf(kq.phong.trangThai) !== -1) baoSanh("Phòng này đã đóng, con chọn phòng khác nhé.");
          else if (kq && kq.thanhCong && kq.phong) vaoPhongHaiMay(kq.phong);
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
    huyMayNghi();
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
    if (!laBe) oKc.textContent = "Tài khoản của bé mới nhận " +
      thuong2n()[p.ketQua === "hoa" ? "hoa" : p.nguoiThang === h.toi ? "thang" : "thua"] + " kim cương nhé.";
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
    // vừa lên cấp: "Chơi ván nữa" là đấu luôn nhân vật cấp mới
    if (cheDo === "may") { batDauVan($("crKetQua").classList.contains("crLenCap") ? CR.CAP[capBe].muc : doiThu.muc); return; }
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
    $("crNutDauCapBe").addEventListener("click", () => batDauVan(CR.CAP[capBe].muc));   // TC_02C
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
    // TC_02C: cấp tạm (đã nhớ trên máy) cho tới khi máy chủ trả lời; phụ huynh / admin mở mọi cấp
    capToiDa = CR.CAP_TOI_DA;
    capBe = laBe ? Math.min(capToiDa, docCapDaLuu()) : capToiDa;
    ketQuaVan = new VC.KetQuaVan("caro", laBe ? tk.tenDangNhap : "", kcGoiRpc, kcDocPhien);
    phongCo = new VC.PhongCo("caro", kcGoiRpc, kcDocPhien, typeof kcSupabaseClient !== "undefined" ? kcSupabaseClient : null);
    hienKhuChon();
    // ván đã xong lúc mất mạng: gửi bù TRƯỚC rồi mới hỏi thành tích (ván thắng lên cấp được ghi trước)
    ketQuaVan.gui().then(r => { if (typeof r.diemSoMoi === "number") capNhatKimCuong(r.diemSoMoi); }).then(taiThanhTich);
  });
})();
// 23/10/2026 12:45 - BƯỚC: TC_03C (sảnh 2 máy: thẻ phòng cũ, phòng đã đóng) | 21/10/2026 23:22 - BƯỚC: TC_02C (20 cấp + Web Worker) | 21/10/2026 21:00 - BƯỚC: TC_02B (chơi 2 người chung 1 máy + 2 máy) | 21/10/2026 19:20 - BƯỚC: TC_02A (lời báo kim cương nói rõ số) | 21/10/2026 18:20 - BƯỚC: TC_02A
