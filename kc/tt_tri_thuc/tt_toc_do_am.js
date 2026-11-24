/* ================================================================
   FILE: tt_tri_thuc/tt_toc_do_am.js
   CHỨC NĂNG: ÂM THANH RIÊNG của ⚡ Tốc độ (KC_TDO_AM). Mọi tiếng đều CHỈNH Ở QUẢN TRỊ (KC_03C5c, người dùng 24/11/2026:
              "toàn bộ âm thanh đặc thù đưa vào quản trị game này"): Quản trị › 🎯 Thử Thách › ⚡ Tốc độ › 🔊 Âm thanh.
              Tiếng ĐÚNG / SAI / 💎 KHÔNG ở đây: game gọi module chung KC_AM_THANH (chỉnh ở 🎵 Âm thanh chung).
              - Nhạc nền: file tải lên (lặp) hoặc nhạc trống tự tạo; nhanh dần khi gần hết giờ (3 nấc theo hoiHop).
              - Tiếng: đếm ngược, bắt đầu, bé nghĩ lâu, gần hết giờ (tích tắc), nhạc lên nhịp, đúng liên tiếp, bỏ qua,
                hết giờ, trống cuộn chờ chấm, kèn kết quả (đúng hết / từ nửa / dưới nửa). Mỗi tiếng: có kêu, độ to,
                file tải lên (thay / chồng tiếng tự tạo), trễ.
              Cài đặt: mặc định du_lieu/cau_hinh_am_thanh_toc_do.json < phần quản trị sửa (kc_dt_cau_hinh_qt ›
              cau_hinh_am_thanh_toc_do). File tải lên đổi ra địa chỉ qua KC_AM_THANH.urlTep.
              Tôn trọng nút tắt tiếng chung (KC_AM_THANH.dangBat / datBat). Ẩn tab thì tạm dừng.
   DÙNG:      taiCauHinh(), datCauHinh(c, urlFn) (Quản trị nghe thử), cauHinh(), hoiHop(),
              mo() (gọi trong cú chạm), batNhac(), muc(giayConLai), dungNhac(kieuBang),
              phat(khoa, ...thamSo) (demNguoc(3|2|1), ganHetGio(giay), dungLienTiep(n)...), thu(khoa), thuNhac(),
              bat(), doiBat()
   PHỤ THUỘC: chung/am_thanh.js (nút tắt tiếng chung, địa chỉ file kho; thiếu thì vẫn chạy tiếng tự tạo).
   BƯỚC: KC_03C5c (âm thanh riêng Tốc độ chỉnh ở Quản trị). Trước: KC_03C5b (bản tự tạo cố định).
   NGÀY: 24/11/2026
   ================================================================ */
