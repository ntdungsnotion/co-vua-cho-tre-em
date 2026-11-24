/* ================================================================
   FILE: tt_tri_thuc/tt_chinh_phuc.js
   CHỨC NĂNG: 🏆 CHINH PHỤC 30 CÂU của phân hệ THỬ THÁCH tri thức (đặc tả Thiet_Ke_On_The.md mục 4.4, 5.7).
              6 chặng × 5 câu, trộn môn, khó dần theo sức từng bé (máy chủ chọn câu theo trình độ, KC_08).
              Một câu một lần, máy chủ chấm (RPC kc_cp_*, SQL supabase_kc03c6_chinh_phuc.sql):
                - bé luôn thấy "Thưởng nếu dừng" + "Mốc bảo toàn" (cần biết để quyết dừng hay đi tiếp);
                - chọn đáp án rồi bấm TRẢ LỜI (sai là kết thúc nên có bước xác nhận, khác màn ôn chạm là chấm);
                - DỪNG & NHẬN bất kỳ lúc nào (hộp hỏi lại); sai thì về mốc bảo toàn;
                - xong mỗi chặng: cổng mở + rương, chọn Tiếp tục / Dừng; đủ 30: CHIẾN THẮNG + huy hiệu.
              Điện thoại (< 900 px): 1 cột, dải 6 chấm chặng trên đầu (chạm mở bản đồ), nút dính đáy.
              Máy tính (≥ 900 px): 3 cột: bản đồ 6 chặng (lâu đài ở đích, bé đứng ở chặng đang đi) | câu hỏi | thang thưởng 30 bậc.
   DÙNG:      KC_CP.gan(phanTu, { ten, maPhien, goiRpc(ten, thamSo) -> Promise<json> })
   PHỤ THUỘC: chung/am_thanh.js (KC_AM_THANH, tiếng + đọc câu), chung/nv_ve.js + chung/nv_ho_so.js (nhân vật bé, có thì vẽ).
   BƯỚC: KC_03C6
   NGÀY: 24/11/2026
   ================================================================ */
