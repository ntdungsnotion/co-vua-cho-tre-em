/* ================================================================
   FILE: san_tu/st_am_thanh.js
   CHỨC NĂNG: ÂM THANH của game Săn Từ (AudioManager), 3 nhóm bật/tắt RIÊNG:
                1. nhac    - nhạc nền phiêu lưu (tự soạn, phát bằng Web Audio, không
                             cần file; gần lâu đài thì thêm lớp nhạc cao trào, tăng dần)
                2. giong   - phát âm từ tiếng Anh (giọng đọc có sẵn trong máy, chạy
                             được khi mất mạng; có file am_thanh/<từ>.mp3 thì ưu tiên file)
                3. hieuUng - tiếng đúng / sai / nhảy / phép / kim cương... (tự tạo bằng
                             Web Audio, không dùng tài nguyên có bản quyền)
              Thiếu Web Audio hoặc giọng đọc: game vẫn chạy bình thường, chỉ im lặng.
   BƯỚC: TC_00B
   NGÀY: 15/10/2026
   ================================================================ */
(function (goc) {
  "use strict";
  const ST = goc.ST = goc.ST || {};

  // Từ nào có file giọng người thật trong kc/am_thanh/<từ>.mp3 thì ghi vào đây
  // (để trống: dùng giọng đọc của máy, không thử tải file -> không chậm, không lỗi 404).
  ST.FILE_GIONG = [];

  const AM_LUONG = { nhac: 0.16, hieuUng: 0.5, nhacKhiDoc: 0.05 };
  const nhipBuoc = 60 / 132 / 4; // một nốt móc kép ở nhịp 132

  // ----- Nhạc nền tự soạn: hòa âm C - G - Am - F, mỗi ô nhịp 16 bước (null = nghỉ) -----
  const GIAI_DIEU = [
    72, null, 76, null, 79, null, 76, null, 77, null, 76, null, 74, null, 72, null,
    71, null, 74, null, 79, null, 74, null, 76, null, 74, null, 71, null, 67, null,
    69, null, 72, null, 76, null, 72, null, 74, null, 76, null, 77, null, 76, null,
    77, null, 76, null, 74, null, 72, null, 74, null, null, null, 79, null, null, null,
    72, 74, 76, null, 79, null, 81, null, 79, null, 76, null, 74, null, 76, null,
    74, null, 71, null, 74, null, 79, null, 78, null, 79, null, 74, null, null, null,
    76, null, 72, null, 69, null, 72, null, 76, null, 79, null, 81, null, 79, null,
    77, null, 81, null, 79, null, 77, null, 76, null, 74, null, 72, null, null, null
  ];
  const GOC_HOP_AM = [48, 43, 45, 41];           // C, G, A, F (bè trầm)
  const HOP_AM = [[60, 64, 67], [59, 62, 67], [57, 60, 64], [57, 60, 65]];
  const tanSo = n => 440 * Math.pow(2, (n - 69) / 12);

  class QuanLyAmThanh {
    constructor() {
      this.bat = { nhac: true, giong: true, hieuUng: true };
      try {
        const luu = JSON.parse(localStorage.getItem(ST.CAU_HINH.khoaLuuCaiDat) || "null");
        if (luu) Object.keys(this.bat).forEach(k => { if (typeof luu[k] === "boolean") this.bat[k] = luu[k]; });
      } catch (e) { /* không có localStorage: dùng mặc định */ }
      this.ac = null;
      this.nhacChay = false;
      this.caoTrao = 0;
      this.dangDoc = false;
      this.giongTot = null;
      this.amFile = null;
      this.lanDoc = 0;
      this.chonGiong = this.chonGiong.bind(this);
      if (this.coGiongDoc()) {
        this.chonGiong();
        try { speechSynthesis.addEventListener("voiceschanged", this.chonGiong); } catch (e) { speechSynthesis.onvoiceschanged = this.chonGiong; }
      }
    }

    coGiongDoc() { return typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined"; }

    // Phải gọi trong một lần bấm của người chơi (trình duyệt chỉ cho phát tiếng sau thao tác)
    mo() {
      try {
        if (!this.ac) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return;
          this.ac = new AC();
          this.tong = this.ac.createGain(); this.tong.gain.value = 0.9; this.tong.connect(this.ac.destination);
          this.gNhac = this.ac.createGain(); this.gNhac.gain.value = this.bat.nhac ? AM_LUONG.nhac : 0; this.gNhac.connect(this.tong);
          this.gCaoTrao = this.ac.createGain(); this.gCaoTrao.gain.value = 0; this.gCaoTrao.connect(this.gNhac);
          this.gHieuUng = this.ac.createGain(); this.gHieuUng.gain.value = this.bat.hieuUng ? AM_LUONG.hieuUng : 0; this.gHieuUng.connect(this.tong);
          // bộ lọc làm tiếng giai điệu mềm, không chói tai trẻ
          this.locMem = this.ac.createBiquadFilter(); this.locMem.type = "lowpass"; this.locMem.frequency.value = 2600; this.locMem.connect(this.gNhac);
          const dai = Math.floor(this.ac.sampleRate * 0.5);
          this.tiengOn = this.ac.createBuffer(1, dai, this.ac.sampleRate);
          const d = this.tiengOn.getChannelData(0);
          for (let i = 0; i < dai; i++) d[i] = Math.random() * 2 - 1;
        }
        if (this.ac.state === "suspended") this.ac.resume();
      } catch (e) { this.ac = null; }
    }

    luuCaiDat() { try { localStorage.setItem(ST.CAU_HINH.khoaLuuCaiDat, JSON.stringify(this.bat)); } catch (e) { /* bỏ qua */ } }

    datBat(nhom, bat) {
      this.bat[nhom] = !!bat;
      this.luuCaiDat();
      if (nhom === "giong" && !bat) this.dungDoc();
      if (!this.ac) return;
      const t = this.ac.currentTime;
      if (nhom === "nhac") this.lamMuot(this.gNhac.gain, bat ? (this.dangDoc ? AM_LUONG.nhacKhiDoc : AM_LUONG.nhac) : 0, 0.3);
      if (nhom === "hieuUng") this.gHieuUng.gain.setTargetAtTime(bat ? AM_LUONG.hieuUng : 0, t, 0.02);
    }
    lamMuot(thamSo, giaTri, giay) {
      const t = this.ac.currentTime;
      try { thamSo.cancelScheduledValues(t); thamSo.setValueAtTime(thamSo.value, t); thamSo.linearRampToValueAtTime(giaTri, t + giay); }
      catch (e) { thamSo.value = giaTri; }
    }

    tamDung() {
      this.dungDoc();
      if (this.ac && this.ac.state === "running") { try { this.ac.suspend(); } catch (e) { /* bỏ qua */ } }
    }
    tiepTuc() { if (this.ac && this.ac.state === "suspended") { try { this.ac.resume(); } catch (e) { /* bỏ qua */ } } }

    /* ---------------- NHẠC NỀN ---------------- */
    batDauNhac() {
      if (!this.ac || this.nhacChay) return;
      this.nhacChay = true;
      this.buocNhac = 0;
      this.lucKe = this.ac.currentTime + 0.1;
      this.datCaoTrao(0, true);
      this.henGio = setInterval(() => this.lenLich(), 25);
    }
    dungNhac() {
      this.nhacChay = false;
      if (this.henGio) clearInterval(this.henGio);
      this.henGio = null;
    }
    // 0 = bình thường, 1 = cao trào (gần lâu đài). Đổi từ từ, không giật mình.
    datCaoTrao(muc, ngay) {
      if (!this.ac) return;
      muc = Math.max(0, Math.min(1, muc));
      if (!ngay && Math.abs(muc - this.caoTrao) < 0.05) return;
      this.caoTrao = muc;
      this.lamMuot(this.gCaoTrao.gain, muc * 0.55, ngay ? 0.05 : 1.5);
    }
    lenLich() {
      if (!this.ac || !this.nhacChay || this.ac.state !== "running") return;
      while (this.lucKe < this.ac.currentTime + 0.15) {
        this.choiBuoc(this.buocNhac, this.lucKe);
        this.buocNhac = (this.buocNhac + 1) % GIAI_DIEU.length;
        this.lucKe += nhipBuoc;
      }
    }
    choiBuoc(b, t) {
      const oNhip = Math.floor(b / 16) % 4, trong = b % 16;
      const n = GIAI_DIEU[b];
      if (n) this.not(tanSo(n), t, nhipBuoc * 1.8, "square", 0.12, this.locMem);
      if (trong % 4 === 0 || trong === 6 || trong === 14) {
        const goc = GOC_HOP_AM[oNhip] + (trong === 4 || trong === 12 ? 12 : 0) + (trong === 6 || trong === 14 ? 7 : 0);
        this.not(tanSo(goc), t, nhipBuoc * 1.6, "triangle", 0.5, this.gNhac);
      }
      if (trong === 0 || trong === 8 || trong === 10) this.trongCai(t);
      if (trong === 4 || trong === 12) this.trongNho(t, 0.25);
      if (trong % 2 === 0) this.xeng(t, trong % 4 === 2 ? 0.12 : 0.06);
      // Lớp cao trào: rải hợp âm nhanh ở quãng tám trên
      const ha = HOP_AM[oNhip];
      this.not(tanSo(ha[trong % 3] + 12 + (trong >= 8 ? 12 : 0)), t, nhipBuoc * 0.9, "triangle", 0.35, this.gCaoTrao);
      if (trong === 2 || trong === 10) this.trongNho(t, 0.18, this.gCaoTrao);
    }
    not(f, t, dai, kieu, to, dich) {
      const o = this.ac.createOscillator(), g = this.ac.createGain();
      o.type = kieu; o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(to, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dai);
      o.connect(g); g.connect(dich); o.start(t); o.stop(t + dai + 0.02);
    }
    trongCai(t) {
      const o = this.ac.createOscillator(), g = this.ac.createGain();
      o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      g.gain.setValueAtTime(0.7, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      o.connect(g); g.connect(this.gNhac); o.start(t); o.stop(t + 0.2);
    }
    on(t, dai, to, locTan, dich, loai) {
      const s = this.ac.createBufferSource(), f = this.ac.createBiquadFilter(), g = this.ac.createGain();
      s.buffer = this.tiengOn; f.type = loai || "highpass"; f.frequency.value = locTan;
      g.gain.setValueAtTime(to, t); g.gain.exponentialRampToValueAtTime(0.001, t + dai);
      s.connect(f); f.connect(g); g.connect(dich); s.start(t); s.stop(t + dai + 0.02);
    }
    trongNho(t, to, dich) { this.on(t, 0.12, to, 1500, dich || this.gNhac); }
    xeng(t, to) { this.on(t, 0.04, to, 7000, this.gNhac); }

    /* ---------------- HIỆU ỨNG ---------------- */
    hu(f1, f2, dai, kieu, to, tre) {
      if (!this.ac) return;
      const t = this.ac.currentTime + (tre || 0), o = this.ac.createOscillator(), g = this.ac.createGain();
      o.type = kieu || "sine"; o.frequency.setValueAtTime(f1, t);
      if (f2 && f2 !== f1) o.frequency.exponentialRampToValueAtTime(f2, t + dai * 0.8);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(to || 0.3, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dai);
      o.connect(g); g.connect(this.gHieuUng); o.start(t); o.stop(t + dai + 0.02);
    }
    chuoi(cacNot, cach, dai, kieu, to) { cacNot.forEach((n, i) => this.hu(tanSo(n), 0, dai, kieu, to, i * cach)); }
    phat(ten) {
      if (!this.ac || !this.bat.hieuUng) return;
      const t = this.ac.currentTime;
      switch (ten) {
        case "dung": this.chuoi([72, 76, 79, 84], 0.07, 0.22, "triangle", 0.35); break;
        case "sai": this.hu(330, 260, 0.16, "sine", 0.3); this.hu(260, 200, 0.2, "sine", 0.3, 0.14); break;
        case "nhay": this.hu(320, 760, 0.22, "square", 0.08); break;
        case "tiepDat": this.hu(150, 60, 0.12, "sine", 0.35); this.on(t, 0.06, 0.08, 400, this.gHieuUng, "lowpass"); break;
        case "phep": this.hu(700, 2100, 0.28, "sawtooth", 0.07); this.chuoi([88, 91, 96], 0.05, 0.16, "triangle", 0.15); break;
        case "haQuai": this.on(t, 0.25, 0.3, 900, this.gHieuUng, "bandpass"); this.hu(500, 1300, 0.18, "triangle", 0.2, 0.05); break;
        case "khung": this.hu(240, 110, 0.18, "square", 0.18); this.hu(180, 150, 0.25, "triangle", 0.2, 0.12); break;
        case "vaQuai": this.hu(420, 140, 0.4, "sawtooth", 0.15); break;
        case "roi": this.hu(760, 90, 0.9, "triangle", 0.3); break;
        case "kimCuong": this.hu(tanSo(88), 0, 0.18, "triangle", 0.3); this.hu(tanSo(93), 0, 0.3, "triangle", 0.3, 0.07); break;
        case "doiMang": this.chuoi([72, 76, 79, 84, 88], 0.08, 0.3, "triangle", 0.3); break;
        case "hoiSinh": this.chuoi([67, 72, 76, 79, 84], 0.05, 0.2, "sine", 0.25); break;
        case "thang": this.chuoi([72, 72, 76, 79, 76, 79, 84], 0.13, 0.35, "triangle", 0.3); break;
        case "thua": this.chuoi([67, 64, 60, 55], 0.22, 0.4, "triangle", 0.25); break;
        case "nut": this.hu(600, 900, 0.07, "sine", 0.2); break;
        case "hienTu": this.hu(880, 1100, 0.1, "sine", 0.12); break;
      }
    }

    /* ---------------- GIỌNG ĐỌC TỪ VỰNG ---------------- */
    chonGiong() {
      try {
        const ds = speechSynthesis.getVoices().filter(v => /^en[-_]/i.test(v.lang));
        if (!ds.length) return;
        const diem = v => (/natural|neural/i.test(v.name) ? 50 : 0) + (/google/i.test(v.name) ? 30 : 0) +
          (/samantha|ava|allison|karen|serena|aria|jenny|emma|zira|libby|sonia/i.test(v.name) ? 25 : 0) +
          (/en[-_](US|GB)/i.test(v.lang) ? 10 : 0) + (v.localService ? 8 : 0); // ưu tiên giọng có sẵn trong máy (chạy cả khi mất mạng)
        this.giongTot = ds.sort((a, b) => diem(b) - diem(a))[0];
      } catch (e) { /* bỏ qua */ }
    }
    dungDoc() {
      this.lanDoc++;
      if (this.amFile) { try { this.amFile.pause(); } catch (e) { /* bỏ qua */ } this.amFile = null; }
      if (this.coGiongDoc()) { try { speechSynthesis.cancel(); } catch (e) { /* bỏ qua */ } }
      this.xongDoc();
    }
    xongDoc() {
      this.dangDoc = false;
      if (this.ac && this.bat.nhac) this.lamMuot(this.gNhac.gain, AM_LUONG.nhac, 0.4);
    }
    // Chính sách thống nhất: từ mới luôn DỪNG từ đang đọc rồi mới đọc, không bao giờ chồng tiếng
    doc(tu) {
      if (!this.bat.giong || !tu) return;
      this.dungDoc();
      const lan = this.lanDoc;
      this.dangDoc = true;
      if (this.ac && this.bat.nhac) this.lamMuot(this.gNhac.gain, AM_LUONG.nhacKhiDoc, 0.08); // nhạc nhỏ lại để nghe rõ giọng
      const xong = () => { if (lan === this.lanDoc) this.xongDoc(); };
      setTimeout(xong, 2500);
      if (ST.FILE_GIONG.indexOf(tu) >= 0) {
        try {
          const a = new Audio("am_thanh/" + tu + ".mp3");
          this.amFile = a; a.volume = 1; a.onended = xong;
          a.onerror = () => { if (lan === this.lanDoc) this.docMay(tu, lan, xong); };
          const p = a.play(); if (p && p.catch) p.catch(() => { if (lan === this.lanDoc) this.docMay(tu, lan, xong); });
          return;
        } catch (e) { /* rơi xuống giọng máy */ }
      }
      this.docMay(tu, lan, xong);
    }
    docMay(tu, lan, xong) {
      if (!this.coGiongDoc()) { xong(); return; }
      // Chờ một chút sau cancel(): một số trình duyệt nuốt mất câu nói nếu speak() ngay
      setTimeout(() => {
        if (lan !== this.lanDoc || !this.bat.giong) return;
        try {
          const u = new SpeechSynthesisUtterance(tu);
          u.lang = (this.giongTot && this.giongTot.lang) || "en-US"; u.rate = 0.82; u.pitch = 1.05; u.volume = 1;
          if (this.giongTot) u.voice = this.giongTot;
          u.onend = xong; u.onerror = xong;
          speechSynthesis.speak(u);
        } catch (e) { xong(); }
      }, 40);
    }
  }
  ST.QuanLyAmThanh = QuanLyAmThanh;
})(typeof window !== "undefined" ? window : globalThis);
