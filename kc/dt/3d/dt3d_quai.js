// ================================================================
// FILE: dt/3d/dt3d_quai.js  (ES module) - PHẦN VẼ 3D: QUÁI
// CHỨC NĂNG: Quái 3D dựng bằng hình khối (chưa có bộ mô hình quái CC0; thay ở TC_D19):
//            - slime_so: khối thạch xanh bóng, mang con số trên mình
//            - nam_chu_cai: nấm mũ đỏ chấm trắng, chữ cái trên mũ
//            - dom_dom: đom đóm bay, đuôi phát sáng, cánh vỗ
//            Mắt to tròn, động tác nhún / lắc / bay lơ lửng. Dễ thương vừa phải, không đáng sợ.
// HÀM KHAI RA:
//   taoQuai3d(ma, { nhe }) -> { nhom (gốc ở chân, mặt nhìn +z), cao, capNhat(dt, t),
//        chop(giây) (chớp trắng khi trúng), datChu(chữ), datMo(0..1) }
// LUẬT NỐI: không gọi phần nào khác; dt3d_tran.js đặt vị trí / hướng / động tác lớn.
// BƯỚC: TC_D05
// NGÀY: 29/10/2026
// ================================================================
import * as THREE from "three";

function anhChu(chu, mauChu, mauVien) { // chữ trên nền trong suốt -> Sprite
  const cv = document.createElement("canvas"); cv.width = cv.height = 128;
  const g = cv.getContext("2d");
  g.font = "900 92px system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.lineWidth = 14; g.strokeStyle = mauVien; g.strokeText(chu, 64, 70);
  g.fillStyle = mauChu; g.fillText(chu, 64, 70);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function taoMat(r) { // một con mắt: tròng trắng + con conNguoi + đốm sáng, nhìn +z
  const g = new THREE.Group();
  const trang = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.3 }));
  const conNguoi = new THREE.Mesh(new THREE.SphereGeometry(r * 0.58, 14, 10), new THREE.MeshStandardMaterial({ color: "#1d1630", roughness: 0.2 }));
  conNguoi.position.z = r * 0.55;
  const dom = new THREE.Mesh(new THREE.SphereGeometry(r * 0.18, 8, 6), new THREE.MeshBasicMaterial({ color: "#ffffff" }));
  dom.position.set(-r * 0.22, r * 0.22, r * 1.05);
  g.add(trang, conNguoi, dom);
  return g;
}

function slime() {
  const nhom = new THREE.Group(), than = new THREE.Group(); nhom.add(than);
  const hinh = new THREE.SphereGeometry(0.62, 40, 28);
  const p = hinh.attributes.position;
  for (let i = 0; i < p.count; i++) { // đáy phẳng, đỉnh hơi nhọn như giọt thạch
    let y = p.getY(i);
    if (y < -0.2) y = -0.2 - (y + 0.2) * 0.15;
    if (y > 0.3) { const k = (y - 0.3) / 0.32; p.setX(i, p.getX(i) * (1 - 0.25 * k)); p.setZ(i, p.getZ(i) * (1 - 0.25 * k)); y += k * 0.12; }
    p.setY(i, y);
  }
  hinh.computeVertexNormals(); hinh.translate(0, 0.23, 0);
  const vl = new THREE.MeshPhysicalMaterial({ color: "#56d460", roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.15, emissive: "#0d4a1a", emissiveIntensity: 0.35, transparent: true, opacity: 0.93 });
  const khoi = new THREE.Mesh(hinh, vl); khoi.castShadow = true; than.add(khoi);
  const loi = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 14), new THREE.MeshStandardMaterial({ color: "#2f9d3e", roughness: 0.5 }));
  loi.position.set(0, 0.32, -0.05); than.add(loi); // lõi sẫm bên trong
  const sang = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8).scale(1, 1.5, 0.6), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.8 }));
  sang.position.set(-0.26, 0.72, 0.36); sang.rotation.z = 0.5; than.add(sang);
  for (const s of [-1, 1]) { const m = taoMat(0.11); m.position.set(0.17 * s, 0.6, 0.49); than.add(m); }
  const chu = new THREE.Sprite(new THREE.SpriteMaterial({ map: anhChu("7", "#fff6a8", "#1d4d22"), depthTest: false }));
  chu.scale.setScalar(0.42); chu.position.set(0, 0.26, 0.66); than.add(chu);
  return {
    nhom, cao: 1.0, vlChop: [vl], chu,
    capNhat(dt, t) { const n = Math.sin(t * 3.4) * 0.06; than.scale.set(1 + n, 1 - n, 1 + n); }
  };
}

