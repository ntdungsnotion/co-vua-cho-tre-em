// ================================================================
// FILE: dt/3d/dt3d_nhan_vat.js  (ES module) - PHẦN VẼ 3D: NHÂN VẬT
// CHỨC NĂNG: Nhân vật KayKit (CC0) theo ngoại hình bé chọn (TC_D01): đổi màu da / tóc / áo,
//            phụ kiện chủng loại (sừng Quỷ, tai nhọn + vòng lá Tiên, đuôi tóc bé gái, nón lá
//            nông dân); động tác gói bản đồ (8) + gói trận (tải khi cần); ĐỒ ĐANG MANG thấy
//            được: bó củi trên lưng, ôm tảng đá, cầm cục vàng, xách xâu cá, ôm giỏ trái cây.
//            Mỗi hình đi theo một đơn vị của LÕI (dt_lang.js): vị trí, trạng thái, đồ mang.
// HÀM KHAI RA:
//   taoBoNhanVat(ctx, glbNv, moHinh, diaHinh, NV) -> {
//     tao(dv, vaiTro, hoSo) -> hinh { vo, trung, goc, dv }  (dv: đơn vị lõi, chỉ đọc)
//     xoa(hinh); capNhat(dt) (gọi mỗi khung); dsHinh;
//     dien(hinh, [tên động tác], khiDoi, khiXong, huong?) (diễn động tác trận; huong bỏ trống = nhìn camera), themDongTac(clip[]),
//     reo(hinh, giây) (reo mừng, TC_D02B2b) }
//   Đơn vị đang dựng nhà (trangThai "xay", TC_D02B2b): động tác Interact.
// LUẬT NỐI: dùng ctx (dt3d_canh.js), moHinh.mauGoc / vatLieu (dt3d_mo_hinh.js),
//           diaHinh.doCaoDi (dt3d_dia_hinh.js), NV = window.KC_NV (bảng màu chung).
// BƯỚC: TC_D02A (tách từ dt_lang_3d.js của TC_D01C + đồ mang); TC_D02B2b (dựng nhà, reo mừng);
//       TC_D03B2 (gặt ruộng: cúi gặt; lúa chưa chín thì đứng chờ); TC_D05 (dien nhận hướng nhìn, cho màn đấu)
// NGÀY: 23/10/2026; 27/10/2026; 28/10/2026 19:05
// ================================================================
import * as THREE from "three";
import { clone as nhanBanXuong } from "../../thu_vien/three/utils/SkeletonUtils.js";

const TI_NV = 0.46; // nhân vật KayKit cao ~2,2 -> ~1 ô (tỉ lệ Đế Chế)
const PHU_KIEN_VAI_TRO = { thu_linh: ["Barbarian_Hat", "Barbarian_Cape"], nong_dan: ["1H_Axe"] };
const MAU_NONG_DAN = { nhan: "#a87a4a", quy: "#5c5470", tien: "#7aa35a" };
const MAU_LOAI = { quy: { sung: "#e9dcf5" }, tien: { la: "#5fb04a" } };
// Động tác + vũ khí theo loại nguồn đang làm
const VIEC = {
  cay: { dongTac: "1H_Melee_Attack_Chop", vuKhi: "1H_Axe" },
  mo_da: { dongTac: "2H_Melee_Attack_Chop", vuKhi: "2H_Axe" }, mo_vang: { dongTac: "2H_Melee_Attack_Chop", vuKhi: "2H_Axe" }, mo_sat: { dongTac: "2H_Melee_Attack_Chop", vuKhi: "2H_Axe" },
  bai_ca: { dongTac: "1H_Melee_Attack_Chop", vuKhi: "xien" }, bui_trai_cay: { dongTac: "PickUp", vuKhi: null },
  ruong: { dongTac: "PickUp", vuKhi: null } // TC_D03B2: cúi gặt lúa, đi về ôm giỏ
};

