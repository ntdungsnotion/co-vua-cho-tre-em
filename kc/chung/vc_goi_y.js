/* ================================================================
   FILE: chung/vc_goi_y.js
   CHỨC NĂNG: NÚT "💡 GỢI Ý" DÙNG CHUNG cho mọi game cờ của Kids Challenge (Cờ Tướng TC_03E; Caro
              và game cờ sau này dùng lại được) - "giống Cờ Vua" (Hướng Dẫn Cờ Vua 4.9):
              - Lượt / giá theo CẤP game cờ của bé, MÁY CHỦ quyết (RPC kc_co_goi_y_thong_tin,
                kc_co_dung_goi_y, bảng kc_goi_y_cap): trừ kim cương (không bao giờ âm) + đếm lượt
                theo MÃ VÁN (trang game tạo khi bắt đầu ván, giữ nguyên khi tải lại chơi tiếp) ->
                tải lại trang không lấy lại được lượt.
              - Phụ huynh / quản trị chơi thử: miễn phí, không giới hạn, không gọi máy chủ.
              - Mất mạng: cấp miễn phí + không giới hạn vẫn gợi ý được; cấp có giá / có giới
                hạn thì báo "cần có mạng" (không cho dùng chùa).
              - Câu nhắc "Con có cần gợi ý không?": nenHoi(cap) cho biết có hỏi không (còn lượt,
                cấp <= hoiToiCap, giayChoHoi > 0). Trang game tự hẹn giờ, nói câu, nhấp nháy nút.
              Không đụng tới trình duyệt -> kiểm thử bằng node được (goi_y_kiem_thu_node.js ở repo riêng).
              GAME TỰ LÀM: tìm nước gợi ý (bộ não của game) + nhấp nháy ô đi / ô đến.
   BƯỚC: TC_03E
   NGÀY: 23/10/2026 07:40
   PHỤ THUỘC: không. Trang game truyền kcGoiRpc + kcDocPhien vào.
   ================================================================ */
