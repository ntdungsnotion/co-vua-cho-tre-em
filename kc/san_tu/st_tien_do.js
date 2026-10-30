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
   CẬP NHẬT: 30/10/2026 09:30 - TC_00K: ĐỒNG BỘ LÊN TÀI KHOẢN (Supabase, RPC kc_santu_dong_bo_tien_do).
             Trước đây chỉ lưu trong trình duyệt nên đổi máy là các đường đua đã mở (Biển, Sa mạc,
             Vũ trụ...) bị khóa lại. Nay mỗi đường đua có mốc t (giờ thay đổi gần nhất); mở game và
             sau mỗi thay đổi (chờ 1,5 giây cho gộp) thì gửi TOÀN BỘ tiến độ lên, máy chủ gộp với bản
             đã lưu rồi trả về bản gộp. Luật gộp (ST.gopTienDo, máy chủ làm y hệt): sao lấy cao nhất;
             đường đã xong ở bất kỳ máy nào vẫn là xong; chưa xong thì màn đã mở + lượt đang dở theo
             máy chơi mới hơn (luật hết mạng về màn 1 vẫn đúng). Mất mạng: tiến độ vẫn lưu trong máy,
             lần đồng bộ sau tự gửi bù. Tiến độ cũ (chưa có t) được đẩy lên ở lần mở game đầu.
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
    luu() {
      try { localStorage.setItem(this.khoa, JSON.stringify(this.du)); } catch (e) { /* hết chỗ / chặn lưu: bỏ qua */ }
      if (typeof this.khiDoi === "function") this.khiDoi();
    }
    // Đánh dấu đường đua vừa thay đổi (mốc để gộp giữa các máy)
    danhDau(d) { d.t = Math.max(Date.now(), (Number(d.t) || 0) + 1); }
    // Gộp bản máy chủ trả về vào bản trong máy; trả về true nếu tiến độ trong máy đổi
    nhanMayChu(duLieu) {
      if (!duLieu || typeof duLieu !== "object") return false;
      const truoc = JSON.stringify(this.du), moi = ST.gopTienDo(this.du, duLieu);
      if (JSON.stringify(moi) === truoc) return false;
      this.du = moi;
      try { localStorage.setItem(this.khoa, JSON.stringify(this.du)); } catch (e) { /* bỏ qua */ }
      return true;
    }
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
      this.danhDau(d);
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
      this.danhDau(d);
      this.luu();
    }
    // Hết sạch mạng: lượt kết thúc. Đường chưa xong thì khóa lại về màn 1 (giữ sao).
    // Trả về true nếu bé phải chơi lại từ màn 1.
    hetLuot(maDuong) {
      const d = this.cua(maDuong), veMan1 = !this.daXong(maDuong);
      delete d.luot;
      if (veMan1) d.mo = 1;
      this.du[maDuong] = d;
      this.danhDau(d);
      this.luu();
      return veMan1;
    }
  }
  ST.TienDoDuongDua = TienDoDuongDua;

  /* ---- TC_00K: gộp tiến độ của 2 nơi (máy này + máy chủ). Máy chủ (SQL) gộp y hệt. ---- */
  const soTrong = (x, min, max, md) => typeof x === "number" && isFinite(x) ? Math.max(min, Math.min(max, Math.floor(x))) : md;
  function sachDuong(d) {
    if (!d || typeof d !== "object" || Array.isArray(d)) return null;
    const sao = {};
    if (d.sao && typeof d.sao === "object") for (let m = 1; m <= 7; m++) { const s = soTrong(d.sao[m], 0, 3, 0); if (s) sao[m] = s; }
    const r = { mo: soTrong(d.mo, 1, 8, 1), sao, t: soTrong(d.t, 0, 9e15, 0) };
    const l = d.luot;
    if (l && typeof l === "object") {
      const mang = soTrong(l.mang, 0, 10, 0), duTru = soTrong(l.duTru, 0, 10, 0);
      if (mang + duTru > 0) r.luot = { mang, duTru, kc: soTrong(l.kc, 0, 1e6, 0) };
    }
    return r;
  }
  function gopDuong(a, b) {
    if (!a) return b; if (!b) return a;
    const bThang = b.t > a.t || (b.t === a.t && b.mo > a.mo), w = bThang ? b : a;
    const r = { mo: a.mo > 7 || b.mo > 7 ? 8 : w.mo, sao: {}, t: Math.max(a.t, b.t) };
    for (let m = 1; m <= 7; m++) { const s = Math.max(a.sao[m] | 0, b.sao[m] | 0); if (s) r.sao[m] = s; }
    if (w.luot) r.luot = w.luot;
    return r;
  }
  ST.gopTienDo = function (a, b) {
    const r = {}, maHop = k => /^[A-Za-z]{2,20}$/.test(k);
    const ma = new Set([...Object.keys(a || {}), ...Object.keys(b || {})].filter(maHop));
    ma.forEach(k => { const g = gopDuong(sachDuong((a || {})[k]), sachDuong((b || {})[k])); if (g) r[k] = g; });
    return r;
  };

  /* ---- TC_00K: đồng bộ với tài khoản ----
     tienDo: TienDoDuongDua; goiRpc(tenHam, thamSo) -> Promise (kcGoiRpc); layPhien() -> {tenDangNhap, maPhien} | null;
     khiCoMoi(): gọi khi máy chủ mang về tiến độ mới (vd máy khác vừa mở đường đua) để giao diện vẽ lại. */
  class DongBoTienDo {
    constructor(tienDo, tenBe, goiRpc, layPhien, khiCoMoi) {
      this.td = tienDo; this.tenBe = tenBe || "";
      this.goiRpc = typeof goiRpc === "function" ? goiRpc : null;
      this.layPhien = layPhien || (() => null);
      this.khiCoMoi = khiCoMoi || (() => {});
      this.dangGui = null; this.canGuiLai = false; this.hen = null;
      this.lanCuoi = null; // kết quả lần gửi cuối: "ok" | "loiMang" | mã lỗi máy chủ
      if (this.coThe) tienDo.khiDoi = () => this.henGui();
    }
    get coThe() { return !!(this.tenBe && this.goiRpc); }
    henGui(ms) {
      if (!this.coThe) return;
      clearTimeout(this.hen);
      this.hen = setTimeout(() => this.gui(), ms === undefined ? 1500 : ms);
    }
    gui() {
      clearTimeout(this.hen); this.hen = null;
      if (!this.coThe) return Promise.resolve(false);
      if (this.dangGui) { this.canGuiLai = true; return this.dangGui; }
      const phien = this.layPhien();
      if (!phien || phien.tenDangNhap !== this.tenBe) return Promise.resolve(false);
      const guiDi = JSON.parse(JSON.stringify(this.td.du));
      this.dangGui = new Promise(r => r(this.goiRpc("kc_santu_dong_bo_tien_do", {
        p_ten: this.tenBe, p_ma_phien: phien.maPhien || "", p_du_lieu: guiDi
      }))).catch(() => null).then(kq => {
        if (!kq || !kq.thanhCong) { this.lanCuoi = kq && kq.ma ? kq.ma : "loiMang"; return false; }
        this.lanCuoi = "ok";
        const doi = this.td.nhanMayChu(kq.duLieu);
        if (doi) this.khiCoMoi();
        return doi;
      }).finally(() => {
        this.dangGui = null;
        if (this.canGuiLai) { this.canGuiLai = false; this.henGui(0); }
      });
      return this.dangGui;
    }
  }
  ST.DongBoTienDo = DongBoTienDo;
})(typeof window !== "undefined" ? window : globalThis);