function nam() {
  const nhom = new THREE.Group(), than = new THREE.Group(); nhom.add(than);
  const diem = [[0, 0], [0.27, 0], [0.3, 0.08], [0.28, 0.3], [0.24, 0.5], [0.2, 0.58], [0, 0.6]].map(([x, y]) => new THREE.Vector2(x, y));
  const vlThan = new THREE.MeshStandardMaterial({ color: "#f4e3c1", roughness: 0.7 });
  const chan = new THREE.Mesh(new THREE.LatheGeometry(diem, 24), vlThan); chan.castShadow = true; than.add(chan);
  for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8).scale(1, 0.6, 1.3), new THREE.MeshStandardMaterial({ color: "#8a5a3a" })); b.position.set(0.13 * s, 0.04, 0.06); than.add(b); }
  const vlMu = new THREE.MeshStandardMaterial({ color: "#e0453b", roughness: 0.45, emissive: "#3a0805", emissiveIntensity: 0.3 });
  const mu = new THREE.Mesh(new THREE.SphereGeometry(0.62, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.72, 1), vlMu);
  mu.position.y = 0.52; mu.castShadow = true; than.add(mu);
  const day = new THREE.Mesh(new THREE.CircleGeometry(0.62, 32), new THREE.MeshStandardMaterial({ color: "#f0d6b0", side: THREE.DoubleSide }));
  day.rotation.x = Math.PI / 2; day.position.y = 0.52; than.add(day);
  const vlCham = new THREE.MeshStandardMaterial({ color: "#fff6ea", roughness: 0.6 });
  [[0.3, 0.55], [-0.35, 0.4], [0.05, 1.1], [-0.15, 2.2], [0.4, 2.9], [-0.4, 3.6], [0.2, 4.4], [-0.1, 5.3]].forEach(([r, a]) => {
    const gocDung = Math.acos(Math.min(1, Math.abs(r) + 0.15)), x = Math.sin(gocDung) * Math.cos(a), z = Math.sin(gocDung) * Math.sin(a);
    const cham = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 6).scale(1, 0.4, 1), vlCham);
    const v = new THREE.Vector3(x * 0.62, Math.cos(gocDung) * 0.62 * 0.72 + 0.52, z * 0.62);
    cham.position.copy(v); cham.lookAt(v.clone().multiplyScalar(2).setY(v.y * 2 - 0.52)); cham.rotateX(Math.PI / 2);
    than.add(cham);
  });
  for (const s of [-1, 1]) { const m = taoMat(0.075); m.position.set(0.1 * s, 0.32, 0.26); than.add(m); }
  const chu = new THREE.Sprite(new THREE.SpriteMaterial({ map: anhChu("A", "#fff6a8", "#5a1410"), depthTest: false }));
  chu.scale.setScalar(0.4); chu.position.set(0, 0.78, 0.5); than.add(chu);
  return {
    nhom, cao: 1.0, vlChop: [vlMu, vlThan], chu,
    capNhat(dt, t) { than.rotation.z = Math.sin(t * 2.6) * 0.07; than.position.y = Math.abs(Math.sin(t * 2.6)) * 0.03; }
  };
}

