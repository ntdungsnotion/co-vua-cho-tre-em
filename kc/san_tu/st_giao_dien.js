/* ================================================================
   FILE: san_tu/st_giao_dien.js
   CHỨC NĂNG: GIAO DIỆN + VÒNG LẶP của game Săn Từ (UIManager): màn bắt đầu / tạm
              dừng / kết quả, thanh thông tin (giờ, tiến độ, mạng, kim cương), khung
              chọn từ, nút âm thanh; nối sự kiện của lõi game với âm thanh và hiệu ứng.
              Bàn phím (máy tính): phím 1-4 chọn từ, P hoặc Esc tạm dừng, Enter bắt đầu.
   BƯỚC: TC_00B
   NGÀY: 15/10/2026
   CẬP NHẬT: 15/10/2026 - sổ ghi nhớ từ của từng bé: nút độ khó hiện số từ đã thuộc,
             màn kết quả khen các từ bé vừa thuộc (từ thuộc rồi sẽ ít gặp lại).
   CẬP NHẬT: 15/10/2026 - TC_00D: chọn đường đua (10 đường) + chọn màn (7 màn, khóa / mở,
             sao), độ khó cũ thành "Cấp từ vựng"; qua màn thì mở màn tiếp, nút "Màn tiếp".
   CẬP NHẬT: 16/10/2026 - TC_00D2: bấm đúng là nhảy / bắn ngay; quái có thanh máu thì khung
             chọn từ giữ nguyên, bé bấm lại đúng từ để bắn tiếp (báo "còn N viên"); chạm vì
             nhảy sớm / trễ thì nhắc bé canh lúc bấm. Cấp từ 3-4: ẩn chữ, bé chỉ nghe đọc từ
             + nhìn hình để chọn (bấm hình để nghe lại).
   CẬP NHẬT: 16/10/2026 - TC_00D2 (sau khi người dùng thử): bé nhảy được nhiều lần (nút chữ không
             khóa sau cú nhảy, bấm lại để nhảy tiếp); màn "Tập chơi" (màn 0) trước màn 1 với lời
             hướng dẫn từng chướng ngại vật; BẢNG ÔN TẬP cuối màn: ghép hình - chữ, ghép hết mới
             lưu qua màn / mở màn tiếp, có lời khen và động viên. Từ hiện ra là đọc to ngay; bé bấm
             chữ thì đọc lại chữ đó (trùng từ đang đọc dở thì đọc tiếp cho xong).
             Cụm kim cương có từ riêng (đứng ở chỗ trống): lời nhắc / thông báo riêng cho cụm.
             Hang kim cương (rơi hố may mắn): thông báo vào / ra hang, từ của cửa ánh sáng.
   CẬP NHẬT: 16/10/2026 - TC_00G: bảng ôn tập có đồng hồ thưởng kim cương (ghép nhanh được tới 5 viên,
             trung bình 1, chậm 0, bấm sai bị trừ sớm hơn); kim cương thưởng cộng vào kết quả màn.
   CẬP NHẬT: 16/10/2026 - TC_00E: đường đua 2 "Xứ sở kẹo ngọt"; menu vẽ cảnh của đường đua đang
             chọn; lời nhắc Tập chơi dùng tên vật / hố của từng đường. Xem thử cho bố mẹ: thêm
             #xem-<mã đường> vào địa chỉ (vd #xem-keo) để mở mọi màn của đường đó mà chưa cần qua
             đường trước (chỉ trong lần mở trang đó, không lưu).
   CẬP NHẬT: 16/10/2026 - TC_00G3: LƯỢT ĐUA, 3 mạng dùng chung cho cả màn 1-7 của một đường (không
             hồi lại mỗi màn). Mạng còn lại mang sang màn sau, lưu ngay khi mất / đổi mạng; hết sạch
             mạng ở đường chưa xong thì chơi lại từ màn 1. Menu và màn kết quả báo số mạng còn lại.
   CẬP NHẬT: 16/10/2026 - TC_01: xong mỗi màn (qua màn sau bảng ôn tập, hoặc thua) thì cất kim cương
             CÒN LẠI của màn (nhặt được trừ số đã đổi mạng) vào kho kim cương của bé (st_kho_kc.js);
             màn kết quả báo đã cất bao nhiêu / đủ trần ngày / mạng chập chờn giữ lại gửi sau.
             Tập chơi và Xem thử không cất.
   ================================================================ */
