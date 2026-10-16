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
  let maDuong = "rung";
  try { const d = localStorage.getItem(KHOA_DUONG); if (d && tienDo.duongMo(d)) maDuong = d; } catch (e) { /* bỏ qua */ }
  let soManChon = tienDo.manMo(maDuong);
  let ketQuaMan = null;      // { manMoi, xongDuong } của lần qua màn vừa rồi
  let tuMoiThuoc = [];       // các từ bé vừa thuộc trong lượt này
  try { const d = localStorage.getItem(KHOA_DO_KHO); if (d && ST.DO_KHO[d]) maDoKho = d; } catch (e) { /* bỏ qua */ }
  let daHienKetQua = false;
  let idDangHien = -1;       // thử thách đang hiện trên khung chọn
  let lanThuThach = 0;

  const KHEN = ["Giỏi lắm! 🎉", "Tuyệt vời! ⭐", "Chính xác! 👏", "Siêu quá! 🚀", "Đúng rồi! 🌟"];
  const ngauNhien = a => a[Math.floor(Math.random() * a.length)];

  /* ---------------- MÀN PHỦ ---------------- */
  function hienLop(id) { ["manBatDau", "manTamDung", "manKetQua"].forEach(m => $(m).classList.toggle("hien", m === id)); }

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
        maDuong = d.ma; soManChon = tienDo.manMo(d.ma);
        try { localStorage.setItem(KHOA_DUONG, d.ma); } catch (e) { /* bỏ qua */ }
        veMenuChon();
      };
      hop.appendChild(b);
    });
  }
  function veChonMan() {
    const hop = $("chonMan"), d = ST.layDuongDua(maDuong); hop.innerHTML = "";
    $("nhanChonMan").textContent = `Chọn màn: ${d.bieuTuong} ${d.ten}`;
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
    veChonDuong(); veChonMan();
    $("ghiChuDuong").textContent = "";
    $("nutBatDau").textContent = `▶ Chơi màn ${soManChon}`;
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
    if (!tienDo.manChoiDuoc(maDuong, soManChon)) { maDuong = "rung"; soManChon = tienDo.manMo("rung"); }
    g = new ST.TroChoi(ST.taoManChoi(maDuong, soManChon, maDoKho), { suKien, soTay });
    tuMoiThuoc = []; ketQuaMan = null;
    daHienKetQua = false; idDangHien = -1; lanThuThach = 0; daGapQuaiMau = false;
    ve.hat = [];
    $("thongBao").innerHTML = "";
    g.batDau();
    hienLop(null);
    veKhungChon();
    const d = g.dk.duong;
    bao(`${d.bieuTuong} Màn ${g.dk.soMan}${g.dk.laManCuoi ? " · Cứu bé mèo!" : ""}`);
  }
  function manTiep() {
    if (soManChon < ST.SO_MAN && tienDo.manChoiDuoc(maDuong, soManChon + 1)) soManChon++;
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
    const cuoi = thang && dk.laManCuoi, conLai = ST.SO_MAN - dk.soMan;
    $("ketQuaHinh").textContent = cuoi ? "🐱💖👶" : thang ? "🚩👶🎉" : g.lyDoThua === "hetGio" ? "⏰" : "💔";
    $("ketQuaTieuDe").textContent = cuoi ? "Giải cứu bé mèo thành công!" : thang ? `Qua màn ${dk.soMan} rồi!`
      : g.lyDoThua === "hetGio" ? "Hết giờ mất rồi!" : "Hết mạng mất rồi!";
    $("ketQuaSao").textContent = thang ? saoChu(g.soSao()) : "";
    const iDuong = ST.DUONG_DUA.indexOf(d), duongSau = ST.DUONG_DUA[iDuong + 1];
    $("ketQuaLoi").textContent = cuoi
      ? `Con đã hoàn thành đường đua ${d.ten}! Mèo con cảm ơn con nhiều lắm!` + (duongSau
        ? (duongSau.daCo ? ` Đường đua ${duongSau.bieuTuong} ${duongSau.ten} đã mở!` : ` Đường đua ${duongSau.bieuTuong} ${duongSau.ten} sắp ra mắt nhé!`) : "")
      : thang ? `Bé mèo đang chờ ở ${d.dich.toLowerCase()}, còn ${conLai} màn nữa. Cố lên!` + (ketQuaMan && ketQuaMan.manMoi ? ` Đã mở màn ${dk.soMan + 1} 🔓` : "")
      : g.lyDoThua === "hetGio" ? `Con đã đi được ${Math.round(g.tienDo * 100)}% đường màn ${dk.soMan}, thử lại nhanh hơn nhé!`
        : `Cẩn thận quái vật và hố sâu nhé. Con đã đi được ${Math.round(g.tienDo * 100)}% đường màn ${dk.soMan}!`;
    const coManTiep = thang && !cuoi;
    $("nutManTiep").style.display = coManTiep ? "" : "none";
    $("nutManTiep").textContent = `▶ Màn ${dk.soMan + 1}`;
    $("nutChoiLai").className = coManTiep ? "nutVua nhat" : "nutLon";
    $("nutChoiLai").textContent = thang ? "↻ Chơi lại màn này" : "↻ Chơi lại";
    $("kqDung").textContent = tk.dung;
    $("kqKC").textContent = g.tongKimCuong;
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
      b.onclick = () => { am.mo(); am.doc(t.en); };
      hop.appendChild(b);
    });
    hienLop("manKetQua");
  }

  /* ---------------- KHUNG CHỌN TỪ ---------------- */
  function veKhungChon() {
    const tt = g && g.thuThach, cacNut = $("cacNut");
    const so = g ? g.dk.soPhuongAn : ST.MAN_CHOI[soManChon - 1].soPhuongAn;
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
    $("loiNhan").textContent = lanThuThach <= 2 && g.dk.soMan === 1 ? (tt.o.hanhDong === "nhay"
      ? `👆 Chờ bé chạy tới dải xanh rồi bấm ${timTu} để nhảy!` : `👆 Bấm ${timTu} để bắn!`)
      : tt.o.hanhDong === "ban" && !daGapQuaiMau ? `💥 ${tt.o.ten} có thanh máu: bấm đúng từ ${tt.o.mau} lần để bắn hạ!` : "";
    if (tt.o.hanhDong === "ban") daGapQuaiMau = true;
  }
  let daGapQuaiMau = false; // lần đầu gặp quái có máu trong lượt: giải thích cách bắn
  function veHanhDong(tt) {
    const o = tt.o;
    $("hanhDongTu").textContent = o.hanhDong === "nhay" ? "⤴ Nhảy qua " + o.ten.toLowerCase()
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
    if (kq.kq === "dung" || kq.kq === "sai") am.doc(nut.dataset.tu); // phát âm từ vừa chọn, cả khi sai
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
        khoaCacNut();
        Array.from($("cacNut").children).forEach(b => { if (b !== n) b.classList.add("mo"); });
        if (n) n.classList.add("dung");
        loiNhan(ngauNhien(KHEN), "tot");
        ve.phun(be.x, be.y + 60, "lapLanh", 8, "#ffe14d");
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
        loiNhan("Ối, không kịp rồi! Từ sau bấm nhanh hơn nhé.", "xau");
        break;
      case "nhay": am.phat("nhay"); ve.phun(be.x - 10, 4, "bui", 5); break;
      case "tiepDat": am.phat("tiepDat"); ve.phun(be.x, 4, "bui", 4); break;
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
      case "doiMang": am.phat("doiMang"); bao("+1 mạng 💛"); rung("hudMang", "rung"); break;
      case "khung":
        am.phat("khung");
        khoaCacNut();
        { const hut = lyDoNhayHut(d.o);
          loiNhan(hut ? `Cộp! Bé nhảy ${hut} quá nên va vào ${d.o.ten.toLowerCase()}. Canh lúc bấm nhé!` : `Cộp! Va vào ${d.o.ten.toLowerCase()}, bé bị khựng lại một chút.`, "xau"); }
        break;
      case "vaQuai": am.phat("vaQuai"); break;
      case "roiHo": am.phat("roi"); break;
      case "matMang":
        bao("-1 mạng", true); rung("hudMang", "rung");
        khoaCacNut();
        { const hut = d.o ? lyDoNhayHut(d.o) : "", them = hut ? ` Bé nhảy ${hut} quá, lần sau canh lúc bấm nhé!` : "";
          loiNhan((d.lyDo === "roi" ? "Ối! Bé rơi xuống hố rồi." : `Ối! ${d.o ? d.o.ten : "Quái vật"} chạm vào bé rồi.`) + them, "xau"); }
        break;
      case "hoiSinh": am.phat("hoiSinh"); loiNhan("Bé quay lại rồi! Chạy tiếp nào 💪", "tot"); break;
      case "thang":
        am.dungNhac(); am.phat("thang");
        // Lưu tiến độ NGAY (bé có thể thoát trong lúc xem hoạt cảnh)
        ketQuaMan = tienDo.ghiThang(g.dk.maDuong, g.dk.soMan, g.soSao());
        idDangHien = -1; veKhungChon();
        if (d.laManCuoi) {
          $("hinhTu").textContent = "🏰"; $("chuTu").textContent = "castle"; $("nghiaTu").textContent = "lâu đài - tới nơi rồi!";
          loiNhan("Tới lâu đài rồi! Giải cứu bé mèo nào! 🐱", "tot");
        } else {
          $("hinhTu").textContent = "🚩"; $("chuTu").textContent = "finish"; $("nghiaTu").textContent = "về đích - qua màn rồi!";
          loiNhan(`Qua màn ${g.dk.soMan} rồi! 🎉`, "tot");
        }
        for (let i = 0; i < 4; i++) setTimeout(() => ve.phun(g ? g.doDai + 120 : 0, 200, "giay", 30, ["#ff7eb6", "#ffd23f", "#6C4CE0", "#2BB673", "#3fc8ff"][i]), i * 400);
        break;
      case "thua": am.dungNhac(); am.phat("thua"); khoaCacNut(); break;
    }
  }

  /* ---------------- THANH THÔNG TIN ---------------- */
  let hudTruoc = "";
  function capNhatHud(epVe) {
    if (epVe) hudTruoc = "";
    const dkHud = g ? g.dk : ST.taoManChoi(maDuong, soManChon, maDoKho);
    const tg = g ? Math.ceil(g.thoiGian) : dkHud.thoiGianChoi;
    const td = g ? g.tienDo : 0;
    const mang = g ? g.mang : CH.mangBanDau, duTru = g ? g.mangDuTru : 0, kc = g ? g.kimCuong : 0;
    const khoa = [tg, Math.round(td * 200), mang, duTru, kc, dkHud.ma].join("|");
    if (khoa === hudTruoc) return;
    hudTruoc = khoa;
    $("soMan").textContent = `${dkHud.soMan}/${ST.SO_MAN}`;
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
        if (!daHienKetQua && ((g.trangThai === "thang" && g.tKetThuc > (g.dk.laManCuoi ? 3.6 : 2.4)) || (g.trangThai === "thua" && g.tKetThuc > 1.6))) hienKetQua();
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
  window.__sanTu = { layTroChoi: () => g, batDau, tamDung, tiepTuc, am, tienDo,
    chonMan: (duong, so) => { maDuong = duong; soManChon = so; veMenuChon(); } };
  requestAnimationFrame(khung);
})();
