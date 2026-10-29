// ================================================================
// FILE: dt/3d/dt3d_tuong.js  (ES module) - PHẦN VẼ 3D: TƯỚNG TỈ LỆ NGƯỜI THẬT (sân đấu)
// CHỨC NĂNG: Thủ lĩnh trên sân đấu là tướng dáng người thật (nhân vật Mixamo, Blender chuyển
//            FBX -> GLB). MỖI TỘC LÀ NHÂN VẬT RIÊNG (người dùng 29/10/2026: "chủng tộc khác là nhân vật
//            khác chứ không phải đội mũ lên đầu"), mỗi tộc có nam + nữ. Danh sách tướng + file ở
//            du_lieu/tuong.json (kho tướng để sau này bé chiêu mộ); dt3d_tran.js chọn và tải file.
//            Một bộ động tác dùng chung (dong_tac_tuong.glb): mỗi động tác chỉ giữ phần xoay khớp + độ
//            cao hông (bỏ phần đi tới vì sân tự dời nhân vật; hông nhân theo tỉ lệ chân của từng tướng).
//            Mỗi tộc có thể thay vài động tác (KIEU_TOC): Quỷ đứng thủ kiếm hai tay + phòng thủ đứng tấn,
//            Tiên đứng niệm phép + phòng thủ lập kết giới + chí mạng giáng phép xuống đất.
// HÀM KHAI RA:
//   taoBoTuong(ctx, dongTac) -> { tao(glb, hoSo, cao) -> tuong }   (hoSo.chungLoai = tộc của tướng)
//   tuong = { vo, goc, cao, vlPhatSang[], dien(kieu, khiXong), capNhat(dt), dangDien() }
//   kieu: dung, thu (giữ thế thủ), chem, chemLon (chí mạng), phep, phepLon (chí mạng Tiên), trung,
//         do (đỡ được), ne, thua, mung. Kiểu mà tộc không có động tác (do của Quỷ / Tiên) thì giữ nguyên thế.
//   Mỗi động tác đánh được dời + tua để lúc vũ khí chạm đúng 0,3 giây (phép: 0,22 giây) sau khi bắt đầu,
//   khớp hiệu ứng của dt3d_tran.js (đo bằng repo_rieng dau_truong_tri_thuc/cong_cu/do_nhip_dong_tac.py).
// LUẬT NỐI: chỉ dùng ctx (dt3d_canh.js); không biết gì về trận (dt3d_tran.js gọi dien()).
// BƯỚC: TC_D05B1 (người dùng 29/10/2026: "đồ hoạ hiện tại chỉ phù hợp trẻ 4-5 tuổi" -> tướng người thật;
//        góp ý cùng ngày: nhân vật riêng cho Quỷ / Tiên, phòng thủ theo tộc)
// NGÀY: 29/10/2026 19:00; 29/10/2026 23:40
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
  phepLon: { clip: "Spell", tu: 0.45, toc: 1.6 },
  trung: { clip: "Hit", toc: 1.1 },
  do: { clip: "BlockHit" },
  ne: { clip: "Dodge", tu: 0.15, toc: 2.2 },
  thua: { clip: "Defeated", toc: 1.6, giu: true },
  mung: { clip: "Victory", toc: 1.15 }
};
// null = tộc này không có động tác cho kiểu đó: giữ nguyên thế đang đứng
const KIEU_TOC = {
  nhan: {},
  quy: { dung: { clip: "QuyIdle", lap: true }, thu: { clip: "QuyStance", lap: true }, do: null },
  tien: { dung: { clip: "TienIdle", lap: true }, thu: { clip: "TienShield", lap: true }, do: null,
          phepLon: { clip: "TienArea", tu: 0.7, toc: 2.5 } } // hai tay giáng xuống ở giây 1,28 gốc
};
const HONG = "mixamorigHips";
const SANG = 0.45;

export function taoBoTuong(ctx, dongTac) {
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

  function tao(glb, hoSo, cao) {
    const goc = nhanBanXuong(glb.scene);
    const bang = Object.assign({}, KIEU, KIEU_TOC[hoSo.chungLoai] || {});
    const vlPhatSang = [];
    goc.traverse(o => {
      if (!o.isMesh) return;
      o.castShadow = !nhe; o.frustumCulled = false;
      // chất liệu thường (không kim loại, không ảnh môi trường), tự sáng nhẹ theo ảnh màu cho bé nhìn rõ trên sân
      const g = o.material, m = new THREE.MeshStandardMaterial({ map: g.map, normalMap: g.normalMap, metalness: 0, roughness: 0.72, side: g.side, color: new THREE.Color(1.5, 1.5, 1.5), emissiveMap: g.map });
      m.emissive.setScalar(SANG); m.userData.sangGoc = SANG;
      o.material = m; vlPhatSang.push(m);
    });
    // đo cao ở tư thế gốc (xương cao nhất) rồi thu về đúng chiều cao muốn
    goc.updateWorldMatrix(true, true);
    let dinh = 0; goc.traverse(o => { if (o.isBone) dinh = Math.max(dinh, new THREE.Vector3().setFromMatrixPosition(o.matrixWorld).y); });
    goc.scale.multiplyScalar(cao / (dinh || 1.8));
    const vo = new THREE.Group(); vo.add(goc); ctx.canh.add(vo);

    if (!boNhoClip.has(glb)) boNhoClip.set(glb, chepDongTac(goc));
    const clip = boNhoClip.get(glb);
    const tron = new THREE.AnimationMixer(goc), dt = {};
    for (const k in clip) dt[k] = tron.clipAction(clip[k]);
    let dang = null, xong = null, kieuDang = null;
    function dien(kieu, khiXong) {
      const k = bang[kieu] === undefined ? bang.dung : bang[kieu];
      const moi = k && dt[k.clip];
      if (!moi) { if (khiXong) khiXong(); return; } // tộc không có động tác này: giữ thế đang đứng
      if (kieuDang === kieu && k.lap) return;
      const cu = dang;
      moi.reset(); moi.setLoop(k.lap ? THREE.LoopRepeat : THREE.LoopOnce, Infinity); moi.clampWhenFinished = !!k.giu;
      moi.timeScale = k.toc || 1; moi.time = k.tu || 0; moi.play();
      if (cu && cu !== moi) moi.crossFadeFrom(cu, k.tu ? 0.1 : 0.2, false);
      dang = moi; kieuDang = kieu; xong = khiXong || null;
    }
    tron.addEventListener("finished", e => {
      if (e.action !== dang) return;
      const k = bang[kieuDang], f = xong; xong = null;
      if (!k.giu) dien("dung");
      if (f) f();
    });
    dien("dung");
    return { vo, goc, cao, vlPhatSang, dien, capNhat(d) { tron.update(d); }, dangDien: () => kieuDang };
  }
  return { tao };
}
// 29/10/2026 23:40 - BƯỚC: TC_D05B1
