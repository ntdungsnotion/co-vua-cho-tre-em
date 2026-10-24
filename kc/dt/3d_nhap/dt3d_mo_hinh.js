// ================================================================
// FILE: dt/3d/dt3d_mo_hinh.js  (ES module) - PHẦN VẼ 3D: MÔ HÌNH
// CHỨC NĂNG: Nạp file GLB (báo phần trăm tải), bộ mô hình làng (mesh gốc theo tên, vật liệu
//            chung), và BoNhieuBan: vẽ nhiều bản của một mô hình bằng InstancedMesh (1 lệnh
//            vẽ / loại), có màu riêng từng bản, ẩn / dùng lại chỗ trống, rung khi bị chặt.
// HÀM KHAI RA:
//   taiGlb(url, baoTai(url, đã, tổng)) -> Promise<gltf>
//   taoBoMoHinh(ctx, glbLang) -> { mauGoc, vatLieu, kichThuoc(ten) -> Vector3,
//        BoNhieuBan(tenHoacHinh, toiDa, { vatLieu, bong }) }
//   BoNhieuBan: them(x, y, z, ti, gocDo, chu, mau) -> i; dat(i, x, y, z, ti, gocDo); an(i);
//               mau(i, color); rung(i, t); chuCua(i); xong() (tính lại khối bao để chạm trúng)
// LUẬT NỐI: chỉ dùng ctx của dt3d_canh.js.
// BƯỚC: TC_D02A (tách từ dt_lang_3d.js của TC_D01C)
// NGÀY: 23/10/2026
// ================================================================
import * as THREE from "three";
import { GLTFLoader } from "../../thu_vien/three/loaders/GLTFLoader.js";

export const taiGlb = (url, baoTai) => new Promise((ok, loi) => new GLTFLoader().load(url, ok,
  e => { if (baoTai && e.loaded) baoTai(url, e.loaded, e.total || e.loaded); }, loi));

export function taoBoMoHinh(ctx, glbLang) {
  const mauGoc = {};
  glbLang.scene.traverse(o => { if (o.isMesh) mauGoc[o.parent.name] = o; });
  const vatLieu = Object.values(mauGoc)[0].material;
  vatLieu.side = THREE.FrontSide;
  const boNhoKt = {};
  function kichThuoc(ten) {
    if (!boNhoKt[ten]) { const g = mauGoc[ten].geometry; g.computeBoundingBox(); boNhoKt[ten] = g.boundingBox.getSize(new THREE.Vector3()); }
    return boNhoKt[ten];
  }

  const ma = new THREE.Matrix4(), q = new THREE.Quaternion(), vt = new THREE.Vector3(), ti3 = new THREE.Vector3(), TRUC_Y = new THREE.Vector3(0, 1, 0);
  const AN = new THREE.Matrix4().makeScale(0, 0, 0), TRUC_RUNG = new THREE.Vector3(1, 0, 1).normalize();
  class BoNhieuBan {
    constructor(tenHoacHinh, toiDa, tuyChon = {}) {
      const hinh = typeof tenHoacHinh === "string" ? (mauGoc[tenHoacHinh] || {}).geometry : tenHoacHinh;
      if (!hinh) throw new Error("Thiếu mô hình " + tenHoacHinh);
      this.mesh = new THREE.InstancedMesh(hinh, tuyChon.vatLieu || vatLieu, toiDa);
      this.mesh.count = 0; this.mesh.castShadow = tuyChon.bong !== false && !ctx.nhe; this.mesh.receiveShadow = !ctx.nhe;
      this.mesh.name = typeof tenHoacHinh === "string" ? tenHoacHinh : "hinh";
      this.mesh.frustumCulled = false; // bản ở khắp bản đồ, khối bao chung không đáng
      this.ma = []; this.chu = []; this.trong = [];
      ctx.canh.add(this.mesh);
    }
    them(x, y, z, ti, gocDo, chu, mau) {
      const i = this.trong.length ? this.trong.pop() : this.mesh.count++;
      if (i >= this.mesh.instanceMatrix.count) throw new Error("Bộ " + this.mesh.name + " đầy");
      this.chu[i] = chu || null;
      this.dat(i, x, y, z, ti, gocDo);
      if (mau) this.mau(i, mau);
      else if (this.mesh.instanceColor) this.mau(i, new THREE.Color(1, 1, 1));
      return i;
    }
    dat(i, x, y, z, ti, gocDo) {
      q.setFromAxisAngle(TRUC_Y, THREE.MathUtils.degToRad(gocDo || 0));
      if (typeof ti === "number") ti3.set(ti, ti, ti); else ti3.copy(ti);
      const m = (this.ma[i] = this.ma[i] || new THREE.Matrix4()).compose(vt.set(x, y, z), q, ti3);
      this.mesh.setMatrixAt(i, m); this.mesh.instanceMatrix.needsUpdate = true;
    }
    mau(i, c) { this.mesh.setColorAt(i, c); this.mesh.instanceColor.needsUpdate = true; }
    an(i) { this.mesh.setMatrixAt(i, AN); this.mesh.instanceMatrix.needsUpdate = true; this.chu[i] = null; this.trong.push(i); }
    rung(i, t) { // rung khi bị chặt / đào
      ma.copy(this.ma[i]).multiply(new THREE.Matrix4().makeRotationAxis(TRUC_RUNG, Math.sin(t * 40) * 0.05 * Math.max(0, 1 - t * 3)));
      this.mesh.setMatrixAt(i, ma); this.mesh.instanceMatrix.needsUpdate = true;
    }
    chuCua(i) { return this.chu[i]; }
    xong() { this.mesh.computeBoundingSphere(); this.mesh.computeBoundingBox && this.mesh.computeBoundingBox(); }
  }
  return { mauGoc, vatLieu, kichThuoc, BoNhieuBan };
}
// 23/10/2026 18:00 - BƯỚC: TC_D02A
