// ================================================================
// FILE: dt/3d/dt3d_tran.js  (ES module) - PHẦN VẼ 3D: SÂN ĐẤU
// CHỨC NĂNG: Sân đấu 3D cho màn chiến đấu theo lượt (TC_D05): bãi cỏ + cây, đá của bộ mô hình
//            làng, Thủ lĩnh KayKit đúng ngoại hình bé (dt3d_nhan_vat.js, gói động tác trận),
//            quái 3D (dt3d_quai.js). Diễn kết quả lượt mà LÕI (dt_tran_dau.js) đã tính:
//            lao tới + chém / quái nhảy vồ, trúng (chớp sáng, lùi lại, sao bay), né (lùi né),
//            hụt; vòng sáng thế thủ, bóng "..." khi quái nghĩ; kết thúc: quái bỏ chạy / Thủ lĩnh
//            kiệt sức rồi dịch chuyển về Lều (không có cảnh chết, đặc tả VI.8).
//            Trang không phải module: tải xong gán window.KC_DT_SAN3D và phát sự kiện "dt-san3d".
// HÀM KHAI RA (window.KC_DT_SAN3D):
//   tao(vungVe, { nhe }) -> Promise<san>; san = { datTran({ chungLoai, hoSo, quai, chu }),
//        ketQua(k) (k: kết quả lượt của lõi), thu(ben, bat), nghi(bat), ketThuc(thang),
//        viTri(ben) -> { x, y } điểm ảnh trong vùng vẽ (trên đầu),
//        chieuVung(ma) -> giây diễn (ma: mua_lua | thien_thach | loc_xoay | dam_dat | vo_khong_gian; TC_D05B2) }
// LUẬT NỐI: dùng dt3d_canh.js, dt3d_mo_hinh.js, dt3d_nhan_vat.js, dt3d_quai.js; NV = window.KC_NV.
// BƯỚC: TC_D05 (người dùng 29/10/2026: "đồ hoạ xấu quá" -> sân 3D cùng bộ hình với làng;
//        sau đó: hiệu ứng chiến đấu + phép thuật theo tộc, dt3d_hieu_ung.js);
//        TC_D05B1 (Thủ lĩnh = tướng người thật dt3d_tuong.js; tải lỗi thì KayKit như cũ);
//        TC_D05B2 (chiêu phủ vùng rộng dt3d_chieu_vung.js + bộ hạt card đồ hoạ dt3d_hat.js)
// NGÀY: 29/10/2026; 29/10/2026 19:00; 30/10/2026
// ================================================================
import * as THREE from "three";
import { taoCanh, docDoHoa, bam } from "./dt3d_canh.js";
import { taiGlb, taoBoMoHinh } from "./dt3d_mo_hinh.js";
import { taoBoNhanVat } from "./dt3d_nhan_vat.js";
import { taoQuai3d } from "./dt3d_quai.js";
import { taoBoTuong } from "./dt3d_tuong.js";
import { taoHieuUng } from "./dt3d_hieu_ung.js";
import { taoBoHat } from "./dt3d_hat.js";
import { taoChieuVung } from "./dt3d_chieu_vung.js";
import { EffectComposer } from "../../thu_vien/three/postprocessing/EffectComposer.js";
import { RenderPass } from "../../thu_vien/three/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "../../thu_vien/three/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "../../thu_vien/three/postprocessing/OutputPass.js";

const duongDan = p => new URL(p, import.meta.url).href;
const X_BE = -1.55, X_QUAI = 1.55, TI_BE = 1.45, TI_QUAI = 1.25, CAO_TUONG = 1.85;
const HUONG_BE = Math.PI / 2 - 0.6, HUONG_QUAI = -Math.PI / 2 + 0.85;
// phong cách chiêu theo tộc: Nhân tộc kiếm quang vàng, Quỷ tộc chém lửa, Tiên tộc bắn cầu phép (chí mạng = chiêu lớn)
const KIEU_TOC = {
  nhan: { mau: "#ffd36b", mau2: "#fff3c4", chieu: "KIẾM QUANG TRẢM" },
  quy: { mau: "#ff6a2a", mau2: "#ffc27a", chieu: "HOẢ NGỤC BẠO" },
  tien: { mau: "#7fd8ff", mau2: "#e2c8ff", chieu: "LÔI THẦN GIÁNG", phep: true }
};
// đòn của quái: dom_dom bắn tia sáng từ xa, còn lại lao tới
const KIEU_QUAI = { slime_so: { mau: "#86ff6e" }, nam_chu_cai: { mau: "#c995ff" }, dom_dom: { mau: "#fff27a", xa: true } };

