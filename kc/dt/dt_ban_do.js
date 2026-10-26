// ================================================================
// FILE: dt/dt_ban_do.js
// CHỨC NĂNG: LÕI BẢN ĐỒ CHUNG của Đấu Trường Tri Thức (đặc tả: repo_rieng
//            dau_truong_tri_thuc/dac_ta_ban_do.md). Không đụng DOM, không đụng Three.js:
//            chạy được trong node (kiểm thử), trên máy bé VÀ ở máy chủ (bản giả dt_may_chu.js;
//            Supabase từ TC_D02B3 tính lại đúng các luật này).
//            - Sương mù 3 mức riêng từng bé (mục 3): ĐEN chưa khám phá / MỜ đã khám phá /
//              SÁNG trong tầm nhìn đơn vị + công trình của phe bé. Mặt nạ đã khám phá 128 x 128
//              = 2 KB, gửi đi dạng chữ base64; gộp kiểu "chỉ thêm, không bớt"
//            - Tầm nhìn theo loại đơn vị / công trình, Tiên tộc nhìn xa hơn (cau_hinh.json banDo)
//            - Ô xây được: đủ 5 điều kiện mục 4, lý do không xây được là câu cho bé
//            - Vị trí tính từ "lệnh" (mục 7): hai máy cùng lệnh ra cùng vị trí
//            - Lọc đơn vị đối thủ: chỉ thấy trong vùng sáng (mục 3, 8)
//            MỌI CON SỐ đọc từ cau_hinh.json (khối "banDo"), không viết cứng.
// HÀM KHAI RA (goc.KC_DT_BAN_DO):
//   DEN, MO, SANG; tamNhin(chBanDo, loai, chungLoai) -> số ô
//   taoSuongMu(W, H) -> { muc(x, y), soi([{x, z, r}]) -> đổi?, khamPha(x, z, r), xuat(), nap(chuỗi),
//        demDaKham(), sang, daKham, phienBan }
//   oXayDuoc(the, x, y) / oXayDuocVung(the, x, y, rong, sau) -> { duoc, lyDo, ma, oHong[] }
//        the = { lang, suong?, coCongTrinh?(x, y), coDoiThu?(x, y), laLanhDiaDoiThu?(x, y) }
//   viTriTuLenh(lang, lenh, bayGio) -> { x, z, huong, xong }
//   locDonViThayDuoc(dsDonVi, cungPhe(chu), suong, viTri(dv)) -> đơn vị bé được thấy
// BƯỚC: TC_D02B2a
// NGÀY: 26/10/2026
// PHỤ THUỘC: dt/dt_luoi.js (KC_DT_LUOI); tham số lang là lõi dt/dt_lang.js
// ================================================================
(function (goc) {
  "use strict";
  const DEN = 0, MO = 1, SANG = 2;

  function tamNhin(chBanDo, loai, chungLoai) {
    const r = chBanDo.tamNhin[loai];
    if (r == null) return 0;
    return r + (chungLoai === "tien" ? chBanDo.themTien : 0);
  }

  // ---------------- Sương mù ----------------
  function taoSuongMu(W, H) {
    const N = W * H, daKham = new Uint8Array(N), sang = new Uint8Array(N), dau = new Uint32Array(N);
    let dsSang = [], luot = 0, phienBan = 0;
    const trongBan = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
    // Gọi f(chỉ số ô) cho mọi ô có tâm cách (cx, cz) không quá r
    function quetVong(cx, cz, r, f) {
      const r2 = r * r;
      for (let y = Math.floor(cz - r); y <= cz + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        if (!trongBan(x, y)) continue;
        const dx = x + 0.5 - cx, dz = y + 0.5 - cz;
        if (dx * dx + dz * dz <= r2) f(y * W + x);
      }
    }
    // Soi lại toàn bộ vùng sáng từ danh sách nguồn soi [{x, z, r}]. Trả true nếu có ô đổi mức.
    function soi(dsNguon) {
      if (++luot === 0xffffffff) { dau.fill(0); luot = 1; }
      const moi = [];
      let doi = false;
      for (const s of dsNguon) quetVong(s.x, s.z, s.r, i => {
        if (dau[i] === luot) return;
        dau[i] = luot; moi.push(i);
        if (!sang[i] || !daKham[i]) doi = true;
      });
      if (moi.length !== dsSang.length) doi = true;
      for (const i of dsSang) sang[i] = 0;
      for (const i of moi) { sang[i] = 1; daKham[i] = 1; }
      dsSang = moi;
      if (doi) phienBan++;
      return doi;
    }
    function khamPha(cx, cz, r) {
      let doi = false;
      quetVong(cx, cz, r, i => { if (!daKham[i]) { daKham[i] = 1; doi = true; } });
      if (doi) phienBan++;
      return doi;
    }
    const muc = (x, y) => !trongBan(x, y) ? DEN : sang[y * W + x] ? SANG : daKham[y * W + x] ? MO : DEN;
    // Mặt nạ đã khám phá: 1 bit / ô -> chữ base64 (128 x 128 ô = 2 KB = ~2,7 nghìn chữ)
    function xuat() {
      const b = new Uint8Array(Math.ceil(N / 8));
      for (let i = 0; i < N; i++) if (daKham[i]) b[i >> 3] |= 1 << (i & 7);
      let s = ""; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
      return btoa(s);
    }
    // Gộp thêm mặt nạ (chỉ thêm, không bớt). Chuỗi hỏng / sai cỡ thì bỏ qua, trả false.
    function nap(chuoi) {
      if (!chuoi) return false;
      let s;
      try { s = atob(chuoi); } catch (e) { return false; }
      if (s.length !== Math.ceil(N / 8)) return false;
      let doi = false;
      for (let i = 0; i < N; i++) if (s.charCodeAt(i >> 3) & (1 << (i & 7)) && !daKham[i]) { daKham[i] = 1; doi = true; }
      if (doi) phienBan++;
      return true;
    }
    function demDaKham() { let n = 0; for (let i = 0; i < N; i++) n += daKham[i]; return n; }
    return { W, H, daKham, sang, muc, soi, khamPha, xuat, nap, demDaKham, get phienBan() { return phienBan; } };
  }

  // ---------------- Ô xây được (mục 4) ----------------
  const LY_DO = {
    ngoai: () => "Chỗ này ra ngoài thung lũng rồi.",
    suong: () => "Chỗ này còn sương mù. Con cho người đi khám phá trước nhé!",
    nuoc: () => "Không xây trên nước được con ạ.",
    cau: () => "Cầu là lối đi, không xây lên được.",
    nguon: ten => "Còn " + ten + " ở đây. Lấy hết rồi mới xây được.",
    cong_trinh: () => "Chỗ này có nhà rồi.",
    doi_thu: () => "Có người của bạn khác đang đứng đây.",
    lanh_dia: () => "Đây là lãnh địa của bạn khác, con xây chỗ khác nhé."
  };
  function oXayDuoc(the, x, y) {
    const l = the.lang;
    const khong = (ma, ten) => ({ duoc: false, ma, lyDo: LY_DO[ma](ten) });
    if (x < 0 || y < 0 || x >= l.W || y >= l.H) return khong("ngoai");
    if (the.suong && the.suong.muc(x, y) === DEN) return khong("suong");          // 1. đã khám phá
    const i = l.chiSo(x, y);
    if (l.laCau[i]) return khong("cau");                                           // 3. không cầu
    const n = l.nguonTaiO(x, y);
    if (n && l.dangSong(n)) return khong("nguon", l.CH.nguon[n.loai].ten.toLowerCase()); // 3. không nguồn còn trữ lượng
    if (l.nuoc[i]) return khong("nuoc");                                           // 3. không suối, hồ
    // 2. còn lại là cỏ / đất / gốc cây hết gỗ / mầm cây (gốc + mầm tự xoá khi đặt móng)
    if (l.danh[i] || (the.coCongTrinh && the.coCongTrinh(x, y))) return khong("cong_trinh"); // 4. không đè công trình
    if (the.coDoiThu && the.coDoiThu(x, y)) return khong("doi_thu");               // 4. không đè đơn vị đối thủ
    if (the.laLanhDiaDoiThu && the.laLanhDiaDoiThu(x, y)) return khong("lanh_dia"); // 5. không trong lãnh địa đối thủ
    return { duoc: true, ma: "duoc", lyDo: "" };
  }
  // Cả móng rong x sau ô, góc trên-trái ở ô (x, y). Báo lý do của ô hỏng đầu tiên + mọi ô hỏng.
  function oXayDuocVung(the, x, y, rong, sau) {
    let dau = null; const oHong = [];
    for (let oy = y; oy < y + sau; oy++) for (let ox = x; ox < x + rong; ox++) {
      const k = oXayDuoc(the, ox, oy);
      if (!k.duoc) { oHong.push({ x: ox, y: oy }); if (!dau) dau = k; }
    }
    return dau ? { duoc: false, ma: dau.ma, lyDo: dau.lyDo, oHong } : { duoc: true, ma: "duoc", lyDo: "", oHong };
  }

  // ---------------- Vị trí tính từ lệnh (mục 7) ----------------
  // lenh = { tu: [x, z], den: [ô x, ô y], batDau: ms, vaiTro }. Cùng đường đi (A* + kéo thẳng
  // của dt_luoi.js) và cùng luật tốc độ với dt_lang.js: Thủ lĩnh chạy khi còn xa hơn
  // tocDo.chayKhiXaHon ô, gần thì đi bộ; nông dân luôn đi bộ.
  function viTriTuLenh(lang, lenh, bayGio) {
    const LUOI = goc.KC_DT_LUOI, T = lang.CH.tocDo;
    const [x0, z0] = lenh.tu;
    const tu = LUOI.oCuaDiem(x0, z0), den = { x: lenh.den[0], y: lenh.den[1] };
    const d = LUOI.timDuong(lang.luoi, tu, den, lang.laVung); // cùng cách lenhDi của dt_lang.js
    const diem = [{ x: x0, z: z0 }, ...((d && LUOI.lamMuot(lang.luoi, tu, d)) || []).map(c => ({ x: c.x + 0.5, z: c.y + 0.5 }))];
    let L = 0; for (let i = 1; i < diem.length; i++) L += Math.hypot(diem[i].x - diem[i - 1].x, diem[i].z - diem[i - 1].z);
    const t = Math.max(0, (bayGio - lenh.batDau) / 1000);
    let s;
    if (lenh.vaiTro === "thu_linh" && L > T.chayKhiXaHon) {
      const t1 = (L - T.chayKhiXaHon) / T.chay;
      s = t <= t1 ? t * T.chay : (L - T.chayKhiXaHon) + (t - t1) * T.di;
    } else s = t * T.di;
    if (s >= L || diem.length < 2) { const c = diem[diem.length - 1], b = diem[Math.max(0, diem.length - 2)]; return { x: c.x, z: c.z, huong: Math.atan2(c.x - b.x, c.z - b.z) || 0, xong: true }; }
    for (let i = 1; i < diem.length; i++) {
      const a = diem[i - 1], b = diem[i], k = Math.hypot(b.x - a.x, b.z - a.z);
      if (s <= k) { const f = k ? s / k : 0; return { x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f, huong: Math.atan2(b.x - a.x, b.z - a.z), xong: false }; }
      s -= k;
    }
    const c = diem[diem.length - 1]; return { x: c.x, z: c.z, huong: 0, xong: true };
  }

  // ---------------- Lọc đơn vị bé được thấy (mục 3, 8) ----------------
  // Phe mình (bản thân + đồng minh) luôn thấy; đối thủ chỉ khi đứng trong ô SÁNG của phe mình.
  function locDonViThayDuoc(dsDonVi, cungPhe, suong, viTri) {
    return dsDonVi.filter(dv => {
      if (cungPhe(dv.chu)) return true;
      const p = viTri(dv);
      return suong.muc(Math.floor(p.x), Math.floor(p.z)) === SANG;
    });
  }

  goc.KC_DT_BAN_DO = { DEN, MO, SANG, tamNhin, taoSuongMu, oXayDuoc, oXayDuocVung, viTriTuLenh, locDonViThayDuoc, LY_DO };
})(typeof window !== "undefined" ? window : globalThis);
// 26/10/2026 22:05 - BƯỚC: TC_D02B2a
