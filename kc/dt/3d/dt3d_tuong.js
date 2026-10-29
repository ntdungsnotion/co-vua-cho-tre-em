// ================================================================
// FILE: dt/3d/dt3d_tuong.js  (ES module) - PHẦN VẼ 3D: TƯỚNG TỈ LỆ NGƯỜI THẬT (sân đấu)
// CHỨC NĂNG: Thủ lĩnh trên sân đấu là tướng dáng người thật (nhân vật Mixamo, Blender chuyển
//            FBX -> GLB): bé trai = tướng giáp kiếm khiên, bé gái = nữ hiệp sĩ (kiếm + khiên gắn
//            vào tay). Một bộ động tác dùng chung cho cả hai (dong_tac_tuong.glb): mỗi động tác
//            chỉ giữ phần xoay khớp + độ cao hông (bỏ phần đi tới của hông vì sân tự dời nhân vật;
//            độ cao hông nhân theo tỉ lệ chân của từng tướng). Phụ kiện tộc: sừng Quỷ, vòng lá Tiên.
// HÀM KHAI RA:
//   taoBoTuong(ctx, { nam, nu, dongTac }) (3 glb đã tải) -> { tao(hoSo, cao) -> tuong }
//   tuong = { vo, goc, cao, vlPhatSang[], dien(kieu, khiXong), capNhat(dt), dangDien() }
//   kieu: dung, thu (giữ khiên), chem, chemLon (chí mạng), phep, trung, do (đỡ được), ne, thua, mung.
//   Mỗi động tác đánh được dời + tua để lúc vũ khí chạm đúng 0,3 giây (phép: 0,22 giây) sau khi bắt đầu,
//   khớp hiệu ứng của dt3d_tran.js.
// LUẬT NỐI: chỉ dùng ctx (dt3d_canh.js); không biết gì về trận (dt3d_tran.js gọi dien()).
// BƯỚC: TC_D05B1 (người dùng 29/10/2026: "đồ hoạ hiện tại chỉ phù hợp trẻ 4-5 tuổi" -> tướng người thật)
// NGÀY: 29/10/2026 19:00
// ================================================================
import * as THREE from "three";
import { clone as nhanBanXuong } from "../../thu_vien/three/utils/SkeletonUtils.js";

// tu: giây bắt đầu trong động tác gốc; toc: tua nhanh; lap: lặp mãi; giu: dừng ở khung cuối
const KIEU = {
  dung: { clip: "Idle", lap: true },
  thu: { clip: "BlockIdle", lap: true },
  chem: { clip: "Slash", tu: 0.35, toc: 1.6 },          // tay vươn xa nhất ở giây 0,8 gốc
  chemLon: { clip: "PowerSlash", tu: 0.6, toc: 2.5 },   // nện xuống ở giây 1,35 gốc
  phep: { clip: "Spell", tu: 0.45, toc: 1.6 },          // tay đẩy phép ở giây 0,8 gốc
  trung: { clip: "Hit", toc: 1.1 },
  do: { clip: "BlockHit" },
  ne: { clip: "Dodge", tu: 0.15, toc: 2.2 },
  thua: { clip: "Defeated", toc: 1.6, giu: true },
  mung: { clip: "Victory", toc: 1.15 }
};
const HONG = "mixamorigHips";
const MAU_SUNG = "#e9dcf5", MAU_LA = "#5fb04a", SANG = 0.45;