(function (goc) {
  "use strict";
  const doc = goc.document;
  const ngu = ms => new Promise(r => setTimeout(r, ms));
  const tao = (the, lop, chu) => { const e = doc.createElement(the); if (lop) e.className = lop; if (chu != null) e.textContent = chu; return e; };
  const so = n => Number(n || 0).toLocaleString("vi-VN");
  const AM = () => goc.KC_AM_THANH || null;
  const tieng = {
    dung(lop) { const a = AM(); if (a) a.phanHoi(true, lop, {}); },
    sai(lop) { const a = AM(); if (a) a.phanHoi(false, lop, { khongLoi: true }); },
    ruong() { const a = AM(); if (a) a.tieng.thuong(); },
    kc(i) { const a = AM(); if (a) a.tieng.kc(i); },
    keng() { const a = AM(); if (a) a.tieng.keng(); }
  };
  const TEN_CHANG = ["Chặng 1 · Khởi hành", "Chặng 2 · Rừng xanh", "Chặng 3 · Sông lớn", "Chặng 4 · Núi đá", "Chặng 5 · Đèo mây", "Chặng 6 · Lâu đài"];
  const BT_CHANG = ["🌱", "🌲", "🌊", "⛰️", "☁️", "🏰"];
  // nhãn độ khó THEO CHẶNG (câu được chọn vừa sức từng bé nên "khó" là khó với chính bé, không lộ kiến thức)
  const NHAN_CHANG = [["Dễ", "de"], ["Dễ", "de"], ["Trung bình", "vua"], ["Trung bình", "vua"], ["Khó", "kho"], ["⭐ Thử thách", "thu"]];
  const LUAT = [
    "30 câu chia 6 chặng, mỗi chặng 5 câu, câu khó dần.",
    "Đúng thì thưởng tăng. Sai là dừng: về mốc bảo toàn (câu 5, 10, 15...).",
    "Con có thể bấm Dừng & nhận bất cứ lúc nào để giữ phần thưởng."
  ];

  function gan(goc0, tc) {
    const S = { ten: tc.ten, maPhien: tc.maPhien, goi: tc.goiRpc, lop: null, tc: null, luot: null, thuong: [], dong: true };
    const hoSo = (goc.KC_NV_HO_SO && goc.KC_NV && S.ten) ? goc.KC_NV_HO_SO.doc(S.ten) : null;

    function rpc(ten, ts) {
      return Promise.resolve(S.goi(ten, Object.assign({ p_ten: S.ten, p_ma_phien: S.maPhien }, ts || {})))
        .then(kq => kq || { thanhCong: false, ma: "mang" })
        .catch(() => ({ thanhCong: false, ma: "mang" }));
    }
    async function rpcBen(ten, ts) { // thử lại khi mất mạng (3 lần)
      let kq = null;
      for (let lan = 0; lan < 3; lan++) {
        kq = await rpc(ten, ts);
        if (kq.thanhCong || (kq.ma && kq.ma !== "mang")) return kq;
        await ngu(900 * (lan + 1));
      }
      return kq;
    }
    const T = k => (k > 0 ? (S.thuong[Math.min(k, 30) - 1] || 0) : 0);
    const moc = k => (k < 5 ? T(k) : T(5 * Math.floor(k / 5)));

    // ================= SẢNH =================
    async function veSanh() {
      goc0.innerHTML = '<div class="cpSanh"><p class="cpTai">Cô Cú đang mở bản đồ hành trình… 🦉</p></div>';
      const kq = await rpcBen("kc_cp_trang_chu");
      if (!kq.thanhCong) { veLoiSanh(kq); return; }
      S.tc = kq; S.thuong = kq.thuong || []; S.lop = kq.lop;
      const s = tao("div", "cpSanh");
      const dau = tao("header", "cpSanhDau");
      dau.append(tao("div", "cpCup", "🏆"));
      const td = tao("div", "cpSanhTieuDe"); td.append(tao("h2", "", "Chinh phục 30 câu"), tao("p", "", "Vượt 6 chặng tới lâu đài, nhận tới " + so(T(30)) + " 💎"));
      dau.append(td);
      s.appendChild(dau);

      const than = tao("div", "cpSanhThan");
      // bản đồ chặng (mốc 💎 mỗi chặng)
      const bd = veBanDo(-1, kq.luotDang ? kq.luotDang.soDung : -1);
      bd.classList.add("cpBanDoSanh");
      than.appendChild(bd);

      const phai = tao("div", "cpSanhPhai");
      const chip = tao("div", "cpChip");
      chip.append(tao("span", "", "🏅 Nhà chinh phục × " + (kq.huyHieu || 0)), tao("span", "", "⭐ Kỷ lục: " + (kq.kyLuc || 0) + " câu"),
        tao("span", "", "💎 Hôm nay: " + so(kq.daNhanHomNay) + " / " + so(kq.tranNgay)));
      phai.appendChild(chip);
      const luat = tao("div", "cpLuat");
      const hl = tao("div", "cpLuatDau"); hl.append(tao("b", "", "📜 Luật chơi"));
      const nghe = tao("button", "cpNghe", "🔊"); nghe.type = "button"; nghe.setAttribute("aria-label", "Nghe luật");
      nghe.addEventListener("click", () => { const a = AM(); if (a) a.doc(LUAT.join(" "), { lang: "vi" }); });
      hl.appendChild(nghe); luat.appendChild(hl);
      const ul = tao("ul"); LUAT.forEach(x => ul.appendChild(tao("li", "", x))); luat.appendChild(ul);
      phai.appendChild(luat);
      // mốc thưởng
      const mocs = tao("div", "cpMocSanh");
      [5, 10, 15, 20, 25, 30].forEach((k, i) => {
        const o = tao("div", "cpMocO" + (k === 30 ? " dich" : ""));
        o.append(tao("span", "cpMocBt", BT_CHANG[i]), tao("small", "", "Câu " + k), tao("b", "", so(T(k)) + " 💎"));
        mocs.appendChild(o);
      });
      phai.appendChild(mocs);
      if (kq.soMon < 1) phai.appendChild(tao("p", "cpGhiChu", "Kho câu hỏi chưa đủ để chinh phục. Con quay lại sau nhé!"));
      const hang = tao("div", "cpHangNut");
      if (kq.luotDang) {
        const l = kq.luotDang;
        const tiep = tao("button", "cpNut chinh", "▶ Chơi tiếp · Câu " + (l.viTri + 1)); tiep.type = "button";
        tiep.addEventListener("click", () => batDau());
        const dung = tao("button", "cpNut phu", "✋ Dừng & nhận " + so(l.thuongDung) + " 💎"); dung.type = "button";
        dung.addEventListener("click", () => hoiDung(l, () => moManChoi(Object.assign({}, l, { cau: null }))));
        hang.append(tiep, dung);
        phai.appendChild(tao("p", "cpGhiChu", "Con đang dở hành trình (đúng " + l.soDung + " câu). Chơi tiếp hay dừng nhận thưởng?"));
      } else {
        const bd2 = tao("button", "cpNut chinh lon", "🚩 Bắt đầu chinh phục"); bd2.type = "button";
        bd2.disabled = kq.soMon < 1;
        bd2.addEventListener("click", () => batDau());
        hang.appendChild(bd2);
      }
      phai.appendChild(hang);
      than.appendChild(phai);
      s.appendChild(than);
      goc0.innerHTML = ""; goc0.appendChild(s);
      const nutChinh = s.querySelector(".cpNut.chinh");
      if (nutChinh && goc.matchMedia && goc.matchMedia("(pointer: fine)").matches) nutChinh.focus({ preventScroll: true });
    }

    function veLoiSanh(kq) {
      goc0.innerHTML = "";
      const s = tao("div", "cpSanh cpLoiKhoi");
      const ma = kq && kq.ma;
      s.append(tao("p", "cpTai", ma === "dang_nhap" ? "Con đăng nhập lại rồi vào lại nhé." :
        /function|does not exist|schema cache/i.test((kq && kq.thongBao) || "") ? "Chinh phục đang được chuẩn bị trên máy chủ. Con quay lại sau nhé!" :
          "Mạng đang chập chờn. Con bấm Thử lại nhé."));
      const n = tao("button", "cpNut chinh", "Thử lại"); n.type = "button"; n.addEventListener("click", veSanh);
      s.appendChild(n); goc0.appendChild(s);
    }

    // Bản đồ 6 chặng (dọc, lâu đài ở trên). chang: chặng đang đi (-1: sảnh); soDung: số câu đã đúng (-1: chưa có lượt)
    function veBanDo(chang, soDung) {
      const bd = tao("div", "cpBanDo"); bd.setAttribute("aria-label", "Bản đồ 6 chặng");
      const dich = tao("div", "cpDich"); dich.append(tao("span", "cpLauDai", "🏰"), tao("b", "", so(T(30)) + " 💎"));
      bd.appendChild(dich);
      for (let i = 5; i >= 0; i--) {
        const k = (i + 1) * 5, n = tao("div", "cpNutBd");
        const daQua = soDung >= k, dang = chang === i || (chang < 0 && soDung >= 0 && Math.floor(soDung / 5) === i);
        if (daQua) n.classList.add("qua"); if (dang) n.classList.add("dang");
        const tron = tao("span", "cpTron", daQua ? "✓" : BT_CHANG[i]);
        const chu = tao("span", "cpBdChu"); chu.append(tao("b", "", TEN_CHANG[i]), tao("small", "", "Câu " + (k - 4) + "-" + k + " · mốc " + so(T(k)) + " 💎"));
        n.append(tron, chu);
        if (dang && hoSo) { const cv = tao("canvas", "cpBeNho"); cv.width = 90; cv.height = 100; n.appendChild(cv); veBe(cv, 1.1); }
        else if (dang) n.appendChild(tao("span", "cpBeNho chu", "🧒"));
        bd.appendChild(n);
      }
      return bd;
    }
    function veBe(cv, co) {
      try { const c = cv.getContext("2d"); c.clearRect(0, 0, cv.width, cv.height); goc.KC_NV.ve(c, hoSo, { x: cv.width / 2, y: cv.height - 6, co, huong: 1, t: 0, tuThe: "vay", vaiTro: "thu_linh", cam: "" }); }
      catch (e) { cv.replaceWith(tao("span", "cpBeNho chu", "🧒")); }
    }

    // ================= BẮT ĐẦU / CHƠI =================
    async function batDau() {
      const nut = goc0.querySelector(".cpNut.chinh"); if (nut) nut.disabled = true;
      const kq = await rpcBen("kc_cp_bat_dau");
      if (!kq.thanhCong) {
        if (nut) nut.disabled = false;
        if (kq.ma === "khong_co_cau") { goc0.querySelector(".cpHangNut").before(tao("p", "cpGhiChu", "Kho câu hỏi chưa đủ để chinh phục. Con quay lại sau nhé!")); return; }
        veLoiSanh(kq); return;
      }
      moManChoi(kq.luot);
    }

    function moManChoi(luot) {
      S.luot = luot; S.dong = false;
      const m = tao("div", "cpMan"); m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); m.setAttribute("aria-label", "Chinh phục 30 câu");
      m.innerHTML =
        '<div class="cpNen"></div>' +
        '<div class="cpBo">' +
        '  <aside class="cpCotTrai"></aside>' +
        '  <main class="cpGiua">' +
        '    <header class="cpDau"><div class="cpTieuDe"><b>Hành trình · Câu <span class="cpSoCau">1</span> / 30</b><small class="cpTenChang"></small></div>' +
        '      <button class="cpBdMo" type="button" aria-label="Xem bản đồ chặng"></button>' +
        '      <button class="cpDong" type="button" aria-label="Tạm rời (giữ hành trình 30 phút)">✕</button></header>' +
        '    <div class="cpTienDo" aria-hidden="true"></div>' +
        '    <div class="cpHop"><div class="cpO xanh"><small>Thưởng nếu dừng</small><b class="cpThuongDung">0 💎</b></div>' +
        '      <div class="cpO do"><small>Mốc bảo toàn</small><b class="cpMoc">0 💎</b></div></div>' +
        '    <section class="cpCau" aria-live="polite"></section>' +
        '    <div class="cpDay"><button class="cpNut phu cpNutDung" type="button">✋ Dừng & nhận 0 💎</button>' +
        '      <button class="cpNut chinh cpNutTraLoi" type="button" disabled>Trả lời</button></div>' +
        '  </main>' +
        '  <aside class="cpCotPhai"><h3>🎁 Thang thưởng</h3><ol class="cpThang"></ol></aside>' +
        '</div>';
      doc.body.appendChild(m); doc.body.classList.add("cpDangChoi");
      S.m = m;
      const $ = s => m.querySelector(s);
      $(".cpDong").addEventListener("click", () => dongMan(true));
      $(".cpNutDung").addEventListener("click", () => { if (!S.dangGui && S.luot && S.luot.trangThai === "dang") hoiDung(S.luot, ketQuaDung); });
      $(".cpNutTraLoi").addEventListener("click", guiDa);
      $(".cpBdMo").addEventListener("click", moBanDoNho);
      doc.addEventListener("keydown", phim, true);
      // thang thưởng 30 bậc
      const th = $(".cpThang");
      for (let k = 30; k >= 1; k--) {
        const li = tao("li", k % 5 === 0 ? "moc" : ""); li.dataset.k = String(k);
        li.append(tao("span", "", String(k)), tao("b", "", so(T(k)) + " 💎"));
        th.appendChild(li);
      }
      capNhat();
      if (luot.cau) veCau(luot.cau); else ketThucTuMayChu();
    }

    function capNhat() {
      const l = S.luot, m = S.m; if (!m) return;
      const k = l.soDung, vt = l.trangThai === "dang" ? l.viTri : k;
      const chang = Math.min(5, Math.floor(vt / 5));
      m.querySelector(".cpSoCau").textContent = String(Math.min(30, vt + 1));
      m.querySelector(".cpTenChang").textContent = TEN_CHANG[chang];
      m.querySelector(".cpThuongDung").textContent = so(T(k)) + " 💎";
      m.querySelector(".cpMoc").textContent = so(moc(k)) + " 💎";
      m.querySelector(".cpNutDung").textContent = "✋ Dừng & nhận " + so(T(k)) + " 💎";
      // tiến độ 30 ô, 6 nhóm
      const td = m.querySelector(".cpTienDo"); td.innerHTML = "";
      for (let c = 0; c < 6; c++) {
        const nh = tao("span", "cpNhom");
        for (let i = c * 5; i < c * 5 + 5; i++) nh.appendChild(tao("i", i < k ? "dung" : i === vt && l.trangThai === "dang" ? "nay" : ""));
        td.appendChild(nh);
      }
      // dải 6 chấm (điện thoại)
      const bdm = m.querySelector(".cpBdMo"); bdm.innerHTML = "";
      for (let c = 0; c < 6; c++) bdm.appendChild(tao("i", k >= (c + 1) * 5 ? "qua" : c === chang ? "dang" : "", c === 5 ? "🏰" : ""));
      // bản đồ (máy tính)
      const trai = m.querySelector(".cpCotTrai"); trai.innerHTML = ""; trai.appendChild(veBanDo(chang, k));
      // thang thưởng
      m.querySelectorAll(".cpThang li").forEach(li => {
        const kk = Number(li.dataset.k);
        li.classList.toggle("qua", kk <= k); li.classList.toggle("nay", kk === k + 1 && l.trangThai === "dang");
        li.classList.toggle("baoToan", kk === 5 * Math.floor(k / 5) && k >= 5 && k < 30 && (l.trangThai === "dang" || l.trangThai === "sai"));
      });
      const nay = m.querySelector(".cpThang li.nay"); if (nay && nay.scrollIntoView && m.querySelector(".cpCotPhai").offsetParent) nay.scrollIntoView({ block: "center" });
    }

    function veCau(cau) {
      S.cau = cau; S.chon = -1; S.dangGui = false; S.daCham = false;
      const s = S.m.querySelector(".cpCau"); s.innerHTML = ""; s.className = "cpCau";
      const chang = Number.isInteger(cau.chang) ? cau.chang : Math.min(5, Math.floor(cau.viTri / 5));
      const nh = tao("div", "cpNhanHang");
      const [ten, ma] = NHAN_CHANG[chang] || NHAN_CHANG[0];
      nh.append(tao("span", "cpNhanChang", BT_CHANG[chang] + " Chặng " + (chang + 1)), tao("span", "cpNhanKho " + ma, ten));
      if (cau.monTen) nh.appendChild(tao("span", "cpNhanMon", (cau.monBieuTuong || "") + " " + cau.monTen));
      s.appendChild(nh);
      const khung = tao("div", "cpKhung");
      const hang = tao("div", "cpHangCau");
      hang.appendChild(tao("p", "cpNoiDung", cau.noiDung || ""));
      const a = AM();
      if (a && a.coDoc(cau, S.lop)) {
        const n = tao("button", "cpNghe", "🔊"); n.type = "button"; n.setAttribute("aria-label", "Nghe câu hỏi");
        n.addEventListener("click", () => a.docCau(cau, { lop: S.lop, goc: "" })); hang.appendChild(n);
      }
      khung.appendChild(hang);
      if (cau.hinh || cau.hinhChu) {
        const h = tao("div", "cpHinh");
        if (cau.hinh) { const im = doc.createElement("img"); im.alt = ""; im.src = cau.hinh; im.onerror = () => { h.textContent = cau.hinhChu || ""; if (!cau.hinhChu) h.remove(); }; h.appendChild(im); }
        else h.textContent = cau.hinhChu;
        khung.appendChild(h);
      }
      s.appendChild(khung);
      const ds = tao("div", "cpDap");
      const dai = (cau.dapAn || []).some(x => String(x).length > 22);
      if (dai || (cau.dapAn || []).length === 3) ds.classList.add("doc");
      (cau.dapAn || []).forEach((x, i) => {
        const b = tao("button", "cpDa"); b.type = "button"; b.dataset.i = String(i);
        b.append(tao("span", "cpSo", String(i + 1)), tao("span", "cpChu", String(x)));
        b.addEventListener("click", () => chonDa(i));
        b.addEventListener("dblclick", () => { chonDa(i); guiDa(); });
        ds.appendChild(b);
      });
      s.appendChild(ds);
      s.appendChild(tao("div", "cpPhan"));
      S.m.querySelector(".cpNutTraLoi").disabled = true;
      S.m.querySelector(".cpNutDung").disabled = false;
      S.m.querySelector(".cpDay").hidden = false;
      S.luc0 = performance.now();
      if (a && a.coAmThanh(cau)) setTimeout(() => { if (!S.dong) a.docCau(cau, { lop: S.lop, goc: "" }); }, 250);
    }

    function chonDa(i) {
      if (S.daCham || S.dangGui) return;
      S.chon = i;
      S.m.querySelectorAll(".cpDa").forEach(b => b.classList.toggle("chon", Number(b.dataset.i) === i));
      S.m.querySelector(".cpNutTraLoi").disabled = false;
    }

    async function guiDa() {
      if (S.daCham || S.dangGui || S.chon < 0) return;
      S.dangGui = true;
      const m = S.m, vt = S.luot.viTri, chon = S.chon;
      m.querySelectorAll(".cpDa").forEach(b => { b.disabled = true; });
      m.querySelector(".cpNutTraLoi").disabled = true; m.querySelector(".cpNutDung").disabled = true;
      const bChon = m.querySelector('.cpDa[data-i="' + chon + '"]'); if (bChon) bChon.classList.add("cho");
      const giay = Math.round((performance.now() - S.luc0) / 100) / 10, t0 = performance.now();
      const kq = await rpcBen("kc_cp_tra_loi", { p_luot: S.luot.id, p_vi_tri: vt, p_chon: chon, p_giay: giay });
      const con = 450 - (performance.now() - t0); if (con > 0) await ngu(con);
      if (bChon) bChon.classList.remove("cho");
      if (!kq.thanhCong) return loiGui(kq);
      nhanCham(kq);
    }

    function loiGui(kq) {
      S.dangGui = false;
      const m = S.m;
      if ((kq.ma === "vi_tri" || kq.ma === "da_xong") && kq.luot) { S.luot = kq.luot; capNhat(); if (kq.luot.cau) veCau(kq.luot.cau); else ketThucTuMayChu(); return; }
      const ph = m.querySelector(".cpPhan"); ph.innerHTML = "";
      ph.appendChild(tao("p", "cpLoi", kq.ma === "dang_nhap" ? "Con đăng nhập lại nhé. Hành trình vẫn giữ 30 phút." : "Mạng đang chập chờn. Con bấm Thử lại, câu trả lời chưa bị chấm."));
      const n = tao("button", "cpNut phu", kq.ma === "dang_nhap" ? "Đóng" : "Thử lại"); n.type = "button";
      n.addEventListener("click", () => { if (kq.ma === "dang_nhap") dongMan(false); else { ph.innerHTML = ""; guiDa(); } }, { once: true });
      ph.appendChild(n);
      m.querySelectorAll(".cpDa").forEach(b => { b.disabled = false; });
      m.querySelector(".cpNutTraLoi").disabled = S.chon < 0; m.querySelector(".cpNutDung").disabled = false;
    }

    function nhanCham(kq) {
      S.daCham = true; S.dangGui = false;
      const m = S.m, s = m.querySelector(".cpCau");
      m.querySelectorAll(".cpDa").forEach(b => {
        const i = Number(b.dataset.i);
        if (i === kq.dapAnDung) b.classList.add("dung");
        if (i === S.chon && !kq.dung) b.classList.add("sai");
        if (i !== kq.dapAnDung && i !== S.chon) b.classList.add("mo");
      });
      const cauCu = S.cau, chonCu = S.chon;
      S.luot = kq.luot || S.luot;
      const ph = m.querySelector(".cpPhan"); ph.innerHTML = "";
      if (kq.dung) {
        s.classList.add("daDung");
        ph.appendChild(tao("p", "cpDung", ["✓ Đúng rồi!", "⭐ Giỏi quá!", "✓ Chính xác!"][kq.soDung % 3] + "  Thưởng nếu dừng: " + so(T(kq.soDung)) + " 💎"));
        const b = m.querySelector('.cpDa[data-i="' + kq.dapAnDung + '"]'); if (b) phaoSao(b);
        tieng.dung(S.lop);
        capNhat();
        if (kq.ketThuc) { setTimeout(() => veKetQua(kq.ketQua, null), 900); return; }
        if (kq.xongChang) { setTimeout(() => veXongChang(kq), 900); return; }
        setTimeout(() => { if (!S.dong && S.luot.cau) veCau(S.luot.cau); }, 900);
      } else {
        s.classList.add("daSai");
        tieng.sai(S.lop);
        capNhat();
        setTimeout(() => veKetQua(kq.ketQua, { cau: cauCu, chon: chonCu, dapAnDung: kq.dapAnDung, loiGiai: kq.loiGiai }), 1100);
      }
    }

    // ================= DỪNG =================
    function hoiDung(l, sau) {
      const h = tao("div", "cpHoi"); h.setAttribute("role", "alertdialog"); h.setAttribute("aria-modal", "true");
      const k = l.soDung, hop = tao("div", "cpHoiHop");
      hop.append(tao("div", "cpHoiBt", "✋"), tao("h3", "", "Dừng và nhận " + so(T(k)) + " 💎?"),
        tao("p", "", k > 0 ? "Con đã đúng " + k + " câu. Đi tiếp mà đúng câu kế thì được " + so(T(k + 1)) + " 💎, sai thì về " + so(moc(k)) + " 💎."
          : "Con chưa đúng câu nào nên chưa có thưởng."));
      const hang = tao("div", "cpHangNut");
      const co = tao("button", "cpNut do", "Dừng & nhận"); co.type = "button";
      const khong = tao("button", "cpNut chinh", "Chơi tiếp"); khong.type = "button";
      hang.append(khong, co); hop.appendChild(hang); h.appendChild(hop);
      (S.m || doc.body).appendChild(h);
      khong.focus({ preventScroll: true });
      const bo = () => h.remove();
      khong.addEventListener("click", bo);
      h.addEventListener("click", e => { if (e.target === h) bo(); });
      co.addEventListener("click", async () => {
        co.disabled = true; khong.disabled = true;
        const kq = await rpcBen("kc_cp_dung", { p_luot: l.id });
        bo();
        if (!kq.thanhCong) { if (S.m) loiGui(kq); else veLoiSanh(kq); return; }
        sau(kq.ketQua);
      });
    }
    function ketQuaDung(kq) { veKetQua(kq, null); }
    async function ketThucTuMayChu() {
      const kq = await rpcBen("kc_cp_dung", { p_luot: S.luot.id });
      veKetQua(kq.ketQua || {}, null);
    }

    // ================= XONG CHẶNG =================
    function veXongChang(kq) {
      const k = kq.soDung, c = k / 5; // chặng vừa xong (1..5)
      const s = S.m.querySelector(".cpCau"); s.innerHTML = ""; s.className = "cpCau cpXongChang";
      S.m.querySelector(".cpDay").hidden = true;
      const cong = tao("div", "cpCong"); cong.innerHTML = '<i class="trai"></i><i class="phai"></i><span>' + BT_CHANG[c] + "</span>";
      s.appendChild(cong);
      s.appendChild(tao("h2", "cpXcTieuDe", "🎉 Qua " + TEN_CHANG[c - 1].split(" · ")[0].toLowerCase() + "!"));
      s.appendChild(tao("p", "cpXcMoc", "Mốc bảo toàn mới: " + so(T(k)) + " 💎"));
      s.appendChild(tao("p", "cpXcTiep", "Chặng " + (c + 1) + " khó hơn. Đúng câu " + (k + 1) + " được " + so(T(k + 1)) + " 💎, qua hết chặng được " + so(T(k + 5)) + " 💎."));
      const hang = tao("div", "cpHangNut");
      const tiep = tao("button", "cpNut chinh lon", "⚔️ Tiếp tục chinh phục"); tiep.type = "button";
      const dung = tao("button", "cpNut phu", "✋ Dừng & nhận " + so(T(k)) + " 💎"); dung.type = "button";
      tiep.addEventListener("click", () => { if (S.luot.cau) veCau(S.luot.cau); });
      dung.addEventListener("click", () => hoiDung(S.luot, ketQuaDung));
      hang.append(dung, tiep); s.appendChild(hang);
      tieng.ruong(); setTimeout(() => cong.classList.add("mo"), 200);
      phaoGiay(24);
      if (goc.matchMedia && goc.matchMedia("(pointer: fine)").matches) tiep.focus({ preventScroll: true });
    }

    // ================= KẾT QUẢ =================
    function veKetQua(k, sai) {
      if (!S.m) return;
      k = k || {};
      const m = S.m; m.classList.add("ketQua");
      const s = m.querySelector(".cpCau"); s.innerHTML = ""; s.className = "cpCau cpKq " + (k.kieu || "");
      m.querySelector(".cpDay").hidden = true; m.querySelector(".cpHop").hidden = true;
      if (S.luot) { S.luot.trangThai = k.kieu || "dung"; S.luot.soDung = k.soDung || 0; capNhat(); }
      const kc = Math.max(0, k.kc || 0), vang = Math.max(0, k.vang || 0);
      if (k.kieu === "xong") {
        s.appendChild(tao("div", "cpCupTo", "🏆"));
        s.appendChild(tao("h2", "cpKqTieuDe", "CHIẾN THẮNG!"));
        s.appendChild(tao("p", "cpKqPhu", "Con đã chinh phục đủ 30 câu và tới lâu đài!"));
        const hh = tao("div", "cpHuyHieu"); hh.append(tao("span", "", "🏅"), tao("b", "", "Nhà chinh phục"), tao("small", "", "Lần thứ " + (k.huyHieu || 1)));
        s.appendChild(hh);
      } else if (k.kieu === "sai") {
        s.appendChild(tao("div", "cpKqBt", "🌧️"));
        s.appendChild(tao("h2", "cpKqTieuDe", "Hành trình dừng ở câu " + (k.viTriSai || (k.soDung + 1))));
        if (sai && sai.cau) {
          const ss = tao("div", "cpSoSanh");
          const da = sai.cau.dapAn || [];
          ss.append(tao("p", "cpCauCu", sai.cau.noiDung || ""));
          const h = tao("div", "cpHaiO");
          const o1 = tao("div", "cpOChon"); o1.append(tao("small", "", "Con đã chọn"), tao("b", "", da[sai.chon] != null ? String(da[sai.chon]) : "…"));
          const o2 = tao("div", "cpODung"); o2.append(tao("small", "", "Đáp án đúng"), tao("b", "", da[sai.dapAnDung] != null ? String(da[sai.dapAnDung]) : "…"));
          h.append(o1, o2); ss.appendChild(h);
          if (sai.loiGiai) ss.appendChild(tao("p", "cpGiai", "💡 " + sai.loiGiai));
          s.appendChild(ss);
        }
        s.appendChild(tao("p", "cpKqPhu", k.soDung >= 5 ? "Con giữ được mốc bảo toàn câu " + 5 * Math.floor(k.soDung / 5) + ". Lần sau mình đi xa hơn nhé! 🦉" :
          k.soDung > 0 ? "Con đã đúng " + k.soDung + " câu. Lần sau mình đi xa hơn nhé! 🦉" : "Không sao, câu đầu hơi khó. Con thử lại nhé! 🦉"));
      } else {
        s.appendChild(tao("div", "cpKqBt", "🎁"));
        s.appendChild(tao("h2", "cpKqTieuDe", k.lyDo === "het_cau" ? "Hết câu hỏi hôm nay!" : "Con dừng đúng lúc!"));
        s.appendChild(tao("p", "cpKqPhu", k.lyDo === "het_han" ? "Hành trình bỏ dở đã tự dừng và giữ thưởng cho con." :
          k.lyDo === "het_cau" ? "Kho câu đã hết câu vừa sức hôm nay, Cô Cú giữ thưởng cho con." : "Đúng " + (k.soDung || 0) + " câu, phần thưởng là của con."));
      }
      if (k.kyLucMoi && k.soDung > 0) s.appendChild(tao("p", "cpKyLuc", "⭐ Kỷ lục mới: " + k.soDung + " câu!"));
      const ruong = tao("div", "cpRuong"); ruong.append(tao("span", "", "💎"));
      const tui = tao("div", "cpTui"); const sb = tao("b", "", "0"); tui.append("💎 +", sb);
      s.appendChild(tui);
      if (vang > 0) s.appendChild(tao("p", "cpGhiChu", "Hôm nay con đã nhận đủ 💎, phần thưởng đổi thành 🪙 " + so(vang) + " xu vàng."));
      // KC_03C7b: 🔥 chuỗi ngày (lượt đã kết thúc trên máy chủ)
      if (S.luot && S.luot.id && goc.KC_TT && typeof goc.KC_TT.veChuoi === "function") goc.KC_TT.veChuoi(s, rpc("kc_tt_chuoi_luot", { p_luot: S.luot.id }));
      // KC_08F2: vừa lên sao / danh hiệu thì màn chúc mừng (sau hiệu ứng rương)
      if (goc.KC_DANH_HIEU) goc.KC_DANH_HIEU.xet(rpc, { tre: 2600 });
      const hang = tao("div", "cpHangNut");
      const lai = tao("button", "cpNut chinh", "🚩 Chinh phục lượt mới"); lai.type = "button";
      lai.addEventListener("click", async () => { dongMan(false); await veSanh(); batDau(); });
      const ve = tao("button", "cpNut phu", "Về bản đồ"); ve.type = "button";
      ve.addEventListener("click", () => dongMan(true));
      hang.append(ve, lai); s.appendChild(hang);
      // hiệu ứng: kim cương đếm lên
      tieng.ruong();
      const dem0 = performance.now(), dai = Math.min(2200, 600 + kc * 3);
      const iv = setInterval(() => {
        const t = Math.min(1, (performance.now() - dem0) / dai);
        sb.textContent = so(Math.round(kc * (1 - Math.pow(1 - t, 3))));
        if (t >= 1) clearInterval(iv);
      }, 50);
      for (let i = 0; i < Math.min(10, Math.max(3, Math.ceil(kc / 20))); i++) setTimeout(() => {
        const v = tao("span", "cpKcBay", "💎"); v.style.setProperty("--x", (Math.random() * 160 - 80) + "px"); tui.appendChild(v); setTimeout(() => v.remove(), 900); tieng.kc(i);
      }, 300 + i * 110);
      if (k.kieu === "xong") { phaoGiay(60); setTimeout(() => { phaoGiay(60); tieng.keng(); }, 900); setTimeout(() => phaoGiay(60), 1900); }
      else if (kc >= 35) { phaoGiay(40); tieng.keng(); }
      if (goc.matchMedia && goc.matchMedia("(pointer: fine)").matches) setTimeout(() => lai.focus({ preventScroll: true }), 600);
    }

    // ================= BẢN ĐỒ NHỎ (điện thoại) =================
    function moBanDoNho() {
      const h = tao("div", "cpHoi cpBdNho");
      const hop = tao("div", "cpHoiHop");
      hop.append(tao("h3", "", "🗺️ Bản đồ hành trình"), veBanDo(Math.min(5, Math.floor((S.luot.trangThai === "dang" ? S.luot.viTri : S.luot.soDung) / 5)), S.luot.soDung));
      const n = tao("button", "cpNut chinh", "Đóng"); n.type = "button"; n.addEventListener("click", () => h.remove());
      hop.appendChild(n); h.appendChild(hop);
      h.addEventListener("click", e => { if (e.target === h) h.remove(); });
      S.m.appendChild(h);
    }

    // ================= HIỆU ỨNG =================
    function phaoSao(b) {
      const r = b.getBoundingClientRect();
      for (let i = 0; i < 8; i++) {
        const s = tao("span", "cpSao", "⭐");
        s.style.left = (r.left + r.width / 2) + "px"; s.style.top = (r.top + r.height / 2) + "px";
        const g = (i / 8) * Math.PI * 2; s.style.setProperty("--dx", Math.cos(g) * 70 + "px"); s.style.setProperty("--dy", Math.sin(g) * 50 - 20 + "px");
        S.m.appendChild(s); setTimeout(() => s.remove(), 800);
      }
    }
    function phaoGiay(n) {
      if (!S.m) return;
      const mau = ["#ffc24b", "#ff8a3d", "#3ddc84", "#7fb5ff", "#ff7aa8", "#b388ff"];
      for (let i = 0; i < n; i++) {
        const p = tao("i", "cpGiay");
        p.style.left = Math.random() * 100 + "%"; p.style.background = mau[i % mau.length];
        p.style.animationDelay = (Math.random() * 0.5) + "s"; p.style.setProperty("--xoay", (Math.random() * 720 - 360) + "deg");
        S.m.appendChild(p); setTimeout(() => p.remove(), 3000);
      }
    }

    // ================= PHÍM (máy tính) =================
    function phim(e) {
      if (S.dong || !S.m || e.altKey || e.ctrlKey || e.metaKey) return;
      if (S.m.querySelector(".cpHoi")) { if (e.key === "Escape") S.m.querySelector(".cpHoi").remove(); return; }
      if (S.m.classList.contains("ketQua") || S.daCham) return;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= 6) { const b = S.m.querySelector('.cpDa[data-i="' + (n - 1) + '"]'); if (b && !b.disabled) { e.preventDefault(); chonDa(n - 1); } return; }
      if (e.key === "Enter" && S.chon >= 0 && doc.activeElement && !doc.activeElement.closest(".cpDay, .cpHangNut")) { e.preventDefault(); guiDa(); }
      if (e.key === "Escape") dongMan(true);
    }

    function dongMan(veLaiSanh) {
      if (!S.m) return;
      S.dong = true;
      doc.removeEventListener("keydown", phim, true);
      const a = AM(); if (a) a.dung();
      const m = S.m; S.m = null; m.classList.add("tat"); doc.body.classList.remove("cpDangChoi");
      setTimeout(() => m.remove(), 200);
      if (veLaiSanh) veSanh();
    }

    veSanh();
    return { veSanh };
  }

  goc.KC_CP = { gan };
})(typeof window !== "undefined" ? window : globalThis);
// 24/11/2026 - BƯỚC: KC_03C6 (tạo mới: màn Chinh phục 30 câu, 2 khổ)
// 24/11/2026 - BƯỚC: KC_03C7b (dòng 🔥 chuỗi ngày ở màn kết quả, RPC kc_tt_chuoi_luot)
// 25/11/2026 - BƯỚC: KC_08F2 (màn kết quả gọi KC_DANH_HIEU.xet: chúc mừng lên sao / danh hiệu)
