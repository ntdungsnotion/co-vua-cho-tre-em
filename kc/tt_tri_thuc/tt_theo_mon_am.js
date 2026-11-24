/* ================================================================
   FILE: tt_tri_thuc/tt_theo_mon_am.js
   CHỨC NĂNG: ÂM THANH + NHỊP RIÊNG của 📚 Theo môn (KC_TM_AM), luật chơi mới người dùng 24/11/2026:
              "Vào câu, app hiện câu hỏi, đọc câu xong mới hiện bảng 4 đáp án. Khi đọc câu thì nhạc nền giai điệu nhanh,
              sôi động. Khi đợi trả lời thì có chuông tích tắc. Trả lời xong thì có bình luận...".
              Mọi tiếng + mốc giây CHỈNH Ở QUẢN TRỊ › 🎯 Thử Thách › 📚 Theo môn › 🔊 Âm thanh (qt_kho_tieng.js nhánh "tm").
              Tiếng ĐÚNG / SAI / 💎 và giọng đọc KHÔNG ở đây: dùng module chung KC_AM_THANH (🎵 Âm thanh chung).
              - Nhạc lúc đọc câu: file tải lên (lặp) hoặc nhạc tự tạo nhanh, vui (166 nhịp / phút, giọng trưởng).
                Máy đọc thành tiếng thì nhạc nhỏ lại (amLuong.nhacKhiDoc).
              - Tích tắc lúc chờ trả lời: file tải lên (lặp) hoặc tiếng tự tạo "tích - tắc" mỗi nửa giây.
              - Tiếng: hiện 4 đáp án, mở bình luận, sang câu mới.
              Cài đặt: mặc định du_lieu/cau_hinh_am_thanh_theo_mon.json < phần quản trị sửa (kc_dt_cau_hinh_qt ›
              cau_hinh_am_thanh_theo_mon). Tôn trọng nút tắt tiếng chung. Ẩn tab thì tạm dừng.
   DÙNG:      taiCauHinh(), datCauHinh(c, urlFn), cauHinh(), nhip(), mo() (trong cú chạm), batNhac(), nhoNhac(nho),
              dungNhac(), batTicTac(), dungTicTac(), phat(khoa), thu(khoa), thuNhac(), thuTicTac(), dungThu()
   PHỤ THUỘC: chung/am_thanh.js (nút tắt tiếng chung, địa chỉ file kho; thiếu thì vẫn chạy tiếng tự tạo).
   BƯỚC: KC_03C4b · NGÀY: 24/11/2026
   ================================================================ */
