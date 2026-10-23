// ================================================================
// FILE: dt/3d/dt3d_tai_nguyen.js  (ES module) - PHẦN VẼ 3D: TÀI NGUYÊN
// CHỨC NĂNG: Vẽ mọi nguồn tài nguyên THEO TRẠNG THÁI LÕI (dt_lang.js):
//            - cây: 4 loài hình (thông xanh, thông sẫm, tán tròn, lá vàng cam), cỡ nhỏ / vừa /
//              to to dần; rung khi bị chặt; cạn thì còn gốc; mầm cây lớn dần theo giờ
//            - mỏ Đá, mỏ Vàng (đá ấm màu + cục vàng lấp lánh): nhỏ dần theo trữ lượng
//            - bãi cá: cá bơi vòng, thỉnh thoảng nhảy, gợn sóng; ít cá dần theo trữ lượng
//            - bụi trái cây: quả đỏ trên bụi, ít quả dần theo trữ lượng
//            Mỗi loại một InstancedMesh (ít lệnh vẽ). Nghe sự kiện lõi để vẽ lại.
// HÀM KHAI RA:
//   taoTaiNguyen(ctx, moHinh, diaHinh, lang) -> { chon(raycaster) -> nguồn còn sống | null,
//        veLaiMam() (sau khi tua giờ) }
// LUẬT NỐI: dùng ctx (dt3d_canh.js), moHinh (dt3d_mo_hinh.js), diaHinh.doCao / MUC_NUOC
//           (dt3d_dia_hinh.js), lang (lõi: đọc nguon / gocCay, nghe sự kiện).
// BƯỚC: TC_D02A
// NGÀY: 23/10/2026
// ================================================================
import * as THREE from "three";
import { bam } from "./dt3d_canh.js";

// Hình theo cỡ (chỉ là hình vẽ; trữ lượng nằm ở cau_hinh.json)
const TI_CAY = { nho: 1.35, vua: 1.75, to: 2.25 };
const TI_MO = { nho: 3.4, vua: 4.3, to: 5.3 };
const TI_BUI = { nho: 0.8, vua: 1.0, to: 1.2 };
const SO_CA = { nho: 2, vua: 3, to: 4 };
const SO_QUA = 9, SO_CUC_VANG = 6;
// 4 loài cây: [mô hình, màu nhân, lá vàng cam]. Màu nhân không đổi được sắc lá nên loài
// lá vàng cam dùng vật liệu riêng có ảnh tô đã đổi lá xanh -> vàng cam
const LOAI_CAY = [["tree_single_A", [1, 1, 1]], ["tree_single_A", [0.6, 0.78, 0.6]], ["tree_single_B", [1, 1, 1]], ["tree_single_B", [1, 1, 1], true]];
const DA = ["rock_single_A", "rock_single_C", "rock_single_E"];
const MAU_DA = { mo_da: new THREE.Color(1, 1, 1), mo_vang: new THREE.Color(1.18, 0.98, 0.72), mo_sat: new THREE.Color(0.72, 0.62, 0.6) };

