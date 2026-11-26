// ================================================================
// FILE: dt/3d/dt3d_toan_man_hinh.js  (ES module) - CHƠI TOÀN MÀN HÌNH TRÊN ĐIỆN THOẠI (màn Thung lũng)
// CHỨC NĂNG: Người dùng 26/11/2026: "trên điện thoại có thể cho full màn hình để ẩn thanh địa chỉ, tiêu đề
//            trình duyệt không?". Android (Chrome, Samsung Internet) có Fullscreen API: trình duyệt chỉ cho bật
//            SAU MỘT CÚ CHẠM của bé ⇒ mỗi cú chạm (pointerup, bắt ở pha capture trước mọi bảng chặn chạm) mà
//            lựa chọn đang Bật và chưa toàn màn hình thì xin bật. Bé thoát bằng nút quay lại ⇒ cú chạm sau bật lại.
//            Chạm trong khung trận (iframe cùng nguồn phủ lên bản đồ) cũng tính: nối thêm vào mỗi iframe mới.
//            Lựa chọn Bật / Tắt ở ⚙️ Cài đặt (dt3d_cai_dat.js), máy nhớ (localStorage kc_dt_toan_man_hinh, mặc định Bật).
//            Chỉ điện thoại / máy tính bảng (chạm, không rê chuột). Máy tính và trình duyệt không có API
//            (iPhone Safari) ⇒ hoTro = false: không tự bật, Cài đặt ẩn dòng này. iPhone: KC_04 (manifest).
// HÀM KHAI RA:
//   taoToanManHinh() -> { hoTro, batChon(), datBat(b), dangToan() }
//     batChon(): lựa chọn của bé (true = Bật); datBat(b): đổi lựa chọn (gọi trong cú chạm: Bật thì vào ngay, Tắt thì thoát);
//     dangToan(): đang toàn màn hình không
// BƯỚC: TC_D06D7
// NGÀY: 26/11/2026
// ================================================================

const KHOA = "kc_dt_toan_man_hinh";

function docChon() { try { return localStorage.getItem(KHOA) !== "0"; } catch (e) { return true; } }
function luuChon(b) { try { localStorage.setItem(KHOA, b ? "1" : "0"); } catch (e) { /* bị chặn: chỉ nhớ trong phiên */ } }

export function taoToanManHinh() {
  const goc = document.documentElement;
  const xin = goc.requestFullscreen || goc.webkitRequestFullscreen;
  const coApi = !!xin && (document.fullscreenEnabled || document.webkitFullscreenEnabled);
  let chamTay = false;
  try { chamTay = matchMedia("(hover: none) and (pointer: coarse)").matches; } catch (e) { /* trình duyệt cũ */ }
  // window.__dtToanManHinhThu = true: kịch bản thử Chrome (máy tính) giả làm điện thoại
  const hoTro = coApi && (chamTay || window.__dtToanManHinhThu === true);
  let bat = docChon();

  const dangToan = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  function vao() {
    if (!hoTro || !bat || dangToan()) return;
    try {
      const p = xin.call(goc, { navigationUI: "hide" });
      if (p && p.catch) p.catch(() => { /* chưa có cú chạm / trình duyệt từ chối: chờ cú chạm sau */ });
    } catch (e) { /* thôi */ }
  }
  function ra() {
    if (!dangToan()) return;
    const thoat = document.exitFullscreen || document.webkitExitFullscreen;
    try { const p = thoat.call(document); if (p && p.catch) p.catch(() => {}); } catch (e) { /* thôi */ }
  }

  if (hoTro) {
    const nghe = w => { try { w.addEventListener("pointerup", vao, true); } catch (e) { /* khung khác nguồn */ } };
    nghe(window);
    // khung trận (iframe) nuốt cú chạm của trang ngoài ⇒ nối vào mỗi iframe khi nó tải xong
    const noiKhung = fr => {
      if (fr.__dtTmh) return; fr.__dtTmh = true;
      fr.addEventListener("load", () => nghe(fr.contentWindow));
      if (fr.contentWindow) nghe(fr.contentWindow);
    };
    for (const fr of document.querySelectorAll("iframe")) noiKhung(fr);
    new MutationObserver(ds => {
      for (const d of ds) for (const n of d.addedNodes) {
        if (n.nodeType !== 1) continue;
        if (n.tagName === "IFRAME") noiKhung(n); else for (const fr of n.querySelectorAll("iframe")) noiKhung(fr);
      }
    }).observe(document.body, { childList: true, subtree: true });
  }

  return {
    hoTro,
    batChon: () => bat,
    datBat(b) { bat = !!b; luuChon(bat); if (bat) vao(); else ra(); },
    dangToan,
  };
}
