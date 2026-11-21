/* ================================================================
   FILE: chung/am_thanh.js
   CHỨC NĂNG: MODULE ÂM THANH CHUNG TOÀN APP (nhóm "kiến thức + phụ trợ": đọc câu hỏi, đọc từ tiếng Anh,
              tiếng đúng / sai / nhận thưởng). Mọi màn hỏi / ôn tập / Thử Thách / trận Đấu Trường gọi chung,
              không tự viết lại. Tiếng ĐẶC THÙ của từng game (chiêu Đấu Trường, tiếng bắn Mèo Con...) nằm ở
              cài đặt của game đó (TC_D05F), không ở đây.
   CHỮA LỖI "câu nghe không phát" (người dùng báo 21/11/2026):
     1) Chrome nuốt câu mới khi speak() ngay sau cancel() (bài học NC_03B): luôn chờ máy đọc dừng hẳn
        (tối đa 300 ms) rồi mới đọc; câu mới thay câu cũ, câu cũ báo xong muộn bị bỏ qua (mã phiên).
     2) Trang trận chạy trong KHUNG (iframe) mở sau khi bé chạm ở bản đồ: Chrome chặn đọc ở khung chưa
        được chạm ("not-allowed") -> câu đầu mỗi trận im. Khung cùng trang gốc thì mượn máy đọc của
        trang ngoài cùng (đã được chạm); vẫn bị chặn thì giữ câu, đọc lại ngay ở lần chạm kế tiếp.
     3) Chọn giọng theo ngôn ngữ (en / vi), ưu tiên giọng có sẵn trong máy; giọng không cất tiếng sau
        1,5 giây (giọng mạng hỏng, máy treo) thì thử giọng khác, hết giọng thì thử chỉ đặt ngôn ngữ.
     4) Giữ tham chiếu câu đang đọc (Chrome dọn rác làm mất onend) + cứ 5 giây resume() (Chrome
        máy tính tự ngắt sau ~15 giây).
   DÙNG (window.KC_AM_THANH):
     docCau(cau, { lop, goc, khiBatDau, khiXong })  đọc câu: cau.amThanh "doc:en:<từ>" / "doc:vi:<câu>" /
                                                     đường dẫn tệp (.mp3/.ogg/.wav/.m4a, http...); không có
                                                     am_thanh mà lop <= 3 thì đọc nội dung tiếng Việt.
     coDoc(cau, lop)                                 câu này có gì để đọc không (hiện nút 🔊)
     coAmThanh(cau)                                  câu có phần nghe riêng (câu "nghe và chọn")
     doc(chu, { lang, toc, khiBatDau, khiXong })     đọc một đoạn chữ bất kỳ
     dung()                                          dừng mọi tiếng đọc
     tieng.dung() / sai() / thuong() / kc(i) / keng()  tiếng ngắn tự tạo (WebAudio, không cần tệp)
     dangBat() / datBat(true|false)                  nút tắt tiếng chung (máy nhớ, khoá "kc_am_thanh_bat")
     phanHoi(dung, lop)    KC_09B2: tiếng đúng / sai (MỌI lớp) + lời khen / động viên đọc thành tiếng khi lớp bé <= "tuLop"
                           (cài đặt, mặc định 6; lớp chưa biết thì không nói). Lời + tiếng + giọng đọc theo cài đặt chung
                           (kc/chung/du_lieu/cau_hinh_am_thanh_chung.json + phần sửa ở Quản trị › 🔊 Âm thanh chung).
     taiCauHinh() / datCauHinh(c) / cauHinh()        nạp lại / đặt thẳng (Quản trị nghe thử) / xem cài đặt đang dùng
   NỀN: Web Speech API + Web Audio API (có sẵn trong trình duyệt, không thư viện ngoài).
   BƯỚC: KC_09A
   NGÀY: 21/11/2026
   ================================================================ */