function anhTron(ve, co = 64) { const cv = document.createElement("canvas"); cv.width = cv.height = co; ve(cv.getContext("2d"), co); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; }

async function tao(vungVe, { nhe } = {}) {
  nhe = nhe != null ? nhe : docDoHoa() === "nhe";
  // tướng người thật (TC_D05B1): kho tướng ở du_lieu/tuong.json; chỉ tải file của tướng đang đấu
  // (mỗi file ~1 MB), nhớ lại khi đấu tiếp. Lỗi ở bất kỳ bước nào thì dùng Thủ lĩnh KayKit như cũ.
  const boNhoTuong = {};
  const taiTuong = tep => boNhoTuong[tep] || (boNhoTuong[tep] = taiGlb(duongDan("../mo_hinh/" + tep)));
  const [glbLang, glbNv, glbTran, glbDongTacTuong, khoTuong] = await Promise.all([
    taiGlb(duongDan("../mo_hinh/lang.glb")), taiGlb(duongDan("../mo_hinh/nhan_vat.glb")), taiGlb(duongDan("../mo_hinh/dong_tac_tran.glb")),
    taiGlb(duongDan("../mo_hinh/dong_tac_tuong.glb")).catch(() => null),
    fetch(duongDan("../du_lieu/tuong.json")).then(r => r.json()).catch(() => null)
  ]);
  // tướng cho hồ sơ: hoSo.tuong (mã trong kho, vd trang thử ?tuong=demon) hoặc Thủ lĩnh theo tộc + giới
  function chonTuong(hoSo) {
    if (!khoTuong) return null;
    const ma = hoSo.tuong || khoTuong.thuLinh[hoSo.chungLoai + "_" + (hoSo.gioi === "nu" ? "nu" : "nam")] || khoTuong.thuLinh.nhan_nam;
    return khoTuong.kho.find(t => t.ma === ma) || null;
  }
  if (khoTuong) { const t = chonTuong({ chungLoai: "nhan" }); if (t) taiTuong(t.tep).catch(() => {}); } // tải sẵn tướng mặc định
  const ctx = taoCanh(vungVe, { nhe });
  const { canh } = ctx;
  canh.background = new THREE.Color("#9fd2ec");
  canh.fog = new THREE.Fog("#9fd2ec", 16, 34);
  ctx.datNangTheo(new THREE.Vector3(0, 0, 0));
  const moHinh = taoBoMoHinh(ctx, glbLang);
  const hu = taoHieuUng(ctx, { nhe });
  const bui = hu.taoBui();
  const boHat = taoBoHat(ctx, { nhe });
  let camera = null;
  const cv = taoChieuVung(ctx, hu, boHat, { nhe, layCamera: () => camera });
  let kieu = KIEU_TOC.nhan, haoQuang = null, cham = 0;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  // --- bãi cỏ (màu loang), sân đất giữa, cây + đá xung quanh ---
  {
    const g = new THREE.PlaneGeometry(70, 50, 70, 50); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, mau = [], c = new THREE.Color();
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), n = bam(Math.round(x * 2), Math.round(z * 2)); c.setHSL(0.27 + n * 0.03, 0.45, 0.36 + n * 0.08); mau.push(c.r, c.g, c.b); }
    g.setAttribute("color", new THREE.Float32BufferAttribute(mau, 3));
    const dat = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true })); dat.receiveShadow = !nhe; canh.add(dat);
    const san = new THREE.Mesh(new THREE.CircleGeometry(3.4, 48).scale(1.35, 1, 0.75).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: "#b8a473", transparent: true, opacity: 0.55 }));
    san.position.y = 0.01; san.receiveShadow = !nhe; canh.add(san);
    const datMoHinh = (ten, x, z, cao, xoay) => {
      if (!moHinh.mauGoc[ten]) return;
      const kt = moHinh.kichThuoc(ten), m = new THREE.Mesh(moHinh.mauGoc[ten].geometry, moHinh.vatLieu);
      m.scale.setScalar(cao / Math.max(0.01, kt.y)); m.position.set(x, 0, z); m.rotation.y = xoay; m.castShadow = !nhe; m.receiveShadow = !nhe; canh.add(m);
    };
    const cay = [[-7.5, -4.5], [-5.2, -6.8], [-2.5, -8.5], [1.2, -9], [4.5, -7.2], [7.6, -5], [9.5, -8], [-9.6, -7.5], [-11, -2.5], [11.5, -2.8], [-3.8, -12], [6.5, -12]];
    cay.forEach(([x, z], i) => datMoHinh(i % 2 ? "tree_single_B" : "tree_single_A", x, z, 2.8 + bam(i, 3) * 1.4, bam(i, 7) * 6));
    [[-4.6, -2.6, 0.45], [4.9, -2.2, 0.38], [-6.2, 1.6, 0.3], [6.4, 1.2, 0.5], [3.3, -4.4, 0.3]].forEach(([x, z, cao], i) => datMoHinh(["rock_single_A", "rock_single_C", "rock_single_E"][i % 3], x, z, cao, i));
    datMoHinh("flag_red", -4.2, -3.6, 1.6, 0.4);
  }

  // --- Thủ lĩnh ---
  const NV = window.KC_NV;
  const boNv = taoBoNhanVat(ctx, glbNv, moHinh, { doCaoDi: () => 0 }, NV);
  boNv.themDongTac(glbTran.animations);
  const dvBe = { ten: "", x: X_BE, z: 0, huongMuon: HUONG_BE, trangThai: "dung", duong: [], viec: null, mang: { loai: null, so: 0 }, chay: false, ranh: false };
  const boTuong = glbDongTacTuong ? taoBoTuong(ctx, glbDongTacTuong) : null;
  let hBe = null, tuong = null, khoaBe = "", vlBe = [], caoBe = 1.5 * TI_BE, lanDung = 0;
  function dungBe(hoSo) {
    const khoa = JSON.stringify(hoSo);
    const vo = tuong ? tuong.vo : hBe && hBe.vo;
    if (vo && khoa === khoaBe) { vo.visible = true; return; }
    khoaBe = khoa;
    const lan = ++lanDung, tt = boTuong && chonTuong(hoSo);
    if (tt) { // tải tướng (lần đầu ~1 MB); trong lúc tải giữ tướng cũ trên sân
      taiTuong(tt.tep).then(glb => {
        if (lan !== lanDung) return; // bé đã đổi tướng khác trong lúc tải
        if (tuong) canh.remove(tuong.vo);
        if (hBe) { boNv.xoa(hBe); hBe = null; }
        tuong = boTuong.tao(glb, Object.assign({}, hoSo, { chungLoai: tt.toc }), CAO_TUONG); tuong.vo.rotation.y = HUONG_BE;
        tuong.vo.position.set(dvBe.x, 0, dvBe.z);
        vlBe = tuong.vlPhatSang; caoBe = CAO_TUONG;
      }, () => { if (lan === lanDung && !tuong) dungKayKit(hoSo); });
      return;
    }
    dungKayKit(hoSo);
  }
  function dungKayKit(hoSo) {
    if (hBe) boNv.xoa(hBe);
    hBe = boNv.tao(dvBe, "thu_linh", hoSo);
    hBe.vo.scale.setScalar(TI_BE);
    hBe.vuKhiMacDinh = "1H_Axe"; if (hBe.vuKhi["1H_Axe"]) hBe.vuKhi["1H_Axe"].visible = true;
    vlBe = []; hBe.goc.traverse(o => { if (o.isMesh && o.material.emissive && vlBe.indexOf(o.material) < 0) vlBe.push(o.material); });
  }
  // động tác theo kiểu (dt3d_tuong.js); Thủ lĩnh KayKit dự phòng thì đổi sang tên động tác KayKit
  const KAYKIT = { thu: ["Block"], do: ["Block"], chem: ["1H_Melee_Attack_Slice_Diagonal"], chemLon: ["1H_Melee_Attack_Slice_Diagonal"], phep: ["Spellcast_Shoot"], trung: ["Hit_A"], ne: ["Dodge_Backward"], thua: ["Hit_B"], mung: ["Cheer", "Cheer"] };
  const dien = (kieu, xong) => { if (tuong) tuong.dien(kieu, xong); else if (hBe && KAYKIT[kieu]) boNv.dien(hBe, KAYKIT[kieu], null, xong, HUONG_BE); };
  const voBe = () => tuong ? tuong.vo : hBe && hBe.vo;

  // --- quái ---
  let quai = null;
  function dungQuai(ma, chu) {
    if (quai) canh.remove(quai.nhom);
    quai = taoQuai3d(ma, { nhe }); quai.ma = ma;
    quai.nhom.position.set(X_QUAI, 0, 0); quai.nhom.rotation.y = HUONG_QUAI;
    quai.nhom.scale.setScalar(TI_QUAI);
    if (chu) quai.datChu(chu);
    canh.add(quai.nhom);
  }

  // --- vòng thế thủ, bóng suy nghĩ, sao bay, chớp sáng ---
  const vongTex = anhTron((g, n) => { const gr = g.createRadialGradient(n / 2, n / 2, n * 0.3, n / 2, n / 2, n / 2); gr.addColorStop(0, "rgba(255,230,120,0)"); gr.addColorStop(0.75, "rgba(255,230,120,.95)"); gr.addColorStop(1, "rgba(255,230,120,0)"); g.fillStyle = gr; g.fillRect(0, 0, n, n); }, 128);
  function taoVong(mau) {
    const nhom = new THREE.Group();
    const day = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: vongTex, color: mau, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    day.position.y = 0.03; nhom.add(day);
    const vlVom = hu.taoVlKhien(mau); vlVom.uniforms.uMo.value = 0.75;
    const vom = new THREE.Mesh(new THREE.SphereGeometry(1.05, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 1.6, 1), vlVom);
    nhom.add(vom); nhom.visible = false; canh.add(nhom);
    return nhom;
  }
  const vong = { be: taoVong("#ffd75e"), quai: taoVong("#ff9b9b") };
  const bongCv = document.createElement("canvas"); bongCv.width = 128; bongCv.height = 96;
  const bongTex = new THREE.CanvasTexture(bongCv); bongTex.colorSpace = THREE.SRGBColorSpace;
  const bong = new THREE.Sprite(new THREE.SpriteMaterial({ map: bongTex, depthTest: false })); bong.scale.set(0.8, 0.6, 1); bong.visible = false; canh.add(bong);
  function veBong(t) {
    const g = bongCv.getContext("2d"); g.clearRect(0, 0, 128, 96);
    g.fillStyle = "#ffffff"; g.strokeStyle = "#1d1630"; g.lineWidth = 5;
    g.beginPath(); g.ellipse(64, 40, 56, 32, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.beginPath(); g.arc(30, 80, 9, 0, Math.PI * 2); g.fill(); g.stroke();
    for (let i = 0; i < 3; i++) { const a = Math.max(0, Math.sin(t * 5 - i * 0.8)); g.globalAlpha = 0.3 + 0.7 * a; g.fillStyle = "#1d1630"; g.beginPath(); g.arc(40 + i * 24, 40, 7, 0, Math.PI * 2); g.fill(); }
    g.globalAlpha = 1; bongTex.needsUpdate = true;
  }
  const chopTex = anhTron((g, n) => { const gr = g.createRadialGradient(n / 2, n / 2, 1, n / 2, n / 2, n / 2); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.4, "rgba(255,245,200,.7)"); gr.addColorStop(1, "rgba(255,240,180,0)"); g.fillStyle = gr; g.fillRect(0, 0, n, n); });
  const hatSang = [];
  function noLapLanh(p, mau) { // hạt sáng khi dịch chuyển / né
    for (let i = 0; i < 14; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: chopTex, color: mau, transparent: true, depthTest: false, blending: THREE.AdditiveBlending }));
      s.scale.setScalar(0.25); s.position.copy(p).add(new THREE.Vector3((Math.random() - 0.5) * 0.8, Math.random() * 1.2, (Math.random() - 0.5) * 0.6)); canh.add(s);
      hatSang.push({ s, v: new THREE.Vector3(0, 1.2 + Math.random(), 0), con: 0.9, tong: 0.9 });
    }
  }
  function chopBe(giay) { them(giay, p => { const k = (1 - p) * 0.5; for (const v of vlBe) { const g = v.userData.sangGoc || 0; v.emissive.setRGB(g + k, g + k * 0.55, g + k * 0.5); } }); } // chớp đỏ nhạt khi trúng đòn (tướng: trở về độ tự sáng gốc)

  // --- hoạt cảnh theo thời gian (tween) ---
  const dsTween = [];
  function them(giay, fn, tre = 0) { dsTween.push({ t: -tre, giay, fn }); }
  ctx.moiKhung((dt, t) => {
    if (cham > 0) { cham -= dt; dt *= 0.08; } // khựng hình khi chí mạng
    hu.capNhat(dt, t); bui.capNhat(dt, t); boHat.capNhat(dt); cv.capNhat(dt, t);
    if (haoQuang) haoQuang.capNhat(dt, t, dvBe);
    for (let i = dsTween.length - 1; i >= 0; i--) {
      const w = dsTween[i]; w.t += dt;
      if (w.t < 0) continue;
      const p = Math.min(1, w.t / w.giay); w.fn(p);
      if (p >= 1) dsTween.splice(i, 1);
    }
    for (let i = hatSang.length - 1; i >= 0; i--) {
      const h = hatSang[i]; h.con -= dt;
      h.s.position.addScaledVector(h.v, dt); h.v.y -= dt * (h.quay ? 5 : 0);
      h.s.material.opacity = Math.max(0, h.con / h.tong);
      if (h.lon) h.s.scale.setScalar(1.2 + (1 - h.con / h.tong) * h.lon);
      if (h.quay) h.s.material.rotation += dt * 6;
      if (h.con <= 0) { canh.remove(h.s); h.s.material.dispose(); hatSang.splice(i, 1); }
    }
    boNv.capNhat(dt);
    if (tuong) { tuong.vo.position.set(dvBe.x, 0, dvBe.z); tuong.capNhat(dt); }
    if (quai) quai.capNhat(dt, t);
    for (const k of ["be", "quai"]) {
      const v = vong[k]; if (!v.visible) continue;
      v.position.set(k === "be" ? dvBe.x : quai.nhom.position.x, 0, k === "be" ? dvBe.z : quai.nhom.position.z);
      const n = 1 + Math.sin(t * 5) * 0.05; v.scale.set(n, 1, n);
    }
    if (bong.visible && quai) { veBong(t); bong.position.set(quai.nhom.position.x + 0.5, quai.cao * TI_QUAI + 0.55, 0.2); }
  });

  // --- camera phối cảnh nhìn ngang sân, vừa cả hai bên ---
  camera = new THREE.PerspectiveCamera(32, 1, 0.1, 80);
  // phát sáng Bloom (chỉ chế độ Đẹp): chỗ rất sáng (phép, lửa, tia chém) toả quầng
  let hauKy = null;
  if (!nhe) {
    hauKy = new EffectComposer(ctx.renderer);
    hauKy.addPass(new RenderPass(canh, camera));
    hauKy.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), 0.4, 0.35, 0.92));
    hauKy.addPass(new OutputPass());
    ctx.ve = () => hauKy.render();
  }
  const dich = new THREE.Vector3(0, 0.92, 0), huongCam = new THREE.Vector3(0, 0.26, 1).normalize();
  function coKhung() {
    const w = vungVe.clientWidth || 1, h = vungVe.clientHeight || 1, a = w / h;
    ctx.renderer.setSize(w, h);
    if (hauKy) { hauKy.setPixelRatio(ctx.renderer.getPixelRatio()); hauKy.setSize(w, h); }
    camera.aspect = a;
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const kc = Math.max(3.05 / (a * tan), 1.55 / tan);
    camera.position.copy(dich).addScaledVector(huongCam, kc);
    camera.lookAt(dich); camera.updateProjectionMatrix();
    camGoc.copy(camera.position);
  }
  const camGoc = new THREE.Vector3();
  ctx.moiKhung(() => camera.position.copy(camGoc).add(hu.lechCamera()));
  new ResizeObserver(coKhung).observe(vungVe); coKhung();
  ctx.batDau(camera);

  const viTriDau = ben => ben === "be" ? new THREE.Vector3(dvBe.x, caoBe * 0.95, dvBe.z) : new THREE.Vector3(quai ? quai.nhom.position.x : X_QUAI, (quai ? quai.cao : 1) * TI_QUAI + 0.2, 0);

  const tamQuai = () => V(quai.nhom.position.x, quai.cao * TI_QUAI * 0.55, 0.15);
  const tamBe = () => V(dvBe.x, caoBe * 0.52, 0.2);
  // va chạm: chớp + tia lửa + sóng đất + rung; manh = chí mạng (to hơn, khựng hình)
  function vaCham(p, mau, manh) {
    hu.chop(p, "#ffffff", manh ? 1.1 : 0.7, 0.14, 0.7);
    hu.chop(p, mau, manh ? 2 : 1.2, 0.28, 0.45);
    hu.tia(p, mau, manh ? 26 : 14, manh ? 7 : 5);
    hu.songXung(V(p.x, 0, p.z), mau, manh ? 2.2 : 1.2, 0.5);
    hu.rung(manh ? 0.09 : 0.035, manh ? 0.45 : 0.22);
    if (manh) cham = 0.1;
  }
  // chiêu lớn khi chí mạng, theo tộc
  function chieuLon(p) {
    hu.chuChieu(kieu.chieu, V(0, 2.4, 0.4), kieu.mau);
    if (kieu === KIEU_TOC.quy) hu.cotLua(V(p.x, 0, 0), 0.9);
    else if (kieu === KIEU_TOC.tien) hu.set(V(p.x, 0, 0), "#bfe9ff");
    else {
      hu.vetChem(p, kieu.mau2, { r: 1.25, day: 0.5, tu: 2.5, den: -0.7, xoayY: 0, giay: 0.32, sang: 2 });
      them(0.01, () => hu.vetChem(p, kieu.mau, { r: 1.25, day: 0.5, tu: 0.65, den: -2.55, xoayY: 0, giay: 0.32, sang: 2 }), 0.1);
      them(0.01, () => { hu.songXung(V(p.x, 0, 0), kieu.mau, 2.6, 0.7); hu.chop(p, kieu.mau2, 2.6, 0.35, 0.5); }, 0.18);
    }
  }

  const san = {
    datTran({ hoSo, quai: ma, chu }) {
      dsTween.length = 0;
      dvBe.x = X_BE; dvBe.z = 0;
      const hs = NV.chuanHoa(hoSo || {});
      if (hoSo && hoSo.tuong) hs.tuong = hoSo.tuong; // chuanHoa (dùng chung) không biết trường tuong
      dungBe(hs);
      kieu = KIEU_TOC[hs.chungLoai] || KIEU_TOC.nhan;
      if (haoQuang) canh.remove(haoQuang.nhom);
      haoQuang = hu.taoHaoQuang(kieu.mau);
      dungQuai(ma, chu);
      vong.be.visible = vong.quai.visible = bong.visible = false;
    },
    thu(ben, bat) {
      vong[ben].visible = !!bat;
      if (ben === "be") { if (bat) dien("thu"); else if (tuong && tuong.dangDien() === "thu") dien("dung"); }
    },
    nghi(bat) { bong.visible = !!bat; },
    ketQua(k) {
      vong.be.visible = vong.quai.visible = false; bong.visible = false;
      const trung = k.satThuong > 0, ne = k.kieu === "ne";
      const qn = quai.nhom;
      if (k.tanCong === "be") {
        const quaiNe = () => { hu.gio(V(qn.position.x, 0, 0.1), 1); noLapLanh(qn.position.clone(), "#bfeaff"); them(0.45, p => { qn.position.x = X_QUAI + Math.sin(p * Math.PI) * 0.9; qn.position.y = Math.sin(p * Math.PI) * 0.55; }); };
        const trungDon = p => {
          quai.chop(0.3); vaCham(p, kieu.mau, k.chiMang);
          if (kieu === KIEU_TOC.quy) hu.khoi(p, "#ff8a3a", 6, 0.5);
          if (k.chiMang) chieuLon(p);
          them(0.35, q => { qn.position.x = X_QUAI + Math.sin(q * Math.PI) * 0.45; qn.scale.set(TI_QUAI * (1 + Math.sin(q * Math.PI) * 0.18), TI_QUAI * (1 - Math.sin(q * Math.PI) * 0.18), TI_QUAI); });
        };
        if (kieu.phep) { // Tiên tộc: đứng tại chỗ bắn cầu phép
          dien(k.chiMang ? "phepLon" : "phep");
          them(0.01, () => {
            const tu = V(dvBe.x + 0.45, caoBe * 0.7, 0.25), den = tamQuai();
            if (ne) den.x += 1.8; else if (!trung) den.set(den.x - 0.5, 0.05, 0.3);
            hu.chop(tu, kieu.mau, 1.3, 0.3);
            hu.phong(tu, den, { mau: kieu.mau, mau2: "#ffffff", giay: 0.32, co: 0.3, cong: 0.25, khiToi: p => { if (trung) trungDon(p); else if (!ne) hu.khoi(p, "#9aa7b5", 5, 0.6, false); } });
          }, 0.22);
          if (ne) them(0.01, quaiNe, 0.36);
        } else { // Nhân / Quỷ tộc: lao tới chém
          dien(k.chiMang ? "chemLon" : "chem");
          const tamDanh = tuong ? 1.45 : 1.15; // tướng người thật tay dài + kiếm: dừng xa quái hơn
          them(0.28, p => { dvBe.x = X_BE + (X_QUAI - tamDanh - X_BE) * Math.sin(p * Math.PI / 2); });
          them(0.01, () => hu.vetChem(V(dvBe.x + 0.5, caoBe * 0.52, 0.35), kieu.mau, { r: 0.9, giay: 0.3, nghieng: -0.15 }), 0.2);
          them(0.01, () => { if (trung) trungDon(tamQuai()); else if (ne) quaiNe(); else hu.tia(V(dvBe.x + 0.9, 0.1, 0.2), "#d8c9a8", 6, 2.5); }, 0.3);
          them(0.35, p => { dvBe.x = X_QUAI - tamDanh + (X_BE - X_QUAI + tamDanh) * p; }, 0.75);
        }
      } else {
        const kq = KIEU_QUAI[quai.ma] || KIEU_QUAI.slime_so;
        // bé chọn đúng => đang giữ thế thủ (trang gọi thu("be", true)); giữ tới khi quái đánh xong rồi mới thả
        const dangThu = !!(tuong && tuong.dangDien() === "thu");
        let daTha = false;
        them(0.01, () => { daTha = true; if (tuong && ["thu", "do"].indexOf(tuong.dangDien()) >= 0) dien("dung"); }, 1.15);
        const beChiu = p => {
          if (trung) {
            dien("trung"); chopBe(0.3);
            vaCham(p, k.chiMang ? "#ff5a4a" : "#ffb08a", k.chiMang);
            if (quai.ma === "nam_chu_cai") hu.khoi(p, kq.mau, 8, 0.8); else hu.tia(p, kq.mau, 10, 4);
            them(0.35, q => { dvBe.x = X_BE - Math.sin(q * Math.PI) * 0.4; });
          } else if (ne) { dien("ne"); hu.gio(V(dvBe.x, 0, 0.1), -1); noLapLanh(V(dvBe.x, 0, 0), "#bfeaff"); }
          else if (k.beChon != null) {
            // đỡ được: Nhân tộc giơ khiên + khiên năng lượng; Quỷ tộc đứng tấn chịu đòn (bụi + tia); Tiên tộc kết giới sáng
            if (dangThu) dien("do", () => { if (!daTha) dien("thu"); }); else dien("do");
            if (kieu === KIEU_TOC.quy) { hu.tia(p, "#ffb070", 12, 4); hu.khoi(V(dvBe.x, 0.1, 0.2), "#cdbf9c", 6, 0.6, false); hu.rung(0.03, 0.2); }
            else { hu.khien(V(dvBe.x, caoBe * 0.5, 0.05), kieu === KIEU_TOC.tien ? "#9fe4ff" : kieu.mau, 0.6, caoBe * 0.55); hu.tia(p, "#ffffff", 8, 4); }
          }
          else { if (!dangThu) dien("dung"); hu.khoi(V(dvBe.x + 0.6, 0.1, 0.2), "#cdbf9c", 5, 0.6, false); }
        };
        if (kq.xa) { // đom đóm bắn tia sáng
          them(0.25, p => { qn.position.y = Math.sin(p * Math.PI) * 0.35; });
          them(0.01, () => {
            const tu = tamQuai(), den = tamBe();
            if (ne) den.x -= 1.6; else if (!trung && k.beChon == null) den.set(den.x + 0.6, 0.05, 0.3);
            hu.chop(tu, kq.mau, 1.5, 0.3);
            hu.phong(tu, den, { mau: kq.mau, mau2: "#ffffff", giay: 0.38, co: 0.26, cong: 0.3, khiToi: p => { if (!ne) beChiu(p); } });
          }, 0.12);
          if (ne) them(0.01, () => beChiu(), 0.3);
        } else {
          them(0.3, p => { qn.position.x = X_QUAI + (X_BE + 1.0 - X_QUAI) * p; qn.position.y = Math.sin(p * Math.PI) * 0.6; });
          them(0.01, () => beChiu(tamBe()), 0.3);
          them(0.4, p => { qn.position.x = X_BE + 1.0 + (X_QUAI - X_BE - 1.0) * p; qn.position.y = Math.sin(p * Math.PI) * 0.4; }, 0.55);
        }
      }
      // hào quang combo dưới chân Thủ lĩnh
      const cb = k.combo ? k.combo.be : 0;
      if (haoQuang) haoQuang.bat(cb >= 5 ? 2 : cb >= 3 ? 1 : 0);
    },
    ketThuc(thang) {
      vong.be.visible = vong.quai.visible = bong.visible = false;
      if (thang === "quai") {
        if (haoQuang) haoQuang.bat(0);
        dien("thua"); // tướng quỳ xuống kiệt sức rồi dịch chuyển về Lều (không có cảnh chết)
        them(0.01, () => { noLapLanh(V(dvBe.x, 0, 0), "#fff1a8"); hu.chop(V(dvBe.x, 1, 0.2), "#fff1a8", 2.4, 0.4); if (voBe()) voBe().visible = false; }, tuong ? 2.4 : 1.3);
      } else {
        if (thang === "be") { dien("mung"); if (haoQuang) haoQuang.bat(2); them(0.01, () => { hu.songXung(V(dvBe.x, 0, 0), kieu.mau, 2.4, 0.8); hu.chop(V(dvBe.x, 1.2, 0.2), kieu.mau2, 3, 0.5); }, 0.2); }
        const q = quai;
        them(0.01, () => hu.khoi(V(q.nhom.position.x, 0.1, 0.1), "#cdbf9c", 6, 0.7, false), 0.6);
        them(1.2, p => { q.nhom.position.x = X_QUAI + p * 5; q.nhom.position.y = Math.abs(Math.sin(p * Math.PI * 4)) * 0.35; q.nhom.rotation.y = Math.PI / 2; q.datMo(1 - p); }, 0.6);
      }
    },
    // chiêu lớn phủ vùng (TC_D05B2; TC_D05C sẽ gắn vào kỹ năng). Trả về số giây diễn.
    chieuVung(ma) {
      if (!quai) return 0;
      const qn = quai.nhom, xq = qn.position.x;
      const TEN = { mua_lua: "HOẢ VŨ THIÊN GIÁNG", thien_thach: "THIÊN THẠCH LẠC", loc_xoay: "CUỒNG PHONG", dam_dat: "CHẤN ĐỊA", vo_khong_gian: "PHÁ KHÔNG QUYỀN" };
      if (!TEN[ma]) return 0;
      vong.be.visible = vong.quai.visible = bong.visible = false;
      hu.chuChieu(TEN[ma], V(0, 2.4, 0.4), kieu.mau);
      const runQuai = (giay, tre) => them(giay, p => { if (Math.random() < 0.06) quai.chop(0.12); qn.position.x = xq + Math.sin(p * 70) * 0.02; }, tre);
      // mưa lửa / thiên thạch: ít và chậm để mắt theo kịp (người dùng 30/10/2026: giảm còn 1/3, chậm hơn)
      if (ma === "mua_lua") { dien("phepLon"); runQuai(3.2, 1.9); return cv.muaLua({ tam: V(xq - 0.4, 0, -0.7), r: 3.8 }); }
      if (ma === "thien_thach") { dien("phepLon"); runQuai(2.8, 2.1); return cv.thienThach({ tam: V(xq - 0.2, 0, -0.4), r: 1.8, so: 3 }); }
      if (ma === "loc_xoay") {
        dien("phepLon");
        // phễu đi từ sau quái, quét qua quái (tới đúng chỗ quái ở giây 1,8) rồi tan
        const giay = cv.locXoay({ tu: V(xq + 1.6, 0, -1), den: V(xq - 1.4, 0, 0.4), giay: 3.4 }).giay;
        // quái bị cuốn lên, xoay tít, rồi rơi phịch xuống
        them(1.3, p => { qn.position.y = Math.sin(p * Math.PI) * 1.6; qn.rotation.y = HUONG_QUAI + p * Math.PI * 8; }, 1.4);
        them(0.01, () => { qn.rotation.y = HUONG_QUAI; quai.chop(0.3); hu.songXung(V(xq, 0, 0), "#d8c9a8", 1.6, 0.5); hu.khoi(V(xq, 0.1, 0.1), "#cdbf9c", 8, 0.7, false); hu.rung(0.06, 0.3); }, 2.7);
        return giay;
      }
      if (ma === "dam_dat") {
        dien("chemLon");
        them(0.01, () => cv.damDat({ tam: V(dvBe.x + 0.35, 0, 0.05), r: 4.2, huong: V(1, 0, 0.05) }), 0.32);
        them(0.55, p => { qn.position.y = Math.sin(p * Math.PI) * 0.9; qn.rotation.z = Math.sin(p * Math.PI) * 0.4; }, 0.55);
        them(0.01, () => { qn.rotation.z = 0; quai.chop(0.3); }, 1.1);
        return 2.6;
      }
      // đấm vỡ không gian: lao tới, đấm, khung hình vỡ
      dien("chemLon");
      const tamDanh = tuong ? 1.45 : 1.15;
      them(0.28, p => { dvBe.x = X_BE + (X_QUAI - tamDanh - X_BE) * Math.sin(p * Math.PI / 2); });
      them(0.01, () => { quai.chop(0.4); cv.voKhongGian({ diem: tamQuai() }); }, 0.3);
      them(0.35, p => { dvBe.x = X_QUAI - tamDanh + (X_BE - X_QUAI + tamDanh) * p; }, 1.9);
      return 2.6;
    },
    demHat: () => boHat.dem(), // số hạt đang sống (kịch bản thử đo tải)
    viTri(ben) {
      const v = viTriDau(ben).project(camera);
      return { x: (v.x + 1) / 2 * vungVe.clientWidth, y: (1 - v.y) / 2 * vungVe.clientHeight };
    }
  };
  return san;
}

window.KC_DT_SAN3D = { tao };
window.dispatchEvent(new Event("dt-san3d"));
// 29/10/2026 - BƯỚC: TC_D05