export function taoBoTuong(ctx, { nam, nu, dongTac }) {
  const nhe = ctx.nhe;
  // xương của bộ động tác: lấy độ cao hông gốc để nhân tỉ lệ cho từng tướng
  let hongGoc = null;
  dongTac.scene.traverse(o => { if (o.name === HONG) hongGoc = o.position.clone(); });

  // Chép động tác cho một tướng: bỏ phần dời (trừ hông), hông chỉ giữ trục cao, nhân tỉ lệ chân
  function chepDongTac(goc) {
    const ten = new Set(); let hong = null;
    goc.traverse(o => { if (o.isBone) { ten.add(o.name); if (o.name === HONG) hong = o; } });
    const truc = ["x", "y", "z"].reduce((a, k) => Math.abs(hongGoc[k]) > Math.abs(hongGoc[a]) ? k : a, "x");
    const iTruc = "xyz".indexOf(truc), tiLe = hong && hongGoc[truc] ? hong.position[truc] / hongGoc[truc] : 1;
    const ds = {};
    for (const c of dongTac.animations) {
      const tracks = [];
      for (const t of c.tracks) {
        const [nut, thuocTinh] = t.name.split(".");
        if (!ten.has(nut) || thuocTinh === "scale") continue;
        if (thuocTinh === "position") {
          if (nut !== HONG) continue;
          const v = t.values.slice();
          for (let i = 0; i < v.length; i += 3) for (let k = 0; k < 3; k++) v[i + k] = k === iTruc ? v[i + k] * tiLe : hong.position["xyz"[k]];
          tracks.push(new THREE.VectorKeyframeTrack(t.name, t.times, v));
        } else tracks.push(t);
      }
      ds[c.name] = new THREE.AnimationClip(c.name, c.duration, tracks);
    }
    return ds;
  }
  const boNhoClip = new Map();

  const vl = (() => { const bo = {}; return c => bo[c] || (bo[c] = new THREE.MeshLambertMaterial({ color: c })); })();
  function phuKien(goc, hoSo, cao) {
    if (hoSo.chungLoai !== "quy" && hoSo.chungLoai !== "tien") return;
    let dau = null, dinh = null;
    goc.traverse(o => { if (o.name === "mixamorigHead") dau = o; if (o.name === "mixamorigHeadTop_End") dinh = o; });
    if (!dau) return;
    goc.updateWorldMatrix(true, true);
    const pDau = new THREE.Vector3().setFromMatrixPosition(dau.matrixWorld);
    const pDinh = dinh ? new THREE.Vector3().setFromMatrixPosition(dinh.matrixWorld) : pDau.clone().add(new THREE.Vector3(0, cao * 0.12, 0));
    const r = cao * 0.06, nhom = [];
    if (hoSo.chungLoai === "quy") for (const s of [-1, 1]) {
      const sung = new THREE.Mesh(new THREE.ConeGeometry(r * 0.32, r * 1.6, 7), vl(MAU_SUNG));
      sung.position.set(pDinh.x + r * 0.8 * s, pDinh.y + r * 0.2, pDinh.z + r * 0.2); sung.rotation.z = -0.45 * s; nhom.push(sung);
    } else {
      const vong = new THREE.Mesh(new THREE.TorusGeometry(r * 1.25, r * 0.16, 6, 18), vl(MAU_LA));
      vong.position.set(pDinh.x, pDinh.y - r * 0.35, pDinh.z); vong.rotation.x = Math.PI / 2 - 0.15; nhom.push(vong);
      for (let i = 0; i < 7; i++) { const la = new THREE.Mesh(new THREE.SphereGeometry(r * 0.3, 6, 4).scale(1, 0.5, 1.6), vl("#7cc85a")); const a = i / 7 * Math.PI * 2; la.position.set(pDinh.x + Math.cos(a) * r * 1.25, pDinh.y - r * 0.3, pDinh.z + Math.sin(a) * r * 1.25); la.rotation.y = -a; nhom.push(la); }
    }
    const nghich = dau.matrixWorld.clone().invert();
    for (const m of nhom) { m.updateMatrix(); m.applyMatrix4(nghich); m.castShadow = !nhe; dau.add(m); }
  }

  function tao(hoSo, cao) {
    const glb = hoSo.gioi === "nu" ? nu : nam;
    const goc = nhanBanXuong(glb.scene);
    const vlPhatSang = [];
    goc.traverse(o => {
      if (!o.isMesh) return;
      o.castShadow = !nhe; o.frustumCulled = false;
      // chất liệu thường (không kim loại, không ảnh môi trường) cho hợp ánh sáng sân đấu
      // giáp gốc rất tối: tự sáng nhẹ theo ảnh màu (SANG) để bé nhìn rõ trên sân
      const g = o.material, m = new THREE.MeshStandardMaterial({ map: g.map, normalMap: g.normalMap, metalness: 0, roughness: 0.72, side: g.side, color: new THREE.Color(1.5, 1.5, 1.5), emissiveMap: g.map });
      m.emissive.setScalar(SANG); m.userData.sangGoc = SANG;
      o.material = m; vlPhatSang.push(m);
    });
    // đo cao ở tư thế gốc (đỉnh đầu) rồi thu về đúng chiều cao muốn
    goc.updateWorldMatrix(true, true);
    let dinh = 0; goc.traverse(o => { if (o.isBone) dinh = Math.max(dinh, new THREE.Vector3().setFromMatrixPosition(o.matrixWorld).y); });
    const tiLe = cao / (dinh || 1.8);
    goc.scale.multiplyScalar(tiLe);
    phuKien(goc, hoSo, cao);
    const vo = new THREE.Group(); vo.add(goc); ctx.canh.add(vo);

    if (!boNhoClip.has(glb)) boNhoClip.set(glb, chepDongTac(goc));
    const clip = boNhoClip.get(glb);
    const tron = new THREE.AnimationMixer(goc), dt = {};
    for (const k in clip) dt[k] = tron.clipAction(clip[k]);
    let dang = null, xong = null, kieuDang = null;
    function dien(kieu, khiXong) {
      const k = KIEU[kieu] || KIEU.dung, moi = dt[k.clip];
      if (!moi) { if (khiXong) khiXong(); return; }
      if (kieuDang === kieu && k.lap) return;
      const cu = dang;
      moi.reset(); moi.setLoop(k.lap ? THREE.LoopRepeat : THREE.LoopOnce, Infinity); moi.clampWhenFinished = !!k.giu;
      moi.timeScale = k.toc || 1; moi.time = k.tu || 0; moi.play();
      if (cu && cu !== moi) moi.crossFadeFrom(cu, k.tu ? 0.1 : 0.2, false);
      dang = moi; kieuDang = kieu; xong = khiXong || null;
    }
    tron.addEventListener("finished", e => {
      if (e.action !== dang) return;
      const k = KIEU[kieuDang], f = xong; xong = null;
      if (!k.giu) dien("dung");
      if (f) f();
    });
    dien("dung");
    return { vo, goc, cao, vlPhatSang, dien, capNhat(d) { tron.update(d); }, dangDien: () => kieuDang };
  }
  return { tao };
}
// 29/10/2026 19:00 - BƯỚC: TC_D05B1
