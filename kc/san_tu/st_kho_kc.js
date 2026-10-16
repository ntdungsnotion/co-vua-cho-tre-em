/* ================================================================
   FILE: san_tu/st_kho_kc.js
   CHỨC NĂNG: CẤT KIM CƯƠNG VÀO KHO CỦA BÉ (TC_01). Mỗi màn kết thúc (qua màn hoặc thua),
              kim cương CÒN LẠI của màn (nhặt được trên đường + trong hang + thưởng ôn tập,
              trừ số đã tự đổi thành mạng) được gửi lên máy chủ qua RPC
              kc_santu_cat_kim_cuong và cộng THẲNG vào kho kim cương chung (diem_so).
              Máy chủ tự chặn: trần mỗi màn, trần ngày (mặc định 200), mỗi màn chỉ cộng 1 lần.
              HÀNG CHỜ: mỗi màn được ghi vào localStorage TRƯỚC khi gửi; mất mạng (hoặc máy chủ
              chưa có hàm) thì giữ lại, lần sau mở game / xong màn khác sẽ gửi bù. Mã lượt
              ngẫu nhiên của từng màn giúp gửi lại không bị cộng 2 lần.
              Không cộng: màn Tập chơi, chế độ Xem thử (#xem-...), chưa đăng nhập.
   BƯỚC: TC_01
   NGÀY: 16/10/2026
   ================================================================ */
(function (goc) {
  "use strict";
  const ST = goc.ST = goc.ST || {};
  const SO_CHO_TOI_DA = 60;              // hàng chờ dài nhất (mỗi màn một dòng)
  const NGAY_GIU_TOI_DA = 14;            // màn chờ quá lâu thì bỏ (vd tài khoản đã xóa)

  // Kim cương được cất của một màn: nhặt được - đã đổi mạng (âm thì 0). Kho không bao giờ bị trừ.
  ST.kimCuongCatDuoc = function (g) {
    if (!g) return 0;
    const doi = ((g.thongKe && g.thongKe.mangDoi) | 0) * (ST.CAU_HINH.kimCuongDoiMang | 0);
    return Math.max(0, (g.tongKimCuong | 0) - doi);
  };

  function taoMaLuot() {
    let s = Date.now().toString(36) + "_";
    for (let i = 0; i < 10; i++) s += "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)];
    return s; // khớp ^[A-Za-z0-9_-]{8,64}$ ở máy chủ
  }

  class KhoKimCuong {
    /* tenBe: tên đăng nhập; goiRpc(tenHam, thamSo) -> Promise<{thanhCong, ma, ...}> (kcGoiRpc);
       layPhien() -> phiên đăng nhập hiện tại {tenDangNhap, maPhien} hoặc null */
    constructor(tenBe, goiRpc, layPhien) {
      this.tenBe = tenBe || "";
      this.goiRpc = typeof goiRpc === "function" ? goiRpc : null;
      this.layPhien = layPhien || (() => null);
      this.khoa = "kc_santu_cho_cat_kc_" + (this.tenBe || "khach");
      this.dangGui = null;
      this.daGui = {};                   // maLuot -> kết quả máy chủ (cho màn kết quả đọc lại)
    }
    get coTheCat() { return !!(this.tenBe && this.goiRpc); }
    docCho() {
      try {
        const ds = JSON.parse(localStorage.getItem(this.khoa) || "[]");
        return Array.isArray(ds) ? ds.filter(m => m && typeof m.maLuot === "string") : [];
      } catch (e) { return []; }
    }
    ghiCho(ds) {
      try {
        if (ds.length) localStorage.setItem(this.khoa, JSON.stringify(ds.slice(-SO_CHO_TOI_DA)));
        else localStorage.removeItem(this.khoa);
      } catch (e) { /* hết chỗ / chặn lưu: bỏ qua */ }
    }
    soDangCho() { return this.docCho().reduce((t, m) => t + (m.so | 0), 0); }
    // Ghi một màn vào hàng chờ (chưa gửi). Trả về mục vừa ghi, hoặc null nếu không có gì để cất.
    them(so, chiTiet) {
      so = Math.max(0, so | 0);
      if (!this.tenBe || so <= 0) return null;
      const c = chiTiet || {};
      const muc = { maLuot: taoMaLuot(), so, duong: String(c.duong || ""), man: c.man | 0, cap: String(c.cap || ""), thang: !!c.thang, luc: Date.now() };
      const ds = this.docCho(); ds.push(muc); this.ghiCho(ds);
      return muc;
    }
    /* Gửi lần lượt cả hàng chờ. Trả về Promise<{ ketQua: {maLuot: kết quả máy chủ}, conCho, loiMang, diemSoMoi }>.
       - thành công: bỏ khỏi hàng chờ;
       - máy chủ từ chối hẳn (không phải tài khoản trẻ, mã lượt sai): bỏ;
       - lỗi mạng / máy chủ chưa có hàm / phiên hết hạn: giữ lại, dừng, lần sau gửi bù. */
    gui() {
      if (this.dangGui) return this.dangGui.then(() => this.gui());
      const tong = { ketQua: {}, conCho: 0, loiMang: false, diemSoMoi: null };
      if (!this.coTheCat) { tong.conCho = this.docCho().length; return Promise.resolve(tong); }
      const quaHan = Date.now() - NGAY_GIU_TOI_DA * 864e5;
      const chay = () => {
        const ds = this.docCho().filter(m => !(m.luc < quaHan));
        this.ghiCho(ds);
        const phien = this.layPhien();
        if (!ds.length || !phien || phien.tenDangNhap !== this.tenBe) { tong.conCho = ds.length; return Promise.resolve(tong); }
        const m = ds[0];
        return new Promise(r => r(this.goiRpc("kc_santu_cat_kim_cuong", {
          p_ten: this.tenBe, p_ma_phien: phien.maPhien || "", p_ma_luot: m.maLuot, p_so: m.so | 0,
          p_duong: m.duong, p_man: m.man | 0, p_cap: m.cap, p_thang: !!m.thang
        }))).catch(() => null).then(kq => {
          const boDi = kq && (kq.thanhCong === true || kq.ma === "khong_phai_tre" || kq.ma === "ma_luot_sai");
          if (!boDi) { tong.loiMang = !(kq && kq.ma); tong.conCho = ds.length; return tong; }
          tong.ketQua[m.maLuot] = this.daGui[m.maLuot] = kq;
          if (kq.thanhCong && typeof kq.diemSoMoi === "number") tong.diemSoMoi = kq.diemSoMoi;
          this.ghiCho(this.docCho().filter(x => x.maLuot !== m.maLuot));
          return chay();
        });
      };
      this.dangGui = chay().finally(() => { this.dangGui = null; });
      return this.dangGui;
    }
  }
  ST.KhoKimCuong = KhoKimCuong;
})(typeof window !== "undefined" ? window : globalThis);