(function (goc) {
  "use strict";
  if (goc.KC_AM_THANH) return;
  const KHOA_BAT = "kc_am_thanh_bat";
  const taiLieu = goc.document;

  // ---------------- Máy đọc: mượn trang ngoài cùng khi đang ở khung cùng trang gốc ----------------
  function chonCuaSo() {
    try {
      const t = goc.top;
      if (t && t !== goc && t.speechSynthesis && t.SpeechSynthesisUtterance && t.location.origin === goc.location.origin) return t;
    } catch (e) { /* khung khác trang gốc: không đọc được trang ngoài */ }
    return goc;
  }
  const cs = chonCuaSo();
  const ss = cs.speechSynthesis || null;
  const LoiNoi = cs.SpeechSynthesisUtterance || null;
  const coMayDoc = !!(ss && LoiNoi);

  const docCaiDat = () => { try { return localStorage.getItem(KHOA_BAT) !== "0"; } catch (e) { return true; } };
  let bat = docCaiDat();

  // ---------------- Giọng ----------------
  let dsGiong = [];
  function quetGiong() { try { const v = ss.getVoices(); if (v && v.length) dsGiong = v; } catch (e) { /* bỏ qua */ } }
  // các giọng của một ngôn ngữ, giọng tốt trước: có sẵn trong máy (chạy cả khi mất mạng, ít hỏng) > tự nhiên > Google
  function giongCho(lang) {
    if (!dsGiong.length) quetGiong();
    const ma = String(lang || "vi").slice(0, 2).toLowerCase();
    const ds = dsGiong.filter(g => (g.lang || "").replace("_", "-").toLowerCase().indexOf(ma) === 0 ||
      (ma === "vi" && /viet|việt/i.test(g.name || "")));
    const vung = ma === "en" ? /en[-_](US|GB)/i : /vi[-_]VN/i;
    const diem = g => (g.localService ? 40 : 0) + (/natural|neural|online/i.test(g.name) ? 15 : 0) + (/google/i.test(g.name) ? 10 : 0) +
      (/samantha|ava|allison|aria|jenny|emma|zira|libby|sonia|hoaimy|an\b|linh/i.test(g.name) ? 8 : 0) + (vung.test(g.lang || "") ? 5 : 0);
    return ds.slice().sort((a, b) => diem(b) - diem(a));
  }
  // giọng đã thử mà không cất tiếng trong phiên này: lần sau bỏ qua
  const giongHong = new Set();

  // ---------------- Trạng thái đọc ----------------
  let phien = 0;               // câu mới / dừng đều tăng -> sự kiện đến muộn của câu cũ bị bỏ qua
  let dangNoi = null;          // giữ tham chiếu (Chrome dọn rác làm mất onend)
  let choCham = null;          // câu bị chặn vì khung chưa được chạm: đọc lại ở lần chạm kế
  let henNoi = 0, henKiem = 0, henCho = 0, giuTho = 0;
  let amTep = null;
  const thongKe = { doc: 0, batDau: 0, chan: 0, thuLai: 0, hong: 0, tep: 0 }; // cho bài thử

  function huyHen() { clearTimeout(henNoi); clearTimeout(henKiem); clearTimeout(henCho); clearInterval(giuTho); henNoi = henKiem = henCho = giuTho = 0; }

  function dung() {
    phien++; huyHen(); choCham = null;
    if (dangNoi && dangNoi.khiXong) { const f = dangNoi.khiXong; dangNoi.khiXong = null; try { f(); } catch (e) { /* bỏ qua */ } }
    dangNoi = null;
    try { if (coMayDoc && (ss.speaking || ss.pending)) ss.cancel(); } catch (e) { /* bỏ qua */ }
    if (amTep) { try { amTep.onended = amTep.onerror = null; amTep.pause(); } catch (e) { /* bỏ qua */ } }
  }

  // chữ đọc được: bỏ emoji / ký hiệu trang trí, gom khoảng trắng
  const lamSach = s => String(s || "").replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, " ").replace(/[_*#]+/g, " ").replace(/\s+/g, " ").trim();

  function doc(chu, tc) {
    const o = Object.assign({ lang: "vi-VN", toc: null }, tc || {});
    const loi = lamSach(chu);
    dung();
    if (!bat || !loi || !coMayDoc) { if (o.khiXong) setTimeout(o.khiXong, 0); return false; }
    const ph = phien;
    const dc = ch.docCau || {};
    const ban = { chu: loi, lang: o.lang, vol: Math.max(0, Math.min(1, Number(o.amLuong != null ? o.amLuong : dc.amLuong) || 1)), toc: o.toc || (/^en/i.test(o.lang) ? Number(dc.tocEn) || 0.85 : Number(dc.tocVi) || 0.95), khiBatDau: o.khiBatDau, khiXong: o.khiXong, lanThu: 0, daBatDau: false };
    dangNoi = ban; thongKe.doc++;
    try { if (ss.paused) ss.resume(); } catch (e) { /* bỏ qua */ }
    // chờ máy đọc dừng hẳn sau cancel() rồi mới đọc (Chrome nuốt câu nếu speak ngay)
    const batDauLuc = Date.now();
    const cho = () => {
      if (ph !== phien) return;
      let ban2 = false; try { ban2 = ss.speaking || ss.pending; } catch (e) { /* bỏ qua */ }
      if (ban2 && Date.now() - batDauLuc < 300) { henCho = setTimeout(cho, 30); return; }
      noi(ban, ph);
    };
    henCho = setTimeout(cho, 60);
    return true;
  }

  function xong(ban, ph) {
    if (ph !== phien || dangNoi !== ban) return;
    huyHen(); dangNoi = null;
    const f = ban.khiXong; ban.khiXong = null;
    if (f) try { f(); } catch (e) { /* bỏ qua */ }
  }

  function noi(ban, ph) {
    if (ph !== phien) return;
    if (!ban.daThu) ban.daThu = new Set();
    // lần 0, 1: giọng tốt nhất chưa thử / chưa hỏng; lần 2: chỉ đặt ngôn ngữ (máy tự chọn)
    const giong = ban.lanThu < 2 ? giongCho(ban.lang).find(g => !giongHong.has(g.name) && !ban.daThu.has(g.name)) || null : null;
    if (giong) ban.daThu.add(giong.name);
    let u;
    try {
      u = new LoiNoi(ban.chu);
      u.lang = giong ? giong.lang : ban.lang; if (giong) u.voice = giong;
      u.rate = ban.toc; u.volume = ban.vol;
    } catch (e) { thongKe.hong++; xong(ban, ph); return; }
    ban.u = u;
    u.onstart = () => {
      if (ph !== phien) return;
      clearTimeout(henKiem);
      thongKe.batDau++;
      if (!ban.daBatDau) { ban.daBatDau = true; if (ban.khiBatDau) try { ban.khiBatDau(); } catch (e) { /* bỏ qua */ } }
    };
    u.onend = () => xong(ban, ph);
    u.onerror = ev => {
      if (ph !== phien) return;
      const loi = ev && ev.error;
      if (loi === "interrupted" || loi === "canceled") return; // do chính mình dừng
      if (loi === "not-allowed") { // khung chưa được chạm: đọc lại ở lần chạm kế
        thongKe.chan++; clearTimeout(henKiem); choCham = { ban, ph }; return;
      }
      thuLai(ban, ph, giong);
    };
    try { ss.speak(u); } catch (e) { thuLai(ban, ph, giong); return; }
    // giọng không cất tiếng (giọng mạng hỏng, máy treo) -> thử giọng khác
    // (dựa vào onstart: Chrome / Edge / Safari / Firefox đều báo; giọng treo vẫn để speaking = true nên không dựa vào speaking)
    henKiem = setTimeout(() => { if (ph === phien && !ban.daBatDau && !choCham) thuLai(ban, ph, giong); }, 1500);
    // Chrome máy tính tự ngắt sau ~15 giây: cứ 5 giây resume()
    clearInterval(giuTho);
    giuTho = setInterval(() => { try { if (ss.speaking) ss.resume(); } catch (e) { /* bỏ qua */ } }, 5000);
    // lưới an toàn: máy không bao giờ báo xong
    clearTimeout(henNoi);
    henNoi = setTimeout(() => xong(ban, ph), 4000 + ban.chu.length * 160);
  }

  function thuLai(ban, ph, giong) {
    if (ph !== phien) return;
    if (giong && !ban.daBatDau) giongHong.add(giong.name);
    if (ban.daBatDau || ban.lanThu >= 2) { thongKe.hong++; xong(ban, ph); return; }
    ban.lanThu++; thongKe.thuLai++;
    try { ss.cancel(); } catch (e) { /* bỏ qua */ }
    clearTimeout(henKiem);
    henCho = setTimeout(() => noi(ban, ph), 120);
  }

  // ---------------- Tệp âm thanh (đường dẫn trong am_thanh của câu) ----------------
  function phatTep(duong, tc) {
    const o = tc || {};
    dung();
    if (!bat) { if (o.khiXong) setTimeout(o.khiXong, 0); return false; }
    const ph = phien;
    try {
      if (!amTep) amTep = new Audio();
      const ket = () => { if (ph === phien && o.khiXong) { const f = o.khiXong; o.khiXong = null; f(); } };
      amTep.onended = ket;
      amTep.onerror = () => { if (ph !== phien) return; if (o.duPhong) o.duPhong(); else ket(); };
      amTep.onplaying = () => { if (ph === phien && o.khiBatDau) { const f = o.khiBatDau; o.khiBatDau = null; f(); } };
      amTep.src = duong; thongKe.tep++;
      const h = amTep.play();
      if (h && h.catch) h.catch(err => {
        if (ph !== phien) return;
        if (err && err.name === "NotAllowedError") { choCham = { tep: duong, tc: o, ph }; thongKe.chan++; return; }
        if (o.duPhong) o.duPhong(); else ket();
      });
    } catch (e) { if (o.khiXong) o.khiXong(); }
    return true;
  }

  // ---------------- Câu hỏi ----------------
  // am_thanh của câu kho: "doc:<ngôn ngữ>:<chữ>" hoặc đường dẫn tệp
  function phanTich(am) {
    const s = String(am || "").trim();
    if (!s) return null;
    const m = /^doc:([a-z]{2}(?:-[A-Za-z]{2})?):(.+)$/i.exec(s);
    if (m) {
      const ma = m[1].toLowerCase();
      return { kieu: "doc", lang: ma === "en" ? "en-US" : ma === "vi" ? "vi-VN" : m[1], chu: m[2].trim() };
    }
    if (/^(https?:|\.{0,2}\/|[\w-]+\/).+\.(mp3|ogg|wav|m4a|webm)(\?.*)?$/i.test(s) || /^https?:\/\//i.test(s)) return { kieu: "tep", duong: s };
    return null;
  }
  const coAmThanh = cau => !!(cau && phanTich(cau.amThanh));
  const coDoc = (cau, lop) => !!cau && (coAmThanh(cau) || (Number.isFinite(lop) && lop <= 3 && !!lamSach(cau.noiDung)));

  function docCau(cau, tc) {
    const o = tc || {};
    if (!cau) return false;
    const p = phanTich(cau.amThanh);
    if (p && p.kieu === "doc") return doc(p.chu, Object.assign({}, o, { lang: p.lang }));
    if (p && p.kieu === "tep") {
      const duong = /^(https?:|\/)/i.test(p.duong) ? p.duong : (o.goc || "") + p.duong;
      return phatTep(duong, o);
    }
    if (Number.isFinite(o.lop) && o.lop <= 3) return doc(cau.noiDung, Object.assign({}, o, { lang: "vi-VN" }));
    if (o.khiXong) setTimeout(o.khiXong, 0);
    return false;
  }

  // ---------------- Tiếng ngắn (WebAudio) ----------------
  let ac = null;
  function mayAm() {
    if (ac) return ac;
    try { const AC = goc.AudioContext || goc.webkitAudioContext; ac = AC ? new AC() : null; } catch (e) { ac = null; }
    return ac;
  }
  function not(tan, luc, dai, kieu, to) {
    if (!bat) return;
    const a = mayAm(); if (!a) return;
    try {
      if (a.state === "suspended") a.resume();
      const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + (luc || 0);
      o.type = kieu || "sine"; o.frequency.setValueAtTime(tan, t);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, (to || 0.18) * heSo), t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dai);
      o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dai + 0.05);
    } catch (e) { /* không phát được: im lặng */ }
  }
  // Tiếng tự tạo (mặc định khi chưa có file / chưa nạp được cài đặt)
  const tuTao = {
    dung() { not(1318, 0, 0.25, "sine", 0.2); not(1760, 0.08, 0.35, "sine", 0.16); },          // trả lời đúng
    sai() { not(220, 0, 0.35, "triangle", 0.14); not(185, 0.12, 0.4, "triangle", 0.1); },       // trả lời sai (nhẹ, không doạ)
    thuong() { [523, 659, 784, 1047].forEach((f, i) => not(f, i * 0.11, 0.3, "triangle", 0.16)); }, // mở rương / nhận thưởng
    kc(i) { not(1568 + ((i || 0) % 4) * 120, 0, 0.12, "sine", 0.08); },                         // từng viên 💎 bay vào
    keng() { not(784, 0, 0.5, "square", 0.05); not(1175, 0.06, 0.6, "sine", 0.12); }            // làm giỏi (≥ 80 %)
  };

  // ---------------- Cài đặt âm thanh chung (KC_09B2) ----------------
  // Mặc định trong code (đủ chạy khi chưa nạp được) < file du_lieu/cau_hinh_am_thanh_chung.json < phần quản trị sửa (Supabase).
  const DONG_MD = { bat: true, amLuong: 1, file: "", amTep: 1, kieu: "thay", tre: 0 };
  const CH_MD = {
    tieng: { dung: DONG_MD, sai: DONG_MD, thuong: DONG_MD, kc: DONG_MD, keng: DONG_MD },
    loiKhen: { bat: true, tuLop: 6, xacSuat: 0.6, toc: 1, amLuong: 1, khen: [], dongVien: [] },
    docCau: { tocEn: 0.85, tocVi: 0.95, amLuong: 1 }
  };
  const laObj = v => v !== null && typeof v === "object" && !Array.isArray(v);
  function tron(a, b) {
    if (b === undefined || b === null) return a;
    if (!laObj(a) || !laObj(b)) return b;
    const kq = Object.assign({}, a);
    Object.keys(b).forEach(k => { kq[k] = tron(a[k], b[k]); });
    return kq;
  }
  let ch = tron(CH_MD, {});
  let heSo = 1;                 // độ to cả nội dung đang áp cho tiếng tự tạo
  const khoUrl = new Map();     // "kho_<id>" -> địa chỉ file tải lên
  let hoaCH = null;
  const URL_CH = (() => { try { return new URL("du_lieu/cau_hinh_am_thanh_chung.json", taiLieu && taiLieu.currentScript && taiLieu.currentScript.src ? taiLieu.currentScript.src : undefined).href; } catch (e) { return null; } })();

  function clientCua(w) { try { const c = w && (w.kcSupabaseClient || w.supabaseClient); return c && typeof c.rpc === "function" ? c : null; } catch (e) { return null; } }
  function timClient() {
    const c = clientCua(goc); if (c) return c;
    for (const w of [goc.parent, goc.top]) { try { if (w && w !== goc) { const k = clientCua(w); if (k) return k; } } catch (e) { /* khung khác trang gốc */ } }
    return null;
  }
  function datCauHinh(moi) { ch = tron(CH_MD, moi || {}); }
  // nạp cài đặt (mặc định + phần quản trị sửa) và địa chỉ các file tải lên; lỗi / chậm thì giữ cài đặt đang có
  function taiCauHinh(moi) {
    if (hoaCH && !moi) return hoaCH;
    const mdF = URL_CH ? fetch(URL_CH, { cache: "no-cache" }).then(r => r.ok ? r.json() : {}).catch(() => ({})) : Promise.resolve({});
    const c = timClient();
    const sua = c ? Promise.resolve(c.rpc("kc_dt_cau_hinh_qt")).then(k => { const d = k && !k.error ? k.data : null; return d && d.thanhCong && laObj(d.sua) ? d.sua.cau_hinh_am_thanh_chung || null : null; }).catch(() => null) : Promise.resolve(null);
    const kho = c ? Promise.resolve(c.rpc("kc_am_thanh_kho_ds")).then(k => {
      const d = k && !k.error ? k.data : null;
      if (d && d.thanhCong && Array.isArray(d.ds)) d.ds.forEach(m => { try { const u = m.ma && m.tep && c.storage.from("kc-am-thanh").getPublicUrl(m.tep).data.publicUrl; if (u) khoUrl.set(m.ma, u); } catch (e) { /* bỏ qua */ } }); // kc_am_thanh_kho_ds công khai: { ma: "kho_<id>", tep: <đường dẫn trong bucket> }
    }).catch(() => null) : Promise.resolve(null);
    const hen = new Promise(xong => setTimeout(xong, 5000, "het"));
    return (hoaCH = Promise.race([Promise.all([mdF, sua, kho]), hen]).then(kq => {
      if (kq && kq !== "het") ch = tron(CH_MD, tron(kq[0] || {}, kq[1] || {}));
      return ch;
    }).catch(() => ch));
  }

  function urlFile(ma) { return ma ? (khoUrl.get(ma) || (/^(https?:|\/)/i.test(ma) ? ma : null)) : null; }
  function phatFileTieng(url, d) {
    const chay = () => {
      if (!bat) return;
      try { const a = new Audio(url); a.volume = Math.max(0, Math.min(1, (Number(d.amLuong) || 0) * (Number(d.amTep) || 0))); const h = a.play(); if (h && h.catch) h.catch(() => {}); } catch (e) { /* bỏ qua */ }
    };
    const tre = Number(d.tre) || 0;
    if (tre > 0) setTimeout(chay, tre * 1000); else chay();
  }
  // một tiếng chung theo cài đặt: tắt / file tải lên / tiếng tự tạo (+ độ to)
  function tiengCauHinh(k, ...doi) {
    const d = Object.assign({}, DONG_MD, ch.tieng[k]);
    if (d.bat === false || !bat) return;
    const url = urlFile(d.file);
    if (url) { phatFileTieng(url, d); if (d.kieu !== "chong") return; }
    heSo = Math.max(0, Math.min(2, Number(d.amLuong))); if (!isFinite(heSo)) heSo = 1;
    try { tuTao[k](...doi); } finally { heSo = 1; }
  }
  const tieng = {
    dung: () => tiengCauHinh("dung"), sai: () => tiengCauHinh("sai"), thuong: () => tiengCauHinh("thuong"),
    kc: i => tiengCauHinh("kc", i), keng: () => tiengCauHinh("keng")
  };

  // Lời khen / động viên đọc thành tiếng (người dùng 21/11/2026): bật / tắt + "từ lớp mấy trở xuống" ở Quản trị.
  // Tiếng đúng / sai luôn phát cho mọi lớp; lời chỉ khi lớp bé <= tuLop (lớp chưa biết thì không nói).
  let loiCuoi = "";
  function chonLoi(dung, lop) {
    const lk = ch.loiKhen || {};
    if (lk.bat === false || !Number.isFinite(lop) || lop > (Number(lk.tuLop) || 0)) return null;
    const ds = (dung ? lk.khen : lk.dongVien) || [];
    const ok = ds.map(s => String(s || "").trim()).filter(Boolean);
    if (!ok.length) return null;
    if (Math.random() >= (lk.xacSuat == null ? 1 : Number(lk.xacSuat))) return null;
    let c = ok[Math.floor(Math.random() * ok.length)];
    if (ok.length > 1 && c === loiCuoi) c = ok[(ok.indexOf(c) + 1) % ok.length]; // không nói lại câu vừa rồi
    return (loiCuoi = c);
  }
  function phanHoi(dung, lop, tuyChon) {
    (dung ? tieng.dung : tieng.sai)();
    const chu = chonLoi(dung, lop == null || lop === "" ? NaN : Number(lop));
    if (!chu || !bat || !coMayDoc) return false;
    const lk = ch.loiKhen || {};
    setTimeout(() => doc(chu, Object.assign({ lang: "vi-VN", toc: Number(lk.toc) || 1, amLuong: lk.amLuong }, tuyChon || {})), 350);
    return true;
  }
  taiCauHinh();

  // ---------------- Mở loa ở lần chạm đầu + đọc lại câu bị chặn ----------------
  let daMo = false;
  function khiCham() {
    if (!daMo) {
      daMo = true;
      const a = mayAm(); try { if (a && a.state === "suspended") a.resume(); } catch (e) { /* bỏ qua */ }
    }
    const c = choCham; if (!c) return;
    choCham = null;
    if (c.ph !== phien) return;
    if (c.tep) { phatTep(c.tep, c.tc); return; }
    const ban = c.ban;
    ban.lanThu = 0; ban.daThu = null;
    // máy đọc đang bận thì dừng rồi CHỜ mới đọc (không speak ngay sau cancel); rảnh thì đọc ngay trong lần chạm
    let ban2 = false; try { ban2 = ss.speaking || ss.pending; } catch (e) { /* bỏ qua */ }
    if (!ban2) { noi(ban, c.ph); return; }
    try { ss.cancel(); } catch (e) { /* bỏ qua */ }
    henCho = setTimeout(() => noi(ban, c.ph), 120);
  }
  if (taiLieu) {
    ["pointerdown", "keydown", "touchend"].forEach(t => taiLieu.addEventListener(t, khiCham, { capture: true, passive: true }));
    goc.addEventListener("pagehide", () => dung());
  }
  if (coMayDoc) {
    quetGiong();
    try { ss.addEventListener("voiceschanged", quetGiong); } catch (e) { /* bỏ qua */ }
    setTimeout(quetGiong, 800);
  }

  function datBat(b) {
    bat = !!b;
    try { localStorage.setItem(KHOA_BAT, bat ? "1" : "0"); } catch (e) { /* chặn lưu: chỉ hiệu lực trong phiên */ }
    if (!bat) dung();
  }

  goc.KC_AM_THANH = {
    docCau, coDoc, coAmThanh, phanTich, doc, dung, tieng, phatTep,
    phanHoi, taiCauHinh, datCauHinh, cauHinh: () => ch, _chonLoi: chonLoi, _khoUrl: khoUrl,
    dangBat: () => bat, datBat,
    dangDoc: () => !!dangNoi,
    _thongKe: thongKe, _muonTrangNgoai: cs !== goc
  };
})(typeof window !== "undefined" ? window : globalThis);
// 21/11/2026 - BƯỚC: KC_09A (tạo mới: module âm thanh chung toàn app)
