// ================================================================
// FILE: dt/3d/dt3d_am_thanh.js  (ES module) - ÂM THANH CHIẾN ĐẤU
// CHỨC NĂNG: Mọi tiếng của sân đấu TỰ TẠO bằng Web Audio (không file, không bản quyền, như
//            san_tu/st_am_thanh.js): chém, trúng đòn, phép, khiên "keng", né, thắng, thua...
//            + tiếng 7 chiêu vùng (dt3d_chieu_vung.js): lửa rơi, thiên thạch nổ, gió lốc, đất rung,
//            kính vỡ, mưa tên, chưởng gồng + bắn.
//            - Chưa chạm trang thì im lặng hoàn toàn (trình duyệt cấm tự phát; ta cũng không muốn):
//              bộ tiếng chỉ mở ở lần chạm / bấm phím đầu tiên, mọi lệnh trước đó bị bỏ qua.
//            - Tắt / bật nhớ trong máy (localStorage "kc_dt_tieng"); trang ẩn thì tạm dừng.
//            - Dồn nhiều chiêu không rè: mỗi loại tiếng có khoảng cách tối thiểu, không mở tiếng mới
//              khi đã quá nhiều tiếng đang kêu, cuối đường có bộ nén âm lượng.
//            THƯ VIỆN ÂM THANH (file thu thật, CC0) ở kc/dt/am_thanh/thu_vien.json (phụ tá điền, việc A7):
//            - nhac[]: nhạc nền theo bối cảnh (tran / trum / lang / sanh / thang / thua...), lặp liền
//              (tự cắt khoảng lặng đầu / cuối file mp3), chuyển bài êm. Nhạc do QUẢN TRỊ chọn (bảng gan,
//              trang Cài đặt TC_D05D), bé không tắt / đổi được (người dùng 30/10/2026); nút 🔊 của bé chỉ
//              tắt tiếng hiệu ứng. datNhac() để dành cho Quản trị / trang thử.
//            - tieng[]: tiếng thu thật, mỗi tiếng vài biến thể (chọn ngẫu nhiên cho đỡ nhàm).
//            - gan{}: GẮN thư viện vào sân khấu / hiệu ứng (sau này trang Cài đặt sửa, TC_D05D):
//                "nhac_<bối cảnh>": mã nhạc;  "<tên tiếng tự tạo>": { "tieng": mã, "kieu": "chong" | "thay" }
//                (chong = phát cùng tiếng tự tạo, thay = chỉ phát tiếng thu thật).
//            Thư viện trống / tải lỗi: vẫn chạy bằng tiếng tự tạo như cũ.
// HÀM KHAI RA:
//   taoAmThanh() -> am = { dangBat(), datBat(b), moKhoa(), thongKe() + các tiếng bên dưới,
//        thuVien() -> Promise<json>, phatNhac({ ma | boiCanh, lap }), dungNhac(giay), nhacBat(), datNhac(b),
//        giamNhac(b) (nhỏ nhạc khi máy đọc câu hỏi), mau(ma, x, amLuong, bienThe, tre) (phát một tiếng thư viện),
//        doanKet(thang) (đoạn kết thắng / thua: bài quản trị gắn ở nhac_thang / nhac_thua, chưa gắn thì tiếng tự tạo) }
//   Trang nghe thử thư viện: kc/dt/thu_am_thanh.html
//   Tham số chung: x = vị trí ngang trên sân (-3..3, trái / phải loa), tre = giây chờ trước khi kêu.
// BƯỚC: TC_D05B3 (người dùng 29/10/2026: "bổ sung âm thanh cho chiến đấu"; 30/10/2026: "thiếu nhạc
//        nền", "giao việc cho agy làm thư viện âm thanh để sau này mình gắn bối cảnh sân khấu, hiệu ứng
//        trong cài đặt")
// NGÀY: 30/10/2026; 30/10/2026 06:30 (thư viện + nhạc nền)
// ================================================================
const KHOA = "kc_dt_tieng", KHOA_NHAC = "kc_dt_nhac";
const TOI_DA = 64; // không mở tiếng mới khi đã có ngần này nguồn đang kêu
const AM_NHAC = 0.32; // nhạc nhỏ hơn tiếng hiệu ứng
const URL_THU_VIEN = new URL("../am_thanh/thu_vien.json", import.meta.url).href;
const ngau = (a, b) => a + Math.random() * (b - a);
// tên tiếng tự tạo mà tham số đầu KHÔNG phải vị trí x
const KHONG_X = { chuChieu: 1, thang: 1, thua: 1 };

