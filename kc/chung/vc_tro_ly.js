/* ================================================================
   FILE: chung/vc_tro_ly.js
   CHỨC NĂNG: TRỢ LÝ 🦉 DÙNG CHUNG cho mọi game cờ của Kids Challenge (Cờ Tướng TC_03D, Caro
              và game cờ sau này dùng lại được) - khen / động viên bé "giống Cờ Vua":
              1. VC.giong        - GIỌNG NÓI, rút từ hệ thống giọng của Cờ Vua (board.js NC_02 /
                                    NC_03B, file đó đã chốt sổ nên không sửa, chép cách làm sang):
                                    tầng 1 giọng Việt cài trên máy -> tầng 2 giọng mạng (3 nguồn)
                                    -> tầng 3 file MP3 quản trị điền -> tầng 4 im lặng. Không bao
                                    giờ đọc tiếng Việt bằng giọng nước ngoài. Câu nói xong (kể cả
                                    im lặng / bị lỗi) mới gọi khiNoiXong, có lưới an toàn theo độ dài
                                    câu. DÙNG CHUNG cài đặt với Cờ Vua (bật / tắt tiếng, kiểu giọng,
                                    giọng đã chọn) qua cùng khoá localStorage -> một ứng dụng duy nhất.
              2. VC.LoiDongVien  - CÂU NÓI: tải từ RPC kc_lay_loi_dong_vien(tro_choi) (bảng
                                    kc_loi_dong_vien, quản trị sửa được), thiếu câu thì dùng câu
                                    mặc định game truyền vào (không bao giờ "câm"). Chọn câu khen
                                    theo CẤP của bé (giống Cờ Vua theo Level):
                                      cấp 1..khenMoiNuocToiCap      : khen MỌI nước;
                                      cấp tiếp..khenNuocTotToiCap    : chỉ khen NƯỚC TỐT + động viên
                                                                       khi bị ăn quân / bị chiếu;
                                      cao hơn                        : tắt khen (câu sự kiện vẫn nói).
              Phần 2 không đụng tới trình duyệt -> kiểm thử bằng node được (vc_tro_ly_kiem_thu_node.js
              ở repo riêng).
   BƯỚC: TC_03D
   NGÀY: 22/10/2026 22:40
   PHỤ THUỘC: không. Trang game tự gọi VC.giong.khoiDong() và truyền kcGoiRpc vào LoiDongVien.
   ================================================================ */
