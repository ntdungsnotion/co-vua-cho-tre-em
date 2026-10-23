// ================================================================
// FILE: dt/dt_lang_3d.js  (ES module)
// CHỨC NĂNG: MẪU THỬ LÀNG 3D KIỂU ĐẾ CHẾ của Đấu Trường Tri Thức.
//            Vẽ thung lũng Đồ đá bằng Three.js + mô hình CC0 (KayKit): mặt đất,
//            suối, cầu, lều, lửa trại, rừng, mỏ đá, ruộng; camera chéo cố định kéo /
//            phóng to; Thủ lĩnh (ngoại hình bé đã chọn ở TC_D01) + nông dân đi lại
//            bằng tìm đường (dt_luoi.js), chọn rồi chạm kiểu Đế Chế; nông dân chặt
//            cây / đào đá, mang về lều -> Gỗ, Đá. Có chế độ đồ họa Nhẹ và đo khung
//            hình / giây để đánh giá (window.__dt3d).
//            Chỉ VẼ + ĐIỀU KHIỂN; lưới và tìm đường ở dt_luoi.js (chạy node).
// BƯỚC: TC_D01C (mẫu thử, chưa nối vào trang game chính)
// NGÀY: 23/10/2026
// PHỤ THUỘC: thu_vien/three (r170, MIT), dt/dt_luoi.js, chung/nv_ve.js (bảng màu
//            ngoại hình), dt/mo_hinh/*.glb, dt/du_lieu/lang_thu_3d.json
// ================================================================
import * as THREE from "three";
import { GLTFLoader } from "../thu_vien/three/loaders/GLTFLoader.js";
import { clone as nhanBanXuong } from "../thu_vien/three/utils/SkeletonUtils.js";

const LUOI = window.KC_DT_LUOI, NV = window.KC_NV;
const $ = id => document.getElementById(id);
const t0 = performance.now();

// ----------------------------------------------------------------
// PHẦN 1: CẤU HÌNH
// ----------------------------------------------------------------
const KHOA_DO_HOA = "kc_dt_do_hoa";
let doHoa = "dep";
try { doHoa = localStorage.getItem(KHOA_DO_HOA) || (Math.min(screen.width, screen.height) < 500 && devicePixelRatio > 2.5 ? "nhe" : "dep"); } catch (e) { /* chặn bộ nhớ thì dùng mặc định */ }
const NHE = doHoa === "nhe";
const GOC_NGANG = THREE.MathUtils.degToRad(45), GOC_DUNG = THREE.MathUtils.degToRad(36);
// TỈ LỆ KIỂU ĐẾ CHẾ (người dùng chốt 23/10/2026 "lấy kích thước như game AOE"):
// 1 ô = 1 đơn vị; người cao ~1 ô; cây 1 ô, cao ~2 người; lều 2 x 2 ô; ruộng 3 x 3 ô;
// tảng đá 1 ô. Mọi kích thước mô hình bên dưới suy từ quy ước này.
const TI_NV = 0.46;             // nhân vật KayKit cao ~2,2 -> ~1 đơn vị
const TOC_DI = 1.5, TOC_CHAY = 2.3;
const SUC_MANG = 5;             // nông dân mang tối đa 5 rồi về lều cất
const NHIP_LAM = 1.0;           // giây cho mỗi 1 tài nguyên
const MUC_NUOC = -0.32;
const TAI_NGUYEN = { go: { ten: "Gỗ", bt: "🪵" }, da: { ten: "Đá", bt: "🪨" } };

