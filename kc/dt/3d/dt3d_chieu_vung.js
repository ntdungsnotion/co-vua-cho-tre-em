// ================================================================
// FILE: dt/3d/dt3d_chieu_vung.js  (ES module) - PHẦN VẼ 3D: CHIÊU THỨC PHỦ VÙNG RỘNG
// CHỨC NĂNG: Năm khối chiêu lớn dựng sẵn, mỗi khối có tham số (tâm, cỡ vùng, số, thời gian, màu)
//            để TC_D05C ghép vào kỹ năng của tướng:
//              muaLua      - trời tối đỏ, hàng trăm giọt lửa rơi phủ vùng, toé lửa, đất cháy sém
//              thienThach  - vòng báo trước, đá rực lửa có đuôi khói lao xuống, nổ, hố sáng, rung
//              locXoay     - phễu gió xoắn cuốn bụi + đá, đi từ điểm này tới điểm kia
//              damDat      - đất nứt toả ra, cột đá trồi lên rồi sụp, sóng bụi, rung mạnh
//              voKhongGian - khung hình nứt như kính rồi vỡ văng ra, lộ khe không gian phía sau
//              muaTen      - nhiều loạt mũi tên bay vòng cung từ sau lưng, cắm xuống vùng địch
//              chuongNangLuong - gồng tụ cầu sáng (hạt bị hút vào) rồi bắn luồng sóng năng lượng lớn
//            Tiếng: o.am = bộ tiếng dt3d_am_thanh.js (TC_D05B3), kêu đúng lúc chạm / nổ / vỡ.
//            Dùng bộ hạt dt3d_hat.js (lửa / khói / nổ lật khung) + hiệu ứng cũ dt3d_hieu_ung.js.
// HÀM KHAI RA:
//   taoChieuVung(ctx, hu, bo, { nhe, layCamera, am }) -> cv = { capNhat(dt, t), muaLua(o), thienThach(o),
//        locXoay(o), damDat(o), voKhongGian(o), muaTen(o), chuongNangLuong(o) }
//        (o: xem đầu mỗi hàm; mọi chiêu trả về thời gian diễn, giây; locXoay trả { giay, tam() })
// BƯỚC: TC_D05B2 (người dùng 29/10/2026: "mưa lửa bao trùm vùng rộng lớn, mưa thiên thạch, lốc xoáy,
//        dẫm chân làm rung chuyển mặt đất, đấm vỡ không gian"; 30/10/2026: "thêm mưa mũi tên",
//        đòn chưởng sóng năng lượng kiểu võ thuật)
// NGÀY: 30/10/2026; 30/10/2026 06:00 (TC_D05B3: tiếng từng chiêu)
// ================================================================
import * as THREE from "three";
import { taoNgauNhien } from "./dt3d_canh.js";

