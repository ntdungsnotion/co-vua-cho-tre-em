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
//   viTriTuLenh(lang, lenh, bayGio, nho?) -> { x, z, huong, xong, chay? }
//   locDonViThayDuoc(dsDonVi, cungPhe(chu), suong, viTri(dv)) -> đơn vị bé được thấy
//   timBienKhamPha(lang, suong, x, z, tranh?, cachNhau?) -> ô mép vùng đen gần nhất | null
//   (TC_D02C) tamNhinCt(chBanDo, loaiCongTrinh, chungLoai); LA_RAO { tuong, cong };
//   tinhLanhDia(W, H, [chỉ số ô rào]) -> Uint8Array | null (mục 5: loang từ ngoài vào, chỉ rào của bé là kín);
//   taoBoLanhDia(W, H) -> { dat(chu, x, y, rong, sau, co), cua(chu), chuO(x, y, tru), soO(chu) };
//   doanTuong(ôA, ôB, toiDa) -> [ô] thẳng ngang / dọc; choCong(x, y, rong, sau, laTuongMinh) -> { x, y, rong, sau, xoay }
//   the.deLen?(x, y) của oXayDuoc: ô có công trình mà vẫn xây đè được (cổng đè tường của chính bé)
// BƯỚC: TC_D02B2a; TC_D02B2b (timBienKhamPha); TC_D02B3b (viTriTuLenh nhớ đường, báo chạy);
//       TC_D02C (lãnh địa, đoạn tường, chỗ cổng, tầm nhìn công trình, viTriTuLenh theo chủ qua cổng)
// NGÀY: 26/10/2026; 27/10/2026; 27/10/2026 20:55; 28/10/2026 00:05
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
  // Tầm nhìn công trình (TC_D02C): loại có số riêng (lều, tháp canh, tường, cổng), còn lại như "nha"
  const tamNhinCt = (chBanDo, loai, chungLoai) => tamNhin(chBanDo, chBanDo.tamNhin[loai] != null ? loai : "nha", chungLoai);

  // ---------------- Lãnh địa (mục 5; TC_D02C) ----------------
  const LA_RAO = { tuong: true, cong: true };
  // Loang 4 hướng từ ngoài vào qua mọi ô KHÔNG phải rào của bé (suối, hồ, mép bản đồ không tính là kín;
  // 4 hướng khớp luật "không cắt góc" của đường đi: tường chéo vẫn kín). Chỉ loang trong khung bao quanh
  // rào nở thêm 1 ô: ngoài khung chắc chắn là ngoài. rao = mảng chỉ số ô (tường + cổng đã dựng xong).
  // Trả Uint8Array W x H (1 = trong lãnh địa, không gồm chính ô rào) hoặc null nếu không khép được ô nào.
  function tinhLanhDia(W, H, rao) {
    if (!rao.length) return null;
    const laRao = new Uint8Array(W * H);
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (const i of rao) {
      const x = i % W, y = (i - x) / W;
      laRao[i] = 1; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    }
    const bx0 = x0 - 1, by0 = y0 - 1, bw = x1 - x0 + 3, bh = y1 - y0 + 3;
    const da = new Uint8Array(bw * bh), q = new Int32Array(bw * bh);
    let dau = 0, cuoi = 0;
    const day = (x, y) => {
      if (x < bx0 || y < by0 || x >= bx0 + bw || y >= by0 + bh) return;
      const k = (y - by0) * bw + (x - bx0);
      if (da[k] || (x >= 0 && y >= 0 && x < W && y < H && laRao[y * W + x])) return; // ngoài bản đồ: coi như ngoài
      da[k] = 1; q[cuoi++] = k;
    };
    for (let x = bx0; x < bx0 + bw; x++) { day(x, by0); day(x, by0 + bh - 1); }
    for (let y = by0; y < by0 + bh; y++) { day(bx0, y); day(bx0 + bw - 1, y); }
    while (dau < cuoi) {
      const k = q[dau++], x = k % bw + bx0, y = (k - (k % bw)) / bw + by0;
      day(x + 1, y); day(x - 1, y); day(x, y + 1); day(x, y - 1);
    }
    const kq = new Uint8Array(W * H);
    let so = 0;
    for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) {
      const i = y * W + x;
      if (!laRao[i] && !da[(y - by0) * bw + (x - bx0)]) { kq[i] = 1; so++; }
    }
    return so ? kq : null;
  }
  // Giữ lãnh địa từng bé (máy bé + máy chủ giả): dat() khi rào của bé đổi, tính lại lười khi cần đọc
  function taoBoLanhDia(W, H) {
    const rao = new Map(), mat = new Map(), canTinh = new Set(); // chủ -> Set ô rào; chủ -> mặt nạ | null
    function dat(chu, x, y, rong, sau, co) {
      let s = rao.get(chu);
      if (!s) rao.set(chu, (s = new Set()));
      for (let oy = y; oy < y + sau; oy++) for (let ox = x; ox < x + rong; ox++) if (ox >= 0 && oy >= 0 && ox < W && oy < H) { if (co) s.add(oy * W + ox); else s.delete(oy * W + ox); }
      canTinh.add(chu);
    }
    function cua(chu) {
      if (canTinh.has(chu)) { canTinh.delete(chu); mat.set(chu, tinhLanhDia(W, H, [...(rao.get(chu) || [])])); }
      return mat.get(chu) || null;
    }
    // Chủ lãnh địa chứa ô (x, y), bỏ qua bé "tru" (chính mình); không ai thì null
    function chuO(x, y, tru) {
      if (x < 0 || y < 0 || x >= W || y >= H) return null;
      for (const chu of rao.keys()) { if (chu === tru) continue; const m = cua(chu); if (m && m[y * W + x]) return chu; }
      return null;
    }
    const soO = chu => { const m = cua(chu); let n = 0; if (m) for (let i = 0; i < m.length; i++) n += m[i]; return n; };
    return { dat, cua, chuO, soO };
  }
  // Đoạn tường thẳng (ngang hoặc dọc, theo chiều chênh nhiều hơn) từ ô a về phía ô b, tối đa toiDa ô
  function doanTuong(a, b, toiDa) {
    const dx = b.x - a.x, dy = b.y - a.y, ngang = Math.abs(dx) >= Math.abs(dy);
    const n = Math.min(Math.abs(ngang ? dx : dy), toiDa - 1), buoc = Math.sign(ngang ? dx : dy);
    const ds = [];
    for (let i = 0; i <= n; i++) ds.push(ngang ? { x: a.x + i * buoc, y: a.y } : { x: a.x, y: a.y + i * buoc });
    return ds;
  }
  // Cổng (rong x sau, mặc định 3 x 1) đặt giữa ô chạm; chạm lên tường DỌC của bé thì xoay thành dọc
  function choCong(x, y, rong, sau, laTuongMinh) {
    const doc = laTuongMinh(x, y - 1) && laTuongMinh(x, y + 1) && !(laTuongMinh(x - 1, y) && laTuongMinh(x + 1, y));
    return doc ? { x: x - Math.floor(sau / 2), y: y - Math.floor(rong / 2), rong: sau, sau: rong, xoay: true }
      : { x: x - Math.floor(rong / 2), y: y - Math.floor(sau / 2), rong, sau, xoay: false };
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
    lanh_dia: () => "Đây là lãnh địa của bạn khác, con xây chỗ khác nhé.",
    thieu: ten => "Chưa đủ " + (ten || "tài nguyên") + " để xây. Con cho nông dân lấy thêm nhé!",
    gioi_han: ten => "Con đã có đủ " + (ten || "loại nhà này") + " rồi."
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
    if ((l.danh[i] || (the.coCongTrinh && the.coCongTrinh(x, y))) && !(the.deLen && the.deLen(x, y))) return khong("cong_trinh"); // 4. không đè công trình (cổng đè tường của bé: deLen)
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
  // nho (TC_D02B3b, không bắt buộc): WeakMap lệnh -> đường đã tìm, để vẽ quân bạn mỗi khung không
  // phải tìm đường lại. chay: Thủ lĩnh đang chạy (phần vẽ chọn động tác).
  // chu (TC_D02C): chủ đơn vị -> đi qua được cổng của chủ, không qua cổng của bé khác (lang.choQua)
  function viTriTuLenh(lang, lenh, bayGio, nho, chu) {
    const LUOI = goc.KC_DT_LUOI, T = lang.CH.tocDo;
    let duong = nho && nho.get(lenh);
    if (!duong) {
      const [x0, z0] = lenh.tu;
      const tu = LUOI.oCuaDiem(x0, z0), den = { x: lenh.den[0], y: lenh.den[1] };
      const d = LUOI.timDuong(lang.luoi, tu, den, lang.laVung, lang.choQua ? lang.choQua(chu) : null); // cùng cách lenhDi của dt_lang.js
      const diem = [{ x: x0, z: z0 }, ...((d && LUOI.lamMuot(lang.luoi, tu, d)) || []).map(c => ({ x: c.x + 0.5, z: c.y + 0.5 }))];
      let L = 0; for (let i = 1; i < diem.length; i++) L += Math.hypot(diem[i].x - diem[i - 1].x, diem[i].z - diem[i - 1].z);
      duong = { diem, L };
      if (nho) nho.set(lenh, duong);
    }
    const { diem, L } = duong;
    const t = Math.max(0, (bayGio - lenh.batDau) / 1000);
    let s, chay = false;
    if (lenh.vaiTro === "thu_linh" && L > T.chayKhiXaHon) {
      const t1 = (L - T.chayKhiXaHon) / T.chay;
      chay = t <= t1;
      s = chay ? t * T.chay : (L - T.chayKhiXaHon) + (t - t1) * T.di;
    } else s = t * T.di;
    if (s >= L || diem.length < 2) { const c = diem[diem.length - 1], b = diem[Math.max(0, diem.length - 2)]; return { x: c.x, z: c.z, huong: Math.atan2(c.x - b.x, c.z - b.z) || 0, xong: true }; }
    for (let i = 1; i < diem.length; i++) {
      const a = diem[i - 1], b = diem[i], k = Math.hypot(b.x - a.x, b.z - a.z);
      if (s <= k) { const f = k ? s / k : 0; return { x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f, huong: Math.atan2(b.x - a.x, b.z - a.z), xong: false, chay }; }
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

  // ---------------- Tìm chỗ đi khám phá (mục 3; TC_D02B2b, nút "🔭 Đi khám phá") ----------------
  // Loang từ chỗ nông dân qua ô ĐÃ BIẾT đi được; ô đầu tiên sát vùng đen (4 hướng) là mép cần
  // tới (cách chỗ đứng từ 2 ô). tranh = [{x, y}] đích của nông dân khác đang khám phá: bỏ qua mép
  // cách đó dưới cachNhau ô để mỗi người một hướng. Trả {x, y} hoặc null (hết chỗ tới được).
  function timBienKhamPha(lang, suong, x, z, tranh, cachNhau) {
    const LUOI = goc.KC_DT_LUOI, W = lang.W, H = lang.H, l = lang.luoi, biet = suong.daKham;
    const tu = LUOI.oTrongGan(l, Math.floor(x), Math.floor(z), null, 4);
    if (!tu) return null;
    const da = new Uint8Array(W * H), q = new Int32Array(W * H);
    let dau = 0, cuoi = 0;
    da[tu.y * W + tu.x] = 1; q[cuoi++] = tu.y * W + tu.x;
    const satDen = (cx, cy) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
      const nx = cx + dx, ny = cy + dy;
      return nx >= 0 && ny >= 0 && nx < W && ny < H && !biet[ny * W + nx];
    });
    while (dau < cuoi) {
      const c = q[dau++], cx = c % W, cy = (c - cx) / W;
      if (Math.hypot(cx - tu.x, cy - tu.y) >= 2 && satDen(cx, cy) && !(tranh || []).some(t => Math.hypot(t.x - cx, t.y - cy) < (cachNhau || 0))) return { x: cx, y: cy };
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = cx + dx, ny = cy + dy, n = ny * W + nx;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || da[n] || !biet[n] || !LUOI.diDuoc(l, nx, ny)) continue;
        if (dx && dy && (!LUOI.diDuoc(l, cx + dx, cy) || !LUOI.diDuoc(l, cx, cy + dy))) continue; // không cắt góc
        da[n] = 1; q[cuoi++] = n;
      }
    }
    return null;
  }

  goc.KC_DT_BAN_DO = { DEN, MO, SANG, tamNhin, tamNhinCt, taoSuongMu, oXayDuoc, oXayDuocVung, viTriTuLenh, locDonViThayDuoc, timBienKhamPha, LY_DO,
    LA_RAO, tinhLanhDia, taoBoLanhDia, doanTuong, choCong };
})(typeof window !== "undefined" ? window : globalThis);
// 28/10/2026 00:05 - BƯỚC: TC_D02C