export function taoTaiNguyen(ctx, moHinh, diaHinh, lang) {
  const { BoNhieuBan } = moHinh, doCao = diaHinh.doCao, MUC_NUOC = diaHinh.MUC_NUOC;
  const vlThu = (() => { // ảnh tô làng, điểm xanh lá -> vàng cam (cây mùa thu)
    const goc = moHinh.vatLieu.map, a = goc.image, cv = document.createElement("canvas");
    cv.width = a.width; cv.height = a.height; const g = cv.getContext("2d"); g.drawImage(a, 0, 0);
    const anh = g.getImageData(0, 0, cv.width, cv.height), d = anh.data;
    for (let i = 0; i < d.length; i += 4) if (d[i + 1] > d[i] * 1.08 && d[i + 1] > d[i + 2]) {
      const s = d[i + 1]; d[i] = Math.min(255, s * 1.25 + 40); d[i + 1] = s * 0.68; d[i + 2] = d[i + 2] * 0.3;
    }
    g.putImageData(anh, 0, 0);
    const t = new THREE.CanvasTexture(cv); t.flipY = goc.flipY; t.colorSpace = goc.colorSpace; t.wrapS = goc.wrapS; t.wrapT = goc.wrapT;
    const vl = moHinh.vatLieu.clone(); vl.map = t; return vl;
  })();
  const khoaCay = l => l[0] + (l[2] ? "_thu" : "");
  const boCay = {}; for (const l of LOAI_CAY) boCay[khoaCay(l)] = boCay[khoaCay(l)] || new BoNhieuBan(l[0], 900, l[2] ? { vatLieu: vlThu } : {});
  const boGoc = new BoNhieuBan("tree_single_A_cut", 900);
  const boMam = new BoNhieuBan(new THREE.ConeGeometry(0.2, 0.62, 6).translate(0, 0.31, 0), 400, { vatLieu: new THREE.MeshLambertMaterial({ color: "#6fbf45" }) });
  const boDa = Object.fromEntries(DA.map(t => [t, new BoNhieuBan(t, 120)]));
  const boVang = new BoNhieuBan(new THREE.IcosahedronGeometry(0.1, 0), 120 * SO_CUC_VANG,
    { vatLieu: new THREE.MeshStandardMaterial({ color: "#ffcc33", metalness: 0.75, roughness: 0.28, emissive: "#6b4a00", emissiveIntensity: 0.6 }), bong: false });
  const boBui = new BoNhieuBan(new THREE.IcosahedronGeometry(0.42, 1).scale(1, 0.78, 1).translate(0, 0.28, 0), 80,
    { vatLieu: new THREE.MeshLambertMaterial({ color: "#4f9a3c", flatShading: true }) });
  const boQua = new BoNhieuBan(new THREE.SphereGeometry(0.075, 7, 5), 80 * SO_QUA, { vatLieu: new THREE.MeshLambertMaterial({ color: "#e8433a", emissive: "#5a0a05" }), bong: false });
  // Cá màu cam cho nổi trên nước xanh (bé nhìn thấy ngay chỗ có cá)
  const vlCa = new THREE.MeshLambertMaterial({ color: "#ff9a3c", emissive: "#6a2a00" });
  const boThanCa = new BoNhieuBan(new THREE.SphereGeometry(0.1, 8, 6).scale(0.75, 0.7, 2), 40 * 4, { vatLieu: vlCa, bong: false });
  const boDuoiCa = new BoNhieuBan(new THREE.ConeGeometry(0.1, 0.16, 4).rotateX(-Math.PI / 2).scale(0.3, 1, 1), 40 * 4, { vatLieu: vlCa, bong: false });
  const boGon = new BoNhieuBan(new THREE.RingGeometry(0.36, 0.44, 24).rotateX(-Math.PI / 2), 40,
    { vatLieu: new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.6, depthWrite: false }), bong: false });
  const nhomTrungCa = new THREE.Group(); ctx.canh.add(nhomTrungCa);
  const hinhTrungCa = new THREE.CylinderGeometry(0.6, 0.6, 0.8, 8), vlTrung = new THREE.MeshBasicMaterial({ visible: false });

  const hinh = new Map(); // id nguồn -> bản ghi hình
  const dangRung = new Set(), dsCa = new Set(), dsMam = new Set();
  const mauC = new THREE.Color();

  function veCay(n) {
    const l = LOAI_CAY[n.giong % LOAI_CAY.length], bo = boCay[khoaCay(l)], ti = TI_CAY[n.co] * (0.92 + n.lech * 0.16);
    const i = bo.them(n.x + (n.lech - 0.5) * 0.2, doCao(n.x, n.z), n.z + (bam(n.id, 2) - 0.5) * 0.2, ti, n.lech * 360, n, mauC.setRGB(...l[1]));
    bo.xong();
    return { bo, i };
  }
  function veMam(n) {
    const i = boMam.them(n.x, doCao(n.x, n.z), n.z, 0.3, n.lech * 360, n);
    const r = { bo: boMam, i, n }; dsMam.add(r); return r;
  }
  function tiMo(n) { return TI_MO[n.co] * (0.55 + 0.45 * n.con / n.toiDa); }
  function veMo(n) {
    const ten = DA[Math.floor(n.lech * DA.length)], bo = boDa[ten];
    const i = bo.them(n.x, doCao(n.x, n.z) - 0.02, n.z, tiMo(n), n.lech * 360, n, MAU_DA[n.loai]);
    bo.xong();
    const r = { bo, i, ten, phu: [] };
    if (n.loai === "mo_vang") for (let k = 0; k < SO_CUC_VANG; k++) r.phu.push({ bo: boVang, i: boVang.them(0, -9, 0, 0, 0) });
    datCucVang(n, r);
    return r;
  }
  function datCucVang(n, r) {
    if (!r.phu.length) return;
    const kt = moHinh.kichThuoc(r.ten), ti = tiMo(n), ban = Math.max(kt.x, kt.z) / 2 * ti, cao = kt.y * ti;
    const hien = Math.ceil(SO_CUC_VANG * n.con / n.toiDa), y0 = doCao(n.x, n.z);
    r.phu.forEach((p, k) => {
      if (k >= hien) { p.bo.dat(p.i, 0, -9, 0, 0, 0); return; }
      const a = n.lech * 6.28 + k * 1.05, d = ban * (0.6 + 0.3 * bam(n.id, k));
      p.bo.dat(p.i, n.x + Math.cos(a) * d, y0 + cao * (0.3 + 0.45 * bam(k, n.id)), n.z + Math.sin(a) * d, 0.8 + bam(n.id, k + 9) * 0.6, k * 47);
    });
  }
  function veBui(n) {
    const s = TI_BUI[n.co], y0 = doCao(n.x, n.z);
    const i = boBui.them(n.x, y0, n.z, s, n.lech * 360, n, mauC.setHSL(0.3 + n.lech * 0.04, 0.55, 0.5 + n.lech * 0.1));
    boBui.xong();
    const r = { bo: boBui, i, phu: [] };
    for (let k = 0; k < SO_QUA; k++) {
      const a = bam(n.id, k) * Math.PI * 2, c = 0.25 + bam(k, n.id) * 0.7, rr = 0.42 * s;
      r.phu.push({ bo: boQua, i: boQua.them(n.x + Math.cos(a) * rr * Math.sqrt(1 - c * c * 0.6), y0 + 0.28 * s + c * 0.33 * s, n.z + Math.sin(a) * rr * Math.sqrt(1 - c * c * 0.6), 1, 0) });
      r.phu[k].vt = r.phu[k].bo.ma[r.phu[k].i].clone();
    }
    datQua(n, r);
    return r;
  }
  function datQua(n, r) {
    const hien = Math.ceil(SO_QUA * n.con / n.toiDa);
    r.phu.forEach((p, k) => { p.bo.mesh.setMatrixAt(p.i, k < hien ? p.vt : new THREE.Matrix4().makeScale(0, 0, 0)); });
    boQua.mesh.instanceMatrix.needsUpdate = true;
  }
  function veCa(n) {
    const r = { n, ca: [], gon: boGon.them(n.x, MUC_NUOC + 0.01, n.z, 1, 0), pha: n.lech * 10 };
    for (let k = 0; k < SO_CA[n.co]; k++) r.ca.push({ than: boThanCa.them(n.x, MUC_NUOC, n.z, 1, 0), duoi: boDuoiCa.them(n.x, MUC_NUOC, n.z, 1, 0) });
    const trung = new THREE.Mesh(hinhTrungCa, vlTrung); trung.position.set(n.x, MUC_NUOC + 0.2, n.z); trung.userData.nguon = n;
    nhomTrungCa.add(trung); r.trung = trung;
    dsCa.add(r);
    return r;
  }

  function ve(n) {
    let r = null;
    if (n.loai === "cay") r = n.trangThai === "mam" ? veMam(n) : veCay(n);
    else if (n.loai.startsWith("mo_")) r = veMo(n);
    else if (n.loai === "bui_trai_cay") r = veBui(n);
    else if (n.loai === "bai_ca") r = veCa(n);
    if (r) hinh.set(n.id, r);
  }
  function xoa(n) {
    const r = hinh.get(n.id); if (!r) return;
    hinh.delete(n.id); dangRung.delete(r); dsMam.delete(r);
    if (r.bo) r.bo.an(r.i);
    for (const p of r.phu || []) p.bo.an(p.i);
    if (r.ca) { for (const c of r.ca) { boThanCa.an(c.than); boDuoiCa.an(c.duoi); } boGon.an(r.gon); nhomTrungCa.remove(r.trung); dsCa.delete(r); }
  }
  function veGoc(g) { boGoc.them(g.x, doCao(g.x, g.z), g.z, TI_CAY[g.co] * 0.95, bam(g.o.x, g.o.y) * 360, null, mauC.setRGB(...LOAI_CAY[g.giong % LOAI_CAY.length][1]).lerp(new THREE.Color(1, 1, 1), 0.5)); }

  for (const n of lang.nguon) ve(n);
  for (const g of lang.gocCay) veGoc(g);
  boGoc.xong();

  lang.nghe(su => {
    const n = su.n, r = n && hinh.get(n.id);
    switch (su.loai) {
      case "them_nguon": ve(n); break;
      case "mam_lon": xoa(n); ve(n); break;
      case "het_nguon": xoa(n); if (n.loai === "cay") { veGoc(lang.gocCay[lang.gocCay.length - 1]); boGoc.xong(); } break;
      case "lay":
        if (!r) break;
        if (n.loai.startsWith("mo_")) { r.bo.dat(r.i, n.x, doCao(n.x, n.z) - 0.02, n.z, tiMo(n), n.lech * 360); datCucVang(n, r); }
        if (n.loai === "bui_trai_cay") datQua(n, r);
        if (r.bo && n.loai !== "bui_trai_cay") { r.rungDen = 0.35; dangRung.add(r); }
        break;
    }
  });

  function veLaiMam() {
    const bay = lang.bayGio();
    for (const r of dsMam) {
      const n = r.n, f = Math.min(1, Math.max(0, (bay - n.lucTrong) / (n.lucLon - n.lucTrong)));
      r.bo.dat(r.i, n.x, doCao(n.x, n.z), n.z, 0.3 + f * 0.9, n.lech * 360);
    }
  }
  veLaiMam();
  let demMam = 0;
  const DUOI_SAU_THAN = new THREE.Matrix4().makeTranslation(0, 0, -0.24);
  const mCa = new THREE.Matrix4(), qCa = new THREE.Quaternion(), vCa = new THREE.Vector3(), sCa = new THREE.Vector3(1, 1, 1), eCa = new THREE.Euler();
  ctx.moiKhung((dt, t) => {
    for (const r of dangRung) {
      r.rungDen -= dt;
      if (r.rungDen > 0) { r.bo.rung(r.i, 0.35 - r.rungDen); continue; }
      dangRung.delete(r); r.bo.mesh.setMatrixAt(r.i, r.bo.ma[r.i]); r.bo.mesh.instanceMatrix.needsUpdate = true; // về đúng chỗ
    }
    // cá bơi vòng, mỗi ~4 giây một con nhảy lên
    for (const r of dsCa) {
      const n = r.n, hien = Math.ceil(r.ca.length * n.con / n.toiDa);
      r.ca.forEach((c, k) => {
        if (k >= hien) { boThanCa.mesh.setMatrixAt(c.than, mCa.makeScale(0, 0, 0)); boDuoiCa.mesh.setMatrixAt(c.duoi, mCa); return; }
        const a = t * (0.9 + k * 0.17) + k * 2.1 + r.pha, rr = 0.2 + k * 0.1;
        const x = n.x + Math.cos(a) * rr, z = n.z + Math.sin(a) * rr;
        const chu = (t + k * 1.3 + r.pha) % 4.2, nhay = chu < 0.6 ? Math.sin(Math.PI * chu / 0.6) * 0.32 : 0;
        const huong = Math.atan2(-Math.sin(a), Math.cos(a));
        eCa.set(chu < 0.6 ? -Math.cos(Math.PI * chu / 0.6) * 0.9 : 0, huong, 0, "YXZ"); qCa.setFromEuler(eCa);
        mCa.compose(vCa.set(x, MUC_NUOC + 0.02 + nhay, z), qCa, sCa); boThanCa.mesh.setMatrixAt(c.than, mCa);
        mCa.multiply(DUOI_SAU_THAN); boDuoiCa.mesh.setMatrixAt(c.duoi, mCa);
      });
      const g = 0.8 + ((t * 0.6 + r.pha) % 1) * 0.9;
      boGon.dat(r.gon, n.x, MUC_NUOC + 0.01, n.z, g, 0);
    }
    if (dsCa.size) { boThanCa.mesh.instanceMatrix.needsUpdate = true; boDuoiCa.mesh.instanceMatrix.needsUpdate = true; }
    if ((demMam += dt) > 0.5) { demMam = 0; veLaiMam(); }
  });
  const boChon = [...new Set(Object.values(boCay)), ...Object.values(boDa), boBui];
  return {
    chon(tia) {
      const trung = tia.intersectObjects([...boChon.map(b => b.mesh), ...nhomTrungCa.children], false)[0];
      if (!trung) return null;
      const n = trung.object.userData.nguon || (trung.instanceId != null ? boChon.find(b => b.mesh === trung.object).chuCua(trung.instanceId) : null);
      return n && lang.dangSong(n) ? n : null;
    },
    veLaiMam
  };
}
// 23/10/2026 18:20 - BƯỚC: TC_D02A
