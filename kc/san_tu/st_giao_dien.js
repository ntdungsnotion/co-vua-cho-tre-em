/* ================================================================
   FILE: san_tu/st_giao_dien.js
   CHỨC NĂNG: GIAO DIỆN + VÒNG LẶP của game Săn Từ (UIManager): màn bắt đầu / tạm
              dừng / kết quả, thanh thông tin (giờ, tiến độ, mạng, kim cương), khung
              chọn từ, nút âm thanh; nối sự kiện của lõi game với âm thanh và hiệu ứng.
              Bàn phím (máy tính): phím 1-4 chọn từ, P hoặc Esc tạm dừng, Enter bắt đầu.
   BƯỚC: TC_00B
   NGÀY: 15/10/2026
   ================================================================ */
(function () {
  "use strict";
  const ST = window.ST, CH = ST.CAU_HINH;
  const $ = id => document.getElementById(id);
  const KHOA_DO_KHO = "kc_santu_do_kho";

  const am = new ST.QuanLyAmThanh();
  const ve = new ST.BoVe($("manHinh"));
  let g = null;              // lượt chơi hiện tại
  let maDoKho = "de";
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
      b.innerHTML = `<b>${d.bieuTuong} ${d.ten}</b><span>${d.moTa}</span>`;
      b.setAttribute("aria-pressed", ma === maDoKho);
      b.onclick = () => { maDoKho = ma; am.mo(); am.phat("nut"); try { localStorage.setItem(KHOA_DO_KHO, ma); } catch (e) { /* bỏ qua */ } veChonDoKho(); };
      hop.appendChild(b);
    });
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
    g = new ST.TroChoi(maDoKho, { suKien });
    daHienKetQua = false; idDangHien = -1; lanThuThach = 0;
    ve.hat = [];
    $("thongBao").innerHTML = "";
    g.batDau();
    hienLop(null);
    veKhungChon();
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
    if (g) { am.dungNhac(); am.dungDoc(); am.tiepTuc(); }
    g = null; idDangHien = -1;
    veChonDoKho();
    hienLop("manBatDau");
    veKhungChon();
  }
  function hienKetQua() {
    daHienKetQua = true;
    const thang = g.trangThai === "thang", tk = g.thongKe;
    $("ketQuaHinh").textContent = thang ? "🐱💖👶" : g.lyDoThua === "hetGio" ? "⏰" : "💔";
    $("ketQuaTieuDe").textContent = thang ? "Giải cứu bé mèo thành công!" : g.lyDoThua === "hetGio" ? "Hết giờ mất rồi!" : "Hết mạng mất rồi!";
    $("ketQuaSao").textContent = thang ? "⭐".repeat(g.soSao()) + "☆".repeat(3 - g.soSao()) : "";
    $("ketQuaLoi").textContent = thang
      ? `Con đã tới lâu đài ở mức ${g.dk.ten}. Mèo con cảm ơn con nhiều lắm!`
      : g.lyDoThua === "hetGio" ? `Bé mèo vẫn đang chờ. Con đã đi được ${Math.round(g.tienDo * 100)}% đường, thử lại nhanh hơn nhé!`
        : `Cẩn thận quái vật và hố sâu nhé. Con đã đi được ${Math.round(g.tienDo * 100)}% đường!`;
    $("kqDung").textContent = tk.dung;
    $("kqKC").textContent = g.tongKimCuong;
    $("kqGio").textContent = Math.ceil(g.thoiGian);
    const hop = $("tuDaHoc"); hop.innerHTML = "";
    $("nhanTuDaHoc").style.display = tk.tuDung.length ? "" : "none";
    tk.tuDung.forEach(t => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "chipTu"; b.textContent = `${t.e} ${t.en}`; b.title = t.vi;
      b.onclick = () => { am.mo(); am.doc(t.en); };
      hop.appendChild(b);
    });
    hienLop("manKetQua");
  }

  /* ---------------- KHUNG CHỌN TỪ ---------------- */
  function veKhungChon() {
    const tt = g && g.thuThach, cacNut = $("cacNut");
    const so = g ? g.dk.soPhuongAn : ST.DO_KHO[maDoKho].soPhuongAn;
    cacNut.className = so === 3 ? "n3" : "";
    cacNut.style.setProperty("--soCot", so);
    if (!tt || tt.trangThai !== "mo") {
      // Chưa có thử thách: giữ nguyên chiều cao khung bằng các ô trống
      if (!tt || idDangHien !== tt.id) {
        idDangHien = -1;
        $("hinhTu").textContent = "🏃";
        $("chuTu").textContent = "...";
        $("nghiaTu").textContent = g ? "Bé đang chạy, từ mới sắp hiện!" : "Chọn độ khó rồi bấm Bắt đầu";
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
    $("chuTu").textContent = tt.tu.en;
    $("nghiaTu").textContent = tt.tu.vi;
    $("kcTu").style.display = tt.soKimCuong > 0 ? "inline-block" : "none";
    $("kcTu").textContent = "💎 x" + tt.soKimCuong;
    $("hanhDongTu").textContent = (tt.o.hanhDong === "nhay" ? "⤴ Nhảy qua " : "✨ Phép thuật: ") + tt.o.ten.toLowerCase();
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
    $("loiNhan").textContent = lanThuThach <= 2 && g.maDoKho === "de" ? "👆 Bấm vào từ GIỐNG chữ trên biển nhé!" : "";
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
        const n = nutCuaTu(d.tu); khoaCacNut();
        Array.from($("cacNut").children).forEach(b => { if (b !== n) b.classList.add("mo"); });
        if (n) n.classList.add("dung");
        loiNhan(ngauNhien(KHEN) + (d.tt.soKimCuong ? " Nhặt kim cương nào!" : ""), "tot");
        ve.phun(be.x, be.y + 60, "lapLanh", 8, "#ffe14d");
        break;
      }
      case "chonSai": {
        am.phat("sai");
        const n = nutCuaTu(d.tu); if (n) { n.classList.add("sai"); n.disabled = true; }
        loiNhan(`Chưa đúng rồi. Tìm chữ "${d.tt.tu.en}" nhé!`, "xau");
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
        const o = d.o; ve.phun(o.x + o.rong / 2, o.bayCao + o.cao / 2, "khoi", 10); ve.phun(o.x + o.rong / 2, o.bayCao + o.cao / 2, "lapLanh", 8, "#fff27a");
        break;
      }
      case "hienKimCuong": ve.phun(be.x + 120, 120, "lapLanh", 6, "#a8ecff"); break;
      case "nhatKimCuong":
        am.phat("kimCuong");
        ve.phun(d.k.x, d.k.y, "lapLanh", 12, "#7fe0ff");
        rung("hudKC", "nay");
        break;
      case "doiMang": am.phat("doiMang"); bao("+1 mạng 💛"); rung("hudMang", "rung"); break;
      case "khung":
        am.phat("khung");
        khoaCacNut();
        loiNhan(`Cộp! Va vào ${d.o.ten.toLowerCase()}, bé bị khựng lại một chút.`, "xau");
        break;
      case "vaQuai": am.phat("vaQuai"); break;
      case "roiHo": am.phat("roi"); break;
      case "matMang":
        bao("-1 mạng", true); rung("hudMang", "rung");
        khoaCacNut();
        loiNhan(d.lyDo === "roi" ? "Ối! Bé rơi xuống hố rồi." : `Ối! ${d.o ? d.o.ten : "Quái vật"} chạm vào bé rồi.`, "xau");
        break;
      case "hoiSinh": am.phat("hoiSinh"); loiNhan("Bé quay lại rồi! Chạy tiếp nào 💪", "tot"); break;
      case "thang":
        am.dungNhac(); am.phat("thang");
        idDangHien = -1; veKhungChon();
        $("hinhTu").textContent = "🏰"; $("chuTu").textContent = "castle"; $("nghiaTu").textContent = "lâu đài - tới nơi rồi!";
        loiNhan("Tới lâu đài rồi! Giải cứu bé mèo nào! 🐱", "tot");
        for (let i = 0; i < 4; i++) setTimeout(() => ve.phun(g ? g.doDai + 120 : 0, 200, "giay", 30, ["#ff7eb6", "#ffd23f", "#6C4CE0", "#2BB673", "#3fc8ff"][i]), i * 400);
        break;
      case "thua": am.dungNhac(); am.phat("thua"); khoaCacNut(); break;
    }
  }

  /* ---------------- THANH THÔNG TIN ---------------- */
  let hudTruoc = "";
  function capNhatHud() {
    const tg = g ? Math.ceil(g.thoiGian) : CH.thoiGianChoi;
    const td = g ? g.tienDo : 0;
    const mang = g ? g.mang : CH.mangBanDau, duTru = g ? g.mangDuTru : 0, kc = g ? g.kimCuong : 0;
    const khoa = [tg, Math.round(td * 200), mang, duTru, kc].join("|");
    if (khoa === hudTruoc) return;
    hudTruoc = khoa;
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
        if (!daHienKetQua && ((g.trangThai === "thang" && g.tKetThuc > 3.6) || (g.trangThai === "thua" && g.tKetThuc > 1.6))) hienKetQua();
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
  $("nutBatDau").onclick = batDau;
  $("nutChoiLai").onclick = batDau;
  $("nutChoiLaiTD").onclick = () => { am.dungNhac(); am.tiepTuc(); batDau(); };
  $("nutTiepTuc").onclick = tiepTuc;
  $("nutTamDung").onclick = () => { if (g && g.trangThai === "tamDung") tiepTuc(); else tamDung(); };
  $("nutDoiDoKho").onclick = veMenu;
  $("nutDoiDoKhoTD").onclick = veMenu;
  document.addEventListener("keydown", e => {
    if (e.repeat) return;
    if ((e.key === "p" || e.key === "P" || e.key === "Escape")) { if (g && g.trangThai === "tamDung") tiepTuc(); else tamDung(); return; }
    if (e.key === "Enter" && $("manBatDau").classList.contains("hien")) { batDau(); return; }
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
  veCaiDatAm();
  veKhungChon();
  // Mở thẳng một độ khó bằng #de, #vua, #kho, #thuThach
  const bam = location.hash.replace("#", "");
  if (ST.DO_KHO[bam]) { maDoKho = bam; veChonDoKho(); }
  window.__sanTu = { layTroChoi: () => g, batDau, tamDung, tiepTuc, am }; // để kiểm thử tự động
  requestAnimationFrame(khung);
})();
