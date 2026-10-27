// ================================================================
// FILE: dt/3d/dt3d_cong_trinh.js  (ES module) - PHẦN VẼ 3D: CÔNG TRÌNH
// CHỨC NĂNG: Lều da Đồ đá (dựng bằng hình khối: bộ KayKit chỉ có sạp chợ trung cổ), lửa
//            trại có ngọn lửa + đèn chập chờn (đồ họa Nhẹ bỏ đèn), ruộng (luống cày, có mầm
//            hoặc không), đồ trang trí quanh lều và dưới suối (thùng, bao, xe cút kít, cờ...).
//            Chỗ đứng / ô chặn do LÕI tính (dt_lang.js); phần này chỉ vẽ.
//            Công trình bé dựng (TC_D02B2b, lõi lang.congTrinh): móng gỗ 2 x 2 + lều mọc dần theo
//            ct.tienDo, xong thì nảy nhẹ một cái.
//            TC_D02C: Tường cọc gỗ (mọi ô tường chung một InstancedMesh), Cổng (2 cột, xà, cánh hé mở,
//            xoay theo móng), Tháp canh (4 chân, sàn, lan can, mái rơm); cổng đè tường thì bỏ hình tường.
// HÀM KHAI RA:
//   taoCongTrinh(ctx, moHinh, diaHinh, banDo, huongCam, lang?) -> { leu, lua, hinhCt(id) }
// LUẬT NỐI: dùng ctx (dt3d_canh.js), moHinh (dt3d_mo_hinh.js), diaHinh.doCao (dt3d_dia_hinh.js),
//           lang (lõi: congTrinh, sự kiện cong_trinh / xay_xong / bo_cong_trinh).
// BƯỚC: TC_D02A (tách từ dt_lang_3d.js của TC_D01C); TC_D02B2a (chưa có lều); TC_D02B2b (bé dựng lều);
//       TC_D02C (tường, cổng, tháp canh)
// NGÀY: 23/10/2026; 26/10/2026; 27/10/2026; 28/10/2026
// ================================================================
import * as THREE from "three";
import { bam } from "./dt3d_canh.js";

const TI_LEU = 3.4; // như lều làng mẫu (móng 2 x 2 ô)