(function (goc) {
  "use strict";
  const VC = goc.VC = goc.VC || {};

  /* ================================================================
     1. GIỌNG NÓI
     ================================================================ */
  const KHOA_BAT = "coVua_giongBat";     // "1" | "0"  (chung với Cờ Vua)
  const KHOA_KIEU = "coVua_giongKieu";   // "tu_dong" | "may" | "mang" | "tep"
  const KHOA_TEN = "coVua_giongTen";     // tên giọng máy đã chọn
  const NGUON_MANG = [
    { ten: "StreamElements", url: c => "https://api.streamelements.com/kappa/v2/speech?voice=vi-VN-Wavenet-A&text=" + encodeURIComponent(c) },
    { ten: "Google (googleapis)", url: c => "https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=vi&q=" + encodeURIComponent(c) },
    { ten: "Google (translate)", url: c => "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=vi&q=" + encodeURIComponent(c) }
  ];
  const WAV_CAM = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

  const coWebSpeech = typeof window !== "undefined" && "speechSynthesis" in window;
  let dsGiong = [];
  let giongChon = null;
  let tenGiongQuanTri = "";     // cau_hinh_chung.giong_doc_ten (màn "🔊 Giọng đọc" của Quản trị)
  let nguonMang = 0;            // nguồn giọng mạng đang chạy tốt
  let mangHong = false;         // cả 3 nguồn đều lỗi -> thôi thử
  let amMang = null, amTep = null;
  let daMoKhoa = false, daKhoiDong = false;
  let maPhien = 0, maPhienTep = 0;
  let khiXongDangCho = null, henAnToan = null, watchdog = null;

  const docCaiDat = (k, md) => { try { const v = localStorage.getItem(k); return v === null ? md : v; } catch (e) { return md; } };
  const ghiCaiDat = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* chặn lưu: chỉ hiệu lực trong phiên */ } };
  const laGiongViet = g => {
    if (!g) return false;
    const ma = (g.lang || "").replace("_", "-").toLowerCase(), ten = (g.name || "").toLowerCase();
    return ma.indexOf("vi") === 0 || ten.indexOf("viet") !== -1 || ten.indexOf("việt") !== -1;
  };

  /* Chọn giọng: giọng bé / phụ huynh tự chọn bên Cờ Vua -> giọng quản trị chọn -> giọng Việt bất kỳ */
  function quetGiong() {
    if (!coWebSpeech) return;
    const moi = window.speechSynthesis.getVoices() || [];
    if (!moi.length) return;
    dsGiong = moi;
    const tim = ten => (ten ? dsGiong.find(g => g.name === ten) : null) || null;
    giongChon = tim(docCaiDat(KHOA_TEN, "")) || tim(tenGiongQuanTri) || dsGiong.find(laGiongViet) || null;
  }

  function dungWatchdog() { if (watchdog) { clearInterval(watchdog); watchdog = null; } }
  /* Vá lỗi Chrome máy tính tự ngắt giọng sau ~15 giây: cứ 5 giây resume() một lần */
  function batWatchdog() {
    dungWatchdog();
    watchdog = setInterval(() => {
      if (coWebSpeech && window.speechSynthesis.speaking) window.speechSynthesis.resume();
      else dungWatchdog();
    }, 5000);
  }

  /* Mọi tầng đều đổ về đây -> khiNoiXong chạy đúng 1 lần, câu cũ đến muộn bị bỏ qua */
  function hoanTat(phien) {
    if (phien !== maPhien) return;
    maPhien++;
    if (henAnToan) { clearTimeout(henAnToan); henAnToan = null; }
    const ham = khiXongDangCho;
    khiXongDangCho = null;
    if (typeof ham === "function") ham();
  }

  function docBangMay(cau, phien) {
    if (!coWebSpeech) { hoanTat(phien); return; }
    try {
      window.speechSynthesis.cancel();
      // Chrome nuốt câu nếu speak() ngay sau cancel() -> lùi 80ms (bài học NC_03B)
      setTimeout(() => {
        if (phien !== maPhien) return;
        try {
          const loi = new SpeechSynthesisUtterance(cau);
          if (giongChon) { loi.voice = giongChon; loi.lang = giongChon.lang; } else loi.lang = "vi-VN";
          loi.rate = 0.95;
          loi.onend = loi.onerror = () => { dungWatchdog(); hoanTat(phien); };
          window.speechSynthesis.speak(loi);
          batWatchdog();
        } catch (e) { hoanTat(phien); }
      }, 80);
    } catch (e) { hoanTat(phien); }
  }

  function phatTep(duongDan, phien) {
    const link = duongDan ? String(duongDan).trim() : "";
    if (!link) { hoanTat(phien); return; }        // im lặng cũng là "nói xong"
    const phienTep = ++maPhienTep;
    try {
      if (!amTep) amTep = new Audio();
      amTep.pause();
      amTep.onerror = amTep.onended = () => { if (phienTep === maPhienTep) hoanTat(phien); };
      amTep.src = link;
      const hua = amTep.play();
      if (hua && hua.catch) hua.catch(() => { if (phienTep === maPhienTep) hoanTat(phien); });
    } catch (e) { hoanTat(phien); }
  }

  function docBangMang(cau, viTri, duongDan, phien) {
    if (phien !== maPhien) return;               // câu đã bị huỷ
    if (viTri >= NGUON_MANG.length) { mangHong = true; phatTep(duongDan, phien); return; }
    try {
      if (!amMang) amMang = new Audio();
      amMang.pause();
      amMang.onerror = () => docBangMang(cau, viTri + 1, duongDan, phien);
      amMang.onplaying = () => { nguonMang = viTri; mangHong = false; };
      amMang.onended = () => hoanTat(phien);
      amMang.src = NGUON_MANG[viTri].url(cau.length > 190 ? cau.substring(0, 190) : cau);
      const hua = amMang.play();
      if (hua && hua.catch) hua.catch(() => hoanTat(phien));   // trình duyệt chặn tự phát
    } catch (e) { docBangMang(cau, viTri + 1, duongDan, phien); }
  }

  const giong = VC.giong = {
    /* Gọi 1 lần khi trang mở: dò giọng + bỏ referrer (nguồn giọng mạng hay chặn trang lạ) */
    khoiDong() {
      if (daKhoiDong || typeof document === "undefined") return;
      daKhoiDong = true;
      if (!document.querySelector('meta[name="referrer"]')) {
        const m = document.createElement("meta");
        m.name = "referrer"; m.content = "no-referrer";
        document.head.appendChild(m);
      }
      if (coWebSpeech) {
        quetGiong();
        window.speechSynthesis.addEventListener("voiceschanged", quetGiong);
        setTimeout(quetGiong, 800);
        setTimeout(quetGiong, 2500);
      }
      // iOS / Android chỉ cho phát tiếng sau một thao tác của người dùng
      document.addEventListener("pointerdown", giong.moKhoa, { once: true, capture: true });
      document.addEventListener("keydown", giong.moKhoa, { once: true, capture: true });
    },
    /* Phát 1 âm câm + 1 câu rỗng ngay trong thao tác chạm đầu tiên để trình duyệt "cho phép" */
    moKhoa() {
      if (daMoKhoa) return;
      daMoKhoa = true;
      try {
        if (!amMang) amMang = new Audio();
        if (!amTep) amTep = new Audio();
        [amMang, amTep].forEach(a => { a.src = WAV_CAM; const h = a.play(); if (h && h.catch) h.catch(() => {}); });
      } catch (e) { /* bỏ qua */ }
      try {
        if (coWebSpeech) { const r = new SpeechSynthesisUtterance(" "); r.volume = 0; window.speechSynthesis.speak(r); }
      } catch (e) { /* bỏ qua */ }
    },
    datGiongQuanTri(ten) { tenGiongQuanTri = ten || ""; quetGiong(); },
    dangBat: () => docCaiDat(KHOA_BAT, "1") === "1",
    datBat(bat) { ghiCaiDat(KHOA_BAT, bat ? "1" : "0"); if (!bat) giong.dung(); },
    /* Dừng ngay mọi tiếng + huỷ khiNoiXong đang chờ (bé chạm bàn cờ, ván mới, tắt tiếng...) */
    dung() {
      maPhien++;
      khiXongDangCho = null;
      if (henAnToan) { clearTimeout(henAnToan); henAnToan = null; }
      try { if (coWebSpeech) window.speechSynthesis.cancel(); } catch (e) { /* bỏ qua */ }
      dungWatchdog();
      [amMang, amTep].forEach(a => {
        if (!a) return;
        try { a.onerror = a.onended = a.onplaying = null; a.pause(); } catch (e) { /* bỏ qua */ }
      });
      maPhienTep++;
    },
    /* Đọc 1 câu. duongDan = link MP3 của chính câu này (có thể trống). Tắt tiếng / không đọc được
       -> khiNoiXong chạy ngay, ván cờ không bao giờ đứng. */
    noi(cau, duongDan, khiNoiXong) {
      const xong = typeof khiNoiXong === "function" ? khiNoiXong : null;
      if (!cau || !giong.dangBat()) { if (xong) xong(); return; }
      giong.dung();
      const phien = ++maPhien;
      khiXongDangCho = xong;
      henAnToan = setTimeout(() => hoanTat(phien), Math.min(15000, 3000 + String(cau).length * 120));
      const kieu = docCaiDat(KHOA_KIEU, "tu_dong");
      if (kieu === "may") docBangMay(cau, phien);
      else if (kieu === "tep") phatTep(duongDan, phien);
      else if (kieu === "mang") docBangMang(cau, nguonMang, duongDan, phien);
      else if (coWebSpeech && laGiongViet(giongChon)) docBangMay(cau, phien);        // tầng 1
      else if (!mangHong && navigator.onLine !== false) docBangMang(cau, nguonMang, duongDan, phien); // tầng 2 (-> 3)
      else phatTep(duongDan, phien);                                                    // tầng 3 (-> 4)
    }
  };

  /* ================================================================
     2. LỜI ĐỘNG VIÊN
     ================================================================ */
  const MOC_MAC_DINH = { khenMoiNuocToiCap: 5, khenNuocTotToiCap: 9 };

  class LoiDongVien {
    /* macDinh: { loai: ["câu", ...] } - câu dự phòng khi bảng chưa có / mất mạng */
    constructor(troChoi, macDinh, ngauNhien) {
      this.troChoi = troChoi;
      this.macDinh = macDinh || {};
      this.ngauNhien = ngauNhien || Math.random;
      this.ds = [];
      this.moc = Object.assign({}, MOC_MAC_DINH);
      this.giongDocTen = "";
    }
    /* -> Promise<boolean>. Lỗi mạng thì giữ câu mặc định, không báo bé. */
    tai(goiRpc) {
      return Promise.resolve(goiRpc("kc_lay_loi_dong_vien", { p_tro_choi: this.troChoi })).then(r => {
        if (!r || !r.thanhCong) return false;
        this.napDuLieu(r);
        return true;
      }).catch(() => false);
    }
    napDuLieu(r) {
      this.ds = Array.isArray(r.loiDongVien) ? r.loiDongVien.filter(c => c && c.loai && c.noiDung) : [];
      for (const k of Object.keys(MOC_MAC_DINH)) {
        const n = Number(r[k]);
        if (Number.isFinite(n) && n >= 0) this.moc[k] = n;
      }
      this.giongDocTen = r.giongDocTen || "";
    }
    /* 1 câu ngẫu nhiên của loại đầu tiên có câu: bảng trước, rồi câu mặc định. -> {noiDung, duongDanAmThanh} | null */
    lay(cacLoai) {
      for (const loai of [].concat(cacLoai)) {
        const ds = this.ds.filter(c => c.loai === loai);
        if (ds.length) {
          const c = ds[Math.floor(this.ngauNhien() * ds.length)];
          const link = c.duongDanAmThanh ? String(c.duongDanAmThanh).trim() : "";
          return { noiDung: c.noiDung, duongDanAmThanh: link || null };
        }
      }
      for (const loai of [].concat(cacLoai)) {
        const ds = this.macDinh[loai];
        if (ds && ds.length) return { noiDung: ds[Math.floor(this.ngauNhien() * ds.length)], duongDanAmThanh: null };
      }
      return null;
    }
    /* Khen nước của BÉ. tinhHuong: "an_quan" | "chieu_tuong" | "nuoc_thuong" (nước tốt = 2 loại đầu) */
    chonKhen(cap, tinhHuong) {
      const tot = tinhHuong && tinhHuong !== "nuoc_thuong";
      if (cap <= this.moc.khenMoiNuocToiCap) return this.lay(tot ? [tinhHuong, "nuoc_thuong"] : ["nuoc_thuong"]);
      if (cap <= this.moc.khenNuocTotToiCap && tot) return this.lay([tinhHuong]);
      return null;
    }
    /* Sau nước của MÁY: bị chiếu (ưu tiên) / bị ăn quân -> động viên, chỉ cấp còn được khen */
    chonSauNuocMay(cap, biChieu, biAn) {
      if (cap > this.moc.khenNuocTotToiCap) return null;
      if (biChieu) return this.lay(["bi_chieu"]);
      if (biAn) return this.lay(["bi_an_quan"]);
      return null;
    }
  }
  VC.LoiDongVien = LoiDongVien;

  if (typeof module !== "undefined" && module.exports) module.exports = VC;
})(typeof window !== "undefined" ? window : globalThis);
// 22/10/2026 22:40 - BƯỚC: TC_03D
