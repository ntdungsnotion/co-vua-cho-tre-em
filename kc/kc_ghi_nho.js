/* ================================================================
   FILE: kc/kc_ghi_nho.js
   CHỨC NĂNG: SỔ GHI NHỚ CHUNG TOÀN APP (KC_03A) - phần trình duyệt.
              Mọi game / trang ôn ghi kết quả từng lượt trả lời vào đây; tiến độ lưu trên máy chủ
              (bảng kc_ghi_nho_be, RPC kc_ghi_nho_ghi / kc_ghi_nho_doc / kc_ghi_nho_chuyen_cu) nên bé
              chơi máy nào cũng cùng một sổ.
              - BẢN SAO TRÊN MÁY: tiến độ đọc từ máy chủ được giữ trong localStorage (kc_ghi_nho_<tên>), game
                đọc ngay không phải chờ mạng; mất mạng vẫn chơi được.
              - HÀNG CHỜ: mỗi lượt ghi vào hàng chờ (kc_ghi_nho_cho_<tên>) TRƯỚC khi gửi; mất mạng thì giữ, lần
                sau gửi bù. Mã lượt (uuid) giúp gửi lại không bị tính 2 lần.
              - LUẬT ÔN (giống máy chủ, để bản trên máy đúng ngay khi chưa gửi được): đúng lên 1 hộp (tối đa
                5), sai về hộp 1; 3 lần đúng liên tiếp = đã thuộc. Máy chủ tính lại và là bản chính.
              Chưa đăng nhập / không có máy chủ: chỉ giữ bản trên máy (không gửi).
   CÁCH DÙNG:
     const so = new KC_GHI_NHO.So(tenDangNhap, kcGoiRpc, layPhien, { loai: "tu", gapO: "san_tu" });
     so.lay("cat")            -> { soDung, soSai, chuoi, hop, daThuoc, henOn, lanCuoi } hoặc null
     so.ghi("cat", true, { giay: 2.5 })   // chiều mặc định nhan_ra; { manh, chieu } nếu cần
     so.dongBo()              -> Promise: gửi hàng chờ rồi đọc lại sổ từ máy chủ
   BƯỚC: KC_03A
   NGÀY: 11/11/2026
   ================================================================ */
