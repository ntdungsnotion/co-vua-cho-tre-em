// ================================================================
// FILE: dt/3d/dt3d_camera.js  (ES module) - PHẦN VẼ 3D: CAMERA
// CHỨC NĂNG: Camera chéo cố định kiểu Đế Chế (chiếu thẳng, không phối cảnh), cỡ khung
//            theo màn hình (màn to thấy nhiều ô hơn, 1 ô ~ 60 điểm ảnh), kéo bằng 1 ngón /
//            chuột, phóng to bằng 2 ngón / lăn chuột, giới hạn trong bản đồ. Phân biệt
//            CHẠM (nhấc ngón nhanh, không kéo) với KÉO, báo chạm cho phần điều khiển.
// HÀM KHAI RA:
//   taoCamera(ctx, vungVe, { rong, cao }) -> { camera, huong, dich, nhinVe(x, z),
//        chieu(x, y, z) -> { x, y } điểm màn hình, khiCham(fn(e)), datZoom(z), coKhung() }
// LUẬT NỐI: chỉ dùng ctx của dt3d_canh.js (datNangTheo, renderer).
// BƯỚC: TC_D02A (tách từ dt_lang_3d.js của TC_D01C); TC_D03A (chuột phải / giữa không tính là chạm)
// NGÀY: 23/10/2026; 28/10/2026 12:17
// ================================================================
import * as THREE from "three";

const GOC_NGANG = THREE.MathUtils.degToRad(45), GOC_DUNG = THREE.MathUtils.degToRad(36);

export function taoCamera(ctx, vungVe, { rong: W, cao: H }) {
  const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 1, 220);
  const dich = new THREE.Vector3(W / 2, 0, H / 2 + 2);
  const huong = new THREE.Vector3(Math.cos(GOC_NGANG) * Math.cos(GOC_DUNG), Math.sin(GOC_DUNG), Math.sin(GOC_NGANG) * Math.cos(GOC_DUNG));
  const canvas = ctx.renderer.domElement;

  function datCamera() {
    dich.x = THREE.MathUtils.clamp(dich.x, 3, W - 3);
    dich.z = THREE.MathUtils.clamp(dich.z, 3, H - 3);
    camera.position.copy(dich).addScaledVector(huong, 80);
    camera.lookAt(dich);
    camera.updateMatrixWorld();
    ctx.datNangTheo(dich);
  }
  function coKhung() {
    const w = vungVe.clientWidth, h = vungVe.clientHeight;
    ctx.renderer.setSize(w, h);
    // Như Đế Chế: màn hình càng lớn càng thấy nhiều ô (1 ô ~ 60 điểm ảnh), không phóng to hình
    const caoNhin = w < h ? THREE.MathUtils.clamp(8 * h / w, 11, 18) : THREE.MathUtils.clamp(h / 60, 10, 18);
    const a = w / h;
    camera.left = -caoNhin * a / 2; camera.right = caoNhin * a / 2; camera.top = caoNhin / 2; camera.bottom = -caoNhin / 2;
    camera.updateProjectionMatrix();
  }
  function datZoom(z) { camera.zoom = THREE.MathUtils.clamp(z, 0.55, 2.4); camera.updateProjectionMatrix(); }
  const phai = new THREE.Vector3(), truoc = new THREE.Vector3();
  function keoCanh(dx, dy) {
    const donVi1px = (camera.top - camera.bottom) / camera.zoom / canvas.clientHeight;
    phai.setFromMatrixColumn(camera.matrixWorld, 0).setY(0).normalize();
    truoc.set(-huong.x, 0, -huong.z).normalize();
    dich.addScaledVector(phai, -dx * donVi1px).addScaledVector(truoc, dy * donVi1px / Math.sin(GOC_DUNG));
    datCamera();
  }

  // --- Chạm / kéo / phóng to (chuột + ngón tay) ---
  const ngon = new Map(), dsCham = [];
  let keo = null, chumDau = null;
  canvas.style.touchAction = "none";
  canvas.addEventListener("pointerdown", e => {
    if (e.pointerType === "mouse" && e.button !== 0) return; // TC_D03A: chuột phải / giữa không phải chạm (chuột phải = thôi xây)
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
    if (k && !k.di && e.type === "pointerup" && performance.now() - k.t < 600) for (const f of dsCham) f(e);
    keo = null;
  }
  canvas.addEventListener("pointerup", thaNgon);
  canvas.addEventListener("pointercancel", thaNgon);
  canvas.addEventListener("wheel", e => { e.preventDefault(); datZoom(camera.zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12)); }, { passive: false });

  const v = new THREE.Vector3();
  const api = {
    camera, huong, dich, datZoom, coKhung,
    nhinVe(x, z) { dich.set(x, 0, z); datCamera(); },
    // Điểm thế giới -> điểm màn hình (toạ độ trong trang)
    chieu(x, y, z) { v.set(x, y, z).project(camera); const r = canvas.getBoundingClientRect(); return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height }; },
    khiCham(fn) { dsCham.push(fn); }
  };
  coKhung(); datCamera();
  window.addEventListener("resize", () => { coKhung(); datCamera(); });
  new ResizeObserver(() => coKhung()).observe(vungVe);
  return api;
}
// 28/10/2026 12:17 - BƯỚC: TC_D03A
