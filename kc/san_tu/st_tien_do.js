/* ================================================================
   FILE: san_tu/st_tien_do.js
   CHỨC NĂNG: TIẾN ĐỘ ĐƯỜNG ĐUA của từng bé (ProgressManager): bé đã mở tới màn nào,
              mỗi màn được mấy sao, đã xong đường đua nào. Lưu trong trình duyệt theo
              tên đăng nhập (máy dùng chung vẫn tách riêng từng bé); chưa đồng bộ lên
              tài khoản (để TC_01).
              Luật mở khóa: qua màn n thì mở màn n+1; qua màn cuối (7) = xong đường
              đua, mở đường đua kế tiếp (nếu đường đó đã làm xong hình - daCo).
   BƯỚC: TC_00D
   NGÀY: 15/10/2026
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
      this.luu();
      return { manMoi: d.mo > moTruoc && soMan < ST.SO_MAN, xongDuong: soMan === ST.SO_MAN && moTruoc <= ST.SO_MAN };
    }
  }
  ST.TienDoDuongDua = TienDoDuongDua;
})(typeof window !== "undefined" ? window : globalThis);
