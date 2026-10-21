/* ================================================================
   FILE: chung/nv_san_khau.js
   CHỨC NĂNG: "SÂN KHẤU" cho các canvas có nhân vật động (dùng chung toàn app).
              - Một vòng requestAnimationFrame cho mọi canvas đã đăng ký.
              - Tự đặt kích thước điểm ảnh theo khổ hiển thị x devicePixelRatio (nét trên
                điện thoại), hàm vẽ nhận (c, rong, cao, t) theo điểm ảnh CSS.
              - Canvas đang ẩn hoặc ngoài màn hình thì không vẽ (đỡ tốn pin).
              - Máy bật "giảm chuyển động": chỉ vẽ một khung đứng yên, vẽ lại khi đổi cỡ
                hoặc khi gọi veLai().
   BƯỚC: TC_D01
   NGÀY: 21/10/2026
   ================================================================ */
(function (goc) {
  "use strict";
  const ds = new Map(); // canvas -> { ve, thay }
  const T_TINH = 1.3;   // thời điểm vẽ khi giảm chuyển động
  let dangChay = false;
  const giamChuyenDong = () => !!(goc.matchMedia && goc.matchMedia("(prefers-reduced-motion: reduce)").matches);

  function veMot(cv, muc, t) {
    const rong = cv.clientWidth, cao = cv.clientHeight;
    if (!rong || !cao) return;
    const dpr = Math.min(goc.devicePixelRatio || 1, 2.5);
    const W = Math.round(rong * dpr), H = Math.round(cao * dpr);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    const c = cv.getContext("2d");
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, rong, cao);
    muc.ve(c, rong, cao, t);
  }

  function lap(ms) {
    if (!ds.size || giamChuyenDong()) { dangChay = false; return; }
    const t = ms / 1000;
    ds.forEach((muc, cv) => { if (muc.thay !== false && cv.isConnected) veMot(cv, muc, t); });
    requestAnimationFrame(lap);
  }

  function batDau() {
    if (dangChay || giamChuyenDong()) return;
    dangChay = true; requestAnimationFrame(lap);
  }

  const quan = typeof IntersectionObserver !== "undefined"
    ? new IntersectionObserver(muc => muc.forEach(m => { const x = ds.get(m.target); if (x) x.thay = m.isIntersecting; }))
    : null;

  /** Đăng ký canvas; ve(c, rong, cao, t) được gọi mỗi khung hình. */
  function dang(cv, ve) {
    if (!cv) return;
    ds.set(cv, { ve, thay: true });
    if (quan) quan.observe(cv);
    veMot(cv, ds.get(cv), T_TINH);
    batDau();
  }
  function huy(cv) { ds.delete(cv); if (quan && cv) quan.unobserve(cv); }
  /** Vẽ lại ngay (sau khi đổi lựa chọn; cần khi giảm chuyển động). */
  function veLai(cv) {
    const muc = ds.get(cv);
    if (muc) veMot(cv, muc, giamChuyenDong() ? T_TINH : performance.now() / 1000);
  }
  goc.addEventListener && goc.addEventListener("resize", () => ds.forEach((muc, cv) => veMot(cv, muc, giamChuyenDong() ? T_TINH : performance.now() / 1000)));

  goc.KC_SAN_KHAU = { dang, huy, veLai };
})(typeof window !== "undefined" ? window : globalThis);