export function taoCongTrinh(ctx, moHinh, diaHinh, banDo, huongCam, lang) {
  const nhe = ctx.nhe, doCao = diaHinh.doCao;
  const gocCua = Math.atan2(huongCam.x, huongCam.z) + 0.35; // cửa lều quay về phía camera

  // Lều da hình nón, cọc gỗ ló trên đỉnh, cửa tối, dải hoa văn
  let anhVaiLeu = null;
  function taoLeu(ti) {
    const leu = new THREE.Group();
    const R = ti * 0.32, C = ti * 0.62;
    if (!anhVaiLeu) {
      const cv = document.createElement("canvas"); cv.width = 256; cv.height = 64; const g = cv.getContext("2d");
      g.fillStyle = "#c9a476"; g.fillRect(0, 0, 256, 64);
      for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(110,70,35,${0.08 + bam(i, 3) * 0.12})`; g.fillRect(bam(i, 1) * 256, bam(i, 2) * 64, 18, 3); }
      g.fillStyle = "#9b4a2c"; g.fillRect(0, 40, 256, 6); for (let i = 0; i < 16; i++) { g.beginPath(); g.moveTo(i * 16, 40); g.lineTo(i * 16 + 8, 32); g.lineTo(i * 16 + 16, 40); g.fill(); }
      anhVaiLeu = new THREE.CanvasTexture(cv); anhVaiLeu.colorSpace = THREE.SRGBColorSpace; anhVaiLeu.wrapS = THREE.RepeatWrapping; anhVaiLeu.repeat.x = 3;
    }
    const vai = new THREE.Mesh(new THREE.ConeGeometry(R, C, 9, 1, true), new THREE.MeshLambertMaterial({ map: anhVaiLeu, side: THREE.DoubleSide }));
    vai.position.y = C / 2; vai.castShadow = vai.receiveShadow = !nhe; leu.add(vai);
    const vlGo = new THREE.MeshLambertMaterial({ color: "#6b4524" });
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2, coc = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, C * 1.25, 5), vlGo);
      coc.position.set(Math.cos(a) * R * 0.5, C * 0.62, Math.sin(a) * R * 0.5); coc.lookAt(0, C * 1.6, 0); coc.rotateX(Math.PI / 2);
      coc.castShadow = !nhe; leu.add(coc);
    }
    const cua = new THREE.Mesh(new THREE.CircleGeometry(R * 0.42, 3), new THREE.MeshBasicMaterial({ color: "#2a1a10" }));
    cua.position.set(0, R * 0.36, R * 0.72); cua.rotation.set(-0.42, 0, Math.PI / 2); leu.add(cua);
    leu.rotation.y = gocCua;
    return leu;
  }
  // Lều của làng mẫu (vùng đất thật: bé tự dựng, xem dưới)
  const leu = banDo.leu ? taoLeu(banDo.leu.ti) : new THREE.Group();
  if (banDo.leu) {
    leu.position.set(banDo.leu.x, doCao(banDo.leu.x, banDo.leu.z) - 0.05, banDo.leu.z);
    ctx.canh.add(leu);
  }

  // Công trình bé dựng (TC_D02B2b): móng gỗ (khung 4 cọc + sàn đất nện) + nhà mọc dần theo tiến độ
  const dsCt = new Map(); // id -> { ct, nhom, nha, mong, nay }
  const vlMong = new THREE.MeshLambertMaterial({ color: "#9a7448" }), vlCoc = new THREE.MeshLambertMaterial({ color: "#6b4524" });
  const vlGoSang = new THREE.MeshLambertMaterial({ color: "#8a5a30" }), vlRom = new THREE.MeshLambertMaterial({ color: "#c9a050" });
  const hop = (r, c, s, vl, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(r, c, s), vl); m.position.set(x, y, z); m.castShadow = !nhe; return m; };
  const cot = (rt, rd, c, vl, x, y, z) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rd, c, 6), vl); m.position.set(x, y, z); m.castShadow = !nhe; return m; };
  // Cổng cọc gỗ (TC_D02C): 2 cột, xà ngang, 2 cánh cửa hé mở; dài theo cạnh dài của móng
  function taoCong(ct) {
    const g = new THREE.Group(), L = Math.max(ct.rong, ct.sau);
    for (const s of [-1, 1]) {
      g.add(cot(0.12, 0.14, 1.9, vlCoc, s * (L / 2 - 0.2), 0.95, 0));
      g.add(new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.3, 6), vlCoc).translateX(s * (L / 2 - 0.2)).translateY(2.0));
      const canh = new THREE.Group(); canh.position.set(s * (L / 2 - 0.3), 0, 0);
      const van = hop(L / 2 - 0.35, 1.15, 0.08, vlGoSang, -s * (L / 4 - 0.17), 0.65, 0);
      canh.add(van,hop(L / 2 - 0.4, 0.1, 0.1, vlCoc, -s * (L / 4 - 0.17), 0.95, 0.03), hop(L / 2 - 0.4, 0.1, 0.1, vlCoc, -s * (L / 4 - 0.17), 0.35, 0.03));
      canh.rotation.y = s * 0.55; // hé mở
      g.add(canh);
    }
    g.add(hop(L - 0.1, 0.16, 0.18, vlCoc, 0, 1.7, 0));
    if (ct.sau > ct.rong) g.rotation.y = Math.PI / 2;
    return g;
  }
  // Tháp canh (Chòi canh Đồ đá): 4 chân cao, sàn, lan can, mái rơm chóp
  function taoThap(ct) {
    const g = new THREE.Group(), a = Math.min(ct.rong, ct.sau) * 0.33, C = 2.4;
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(cot(0.07, 0.09, C, vlCoc, sx * a, C / 2, sz * a));
    g.add(hop(a * 2.6, 0.12, a * 2.6, vlGoSang, 0, C, 0));
    for (const [sx, sz, r, s] of [[0, -1, 2.5, 0.06], [0, 1, 2.5, 0.06], [-1, 0, 0.06, 2.5], [1, 0, 0.06, 2.5]]) g.add(hop(a * r, 0.35, a * s, vlCoc, sx * a * 1.25, C + 0.25, sz * a * 1.25));
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(cot(0.04, 0.04, 0.8, vlCoc, sx * a * 1.2, C + 0.45, sz * a * 1.2));
    const mai = new THREE.Mesh(new THREE.ConeGeometry(a * 2.1, 0.8, 4), vlRom); mai.position.y = C + 1.2; mai.rotation.y = Math.PI / 4; mai.castShadow = !nhe; g.add(mai);
    for (let i = 0; i < 3; i++) g.add(hop(a * 1.4, 0.05, 0.05, vlCoc, 0, 0.5 + i * 0.6, a)); // thang
    return g;
  }
  // Tường cọc gỗ (TC_D02C): MỘT InstancedMesh cho mọi ô tường (mỗi ô 5 cọc nhọn cụm chữ thập) -> vài
  // trăm ô tường vẫn chỉ 1 lệnh vẽ. Ô đang dựng: cọc mọc dần theo tiến độ.
  const dsTuong = new Map(); // id -> ct
  const hinhCoc = new THREE.LatheGeometry([new THREE.Vector2(0.075, 0), new THREE.Vector2(0.075, 0.82), new THREE.Vector2(0, 1.02)], 6);
  const CHO_COC = [[0, 0], [0.27, 0], [-0.27, 0], [0, 0.27], [0, -0.27]];
  let coc = null, tuongDoi = true;
  const mt = new THREE.Matrix4(), vtT = new THREE.Vector3(), qT = new THREE.Quaternion(), sT = new THREE.Vector3();
  function veTuong() {
    tuongDoi = false;
    const can = dsTuong.size * CHO_COC.length;
    if (!coc || coc.instanceMatrix.count < can) {
      if (coc) { ctx.canh.remove(coc); coc.dispose(); }
      coc = new THREE.InstancedMesh(hinhCoc, vlCoc, Math.max(100, can * 2));
      coc.castShadow = !nhe; coc.receiveShadow = !nhe; coc.frustumCulled = false;
      ctx.canh.add(coc);
    }
    let k = 0;
    for (const ct of dsTuong.values()) {
      const p = ct.xong ? 1 : Math.max(0.08, ct.tienDo || 0);
      if (!ct.xong) tuongDoi = true;
      CHO_COC.forEach(([dx, dz], j) => {
        const x = ct.x + 0.5 + dx, z = ct.y + 0.5 + dz, cao = (0.95 + bam(ct.x * 31 + ct.y * 17 + j, 4) * 0.35) * (j ? 1 : 1.12);
        vtT.set(x, doCao(x, z) - 0.05, z); sT.set(1, cao * p, 1);
        coc.setMatrixAt(k++, mt.compose(vtT, qT, sT));
      });
    }
    coc.count = k; coc.instanceMatrix.needsUpdate = true;
  }
  function themCt(ct) {
    if (dsCt.has(ct.id) || dsTuong.has(ct.id)) return;
    if (ct.loai === "tuong") { dsTuong.set(ct.id, ct); tuongDoi = true; return; }
    const cx = ct.x + ct.rong / 2, cz = ct.y + ct.sau / 2;
    let y = -Infinity; for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1], [0.5, 0.5]]) y = Math.max(y, doCao(ct.x + a * ct.rong, ct.y + b * ct.sau));
    const nhom = new THREE.Group(); nhom.position.set(cx, y, cz);
    const mong = new THREE.Group();
    const san = new THREE.Mesh(new THREE.BoxGeometry(ct.rong * 0.96, 0.08, ct.sau * 0.96), vlMong);
    san.position.y = 0.0; san.receiveShadow = !nhe; mong.add(san);
    for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const coc = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.55, 5), vlCoc);
      coc.position.set(a * ct.rong * 0.44, 0.27, b * ct.sau * 0.44); coc.castShadow = !nhe; mong.add(coc);
    }
    nhom.add(mong);
    const nha = ct.loai === "cong" ? taoCong(ct) : ct.loai === "thap_canh" ? taoThap(ct) : taoLeu(TI_LEU * Math.min(ct.rong, ct.sau) / 2); // TC_D03..: nhà khác theo ct.loai
    nha.position.y = -0.05; nhom.add(nha);
    ctx.canh.add(nhom);
    const h = { ct, nhom, nha, mong, nay: 0 };
    dsCt.set(ct.id, h);
    datTienDo(h);
  }
  function datTienDo(h) {
    const p = h.ct.xong ? 1 : h.ct.tienDo;
    h.nha.visible = p > 0.02;
    h.nha.scale.set(0.75 + 0.25 * p, Math.max(0.02, p), 0.75 + 0.25 * p);
    h.mong.visible = !h.ct.xong;
  }
  if (lang) {
    for (const ct of lang.congTrinh) themCt(ct);
    lang.nghe(su => {
      if (su.loai === "cong_trinh") themCt(su.ct);
      if (su.loai === "xay_xong") { const h = dsCt.get(su.ct.id); if (h) { datTienDo(h); h.nay = 0.5; } else if (dsTuong.has(su.ct.id)) tuongDoi = true; }
      if (su.loai === "bo_cong_trinh") { // TC_D02C: cổng đè lên tường
        if (dsTuong.delete(su.ct.id)) tuongDoi = true;
        const h = dsCt.get(su.ct.id); if (h) { ctx.canh.remove(h.nhom); dsCt.delete(su.ct.id); }
      }
    });
    ctx.moiKhung(dt => {
      if (tuongDoi) veTuong();
      for (const h of dsCt.values()) {
        if (!h.ct.xong) datTienDo(h);
        else if (h.nay > 0) { h.nay = Math.max(0, h.nay - dt); const k = 1 + Math.sin((0.5 - h.nay) / 0.5 * Math.PI) * 0.12; h.nha.scale.set(k, k, k); }
      }
    });
  }

  // Ruộng: tấm phẳng sát đất, luống cày vẽ bằng canvas ('mam' = có mầm xanh). TC_D03: vòng đời ruộng
  for (const r of banDo.ruong || []) {
    const cv = document.createElement("canvas"); cv.width = 128; cv.height = 128; const g = cv.getContext("2d");
    g.fillStyle = "#8a6038"; g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 8; i++) { g.fillStyle = "#6e4a2a"; g.fillRect(0, i * 16 + 9, 128, 5); g.fillStyle = "#a57a4c"; g.fillRect(0, i * 16 + 3, 128, 3); }
    if (r.mam) for (let i = 0; i < 90; i++) { g.fillStyle = bam(i, 9) < 0.5 ? "#7cc24a" : "#5ea83a"; g.beginPath(); g.ellipse(bam(i, 5) * 128, Math.floor(bam(i, 6) * 8) * 16 + 4, 3, 2, 0, 0, 7); g.fill(); }
    g.strokeStyle = "#5b3d22"; g.lineWidth = 6; g.strokeRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    const tam = new THREE.Mesh(new THREE.PlaneGeometry(r.rong, r.dai).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: t }));
    tam.position.set(r.x, 0.13, r.z); tam.rotation.y = THREE.MathUtils.degToRad(r.goc || 0); tam.receiveShadow = !nhe;
    ctx.canh.add(tam);
  }

  // Trang trí
  const boTrangTri = {};
  for (const t of banDo.trangTri || []) {
    if (!boTrangTri[t.mo]) boTrangTri[t.mo] = new moHinh.BoNhieuBan(t.mo, 8);
    const y = t.mo.startsWith("water") ? diaHinh.MUC_NUOC : doCao(t.x, t.z);
    boTrangTri[t.mo].them(t.x, y, t.z, t.ti, t.goc);
  }

  // Lửa trại: củi + ngọn lửa phát sáng + đèn chập chờn
  const lua = new THREE.Group();
  if (banDo.lua) {
    const cui = moHinh.mauGoc.resource_lumber;
    for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(cui.geometry, moHinh.vatLieu); m.scale.setScalar(0.9); m.rotation.y = i * Math.PI / 3; m.castShadow = !nhe; lua.add(m); }
    const ngon = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.6, 7).translate(0, 0.3, 0), new THREE.MeshBasicMaterial({ color: "#ffb03a" }));
    const loi = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.36, 7).translate(0, 0.18, 0), new THREE.MeshBasicMaterial({ color: "#fff2a8" }));
    ngon.position.y = loi.position.y = 0.1; lua.add(ngon, loi);
    let den = null;
    if (!nhe) { den = new THREE.PointLight("#ff9a3a", 4, 6, 1.6); den.position.y = 0.9; lua.add(den); }
    lua.position.set(banDo.lua.x, doCao(banDo.lua.x, banDo.lua.z), banDo.lua.z);
    ctx.canh.add(lua);
    ctx.moiKhung((dt, t) => {
      const nhap = 1 + Math.sin(t * 13) * 0.08 + Math.sin(t * 7.3) * 0.06;
      ngon.scale.set(1, nhap, 1); loi.scale.set(1, 2 - nhap, 1);
      if (den) den.intensity = 5 + Math.sin(t * 11) * 1.2 + Math.sin(t * 17) * 0.8;
    });
  }
  return { leu, lua, hinhCt: id => dsCt.get(id) || null };
}
// 28/10/2026 00:05 - BƯỚC: TC_D02C