(function (goc) {
  "use strict";
  const DONG_MD = { bat: true, amLuong: 1, file: "", amTep: 1, kieu: "thay", tre: 0 };
  const NHIP_MD = { docThanhTieng: true, docDenLop: 12, docGiayToiThieu: 2.5, docGiayToiDa: 15, docChuMoiGiay: 3,
    binhLuanThanhTieng: true, binhLuanGiayDung: 4, binhLuanGiaySai: 8, ticTacSau: 0 };
  const MD = { amLuong: { tieng: 1, nhac: 0.35, nhacKhiDoc: 0.45 }, nhac: { doc: "" }, nhacNen: { tuTao: true }, nhip: NHIP_MD, tieng: {} };
  const AM = () => goc.KC_AM_THANH || null;
  const bat = () => { const a = AM(); return !a || !a.dangBat || a.dangBat(); };
  const laObj = v => v !== null && typeof v === "object" && !Array.isArray(v);
  function tron(a, b) {
    if (b === undefined || b === null) return a;
    if (!laObj(a) || !laObj(b)) return b;
    const kq = Object.assign({}, a); Object.keys(b).forEach(k => { kq[k] = tron(a[k], b[k]); }); return kq;
  }
  const so = (v, md) => { const n = Number(v); return isFinite(n) ? n : md; };

  // ---------------- cài đặt ----------------
  let ch = tron(MD, {}), urlRieng = null, hoa = null;
  const URL_MD = (() => { try { const s = goc.document && goc.document.currentScript; return new URL("du_lieu/cau_hinh_am_thanh_theo_mon.json", s && s.src ? s.src : goc.location.href).href; } catch (e) { return null; } })();
  function timClient() {
    for (const w of [goc, goc.parent, goc.top]) { try { const c = w && (w.kcSupabaseClient || w.supabaseClient); if (c && typeof c.rpc === "function") return c; } catch (e) { /* khung khác */ } }
    return null;
  }
  function taiCauHinh(moi) {
    if (hoa && !moi) return hoa;
    const md = URL_MD ? fetch(URL_MD, { cache: "no-cache" }).then(r => r.ok ? r.json() : {}).catch(() => ({})) : Promise.resolve({});
    const c = timClient();
    const sua = c ? Promise.resolve(c.rpc("kc_dt_cau_hinh_qt")).then(k => { const d = k && !k.error ? k.data : null; return d && d.thanhCong && laObj(d.sua) ? d.sua.cau_hinh_am_thanh_theo_mon || null : null; }).catch(() => null) : Promise.resolve(null);
    const kho = AM() && AM().taiCauHinh ? Promise.resolve(AM().taiCauHinh()).catch(() => null) : Promise.resolve(null);
    const hen = new Promise(x => setTimeout(x, 5000, "het"));
    return (hoa = Promise.race([Promise.all([md, sua, kho]), hen]).then(kq => {
      if (kq && kq !== "het") ch = tron(MD, tron(kq[0] || {}, kq[1] || {}));
      return ch;
    }).catch(() => ch));
  }
  function datCauHinh(moi, urlFn) { ch = tron(MD, moi || {}); urlRieng = typeof urlFn === "function" ? urlFn : null; }
  function urlTep(ma) {
    if (!ma) return null;
    if (urlRieng) { try { const u = urlRieng(ma); if (u) return u; } catch (e) { /* bỏ qua */ } }
    const a = AM(); if (a && a.urlTep) { const u = a.urlTep(ma); if (u) return u; }
    return /^(https?:|\/)/i.test(ma) ? ma : null;
  }
  function nhip() {
    const n = Object.assign({}, NHIP_MD, ch.nhip || {});
    ["docDenLop", "docGiayToiThieu", "docGiayToiDa", "docChuMoiGiay", "binhLuanGiayDung", "binhLuanGiaySai", "ticTacSau"].forEach(k => { n[k] = Math.max(0, so(n[k], NHIP_MD[k])); });
    n.docGiayToiDa = Math.max(n.docGiayToiDa, n.docGiayToiThieu);
    return n;
  }

  // ---------------- máy âm ----------------
  let ac = null, tong = null, nhacG = null, onTrang = null, heSo = 1;
  function may() {
    if (ac) return ac;
    try {
      const AC = goc.AudioContext || goc.webkitAudioContext; if (!AC) return null;
      ac = new AC();
      tong = ac.createGain(); tong.gain.value = bat() ? 1 : 0; tong.connect(ac.destination);
      nhacG = ac.createGain(); nhacG.gain.value = 0; nhacG.connect(tong);
      const n = ac.createBuffer(1, ac.sampleRate, ac.sampleRate), d = n.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      onTrang = n;
    } catch (e) { ac = null; }
    return ac;
  }
  function mo() { const a = may(); if (!a) return; try { if (a.state === "suspended") a.resume(); } catch (e) { /* bỏ qua */ } capNhatBat(); }
  function capNhatBat() {
    if (tong && ac) tong.gain.setTargetAtTime(bat() ? 1 : 0, ac.currentTime, 0.03);
    if (N.au) N.au.volume = bat() ? amNhac() : 0;
    if (TT.au) TT.au.volume = bat() ? amTicTac() : 0;
  }
  const f = (t0, nc) => t0 * Math.pow(2, nc / 12);
  const amNhac = () => Math.max(0, Math.min(1, so((ch.amLuong || {}).nhac, 0.35) * (N.nho ? Math.max(0, Math.min(1, so((ch.amLuong || {}).nhacKhiDoc, 0.45))) : 1)));
  const dongT = k => Object.assign({}, DONG_MD, (ch.tieng || {})[k]);
  const toChung = () => Math.max(0, Math.min(2, so((ch.amLuong || {}).tieng, 1)));
  const amTicTac = () => { const d = dongT("ticTac"); return Math.max(0, Math.min(1, so(d.amLuong, 1) * so(d.amTep, 1) * toChung())); };

  function not(tan, t, dai, kieu, to, ra, loc) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = kieu || "sine"; o.frequency.setValueAtTime(tan, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, (to || 0.2) * heSo), t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dai);
    let cuoi = g;
    if (loc) { const l = ac.createBiquadFilter(); l.type = "lowpass"; l.frequency.setValueAtTime(loc, t); l.Q.value = 3; g.connect(l); cuoi = l; }
    o.connect(g); cuoi.connect(ra || tong); o.start(t); o.stop(t + dai + 0.03);
    return o;
  }
  function on(t, dai, kieu, tanTu, tanDen, to, ra, q) {
    const s = ac.createBufferSource(); s.buffer = onTrang; s.loop = true;
    const l = ac.createBiquadFilter(); l.type = kieu; l.Q.value = q || 1;
    l.frequency.setValueAtTime(tanTu, t); if (tanDen) l.frequency.exponentialRampToValueAtTime(tanDen, t + dai);
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, to * heSo), t + Math.min(0.01, dai / 3));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dai);
    s.connect(l); l.connect(g); g.connect(ra || tong); s.start(t, Math.random() * 0.5); s.stop(t + dai + 0.02);
  }
  function trongCai(t, to, ra) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(Math.max(0.0002, to * heSo), t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.connect(g); g.connect(ra || tong); o.start(t); o.stop(t + 0.22);
  }
  const vo = (t, to, ra) => { on(t, 0.12, "highpass", 1600, 0, to, ra); not(220, t, 0.06, "triangle", to * 0.5, ra); };
  const hiHat = (t, to, ra) => on(t, 0.03, "highpass", 8000, 0, to, ra);

  // ---------------- tiếng tự tạo ----------------
  const TU = {
    hienDapAn() { const t = ac.currentTime; on(t, 0.35, "bandpass", 600, 5000, 0.22, tong, 2); [659.25, 783.99, 1046.5, 1318.5].forEach((h, i) => not(h, t + 0.12 + i * 0.045, 0.22, "triangle", 0.1)); },
    ticTac(i) { const t = ac.currentTime; const cao = (i || 0) % 2 === 0; not(cao ? 1760 : 1320, t, 0.04, "square", 0.07, tong, 6000); on(t, 0.025, "highpass", cao ? 4000 : 2500, 0, 0.18); },
    binhLuan() { const t = ac.currentTime; not(880, t, 0.12, "sine", 0.12); not(1174.66, t + 0.08, 0.18, "sine", 0.1); },
    sangCau() { const t = ac.currentTime; on(t, 0.28, "bandpass", 3000, 500, 0.22, tong, 1.4); not(523.25, t + 0.05, 0.12, "triangle", 0.08); }
  };

  // một tiếng theo cài đặt: tắt / file tải lên / tiếng tự tạo (+ độ to)
  function phat(k, ...thamSo) {
    if (!bat() || !TU[k]) return;
    const d = dongT(k);
    if (d.bat === false) return;
    const url = urlTep(d.file);
    if (url) {
      const chay = () => { if (!bat()) return; try { const a = new Audio(url); a.volume = Math.max(0, Math.min(1, so(d.amLuong, 1) * so(d.amTep, 1) * toChung())); const h = a.play(); if (h && h.catch) h.catch(() => {}); } catch (e) { /* bỏ qua */ } };
      const tre = so(d.tre, 0); if (tre > 0) setTimeout(chay, tre * 1000); else chay();
      if (d.kieu !== "chong") return;
    }
    mo(); if (!ac) return;
    heSo = Math.max(0, Math.min(2, so(d.amLuong, 1) * toChung()));
    try { TU[k](...thamSo); } catch (e) { /* im lặng */ } finally { heSo = 1; }
  }

  // ---------------- nhạc lúc đọc câu: nhanh, vui ----------------
  const BPM = 166;
  const BASS = [130.81, 174.61, 196, 130.81];                     // C F G C
  const HOP = [[523.25, 659.25, 783.99], [523.25, 698.46, 880], [587.33, 783.99, 987.77], [659.25, 783.99, 1046.5]];
  const GIAI = [0, 1, 2, 1, 2, 0, 2, 1];                           // nốt hợp âm theo 8 nửa phách
  const N = { chay: false, buoc: 0, o: 0, t: 0, hen: null, au: null, nho: false };
  function batNhac() {
    if (N.chay) return;
    const url = urlTep((ch.nhac || {}).doc);
    N.chay = true; N.buoc = 0; N.o = 0;
    if (url) {
      try { const a = new Audio(url); a.loop = true; a.volume = bat() ? amNhac() : 0; const h = a.play(); if (h && h.catch) h.catch(() => {}); N.au = a; } catch (e) { N.au = null; }
      return;
    }
    if ((ch.nhacNen || {}).tuTao === false) return;
    mo(); if (!ac) return;
    nhacG.gain.cancelScheduledValues(ac.currentTime); nhacG.gain.setValueAtTime(0, ac.currentTime);
    nhacG.gain.linearRampToValueAtTime(amNhac(), ac.currentTime + 0.25);
    N.t = ac.currentTime + 0.05;
    N.hen = setInterval(henLich, 25); henLich();
  }
  function henLich() { if (!N.chay || !ac) return; while (N.t < ac.currentTime + 0.12) { phatBuoc(N.t); N.t += 60 / BPM / 2; N.buoc = (N.buoc + 1) % 8; if (N.buoc === 0) N.o = (N.o + 1) % 4; } }
  function phatBuoc(t) {
    const b = N.buoc, g = nhacG;
    if (b % 2 === 0) trongCai(t, 0.8, g);
    if (b === 2 || b === 6) vo(t, 0.3, g);
    hiHat(t, b % 2 ? 0.2 : 0.1, g);
    const gb = BASS[N.o];
    not(b % 2 ? gb * 2 : gb, t, 0.14, "sawtooth", 0.2, g, 900);
    not(HOP[N.o][GIAI[b]] * (b >= 6 ? 2 : 1), t, 0.11, "square", 0.06, g, 4200);
    if (b === 0) HOP[N.o].forEach(x => not(x / 2, t, 0.6, "triangle", 0.035, g));
  }
  function nhoNhac(nho) {
    N.nho = !!nho;
    if (N.au) { N.au.volume = bat() ? amNhac() : 0; return; }
    if (N.chay && ac) nhacG.gain.setTargetAtTime(amNhac(), ac.currentTime, 0.08);
  }
  function dungNhac() {
    N.nho = false;
    if (!N.chay) return;
    N.chay = false; clearInterval(N.hen); N.hen = null;
    if (N.au) { const a = N.au; N.au = null; let i = 0; const iv = setInterval(() => { i++; try { a.volume = Math.max(0, a.volume * 0.6); } catch (e) { /* bỏ qua */ } if (i >= 5) { clearInterval(iv); a.pause(); } }, 60); return; }
    if (!ac) return;
    const t = ac.currentTime;
    nhacG.gain.cancelScheduledValues(t); nhacG.gain.setValueAtTime(nhacG.gain.value, t); nhacG.gain.linearRampToValueAtTime(0, t + 0.25);
    const cu = nhacG; nhacG = ac.createGain(); nhacG.gain.value = 0; nhacG.connect(tong);
    setTimeout(() => { try { cu.disconnect(); } catch (e) { /* bỏ qua */ } }, 500);
  }

  // ---------------- tích tắc lúc chờ ----------------
  const TT = { chay: false, hen: null, i: 0, au: null, cho: null };
  function batTicTac() {
    dungTicTac();
    const d = dongT("ticTac");
    if (!bat() || d.bat === false) return;
    TT.chay = true;
    const sau = nhip().ticTacSau;
    TT.cho = setTimeout(() => {
      TT.cho = null; if (!TT.chay) return;
      const url = urlTep(d.file);
      if (url) {
        try { const a = new Audio(url); a.loop = true; a.volume = bat() ? amTicTac() : 0; const h = a.play(); if (h && h.catch) h.catch(() => {}); TT.au = a; } catch (e) { TT.au = null; }
        if (d.kieu !== "chong") return;
      }
      TT.i = 0;
      TT.hen = setInterval(() => { if (!TT.chay) return; TT.i++; tic(); }, 500); tic();
    }, sau * 1000);
  }
  function tic() { // tiếng tự tạo theo độ to của nội dung ticTac (không qua file)
    if (!bat()) return; mo(); if (!ac) return;
    const d = dongT("ticTac"); heSo = Math.max(0, Math.min(2, so(d.amLuong, 1) * toChung()));
    try { TU.ticTac(TT.i); } catch (e) { /* im lặng */ } finally { heSo = 1; }
  }
  function dungTicTac() {
    TT.chay = false; clearTimeout(TT.cho); TT.cho = null; clearInterval(TT.hen); TT.hen = null;
    if (TT.au) { try { TT.au.pause(); } catch (e) { /* bỏ qua */ } TT.au = null; }
  }

  // ---------------- Quản trị: nghe thử ----------------
  let henThu = null;
  function dungThu() { if (henThu) { clearTimeout(henThu); henThu = null; } dungNhac(); dungTicTac(); }
  function thuNhac() { dungThu(); mo(); batNhac(); henThu = setTimeout(dungThu, 10000); }
  function thuTicTac() { dungThu(); mo(); const n = ch.nhip; ch.nhip = Object.assign({}, n, { ticTacSau: 0 }); batTicTac(); ch.nhip = n; henThu = setTimeout(dungThu, 5000); }

  try {
    goc.document.addEventListener("visibilitychange", () => {
      if (goc.document.hidden) { if (ac) try { ac.suspend(); } catch (e) { /* bỏ qua */ } if (N.au) N.au.pause(); if (TT.au) TT.au.pause(); }
      else { if (ac && (N.chay || TT.chay)) try { ac.resume(); } catch (e) { /* bỏ qua */ } [N.au, TT.au].forEach(a => { if (a) { const h = a.play(); if (h && h.catch) h.catch(() => {}); } }); }
    });
  } catch (e) { /* bỏ qua */ }

  goc.KC_TM_AM = {
    taiCauHinh, datCauHinh, cauHinh: () => ch, nhip, mo, batNhac, nhoNhac, dungNhac, batTicTac, dungTicTac, phat,
    thu: k => { dungThu(); mo(); if (k === "ticTac") thuTicTac(); else phat(k); }, thuNhac, thuTicTac, dungThu,
    dangNhac: () => N.chay, dangTicTac: () => TT.chay, bat, capNhatBat, KHOA: Object.keys(TU)
  };
})(typeof window !== "undefined" ? window : globalThis);
// 24/11/2026 - BƯỚC: KC_03C4b (tạo mới: nhạc đọc câu, tích tắc chờ trả lời, tiếng hiện đáp án / bình luận / sang câu)
