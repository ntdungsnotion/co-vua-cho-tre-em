// ================================================================
// FILE: dt/dt_cau_hinh.js
// CHỨC NĂNG: NẠP SỐ CÂN BẰNG của Đấu Trường Tri Thức = SỐ MẶC ĐỊNH (file JSON trong du_lieu/) + PHẦN QUẢN TRỊ ĐÃ SỬA
//            (Supabase, RPC kc_dt_cau_hinh_qt; trang Quản trị › Đấu Trường › Thông số, TC_D18A). Máy chủ Supabase trộn
//            cùng một luật (SQL kc_dt_tron) nên máy bé và máy chủ thấy cùng số.
//            Chưa có Supabase / mất mạng / chưa chạy SQL TC_D18A -> dùng số mặc định (game vẫn chạy).
// HÀM KHAI RA (goc.KC_DT_CAU_HINH):
//   tai(ten, url) -> Promise<json>   ten: "cau_hinh" | "cau_hinh_tran_dau" | "cau_hinh_trinh_do"; url: đường tới file mặc định
//   layPhanSua() -> Promise<{ ten: phần sửa }>  (hỏi máy chủ MỘT lần mỗi trang, chờ tối đa 5 giây)
//   tron(macDinh, sua) -> json        object trộn từng khoá (đệ quy); mảng / số / chữ: sua thay trọn
//   khac(macDinh, hienTai) -> phần sửa (chỉ các ô khác mặc định; undefined = không khác)
//   TEP: danh sách 3 file quản trị sửa được
// Không đụng DOM: chạy được trong node (kiểm thử).
// BƯỚC: TC_D18A - NGÀY: 10/11/2026
// ================================================================
(function (goc) {
  "use strict";

  const TEP = ["cau_hinh", "cau_hinh_tran_dau", "cau_hinh_trinh_do"];
  const CHO_TOI_DA_MS = 5000;
  const laObj = v => v !== null && typeof v === "object" && !Array.isArray(v);

  function tron(a, b) {
    if (b === undefined || b === null) return a;
    if (!laObj(a) || !laObj(b)) return b;
    const kq = Object.assign({}, a);
    Object.keys(b).forEach(k => { kq[k] = tron(a[k], b[k]); });
    return kq;
  }

  function giong(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

  function khac(macDinh, hienTai) {
    if (laObj(macDinh) && laObj(hienTai)) {
      const kq = {};
      Object.keys(hienTai).forEach(k => {
        const d = khac(macDinh[k], hienTai[k]);
        if (d !== undefined) kq[k] = d;
      });
      return Object.keys(kq).length ? kq : undefined;
    }
    return giong(macDinh, hienTai) ? undefined : hienTai;
  }

  let hoaSua = null;
  function layPhanSua() {
    if (hoaSua) return hoaSua;
    const sb = goc.kcSupabaseClient || goc.supabaseClient;
    if (!sb || typeof sb.rpc !== "function") return (hoaSua = Promise.resolve({}));
    const hoi = Promise.resolve(sb.rpc("kc_dt_cau_hinh_qt")).then(kq => {
      const d = kq && !kq.error ? kq.data : null;
      return d && d.thanhCong && laObj(d.sua) ? d.sua : {};
    }).catch(() => ({}));
    const hetGio = new Promise(xong => setTimeout(() => xong({}), CHO_TOI_DA_MS));
    return (hoaSua = Promise.race([hoi, hetGio]));
  }

  function tai(ten, url) {
    const md = fetch(url, { cache: "no-cache" }).then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });
    return Promise.all([md, layPhanSua()]).then(([m, sua]) => tron(m, sua[ten]));
  }

  goc.KC_DT_CAU_HINH = { TEP, tai, layPhanSua, tron, khac };
})(typeof window !== "undefined" ? window : globalThis);
