/* ================================================================
   FILE: co_tuong/ct_giao_dien.js
   CHỨC NĂNG: Giao diện trang game_co_tuong.html - bé (quân Đỏ, đi trước) đấu với máy (Đen).
              - THANG 20 CẤP giống Cờ Vua / Cờ Caro: bé chỉ chọn máy cấp <= cấp của mình (cấp
                cao hơn có 🔒), mở trang chọn sẵn cấp của bé; thắng máy ĐÚNG cấp của mình thì lên
                cấp (pháo hoa), máy chủ giữ cấp (kc_co_thanh_tich.cap, game 'co_tuong').
                Phụ huynh / admin mở sẵn mọi cấp để chơi thử.
              - Bấm quân của con -> chấm xanh ở các chỗ đi được (vòng xanh = ăn được quân) ->
                bấm chấm là đi; bấm quân khác của con để đổi quân. Nước vừa đi có viền cam,
                Tướng bị chiếu nhấp nháy đỏ.
              - Máy nghĩ trong Web Worker co_tuong/ct_may_nghi.js (không đơ màn hình); Worker
                hỏng thì nạp ct_bo_nao.js nghĩ ở luồng chính. Máy luôn "nghĩ" tối thiểu một
                lúc (giống nhịp Cờ Vua 4.11).
              - Quân ghi chữ Việt (mặc định, bé lớp 1 đọc được) hoặc chữ Hán; nhớ trên máy.
              - Ván dở lưu localStorage (kc_cotuong_van_do_<tên>), tải lại trang chơi tiếp được.
              - Thắng / thua / hoà / chịu thua gửi qua VC.KetQuaVan (máy chủ kiểm ván thắng
                theo luật cờ tướng rồi mới cộng kim cương). Chỉ tài khoản bé nhận kim cương.
              - TC_03D: TRỢ LÝ 🦉 khen / động viên giống Cờ Vua (chung/vc_tro_ly.js): câu hiện ở ô
                lời lượt + đọc thành tiếng. Khen theo CẤP Cờ Tướng của bé (phụ huynh / admin: theo
                cấp máy đang đấu để xem thử); máy chỉ đi sau khi câu khen đọc xong (lưới an toàn
                15 giây); bé chạm bàn cờ là tắt tiếng ngay. Câu sự kiện: bắt đầu ván, thắng, thua,
                hoà, lên cấp. Câu lấy từ bảng kc_loi_dong_vien (quản trị sửa), thiếu thì dùng LOI_MAC_DINH.
              - TC_03E: NÚT "💡 GỢI Ý" giống Cờ Vua (chung/vc_goi_y.js): bộ não tìm nước tốt nhất
                (trong Worker), NHẤP NHÁY ô quân nên đi + ô đến, KHÔNG đi thay bé. Lượt / giá theo
                cấp của bé, máy chủ trừ kim cương + đếm lượt theo mã ván (lưu cùng ván dở). Bé lâu
                không đi (cấp thấp): 🦉 hỏi "Con có cần gợi ý không?" + nút nhấp nháy, mỗi lượt 1 lần;
                chạm bàn cờ là thôi.
              - TC_03C: CHƠI 2 NGƯỜI, MỖI BẠN MỘT MÁY (cheDo "hai_may", người dùng chốt chỉ làm
                chế độ này) qua phòng chơi chung game cờ chung/vc_phong_co.js: sảnh (tạo phòng /
                danh sách phòng đang chờ), máy chủ giữ luật + tự chốt ván + cộng kim cương cho cả
                2 bé (thắng / hoà / thua). Người đi trước cầm quân Đỏ, mỗi ván mới đổi người.
                Bé cầm Đen thì bàn XOAY NGƯỢC (quân của con luôn ở dưới). Chơi 2 người không có
                nút Gợi Ý (công bằng), trợ lý 🦉 không khen; có Xin hoà / Chịu thua / Rời phòng.
   BƯỚC: TC_03A
   NGÀY: 22/10/2026 21:10
   CẬP NHẬT: 22/10/2026 22:40 - TC_03D (trợ lý 🦉 khen / động viên)
   CẬP NHẬT: 23/10/2026 07:40 - TC_03E (nút Gợi Ý + câu nhắc gợi ý)
   CẬP NHẬT: 23/10/2026 11:50 - TC_03C (chơi 2 người, mỗi bạn một máy)
   PHỤ THUỘC: kc_auth.js (sự kiện kcSanSang, kcDocPhien, kcLuuPhien), kc_api.js (kcGoiRpc),
              kc_config.js (kcSupabaseClient), chung/vc_van_co.js (VC), chung/vc_phong_co.js (VC.PhongCo),
              chung/vc_tro_ly.js (VC.giong, VC.LoiDongVien), chung/vc_goi_y.js (VC.GoiY, VC.taoMaVan),
              co_tuong/ct_logic.js (CT), co_tuong/ct_may_nghi.js (Worker).
   ================================================================ */
