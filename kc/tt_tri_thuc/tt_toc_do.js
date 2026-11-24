/* ================================================================
   FILE: tt_tri_thuc/tt_toc_do.js
   CHỨC NĂNG: ⚡ TỐC ĐỘ của phân hệ THỬ THÁCH tri thức (đặc tả Thiet_Ke_On_The.md mục 4.3, 5.6, 8.4, 8.5).
              Sảnh: chọn môn (🎲 Ngẫu nhiên hoặc môn đủ câu; môn chưa đủ câu hiện mờ), luật có nút đọc 🔊, bảng thưởng,
              kỷ lục, 🪙 trong ví. Chơi: đồng hồ 60 giây chạy LIÊN TỤC, tối đa 10 câu; CHẠM đáp án là xong câu
              (không bấm Trả lời), hoặc Bỏ qua ⏭. Đúng / sai biết ngay trên máy bằng MÃ KIỂM (sha256 của muối lượt + vị trí câu
              + vị trí đáp án, tính sẵn lúc bắt đầu nên chạm là có màu, không chờ mạng). Hết lượt gửi cả danh sách, máy chủ
              CHẤM LẠI, trả 💎 theo số câu đúng và trừ 🪙 mỗi câu sai. Kết quả + "Xem lại câu sai" (đáp án + lời giải).
              Mất mạng: chơi tiếp được, kết quả nằm trong hàng chờ trên máy (localStorage), gửi khi có mạng / lần mở sau.
              Tải lại trang giữa chừng: lượt còn giờ thì "Chơi tiếp" đúng câu đang dở.
              Điện thoại (< 900 px): đồng hồ viên thuốc + thanh thời gian ở trên, 10 chấm, đáp án lưới 2 × 2 ở nửa dưới (ngón cái).
              Máy tính (≥ 900 px): 3 cột: vòng đồng hồ lớn bên trái | câu + đáp án | 10 ô kết quả; phím 1-4 chọn, Space bỏ qua.
   DÙNG:      KC_TDO.gan(phanTu, { ten, maPhien, goiRpc(ten, thamSo) -> Promise<json> })
   RPC:       kc_tdo_trang_chu, kc_tdo_bat_dau, kc_tdo_ket_thuc (SQL repo_rieng supabase_kc03c5_toc_do.sql).
   ÂM THANH:  đúng / sai / 💎: module chung KC_AM_THANH (Quản trị › 🎵 Âm thanh chung). Tiếng riêng Tốc độ: tt_toc_do_am.js
              (KC_TDO_AM, chỉnh ở Quản trị › ⚡ Tốc độ › 🔊 Âm thanh): nhạc nền nhanh dần, đếm ngược, bé nghĩ lâu, gần hết giờ,
              đúng liên tiếp, bỏ qua, hết giờ, trống cuộn, kèn kết quả; nút 🔊/🔇.
   PHỤ THUỘC: chung/am_thanh.js (KC_AM_THANH: tiếng đúng / sai / thưởng, đọc luật). Dùng lại nút .cpNut của tt_chinh_phuc.css.
   BƯỚC: KC_03C5
   NGÀY: 24/11/2026
   ================================================================ */