// nhipLam(loai nguồn) -> giây cho 1 tài nguyên (cau_hinh.json). Mỗi nhát động tác = 1 tài nguyên
// (người dùng chốt 23/10/2026): động tác làm được tua cho 1 vòng đúng bằng 1 nhịp.
export function taoBoNhanVat(ctx, glbNv, moHinh, diaHinh, NV, { nhipLam } = {}) {
  const nhe = ctx.nhe;
  // Ảnh tô nhân vật là bảng 8 x 4 ô màu; ô (hàng 0, cột 0) = da, (0,1) = tóc / râu,
  // (1,0) và (1,1) = áo. Đổi màu: giữ độ sáng tối từng điểm, thay sắc màu.
  const anhGoc = (() => { let a; glbNv.scene.traverse(o => { if (o.isMesh && !a) a = o.material.map.image; }); return a; })();
  const boNhoAnh = new Map();
  function anhDaDoiMau(da, toc, ao) {
    const khoa = da + toc + ao;
    if (boNhoAnh.has(khoa)) return boNhoAnh.get(khoa);
    const cv = document.createElement("canvas"); cv.width = anhGoc.width; cv.height = anhGoc.height;
    const g = cv.getContext("2d"); g.drawImage(anhGoc, 0, 0);
    const cw = cv.width / 8, ch = cv.height / 4;
    const doi = (hang, cot, hex) => {
      const anh = g.getImageData(cot * cw, hang * ch, cw, ch), d = anh.data, s = new THREE.Color(hex).convertLinearToSRGB();
      let tb = 0; for (let i = 0; i < d.length; i += 4) tb += d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11; tb /= d.length / 4;
      for (let i = 0; i < d.length; i += 4) {
        const k = (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11) / (tb || 1);
        d[i] = Math.min(255, s.r * 255 * k); d[i + 1] = Math.min(255, s.g * 255 * k); d[i + 2] = Math.min(255, s.b * 255 * k);
      }
      g.putImageData(anh, cot * cw, hang * ch);
    };
    doi(0, 0, da); doi(0, 1, toc); doi(1, 0, ao); doi(1, 1, ao);
    const t = new THREE.CanvasTexture(cv); t.flipY = false; t.colorSpace = THREE.SRGBColorSpace;
    boNhoAnh.set(khoa, t);
    return t;
  }

  const vl = (() => { const bo = {}; return c => bo[c] || (bo[c] = new THREE.MeshLambertMaterial({ color: c })); })();
  // Gắn các hình vẽ theo toạ độ mô hình lúc đứng thẳng (cao ~2,2, mặt nhìn +z) vào một xương
  function ganVaoXuong(xuong, nhom) {
    xuong.updateWorldMatrix(true, false);
    const nghich = xuong.matrixWorld.clone().invert();
    for (const m of [...nhom.children]) { m.applyMatrix4(nghich); m.castShadow = !nhe; xuong.add(m); }
  }
  function phuKienChungLoai(xuongDau, hoSo, laThuLinh, mauDa, mauToc) {
    const nhom = new THREE.Group();
    if (hoSo.chungLoai === "quy") for (const s of [-1, 1]) {
      const sung = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.42, 6), vl(MAU_LOAI.quy.sung));
      sung.position.set(0.3 * s, 2.2, 0.08); sung.rotation.z = -0.5 * s; nhom.add(sung);
    }
    if (hoSo.chungLoai === "tien") {
      for (const s of [-1, 1]) {
        const tai = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.42, 5), vl(mauDa));
        tai.position.set(0.56 * s, 1.72, -0.02); tai.rotation.z = -1.25 * s; nhom.add(tai);
      }
      if (laThuLinh) {
        const vong = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.06, 6, 18), vl(MAU_LOAI.tien.la));
        vong.position.set(0, 2.08, 0); vong.rotation.x = Math.PI / 2 - 0.15; nhom.add(vong);
        for (let i = 0; i < 6; i++) { const la = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 4).scale(1, 0.5, 1.6), vl("#7cc85a")); const a = i / 6 * Math.PI * 2; la.position.set(Math.cos(a) * 0.47, 2.1, Math.sin(a) * 0.47); la.rotation.y = -a; nhom.add(la); }
      }
    }
    if (!laThuLinh) { // nông dân đội nón lá
      const non = new THREE.Mesh(new THREE.ConeGeometry(0.78, 0.42, 14), vl("#e6cf8a"));
      non.position.set(0, 2.2, 0); nhom.add(non);
    }
    if (hoSo.gioi === "nu") {
      const duoi = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6).scale(0.9, 1.5, 0.9), vl(mauToc));
      duoi.position.set(0, 1.55, -0.52); nhom.add(duoi);
    }
    ganVaoXuong(xuongDau, nhom);
  }

  // --- Đồ mang (mỗi nông dân dựng sẵn 5 món, chỉ hiện món đang mang) ---
  const hinhCui = moHinh.mauGoc.resource_lumber.geometry, ktCui = (() => { hinhCui.computeBoundingBox(); return hinhCui.boundingBox.getSize(new THREE.Vector3()); })();
  const hinhDa = moHinh.mauGoc.rock_single_A.geometry;
  const hinhVang = new THREE.IcosahedronGeometry(0.22, 0), vlVang = new THREE.MeshStandardMaterial({ color: "#ffcc33", metalness: 0.75, roughness: 0.28, emissive: "#6b4a00", emissiveIntensity: 0.6 });
  const hinhCa = new THREE.SphereGeometry(0.17, 8, 6).scale(0.6, 0.7, 2.2), vlCa = new THREE.MeshLambertMaterial({ color: "#ff9a3c", emissive: "#6a2a00" });
  const hinhQua = new THREE.SphereGeometry(0.13, 7, 5), hinhGio = new THREE.CylinderGeometry(0.42, 0.3, 0.32, 10, 1, true);
  function taoDoMang(xuongNguc, xuongTay) {
    const mon = {};
    // Bó củi trên lưng: mô hình đống gỗ KayKit, nằm ngang sau lưng
    { const g = new THREE.Group(), m = new THREE.Mesh(hinhCui, moHinh.vatLieu); const s = 1.1 / Math.max(ktCui.x, ktCui.z); m.scale.setScalar(s); m.rotation.set(0, Math.PI / 2, 0.15); m.position.set(0, 1.0, -0.55); g.add(m);
      const day = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.03, 4, 12), vl("#6b4524")); day.position.set(0, 1.25, -0.2); day.rotation.x = 0.4; g.add(day);
      ganVaoXuong(xuongNguc, g); mon.go = [m, day]; }
    // Ôm tảng đá trước ngực
    { const g = new THREE.Group(), m = new THREE.Mesh(hinhDa, moHinh.vatLieu); m.scale.setScalar(2.6); m.position.set(0, 0.85, 0.62); g.add(m); ganVaoXuong(xuongNguc, g); mon.da = [m]; }
    // Cục vàng cầm trước ngực (3 cục)
    { const g = new THREE.Group(); mon.vang = [];
      for (let k = 0; k < 3; k++) { const m = new THREE.Mesh(hinhVang, vlVang); m.position.set((k - 1) * 0.26, 0.95 + (k % 2) * 0.2, 0.6); m.rotation.set(k, k * 2, 0); g.add(m); mon.vang.push(m); }
      ganVaoXuong(xuongNguc, g); }
    // Xâu cá xách ở tay phải
    { const g = new THREE.Group(); xuongTay.updateWorldMatrix(true, false); const p = new THREE.Vector3().setFromMatrixPosition(xuongTay.matrixWorld);
      const day = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 4), vl("#c8b27a")); day.position.set(p.x, p.y - 0.25, p.z); g.add(day); mon.ca = [day];
      for (let k = 0; k < 3; k++) { const m = new THREE.Mesh(hinhCa, vlCa); m.position.set(p.x + (k - 1) * 0.12, p.y - 0.5 - (k % 2) * 0.08, p.z); m.rotation.x = Math.PI / 2; g.add(m); mon.ca.push(m); }
      ganVaoXuong(xuongTay, g); }
    // Giỏ trái cây ôm trước ngực
    { const g = new THREE.Group(), gio = new THREE.Mesh(hinhGio, new THREE.MeshLambertMaterial({ color: "#a8783e", side: THREE.DoubleSide })); gio.position.set(0, 0.85, 0.62); g.add(gio); mon.luong_thuc = [gio];
      for (let k = 0; k < 7; k++) { const m = new THREE.Mesh(hinhQua, vl(k % 3 ? "#e8433a" : "#f2a33a")); const a = k / 7 * Math.PI * 2, r = k ? 0.22 : 0; m.position.set(Math.cos(a) * r, 1.04 + (k ? 0 : 0.08), 0.62 + Math.sin(a) * r * 0.85); g.add(m); mon.luong_thuc.push(m); }
      ganVaoXuong(xuongNguc, g); }
    for (const k in mon) for (const m of mon[k]) m.visible = false;
    return mon;
  }

  // Xiên bắt cá: cán dài + mũi nhọn, đặt cùng chỗ cầm với rìu một tay, dọc theo cán rìu
  function taoXien(riu) {
    const g = riu.geometry; g.computeBoundingBox();
    const bb = g.boundingBox, kt = bb.getSize(new THREE.Vector3()), tam = bb.getCenter(new THREE.Vector3());
    const truc = kt.x >= kt.y && kt.x >= kt.z ? "x" : (kt.y >= kt.z ? "y" : "z");
    const huong = new THREE.Vector3(); huong[truc] = Math.sign(tam[truc]) || 1;
    const L = kt[truc] * 2.2, r = L * 0.022;
    const nhom = new THREE.Group(), trong = new THREE.Group();
    const can = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 6), vl("#8a5a2b")); can.position.y = L * 0.3;
    const mui = new THREE.Mesh(new THREE.ConeGeometry(r * 2.4, L * 0.14, 6), vl("#d5dce2")); mui.position.y = L * 0.8 + L * 0.07;
    can.castShadow = mui.castShadow = !nhe;
    trong.add(can, mui);
    trong.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), huong);
    nhom.add(trong);
    nhom.position.copy(riu.position); nhom.quaternion.copy(riu.quaternion); nhom.scale.copy(riu.scale);
    riu.parent.add(nhom); nhom.visible = false;
    return nhom;
  }

  const dsHinh = [];
  const vlTrung = new THREE.MeshBasicMaterial({ visible: false });
  const hinhTrung = new THREE.CylinderGeometry(0.6, 0.6, 1.5, 8).translate(0, 0.75, 0);
  let clipTran = [];

  function tao(dv, vaiTro, hoSo) {
    const goc = nhanBanXuong(glbNv.scene);
    const laThuLinh = vaiTro === "thu_linh";
    const mauDa = NV.BANG.da[hoSo.mauDa], mauToc = NV.BANG.toc[hoSo.mauToc];
    const anh = anhDaDoiMau(mauDa, mauToc, laThuLinh ? NV.BANG.ao[hoSo.mauAo] : MAU_NONG_DAN[hoSo.chungLoai]);
    let vlRieng = null, xuongDau = null, xuongNguc = null, xuongTay = null;
    const hien = PHU_KIEN_VAI_TRO[vaiTro], vuKhi = {};
    goc.traverse(o => {
      if (o.isBone && o.name === "head") xuongDau = o;
      if (o.isBone && o.name === "chest") xuongNguc = o;
      if (o.isBone && /^handslot\.?r$/.test(o.name)) xuongTay = o; // GLTFLoader bỏ dấu chấm trong tên
      if (!o.isMesh) return;
      if (!o.isSkinnedMesh) { o.visible = hien.includes(o.name) && !(o.name === "Barbarian_Hat" && hoSo.chungLoai !== "nhan"); if (/Axe$/.test(o.name)) vuKhi[o.name] = o; }
      if (!vlRieng) { vlRieng = o.material.clone(); vlRieng.map = anh; }
      o.material = vlRieng; o.castShadow = !nhe; o.frustumCulled = false;
    });
    phuKienChungLoai(xuongDau, hoSo, laThuLinh, mauDa, mauToc);
    if (!laThuLinh && vuKhi["1H_Axe"]) vuKhi.xien = taoXien(vuKhi["1H_Axe"]);
    const doMang = laThuLinh ? null : taoDoMang(xuongNguc, xuongTay);
    goc.scale.setScalar(TI_NV * (laThuLinh ? 1.12 : 1));
    const vo = new THREE.Group(); vo.add(goc);
    const trung = new THREE.Mesh(hinhTrung, vlTrung); vo.add(trung);
    vo.position.set(dv.x, diaHinh.doCaoDi(dv.x, dv.z), dv.z);
    ctx.canh.add(vo);
    const tron = new THREE.AnimationMixer(goc), dt = {};
    for (const c of [...glbNv.animations, ...clipTran]) dt[c.name] = tron.clipAction(c);
    const h = { dv, vaiTro, vo, goc, trung, tron, dt, dongTac: null, huong: dv.huongMuon, vuKhi, vuKhiMacDinh: laThuLinh ? null : "1H_Axe", doMang, monDangHien: null, dien: null };
    trung.userData.hinh = h;
    datDongTac(h, "Idle");
    dsHinh.push(h);
    return h;
  }
  function xoa(h) { ctx.canh.remove(h.vo); dsHinh.splice(dsHinh.indexOf(h), 1); }
  function datDongTac(h, ten, mot, giayMotVong) {
    const moi = h.dt[ten];
    if (moi) moi.timeScale = giayMotVong ? moi.getClip().duration / giayMotVong : 1;
    if (h.dongTac === ten || !moi) return;
    const cu = h.dt[h.dongTac];
    moi.reset(); moi.setLoop(mot ? THREE.LoopOnce : THREE.LoopRepeat); moi.clampWhenFinished = !!mot; moi.play();
    if (cu) moi.crossFadeFrom(cu, 0.2, false);
    h.dongTac = ten;
  }
  function hienVuKhi(h, ten) { for (const k in h.vuKhi) h.vuKhi[k].visible = k === ten; }
  function hienMon(h, loai) {
    if (h.monDangHien === loai) return;
    if (h.monDangHien) for (const m of h.doMang[h.monDangHien]) m.visible = false;
    if (loai) for (const m of h.doMang[loai]) m.visible = true;
    h.monDangHien = loai;
  }
  // Món đang mang -> hình: Lương thực từ cá thì xâu cá, từ trái cây thì giỏ
  function monCua(h) {
    const m = h.dv.mang; if (!m.so) return null;
    if (m.loai === "luong_thuc") return h.monCa ? "ca" : "luong_thuc";
    return m.loai in { go: 1, da: 1, vang: 1 } ? m.loai : (m.loai === "sat" ? "da" : null);
  }

  function capNhatMot(h, dt) {
    const dv = h.dv;
    if (h.dien) { // diễn động tác trận (nút thử)
      const d = h.dien, ten = d.ds[d.i];
      if (d.t === 0) { datDongTac(h, ten, true); h.huongMuon = d.huong != null ? d.huong : Math.atan2(ctx.camera.position.x - dv.x, ctx.camera.position.z - dv.z); if (d.khiDoi) d.khiDoi(ten); }
      d.t += dt;
      if (d.t >= h.dt[ten].getClip().duration + 0.25) { d.i++; d.t = 0; }
      if (d.i >= d.ds.length) { const xong = d.khiXong; h.dien = null; hienVuKhi(h, h.vuKhiMacDinh); if (xong) xong(); }
    } else {
      h.huongMuon = dv.huongMuon;
      if (dv.viec) h.monCa = dv.viec.loai === "bai_ca"; // nhớ nguồn cuối để biết Lương thực là cá hay trái cây
      const lam = dv.trangThai === "lam" && dv.viec && dv.viec.trangThai !== "mam" && VIEC[dv.viec.loai]; // TC_D03B2: lúa chưa chín thì đứng chờ
      if (h.reo > 0 && !dv.duong.length) { h.reo -= dt; datDongTac(h, "Cheer"); } // reo mừng (dựng lều xong)
      else if (dv.duong.length) datDongTac(h, dv.chay ? "Running_A" : "Walking_A");
      else if (lam) datDongTac(h, lam.dongTac, false, nhipLam && nhipLam(dv.viec.loai)); // 1 nhát = 1 tài nguyên
      else if (dv.trangThai === "xay") datDongTac(h, "Interact"); // dựng nhà (TC_D02B2b)
      else datDongTac(h, "Idle");
      if (h.doMang) {
        const mon = monCua(h);
        // lúc làm chỉ còn bó củi trên lưng; đồ ôm / xách chỉ hiện khi không làm
        hienMon(h, lam ? (mon === "go" ? "go" : null) : mon);
        hienVuKhi(h, lam ? lam.vuKhi : (mon && mon !== "go" ? null : h.vuKhiMacDinh));
      }
    }
    if (h.huongMuon != null) {
      let d = h.huongMuon - h.huong; d = Math.atan2(Math.sin(d), Math.cos(d));
      h.huong += d * Math.min(1, dt * 12);
      h.goc.rotation.y = h.huong;
    }
    h.vo.position.set(dv.x, diaHinh.doCaoDi(dv.x, dv.z), dv.z);
    h.tron.update(dt);
  }

  return {
    dsHinh, tao, xoa,
    capNhat(dt) { for (const h of dsHinh) capNhatMot(h, dt); },
    reo(h, giay) { h.reo = giay || 2.5; },
    themDongTac(clip) { clipTran = clip; for (const h of dsHinh) for (const c of clip) if (!h.dt[c.name]) h.dt[c.name] = h.tron.clipAction(c); },
    dien(h, ds, khiDoi, khiXong, huong) { hienVuKhi(h, "1H_Axe"); if (h.vuKhi["1H_Axe"]) h.vuKhi["1H_Axe"].visible = true; h.dien = { ds, i: 0, t: 0, khiDoi, khiXong, huong }; }
  };
}
// 28/10/2026 19:05 - BƯỚC: TC_D03B2; 29/10/2026 - TC_D05
