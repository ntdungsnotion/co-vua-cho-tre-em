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
   BƯỚC: TC_03A
   NGÀY: 22/10/2026 21:10
   PHỤ THUỘC: kc_auth.js (sự kiện kcSanSang, kcDocPhien, kcLuuPhien), kc_api.js (kcGoiRpc),
              chung/vc_van_co.js (VC), co_tuong/ct_logic.js (CT), co_tuong/ct_may_nghi.js (Worker).
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
    $("ctKhuChoi").style.display = ten === "choi" ? "" : "none";
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
    veNutVanDo();
  }

  function hienKhuChon() {
    if (tapTrung) tapTrung.thoat();
    huyMayNghi();
    dangNghi = false;
    hienKhu("chon");
    veLuoiCap();
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
      cl.toggle("ctCuaBe", q > 0);
      cl.toggle("ctChon", o === oChon);
      cl.toggle("ctDich", dich.has(o));
      cl.toggle("ctCoQuan", dich.has(o) && q !== 0);
      cl.toggle("ctVuaTu", o === vuaTu);
      cl.toggle("ctVuaDen", o === vuaDen);
      cl.toggle("ctBiChieu", o === oChieu);
    }
    const ban = $("ctBan");
    ban.classList.toggle("ctChoMay", dangNghi);
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
    ve($("ctDaAnBe"), -1);
    ve($("ctDaAnMay"), 1);
  }

  /* ---------------- NGƯỜI CHƠI + LỜI LƯỢT ---------------- */
  function veNguoiChoi() {
    VC.veAvatar($("ctAvatarBe"), tk && tk.avatarDaChon, "🙂");
    $("ctTenBe").textContent = tk ? tk.tenDangNhap : "Con";
    $("ctKimCuongBe").textContent = "💎 " + (tk && typeof tk.diemSo === "number" ? tk.diemSo : 0);
    VC.veAvatar($("ctAvatarMay"), doiThu.hinh, "🙂");
    $("ctTenMay").textContent = doiThu.ten;
    $("ctPhuMay").textContent = "quân Đen · cấp " + doiThu.cap;
  }

  function capNhatLuot() {
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
    $("ctLoiLuot").textContent = loi;
    if (tapTrung) tapTrung.capNhatNut();
  }

  function veTatCa() { veNguoiChoi(); veBan(); capNhatLuot(); }

  /* ---------------- CHƠI ---------------- */
  function batDauVan(muc, nuocDiCu) {
    dongKetQua();
    huyMayNghi();
    doiThu = timDoiThu(muc);
    van = nuocDiCu ? CT.VanCoTuong.tuNuocDi(doiThu.muc, nuocDiCu) : new CT.VanCoTuong(doiThu.muc);
    if (van.daXong || (nuocDiCu && van.nuocDi.length !== nuocDiCu.length)) van = new CT.VanCoTuong(doiThu.muc);
    dangNghi = false; oChon = -1; dichChon = [];
    hienKhu("choi");
    if (tapTrung) tapTrung.batNeuDienThoai();
    veTatCa();
    luuVanDo();
    if (van.luot === CT.DEN) mayDi();
  }

  function bamO(o) {
    if (!van || van.daXong || dangNghi || van.luot !== CT.DO) return;
    const q = van.quan(o);
    if (oChon >= 0 && dichChon.indexOf(o) !== -1) {
      const tu = oChon;
      oChon = -1; dichChon = [];
      if (van.di(tu, o)) sauNuocDi();
      else veBan();
      return;
    }
    if (q > 0 && o !== oChon) {
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

  function sauNuocDi() {
    luuVanDo();
    veBan(); capNhatLuot();
    if (van.daXong) ketThucVan();
    else if (van.luot === CT.DEN) mayDi();
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
        if (!van.diSo(n2)) {
          // phòng hờ: nước lỗi thì đi nước hợp lệ đầu tiên (không bao giờ kẹt ván)
          const ds = van.the.nuocHopLe();
          if (ds.length) van.diSo(CT.maNuoc(ds[0]));
        }
        dangNghi = false;
        sauNuocDi();
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
  /* -> Promise<nước máy đi>; -1 = Worker không chạy được / quá lâu, -2 = đã huỷ */
  function hoiMayNghi(nuocDi, cap) {
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
      mayNghi.postMessage({ id, nuocDi: nuocDi.slice(), cap });
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
    // Giống Cờ Vua: thắng máy ĐÚNG cấp của mình -> lên cấp (máy chủ chốt lại khi nhận kết quả)
    const capVan = CT.capCuaMuc(van.muc);
    const lenCap = laBe && van.ketQua === "thang" && capVan === capBe && capBe < capToiDa;
    if (lenCap) datCapBe(capBe + 1);
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
    $("ctNutChoiLai").textContent = "▶ Chơi ván nữa";
  }

  const LOI_HOA = {
    lap: "Hai bên đi đi lại lại cùng một thế cờ 3 lần nên hoà.",
    khong_an: "60 lượt liền không bên nào ăn được quân nên hoà.",
    dai: "Ván cờ dài quá 300 nước nên hoà.",
    het_quan: "Hai bên không còn quân nào sang sông tấn công được nên hoà."
  };
  const MEO = [
    "Mẹo nhỏ: trước khi đi, nhìn xem quân nào của máy đang nhắm vào Tướng con nhé.",
    "Mẹo nhỏ: đừng để Xe đứng chỗ Mã hay Pháo của máy ăn được.",
    "Mẹo nhỏ: giữ Sĩ và Tượng ở cạnh Tướng, Tướng sẽ khó bị chiếu bí hơn.",
    "Mẹo nhỏ: Pháo cần 1 quân làm \"ngòi\" mới ăn được, để ý ngòi của Pháo máy nhé."
  ];

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
        MEO[Math.floor(Math.random() * MEO.length)] + " Chơi lại phục thù nào!");
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
    batDauVan($("ctKetQua").classList.contains("ctLenCap") ? CT.CAP[capBe].muc : doiThu.muc);
  }

  /* ---------------- CHỊU THUA ---------------- */
  function chiuThua() {
    $("ctHoiLai").classList.remove("vcHien");
    if (!van || van.daXong) return;
    huyMayNghi();
    dangNghi = false;
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
    $("ctNutChiuThua").addEventListener("click", () => {
      if (!van || van.daXong) return;
      $("ctHoiLai").classList.add("vcHien");
      $("ctNutHoiLaiKhong").focus();
    });
    $("ctNutHoiLaiCo").addEventListener("click", chiuThua);
    $("ctNutHoiLaiKhong").addEventListener("click", () => $("ctHoiLai").classList.remove("vcHien"));
    $("ctNutDoiChu").addEventListener("click", doiChu);
    $("ctNutChoiTiep").addEventListener("click", () => { const v = docVanDo(); if (v) batDauVan(v.muc, v.nuocDi); });
    $("ctNutChoiLai").addEventListener("click", choiLai);
    $("ctNutXemBan").addEventListener("click", dongKetQua);
    $("ctNutKetQuaDoi").addEventListener("click", () => { dongKetQua(); hienKhuChon(); });
    $("ctNutDauCapBe").addEventListener("click", () => batDauVan(CT.CAP[capBe].muc));
    $("ctKetQua").addEventListener("click", su => { if (su.target === $("ctKetQua")) dongKetQua(); });
    $("ctHoiLai").addEventListener("click", su => { if (su.target === $("ctHoiLai")) $("ctHoiLai").classList.remove("vcHien"); });
    document.addEventListener("keydown", su => {
      if (su.key === "Escape") { dongKetQua(); $("ctHoiLai").classList.remove("vcHien"); }
    });
  });

  document.addEventListener("kcSanSang", su => {
    const ct = su.detail || {};
    if (!ct.daDangNhap || !ct.taiKhoan) { tk = null; return; }
    tk = ct.taiKhoan;
    laBe = tk.vaiTro === "tre";
    capToiDa = CT.CAP_TOI_DA;
    capBe = laBe ? Math.min(capToiDa, docCapDaLuu()) : capToiDa;
    ketQuaVan = new VC.KetQuaVan(TRO_CHOI, laBe ? tk.tenDangNhap : "", kcGoiRpc, kcDocPhien);
    hienKhuChon();
    // ván đã xong lúc mất mạng: gửi bù TRƯỚC rồi mới hỏi thành tích (ván thắng lên cấp được ghi trước)
    ketQuaVan.gui().then(r => { if (typeof r.diemSoMoi === "number") capNhatKimCuong(r.diemSoMoi); }).then(taiThanhTich);
  });
})();
// 22/10/2026 21:10 - BƯỚC: TC_03A
