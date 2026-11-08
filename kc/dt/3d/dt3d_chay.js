// ================================================================
// FILE: dt/3d/dt3d_chay.js  (ES module) - CÔNG TRÌNH BỊ ĐÁNH BỐC CHÁY (TC_D06C7e, người dùng 08/11/2026)
// CHỨC NĂNG: "Công trình còn trên 50% máu và dưới 100% thì cháy nhỏ, còn lại cháy to." Mức cháy theo luật dt_tru_tran.js mucChay
//            (cau_hinh.json chay.to): 1 = cháy nhỏ (1-2 ngọn lửa + khói xám mỏng), 2 = cháy to (nhiều ngọn lửa cao + khói đen dày,
//            đèn lửa chập chờn; đồ họa Nhẹ bỏ đèn). Cả công trình của mình lẫn của bạn (máu máy chủ trả). Sửa xong / đầy máu thì
//            tắt; đống gạch (sụp) không cháy. Lửa = sprite cộng màu (vẽ bằng canvas, không ảnh ngoài), mỗi ngọn tự nhảy theo thời gian.
// HÀM KHAI RA:
//   taoChay({ ctx, lang, cauHinh, doCao, hinhCt(id) -> { nhom, nha } | null }) -> { muc(id) -> 0 | 1 | 2, so() số công trình đang cháy }
// LUẬT NỐI: trang đã nạp dt_tru_tran.js (window.KC_DT_TRU_TRAN); ctx.moiKhung(dt) (dt3d_canh.js).
// BƯỚC: TC_D06C7e
// NGÀY: 08/11/2026
// ================================================================
import * as THREE from "three";

const TT = window.KC_DT_TRU_TRAN;