function domDom(nhe) {
  const nhom = new THREE.Group(), bay = new THREE.Group(); nhom.add(bay);
  const vlThan = new THREE.MeshStandardMaterial({ color: "#3d4386", roughness: 0.4 });
  const than = new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 14).scale(1, 0.85, 1.15), vlThan); than.castShadow = true; bay.add(than);
  const dau = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 14), vlThan); dau.position.set(0, 0.1, 0.3); bay.add(dau);
  const vlDuoi = new THREE.MeshStandardMaterial({ color: "#ffe680", emissive: "#ffcc22", emissiveIntensity: 1.6, roughness: 0.3 });
  const duoi = new THREE.Mesh(new THREE.SphereGeometry(0.27, 20, 14).scale(1, 0.9, 1.2), vlDuoi); duoi.position.set(0, -0.04, -0.38); bay.add(duoi);
  const quang = new THREE.Sprite(new THREE.SpriteMaterial({ map: (() => { const cv = document.createElement("canvas"); cv.width = cv.height = 64; const g = cv.getContext("2d"); const gr = g.createRadialGradient(32, 32, 2, 32, 32, 32); gr.addColorStop(0, "rgba(255,240,140,.9)"); gr.addColorStop(1, "rgba(255,240,140,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(cv); })(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  quang.scale.setScalar(1.5); quang.position.copy(duoi.position); bay.add(quang);
  if (!nhe) { const den = new THREE.PointLight("#ffd84a", 1.6, 3.5); den.position.copy(duoi.position); bay.add(den); }
  const vlCanh = new THREE.MeshStandardMaterial({ color: "#d8eeff", transparent: true, opacity: 0.6, side: THREE.DoubleSide, roughness: 0.2 });
  const canh = [];
  for (const s of [-1, 1]) {
    const tru = new THREE.Group(); tru.position.set(0.08 * s, 0.2, 0.02);
    const m = new THREE.Mesh(new THREE.CircleGeometry(0.3, 20).scale(0.55, 1, 1), vlCanh); m.position.y = 0.28; tru.add(m);
    tru.rotation.z = -0.5 * s; bay.add(tru); canh.push([tru, s]);
  }
  const vlRau = new THREE.MeshStandardMaterial({ color: "#2a2d5c" });
  for (const s of [-1, 1]) {
    const rau = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 5), vlRau); rau.position.set(0.08 * s, 0.4, 0.38); rau.rotation.set(0.5, 0, -0.3 * s); bay.add(rau);
    const dinh = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), vlRau); dinh.position.set(0.13 * s, 0.53, 0.46); bay.add(dinh);
  }
  for (const s of [-1, 1]) { const m = taoMat(0.07); m.position.set(0.1 * s, 0.16, 0.47); bay.add(m); }
  const chu = new THREE.Sprite(new THREE.SpriteMaterial({ map: anhChu("?", "#7a4b00", "#fff3b0"), depthTest: false }));
  chu.scale.setScalar(0.3); chu.position.set(0.3, 0.05, -0.38); bay.add(chu);
  const bong = new THREE.Mesh(new THREE.CircleGeometry(0.3, 20), new THREE.MeshBasicMaterial({ color: "#000", transparent: true, opacity: 0.18, depthWrite: false }));
  bong.rotation.x = -Math.PI / 2; bong.position.y = 0.01; nhom.add(bong);
  return {
    nhom, cao: 1.3, vlChop: [vlThan], chu,
    capNhat(dt, t) {
      bay.position.y = 0.85 + Math.sin(t * 2.4) * 0.1;
      for (const [tru, s] of canh) tru.rotation.z = -s * (0.4 + Math.sin(t * 30) * 0.45);
      vlDuoi.emissiveIntensity = 1.3 + Math.sin(t * 3) * 0.4;
      bong.scale.setScalar(1 - Math.sin(t * 2.4) * 0.1);
    }
  };
}

const BANG = { slime_so: slime, nam_chu_cai: nam, dom_dom: domDom };

export function taoQuai3d(ma, { nhe } = {}) {
  const q = (BANG[ma] || slime)(nhe);
  const goc = q.vlChop.map(v => v.emissive ? v.emissive.clone() : null), gocI = q.vlChop.map(v => v.emissiveIntensity);
  let chopCon = 0;
  q.nhom.traverse(o => { if (o.isMesh) o.castShadow = !nhe && o.castShadow; });
  return {
    nhom: q.nhom, cao: q.cao,
    capNhat(dt, t) {
      q.capNhat(dt, t);
      if (chopCon > 0) {
        chopCon = Math.max(0, chopCon - dt);
        const k = chopCon / 0.25;
        q.vlChop.forEach((v, i) => { if (v.emissive) { v.emissive.copy(goc[i]).lerp(new THREE.Color("#ffffff"), k); v.emissiveIntensity = gocI[i] + k; } });
      }
    },
    chop(giay) { chopCon = giay || 0.25; },
    datChu(chu) {
      const cu = q.chu.material.map; const vien = { slime_so: "#1d4d22", nam_chu_cai: "#5a1410", dom_dom: "#fff3b0" }[ma] || "#1d1630";
      q.chu.material.map = anhChu(chu, ma === "dom_dom" ? "#7a4b00" : "#fff6a8", vien); q.chu.material.needsUpdate = true; if (cu) cu.dispose();
    },
    datMo(a) {
      q.nhom.traverse(o => { if (o.material) { const ds = Array.isArray(o.material) ? o.material : [o.material]; for (const m of ds) { if (m.userData.moGoc == null) m.userData.moGoc = m.opacity; m.transparent = true; m.opacity = m.userData.moGoc * a; } } });
    }
  };
}
// 29/10/2026 - BƯỚC: TC_D05