// ----------------------------------------------------------------
// PHẦN 2: TIỆN ÍCH SỐ (nhiễu, ngẫu nhiên có hạt giống)
// ----------------------------------------------------------------
function bam(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function nhieu(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = bam(xi, yi), b = bam(xi + 1, yi), c = bam(xi, yi + 1), d = bam(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function taoNgauNhien(hat) { let a = hat >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const mem = (a, b, x) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// ----------------------------------------------------------------
// PHẦN 3: TẢI DỮ LIỆU + MÔ HÌNH
// ----------------------------------------------------------------
let soByte = 0;
const thanhTai = $("d3Tai"), chuTai = $("d3TaiChu");
const tienTai = {};
function baoTai(ten, da, tong) {
  tienTai[ten] = [da, tong || da];
  let a = 0, b = 0; for (const k in tienTai) { a += tienTai[k][0]; b += tienTai[k][1]; }
  chuTai.textContent = "Đang dựng thung lũng… " + Math.round(100 * a / Math.max(b, 1)) + "%";
}
const taiGlb = (url) => new Promise((ok, loi) => new GLTFLoader().load(url, g => { ok(g); }, e => { if (e.total) baoTai(url, e.loaded, e.total); if (e.loaded) tienTai[url] = [e.loaded, e.total || e.loaded]; }, loi));

const [banDo, glbLang, glbNv] = await Promise.all([
  fetch("dt/du_lieu/lang_thu_3d.json", { cache: "no-cache" }).then(r => r.json()),
  taiGlb("dt/mo_hinh/lang.glb"),
  taiGlb("dt/mo_hinh/nhan_vat.glb")
]).catch(e => { chuTai.textContent = "Chưa tải được thung lũng. Con kiểm tra mạng rồi tải lại trang nhé!"; throw e; });
for (const k in tienTai) soByte += tienTai[k][1];

const W = banDo.rong, H = banDo.cao;
const ngauNhien = taoNgauNhien(banDo.hatGiong);

// ----------------------------------------------------------------
// PHẦN 4: CẢNH, CAMERA, ÁNH SÁNG
// ----------------------------------------------------------------
const vungVe = $("d3Canh");
const renderer = new THREE.WebGLRenderer({ antialias: !NHE, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, NHE ? 1 : 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = !NHE;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
vungVe.appendChild(renderer.domElement);

const canh = new THREE.Scene();
canh.background = new THREE.Color("#a9d8ee");
canh.fog = new THREE.Fog("#a9d8ee", 75, 125);

const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 1, 220);
const dichCam = new THREE.Vector3(W / 2, 0, H / 2 + 2);
const huongCam = new THREE.Vector3(Math.cos(GOC_NGANG) * Math.cos(GOC_DUNG), Math.sin(GOC_DUNG), Math.sin(GOC_NGANG) * Math.cos(GOC_DUNG));
let caoNhin = 16;
function datCamera() {
  dichCam.x = THREE.MathUtils.clamp(dichCam.x, 3, W - 3);
  dichCam.z = THREE.MathUtils.clamp(dichCam.z, 3, H - 3);
  camera.position.copy(dichCam).addScaledVector(huongCam, 80);
  camera.lookAt(dichCam);
  nang.position.copy(dichCam).add(new THREE.Vector3(-14, 26, 10));
  nang.target.position.copy(dichCam);
}
function coKhung() {
  const w = vungVe.clientWidth, h = vungVe.clientHeight;
  renderer.setSize(w, h);
  caoNhin = w < h ? THREE.MathUtils.clamp(8 * h / w, 11, 18) : 12;
  const a = w / h;
  camera.left = -caoNhin * a / 2; camera.right = caoNhin * a / 2; camera.top = caoNhin / 2; camera.bottom = -caoNhin / 2;
  camera.updateProjectionMatrix();
}

canh.add(new THREE.HemisphereLight("#dff2ff", "#6d7a3a", 1.35));
const nang = new THREE.DirectionalLight("#fff1d6", 2.4);
nang.castShadow = !NHE;
nang.shadow.mapSize.set(2048, 2048);
Object.assign(nang.shadow.camera, { left: -24, right: 24, top: 24, bottom: -24, near: 1, far: 80 });
nang.shadow.bias = -0.0006; nang.shadow.normalBias = 0.03;
canh.add(nang, nang.target);

// ----------------------------------------------------------------
// PHẦN 5: ĐỊA HÌNH + SUỐI + LƯỚI
// ----------------------------------------------------------------
const suoi = banDo.suoi.diem.map(([x, z]) => new THREE.Vector2(x, z));
function kcSuoi(x, z) {
  let m = Infinity;
  for (let i = 0; i < suoi.length - 1; i++) {
    const a = suoi[i], b = suoi[i + 1], abx = b.x - a.x, abz = b.y - a.y;
    const t = THREE.MathUtils.clamp(((x - a.x) * abx + (z - a.y) * abz) / (abx * abx + abz * abz), 0, 1);
    m = Math.min(m, Math.hypot(x - a.x - abx * t, z - a.y - abz * t));
  }
  return m;
}
const nuaSuoi = banDo.suoi.rong / 2;
const phang = [{ x: banDo.leu.x, z: banDo.leu.z, r: 4 }, ...banDo.ruong.map(r => ({ x: r.x, z: r.z, r: Math.max(r.rong, r.dai) * 0.75 + 0.8 }))];
function doCao(x, z) {
  let h = 0.12 + (nhieu(x * 0.13, z * 0.13) - 0.5) * 0.55 + (nhieu(x * 0.6 + 40, z * 0.6) - 0.5) * 0.12;
  for (const p of phang) h = THREE.MathUtils.lerp(h, 0.1, 1 - mem(p.r * 0.6, p.r, Math.hypot(x - p.x, z - p.z)));
  // Vách thung lũng chỉ dựng ở hai mép XA camera (x < 0, z < 0); hai mép gần để phẳng,
  // nếu không đồi sẽ che mất làng
  const ngoai = Math.max(0, 1.5 - x, 1.5 - z);
  if (ngoai > 0) h += ngoai * ngoai * 0.015 + ngoai * (0.1 + nhieu(x * 0.18, z * 0.18) * 0.3);
  const d = kcSuoi(x, z);
  const lom = 1 - mem(nuaSuoi - 0.3, nuaSuoi + 1.3, d);
  return THREE.MathUtils.lerp(h, -0.8, lom);
}

const MAU = { co1: new THREE.Color("#79ad45"), co2: new THREE.Color("#5c9536"), co3: new THREE.Color("#a3c95c"), dat: new THREE.Color("#b48c58"),
  cat: new THREE.Color("#d2bf8a"), bun: new THREE.Color("#7f6d48"), da: new THREE.Color("#9d9a88") };
const moDa = banDo.moDa[0];
function mauDat(x, z, h, mau) {
  const n = nhieu(x * 0.22 + 7, z * 0.22), n2 = nhieu(x * 0.9, z * 0.9 + 11);
  mau.copy(MAU.co2).lerp(MAU.co1, mem(0.25, 0.65, n)).lerp(MAU.co3, mem(0.62, 0.9, n2) * 0.6);
  const dl = Math.hypot(x - banDo.leu.x, z - banDo.leu.z);
  mau.lerp(MAU.dat, (1 - mem(1.8, 3.8, dl + (n2 - 0.5) * 1.2)) * 0.85);
  const dm = Math.hypot(x - moDa.x, z - moDa.z);
  mau.lerp(MAU.da, (1 - mem(moDa.banKinh, moDa.banKinh + 2.2, dm + (n2 - 0.5) * 1.4)) * 0.75);
  const ds = kcSuoi(x, z);
  mau.lerp(MAU.cat, 1 - mem(nuaSuoi + 0.2, nuaSuoi + 1.4, ds + (n - 0.5)));
  if (h < MUC_NUOC + 0.05) mau.lerp(MAU.bun, 0.8);
  if (h > 2.5) mau.lerp(MAU.co2, 0.5).lerp(MAU.da, mem(4, 9, h + (n - 0.5) * 3) * 0.7); // vách đồi: cỏ sẫm rồi đá
  return mau;
}
let matDat;
{
  const PAD = 26, SO = (W + PAD * 2);
  const hinh = new THREE.PlaneGeometry(W + PAD * 2, H + PAD * 2, SO, SO);
  hinh.rotateX(-Math.PI / 2); hinh.translate(W / 2, 0, H / 2);
  const vt = hinh.attributes.position, mau = new Float32Array(vt.count * 3), c = new THREE.Color();
  for (let i = 0; i < vt.count; i++) {
    const x = vt.getX(i), z = vt.getZ(i), h = doCao(x, z);
    vt.setY(i, h); mauDat(x, z, h, c).toArray(mau, i * 3);
  }
  hinh.setAttribute("color", new THREE.BufferAttribute(mau, 3));
  hinh.computeVertexNormals();
  matDat = new THREE.Mesh(hinh, new THREE.MeshLambertMaterial({ vertexColors: true }));
  matDat.receiveShadow = true;
  canh.add(matDat);
}
// Nước: một mặt phẳng ở mực nước, địa hình che chỗ khô; vân sóng là ảnh vẽ bằng canvas, trôi chậm
const anhSong = (() => {
  const cv = document.createElement("canvas"); cv.width = cv.height = 128; const g = cv.getContext("2d");
  g.fillStyle = "#4aa6dc"; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 70; i++) {
    const x = bam(i, 1) * 128, y = bam(i, 2) * 128, r = 6 + bam(i, 3) * 14;
    g.strokeStyle = `rgba(255,255,255,${0.12 + bam(i, 4) * 0.2})`; g.lineWidth = 1.4;
    for (const dx of [-128, 0, 128]) for (const dy of [-128, 0, 128]) { g.beginPath(); g.ellipse(x + dx, y + dy, r, r * 0.35, 0, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
  }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(W / 5, H / 5); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
const nuoc = new THREE.Mesh(new THREE.PlaneGeometry(W + 52, H + 52).rotateX(-Math.PI / 2).translate(W / 2, MUC_NUOC, H / 2),
  new THREE.MeshStandardMaterial({ map: anhSong, transparent: true, opacity: 0.86, roughness: 0.15, metalness: 0.05 }));
nuoc.receiveShadow = !NHE;
canh.add(nuoc);

const luoi = LUOI.taoLuoi(W, H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (kcSuoi(x + 0.5, y + 0.5) < nuaSuoi + 0.25) LUOI.datChan(luoi, x, y, true);

// ----------------------------------------------------------------
// PHẦN 6: MÔ HÌNH LÀNG (đặt nhiều bản bằng InstancedMesh: 1 lệnh vẽ / loại)
// ----------------------------------------------------------------
const mauGoc = {};
glbLang.scene.traverse(o => { if (o.isMesh) mauGoc[o.parent.name] = o; });
const vatLieuLang = Object.values(mauGoc)[0].material;
vatLieuLang.side = THREE.FrontSide;

class BoNhieuBan {
  constructor(ten, toiDa, bong = true) {
    const m = mauGoc[ten]; if (!m) throw new Error("Thiếu mô hình " + ten);
    this.mesh = new THREE.InstancedMesh(m.geometry, vatLieuLang, toiDa);
    this.mesh.count = 0; this.mesh.castShadow = bong && !NHE; this.mesh.receiveShadow = !NHE;
    this.mesh.name = ten; this.ma = []; this.chu = [];
    canh.add(this.mesh);
  }
  them(x, z, ti, gocDo, chu, y) {
    const i = this.mesh.count++;
    const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y ?? doCao(x, z), z),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(gocDo || 0)), new THREE.Vector3(ti, ti, ti));
    this.ma[i] = m; this.chu[i] = chu || null;
    this.mesh.setMatrixAt(i, m); this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.computeBoundingSphere();
    return i;
  }
  an(i) { this.mesh.setMatrixAt(i, new THREE.Matrix4().makeScale(0, 0, 0)); this.mesh.instanceMatrix.needsUpdate = true; }
  rung(i, t) { // cây rung khi bị chặt
    const m = this.ma[i].clone(), q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 1).normalize(), Math.sin(t * 40) * 0.05 * Math.max(0, 1 - t * 3));
    m.multiply(new THREE.Matrix4().makeRotationFromQuaternion(q));
    this.mesh.setMatrixAt(i, m); this.mesh.instanceMatrix.needsUpdate = true;
  }
}

// Lều, lửa trại, ruộng, trang trí
// Lều Đồ đá: dựng bằng hình khối (bộ KayKit chỉ có sạp chợ thời trung cổ): lều da hình
// nón, cọc gỗ ló trên đỉnh, cửa tối, dải hoa văn
{
  const leu = new THREE.Group(), R = banDo.leu.ti * 0.32, C = banDo.leu.ti * 0.62;
  const cv = document.createElement("canvas"); cv.width = 256; cv.height = 64; const g = cv.getContext("2d");
  g.fillStyle = "#c9a476"; g.fillRect(0, 0, 256, 64);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(110,70,35,${0.08 + bam(i, 3) * 0.12})`; g.fillRect(bam(i, 1) * 256, bam(i, 2) * 64, 18, 3); }
  g.fillStyle = "#9b4a2c"; g.fillRect(0, 40, 256, 6); for (let i = 0; i < 16; i++) { g.beginPath(); g.moveTo(i * 16, 40); g.lineTo(i * 16 + 8, 32); g.lineTo(i * 16 + 16, 40); g.fill(); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.repeat.x = 3;
  const vai = new THREE.Mesh(new THREE.ConeGeometry(R, C, 9, 1, true), new THREE.MeshLambertMaterial({ map: t, side: THREE.DoubleSide }));
  vai.position.y = C / 2; vai.castShadow = vai.receiveShadow = !NHE; leu.add(vai);
  const vlGo = new THREE.MeshLambertMaterial({ color: "#6b4524" });
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2, coc = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, C * 1.25, 5), vlGo);
    coc.position.set(Math.cos(a) * R * 0.5, C * 0.62, Math.sin(a) * R * 0.5); coc.lookAt(0, C * 1.6, 0); coc.rotateX(Math.PI / 2);
    coc.castShadow = !NHE; leu.add(coc);
  }
  const cua = new THREE.Mesh(new THREE.CircleGeometry(R * 0.42, 3), new THREE.MeshBasicMaterial({ color: "#2a1a10" }));
  cua.position.set(0, R * 0.36, R * 0.72); cua.rotation.set(-0.42, 0, Math.PI / 2); leu.add(cua);
  leu.position.set(banDo.leu.x, doCao(banDo.leu.x, banDo.leu.z) - 0.05, banDo.leu.z);
  leu.rotation.y = Math.atan2(huongCam.x, huongCam.z) + 0.35; // cửa quay về phía camera
  canh.add(leu);
}
for (let y = -1; y < 1; y++) for (let x = -1; x < 1; x++) LUOI.datChan(luoi, Math.floor(banDo.leu.x) + x, Math.floor(banDo.leu.z) + y, true);
const oCatDo = { x: Math.floor(banDo.leu.x), y: Math.floor(banDo.leu.z) + 1 };
// Ruộng: tấm phẳng sát đất, luống cày vẽ bằng canvas ('mam' = có mầm xanh)
for (const r of banDo.ruong) {
  const cv = document.createElement("canvas"); cv.width = 128; cv.height = 128; const g = cv.getContext("2d");
  g.fillStyle = "#8a6038"; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 8; i++) { g.fillStyle = "#6e4a2a"; g.fillRect(0, i * 16 + 9, 128, 5); g.fillStyle = "#a57a4c"; g.fillRect(0, i * 16 + 3, 128, 3); }
  if (r.mam) for (let i = 0; i < 90; i++) { g.fillStyle = bam(i, 9) < 0.5 ? "#7cc24a" : "#5ea83a"; g.beginPath(); g.ellipse(bam(i, 5) * 128, Math.floor(bam(i, 6) * 8) * 16 + 4, 3, 2, 0, 0, 7); g.fill(); }
  g.strokeStyle = "#5b3d22"; g.lineWidth = 6; g.strokeRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  const tam = new THREE.Mesh(new THREE.PlaneGeometry(r.rong, r.dai).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: t }));
  tam.position.set(r.x, 0.13, r.z); tam.rotation.y = THREE.MathUtils.degToRad(r.goc || 0); tam.receiveShadow = !NHE;
  canh.add(tam);
}
const boTrangTri = {};
for (const t of banDo.trangTri) {
  if (!boTrangTri[t.mo]) boTrangTri[t.mo] = new BoNhieuBan(t.mo, 8);
  const y = t.mo.startsWith("water") ? MUC_NUOC : undefined;
  boTrangTri[t.mo].them(t.x, t.z, t.ti, t.goc, null, y);
  if (!t.mo.startsWith("water")) LUOI.datChan(luoi, Math.floor(t.x), Math.floor(t.z), true);
}
// Cầu gỗ: xoay theo hướng ngang dòng suối, ô dưới cầu đi được
const deckCau = [];
for (const c of banDo.cau) {
  let gan = 0, kc = Infinity;
  for (let i = 0; i < suoi.length - 1; i++) { const m = suoi[i].clone().add(suoi[i + 1]).multiplyScalar(0.5); const d = Math.hypot(m.x - c.x, m.y - c.z); if (d < kc) { kc = d; gan = i; } }
  const dong = suoi[gan + 1].clone().sub(suoi[gan]).normalize();
  const goc = Math.atan2(dong.x, dong.y); // mô hình cầu nằm dọc trục z -> quay để ngang dòng
  const bc = new BoNhieuBan("building_bridge_A", 1);
  bc.them(c.x, c.z, 2.2, THREE.MathUtils.radToDeg(goc) + 90, null, 0.02);
  const ngang = new THREE.Vector2(dong.y, -dong.x);
  deckCau.push({ x: c.x, z: c.z, ngang, doc: dong });
  for (let s = -3; s <= 3; s += 0.25) for (const w of [-0.6, 0, 0.6]) {
    const px = c.x + ngang.x * s + dong.x * w, pz = c.z + ngang.y * s + dong.y * w;
    LUOI.datChan(luoi, Math.floor(px), Math.floor(pz), false);
  }
}
function doCaoDi(x, z) { // chiều cao chân nhân vật: trên cầu thì đứng trên mặt cầu
  const h = doCao(x, z);
  for (const c of deckCau) {
    const dx = x - c.x, dz = z - c.z, s = dx * c.ngang.x + dz * c.ngang.y, w = dx * c.doc.x + dz * c.doc.y;
    if (Math.abs(s) < 2.9 && Math.abs(w) < 0.9) return Math.max(h, 0.3 - Math.max(0, Math.abs(s) - 1.6) * 0.15);
  }
  return h;
}

// Lửa trại: củi + ngọn lửa phát sáng + đèn chập chờn (đồ họa Nhẹ bỏ đèn)
const lua = new THREE.Group();
{
  const cui = mauGoc.resource_lumber;
  for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(cui.geometry, vatLieuLang); m.scale.setScalar(0.9); m.rotation.y = i * Math.PI / 3; m.castShadow = !NHE; lua.add(m); }
  const ngon = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.6, 7).translate(0, 0.3, 0), new THREE.MeshBasicMaterial({ color: "#ffb03a" }));
  const loi = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.36, 7).translate(0, 0.18, 0), new THREE.MeshBasicMaterial({ color: "#fff2a8" }));
  ngon.position.y = loi.position.y = 0.1; lua.add(ngon, loi); lua.userData = { ngon, loi };
  if (!NHE) { const den = new THREE.PointLight("#ff9a3a", 4, 6, 1.6); den.position.y = 0.9; lua.add(den); lua.userData.den = den; }
  lua.position.set(banDo.lua.x, doCao(banDo.lua.x, banDo.lua.z), banDo.lua.z);
  canh.add(lua);
  LUOI.datChan(luoi, Math.floor(banDo.lua.x), Math.floor(banDo.lua.z), true);
}

// Tài nguyên: cây (Gỗ) và đá (Đá). Mỗi cây / tảng là một "nguồn" có trữ lượng.
const nguon = [];
const loaiCay = ["tree_single_A", "tree_single_B"];
const boCay = Object.fromEntries(loaiCay.map(t => [t, new BoNhieuBan(t, 320)]));
const boGoc = new BoNhieuBan("tree_single_A_cut", 320);
const boDa = { rock_single_A: new BoNhieuBan("rock_single_A", 30), rock_single_C: new BoNhieuBan("rock_single_C", 30), rock_single_E: new BoNhieuBan("rock_single_E", 30) };
function oTrongCho(x, z, r) {
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (!LUOI.diDuoc(luoi, Math.floor(x) + dx, Math.floor(z) + dy)) return false;
  return true;
}
// rungDay = true: cây trong rừng đứng sát nhau từng ô (như Đế Chế, chặt dần từ ngoài vào)
function trongCay(x, z, rungDay) {
  const ox = Math.floor(x), oz = Math.floor(z);
  if (ox < 1 || oz < 1 || ox >= W - 1 || oz >= H - 1 || !oTrongCho(x, z, rungDay ? 0 : 1)) return false;
  if (Math.hypot(ox + 0.5 - banDo.leu.x, oz + 0.5 - banDo.leu.z) < 4) return false;
  const loai = loaiCay[ngauNhien() < 0.6 ? 0 : 1], bo = boCay[loai];
  const n = { loai: "go", con: 8, x: ox + 0.5, z: oz + 0.5, o: { x: ox, y: oz }, bo, rungDen: 0 };
  n.i = bo.them(n.x + (ngauNhien() - 0.5) * 0.2, n.z + (ngauNhien() - 0.5) * 0.2, 1.7 + ngauNhien() * 0.5, ngauNhien() * 360, n);
  LUOI.datChan(luoi, ox, oz, true);
  nguon.push(n);
  return true;
}
for (const r of banDo.rung) {
  let dat = 0;
  for (let thu = 0; thu < r.soCay * 12 && dat < r.soCay; thu++) {
    const a = ngauNhien() * Math.PI * 2, d = Math.sqrt(ngauNhien()) * r.banKinh;
    if (trongCay(r.x + Math.cos(a) * d, r.z + Math.sin(a) * d, true)) dat++;
  }
}
for (let i = 0, thu = 0; i < banDo.cayLe && thu < 400; thu++) {
  const x = 3 + ngauNhien() * (W - 6), z = 3 + ngauNhien() * (H - 6);
  if (Math.hypot(x - banDo.leu.x, z - banDo.leu.z) > 7 && trongCay(x, z)) i++;
}
{
  const ten = Object.keys(boDa);
  let dat = 0;
  for (let thu = 0; thu < 200 && dat < moDa.soDa; thu++) {
    const a = ngauNhien() * Math.PI * 2, d = Math.sqrt(ngauNhien()) * moDa.banKinh;
    const x = moDa.x + Math.cos(a) * d, z = moDa.z + Math.sin(a) * d, ox = Math.floor(x), oz = Math.floor(z);
    if (!oTrongCho(x, z, 0)) continue;
    const bo = boDa[ten[dat % ten.length]];
    const n = { loai: "da", con: 12, x: ox + 0.5, z: oz + 0.5, o: { x: ox, y: oz }, bo, rungDen: 0 };
    n.i = bo.them(n.x, n.z, 4.2 + ngauNhien() * 1.2, ngauNhien() * 360, n);
    LUOI.datChan(luoi, ox, oz, true); nguon.push(n); dat++;
  }
}
// Viền ngoài lưới (không đi tới được): rừng thông phủ vách đồi ở hai mép xa; hai mép gần
// chỉ có cây lẻ thấp để không che làng
{
  const boVien = { cao: new BoNhieuBan("tree_single_A", 400), cao2: new BoNhieuBan("tree_single_B", 400) };
  const dat = (x, z, ti) => (ngauNhien() < 0.55 ? boVien.cao : boVien.cao2).them(x, z, ti, ngauNhien() * 360);
  for (let i = 0; i < banDo.vien.soCayXa; i++) {
    const t = ngauNhien() * (W + 20) - 14, lech = 0.5 + Math.pow(ngauNhien(), 1.6) * 20;
    if (ngauNhien() < 0.5) dat(t, -lech, 1.8 + ngauNhien() * 0.6); else dat(-lech, t, 1.8 + ngauNhien() * 0.6);
  }
  for (let i = 0; i < banDo.vien.soCayGan; i++) {
    const t = ngauNhien() * (W + 8), lech = 1 + ngauNhien() * 6;
    if (ngauNhien() < 0.5) dat(t, H + lech, 1.6 + ngauNhien() * 0.4); else dat(W + lech, t, 1.6 + ngauNhien() * 0.4);
  }
}

// ----------------------------------------------------------------
// PHẦN 7: NHÂN VẬT (KayKit, đổi màu da / tóc / áo theo hồ sơ chung của bé)
// ----------------------------------------------------------------
// Ảnh tô nhân vật là bảng 8 x 4 ô màu; đã dò: ô (hàng 0, cột 0) = da, (0,1) = tóc / râu,
// (1,0) và (1,1) = áo. Đổi màu: giữ độ sáng tối từng điểm, thay sắc màu.
const anhGocNv = (() => { let a; glbNv.scene.traverse(o => { if (o.isMesh && !a) a = o.material.map.image; }); return a; })();
const boNhoAnh = new Map();
function anhDaDoiMau(da, toc, ao) {
  const khoa = da + toc + ao;
  if (boNhoAnh.has(khoa)) return boNhoAnh.get(khoa);
  const cv = document.createElement("canvas"); cv.width = anhGocNv.width; cv.height = anhGocNv.height;
  const g = cv.getContext("2d"); g.drawImage(anhGocNv, 0, 0);
  const cw = cv.width / 8, ch = cv.height / 4;
  const doi = (hang, cot, hex) => {
    const anh = g.getImageData(cot * cw, hang * ch, cw, ch), d = anh.data, m = new THREE.Color(hex);
    let tb = 0; for (let i = 0; i < d.length; i += 4) tb += d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11; tb /= d.length / 4;
    const s = m.clone().convertLinearToSRGB(); // Color giữ màu tuyến tính, ảnh canvas là sRGB
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
const PHU_KIEN_VAI_TRO = { // mesh hiện cho từng vai trò (còn lại ẩn)
  thu_linh: ["Barbarian_Hat", "Barbarian_Cape"],
  nong_dan: ["1H_Axe"]
};
const MAU_NONG_DAN = { nhan: "#a87a4a", quy: "#5c5470", tien: "#7aa35a" };
const MAU_LOAI = { quy: { sung: "#e9dcf5", sungToi: "#4b2f6b" }, tien: { la: "#5fb04a" } };

function phuKienChungLoai(xuongDau, hoSo, laThuLinh, mauDa, mauToc) {
  // Đồ phụ vẽ bằng hình khối nhỏ, gắn vào xương đầu: sừng (Quỷ), tai nhọn + vòng lá (Tiên), đuôi tóc (bé gái)
  const nhom = new THREE.Group();
  const vl = c => new THREE.MeshLambertMaterial({ color: c });
  if (hoSo.chungLoai === "quy") {
    for (const s of [-1, 1]) {
      const sung = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.42, 6), vl(MAU_LOAI.quy.sung));
      sung.position.set(0.3 * s, 2.2, 0.08); sung.rotation.z = -0.5 * s; nhom.add(sung);
    }
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
  if (!laThuLinh) { // nông dân đội nón lá (như bản vẽ 2D TC_D01)
    const non = new THREE.Mesh(new THREE.ConeGeometry(0.78, 0.42, 14), vl("#e6cf8a"));
    non.position.set(0, 2.2, 0); nhom.add(non);
  }
  if (hoSo.gioi === "nu") {
    const duoi = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6).scale(0.9, 1.5, 0.9), vl(mauToc));
    duoi.position.set(0, 1.55, -0.52); nhom.add(duoi);
  }
  // Toạ độ trên viết theo khung mô hình lúc đứng thẳng -> đổi sang khung xương đầu
  xuongDau.updateWorldMatrix(true, false);
  const nghich = xuongDau.matrixWorld.clone().invert();
  for (const m of [...nhom.children]) { m.applyMatrix4(nghich); m.castShadow = !NHE; xuongDau.add(m); }
}

const donVi = [];
let dangChon = null;
const hinhChon = new THREE.Mesh(new THREE.RingGeometry(0.36, 0.47, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#ffd24a", transparent: true, opacity: 0.95, depthWrite: false }));
hinhChon.visible = false; canh.add(hinhChon);
const vachDich = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.32, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#7dff9a", transparent: true, depthWrite: false }));
vachDich.visible = false; canh.add(vachDich);
const vatLieuTrung = new THREE.MeshBasicMaterial({ visible: false });

function taoNhanVat(vaiTro, hoSo, x, z, ten) {
  const goc = nhanBanXuong(glbNv.scene);
  const laThuLinh = vaiTro === "thu_linh";
  const mauDa = NV.BANG.da[hoSo.mauDa], mauToc = NV.BANG.toc[hoSo.mauToc];
  const mauAo = laThuLinh ? NV.BANG.ao[hoSo.mauAo] : MAU_NONG_DAN[hoSo.chungLoai];
  const anh = anhDaDoiMau(mauDa, mauToc, mauAo);
  let vlRieng = null, xuongDau = null;
  const hien = PHU_KIEN_VAI_TRO[vaiTro];
  goc.traverse(o => {
    if (o.isBone && o.name === "head") xuongDau = o;
    if (!o.isMesh) return;
    const laThan = o.isSkinnedMesh;
    if (!laThan) o.visible = hien.includes(o.name) && !(o.name === "Barbarian_Hat" && hoSo.chungLoai !== "nhan");
    if (!vlRieng) { vlRieng = o.material.clone(); vlRieng.map = anh; }
    o.material = vlRieng; o.castShadow = !NHE; o.frustumCulled = false;
  });
  phuKienChungLoai(xuongDau, hoSo, laThuLinh, mauDa, mauToc);
  goc.scale.setScalar(TI_NV * (laThuLinh ? 1.12 : 1));
  const vo = new THREE.Group(); vo.add(goc);
  const trung = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.5, 8).translate(0, 0.75, 0), vatLieuTrung);
  vo.add(trung);
  vo.position.set(x, doCaoDi(x, z), z);
  canh.add(vo);
  const tron = new THREE.AnimationMixer(goc), dt = {};
  for (const c of glbNv.animations) dt[c.name] = tron.clipAction(c);
  const dv = { vaiTro, ten, vo, goc, trung, tron, dt, dongTac: null, huong: 0, duong: [], viec: null, mang: { loai: null, so: 0 }, henLam: 0, nghiNgoi: false,
    hienVuKhi(co) { goc.traverse(o => { if (o.name === "1H_Axe") o.visible = co || hien.includes("1H_Axe"); }); } };
  trung.userData.donVi = dv;
  datDongTac(dv, "Idle");
  if (laThuLinh) gangTenThuLinh(dv);
  donVi.push(dv);
  return dv;
}
function datDongTac(dv, ten, mot) {
  if (dv.dongTac === ten) return;
  const moi = dv.dt[ten], cu = dv.dt[dv.dongTac];
  moi.reset(); moi.setLoop(mot ? THREE.LoopOnce : THREE.LoopRepeat); moi.clampWhenFinished = !!mot; moi.play();
  if (cu) moi.crossFadeFrom(cu, 0.2, false);
  dv.dongTac = ten;
}
function gangTenThuLinh(dv) {
  const cv = document.createElement("canvas"); cv.width = 256; cv.height = 64; const g = cv.getContext("2d");
  g.font = "bold 30px 'Baloo 2', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  const chu = "👑 " + dv.ten, w = Math.min(250, g.measureText(chu).width + 26);
  g.fillStyle = "rgba(20,32,74,.78)"; g.beginPath(); g.roundRect(128 - w / 2, 8, w, 48, 22); g.fill();
  g.fillStyle = "#ffd56b"; g.fillText(chu, 128, 33);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  const nhan = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false }));
  nhan.scale.set(2.0, 0.5, 1); nhan.position.y = 1.7; nhan.renderOrder = 5;
  dv.vo.add(nhan);
}

// Hồ sơ ngoại hình chung của bé (TC_D01): đọc hồ sơ đầu tiên tìm thấy trên máy này
function docHoSoBe() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("kc_nhan_vat_")) {
        const ten = k.slice("kc_nhan_vat_".length);
        const td = JSON.parse(localStorage.getItem("kc_dt_tien_do_" + ten) || "null");
        return { hoSo: NV.chuanHoa(JSON.parse(localStorage.getItem(k))), tenThuLinh: td && td.tenThuLinh, tenVuongQuoc: td && td.tenVuongQuoc };
      }
    }
  } catch (e) { /* bộ nhớ bị chặn: dùng hình mẫu */ }
  return { hoSo: NV.chuanHoa({ chungLoai: "nhan", gioi: "nam", mauDa: 1, mauToc: 1, mauAo: 3 }), tenThuLinh: null, tenVuongQuoc: null };
}
const be = docHoSoBe();
let thuLinh = taoNhanVat("thu_linh", be.hoSo, banDo.batDau.thuLinh.x, banDo.batDau.thuLinh.z, be.tenThuLinh || "Thủ lĩnh");
let soNongDan = 0;
function themNongDan(x, z) {
  const i = soNongDan++;
  const o = LUOI.oTrongGan(luoi, Math.floor(x), Math.floor(z));
  const dv = taoNhanVat("nong_dan", NV.hoSoNongDan(be.hoSo.chungLoai, i), o.x + 0.5, o.y + 0.5, "Nông dân " + (i + 1));
  return dv;
}
for (const p of banDo.batDau.nongDan) themNongDan(p.x, p.z);
$("d3TenVuong").textContent = be.tenVuongQuoc ? "Vương quốc " + be.tenVuongQuoc : "Thung Lũng Khởi Đầu";

// ----------------------------------------------------------------
// PHẦN 8: ĐI LẠI + LÀM VIỆC (chặt cây, đào đá, mang về lều)
// ----------------------------------------------------------------
const kho = { go: 0, da: 0 };
function diToi(dv, o) {
  const tu = LUOI.oCuaDiem(dv.vo.position.x, dv.vo.position.z);
  const d = LUOI.timDuong(luoi, tu, o);
  if (!d) return false;
  dv.duong = (LUOI.lamMuot(luoi, tu, d) || []).map(c => new THREE.Vector2(c.x + 0.5, c.y + 0.5));
  return true;
}
// Nguồn có ô trống sát bên (đứng chặt được). Cây giữa rừng rậm chưa chặt được, như Đế Chế.
function coKe(n) {
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && LUOI.diDuoc(luoi, n.o.x + dx, n.o.y + dy)) return true;
  return false;
}
function giaoViec(dv, n) {
  if (!coKe(n)) n = nguonGanNhat(n.loai, n.x, n.z, 8) || n; // chạm cây giữa rừng -> chặt cây ngoài bìa gần đó
  dv.viec = n; dv.nghiNgoi = false;
  if (dv.mang.so && dv.mang.loai !== n.loai) dv.mang = { loai: null, so: 0 }; // đổi việc thì bỏ đồ đang mang
  diToi(dv, n.o);
  dv.trangThai = "toi_viec";
}
function nguonGanNhat(loai, x, z, xaNhat) {
  let tot = null, kc = xaNhat || 14;
  for (const n of nguon) if (n.loai === loai && n.con > 0 && coKe(n)) { const d = Math.hypot(n.x - x, n.z - z); if (d < kc) { kc = d; tot = n; } }
  return tot;
}
function cachNguon(dv, n) { return Math.hypot(dv.vo.position.x - n.x, dv.vo.position.z - n.z); }

const chuNoi = $("d3ChuNoi");
function noiChu(vt, chu) {
  const el = document.createElement("div"); el.className = "d3Noi"; el.textContent = chu;
  el.userData = { vt: vt.clone().setY(vt.y + 1.6), t: 0 };
  chuNoi.appendChild(el); dsNoi.push(el);
}
const dsNoi = [];
function capNhatKho() { $("d3Go").textContent = kho.go; $("d3Da").textContent = kho.da; }

function capNhatDonVi(dv, dt) {
  const p = dv.vo.position;
  // 0) đang diễn động tác trận (nút "Thử động tác trận")
  if (dv.trangThai === "dien") {
    const d = dv.dien, ten = d.ds[d.i];
    if (d.t === 0) { datDongTac(dv, ten, true); dv.huongMuon = Math.atan2(camera.position.x - p.x, camera.position.z - p.z); baoGoiY("⚔️ " + (TEN_DONG_TAC[ten] || ten)); }
    d.t += dt;
    if (d.t >= dv.dt[ten].getClip().duration + 0.25) { d.i++; d.t = 0; }
    if (d.i >= d.ds.length) { dv.trangThai = null; dv.hienVuKhi(false); baoGoiY("Gói động tác trận có " + Object.keys(dv.dt).length + " động tác; trận đấu thật sẽ chọn theo đúng / sai của câu trả lời."); }
  } else
  // 1) đi theo đường
  if (dv.duong.length) {
    const dich = dv.duong[0], dx = dich.x - p.x, dz = dich.y - p.z, d = Math.hypot(dx, dz);
    const conLai = dv.duong.reduce((s, c, i) => s + (i ? c.distanceTo(dv.duong[i - 1]) : d), 0);
    const chay = dv.vaiTro === "thu_linh" && conLai > 7;
    const v = (chay ? TOC_CHAY : TOC_DI) * dt;
    if (d <= v) { p.x = dich.x; p.z = dich.y; dv.duong.shift(); }
    else { p.x += dx / d * v; p.z += dz / d * v; }
    dv.huongMuon = Math.atan2(dx, dz);
    datDongTac(dv, chay ? "Running_A" : "Walking_A");
  } else if (dv.trangThai === "toi_viec" && dv.viec) {
    if (dv.viec.con <= 0) { const n = nguonGanNhat(dv.viec.loai, p.x, p.z); if (n) giaoViec(dv, n); else { dv.viec = null; dv.trangThai = null; dv.nghiNgoi = true; } }
    else if (cachNguon(dv, dv.viec) < 1.6) { dv.trangThai = "lam"; dv.henLam = NHIP_LAM; }
    else if (!diToi(dv, dv.viec.o)) { dv.viec = null; dv.trangThai = null; }
  } else if (dv.trangThai === "lam" && dv.viec) {
    const n = dv.viec;
    dv.huongMuon = Math.atan2(n.x - p.x, n.z - p.z);
    datDongTac(dv, n.loai === "go" ? "1H_Melee_Attack_Chop" : "2H_Melee_Attack_Chop");
    dv.henLam -= dt;
    if (dv.henLam <= 0) {
      dv.henLam += NHIP_LAM;
      if (n.con > 0) {
        n.con--; dv.mang.loai = n.loai; dv.mang.so++; n.rungDen = 0.35;
        if (n.con <= 0) chatDo(n);
      }
      if (dv.mang.so >= SUC_MANG || n.con <= 0) { dv.trangThai = "ve_kho"; diToi(dv, oCatDo); }
    }
  } else if (dv.trangThai === "ve_kho") {
    if (Math.hypot(p.x - (oCatDo.x + 0.5), p.z - (oCatDo.y + 0.5)) < 1.6) {
      const tn = TAI_NGUYEN[dv.mang.loai];
      if (dv.mang.so) { kho[dv.mang.loai] += dv.mang.so; noiChu(p, "+" + dv.mang.so + " " + tn.bt); capNhatKho(); }
      const loai = dv.mang.loai; dv.mang = { loai: null, so: 0 };
      const n = dv.viec && dv.viec.con > 0 ? dv.viec : nguonGanNhat(loai, p.x, p.z, 20);
      if (n) giaoViec(dv, n); else { dv.trangThai = null; dv.viec = null; dv.nghiNgoi = true; }
    } else diToi(dv, oCatDo);
  } else {
    datDongTac(dv, "Idle");
  }
  // 2) quay mặt mượt
  if (dv.huongMuon != null) {
    let d = dv.huongMuon - dv.huong; d = Math.atan2(Math.sin(d), Math.cos(d));
    dv.huong += d * Math.min(1, dt * 12);
    dv.goc.rotation.y = dv.huong;
  }
  p.y = doCaoDi(p.x, p.z);
  dv.tron.update(dt);
}
function chatDo(n) {
  n.bo.an(n.i);
  if (n.loai === "go") boGoc.them(n.x, n.z, 1.8, ngauNhien() * 360);
  LUOI.datChan(luoi, n.o.x, n.o.y, false);
}

// ----------------------------------------------------------------
// PHẦN 9: CHẠM / KÉO / PHÓNG TO (chuột + ngón tay)
// ----------------------------------------------------------------
const tia = new THREE.Raycaster(), diemChuot = new THREE.Vector2();
const ngon = new Map();
let keo = null, chumDau = null;
const canvas = renderer.domElement;
canvas.style.touchAction = "none";
function chieuTia(e) {
  const r = canvas.getBoundingClientRect();
  diemChuot.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  tia.setFromCamera(diemChuot, camera);
}
canvas.addEventListener("pointerdown", e => {
  try { canvas.setPointerCapture(e.pointerId); } catch (loi) { /* sự kiện giả (kịch bản thử) không bắt được */ }
  ngon.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ngon.size === 1) keo = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t: performance.now(), di: false };
  if (ngon.size === 2) { const [a, b] = [...ngon.values()]; chumDau = { d: Math.hypot(a.x - b.x, a.y - b.y), zoom: camera.zoom }; keo = null; }
});
canvas.addEventListener("pointermove", e => {
  if (!ngon.has(e.pointerId)) return;
  ngon.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ngon.size === 2 && chumDau) {
    const [a, b] = [...ngon.values()];
    datZoom(chumDau.zoom * Math.hypot(a.x - b.x, a.y - b.y) / chumDau.d);
  } else if (keo) {
    const dx = e.clientX - keo.x, dy = e.clientY - keo.y;
    if (Math.hypot(e.clientX - keo.x0, e.clientY - keo.y0) > 8) keo.di = true;
    if (keo.di) keoCanh(dx, dy);
    keo.x = e.clientX; keo.y = e.clientY;
  }
});
function thaNgon(e) {
  const k = keo;
  ngon.delete(e.pointerId);
  if (ngon.size < 2) chumDau = null;
  if (k && !k.di && e.type === "pointerup" && performance.now() - k.t < 600) cham(e);
  keo = null;
}
canvas.addEventListener("pointerup", thaNgon);
canvas.addEventListener("pointercancel", thaNgon);
canvas.addEventListener("wheel", e => { e.preventDefault(); datZoom(camera.zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12)); }, { passive: false });
function datZoom(z) { camera.zoom = THREE.MathUtils.clamp(z, 0.55, 2.4); camera.updateProjectionMatrix(); }
const phai = new THREE.Vector3(), truoc = new THREE.Vector3();
function keoCanh(dx, dy) {
  const donVi1px = (camera.top - camera.bottom) / camera.zoom / canvas.clientHeight;
  phai.setFromMatrixColumn(camera.matrixWorld, 0).setY(0).normalize();
  truoc.set(-huongCam.x, 0, -huongCam.z).normalize();
  dichCam.addScaledVector(phai, -dx * donVi1px).addScaledVector(truoc, dy * donVi1px / Math.sin(GOC_DUNG));
  datCamera();
}

const goiY = $("d3GoiY");
function baoGoiY(chu) { goiY.textContent = chu; }
function cham(e) {
  chieuTia(e);
  // 1) chạm nhân vật -> chọn
  const trungDv = tia.intersectObjects(donVi.map(d => d.trung), false)[0];
  if (trungDv) { chon(trungDv.object.userData.donVi); return; }
  // 2) chạm cây / đá
  const dsBo = [...Object.values(boCay), ...Object.values(boDa)].map(b => b.mesh);
  const trungNg = tia.intersectObjects(dsBo, false)[0];
  const n = trungNg ? timNguon(trungNg.object, trungNg.instanceId) : null;
  if (n && n.con > 0) {
    if (dangChon && dangChon.vaiTro === "nong_dan") {
      giaoViec(dangChon, n); dauDich(n.x, n.z);
      baoGoiY(n.loai === "go" ? "🪓 " + dangChon.ten + " đi chặt cây. Gỗ sẽ được mang về lều." : "⛏️ " + dangChon.ten + " đi đào đá.");
      return;
    }
    if (!dangChon) { baoGoiY("Chạm vào nông dân trước, rồi chạm cây để giao việc nhé!"); return; }
  }
  // 3) chạm đất -> đi tới
  const trungDat = tia.intersectObject(matDat, false)[0];
  if (trungDat && dangChon) {
    const o = LUOI.oCuaDiem(trungDat.point.x, trungDat.point.z);
    dangChon.viec = null; dangChon.trangThai = null; dangChon.nghiNgoi = false;
    if (diToi(dangChon, o)) {
      const c = dangChon.duong[dangChon.duong.length - 1];
      if (c) dauDich(c.x, c.y); else dauDich(trungDat.point.x, trungDat.point.z);
      baoGoiY(dangChon.ten + " đang đi.");
    }
    else baoGoiY("Chỗ đó không tới được đâu.");
  } else if (!dangChon) baoGoiY("Chạm vào Thủ lĩnh hoặc nông dân để chọn.");
}
function timNguon(mesh, i) { for (const n of nguon) if (n.bo.mesh === mesh && n.i === i) return n; return null; }
function dauDich(x, z) { vachDich.position.set(x, doCaoDi(x, z) + 0.05, z); vachDich.visible = true; vachDich.userData.t = 0; }
function chon(dv) {
  dangChon = dv;
  hinhChon.visible = true;
  $("d3Chon").textContent = (dv.vaiTro === "thu_linh" ? "👑 " : "🧑‍🌾 ") + dv.ten;
  baoGoiY(dv.vaiTro === "thu_linh" ? "Chạm mặt đất để Thủ lĩnh đi tới đó." : "Chạm vào cây để chặt gỗ, chạm tảng đá để đào đá, hoặc chạm đất để đi.");
}

// ----------------------------------------------------------------
// PHẦN 10: NÚT TRÊN MÀN HÌNH
// ----------------------------------------------------------------
$("d3DoHoa").innerHTML = NHE ? "🪶<span class=\"d3Chu\"> Đồ họa:</span> Nhẹ" : "✨<span class=\"d3Chu\"> Đồ họa:</span> Đẹp";
$("d3DoHoa").addEventListener("click", () => { try { localStorage.setItem(KHOA_DO_HOA, NHE ? "dep" : "nhe"); } catch (e) { /* thôi */ } location.reload(); });
$("d3VeLang").addEventListener("click", () => { dichCam.set(banDo.leu.x, 0, banDo.leu.z + 2); datCamera(); });
$("d3ThemNd").addEventListener("click", () => {
  if (soNongDan >= 40) { baoGoiY("Thử tối đa 40 nông dân thôi."); return; }
  const dv = themNongDan(banDo.leu.x + 1, banDo.leu.z + 2);
  const n = nguonGanNhat(soNongDan % 3 ? "go" : "da", dv.vo.position.x, dv.vo.position.z, 60);
  if (n) giaoViec(dv, n);
  $("d3SoNd").textContent = soNongDan;
});
$("d3DoiHinh").addEventListener("click", () => {
  // Thử ngoại hình: đổi lần lượt chủng loại / giới / màu (chỉ trong mẫu thử, không lưu)
  const h = { ...thuLinh.hoSoThu || be.hoSo };
  const thuTu = ["nhan", "quy", "tien"], k = (thuTu.indexOf(h.chungLoai) + 1) % 3;
  h.chungLoai = thuTu[k]; if (k === 0) h.gioi = h.gioi === "nam" ? "nu" : "nam";
  h.mauAo = (h.mauAo + 1) % NV.BANG.ao.length; h.mauToc = (h.mauToc + 2) % NV.BANG.toc.length; h.mauDa = (h.mauDa + 1) % NV.BANG.da.length;
  const p = thuLinh.vo.position, cu = thuLinh;
  canh.remove(cu.vo); donVi.splice(donVi.indexOf(cu), 1);
  thuLinh = taoNhanVat("thu_linh", NV.chuanHoa(h), p.x, p.z, cu.ten); thuLinh.hoSoThu = NV.chuanHoa(h);
  thuLinh.huong = cu.huong; thuLinh.goc.rotation.y = cu.huong;
  if (dangChon === cu) chon(thuLinh);
  baoGoiY("Thử ngoại hình: " + { nhan: "Nhân tộc", quy: "Quỷ tộc", tien: "Tiên tộc" }[h.chungLoai] + ", " + (h.gioi === "nu" ? "bé gái" : "bé trai") + ".");
});

// Động tác chia 2 gói theo bối cảnh (người dùng góp ý 23/10/2026): gói BẢN ĐỒ 8 động
// tác đi kèm nhân vật (đi, chạy, chặt, đào, nhặt, làm, reo); gói TRẬN ĐẤU (33 động tác:
// chém, đâm, xoay, bắn, niệm phép, đỡ, né 4 hướng, trúng đòn...) chỉ tải khi vào trận.
// Hai gói cùng bộ xương nên gắn vào cùng nhân vật. Không có động tác "chết" (phi bạo lực).
const TEN_DONG_TAC = { "1H_Melee_Attack_Slice_Diagonal": "Chém chéo", "Spellcast_Shoot": "Phóng phép", "Block_Hit": "Đỡ đòn",
  "Dodge_Right": "Né sang phải", "2H_Melee_Attack_Spin": "Xoay vòng", "Hit_A": "Trúng đòn", "1H_Ranged_Shoot": "Bắn", "Cheer": "Reo mừng chiến thắng" };
let goiTran = null;
$("d3ThuTran").addEventListener("click", async () => {
  if (thuLinh.trangThai === "dien") return;
  baoGoiY("Đang tải gói động tác trận…");
  try { goiTran = goiTran || (await taiGlb("dt/mo_hinh/dong_tac_tran.glb")).animations; } catch (e) { baoGoiY("Chưa tải được gói động tác trận."); return; }
  const dv = thuLinh;
  for (const c of goiTran) if (!dv.dt[c.name]) dv.dt[c.name] = dv.tron.clipAction(c);
  dv.duong = []; dv.viec = null; dv.hienVuKhi(true);
  dv.trangThai = "dien"; dv.dien = { ds: Object.keys(TEN_DONG_TAC), i: 0, t: 0 };
});

// ----------------------------------------------------------------
// PHẦN 11: VÒNG VẼ + ĐO
// ----------------------------------------------------------------
const dongHo = new THREE.Clock();
const doFps = { khung: 0, tg: 0, fps: 0, chamLien: 0 };
const vt2 = new THREE.Vector3();
window.__dt3d = { fps: 0, lenhVe: 0, tamGiac: 0, taiMs: 0, soByte, doHoa, soNongDan: () => soNongDan, kho, chon: () => dangChon && dangChon.ten,
  // cho kịch bản thử: chạm vào một điểm thế giới
  chamDiem(x, z) { vt2.set(x, doCaoDi(x, z) + 0.5, z).project(camera); const r = canvas.getBoundingClientRect(); return { x: r.left + (vt2.x + 1) / 2 * r.width, y: r.top + (1 - vt2.y) / 2 * r.height }; },
  tenThuLinh: () => thuLinh.ten,
  viTri: ten => { const d = donVi.find(v => v.ten === ten); return d && { x: d.vo.position.x, z: d.vo.position.z, viec: d.trangThai, mang: d.mang.so }; },
  nguonGan: (loai) => { const n = nguonGanNhat(loai, banDo.leu.x, banDo.leu.z, 60); return n && { x: n.x, z: n.z }; }
};

function vongVe() {
  const dt = Math.min(dongHo.getDelta(), 0.1), t = dongHo.elapsedTime;
  for (const dv of donVi) capNhatDonVi(dv, dt);
  // cây / đá rung khi bị chặt
  for (const n of nguon) if (n.rungDen > 0 && n.con > 0) { n.rungDen -= dt; n.bo.rung(n.i, 0.35 - n.rungDen); }
  if (dangChon) { hinhChon.position.set(dangChon.vo.position.x, dangChon.vo.position.y + 0.06, dangChon.vo.position.z); hinhChon.rotation.y = t; }
  if (vachDich.visible) { vachDich.userData.t += dt; const k = 1 + vachDich.userData.t * 3; vachDich.scale.set(k, 1, k); vachDich.material.opacity = 1 - vachDich.userData.t * 1.6; if (vachDich.userData.t > 0.6) vachDich.visible = false; }
  const { ngon: lng, loi, den } = lua.userData, nhap = 1 + Math.sin(t * 13) * 0.08 + Math.sin(t * 7.3) * 0.06;
  lng.scale.set(1, nhap, 1); loi.scale.set(1, 2 - nhap, 1); if (den) den.intensity = 5 + Math.sin(t * 11) * 1.2 + Math.sin(t * 17) * 0.8;
  anhSong.offset.set(t * 0.012, t * 0.02);
  // dấu "!" nông dân rảnh + chữ nổi
  for (let i = dsNoi.length - 1; i >= 0; i--) {
    const el = dsNoi[i], u = el.userData; u.t += dt;
    vt2.copy(u.vt).setY(u.vt.y + u.t * 0.9).project(camera);
    el.style.transform = `translate(${(vt2.x + 1) / 2 * canvas.clientWidth}px, ${(1 - vt2.y) / 2 * canvas.clientHeight}px) translate(-50%, -50%)`;
    el.style.opacity = String(Math.max(0, 1 - u.t / 1.4));
    if (u.t > 1.4) { el.remove(); dsNoi.splice(i, 1); }
  }
  const nhan = $("d3Ranh"); const ranh = donVi.find(d => d.nghiNgoi && d.vaiTro === "nong_dan");
  if (ranh) { vt2.copy(ranh.vo.position).setY(ranh.vo.position.y + 1.5).project(camera); nhan.hidden = false; nhan.style.transform = `translate(${(vt2.x + 1) / 2 * canvas.clientWidth}px, ${(1 - vt2.y) / 2 * canvas.clientHeight}px) translate(-50%, -100%)`; } else nhan.hidden = true;
  renderer.render(canh, camera);
  // đo
  doFps.khung++; doFps.tg += dt;
  if (doFps.tg >= 1) {
    doFps.fps = Math.round(doFps.khung / doFps.tg); doFps.khung = 0; doFps.tg = 0;
    window.__dt3d.fps = doFps.fps; window.__dt3d.lenhVe = renderer.info.render.calls; window.__dt3d.tamGiac = renderer.info.render.triangles;
    $("d3Fps").textContent = doFps.fps + " khung/giây";
    if (!NHE && doFps.fps < 24) { doFps.chamLien++; if (doFps.chamLien === 4) baoGoiY("Máy hơi chậm: bấm nút ✨ để chuyển đồ họa sang Nhẹ nhé."); } else doFps.chamLien = 0;
  }
}

coKhung(); datCamera(); capNhatKho();
window.addEventListener("resize", () => { coKhung(); datCamera(); });
new ResizeObserver(() => { coKhung(); }).observe(vungVe);
// Thử nhiều nông dân: ?nd=20
const ndThem = Number(new URLSearchParams(location.search).get("nd")) || 0;
for (let i = 0; i < Math.min(ndThem, 39); i++) $("d3ThemNd").click();
$("d3SoNd").textContent = soNongDan;
renderer.setAnimationLoop(vongVe);
window.__dt3d.taiMs = Math.round(performance.now() - t0);
thanhTai.hidden = true;
baoGoiY("Chạm vào nông dân 🧑‍🌾 rồi chạm một cái cây để chặt gỗ. Kéo để xem quanh làng, chụm hai ngón (hoặc lăn chuột) để phóng to.");
// 23/10/2026 15:48 - BƯỚC: TC_D01C
