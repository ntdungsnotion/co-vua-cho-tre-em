// ================================================================
// FILE: dt/3d/dt3d_den_chon.js  (ES module) - PHẦN VẼ 3D: ĐÈN CHIẾU VẬT ĐANG CHỌN
// CHỨC NĂNG: Vật đang chọn (nhân vật, quái, công trình) luôn được "ánh đèn chiếu vào": đèn rọi thật làm vật sáng hơn,
//            một chùm sáng mờ từ trên rọi xuống và một vệt sáng tròn trên mặt đất. Giữ nguyên cho tới khi bỏ chọn
//            (thay cho vòng tròn nhỏ lệch chân, chỉ thấy lúc bấm).
// HÀM KHAI RA:
//   taoDenChon(ctx) -> { dat(nhom3d | null) }   nhom3d: THREE.Group / Object3D của vật; null = tắt.
//   Vật bị ẩn (sương đen, quái chạy mất) hoặc bị gỡ khỏi cảnh thì đèn tự tắt. Các lưới ẩn (vùng bấm) và vòng đỏ
//   dưới chân quái không tính vào kích thước.
// BƯỚC: TC_D06C2e
// NGÀY: 05/11/2026
// ================================================================
import * as THREE from "three";

export function taoDenChon(ctx) {
  const mau = new THREE.Color("#ffe9a8");
  // đèn rọi thật: luôn ở trong cảnh (đổi số đèn sẽ phải biên dịch lại mọi vật liệu), tắt bằng cường độ 0
  const den = new THREE.SpotLight(mau, 0, 14, 0.5, 0.65, 1.2);
  ctx.canh.add(den, den.target);

  // vệt sáng tròn trên đất
  const cv = document.createElement("canvas"); cv.width = cv.height = 128;
  const g = cv.getContext("2d"), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,240,190,0.95)"); gr.addColorStop(0.55, "rgba(255,225,140,0.45)"); gr.addColorStop(1, "rgba(255,210,100,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const vet = new THREE.Mesh(new THREE.CircleGeometry(1, 40).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  vet.renderOrder = 3; vet.visible = false; ctx.canh.add(vet);

  // chùm sáng: hình nón hở, màu mờ dần về 0 ở hai đầu (cộng sáng nên màu 0 = vô hình)
  const nonHinh = new THREE.CylinderGeometry(1.15, 0.85, 1, 28, 1, true).translate(0, 0.5, 0);
  const so = nonHinh.attributes.position.count, mauDinh = new Float32Array(so * 3);
  for (let i = 0; i < so; i++) { const k = nonHinh.attributes.position.getY(i) > 0.5 ? 0 : 0.5; mauDinh[i * 3] = k; mauDinh[i * 3 + 1] = k * 0.9; mauDinh[i * 3 + 2] = k * 0.55; }
  nonHinh.setAttribute("color", new THREE.BufferAttribute(mauDinh, 3));
  const chum = new THREE.Mesh(nonHinh, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false }));
  chum.renderOrder = 3; chum.visible = false; ctx.canh.add(chum);

  let vat = null, lech = new THREE.Vector3(), cao = 1, bk = 0.6, bat = 0;
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
    vat = o || null;
    if (!vat) return;
    tinhHop(vat);
    if (hop.isEmpty()) { vat = null; return; }
    vat.getWorldPosition(vt);
    hop.getCenter(lech); lech.sub(vt); lech.y = hop.min.y - vt.y; // lệch từ gốc vật tới tâm đáy
    cao = Math.max(0.8, hop.max.y - hop.min.y);
    bk = Math.max(0.5, Math.min(4, Math.hypot(hop.max.x - hop.min.x, hop.max.z - hop.min.z) / 2));
  }
  const bay = new THREE.Vector3();
  ctx.moiKhung((dt, t) => {
    const hien = !!vat && vat.visible && !!vat.parent;
    bat += ((hien ? 1 : 0) - bat) * Math.min(1, dt * 10);
    if (bat < 0.01) { den.intensity = 0; vet.visible = chum.visible = false; return; }
    vat.getWorldPosition(vt);
    bay.copy(vt).add(lech); // tâm đáy
    const nhap = 1 + Math.sin(t * 3) * 0.06, rong = bk * 1.25 + 0.35, treo = cao + 5;
    den.position.set(bay.x + 1.2, bay.y + treo, bay.z + 1.8); den.target.position.set(bay.x, bay.y + cao * 0.4, bay.z);
    den.angle = Math.min(0.9, Math.atan((rong + 0.4) / treo)); den.distance = treo + cao + 6;
    den.intensity = 38 * bat * nhap;
    vet.visible = true; vet.position.set(bay.x, bay.y + 0.05, bay.z); vet.scale.setScalar(rong * 1.1);
    vet.material.opacity = bat * (0.8 + Math.sin(t * 3) * 0.1);
    chum.visible = true; chum.position.set(bay.x, bay.y, bay.z);
    chum.scale.set(rong * 0.7, cao + 3.5, rong * 0.7);
    chum.material.opacity = bat * 0.2;
  });
  return { dat };
}
