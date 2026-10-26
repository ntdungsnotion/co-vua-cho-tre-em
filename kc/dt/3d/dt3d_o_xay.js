// ================================================================
// FILE: dt/3d/dt3d_o_xay.js  (ES module) - PHẦN VẼ 3D: SOI ĐẤT (Ô XÂY ĐƯỢC)
// CHỨC NĂNG: Tô từng ô của một móng nhà: XANH = xây được, ĐỎ = không (lý do do LÕI trả:
//            dt_ban_do.js oXayDuocVung). TC_D02B2a chỉ soi, chưa xây; TC_D02B2b dùng lại phần
//            này khi bé chọn chỗ dựng lều. Ô tô nổi trên mặt đất, không bị sương mù làm tối.
// HÀM KHAI RA:
//   taoSoiDat(ctx, diaHinh, kiem(x, y, rong, sau) -> { duoc, lyDo, oHong[] })
//     -> { hien(x, y, rong, sau) -> kết quả kiểm, an(), dangHien() }
// LUẬT NỐI: dùng ctx (dt3d_canh.js), diaHinh.doCao (dt3d_dia_hinh.js).
// BƯỚC: TC_D02B2a
// NGÀY: 26/10/2026
// ================================================================
import * as THREE from "three";

const TOI_DA = 25; // móng to nhất 5 x 5 ô

export function taoSoiDat(ctx, diaHinh, kiem) {
  const hinh = new THREE.PlaneGeometry(0.92, 0.92).rotateX(-Math.PI / 2);
  const vl = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.72, depthWrite: false });
  const o = new THREE.InstancedMesh(hinh, vl, TOI_DA);
  o.count = 0; o.frustumCulled = false; o.renderOrder = 3; o.userData.khongSuong = true;
  o.setColorAt(0, new THREE.Color());
  ctx.canh.add(o);
  const XANH = new THREE.Color("#2ee860"), DO = new THREE.Color("#ff1a1a"), m = new THREE.Matrix4();
  let tPhap = 0;
  ctx.moiKhung(dt => { if (o.count) { tPhap += dt; vl.opacity = 0.72 + Math.sin(tPhap * 5) * 0.12; } });

  function hien(x, y, rong, sau) {
    const kq = kiem(x, y, rong, sau);
    const hong = new Set(kq.oHong.map(c => c.x + "," + c.y));
    let i = 0;
    for (let oy = y; oy < y + sau; oy++) for (let ox = x; ox < x + rong; ox++) {
      const cao = Math.max(diaHinh.doCao(ox + 0.05, oy + 0.05), diaHinh.doCao(ox + 0.95, oy + 0.05), diaHinh.doCao(ox + 0.05, oy + 0.95), diaHinh.doCao(ox + 0.95, oy + 0.95), diaHinh.MUC_NUOC);
      o.setMatrixAt(i, m.makeTranslation(ox + 0.5, cao + 0.06, oy + 0.5));
      o.setColorAt(i, hong.has(ox + "," + oy) ? DO : XANH);
      i++;
    }
    o.count = i; o.instanceMatrix.needsUpdate = true; o.instanceColor.needsUpdate = true;
    return kq;
  }
  return { hien, an() { o.count = 0; }, dangHien: () => o.count > 0 };
}
// 26/10/2026 22:05 - BƯỚC: TC_D02B2a