export function taoAmThanh() {
  let ac = null, tong = null, guiVang = null, nhieu = null, dangKeu = 0, busNhac = null;
  let bat = true, batNhac = true;
  try { bat = localStorage.getItem(KHOA) !== "tat"; batNhac = localStorage.getItem(KHOA_NHAC) !== "tat"; } catch (e) { /* bị chặn lưu: mặc định bật */ }
  let moXong; const choMo = new Promise(r => { moXong = r; }); // xong khi bé chạm trang lần đầu
  const lanCuoi = {}, daKeu = {}; // daKeu: đếm số lần mỗi tiếng đã kêu (kịch bản thử Chrome đọc)

  // ---------- mở bộ tiếng ở lần chạm đầu ----------
  function moKhoa() {
    if (ac) { if (ac.state === "suspended" && !document.hidden) ac.resume().catch(() => {}); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { ac = new AC(); } catch (e) { ac = null; return; }
    const nen = ac.createDynamicsCompressor();
    nen.threshold.value = -16; nen.knee.value = 10; nen.ratio.value = 8; nen.attack.value = 0.003; nen.release.value = 0.25;
    tong = ac.createGain(); tong.gain.value = bat ? 0.85 : 0;
    tong.connect(nen); nen.connect(ac.destination);
    // nhạc đi chung bộ nén => tiếng nổ lớn tự đè nhạc xuống một chút
    busNhac = ac.createGain(); busNhac.gain.value = batNhac ? AM_NHAC : 0; busNhac.connect(nen);
    // vang nhẹ cho tiếng nổ / keng nghe "có không gian"
    const vang = ac.createConvolver(); vang.buffer = taoVang(1.7);
    guiVang = ac.createGain(); guiVang.gain.value = 0.32;
    guiVang.connect(vang); vang.connect(tong);
    nhieu = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = nhieu.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // iPhone: phát một mẩu im lặng ngay trong lần chạm thì mới mở loa
    const s = ac.createBufferSource(); s.buffer = ac.createBuffer(1, 1, ac.sampleRate); s.connect(ac.destination); s.start();
    if (ac.state === "suspended") ac.resume().catch(() => {});
    moXong();
  }
  for (const ev of ["pointerdown", "touchend", "keydown"]) document.addEventListener(ev, moKhoa, { capture: true, passive: true });
  document.addEventListener("visibilitychange", () => {
    if (!ac) return;
    if (document.hidden) ac.suspend().catch(() => {}); else ac.resume().catch(() => {});
  });
  function taoVang(giay) {
    const n = Math.floor(ac.sampleRate * giay), b = ac.createBuffer(2, n, ac.sampleRate);
    for (let k = 0; k < 2; k++) { const d = b.getChannelData(k); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3); }
    return b;
  }

  // ---------- khối cơ bản ----------
  const san = () => ac && bat && ac.state === "running";
  // chống dồn: cùng một loại tiếng phải cách nhau ít nhất `khoang` giây
  function duoc(ten, khoang) {
    if (!san() || dangKeu >= TOI_DA) return false;
    const t = ac.currentTime;
    if (lanCuoi[ten] != null && t - lanCuoi[ten] < khoang) return false;
    lanCuoi[ten] = t; daKeu[ten] = (daKeu[ten] || 0) + 1; return true;
  }
  // nối ra loa: (bộ lệch trái phải) -> tổng (+ gửi vang)
  function ra(nut, x, vangK) {
    let cuoi = nut;
    if (x != null && ac.createStereoPanner) { const p = ac.createStereoPanner(); p.pan.value = Math.max(-0.7, Math.min(0.7, x / 4)); nut.connect(p); cuoi = p; }
    cuoi.connect(tong);
    if (vangK) { const g = ac.createGain(); g.gain.value = vangK; cuoi.connect(g); g.connect(guiVang); }
  }
  // vỏ âm lượng: lên trong `len` giây rồi tắt dần tới hết `giay`
  function vo(g, t0, am, len, giay) {
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(am, t0 + Math.max(0.002, len));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + giay);
  }
  function chay(src, t0, giay) {
    dangKeu++; src.onended = () => { dangKeu--; };
    src.start(t0); src.stop(t0 + giay + 0.05);
  }
  // tiếng nhiễu qua bộ lọc (gió, nổ, xoẹt, lửa)
  function xen({ tre = 0, giay = 0.3, loc = "bandpass", tu = 1000, den = tu, q = 1, am = 0.5, len = 0.005, x, vang = 0, lap = false }) {
    const t0 = ac.currentTime + tre;
    const s = ac.createBufferSource(); s.buffer = nhieu; s.loop = lap || giay > 1.8;
    const f = ac.createBiquadFilter(); f.type = loc; f.Q.value = q;
    f.frequency.setValueAtTime(tu, t0); if (den !== tu) f.frequency.exponentialRampToValueAtTime(den, t0 + giay);
    const g = ac.createGain(); vo(g, t0, am, len, giay);
    s.connect(f); f.connect(g); ra(g, x, vang);
    dangKeu++; s.onended = () => { dangKeu--; };
    s.start(t0, ngau(0, 1.5)); s.stop(t0 + giay + 0.05);
    return { f, g, t0 };
  }
  // tiếng có cao độ (bùm trầm, keng, nốt nhạc)
  function ton({ tre = 0, giay = 0.3, kieu = "sine", tu = 440, den = tu, am = 0.4, len = 0.005, x, vang = 0 }) {
    const t0 = ac.currentTime + tre;
    const o = ac.createOscillator(); o.type = kieu;
    o.frequency.setValueAtTime(tu, t0); if (den !== tu) o.frequency.exponentialRampToValueAtTime(den, t0 + giay);
    const g = ac.createGain(); vo(g, t0, am, len, giay);
    o.connect(g); ra(g, x, vang); chay(o, t0, giay);
    return { o, g, t0 };
  }
  const not = n => 440 * Math.pow(2, (n - 69) / 12);

  // ---------- thư viện file thu thật ----------
  let hoaThuVien = null;
  const rong = { nhac: [], tieng: [], gan: {} };
  function thuVien() {
    return hoaThuVien || (hoaThuVien = fetch(URL_THU_VIEN).then(r => r.ok ? r.json() : rong)
      .then(j => ({ nhac: j.nhac || [], tieng: j.tieng || [], gan: j.gan || {} }))
      .catch(e => { console.warn("Không đọc được thư viện âm thanh, dùng tiếng tự tạo", e); return rong; }));
  }
  const boDem = {}; // tep -> Promise<AudioBuffer | null>
  function tai(tep) {
    return boDem[tep] || (boDem[tep] = choMo.then(() => fetch(new URL(tep, URL_THU_VIEN).href))
      .then(r => { if (!r.ok) throw new Error(r.status + " " + tep); return r.arrayBuffer(); })
      .then(b => new Promise((ok, loi) => ac.decodeAudioData(b, ok, loi)))
      .catch(e => { console.warn("Không tải được âm thanh", tep, e); return null; }));
  }
  const dsTep = t => Array.isArray(t.tep) ? t.tep : [t.tep];
  const daGiai = {}; // tep -> AudioBuffer đã sẵn (phát tức thì, không phải chờ)
  // tải trước mọi tiếng thư viện đang được gắn, ngay khi bé chạm trang
  choMo.then(thuVien).then(tv => {
    const can = new Set(Object.values(tv.gan).filter(g => g && g.tieng).map(g => g.tieng));
    for (const t of tv.tieng) if (can.has(t.ma)) for (const tep of dsTep(t)) tai(tep).then(b => { if (b) daGiai[tep] = b; });
    for (const k of ["nhac_thang", "nhac_thua"]) { const bai = tv.nhac.find(v => v.ma === tv.gan[k]); if (bai) tai(bai.tep); } // đoạn kết ngắn: tải sẵn để kêu ngay
  });
  let tvSan = null; thuVien().then(tv => { tvSan = tv; });

  // phát một tiếng thư viện (biến thể ngẫu nhiên); trả false nếu chưa có / chưa tải xong
  function mau(ma, x, amLuong = 1, bienThe, tre = 0) {
    if (!san() || dangKeu >= TOI_DA || !tvSan) return false;
    const t = tvSan.tieng.find(v => v.ma === ma); if (!t) return false;
    const tep = dsTep(t), chon = tep[bienThe != null ? bienThe % tep.length : Math.floor(Math.random() * tep.length)];
    const b = daGiai[chon];
    if (!b) { tai(chon).then(v => { if (v) daGiai[chon] = v; }); return false; }
    const s = ac.createBufferSource(); s.buffer = b; s.playbackRate.value = ngau(0.96, 1.04);
    const g = ac.createGain(); g.gain.value = (t.amLuong == null ? 1 : t.amLuong) * amLuong;
    s.connect(g); ra(g, x, 0.15);
    dangKeu++; s.onended = () => { dangKeu--; }; s.start(ac.currentTime + tre);
    return true;
  }

  // nhạc nền: một bài đang phát, đổi bài thì chuyển êm (1 giây)
  let nhacDang = null, nhacMuon = null, giam = false;
  // bỏ khoảng gần như lặng ở đầu / cuối (mp3 tự chèn) để lặp không bị hẫng
  function diemLap(b) {
    const d = b.getChannelData(0), n = d.length, xet = Math.min(8192, n >> 2);
    let a = 0, z = n - 1;
    while (a < xet && Math.abs(d[a]) < 1e-3) a++;
    while (z > n - xet && Math.abs(d[z]) < 1e-3) z--;
    return [a / b.sampleRate, (z + 1) / b.sampleRate];
  }
  async function phatNhac({ ma, boiCanh, lap, tu } = {}) {
    nhacMuon = { ma, boiCanh, lap };
    const yeuCau = nhacMuon;
    const tv = await thuVien();
    const maChon = ma || (boiCanh && tv.gan["nhac_" + boiCanh]);
    const bai = (maChon && tv.nhac.find(v => v.ma === maChon)) || (boiCanh && tv.nhac.find(v => (v.boiCanh || []).indexOf(boiCanh) >= 0));
    if (!bai) { dungNhac(1.2); return false; }
    if (nhacDang && nhacDang.ma === bai.ma && tu == null) return true;
    const b = await tai(bai.tep);
    if (!b || yeuCau !== nhacMuon) return false; // tải lỗi, hoặc trong lúc tải đã đổi ý
    dungNhac(1);
    const s = ac.createBufferSource(); s.buffer = b;
    const coLap = lap != null ? lap : bai.lap !== false;
    if (coLap) { s.loop = true; const [tu, den] = diemLap(b); s.loopStart = tu; s.loopEnd = den; }
    const g = ac.createGain(), t0 = ac.currentTime, muc = bai.amLuong == null ? 1 : bai.amLuong;
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(muc, t0 + 1);
    s.connect(g); g.connect(busNhac);
    // tu < 0: bắt đầu trước chỗ nối |tu| giây (trang nghe thử kiểm chỗ lặp có liền không)
    s.start(t0, tu != null && tu < 0 ? Math.max(0, (coLap ? s.loopEnd : b.duration) + tu) : coLap ? s.loopStart : 0);
    nhacDang = { ma: bai.ma, s, g, muc };
    s.onended = () => { if (nhacDang && nhacDang.s === s) nhacDang = null; };
    return true;
  }
  function dungNhac(giay = 1) {
    nhacMuon = null;
    if (!nhacDang || !ac) return;
    const { s, g } = nhacDang, t0 = ac.currentTime;
    g.gain.cancelScheduledValues(t0); g.gain.setValueAtTime(g.gain.value, t0); g.gain.linearRampToValueAtTime(0.0001, t0 + giay);
    s.stop(t0 + giay + 0.05); nhacDang = null;
  }
  const mucNhac = () => (batNhac ? AM_NHAC : 0) * (giam ? 0.35 : 1);

  // ---------- tiếng đòn đánh ----------
  const am = {
    dangBat: () => bat,
    datBat(b) {
      bat = !!b;
      try { localStorage.setItem(KHOA, bat ? "bat" : "tat"); } catch (e) { /* bỏ qua */ }
      if (ac && tong) tong.gain.setTargetAtTime(bat ? 0.85 : 0, ac.currentTime, 0.03);
    },
    moKhoa,
    thongKe: () => ({ trangThai: ac ? ac.state : "chua_mo", bat, batNhac, nhac: nhacDang ? nhacDang.ma : null, dangKeu, daKeu: { ...daKeu } }),
    thuVien, phatNhac, dungNhac, mau,
    nhacBat: () => batNhac,
    datNhac(b) {
      batNhac = !!b;
      try { localStorage.setItem(KHOA_NHAC, batNhac ? "bat" : "tat"); } catch (e) { /* bỏ qua */ }
      if (ac && busNhac) busNhac.gain.setTargetAtTime(mucNhac(), ac.currentTime, 0.1);
    },
    // đoạn kết thắng / thua: quản trị đã gắn bài thì phát bài (dừng nhạc trận), chưa gắn thì kèn tự tạo
    doanKet(thang) {
      const k = thang ? "thang" : "thua";
      if (tvSan && tvSan.gan["nhac_" + k]) phatNhac({ boiCanh: k, lap: false });
      else { dungNhac(1.2); am[k](thang ? 0.1 : 0); }
    },
    giamNhac(b) {
      giam = !!b;
      if (ac && busNhac) busNhac.gain.setTargetAtTime(mucNhac(), ac.currentTime, 0.15);
    },
    // vung kiếm "vút"
    chem(x, tre = 0) {
      if (!duoc("chem", 0.08)) return;
      xen({ tre, giay: 0.24, tu: 500, den: 3800, q: 1.4, am: 0.55, len: 0.08, x });
      ton({ tre: tre + 0.05, giay: 0.18, kieu: "sine", tu: 2200, den: 3000, am: 0.05, len: 0.04, x });
    },
    // trúng đòn "bộp" (manh = chí mạng: to + vỡ vụn + vang)
    trung(x, manh, tre = 0) {
      if (!duoc("trung", 0.06)) return;
      ton({ tre, giay: manh ? 0.5 : 0.28, tu: manh ? 170 : 150, den: 42, am: 0.9, x });
      xen({ tre, giay: 0.16, loc: "lowpass", tu: 3200, den: 300, am: 0.6, x, vang: 0.15 });
      if (manh) {
        xen({ tre, giay: 0.4, tu: 1400, den: 500, q: 0.8, am: 0.45, x, vang: 0.5 });
        ton({ tre, giay: 0.9, tu: 75, den: 28, am: 0.7, x });
      }
    },
    // đánh hụt / bụi tung "phụt"
    hut(x, tre = 0) {
      if (!duoc("hut", 0.1)) return;
      xen({ tre, giay: 0.22, loc: "lowpass", tu: 900, den: 250, am: 0.3, len: 0.02, x });
    },
    // tung phép: chuỗi nốt lấp lánh + tiếng xèo cao (lon = chiêu lớn)
    phep(x, lon, tre = 0) {
      if (!duoc("phep", 0.12)) return;
      const goc = [84, 86, 88, 91, 93, 96];
      for (let i = 0; i < (lon ? 6 : 4); i++) {
        ton({ tre: tre + i * 0.045, giay: 0.4, kieu: "triangle", tu: not(goc[(i * 2 + (lon ? 1 : 0)) % goc.length]), am: 0.12, len: 0.01, x, vang: 0.4 });
      }
      xen({ tre, giay: lon ? 0.7 : 0.45, loc: "highpass", tu: 4000, am: 0.12, len: 0.1, x, vang: 0.3 });
      ton({ tre, giay: 0.35, tu: 300, den: 900, am: 0.12, len: 0.05, x });
    },
    // khiên đỡ đòn "keng" (cao > 1: kết giới Tiên tộc trong hơn)
    keng(x, cao = 1, tre = 0) {
      if (!duoc("keng", 0.08)) return;
      const f = 1150 * cao;
      [[1, 1.1, 0.35], [2.76, 0.75, 0.2], [5.4, 0.45, 0.12], [8.93, 0.28, 0.07]].forEach(([k, giay, a]) => ton({ tre, giay, tu: f * k, am: a, x, vang: 0.5 }));
      xen({ tre, giay: 0.04, loc: "highpass", tu: 3000, am: 0.5, x });
    },
    // Quỷ tộc đứng tấn chịu đòn: "bịch" trầm + sạn đất
    dungTan(x, tre = 0) {
      if (!duoc("dungTan", 0.08)) return;
      ton({ tre, giay: 0.3, tu: 110, den: 45, am: 0.7, x });
      xen({ tre, giay: 0.3, loc: "lowpass", tu: 1100, den: 300, am: 0.4, x });
    },
    // né "vụt" nhẹ
    ne(x, tre = 0) {
      if (!duoc("ne", 0.1)) return;
      xen({ tre, giay: 0.2, tu: 2600, den: 800, q: 1.6, am: 0.35, len: 0.03, x });
    },
    // quái nhảy vồ "boing"
    nhay(x, tre = 0) {
      if (!duoc("nhay", 0.15)) return;
      ton({ tre, giay: 0.22, kieu: "triangle", tu: 200, den: 560, am: 0.22, len: 0.01, x });
    },
    // đom đóm bắn tia "pew"
    tia(x, tre = 0) {
      if (!duoc("tia", 0.1)) return;
      ton({ tre, giay: 0.3, kieu: "square", tu: 1700, den: 500, am: 0.07, x, vang: 0.3 });
      ton({ tre, giay: 0.3, tu: 1200, den: 2400, am: 0.1, x });
    },
    // tên chiêu hiện chữ to: tiếng trống lớn "thùng" + gió cuộn lên
    chuChieu(tre = 0) {
      if (!duoc("chuChieu", 0.3)) return;
      ton({ tre, giay: 0.9, tu: 95, den: 40, am: 0.75, vang: 0.6 });
      xen({ tre, giay: 0.6, loc: "lowpass", tu: 300, den: 1600, am: 0.25, len: 0.4, vang: 0.4 });
    },
    // dịch chuyển (về Lều): lấp lánh đi lên
    dichChuyen(x, tre = 0) {
      if (!duoc("dichChuyen", 0.3)) return;
      for (let i = 0; i < 14; i++) ton({ tre: tre + i * 0.05, giay: 0.25, kieu: "sine", tu: 900 + i * 180 + ngau(0, 120), am: 0.06, x, vang: 0.5 });
    },
    // thắng: kèn ngắn đô - mi - son - đô
    thang(tre = 0) {
      if (!duoc("thang", 1)) return;
      [72, 76, 79].forEach((n, i) => { ton({ tre: tre + i * 0.13, giay: 0.22, kieu: "triangle", tu: not(n), am: 0.22, len: 0.01, vang: 0.3 }); ton({ tre: tre + i * 0.13, giay: 0.2, kieu: "square", tu: not(n), am: 0.03 }); });
      const t = tre + 0.39;
      for (const n of [72, 76, 79, 84]) ton({ tre: t, giay: 1.1, kieu: "triangle", tu: not(n), am: 0.14, len: 0.02, vang: 0.4 });
      for (let i = 0; i < 10; i++) ton({ tre: t + 0.05 + i * 0.06, giay: 0.2, tu: not(96 + (i * 5) % 12), am: 0.04, vang: 0.5 });
    },
    // thua: ba nốt đi xuống nhẹ nhàng (không doạ bé)
    thua(tre = 0) {
      if (!duoc("thua", 1)) return;
      [67, 64, 60].forEach((n, i) => ton({ tre: tre + i * 0.32, giay: i === 2 ? 0.9 : 0.36, kieu: "triangle", tu: not(n), den: i === 2 ? not(n) * 0.97 : not(n), am: 0.18, len: 0.02, vang: 0.4 }));
    },
    // quái bỏ chạy: bước chân lạch bạch
    chayTron(x, tre = 0) {
      if (!duoc("chayTron", 0.5)) return;
      for (let i = 0; i < 8; i++) ton({ tre: tre + i * 0.15, giay: 0.07, kieu: "triangle", tu: i % 2 ? 300 : 340, den: 150, am: 0.12 * (1 - i / 10), x: x + i * 0.6 });
    },

    // ---------- tiếng 7 chiêu vùng ----------
    // mưa lửa: lửa cháy rì rào suốt `giay` + tiếng lách tách
    muaLua(x, giay) {
      if (!duoc("muaLua", 0.5)) return;
      const r = xen({ giay: giay + 1.6, loc: "lowpass", tu: 700, am: 0.32, len: 0.8, x, lap: true, vang: 0.2 });
      r.f.frequency.linearRampToValueAtTime(1300, r.t0 + giay * 0.6);
      const n = Math.round((giay + 1) * 18);
      for (let i = 0; i < n; i++) xen({ tre: ngau(0.3, giay + 1.2), giay: ngau(0.015, 0.04), tu: ngau(2500, 6000), q: 2, am: ngau(0.06, 0.18), x: x + ngau(-2, 2) });
    },
    // một giọt lửa chạm đất "xèo"
    luaCham(x) {
      if (!duoc("luaCham", 0.09)) return;
      xen({ giay: ngau(0.12, 0.2), loc: "highpass", tu: 2800, am: ngau(0.05, 0.1), x });
    },
    // thiên thạch lao xuống: tiếng rít trầm dần trong `bay` giây
    thachVut(x, bay) {
      if (!duoc("thachVut", 0.15)) return;
      xen({ giay: bay, tu: 2600, den: 300, q: 2, am: 0.3, len: bay * 0.85, x });
      ton({ giay: bay, tu: 220, den: 70, am: 0.12, len: bay * 0.85, x });
    },
    // thiên thạch nổ "ẦM" (k = cỡ khối)
    thachNo(x, k = 1) {
      if (!duoc("thachNo", 0.12)) return;
      ton({ giay: 1.5, tu: 95, den: 26, am: 1, x });
      xen({ giay: 1.7, loc: "lowpass", tu: 3500, den: 140, am: 0.95 * Math.min(1.2, k), len: 0.004, x, vang: 0.6 });
      xen({ giay: 0.06, loc: "highpass", tu: 2000, am: 0.6, x });
      for (let i = 0; i < 6; i++) xen({ tre: ngau(0.15, 0.9), giay: 0.05, tu: ngau(900, 2500), q: 3, am: 0.12, x: x + ngau(-1.5, 1.5) });
    },
    // lốc xoáy: gió hú `giay` giây, đi từ xTu sang xDen
    locXoay(xTu, xDen, giay) {
      if (!duoc("locXoay", 0.5)) return;
      const t0 = ac.currentTime, tat = t0 + giay + 0.6;
      const p = ac.createStereoPanner ? ac.createStereoPanner() : null;
      const out = ac.createGain(); out.gain.value = 1;
      if (p) { p.pan.setValueAtTime(Math.max(-0.7, Math.min(0.7, xTu / 4)), t0); p.pan.linearRampToValueAtTime(Math.max(-0.7, Math.min(0.7, xDen / 4)), t0 + giay); out.connect(p); p.connect(tong); } else out.connect(tong);
      const g2 = ac.createGain(); g2.gain.value = 0.2; out.connect(g2); g2.connect(guiVang);
      [[500, 1.2, 0.5, 0.7], [1600, 7, 0.18, 1.9]].forEach(([fc, q, a, toc]) => {
        const s = ac.createBufferSource(); s.buffer = nhieu; s.loop = true;
        const f = ac.createBiquadFilter(); f.type = "bandpass"; f.Q.value = q; f.frequency.value = fc;
        const lfo = ac.createOscillator(), sau = ac.createGain(); lfo.frequency.value = toc; sau.gain.value = fc * 0.55; lfo.connect(sau); sau.connect(f.frequency);
        const g = ac.createGain();
        g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(a, t0 + 0.5); g.gain.setValueAtTime(a, t0 + giay - 0.6); g.gain.exponentialRampToValueAtTime(0.0001, tat);
        s.connect(f); f.connect(g); g.connect(out);
        dangKeu += 2; s.onended = () => { dangKeu--; }; lfo.onended = () => { dangKeu--; };
        s.start(t0, ngau(0, 1)); s.stop(tat + 0.05); lfo.start(t0); lfo.stop(tat + 0.05);
      });
    },
    // dậm đất: "THỊCH" + đất gầm + đá nứt theo từng vòng (soVong, cachVong giây)
    damDat(x, soVong = 5, cachVong = 0.075) {
      if (!duoc("damDat", 0.4)) return;
      ton({ giay: 1.3, tu: 80, den: 24, am: 1, x });
      xen({ giay: 1.8, loc: "lowpass", tu: 500, den: 90, am: 0.7, len: 0.01, x, vang: 0.5 });
      for (let v = 0; v < soVong; v++) for (let i = 0; i < 3; i++) xen({ tre: 0.05 + v * cachVong + ngau(0, 0.06), giay: ngau(0.04, 0.09), tu: ngau(700, 2000), q: 2, am: 0.2, x: x + v * 0.6 });
    },
    // vỡ không gian: kính nứt răng rắc, tới `vo` giây thì vỡ loảng xoảng
    voKinh(x, vo = 0.5) {
      if (!duoc("voKinh", 0.5)) return;
      ton({ giay: 0.6, tu: 120, den: 35, am: 0.8, x }); // cú đấm
      for (let i = 0; i < 7; i++) xen({ tre: vo * Math.sqrt(i / 7) * 0.95, giay: 0.025, loc: "highpass", tu: ngau(3000, 5000), am: ngau(0.25, 0.4), x });
      xen({ tre: vo, giay: 1.1, loc: "highpass", tu: 2200, den: 5000, am: 0.6, len: 0.003, x, vang: 0.5 });
      ton({ tre: vo, giay: 0.5, tu: 90, den: 30, am: 0.6, x });
      for (let i = 0; i < 34; i++) ton({ tre: vo + ngau(0, 0.7) * ngau(0.3, 1), giay: ngau(0.08, 0.3), tu: ngau(2600, 7500), am: ngau(0.03, 0.08), x: x + ngau(-2.5, 2.5), vang: 0.4 });
    },
    // mưa tên: một loạt bắn "phựt" (dây cung) + tiếng tên bay
    tenBan(x, bay = 1.5) {
      if (!duoc("tenBan", 0.2)) return;
      ton({ giay: 0.22, kieu: "triangle", tu: 190, den: 150, am: 0.3, x });
      xen({ giay: 0.05, loc: "highpass", tu: 1800, am: 0.3, x });
      xen({ tre: 0.1, giay: bay, tu: 2200, den: 1200, q: 1.5, am: 0.12, len: bay * 0.6, x: x + 2 });
    },
    // một mũi tên cắm đất "phập"
    tenCam(x) {
      if (!duoc("tenCam", 0.035)) return;
      xen({ giay: 0.05, tu: ngau(800, 1200), q: 2, am: ngau(0.15, 0.3), x });
      ton({ giay: 0.07, tu: ngau(260, 340), den: 110, am: 0.12, x });
    },
    // chưởng: gồng `gom` giây (ù ù lên cao dần) rồi bắn `ban` giây (luồng sáng gầm)
    chuong(x, gom = 1.3, ban = 1.4) {
      if (!duoc("chuong", 0.5)) return;
      const t0 = ac.currentTime;
      // gồng
      const o = ac.createOscillator(); o.type = "sawtooth";
      o.frequency.setValueAtTime(70, t0); o.frequency.exponentialRampToValueAtTime(260, t0 + gom);
      const f = ac.createBiquadFilter(); f.type = "lowpass"; f.Q.value = 4;
      f.frequency.setValueAtTime(250, t0); f.frequency.exponentialRampToValueAtTime(2200, t0 + gom);
      const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.18, t0 + gom); g.gain.exponentialRampToValueAtTime(0.0001, t0 + gom + 0.12);
      o.connect(f); f.connect(g); ra(g, x, 0.3); chay(o, t0, gom + 0.15);
      xen({ giay: gom, loc: "highpass", tu: 3000, den: 7000, am: 0.14, len: gom * 0.95, x });
      // bắn: tiếng nổ mở đầu + luồng gầm
      ton({ tre: gom, giay: 0.8, tu: 110, den: 35, am: 0.9, x });
      xen({ tre: gom, giay: 0.12, loc: "highpass", tu: 1500, am: 0.5, x });
      for (const [tu, kieu] of [[110, "sawtooth"], [166, "sawtooth"], [55, "square"]]) {
        const r = ton({ tre: gom, giay: ban + 0.3, kieu, tu, am: 0.09, len: 0.05, x: x + 1.5 });
        r.g.gain.setValueAtTime(0.09, r.t0 + ban - 0.1);
      }
      const r = xen({ tre: gom, giay: ban + 0.4, tu: 900, q: 0.7, am: 0.35, len: 0.05, x: x + 1.5, vang: 0.3 });
      r.g.gain.setValueAtTime(0.35, r.t0 + ban - 0.1);
    }
  };
  // gắn tiếng thu thật vào tiếng tự tạo theo bảng gan{} của thư viện (chong: phát cả hai, thay: chỉ file)
  const KHONG_GAN = ["dangBat", "datBat", "moKhoa", "thongKe", "thuVien", "phatNhac", "dungNhac", "mau", "nhacBat", "datNhac", "giamNhac", "doanKet"];
  for (const ten of Object.keys(am)) {
    const goc = am[ten];
    if (typeof goc !== "function" || KHONG_GAN.indexOf(ten) >= 0) continue;
    am[ten] = (...a) => {
      const g = tvSan && tvSan.gan[ten];
      if (g && g.tieng) {
        const x = KHONG_X[ten] ? undefined : a[0];
        const da = duoc(ten + "_tep", 0.05) && mau(g.tieng, typeof x === "number" ? x : undefined, g.amLuong == null ? 1 : g.amLuong, undefined, g.tre || 0);
        if (da && g.kieu === "thay") return;
      }
      goc(...a);
    };
  }
  return am;
}
// 30/10/2026 - BƯỚC: TC_D05B3
