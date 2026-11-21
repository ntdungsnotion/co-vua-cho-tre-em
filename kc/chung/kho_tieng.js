/* ================================================================
   FILE: chung/kho_tieng.js
   CHỨC NĂNG: KHO TIẾNG CHUNG toàn app (KC_09B1). File âm thanh quản trị tải lên từ Quản trị › 🎵 Kho tiếng
              (Supabase Storage, bucket riêng "kc-am-thanh"; danh sách ở bảng kc_am_thanh_kho). Mọi nơi chọn tiếng /
              nhạc (Đấu Trường › Thông số › 🔊 Âm thanh, Âm thanh chung KC_09B2...) trộn kho này vào thư viện file sẵn
              trong repo, cùng một dạng mục:
                nhac[]:  { ma: "kho_<id>", ten, tep: <đường dẫn đầy đủ>, boiCanh: [], lap, amLuong, giay, kho: true }
                tieng[]: { ma: "kho_<id>", ten, nhom: "kho", tep: [<đường dẫn đầy đủ>], amLuong, giay, kho: true }
              Mã "kho_<id>" là thứ cài đặt lưu (ô "file" / "nhac.<bối cảnh>").
   DÙNG (window.KC_KHO_TIENG, nạp bằng <script> hoặc import "…/chung/kho_tieng.js" trong ES module):
     ds({ moi })          Promise<{ nhac, tieng }> kho tải lên (nhớ trong trang; moi: hỏi lại máy chủ). Không có
                          Supabase / lỗi mạng / quá 5 giây -> kho rỗng (game vẫn chạy bằng thư viện sẵn + tiếng tự tạo).
     tron(tv, kho)        thư viện sẵn + kho -> { nhac, tieng } (mục kho nối sau, trùng mã thì bỏ)
     urlTep(duongDan)     đường dẫn công khai của một file trong bucket
     baoDoi()             kho vừa đổi (Quản trị tải / sửa / xoá): xoá bộ nhớ, phát sự kiện "kcKhoTiengDoi" trên window
     BUCKET, GIOI_HAN { nhac: 2,5 MB, tieng: 150 KB }, DUOI, MIME   (máy chủ kiểm lại, đây chỉ để báo sớm)
   TÌM SUPABASE: client của trang (kcSupabaseClient / supabaseClient); trang chạy trong khung cùng trang gốc (trận Đấu
              Trường) thì mượn client của trang ngoài.
   BƯỚC: KC_09B1 - NGÀY: 21/11/2026
   ================================================================ */
(function (g) {
  "use strict";
  if (!g || g.KC_KHO_TIENG) return;
  const BUCKET = "kc-am-thanh";
  const GIOI_HAN = { nhac: 2621440, tieng: 153600 };
  const DUOI = ["mp3", "ogg", "wav", "m4a"];
  const MIME = { mp3: "audio/mpeg", ogg: "audio/ogg", wav: "audio/wav", m4a: "audio/mp4" };
  const HEN_GIAY = 5;
  const rong = () => ({ nhac: [], tieng: [] });
  const so = (v, md) => { const n = Number(v); return v != null && isFinite(n) ? n : md; };

  function clientCua(w) {
    try { const c = w && (w.kcSupabaseClient || w.supabaseClient); return c && typeof c.rpc === "function" ? c : null; } catch (e) { return null; }
  }
  function timClient() {
    const c = clientCua(g);
    if (c) return c;
    for (const w of [g.parent, g.top]) {
      try { if (w && w !== g) { const k = clientCua(w); if (k) return k; } } catch (e) { /* khung khác trang gốc */ }
    }
    return null;
  }

  function urlTep(duongDan, c) {
    c = c || timClient();
    if (!c || !c.storage || !duongDan) return null;
    try { return c.storage.from(BUCKET).getPublicUrl(duongDan).data.publicUrl || null; } catch (e) { return null; }
  }

  function doiThuVien(dsMuc, c) {
    const kq = rong();
    for (const m of dsMuc || []) {
      const url = m && urlTep(m.tep, c);
      if (!url || !m.ma) continue;
      if (m.loai === "nhac") kq.nhac.push({ ma: m.ma, ten: m.ten || m.ma, tep: url, boiCanh: [], lap: m.lap !== false, amLuong: so(m.amLuong, 1), giay: m.giay, kho: true });
      else if (m.loai === "tieng") kq.tieng.push({ ma: m.ma, ten: m.ten || m.ma, nhom: "kho", tep: [url], amLuong: so(m.amLuong, 1), giay: m.giay, kho: true });
    }
    return kq;
  }

  let hoa = null;
  function ds(tuyChon) {
    if (hoa && !(tuyChon && tuyChon.moi)) return hoa;
    const c = timClient();
    if (!c) return (hoa = Promise.resolve(rong()));
    const hoi = Promise.resolve().then(() => c.rpc("kc_am_thanh_kho_ds", {})).then(kq => {
      const d = kq && kq.data;
      return d && d.thanhCong && Array.isArray(d.ds) ? doiThuVien(d.ds, c) : rong();
    });
    const hen = new Promise(xong => setTimeout(() => xong(null), HEN_GIAY * 1000));
    const lan = hoa = Promise.race([hoi, hen]).then(k => {
      if (!k) { if (hoa === lan) hoa = null; return rong(); } // quá giờ: lần sau hỏi lại
      return k;
    }).catch(() => { if (hoa === lan) hoa = null; return rong(); });
    return lan;
  }

  function tron(tv, kho) {
    const a = tv || rong(), b = kho || rong();
    const noi = (x, y) => { const co = new Set((x || []).map(m => m.ma)); return (x || []).concat((y || []).filter(m => !co.has(m.ma))); };
    return Object.assign({}, a, { nhac: noi(a.nhac, b.nhac), tieng: noi(a.tieng, b.tieng) });
  }

  function baoDoi() {
    hoa = null;
    try { g.dispatchEvent(new g.CustomEvent("kcKhoTiengDoi")); } catch (e) { /* không có window */ }
  }

  g.KC_KHO_TIENG = { BUCKET, GIOI_HAN, DUOI, MIME, ds, tron, urlTep, baoDoi, timClient };
})(typeof window !== "undefined" ? window : globalThis);
// 21/11/2026 - BƯỚC: KC_09B1