(function (goc) {
  "use strict";
  const DONG_MD = { bat: true, amLuong: 1, file: "", amTep: 1, kieu: "thay", tre: 0 };
  const MD = {
    amLuong: { tieng: 1, nhac: 0.35 }, nhac: { nen: "" }, nhacNen: { tuTao: true, nhanhDan: true },
    hoiHop: { nghiLauGiay: 6, nhacLaiGiay: 4, nhanhDanGiay: 20, ganHetGioGiay: 10 }, tieng: {}
  };
  const NHIP = [128, 140, 154, 168], LEN_GIONG = [0, 0, 2, 3], TOC_TEP = [1, 1.05, 1.1, 1.16];
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
  const URL_MD = (() => { try { const s = goc.document && goc.document.currentScript; return new URL("du_lieu/cau_hinh_am_thanh_toc_do.json", s && s.src ? s.src : goc.location.href).href; } catch (e) { return null; } })();
  function timClient() {
    for (const w of [goc, goc.parent, goc.top]) { try { const c = w && (w.kcSupabaseClient || w.supabaseClient); if (c && typeof c.rpc === "function") return c; } catch (e) { /* khung khác */ } }
    return null;
  }
  function taiCauHinh(moi) {
    if (hoa && !moi) return hoa;
    const md = URL_MD ? fetch(URL_MD, { cache: "no-cache" }).then(r => r.ok ? r.json() : {}).catch(() => ({})) : Promise.resolve({});
    const c = timClient();
    const sua = c ? Promise.resolve(c.rpc("kc_dt_cau_hinh_qt")).then(k => { const d = k && !k.error ? k.data : null; return d && d.thanhCong && laObj(d.sua) ? d.sua.cau_hinh_am_thanh_toc_do || null : null; }).catch(() => null) : Promise.resolve(null);
    const kho = AM() && AM().taiCauHinh ? Promise.resolve(AM().taiCauHinh()).catch(() => null) : Promise.resolve(null); // địa chỉ file tải lên
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
  const hoiHop = () => {
    const h = ch.hoiHop || {};
    return { nghiLauGiay: so(h.nghiLauGiay, 6), nhacLaiGiay: so(h.nhacLaiGiay, 4), nhanhDanGiay: so(h.nhanhDanGiay, 20), ganHetGioGiay: so(h.ganHetGioGiay, 10) };
  };

  // ---------------- máy âm ----------------
  let ac = null, tong = null, nhacG = null, onTrang = null, heSo = 1;
  function may() {
    if (ac) return ac;
    try {
      const AC = goc.AudioContext || goc.webkitAudioContext; if (!AC) return null;
      ac = new AC();
      tong = ac.createGain(); tong.gain.value = bat() ? 1 : 0; tong.connect(ac.destination);
      nhacG = ac.createGain(); nhacG.connect(tong);
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
  }
  const f = (t0, nc) => t0 * Math.pow(2, nc / 12);
  const amNhac = () => Math.max(0, Math.min(1, so((ch.amLuong || {}).nhac, 0.35)));

  function not(tan, t, dai, kieu, to, ra, loc) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = kieu || "sine"; o.frequency.setValueAtTime(tan, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, (to || 0.2) * heSo), t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dai);
    let cuoi = g;
    if (loc) { const l = ac.createBiquadFilter(); l.type = "lowpass"; l.frequency.setValueAtTime(loc, t); l.Q.value = 4; g.connect(l); cuoi = l; }
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
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    g.gain.setValueAtTime(Math.max(0.0002, to * heSo), t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g); g.connect(ra || tong); o.start(t); o.stop(t + 0.25);
  }
  const trongCon = (t, to, ra) => { on(t, 0.13, "highpass", 1400, 0, to, ra); not(190, t, 0.08, "triangle", to * 0.6, ra); };
  const hiHat = (t, to, ra) => on(t, 0.035, "highpass", 7500, 0, to, ra);
  function ken(t, ds) { ds.forEach(x => { not(x[0], t + x[1], x[2] + 0.12, "sawtooth", 0.09, tong, 3500); not(x[0] / 2, t + x[1], x[2] + 0.12, "square", 0.05, tong, 1500); }); }

  // ---------------- tiếng tự tạo (mặc định khi chưa có file) ----------------
  const TU = {
    demNguoc(x) { const t = ac.currentTime; not(x === 1 ? 660 : 523.25, t, 0.25, "square", 0.12, tong, 2400); trongCai(t, 0.7); if (x === 3) on(t, 2.1, "bandpass", 300, 4000, 0.18, tong, 3); },
    batDau() { const t = ac.currentTime; [523.25, 659.25, 783.99, 1046.5].forEach((h, i) => not(h, t + i * 0.012, 0.6, "sawtooth", 0.08, tong, 5000)); trongCai(t, 1); on(t, 0.5, "highpass", 5000, 0, 0.25); },
    nghiLau() { const t = ac.currentTime; not(587.33, t, 0.3, "triangle", 0.16); not(698.46, t + 0.18, 0.3, "triangle", 0.14); not(880, t + 0.36, 0.45, "sine", 0.12); }, // "hửm?" lên giọng
    ganHetGio(giay) { const t = ac.currentTime, to = giay <= 5 ? 0.3 : 0.15; not(giay % 2 ? 2093 : 1568, t, 0.05, "square", to * 0.5, tong, 8000); on(t, 0.03, "highpass", 3000, 0, to); if (giay <= 5) trongCai(t, 0.5); },
    lenNhip() { on(ac.currentTime, 0.6, "bandpass", 400, 3000, 0.25, tong, 2); },
    dungLienTiep(n) { const t = ac.currentTime + 0.1, b = f(1046.5, Math.min(12, Math.max(0, (n || 3) - 3) * 2)); [0, 4, 7, 12].forEach((s, i) => not(f(b, s), t + i * 0.05, 0.18, "triangle", 0.11)); },
    boQua() { on(ac.currentTime, 0.32, "bandpass", 2500, 300, 0.3, tong, 1.5); },
    hetGio() { const t = ac.currentTime; for (let i = 0; i < 4; i++) not(i % 2 ? 659.25 : 880, t + i * 0.16, 0.15, "square", 0.12, tong, 3000); },
    trongCuon() { const t = ac.currentTime; for (let i = 0, x = 0; x < 1.3; i++) { on(t + x, 0.06, "bandpass", 1800, 0, 0.06 + 0.24 * (x / 1.3), tong, 0.8); x += Math.max(0.035, 0.09 - i * 0.004); } },
    kenGioi() {
      const t = ac.currentTime + 0.02; on(t, 1.4, "highpass", 6000, 0, 0.3); trongCai(t, 1);
      ken(t, [[523.25, 0, 0.14], [523.25, 0.14, 0.14], [523.25, 0.28, 0.14], [659.25, 0.42, 0.3], [783.99, 0.72, 0.18], [1046.5, 0.9, 0.9]]);
      [1046.5, 1318.5, 1568, 2093].forEach((h, i) => not(h, t + 1 + i * 0.07, 0.4, "sine", 0.1));
    },
    kenKha() { const t = ac.currentTime + 0.02; on(t, 1.4, "highpass", 6000, 0, 0.3); trongCai(t, 1); ken(t, [[523.25, 0, 0.16], [659.25, 0.16, 0.16], [783.99, 0.32, 0.6]]); },
    kenNhe() { const t = ac.currentTime + 0.02; on(t, 0.6, "highpass", 6000, 0, 0.12); trongCai(t, 0.8); ken(t, [[392, 0, 0.2], [523.25, 0.2, 0.5]]); }
  };
  const THU = { demNguoc: [3], ganHetGio: [3], dungLienTiep: [5] }; // tham số khi Quản trị bấm ▶ nghe thử

  // một tiếng theo cài đặt: tắt / file tải lên / tiếng tự tạo (+ độ to)
  function phat(k, ...thamSo) {
    if (!bat() || !TU[k]) return;
    const d = Object.assign({}, DONG_MD, (ch.tieng || {})[k]);
    if (d.bat === false) return;
    const toChung = Math.max(0, Math.min(2, so((ch.amLuong || {}).tieng, 1)));
    const url = urlTep(d.file);
    if (url) {
      const chay = () => { if (!bat()) return; try { const a = new Audio(url); a.volume = Math.max(0, Math.min(1, so(d.amLuong, 1) * so(d.amTep, 1) * toChung)); const h = a.play(); if (h && h.catch) h.catch(() => {}); } catch (e) { /* bỏ qua */ } };
      const tre = so(d.tre, 0); if (tre > 0) setTimeout(chay, tre * 1000); else chay();
      if (d.kieu !== "chong") return;
    }
    mo(); if (!ac) return;
    heSo = Math.max(0, Math.min(2, so(d.amLuong, 1) * toChung));
    try { TU[k](...thamSo); } catch (e) { /* im lặng */ } finally { heSo = 1; }
  }

  // ---------------- nhạc nền ----------------
  const BASS = [110, 87.31, 130.81, 98];
  const GIAI = [[440, 523.25, 659.25], [349.23, 440, 523.25], [392, 523.25, 659.25], [392, 493.88, 587.33]];
  const N = { chay: false, buoc: 0, o: 0, t: 0, muc: 0, mucCho: 0, hen: null, lenGiong: 0, au: null };
  function batNhac() {
    if (N.chay) return;
    const nn = ch.nhacNen || {}, url = urlTep((ch.nhac || {}).nen);
    N.chay = true; N.buoc = 0; N.o = 0; N.muc = 0; N.mucCho = 0; N.lenGiong = 0;
    if (url) {
      try { const a = new Audio(url); a.loop = true; a.volume = bat() ? amNhac() : 0; a.preservesPitch = true; const h = a.play(); if (h && h.catch) h.catch(() => {}); N.au = a; } catch (e) { N.au = null; }
      return;
    }
    if (nn.tuTao === false) return;
    mo(); if (!ac) return;
    nhacG.gain.cancelScheduledValues(ac.currentTime); nhacG.gain.setValueAtTime(amNhac(), ac.currentTime);
    N.t = ac.currentTime + 0.06;
    N.hen = setInterval(henLich, 25); henLich();
  }
  function henLich() { if (!N.chay || !ac) return; while (N.t < ac.currentTime + 0.12) { phatBuoc(N.t); tienBuoc(); } }
  function tienBuoc() {
    N.t += 60 / NHIP[N.muc] / 2;
    N.buoc = (N.buoc + 1) % 8;
    if (N.buoc === 0) { N.o = (N.o + 1) % 4; N.muc = N.mucCho; N.lenGiong = LEN_GIONG[N.muc]; }
  }
  function phatBuoc(t) {
    const b = N.buoc, m = N.muc, g = nhacG, ng = N.lenGiong, nua = 60 / NHIP[m] / 4;
    if (b % 2 === 0) trongCai(t, 0.9, g);
    if (m >= 2 && (b === 0 || b === 4)) trongCai(t + nua, 0.55, g); // tim đập "thịch-thịch"
    if (b % 2 === 1) hiHat(t, 0.22, g);
    if (m >= 3) hiHat(t + nua, 0.14, g);
    if (m >= 1 && (b === 2 || b === 6)) trongCon(t, 0.32, g);
    const gb = f(BASS[N.o], ng);
    not(b % 2 ? gb * 2 : gb, t, 0.16, "sawtooth", 0.22, g, 500 + m * 350);
    if (m >= 2) { const h = GIAI[N.o]; not(f(h[b % 3], ng) * (b >= 4 ? 2 : 1), t, 0.1, "square", 0.07, g, 3200); }
    else if (b === 0) GIAI[N.o].forEach(x => not(f(x, ng), t, 0.5, "triangle", 0.05, g));
  }
  function muc(con) {
    if (!N.chay || (ch.nhacNen || {}).nhanhDan === false) return;
    const h = hoiHop(), m = con <= h.ganHetGioGiay / 2 ? 3 : con <= h.ganHetGioGiay ? 2 : con <= h.nhanhDanGiay ? 1 : 0;
    if (m <= N.mucCho) return;
    N.mucCho = m;
    phat("lenNhip");
    if (N.au) { try { N.au.playbackRate = TOC_TEP[m]; } catch (e) { /* bỏ qua */ } }
    if (m === 3) { N.muc = 3; N.lenGiong = LEN_GIONG[3]; } // nấc cuối đổi ngay, không chờ hết ô nhịp
  }
  function dungNhac(kieuBang) {
    if (!N.chay) return;
    N.chay = false; clearInterval(N.hen); N.hen = null;
    if (N.au) {
      const a = N.au; N.au = null;
      if (kieuBang) { let i = 0; const iv = setInterval(() => { i++; try { a.volume = Math.max(0, a.volume * 0.7); a.playbackRate = Math.max(0.5, a.playbackRate - 0.08); } catch (e) { /* bỏ qua */ } if (i >= 8) { clearInterval(iv); a.pause(); } }, 80); }
      else a.pause();
      return;
    }
    if (!ac) return;
    const t = ac.currentTime;
    nhacG.gain.cancelScheduledValues(t); nhacG.gain.setValueAtTime(nhacG.gain.value, t);
    nhacG.gain.linearRampToValueAtTime(0, t + (kieuBang ? 0.7 : 0.15));
    if (kieuBang && bat()) not(110, t, 0.7, "sawtooth", 0.12, tong, 600).frequency.exponentialRampToValueAtTime(30, t + 0.7); // băng chùng
    const cu = nhacG; nhacG = ac.createGain(); nhacG.connect(tong);
    setTimeout(() => { try { cu.disconnect(); } catch (e) { /* bỏ qua */ } }, 900);
  }
  // Quản trị: nghe nhạc nền đi qua cả 3 nấc (giả lập còn 24 -> 0 giây trong ~12 giây)
  let henThu = null;
  function thuNhac() {
    dungThu(); mo(); batNhac();
    let con = Math.max(24, hoiHop().nhanhDanGiay + 4);
    henThu = setInterval(() => { con -= 2; muc(con); if (con <= 0) dungThu(true); }, 1000);
  }
  function dungThu(bang) { if (henThu) { clearInterval(henThu); henThu = null; } dungNhac(!!bang); }

  try {
    goc.document.addEventListener("visibilitychange", () => {
      if (goc.document.hidden) { if (ac) try { ac.suspend(); } catch (e) { /* bỏ qua */ } if (N.au) N.au.pause(); }
      else if (N.chay) { if (ac) try { ac.resume(); } catch (e) { /* bỏ qua */ } if (N.au) { const h = N.au.play(); if (h && h.catch) h.catch(() => {}); } }
    });
  } catch (e) { /* bỏ qua */ }

  goc.KC_TDO_AM = {
    taiCauHinh, datCauHinh, cauHinh: () => ch, hoiHop, mo, batNhac, muc, dungNhac, phat,
    thu: k => { mo(); phat(k, ...(THU[k] || [])); }, thuNhac, dungThu, dangNhac: () => N.chay,
    bat, doiBat() { const a = AM(); if (a && a.datBat) a.datBat(!bat()); mo(); capNhatBat(); return bat(); },
    capNhatBat, KHOA: Object.keys(TU)
  };
})(typeof window !== "undefined" ? window : globalThis);
// 24/11/2026 - BƯỚC: KC_03C5b (tạo mới: âm thanh hồi hộp cho ⚡ Tốc độ)
// 24/11/2026 - BƯỚC: KC_03C5c (mọi tiếng chỉnh ở Quản trị: cài đặt + file tải lên; đúng / sai dùng âm thanh chung; nghĩ lâu)