(function (goc) {
  "use strict";
  const VC = goc.VC = goc.VC || {};

  /* Bảng mặc định (= bảng gieo trong SQL TC_03E = bảng Cờ Vua) - chỉ để HIỆN nút trước khi máy
     chủ trả lời; trừ kim cương / đếm lượt luôn do máy chủ. [giới hạn (null = không), giá] */
  const BANG_MAC_DINH = [null,
    [null, 0], [null, 0], [null, 0], [null, 0], [null, 1],
    [15, 2], [14, 3], [13, 4], [12, 5], [11, 6], [10, 7], [9, 8], [8, 9], [7, 10],
    [6, 11], [5, 12], [4, 13], [3, 14], [2, 15], [1, 16]];
  const CAU_HINH_MAC_DINH = { giayChoHoi: 30, hoiToiCap: 9 };

  VC.taoMaVan = function () {
    let s = "v" + Date.now().toString(36) + "_";
    for (let i = 0; i < 10; i++) s += "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)];
    return s; // khớp ^[A-Za-z0-9_-]{8,64}$ ở máy chủ
  };

  class GoiY {
    /* troChoi: 'co_tuong'...; goiRpc(tenHam, thamSo) -> Promise (kcGoiRpc);
       layPhien() -> {tenDangNhap, maPhien} | null (kcDocPhien); laBe: tài khoản vai trò 'tre' */
    constructor(troChoi, goiRpc, layPhien, laBe) {
      this.troChoi = troChoi;
      this.goiRpc = typeof goiRpc === "function" ? goiRpc : null;
      this.layPhien = layPhien || (() => null);
      this.laBe = !!laBe;
      this.maVan = "";
      this.cap = 1;
      this.gioiHan = null;
      this.chiPhi = 0;
      this.daDung = 0;
      this.daBietMayChu = false;     // máy chủ đã trả lời cho ván này chưa
      this.giayChoHoi = CAU_HINH_MAC_DINH.giayChoHoi;
      this.hoiToiCap = CAU_HINH_MAC_DINH.hoiToiCap;
    }

    /* Bắt đầu / chơi tiếp một ván. cap = cấp của bé (để hiện nút ngay theo bảng mặc định).
       -> Promise (xong khi máy chủ trả lời hoặc lỗi; trang game vẽ lại nút sau đó). */
    batDauVan(maVan, cap) {
      this.maVan = maVan;
      this.daDung = 0;
      this.daBietMayChu = false;
      this.datCap(cap);
      if (!this.laBe) { this.gioiHan = null; this.chiPhi = 0; return Promise.resolve(); }
      const ph = this.thamSo();
      if (!ph) return Promise.resolve();
      const van = maVan;
      return Promise.resolve(this.goiRpc("kc_co_goi_y_thong_tin", ph)).then(r => {
        if (van === this.maVan && r && r.thanhCong) this.napMayChu(r);
      }).catch(() => { /* mất mạng: giữ bảng mặc định */ });
    }

    datCap(cap) {
      const c = Math.max(1, Math.min(BANG_MAC_DINH.length - 1, Number(cap) || 1));
      this.cap = c;
      if (this.laBe) { this.gioiHan = BANG_MAC_DINH[c][0]; this.chiPhi = BANG_MAC_DINH[c][1]; }
    }

    thamSo() {
      const p = this.layPhien();
      if (!this.goiRpc || !p || !p.tenDangNhap || !this.maVan) return null;
      return { p_ten: p.tenDangNhap, p_ma_phien: p.maPhien, p_tro_choi: this.troChoi, p_ma_van: this.maVan };
    }

    napMayChu(r) {
      this.daBietMayChu = true;
      if (typeof r.cap === "number") this.cap = r.cap;
      this.gioiHan = typeof r.gioiHan === "number" ? r.gioiHan : null;
      this.chiPhi = typeof r.chiPhi === "number" ? r.chiPhi : 0;
      if (typeof r.daDung === "number") this.daDung = r.daDung;
      if (typeof r.giayChoHoi === "number" && r.giayChoHoi >= 0) this.giayChoHoi = r.giayChoHoi;
      if (typeof r.hoiToiCap === "number" && r.hoiToiCap >= 0) this.hoiToiCap = r.hoiToiCap;
    }

    conLai() { return this.gioiHan === null ? null : Math.max(0, this.gioiHan - this.daDung); }
    conLuot() { return this.gioiHan === null || this.daDung < this.gioiHan; }
    mienPhi() { return !this.laBe || (this.chiPhi === 0 && this.gioiHan === null); }

    /* Chữ nhỏ dưới nút: "Miễn phí" / "2 💎 · còn 14 lần" / "Hết lượt ván này" */
    nhanNut() {
      if (!this.conLuot()) return "Hết lượt ván này";
      const gia = this.laBe && this.chiPhi > 0 ? this.chiPhi + " 💎" : "Miễn phí";
      const con = this.conLai();
      return con === null ? gia : gia + " · còn " + con + " lần";
    }

    /* Có nên chủ động hỏi "Con có cần gợi ý không?" (cap: cấp dùng để khen của trang game) */
    nenHoi(cap) {
      return this.giayChoHoi > 0 && Number(cap) <= this.hoiToiCap && this.conLuot();
    }

    /* Bé bấm Gợi Ý. -> Promise<{duoc, ma, loi, chiPhiDaTru, diemSoMoi}>
       ma: '' | 'het_luot' | 'mat_mang' | 'phien_het_han' | 'loi' */
    dung() {
      if (!this.conLuot()) return Promise.resolve({ duoc: false, ma: "het_luot", loi: "Ván này con dùng hết lượt gợi ý rồi. Con tự nghĩ nhé, con làm được mà!" });
      if (!this.laBe) { this.daDung++; return Promise.resolve({ duoc: true, ma: "", chiPhiDaTru: 0 }); }
      const ph = this.thamSo();
      const khongMang = () => {
        if (this.mienPhi()) { this.daDung++; return { duoc: true, ma: "", chiPhiDaTru: 0 }; }
        return { duoc: false, ma: "mat_mang", loi: "Cần có mạng mới dùng được gợi ý ở cấp này, con thử lại sau nhé." };
      };
      if (!ph) return Promise.resolve(khongMang());
      return Promise.resolve(this.goiRpc("kc_co_dung_goi_y", ph)).then(r => {
        // kcGoiRpc báo lỗi mạng / máy chủ thiếu hàm bằng {thanhCong: false} không có mã
        if (!r || typeof r.thanhCong !== "boolean" || (!r.thanhCong && !r.ma)) return khongMang();
        if (r.ma === "phien_het_han") return { duoc: false, ma: "phien_het_han", loi: "Con đăng nhập lại rồi dùng gợi ý nhé." };
        if (r.cap !== undefined) this.napMayChu(r);
        if (r.thanhCong) return { duoc: true, ma: "", chiPhiDaTru: r.chiPhiDaTru || 0, diemSoMoi: r.diemSoMoi };
        if (r.ma === "het_luot") return { duoc: false, ma: "het_luot", loi: "Ván này con dùng hết lượt gợi ý rồi. Con tự nghĩ nhé, con làm được mà!" };
        return { duoc: false, ma: "loi", loi: "Chưa gợi ý được, con thử lại nhé." };
      }).catch(() => khongMang());
    }
  }
  GoiY.BANG_MAC_DINH = BANG_MAC_DINH;
  VC.GoiY = GoiY;

  if (typeof module !== "undefined" && module.exports) module.exports = VC;
})(typeof window !== "undefined" ? window : globalThis);
// 23/10/2026 07:40 - BƯỚC: TC_03E
