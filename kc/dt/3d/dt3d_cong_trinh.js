// ================================================================
// FILE: dt/3d/dt3d_cong_trinh.js  (ES module) - PHẦN VẼ 3D: CÔNG TRÌNH
// CHỨC NĂNG: Lều da Đồ đá (dựng bằng hình khối: bộ KayKit chỉ có sạp chợ trung cổ), lửa
//            trại có ngọn lửa + đèn chập chờn (đồ họa Nhẹ bỏ đèn), ruộng (luống cày, có mầm
//            hoặc không), đồ trang trí quanh lều và dưới suối (thùng, bao, xe cút kít, cờ...).
//            Chỗ đứng / ô chặn do LÕI tính (dt_lang.js); phần này chỉ vẽ.
// HÀM KHAI RA:
//   taoCongTrinh(ctx, moHinh, diaHinh, banDo, huongCam) -> { leu, lua }
// LUẬT NỐI: dùng ctx (dt3d_canh.js), moHinh (dt3d_mo_hinh.js), diaHinh.doCao (dt3d_dia_hinh.js).
// BƯỚC: TC_D02A (tách từ dt_lang_3d.js của TC_D01C)
// NGÀY: 23/10/2026
// ================================================================
import * as THREE from "three";
import { bam } from "./dt3d_canh.js";

export function taoCongTrinh(ctx, moHinh, diaHinh, banDo, huongCam) {
  const nhe = ctx.nhe, doCao = diaHinh.doCao;

  // Lều da hình nón, cọc gỗ ló trên đỉnh, cửa tối, dải hoa văn
  const leu = new THREE.Group();
  {
    const R = banDo.leu.ti * 0.32, C = banDo.leu.ti * 0.62;
    const cv = document.createElement("canvas"); cv.width = 256; cv.height = 64; const g = cv.getContext("2d");
    g.fillStyle = "#c9a476"; g.fillRect(0, 0, 256, 64);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(110,70,35,${0.08 + bam(i, 3) * 0.12})`; g.fillRect(bam(i, 1) * 256, bam(i, 2) * 64, 18, 3); }
    g.fillStyle = "#9b4a2c"; g.fillRect(0, 40, 256, 6); for (let i = 0; i < 16; i++) { g.beginPath(); g.moveTo(i * 16, 40); g.lineTo(i * 16 + 8, 32); g.lineTo(i * 16 + 16, 40); g.fill(); }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.repeat.x = 3;
    const vai = new THREE.Mesh(new THREE.ConeGeometry(R, C, 9, 1, true), new THREE.MeshLambertMaterial({ map: t, side: THREE.DoubleSide }));
    vai.position.y = C / 2; vai.castShadow = vai.receiveShadow = !nhe; leu.add(vai);
    const vlGo = new THREE.MeshLambertMaterial({ color: "#6b4524" });
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2, coc = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, C * 1.25, 5), vlGo);
      coc.position.set(Math.cos(a) * R * 0.5, C * 0.62, Math.sin(a) * R * 0.5); coc.lookAt(0, C * 1.6, 0); coc.rotateX(Math.PI / 2);
      coc.castShadow = !nhe; leu.add(coc);
    }
    const cua = new THREE.Mesh(new THREE.CircleGeometry(R * 0.42, 3), new THREE.MeshBasicMaterial({ color: "#2a1a10" }));
    cua.position.set(0, R * 0.36, R * 0.72); cua.rotation.set(-0.42, 0, Math.PI / 2); leu.add(cua);
    leu.position.set(banDo.leu.x, doCao(banDo.leu.x, banDo.leu.z) - 0.05, banDo.leu.z);
    leu.rotation.y = Math.atan2(huongCam.x, huongCam.z) + 0.35; // cửa quay về phía camera
    ctx.canh.add(leu);
  }

  // Ruộng: tấm phẳng sát đất, luống cày vẽ bằng canvas ('mam' = có mầm xanh). TC_D03: vòng đời ruộng
  for (const r of banDo.ruong || []) {
    const cv = document.createElement("canvas"); cv.width = 128; cv.height = 128; const g = cv.getContext("2d");
    g.fillStyle = "#8a6038"; g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 8; i++) { g.fillStyle = "#6e4a2a"; g.fillRect(0, i * 16 + 9, 128, 5); g.fillStyle = "#a57a4c"; g.fillRect(0, i * 16 + 3, 128, 3); }
    if (r.mam) for (let i = 0; i < 90; i++) { g.fillStyle = bam(i, 9) < 0.5 ? "#7cc24a" : "#5ea83a"; g.beginPath(); g.ellipse(bam(i, 5) * 128, Math.floor(bam(i, 6) * 8) * 16 + 4, 3, 2, 0, 0, 7); g.fill(); }
    g.strokeStyle = "#5b3d22"; g.lineWidth = 6; g.strokeRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    const tam = new THREE.Mesh(new THREE.PlaneGeometry(r.rong, r.dai).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: t }));
    tam.position.set(r.x, 0.13, r.z); tam.rotation.y = THREE.MathUtils.degToRad(r.goc || 0); tam.receiveShadow = !nhe;
    ctx.canh.add(tam);
  }

  // Trang trí
  const boTrangTri = {};
  for (const t of banDo.trangTri || []) {
    if (!boTrangTri[t.mo]) boTrangTri[t.mo] = new moHinh.BoNhieuBan(t.mo, 8);
    const y = t.mo.startsWith("water") ? diaHinh.MUC_NUOC : doCao(t.x, t.z);
    boTrangTri[t.mo].them(t.x, y, t.z, t.ti, t.goc);
  }

  // Lửa trại: củi + ngọn lửa phát sáng + đèn chập chờn
  const lua = new THREE.Group();
  if (banDo.lua) {
    const cui = moHinh.mauGoc.resource_lumber;
    for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(cui.geometry, moHinh.vatLieu); m.scale.setScalar(0.9); m.rotation.y = i * Math.PI / 3; m.castShadow = !nhe; lua.add(m); }
    const ngon = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.6, 7).translate(0, 0.3, 0), new THREE.MeshBasicMaterial({ color: "#ffb03a" }));
    const loi = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.36, 7).translate(0, 0.18, 0), new THREE.MeshBasicMaterial({ color: "#fff2a8" }));
    ngon.position.y = loi.position.y = 0.1; lua.add(ngon, loi);
    let den = null;
    if (!nhe) { den = new THREE.PointLight("#ff9a3a", 4, 6, 1.6); den.position.y = 0.9; lua.add(den); }
    lua.position.set(banDo.lua.x, doCao(banDo.lua.x, banDo.lua.z), banDo.lua.z);
    ctx.canh.add(lua);
    ctx.moiKhung((dt, t) => {
      const nhap = 1 + Math.sin(t * 13) * 0.08 + Math.sin(t * 7.3) * 0.06;
      ngon.scale.set(1, nhap, 1); loi.scale.set(1, 2 - nhap, 1);
      if (den) den.intensity = 5 + Math.sin(t * 11) * 1.2 + Math.sin(t * 17) * 0.8;
    });
  }
  return { leu, lua };
}
// 23/10/2026 18:05 - BƯỚC: TC_D02A
