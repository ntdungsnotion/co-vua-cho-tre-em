/* ================================================================
   FILE: san_tu/st_tu_vung.js
   CHỨC NĂNG: QUẢN LÝ TỪ VỰNG (VocabularyManager) của game Săn Từ:
              - chọn từ cho từng chướng ngại vật (không lặp trong một lượt), từ bé ĐÃ
                THUỘC thì ít được chọn lại, từ mới / từ hay sai thì được ưu tiên;
              - tạo các phương án nhiễu theo độ khó (dễ: ngẫu nhiên; khó: gần giống chữ);
              - SoTayTu: sổ ghi nhớ từng từ của từng bé (lưu trong trình duyệt).
   BƯỚC: TC_00B
   NGÀY: 15/10/2026
   CẬP NHẬT: 15/10/2026 - kho từ tách sang st_kho_tu.js; thêm sổ ghi nhớ để đổi từ mới.
   CẬP NHẬT: 20/10/2026 - TC_T03A: mỗi từ có thêm hinh (file hình riêng, trống = dùng emoji).
   CẬP NHẬT: 11/11/2026 - KC_03A: SoTayTu ghi vào Sổ Ghi Nhớ chung (kc/kc_ghi_nho.js, máy chủ) khi bé
             đã đăng nhập; chuyển sổ cũ trong trình duyệt lên một lần (chuyenSoCu).
   ================================================================ */
