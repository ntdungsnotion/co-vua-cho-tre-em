// ================================================================
// FILE: dt/dt_luoi.js
// CHỨC NĂNG: LÕI LƯỚI BẢN ĐỒ + TÌM ĐƯỜNG của Đấu Trường Tri Thức. Không đụng DOM,
//            không đụng Three.js: chạy được trong node (kiểm thử) và dùng chung cho
//            mọi cách vẽ (3D hôm nay, 2D nếu phải đổi). Bản đồ là lưới ô vuông 1 x 1
//            (1 ô = 1 đơn vị thế giới 3D), ô (x, y) có tâm ở (x + 0,5 ; y + 0,5).
//            - taoLuoi / datChan / diDuoc: ô bị chặn (cây, đá, lều, nước sâu)
//            - timDuong: A* 8 hướng, không cắt góc, đích bị chặn thì tới ô trống gần nhất
//            - lamMuot: kéo thẳng đường (bỏ điểm thừa khi nhìn thấy nhau) để đi tự nhiên
//            - oTrongGan: ô trống gần một ô (chỗ đứng chặt cây, đào mỏ)
// BƯỚC: TC_D01C (mẫu thử 3D); TC_D02B2a (timDuong ganNhat: lệnh đi tới chỗ gần nhất)
// NGÀY: 23/10/2026; 26/10/2026
// ================================================================
(function (goc) {
  "use strict";
  const CHEO = Math.SQRT2;

  function taoLuoi(rong, cao) {
    return { rong, cao, chan: new Uint8Array(rong * cao) };
  }
  const trong = (l, x, y) => x >= 0 && y >= 0 && x < l.rong && y < l.cao;
  const diDuoc = (l, x, y) => trong(l, x, y) && l.chan[y * l.rong + x] === 0;
  function datChan(l, x, y, chan) {
    if (trong(l, x, y)) l.chan[y * l.rong + x] = chan ? 1 : 0;
  }
  // Ô chứa một điểm thế giới (x, z)
  const oCuaDiem = (x, z) => ({ x: Math.floor(x), y: Math.floor(z) });

  // Ô trống gần (x, y) nhất theo vòng mở rộng; uuTien: ô gần điểm này hơn thì chọn trước
  function oTrongGan(l, x, y, uuTien, banKinhToiDa) {
    if (diDuoc(l, x, y)) return { x, y };
    const R = banKinhToiDa || Math.max(l.rong, l.cao);
    for (let r = 1; r <= R; r++) {
      let tot = null, diemTot = Infinity;
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const nx = x + dx, ny = y + dy;
        if (!diDuoc(l, nx, ny)) continue;
        const d = uuTien ? Math.hypot(nx - uuTien.x, ny - uuTien.y) : Math.hypot(dx, dy);
        if (d < diemTot) { diemTot = d; tot = { x: nx, y: ny }; }
      }
      if (tot) return tot;
    }
    return null;
  }

  // Hàng đợi ưu tiên (đống nhị phân) cho A*
  function taoDong() {
    const a = [];
    return {
      get size() { return a.length; },
      push(v, k) {
        a.push([k, v]); let i = a.length - 1;
        while (i > 0) { const p = (i - 1) >> 1; if (a[p][0] <= a[i][0]) break; [a[p], a[i]] = [a[i], a[p]]; i = p; }
      },
      pop() {
        const top = a[0][1], cuoi = a.pop();
        if (a.length) {
          a[0] = cuoi; let i = 0;
          for (;;) {
            const l = 2 * i + 1, r = l + 1; let m = i;
            if (l < a.length && a[l][0] < a[m][0]) m = l;
            if (r < a.length && a[r][0] < a[m][0]) m = r;
            if (m === i) break;
            [a[m], a[i]] = [a[i], a[m]]; i = m;
          }
        }
        return top;
      }
    };
  }

  // A* 8 hướng. Trả mảng ô [{x,y}] từ ô ĐẦU (không gồm) tới ô ĐÍCH (gồm);
  // [] nếu đang đứng ở đích; null nếu không tới được.
  // Đích bị chặn (cây, đá) thì đi tới ô trống gần đích nhất, ưu tiên phía mình đứng.
  // ganNhat (TC_D02B2a, lệnh đi của bé như Đế Chế): không tới được thì đi tới ô tới được
  // gần đích nhất (chạm giữa rừng rậm -> đi tới bìa rừng) thay vì trả null.
  function timDuong(l, tu, den, ganNhat) {
    if (!diDuoc(l, tu.x, tu.y)) { const t = oTrongGan(l, tu.x, tu.y); if (!t) return null; tu = t; }
    let dich = den;
    if (!diDuoc(l, den.x, den.y)) { dich = oTrongGan(l, den.x, den.y, tu); if (!dich) return ganNhat ? [] : null; }
    if (tu.x === dich.x && tu.y === dich.y) return [];
    const N = l.rong * l.cao, G = new Float64Array(N).fill(Infinity), cha = new Int32Array(N).fill(-1), dong = new Uint8Array(N);
    const h = (x, y) => { const dx = Math.abs(x - dich.x), dy = Math.abs(y - dich.y); return (dx + dy) + (CHEO - 2) * Math.min(dx, dy); };
    const s = tu.y * l.rong + tu.x, e = dich.y * l.rong + dich.x;
    G[s] = 0; const q = taoDong(); q.push(s, h(tu.x, tu.y));
    while (q.size) {
      const c = q.pop();
      if (dong[c]) continue;
      if (c === e) break;
      dong[c] = 1;
      const cx = c % l.rong, cy = (c - cx) / l.rong;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = cx + dx, ny = cy + dy;
        if (!diDuoc(l, nx, ny)) continue;
        if (dx && dy && (!diDuoc(l, cx + dx, cy) || !diDuoc(l, cx, cy + dy))) continue; // không cắt góc
        const n = ny * l.rong + nx, g = G[c] + (dx && dy ? CHEO : 1);
        if (g < G[n]) { G[n] = g; cha[n] = c; q.push(n, g + h(nx, ny)); }
      }
    }
    let cuoi = e;
    if (cha[e] < 0) {
      if (!ganNhat) return null;
      let kc = Math.hypot(tu.x - den.x, tu.y - den.y); cuoi = s;
      for (let c = 0; c < N; c++) {
        if (G[c] === Infinity) continue;
        const cx = c % l.rong, d = Math.hypot(cx - den.x, (c - cx) / l.rong - den.y);
        if (d < kc - 1e-9) { kc = d; cuoi = c; }
      }
      if (cuoi === s) return [];
    }
    const duong = [];
    for (let c = cuoi; c !== s; c = cha[c]) duong.push({ x: c % l.rong, y: Math.floor(c / l.rong) });
    return duong.reverse();
  }

  // Hai tâm ô có "nhìn thấy" nhau không (mọi ô đoạn thẳng đi qua đều trống,
  // kiểm cả hai bên đường để nhân vật không cạ vào góc cây)
  function thayNhau(l, a, b) {
    const x0 = a.x + 0.5, y0 = a.y + 0.5, x1 = b.x + 0.5, y1 = b.y + 0.5;
    const dai = Math.hypot(x1 - x0, y1 - y0), buoc = Math.max(1, Math.ceil(dai * 4));
    const nx = -(y1 - y0) / (dai || 1) * 0.3, ny = (x1 - x0) / (dai || 1) * 0.3;
    for (let i = 0; i <= buoc; i++) {
      const t = i / buoc, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
      if (!diDuoc(l, Math.floor(x + nx), Math.floor(y + ny)) || !diDuoc(l, Math.floor(x - nx), Math.floor(y - ny))) return false;
    }
    return true;
  }

  // Bỏ các điểm giữa khi điểm trước và điểm sau nhìn thấy nhau
  function lamMuot(l, tu, duong) {
    if (!duong || duong.length < 2) return duong;
    const kq = []; let neo = tu;
    for (let i = 0; i < duong.length; i++) {
      const sau = duong[i + 1];
      if (sau && thayNhau(l, neo, sau)) continue;
      kq.push(duong[i]); neo = duong[i];
    }
    return kq;
  }

  goc.KC_DT_LUOI = { taoLuoi, datChan, diDuoc, oCuaDiem, oTrongGan, timDuong, thayNhau, lamMuot };
})(typeof window !== "undefined" ? window : globalThis);
// 26/10/2026 22:05 - BƯỚC: TC_D02B2a
