// ================================================================
// FILE: dt/dt_quai_ban_do.js
// CHỨC NĂNG: LÕI QUÁI TRÊN BẢN ĐỒ của Đấu Trường Tri Thức (Thung Lũng). Không đụng DOM,
//            không đụng Three.js: chạy được trong node (kiểm thử), dùng chung cho trang + máy chủ giả.
//            TC_D06C1: QUÁI CHUNG NHIỀU BÉ. Máy chủ (SQL kc_dt_quai / máy chủ giả dt_may_chu.js) giữ mỗi
//            quái một bản ghi: chỗ ở, loại, cấp, "hạt" ngẫu nhiên, giờ sinh, ai đang giữ / đánh, lúc bỏ chạy.
//            Đường lang thang KHÔNG lưu ở máy chủ: mọi máy tính ra cùng một chỗ từ bản ghi + giờ máy chủ
//            (viTri), nên hai bé thấy cùng con quái ở cùng chỗ.
//            - lang thang: mỗi chuKyGiay giây quái chọn một điểm mới quanh chỗ ở (bán kính banKinhLangThang,
//              chọn theo hạt + số chu kỳ), đi tới rồi đứng; điểm phải nhìn thẳng thấy được từ chỗ ở (đường
//              thẳng đi được) nên quái luôn đi được: thẳng điểm cũ -> điểm mới, không thì vòng qua chỗ ở
//            - khoá (bé đang tới đánh / đang đánh): quái đứng yên ở chỗ máy chủ ghi
//            - bỏ chạy (thua trận): chạy theo hướng máy chủ ghi, mờ dần, hết chayGiay giây thì mất
//            - chọn chỗ sinh (chonCho): quái hoang xa cổng (khongGanCong), quái "quanh làng" trong vòng
//              [quanhLeu.tu, quanhLeu.den] ô quanh Lều trại; cách lều khác, cách quái khác (cachNhau)
//            - cấp (Lv) quái mới: 1..lvToiDa theo CẤP LÀNG CAO NHẤT trong vùng (người dùng 30/10/2026: làng cấp 1 -> quái
//              Lv 1-3, cấp 2 -> 1-6, cấp 3 -> 1-8, cấp 4 -> 1-10; cấp làng = cấp Lều trại đã dựng); trong khoảng đó càng xa
//              cổng càng mạnh + lệch ngẫu nhiên; màu khung so với Thủ lĩnh
//            Mọi con số đọc từ du_lieu/cau_hinh.json khối "quaiBanDo".
// HÀM KHAI RA (window.KC_DT_QUAI_BAN_DO):
//   viTri(ch, q, bay, diDuoc) -> { x, z, huong, trangThai: "dung" | "di" | "giu" | "danh" | "chay", mo (1 -> 0), mat }
//     q = bản ghi máy chủ { id, ma, lv, x, z (giữa ô chỗ ở), hat, sinhLuc, khoa?: { ten, x, z, trang: "toi" | "danh", luc },
//         chay?: { x, z, huong, luc } }; bay = giờ máy chủ (ms); diDuoc(ô x, ô y) -> bool (lõi trang / máy chủ giả)
//     mat = true: đã chạy khỏi bản đồ (không vẽ)
//   chonCho(the) -> { x, y (ô), lv } | null
//     the = { ch, W, H, diDuoc, cong: [{ x, z }], leu: [{ x, z }] (giữa các Lều trại), nha: [{ x, z }] (chỗ ở quái khác),
//             quanh?: { x, z } (Lều cần quái quanh làng; không có = quái hoang), capLang (cấp làng cao nhất vùng), rng () -> 0..1 }
//   chonLoai(ch, r) -> mã loại theo tỉ lệ; lvToiDa(ch, capLang); lvQuai(ch, capLang, kc tới cổng, r 0..1) -> lv;
//   mauKhung(ch, lvQuai, capThuLinh) -> "xanh" | "vang" | "do"; kcCong(cong, x, z)
// BƯỚC: TC_D06A; TC_D06C1 (quái chung: vị trí tính từ bản ghi máy chủ + giờ máy chủ, quái quanh làng)
// NGÀY: 30/10/2026; 30/10/2026 17:30
// ================================================================
(function (goc) {
  "use strict";

  // Lv cao nhất của quái theo cấp làng cao nhất trong vùng (người dùng 30/10/2026: làng cấp 1 -> quái 1-3, 2 -> 1-6, 3 -> 1-8, 4 -> 1-10)
  function lvToiDa(ch, capLang) {
    let m = ch.lvTheoCapLang[0][1];
    for (const [cap, lv] of ch.lvTheoCapLang) if ((capLang || 1) >= cap) m = lv;
    return m;
  }
  // Lv một quái mới: trong 1..lvToiDa, càng xa cổng càng mạnh (tới kcSauNhat ô là Lv cao nhất), lệch ngẫu nhiên ±lechLv
  function lvQuai(ch, capLang, kc, r) {
    const m = lvToiDa(ch, capLang), t = Math.min(1, Math.max(0, kc / ch.kcSauNhat));
    const lech = Math.round(((r == null ? 0.5 : r) * 2 - 1) * ch.lechLv);
    return Math.min(m, Math.max(1, 1 + Math.round(t * (m - 1)) + lech));
  }
  function mauKhung(ch, lvQuai, capTl) {
    const d = lvQuai - (capTl || 1);
    return d <= ch.mauKhung.xanhDenLech ? "xanh" : d <= ch.mauKhung.vangDenLech ? "vang" : "do";
  }
  function chonLoai(ch, r) {
    let tong = 0; for (const k in ch.loai) tong += ch.loai[k];
    let x = r * tong;
    for (const k in ch.loai) { x -= ch.loai[k]; if (x < 0) return k; }
    return Object.keys(ch.loai).pop();
  }
  const kcCong = (cong, x, z) => { let m = Infinity; for (const c of cong || []) m = Math.min(m, Math.hypot(c.x - x, c.z - z)); return m; };

  // Số ngẫu nhiên 0..1 cố định theo (hạt, chu kỳ, lần thử): mọi máy ra cùng một số
  function ngauNhien(hat, k, i) {
    let a = (hat ^ Math.imul(k + 1, 0x9E3779B1) ^ Math.imul(i + 1, 0x85EBCA77)) >>> 0;
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  // Đường thẳng từ (x0, z0) tới (x1, z1) đi được hết: xét MỌI ô đoạn thẳng đi qua (duyệt lưới, không sót góc ô)
  function thongDuong(diDuoc, x0, z0, x1, z1) {
    let ox = Math.floor(x0), oz = Math.floor(z0);
    const ex = Math.floor(x1), ez = Math.floor(z1), dx = x1 - x0, dz = z1 - z0;
    const bx = dx > 0 ? 1 : -1, bz = dz > 0 ? 1 : -1;
    const tdx = dx !== 0 ? Math.abs(1 / dx) : Infinity, tdz = dz !== 0 ? Math.abs(1 / dz) : Infinity;
    let tx = dx !== 0 ? (dx > 0 ? ox + 1 - x0 : x0 - ox) * tdx : Infinity;
    let tz = dz !== 0 ? (dz > 0 ? oz + 1 - z0 : z0 - oz) * tdz : Infinity;
    if (!diDuoc(ox, oz)) return false;
    for (let n = 0; n < 64 && (ox !== ex || oz !== ez); n++) {
      if (tx < tz) { ox += bx; tx += tdx; } else if (tz < tx) { oz += bz; tz += tdz; }
      else { if (!diDuoc(ox + bx, oz) || !diDuoc(ox, oz + bz)) return false; ox += bx; oz += bz; tx += tdx; tz += tdz; } // qua đúng góc: hai ô bên cũng phải đi được
      if (!diDuoc(ox, oz)) return false;
    }
    return true;
  }
  // Điểm đứng của chu kỳ k (k < 0: chỗ ở). Điểm nhìn thẳng thấy từ chỗ ở; thử 4 lần, không được thì về chỗ ở
  function diem(ch, q, k, diDuoc) {
    if (k < 0) return { x: q.x, z: q.z };
    for (let i = 0; i < 4; i++) {
      const g = ngauNhien(q.hat, k, 2 * i) * Math.PI * 2, r = 1 + ngauNhien(q.hat, k, 2 * i + 1) * (ch.banKinhLangThang - 1);
      const x = q.x + Math.cos(g) * r, z = q.z + Math.sin(g) * r;
      if (thongDuong(diDuoc, q.x, q.z, x, z)) return { x, z };
    }
    return { x: q.x, z: q.z };
  }

  function viTri(ch, q, bay, diDuoc) {
    if (q.chay) {
      const t = Math.max(0, (bay - q.chay.luc) / 1000);
      if (t >= ch.chayGiay) return { x: q.chay.x, z: q.chay.z, huong: q.chay.huong, trangThai: "chay", mo: 0, mat: true };
      const s = ch.tocDoChay * t;
      return { x: q.chay.x + Math.sin(q.chay.huong) * s, z: q.chay.z + Math.cos(q.chay.huong) * s, huong: q.chay.huong, trangThai: "chay", mo: 1 - t / ch.chayGiay, mat: false };
    }
    if (q.khoa) return { x: q.khoa.x, z: q.khoa.z, huong: null, trangThai: q.khoa.trang === "danh" ? "danh" : "giu", mo: 1, mat: false };
    const T = ch.chuKyGiay, tong = Math.max(0, (bay - q.sinhLuc) / 1000);
    const k = Math.floor(tong / T), tk = tong - k * T;
    const A = diem(ch, q, k - 1, diDuoc), B = diem(ch, q, k, diDuoc);
    // đường: thẳng A -> B, không thì vòng qua chỗ ở (hai đoạn đều nhìn thẳng thấy từ chỗ ở)
    const duong = thongDuong(diDuoc, A.x, A.z, B.x, B.z) ? [A, B] : [A, { x: q.x, z: q.z }, B];
    let L = 0; for (let i = 1; i < duong.length; i++) L += Math.hypot(duong[i].x - duong[i - 1].x, duong[i].z - duong[i - 1].z);
    const huongCuoi = () => { // hướng đoạn cuối có độ dài (đứng: nhìn theo hướng vừa đi)
      for (let i = duong.length - 1; i > 0; i--) { const a = duong[i - 1], b = duong[i]; if (Math.hypot(b.x - a.x, b.z - a.z) > 1e-3) return Math.atan2(b.x - a.x, b.z - a.z); }
      return ngauNhien(q.hat, k, 9) * Math.PI * 2;
    };
    const giayDi = Math.min(L / ch.tocDo, T * ch.diToiDa); // đường dài thì đi nhanh hơn chút, chu kỳ nào cũng có lúc đứng
    if (L < 1e-3 || tk >= giayDi) return { x: B.x, z: B.z, huong: huongCuoi(), trangThai: "dung", mo: 1, mat: false };
    let s = L * tk / giayDi;
    for (let i = 1; i < duong.length; i++) {
      const a = duong[i - 1], b = duong[i], l = Math.hypot(b.x - a.x, b.z - a.z);
      if (s <= l || i === duong.length - 1) {
        const f = l > 0 ? Math.min(1, s / l) : 1;
        return { x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f, huong: Math.atan2(b.x - a.x, b.z - a.z), trangThai: "di", mo: 1, mat: false };
      }
      s -= l;
    }
    return { x: B.x, z: B.z, huong: huongCuoi(), trangThai: "dung", mo: 1, mat: false };
  }

  function chonCho(the) {
    const ch = the.ch, rng = the.rng || Math.random, ql = ch.quanhLeu;
    for (let lan = 0; lan < ch.lanThuSinh; lan++) {
      let ox, oy;
      if (the.quanh) {
        const g = rng() * Math.PI * 2, r = ql.tu + rng() * (ql.den - ql.tu);
        ox = Math.floor(the.quanh.x + Math.cos(g) * r); oy = Math.floor(the.quanh.z + Math.sin(g) * r);
      } else { ox = Math.floor(rng() * the.W); oy = Math.floor(rng() * the.H); }
      if (ox < 0 || oy < 0 || ox >= the.W || oy >= the.H || !the.diDuoc(ox, oy)) continue;
      const x = ox + 0.5, z = oy + 0.5, kc = kcCong(the.cong, x, z);
      if (!the.quanh && kc < ch.khongGanCong) continue;
      if ((the.leu || []).some(l => Math.hypot(l.x - x, l.z - z) < ql.tu)) continue;
      if ((the.nha || []).some(n => Math.hypot(n.x - x, n.z - z) < ch.cachNhau)) continue;
      return { x: ox, y: oy, lv: lvQuai(ch, the.capLang, kc, rng()) };
    }
    return null; // thung lũng chật: máy chủ thử lại sau thuLaiGiay
  }

  goc.KC_DT_QUAI_BAN_DO = { viTri, chonCho, chonLoai, lvToiDa, lvQuai, mauKhung, kcCong, ngauNhien };
})(typeof window !== "undefined" ? window : globalThis);
// 30/10/2026 17:30 - BƯỚC: TC_D06C1