(function (goc) {
  "use strict";
  const ST = goc.ST = goc.ST || {};

  // Kho từ nằm ở st_kho_tu.js (nạp trước file này)
  const KHO = ST.KHO_TU;

  // Khoảng cách chỉnh sửa (Levenshtein): số chữ phải sửa để biến từ này thành từ kia
  function khoangCachChu(a, b) {
    const d = [];
    for (let i = 0; i <= a.length; i++) d[i] = [i];
    for (let j = 0; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++)
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  // Điểm "dễ nhầm": càng nhỏ càng giống (giống chữ đầu, chữ cuối, độ dài gần nhau)
  function diemGiong(a, b) {
    return khoangCachChu(a, b) / Math.max(a.length, b.length)
      - (a[0] === b[0] ? 0.25 : 0) - (a.slice(-2) === b.slice(-2) ? 0.15 : 0)
      + Math.abs(a.length - b.length) * 0.05;
  }

  /* ----- SỔ GHI NHỚ TỪ: mỗi từ ghi số lần đúng ngay lần bấm đầu, số lần sai/không kịp,
     và chuỗi đúng liên tiếp. Lưu theo tên đăng nhập của bé (máy dùng chung vẫn tách
     riêng từng bé); chưa đăng nhập thì lưu chung tên "khach".
     KC_03A: có soGhiNho (KC_GHI_NHO.So của kc/kc_ghi_nho.js) thì sổ nằm ở Sổ Ghi Nhớ chung
     trên máy chủ (bé chơi máy nào cũng một sổ); sổ cũ trong trình duyệt được chuyển lên một lần
     (chuyenSoCu). Không có soGhiNho (khách, xem thử, bộ kiểm thử) thì giữ cách lưu cũ. ----- */
  const SO_DUNG_DE_THUOC = 3; // đúng ngay lần đầu 3 lần liên tiếp = đã thuộc
  class SoTayTu {
    constructor(tenBe, soGhiNho) {
      this.khoa = "kc_santu_so_tay_" + (tenBe || "khach");
      this.so = soGhiNho || null;
      this.du = {};
      if (!this.so) try { this.du = JSON.parse(localStorage.getItem(this.khoa) || "{}") || {}; } catch (e) { this.du = {}; }
    }
    lay(en) {
      if (!this.so) return this.du[en] || null;
      const t = this.so.lay(en);
      return t ? { d: t.soDung, s: t.soSai, lien: t.chuoi, luc: t.lanCuoi } : null;
    }
    // thuoc = true khi bé chọn đúng ngay lần bấm đầu tiên
    ghi(en, thuoc) {
      if (this.so) { this.so.ghi(en, !!thuoc); return; }
      const t = this.du[en] || { d: 0, s: 0, lien: 0 };
      if (thuoc) { t.d++; t.lien++; } else { t.s++; t.lien = 0; }
      t.luc = Date.now();
      this.du[en] = t;
      try { localStorage.setItem(this.khoa, JSON.stringify(this.du)); } catch (e) { /* hết chỗ / chặn lưu: bỏ qua */ }
    }
    /* KC_03A: sổ cũ (kc_santu_so_tay_<tên>) -> Sổ Ghi Nhớ chung. Gộp vào bản trên máy ngay (mất mạng vẫn
       giữ), rồi gửi lên máy chủ; xong thì đánh dấu "_da_chuyen" (giữ nguyên sổ cũ, không xoá). Cuối cùng
       đọc lại sổ từ máy chủ. Trả Promise. */
    chuyenSoCu() {
      if (!this.so) return Promise.resolve(false);
      const khoaXong = this.khoa + "_da_chuyen";
      let cu = null, xong = false;
      try { xong = localStorage.getItem(khoaXong) === "1"; if (!xong) cu = JSON.parse(localStorage.getItem(this.khoa) || "null"); } catch (e) { cu = null; }
      const ds = cu && typeof cu === "object" ? Object.keys(cu).filter(en => cu[en] && ((cu[en].d | 0) + (cu[en].s | 0)) > 0)
        .map(en => ({ ma: en, soDung: cu[en].d | 0, soSai: cu[en].s | 0, chuoi: Math.min(cu[en].lien | 0, cu[en].d | 0), luc: cu[en].luc || 0 })) : [];
      if (ds.length) {
        ds.forEach(t => {
          if (this.so.lay(t.ma)) return;   // đã có trong sổ chung: máy chủ gộp
          const hop = t.chuoi > 0 ? Math.min(5, t.chuoi) : 1;
          this.so.du[t.ma + "||nhan_ra"] = [t.soDung, t.soSai, t.chuoi, hop, t.chuoi >= SO_DUNG_DE_THUOC, null, t.luc];
        });
        this.so.luuSo();
      }
      const gui = ds.length ? this.so.chuyenCu(ds).then(ok => { if (ok) try { localStorage.setItem(khoaXong, "1"); } catch (e) { /* bỏ qua */ } return ok; })
        : Promise.resolve(true);
      return gui.then(() => this.so.dongBo());
    }
    daThuoc(en) { const t = this.lay(en); return !!t && t.lien >= SO_DUNG_DE_THUOC; }
    demThuoc(cap) { return (KHO[cap] || []).filter(([en]) => this.daThuoc(en)).length; }
    // Trọng số được chọn: từ bé càng hay đúng thì càng ít xuất hiện
    trongSo(en) {
      const t = this.lay(en);
      if (!t) return 1.2;                                // từ mới: ưu tiên cho bé học
      if (t.lien >= SO_DUNG_DE_THUOC) return 0.05;       // đã thuộc: rất hiếm khi gặp lại (để ôn)
      let w = 1 / (1 + 1.2 * t.lien + 0.25 * Math.min(t.d, 8));
      if (t.lien === 0 && t.s > 0) w *= 1.5;             // vừa sai / không kịp: cho gặp lại để học
      return w;
    }
  }
  SoTayTu.SO_DUNG_DE_THUOC = SO_DUNG_DE_THUOC;

  class KhoTuVung {
    constructor(doKho, ngauNhien, soTay) {
      this.dk = doKho;
      this.rng = ngauNhien || Math.random;
      this.soTay = soTay || null;
      this.daDung = new Set();
    }
    static tatCa(cap) { return KHO[cap].map(([en, e, vi, hinh]) => ({ en, e, vi, hinh: hinh || "", cap })); }
    tron(mang) {
      const a = mang.slice();
      for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(this.rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
      return a;
    }
    // Chọn một từ cho chướng ngại vật mới; hết từ chưa dùng thì cho dùng lại
    layTu() {
      const cap = this.dk.capTu[Math.floor(this.rng() * this.dk.capTu.length)];
      let ds = KhoTuVung.tatCa(cap).filter(t => !this.daDung.has(t.en));
      if (!ds.length) {
        KhoTuVung.tatCa(cap).forEach(t => this.daDung.delete(t.en));
        ds = KhoTuVung.tatCa(cap);
      }
      // Bốc theo trọng số: từ đã thuộc ít được chọn, từ mới / từ hay sai được ưu tiên
      let tu = ds[Math.floor(this.rng() * ds.length)];
      if (this.soTay) {
        const ts = ds.map(t => this.soTay.trongSo(t.en));
        let tong = ts.reduce((a, b) => a + b, 0), r = this.rng() * tong;
        for (let i = 0; i < ds.length; i++) { r -= ts[i]; if (r <= 0) { tu = ds[i]; break; } }
      }
      this.daDung.add(tu.en);
      return tu;
    }
    // Tạo danh sách phương án (đã xáo trộn vị trí) gồm từ đúng + các từ nhiễu
    taoPhuongAn(tuDung) {
      const n = this.dk.soPhuongAn;
      let nguon = [];
      this.dk.capNhieu.forEach(c => { nguon = nguon.concat(KhoTuVung.tatCa(c)); });
      nguon = nguon.filter(t => t.en !== tuDung.en);
      let nhieu;
      if (this.rng() < this.dk.doGiong) {
        // Lấy trong nhóm từ gần giống nhất, rồi bốc ngẫu nhiên để không lặp mãi một bộ
        const sx = nguon.map(t => ({ t, d: diemGiong(tuDung.en, t.en) + this.rng() * 0.1 })).sort((a, b) => a.d - b.d);
        nhieu = this.tron(sx.slice(0, Math.max(n + 2, 5)).map(x => x.t)).slice(0, n - 1);
      } else {
        nhieu = this.tron(nguon).slice(0, n - 1);
      }
      return this.tron([tuDung].concat(nhieu)).map(t => t.en);
    }
  }

  ST.KHO_TU = KHO;
  ST.KhoTuVung = KhoTuVung;
  ST.SoTayTu = SoTayTu;
  ST.khoangCachChu = khoangCachChu;
})(typeof window !== "undefined" ? window : globalThis);
