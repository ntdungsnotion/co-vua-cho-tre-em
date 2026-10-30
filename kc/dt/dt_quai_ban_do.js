// ================================================================
// FILE: dt/dt_quai_ban_do.js
// CHỨC NĂNG: LÕI QUÁI TRÊN BẢN ĐỒ của Đấu Trường Tri Thức (Thung Lũng, TC_D06A). Không đụng DOM,
//            không đụng Three.js: chạy được trong node (kiểm thử).
//            - sinh quái ở ô đứng được, xa cổng thung lũng; cấp theo khoảng cách tới cổng gần nhất
//              (càng vào sâu càng mạnh); loại theo tỉ lệ
//            - lang thang quanh chỗ sinh (đi thẳng, đứng nghỉ một lúc rồi đi tiếp), không đi qua ô
//              bị chặn / lãnh địa / sát lều (hàm diDuoc do phần trang đưa vào)
//            - giữ (Thủ lĩnh đang tới đánh: đứng yên), thả, bỏ chạy (thua trận: chạy xa dần rồi mất)
//            - quái mất thì hẹn xuất hiện lại sau hoiSinhGiay (giờ thật, lưu được qua tải lại trang)
//            - màu khung theo cấp quái so với cấp Thủ lĩnh: xanh dễ / vàng ngang / đỏ mạnh hơn
//            Mọi con số đọc từ du_lieu/cau_hinh.json khối "quaiBanDo".
// HÀM KHAI RA (window.KC_DT_QUAI_BAN_DO):
//   taoBoQuai(the) -> bo
//     the = { ch (khối quaiBanDo), W, H, diDuoc(x, y) -> bool, cong: [{ x, z }], rng () -> 0..1,
//             bayGio () -> ms giờ thật, hen? [ms] (hẹn xuất hiện lại còn chờ, đọc từ lần trước) }
//     bo  = { ds (quái đang có), capNhat(dt giây), giu(q), tha(q), boChay(q, tuX, tuZ), xoa(q),
//             hen () -> [ms] (để lưu), theoId(id) }
//     quái = { id, ma, lv, x, z, nhaX, nhaZ, trangThai: "dung" | "di" | "giu" | "chay", huong, mo (1 -> 0 khi chạy) }
//   capTheoKhoangCach(ch, kc) -> lv;   mauKhung(ch, lvQuai, capThuLinh) -> "xanh" | "vang" | "do"
// BƯỚC: TC_D06A
// NGÀY: 30/10/2026
// ================================================================
(function (goc) {
  "use strict";

  function capTheoKhoangCach(ch, kc) {
    let lv = 1;
    for (const [tu, cap] of ch.capTheoKhoangCach) if (kc >= tu) lv = cap;
    return lv;
  }
  function mauKhung(ch, lvQuai, capTl) {
    const d = lvQuai - (capTl || 1);
    return d <= ch.mauKhung.xanhDenLech ? "xanh" : d <= ch.mauKhung.vangDenLech ? "vang" : "do";
  }
  function chonTheoTiLe(tiLe, r) {
    let tong = 0; for (const k in tiLe) tong += tiLe[k];
    let x = r * tong;
    for (const k in tiLe) { x -= tiLe[k]; if (x < 0) return k; }
    return Object.keys(tiLe).pop();
  }

  function taoBoQuai(the) {
    const ch = the.ch, rng = the.rng || Math.random, bayGio = the.bayGio || Date.now;
    const ds = [];
    let hen = (the.hen || []).filter(t => Number.isFinite(t)).slice(0, ch.soQuai);
    let soId = 0;

    const dungDuoc = (x, z) => the.diDuoc(Math.floor(x), Math.floor(z));
    // Đường thẳng từ (x0, z0) tới (x1, z1) đi được hết (bước 0,3 ô)
    function thongDuong(x0, z0, x1, z1) {
      const kc = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.ceil(kc / 0.3));
      for (let i = 1; i <= n; i++) if (!dungDuoc(x0 + (x1 - x0) * i / n, z0 + (z1 - z0) * i / n)) return false;
      return true;
    }
    const kcCong = (x, z) => { let m = Infinity; for (const c of the.cong || []) m = Math.min(m, Math.hypot(c.x - x, c.z - z)); return m; };

    function sinh() {
      for (let lan = 0; lan < ch.lanThuSinh; lan++) {
        const ox = Math.floor(rng() * the.W), oy = Math.floor(rng() * the.H);
        if (!the.diDuoc(ox, oy)) continue;
        const x = ox + 0.5, z = oy + 0.5, kc = kcCong(x, z);
        if (kc < ch.khongGanCong) continue;
        if (ds.some(q => Math.hypot(q.x - x, q.z - z) < ch.cachNhau)) continue;
        const q = { id: ++soId, ma: chonTheoTiLe(ch.loai, rng()), lv: capTheoKhoangCach(ch, kc), x, z, nhaX: x, nhaZ: z,
          trangThai: "dung", cho: ch.dungGiay[0] + rng() * (ch.dungGiay[1] - ch.dungGiay[0]), huong: rng() * Math.PI * 2, mo: 1, dich: null };
        ds.push(q);
        return q;
      }
      return null; // thung lũng chật: thử lại ở lần hẹn sau
    }

    function chonDich(q) {
      for (let lan = 0; lan < 6; lan++) {
        const g = rng() * Math.PI * 2, r = 1 + rng() * (ch.banKinhLangThang - 1);
        const x = q.nhaX + Math.cos(g) * r, z = q.nhaZ + Math.sin(g) * r;
        if (thongDuong(q.x, q.z, x, z)) return { x, z };
      }
      return null;
    }

    function mat(q) {
      const i = ds.indexOf(q);
      if (i >= 0) ds.splice(i, 1);
      hen.push(bayGio() + ch.hoiSinhGiay * 1000);
    }

    function capNhat(dt) {
      const bay = bayGio();
      // tới hẹn thì quái mới xuất hiện; thiếu (lần đầu vào) thì sinh đủ
      // (không còn chỗ sinh thì hẹn lại sau thuLaiGiay, không thử mỗi khung)
      const thuLai = bay + ch.thuLaiGiay * 1000;
      hen = hen.map(t => (t > bay || sinh() ? t : thuLai)).filter(t => t > bay);
      while (ds.length + hen.length < ch.soQuai) if (!sinh()) { hen.push(thuLai); break; }
      for (let i = ds.length - 1; i >= 0; i--) {
        const q = ds[i];
        if (q.trangThai === "giu") continue;
        if (q.trangThai === "chay") {
          q.x += Math.sin(q.huong) * ch.tocDoChay * dt; q.z += Math.cos(q.huong) * ch.tocDoChay * dt;
          q.mo -= dt / ch.chayGiay;
          if (q.mo <= 0) mat(q);
          continue;
        }
        // chỗ đứng vừa bị chặn (tường mới, lãnh địa): quái đi chỗ khác, xuất hiện lại sau
        if (!dungDuoc(q.x, q.z)) { ds.splice(i, 1); hen.push(bay + ch.hoiSinhGiay * 1000); continue; }
        if (q.trangThai === "dung") {
          q.cho -= dt;
          if (q.cho > 0) continue;
          q.dich = chonDich(q);
          if (q.dich) q.trangThai = "di"; else q.cho = 0.5;
          continue;
        }
        // "di"
        const dx = q.dich.x - q.x, dz = q.dich.z - q.z, kc = Math.hypot(dx, dz), buoc = ch.tocDo * dt;
        q.huong = Math.atan2(dx, dz);
        if (kc <= buoc) { q.x = q.dich.x; q.z = q.dich.z; q.dich = null; q.trangThai = "dung"; q.cho = ch.dungGiay[0] + rng() * (ch.dungGiay[1] - ch.dungGiay[0]); continue; }
        const nx = q.x + dx / kc * buoc, nz = q.z + dz / kc * buoc;
        if (!dungDuoc(nx, nz)) { q.dich = null; q.trangThai = "dung"; q.cho = 0.5; continue; }
        q.x = nx; q.z = nz;
      }
    }

    return {
      ds, capNhat,
      giu(q) { q.trangThai = "giu"; q.dich = null; },
      tha(q) { if (q.trangThai === "giu") { q.trangThai = "dung"; q.cho = ch.dungGiay[0]; } },
      // thua trận: chạy ngược hướng Thủ lĩnh, mờ dần rồi mất (không có cảnh chết)
      boChay(q, tuX, tuZ) { q.trangThai = "chay"; q.dich = null; q.huong = Math.atan2(q.x - tuX, q.z - tuZ); },
      xoa: mat,
      hen: () => hen.slice(),
      theoId: id => ds.find(q => q.id === id) || null
    };
  }

  goc.KC_DT_QUAI_BAN_DO = { taoBoQuai, capTheoKhoangCach, mauKhung };
})(typeof window !== "undefined" ? window : globalThis);
// 30/10/2026 - BƯỚC: TC_D06A
