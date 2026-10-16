/* ================================================================
   FILE: san_tu/st_tien_do.js
   CHỨC NĂNG: TIẾN ĐỘ ĐƯỜNG ĐUA của từng bé (ProgressManager): bé đã mở tới màn nào,
              mỗi màn được mấy sao, đã xong đường đua nào. Lưu trong trình duyệt theo
              tên đăng nhập (máy dùng chung vẫn tách riêng từng bé); chưa đồng bộ lên
              tài khoản (để TC_01).
              Luật mở khóa: qua màn n thì mở màn n+1; qua màn cuối (7) = xong đường
              đua, mở đường đua kế tiếp (nếu đường đó đã làm xong hình - daCo).
              LƯỢT ĐUA (TC_00G3, 16/10/2026): 3 mạng dùng CHUNG cho cả màn 1-7 của một đường,
              không hồi lại mỗi màn. Mạng, mạng dự trữ, kim cương đang để dành được lưu
              trong d.luot; hết sạch mạng ở đường chưa xong thì phải chơi lại từ màn 1
              (sao đã đạt vẫn giữ). Qua màn 7 thì lượt kết thúc, lượt sau lại có 3 mạng.
   BƯỚC: TC_00D, TC_00G3
   NGÀY: 15/10/2026, 16/10/2026
   ================================================================ */
(function (goc) {
  "use strict";
  const ST = goc.ST = goc.ST || {};

  class TienDoDuongDua {
    constructor(tenBe) {
      this.khoa = "kc_santu_tien_do_" + (tenBe || "khach");
      this.du = {};
      try { this.du = JSON.parse(localStorage.getItem(this.khoa) || "{}") || {}; } catch (e) { this.du = {}; }
      if (typeof this.du !== "object" || Array.isArray(this.du)) this.du = {};
    }
    luu() { try { localStorage.setItem(this.khoa, JSON.stringify(this.du)); } catch (e) { /* hết chỗ / chặn lưu: bỏ qua */ } }
    cua(maDuong) {
      const d = this.du[maDuong];
      return d && typeof d === "object" ? d : { mo: 1, sao: {} };
    }
    // Màn cao nhất bé được chơi (1..7)
    manMo(maDuong) { return Math.max(1, Math.min(ST.SO_MAN, this.cua(maDuong).mo | 0 || 1)); }
    daXong(maDuong) { return (this.cua(maDuong).mo | 0) > ST.SO_MAN; }
    sao(maDuong, soMan) { return Math.max(0, Math.min(3, (this.cua(maDuong).sao || {})[soMan] | 0)); }
    tongSao(maDuong) { let t = 0; for (let m = 1; m <= ST.SO_MAN; m++) t += this.sao(maDuong, m); return t; }
    // Đường đua chơi được: đã làm xong hình (daCo) và là đường đầu tiên hoặc đã xong đường trước
    duongMo(maDuong) {
      const i = ST.DUONG_DUA.findIndex(d => d.ma === maDuong);
      if (i < 0 || !ST.DUONG_DUA[i].daCo) return false;
      return i === 0 || this.daXong(ST.DUONG_DUA[i - 1].ma);
    }
    manChoiDuoc(maDuong, soMan) { return this.duongMo(maDuong) && soMan >= 1 && soMan <= this.manMo(maDuong); }
    // Ghi một lần qua màn; trả về { manMoi, xongDuong } để giao diện khen bé
    ghiThang(maDuong, soMan, soSao) {
      const d = this.cua(maDuong), moTruoc = d.mo | 0 || 1;
      d.sao = d.sao || {};
      d.sao[soMan] = Math.max(d.sao[soMan] | 0, Math.max(0, Math.min(3, soSao | 0)));
      d.mo = Math.max(moTruoc, soMan + 1);
      this.du[maDuong] = d;
      if (soMan === ST.SO_MAN) delete d.luot; // cứu được mèo: lượt kết thúc, lượt sau lại đủ mạng
      this.luu();
      return { manMoi: d.mo > moTruoc && soMan < ST.SO_MAN, xongDuong: soMan === ST.SO_MAN && moTruoc <= ST.SO_MAN };
    }
    /* ---- Lượt đua: mạng dùng chung cho màn 1-7 ---- */
    // Mạng của lượt đang chơi; chưa có lượt thì là lượt mới đủ mạng
    layLuot(maDuong) {
      const l = this.cua(maDuong).luot, CH = ST.CAU_HINH;
      const so = (x, toiDa) => Math.max(0, Math.min(toiDa, x | 0));
      if (l && typeof l === "object" && (l.mang | 0) + (l.duTru | 0) > 0)
        return { mang: so(l.mang, CH.mangBanDau), mangDuTru: so(l.duTru, CH.mangDuTruToiDa), kimCuong: so(l.kc, 1e6), dangDo: true };
      return { mang: CH.mangBanDau, mangDuTru: 0, kimCuong: 0, dangDo: false };
    }
    luuLuot(maDuong, l) {
      const d = this.cua(maDuong);
      d.luot = { mang: l.mang | 0, duTru: l.mangDuTru | 0, kc: l.kimCuong | 0 };
      this.du[maDuong] = d;
      this.luu();
    }
    // Hết sạch mạng: lượt kết thúc. Đường chưa xong thì khóa lại về màn 1 (giữ sao).
    // Trả về true nếu bé phải chơi lại từ màn 1.
    hetLuot(maDuong) {
      const d = this.cua(maDuong), veMan1 = !this.daXong(maDuong);
      delete d.luot;
      if (veMan1) d.mo = 1;
      this.du[maDuong] = d;
      this.luu();
      return veMan1;
    }
  }
  ST.TienDoDuongDua = TienDoDuongDua;
})(typeof window !== "undefined" ? window : globalThis);
