/* ================================================================
   FILE: kc/tu_vung/tu_vung.js
   CHỨC NĂNG: KHO TỪ VỰNG TIẾNG ANH DÙNG CHUNG TOÀN APP (KC_TU_VUNG).
              Mọi game, bài học dùng chung một kho, chia 4 cấp khó dần:
                cấp 1 (Dễ), cấp 2 (Trung bình), cấp 3 (Khó), cấp 4 (Thử thách).
              Dữ liệu: kho_tu.json (cùng thư mục), mỗi từ { en, vi, e, cap, cd, hinh, soat, ghiChu }.
              Hình riêng của từ: thư mục hinh/ (SVG, PNG, WebP; tên file theo từ, vd cat.svg).
              Từ chưa có hình riêng (hoặc hình tải lỗi) thì dùng emoji ở cột e.
              Tiến độ học của bé KHÔNG lưu ở đây (xem sổ ghi nhớ của từng game).
   CÁCH DÙNG: KC_TU_VUNG.sanSang.then(...)     chờ tải xong kho (trình duyệt)
              KC_TU_VUNG.cap[1]                -> [{ en, e, vi, cd, hinh }, ...]
              KC_TU_VUNG.khiNap(fn)            gọi fn mỗi khi kho được nạp (và ngay nếu đã nạp)
              KC_TU_VUNG.ganHinh(phanTu, tu)   đặt hình của từ vào một phần tử HTML
              KC_TU_VUNG.anhVe(tu)             ảnh đã tải xong để vẽ lên canvas, chưa có thì null
              KC_TU_VUNG.nap(duLieuJson)       nạp kho từ dữ liệu (Node / kiểm thử)
   BƯỚC: TC_T01
   NGÀY: 17/10/2026
   CẬP NHẬT: 20/10/2026 - TC_T03A: kho từ chuyển sang MỘT file kho_tu.json trên repo (thay 4 file
             tu_cap1..4.js), tải bằng fetch; lần tải được gần nhất nhớ trên máy để mất mạng vẫn chơi.
             Thêm hình riêng của từ (thư mục hinh/), chưa có thì dùng emoji.
   ================================================================ */
(function (goc) {
  "use strict";
  const TV = goc.KC_TU_VUNG = goc.KC_TU_VUNG || {};
  TV.SO_CAP = 4;
  TV.cap = TV.cap || { 1: [], 2: [], 3: [], 4: [] };
  TV.daNap = false;
  TV.loiTai = "";
  const KHOA_NHO = "kc_tu_vung_kho";
  const nghe = [];

  // Thư mục chứa file này (để trang ở thư mục nào cũng tìm đúng kho_tu.json và hinh/)
  let thuMuc = "";
  try { if (goc.document && document.currentScript) thuMuc = document.currentScript.src.replace(/[^/]*$/, ""); } catch (e) { thuMuc = ""; }
  TV.duongKho = thuMuc + "kho_tu.json";
  TV.duongHinh = thuMuc + "hinh/";

  // Nạp kho từ dữ liệu JSON. Giữ nguyên các mảng TV.cap[c] (chỉ thay nội dung) để nơi khác đang giữ mảng vẫn đúng.
  TV.nap = function (du) {
    if (!du || !Array.isArray(du.tu)) throw new Error("kho từ không đúng định dạng (thiếu mảng tu)");
    const moi = { 1: [], 2: [], 3: [], 4: [] };
    du.tu.forEach(t => {
      if (t && t.en && moi[t.cap]) moi[t.cap].push({ en: t.en, e: t.e || "", vi: t.vi || "", cd: t.cd || "", hinh: t.hinh || "" });
    });
    for (let c = 1; c <= TV.SO_CAP; c++) {
      const ds = TV.cap[c] = TV.cap[c] || [];
      ds.length = 0;
      moi[c].forEach(t => ds.push(t));
    }
    TV.daNap = true;
    TV.capNhat = du.capNhat || "";
    nghe.forEach(fn => { try { fn(TV); } catch (e) { console.error(e); } });
    return TV;
  };
  TV.khiNap = function (fn) { nghe.push(fn); if (TV.daNap) fn(TV); };

  // Tải kho (trình duyệt): hỏi lại máy chủ mỗi lần (để từ / hình mới hiện ngay sau khi lưu),
  // mất mạng thì dùng bản nhớ trên máy của lần tải được gần nhất.
  TV.tai = function () {
    const tuMay = () => {
      let chu = null;
      try { chu = localStorage.getItem(KHOA_NHO); } catch (e) { chu = null; }
      if (!chu) throw new Error("không có bản nhớ trên máy");
      return TV.nap(JSON.parse(chu));
    };
    if (typeof fetch !== "function") return Promise.resolve().then(tuMay);
    return fetch(TV.duongKho, { cache: "no-cache" })
      .then(r => { if (!r.ok) throw new Error("máy chủ trả lỗi " + r.status); return r.text(); })
      .then(chu => {
        TV.nap(JSON.parse(chu));
        try { localStorage.setItem(KHOA_NHO, chu); } catch (e) { /* hết chỗ / chặn lưu: bỏ qua */ }
        return TV;
      })
      .catch(loi => {
        try { return tuMay(); } catch (e) { TV.loiTai = String(loi && loi.message || loi); throw loi; }
      });
  };
  // Trình duyệt: tự tải ngay khi nạp file này
  TV.sanSang = goc.document ? TV.tai() : Promise.resolve(TV);
  if (goc.document) TV.sanSang.catch(() => { /* trang tự báo lỗi qua TV.loiTai */ });

  /* ----- HÌNH CỦA TỪ ----- */
  TV.urlHinh = t => (t && t.hinh ? TV.duongHinh + t.hinh : "");
  // Đặt hình vào phần tử: có hình riêng thì <img>, tải lỗi hoặc chưa có thì emoji
  TV.ganHinh = function (el, t) {
    if (!el) return;
    el.textContent = "";
    const u = TV.urlHinh(t);
    if (!u || anhLoi.has(u)) { el.textContent = (t && t.e) || ""; return; }
    const img = document.createElement("img");
    img.className = "hinhRieng"; img.alt = (t.vi || t.en || ""); img.draggable = false; img.decoding = "async";
    img.onerror = () => { anhLoi.add(u); if (img.parentNode === el) el.textContent = t.e || ""; };
    img.src = u;
    el.appendChild(img);
  };
  // Ảnh cho canvas: gọi lần đầu thì bắt đầu tải, tải xong mới trả về ảnh (chưa xong / lỗi: null)
  const khoAnh = new Map(), anhLoi = new Set();
  TV.anhVe = function (t) {
    const u = TV.urlHinh(t);
    if (!u || anhLoi.has(u) || typeof Image === "undefined") return null;
    let a = khoAnh.get(u);
    if (!a) { a = new Image(); a.decoding = "async"; a.onerror = () => anhLoi.add(u); a.src = u; khoAnh.set(u, a); }
    return a.complete && a.naturalWidth > 0 ? a : null;
  };
  // Khóa để so trùng hình (bảng ôn tập không được có 2 thẻ hình giống nhau)
  TV.khoaHinh = t => (t && t.hinh ? "h:" + t.hinh : "e:" + ((t && t.e) || ""));
})(typeof window !== "undefined" ? window : globalThis);
