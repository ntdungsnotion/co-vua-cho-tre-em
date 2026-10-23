// ================================================================
// FILE: dt/3d/dt3d_dia_hinh.js  (ES module) - PHẦN VẼ 3D: ĐỊA HÌNH
// CHỨC NĂNG: Mặt đất (độ cao gợn nhẹ, phẳng quanh lều + ruộng, vách đồi ở 2 mép xa),
//            màu đất (cỏ, đất quanh lều, sỏi quanh mỏ, cát ven suối), mặt nước có vân
//            sóng trôi, cầu gỗ, rừng viền ngoài bản đồ (không chặt được).
//            Suối / cầu / ô đi được do LÕI tính (dt_lang.js); phần này chỉ vẽ theo.
// HÀM KHAI RA:
//   taoDiaHinh(ctx, moHinh, banDo, lang) -> { doCao(x, z), doCaoDi(x, z) (đứng trên cầu),
//        matDat (mesh để chạm), MUC_NUOC }
// LUẬT NỐI: dùng ctx (dt3d_canh.js), moHinh.BoNhieuBan (dt3d_mo_hinh.js), lang (lõi, chỉ đọc).
// BƯỚC: TC_D02A (tách từ dt_lang_3d.js của TC_D01C)
// NGÀY: 23/10/2026
// ================================================================
import * as THREE from "three";
import { bam, nhieu, mem, taoNgauNhien } from "./dt3d_canh.js";

export const MUC_NUOC = -0.32;