(function () {
  "use strict";
  const ST = window.ST, CH = ST.CAU_HINH;
  const $ = id => document.getElementById(id);
  const KHOA_DO_KHO = "kc_santu_do_kho";
  const KHOA_DUONG = "kc_santu_duong";

  const am = new ST.QuanLyAmThanh();
  const ve = new ST.BoVe($("manHinh"));
  let g = null;              // lượt chơi hiện tại
  let maDoKho = "de";
  // Sổ ghi nhớ từ: tách riêng theo tên đăng nhập của bé (máy dùng chung)
  let tenBe = "";
  try { tenBe = (JSON.parse(sessionStorage.getItem("coVuaTaiKhoanDangNhap") || "null") || {}).tenDangNhap || ""; } catch (e) { tenBe = ""; }
  const soTay = new ST.SoTayTu(tenBe);
  const tienDo = new ST.TienDoDuongDua(tenBe); // bé đã mở tới màn nào, mỗi màn mấy sao
  // Xem thử cho bố mẹ (#xem-keo): mở mọi màn của một đường đua trong lần mở trang này, không lưu
  const xemThu = (location.hash.match(/^#xem-(\w+)$/) || [])[1];
  if (xemThu && ST.DUONG_DUA.some(d => d.ma === xemThu && d.daCo)) {
    const duongMoGoc = tienDo.duongMo.bind(tienDo), manMoGoc = tienDo.manMo.bind(tienDo);
    tienDo.duongMo = ma => ma === xemThu || duongMoGoc(ma);
    tienDo.manMo = ma => ma === xemThu ? ST.SO_MAN : manMoGoc(ma);
    try { localStorage.setItem("kc_santu_duong", xemThu); } catch (e) { /* bỏ qua */ }
  }
  let maDuong = "rung";
  try { const d = localStorage.getItem(KHOA_DUONG); if (d && tienDo.duongMo(d)) maDuong = d; } catch (e) { /* bỏ qua */ }
  // Bé mới (chưa qua màn nào) thì chọn sẵn màn "Tập chơi" (màn 0)
  const manMacDinh = d => (d === ST.DUONG_DUA[0].ma && tienDo.manMo(d) === 1 && tienDo.tongSao(d) === 0) ? 0 : tienDo.manMo(d);
  let soManChon = manMacDinh(maDuong);
  if (xemThu && maDuong === xemThu) soManChon = 0; // xem thử: bắt đầu từ Tập chơi của đường đó
  // Cất kim cương vào kho của bé (TC_01). Xem thử thì không cất (tên rỗng).
  const dangXemThu = !!(xemThu && ST.DUONG_DUA.some(d => d.ma === xemThu && d.daCo));
  const layPhien = () => { try { return JSON.parse(sessionStorage.getItem("coVuaTaiKhoanDangNhap") || "null"); } catch (e) { return null; } };
  const coMayChu = typeof kcGoiRpc === "function" && typeof kcSupabaseClient !== "undefined";
  const kho = new ST.KhoKimCuong(dangXemThu ? "" : tenBe, coMayChu ? kcGoiRpc : null, layPhien);
  let catMan = null;         // kim cương của màn vừa xong: { g, so, tt, kq }
  let ketQuaMan = null;      // { manMoi, xongDuong } của lần qua màn vừa rồi
  let veMan1 = false;        // vừa hết sạch mạng của lượt: phải chơi lại từ màn 1
  // Lưu mạng còn lại của lượt đua (gọi ngay khi mất / đổi mạng để thoát giữa chừng không hồi mạng)
  function luuLuot() { if (g && !g.dk.laHuongDan && g.dk.soMan) tienDo.luuLuot(g.dk.maDuong, g); }
  const timChu = n => n > 0 ? "❤️".repeat(n) : "0";
  let tuMoiThuoc = [];       // các từ bé vừa thuộc trong lượt này
  let tuDaGap = [], tuSai = []; // các từ đã hiện trong lượt / các từ bé làm sai, không kịp (cho bảng ôn tập)
  let bang = null;           // bảng ôn tập đang mở
  try { const d = localStorage.getItem(KHOA_DO_KHO); if (d && ST.DO_KHO[d]) maDoKho = d; } catch (e) { /* bỏ qua */ }
  let daHienKetQua = false;
  let idDangHien = -1;       // thử thách đang hiện trên khung chọn
  let lanThuThach = 0;

  const KHEN = ["Giỏi lắm! 🎉", "Tuyệt vời! ⭐", "Chính xác! 👏", "Siêu quá! 🚀", "Đúng rồi! 🌟"];
  const ngauNhien = a => a[Math.floor(Math.random() * a.length)];

  /* ---------------- MÀN PHỦ ---------------- */
  function hienLop(id) { ["manBatDau", "manTamDung", "manKetQua", "manOnTap"].forEach(m => $(m).classList.toggle("hien", m === id)); }

  function veChonDoKho() {
    const hop = $("chonDoKho"); hop.innerHTML = "";
    ST.THU_TU_DO_KHO.forEach(ma => {
      const d = ST.DO_KHO[ma], b = document.createElement("button");
      b.type = "button"; b.className = "nutDoKho" + (ma === maDoKho ? " chon" : "");
      const cacCap = [...new Set(d.capTu)];
      const tong = cacCap.reduce((a, c) => a + ST.KHO_TU[c].length, 0), thuoc = cacCap.reduce((a, c) => a + soTay.demThuoc(c), 0);
      b.innerHTML = `<b>${d.bieuTuong} ${d.ten}</b><span>${d.moTa}</span><i>📚 Đã thuộc ${thuoc}/${tong} từ</i>`;
      b.setAttribute("aria-pressed", ma === maDoKho);
      b.onclick = () => { maDoKho = ma; am.mo(); am.phat("nut"); try { localStorage.setItem(KHOA_DO_KHO, ma); } catch (e) { /* bỏ qua */ } veChonDoKho(); };
      hop.appendChild(b);
    });
  }
  const saoChu = n => "⭐".repeat(n) + "☆".repeat(3 - n);
  function veChonDuong() {
    const hop = $("chonDuong"); hop.innerHTML = "";
    ST.DUONG_DUA.forEach((d, i) => {
      const mo = tienDo.duongMo(d.ma), b = document.createElement("button");
      b.type = "button"; b.className = "nutDuong" + (d.ma === maDuong ? " chon" : "") + (mo ? "" : " khoa");
      const phu = !d.daCo ? "Sắp có" : mo ? `⭐ ${tienDo.tongSao(d.ma)}/${ST.SO_MAN * 3}` : "🔒 Đang khóa";
      b.innerHTML = `<span class="bt">${d.bieuTuong}</span><b>${d.ten}</b><i>${phu}</i>${tienDo.daXong(d.ma) ? '<span class="xong">🏅</span>' : ""}`;
      b.setAttribute("aria-pressed", d.ma === maDuong);
      b.onclick = () => {
        am.mo(); am.phat("nut");
        if (!mo) {
          $("ghiChuDuong").textContent = !d.daCo ? `${d.bieuTuong} ${d.ten}: đường đua này sắp ra mắt!`
            : `🔒 Qua hết 7 màn của ${ST.DUONG_DUA[i - 1].ten} để mở ${d.ten} nhé!`;
          return;
        }
        maDuong = d.ma; soManChon = manMacDinh(d.ma);
        try { localStorage.setItem(KHOA_DUONG, d.ma); } catch (e) { /* bỏ qua */ }
        veMenuChon();
      };
      hop.appendChild(b);
    });
  }
  function veChonMan() {
    const hop = $("chonMan"), d = ST.layDuongDua(maDuong); hop.innerHTML = "";
    $("nhanChonMan").textContent = `Chọn màn: ${d.bieuTuong} ${d.ten}`;
    // Màn "Tập chơi": luôn mở, chơi lại bao nhiêu lần cũng được
    const tap = document.createElement("button");
    tap.type = "button"; tap.className = "nutTapChoi" + (soManChon === 0 ? " chon" : "");
    tap.setAttribute("aria-pressed", soManChon === 0);
    tap.innerHTML = `<span class="bt">🎓</span><span><b>Tập chơi</b><i>Học cách nhảy, bắn quái và lấy kim cương</i></span>`;
    tap.onclick = () => { am.mo(); am.phat("nut"); soManChon = 0; veMenuChon(); };
    $("hopTapChoi").innerHTML = ""; $("hopTapChoi").appendChild(tap);
    for (let m = 1; m <= ST.SO_MAN; m++) {
      const mo = tienDo.manChoiDuoc(maDuong, m), cuoi = m === ST.SO_MAN, b = document.createElement("button");
      b.type = "button"; b.className = "nutMan" + (cuoi ? " cuoi" : "") + (mo ? "" : " khoa") + (m === soManChon ? " chon" : "");
      b.setAttribute("aria-label", `Màn ${m}` + (mo ? "" : " (đang khóa)"));
      const sao = tienDo.sao(maDuong, m);
      b.innerHTML = `<span class="tron">${!mo ? "🔒" : cuoi ? "🐱" : m}</span><span class="sao">${mo && sao ? saoChu(sao) : ""}</span><span class="ten">${cuoi ? d.bieuTuongDich + " Màn 7" : "Màn " + m}</span>`;
      b.onclick = () => {
        am.mo(); am.phat("nut");
        if (!mo) { $("ghiChuDuong").textContent = `🔒 Qua màn ${m - 1} để mở màn ${m} nhé!`; return; }
        soManChon = m; veMenuChon();
      };
      hop.appendChild(b);
    }
  }
  function veMenuChon() {
    ve.maDuongMenu = maDuong; // cảnh nền menu theo đường đua đang chọn
    veChonDuong(); veChonMan();
    const l = tienDo.layLuot(maDuong), tong = l.mang + l.mangDuTru;
    $("ghiChuDuong").textContent = soManChon === 0 ? "" : l.dangDo
      ? `${timChu(l.mang)}${"💛".repeat(l.mangDuTru)} Con còn ${tong} mạng cho các màn còn lại đến khi cứu bé mèo.`
      : `❤️❤️❤️ Con có ${CH.mangBanDau} mạng cho cả ${ST.SO_MAN} màn. Hết mạng thì chơi lại từ màn 1 nhé!`;
    $("nutBatDau").textContent = soManChon === 0 ? "▶ Tập chơi" : `▶ Chơi màn ${soManChon}`;
    capNhatHud(true);
  }
  const NHOM_AM = [["nhac", "🎵 Nhạc nền"], ["giong", "🗣️ Giọng đọc"], ["hieuUng", "🔔 Hiệu ứng"]];
  function veCaiDatAm() {
    document.querySelectorAll(".caiDatAm").forEach(hop => {
      hop.innerHTML = "";
      NHOM_AM.forEach(([nhom, ten]) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "nutAm" + (am.bat[nhom] ? "" : " tat"); b.textContent = ten;
        b.setAttribute("aria-pressed", am.bat[nhom]);
        b.onclick = () => {
          am.mo(); am.datBat(nhom, !am.bat[nhom]); veCaiDatAm();
          if (nhom === "hieuUng" && am.bat.hieuUng) am.phat("nut");
          if (nhom === "giong" && am.bat.giong) am.doc("hello");
        };
        hop.appendChild(b);
      });
    });
  }

  /* ---------------- BẮT ĐẦU / TẠM DỪNG / KẾT THÚC ---------------- */
  function batDau() {
    am.mo(); am.phat("nut");
    if (!tienDo.duongMo(maDuong)) { maDuong = "rung"; soManChon = tienDo.manMo("rung"); }
    else if (soManChon !== 0 && !tienDo.manChoiDuoc(maDuong, soManChon)) soManChon = tienDo.manMo(maDuong);
    // Tập chơi: luôn đủ mạng, không tính vào lượt đua. Màn 1-7: nhận mạng còn lại của lượt.
    g = new ST.TroChoi(ST.taoManChoi(maDuong, soManChon, maDoKho), { suKien, soTay, luot: soManChon ? tienDo.layLuot(maDuong) : null });
    tuMoiThuoc = []; ketQuaMan = null; veMan1 = false; tuDaGap = []; tuSai = []; bang = null;
    daHienKetQua = false; idDangHien = -1; lanThuThach = 0; daGapQuaiMau = false;
    ve.hat = [];
    $("thongBao").innerHTML = "";
    g.batDau();
    hienLop(null);
    veKhungChon();
    const d = g.dk.duong;
    bao(g.dk.laHuongDan ? "🎓 Tập chơi" : `${d.bieuTuong} Màn ${g.dk.soMan}${g.dk.laManCuoi ? " · Cứu bé mèo!" : ""}`);
    if (g.dk.laHuongDan) loiNhan("Bé tự chạy. Từ sẽ hiện ở đây, con làm theo lời nhắc nhé! 😊", "tot");
  }
  function manTiep() {
    if (soManChon === 0) soManChon = 1; // tập chơi xong: vào màn 1
    else if (soManChon < ST.SO_MAN && tienDo.manChoiDuoc(maDuong, soManChon + 1)) soManChon++;
    batDau();
  }
  function tamDung() {
    if (!g || !g.tamDung()) return;
    am.tamDung();
    hienLop("manTamDung");
  }
  function tiepTuc() {
    if (!g || g.trangThai !== "tamDung") return;
    am.mo(); am.tiepTuc();
    g.tiepTuc();
    hienLop(null);
  }
  function veMenu() {
    if (g) {
      am.dungNhac(); am.dungDoc(); am.tiepTuc();
      // vừa qua màn: chọn sẵn màn kế tiếp cho bé
      if (g.trangThai === "thang" && tienDo.manChoiDuoc(maDuong, soManChon + 1)) soManChon++;
    }
    g = null; idDangHien = -1;
    veChonDoKho(); veMenuChon();
    hienLop("manBatDau");
    veKhungChon();
  }
  function hienKetQua() {
    daHienKetQua = true;
    const thang = g.trangThai === "thang", tk = g.thongKe, dk = g.dk, d = dk.duong;
    const cuoi = thang && dk.laManCuoi, conLai = ST.SO_MAN - dk.soMan, tap = !!dk.laHuongDan;
    $("ketQuaHinh").textContent = cuoi ? "🐱💖👧" : thang ? (tap ? "🎓👧🎉" : "🚩👧🎉") : g.lyDoThua === "hetGio" ? "⏰" : "💔";
    $("ketQuaTieuDe").textContent = cuoi ? "Giải cứu bé mèo thành công!" : thang ? (tap ? "Con tập chơi xong rồi!" : `Qua màn ${dk.soMan} rồi!`)
      : g.lyDoThua === "hetGio" ? "Hết giờ mất rồi!" : tap ? "Hết mạng mất rồi!" : `Hết ${CH.mangBanDau} mạng mất rồi!`;
    $("ketQuaSao").textContent = thang && !tap ? saoChu(g.soSao()) : "";
    const iDuong = ST.DUONG_DUA.indexOf(d), duongSau = ST.DUONG_DUA[iDuong + 1];
    $("ketQuaLoi").textContent = cuoi
      ? `Con đã hoàn thành đường đua ${d.ten}! Mèo con cảm ơn con nhiều lắm!` + (duongSau
        ? (duongSau.daCo ? ` Đường đua ${duongSau.bieuTuong} ${duongSau.ten} đã mở!` : ` Đường đua ${duongSau.bieuTuong} ${duongSau.ten} sắp ra mắt nhé!`) : "")
      : thang && tap ? "Con đã biết nhảy, bắn quái và lấy kim cương rồi. Vào màn 1 giải cứu mèo con thôi!"
      : tap ? "Không sao đâu, tập lại một lần nữa nhé. Con làm được mà! 💪"
      : thang ? `Bé mèo đang chờ ở ${d.dich.toLowerCase()}, còn ${conLai} màn nữa. Cố lên!` + (ketQuaMan && ketQuaMan.manMoi ? ` Đã mở màn ${dk.soMan + 1} 🔓` : "")
        + ` Con còn ${g.tongMang} mạng ${timChu(g.mang)}${"💛".repeat(g.mangDuTru)} mang sang màn ${dk.soMan + 1}.`
      : g.lyDoThua === "hetGio" ? `Con đã đi được ${Math.round(g.tienDo * 100)}% đường màn ${dk.soMan}, thử lại nhanh hơn nhé! Con vẫn còn ${timChu(g.mang)}${"💛".repeat(g.mangDuTru)}.`
      : veMan1 ? `Con đã đi tới ${Math.round(g.tienDo * 100)}% đường màn ${dk.soMan}. Mèo con vẫn chờ, mình chạy lại từ màn 1 với ${CH.mangBanDau} mạng mới nhé! Sao con đã đạt vẫn được giữ. 💪`
        : `Cẩn thận quái vật và hố sâu nhé. Con đã đi được ${Math.round(g.tienDo * 100)}% đường màn ${dk.soMan}!`;
    const coManTiep = thang && !cuoi;
    $("nutManTiep").style.display = coManTiep ? "" : "none";
    $("nutManTiep").textContent = tap ? "▶ Vào màn 1" : `▶ Màn ${dk.soMan + 1}`;
    $("nutChoiLai").className = coManTiep ? "nutVua nhat" : "nutLon";
    $("nutChoiLai").textContent = tap ? "↻ Tập lại" : thang ? "↻ Chơi lại màn này" : veMan1 ? "↻ Chơi lại từ màn 1" : "↻ Chơi lại";
    $("kqDung").textContent = tk.dung;
    $("kqKC").textContent = g.tongKimCuong;
    $("kqKCOnTap").textContent = g.kimCuongOnTap ? `(ôn tập +${g.kimCuongOnTap})` : "";
    veKho();
    $("kqGio").textContent = Math.ceil(g.thoiGian);
    const kqThuoc = $("kqThuocMoi");
    kqThuoc.style.display = tuMoiThuoc.length ? "" : "none";
    kqThuoc.textContent = `🎓 Con vừa thuộc thêm ${tuMoiThuoc.length} từ mới! Lần sau sẽ gặp từ mới khác nhé.`;
    const hop = $("tuDaHoc"); hop.innerHTML = "";
    $("nhanTuDaHoc").style.display = tk.tuDung.length ? "" : "none";
    tk.tuDung.forEach(t => {
      const b = document.createElement("button");
      const moi = tuMoiThuoc.includes(t.en);
      b.type = "button"; b.className = "chipTu" + (moi ? " moiThuoc" : ""); b.textContent = `${moi ? "🎓" : t.e} ${t.en}`; b.title = t.vi;
      b.onclick = () => { am.mo(); am.docTu(t.en); };
      hop.appendChild(b);
    });
    hienLop("manKetQua");
  }

  /* ---------------- CẤT KIM CƯƠNG VÀO KHO (TC_01) ----------------
     Mỗi màn chỉ cất một lần. Ghi vào hàng chờ trước rồi mới gửi: mất mạng thì gửi bù sau. */
  function capNhatDiemSo(diemSo) {
    if (typeof diemSo !== "number") return;
    try {
      const p = layPhien();
      if (p && p.tenDangNhap === tenBe) { p.diemSo = diemSo; sessionStorage.setItem("coVuaTaiKhoanDangNhap", JSON.stringify(p)); }
    } catch (e) { /* bỏ qua */ }
  }
  function catKimCuong() {
    if (!g || g.daCatKC) return;
    g.daCatKC = true;
    const dk = g.dk;
    if (dk.laHuongDan || !dk.soMan) { catMan = null; return; }
    const cm = catMan = { g, so: ST.kimCuongCatDuoc(g), tt: "", kq: null };
    if (dangXemThu) { cm.tt = "xemThu"; return; }
    if (!tenBe) { cm.tt = "chuaDangNhap"; return; }
    if (cm.so <= 0) { cm.tt = "khong"; return; }
    if (!coMayChu) { kho.them(cm.so, { duong: dk.maDuong, man: dk.soMan, cap: dk.maCapTu, thang: g.trangThai === "thang" }); cm.tt = "cho"; return; }
    const muc = kho.them(cm.so, { duong: dk.maDuong, man: dk.soMan, cap: dk.maCapTu, thang: g.trangThai === "thang" });
    cm.tt = "dangCat";
    kho.gui().then(t => {
      capNhatDiemSo(t.diemSoMoi);
      const kq = muc && kho.daGui[muc.maLuot];
      cm.kq = kq || null;
      cm.tt = kq ? (kq.thanhCong ? "xong" : "tuChoi") : t.loiMang ? "cho" : "phien";
      if (catMan === cm) veKho();
    });
  }
  function veKho() {
    const e = $("kqKho"), cm = catMan;
    if (!cm || !g || cm.g !== g) { e.style.display = "none"; return; }
    const so = cm.so, kq = cm.kq;
    let chu = "", kieu = "";
    switch (cm.tt) {
      case "dangCat": chu = `💎 Đang cất ${so} kim cương vào kho của con...`; break;
      case "xong":
        if (kq.soCong > 0) {
          chu = `💎 +${kq.soCong} kim cương đã vào kho của con!` + (typeof kq.diemSoMoi === "number" ? ` Trong kho có ${kq.diemSoMoi} 💎` : "");
          if (kq.daDuTran) chu += ` Hôm nay con đã nhận đủ ${kq.tranNgay} kim cương rồi, mai chơi tiếp nhé! 🌙`;
          kieu = "tot";
        } else chu = `🌙 Hôm nay con đã nhận đủ ${kq.tranNgay} kim cương rồi. Mai chơi tiếp để cất thêm nhé!`;
        break;
      case "cho": chu = `📶 Mạng chập chờn: ${so} kim cương được giữ lại, lần sau sẽ tự cất vào kho nhé!`; break;
      case "phien": chu = `🔑 Con đăng nhập lại để cất ${so} kim cương vào kho nhé!`; break;
      case "tuChoi": chu = "Chỉ tài khoản của bé mới cất được kim cương vào kho."; break;
      case "chuaDangNhap": chu = so > 0 ? "🔑 Đăng nhập để cất kim cương vào kho của con nhé!" : ""; break;
      case "xemThu": chu = "👀 Đang xem thử: kim cương không cất vào kho."; break;
      case "khong": chu = (g.tongKimCuong | 0) > 0 ? "💛 Kim cương màn này đã đổi thành mạng rồi." : ""; break;
    }
    e.textContent = chu;
    e.className = kieu;
    e.style.display = chu ? "" : "none";
  }

  /* ---------------- BẢNG ÔN TẬP CUỐI MÀN ----------------
     Qua màn xong: các từ vừa gặp hiện thành thẻ hình + thẻ chữ, bé ghép từng cặp cho hết.
     Ôn xong mới lưu qua màn / mở màn tiếp, rồi tới màn kết quả. */
  const KHEN_ON = ["Đúng rồi! Giỏi quá! 🎉", "Tuyệt vời! ⭐", "Con nhớ từ giỏi lắm! 👏", "Chính xác! 🌟", "Siêu quá! 🚀", "Hay lắm! 💖"];
  const DONG_VIEN = ["Chưa đúng, thử lại nhé! 💪", "Gần đúng rồi, con cố lên! 🌈", "Không sao đâu, thử thẻ khác nhé! 😊", "Nhìn kỹ hình nào, con làm được mà! 👀"];
  function coVu(chu, kieu) { const e = $("onTapCoVu"); e.textContent = chu; e.className = kieu || ""; }
  function hoanTatMan() {
    // màn Tập chơi không tính sao, không mở khóa gì
    if (g && g.trangThai === "thang" && !g.dk.laHuongDan) ketQuaMan = tienDo.ghiThang(g.dk.maDuong, g.dk.soMan, g.soSao());
    catKimCuong();
    hienKetQua();
  }
  /* Đồng hồ thưởng kim cương của bảng ôn tập: đếm giây, hiện số kim cương còn giữ được
     và thanh nấc (hết thanh là mất 1 viên). Đứng yên khi ôn xong. */
  let tOnTap0 = 0, henOnTap = null, kcOnTapCu = -1;
  const giayOnTap = () => (performance.now() - tOnTap0) / 1000;
  function capNhatDongHoOnTap() {
    if (!bang) return;
    const xong = bang.kimCuongThuong !== null, giay = xong ? bang.giayXong : giayOnTap(), th = bang.thuongLuc(giay);
    $("onTapGio").textContent = giay.toFixed(1).replace(".", ",") + " giây";
    $("onTapKC").textContent = "💎 " + th.kc;
    $("onTapNac").style.width = Math.round(th.nac * 100) + "%";
    $("onTapThuong").classList.toggle("het", th.kc === 0);
    if (kcOnTapCu >= 0 && th.kc < kcOnTapCu) { const e = $("onTapKC"); e.classList.remove("mat"); void e.offsetWidth; e.classList.add("mat"); }
    kcOnTapCu = th.kc;
    if (xong && henOnTap) { clearInterval(henOnTap); henOnTap = null; }
  }
  function hienOnTap() {
    daHienKetQua = true;
    const ds = ST.chonTuOnTap(tuDaGap, tuSai, CH.soCapOnTap);
    if (ds.length < 2) { hoanTatMan(); return; } // quá ít từ thì khỏi ôn
    bang = new ST.BangOnTap(ds, null, CH.thuongOnTap);
    tOnTap0 = performance.now(); kcOnTapCu = -1;
    if (henOnTap) clearInterval(henOnTap);
    henOnTap = setInterval(capNhatDongHoOnTap, 100);
    capNhatDongHoOnTap();
    $("onTapXong").style.display = "none";
    coVu(g.dk.laHuongDan ? "Con tập giỏi lắm! Giờ ôn lại các từ vừa gặp nhé 😊" : `Qua màn ${g.dk.soMan} rồi! Ôn lại từ vừa gặp để mở màn tiếp nhé 🔓`, "tot");
    veOnTap();
    hienLop("manOnTap");
  }
  function veOnTap() {
    const hopHinh = $("onTapHinh"), hopChu = $("onTapChu");
    hopHinh.innerHTML = '<div class="tieuDe">🖼️ Hình</div>'; hopChu.innerHTML = '<div class="tieuDe">🔤 Chữ</div>';
    [hopHinh, hopChu].forEach(h => h.style.setProperty("--soThe", bang.tu.length));
    const taoThe = (ben, en) => {
      const t = bang.layTu(en), b = document.createElement("button");
      b.type = "button"; b.className = "theOnTap " + ben; b.dataset.ben = ben; b.dataset.en = en;
      b.textContent = ben === "hinh" ? t.e : t.en;
      b.setAttribute("aria-label", ben === "hinh" ? "Hình: " + t.vi : "Chữ: " + t.en);
      b.onclick = () => bamTheOnTap(b);
      return b;
    };
    bang.hinh.forEach(en => hopHinh.appendChild(taoThe("hinh", en)));
    bang.chu.forEach(en => hopChu.appendChild(taoThe("chu", en)));
    capNhatDemOnTap();
  }
  function capNhatDemOnTap() {
    $("onTapDem").textContent = bang.xong ? "" : `Còn ${bang.conLai} cặp hình - chữ`;
  }
  const theOnTap = (ben, en) => document.querySelector(`#manOnTap .theOnTap[data-ben="${ben}"][data-en="${CSS.escape(en)}"]`);
  function bamTheOnTap(b) {
    if (!bang || bang.xong) return;
    am.mo();
    const ben = b.dataset.ben, en = b.dataset.en;
    if (ben === "chu") am.docTu(en); // bấm chữ thì nghe đọc từ đó
    const giay = giayOnTap(), kq = bang.bam(ben, en, giay);
    document.querySelectorAll("#manOnTap .theOnTap.chon").forEach(e => e.classList.remove("chon"));
    if (kq.kq === "chon") { b.classList.add("chon"); am.phat("nut"); return; }
    if (kq.kq === "sai") {
      am.phat("sai");
      const a = theOnTap(kq.truoc.ben, kq.truoc.en);
      [a, b].forEach(e => { if (e) { e.classList.remove("sai"); void e.offsetWidth; e.classList.add("sai"); } });
      coVu(ngauNhien(DONG_VIEN), "xau");
      capNhatDongHoOnTap(); // bấm sai: đồng hồ thưởng nhảy tới, viên kế tiếp bị trừ sớm hơn
      return;
    }
    if (kq.kq !== "dung") return;
    am.phat("dung");
    const a = theOnTap("hinh", en), c = theOnTap("chu", en);
    [a, c].forEach(e => { if (e) { e.classList.add("dung"); setTimeout(() => e.classList.add("biMat"), 350); } });
    capNhatDemOnTap();
    if (!kq.xong) { coVu(bang.conLai === 1 ? "Còn 1 cặp nữa thôi, cố lên! 💪" : ngauNhien(KHEN_ON), "tot"); return; }
    // ôn xong: chốt kim cương thưởng (cộng vào số kim cương của màn), khen to rồi sang màn kết quả
    bang.giayXong = giay;
    const thuong = bang.kimCuongThuong || 0;
    g.kimCuongOnTap = thuong; g.tongKimCuong += thuong;
    capNhatDongHoOnTap();
    if (thuong > 0) { am.phat("kimCuong"); $("onTapXong").textContent = `🎉 Ôn xong rồi! Thưởng ${thuong} 💎`; }
    else $("onTapXong").textContent = "🎉 Con ôn xong rồi! Lần sau ghép nhanh hơn để được kim cương nhé!";
    coVu(bang.soLanSai === 0 ? "Không sai cặp nào, con siêu quá! 🏆" : "Con ghép đúng hết rồi! 🎉", "tot");
    $("onTapXong").style.display = "block";
    setTimeout(() => am.phat("thang"), 300);
    const bangNay = bang;
    setTimeout(() => { if (bang === bangNay && $("manOnTap").classList.contains("hien")) hoanTatMan(); }, 2200);
  }

  /* ---------------- KHUNG CHỌN TỪ ---------------- */
  function veKhungChon() {
    const tt = g && g.thuThach, cacNut = $("cacNut");
    const so = g ? g.dk.soPhuongAn : (soManChon ? ST.MAN_CHOI[soManChon - 1] : ST.MAN_HUONG_DAN).soPhuongAn;
    cacNut.className = so === 3 ? "n3" : "";
    cacNut.style.setProperty("--soCot", so);
    if (!tt || tt.trangThai !== "mo") {
      // Chưa có thử thách: giữ nguyên chiều cao khung bằng các ô trống
      if (!tt || idDangHien !== tt.id) {
        idDangHien = -1;
        $("hinhTu").classList.remove("anChu"); $("chuTu").classList.remove("anChu");
        $("hinhTu").textContent = "🏃";
        $("chuTu").textContent = "...";
        $("nghiaTu").textContent = g ? "Bé đang chạy, từ mới sắp hiện!" : "Chọn đường đua, chọn màn rồi bấm Chơi";
        $("kcTu").style.display = "none";
        $("hanhDongTu").textContent = "Sẵn sàng";
        cacNut.innerHTML = "";
        for (let i = 0; i < so; i++) { const b = document.createElement("button"); b.className = "nutTu trong"; b.disabled = true; b.textContent = "-"; cacNut.appendChild(b); }
      }
      return;
    }
    if (idDangHien === tt.id) return;
    idDangHien = tt.id;
    $("hinhTu").textContent = tt.tu.e;
    $("hinhTu").classList.toggle("anChu", !!g.dk.anChu); $("chuTu").classList.toggle("anChu", !!g.dk.anChu);
    // Cấp 3-4: không hiện chữ / nghĩa, bé nghe đọc từ và nhìn hình rồi chọn
    $("chuTu").textContent = g.dk.anChu ? "🔊 Nghe và chọn" : tt.tu.en;
    $("nghiaTu").textContent = g.dk.anChu ? "Bấm vào hình để nghe lại" : tt.tu.vi;
    $("kcTu").style.display = "none";
    veHanhDong(tt);
    cacNut.innerHTML = "";
    tt.phuongAn.forEach((tu, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "nutTu"; b.dataset.tu = tu; b.dataset.id = tt.id;
      b.innerHTML = `<span class="so">${i + 1}</span>${tu}`;
      b.style.setProperty("--dai", tu.length); // từ dài thì chữ nhỏ lại, không bị cắt hay xuống dòng
      b.addEventListener("click", () => bamPhuongAn(b));
      cacNut.appendChild(b);
    });
    $("loiNhan").className = "";
    const timTu = g.dk.anChu ? "từ con vừa NGHE" : "từ GIỐNG chữ trên biển";
    $("loiNhan").textContent = tt.laCuaHang ? `✨ Cửa ánh sáng là lối ra! Bấm ${timTu} để bé nhảy vào cửa.`
      : g.dk.laHuongDan ? loiTapChoi(tt, timTu)
      : lanThuThach <= 2 && g.dk.soMan === 1 ? (tt.o.hanhDong === "nhay"
      ? (tt.o.nhom === "kimCuong" ? `💎 Bấm ${timTu} lúc bé tới gần để nhảy lên lấy kim cương!` : `👆 Bấm ${timTu} lúc bé tới gần để nhảy qua!`) : `👆 Bấm ${timTu} để bắn!`)
      : tt.o.hanhDong === "ban" && !daGapQuaiMau ? `💥 ${tt.o.ten} có thanh máu: bấm đúng từ ${tt.o.mau} lần để bắn hạ!` : "";
    if (tt.o.hanhDong === "ban") daGapQuaiMau = true;
  }
  let daGapQuaiMau = false; // lần đầu gặp quái có máu trong lượt: giải thích cách bắn
  // Màn Tập chơi: lời nhắc riêng cho từng chướng ngại vật
  function loiTapChoi(tt, timTu) {
    const o = tt.o, ten = o.ten.toLowerCase();
    if (o.hanhDong === "ban") return o.nhom === "can"
      ? `🧱 ${o.ten} cao quá, không nhảy qua được! Bấm ${timTu} ${o.mau} lần để bắn vỡ.`
      : `💥 Quái có thanh máu trên đầu: phải bắn! Bấm ${timTu} ${o.mau} lần để bắn hạ.`;
    if (o.nhom === "kimCuong") return `💎 Kim cương trên cao! Chờ bé vào dải xanh rồi bấm ${timTu} để nhảy lên lấy.`;
    if (o.nhom === "ho") return `🕳️ ${o.ten}! Chờ bé vào dải xanh rồi bấm ${timTu} để nhảy qua.`;
    if (o.nhom === "quaiDat" || o.nhom === "quaiBay") return `👾 ${o.ten} KHÔNG có thanh máu: nhảy qua là được! Chờ dải xanh rồi bấm ${timTu}.`;
    return `👆 Chờ bé chạy vào dải xanh rồi bấm ${timTu} để nhảy qua ${ten}!`;
  }
  function veHanhDong(tt) {
    const o = tt.o;
    $("hanhDongTu").textContent = o.nhom === "cuaSang" ? "✨ Nhảy vào cửa ánh sáng"
      : o.nhom === "kimCuong" ? `💎 Nhảy lấy ${o.soKimCuong} kim cương`
      : o.hanhDong === "nhay" ? "⤴ Nhảy qua " + o.ten.toLowerCase()
      : `💥 Bắn ${o.ten.toLowerCase()} · còn ${o.mau} viên`;
  }
  // Chạm sau khi đã bấm đúng: do nhảy sớm hay trễ quá
  function lyDoNhayHut(o) {
    const tt = g && g.thuThach;
    if (!tt || tt.o !== o || !tt.cuaSo) return "";
    return tt.khoangKhiBam > tt.cuaSo[1] ? "sớm" : tt.khoangKhiBam < tt.cuaSo[0] ? "trễ" : "";
  }
  function bamPhuongAn(nut) {
    if (!g || nut.disabled) return;
    const tt = g.thuThach, id = Number(nut.dataset.id);
    if (!tt || tt.id !== id) return; // lần bấm sót lại của thử thách cũ: bỏ qua
    am.mo();
    const kq = g.chonDapAn(id, nut.dataset.tu);
    // phát âm từ vừa chọn, cả khi sai (đúng từ đang đọc dở thì đọc tiếp cho xong)
    if (kq.kq === "dung" || kq.kq === "sai" || kq.lyDo === "dangNhay") am.docTu(nut.dataset.tu);
  }
  function nutCuaTu(tu) { return Array.from($("cacNut").children).find(b => b.dataset.tu === tu); }
  function khoaCacNut() { Array.from($("cacNut").children).forEach(b => { b.disabled = true; }); }
  function loiNhan(chu, kieu) { const l = $("loiNhan"); l.textContent = chu; l.className = kieu || ""; }
  function bao(chu, xau) {
    const d = document.createElement("div");
    d.className = "bao" + (xau ? " xau" : ""); d.textContent = chu;
    $("thongBao").appendChild(d);
    setTimeout(() => d.remove(), 1900);
  }
  function rung(id, lop) { const e = $(id); e.classList.remove(lop); void e.offsetWidth; e.classList.add(lop); }

  /* ---------------- SỰ KIỆN TỪ LÕI GAME ---------------- */
  function suKien(ten, d) {
    const be = g ? g.be : null;
    switch (ten) {
      case "batDau": am.batDauNhac(); break;
      case "thuThachMoi":
        lanThuThach++;
        if (!tuDaGap.some(t => t.en === d.tt.tu.en)) tuDaGap.push(d.tt.tu);
        veKhungChon();
        am.phat("hienTu");
        am.doc(d.tt.tu.en);
        break;
      case "chonDung": {
        am.phat("dung");
        const n = nutCuaTu(d.tu);
        if (d.tt.o.hanhDong === "ban") {
          // Bắn: khung chọn giữ nguyên, nút đúng nháy xanh, bé bấm tiếp tới khi hạ xong
          if (n) { n.classList.remove("dung"); void n.offsetWidth; n.classList.add("dung"); setTimeout(() => { if (n.isConnected && !n.disabled) n.classList.remove("dung"); }, 260); }
          if (d.lan === 1) loiNhan(ngauNhien(KHEN) + " Bấm tiếp để bắn!", "tot");
          break;
        }
        if (d.tt.laCuaHang) { // cửa ánh sáng: khóa khung chọn, bé tự chạy tới gờ đá rồi nhảy vào
          const n2 = nutCuaTu(d.tu); khoaCacNut();
          Array.from($("cacNut").children).forEach(b => { if (b !== n2) b.classList.add("mo"); });
          if (n2) n2.classList.add("dung");
          $("hanhDongTu").textContent = "✨ Vào cửa thôi!";
          loiNhan(ngauNhien(KHEN) + " Bé nhảy vào cửa ánh sáng nào!", "tot");
          break;
        }
        // Nhảy: nút không khóa, bé còn bấm lại được để nhảy tiếp (vd vừa nhảy lấy kim cương)
        if (n) { n.classList.remove("dung"); void n.offsetWidth; n.classList.add("dung"); setTimeout(() => { if (n.isConnected && !n.disabled) n.classList.remove("dung"); }, 300); }
        loiNhan(d.lan > 1 ? "Nhảy tiếp nào! ⤴" : ngauNhien(KHEN), "tot");
        ve.phun(be.x, be.y + 60, "lapLanh", 8, "#ffe14d");
        break;
      }
      case "vuotQua": {
        // đã nhảy qua hẳn vật: khóa khung chọn, chờ từ mới
        const n = nutCuaTu(d.tt.tu.en); khoaCacNut();
        Array.from($("cacNut").children).forEach(b => { if (b !== n) b.classList.add("mo"); });
        if (n) n.classList.add("dung");
        $("hanhDongTu").textContent = "✓ Qua rồi!";
        if (d.tt.o.nhom === "kimCuong") {
          const o = d.tt.o, lay = o.daLay || 0;
          $("hanhDongTu").textContent = `💎 ${lay}/${o.soKimCuong}`;
          loiNhan(lay >= o.soKimCuong ? "Lấy đủ kim cương rồi! 💎🎉" : lay ? `Lấy được ${lay} viên! Lần sau canh lúc bấm để lấy đủ nhé.` : "Hụt mất kim cương rồi. Lần sau canh lúc bấm nhé!", lay ? "tot" : "xau");
        }
        break;
      }
      case "trungDan": {
        const o = d.o; ve.phun(o.x + o.rong / 2, o.bayCao + o.cao / 2, "lapLanh", 6, "#fff27a");
        const tt = g.thuThach;
        if (tt && tt.o === o && d.mau > 0) { veHanhDong(tt); loiNhan(`💥 Trúng rồi! Còn ${d.mau} viên nữa`, "tot"); }
        break;
      }
      case "chonSai": {
        am.phat("sai");
        const n = nutCuaTu(d.tu); if (n) { n.classList.add("sai"); n.disabled = true; }
        if (tuSai.indexOf(d.tt.tu.en) < 0) tuSai.push(d.tt.tu.en);
        if (g.dk.anChu) { loiNhan("Chưa đúng rồi. Nghe lại nhé!", "xau"); setTimeout(() => { if (g && g.thuThach === d.tt && d.tt.trangThai === "mo") am.doc(d.tt.tu.en); }, 700); }
        else loiNhan(`Chưa đúng rồi. Tìm chữ "${d.tt.tu.en}" nhé!`, "xau");
        break;
      }
      case "ketQuaTu": {
        // Vừa chạm đúng ngưỡng thuộc ở lượt này thì khen ở màn kết quả
        const t = soTay.lay(d.tu.en);
        if (d.thuoc && t && t.lien === ST.SoTayTu.SO_DUNG_DE_THUOC) tuMoiThuoc.push(d.tu.en);
        break;
      }
      case "hetHanThuThach":
        khoaCacNut();
        if (tuSai.indexOf(d.tt.tu.en) < 0) tuSai.push(d.tt.tu.en);
        loiNhan(d.tt.o.nhom === "kimCuong" ? "Lỡ mất kim cương rồi. Lần sau bấm nhanh hơn nhé! 💎" : "Ối, không kịp rồi! Từ sau bấm nhanh hơn nhé.", "xau");
        break;
      case "nhay": am.phat("nhay"); if (!g.hang) ve.phun(be.x - 10, 4, "bui", 5); break;
      case "tiepDat": {
        am.phat("tiepDat");
        if (g.hang) { ve.phun(g.hang.x, 4, "bui", 6); break; }
        ve.phun(be.x, 4, "bui", 4);
        // đáp đất mà vật / cụm kim cương vẫn ở phía trước (nhảy sớm quá): nhắc bấm lại
        const tt = g.thuThach;
        if (tt && tt.trangThai === "mo" && tt.daDung && tt.o.hanhDong === "nhay" && g.khoangTam(tt.o) > 0)
          loiNhan(`Sớm quá! Bấm lại "${g.dk.anChu ? "từ vừa nghe" : tt.tu.en}" để nhảy ${tt.o.nhom === "kimCuong" ? "lên lấy kim cương" : "qua " + tt.o.ten.toLowerCase()}!`, "tot");
        break;
      }
      case "phep": am.phat("phep"); break;
      case "haQuai": {
        am.phat("haQuai");
        if (g.thuThach && g.thuThach.o === d.o) {
          const n = nutCuaTu(g.thuThach.tu.en); khoaCacNut();
          Array.from($("cacNut").children).forEach(b => { if (b !== n) b.classList.add("mo"); });
          if (n) n.classList.add("dung");
          $("hanhDongTu").textContent = "🎉 Đã hạ " + d.o.ten.toLowerCase();
          loiNhan(`Hạ được ${d.o.ten.toLowerCase()} rồi! 🎉`, "tot");
        }
        const o = d.o; ve.phun(o.x + o.rong / 2, o.bayCao + o.cao / 2, "khoi", 10); ve.phun(o.x + o.rong / 2, o.bayCao + o.cao / 2, "lapLanh", 8, "#fff27a");
        break;
      }
      case "nhatKimCuong":
        am.phat("kimCuong");
        ve.phun(d.k.x, d.k.y, "lapLanh", 12, "#7fe0ff");
        rung("hudKC", "nay");
        break;
      case "doiMang": am.phat("doiMang"); bao("+1 mạng 💛"); rung("hudMang", "rung"); luuLuot(); break;
      case "khung":
        am.phat("khung");
        khoaCacNut();
        { const hut = lyDoNhayHut(d.o);
          loiNhan(hut ? `Cộp! Bé nhảy ${hut} quá nên va vào ${d.o.ten.toLowerCase()}. Canh lúc bấm nhé!` : `Cộp! Va vào ${d.o.ten.toLowerCase()}, bé bị khựng lại một chút.`, "xau"); }
        break;
      case "vaQuai": am.phat("vaQuai"); break;
      case "roiHo": am.phat("roi"); break;
      // HANG KIM CƯƠNG: rơi hố may mắn, không mất mạng, đồng hồ đứng yên
      case "vaoHang":
        idDangHien = -1; veKhungChon(); khoaCacNut();
        loiNhan("Ối, bé rơi xuống hố... nhưng là hang bí mật! ✨", "tot");
        break;
      case "trongHang":
        ve.hat = [];
        am.phat("doiMang");
        bao(`💎 ${g.dk.duong.tenHang || "Hang kim cương bí mật"}!`);
        loiNhan(`Đồng hồ đứng yên. Chạy qua là nhặt được ${d.so} viên kim cương!`, "tot");
        break;
      case "vaoCuaSang": am.phat("hoiSinh"); break;
      case "raHang":
        ve.hat = [];
        bao(`+${d.daLay} 💎 Ra khỏi hang!`);
        idDangHien = -1; veKhungChon();
        loiNhan(`Giỏi quá! Nhặt được ${d.daLay} kim cương trong hang. Chạy tiếp nào! 💪`, "tot");
        break;
      case "matMang":
        bao("-1 mạng", true); rung("hudMang", "rung");
        if (g.tongMang > 0) luuLuot();
        khoaCacNut();
        { const hut = d.o ? lyDoNhayHut(d.o) : "", them = hut ? ` Bé nhảy ${hut} quá, lần sau canh lúc bấm nhé!` : "";
          loiNhan((d.lyDo === "roi" ? "Ối! Bé rơi xuống hố rồi." : `Ối! ${d.o ? d.o.ten : "Quái vật"} chạm vào bé rồi.`) + them, "xau"); }
        break;
      case "hoiSinh": am.phat("hoiSinh"); loiNhan("Bé quay lại rồi! Chạy tiếp nào 💪", "tot"); break;
      case "thang":
        am.dungNhac(); am.phat("thang");
        luuLuot(); // mạng còn lại mang sang màn sau (qua màn 7 thì ghiThang kết thúc lượt)
        // Tiến độ (mở màn tiếp) chỉ lưu khi bé ôn tập xong (hoanTatMan)
        idDangHien = -1; veKhungChon();
        if (d.laManCuoi) {
          $("hinhTu").textContent = "🏰"; $("chuTu").textContent = "castle"; $("nghiaTu").textContent = "lâu đài - tới nơi rồi!";
          loiNhan("Tới lâu đài rồi! Giải cứu bé mèo nào! 🐱", "tot");
        } else {
          $("hinhTu").textContent = "🚩"; $("chuTu").textContent = "finish"; $("nghiaTu").textContent = "về đích - qua màn rồi!";
          loiNhan(g.dk.laHuongDan ? "Tập chơi xong rồi! 🎉" : `Qua màn ${g.dk.soMan} rồi! 🎉`, "tot");
        }
        for (let i = 0; i < 4; i++) setTimeout(() => ve.phun(g ? g.doDai + 120 : 0, 200, "giay", 30, ["#ff7eb6", "#ffd23f", "#6C4CE0", "#2BB673", "#3fc8ff"][i]), i * 400);
        break;
      case "thua":
        am.dungNhac(); am.phat("thua"); khoaCacNut();
        if (!g.dk.laHuongDan && g.dk.soMan) {
          if (d.lyDo === "hetMang") { veMan1 = tienDo.hetLuot(g.dk.maDuong); if (veMan1) soManChon = 1; }
          else luuLuot(); // hết giờ: chơi lại màn này với số mạng đang còn
        }
        catKimCuong(); // thua vẫn được cất kim cương đã nhặt
        break;
    }
  }

  /* ---------------- THANH THÔNG TIN ---------------- */
  let hudTruoc = "";
  function capNhatHud(epVe) {
    if (epVe) hudTruoc = "";
    const dkHud = g ? g.dk : ST.taoManChoi(maDuong, soManChon, maDoKho);
    const tg = g ? Math.ceil(g.thoiGian) : dkHud.thoiGianChoi;
    const td = g ? g.tienDo : 0;
    const luotHud = !g && soManChon ? tienDo.layLuot(maDuong) : null;
    const mang = g ? g.mang : luotHud ? luotHud.mang : CH.mangBanDau, duTru = g ? g.mangDuTru : luotHud ? luotHud.mangDuTru : 0;
    const kc = g ? g.kimCuong : luotHud ? luotHud.kimCuong : 0;
    const khoa = [tg, Math.round(td * 200), mang, duTru, kc, dkHud.ma].join("|");
    if (khoa === hudTruoc) return;
    hudTruoc = khoa;
    $("soMan").textContent = dkHud.laHuongDan ? "🎓" : `${dkHud.soMan}/${ST.SO_MAN}`;
    $("dichHud").textContent = dkHud.laManCuoi ? dkHud.duong.bieuTuongDich : "🚩";
    $("soGio").textContent = tg;
    $("hudGio").classList.toggle("gap", !!g && g.dangChoi && tg <= 15);
    $("tienDoDay").style.width = (td * 100) + "%";
    $("tienDoBe").style.left = (td * 100) + "%";
    let tim = "";
    for (let i = 0; i < CH.mangBanDau; i++) tim += `<span class="tim${i < mang ? "" : " mat"}">❤️</span>`;
    for (let i = 0; i < duTru; i++) tim += `<span class="tim">💛</span>`;
    $("hudMang").innerHTML = tim;
    $("soKC").textContent = kc;
  }
  function capNhatDemNguoc() {
    const p = g ? g.phanThoiGianConLai() : 0, d = $("demNguocDay");
    d.style.width = (p * 100) + "%";
    d.classList.toggle("gap", p > 0 && p < 0.3);
  }

  /* ---------------- VÒNG LẶP ---------------- */
  let truoc = performance.now();
  function khung(now) {
    const dt = Math.min(0.1, Math.max(0, (now - truoc) / 1000));
    truoc = now;
    try {
      if (g) g.capNhat(dt);
      ve.ve(g, g && g.trangThai === "tamDung" ? 0 : dt);
      if (g) {
        if (g.thuThach && g.thuThach.id !== idDangHien && g.thuThach.trangThai === "mo") veKhungChon();
        if (g.dangChoi) am.datCaoTrao(g.tienDo > 0.75 ? (g.tienDo - 0.75) / 0.17 : 0);
        if (!daHienKetQua && g.trangThai === "thang" && g.tKetThuc > (g.dk.laManCuoi ? 3.6 : 2.4)) hienOnTap();
        if (!daHienKetQua && g.trangThai === "thua" && g.tKetThuc > 1.6) hienKetQua();
      }
      capNhatHud();
      capNhatDemNguoc();
    } catch (e) {
      // không để một lỗi vẽ làm đứng cả game
      if (!khung.daBao) { khung.daBao = true; console.error(e); }
    }
    requestAnimationFrame(khung);
  }

  /* ---------------- GẮN NÚT + BÀN PHÍM ---------------- */
  // Bấm hình (hoặc chữ) ở khung từ: nghe đọc lại từ đang hỏi
  const ngheLai = () => { const tt = g && g.thuThach; if (tt && tt.trangThai === "mo") { am.mo(); am.doc(tt.tu.en); } };
  $("hinhTu").onclick = ngheLai; $("chuTu").onclick = ngheLai;
  $("nutBatDau").onclick = batDau;
  $("nutChoiLai").onclick = batDau;
  $("nutManTiep").onclick = manTiep;
  $("nutChoiLaiTD").onclick = () => { am.dungNhac(); am.tiepTuc(); batDau(); };
  $("nutTiepTuc").onclick = tiepTuc;
  $("nutTamDung").onclick = () => { if (g && g.trangThai === "tamDung") tiepTuc(); else tamDung(); };
  $("nutDoiDoKho").onclick = veMenu;
  $("nutDoiDoKhoTD").onclick = veMenu;
  document.addEventListener("keydown", e => {
    if (e.repeat) return;
    if ((e.key === "p" || e.key === "P" || e.key === "Escape")) { if (g && g.trangThai === "tamDung") tiepTuc(); else tamDung(); return; }
    if (e.key === "Enter" && $("manBatDau").classList.contains("hien")) { batDau(); return; }
    if (e.key === "Enter" && $("manKetQua").classList.contains("hien")) { if ($("nutManTiep").style.display !== "none") manTiep(); else batDau(); return; }
    const so = parseInt(e.key, 10);
    if (so >= 1 && so <= 4 && g && g.trangThai === "choi") {
      const n = $("cacNut").children[so - 1];
      if (n && !n.disabled && !n.classList.contains("trong")) { n.classList.add("nhan"); bamPhuongAn(n); }
    }
  });
  // Chuyển tab / khóa màn hình khi đang chơi: tự tạm dừng
  document.addEventListener("visibilitychange", () => { if (document.hidden) tamDung(); });
  window.addEventListener("blur", () => tamDung());
  if (window.ResizeObserver) new ResizeObserver(() => ve.doiCo()).observe($("manHinh"));
  else window.addEventListener("resize", () => ve.doiCo());

  veChonDoKho();
  veMenuChon();
  veCaiDatAm();
  veKhungChon();
  if (window.matchMedia && window.matchMedia("(min-width: 1024px)").matches) $("cachChoi").open = true;
  // Mở thẳng một độ khó bằng #de, #vua, #kho, #thuThach
  const bam = location.hash.replace("#", "");
  if (ST.DO_KHO[bam]) { maDoKho = bam; veChonDoKho(); }
  // để kiểm thử tự động
  window.__sanTu = { layTroChoi: () => g, batDau, tamDung, tiepTuc, am, tienDo, kho, layCatMan: () => catMan, layBangOnTap: () => bang,
    chonMan: (duong, so) => { maDuong = duong; soManChon = so; veMenuChon(); },
    moOnTap: ds => { tuDaGap = ds.slice(); tuSai = []; hienOnTap(); } }; // moOnTap: chỉ để kiểm thử bảng ôn tập
  // Màn chưa cất được (mất mạng lần trước): gửi bù khi mở game và khi có mạng lại
  const guiBu = () => { if (coMayChu) kho.gui().then(t => capNhatDiemSo(t.diemSoMoi)); };
  guiBu();
  window.addEventListener("online", guiBu);
  requestAnimationFrame(khung);
})();