(function () {
  "use strict";
  const TRO_CHOI = "co_tuong";
  const THUONG_CAP = { coBan: 2, moiCap: 1 };          // mặc định: thắng máy cấp N được 2 + N 💎
  /* Nhịp nghĩ tối thiểu của máy (ms) = toiThieu + (cấp - 1) x moiCap + ngẫu nhiên(0..ngauNhien) */
  const NGHI = { toiThieu: 700, moiCap: 40, ngauNhien: 600, toiDa: 3500 };
  const $ = id => document.getElementById(id);

  let tk = null;              // tài khoản đang đăng nhập
  let laBe = false;           // vai trò 'tre' -> được ghi ván + nhận kim cương
  let van = null;             // CT.VanCoTuong đang chơi
  let doiThu = CT.CAP[1];     // cấp máy đang đấu
  let capBe = 1;              // cấp của bé (máy chủ giữ; phụ huynh / admin = capToiDa)
  let capToiDa = CT.CAP_TOI_DA;
  let dangNghi = false;
  let mayNghi = null;         // Web Worker
  let mayNghiHong = false;
  let choNghi = null;         // {id, xong, hen}
  let soHoiNghi = 0;
  let oChon = -1;             // ô quân đang chọn
  let dichChon = [];          // các ô quân đang chọn đi được
  let chuViet = true;         // quân ghi chữ Việt hay chữ Hán
  let ketQuaVan = null;       // VC.KetQuaVan
  let tapTrung = null;        // VC.TapTrung
  let thanhTich = null;       // kết quả kc_co_thanh_tich
  const oBan = [];

  /* ---- TC_03C: mỗi bạn một máy ---- */
  const THUONG_2N = { thang: 3, hoa: 2, thua: 1 };   // mặc định khi chưa đọc được cấu hình
  const VANG_LAU = 20;        // giây: bạn không còn hỏi phòng -> báo mất kết nối
  let cheDo = "may";          // "may" | "hai_may"
  let phongCo = null;         // VC.PhongCo
  let phong = null;           // phòng đang chơi (máy chủ trả về)
  let dangGui = false;        // nước đi đang gửi lên máy chủ
  let daBaoKetQua = "";       // "<id>_<vanSo>" của ván đã hiện khung kết quả
  let phongCuaToi = null;     // phòng chưa xong (từ sảnh) để "Vào lại"
  let hoiLaiViec = null;      // việc chờ bé xác nhận ở khung hỏi lại: "dau_hang" | "roi_phong"
  let latBan = false;         // bàn đang xoay ngược (con cầm Đen)
  const thuong2n = () => (thanhTich && thanhTich.thuong2n) || THUONG_2N;
  /* Bên quân của con: chơi với máy luôn Đỏ; 2 máy theo phòng (người đi trước cầm Đỏ) */
  const benToi = () => (cheDo === "hai_may" && phong && !VC.haiBenPhong(phong).toiDiTruoc ? CT.DEN : CT.DO);
  /* Con được bấm bàn cờ lúc này không */
  function denLuotToi() {
    if (!van || van.daXong || van.luot !== benToi()) return false;
    if (cheDo !== "hai_may") return !dangNghi;
    return !!phong && phong.trangThai === "dang_choi" && !dangGui;
  }

  /* ---- TC_03D: trợ lý 🦉 ---- */
  /* Câu dự phòng khi bảng kc_loi_dong_vien chưa có câu / mất mạng (giống câu gieo trong SQL TC_03D) */
  const LOI_MAC_DINH = {
    chao_hoi: ["Xin chào! Chúc con chơi cờ tướng thật vui nhé."],
    bat_dau_van: ["Bắt đầu ván mới! Con cầm quân Đỏ, đi trước nhé."],
    nuoc_thuong: ["Con đi hay lắm!", "Giỏi quá, tiếp tục nhé!", "Cố lên, con làm tốt lắm!"],
    an_quan: ["Ăn quân giỏi quá!", "Hay lắm, con bắt được một quân rồi!"],
    chieu_tuong: ["Chiếu tướng! Con giỏi quá!"],
    bi_an_quan: ["Không sao đâu, mất một quân vẫn còn cơ hội. Cố lên con!"],
    bi_chieu: ["Cẩn thận, Tướng của con đang bị chiếu đấy!"],
    thang_van: ["Con thắng rồi! Giỏi quá đi!"],
    thua_van: ["Ván này máy thắng rồi. Không sao, ván sau con cố lên nhé!"],
    hoa_van: ["Hoà rồi! Hai bên ngang tài ngang sức."],
    len_cap: ["Chúc mừng con đã lên cấp mới! Tuyệt vời!"],
    hoi_goi_y: ["Con có cần gợi ý không? Bấm nút Gợi Ý nhé!"]
  };
  const troLy = new VC.LoiDongVien(TRO_CHOI, LOI_MAC_DINH);
  let loiTroLy = "";          // câu trợ lý đang hiện ở ô lời lượt
  let henTroLy = null;
  /* Khen theo cấp Cờ Tướng của bé; phụ huynh / admin (mở sẵn mọi cấp) theo cấp máy đang đấu */
  const capKhen = () => (laBe ? capBe : doiThu.cap);
  const demQuan = () => { let n = 0; for (let o = 0; o < CT.SO_O; o++) if (van.quan(o)) n++; return n; };

  /* ---- TC_03E: gợi ý ---- */
  let goiY = null;            // VC.GoiY (tạo khi biết tài khoản)
  let maVan = "";             // mã ván cho máy chủ đếm lượt gợi ý
  let dangGoiY = false;       // đang hỏi máy chủ + bộ não (khoá bàn ~1 giây)
  let oGoiYTu = -1, oGoiYDen = -1;   // 2 ô đang nhấp nháy
  let loiGoiY = "";           // lời gợi ý / lời báo hết lượt ở ô lời lượt (tới nước sau)
  let henHoi = null;          // hẹn giờ hỏi "Con có cần gợi ý không?"
  let daHoiLuotNay = false;   // mỗi lượt chỉ hỏi 1 lần

  const timDoiThu = muc => CT.CAP[CT.capCuaMuc(muc)] || CT.CAP[1];
  const khoaVanDo = () => "kc_cotuong_van_do_" + (tk ? tk.tenDangNhap : "khach");
  const khoaCap = () => "kc_cotuong_cap_" + (tk ? tk.tenDangNhap : "khach");
  const KHOA_CHU = "kc_cotuong_chu";
  const thuongCap = cap => {
    const t = (thanhTich && thanhTich.thuongCap) || THUONG_CAP;
    return t.coBan + t.moiCap * cap;
  };

  function datCapBe(n) {
    capBe = Math.max(1, Math.min(capToiDa, Number(n) || 1));
    if (!laBe) return;
    try { localStorage.setItem(khoaCap(), String(capBe)); } catch (e) { /* chặn lưu: bỏ qua */ }
  }
  function docCapDaLuu() {
    try { return Number(localStorage.getItem(khoaCap())) || 1; } catch (e) { return 1; }
  }

  function hienKhu(ten) {
    $("ctKhuChon").style.display = ten === "chon" ? "" : "none";
    $("ctKhuSanh").style.display = ten === "sanh" ? "" : "none";
    $("ctKhuChoi").style.display = ten === "choi" ? "" : "none";
    if (ten !== "sanh" && phongCo) phongCo.ngungSanh();
  }

  /* ---------------- CHỌN CẤP ---------------- */
  function veLuoiCap() {
    const c = CT.CAP[capBe];
    $("ctCapBeHinh").textContent = c.hinh;
    $("ctCapBeSo").textContent = "Cấp " + capBe;
    $("ctCapBeTen").textContent = c.ten;
    const sau = CT.CAP[capBe + 1];
    $("ctCapBeLoi").textContent = !laBe ? "Tài khoản phụ huynh / quản trị: mở sẵn cả " + capToiDa + " cấp để chơi thử."
      : capBe >= capToiDa ? "Con đã lên cấp cao nhất! Thắng " + c.ten + " thêm nhiều lần nữa nhé."
      : "Thắng " + c.hinh + " " + c.ten + " là con lên cấp " + (capBe + 1) + " và gặp " + sau.hinh + " " + sau.ten + "!";
    $("ctNutDauCapBe").textContent = "▶ Đấu " + c.hinh + " " + c.ten;
    $("ctCapBeThuong").textContent = laBe ? "Thắng: " + thuongCap(capBe) + " 💎" : "";
    $("ctCapBeThuong").style.display = laBe ? "" : "none";

    const luoi = $("ctLuoiCap");
    luoi.innerHTML = "";
    for (let n = 1; n <= capToiDa; n++) {
      const d = CT.CAP[n];
      if (!d) break;
      const mo = n <= capBe;
      const tc = thanhTich && thanhTich.theoCap && thanhTich.theoCap[n];
      const soThang = tc ? tc.thang : 0;
      const the = document.createElement("button");
      the.type = "button";
      the.className = "ctTheCap" + (mo ? "" : " ctCapKhoa") + (n === capBe && laBe ? " ctCapCuaCon" : "");
      the.disabled = !mo;
      the.title = mo ? "Đấu " + d.ten + " (cấp " + n + ")" : "Thắng cấp " + (n - 1) + " để mở";
      the.innerHTML =
        '<span class="ctTheCapHinh">' + d.hinh + "</span>" +
        '<span class="ctTheCapSo">Cấp ' + n + "</span>" +
        '<span class="ctTheCapTen">' + d.ten + "</span>" +
        (mo && laBe ? '<span class="ctTheCapThuong">+' + thuongCap(n) + " 💎</span>" : "") +
        (soThang ? '<span class="ctTheCapThang">🏆 ' + soThang + "</span>" : "") +
        (mo ? "" : '<span class="ctTheCapKhoaHinh">🔒</span>');
      if (mo) the.addEventListener("click", () => batDauVan(d.muc));
      luoi.appendChild(the);
    }
    const ghiChu = $("ctGhiChuThuong");
    if (!laBe) ghiChu.textContent = "Chỉ tài khoản của bé mới nhận kim cương khi thắng.";
    else if (thanhTich && thanhTich.thanhCong) ghiChu.textContent = "Hôm nay con đã nhận " + thanhTich.kimCuongHomNay + " / " + thanhTich.tranGame + " 💎 từ Cờ Tướng.";
    else ghiChu.textContent = "";
    // TC_03C: thẻ "Mỗi bạn một máy"
    const t = thuong2n();
    $("ctThuong2n").style.display = laBe ? "" : "none";
    $("ctThuong2n").textContent = "Thắng " + t.thang + " 💎 · Hoà " + t.hoa + " · Thua " + t.thua;
    const hn = thanhTich && thanhTich.haiNguoi;
    $("ctThanhTich2n").textContent = hn && (hn.thang + hn.thua + hn.hoa)
      ? "🏆 Thắng " + hn.thang + " · Hoà " + hn.hoa + " · Thua " + hn.thua : "Rủ bạn chơi nào!";
    veNutVanDo();
  }

  function hienKhuChon() {
    if (tapTrung) tapTrung.thoat();
    VC.giong.dung();
    huyMayNghi();
    dangNghi = false;
    thoiHoi();
    hienKhu("chon");
    veLuoiCap();
    if (phongCo) phongCo.dsPhong().then(kq => { if (kq && kq.thanhCong) { phongCuaToi = kq.phongCuaToi; veNutVanDo(); } });
  }

  /* ---------------- VÁN ĐANG DỞ ---------------- */
  function luuVanDo() {
    if (cheDo !== "may") return;      // ván 2 máy nằm trên máy chủ
    try {
      if (van && !van.daXong && van.nuocDi.length) localStorage.setItem(khoaVanDo(), JSON.stringify({ muc: van.muc, nuocDi: van.nuocDi, maVan }));
      else localStorage.removeItem(khoaVanDo());
    } catch (e) { /* chặn lưu: bỏ qua */ }
  }
  function docVanDo() {
    try {
      const v = JSON.parse(localStorage.getItem(khoaVanDo()) || "null");
      const cap = v ? CT.capCuaMuc(v.muc) : 0;
      if (cap && cap <= capBe && Array.isArray(v.nuocDi) && v.nuocDi.length) return v;
    } catch (e) { /* hỏng thì bỏ */ }
    return null;
  }
  function veNutVanDo() {
    const v = docVanDo();
    $("ctVanDo").style.display = v ? "" : "none";
    if (v) {
      const d = timDoiThu(v.muc);
      $("ctNutChoiTiep").textContent = "▶ Chơi tiếp ván đang dở với " + d.hinh + " " + d.ten + " (cấp " + d.cap + ")";
    }
    const p = phongCuaToi;
    const coVanBan = !!(p && (p.trangThai === "dang_choi" || p.trangThai === "ket_thuc"));
    $("ctVanHaiMay").style.display = coVanBan ? "" : "none";
    if (coVanBan) $("ctNutVaoLai").textContent = "▶ Vào lại phòng chơi với " + VC.haiBenPhong(p).ban;
  }

  /* ---------------- BÀN CỜ ---------------- */
  /* Nền SVG: 9 đường dọc (đứt ở sông trừ 2 mép), 10 đường ngang, chéo trong 2 cung, dấu
     ở chỗ Pháo / Tốt, chữ trên sông. Toạ độ: giao điểm (cột c, hàng h) = (c + 0.5, h + 0.5). */
  function veNenBan() {
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "ctBanNen");
    svg.setAttribute("viewBox", "0 0 9 10");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("aria-hidden", "true");
    const ke = (x1, y1, x2, y2, lop) => {
      const l = document.createElementNS(NS, "line");
      l.setAttribute("x1", x1); l.setAttribute("y1", y1); l.setAttribute("x2", x2); l.setAttribute("y2", y2);
      if (lop) l.setAttribute("class", lop);
      svg.appendChild(l);
    };
    for (let h = 0; h < 10; h++) ke(0.5, h + 0.5, 8.5, h + 0.5);
    for (let c = 0; c < 9; c++) {
      if (c === 0 || c === 8) ke(c + 0.5, 0.5, c + 0.5, 9.5);
      else { ke(c + 0.5, 0.5, c + 0.5, 4.5); ke(c + 0.5, 5.5, c + 0.5, 9.5); }
    }
    const vien = document.createElementNS(NS, "rect");
    vien.setAttribute("x", 0.38); vien.setAttribute("y", 0.38); vien.setAttribute("width", 8.24); vien.setAttribute("height", 9.24);
    vien.setAttribute("class", "ctVienNgoai");
    svg.appendChild(vien);
    // cung
    ke(3.5, 0.5, 5.5, 2.5); ke(5.5, 0.5, 3.5, 2.5);
    ke(3.5, 7.5, 5.5, 9.5); ke(5.5, 7.5, 3.5, 9.5);
    // dấu chỗ đứng Pháo / Tốt
    const dau = (c, h) => {
      const x = c + 0.5, y = h + 0.5, g = 0.08, d = 0.2;
      for (const sx of [-1, 1]) {
        if ((c === 0 && sx < 0) || (c === 8 && sx > 0)) continue;
        for (const sy of [-1, 1]) {
          ke(x + sx * g, y + sy * g, x + sx * (g + d), y + sy * g, "ctDauCham");
          ke(x + sx * g, y + sy * g, x + sx * g, y + sy * (g + d), "ctDauCham");
        }
      }
    };
    [[1, 2], [7, 2], [1, 7], [7, 7]].forEach(([c, h]) => dau(c, h));
    for (const c of [0, 2, 4, 6, 8]) { dau(c, 3); dau(c, 6); }
    // chữ trên sông
    const chu = (x, noiDung) => {
      const t = document.createElementNS(NS, "text");
      t.setAttribute("x", x); t.setAttribute("y", 5.15); t.setAttribute("text-anchor", "middle");
      t.textContent = noiDung;
      svg.appendChild(t);
    };
    chu(2.5, "楚 河"); chu(6.5, "漢 界");
    return svg;
  }

  function taoBan() {
    const ban = $("ctBan");
    ban.appendChild(veNenBan());
    for (let o = 0; o < CT.SO_O; o++) {
      const nut = document.createElement("button");
      nut.type = "button";
      nut.className = "ctO";
      nut.setAttribute("role", "gridcell");
      nut.dataset.o = o;
      ban.appendChild(nut);
      oBan.push(nut);
    }
    ban.addEventListener("click", su => {
      const nut = su.target.closest(".ctO");
      if (nut) bamO(Number(nut.dataset.o));
    });
  }

  /* TC_03C: con cầm Đen thì xoay bàn 180 độ (đổi thứ tự ô trong lưới) để quân của con luôn ở
     dưới. Ô vẫn giữ số o thật (cùng cách đánh số với máy chủ), chỉ chỗ hiện đổi. */
  function datHuongBan(lat) {
    if (lat === latBan) return;
    latBan = lat;
    const ban = $("ctBan");
    (lat ? oBan.slice().reverse() : oBan).forEach(n => ban.appendChild(n));
    ban.classList.toggle("ctLat", lat);
  }

  const tenQuan = q => CT.TEN_QUAN[Math.abs(q)];
  const chuQuan = q => (chuViet ? tenQuan(q) : (q > 0 ? CT.CHU_DO[q] : CT.CHU_DEN[-q]));

  function veBan() {
    const cuoi = van.nuocDi.length ? van.nuocDi[van.nuocDi.length - 1] : -1;
    const vuaTu = cuoi >= 0 ? Math.floor(cuoi / 90) : -1, vuaDen = cuoi >= 0 ? cuoi % 90 : -1;
    const dich = new Set(dichChon);
    // Tướng của bên đang tới lượt bị chiếu
    let oChieu = -1;
    if (!van.daXong || van.lyDo === "bi") {
      const ben = van.luot;
      if (van.the.biChieu(ben)) oChieu = CT.VT_SANG_O[van.the.tuong[ben]];
    }
    for (let o = 0; o < CT.SO_O; o++) {
      const q = van.quan(o);
      const nut = oBan[o];
      const cl = nut.classList;
      const maCu = nut.dataset.q || "0";
      const ma = q ? q + (chuViet ? "v" : "h") : "0";
      if (maCu !== ma) {
        nut.dataset.q = ma;
        nut.innerHTML = "";
        if (q) {
          const quan = document.createElement("span");
          quan.className = "ctQuan " + (q > 0 ? "ctDo" : "ctDen");
          const chu = document.createElement("span");
          chu.className = "ctChu" + (chuViet && chuQuan(q).length > 4 ? " ctChuDai" : "");
          chu.textContent = chuQuan(q);
          quan.appendChild(chu);
          nut.appendChild(quan);
        }
      }
      nut.setAttribute("aria-label", "Hàng " + (10 - Math.floor(o / 9)) + ", cột " + (o % 9 + 1) +
        (q ? ": " + tenQuan(q) + (q > 0 ? " đỏ" : " đen") : ""));
      cl.toggle("ctCuaBe", q * benToi() > 0);
      cl.toggle("ctChon", o === oChon);
      cl.toggle("ctDich", dich.has(o));
      cl.toggle("ctCoQuan", dich.has(o) && q !== 0);
      cl.toggle("ctVuaTu", o === vuaTu);
      cl.toggle("ctVuaDen", o === vuaDen);
      cl.toggle("ctBiChieu", o === oChieu);
      cl.toggle("ctGoiYTu", o === oGoiYTu);
      cl.toggle("ctGoiYDen", o === oGoiYDen);
    }
    const ban = $("ctBan");
    ban.classList.toggle("ctChoMay", dangNghi || (cheDo === "hai_may" && !denLuotToi()));
    ban.classList.toggle("ctXong", van.daXong);
    ban.classList.toggle("ctChuViet", chuViet);
    veDaAn();
  }

  /* Quân mỗi bên đã ăn = quân ban đầu của đối phương còn thiếu trên bàn */
  function veDaAn() {
    const DU = [0, 1, 2, 2, 2, 2, 2, 5];
    const con = { 1: [0, 0, 0, 0, 0, 0, 0, 0], "-1": [0, 0, 0, 0, 0, 0, 0, 0] };
    for (let o = 0; o < CT.SO_O; o++) {
      const q = van.quan(o);
      if (q) con[q > 0 ? 1 : -1][Math.abs(q)]++;
    }
    const ve = (khung, benBiAn) => {
      khung.innerHTML = "";
      for (const loai of [5, 6, 4, 3, 2, 7]) {
        for (let i = con[benBiAn][loai]; i < DU[loai]; i++) {
          const s = document.createElement("span");
          s.className = benBiAn > 0 ? "ctDo" : "ctDen";
          s.textContent = benBiAn > 0 ? CT.CHU_DO[loai] : CT.CHU_DEN[loai];
          s.title = CT.TEN_QUAN[loai];
          khung.appendChild(s);
        }
      }
    };
    // thẻ con: quân của bạn mà con đã ăn; thẻ máy / bạn: quân của con bị ăn
    ve($("ctDaAnBe"), -benToi());
    ve($("ctDaAnMay"), benToi());
  }

  /* ---------------- NGƯỜI CHƠI + LỜI LƯỢT ---------------- */
  function veNguoiChoi() {
    VC.veAvatar($("ctAvatarBe"), tk && tk.avatarDaChon, "🙂");
    $("ctTenBe").textContent = tk ? tk.tenDangNhap : "Con";
    $("ctKimCuongBe").textContent = "💎 " + (tk && typeof tk.diemSo === "number" ? tk.diemSo : 0);
    const doDo = benToi() === CT.DO;
    $("ctMauBe").textContent = doDo ? "Đỏ" : "Đen";
    $("ctMauBe").classList.toggle("ctChuDo", doDo);
    if (cheDo === "hai_may" && phong) {
      const h = VC.haiBenPhong(phong);
      $("ctTenBe").textContent = h.toi + " (con)";
      VC.veAvatar($("ctAvatarMay"), h.avatarBan, "🙂");
      $("ctTenMay").textContent = h.ban || "...";
      $("ctPhuMay").textContent = "quân " + (doDo ? "Đen" : "Đỏ");
      return;
    }
    VC.veAvatar($("ctAvatarMay"), doiThu.hinh, "🙂");
    $("ctTenMay").textContent = doiThu.ten;
    $("ctPhuMay").textContent = "quân Đen · cấp " + doiThu.cap;
  }

  function capNhatLuot() {
    if (cheDo === "hai_may") { capNhatLuotHaiMay(); return; }
    const luotBe = !van.daXong && van.luot === CT.DO && !dangNghi;
    $("ctTheBe").classList.toggle("vcDangDi", luotBe);
    $("ctTheMay").classList.toggle("vcDangDi", !van.daXong && !luotBe);
    const may = doiThu.hinh + " " + doiThu.ten;
    let loi;
    if (van.ketQua === "thang") loi = "🎉 Con chiếu bí " + may + " rồi!";
    else if (van.ketQua === "thua") loi = van.lyDo === "dau_hang" ? "🏳️ Con đã chịu thua ván này." : may + " chiếu bí con!";
    else if (van.ketQua === "hoa") loi = "🤝 Hoà rồi!";
    else if (luotBe) {
      if (van.chieu) loi = "⚠️ Tướng của con đang bị chiếu! Cứu Tướng nhanh nào!";
      else loi = van.nuocDi.length === 0 ? "Con đi trước! Bấm vào một quân Đỏ nhé" : "Lượt của con!";
    } else loi = may + " đang nghĩ...";
    const oLoi = $("ctLoiLuot");
    const goiYDangHien = !loiTroLy && !!loiGoiY && luotBe;
    oLoi.textContent = loiTroLy ? "🦉 " + loiTroLy : goiYDangHien ? loiGoiY : loi;
    oLoi.classList.toggle("ctLoiTroLy", !!loiTroLy);
    oLoi.classList.toggle("ctLoiGoiY", goiYDangHien);
    veNutGoiY();
    if (tapTrung) tapTrung.capNhatNut();
  }

  /* TC_03C: lời lượt + thẻ đang đi khi 2 bạn chơi (theo phòng máy chủ trả về) */
  function capNhatLuotHaiMay() {
    const dangChoi = !!phong && phong.trangThai === "dang_choi" && !van.daXong;
    const luotToi = dangChoi && van.luot === benToi();
    $("ctTheBe").classList.toggle("vcDangDi", luotToi);
    $("ctTheMay").classList.toggle("vcDangDi", dangChoi && !luotToi);
    const oLoi = $("ctLoiLuot");
    oLoi.textContent = loiLuotHaiMay();
    oLoi.classList.remove("ctLoiTroLy", "ctLoiGoiY");
    if (tapTrung) tapTrung.capNhatNut();
  }

  function loiLuotHaiMay() {
    if (!phong) return "";
    const h = VC.haiBenPhong(phong);
    if (phong.trangThai === "dong") return phong.roiPhong === h.ban ? "🚪 " + h.ban + " đã rời phòng." : "Phòng đã đóng.";
    if (phong.trangThai === "ket_thuc") {
      if (phong.ketQua === "hoa") return "🤝 Hai bạn hoà nhau!";
      return phong.nguoiThang === h.toi ? "🎉 Con thắng rồi!" : "🏆 " + h.ban + " thắng ván này!";
    }
    if (h.banVangGiay > VANG_LAU) return "📶 " + h.ban + " đang mất kết nối, chờ bạn quay lại nhé...";
    if (dangGui) return "Đang gửi nước đi...";
    if (van.luot === benToi()) {
      if (van.chieu) return "⚠️ Tướng của con đang bị chiếu! Cứu Tướng nhanh nào!";
      return van.nuocDi.length === 0 ? "Con cầm quân Đỏ, đi trước! Bấm vào một quân Đỏ nhé" : "Lượt của con!";
    }
    return van.chieu ? "Chiếu tướng! Chờ " + h.ban + " cứu Tướng..." : "Chờ " + h.ban + " đi...";
  }

  /* Nút theo chế độ: 2 máy không có Ván mới / Đổi cấp / Gợi Ý / trợ lý, có Xin hoà / Rời phòng */
  function veNutTheoCheDo() {
    const haiMay = cheDo === "hai_may";
    document.querySelectorAll(".ctChiMay").forEach(n => { n.style.display = haiMay ? "none" : ""; });
    document.querySelectorAll(".ctChi2May").forEach(n => { n.style.display = haiMay ? "" : "none"; });
    $("ctNutKetQuaDoi").textContent = haiMay ? "🚪 Rời phòng" : "🎚️ Đổi cấp";
    $("ctNutChiuThua").style.display = "";
    if (haiMay && phong) {
      const dangChoi = phong.trangThai === "dang_choi";
      const daXin = phong.xinHoa === tk.tenDangNhap;
      $("ctNutXinHoa").style.display = dangChoi ? "" : "none";
      $("ctNutChiuThua").style.display = dangChoi ? "" : "none";
      $("ctNutXinHoa").disabled = daXin;
      $("ctNutXinHoa").textContent = daXin ? "🤝 Đã xin hoà..." : "🤝 Xin hoà";
    }
  }

  function veHoiHoa() {
    const o = $("ctHoiHoa");
    if (cheDo !== "hai_may" || !phong || phong.trangThai !== "dang_choi" || !phong.xinHoa) { o.style.display = "none"; return; }
    const h = VC.haiBenPhong(phong);
    o.style.display = "";
    if (phong.xinHoa === h.ban) {
      $("ctHoiHoaChu").textContent = "🤝 " + h.ban + " muốn hoà. Con đồng ý không?";
      $("ctHoiHoaNut").style.display = "";
    } else {
      $("ctHoiHoaChu").textContent = "Đã gửi lời xin hoà, chờ " + h.ban + " trả lời...";
      $("ctHoiHoaNut").style.display = "none";
    }
  }

  /* ---------------- GỢI Ý (TC_03E) ---------------- */
  function veNutGoiY() {
    const nut = $("ctNutGoiY");
    const con = !goiY || goiY.conLuot();
    nut.disabled = !van || van.daXong || van.luot !== CT.DO || dangNghi || dangGoiY;
    nut.classList.toggle("ctHetGoiY", !con);
    nut.classList.toggle("ctDangGoiY", dangGoiY);
    $("ctNutGoiYChu").textContent = dangGoiY ? "💡 Đang nghĩ..." : "💡 Gợi Ý";
    $("ctNutGoiYGia").textContent = goiY ? goiY.nhanNut() : "";
    if (!con || nut.disabled) nut.classList.remove("ctMoiGoiY");
  }

  /* Bỏ 2 ô nhấp nháy + lời gợi ý (bé đã đi / ván mới) */
  function boGoiY() { oGoiYTu = oGoiYDen = -1; loiGoiY = ""; }
  function thoiHoi() {
    if (henHoi) { clearTimeout(henHoi); henHoi = null; }
    $("ctNutGoiY").classList.remove("ctMoiGoiY");
  }
  /* Đầu lượt của bé (luotMoi) hoặc bé vừa chạm bàn (chưa hỏi lượt này): hẹn giờ hỏi lại từ đầu */
  function henHoiGoiY(luotMoi) {
    if (luotMoi) daHoiLuotNay = false;
    if (henHoi) { clearTimeout(henHoi); henHoi = null; }
    if (daHoiLuotNay || !goiY || !van || van.daXong || van.luot !== CT.DO || !goiY.nenHoi(capKhen())) return;
    henHoi = setTimeout(hoiGoiY, goiY.giayChoHoi * 1000);
  }
  /* Giống Cờ Vua NC_03B: CHỈ hỏi bằng lời (bóng thoại + giọng) + nút nhấp nháy, không hộp thoại */
  function hoiGoiY() {
    henHoi = null;
    if (!van || van.daXong || van.luot !== CT.DO || dangNghi || dangGoiY || oGoiYTu >= 0) return;
    if ($("ctKhuChoi").style.display === "none" || !goiY.nenHoi(capKhen())) return;
    daHoiLuotNay = true;
    $("ctNutGoiY").classList.add("ctMoiGoiY");
    noiTroLy(troLy.lay(["hoi_goi_y"]));
  }

  /* -> Promise<nước gợi ý tu * 90 + den | -1>. Worker trước, hỏng thì nghĩ ở luồng chính. */
  function timGoiY(nuocDi) {
    return hoiMayNghi(nuocDi, 0, { goiY: true, giay: CT.GOI_Y_GIAY || 1 }).then(n => {
      if (n >= 0 || n === -2) return n;
      return napBoNao().then(() => {
        try { return CT.goiYNuoc(nuocDi, 0.6); } catch (e) { return -1; }
      });
    });
  }

  function bamGoiY() {
    if (!goiY || !van || van.daXong || van.luot !== CT.DO || dangNghi || dangGoiY) return;
    imTroLy();
    thoiHoi();
    daHoiLuotNay = true;      // đã bấm thì lượt này khỏi hỏi nữa
    if (!goiY.conLuot()) { loiGoiY = "Ván này con dùng hết lượt gợi ý rồi. Con tự nghĩ nhé, con làm được mà!"; capNhatLuot(); return; }
    dangGoiY = true;
    oChon = -1; dichChon = [];
    boGoiY();
    veBan(); capNhatLuot();
    const vanNay = van, soNuoc = van.nuocDi.length;
    Promise.all([goiY.dung(), timGoiY(van.nuocDi.slice())]).then(([kq, n]) => {
      dangGoiY = false;
      if (kq && typeof kq.diemSoMoi === "number") capNhatKimCuong(kq.diemSoMoi);
      if (van !== vanNay || van.daXong || van.nuocDi.length !== soNuoc) { if (van) capNhatLuot(); return; }
      if (!kq.duoc) loiGoiY = kq.loi;
      else if (n < 0) loiGoiY = "Cú mèo chưa nghĩ ra, con bấm Gợi Ý lại nhé.";
      else {
        oGoiYTu = Math.floor(n / 90); oGoiYDen = n % 90;
        const q = van.quan(oGoiYTu);
        loiGoiY = "💡 Con thử đi quân " + tenQuan(q) + " đang nhấp nháy tới chỗ có vòng vàng nhé!" +
          (kq.chiPhiDaTru > 0 ? " (−" + kq.chiPhiDaTru + " 💎)" : "");
      }
      veBan(); capNhatLuot();
    });
  }

  /* ---------------- TRỢ LÝ 🦉 (TC_03D) ---------------- */
  /* Hiện câu ở ô lời lượt + đọc. khiXong chạy khi đọc xong (tắt tiếng thì chạy ngay). Câu còn
     hiện thêm một lúc cho bé kịp đọc, rồi ô trở lại lời lượt. */
  function noiTroLy(cau, khiXong) {
    if (!cau) { if (khiXong) khiXong(); return; }
    if (henTroLy) { clearTimeout(henTroLy); henTroLy = null; }
    loiTroLy = cau.noiDung;
    if (van) capNhatLuot();
    const batDau = Date.now();
    VC.giong.noi(cau.noiDung, cau.duongDanAmThanh, () => {
      henTroLy = setTimeout(() => { henTroLy = null; anTroLy(); }, Math.max(1500, 3000 - (Date.now() - batDau)));
      if (khiXong) khiXong();
    });
  }
  function anTroLy() {
    if (henTroLy) { clearTimeout(henTroLy); henTroLy = null; }
    if (!loiTroLy) return;
    loiTroLy = "";
    if (van) capNhatLuot();
  }
  /* Bé chạm bàn cờ / sang ván khác: tắt tiếng ngay, câu đang hiện cũng thôi */
  function imTroLy() { VC.giong.dung(); anTroLy(); }

  function veNutTroLy() {
    const bat = VC.giong.dangBat();
    const nut = $("ctNutTroLy");
    nut.textContent = bat ? "🦉 Trợ lý: đang nói" : "🦉 Trợ lý: im lặng";
    nut.setAttribute("aria-pressed", bat ? "true" : "false");
  }
  function doiTroLy() {
    const bat = !VC.giong.dangBat();
    VC.giong.datBat(bat);
    veNutTroLy();
    if (bat) { VC.giong.moKhoa(); noiTroLy(troLy.lay(["chao_hoi"])); }
    else { anTroLy(); if (choKhenXong) choKhenXong(); }   // đang chờ câu khen -> máy đi luôn
  }
  let choKhenXong = null;     // máy đang chờ câu khen đọc xong: hàm cho máy đi tiếp

  function veTatCa() { veNguoiChoi(); veBan(); capNhatLuot(); veNutTheoCheDo(); veHoiHoa(); }

  /* ---------------- CHƠI ---------------- */
  /* maVanCu: mã ván của ván đang dở (chơi tiếp thì máy chủ vẫn nhớ số lần gợi ý đã dùng) */
  function batDauVan(muc, nuocDiCu, maVanCu) {
    roiPhongNeuCo();
    cheDo = "may";
    datHuongBan(false);
    dongKetQua();
    huyMayNghi();
    imTroLy();
    thoiHoi();
    choKhenXong = null;
    doiThu = timDoiThu(muc);
    van = nuocDiCu ? CT.VanCoTuong.tuNuocDi(doiThu.muc, nuocDiCu) : new CT.VanCoTuong(doiThu.muc);
    const choiTiep = !!nuocDiCu && !van.daXong && van.nuocDi.length === nuocDiCu.length;
    if (!choiTiep && nuocDiCu) van = new CT.VanCoTuong(doiThu.muc);
    maVan = choiTiep && typeof maVanCu === "string" && /^[A-Za-z0-9_-]{8,64}$/.test(maVanCu) ? maVanCu : VC.taoMaVan();
    dangNghi = false; dangGoiY = false; oChon = -1; dichChon = [];
    boGoiY();
    if (goiY) {
      const vanNay = van;
      goiY.batDauVan(maVan, laBe ? capBe : capKhen()).then(() => {
        if (van !== vanNay) return;
        veNutGoiY();
        if (henHoi) henHoiGoiY(false);           // máy chủ đổi số giây chờ: hẹn lại
      });
    }
    hienKhu("choi");
    if (tapTrung) tapTrung.batNeuDienThoai();
    veTatCa();
    luuVanDo();
    if (van.luot === CT.DEN) mayDi();
    else {
      if (!van.nuocDi.length) noiTroLy(troLy.lay(["bat_dau_van"]));
      henHoiGoiY(true);
    }
  }

  function bamO(o) {
    if (!denLuotToi() || dangGoiY) return;
    const haiMay = cheDo === "hai_may";
    if (!haiMay) {
      imTroLy();              // bé chạm bàn cờ: trợ lý thôi nói ngay (giống Cờ Vua NC_03B)
      thoiHoi();              // ... và nút Gợi Ý thôi nhấp nháy; chưa hỏi lượt này thì đếm giờ lại
      henHoiGoiY(false);
    }
    const q = van.quan(o);
    if (oChon >= 0 && dichChon.indexOf(o) !== -1) {
      const tu = oChon;
      oChon = -1; dichChon = [];
      if (haiMay) { diHaiMay(tu, o); return; }
      thoiHoi();
      boGoiY();
      const truoc = demQuan();
      if (van.di(tu, o)) sauNuocBe(demQuan() < truoc);
      else veBan();
      return;
    }
    if (q * benToi() > 0 && o !== oChon) {
      oChon = o;
      dichChon = van.nuocCuaQuan(o);
      veBan();
      if (!dichChon.length) $("ctLoiLuot").textContent = "Quân " + tenQuan(q) + " này chưa đi được, con chọn quân khác nhé.";
      else capNhatLuot();
      return;
    }
    // bấm lại quân đang chọn hoặc chỗ trống: bỏ chọn
    oChon = -1; dichChon = [];
    veBan(); capNhatLuot();
  }

  /* TC_03D: sau nước của BÉ - khoá bàn ngay, khen (nếu có), đọc xong mới cho máy đi */
  function sauNuocBe(anQuan) {
    luuVanDo();
    if (van.daXong) { veBan(); capNhatLuot(); ketThucVan(); return; }
    const khen = troLy.chonKhen(capKhen(), van.chieu ? "chieu_tuong" : anQuan ? "an_quan" : "nuoc_thuong");
    if (!khen) { mayDi(); return; }
    dangNghi = true;          // bé không bấm được trong lúc trợ lý khen
    veBan(); capNhatLuot();
    const vanNay = van;
    let daDi = false;
    const diTiep = () => {
      if (daDi) return;
      daDi = true; choKhenXong = null; clearTimeout(hen);
      if (van === vanNay && !van.daXong && van.luot === CT.DEN) mayDi();
    };
    const hen = setTimeout(diTiep, 15000);   // lưới an toàn: trình duyệt không báo "đọc xong"
    choKhenXong = diTiep;
    noiTroLy(khen, diTiep);
  }

  /* Sau nước của MÁY: bị chiếu / bị ăn quân thì động viên (chỉ cấp còn được khen) */
  function sauNuocMay(biAn) {
    luuVanDo();
    veBan(); capNhatLuot();
    if (van.daXong) { ketThucVan(); return; }
    noiTroLy(troLy.chonSauNuocMay(capKhen(), van.chieu, biAn));
    henHoiGoiY(true);         // TC_03E: lượt mới của bé
  }

  function mayDi() {
    dangNghi = true;
    veBan(); capNhatLuot();
    const vanNay = van;
    const cap = CT.capCuaMuc(van.muc) || 1;
    const batDau = Date.now();
    const nghiToiThieu = Math.min(NGHI.toiDa, NGHI.toiThieu + (cap - 1) * NGHI.moiCap + Math.random() * NGHI.ngauNhien);
    hoiMayNghi(van.nuocDi, cap).then(n => {
      if (n === -2 || van !== vanNay) return;          // bé đã sang ván khác
      const datQuan = n2 => setTimeout(() => {
        if (van !== vanNay) return;
        const truoc = demQuan();
        if (!van.diSo(n2)) {
          // phòng hờ: nước lỗi thì đi nước hợp lệ đầu tiên (không bao giờ kẹt ván)
          const ds = van.the.nuocHopLe();
          if (ds.length) van.diSo(CT.maNuoc(ds[0]));
        }
        dangNghi = false;
        sauNuocMay(demQuan() < truoc);
      }, Math.max(0, nghiToiThieu - (Date.now() - batDau)));
      if (n >= 0) { datQuan(n); return; }
      // Worker không chạy được: nạp bộ não vào luồng chính rồi nghĩ
      napBoNao().then(() => {
        let n2 = -1;
        try { n2 = CT.mayDiCap(van.nuocDi, cap, Math.random, { giay: Math.min(1, CT.NAO_CAP[cap].giay) }); } catch (e) { n2 = -1; }
        datQuan(n2);
      });
    });
  }

  /* ---------------- WEB WORKER ---------------- */
  /* -> Promise<nước máy đi>; -1 = Worker không chạy được / quá lâu, -2 = đã huỷ.
     them: {goiY: true, giay} = hỏi nước gợi ý cho bé (TC_03E) */
  function hoiMayNghi(nuocDi, cap, them) {
    return new Promise(xong => {
      huyMayNghi();
      if (mayNghiHong || typeof Worker === "undefined") { xong(-1); return; }
      try {
        if (!mayNghi) {
          mayNghi = new Worker("co_tuong/ct_may_nghi.js");
          mayNghi.onmessage = su => {
            const d = su.data || {};
            if (!choNghi || d.id !== choNghi.id) return;
            const c = choNghi; choNghi = null; clearTimeout(c.hen);
            c.xong(typeof d.n === "number" ? d.n : -1);
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
      }, 20000) };
      mayNghi.postMessage(Object.assign({ id, nuocDi: nuocDi.slice(), cap }, them || {}));
    });
  }
  function boMayNghi() { if (mayNghi) { mayNghi.terminate(); mayNghi = null; } }
  function huyMayNghi() {
    if (!choNghi) return;
    const c = choNghi; choNghi = null; clearTimeout(c.hen);
    boMayNghi();
    c.xong(-2);
  }
  let huaNapBoNao = null;
  function napBoNao() {
    if (CT.mayDiCap) return Promise.resolve();
    if (!huaNapBoNao) {
      huaNapBoNao = new Promise(xong => {
        const s = document.createElement("script");
        s.src = "co_tuong/ct_bo_nao.js";
        s.onload = s.onerror = () => xong();
        document.head.appendChild(s);
      });
    }
    return huaNapBoNao;
  }

  /* ---------------- KẾT THÚC VÁN ---------------- */
  function ketThucVan() {
    const vanNay = van;
    luuVanDo();
    thoiHoi(); boGoiY();
    // Giống Cờ Vua: thắng máy ĐÚNG cấp của mình -> lên cấp (máy chủ chốt lại khi nhận kết quả)
    const capVan = CT.capCuaMuc(van.muc);
    const lenCap = laBe && van.ketQua === "thang" && capVan === capBe && capBe < capToiDa;
    if (lenCap) datCapBe(capBe + 1);
    // TC_03D: câu sự kiện nói ở mọi cấp (giống Cờ Vua); lên cấp thì nói câu lên cấp
    choKhenXong = null;
    noiTroLy(troLy.lay(lenCap ? ["len_cap", "thang_van"] : [van.ketQua + "_van"]));
    let mucGui = null;
    if (laBe && ketQuaVan) {
      mucGui = ketQuaVan.them({ cheDo: "may", muc: van.muc, ketQua: van.ketQua, nuocDi: van.nuocDi, doiThu: doiThu.ten });
    }
    setTimeout(() => {
      if (van !== vanNay) return;
      hienKetQua(mucGui, lenCap);
    }, van.ketQua === "thang" || van.ketQua === "thua" ? 1300 : 500);
  }

  function datKetQua(hinh, tieuDe, loi) {
    $("ctKetQua").classList.remove("ctLenCap");
    $("ctKetQuaHinh").textContent = hinh;
    $("ctKetQuaTieuDe").textContent = tieuDe;
    $("ctKetQuaLoi").textContent = loi;
    $("ctKetQuaKimCuong").textContent = "";
    $("ctKetQuaCho").textContent = "";
    $("ctNutChoiLai").disabled = false;
    $("ctNutChoiLai").textContent = "▶ Chơi ván nữa";
    $("ctNutChoiLai").style.display = "";
  }

  const LOI_HOA = {
    lap: "Hai bên đi đi lại lại cùng một thế cờ 3 lần nên hoà.",
    khong_an: "60 lượt liền không bên nào ăn được quân nên hoà.",
    dai: "Ván cờ dài quá 300 nước nên hoà.",
    het_quan: "Hai bên không còn quân nào sang sông tấn công được nên hoà."
  };
  /* % = đối thủ ("máy" hoặc "bạn" - TC_03C) */
  const MEO = [
    "Mẹo nhỏ: trước khi đi, nhìn xem quân nào của % đang nhắm vào Tướng con nhé.",
    "Mẹo nhỏ: đừng để Xe đứng chỗ Mã hay Pháo của % ăn được.",
    "Mẹo nhỏ: giữ Sĩ và Tượng ở cạnh Tướng, Tướng sẽ khó bị chiếu bí hơn.",
    "Mẹo nhỏ: Pháo cần 1 quân làm \"ngòi\" mới ăn được, để ý ngòi Pháo của % nhé."
  ];
  const meoNho = doi => MEO[Math.floor(Math.random() * MEO.length)].replace("%", doi);

  function hienKetQua(mucGui, lenCap) {
    const kq = van.ketQua;
    const d = doiThu;
    if (kq === "thang" && lenCap) {
      const moi = CT.CAP[capBe];
      datKetQua("🎆", "Lên cấp " + capBe + "!", "Con đã thắng " + d.hinh + " " + d.ten + " và mở khoá cấp " + capBe +
        ": " + moi.hinh + " " + moi.ten + ". Giỏi quá!");
      $("ctNutChoiLai").textContent = "▶ Đấu " + moi.hinh + " " + moi.ten;
      $("ctKetQua").classList.add("ctLenCap");
      phaoHoa();
    } else if (kq === "thang") {
      datKetQua("🏆", "Con thắng rồi!", "Con đã chiếu bí " + d.hinh + " " + d.ten + ". Giỏi quá!");
    } else if (kq === "thua") {
      datKetQua("💪", d.ten + " thắng ván này!", (van.lyDo === "dau_hang" ? "Không sao, ván sau cố lên nhé! " : "") +
        meoNho("máy") + " Chơi lại phục thù nào!");
    } else {
      datKetQua("🤝", "Hoà rồi!", (LOI_HOA[van.lyDo] || "") + " Hai bên ngang tài!");
    }
    const oKc = $("ctKetQuaKimCuong");
    if (kq === "thang" && !laBe) oKc.textContent = "Tài khoản của bé mới nhận " + thuongCap(d.cap) + " kim cương nhé.";
    if (kq === "thang" && mucGui) oKc.textContent = "Đang cất kim cương vào kho... 💎";
    $("ctKetQua").classList.add("vcHien");
    if (tapTrung) tapTrung.thoat();
    $("ctNutChoiLai").focus();
    if (mucGui) guiKetQua(mucGui);
  }

  function phaoHoa() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const khung = document.createElement("div");
    khung.className = "ctPhaoHoa";
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

  /* Lời báo kim cương nói RÕ SỐ (giống Cờ Caro TC_02D) */
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
      const oKc = $("ctKetQuaKimCuong");
      if (k && typeof k.cap === "number") { datCapBe(k.cap); if (typeof k.capToiDa === "number") capToiDa = k.capToiDa; }
      if (mucGui.ketQua !== "thang") { taiThanhTich(); return; }
      const thuong = thuongCap(CT.capCuaMuc(mucGui.muc) || 1);
      if (!k) oKc.textContent = "Mạng đang chập chờn, " + thuong + " kim cương của ván này sẽ tự vào kho khi có mạng nhé.";
      else if (k.hopLe === false || k.thanhCong === false) oKc.textContent = "Ván này máy chủ chưa ghi nhận được, con chơi ván khác nhé.";
      else oKc.textContent = loiKimCuong(k);
      taiThanhTich();
    });
  }

  function capNhatKimCuong(so) {
    if (!tk) return;
    tk.diemSo = so;
    if (typeof kcTaiKhoanHienTai !== "undefined" && kcTaiKhoanHienTai && typeof kcLuuPhien === "function") {
      kcTaiKhoanHienTai.diemSo = so;
      kcLuuPhien(kcTaiKhoanHienTai);
    }
    $("ctKimCuongBe").textContent = "💎 " + so;
  }

  function dongKetQua() { $("ctKetQua").classList.remove("vcHien"); }

  function taiThanhTich() {
    if (!tk) return Promise.resolve();
    return VC.layThanhTich(kcGoiRpc, kcDocPhien(), TRO_CHOI).then(kq => {
      if (kq && kq.thanhCong) {
        thanhTich = kq;
        if (typeof kq.capToiDa === "number") capToiDa = Math.max(1, Math.min(CT.CAP_TOI_DA, kq.capToiDa));
        if (typeof kq.cap === "number") datCapBe(kq.cap);
      }
      if ($("ctKhuChon").style.display !== "none") veLuoiCap();
    });
  }

  function choiLai() {
    if (cheDo === "hai_may") {
      if (!phong) return;
      if (phong.trangThai === "dong") { moSanh(); return; }
      $("ctNutChoiLai").disabled = true;
      phongCo.hanhDong("choi_lai");
      return;
    }
    batDauVan($("ctKetQua").classList.contains("ctLenCap") ? CT.CAP[capBe].muc : doiThu.muc);
  }

  /* ================= TC_03C: MỖI BẠN MỘT MÁY - SẢNH ================= */
  function baoSanh(chu) { $("ctSanhBao").textContent = chu || ""; }

  function moSanh() {
    if (!phongCo) return;
    dongKetQua();
    if (tapTrung) tapTrung.thoat();
    VC.giong.dung();
    huyMayNghi();
    phongCo.ngung(); phong = null;
    hienKhu("sanh");
    $("ctSanhCho").style.display = "none";
    $("ctSanhChon").style.display = "";
    $("ctDsPhong").innerHTML = "";        // không để thẻ phòng của lần trước (có thể đã đóng) cho bé bấm nhầm
    baoSanh("Đang tìm phòng...");
    phongCo.theoDoiSanh(nhanSanh);
  }

  function hienPhongCho() {
    $("ctSanhCho").style.display = "";
    $("ctSanhChon").style.display = "none";
    $("ctTenPhongCho").textContent = tk.tenDangNhap;
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
    if (p && (p.trangThai === "dang_choi" || (p.trangThai === "ket_thuc" && $("ctSanhCho").style.display !== "none"))) {
      vaoPhongHaiMay(p);
      return;
    }
    if (p && p.trangThai === "mo") { hienPhongCho(); return; }
    $("ctSanhCho").style.display = "none";
    $("ctSanhChon").style.display = "";
    veDsPhong(kq.danhSach || []);
  }

  function veDsPhong(ds) {
    const khung = $("ctDsPhong");
    khung.innerHTML = "";
    if (!ds.length) {
      khung.innerHTML = '<p class="ctSanhTrong">Chưa có phòng nào. Con bấm <strong>Tạo phòng</strong> rồi rủ bạn vào nhé!</p>';
      return;
    }
    ds.forEach(p => {
      const the = document.createElement("button");
      the.type = "button";
      the.className = "ctThePhong";
      const av = document.createElement("span");
      av.className = "vcAvatar";
      VC.veAvatar(av, p.avatarChu, "🙂");
      const chu = document.createElement("span");
      chu.className = "ctThePhongChu";
      chu.innerHTML = '<span class="ctThePhongTen"></span><span class="ctThePhongPhu">đang chờ bạn vào chơi</span>';
      chu.querySelector(".ctThePhongTen").textContent = "Phòng của " + p.chuPhong;
      const vao = document.createElement("span");
      vao.className = "vcNut ctThePhongVao";
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
      phongCuaToi = kq.phong;
      hienPhongCho();
    });
  }

  function huyPhongCho() {
    const p = phongCuaToi;
    $("ctSanhCho").style.display = "none";
    $("ctSanhChon").style.display = "";
    if (p && p.trangThai === "mo") {
      phongCo.theoDoi(p, null);
      phongCo.hanhDong("roi_phong").then(() => { phongCo.ngung(); moSanh(); });
    }
  }

  /* ================= TC_03C: MỖI BẠN MỘT MÁY - BÀN CỜ ================= */
  function vaoPhongHaiMay(p) {
    phongCo.ngungSanh();
    dongKetQua();
    huyMayNghi();
    imTroLy();
    thoiHoi(); boGoiY();
    choKhenXong = null;
    cheDo = "hai_may";
    dangNghi = false; dangGoiY = false; dangGui = false; oChon = -1; dichChon = [];
    phong = p;
    van = CT.VanCoTuong.tuNuocDi("c1", p.nuocDi);
    datHuongBan(benToi() === CT.DEN);
    daBaoKetQua = p.trangThai === "ket_thuc" ? p.id + "_" + p.vanSo : "";   // vào lại ván đã xong: không hiện lại khung
    hienKhu("choi");
    if (tapTrung) tapTrung.batNeuDienThoai();
    veTatCa();
    phongCo.theoDoi(p, nhanPhong);
  }

  function nhanPhong(p) {
    if (cheDo !== "hai_may") return;
    const cu = phong;
    // đang gửi nước đi: bỏ qua bản phòng cũ chưa có nước đó (tránh quân nhảy qua nhảy lại)
    if (dangGui && cu && p.vanSo === cu.vanSo && p.nuocDi.length < van.nuocDi.length) return;
    phong = p;
    if (!cu || p.vanSo !== cu.vanSo || p.nuocDi.length !== van.nuocDi.length) {
      if (cu && p.vanSo !== cu.vanSo) { dongKetQua(); if (tapTrung) tapTrung.batNeuDienThoai(); }
      oChon = -1; dichChon = [];
      van = CT.VanCoTuong.tuNuocDi("c1", p.nuocDi);
    }
    datHuongBan(benToi() === CT.DEN);    // ván mới đổi người cầm Đỏ: xoay bàn theo
    veTatCa();
    if (p.trangThai === "ket_thuc" || p.trangThai === "dong") ketThucHaiMay();
  }

  /* Đi trước trên màn hình cho nhanh, rồi gửi máy chủ; máy chủ từ chối / mạng lỗi thì dựng lại */
  function diHaiMay(tu, den) {
    const soNuoc = van.nuocDi.length;
    if (!van.di(tu, den)) { veBan(); return; }
    const nuoc = van.nuocDi[soNuoc];
    dangGui = true;
    veTatCa();
    phongCo.di(soNuoc, nuoc).then(kq => {
      dangGui = false;
      if (kq && kq.thanhCong && kq.phong) { nhanPhong(kq.phong); return; }
      van = CT.VanCoTuong.tuNuocDi("c1", phong ? phong.nuocDi : []);
      if (kq && kq.phong) nhanPhong(kq.phong);
      else veTatCa();
      $("ctLoiLuot").textContent = "Mạng chập chờn, con đi lại nước đó nhé.";
      phongCo.hoiNgay();
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
      if (!daBao && p.ketQua) hienKetQuaHaiMay(p);
      else datKetQua("🚪", h.ban + " đã rời phòng", "Con tạo phòng mới để chơi tiếp nhé!");
      $("ctNutChoiLai").style.display = "none";
      $("ctKetQuaCho").textContent = "🚪 " + h.ban + " đã rời phòng.";
      moKetQuaHaiMay();
      return;
    }
    if (daBaoKetQua !== ma) {
      daBaoKetQua = ma;
      setTimeout(() => {
        if (!phong || phong.id + "_" + phong.vanSo !== ma) return;
        hienKetQuaHaiMay(phong);
        moKetQuaHaiMay();
      }, p.lyDo === "bi" ? 1300 : 400);
      return;
    }
    veChoChoiLai();
  }

  function moKetQuaHaiMay() {
    veNutTheoCheDo();
    $("ctKetQua").classList.add("vcHien");
    if (tapTrung) tapTrung.thoat();
    $("ctNutChoiLai").focus();
  }

  function hienKetQuaHaiMay(p) {
    const h = VC.haiBenPhong(p);
    if (p.ketQua === "hoa") {
      datKetQua("🤝", "Hoà rồi!", (p.lyDo === "dong_y_hoa" ? "Hai bạn đồng ý hoà." : (LOI_HOA[p.lyDo] || "")) + " Ngang tài ngang sức!");
    } else if (p.nguoiThang === h.toi) {
      datKetQua("🏆", "Con thắng rồi!", p.lyDo === "dau_hang" ? h.ban + " chịu thua. Con giỏi quá!"
        : p.lyDo === "roi_phong" ? h.ban + " đã rời phòng nên con thắng ván này."
        : "Con chiếu bí Tướng của " + h.ban + ". Giỏi quá!");
    } else {
      datKetQua("💪", h.ban + " thắng ván này!", (p.lyDo === "dau_hang" ? "Không sao, ván sau cố lên nhé! " : "Thua một ván không sao! ") +
        meoNho(h.ban) + " Chơi ván nữa phục thù nào!");
    }
    const oKc = $("ctKetQuaKimCuong");
    const k = p.thuong && p.thuong[h.toi];
    if (!laBe) oKc.textContent = "Tài khoản của bé mới nhận " +
      thuong2n()[p.ketQua === "hoa" ? "hoa" : p.nguoiThang === h.toi ? "thang" : "thua"] + " kim cương nhé.";
    else if (!k) oKc.textContent = "";
    else if (k.duNuoc === false) oKc.textContent = "Ván ngắn quá nên chưa có kim cương. Chơi ván dài hơn (từ " +
      ((thanhTich && thanhTich.soNuocToiThieu2n) || 20) + " nước) là có nhé!";
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
    const nut = $("ctNutChoiLai");
    const cho = $("ctKetQuaCho");
    // ván sau đổi người cầm Đỏ: con đang cầm Đỏ thì ván sau bạn cầm Đỏ
    const sauDo = h.toiDiTruoc ? h.ban : "con";
    if (p.muonChoiLai === h.toi) {
      nut.disabled = true; nut.textContent = "⏳ Đang chờ " + h.ban + "...";
      cho.textContent = "Con đã bấm chơi ván nữa. Ván sau " + sauDo + " cầm quân Đỏ, đi trước.";
    } else if (p.muonChoiLai === h.ban) {
      nut.disabled = false; nut.textContent = "▶ Đồng ý chơi ván nữa";
      cho.textContent = "🙋 " + h.ban + " muốn chơi ván nữa với con!";
    } else {
      nut.disabled = false; nut.textContent = "▶ Chơi ván nữa";
      cho.textContent = h.banVangGiay > VANG_LAU ? "📶 " + h.ban + " đang mất kết nối..." : "";
    }
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
    if (!van || (viec === "dau_hang" && van.daXong)) return;
    const haiMay = cheDo === "hai_may" && phong;
    const h = haiMay ? VC.haiBenPhong(phong) : null;
    hoiLaiViec = viec;
    if (viec === "dau_hang") {
      $("ctHoiLaiHinh").textContent = "🏳️";
      $("ctHoiLaiTieuDe").textContent = "Con chịu thua ván này?";
      $("ctHoiLaiLoi").textContent = haiMay ? h.ban + " sẽ thắng ván này. Còn nước đi thì cứ cố thêm chút nữa nhé!"
        : "Còn nước đi thì cứ cố thêm chút nữa nhé! Biết đâu máy sơ hở.";
      $("ctNutHoiLaiCo").textContent = "🏳️ Chịu thua";
    } else {
      $("ctHoiLaiHinh").textContent = "🚪";
      $("ctHoiLaiTieuDe").textContent = "Con muốn rời phòng?";
      $("ctHoiLaiLoi").textContent = haiMay && phong.trangThai === "dang_choi"
        ? "Ván đang chơi dở, rời phòng là " + h.ban + " thắng ván này." : "Con có thể tạo phòng mới để chơi tiếp sau.";
      $("ctNutHoiLaiCo").textContent = "🚪 Rời phòng";
    }
    $("ctHoiLai").classList.add("vcHien");
    $("ctNutHoiLaiKhong").focus();
  }
  function dongHoiLai() { $("ctHoiLai").classList.remove("vcHien"); hoiLaiViec = null; }
  function xacNhanHoiLai() {
    const viec = hoiLaiViec;
    dongHoiLai();
    if (cheDo !== "hai_may") { if (viec === "dau_hang") chiuThua(); return; }
    if (!phongCo || !phong) return;
    if (viec === "dau_hang") { phongCo.hanhDong("dau_hang"); return; }
    if (viec === "roi_phong") {
      const xong = () => { phongCo.ngung(); phong = null; phongCuaToi = null; cheDo = "may"; datHuongBan(false); dongKetQua(); hienKhuChon(); };
      if (phong.trangThai === "dong") xong();
      else phongCo.hanhDong("roi_phong").then(xong);
    }
  }

  /* ---------------- CHỊU THUA (chơi với máy) ---------------- */
  function chiuThua() {
    if (!van || van.daXong) return;
    huyMayNghi();
    dangNghi = false; dangGoiY = false;
    van.ketQua = "thua"; van.lyDo = "dau_hang";
    oChon = -1; dichChon = [];
    veBan(); capNhatLuot();
    ketThucVan();
  }

  function doiChu() {
    chuViet = !chuViet;
    try { localStorage.setItem(KHOA_CHU, chuViet ? "viet" : "han"); } catch (e) { /* bỏ qua */ }
    $("ctNutDoiChu").textContent = chuViet ? "字 Chữ Hán" : "🔤 Chữ Việt";
    if (van) veBan();
  }

  /* ---------------- KHỞI ĐỘNG ---------------- */
  document.addEventListener("DOMContentLoaded", () => {
    try { chuViet = localStorage.getItem(KHOA_CHU) !== "han"; } catch (e) { chuViet = true; }
    $("ctNutDoiChu").textContent = chuViet ? "字 Chữ Hán" : "🔤 Chữ Việt";
    taoBan();
    tapTrung = new VC.TapTrung(() => !!(van && !van.daXong && $("ctKhuChoi").style.display !== "none"), $("ctNutHang"));
    $("ctNutVanMoi").addEventListener("click", () => batDauVan(doiThu.muc));
    $("ctNutDoiCap").addEventListener("click", hienKhuChon);
    $("ctNutChiuThua").addEventListener("click", () => hoiLai("dau_hang"));
    $("ctNutHoiLaiCo").addEventListener("click", xacNhanHoiLai);
    $("ctNutHoiLaiKhong").addEventListener("click", dongHoiLai);
    $("ctNutDoiChu").addEventListener("click", doiChu);
    VC.giong.khoiDong();
    veNutTroLy();
    $("ctNutTroLy").addEventListener("click", doiTroLy);
    $("ctNutGoiY").addEventListener("click", bamGoiY);   // TC_03E
    $("ctNutChoiTiep").addEventListener("click", () => { const v = docVanDo(); if (v) batDauVan(v.muc, v.nuocDi, v.maVan); });
    $("ctNutChoiLai").addEventListener("click", choiLai);
    $("ctNutXemBan").addEventListener("click", dongKetQua);
    $("ctNutKetQuaDoi").addEventListener("click", () => {
      if (cheDo === "hai_may") {
        if (phong && phong.trangThai === "dang_choi") hoiLai("roi_phong");
        else { hoiLaiViec = "roi_phong"; xacNhanHoiLai(); }   // hết ván rồi: rời luôn, khỏi hỏi
        return;
      }
      dongKetQua(); hienKhuChon();
    });
    $("ctNutDauCapBe").addEventListener("click", () => batDauVan(CT.CAP[capBe].muc));
    $("ctKetQua").addEventListener("click", su => { if (su.target === $("ctKetQua")) dongKetQua(); });
    $("ctHoiLai").addEventListener("click", su => { if (su.target === $("ctHoiLai")) dongHoiLai(); });
    document.addEventListener("keydown", su => {
      if (su.key === "Escape") { dongKetQua(); dongHoiLai(); }
    });
    // TC_03C: mỗi bạn một máy
    $("ctTheHaiMay").addEventListener("click", () => { roiPhongNeuCo(); moSanh(); });
    $("ctNutVaoLai").addEventListener("click", () => { if (phongCuaToi) vaoPhongHaiMay(phongCuaToi); });
    $("ctNutTaoPhong").addEventListener("click", taoPhong);
    $("ctNutHuyPhong").addEventListener("click", huyPhongCho);
    $("ctNutRoiSanh").addEventListener("click", () => { cheDo = "may"; hienKhuChon(); });
    $("ctNutXinHoa").addEventListener("click", () => { if (phongCo && phong) phongCo.hanhDong("xin_hoa"); });
    $("ctNutDongYHoa").addEventListener("click", () => { if (phongCo && phong) phongCo.hanhDong("dong_y_hoa"); });
    $("ctNutTuChoiHoa").addEventListener("click", () => { if (phongCo && phong) phongCo.hanhDong("tu_choi_hoa"); });
    $("ctNutRoiPhong").addEventListener("click", () => hoiLai("roi_phong"));
  });

  document.addEventListener("kcSanSang", su => {
    const ct = su.detail || {};
    if (!ct.daDangNhap || !ct.taiKhoan) { tk = null; return; }
    tk = ct.taiKhoan;
    laBe = tk.vaiTro === "tre";
    capToiDa = CT.CAP_TOI_DA;
    capBe = laBe ? Math.min(capToiDa, docCapDaLuu()) : capToiDa;
    ketQuaVan = new VC.KetQuaVan(TRO_CHOI, laBe ? tk.tenDangNhap : "", kcGoiRpc, kcDocPhien);
    goiY = new VC.GoiY(TRO_CHOI, kcGoiRpc, kcDocPhien, laBe);   // TC_03E
    phongCo = new VC.PhongCo(TRO_CHOI, kcGoiRpc, kcDocPhien, typeof kcSupabaseClient !== "undefined" ? kcSupabaseClient : null);   // TC_03C
    hienKhuChon();
    troLy.tai(kcGoiRpc).then(() => VC.giong.datGiongQuanTri(troLy.giongDocTen));   // TC_03D
    // ván đã xong lúc mất mạng: gửi bù TRƯỚC rồi mới hỏi thành tích (ván thắng lên cấp được ghi trước)
    ketQuaVan.gui().then(r => { if (typeof r.diemSoMoi === "number") capNhatKimCuong(r.diemSoMoi); }).then(taiThanhTich);
  });
})();
// 23/10/2026 11:50 - BƯỚC: TC_03C (chơi 2 người, mỗi bạn một máy) | 23/10/2026 07:40 - BƯỚC: TC_03E