export function taoDiaHinh(ctx, moHinh, banDo, lang) {
  const W = banDo.rong, H = banDo.cao, nhe = ctx.nhe;
  const kcSuoi = lang.kcSuoi, nuaSuoi = lang.nuaSuoi;
  const phang = [{ x: banDo.leu.x, z: banDo.leu.z, r: 4 }, ...(banDo.ruong || []).map(r => ({ x: r.x, z: r.z, r: Math.max(r.rong, r.dai) * 0.75 + 0.8 }))];
  function doCao(x, z) {
    let h = 0.12 + (nhieu(x * 0.13, z * 0.13) - 0.5) * 0.55 + (nhieu(x * 0.6 + 40, z * 0.6) - 0.5) * 0.12;
    for (const p of phang) h = THREE.MathUtils.lerp(h, 0.1, 1 - mem(p.r * 0.6, p.r, Math.hypot(x - p.x, z - p.z)));
    // Vách thung lũng chỉ dựng ở hai mép XA camera (x < 0, z < 0); hai mép gần để phẳng,
    // nếu không đồi sẽ che mất làng
    const ngoai = Math.max(0, 1.5 - x, 1.5 - z);
    if (ngoai > 0) h += ngoai * ngoai * 0.015 + ngoai * (0.1 + nhieu(x * 0.18, z * 0.18) * 0.3);
    const lom = 1 - mem(nuaSuoi - 0.3, nuaSuoi + 1.3, kcSuoi(x, z));
    return THREE.MathUtils.lerp(h, -0.8, lom);
  }

  // Màu đất: sỏi xám quanh mỏ Đá, đất vàng nâu quanh mỏ Vàng (theo mỏ lúc dựng làng)
  const MAU = { co1: new THREE.Color("#79ad45"), co2: new THREE.Color("#5c9536"), co3: new THREE.Color("#a3c95c"), dat: new THREE.Color("#b48c58"),
    cat: new THREE.Color("#d2bf8a"), bun: new THREE.Color("#7f6d48"), da: new THREE.Color("#9d9a88"), vang: new THREE.Color("#b59a5a") };
  const mo = lang.nguon.filter(n => n.loai.startsWith("mo_")).map(n => ({ x: n.x, z: n.z, mau: n.loai === "mo_da" ? MAU.da : MAU.vang }));
  function mauDat(x, z, h, mau) {
    const n = nhieu(x * 0.22 + 7, z * 0.22), n2 = nhieu(x * 0.9, z * 0.9 + 11);
    mau.copy(MAU.co2).lerp(MAU.co1, mem(0.25, 0.65, n)).lerp(MAU.co3, mem(0.62, 0.9, n2) * 0.6);
    const dl = Math.hypot(x - banDo.leu.x, z - banDo.leu.z);
    mau.lerp(MAU.dat, (1 - mem(1.8, 3.8, dl + (n2 - 0.5) * 1.2)) * 0.85);
    for (const m of mo) { const d = Math.hypot(x - m.x, z - m.z); if (d < 2.6) mau.lerp(m.mau, (1 - mem(0.6, 2.4, d + (n2 - 0.5) * 1.2)) * 0.6); }
    mau.lerp(MAU.cat, 1 - mem(nuaSuoi + 0.2, nuaSuoi + 1.4, kcSuoi(x, z) + (n - 0.5)));
    if (h < MUC_NUOC + 0.05) mau.lerp(MAU.bun, 0.8);
    if (h > 2.5) mau.lerp(MAU.co2, 0.5).lerp(MAU.da, mem(4, 9, h + (n - 0.5) * 3) * 0.7); // vách đồi: cỏ sẫm rồi đá
    return mau;
  }
  const PAD = 26, SO = W + PAD * 2;
  const hinh = new THREE.PlaneGeometry(W + PAD * 2, H + PAD * 2, SO, SO);
  hinh.rotateX(-Math.PI / 2); hinh.translate(W / 2, 0, H / 2);
  {
    const vt = hinh.attributes.position, mau = new Float32Array(vt.count * 3), c = new THREE.Color();
    for (let i = 0; i < vt.count; i++) {
      const x = vt.getX(i), z = vt.getZ(i), h = doCao(x, z);
      vt.setY(i, h); mauDat(x, z, h, c).toArray(mau, i * 3);
    }
    hinh.setAttribute("color", new THREE.BufferAttribute(mau, 3));
    hinh.computeVertexNormals();
  }
  const matDat = new THREE.Mesh(hinh, new THREE.MeshLambertMaterial({ vertexColors: true }));
  matDat.receiveShadow = true;
  ctx.canh.add(matDat);

  // Nước: một mặt phẳng ở mực nước, địa hình che chỗ khô; vân sóng là ảnh vẽ bằng canvas, trôi chậm
  const anhSong = (() => {
    const cv = document.createElement("canvas"); cv.width = cv.height = 128; const g = cv.getContext("2d");
    g.fillStyle = "#4aa6dc"; g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 70; i++) {
      const x = bam(i, 1) * 128, y = bam(i, 2) * 128, r = 6 + bam(i, 3) * 14;
      g.strokeStyle = `rgba(255,255,255,${0.12 + bam(i, 4) * 0.2})`; g.lineWidth = 1.4;
      for (const dx of [-128, 0, 128]) for (const dy of [-128, 0, 128]) { g.beginPath(); g.ellipse(x + dx, y + dy, r, r * 0.35, 0, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
    }
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(W / 5, H / 5); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const nuoc = new THREE.Mesh(new THREE.PlaneGeometry(W + 52, H + 52).rotateX(-Math.PI / 2).translate(W / 2, MUC_NUOC, H / 2),
    new THREE.MeshStandardMaterial({ map: anhSong, transparent: true, opacity: 0.86, roughness: 0.15, metalness: 0.05 }));
  nuoc.receiveShadow = !nhe;
  ctx.canh.add(nuoc);
  ctx.moiKhung((dt, t) => anhSong.offset.set(t * 0.012, t * 0.02));

  // Cầu gỗ (hướng do lõi tính: ngang dòng suối)
  for (const c of lang.cau) {
    const bc = new moHinh.BoNhieuBan("building_bridge_A", 1);
    bc.them(c.x, 0.02, c.z, 2.2, THREE.MathUtils.radToDeg(c.goc) + 90);
  }
  function doCaoDi(x, z) { // chiều cao chân nhân vật: trên cầu thì đứng trên mặt cầu
    const h = doCao(x, z);
    for (const c of lang.cau) {
      const dx = x - c.x, dz = z - c.z, s = dx * c.ngang.x + dz * c.ngang.z, w = dx * c.doc.x + dz * c.doc.z;
      if (Math.abs(s) < 2.9 && Math.abs(w) < 0.9) return Math.max(h, 0.3 - Math.max(0, Math.abs(s) - 1.6) * 0.15);
    }
    return h;
  }

  // Viền ngoài lưới (không đi tới được): rừng thông phủ vách đồi ở hai mép xa; hai mép gần
  // chỉ có cây lẻ thấp để không che làng
  if (banDo.vien) {
    const ngauNhien = taoNgauNhien(banDo.hatGiong + 101);
    const boVien = [new moHinh.BoNhieuBan("tree_single_A", banDo.vien.soCayXa + banDo.vien.soCayGan), new moHinh.BoNhieuBan("tree_single_B", banDo.vien.soCayXa + banDo.vien.soCayGan)];
    const dat = (x, z, ti) => boVien[ngauNhien() < 0.55 ? 0 : 1].them(x, doCao(x, z), z, ti, ngauNhien() * 360);
    for (let i = 0; i < banDo.vien.soCayXa; i++) {
      const t = ngauNhien() * (W + 20) - 14, lech = 0.5 + Math.pow(ngauNhien(), 1.6) * 20;
      if (ngauNhien() < 0.5) dat(t, -lech, 1.8 + ngauNhien() * 0.6); else dat(-lech, t, 1.8 + ngauNhien() * 0.6);
    }
    for (let i = 0; i < banDo.vien.soCayGan; i++) {
      const t = ngauNhien() * (W + 8), lech = 1 + ngauNhien() * 6;
      if (ngauNhien() < 0.5) dat(t, H + lech, 1.6 + ngauNhien() * 0.4); else dat(W + lech, t, 1.6 + ngauNhien() * 0.4);
    }
  }
  return { doCao, doCaoDi, matDat, MUC_NUOC };
}
// 23/10/2026 18:05 - BƯỚC: TC_D02A