(function (goc) {
  "use strict";
  const SO_DUNG_DE_THUOC = 3;
  const KHOANG_ON = [0, 1, 3, 7, 16, 35];
  const LO_TOI_DA = 200;           // máy chủ nhận tối đa 200 lượt / lần
  const CHO_TOI_DA = 2000;          // hàng chờ dài nhất (bỏ lượt cũ nhất)
  const NGAY_GIU_TOI_DA = 14;       // lượt chờ quá 14 ngày thì bỏ (máy chủ cũng chặn)
  const CHO_GUI_MS = 4000;          // gom lượt trong 4 giây rồi gửi một lần

  function taoUuid() {
    const c = goc.crypto;
    if (c && typeof c.randomUUID === "function") return c.randomUUID();
    const b = new Uint8Array(16);
    if (c && c.getRandomValues) c.getRandomValues(b); else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
    b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
    const h = Array.from(b, x => x.toString(16).padStart(2, "0")).join("");
    return h.slice(0, 8) + "-" + h.slice(8, 12) + "-" + h.slice(12, 16) + "-" + h.slice(16, 20) + "-" + h.slice(20);
  }
  // Ngày theo giờ Việt Nam (UTC+7), dạng yyyy-mm-dd
  function ngayVN(ms, them) { return new Date(ms + 7 * 36e5 + (them | 0) * 864e5).toISOString().slice(0, 10); }
  const khoa = (ma, manh, chieu) => ma + "|" + (manh || "") + "|" + (chieu || "nhan_ra");

  function docLS(k, macDinh) { try { const v = JSON.parse(goc.localStorage.getItem(k) || "null"); return v === null ? macDinh : v; } catch (e) { return macDinh; } }
  function ghiLS(k, v) { try { if (v === null) goc.localStorage.removeItem(k); else goc.localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* hết chỗ / chặn lưu */ } }

  // Một dòng tiến độ trên máy: mảng gọn [soDung, soSai, chuoi, hop, daThuoc, henOn, lanCuoi]
  function tuMang(a) {
    return a ? { soDung: a[0] | 0, soSai: a[1] | 0, chuoi: a[2] | 0, hop: a[3] | 0, daThuoc: !!a[4], henOn: a[5] || null, lanCuoi: a[6] || 0 } : null;
  }
  function apLuot(a, dung, luc) {
    a = a ? a.slice() : [0, 0, 0, 0, false, null, 0];
    if (dung) { a[0]++; a[2] = Math.min(a[2] + 1, 32000); a[3] = Math.min(5, a[3] + 1); }
    else { a[1]++; a[2] = 0; a[3] = 1; }
    a[4] = a[2] >= SO_DUNG_DE_THUOC;
    a[5] = ngayVN(luc, KHOANG_ON[a[3]]);
    a[6] = Math.max(a[6] || 0, luc);
    return a;
  }

  class So {
    /* ten: tên đăng nhập (rỗng = khách, chỉ giữ trên máy); goiRpc(tenHam, thamSo) -> Promise (kcGoiRpc);
       layPhien() -> {tenDangNhap, maPhien} | null; tc: { loai: "tu" | "the", gapO: "san_tu" } */
    constructor(ten, goiRpc, layPhien, tc) {
      tc = tc || {};
      this.ten = ten || "";
      this.loai = tc.loai || "tu";
      this.gapO = tc.gapO || "khac";
      this.goiRpc = typeof goiRpc === "function" ? goiRpc : null;
      this.layPhien = typeof layPhien === "function" ? layPhien : () => null;
      this.khoaSo = "kc_ghi_nho_" + this.loai + "_" + (this.ten || "khach");
      this.khoaCho = "kc_ghi_nho_cho_" + (this.ten || "khach");
      const luu = docLS(this.khoaSo, null);
      this.du = (luu && typeof luu.du === "object" && luu.du) || {};
      this.daCoMayChu = !!(luu && luu.mayChu);       // đã từng đọc sổ từ máy chủ
      this.dangGui = null;
      this.hen = null;
      this.khiDoi = typeof tc.khiDoi === "function" ? tc.khiDoi : null;
    }
    get coMayChu() { return !!(this.ten && this.goiRpc); }
    luuSo() { ghiLS(this.khoaSo, { du: this.du, mayChu: this.daCoMayChu, t: Date.now() }); }
    docCho() { const d = docLS(this.khoaCho, []); return Array.isArray(d) ? d.filter(x => x && typeof x.maLuot === "string") : []; }
    ghiCho(ds) { ghiLS(this.khoaCho, ds.length ? ds.slice(-CHO_TOI_DA) : null); }
    soDangCho() { return this.docCho().length; }

    lay(ma, manh, chieu) { return tuMang(this.du[khoa(ma, manh, chieu)]); }
    tatCa() { return Object.keys(this.du).map(k => { const p = k.split("|"); return Object.assign({ ma: p[0], manh: p[1], chieu: p[2] }, tuMang(this.du[k])); }); }

    // Ghi một lượt: cập nhật bản trên máy ngay, thêm vào hàng chờ, hẹn gửi
    ghi(ma, dung, tc) {
      tc = tc || {};
      if (!ma) return null;
      const luc = Date.now(), k = khoa(ma, tc.manh, tc.chieu);
      this.du[k] = apLuot(this.du[k], !!dung, luc);
      this.luuSo();
      if (!this.ten) return this.lay(ma, tc.manh, tc.chieu);  // khách: không có máy chủ, chỉ giữ trên máy
      const muc = { maLuot: taoUuid(), loai: this.loai, ma: String(ma), manh: tc.manh || "", chieu: tc.chieu || "nhan_ra",
        dung: !!dung, gapO: tc.gapO || this.gapO, luc };
      if (typeof tc.giay === "number" && isFinite(tc.giay)) muc.giay = Math.round(tc.giay * 10) / 10;
      const ds = this.docCho(); ds.push(muc); this.ghiCho(ds);
      this.henGui();
      return this.lay(ma, tc.manh, tc.chieu);
    }
    henGui(ms) {
      if (!this.coMayChu) return;
      clearTimeout(this.hen);
      this.hen = setTimeout(() => { this.hen = null; this.gui(); }, ms === undefined ? CHO_GUI_MS : ms);
    }

    // Gửi hàng chờ theo lô. Promise<{ conCho, loiMang }>. Hàng chờ chung mọi loại (loai nằm trong từng lượt).
    gui() {
      if (this.dangGui) return this.dangGui;
      const tong = { conCho: 0, loiMang: false };
      if (!this.coMayChu) { tong.conCho = this.soDangCho(); return Promise.resolve(tong); }
      const quaHan = Date.now() - NGAY_GIU_TOI_DA * 864e5;
      const chay = () => {
        const ds = this.docCho().filter(m => !(m.luc < quaHan));
        this.ghiCho(ds);
        const phien = this.layPhien();
        if (!ds.length || !phien || phien.tenDangNhap !== this.ten) { tong.conCho = ds.length; return Promise.resolve(tong); }
        const lo = ds.slice(0, LO_TOI_DA);
        return new Promise(r => r(this.goiRpc("kc_ghi_nho_ghi", { p_ten: this.ten, p_ma_phien: phien.maPhien || "", p_ds: lo })))
          .catch(() => null).then(kq => {
            if (!kq || kq.thanhCong !== true) {
              // phiên hết hạn / lỗi mạng / máy chủ chưa có hàm: giữ lại, lần sau gửi bù
              tong.loiMang = !(kq && kq.ma); tong.conCho = ds.length; return tong;
            }
            // Bỏ khỏi hàng chờ: lượt máy chủ đã nhận + lượt máy chủ bỏ (sai dạng / quá trần ngày) + lượt không trả lời được
            const xong = new Set(lo.map(m => m.maLuot));
            this.ghiCho(this.docCho().filter(m => !xong.has(m.maLuot)));
            this.nhanTienDo(kq.tienDo);
            return chay();
          });
      };
      this.dangGui = chay().finally(() => { this.dangGui = null; });
      return this.dangGui;
    }

    // Dòng tiến độ máy chủ trả về (mảng gọn kc_ghi_nho_json) -> bản trên máy
    nhanTienDo(ds) {
      if (!Array.isArray(ds) || !ds.length) return;
      let doi = false;
      ds.forEach(d => {
        if (!Array.isArray(d) || d[0] !== this.loai) return;
        this.du[khoa(d[1], d[2], d[3])] = [d[4] | 0, d[5] | 0, d[6] | 0, d[7] | 0, !!d[8], d[9] || null, d[10] || 0];
        doi = true;
      });
      if (doi) { this.luuSo(); if (this.khiDoi) this.khiDoi(); }
    }

    // Gửi hàng chờ rồi đọc lại cả sổ từ máy chủ (máy chủ là bản chính). Lượt còn chờ được áp lại lên trên.
    dongBo() {
      if (!this.coMayChu) return Promise.resolve(false);
      return this.gui().then(() => {
        const phien = this.layPhien();
        if (!phien || phien.tenDangNhap !== this.ten) return false;
        return new Promise(r => r(this.goiRpc("kc_ghi_nho_doc", { p_ten: this.ten, p_ma_phien: phien.maPhien || "", p_loai: this.loai })))
          .catch(() => null).then(kq => {
            if (!kq || kq.thanhCong !== true || !Array.isArray(kq.ds)) return false;
            const moi = {};
            kq.ds.forEach(d => { if (Array.isArray(d)) moi[khoa(d[1], d[2], d[3])] = [d[4] | 0, d[5] | 0, d[6] | 0, d[7] | 0, !!d[8], d[9] || null, d[10] || 0]; });
            this.docCho().filter(m => m.loai === this.loai).sort((a, b) => a.luc - b.luc).forEach(m => {
              const k = khoa(m.ma, m.manh, m.chieu); moi[k] = apLuot(moi[k], m.dung, m.luc);
            });
            this.du = moi; this.daCoMayChu = true; this.luuSo();
            if (this.khiDoi) this.khiDoi();
            return true;
          });
      });
    }

    /* Chuyển sổ cũ của một game lên máy chủ (một lần mỗi máy). ds: [{ ma, soDung, soSai, chuoi, luc }].
       Thành công -> Promise<true>; máy chủ gộp kiểu "lấy lớn nhất" nên gửi lại không nhân đôi. */
    chuyenCu(ds) {
      if (!this.coMayChu || !Array.isArray(ds) || !ds.length) return Promise.resolve(false);
      const phien = this.layPhien();
      if (!phien || phien.tenDangNhap !== this.ten) return Promise.resolve(false);
      const lam = [];
      for (let i = 0; i < ds.length; i += 5000) lam.push(ds.slice(i, i + 5000));
      return lam.reduce((p, lo) => p.then(ok => !ok ? false :
        new Promise(r => r(this.goiRpc("kc_ghi_nho_chuyen_cu", { p_ten: this.ten, p_ma_phien: phien.maPhien || "", p_loai: this.loai, p_ds: lo })))
          .catch(() => null).then(kq => !!(kq && kq.thanhCong === true))), Promise.resolve(true));
    }
  }

  goc.KC_GHI_NHO = { So, SO_DUNG_DE_THUOC, KHOANG_ON, taoUuid, ngayVN, _apLuot: apLuot };
})(typeof window !== "undefined" ? window : globalThis);
