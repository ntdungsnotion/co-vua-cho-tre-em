// ================================================================
// FILE: dt/dt_lang.js
// CHỨC NĂNG: LÕI LÀNG của Đấu Trường Tri Thức. Không đụng DOM, không đụng Three.js:
//            chạy được trong node (kiểm thử) và mọi cách vẽ chỉ ĐỌC trạng thái ở đây.
//            - Lưới bản đồ: suối (nước chặn đường), cầu, lều, lửa trại, ruộng, trang trí
//            - Nguồn tài nguyên: cây, mỏ Đá / Vàng / Sắt, bãi cá, bụi trái cây; cỡ nhỏ /
//              vừa / to, trữ lượng; cây cạn còn gốc + mọc mầm mới (lớn sau N giờ thật),
//              mỏ / cá / bụi cạn thì xuất hiện lại chỗ khác sau N giờ thật
//            - Nông dân: máy trạng thái dung / di / toi_viec / lam / ve_kho, sức mang theo
//              chủng loại, tự chuyển sang nguồn cùng loại sát bên hoặc đứng chơi ("rảnh")
//            - Kho: Gỗ, Đá, Vàng, Sắt, Lương thực
//            MỌI CON SỐ đọc từ cau_hinh.json (khối "lang"), không viết cứng.
//            Luật đầy đủ: repo_rieng dau_truong_tri_thuc/dac_ta_lang.md.
//            HAI KIỂU BẢN ĐỒ: (1) bản mẫu thử lang_thu_3d.json (suối là đường gấp khúc, rừng
//            là vòng tròn, đặt cây ngẫu nhiên); (2) vùng đất thật vung_dat.json (TC_D02B2a):
//            'o' = mỗi hàng ô một chuỗi ký tự theo bảng 'kyHieu', nguồn đặt đúng ô, mã nguồn
//            chung n.ma = z * rong + x. Vùng đất chưa có lều: bé tự dựng (TC_D02B2b).
//            CÔNG TRÌNH (TC_D02B2b): móng đặt ngay (chặn ô), Thủ lĩnh / nông dân đứng sát móng
//            làm đủ giayXay giây thì xong; Lều trại xong mới có chỗ cất đồ (mọi ô đi được quanh lều).
//            SƯƠNG MÙ (TC_D02B2b, datBiet): lệnh đi chỉ qua ô đã biết + mép vùng đen; đích sâu
//            trong vùng đen thì đi từng chặng (tới mép, chỗ mới sáng ra, tìm đường tiếp);
//            khamPhaTuDo: nông dân tự đi mở vùng đen gần nhất tới khi hết chỗ.
// SỰ KIỆN (lang.nghe): them_nguon, het_nguon, mam_lon, lay (một nhịp làm), cat (đồ về kho),
//            ranh (nông dân hết việc), lenh_di (đơn vị nhận đường đi mới: lưu "lệnh" lên máy chủ),
//            giao_viec, xoa_goc (đặt móng lên gốc cây), bo_mam (đặt móng lên mầm cây),
//            cong_trinh (thêm móng / công trình), xay_xong, xay_ket (không tới được móng),
//            het_kham_pha (nông dân tự khám phá: hết chỗ để mở)
// BƯỚC: TC_D02A; TC_D02B2a (vùng đất 128 x 128, chưa lều, đặt móng, tìm chỗ mọc nhanh);
//       TC_D02B2b (công trình + dựng lều, khám phá theo sương mù, nạp trữ lượng từ máy chủ);
//       TC_D02B3a (bản đồ chung: lều của bạn khác không là chỗ cất đồ, ct.cuaMinh)
// NGÀY: 23/10/2026; 26/10/2026; 27/10/2026; 27/10/2026 18:55
// PHỤ THUỘC: dt/dt_luoi.js (KC_DT_LUOI)
// ================================================================
(function (goc) {
  "use strict";
  const GIO_MS = 3600 * 1000;
  const LAN_THU = 16; // số lần bốc chỗ ngẫu nhiên cho mỗi cây khi dựng rừng (không phải số cân bằng)

  // Ngẫu nhiên có hạt giống (mulberry32): cùng hạt -> cùng làng, kiểm thử lặp lại được
  function taoNgauNhien(hat) {
    let a = hat >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  // Chọn cỡ theo tỉ lệ { nho, vua, to }
  function chonCo(tiLe, r) {
    let tong = 0; for (const k in tiLe) tong += tiLe[k];
    let x = r * tong;
    for (const k in tiLe) { x -= tiLe[k]; if (x < 0) return k; }
    return Object.keys(tiLe).pop();
  }

  // opt: { banDo, cauHinh, chungLoai, hatGiong?, dongHo?: () => ms }
  function taoLang(opt) {
    const LUOI = goc.KC_DT_LUOI;
    const bd = opt.banDo, CH = (opt.cauHinh && opt.cauHinh.lang) || opt.cauHinh;
    const W = bd.rong, H = bd.cao;
    const ngauNhien = taoNgauNhien(opt.hatGiong != null ? opt.hatGiong : bd.hatGiong);
    let chungLoai = opt.chungLoai || "nhan";
    let lechGio = 0;
    const bayGio = () => (opt.dongHo ? opt.dongHo() : Date.now()) + lechGio;

    const nghe = [];
    const phat = su => { for (const f of nghe) f(su); };

    // ---------------- Lưới + suối + cầu ----------------
    const luoi = LUOI.taoLuoi(W, H);
    const chiSo = (x, y) => y * W + x;
    const trongBan = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
    const nuoc = new Uint8Array(W * H), danh = new Uint8Array(W * H), laCau = new Uint8Array(W * H), coGoc = new Uint8Array(W * H);
    const laVung = Array.isArray(bd.o); // vùng đất thật: ô cho sẵn từng ký tự
    const kyO = laVung ? (x, y) => bd.kyHieu[bd.o[y][x]] || ["co"] : null;
    let suoi = [], nuaSuoi, kcSuoi;
    if (laVung) {
      // Khoảng cách tới tâm ô nước gần nhất (tối đa 4 ô), nội suy giữa các tâm ô: phần vẽ
      // dùng để hạ lòng suối / hồ và tô cát ven bờ y như bản mẫu
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const k = kyO(x, y)[0]; if (k === "nuoc" || k === "bai_ca") { nuoc[chiSo(x, y)] = 1; LUOI.datChan(luoi, x, y, true); } else if (k === "cau") laCau[chiSo(x, y)] = 1; }
      const XA = 4, kc = new Float32Array(W * H).fill(XA);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (nuoc[chiSo(x, y)]) { kc[chiSo(x, y)] = 0; continue; }
        let m = XA;
        for (let dy = -XA; dy <= XA; dy++) for (let dx = -XA; dx <= XA; dx++) { const nx = x + dx, ny = y + dy; if (trongBan(nx, ny) && nuoc[chiSo(nx, ny)]) m = Math.min(m, Math.hypot(dx, dy)); }
        kc[chiSo(x, y)] = m;
      }
      const kcO = (x, y) => kc[chiSo(Math.max(0, Math.min(W - 1, x)), Math.max(0, Math.min(H - 1, y)))];
      nuaSuoi = 0.3;
      kcSuoi = (x, z) => {
        const fx = x - 0.5, fz = z - 0.5, x0 = Math.floor(fx), z0 = Math.floor(fz), tx = fx - x0, tz = fz - z0;
        const a = kcO(x0, z0), b = kcO(x0 + 1, z0), c = kcO(x0, z0 + 1), d = kcO(x0 + 1, z0 + 1);
        return (a * (1 - tx) + b * tx) * (1 - tz) + (c * (1 - tx) + d * tx) * tz;
      };
    } else {
      suoi = bd.suoi.diem.map(([x, z]) => ({ x, z }));
      nuaSuoi = bd.suoi.rong / 2;
      kcSuoi = (x, z) => {
        let m = Infinity;
        for (let i = 0; i < suoi.length - 1; i++) {
          const a = suoi[i], b = suoi[i + 1], abx = b.x - a.x, abz = b.z - a.z;
          const t = Math.max(0, Math.min(1, ((x - a.x) * abx + (z - a.z) * abz) / (abx * abx + abz * abz)));
          m = Math.min(m, Math.hypot(x - a.x - abx * t, z - a.z - abz * t));
        }
        return m;
      };
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (kcSuoi(x + 0.5, y + 0.5) < nuaSuoi + 0.25) { nuoc[chiSo(x, y)] = 1; LUOI.datChan(luoi, x, y, true); }
    }
    // Cầu: nằm ngang dòng suối ở đoạn gần nhất; các ô dưới mặt cầu đi được.
    // Vùng đất: ô cầu đã cho sẵn ('='), chỉ lấy hướng dòng chảy 'doc' để vẽ
    const cau = laVung ? (bd.cau || []).map(c => {
      const doc = { x: c.doc[0], z: c.doc[1] };
      return { x: c.x, z: c.z, doc, ngang: { x: doc.z, z: -doc.x }, goc: Math.atan2(doc.x, doc.z) };
    }) : (bd.cau || []).map(c => {
      let gan = 0, kc = Infinity;
      for (let i = 0; i < suoi.length - 1; i++) { const mx = (suoi[i].x + suoi[i + 1].x) / 2, mz = (suoi[i].z + suoi[i + 1].z) / 2, d = Math.hypot(mx - c.x, mz - c.z); if (d < kc) { kc = d; gan = i; } }
      let dx = suoi[gan + 1].x - suoi[gan].x, dz = suoi[gan + 1].z - suoi[gan].z; const l = Math.hypot(dx, dz); dx /= l; dz /= l;
      const doc = { x: dx, z: dz }, ngang = { x: dz, z: -dx };
      for (let s = -3; s <= 3; s += 0.25) for (const w of [-0.6, 0, 0.6]) {
        const ox = Math.floor(c.x + ngang.x * s + doc.x * w), oy = Math.floor(c.z + ngang.z * s + doc.z * w);
        if (trongBan(ox, oy)) { LUOI.datChan(luoi, ox, oy, false); laCau[chiSo(ox, oy)] = 1; }
      }
      return { x: c.x, z: c.z, doc, ngang, goc: Math.atan2(dx, dz) };
    });
    // Lều 2 x 2 ô, lửa trại, trang trí: chặn; quanh lều + ruộng: dành (không mọc cây / mỏ).
    // Vùng đất thật chưa có lều (bé tự dựng: themCongTrinh) -> chưa có chỗ cất đồ
    let leu = bd.leu || null, lx = leu && Math.floor(leu.x), lz = leu && Math.floor(leu.z);
    const danhVung = (cx, cz, r) => { for (let y = Math.floor(cz - r); y <= cz + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) if (trongBan(x, y) && Math.hypot(x + 0.5 - cx, y + 0.5 - cz) <= r) danh[chiSo(x, y)] = 1; };
    if (leu) {
      for (let y = -1; y < 1; y++) for (let x = -1; x < 1; x++) LUOI.datChan(luoi, lx + x, lz + y, true);
      danhVung(leu.x, leu.z, 3.5);
    }
    if (bd.lua) { LUOI.datChan(luoi, Math.floor(bd.lua.x), Math.floor(bd.lua.z), true); danhVung(bd.lua.x, bd.lua.z, 1.5); }
    for (const r of bd.ruong || []) danhVung(r.x, r.z, Math.max(r.rong, r.dai) * 0.75);
    for (const t of bd.trangTri || []) if (!t.mo.startsWith("water")) { LUOI.datChan(luoi, Math.floor(t.x), Math.floor(t.z), true); danh[chiSo(Math.floor(t.x), Math.floor(t.z))] = 1; }
    // Chỗ cất đồ: ô trước cửa lều (TC_D03 thêm Nhà kho: về chỗ cất gần nhất)
    const diemCat = leu ? [{ x: lx, y: lz + 1 }] : [];

    // ---------------- Nguồn tài nguyên ----------------
    const nguon = [], gocCay = [], hen = [];
    const nguonO = new Map(); // chỉ số ô -> nguồn (kể cả mầm)
    let soId = 0;
    const dangSong = n => n && n.trangThai === "song" && n.con > 0;
    const chanO = loai => loai !== "bai_ca"; // bãi cá ở ô nước (đã chặn sẵn)

    function taoNguon(loai, ox, oy, co, trangThai) {
      const ch = CH.nguon[loai];
      const toiDa = co ? ch.truLuong[co] : 0;
      const n = { id: ++soId, ma: chiSo(ox, oy), loai, taiNguyen: ch.taiNguyen, co: co || null, toiDa, con: toiDa, o: { x: ox, y: oy }, x: ox + 0.5, z: oy + 0.5,
        trangThai: trangThai || "song", giong: loai === "cay" ? Math.floor(ngauNhien() * CH.rung.soLoai) : 0, lech: ngauNhien() };
      nguon.push(n); nguonO.set(chiSo(ox, oy), n);
      if (n.trangThai === "song" && chanO(loai)) LUOI.datChan(luoi, ox, oy, true);
      phat({ loai: "them_nguon", n });
      return n;
    }
    function boNguon(n) {
      const i = nguon.indexOf(n); if (i >= 0) nguon.splice(i, 1);
      nguonO.delete(chiSo(n.o.x, n.o.y));
      if (chanO(n.loai)) LUOI.datChan(luoi, n.o.x, n.o.y, false);
    }
    // Ô cỏ trống: đi được, không nước / cầu / chỗ dành / gốc cây / nguồn, cách mép 1 ô
    function oCoTrong(x, y) {
      if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) return false;
      const i = chiSo(x, y);
      return LUOI.diDuoc(luoi, x, y) && !nuoc[i] && !danh[i] && !laCau[i] && !coGoc[i] && !nguonO.has(i);
    }
    const quanhTrong = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && !LUOI.diDuoc(luoi, x + dx, y + dy)) return false; return true; };
    function oCaHopLe(x, y) {
      if (!trongBan(x, y)) return false;
      const i = chiSo(x, y);
      if (!nuoc[i] || laCau[i] || nguonO.has(i)) return false;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && LUOI.diDuoc(luoi, x + dx, y + dy)) return true;
      return false;
    }

    // --- Dựng làng ban đầu ---
    function trongCay(x, z, rungDay, co) {
      const ox = Math.floor(x), oz = Math.floor(z);
      if (!oCoTrong(ox, oz) || (!rungDay && !quanhTrong(ox, oz))) return null;
      return taoNguon("cay", ox, oz, co || chonCo(CH.rung.tiLeCo, ngauNhien()));
    }
    if (laVung) { // vùng đất thật: đúng ô, đúng cỡ như bản đồ (bãi cá nằm trên ô nước)
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const [loai, co] = kyO(x, y);
        if (co && CH.nguon[loai]) taoNguon(loai, x, y, co);
      }
    }
    for (const r of laVung ? [] : bd.rung || []) {
      let dat = 0;
      for (let thu = 0; thu < r.soCay * LAN_THU && dat < r.soCay; thu++) {
        const a = ngauNhien() * Math.PI * 2, d = Math.sqrt(ngauNhien()) * r.banKinh;
        if (trongCay(r.x + Math.cos(a) * d, r.z + Math.sin(a) * d, true)) dat++;
      }
    }
    for (let i = 0, thu = 0; leu && i < (bd.cayLe || 0) && thu < (bd.cayLe || 0) * LAN_THU * 2; thu++) {
      const x = 3 + ngauNhien() * (W - 6), z = 3 + ngauNhien() * (H - 6);
      if (Math.hypot(x - leu.x, z - leu.z) > 7 && trongCay(x, z, false)) i++;
    }
    const DS_DAT = { cay: "cay", moDa: "mo_da", moVang: "mo_vang", moSat: "mo_sat", buiTraiCay: "bui_trai_cay" };
    for (const k in DS_DAT) for (const m of bd[k] || []) {
      const ox = Math.floor(m.x), oz = Math.floor(m.z);
      if (oCoTrong(ox, oz)) taoNguon(DS_DAT[k], ox, oz, m.co);
    }
    for (const c of bd.baiCa || []) { // bãi cá: ô nước sát bờ gần điểm cho sẵn nhất
      let tot = null, kc = Infinity;
      for (let y = Math.floor(c.z) - 4; y <= c.z + 4; y++) for (let x = Math.floor(c.x) - 4; x <= c.x + 4; x++) {
        if (!oCaHopLe(x, y)) continue;
        const d = Math.hypot(x + 0.5 - c.x, y + 0.5 - c.z); if (d < kc) { kc = d; tot = { x, y }; }
      }
      if (tot) taoNguon("bai_ca", tot.x, tot.y, c.co);
    }

    // --- Mọc lại / xuất hiện lại (giờ thật) ---
    function timCho(loai, tranh) {
      const ds = [], gan = [];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (tranh && tranh.x === x && tranh.y === y) continue;
        if (loai === "bai_ca") { if (oCaHopLe(x, y)) ds.push({ x, y }); continue; }
        if (!oCoTrong(x, y)) continue;
        if (loai === "cay") {
          ds.push({ x, y });
          // gần rừng: có cây sống trong R ô (tra theo ô, không quét cả danh sách nguồn: bản đồ 128 x 128 có hàng nghìn cây)
          const R = CH.mocLai.ganRungO;
          tim: for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
            const m = trongBan(x + dx, y + dy) && nguonO.get(chiSo(x + dx, y + dy));
            if (m && m.loai === "cay" && m.trangThai === "song") { gan.push({ x, y }); break tim; }
          }
        } else if (quanhTrong(x, y) && (!leu || Math.hypot(x + 0.5 - leu.x, y + 0.5 - leu.z) >= CH.mocLai.cachLeuO)) ds.push({ x, y });
      }
      const chon = gan.length ? gan : ds;
      return chon.length ? chon[Math.floor(ngauNhien() * chon.length)] : null;
    }
    function trongMam(o) {
      const n = taoNguon("cay", o.x, o.y, null, "mam");
      n.lucTrong = bayGio(); n.lucLon = n.lucTrong + CH.nguon.cay.mocLaiGio * GIO_MS;
      return n;
    }
    // khongMoc: nạp trạng thái từ máy chủ (vào lại thung lũng) -> chỉ thành gốc / biến mất, không
    // mọc mầm, không hẹn mỏ mới (mọc lại theo giờ máy chủ: TC_D02B3)
    function canNguon(n, khongMoc) {
      n.con = 0; n.trangThai = "het";
      boNguon(n);
      if (n.loai === "cay") {
        coGoc[chiSo(n.o.x, n.o.y)] = 1;
        gocCay.push({ x: n.x, z: n.z, o: n.o, giong: n.giong, co: n.co });
        phat({ loai: "het_nguon", n });
        if (khongMoc) return;
        const o = timCho("cay", n.o); // mầm mọc NGAY, lớn sau mocLaiGio giờ
        if (o) trongMam(o); else hen.push({ loai: "cay", luc: bayGio(), tranh: n.o });
      } else {
        phat({ loai: "het_nguon", n });
        if (!khongMoc) hen.push({ loai: n.loai, luc: bayGio() + CH.nguon[n.loai].mocLaiGio * GIO_MS, tranh: n.o });
      }
    }
    // Trữ lượng còn lại theo máy chủ (chỉ giảm, không tăng)
    function capNhatNguon(ma, con) {
      const n = nguonO.get(ma);
      if (!dangSong(n)) return false;
      if (con > 0) { n.con = Math.min(n.con, con); return true; }
      canNguon(n, true);
      return true;
    }
    function xuLyHen() {
      const t = bayGio();
      for (const n of nguon) if (n.trangThai === "mam" && t >= n.lucLon) {
        if (!LUOI.diDuoc(luoi, n.o.x, n.o.y)) continue;
        n.co = chonCo(CH.mocLai.tiLeCoMoi, ngauNhien()); n.toiDa = n.con = CH.nguon.cay.truLuong[n.co];
        n.trangThai = "song"; LUOI.datChan(luoi, n.o.x, n.o.y, true);
        phat({ loai: "mam_lon", n });
      }
      for (let i = hen.length - 1; i >= 0; i--) {
        const h = hen[i]; if (t < h.luc) continue;
        const o = timCho(h.loai, h.tranh);
        if (!o) continue; // chưa có chỗ: thử lại lần tính sau
        hen.splice(i, 1);
        if (h.loai === "cay") trongMam(o);
        else taoNguon(h.loai, o.x, o.y, chonCo(CH.mocLai.tiLeCoMoi, ngauNhien()));
      }
    }

    // ---------------- Nông dân + Thủ lĩnh ----------------
    const donVi = [];
    const kho = {}; for (const k in CH.taiNguyen) kho[k] = 0;
    const sucMang = () => CH.sucMang[chungLoai];

    function themDonVi(vaiTro, x, z, ten) {
      const o = LUOI.oTrongGan(luoi, Math.floor(x), Math.floor(z));
      const dv = { id: donVi.length + 1, vaiTro, ten, x: o.x + 0.5, z: o.y + 0.5, huongMuon: 0, trangThai: "dung", duong: [], viec: null,
        mang: { loai: null, so: 0 }, henLam: 0, ranh: false, chay: false, dich: null, xay: null, tuKhamPha: false };
      donVi.push(dv);
      return dv;
    }
    // ---------------- Sương mù: ô đã biết (TC_D02B2b) ----------------
    // biet(x, y): bé đã khám phá ô này chưa (trang game nối vào sương mù dt_ban_do.js). Không nối
    // (bản mẫu, máy chủ) thì đi đâu cũng được như cũ. capNhatBiet(): soi lại sương ngay trước khi
    // tìm chặng mới (chỗ vừa tới sáng ra liền, không chờ nhịp soi 0,2 giây).
    let biet = null, capNhatBiet = null, timKhamPha = null;
    const choPhep = (x, y) => {
      if (biet(x, y)) return true;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && trongBan(x + dx, y + dy) && biet(x + dx, y + dy)) return true;
      return false;
    };
    function diToi(dv, o, ganNhat, theoSuong) {
      if (!o) return false;
      const tu = LUOI.oCuaDiem(dv.x, dv.z);
      const d = LUOI.timDuong(luoi, tu, o, ganNhat, theoSuong && biet ? choPhep : null);
      if (!d) return false;
      dv.duong = (LUOI.lamMuot(luoi, tu, d) || []).map(c => ({ x: c.x + 0.5, z: c.y + 0.5 }));
      return true;
    }
    // Ô cuối của đường đang đi (ô đang đứng nếu không phải đi)
    const oCuoi = dv => { const c = dv.duong[dv.duong.length - 1] || dv; return LUOI.oCuaDiem(c.x, c.z); };
    const baoLenhDi = (dv, tu) => phat({ loai: "lenh_di", dv, tu, den: oCuoi(dv), khamPha: !!dv.tuKhamPha });
    // Nguồn có ô trống sát bên (đứng làm được). Cây giữa rừng rậm chưa chặt được, như Đế Chế.
    function coKe(n) {
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && LUOI.diDuoc(luoi, n.o.x + dx, n.o.y + dy)) return true;
      return false;
    }
    function nguonGanNhat(loai, x, z, xaNhat) {
      let tot = null, kc = xaNhat;
      for (const n of nguon) if (n.loai === loai && dangSong(n) && coKe(n)) { const d = Math.hypot(n.x - x, n.z - z); if (d < kc) { kc = d; tot = n; } }
      return tot;
    }
    // Nguồn cùng loại cách nguồn n không quá khoangTuChuyenO ô (tính theo ô, kể cả chéo)
    function nguonSatBen(n) {
      let tot = null, kc = Infinity;
      for (const m of nguon) {
        if (m === n || m.loai !== n.loai || !dangSong(m) || !coKe(m)) continue;
        const o = Math.max(Math.abs(m.o.x - n.o.x), Math.abs(m.o.y - n.o.y));
        if (o > CH.khoangTuChuyenO) continue;
        const d = Math.hypot(m.x - n.x, m.z - n.z); if (d < kc) { kc = d; tot = m; }
      }
      return tot;
    }
    function nghi(dv) {
      dv.trangThai = "dung"; dv.viec = null; dv.duong = []; dv.ranh = true;
      phat({ loai: "ranh", dv });
    }
    // Lệnh của bé: đi tới ô (bỏ việc, giữ đồ đang mang). Vùng đất thật: không tới được thì đi
    // tới chỗ gần nhất (chạm giữa rừng rậm -> tới bìa rừng), như Đế Chế; bản mẫu giữ như cũ.
    // Có sương mù: đi từng chặng qua ô đã biết, dv.dich nhớ chỗ bé chạm để đi tiếp.
    // tuDong: lệnh do chính lõi ra (tự khám phá), không tắt chế độ tự khám phá.
    function lenhDi(dv, o, tuDong) {
      dv.viec = null; dv.xay = null; dv.ranh = false; dv.trangThai = "di";
      if (!tuDong) dv.tuKhamPha = false;
      dv.dich = biet ? { x: o.x, y: o.y } : null;
      const tu = { x: dv.x, z: dv.z };
      if (diToi(dv, o, laVung, true)) { baoLenhDi(dv, tu); return true; }
      dv.trangThai = "dung"; dv.dich = null; return false;
    }
    // Tới cuối chặng: còn xa chỗ bé chạm thì tìm chặng mới qua chỗ vừa sáng ra. Trả true nếu đi tiếp.
    function diTiepChang(dv) {
      const o = dv.dich, oDung = LUOI.oCuaDiem(dv.x, dv.z);
      dv.dich = null;
      if (!o || (oDung.x === o.x && oDung.y === o.y)) return false;
      if (capNhatBiet) capNhatBiet();
      const tu = { x: dv.x, z: dv.z }, kc0 = Math.hypot(oDung.x - o.x, oDung.y - o.y);
      if (!diToi(dv, o, true, true) || !dv.duong.length) { dv.duong = []; return false; }
      const c = oCuoi(dv);
      if (Math.hypot(c.x - o.x, c.y - o.y) > kc0 - 0.5) { dv.duong = []; return false; } // không gần thêm: dừng
      dv.dich = o; dv.trangThai = "di";
      baoLenhDi(dv, tu);
      return true;
    }
    // Nông dân tự đi khám phá (nút "🔭 Đi khám phá"): đi tới mép vùng đen gần nhất, tới nơi thì
    // tìm chỗ tiếp, tới khi hết chỗ hoặc bé ra lệnh khác. Trả false nếu không còn chỗ nào để mở.
    function khamPhaTuDo(dv) {
      if (dv.vaiTro !== "nong_dan" || !timKhamPha) return false;
      if (capNhatBiet) capNhatBiet();
      dv.tuKhamPha = true;
      const o = timKhamPha(dv);
      if (o && lenhDi(dv, o, true)) return true;
      dv.tuKhamPha = false;
      return false;
    }

    // ---------------- Công trình của bé (TC_D02B2b: Lều trại) ----------------
    // ct = { id, loai, x, y, rong, sau, xong, tienDo (0..1), giayXay }; (x, y) = ô góc trên-trái.
    const congTrinh = [];
    // Ô viền ngoài móng, đi được, gần (x, z) nhất (chỗ đứng dựng nhà, chỗ cất đồ quanh lều)
    function oQuanh(ct, x, z) {
      let tot = null, kc = Infinity;
      for (let oy = ct.y - 1; oy <= ct.y + ct.sau; oy++) for (let ox = ct.x - 1; ox <= ct.x + ct.rong; ox++) {
        if (oy >= ct.y && oy < ct.y + ct.sau && ox >= ct.x && ox < ct.x + ct.rong) continue;
        if (!LUOI.diDuoc(luoi, ox, oy)) continue;
        const d = Math.hypot(ox + 0.5 - x, oy + 0.5 - z); if (d < kc) { kc = d; tot = { x: ox, y: oy }; }
      }
      return tot;
    }
    const kcToiMong = (dv, ct) => Math.hypot(Math.max(ct.x - dv.x, 0, dv.x - ct.x - ct.rong), Math.max(ct.y - dv.z, 0, dv.z - ct.y - ct.sau));
    function datLeuCho(ct) { leu = { x: ct.x + ct.rong / 2, z: ct.y + ct.sau / 2, ct }; lx = Math.floor(leu.x); lz = Math.floor(leu.z); }
    function themCongTrinh(ct) {
      ct.tienDo = ct.xong ? 1 : (ct.tienDo || 0);
      datMong(ct.x, ct.y, ct.rong, ct.sau);
      congTrinh.push(ct);
      if (ct.xong && ct.loai === "leu" && ct.cuaMinh !== false) datLeuCho(ct); // lều của bạn khác (bản đồ chung) không là chỗ cất đồ của mình
      phat({ loai: "cong_trinh", ct });
      return ct;
    }
    // Lệnh dựng: tới ô sát móng gần nhất rồi làm. Trả false nếu móng bị vây kín, không có chỗ đứng.
    function lenhXay(dv, ct) {
      dv.viec = null; dv.dich = null; dv.tuKhamPha = false; dv.ranh = false;
      const o = oQuanh(ct, dv.x, dv.z), tu = { x: dv.x, z: dv.z };
      if (!o || !diToi(dv, o)) { dv.trangThai = "dung"; return false; }
      dv.xay = ct; dv.trangThai = "toi_xay";
      baoLenhDi(dv, tu);
      return true;
    }

    // ---------------- Đặt móng (TC_D02B2a: lõi; bé xây thật từ TC_D02B2b) ----------------
    // Ô kiểm hợp lệ ở dt_ban_do.js (oXayDuoc). Ở đây chỉ ghi: gốc cây trên móng tự xoá,
    // mầm cây trên móng bỏ đi, ô móng thành chỗ dành (mầm / mỏ mới không mọc lên) + chặn đường.
    function xoaGoc(x, y) {
      const i = chiSo(x, y);
      if (!coGoc[i]) return false;
      coGoc[i] = 0;
      const k = gocCay.findIndex(g => g.o.x === x && g.o.y === y);
      const g = k >= 0 ? gocCay.splice(k, 1)[0] : null;
      phat({ loai: "xoa_goc", g, o: { x, y } });
      return true;
    }
    function datMong(x, y, rong, sau) {
      for (let oy = y; oy < y + (sau || 1); oy++) for (let ox = x; ox < x + (rong || 1); ox++) {
        if (!trongBan(ox, oy)) continue;
        const i = chiSo(ox, oy), m = nguonO.get(i);
        if (m && m.trangThai === "mam") { boNguon(m); phat({ loai: "bo_mam", n: m }); }
        xoaGoc(ox, oy);
        danh[i] = 1; LUOI.datChan(luoi, ox, oy, true);
      }
    }
    // Lệnh của bé: làm ở nguồn n. Trả nguồn thật sự được giao (cây bìa thay cây giữa rừng) hoặc null
    function giaoViec(dv, n) {
      if (dv.vaiTro !== "nong_dan" || !dangSong(n)) return null;
      if (!coKe(n)) n = nguonGanNhat(n.loai, n.x, n.z, CH.banKinhChonBia);
      if (!n) return null;
      if (dv.mang.so && dv.mang.loai !== n.taiNguyen) dv.mang = { loai: null, so: 0 }; // đổi loại tài nguyên thì bỏ đồ đang mang
      dv.viec = n; dv.ranh = false; dv.trangThai = "toi_viec"; dv.dich = null; dv.xay = null; dv.tuKhamPha = false;
      diToi(dv, n.o);
      phat({ loai: "giao_viec", dv, n });
      return n;
    }
    const ganNguon = (dv, n) => Math.hypot(dv.x - n.x, dv.z - n.z) < CH.tamVoi;
    function choCatGanNhat(dv) {
      if (leu && leu.ct) return oQuanh(leu.ct, dv.x, dv.z) || { x: lx, y: lz + 1 }; // lều bé dựng: ô quanh lều gần nhất
      let tot = diemCat[0] || null, kc = Infinity; // chưa có lều: không có chỗ cất
      for (const c of diemCat) { const d = Math.hypot(c.x + 0.5 - dv.x, c.y + 0.5 - dv.z); if (d < kc) { kc = d; tot = c; } }
      return tot;
    }
    // Nguồn đang làm đã cạn: sang nguồn cùng loại sát bên; không có thì mang đồ về rồi nghỉ
    function hetViec(dv) {
      const cu = dv.viec, tiep = cu ? nguonSatBen(cu) : null;
      if (tiep) { dv.viec = tiep; dv.trangThai = "toi_viec"; diToi(dv, tiep.o); return; }
      if (dv.mang.so > 0) { dv.trangThai = "ve_kho"; diToi(dv, choCatGanNhat(dv)); return; }
      nghi(dv);
    }

    function buoc(dv, dt) {
      // 1) đi theo đường
      if (dv.duong.length) {
        let conLai = 0, px = dv.x, pz = dv.z;
        for (const c of dv.duong) { conLai += Math.hypot(c.x - px, c.z - pz); px = c.x; pz = c.z; }
        dv.chay = dv.vaiTro === "thu_linh" && conLai > CH.tocDo.chayKhiXaHon;
        let v = (dv.chay ? CH.tocDo.chay : CH.tocDo.di) * dt;
        while (v > 0 && dv.duong.length) {
          const d0 = dv.duong[0], dx = d0.x - dv.x, dz = d0.z - dv.z, d = Math.hypot(dx, dz);
          if (d > 1e-6) dv.huongMuon = Math.atan2(dx, dz);
          if (d <= v) { dv.x = d0.x; dv.z = d0.z; dv.duong.shift(); v -= d; }
          else { dv.x += dx / d * v; dv.z += dz / d * v; v = 0; }
        }
        return;
      }
      dv.chay = false;
      const n = dv.viec;
      switch (dv.trangThai) {
        case "di":
          dv.trangThai = "dung";
          if (diTiepChang(dv)) break;
          if (dv.tuKhamPha) {
            if (capNhatBiet) capNhatBiet();
            const o = timKhamPha(dv);
            if (o && lenhDi(dv, o, true)) break;
            dv.tuKhamPha = false; phat({ loai: "het_kham_pha", dv }); nghi(dv);
          }
          break;
        case "toi_xay":
          if (!dv.xay || dv.xay.xong) { dv.xay = null; dv.trangThai = "dung"; }
          else if (kcToiMong(dv, dv.xay) <= CH.tamVoi) dv.trangThai = "xay";
          else { const ct = dv.xay; dv.xay = null; dv.trangThai = "dung"; phat({ loai: "xay_ket", ct, dv }); }
          break;
        case "xay": {
          const ct = dv.xay;
          if (!ct || ct.xong) { dv.xay = null; dv.trangThai = "dung"; break; }
          dv.huongMuon = Math.atan2(ct.x + ct.rong / 2 - dv.x, ct.y + ct.sau / 2 - dv.z);
          ct.tienDo = Math.min(1, ct.tienDo + dt / ct.giayXay);
          if (ct.tienDo >= 1) {
            ct.xong = true; dv.xay = null; dv.trangThai = "dung";
            if (ct.loai === "leu") datLeuCho(ct);
            phat({ loai: "xay_xong", ct, dv });
          }
          break;
        }
        case "toi_viec":
          if (!dangSong(n)) hetViec(dv);
          else if (ganNguon(dv, n)) { dv.trangThai = "lam"; dv.henLam = CH.nguon[n.loai].nhipLam; }
          else if (!coKe(n) || !diToi(dv, n.o) || !dv.duong.length) { const m = nguonGanNhat(n.loai, dv.x, dv.z, CH.banKinhChonBia); if (m && m !== n) giaoViec(dv, m); else nghi(dv); }
          break;
        case "lam": {
          if (!dangSong(n)) { hetViec(dv); break; }
          dv.huongMuon = Math.atan2(n.x - dv.x, n.z - dv.z);
          dv.henLam -= dt;
          while (dv.henLam <= 0) {
            dv.henLam += CH.nguon[n.loai].nhipLam;
            n.con--; dv.mang.loai = n.taiNguyen; dv.mang.so++;
            phat({ loai: "lay", n, dv });
            if (n.con <= 0) canNguon(n);
            if (dv.mang.so >= sucMang()) { dv.trangThai = "ve_kho"; diToi(dv, choCatGanNhat(dv)); break; }
            if (n.trangThai !== "song") { hetViec(dv); break; }
          }
          break;
        }
        case "ve_kho": {
          const c = choCatGanNhat(dv);
          if (!c) { nghi(dv); break; }
          if (Math.hypot(c.x + 0.5 - dv.x, c.y + 0.5 - dv.z) < CH.tamVoi) {
            const loai = dv.mang.loai, so = dv.mang.so;
            if (so) { kho[loai] += so; phat({ loai: "cat", dv, taiNguyen: loai, so }); }
            dv.mang = { loai: null, so: 0 };
            if (dangSong(dv.viec)) { dv.trangThai = "toi_viec"; diToi(dv, dv.viec.o); }
            else if (dv.viec) hetViec(dv);
            else nghi(dv);
          } else if (!diToi(dv, c) || !dv.duong.length) nghi(dv);
          break;
        }
      }
    }

    function capNhat(dt) {
      xuLyHen();
      for (const dv of donVi) buoc(dv, dt);
    }

    return {
      W, H, luoi, nuoc, laCau, coGoc, danh, laVung, chiSo, kcSuoi, nuaSuoi, suoi, cau, diemCat, nguon, gocCay, hen, donVi, kho, CH, congTrinh,
      get leu() { return leu; },
      xoaGoc, datMong, nguonTheoMa: ma => nguonO.get(ma) || null, capNhatNguon,
      themCongTrinh, lenhXay, oQuanh, khamPhaTuDo,
      // Nối sương mù (TC_D02B2b): biet(x, y) ô đã khám phá; capNhat() soi lại sương; timBien(dv) -> ô để đi khám phá tiếp
      datBiet(fnBiet, fnCapNhat, fnTimBien) { biet = fnBiet || null; capNhatBiet = fnCapNhat || null; timKhamPha = fnTimBien || null; },
      bayGio, get lechGio() { return lechGio; },
      tuaNhanh(ms) { lechGio += ms; xuLyHen(); },
      get chungLoai() { return chungLoai; }, datChungLoai(cl) { if (CH.sucMang[cl] != null) chungLoai = cl; }, sucMang,
      nghe(f) { nghe.push(f); },
      themDonVi, lenhDi, giaoViec, capNhat, xuLyHen, nguonGanNhat, coKe, dangSong,
      nguonTaiO: (x, y) => nguonO.get(chiSo(x, y)) || null
    };
  }

  goc.KC_DT_LANG = { taoLang, taoNgauNhien, chonCo, GIO_MS };
})(typeof window !== "undefined" ? window : globalThis);
// 27/10/2026 18:55 - BƯỚC: TC_D02B3a
