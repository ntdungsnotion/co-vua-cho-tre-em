// ================================================================
// FILE: dt/dt_sinh_tieng_anh.js
// CHỨC NĂNG: BỘ SINH CÂU TIẾNG ANH của Đấu Trường Tri Thức (Ke_Hoach_Dau_Truong.md mục 7), sinh từ
//            kho từ dùng chung toàn app kc/tu_vung/kho_tu.json (3.000 từ, cấp 1-4). Không đụng DOM:
//            chạy được trong node (kiểm thử) và trên máy bé.
//            - 5 dạng: HINH nhìn hình chọn từ, NGHE nghe đọc chọn từ, NGHIA từ -> nghĩa, TU nghĩa -> từ,
//              DIEN điền chữ cái thiếu. Dạng có hình chỉ dùng từ có emoji / hình riêng; từ chưa có hình
//              chỉ vào dạng câu chữ.
//            - Mức theo độ giống của đáp án nhiễu: Dễ = khác chủ đề; Vừa = cùng chủ đề; Khó = viết gần
//              giống (three / tree). Điền chữ: Dễ thiếu 1 nguyên âm, Vừa thiếu 1 phụ âm, Khó thiếu 2 chữ liền.
//            - Đáp án nhiễu: cùng cấp, không trùng nghĩa (tách "to, lớn" thành từng nghĩa), không trùng hình;
//              điền chữ không tạo ra một từ khác có trong kho.
//            - Điểm độ khó (diemDoKho) = tiengAnh.batDauCap[cấp] + tiengAnh.mucCong[mức] theo THANG LỚP
//              (cau_hinh_trinh_do.json), để mỗi cấp trải 2 lớp và bộ chọn độ khó dùng chung với Toán.
//            Cùng hạt ngẫu nhiên -> cùng câu (mã câu: TA<cấp>-<DẠNG>-<mức>-<hạt>).
// CÁCH DÙNG: const ng = KC_DT_SINH_TA.tao(duLieuKhoTu, cauHinhTrinhDo)  -> nguồn câu "tieng_anh" cho dt_cau_hoi.js
// BƯỚC: TC_D04B
// NGÀY: 29/10/2026
// PHỤ THUỘC: dt/dt_trinh_do.js (KC_DT_TRINH_DO: rngHat, cauHinh)
// ================================================================
(function (goc) {
  "use strict";
  const DANG_TEN = {
    HINH: "Nhìn hình chọn từ", NGHE: "Nghe đọc chọn từ", NGHIA: "Từ ra nghĩa", TU: "Nghĩa ra từ", DIEN: "Điền chữ cái thiếu"
  };
  const CO_HINH = { HINH: true };
  // Chủ đề trừu tượng: hình emoji dễ hiểu sai (👴 = "old" hay "grandfather"?) -> không vào dạng nhìn hình
  const TRUU_TUONG = ["tinh_chat", "hanh_dong", "khac", "thoi_gian", "cam_xuc"];
  // Từ đọc giống nhau: không cho cùng một câu NGHE (nghe "sea" thì "see" cũng đúng)
  const DONG_AM = [["sea", "see"], ["two", "too", "to"], ["right", "write"], ["night", "knight"], ["eye", "i"], ["son", "sun"],
    ["flower", "flour"], ["hear", "here"], ["meat", "meet"], ["pair", "pear"], ["road", "rode"], ["tail", "tale"], ["week", "weak"],
    ["blue", "blew"], ["one", "won"], ["sale", "sail"], ["bear", "bare"], ["hole", "whole"], ["mail", "male"], ["plain", "plane"],
    ["knew", "new"], ["know", "no"], ["for", "four"], ["by", "buy", "bye"], ["their", "there"], ["wood", "would"], ["hour", "our"],
    ["dear", "deer"], ["piece", "peace"], ["red", "read"], ["steal", "steel"], ["stair", "stare"], ["wait", "weight"], ["ate", "eight"]];
  const dongAm = {};
  DONG_AM.forEach(nhom => nhom.forEach(a => { dongAm[a] = nhom; }));
  const MA_MUC = { de: "D", vua: "V", kho: "K" };
  // Tên chủ đề (cột cd của kho từ) để hiện cho người đọc; mã lạ thì hiện mã
  const TEN_CHU_DE = {
    khac: "Từ khác", hanh_dong: "Hành động", tinh_chat: "Tính chất", do_vat: "Đồ vật", con_vat: "Con vật", noi_chon: "Nơi chốn",
    thien_nhien: "Thiên nhiên", truong_hoc: "Trường học", do_an: "Đồ ăn", cay_hoa: "Cây hoa", nha_cua: "Nhà cửa", the_thao: "Thể thao",
    giao_thong: "Giao thông", co_the: "Cơ thể", nghe_nghiep: "Nghề nghiệp", cam_xuc: "Cảm xúc", thoi_gian: "Thời gian", so_dem: "Số đếm",
    am_nhac: "Âm nhạc", quan_ao: "Quần áo", con_nguoi: "Con người", mau_sac: "Màu sắc", gia_dinh: "Gia đình", thoi_tiet: "Thời tiết"
  };
  const NGUYEN_AM = "aeiou";
  const PHU_AM = "bcdfghklmnprstvwy";

  const chon = (r, ds) => ds[Math.floor(r() * ds.length)];
  function tron(r, ds) {
    const a = ds.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  // Khoảng cách sửa chữ (Levenshtein) để tìm từ viết gần giống
  function khoangCach(a, b) {
    const d = [];
    for (let i = 0; i <= a.length; i++) { d[i] = [i]; }
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  const nghiaCua = vi => vi.toLowerCase().split(/\s*[,;/]\s*/).filter(Boolean);

  function tao(duLieu, chTrinhDo) {
    const TD = goc.KC_DT_TRINH_DO;
    const ch = TD.cauHinh(chTrinhDo);
    const ta = ch.tiengAnh;
    const tu = [], theoCap = { 1: [], 2: [], 3: [], 4: [] }, coEn = new Set();
    (duLieu && duLieu.tu || []).forEach(t => {
      if (!t || !t.en || !t.vi || !theoCap[t.cap] || !/^[a-z]+$/i.test(t.en)) return;
      const w = { en: t.en.toLowerCase(), vi: t.vi.trim(), nghia: nghiaCua(t.vi), e: t.e || "", hinh: t.hinh || "", cap: t.cap, cd: t.cd || "khac" };
      w.coHinh = !!(w.e || w.hinh) && TRUU_TUONG.indexOf(w.cd) < 0;
      tu.push(w); theoCap[t.cap].push(w); coEn.add(w.en);
    });
    const SO_CAP = [1, 2, 3, 4].filter(c => theoCap[c].length >= 8);

    const diem = (cap, muc) => ta.batDauCap[cap - 1] + ta.mucCong[muc];
    const DANG = [];
    SO_CAP.forEach(cap => Object.keys(DANG_TEN).forEach(f => DANG.push({ ma: f + cap, dang: f, cap, lop: Math.floor(diem(cap, "de")), chuDe: null, ten: DANG_TEN[f] + " (cấp " + cap + ")" })));
    function dsMuc() {
      const kq = [];
      SO_CAP.forEach(cap => ["de", "vua", "kho"].forEach(muc => { const d = diem(cap, muc); kq.push({ lop: Math.floor(d), muc, doKho: d, cap }); }));
      return kq;
    }
    const dangCho = m => DANG.filter(d => d.cap === m.cap);
    const coChuDe = cd => typeof cd === "string" && cd.indexOf("ta_") === 0;
    const xungDot = (a, b) => a === b || a.en === b.en || (a.e && a.e === b.e) || a.nghia.some(n => b.nghia.indexOf(n) >= 0) ||
      (dongAm[a.en] && dongAm[a.en].indexOf(b.en) >= 0);
    const hinhCua = w => w.hinh ? "tu_vung/hinh/" + w.hinh : "";

    // 3 đáp án nhiễu theo mức; hien(w) = chữ hiện trên nút; trả null nếu không đủ
    function nhieu(r, w, ung, muc, hien) {
      let ds = ung.filter(x => !xungDot(x, w));
      if (muc === "de") { const khac = ds.filter(x => x.cd !== w.cd); if (khac.length >= 3) ds = khac; }
      else if (muc === "vua") { const cung = ds.filter(x => x.cd === w.cd && w.cd !== "khac"); if (cung.length >= 3) ds = cung; }
      else {
        ds = ds.map(x => [x, khoangCach(x.en, w.en) - (x.en[0] === w.en[0] ? 0.5 : 0)]).sort((a, b) => a[1] - b[1]).slice(0, 10).map(a => a[0]);
      }
      const kq = [], daChon = [], daCo = [hien(w)];
      for (const x of tron(r, ds)) {
        if (kq.length === 3) break;
        if (daChon.some(y => xungDot(x, y))) continue; // hai đáp án nhiễu cũng không trùng nghĩa / hình
        const s = hien(x);
        if (daCo.indexOf(s) >= 0) continue;
        daCo.push(s); kq.push(s); daChon.push(x);
      }
      return kq.length === 3 ? kq : null;
    }

    // Điền chữ: chỗ thiếu + 4 lựa chọn; chữ điền vào không được tạo ra từ khác có trong kho
    function dien(r, w, muc) {
      const en = w.en;
      if (en.length < (muc === "kho" ? 4 : 3)) return null;
      const vt = [];
      for (let i = 0; i < en.length; i++) {
        if (muc === "de" && NGUYEN_AM.indexOf(en[i]) >= 0) vt.push(i);
        if (muc === "vua" && PHU_AM.indexOf(en[i]) >= 0) vt.push(i);
        if (muc === "kho" && i > 0 && i < en.length - 1) vt.push(i);
      }
      if (!vt.length) return null;
      const i = chon(r, vt), dai = muc === "kho" ? 2 : 1;
      const dung = en.substr(i, dai);
      if (dung.length < dai) return null;
      const bang = muc === "de" ? NGUYEN_AM : muc === "vua" ? PHU_AM : null;
      const ung = new Set();
      for (let lan = 0; ung.size < 12 && lan < 200; lan++) {
        let s;
        if (bang) s = chon(r, bang.split(""));
        else s = r() < 0.5 ? dung[1] + dung[0] : (r() < 0.5 ? dung[0] : chon(r, (NGUYEN_AM + PHU_AM).split(""))) + (r() < 0.5 ? dung[1] : chon(r, (NGUYEN_AM + PHU_AM).split("")));
        if (s === dung) continue;
        const thanh = en.slice(0, i) + s + en.slice(i + dai);
        if (coEn.has(thanh)) continue; // điền vào ra một từ khác cũng đúng
        ung.add(s);
      }
      const ds = [...ung].slice(0, 3);
      if (ds.length < 3) return null;
      const an = en.split("").map((c, k) => k >= i && k < i + dai ? "_" : c).join(" ");
      return { an, dung, nhieu: ds };
    }

    function taoCau(ma, muc, hat, chuDe) {
      const dg = DANG.find(d => d.ma === ma);
      if (!dg) return null;
      for (let lan = 0; lan < 30; lan++) {
        const h = ((hat >>> 0) + lan * 7919) >>> 0;
        const r = TD.rngHat(h);
        let ung = theoCap[dg.cap];
        if (CO_HINH[dg.dang]) ung = ung.filter(x => x.coHinh);
        let pool = chuDe ? ung.filter(x => "ta_" + x.cd === chuDe) : ung;
        if (!pool.length) return null;
        const w = chon(r, pool);
        let nd, hinhChu = "", hinh = "", amThanh = "", dung, ds, lg;
        const giai = w.en + " = " + w.vi + (w.e ? " " + w.e : "");
        if (dg.dang === "HINH") {
          nd = "Đây là gì?"; hinhChu = w.e; hinh = hinhCua(w);
          dung = w.en; ds = nhieu(r, w, ung, muc, x => x.en); lg = giai + ".";
        } else if (dg.dang === "NGHE") {
          nd = "🔊 Nghe và chọn từ đúng"; amThanh = "doc:en:" + w.en;
          dung = w.en; ds = nhieu(r, w, ung, muc, x => x.en); lg = "Từ vừa đọc là " + giai + ".";
        } else if (dg.dang === "NGHIA") {
          nd = "“" + w.en + "” nghĩa là gì?";
          dung = w.vi; ds = nhieu(r, w, ung, muc, x => x.vi); lg = giai + ".";
        } else if (dg.dang === "TU") {
          nd = "“" + w.vi + "” trong tiếng Anh là gì?"; if (muc === "de") hinhChu = w.e;
          dung = w.en; ds = nhieu(r, w, ung, muc, x => x.en); lg = giai + ".";
        } else {
          const d = dien(r, w, muc);
          if (!d) continue;
          nd = "Điền chữ còn thiếu: " + d.an + "  (" + w.vi + ")"; hinhChu = w.e;
          dung = d.dung; ds = d.nhieu; lg = "Từ đúng: " + w.en + " (" + w.vi + "), chữ thiếu là “" + d.dung + "”.";
        }
        if (!ds) continue;
        const vt = Math.floor(r() * 4), dapAn = tron(r, ds);
        dapAn.splice(vt, 0, dung);
        const dk = diem(dg.cap, muc);
        return {
          ma: "TA" + dg.cap + "-" + dg.dang + "-" + MA_MUC[muc] + "-" + h,
          mon: "tieng_anh", lop: Math.floor(dk), diemDoKho: dk, capTu: dg.cap, chuDe: "ta_" + w.cd, dang: "trac_nghiem", doKho: muc,
          noiDung: nd, hinh, hinhChu, amThanh, tuGoc: w.en,
          dapAn, dung: [vt], loiGiai: lg, nguon: "sinh", trangThai: "xuat_ban"
        };
      }
      return null;
    }

    return { mon: "tieng_anh", DANG, dsMuc, dangCho, coChuDe, taoCau, soTu: tu.length, soTuCoHinh: tu.filter(x => x.coHinh).length };
  }

  goc.KC_DT_SINH_TA = { tao, khoangCach, nghiaCua, DANG_TEN, TEN_CHU_DE };
})(typeof window !== "undefined" ? window : globalThis);
// 29/10/2026 - BƯỚC: TC_D04B
