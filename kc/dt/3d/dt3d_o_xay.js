// ================================================================
// FILE: dt/3d/dt3d_o_xay.js  (ES module) - PHẦN VẼ 3D: SOI ĐẤT (Ô XÂY ĐƯỢC)
// CHỨC NĂNG: Tô từng ô của một móng nhà: XANH = xây được, ĐỎ = không (lý do do LÕI trả:
//            dt_ban_do.js oXayDuocVung). TC_D02B2a chỉ soi, chưa xây; TC_D02B2b dùng lại phần
//            này khi bé chọn chỗ dựng lều. Ô tô nổi trên mặt đất, không bị sương mù làm tối.
// HÀM KHAI RA:
//   taoSoiDat(ctx, diaHinh, kiem(x, y, rong, sau) -> { duoc, lyDo, oHong[] })
//     -> { hien(x, y, rong, sau) -> kết quả kiểm, hienO([{x, y}], hong(x, y) -> bool) (TC_D02C: đoạn tường),
//          an(), dangHien() }
//   taoVeLanhDia(ctx, diaHinh, W, H) -> { ve(mặt nạ của mình | null, [mặt nạ bạn khác]) } (TC_D02C): tô nhạt
//     lãnh địa (vàng: của con, đỏ: của bạn khác) sát mặt đất
// LUẬT NỐI: dùng ctx (dt3d_canh.js), diaHinh.doCao (dt3d_dia_hinh.js).
// BƯỚC: TC_D02B2a; TC_D02C (đoạn tường, lãnh địa)
// NGÀY: 26/10/2026; 28/10/2026
// ================================================================
import * as THREE from "three";

const TOI_DA = 32; // móng to nhất 5 x 5 ô; đoạn tường tối đa doanToiDa (20) ô

const caoO = (diaHinh, ox, oy) => Math.max(diaHinh.doCao(ox + 0.05, oy + 0.05), diaHinh.doCao(ox + 0.95, oy + 0.05), diaHinh.doCao(ox + 0.05, oy + 0.95), diaHinh.doCao(ox + 0.95, oy + 0.95), diaHinh.MUC_NUOC);

export function taoVeLanhDia(ctx, diaHinh, W, H) {
  const hinh = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const vl = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.28, depthWrite: false });
  let o = null;
  const VANG = new THREE.Color("#ffd24a"), DO = new THREE.Color("#ff5a5a"), m = new THREE.Matrix4();
  function ve(minh, khac) {
    const ds = [];
    const them = (mat, mau) => { if (mat) for (let i = 0; i < mat.length; i++) if (mat[i]) ds.push([i, mau]); };
    them(minh, VANG); for (const k of khac || []) them(k, DO);
    if (!o || o.instanceMatrix.count < ds.length) { // lớn dần theo số ô (khỏi giữ sẵn 16 nghìn ô)
      if (o) { ctx.canh.remove(o); o.dispose(); }
      o = new THREE.InstancedMesh(hinh, vl, Math.max(256, ds.length * 2));
      o.frustumCulled = false; o.renderOrder = 2; o.setColorAt(0, VANG);
      ctx.canh.add(o);
    }
    ds.forEach(([i, mau], k) => {
      const ox = i % W, oy = (i - ox) / W;
      o.setMatrixAt(k, m.makeTranslation(ox + 0.5, caoO(diaHinh, ox, oy) + 0.035, oy + 0.5));
      o.setColorAt(k, mau);
    });
    o.count = ds.length; o.instanceMatrix.needsUpdate = true; if (o.instanceColor) o.instanceColor.needsUpdate = true;
  }
  return { ve };
}

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
      if (i >= TOI_DA) break;
      o.setMatrixAt(i, m.makeTranslation(ox + 0.5, caoO(diaHinh, ox, oy) + 0.06, oy + 0.5));
      o.setColorAt(i, hong.has(ox + "," + oy) ? DO : XANH);
      i++;
    }
    o.count = i; o.instanceMatrix.needsUpdate = true; o.instanceColor.needsUpdate = true;
    return kq;
  }
  // Tô một danh sách ô bất kỳ (đoạn tường): hong(x, y) = true thì đỏ
  function hienO(dsO, hong) {
    let i = 0;
    for (const c of dsO) {
      if (i >= TOI_DA) break;
      o.setMatrixAt(i, m.makeTranslation(c.x + 0.5, caoO(diaHinh, c.x, c.y) + 0.06, c.y + 0.5));
      o.setColorAt(i, hong(c.x, c.y) ? DO : XANH);
      i++;
    }
    o.count = i; o.instanceMatrix.needsUpdate = true; o.instanceColor.needsUpdate = true;
  }
  return { hien, hienO, an() { o.count = 0; }, dangHien: () => o.count > 0 };
}
// 28/10/2026 00:05 - BƯỚC: TC_D02C