// Kết cấu ngọn lửa / khói vẽ một lần bằng canvas
function vanLua() {
  const c = document.createElement("canvas"); c.width = 64; c.height = 128;
  const g = c.getContext("2d");
  const gr = g.createRadialGradient(32, 92, 2, 32, 80, 60);
  gr.addColorStop(0, "rgba(255,236,120,1)"); gr.addColorStop(0.3, "rgba(255,150,30,1)");
  gr.addColorStop(0.65, "rgba(235,70,10,0.85)"); gr.addColorStop(1, "rgba(170,20,0,0)");
  g.fillStyle = gr;
  g.beginPath(); g.moveTo(32, 2); g.bezierCurveTo(58, 50, 62, 96, 32, 126); g.bezierCurveTo(2, 96, 6, 50, 32, 2); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function vanKhoi() {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  gr.addColorStop(0, "rgba(255,255,255,0.9)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function taoChay({ ctx, lang, cauHinh, doCao, hinhCt }) {
  const nhe = !!ctx.nhe, canh = ctx.canh;
  // lửa vẽ thường (cộng màu trên cỏ sáng thì bạc trắng) + một lớp sáng cộng màu nhỏ ở lõi cho rực
  const vanL = vanLua();
  const vlLua = new THREE.SpriteMaterial({ map: vanL, depthWrite: false, transparent: true });
  const vlLoi = new THREE.SpriteMaterial({ map: vanL, color: "#ffb347", blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.55 });
  const vlKhoi = new THREE.SpriteMaterial({ map: vanKhoi(), color: "#555", depthWrite: false, transparent: true, opacity: 0.5 });
  const dang = new Map(); // id -> { muc, nhom, lua[], khoi[], den }
  const hop = new THREE.Box3();

  // Chỗ lửa: nóc công trình (khung bao hình nhà), tường không có hình riêng: cao 1,2 ô
  function noc(ct) {
    const h = hinhCt ? hinhCt(ct.id) : null, cx = ct.x + ct.rong / 2, cz = ct.y + ct.sau / 2;
    if (h && h.nha) { hop.setFromObject(h.nha); if (isFinite(hop.max.y)) return { x: cx, z: cz, y0: doCao(cx, cz), cao: Math.max(0.6, hop.max.y - doCao(cx, cz)) }; }
    return { x: cx, z: cz, y0: doCao(cx, cz), cao: 1.2 };
  }
  function dot(ct, muc) {
    tat(ct.id);
    const p = noc(ct), nhom = new THREE.Group(), to = muc === 2;
    nhom.position.set(p.x, p.y0, p.z); canh.add(nhom);
    const rong = Math.max(0.5, Math.min(ct.rong, ct.sau) * 0.42), soLua = to ? (nhe ? 4 : 6) : (ct.rong * ct.sau > 1 ? 2 : 1);
    const lua = [], khoi = [];
    for (let i = 0; i < soLua; i++) {
      const s = new THREE.Sprite(i % 2 ? vlLoi : vlLua), g = (i / soLua) * Math.PI * 2 + Math.random();
      const r = soLua === 1 ? 0 : rong * (0.35 + Math.random() * 0.5);
      s.userData = { x: Math.sin(g) * r, z: Math.cos(g) * r, y: p.cao * (to ? 0.55 + Math.random() * 0.4 : 0.7 + Math.random() * 0.3),
        co: (to ? 1.4 + Math.random() * 0.8 : 0.5 + Math.random() * 0.25) * Math.max(0.7, Math.min(1.4, rong)), pha: Math.random() * 10 };
      nhom.add(s); lua.push(s);
    }
    const soKhoi = to ? (nhe ? 3 : 5) : 2;
    for (let i = 0; i < soKhoi; i++) {
      const s = new THREE.Sprite(vlKhoi.clone());
      s.material.color.set(to ? "#2b2622" : "#8a8580");
      s.userData = { t: i / soKhoi, x: (Math.random() - 0.5) * rong, z: (Math.random() - 0.5) * rong, y: p.cao * 0.9, len: to ? 3.2 : 1.8, co: to ? 1.3 : 0.7 };
      nhom.add(s); khoi.push(s);
    }
    let den = null;
    if (to && !nhe) { den = new THREE.PointLight("#ff7a2a", 2.2, 7, 2); den.position.set(0, p.cao, 0); nhom.add(den); }
    dang.set(ct.id, { muc, nhom, lua, khoi, den, ct });
  }
  function tat(id) {
    const d = dang.get(id); if (!d) return;
    canh.remove(d.nhom); for (const s of d.khoi) s.material.dispose();
    dang.delete(id);
  }

  let dem = 0, t = 0;
  ctx.moiKhung(dt => {
    t += dt;
    if ((dem += dt) >= 0.4) { // soát mức cháy của mọi công trình (máu đổi theo trận / máy chủ / sửa xong)
      dem = 0;
      const con = new Set();
      for (const ct of lang.congTrinh) {
        const m = TT ? TT.mucChay(cauHinh, ct) : 0;
        if (!m || !ct.xong) continue;
        con.add(ct.id);
        const d = dang.get(ct.id);
        if (!d || d.muc !== m) dot(ct, m);
      }
      for (const id of [...dang.keys()]) if (!con.has(id)) tat(id);
    }
    for (const d of dang.values()) { // ngọn lửa nhảy, khói bay lên rồi tan
      for (const s of d.lua) {
        const u = s.userData, k = 1 + 0.18 * Math.sin(t * 9 + u.pha) + 0.1 * Math.sin(t * 23 + u.pha * 2);
        s.scale.set(u.co * 0.6 * (2 - k), u.co * 1.2 * k, 1);
        s.position.set(u.x + Math.sin(t * 5 + u.pha) * 0.04, u.y + u.co * 0.45 * k, u.z);
      }
      for (const s of d.khoi) {
        const u = s.userData; u.t = (u.t + dt / (d.muc === 2 ? 2.6 : 3.4)) % 1;
        const c = u.co * (0.5 + u.t * 1.4);
        s.scale.set(c, c, 1); s.position.set(u.x + u.t * 0.5, u.y + u.t * u.len, u.z);
        s.material.opacity = (d.muc === 2 ? 0.7 : 0.4) * Math.sin(Math.PI * u.t);
      }
      if (d.den) d.den.intensity = 1.8 + 0.7 * Math.sin(t * 13) * Math.sin(t * 7.3);
    }
  });

  return { muc: id => (dang.get(id) || {}).muc || 0, so: () => dang.size };
}
// 08/11/2026 - BƯỚC: TC_D06C7e (cháy nhỏ / cháy to theo máu công trình)