(function (goc) {
  "use strict";
  const doc = goc.document;
  const ngu = ms => new Promise(r => setTimeout(r, ms));
  const tao = (the, lop, chu) => { const e = doc.createElement(the); if (lop) e.className = lop; if (chu != null) e.textContent = chu; return e; };
  const nut = (lop, chu) => { const b = tao("button", lop, chu); b.type = "button"; return b; };
  const so = n => Number(n || 0).toLocaleString("vi-VN");
  const AM = () => goc.KC_AM_THANH || null;
  // âm thanh hồi hộp riêng của Tốc độ (tt_toc_do_am.js); thiếu file thì mọi lệnh thành rỗng
  const AMT = new Proxy({}, { get: (_, k) => { const a = goc.KC_TDO_AM; return a && typeof a[k] === "function" ? a[k] : () => true; } });
  const tieng = {
    dung() { const a = AM(); if (a) a.tieng.dung(); },
    sai() { const a = AM(); if (a) a.tieng.sai(); },
    thuong() { const a = AM(); if (a) a.tieng.thuong(); },
    kc(i) { const a = AM(); if (a) a.tieng.kc(i); },
    keng() { const a = AM(); if (a) a.tieng.keng(); }
  };
  const docLS = k => { try { return JSON.parse(goc.localStorage.getItem(k) || "null"); } catch (e) { return null; } };
  const ghiLS = (k, v) => { try { if (v == null) goc.localStorage.removeItem(k); else goc.localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* chặn lưu: bỏ qua */ } };
  const fmt = s => { s = Math.max(0, Math.ceil(s)); return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); };

  async function sha12(chu) {
    try {
      const b = await goc.crypto.subtle.digest("SHA-256", new TextEncoder().encode(chu));
      return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, "0")).join("").slice(0, 12);
    } catch (e) { return null; }
  }

  function gan(goc0, tc) {
    const S = { ten: tc.ten, maPhien: tc.maPhien, goi: tc.goiRpc, tc: null, mon: "", luot: null, m: null, dong: true };
    const KHOA_DANG = "kc_tdo_dang_" + String(S.ten || "").toLowerCase();
    const KHOA_CHO = "kc_tdo_cho_" + String(S.ten || "").toLowerCase();
    AMT.taiCauHinh(); // KC_03C5c: nạp sẵn cài đặt âm thanh riêng (mặc định + Quản trị sửa) lúc vào sảnh
    S.mon = docLS("kc_tdo_mon_" + String(S.ten || "").toLowerCase()) || "";

    function rpc(ten, ts) {
      return Promise.resolve(S.goi(ten, Object.assign({ p_ten: S.ten, p_ma_phien: S.maPhien }, ts || {})))
        .then(kq => (!kq ? { thanhCong: false, ma: "mang" } : (!kq.thanhCong && !kq.ma ? Object.assign({}, kq, { ma: "mang" }) : kq))) // kcGoiRpc nuốt lỗi mạng: coi là mạng
        .catch(() => ({ thanhCong: false, ma: "mang" }));
    }
    async function rpcBen(ten, ts, lan0) {
      let kq = null;
      for (let lan = 0; lan < (lan0 || 3); lan++) {
        kq = await rpc(ten, ts);
        if (kq.thanhCong || (kq.ma && kq.ma !== "mang")) return kq;
        await ngu(800 * (lan + 1));
      }
      return kq;
    }
    const thuong = k => { const t = (S.tc && S.tc.thuong) || []; return t.length ? (t[Math.max(0, Math.min(k, t.length - 1))] || 0) : 0; };

    // hàng chờ: gửi kết quả chưa gửi được (mất mạng). Trả kết quả của lượt cuối gửi được (nếu có)
    async function guiHangCho() {
      let cho = docLS(KHOA_CHO) || [];
      if (!cho.length) return null;
      let cuoi = null;
      const con = [];
      for (const x of cho) {
        const kq = await rpc("kc_tdo_ket_thuc", { p_luot: x.luot, p_tra_loi: x.ds, p_bo: !!x.bo });
        if (kq.thanhCong) cuoi = kq;
        else if (kq.ma === "mang" && Date.now() - (x.luc || 0) < 24 * 3600e3) con.push(x); // mạng còn lỗi: giữ lại
      }
      ghiLS(KHOA_CHO, con.length ? con : null);
      return cuoi;
    }

    // ================= SẢNH =================
    async function veSanh() {
      goc0.innerHTML = '<div class="tdSanh"><p class="tdTai">Cô Cú đang lên dây đồng hồ… ⏱️</p></div>';
      const daGui = await guiHangCho();
      const kq = await rpcBen("kc_tdo_trang_chu");
      if (!kq.thanhCong) { veLoiSanh(kq); return; }
      S.tc = kq;
      const dsMon = kq.mon || [], du = dsMon.filter(m => m.du), chua = dsMon.filter(m => !m.du);
      if (S.mon && !du.some(m => m.ma === S.mon)) S.mon = "";
      const s = tao("div", "tdSanh");
      const dau = tao("header", "tdSanhDau");
      dau.append(tao("div", "tdSet", "⚡"));
      const td = tao("div", "tdSanhTieuDe");
      td.append(tao("h2", "", "Tốc độ"), tao("p", "", kq.giay + " giây · tối đa " + kq.soCau + " câu · nhanh tay, nhanh trí!"));
      dau.appendChild(td);
      const dh = tao("div", "tdDhNho"); dh.append(tao("b", "", fmt(kq.giay)), tao("small", "", "đồng hồ"));
      dau.appendChild(dh);
      s.appendChild(dau);
      if (daGui && daGui.ketQua && !daGui.cu) s.appendChild(tao("p", "tdBaoNho", "📮 Lượt chơi lúc mất mạng đã được gửi: đúng " + daGui.ketQua.soDung + " câu, +" + so(daGui.ketQua.kc) + " 💎."));

      const than = tao("div", "tdSanhThan");
      // --- trái: chọn môn
      const trai = tao("section", "tdKhoiMon");
      trai.appendChild(tao("h3", "", "1. Con chọn môn"));
      const luoi = tao("div", "tdLuoiMon");
      const oMon = (ma, bt, ten, phu) => {
        const b = nut("tdMon" + (S.mon === ma ? " chon" : ""));
        b.dataset.mon = ma; b.setAttribute("aria-pressed", S.mon === ma ? "true" : "false");
        b.append(tao("span", "tdMonBt", bt), tao("b", "", ten), tao("small", "", phu));
        b.addEventListener("click", () => {
          S.mon = ma; ghiLS("kc_tdo_mon_" + String(S.ten || "").toLowerCase(), ma || null);
          luoi.querySelectorAll(".tdMon").forEach(x => { const c = x.dataset.mon === ma; x.classList.toggle("chon", c); x.setAttribute("aria-pressed", c ? "true" : "false"); });
          const bd = s.querySelector(".tdNutBatDau"); if (bd) bd.querySelector("small").textContent = tenMon();
        });
        return b;
      };
      luoi.appendChild(oMon("", "🎲", "Ngẫu nhiên", "Trộn các môn"));
      du.forEach(m => luoi.appendChild(oMon(m.ma, m.bieuTuong || "📘", m.ten, so(m.soCau) + " câu")));
      trai.appendChild(luoi);
      if (chua.length) {
        const ct = tao("details", "tdMonMo");
        ct.appendChild(tao("summary", "", "Môn sắp có (" + chua.length + ") · đang thêm câu"));
        const lm = tao("div", "tdLuoiMo");
        chua.forEach(m => { const o = tao("span", "tdMonMoO"); o.append(tao("span", "", m.bieuTuong || "📘"), tao("span", "", m.ten)); o.title = "Chưa đủ " + kq.soCau + " câu ngắn"; lm.appendChild(o); });
        ct.appendChild(lm); trai.appendChild(ct);
      }
      than.appendChild(trai);

      // --- phải: luật, thưởng, nút
      const phai = tao("section", "tdKhoiPhai");
      const chip = tao("div", "tdChip");
      chip.append(tao("span", "", "⭐ Kỷ lục: " + (kq.kyLuc || 0) + " / " + kq.soCau), tao("span", "", "🪙 " + so(kq.viVang)),
        tao("span", "", "💎 Hôm nay: " + so(kq.daNhanHomNay) + " / " + so(kq.tranNgay)));
      phai.appendChild(chip);
      const luatChu = [
        kq.giay + " giây, tối đa " + kq.soCau + " câu. Đồng hồ chạy liên tục.",
        "Chạm đáp án là sang câu mới. Không chắc thì bấm Bỏ qua.",
        kq.truVang > 0 ? "Sai mỗi câu trừ " + kq.truVang + " xu vàng, bỏ qua không trừ." : "Sai hay bỏ qua đều không bị trừ."
      ];
      const luat = tao("div", "tdLuat");
      const hl = tao("div", "tdLuatDau"); hl.appendChild(tao("b", "", "📜 Luật chơi"));
      const nghe = nut("tdNghe", "🔊"); nghe.setAttribute("aria-label", "Nghe luật");
      nghe.addEventListener("click", () => { const a = AM(); if (a) a.doc(luatChu.join(" "), { lang: "vi" }); });
      hl.appendChild(nghe); luat.appendChild(hl);
      const ul = tao("ul");
      ul.append(tao("li", "", "⏱️ " + luatChu[0]), tao("li", "", "👆 " + luatChu[1]),
        tao("li", "", kq.truVang > 0 ? "❌ Sai mỗi câu −" + kq.truVang + " 🪙 · ⏭ bỏ qua không trừ" : "❌ Sai hay ⏭ bỏ qua đều không bị trừ"));
      luat.appendChild(ul);
      phai.appendChild(luat);
      // bảng thưởng: gom các mức bằng nhau
      const bt = tao("div", "tdBangThuong");
      bt.appendChild(tao("b", "tdBtTieuDe", "🎁 Đúng càng nhiều, thưởng càng lớn"));
      const hang = tao("div", "tdBtHang");
      const t = kq.thuong || [];
      for (let i = 0; i < t.length;) {
        let j = i; while (j + 1 < t.length && t[j + 1] === t[i]) j++;
        if (t[i] > 0) {
          const o = tao("div", "tdBtO" + (j === t.length - 1 ? " dinh" : ""));
          o.append(tao("small", "", "Đúng " + (i === j ? i : i + "-" + j)), tao("b", "", so(t[i]) + " 💎"));
          hang.appendChild(o);
        }
        i = j + 1;
      }
      bt.appendChild(hang); phai.appendChild(bt);

      const hn = tao("div", "tdHangNut");
      const l = kq.luotDang, dang = docLS(KHOA_DANG);
      if (l && l.conGiay > 1) {
        const con = dang && dang.id === l.id ? Math.max(0, dang.giay - (Date.now() - dang.bd) / 1000) : l.conGiay;
        const tiep = nut("cpNut chinh lon tdNutBatDau", "▶ Chơi tiếp");
        tiep.appendChild(tao("small", "", "còn " + Math.ceil(con) + " giây"));
        tiep.addEventListener("click", () => batDau(true));
        hn.appendChild(tiep);
        phai.appendChild(tao("p", "tdGhiChu", "Con đang dở một lượt. Đồng hồ vẫn chạy, chơi tiếp ngay nhé!"));
      } else {
        const bd = nut("cpNut chinh lon tdNutBatDau", "⚡ Bắt đầu");
        bd.appendChild(tao("small", "", tenMon()));
        bd.disabled = !du.length;
        bd.addEventListener("click", () => batDau(false));
        hn.appendChild(bd);
        if (!du.length) phai.appendChild(tao("p", "tdGhiChu", "Kho câu hỏi chưa đủ câu ngắn. Con quay lại sau nhé!"));
      }
      phai.appendChild(hn);
      than.appendChild(phai);
      s.appendChild(than);
      goc0.innerHTML = ""; goc0.appendChild(s);
      const nc = s.querySelector(".tdNutBatDau");
      if (nc && goc.matchMedia && goc.matchMedia("(pointer: fine)").matches) nc.focus({ preventScroll: true });
    }
    function tenMon() {
      if (!S.mon) return "🎲 Ngẫu nhiên";
      const m = ((S.tc && S.tc.mon) || []).find(x => x.ma === S.mon);
      return m ? (m.bieuTuong || "") + " " + m.ten : "🎲 Ngẫu nhiên";
    }

    function veLoiSanh(kq) {
      goc0.innerHTML = "";
      const s = tao("div", "tdSanh tdLoiKhoi");
      const ma = kq && kq.ma;
      s.append(tao("p", "tdTai", ma === "dang_nhap" ? "Con đăng nhập lại rồi vào lại nhé." :
        /function|does not exist|schema cache/i.test((kq && (kq.thongBao || kq.message)) || "") ? "Tốc độ đang được chuẩn bị trên máy chủ. Con quay lại sau nhé!" :
          "Mạng đang chập chờn. Con bấm Thử lại nhé."));
      const n = nut("cpNut chinh", "Thử lại"); n.addEventListener("click", veSanh);
      s.appendChild(n); goc0.appendChild(s);
    }

    // ================= BẮT ĐẦU =================
    async function batDau(tiep) {
      AMT.mo(); // ngay trong cú chạm: điện thoại mới cho phát tiếng
      const n0 = goc0.querySelector(".tdNutBatDau"); if (n0) n0.disabled = true;
      const kq = await rpcBen("kc_tdo_bat_dau", tiep ? {} : { p_mon: S.mon || null });
      if (!kq.thanhCong) {
        if (n0) n0.disabled = false;
        if (kq.ma === "khong_du_cau" || kq.ma === "mon") {
          const p = goc0.querySelector(".tdHangNut");
          if (p) p.before(tao("p", "tdGhiChu loi", "Môn này chưa đủ câu ngắn. Con chọn 🎲 Ngẫu nhiên hoặc môn khác nhé!"));
          return;
        }
        veLoiSanh(kq); return;
      }
      const l = kq.luot;
      // tính sẵn vị trí đúng của mọi câu (mã kiểm) -> chạm là biết ngay
      const dung = await Promise.all(l.cau.map(async (c, v) => {
        const ds = [];
        for (let i = 0; i < (c.dapAn || []).length; i++) { const h = await sha12(l.muoi + ":" + v + ":" + i); if (h && (c.k || []).includes(h)) ds.push(i); }
        return ds;
      }));
      const cu = docLS(KHOA_DANG);
      S.luot = { id: l.id, cau: l.cau, dung, giay: l.giay, soCau: l.soCau || l.cau.length, tl: [], bd: 0 };
      if (kq.tiep && cu && cu.id === l.id) { S.luot.tl = cu.tl || []; S.luot.bd = cu.bd; }
      else if (kq.tiep) S.luot.bd = Date.now() - Math.max(0, l.giay - l.conGiay) * 1000;
      moMan();
      if (!S.luot.bd) { await demNguoc(); if (S.dong) return; S.luot.bd = Date.now(); }
      luuDang();
      chay();
    }
    function luuDang() { const l = S.luot; if (l) ghiLS(KHOA_DANG, { id: l.id, tl: l.tl, bd: l.bd, giay: l.giay }); }

    // ================= MÀN CHƠI =================
    function moMan() {
      S.dong = false; S.xong = false;
      const m = tao("div", "tdMan"); m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); m.setAttribute("aria-label", "Thử thách Tốc độ");
      m.innerHTML =
        '<div class="tdNen"></div>' +
        '<div class="tdBo">' +
        '  <aside class="tdCotTrai"><div class="tdVong"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="nen" cx="60" cy="60" r="52"></circle>' +
        '    <circle class="chay" cx="60" cy="60" r="52"></circle></svg><div class="tdVongChu"><b class="tdGio">00:60</b><small>còn lại</small></div></div>' +
        '    <div class="tdDem"><span class="tdDemCau">Câu 1 / 10</span><span class="tdDemDung">✔ 0</span></div>' +
        '    <p class="tdMeo">Phím <kbd>1</kbd>-<kbd>4</kbd> chọn · <kbd>Space</kbd> bỏ qua</p></aside>' +
        '  <main class="tdGiua">' +
        '    <header class="tdDau"><button class="tdDong" type="button" aria-label="Dừng lượt">✕</button>' +
        '      <div class="tdVien"><span class="tdVienBt">⏱️</span><b class="tdGio">00:60</b></div>' +
        '      <span class="tdDemCau">Câu 1 / 10</span><span class="tdDemDung">✔ 0</span>' +
        '      <button class="tdLoa" type="button"></button></header>' +
        '    <div class="tdThanh" aria-hidden="true"><i></i></div>' +
        '    <div class="tdCham" aria-hidden="true"></div>' +
        '    <section class="tdCau" aria-live="polite"></section>' +
        '    <div class="tdDay"><button class="tdBoQua" type="button">Bỏ qua ⏭</button></div>' +
        '  </main>' +
        '  <aside class="tdCotPhai"><h3>📋 Kết quả từng câu</h3><ol class="tdDs"></ol></aside>' +
        '</div>';
      doc.body.appendChild(m); doc.body.classList.add("cpDangChoi");
      S.m = m;
      m.querySelector(".tdDong").addEventListener("click", hoiDung);
      m.querySelector(".tdBoQua").addEventListener("click", () => traLoi(null));
      const loa = m.querySelector(".tdLoa");
      const veLoa = () => { const b = AMT.bat(); loa.textContent = b ? "🔊" : "🔇"; loa.setAttribute("aria-label", b ? "Tắt tiếng" : "Bật tiếng"); loa.classList.toggle("tat", !b); };
      loa.addEventListener("click", () => { AMT.doiBat(); veLoa(); });
      veLoa();
      S.combo = 0;
      doc.addEventListener("keydown", phim, true);
      const n = S.luot.soCau, ch = m.querySelector(".tdCham"), ds = m.querySelector(".tdDs");
      for (let i = 0; i < n; i++) {
        ch.appendChild(tao("i"));
        const li = tao("li"); li.append(tao("span", "tdDsSo", String(i + 1)), tao("span", "tdDsChu", "…")); ds.appendChild(li);
      }
      veDem();
    }

    async function demNguoc() {
      const c = S.m.querySelector(".tdCau"); c.className = "tdCau tdDemNguoc";
      S.m.querySelector(".tdDay").hidden = true;
      for (const x of ["3", "2", "1", "Bắt đầu!"]) {
        if (S.dong) return;
        c.innerHTML = ""; const b = tao("div", "tdSo3", x); c.appendChild(b);
        if (x.length === 1) AMT.phat("demNguoc", Number(x)); else AMT.phat("batDau");
        await ngu(x.length === 1 ? 650 : 450);
      }
      S.m.querySelector(".tdDay").hidden = false;
    }

    function conLai() { const l = S.luot; return Math.max(0, l.giay - (Date.now() - l.bd) / 1000); }
    function chay() {
      veCau();
      const vong = S.m.querySelector(".tdVong .chay"), thanh = S.m.querySelector(".tdThanh i");
      const CV = 2 * Math.PI * 52;
      vong.style.strokeDasharray = String(CV);
      const buoc = () => {
        if (S.dong || S.xong) return;
        const con = conLai(), ty = con / S.luot.giay;
        S.m.querySelectorAll(".tdGio").forEach(g => { g.textContent = fmt(con); });
        vong.style.strokeDashoffset = String(CV * (1 - ty));
        thanh.style.transform = "scaleX(" + ty + ")";
        S.m.classList.toggle("cam", con <= 10 && con > 5); S.m.classList.toggle("do", con <= 5);
        const giay = Math.ceil(con);
        AMT.muc(con);
        const hh = AMT.hoiHop();
        if (giay <= hh.ganHetGioGiay && giay > 0 && giay !== S.tich) { S.tich = giay; AMT.phat("ganHetGio", giay); }
        // bé nghĩ lâu: chưa chạm sau nghiLauGiay giây -> nhắc nhẹ; còn nghĩ tiếp thì nhắc lại mỗi nhacLaiGiay giây
        if (hh.nghiLauGiay > 0 && !S.khoa && S.tCau) {
          const nghi = (Date.now() - S.tCau) / 1000, moc = hh.nghiLauGiay + S.soNhac * (hh.nhacLaiGiay > 0 ? hh.nhacLaiGiay : Infinity);
          if (nghi >= moc && giay > hh.ganHetGioGiay) { S.soNhac++; AMT.phat("nghiLau"); }
        }
        if (con <= 0) { hetGio(); return; }
        S.raf = goc.requestAnimationFrame(buoc);
      };
      S.tich = 0;
      AMT.batNhac();
      buoc();
    }

    function veDem() {
      const l = S.luot, m = S.m; if (!m) return;
      const vt = Math.min(l.tl.length, l.soCau - 1);
      const dg = l.tl.filter(x => x.ok === true).length;
      m.querySelectorAll(".tdDemCau").forEach(e => { e.textContent = "Câu " + (vt + 1) + " / " + l.soCau; });
      m.querySelectorAll(".tdDemDung").forEach(e => { e.textContent = "✔ " + dg; });
      const ch = m.querySelectorAll(".tdCham i"), li = m.querySelectorAll(".tdDs li");
      for (let i = 0; i < l.soCau; i++) {
        const x = l.tl[i], lop = !x ? (i === l.tl.length ? "nay" : "") : x.c == null ? "bo" : x.ok === true ? "dung" : x.ok === false ? "sai" : "da";
        if (ch[i]) ch[i].className = lop;
        if (li[i]) { li[i].className = lop; li[i].querySelector(".tdDsChu").textContent = !x ? (lop === "nay" ? "đang làm" : "…") : x.c == null ? "⏭ bỏ qua" : x.ok === true ? "✔ đúng" : x.ok === false ? "✘ sai" : "đã chọn"; }
      }
    }

    function veCau() {
      const l = S.luot, vt = l.tl.length;
      if (vt >= l.soCau) { ketThuc(false); return; }
      const cau = l.cau[vt], s = S.m.querySelector(".tdCau");
      S.khoa = false; S.tCau = Date.now(); S.soNhac = 0;
      s.innerHTML = ""; s.className = "tdCau vao"; s.dataset.vt = String(vt);
      const nh = tao("div", "tdNhan");
      if (cau.monTen) nh.appendChild(tao("span", "tdNhanMon", (cau.monBieuTuong || "") + " " + cau.monTen));
      s.appendChild(nh);
      const khung = tao("div", "tdKhung");
      khung.appendChild(tao("p", "tdNoiDung", cau.noiDung || ""));
      if (cau.hinhChu) khung.appendChild(tao("div", "tdHinh", cau.hinhChu));
      s.appendChild(khung);
      const ds = tao("div", "tdDap");
      const da = cau.dapAn || [];
      if (da.some(x => String(x).length > 22)) ds.classList.add("doc");
      if (da.length === 2) ds.classList.add("hai");
      da.forEach((x, i) => {
        const b = nut("tdDa"); b.dataset.i = String(i);
        b.append(tao("span", "tdSo", String(i + 1)), tao("span", "tdChu", String(x)));
        b.addEventListener("click", () => traLoi(i));
        ds.appendChild(b);
      });
      s.appendChild(ds);
      veDem();
    }

    function traLoi(i) {
      if (S.dong || S.xong || S.khoa) return;
      const l = S.luot, vt = l.tl.length;
      if (vt >= l.soCau) return;
      S.khoa = true;
      const g = Math.round(Math.min(l.giay, (Date.now() - l.bd) / 1000) * 10) / 10;
      const dsDung = l.dung[vt] || [];
      const ok = i == null ? null : dsDung.length ? dsDung.includes(i) : undefined; // undefined: máy không tính được mã kiểm
      l.tl.push({ v: vt, c: i, g, ok });
      luuDang();
      const s = S.m.querySelector(".tdCau");
      if (i != null) {
        const b = s.querySelector('.tdDa[data-i="' + i + '"]');
        if (b) b.classList.add(ok === true ? "dung" : ok === false ? "sai" : "da");
        if (ok === false && dsDung.length) { const bd = s.querySelector('.tdDa[data-i="' + dsDung[0] + '"]'); if (bd) bd.classList.add("laDung"); }
        // đúng / sai: âm thanh CHUNG toàn app (Quản trị › 🎵 Âm thanh chung); combo: tiếng riêng Tốc độ
        if (ok === true) { S.combo++; tieng.dung(); if (S.combo >= 3) { AMT.phat("dungLienTiep", S.combo); veCombo(S.combo); } }
        else { S.combo = 0; if (ok === false) tieng.sai(); else tieng.kc(0); }
      } else { s.classList.add("boQua"); S.combo = 0; AMT.phat("boQua"); }
      veDem();
      setTimeout(() => { if (S.dong || S.xong) return; if (l.tl.length >= l.soCau) ketThuc(false); else veCau(); }, ok === false ? 380 : 250);
    }

    function veCombo(n) {
      if (!S.m) return;
      const cu = S.m.querySelector(".tdCombo"); if (cu) cu.remove();
      const c = tao("div", "tdCombo" + (n >= 5 ? " lon" : ""), "🔥 " + n + " câu liền!");
      S.m.appendChild(c); setTimeout(() => c.remove(), 900);
    }

    function hetGio() {
      if (S.xong) return;
      S.xong = true;
      AMT.dungNhac(true); AMT.phat("hetGio");
      const h = tao("div", "tdHetGio"); h.append(tao("span", "", "⏰"), tao("b", "", "Hết giờ!"));
      S.m.appendChild(h);
      setTimeout(() => { h.remove(); ketThuc(false); }, 1100);
    }

    // ================= DỪNG GIỮA CHỪNG =================
    function hoiDung() {
      if (!S.m || S.m.querySelector(".tdHoi") || S.daGui) return;
      const h = tao("div", "tdHoi"); h.setAttribute("role", "alertdialog"); h.setAttribute("aria-modal", "true");
      const hop = tao("div", "tdHoiHop");
      hop.append(tao("div", "tdHoiBt", "✋"), tao("h3", "", "Dừng lượt này?"), tao("p", "", "Lượt chưa xong nên chưa có thưởng, con cũng không mất gì. Đồng hồ vẫn đang chạy đó!"));
      const hang = tao("div", "tdHangNut");
      const co = nut("cpNut phu", "Dừng"), khong = nut("cpNut chinh", "Chơi tiếp");
      hang.append(co, khong); hop.appendChild(hang); h.appendChild(hop);
      S.m.appendChild(h);
      khong.focus({ preventScroll: true });
      khong.addEventListener("click", () => h.remove());
      h.addEventListener("click", e => { if (e.target === h) h.remove(); });
      co.addEventListener("click", () => { h.remove(); ketThuc(true); });
    }

    // ================= GỬI + KẾT QUẢ =================
    async function ketThuc(bo) {
      if (S.daGui) return;
      S.daGui = true; S.xong = true;
      if (S.raf) goc.cancelAnimationFrame(S.raf);
      const l = S.luot;
      const ds = l.tl.map(x => ({ v: x.v, c: x.c, g: x.g }));
      const s = S.m.querySelector(".tdCau"); s.innerHTML = ""; s.className = "tdCau tdCho";
      s.appendChild(tao("p", "tdTai", bo ? "Đang dừng lượt…" : "Cô Cú đang chấm lại… 🦉"));
      S.m.querySelector(".tdDay").hidden = true;
      AMT.dungNhac(false);
      if (!bo) AMT.phat("trongCuon");
      // chờ chấm ít nhất ~1,2 giây cho trống cuộn hồi hộp, rồi mới mở kết quả
      const [kq] = await Promise.all([rpcBen("kc_tdo_ket_thuc", { p_luot: l.id, p_tra_loi: ds, p_bo: !!bo }, 3), ngu(bo ? 0 : 1200)]);
      ghiLS(KHOA_DANG, null);
      if (!kq.thanhCong && kq.ma === "mang") {
        const cho = docLS(KHOA_CHO) || []; cho.push({ luot: l.id, ds, bo: !!bo, luc: Date.now() }); ghiLS(KHOA_CHO, cho);
        if (bo) { dongMan(true); return; }
        veKetQua(null, true); return;
      }
      if (bo) { dongMan(false); veSanh().then(() => { const p = goc0.querySelector(".tdHangNut"); if (p) p.before(tao("p", "tdGhiChu", "Lượt này chưa xong nên chưa có thưởng. Con chơi lượt mới nhé!")); }); return; }
      if (!kq.thanhCong) { veKetQua(null, false, kq.ma); return; }
      veKetQua(kq.ketQua, false);
    }

    function veKetQua(k, choMang, maLoi) {
      if (!S.m) return;
      const m = S.m, l = S.luot; m.classList.add("ketQua"); m.classList.remove("cam", "do");
      const s = m.querySelector(".tdCau"); s.innerHTML = ""; s.className = "tdCau tdKq";
      // khi chưa có kết quả máy chủ: đếm trên máy
      const dem = { soDung: l.tl.filter(x => x.ok === true).length, soSai: l.tl.filter(x => x.ok === false).length, soBoQua: l.tl.filter(x => x.c == null).length };
      const kq = k || Object.assign({ kieu: l.tl.length >= l.soCau ? "xong" : "het_gio", kc: 0, truVang: 0, xemLai: [] }, dem);
      const xong = kq.kieu === "xong";
      s.appendChild(tao("div", "tdKqBt", xong ? "🏁" : "⏰"));
      s.appendChild(tao("h2", "tdKqTieuDe", xong ? "Xong " + l.soCau + " câu!" : "Hết giờ!"));
      const o3 = tao("div", "tdKqO3");
      [["✔", "Đúng", kq.soDung, "dung"], ["⏭", "Bỏ qua", kq.soBoQua, "bo"], ["✘", "Sai", kq.soSai, "sai"]].forEach(x => {
        const o = tao("div", "tdKqO " + x[3]); o.append(tao("span", "", x[0]), tao("b", "", String(x[2] || 0)), tao("small", "", x[1])); o3.appendChild(o);
      });
      s.appendChild(o3);
      if (xong && kq.conGiay > 0) s.appendChild(tao("p", "tdKqPhu", "⏱️ Còn " + Math.round(kq.conGiay) + " giây. Nhanh quá!"));
      if (kq.kyLucMoi && kq.soDung > 0) s.appendChild(tao("p", "tdKyLuc", "⭐ Kỷ lục mới: " + kq.soDung + " câu đúng!"));
      const kc = Math.max(0, kq.kc || 0), vang = Math.max(0, kq.vang || 0), tru = Math.max(0, kq.truVang || 0);
      const tui = tao("div", "tdTui");
      const sb = tao("b", "", "0"); const okc = tao("div", "tdTuiO kc"); okc.append("💎 +", sb); tui.appendChild(okc);
      if (tru > 0) { const ov = tao("div", "tdTuiO vang"); ov.append(tao("span", "", "🪙 −" + so(tru)), tao("small", "", kq.soSai + " câu sai")); tui.appendChild(ov); }
      s.appendChild(tui);
      if (choMang) s.appendChild(tao("p", "tdGhiChu", "📮 Mạng đang chập chờn. Kết quả đã cất trên máy, sẽ tự gửi khi có mạng (dự kiến +" + so(thuong(dem.soDung)) + " 💎)."));
      else if (maLoi) s.appendChild(tao("p", "tdGhiChu loi", maLoi === "qua_han" ? "Lượt này đã quá lâu nên không ghi được nữa." : "Máy chủ chưa nhận được kết quả. Con chơi lượt mới nhé."));
      else if (kq.tre) s.appendChild(tao("p", "tdGhiChu", "Lượt này gửi muộn nên chỉ ghi vào Sổ Ghi Nhớ, chưa có thưởng."));
      else if (vang > 0) s.appendChild(tao("p", "tdGhiChu", "Hôm nay con đã nhận đủ 💎, phần thưởng đổi thành 🪙 " + so(vang) + " xu vàng."));
      else if (kc === 0 && !kq.tongKc) {
        const tu = ((S.tc && S.tc.thuong) || []).findIndex(x => x > 0);
        if (tu > 0) s.appendChild(tao("p", "tdGhiChu", "Đúng từ " + tu + " câu là có 💎. Con thử lại nhé! 🦉"));
      }
      // KC_03C7b: 🔥 chuỗi ngày (chỉ khi máy chủ đã chấm lượt)
      if (k && !choMang && !maLoi && goc.KC_TT && typeof goc.KC_TT.veChuoi === "function") goc.KC_TT.veChuoi(s, rpc("kc_tt_chuoi_luot", { p_luot: l.id }));
      // xem lại câu sai
      const xl = (kq.xemLai || []);
      let hopXl = null;
      const hang = tao("div", "tdHangNut");
      if (xl.length) {
        const nx = nut("cpNut phu tdNutXemLai", "🔍 Xem lại câu sai (" + xl.length + ")");
        nx.addEventListener("click", () => { if (hopXl) { hopXl.hidden = !hopXl.hidden; nx.setAttribute("aria-expanded", String(!hopXl.hidden)); if (!hopXl.hidden) hopXl.scrollIntoView({ behavior: "smooth", block: "nearest" }); } });
        nx.setAttribute("aria-expanded", "false");
        hang.appendChild(nx);
        hopXl = tao("div", "tdXemLai"); hopXl.hidden = true;
        xl.forEach(x => {
          const o = tao("div", "tdXlO " + x.kieu);
          o.appendChild(tao("p", "tdXlCau", "Câu " + (x.viTri + 1) + ". " + (x.noiDung || "")));
          const h = tao("div", "tdXlHai");
          const da = x.dapAn || [];
          const c1 = tao("div", "tdXlChon"); c1.append(tao("small", "", x.kieu === "bo_qua" ? "Con đã" : "Con đã chọn"), tao("b", "", x.kieu === "bo_qua" ? "⏭ Bỏ qua" : String(da[x.chon] != null ? da[x.chon] : "…")));
          const c2 = tao("div", "tdXlDung"); c2.append(tao("small", "", "Đáp án đúng"), tao("b", "", String(da[x.dapAnDung] != null ? da[x.dapAnDung] : "…")));
          h.append(c1, c2); o.appendChild(h);
          if (x.loiGiai) o.appendChild(tao("p", "tdXlGiai", "💡 " + x.loiGiai));
          hopXl.appendChild(o);
        });
      }
      const lai = nut("cpNut chinh", "⚡ Chơi lượt mới");
      lai.addEventListener("click", async () => { dongMan(false); await veSanh(); batDau(false); });
      const ve = nut("cpNut phu", "Về sảnh");
      ve.addEventListener("click", () => dongMan(true));
      hang.append(ve, lai);
      s.appendChild(hang);
      if (hopXl) s.appendChild(hopXl);
      // cột phải (máy tính): kết quả máy chủ
      if (k) {
        const li = m.querySelectorAll(".tdDs li");
        xl.forEach(x => { const e = li[x.viTri]; if (e && x.kieu === "sai") { e.className = "sai"; e.querySelector(".tdDsChu").textContent = "✘ sai"; } });
      }
      // hiệu ứng: 💎 đếm lên
      const ty = l.soCau ? (kq.soDung || 0) / l.soCau : 0;
      AMT.phat(ty >= 1 ? "kenGioi" : ty >= 0.5 ? "kenKha" : "kenNhe");
      const dem0 = performance.now(), dai = Math.min(1600, 500 + kc * 120);
      const iv = setInterval(() => {
        const t = Math.min(1, (performance.now() - dem0) / dai);
        sb.textContent = so(Math.round(kc * (1 - Math.pow(1 - t, 3))));
        if (t >= 1) clearInterval(iv);
      }, 50);
      for (let i = 0; i < Math.min(8, kc); i++) setTimeout(() => {
        if (!S.m) return;
        const v = tao("span", "tdKcBay", "💎"); v.style.setProperty("--x", (Math.random() * 140 - 70) + "px"); okc.appendChild(v); setTimeout(() => v.remove(), 900); tieng.kc(i);
      }, 1100 + i * 120);
      if (kq.soDung >= l.soCau) phaoGiay(50);
      else if (kq.kyLucMoi) phaoGiay(26);
      if (goc.matchMedia && goc.matchMedia("(pointer: fine)").matches) setTimeout(() => lai.focus({ preventScroll: true }), 500);
    }

    function phaoGiay(n) {
      if (!S.m) return;
      const mau = ["#ffc24b", "#ff8a3d", "#3ddc84", "#7fb5ff", "#ff7aa8", "#b388ff"];
      for (let i = 0; i < n; i++) {
        const p = tao("i", "tdGiay");
        p.style.left = Math.random() * 100 + "%"; p.style.background = mau[i % mau.length];
        p.style.animationDelay = (Math.random() * 0.5) + "s"; p.style.setProperty("--xoay", (Math.random() * 720 - 360) + "deg");
        S.m.appendChild(p); setTimeout(() => p.remove(), 3000);
      }
    }

    // ================= PHÍM (máy tính) =================
    function phim(e) {
      if (S.dong || !S.m || e.altKey || e.ctrlKey || e.metaKey) return;
      const hoi = S.m.querySelector(".tdHoi");
      if (hoi) { if (e.key === "Escape") { e.preventDefault(); hoi.remove(); } return; }
      if (S.xong) { if (e.key === "Escape") dongMan(true); return; }
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= 6) { const b = S.m.querySelector('.tdDa[data-i="' + (n - 1) + '"]'); if (b) { e.preventDefault(); traLoi(n - 1); } return; }
      if (e.key === " " || e.code === "Space") { e.preventDefault(); traLoi(null); return; }
      if (e.key === "Escape") { e.preventDefault(); hoiDung(); }
    }

    function dongMan(veLaiSanh) {
      if (S.raf) goc.cancelAnimationFrame(S.raf);
      AMT.dungNhac(false);
      S.dong = true; S.daGui = false;
      doc.removeEventListener("keydown", phim, true);
      const m = S.m; S.m = null;
      if (m) { m.classList.add("tat"); setTimeout(() => m.remove(), 200); }
      doc.body.classList.remove("cpDangChoi");
      if (veLaiSanh) veSanh();
    }

    goc.addEventListener("online", () => { if (S.dong) guiHangCho(); });
    veSanh();
    return { veSanh };
  }

  goc.KC_TDO = { gan };
})(typeof window !== "undefined" ? window : globalThis);
// 24/11/2026 - BƯỚC: KC_03C5 (tạo mới: màn Tốc độ, 2 khổ)
// 24/11/2026 - BƯỚC: KC_03C5b (âm thanh hồi hộp: nhạc nền dồn dập, combo, trống cuộn, kèn, nút tắt tiếng)
// 24/11/2026 - BƯỚC: KC_03C5c (đúng / sai dùng âm thanh chung; tiếng riêng theo cài đặt Quản trị; bé nghĩ lâu; gần hết giờ theo số giây cài đặt)
// 24/11/2026 - BƯỚC: KC_03C7b (dòng 🔥 chuỗi ngày ở màn kết quả, RPC kc_tt_chuoi_luot)
