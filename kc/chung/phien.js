// ================================================================
// FILE: kc/chung/phien.js
// CHỨC NĂNG: MODULE CHUNG toàn app (Cờ Vua + Kids Challenge): PHIÊN ĐĂNG NHẬP CÒN DÙNG ĐƯỢC KHÔNG
//   (Thiet_Ke_Tai_Khoan.md mục 4). Máy chủ giữ mỗi lần đăng nhập một phiên (bảng kc_phien); bé 1 máy,
//   phụ huynh 3, quản trị 3 (chỉnh ở Quản trị › 👥 Tài khoản).
//   - Trang nào nạp file này, hễ thẻ đang có đăng nhập thì TỰ hỏi kc_phien_xem: mở trang, vừa đăng nhập,
//     quay lại thẻ, mỗi giayHoi giây (mặc định 60) lúc thẻ đang hiện, và khi một lệnh bị máy chủ từ chối
//     vì phiên (KC_PHIEN.kiemNgay).
//   - conDung=false: xoá khoá phiên chung, bắn sự kiện "kcMatPhien" {lyDo, vaiTro} trên document (trang tự
//     dọn: dừng game, quên tài khoản đang giữ), rồi hiện hộp báo. Mất mạng / máy chủ chưa có hàm: KHÔNG làm gì.
//   - KC_PHIEN.ketThuc(ten, maPhien): nút Đăng xuất báo máy chủ kết thúc phiên (RPC kc_tk_dang_xuat).
// BƯỚC: KC_00D2-B2 (28/11/2026) - tách từ kc_auth.js PHẦN 4B (KC_00D2-B1).
// PHỤ THUỘC: hàm gọi RPC của trang: kcGoiRpc (kc/kc_api.js) hoặc apiGoiRpc (api.js Cờ Vua). Chỉ dùng lúc
//   chạy nên thứ tự thẻ <script> không quan trọng.
// ================================================================
(function (goc) {
  "use strict";
  var KHOA = "coVuaTaiKhoanDangNhap";   // trùng APP_KHOA_LUU_PHIEN (app.js) và KC_KHOA_PHIEN (kc_auth.js)
  var NHIP_MS = 3000;                   // nhịp xem đã tới lượt hỏi chưa (không phải nhịp gọi máy chủ)
  var CHO_DANG_XUAT_MS = 2000;          // Đăng xuất chờ máy chủ tối đa chừng này rồi đi tiếp
  var giay = 60, lanCuoi = 0, maCuoi = null, dangHoi = false;

  var TRANG_CHU = (function () {
    try {
      var s = document.currentScript && document.currentScript.src;
      if (s) return s.replace(/kc\/chung\/phien\.js(\?.*)?$/, "index.html");
    } catch (e) { /* bỏ qua */ }
    return "index.html";
  })();

  function docPhien() {
    try {
      var p = JSON.parse(goc.sessionStorage.getItem(KHOA) || "null");
      return p && p.tenDangNhap ? p : null;
    } catch (e) { return null; }
  }

  function hamGoi() {
    return typeof goc.kcGoiRpc === "function" ? goc.kcGoiRpc : typeof goc.apiGoiRpc === "function" ? goc.apiGoiRpc : null;
  }

  function goiRpc(ten, thamSo) {
    var goi = hamGoi();
    if (!goi) return Promise.resolve(null);
    try { return Promise.resolve(goi(ten, thamSo)).catch(function () { return null; }); } catch (e) { return Promise.resolve(null); }
  }

  /** Hỏi máy chủ nếu đã tới lượt (ngay = hỏi luôn). */
  function xem(ngay) {
    var p = docPhien();
    if (!p || dangHoi || document.visibilityState === "hidden" || !hamGoi()) return;
    var ma = p.maPhien || "", maMoi = ma !== maCuoi;
    if (maMoi) dongHop();                                   // vừa đăng nhập lại ngay trên trang này
    if (!ngay && !maMoi && Date.now() - lanCuoi < giay * 1000) return;
    maCuoi = ma; lanCuoi = Date.now(); dangHoi = true;
    goiRpc("kc_phien_xem", { p_ten: p.tenDangNhap, p_ma_phien: ma }).then(function (kq) {
      dangHoi = false;
      var nay = docPhien();
      if (!nay || (nay.maPhien || "") !== ma || nay.tenDangNhap !== p.tenDangNhap) return;   // đã đăng xuất / đổi người
      if (kq && kq.thanhCong && kq.conDung === false) { baoMat(kq.lyDo, p.vaiTro); return; }
      if (kq && kq.thanhCong && Number(kq.giayHoi) >= 15) giay = Number(kq.giayHoi);
    });
  }

  function kiemNgay() {
    if (Date.now() - lanCuoi > 2000) xem(true);
  }

  function ketThuc(ten, maPhien) {
    if (!ten || !maPhien) return Promise.resolve();
    return new Promise(function (xong) {
      var hen = setTimeout(xong, CHO_DANG_XUAT_MS);
      goiRpc("kc_tk_dang_xuat", { p_ten: ten, p_ma_phien: maPhien }).then(function () { clearTimeout(hen); xong(); });
    });
  }

  function dongHop() {
    var cu = document.getElementById("kcHopMatPhien");
    if (cu) cu.remove();
  }

  /** Phiên không dùng được nữa: quên đăng nhập (cả Cờ Vua, chung khoá phiên) + hộp báo. */
  function baoMat(lyDo, vaiTro) {
    var laBe = vaiTro !== "phu_huynh" && vaiTro !== "admin";
    var tieuDe, loi;
    if (lyDo === "may_khac") {
      tieuDe = laBe ? "Tài khoản con đang đăng nhập trên máy khác" : "Tài khoản của bạn đang đăng nhập trên máy khác";
      loi = laBe ? "Con đăng nhập lại ở máy này để chơi tiếp nhé!" : "Đăng nhập lại để dùng tiếp trên máy này.";
    } else {
      tieuDe = laBe ? "Con đăng nhập lại nhé!" : "Bạn đăng nhập lại nhé!";
      if (lyDo === "dang_xuat") loi = laBe ? "Tài khoản đã đăng xuất, con đăng nhập lại để chơi tiếp nhé." : "Tài khoản đã đăng xuất.";
      else loi = laBe ? "Lâu rồi con chưa vào, con đăng nhập lại để chơi tiếp nhé." : "Phiên đăng nhập đã hết hạn.";
    }
    try { goc.sessionStorage.removeItem(KHOA); } catch (e) { /* bỏ qua */ }
    try { document.dispatchEvent(new CustomEvent("kcMatPhien", { detail: { lyDo: lyDo, vaiTro: vaiTro } })); } catch (e) { /* bỏ qua */ }

    dongHop();
    var nen = document.createElement("div");
    nen.id = "kcHopMatPhien";
    nen.setAttribute("role", "alertdialog");
    nen.setAttribute("aria-modal", "true");
    nen.setAttribute("aria-labelledby", "kcHopMatPhienTieuDe");
    nen.style.cssText = "position:fixed;inset:0;z-index:2147483000;background:rgba(20,30,50,.55);display:flex;" +
      "align-items:center;justify-content:center;padding:16px;box-sizing:border-box;";
    var hop = document.createElement("div");
    hop.style.cssText = "background:#fff;color:#223;border-radius:18px;max-width:420px;width:100%;padding:24px 20px;" +
      "text-align:center;box-shadow:0 10px 40px rgba(0,0,0,.3);font-size:1.05rem;line-height:1.45;";
    hop.innerHTML = '<div style="font-size:3rem;line-height:1;" aria-hidden="true">' + (lyDo === "may_khac" ? "📱" : "🔑") + "</div>" +
      '<h2 id="kcHopMatPhienTieuDe" style="margin:10px 0 6px;font-size:1.25rem;color:#223;"></h2>' +
      '<p style="margin:0 0 18px;color:#223;"></p>' +
      '<button type="button" style="font:inherit;font-weight:bold;border:0;border-radius:999px;padding:12px 26px;' +
      'background:#2e7dd7;color:#fff;cursor:pointer;min-height:44px;width:auto;">🔑 Đăng nhập lại</button>';
    hop.querySelector("h2").textContent = tieuDe;
    hop.querySelector("p").textContent = loi;
    nen.appendChild(hop);
    document.body.appendChild(nen);
    var nut = hop.querySelector("button");
    nut.addEventListener("click", function () {
      var oTen = document.getElementById("kcOTen");
      if (document.getElementById("kcChuaDangNhap") && oTen) {
        nen.remove();
        try { goc.scrollTo(0, 0); oTen.focus(); } catch (e) { /* bỏ qua */ }
      } else {
        goc.location.href = TRANG_CHU;     // trang không có khối đăng nhập (Cờ Vua, Quản trị, game): về Trang chủ
      }
    });
    try { nut.focus(); } catch (e) { /* bỏ qua */ }
  }

  goc.KC_PHIEN = { kiemNgay: kiemNgay, ketThuc: ketThuc, baoMat: baoMat };

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible" && Date.now() - lanCuoi > 5000) xem(true);
  });
  function batDau() { setTimeout(function () { xem(true); }, 0); setInterval(function () { xem(false); }, NHIP_MS); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", batDau);
  else batDau();
})(window);
