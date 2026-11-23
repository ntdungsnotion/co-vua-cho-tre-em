/* ================================================================
   FILE: tt_tri_thuc/tt_toc_do_am.js
   CHỨC NĂNG: ÂM THANH HỒI HỘP của ⚡ Tốc độ (KC_TDO_AM). Toàn bộ tự tạo bằng WebAudio, không tải file nào.
              - Nhạc nền nhịp nhanh (trống + bass + hi-hat) chạy suốt lượt; càng gần hết giờ càng DỒN DẬP:
                còn <= 20 giây nhanh hơn + thêm trống con; <= 10 giây nhanh nữa + giai điệu dồn + tiếng tim đập;
                <= 5 giây nhanh nhất, lên giọng, hi-hat dày + tích tắc to từng giây.
              - Đếm ngược 3-2-1 có tiếng "vút" dâng lên, "Bắt đầu!" nổ hợp âm sáng.
              - Đúng liên tiếp (combo): tiếng đúng cao dần từng nấc; 3 / 5 / 7 câu liền thêm chuỗi lấp lánh.
              - Sai: tiếng "bùm bụp" trầm nhẹ (không doạ); Bỏ qua: tiếng gió "vút".
              - Hết giờ: còi báo + nhạc tắt kiểu băng chùng. Chờ chấm: trống cuộn dồn dập. Kết quả: kèn chiến thắng
                lớn / vừa / nhẹ theo số câu đúng, kèm chũm choẹ.
              Tôn trọng nút tắt tiếng chung của app (KC_AM_THANH.dangBat / datBat). Ẩn tab thì tạm dừng.
   DÙNG:      KC_TDO_AM.mo() (gọi ngay trong cú chạm để máy cho phát), batNhac(), muc(giayConLai), dungNhac(tatKieuBang),
              dem(1|2|3|0), dung(combo), sai(), boQua(), tich(giay), hetGio(), trongCuon(), ketQua(soDung, soCau), bat(), doiBat()
   SỐ MẶC ĐỊNH: KC_TDO_AM.CH (âm lượng, nhịp mỗi mức, mốc giây). KC_09 sau này có thể nạp đè từ Quản trị.
   PHỤ THUỘC: chung/am_thanh.js (chỉ để đọc / đổi nút tắt tiếng chung; thiếu thì vẫn chạy).
   BƯỚC: KC_03C5b (âm thanh hồi hộp)
   NGÀY: 24/11/2026
   ================================================================ */
