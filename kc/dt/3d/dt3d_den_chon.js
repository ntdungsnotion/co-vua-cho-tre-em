// ================================================================
// FILE: dt/3d/dt3d_den_chon.js  (ES module) - PHẦN VẼ 3D: VÒNG SÁNG DƯỚI CHÂN VẬT ĐANG CHỌN
// CHỨC NĂNG: Vật đang chọn (nhân vật, quái, công trình, cây, mỏ...) có một vòng sáng tròn trên mặt đất, đúng dưới chân,
//            giữ nguyên cho tới khi bỏ chọn. (Người dùng 05/11/2026: không cần cột sáng, chỉ cần vòng sáng dưới đất.)
// HÀM KHAI RA:
//   taoDenChon(ctx, doCao(x, z)) -> { dat(vat | null) }
//     vat: THREE.Object3D (người, quái, công trình) HOẶC { x, z, r } (điểm trên đất: cây, mỏ, bụi quả); null = tắt.
//   Vật bị ẩn (sương đen, quái chạy mất) hoặc bị gỡ khỏi cảnh thì đèn tự tắt. Các lưới ẩn (vùng bấm) và vòng đỏ
//   dưới chân quái không tính vào kích thước.
// BƯỚC: TC_D06C2e (+ bỏ cột sáng, thêm cây / mỏ)
// NGÀY: 05/11/2026
// ================================================================
import * as THREE from "three";

export function taoDenChon(ctx, doCao) {
  // vòng sáng: viền sáng rõ + quầng mờ bên trong, vẽ cộng sáng nên nhìn như ánh đèn trên đất
  const cv = document.createElement("canvas"); cv.width = cv.height = 256;
  const g = cv.getContext("2d"), gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, "rgba(255,225,140,0.30)"); gr.addColorStop(0.62, "rgba(255,225,140,0.38)");
  gr.addColorStop(0.78, "rgba(255,244,190,1)"); gr.addColorStop(0.88, "rgba(255,230,150,0.55)"); gr.addColorStop(1, "rgba(255,210,100,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const vet = new THREE.Mesh(new THREE.CircleGeometry(1, 48).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  vet.renderOrder = 3; vet.visible = false; ctx.canh.add(vet);

  let vat = null, diem = null, lech = new THREE.Vector3(), bk = 0.6, bat = 0;
  const hop = new THREE.Box3(), tam = new THREE.Box3(), vt = new THREE.Vector3();
  function tinhHop(o) {
    hop.makeEmpty();
    o.updateWorldMatrix(true, true);
    o.traverse(m => {
      if (!m.isMesh || !m.geometry) return;
      if (m.geometry.type === "RingGeometry") return;
      const vl = Array.isArray(m.material) ? m.material[0] : m.material;
      if (!vl || vl.visible === false) return;
      if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
      if (!m.geometry.boundingBox) return;
      tam.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld); hop.union(tam);
    });
  }
  function dat(o) {
    vat = null; diem = null;
    if (!o) return;
    if (!o.isObject3D) { diem = o; bk = Math.max(0.5, o.r || 0.9); return; }
    tinhHop(o);
    if (hop.isEmpty()) return;
    vat = o; o.getWorldPosition(vt);
    hop.getCenter(lech); lech.sub(vt); lech.y = 0; // lệch ngang từ gốc vật tới tâm thân
    bk = Math.max(0.5, Math.min(4, Math.hypot(hop.max.x - hop.min.x, hop.max.z - hop.min.z) / 2));
  }
  ctx.moiKhung((dt, t) => {
    const hien = diem ? true : !!vat && vat.visible && !!vat.parent;
    bat += ((hien ? 1 : 0) - bat) * Math.min(1, dt * 10);
    if (bat < 0.01 || (!vat && !diem)) { vet.visible = false; return; }
    let x, z, y;
    if (diem) { x = diem.x; z = diem.z; y = doCao ? doCao(x, z) : 0; }
    else { vat.getWorldPosition(vt); x = vt.x + lech.x; z = vt.z + lech.z; y = doCao ? doCao(x, z) : hop.min.y; }
    const rong = bk * 1.2 + 0.25, nhap = 1 + Math.sin(t * 3.2) * 0.04;
    vet.visible = true; vet.position.set(x, y + 0.06, z); vet.scale.setScalar(rong * nhap);
    vet.material.opacity = bat * (0.85 + Math.sin(t * 3.2) * 0.12);
  });
  return { dat };
}