const ngau = (a, b) => a + Math.random() * (b - a);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const mem = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function taoAnh(ve, w = 256, h = w) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  ve(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// vết nứt toả từ tâm (vẽ cùng một hạt giống => lớp tối và lớp sáng trùng nhau)
function veNut(g, n, hatGiong, { mau = "#000", day = 1 } = {}) {
  const r = taoNgauNhien(hatGiong), c = n / 2;
  g.strokeStyle = mau; g.lineCap = "round"; g.lineJoin = "round";
  const nhanh = (x, y, a, dai, w, sau) => {
    g.lineWidth = w * day; g.beginPath(); g.moveTo(x, y);
    const buoc = 7;
    for (let i = 0; i < buoc; i++) {
      a += (r() - 0.5) * 0.9; const l = dai / buoc;
      x += Math.cos(a) * l; y += Math.sin(a) * l; g.lineTo(x, y);
      if (sau < 2 && r() < 0.28) { g.stroke(); nhanh(x, y, a + (r() < 0.5 ? -1 : 1) * ngau(0.5, 1.1), dai * 0.45, w * 0.6, sau + 1); g.lineWidth = w * day; g.beginPath(); g.moveTo(x, y); }
      w *= 0.86; g.lineWidth = w * day;
    }
    g.stroke();
  };
  const so = 9;
  for (let i = 0; i < so; i++) nhanh(c, c, i / so * Math.PI * 2 + r() * 0.5, n * (0.3 + r() * 0.17), n * 0.022, 0);
  g.fillStyle = mau; g.beginPath(); g.arc(c, c, n * 0.05, 0, Math.PI * 2); g.fill();
}

const DINH_DON_GIAN = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";
const KET_MAU = "\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n";

export function taoChieuVung(ctx, hu, bo, { nhe, layCamera, am } = {}) {
  const { canh, renderer } = ctx;
  const so = n => bo.so(n);
  const keu = (ten, ...a) => { if (am && am[ten]) am[ten](...a); }; // tiếng (dt3d_am_thanh.js, TC_D05B3)

  // --- ảnh mặt đất ---
  const TEX = {
    chay: taoAnh((g, n) => {
      const r = taoNgauNhien(7);
      for (let i = 0; i < 26; i++) {
        const a = r() * 6.28, d = r() * n * 0.22, x = n / 2 + Math.cos(a) * d, y = n / 2 + Math.sin(a) * d, rr = n * (0.1 + r() * 0.16);
        const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, "rgba(20,10,6,.5)"); gr.addColorStop(1, "rgba(20,10,6,0)"); g.fillStyle = gr; g.fillRect(0, 0, n, n);
      }
    }),
    ho: taoAnh((g, n) => {
      const c = n / 2, r = taoNgauNhien(11);
      for (let i = 0; i < 40; i++) { // tia đất văng
        const a = r() * 6.28, l = n * (0.3 + r() * 0.18); g.strokeStyle = "rgba(30,18,10,.35)"; g.lineWidth = n * (0.01 + r() * 0.02);
        g.beginPath(); g.moveTo(c + Math.cos(a) * n * 0.16, c + Math.sin(a) * n * 0.16); g.lineTo(c + Math.cos(a) * l, c + Math.sin(a) * l); g.stroke();
      }
      let gr = g.createRadialGradient(c, c, 0, c, c, n * 0.28); gr.addColorStop(0, "rgba(10,5,3,.95)"); gr.addColorStop(0.7, "rgba(35,20,12,.9)"); gr.addColorStop(0.86, "rgba(80,58,40,.8)"); gr.addColorStop(1, "rgba(60,40,25,0)");
      g.fillStyle = gr; g.fillRect(0, 0, n, n);
    }),
    hoSang: taoAnh((g, n) => { const c = n / 2, gr = g.createRadialGradient(c, c, 0, c, c, n * 0.24); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.5, "rgba(255,255,255,.6)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, n, n); }),
    nut: taoAnh((g, n) => veNut(g, n, 3, { mau: "rgba(18,10,6,.92)", day: 1 }), 512),
    nutSang: taoAnh((g, n) => { g.filter = "blur(3px)"; veNut(g, n, 3, { mau: "#fff", day: 1.9 }); g.filter = "none"; veNut(g, n, 3, { mau: "#fff", day: 0.7 }); }, 512),
    canhBao: taoAnh((g, n) => {
      const c = n / 2; g.strokeStyle = "#fff";
      g.lineWidth = n * 0.035; g.beginPath(); g.arc(c, c, n * 0.45, 0, Math.PI * 2); g.stroke();
      g.lineWidth = n * 0.012; g.beginPath(); g.arc(c, c, n * 0.34, 0, Math.PI * 2); g.stroke();
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; g.beginPath(); g.moveTo(c + Math.cos(a) * n * 0.12, c + Math.sin(a) * n * 0.12); g.lineTo(c + Math.cos(a) * n * 0.3, c + Math.sin(a) * n * 0.3); g.stroke(); }
      const gr = g.createRadialGradient(c, c, 0, c, c, n * 0.45); gr.addColorStop(0, "rgba(255,255,255,.35)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, n, n);
    }, 128)
  };

  // --- việc hẹn giờ + vật tự xoá (theo dt của sân => khựng hình cũng chậm theo) ---
  const viec = [], vat = [];
  const hen = (tre, fn) => viec.push({ tre, fn });
  const lap = (tre, giay, fn) => viec.push({ tre, giay, t: 0, fn });
  function them(o, giay, cap) { canh.add(o); vat.push({ o, con: giay, tong: giay, cap }); return o; }
  function xoaVat(v) { canh.remove(v.o); v.o.traverse(m => { if (m.geometry && !m.geometry.userData.dungChung) m.geometry.dispose(); if (m.material && !m.material.userData.dungChung) m.material.dispose(); }); }

  const PHANG = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2); PHANG.userData.dungChung = true;
  let tangMat = 0;
  // vết trên mặt đất: tex + màu, cỡ (đường kính), thời gian; sang = lớp cộng màu (phát sáng)
  function vetDat(p, tex, { co = 2, giay = 4, mau = "#ffffff", sang = false, mo = 1, moTu = 0.6, no = 0, xoay = Math.random() * 6.28 } = {}) {
    const vl = new THREE.MeshBasicMaterial({ map: tex, color: mau, transparent: true, depthWrite: false, opacity: mo, blending: sang ? THREE.AdditiveBlending : THREE.NormalBlending, polygonOffset: true, polygonOffsetFactor: -2 - (tangMat % 6), polygonOffsetUnits: -2 });
    const m = new THREE.Mesh(PHANG, vl); m.position.set(p.x, 0.02 + (tangMat++ % 6) * 0.003, p.z); m.rotation.y = xoay;
    m.scale.setScalar(co); m.renderOrder = sang ? 9 : 2;
    them(m, giay, k => { if (no) m.scale.setScalar(co * (no + (1 - no) * mem(0, 0.08, k))); vl.opacity = mo * (1 - mem(moTu, 1, k)); });
    return m;
  }

  // --- ánh sáng chiêu (đèn điểm dựng sẵn từ đầu để không phải dịch lại shader giữa trận) ---
  const den = new THREE.PointLight("#ff7a2a", 0, 16, 1.4); den.position.set(0, 2, 0.5); canh.add(den);
  const dsSang = [];
  const chieuSang = (p, mau, cuong, giay, tre = 0) => hen(tre, () => dsSang.push({ p: p.clone(), mau: new THREE.Color(mau), cuong, con: giay, tong: giay }));
  // trời tối (mưa lửa, thiên thạch, vỡ không gian)
  let goc = null; const dsToi = [];
  const hemi = canh.children.find(o => o.isHemisphereLight);
  const toiTroi = (mau, muc, giay) => dsToi.push({ mau: new THREE.Color(mau), muc, t: 0, giay });
  const mauTam = new THREE.Color();

  // --- đá văng (một lệnh vẽ) + cột đá trồi (một lệnh vẽ) ---
  const N_DA = nhe ? 40 : 110, N_GAI = nhe ? 30 : 60;
  const vlDa = new THREE.MeshLambertMaterial({ color: "#7d6c5a", flatShading: true });
  const daMesh = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), vlDa, N_DA); daMesh.count = 0; daMesh.frustumCulled = false; canh.add(daMesh);
  const gaiMesh = new THREE.InstancedMesh(new THREE.ConeGeometry(0.42, 1, 5).translate(0, 0.5, 0), new THREE.MeshLambertMaterial({ color: "#6a5a4c", flatShading: true }), N_GAI);
  gaiMesh.count = 0; gaiMesh.frustumCulled = false; gaiMesh.castShadow = !nhe; canh.add(gaiMesh);
  const dsDa = [], dsGai = [];
  const mt = new THREE.Matrix4(), qt = new THREE.Quaternion(), qv = new THREE.Quaternion(), cs = new THREE.Vector3(), truc = new THREE.Vector3();
  function daVang(p, v, co = 0.12, song = 2.2, mau = null) {
    if (dsDa.length >= N_DA) dsDa.shift();
    dsDa.push({ p: p.clone(), v: v.clone(), q: new THREE.Quaternion().setFromEuler(new THREE.Euler(ngau(0, 6), ngau(0, 6), 0)), w: V(ngau(-1, 1), ngau(-1, 1), ngau(-1, 1)).normalize(), tw: ngau(4, 12), co, con: song, quy: null });
  }

  // --- thiên thạch: khối đá sẵn (dùng lại), tự sáng đỏ cam ---
  const hinhThach = new THREE.IcosahedronGeometry(1, 1);
  { const p = hinhThach.attributes.position, r = taoNgauNhien(5); for (let i = 0; i < p.count; i++) { const k = 0.78 + r() * 0.35; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k); } hinhThach.computeVertexNormals(); }
  const vlThach = new THREE.MeshLambertMaterial({ color: "#3b2a22", emissive: "#ff5a18", emissiveIntensity: 1.6, flatShading: true });
  const khoThach = [];
  for (let i = 0; i < 10; i++) { const m = new THREE.Mesh(hinhThach, vlThach); m.visible = false; canh.add(m); khoThach.push(m); }

  // ================== 1) MƯA LỬA ==================
  // o: { tam (Vector3), r (bán kính vùng), giay, matDo (giọt / giây), mau, mau2 }
  function muaLua({ tam = V(0, 0, 0), r = 4, giay = 3.2, matDo = 100, mau = "#ff6a1a", mau2 = "#ffb347" } = {}) {
    toiTroi("#2a0a06", 0.9, giay + 2.4);
    keu("muaLua", tam.x, giay);
    chieuSang(V(tam.x, 2.5, tam.z + 1), "#ff6a20", 26, giay + 1.8);
    const roi = V(0.7, -5.2, 0.18), tRoi = 1.7; // rơi chậm để mắt theo kịp (người dùng 30/10/2026)
    let tich = 0, dem = 0;
    lap(0.25, giay, (k, dt) => {
      tich += dt * so(matDo) * (k < 0.15 ? k / 0.15 : 1);
      while (tich >= 1) {
        tich -= 1; dem++;
        const a = ngau(0, 6.28), d = Math.sqrt(Math.random()) * r;
        const dich = V(tam.x + Math.cos(a) * d, 0.05, Math.max(-4, Math.min(1.8, tam.z + Math.sin(a) * d * 0.6)));
        const tr = tRoi * ngau(0.85, 1.15), tu = dich.clone().addScaledVector(roi, -tr);
        const to = dem % 3 === 0;
        bo.hat(to ? "lua" : "sang", { p: tu, v: roi, song: tr, co: to ? 0.55 : 0.16, keoDai: to ? 0.05 : 0.1, mau: to ? "#ffffff" : mau2, mauCuoi: mau, sang: to ? 1.5 : 1.9, moCuoi: 0.97 });
        if (to) bo.hat("sang", { p: tu, v: roi, song: tr, co: 0.5, mau, sang: 1.2, mo: 0.5 });
        hen(tr, () => { // chạm đất
          keu("luaCham", dich.x);
          if (dem % 2 === 0) bo.hat("lua", { p: V(dich.x, 0.25, dich.z), v: V(0, 0.8, 0), song: ngau(0.35, 0.55), co: 0.45, coCuoi: 0.8, sang: 1.4 });
          for (let i = 0; i < 3; i++) bo.hat("sang", { p: V(dich.x, 0.08, dich.z), v: V(ngau(-2, 2), ngau(1.5, 3.5), ngau(-1, 1)), g: 9, song: ngau(0.25, 0.45), co: 0.07, keoDai: 0.05, mau: mau2, sang: 2.2 });
          if (dem % 7 === 0) { vetDat(dich, TEX.chay, { co: ngau(0.9, 1.6), giay: giay + 4, mo: 0.85, moTu: 0.75 }); }
          if (dem % 9 === 0) for (let i = 0; i < 3; i++) bo.hat("lua", { p: V(dich.x + ngau(-0.2, 0.2), 0.3, dich.z), v: V(0, ngau(0.2, 0.6), 0), song: ngau(0.9, 1.6), co: ngau(0.5, 0.8), coCuoi: 0.3, sang: 1.3, hienDan: 0.15 });
          if (dem % 5 === 0) bo.hat("khoi", { p: V(dich.x, 0.4, dich.z), v: V(ngau(-0.2, 0.2), ngau(0.5, 1), 0), song: 1.6, co: 0.7, coCuoi: 1.6, mau: "#4a3a34", mo: 0.45 });
        });
      }
    });
    lap(0.25, giay, k => { if (Math.random() < 0.08) hu.rung(0.02, 0.15); });
    return giay + 2.2;
  }

  // ================== 2) MƯA THIÊN THẠCH ==================
  // o: { tam, r, so (số khối), giay (khoảng thả), co (cỡ khối), mau }
  function thienThach({ tam = V(0, 0, 0), r = 3.4, so: soKhoi = 3, giay = 2.6, co = 0.45, mau = "#ff7a2a" } = {}) {
    toiTroi("#2a0e10", 0.6, giay + 3.2);
    chieuSang(V(tam.x, 3, tam.z + 1.2), "#ff5a20", 10, giay + 2.5);
    const diem = [];
    for (let i = 0; i < soKhoi; i++) { // điểm rơi rải đều, không chồng nhau
      let p, lan = 0;
      do { const a = ngau(0, 6.28), d = Math.sqrt(Math.random()) * r; p = V(Math.max(-3, Math.min(3, tam.x + Math.cos(a) * d)), 0, Math.max(-3.5, Math.min(1.4, tam.z + Math.sin(a) * d * 0.55))); }
      while (lan++ < 12 && diem.some(q => q.distanceTo(p) < r * 0.45));
      diem.push(p);
    }
    diem.forEach((dich, i) => {
      const tre = i / Math.max(1, soKhoi - 1) * giay + ngau(-0.1, 0.1), bay = ngau(1.3, 1.6), c = co * ngau(0.75, 1.3);
      hen(Math.max(0, tre), () => {
        const vong = vetDat(dich, TEX.canhBao, { co: c * 4.2, giay: 0.7 + bay, mau: "#ff3b2a", sang: true, mo: 0.9, moTu: 0.85, no: 0.3 });
        vong.userData.nhip = true;
      });
      hen(Math.max(0, tre) + 0.7, () => {
        const m = khoThach.find(x => !x.visible); if (!m) return;
        const tu = dich.clone().add(V(ngau(-7, -5), ngau(11, 13), ngau(-4, -2))), p = V();
        keu("thachVut", dich.x, bay);
        m.visible = true; m.scale.setScalar(c); const w = V(ngau(-1, 1), ngau(-1, 1), ngau(-1, 1)).normalize();
        let tich = 0, xong = false;
        lap(0, bay, (k, dt) => {
          p.lerpVectors(tu, dich, k * k * 0.25 + k * 0.75); m.position.copy(p); m.rotateOnAxis(w, dt * 9);
          tich += dt;
          const buoc = nhe ? 0.03 : 0.012;
          while (tich > buoc) {
            tich -= buoc;
            const lui = p.clone().sub(tu).normalize().multiplyScalar(-ngau(0.5, 1.6));
            bo.hat("lua", { p: p.clone().add(V(ngau(-0.1, 0.1), ngau(-0.1, 0.1), ngau(-0.1, 0.1)).multiplyScalar(c * 2)), v: lui, song: ngau(0.25, 0.4), co: c * 2.6, coCuoi: c * 1.1, sang: 1.6 });
            bo.hat("khoi", { p: p.clone(), v: lui.multiplyScalar(0.3), song: ngau(0.9, 1.4), co: c * 1.8, coCuoi: c * 4.5, mau: "#3d302c", mo: 0.55, hienDan: 0.1 });
          }
          bo.hat("sang", { p: p.clone(), song: 0.05, co: c * 5, mau, sang: 1.4, mo: 0.8 });
          if (k >= 1 && !xong) { xong = true; m.visible = false; noThach(dich, c, mau); }
        });
      });
    });
    return giay + 3.6;
  }
  function noThach(p, c, mau) {
    const k = c / 0.45;
    keu("thachNo", p.x, k);
    hu.chop(V(p.x, 0.6, p.z), "#ffffff", 3.2 * k, 0.18, 0.9);
    hu.chop(V(p.x, 0.6, p.z), mau, 5 * k, 0.4, 0.6);
    for (let i = 0; i < 3; i++) bo.hat("no", { p: V(p.x + ngau(-0.3, 0.3) * k, 0.7 * k + i * 0.25, p.z + ngau(-0.2, 0.2)), v: V(ngau(-0.3, 0.3), ngau(0.6, 1.4), 0), song: ngau(1.1, 1.5), co: 2.2 * k, coCuoi: 3.4 * k, sang: 1.5, xoay: ngau(0, 6.28) });
    for (let i = 0; i < so(36); i++) { const a = ngau(0, 6.28), t = ngau(3, 9); bo.hat("sang", { p: V(p.x, 0.3, p.z), v: V(Math.cos(a) * t, ngau(2, 8), Math.sin(a) * t * 0.6), g: 12, can: 1.2, song: ngau(0.4, 0.9), co: 0.08, keoDai: 0.045, mau: "#ffd59a", mauCuoi: mau, sang: 2.4 }); }
    for (let i = 0; i < so(14); i++) { const a = i / 14 * 6.28; bo.hat("khoi", { p: V(p.x + Math.cos(a) * 0.4, 0.25, p.z + Math.sin(a) * 0.3), v: V(Math.cos(a) * 4, ngau(0.2, 0.8), Math.sin(a) * 2.6), can: 3, song: ngau(1.2, 1.8), co: 0.8 * k, coCuoi: 2 * k, mau: "#8a7462", mo: 0.6 }); }
    for (let i = 0; i < so(7); i++) { const a = ngau(0, 6.28); daVang(V(p.x, 0.3, p.z), V(Math.cos(a) * ngau(1.5, 4), ngau(4, 7), Math.sin(a) * ngau(1, 3)), ngau(0.05, 0.12) * k); }
    hu.songXung(p, mau, 3.2 * k, 0.6);
    vetDat(p, TEX.ho, { co: 2.6 * k, giay: 6, mo: 0.95, moTu: 0.8 });
    vetDat(p, TEX.hoSang, { co: 2.2 * k, giay: 2.6, mau: "#ff6a1c", sang: true, mo: 1, moTu: 0.25 });
    for (let i = 0; i < 2; i++) bo.hat("lua", { p: V(p.x + ngau(-0.25, 0.25), 0.3, p.z), v: V(0, 0.4, 0), song: ngau(1.4, 2.2), co: 0.6, coCuoi: 0.3, sang: 1.3, hienDan: 0.2 });
    hu.rung(0.13 * k, 0.5);
    chieuSang(V(p.x, 1.2, p.z + 0.5), "#ffa040", 40 * k, 0.45);
  }

  // ================== 3) LỐC XOÁY ==================
  // o: { tu, den (Vector3 mặt đất), giay, cao, rong (bán kính miệng phễu), mau }  -> trả về { giay, tam() }
  const DINH_LOC = "uniform float uT, uLac; varying vec2 vUv; varying float vH; void main(){ vUv = uv; vH = position.y; vec3 p = position;" +
    " float h = clamp(p.y / 4.5, 0.0, 1.0); p.x += sin(p.y * 1.1 + uT * 2.3) * 0.32 * h * uLac; p.z += cos(p.y * 0.9 + uT * 1.7) * 0.18 * h * uLac;" +
    " gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }";
  const MANH_LOC = "uniform float uT, uMo, uToc, uLop; uniform vec3 uMau; varying vec2 vUv; varying float vH;" +
    "float soc(vec2 u){ return 0.5 + 0.5 * sin(u.x * 6.2832); }" +
    "void main(){ float x = vUv.x * 5.0 + vUv.y * (2.6 + uLop) - uT * uToc;" +
    " float a = pow(soc(vec2(x, 0.0)), 3.0) * 0.7 + pow(soc(vec2(x * 2.3 + 0.4 + sin(vUv.y * 9.0 + uT) * 0.15, 0.0)), 5.0) * 0.6;" +
    " a *= smoothstep(0.0, 0.12, vUv.y) * (1.0 - smoothstep(0.82, 1.0, vUv.y));" +
    " vec3 c = mix(uMau * 0.55, uMau, vUv.y) * (0.75 + a * 0.6);" +
    " gl_FragColor = vec4(c, a * uMo * (0.45 + 0.55 * (1.0 - vUv.y * 0.5)));" + KET_MAU + "}";
  function locXoay({ tu = V(3, 0, -1.5), den = V(0, 0, 0), giay = 3.4, cao = 4.6, rong = 1.6, mau = "#d8e2e6", mauBui = "#9a8466" } = {}) {
    const nhom = new THREE.Group(); const vlds = [];
    const lop = [[1, 4.2, 0.95], [0.82, 6.1, 0.75], [0.62, 8.3, 0.6]];
    lop.forEach(([s, toc, mo], i) => {
      const g = new THREE.CylinderGeometry(rong * s, 0.18 * s + 0.08, cao, 40, 28, true).translate(0, cao / 2, 0);
      const vl = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uMo: { value: 0 }, uToc: { value: toc }, uLop: { value: i * 0.7 }, uMau: { value: new THREE.Color(mau) }, uLac: { value: 1 } },
        vertexShader: DINH_LOC, fragmentShader: MANH_LOC, transparent: true, depthWrite: false, side: THREE.FrontSide });
      const m = new THREE.Mesh(g, vl); m.renderOrder = 11 + i; nhom.add(m); vlds.push({ vl, mo });
    });
    nhom.position.copy(tu); nhom.scale.set(0.3, 0.05, 0.3);
    keu("locXoay", tu.x, den.x, giay);
    const tam = tu.clone(), vTam = den.clone().sub(tu).divideScalar(giay);
    let tich = 0, t0 = 0, tichDa = 0;
    them(nhom, giay, (k, dt, t) => {
      t0 += dt;
      tam.copy(tu).addScaledVector(vTam, t0);
      nhom.position.copy(tam);
      const len = mem(0, 0.14, k), tat = 1 - mem(0.84, 1, k);
      nhom.scale.set(0.3 + 0.7 * len, 0.05 + 0.95 * len, 0.3 + 0.7 * len);
      nhom.rotation.y += dt * 3;
      for (const { vl, mo } of vlds) { vl.uniforms.uT.value = t0; vl.uniforms.uMo.value = mo * len * tat; }
      tich += dt * so(90) * tat;
      while (tich >= 1) { // bụi cuốn lên theo phễu (card đồ hoạ tự quay)
        tich -= 1; const h = Math.random();
        bo.hat("khoi", { p: V(tam.x, h * 0.4, tam.z), v: V(vTam.x, ngau(1.6, 3.2), vTam.z), song: ngau(1, 1.5), co: ngau(0.45, 0.9), coCuoi: ngau(1.2, 2.2), mau: mauBui, mo: 0.5, hienDan: 0.15,
          quy: { r: ngau(0.2, 0.5), a: ngau(0, 6.28), w: ngau(5, 8), vr: rong * 0.55 } });
        if (Math.random() < 0.5) bo.hat("sang", { p: V(tam.x, ngau(0.2, 2), tam.z), v: V(vTam.x, ngau(1, 2.5), vTam.z), song: ngau(0.6, 1.1), co: 0.05, keoDai: 0.03, mau: "#f2f6ff", mo: 0.7, quy: { r: ngau(0.3, 1.2), a: ngau(0, 6.28), w: ngau(7, 11), vr: 0.3 } });
      }
      // bụi xoáy quanh chân
      if (Math.random() < 0.5 * tat) bo.hat("khoi", { p: V(tam.x, 0.12, tam.z), v: V(vTam.x, 0.15, vTam.z), song: 0.9, co: 0.7, coCuoi: 1.8, mau: mauBui, mo: 0.4, quy: { r: ngau(0.4, 0.9), a: ngau(0, 6.28), w: 4, vr: 1.2 } });
      // đá bị cuốn: quay quanh tâm, bay lên rồi văng ra khi tan
      tichDa += dt * so(6) * tat;
      while (tichDa >= 1 && dsDa.length < N_DA) { tichDa -= 1; daVang(V(tam.x, 0.1, tam.z), V(0, 0, 0), ngau(0.04, 0.1), 3); dsDa[dsDa.length - 1].quy = { a: ngau(0, 6.28), r: ngau(0.3, 0.6), w: ngau(5, 8), vy: ngau(0.8, 1.6), tam }; }
      if (k >= 0.99) for (const d of dsDa) if (d.quy && d.quy.tam === tam) { d.v.set(Math.cos(d.quy.a) * 3, 2, Math.sin(d.quy.a) * 3); d.quy = null; }
    });
    hen(0, () => { bo.hat("khoi", { p: V(tu.x, 0.2, tu.z), song: 1.2, co: 1.2, coCuoi: 3.4, mau: mauBui, mo: 0.6 }); hu.songXung(tu, "#e6efe9", 2.2, 0.6); });
    lap(0, giay, () => { if (Math.random() < 0.12) hu.rung(0.025, 0.2); });
    return { giay, tam: () => tam };
  }

  // ================== 4) DẬM ĐẤT ==================
  // o: { tam (chân người dậm), r (bán kính), huong (Vector3 hướng toả đá, null = toả đều), mau (vết nứt sáng), vong (số vòng cột đá) }
  function damDat({ tam = V(0, 0, 0), r = 4, huong = null, mau = "#ffb24a", vong = 5 } = {}) {
    hu.rung(0.2, 0.85);
    keu("damDat", tam.x, vong, 0.075);
    hu.chop(V(tam.x, 0.3, tam.z), "#ffffff", 1.6, 0.14, 0.55);
    hu.chop(V(tam.x, 0.3, tam.z), mau, 2.6, 0.3, 0.35);
    for (let i = 0; i < 3; i++) hen(i * 0.12, () => hu.songXung(tam, i ? "#e8d6b0" : mau, r * (0.7 + i * 0.25), 0.7 + i * 0.1));
    vetDat(tam, TEX.nut, { co: r * 2.1, giay: 4.5, mo: 0.95, moTu: 0.75, no: 0.05 });
    vetDat(tam, TEX.nutSang, { co: r * 2.1, giay: 2.4, mau, sang: true, mo: 0.6, moTu: 0.3, no: 0.05 });
    chieuSang(V(tam.x, 0.6, tam.z + 0.6), mau, 18, 1);
    // cột đá trồi theo từng vòng toả ra
    for (let v = 0; v < vong; v++) {
      const rv = 0.75 + v * (r - 0.75) / Math.max(1, vong - 1), soCot = so(4 + v * 2);
      hen(0.05 + v * 0.075, () => {
        for (let i = 0; i < soCot; i++) {
          let a = i / soCot * Math.PI * 2 + ngau(-0.2, 0.2);
          if (huong) a = Math.atan2(huong.z, huong.x) + (i / Math.max(1, soCot - 1) - 0.5) * 1.6 + ngau(-0.08, 0.08);
          const x = tam.x + Math.cos(a) * rv, z = tam.z + Math.sin(a) * rv * 0.7;
          if (z > 2.2 || z < -4.5) continue;
          if (dsGai.length >= N_GAI) dsGai.shift();
          dsGai.push({ x, z, cao: ngau(0.45, 1.05) * (1 - v * 0.08), ban: ngau(0.6, 1.1), nghieng: ngau(0.15, 0.45), a, t: 0, giu: ngau(0.45, 0.7) });
          bo.hat("khoi", { p: V(x, 0.15, z), v: V(Math.cos(a) * 1.2, ngau(0.4, 1), Math.sin(a) * 0.8), can: 2, song: ngau(0.9, 1.3), co: 0.5, coCuoi: 1.4, mau: "#9c8a70", mo: 0.6 });
          if (Math.random() < 0.5) daVang(V(x, 0.3, z), V(Math.cos(a) * ngau(1, 2.5), ngau(3, 6), Math.sin(a) * ngau(0.6, 1.6)), ngau(0.04, 0.09));
        }
      });
    }
    // vòng bụi lớn lan ra sát đất
    for (let i = 0; i < so(28); i++) { const a = i / 28 * 6.28; bo.hat("khoi", { p: V(tam.x, 0.2, tam.z), v: V(Math.cos(a) * r * 1.6, ngau(0.1, 0.5), Math.sin(a) * r * 1.0), can: 2.2, song: ngau(1.3, 1.8), co: 0.6, coCuoi: 2, mau: "#a8977c", mo: 0.55, hienDan: 0.05 }); }
    for (let i = 0; i < so(30); i++) { const a = ngau(0, 6.28), t = ngau(2, 6); bo.hat("sang", { p: V(tam.x, 0.2, tam.z), v: V(Math.cos(a) * t, ngau(1, 5), Math.sin(a) * t * 0.6), g: 10, can: 1, song: ngau(0.3, 0.7), co: 0.05, keoDai: 0.035, mau: "#ffd08a", sang: 1.5 }); }
    return 2.4;
  }

  // ================== 5) ĐẤM VỠ KHÔNG GIAN ==================
  // o: { diem (Vector3 chỗ đấm), mau (khe sáng), giay }
  const MANH_KHE = "uniform float uT, uMo; uniform vec2 uTam; uniform vec3 uMau; varying vec2 vUv;" +
    "float bam(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }" +
    "void main(){ vec2 d = vUv - uTam; d.x *= 1.7; float r = length(d), a = atan(d.y, d.x);" +
    " float xoay = a + r * 6.0 - uT * 1.6; float soi = 0.5 + 0.5 * sin(xoay * 5.0) * sin(r * 22.0 - uT * 4.0);" +
    " vec3 c = mix(vec3(0.03, 0.0, 0.08), vec3(0.22, 0.04, 0.38), soi * exp(-r * 1.6));" +
    " c += uMau * exp(-r * 5.0) * 1.0 + vec3(1.0) * exp(-r * 18.0) * 1.1;" +
    " vec2 o = floor(vUv * vec2(170.0, 100.0)); float sao = step(0.985, bam(o)) * (0.6 + 0.4 * sin(uT * 7.0 + bam(o + 3.1) * 30.0));" +
    " c += vec3(sao) * (0.6 + 0.4 * bam(o + 1.7));" +
    " gl_FragColor = vec4(c, uMo);" + KET_MAU + "}";
  const MANH_NUT = "uniform float uTien, uMo; uniform vec3 uMau; varying vec2 vUv; varying float vXa;" +
    "void main(){ float a = step(vXa, uTien) * (1.0 - smoothstep(0.0, 1.0, abs(vUv.y - 0.5) * 2.0)); gl_FragColor = vec4(mix(uMau, vec3(1.0), 0.6) * 2.2 * a * uMo, 1.0);" + KET_MAU + "}";
  function voKhongGian({ diem = V(0, 1, 0), mau = "#9fd8ff", giay = 2.3 } = {}) {
    const cam = layCamera && layCamera(); if (!cam) return 0;
    // 1. chụp khung hình hiện tại
    const kt = renderer.getDrawingBufferSize(new THREE.Vector2());
    const rt = new THREE.WebGLRenderTarget(kt.x, kt.y, { type: THREE.HalfFloatType });
    renderer.setRenderTarget(rt); renderer.render(canh, cam); renderer.setRenderTarget(null);
    // 2. chia mảnh theo tia + vòng quanh chỗ đấm (toạ độ màn hình -1..1)
    const tamM = diem.clone().project(cam), tx = tamM.x, ty = tamM.y;
    const SO_TIA = nhe ? 10 : 15, VONG = [0, 0.07, 0.2, 0.42, 0.75, 1.25, 3.2];
    const gocTia = []; for (let i = 0; i < SO_TIA; i++) gocTia.push((i + ngau(-0.3, 0.3)) / SO_TIA * Math.PI * 2);
    const ban = VONG.map((r, j) => gocTia.map(() => r * (j > 0 && j < VONG.length - 1 ? ngau(0.82, 1.18) : 1)));
    const pt = (i, j) => { const a = gocTia[i % SO_TIA], r = ban[j][i % SO_TIA]; return [tx + Math.cos(a) * r, ty + Math.sin(a) * r * 1.0]; };
    const d = 0.5, tan = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)), nuaH = d * tan, nuaW = nuaH * cam.aspect;
    const nhom = new THREE.Group(); nhom.renderOrder = 60;
    const vlMat = new THREE.MeshBasicMaterial({ map: rt.texture, depthTest: false, depthWrite: false, side: THREE.DoubleSide, transparent: true });
    const manh = [], canhNut = [];
    for (let j = 0; j < VONG.length - 1; j++) for (let i = 0; i < SO_TIA; i++) {
      const goc = j === 0 ? [pt(i, 0), pt(i, 1), pt(i + 1, 1)] : [pt(i, j), pt(i, j + 1), pt(i + 1, j + 1), pt(i + 1, j)];
      const cx = goc.reduce((s, p) => s + p[0], 0) / goc.length, cy = goc.reduce((s, p) => s + p[1], 0) / goc.length;
      const pos = [], uv = [];
      goc.forEach(([x, y]) => { pos.push((x - cx) * nuaW, (y - cy) * nuaH, 0); uv.push((x + 1) / 2, (y + 1) / 2); });
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(goc.length === 3 ? [0, 1, 2] : [0, 1, 2, 0, 2, 3]);
      const m = new THREE.Mesh(g, vlMat); m.position.set(cx * nuaW, cy * nuaH, -d); m.renderOrder = 61; nhom.add(m);
      const huong = V(cx - tx, cy - ty, 0); const xa = huong.length(); huong.normalize();
      manh.push({ m, v: V(huong.x * ngau(0.25, 0.6) * (0.4 + xa), huong.y * ngau(0.25, 0.6) * (0.4 + xa) + ngau(0.05, 0.25), ngau(0.15, 0.6)), w: V(ngau(-1, 1), ngau(-1, 1), ngau(-1, 1)).normalize(), tw: ngau(2, 7), tre: Math.min(0.25, xa * 0.12) });
      // cạnh mảnh -> vệt nứt sáng (đoạn từ điểm j tới j+1 theo tia i, và cung vòng j+1)
      canhNut.push([pt(i, j), pt(i, j + 1)], [pt(i, j + 1), pt(i + 1, j + 1)]);
    }
    // vệt nứt: dải mỏng, sáng dần từ chỗ đấm ra
    const pos = [], uv = [], xaArr = [], idx = []; const w = 0.0065;
    canhNut.forEach(([a, b]) => {
      const dx = (b[0] - a[0]) * nuaW, dy = (b[1] - a[1]) * nuaH, l = Math.hypot(dx, dy) || 1, nx = -dy / l * w, ny = dx / l * w, n0 = pos.length / 3;
      const A = [a[0] * nuaW, a[1] * nuaH], B = [b[0] * nuaW, b[1] * nuaH];
      pos.push(A[0] - nx, A[1] - ny, -d, A[0] + nx, A[1] + ny, -d, B[0] + nx, B[1] + ny, -d, B[0] - nx, B[1] - ny, -d);
      uv.push(0, 0, 0, 1, 1, 1, 1, 0);
      const xa = p => Math.hypot(p[0] - tx, p[1] - ty); xaArr.push(xa(a), xa(a), xa(b), xa(b));
      idx.push(n0, n0 + 1, n0 + 2, n0, n0 + 2, n0 + 3);
    });
    const gNut = new THREE.BufferGeometry(); gNut.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); gNut.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); gNut.setAttribute("aXa", new THREE.Float32BufferAttribute(xaArr, 1)); gNut.setIndex(idx);
    const vlNut = new THREE.ShaderMaterial({ uniforms: { uTien: { value: 0 }, uMo: { value: 1 }, uMau: { value: new THREE.Color(mau) } },
      vertexShader: "attribute float aXa; varying vec2 vUv; varying float vXa; void main(){ vUv = uv; vXa = aXa; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: MANH_NUT, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending });
    const luoiNut = new THREE.Mesh(gNut, vlNut); luoiNut.renderOrder = 62; nhom.add(luoiNut);
    // khe không gian phía sau các mảnh
    const vlKhe = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uMo: { value: 0 }, uTam: { value: new THREE.Vector2((tx + 1) / 2, (ty + 1) / 2) }, uMau: { value: new THREE.Color(mau) } },
      vertexShader: DINH_DON_GIAN, fragmentShader: MANH_KHE, transparent: true, depthTest: false, depthWrite: false });
    const khe = new THREE.Mesh(new THREE.PlaneGeometry(nuaW * 2.04, nuaH * 2.04), vlKhe); khe.position.z = -d * 1.01; khe.renderOrder = 60; nhom.add(khe);
    vlMat.opacity = 1;
    const VO = 0.5; // giây bắt đầu vỡ
    let t0 = 0;
    them(nhom, giay, (k, dt) => {
      t0 += dt;
      nhom.position.copy(cam.position); nhom.quaternion.copy(cam.quaternion);
      vlNut.uniforms.uTien.value = Math.min(4, t0 / 0.3 * 1.4);
      vlNut.uniforms.uMo.value = t0 < VO ? 1 : Math.max(0, 1 - (t0 - VO) / 0.25);
      vlKhe.uniforms.uT.value = t0;
      vlKhe.uniforms.uMo.value = t0 < VO ? 0 : Math.min(1, (t0 - VO) / 0.06) * (1 - mem(giay - 0.75, giay, t0));
      const tv = t0 - VO;
      for (const s of manh) {
        if (tv < s.tre) { if (t0 < VO) s.m.position.x += Math.sin(t0 * 90 + s.tw) * 0.00015; continue; }
        const tt = tv - s.tre;
        s.m.position.x += s.v.x * dt; s.m.position.y += (s.v.y - 1.1 * tt) * dt; s.m.position.z += s.v.z * dt;
        s.m.rotateOnAxis(s.w, s.tw * dt);
      }
      vlMat.opacity = 1 - mem(giay - 0.9, giay - 0.2, t0);
    });
    hu.chop(diem, "#ffffff", 2.6, 0.2, 0.9); hu.chop(diem, mau, 4, 0.45, 0.6);
    hu.rung(0.06, 0.3);
    keu("voKinh", diem.x, VO);
    hen(VO, () => { hu.rung(0.14, 0.55); for (let i = 0; i < so(40); i++) { const a = ngau(0, 6.28), t = ngau(2, 7); bo.hat("sang", { p: diem.clone(), v: V(Math.cos(a) * t, Math.sin(a) * t, ngau(-1, 1)), can: 2, song: ngau(0.4, 0.9), co: 0.07, keoDai: 0.05, mau, sang: 2.4 }); } });
    toiTroi("#0d0618", 0.5, giay);
    nhom.userData.huy = () => rt.dispose();
    return giay;
  }

  // ================== 6) MƯA MŨI TÊN ==================
  // o: { tu (chỗ cung thủ đứng bắn, phía sau người ra chiêu), tam (giữa vùng rơi), r, dot (số loạt), moiDot (tên / loạt),
  //      cach (giây giữa 2 loạt), bay (giây bay), mau (vệt sáng), trungTam(p) (gọi khi tên cắm gần tâm) }
  function muaTen({ tu = V(-4.5, 1, -0.3), tam = V(1.6, 0, 0), r = 1.8, dot = 3, moiDot = 14, cach = 0.55, bay = 1.5, mau = "#fff1c4", trungTam = null } = {}) {
    for (let d = 0; d < dot; d++) hen(d * cach, () => {
      keu("tenBan", tu.x, bay);
      const n = so(moiDot);
      for (let i = 0; i < n; i++) {
        const tre = ngau(0, 0.18);
        hen(tre, () => {
          if (dsTen.length >= N_TEN) dsTen.shift();
          const a = ngau(0, 6.28), dd = Math.sqrt(Math.random()) * r;
          const dich = V(Math.max(-3.2, Math.min(3.2, tam.x + Math.cos(a) * dd)), 0.05, Math.max(-3, Math.min(1.5, tam.z + Math.sin(a) * dd * 0.6)));
          const p = tu.clone().add(V(ngau(-0.6, 0.6), ngau(-0.2, 0.3), ngau(-0.6, 0.6)));
          const tb = bay * ngau(0.9, 1.1), G = 9.8;
          const v = dich.clone().sub(p).divideScalar(tb); v.y += 0.5 * G * tb;
          dsTen.push({ p, v, G, con: tb, cam: 0, tich: 0, mau, gan: dich.distanceTo(tam) < 0.75 });
          if (i % 4 === 0) bo.hat("sang", { p: p.clone(), song: 0.12, co: 0.25, mau: "#fff8e0", mo: 0.6 });
        });
      }
    });
    hen(bay, () => hu.rung(0.02, 0.2));
    muaTen.trungTam = trungTam;
    return dot * cach + bay + 1.6;
  }
  // tên: thân + mũi (một khối tiện tròn) + lông đuôi (2 tấm chéo), dựng dọc trục +z
  const N_TEN = nhe ? 40 : 90;
  const hinhTen = new THREE.LatheGeometry([new THREE.Vector2(0, -0.36), new THREE.Vector2(0.011, -0.36), new THREE.Vector2(0.011, 0.27), new THREE.Vector2(0.032, 0.27), new THREE.Vector2(0, 0.37)], 6).rotateX(Math.PI / 2);
  const hinhLong = new THREE.BufferGeometry();
  hinhLong.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, -0.36, 0, 0.05, -0.33, 0, 0, -0.2, 0, -0.05, -0.33, 0.05, 0, -0.33, -0.05, 0, -0.33], 3));
  hinhLong.setIndex([0, 1, 2, 0, 2, 3, 0, 4, 2, 0, 2, 5]); hinhLong.computeVertexNormals();
  const tenMesh = new THREE.InstancedMesh(hinhTen, new THREE.MeshLambertMaterial({ color: "#6b4a2b", emissive: "#2a1a0c" }), N_TEN);
  const longMesh = new THREE.InstancedMesh(hinhLong, new THREE.MeshBasicMaterial({ color: "#f2ead8", side: THREE.DoubleSide }), N_TEN);
  for (const m of [tenMesh, longMesh]) { m.count = 0; m.frustumCulled = false; canh.add(m); }
  const dsTen = [], TRUC_Z = V(0, 0, 1), huongTen = V();
  function capNhatTen(dt) {
    for (let i = dsTen.length - 1; i >= 0; i--) {
      const a = dsTen[i];
      if (a.cam) { a.cam += dt; if (a.cam > 1.6) dsTen.splice(i, 1); continue; }
      a.v.y -= a.G * dt; a.p.addScaledVector(a.v, dt); a.con -= dt;
      a.tich += dt; if (a.tich > (nhe ? 0.06 : 0.035)) { a.tich = 0; bo.hat("sang", { p: a.p.clone(), v: a.v.clone().multiplyScalar(0.05), song: 0.18, co: 0.035, keoDai: 0.03, mau: a.mau, mo: 0.55, sang: 1.3 }); }
      if (a.con <= 0) { // cắm xuống đất: bụi + tia nhỏ
        a.cam = 0.0001; a.p.y = Math.max(0.12, a.p.y);
        keu("tenCam", a.p.x);
        bo.hat("khoi", { p: V(a.p.x, 0.1, a.p.z), v: V(ngau(-0.3, 0.3), ngau(0.2, 0.5), 0), song: 0.7, co: 0.25, coCuoi: 0.6, mau: "#a8977c", mo: 0.5 });
        for (let k = 0; k < 2; k++) bo.hat("sang", { p: V(a.p.x, 0.08, a.p.z), v: V(ngau(-1.5, 1.5), ngau(1, 2.5), ngau(-0.8, 0.8)), g: 9, song: 0.3, co: 0.04, keoDai: 0.03, mau: "#ffe9b0", sang: 1.6 });
        if (a.gan && muaTen.trungTam) muaTen.trungTam(a.p);
      }
    }
    dsTen.forEach((a, i) => {
      huongTen.copy(a.v).normalize(); qt.setFromUnitVectors(TRUC_Z, huongTen);
      const co = a.cam > 1.2 ? Math.max(0.001, 1 - (a.cam - 1.2) / 0.4) : 1; // cắm 1,2 giây rồi tan
      mt.compose(a.p, qt, cs.setScalar(co)); tenMesh.setMatrixAt(i, mt); longMesh.setMatrixAt(i, mt);
    });
    tenMesh.count = longMesh.count = dsTen.length;
    tenMesh.instanceMatrix.needsUpdate = longMesh.instanceMatrix.needsUpdate = true;
  }

  // ================== 7) CHƯỞNG SÓNG NĂNG LƯỢNG ==================
  // Gồng tụ cầu sáng (hạt bị hút vào, đất rung), rồi bắn luồng sáng lớn xuyên qua mục tiêu.
  // o: { tu (giữa hai tay), den (điểm cuối luồng), trung (điểm trúng, mặc định giữa đường), mau, gom (giây gồng),
  //      ban (giây bắn), co (bán kính luồng) }  -> giây diễn
  const DINH_CHUONG = "varying vec3 vN; varying vec3 vV; varying vec2 vUv; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }";
  const MANH_CHUONG = "uniform vec3 uMau; uniform float uT, uMo, uLoi; varying vec3 vN; varying vec3 vV; varying vec2 vUv;" +
    "void main(){ float f = abs(dot(vN, vV)); float song = 0.78 + 0.22 * sin(vUv.y * 46.0 - uT * 38.0) * sin(vUv.x * 18.0 + uT * 9.0);" +
    " float a = pow(f, mix(1.6, 0.6, uLoi)) * song; vec3 c = mix(uMau, vec3(1.0), pow(f, 4.0) * 0.9 * uLoi) * (0.75 + 0.55 * uLoi);" +
    " gl_FragColor = vec4(c * a * uMo, 1.0);" + KET_MAU + "}";
  function chuongNangLuong({ tu = V(-0.9, 1.05, 0.25), den = V(5.5, 1, 0), trung = null, mau = "#2fa8ff", gom = 1.3, ban = 1.4, co = 0.42 } = {}) {
    trung = trung || tu.clone().lerp(den, 0.5);
    keu("chuong", tu.x, gom, ban);
    // 1. gồng: cầu sáng lớn dần, hạt + tia điện hút vào, bụi xoáy dưới chân
    const cau = new THREE.Group();
    const lop = [["#ffffff", 0.5], [mau, 1.2], [mau, 2.2]].map(([m, k]) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.hoSang, color: m, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); s.userData.k = k; cau.add(s); return s; });
    cau.position.copy(tu); cau.renderOrder = 14;
    let tich = 0;
    them(cau, gom + ban + 0.2, (k, dt, t) => {
      const tg = k * (gom + ban + 0.2), lon = tg < gom ? mem(0, gom, tg) : tg < gom + ban ? 1 : 1 - (tg - gom - ban) / 0.2;
      for (const s of lop) { s.scale.setScalar(co * 1.9 * s.userData.k * lon * (1 + 0.12 * Math.sin(t * 40 + s.userData.k))); s.material.opacity = Math.min(1, lon * 1.2) / s.userData.k; }
      if (tg < gom) {
        tich += dt * so(70);
        while (tich >= 1) { tich -= 1; const h = V(ngau(-1, 1), ngau(-1, 1), ngau(-1, 1)).normalize().multiplyScalar(ngau(1.1, 1.8)), s0 = ngau(0.35, 0.6); bo.hat("sang", { p: tu.clone().add(h), v: h.clone().multiplyScalar(-1 / s0), song: s0, co: 0.05, keoDai: 0.035, mau, sang: 2, moCuoi: 0.9, hienDan: 0.3 }); }
        if (Math.random() < 0.25) bo.hat("khoi", { p: V(tu.x, 0.1, tu.z), song: 0.8, co: 0.5, coCuoi: 1.3, mau: "#9fb0bb", mo: 0.2, quy: { r: ngau(0.6, 1.1), a: ngau(0, 6.28), w: 4, vr: -0.6 } });
        if (Math.random() < 0.06) hu.rung(0.015 + 0.03 * tg / gom, 0.12);
      }
    });
    chieuSang(V(tu.x + 0.3, tu.y, tu.z + 0.6), mau, 9, gom + ban + 0.3);
    toiTroi("#0b1a2e", 0.45, gom + ban + 0.9);
    // 2. bắn: luồng sáng hình trụ (lõi trắng + vỏ màu), dài ra trong 0,15 giây, giữ, rồi thu mảnh lại
    hen(gom, () => {
      const huong = den.clone().sub(tu), dai = huong.length(); huong.normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(V(1, 0, 0), huong);
      const hinh = new THREE.CylinderGeometry(1, 1, 1, 28, 1, true).rotateZ(-Math.PI / 2).translate(0.5, 0, 0);
      const luong = new THREE.Group(); luong.position.copy(tu); luong.quaternion.copy(q); luong.renderOrder = 15;
      const vls = [[mau, 1, 0], ["#ffffff", 0.38, 1]].map(([m, k, loi]) => {
        const vl = new THREE.ShaderMaterial({ uniforms: { uMau: { value: new THREE.Color(m) }, uT: { value: 0 }, uMo: { value: 1 }, uLoi: { value: loi } }, vertexShader: DINH_CHUONG, fragmentShader: MANH_CHUONG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
        const m3 = new THREE.Mesh(hinh, vl); m3.userData.k = k; luong.add(m3); return vl;
      });
      let t0 = 0, tichT = 0;
      them(luong, ban, (k, dt) => {
        t0 += dt;
        const ra = mem(0, 0.15, t0), thu = 1 - mem(ban - 0.3, ban, t0), r = co * (0.35 + 0.65 * ra) * (0.25 + 0.75 * thu) * (1 + 0.08 * Math.sin(t0 * 55));
        luong.children.forEach(m3 => m3.scale.set(dai * ra, r * m3.userData.k, r * m3.userData.k));
        for (const vl of vls) { vl.uniforms.uT.value = t0; vl.uniforms.uMo.value = thu; }
        // chỗ trúng: chớp, tia văng ngược, khói; bụi bị thổi dọc đường luồng
        tichT += dt;
        if (t0 > 0.12 && tichT > (nhe ? 0.06 : 0.03) && thu > 0.3) {
          tichT = 0;
          for (let i = 0; i < 2; i++) bo.hat("sang", { p: trung.clone(), v: V(ngau(-5, -1), ngau(-3, 4), ngau(-3, 3)), g: 6, can: 1.5, song: ngau(0.3, 0.6), co: 0.06, keoDai: 0.04, mau, sang: 2.2 });
          if (Math.random() < 0.4) bo.hat("sang", { p: trung.clone(), song: 0.08, co: co * 4, mau, sang: 1, mo: 0.3 });
          if (Math.random() < 0.5) bo.hat("khoi", { p: trung.clone().add(V(0, -0.2, 0)), v: V(ngau(1, 2.5), ngau(0.3, 1.2), ngau(-0.6, 0.6)), song: 1, co: 0.6, coCuoi: 1.6, mau: "#c4d2dc", mo: 0.4 });
          const x = ngau(0, 1); const p = tu.clone().lerp(den, x);
          bo.hat("khoi", { p: V(p.x, 0.12, p.z), v: V(huong.x * 2, ngau(0.3, 0.8), ngau(-0.8, 0.8)), can: 1.5, song: 0.8, co: 0.35, coCuoi: 1, mau: "#b3a48a", mo: 0.4 });
        }
        if (Math.random() < 0.3) hu.rung(0.05, 0.15);
      });
      hu.chop(tu, "#ffffff", 2, 0.2, 0.6);
      hu.songXung(V(tu.x, 0, tu.z), mau, 2.4, 0.5);
      hu.songXung(V(trung.x, 0, trung.z), mau, 3, 0.7);
      hu.rung(0.1, 0.4);
      vetDat(V(trung.x, 0, trung.z), TEX.ho, { co: 2, giay: 5, mo: 0.7, moTu: 0.8 });
      chieuSang(trung.clone().add(V(0, 0.4, 0.6)), mau, 18, ban);
    });
    return gom + ban + 0.9;
  }

  // ================== cập nhật mỗi khung ==================
  function capNhat(dt, t) {
    for (let i = viec.length - 1; i >= 0; i--) {
      const v = viec[i];
      if (v.tre > 0) { v.tre -= dt; if (v.tre > 0) continue; }
      if (v.giay == null) { viec.splice(i, 1); v.fn(); continue; }
      v.t += dt; const k = Math.min(1, v.t / v.giay); v.fn(k, dt, t);
      if (k >= 1) viec.splice(i, 1);
    }
    for (let i = vat.length - 1; i >= 0; i--) {
      const v = vat[i]; v.con -= dt; const k = Math.min(1, 1 - Math.max(0, v.con) / v.tong);
      v.cap(k, dt, t);
      if (v.o.userData.nhip) v.o.material.opacity *= 0.65 + 0.35 * Math.sin(t * 18);
      if (v.con <= 0) { xoaVat(v); if (v.o.userData.huy) v.o.userData.huy(); vat.splice(i, 1); }
    }
    // đèn chiêu: lấy cái mạnh nhất đang sống, chập chờn như lửa
    let tot = null, cuong = 0;
    for (let i = dsSang.length - 1; i >= 0; i--) {
      const s = dsSang[i]; s.con -= dt; if (s.con <= 0) { dsSang.splice(i, 1); continue; }
      const k = 1 - s.con / s.tong, c = s.cuong * mem(0, 0.1, k) * (1 - mem(0.7, 1, k));
      if (c > cuong) { cuong = c; tot = s; }
    }
    den.intensity = cuong * (0.85 + 0.15 * Math.sin(t * 23) * Math.sin(t * 7));
    if (tot) { den.position.copy(tot.p); den.color.copy(tot.mau); }
    // trời tối
    let muc = 0; const mauToi = mauTam.set(0, 0, 0);
    for (let i = dsToi.length - 1; i >= 0; i--) {
      const s = dsToi[i]; s.t += dt; if (s.t >= s.giay) { dsToi.splice(i, 1); continue; }
      const m = s.muc * mem(0, 0.5, s.t) * (1 - mem(s.giay - 0.9, s.giay, s.t));
      if (m > muc) { muc = m; mauToi.copy(s.mau); }
    }
    if (muc > 0.001 || goc) {
      if (!goc) goc = { nen: canh.background && canh.background.isColor ? canh.background.clone() : null, suong: canh.fog ? canh.fog.color.clone() : null, hemi: hemi ? hemi.intensity : 0, nang: ctx.nang.intensity };
      if (goc.nen) canh.background.copy(goc.nen).lerp(mauToi, muc);
      if (goc.suong) canh.fog.color.copy(goc.suong).lerp(mauToi, muc);
      if (hemi) hemi.intensity = goc.hemi * (1 - 0.75 * muc);
      ctx.nang.intensity = goc.nang * (1 - 0.8 * muc);
      if (muc <= 0.001 && !dsToi.length) goc = null;
    }
    // đá văng
    for (let i = dsDa.length - 1; i >= 0; i--) {
      const d = dsDa[i]; d.con -= dt;
      if (d.con <= 0) { dsDa.splice(i, 1); continue; }
      if (d.quy) { // bị lốc cuốn
        d.quy.a += d.quy.w * dt; d.quy.r = Math.min(1.4, d.quy.r + dt * 0.35);
        d.p.set(d.quy.tam.x + Math.cos(d.quy.a) * d.quy.r, Math.min(3.8, d.p.y + d.quy.vy * dt), d.quy.tam.z + Math.sin(d.quy.a) * d.quy.r * 0.8);
      } else {
        d.v.y -= 13 * dt; d.p.addScaledVector(d.v, dt);
        if (d.p.y < d.co * 0.6) { d.p.y = d.co * 0.6; d.v.y *= -0.3; d.v.x *= 0.55; d.v.z *= 0.55; d.tw *= 0.5; }
      }
      qv.setFromAxisAngle(d.w, d.tw * dt); d.q.premultiply(qv);
    }
    dsDa.forEach((d, i) => { const s = d.co * Math.min(1, d.con / 0.3); mt.compose(d.p, d.q, cs.setScalar(s)); daMesh.setMatrixAt(i, mt); });
    daMesh.count = dsDa.length; daMesh.instanceMatrix.needsUpdate = true;
    // cột đá trồi: lên nhanh (vọt quá chút), đứng, rồi lún xuống
    for (let i = dsGai.length - 1; i >= 0; i--) { const g = dsGai[i]; g.t += dt; if (g.t > 0.12 + g.giu + 0.4) dsGai.splice(i, 1); }
    dsGai.forEach((g, i) => {
      const len = g.t < 0.12 ? 1 - Math.pow(1 - g.t / 0.12, 3) * 1 : 1, xuong = g.t > 0.12 + g.giu ? (g.t - 0.12 - g.giu) / 0.4 : 0;
      const h = g.cao * (len * (1 + 0.15 * Math.sin(Math.min(1, g.t / 0.2) * Math.PI))) * (1 - xuong);
      truc.set(-Math.sin(g.a), 0, Math.cos(g.a)); qt.setFromAxisAngle(truc, g.nghieng);
      mt.compose(cs.set(g.x, -0.05 - xuong * 0.2, g.z), qt, new THREE.Vector3(g.ban, Math.max(0.001, h), g.ban)); gaiMesh.setMatrixAt(i, mt);
    });
    gaiMesh.count = dsGai.length; gaiMesh.instanceMatrix.needsUpdate = true;
    capNhatTen(dt);
  }

  return { capNhat, muaLua, thienThach, locXoay, damDat, voKhongGian, muaTen, chuongNangLuong };
}
// 30/10/2026 - BƯỚC: TC_D05B2