(function (goc) {
  "use strict";
  const CH = {
    to: 0.9,                 // âm lượng tổng
    nhac: 0.32,              // âm lượng nhạc nền (so với tiếng hiệu ứng)
    nhip: [128, 140, 154, 168], // nhịp (BPM) mức 0..3
    moc: [20, 10, 5],        // giây còn lại để lên mức 1, 2, 3
    lenGiong: [0, 0, 2, 3]   // nâng giọng (nửa cung) mỗi mức
  };
  const AM = () => goc.KC_AM_THANH || null;
  const bat = () => { const a = AM(); return !a || !a.dangBat || a.dangBat(); };

  let ac = null, tong = null, nhacG = null, onTrang = null;
  function may() {
    if (ac) return ac;
    try {
      const AC = goc.AudioContext || goc.webkitAudioContext; if (!AC) return null;
      ac = new AC();
      tong = ac.createGain(); tong.gain.value = bat() ? CH.to : 0; tong.connect(ac.destination);
      nhacG = ac.createGain(); nhacG.gain.value = CH.nhac; nhacG.connect(tong);
      const n = ac.createBuffer(1, ac.sampleRate, ac.sampleRate), d = n.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      onTrang = n;
    } catch (e) { ac = null; }
    return ac;
  }
  function mo() {
    const a = may(); if (!a) return;
    try { if (a.state === "suspended") a.resume(); } catch (e) { /* bỏ qua */ }
    capNhatBat();
  }
  function capNhatBat() { if (tong && ac) tong.gain.setTargetAtTime(bat() ? CH.to : 0, ac.currentTime, 0.03); }
  const f = (goc0, nc) => goc0 * Math.pow(2, nc / 12); // nâng tần số nc nửa cung

  // ---------- khối phát cơ bản ----------
  function not(tan, t, dai, kieu, to, ra, loc) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = kieu || "sine"; o.frequency.setValueAtTime(tan, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, to || 0.2), t + 0.008);
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
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(to, t + Math.min(0.01, dai / 3));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dai);
    s.connect(l); l.connect(g); g.connect(ra || tong); s.start(t, Math.random() * 0.5); s.stop(t + dai + 0.02);
  }
  function trongCai(t, to, ra) { // kick
    const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    g.gain.setValueAtTime(to, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g); g.connect(ra || tong); o.start(t); o.stop(t + 0.25);
  }
  const trongCon = (t, to, ra) => { on(t, 0.13, "highpass", 1400, 0, to, ra); not(190, t, 0.08, "triangle", to * 0.6, ra); };
  const hiHat = (t, to, ra) => on(t, 0.035, "highpass", 7500, 0, to, ra);

  // ---------- nhạc nền: bộ hẹn giờ nhìn trước ----------
  // hợp âm La thứ - Fa - Đô - Sol (gốc bass), 8 phách móc / ô nhịp
  const BASS = [110, 87.31, 130.81, 98];
  const GIAI = [[440, 523.25, 659.25], [349.23, 440, 523.25], [392, 523.25, 659.25], [392, 493.88, 587.33]];
  const N = { chay: false, buoc: 0, o: 0, t: 0, muc: 0, mucCho: 0, hen: null, lenGiong: 0 };
  function batNhac() {
    mo(); if (!ac || N.chay) return;
    N.chay = true; N.buoc = 0; N.o = 0; N.muc = 0; N.mucCho = 0; N.lenGiong = 0;
    nhacG.gain.cancelScheduledValues(ac.currentTime); nhacG.gain.setValueAtTime(CH.nhac, ac.currentTime);
    N.t = ac.currentTime + 0.06;
    N.hen = setInterval(henLich, 25); henLich();
  }
  function henLich() {
    if (!N.chay || !ac) return;
    while (N.t < ac.currentTime + 0.12) { phatBuoc(N.t); tienBuoc(); }
  }
  function tienBuoc() {
    N.t += 60 / CH.nhip[N.muc] / 2; // nốt móc đơn
    N.buoc = (N.buoc + 1) % 8;
    if (N.buoc === 0) { N.o = (N.o + 1) % 4; N.muc = N.mucCho; N.lenGiong = CH.lenGiong[N.muc]; }
  }
  function phatBuoc(t) {
    const b = N.buoc, m = N.muc, g = nhacG, ng = N.lenGiong;
    // trống cái mỗi phách (mức 2+: tim đập "thịch-thịch" ở phách 1 và 3)
    if (b % 2 === 0) trongCai(t, 0.9, g);
    if (m >= 2 && (b === 0 || b === 4)) trongCai(t + 60 / CH.nhip[m] / 4, 0.55, g);
    // hi-hat: móc lẻ; mức 3 dày gấp đôi
    if (b % 2 === 1) hiHat(t, 0.22, g);
    if (m >= 3) hiHat(t + 60 / CH.nhip[m] / 4, 0.14, g);
    // trống con phách 2 và 4 từ mức 1
    if (m >= 1 && (b === 2 || b === 6)) trongCon(t, 0.32, g);
    // bass móc đơn, nhảy quãng tám ở móc lẻ
    const gb = f(BASS[N.o], ng);
    not(b % 2 ? gb * 2 : gb, t, 0.16, "sawtooth", 0.22, g, 500 + m * 350);
    // giai điệu dồn từ mức 2: rải hợp âm lên dần
    if (m >= 2) { const h = GIAI[N.o]; not(f(h[b % 3], ng) * (b >= 4 ? 2 : 1), t, 0.1, "square", 0.07, g, 3200); }
    else if (b === 0) { GIAI[N.o].forEach(x => not(f(x, ng), t, 0.5, "triangle", 0.05, g)); } // đệm nhẹ đầu ô nhịp
  }
  function muc(con) {
    if (!N.chay) return;
    const m = con <= CH.moc[2] ? 3 : con <= CH.moc[1] ? 2 : con <= CH.moc[0] ? 1 : 0;
    if (m !== N.mucCho) {
      N.mucCho = m;
      if (m > N.muc && ac) { // lên mức: tiếng "vút" báo hiệu ngay, nhịp đổi từ ô nhịp sau
        const t = ac.currentTime; on(t, 0.6, "bandpass", 400, 3000, 0.25, tong, 2);
        // từ mức 3 đổi ngay để dồn dập tức thì
        if (m === 3) { N.muc = 3; N.lenGiong = CH.lenGiong[3]; }
      }
    }
  }
  function dungNhac(kieuBang) {
    if (!N.chay) return;
    N.chay = false; clearInterval(N.hen); N.hen = null;
    if (!ac) return;
    const t = ac.currentTime;
    nhacG.gain.cancelScheduledValues(t); nhacG.gain.setValueAtTime(nhacG.gain.value, t);
    nhacG.gain.linearRampToValueAtTime(0, t + (kieuBang ? 0.7 : 0.15));
    if (kieuBang) not(110, t, 0.7, "sawtooth", 0.12, tong, 600).frequency.exponentialRampToValueAtTime(30, t + 0.7); // băng chùng
    const ra = nhacG; // nối nhạc mới vào nút âm lượng mới để nốt cũ đã hẹn tắt hẳn
    nhacG = ac.createGain(); nhacG.gain.value = CH.nhac; nhacG.connect(tong);
    setTimeout(() => { try { ra.disconnect(); } catch (e) { /* bỏ qua */ } }, 900);
  }

  // ---------- tiếng hiệu ứng ----------
  const lam = fn => function () { if (!bat()) return; mo(); if (!ac) return; try { fn.apply(null, arguments); } catch (e) { /* im lặng */ } };
  const KC = {
    CH, mo, batNhac, muc, dungNhac,
    bat, doiBat() { const a = AM(); if (a && a.datBat) a.datBat(!bat()); mo(); capNhatBat(); return bat(); },
    // 3, 2, 1 rồi 0 = "Bắt đầu!"
    dem: lam(x => {
      const t = ac.currentTime;
      if (x > 0) {
        not(x === 1 ? 660 : 523.25, t, 0.25, "square", 0.12, tong, 2400); trongCai(t, 0.7);
        if (x === 3) on(t, 2.1, "bandpass", 300, 4000, 0.18, tong, 3); // dâng lên suốt 3-2-1
      } else {
        [523.25, 659.25, 783.99, 1046.5].forEach((h, i) => not(h, t + i * 0.012, 0.6, "sawtooth", 0.08, tong, 5000));
        trongCai(t, 1); on(t, 0.5, "highpass", 5000, 0, 0.25);
      }
    }),
    dung: lam(combo => {
      const t = ac.currentTime, n = Math.min(12, Math.max(0, (combo || 1) - 1));
      not(f(1046.5, n), t, 0.16, "square", 0.08, tong, 6000); not(f(1567.98, n), t + 0.06, 0.28, "sine", 0.2);
      if (combo >= 3 && combo % 2 === 1) [0, 4, 7, 12].forEach((s, i) => not(f(f(1046.5, n), s), t + 0.12 + i * 0.05, 0.18, "triangle", 0.1));
    }),
    sai: lam(() => {
      const t = ac.currentTime;
      not(196, t, 0.18, "square", 0.08, tong, 900); not(146.83, t + 0.12, 0.32, "square", 0.08, tong, 700);
    }),
    boQua: lam(() => { on(ac.currentTime, 0.32, "bandpass", 2500, 300, 0.3, tong, 1.5); }),
    tich: lam(giay => { // tích tắc từng giây khi còn <= 10 giây
      const t = ac.currentTime, to = giay <= 5 ? 0.3 : 0.14;
      not(giay % 2 ? 2093 : 1568, t, 0.05, "square", to * 0.5, tong, 8000); on(t, 0.03, "highpass", 3000, 0, to);
    }),
    hetGio: lam(() => {
      dungNhac(true);
      const t = ac.currentTime;
      for (let i = 0; i < 4; i++) not(i % 2 ? 659.25 : 880, t + i * 0.16, 0.15, "square", 0.12, tong, 3000);
    }),
    trongCuon: lam(() => { // ~1,3 giây trống cuộn dồn dập
      const t = ac.currentTime;
      for (let i = 0, x = 0; x < 1.3; i++) { const to = 0.06 + 0.24 * (x / 1.3); on(t + x, 0.06, "bandpass", 1800, 0, to, tong, 0.8); x += Math.max(0.035, 0.09 - i * 0.004); }
    }),
    // soDung / soCau -> kèn lớn (đủ), vừa (>= nửa), nhẹ
    ketQua: lam((soDung, soCau) => {
      const t = ac.currentTime + 0.02, ty = soCau ? soDung / soCau : 0;
      on(t, ty >= 0.5 ? 1.4 : 0.6, "highpass", 6000, 0, ty >= 0.5 ? 0.3 : 0.12); trongCai(t, 1);
      const kenh = ty >= 1 ? [[523.25, 0, 0.14], [523.25, 0.14, 0.14], [523.25, 0.28, 0.14], [659.25, 0.42, 0.3], [783.99, 0.72, 0.18], [1046.5, 0.9, 0.9]]
        : ty >= 0.5 ? [[523.25, 0, 0.16], [659.25, 0.16, 0.16], [783.99, 0.32, 0.6]]
          : [[392, 0, 0.2], [523.25, 0.2, 0.5]];
      kenh.forEach(x => { not(x[0], t + x[1], x[2] + 0.12, "sawtooth", 0.09, tong, 3500); not(x[0] / 2, t + x[1], x[2] + 0.12, "square", 0.05, tong, 1500); });
      if (ty >= 1) [1046.5, 1318.5, 1568, 2093].forEach((h, i) => not(h, t + 1 + i * 0.07, 0.4, "sine", 0.1));
    })
  };

  // ẩn tab: tạm dừng hẳn máy âm (đỡ pin, đỡ phát lạc); hiện lại thì chạy tiếp
  try {
    goc.document.addEventListener("visibilitychange", () => {
      if (!ac) return;
      try { if (goc.document.hidden) ac.suspend(); else if (N.chay) ac.resume(); } catch (e) { /* bỏ qua */ }
    });
  } catch (e) { /* bỏ qua */ }

  goc.KC_TDO_AM = KC;
})(typeof window !== "undefined" ? window : globalThis);
// 24/11/2026 - BƯỚC: KC_03C5b (tạo mới: âm thanh hồi hộp cho ⚡ Tốc độ)
