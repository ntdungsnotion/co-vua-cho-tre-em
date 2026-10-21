/* ================================================================
   FILE: chung/vc_van_co.js
   CHỨC NĂNG: PHẦN CHUNG CHO MỌI GAME CỜ của Kids Challenge (Caro TC_02A, Cờ Tướng
              TC_03 và game cờ sau này) - game chỉ viết luật + bàn cờ, còn lại dùng ở đây:
              1. VC.veAvatar     - vẽ avatar bé (emoji HOẶC URL ảnh - Sổ Tay D7).
              2. VC.KetQuaVan    - gửi KẾT QUẢ VÁN lên RPC kc_co_ket_thuc_van (ghi lịch sử
                                    ván + máy chủ tự kiểm ván thắng rồi cộng kim cương).
                                    HÀNG CHỜ localStorage: mất mạng thì giữ, lần sau gửi bù;
                                    mã lượt riêng mỗi ván nên gửi lại không bị cộng 2 lần
                                    (cùng cách st_kho_kc.js của Giải Cứu Mèo Con).
              3. VC.layThanhTich - RPC kc_co_thanh_tich: số ván thắng / thua / hoà theo mức
                                    + số kim cương thưởng từng mức (đọc cấu hình quản trị).
              4. VC.TapTrung     - CHẾ ĐỘ TẬP TRUNG trên điện thoại (y mẫu taptrung_NC.js
                                    của Cờ Vua): bắt đầu ván là ẩn mọi thứ trừ bàn cờ; thoát
                                    bằng nút "🏠 Ra menu", nút Back, hoặc tự thoát khi hết ván.
              Không nạp file nào của Cờ Vua (Hướng Dẫn mục 2).
   BƯỚC: TC_02A
   NGÀY: 21/10/2026 17:45
   PHỤ THUỘC: không bắt buộc; trang game truyền kcGoiRpc / kcDocPhien vào khi tạo.
   ================================================================ */
(function (goc) {
  "use strict";
  const VC = goc.VC = goc.VC || {};

  /* ---------------- 1. AVATAR ---------------- */
  VC.veAvatar = function (o, av, macDinh) {
    if (!o) return;
    o.textContent = macDinh || "🙂";
    if (av && String(av).indexOf("http") === 0) {
      const img = document.createElement("img");
      img.src = av; img.alt = "";
      o.textContent = ""; o.appendChild(img);
    } else if (av) { o.textContent = av; }
  };

  /* ---------------- 2. KẾT QUẢ VÁN ---------------- */
  const SO_CHO_TOI_DA = 40;
  const NGAY_GIU_TOI_DA = 14;

  VC.taoMaLuot = function () {
    let s = Date.now().toString(36) + "_";
    for (let i = 0; i < 10; i++) s += "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)];
    return s; // khớp ^[A-Za-z0-9_-]{8,64}$ ở máy chủ
  };

  class KetQuaVan {
    /* troChoi: 'caro' | 'co_tuong'...; tenBe: tên đăng nhập ('' = chưa đăng nhập);
       goiRpc(tenHam, thamSo) -> Promise (kcGoiRpc); layPhien() -> {tenDangNhap, maPhien} | null */
    constructor(troChoi, tenBe, goiRpc, layPhien) {
      this.troChoi = troChoi;
      this.tenBe = tenBe || "";
      this.goiRpc = typeof goiRpc === "function" ? goiRpc : null;
      this.layPhien = layPhien || (() => null);
      this.khoa = "kc_co_cho_ket_qua_" + troChoi + "_" + (this.tenBe || "khach");
      this.dangGui = null;
    }
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
      } catch (e) { /* chặn lưu: bỏ qua */ }
    }
    /* Ghi một ván vừa xong vào hàng chờ. van = {cheDo, muc, ketQua, nuocDi, doiThu}.
       Trả về mục vừa ghi (có maLuot) hoặc null nếu chưa đăng nhập. */
    them(van) {
      if (!this.tenBe || !van) return null;
      const muc = {
        maLuot: VC.taoMaLuot(), cheDo: van.cheDo || "may", muc: String(van.muc || ""),
        ketQua: van.ketQua, nuocDi: Array.isArray(van.nuocDi) ? van.nuocDi.slice() : [],
        doiThu: String(van.doiThu || ""), luc: Date.now()
      };
      const ds = this.docCho(); ds.push(muc); this.ghiCho(ds);
      return muc;
    }
    /* Gửi lần lượt cả hàng chờ -> Promise<{ketQua: {maLuot: kq máy chủ}, conCho, loiMang, diemSoMoi}>.
       Thành công hoặc bị từ chối hẳn (không phải tài khoản bé, dữ liệu sai): bỏ khỏi hàng chờ;
       lỗi mạng / phiên hết hạn / máy chủ chưa có hàm: giữ lại, lần sau gửi bù. */
    gui() {
      if (this.dangGui) return this.dangGui.then(() => this.gui());
      const tong = { ketQua: {}, conCho: 0, loiMang: false, diemSoMoi: null };
      if (!this.tenBe || !this.goiRpc) { tong.conCho = this.docCho().length; return Promise.resolve(tong); }
      const quaHan = Date.now() - NGAY_GIU_TOI_DA * 864e5;
      const BO_DI = ["khong_phai_tre", "ma_luot_sai", "du_lieu_sai"];
      const chay = () => {
        const ds = this.docCho().filter(m => !(m.luc < quaHan));
        this.ghiCho(ds);
        const phien = this.layPhien();
        if (!ds.length || !phien || phien.tenDangNhap !== this.tenBe) { tong.conCho = ds.length; return Promise.resolve(tong); }
        const m = ds[0];
        return new Promise(r => r(this.goiRpc("kc_co_ket_thuc_van", {
          p_ten: this.tenBe, p_ma_phien: phien.maPhien || "", p_ma_luot: m.maLuot,
          p_tro_choi: this.troChoi, p_che_do: m.cheDo, p_muc: m.muc, p_ket_qua: m.ketQua,
          p_nuoc_di: m.nuocDi, p_doi_thu: m.doiThu
        }))).catch(() => null).then(kq => {
          const boDi = kq && (kq.thanhCong === true || BO_DI.indexOf(kq.ma) !== -1);
          if (!boDi) { tong.loiMang = !(kq && kq.ma); tong.conCho = ds.length; return tong; }
          tong.ketQua[m.maLuot] = kq;
          if (kq.thanhCong && typeof kq.diemSoMoi === "number") tong.diemSoMoi = kq.diemSoMoi;
          this.ghiCho(this.docCho().filter(x => x.maLuot !== m.maLuot));
          return chay();
        });
      };
      this.dangGui = chay().finally(() => { this.dangGui = null; });
      return this.dangGui;
    }
  }
  VC.KetQuaVan = KetQuaVan;

  /* ---------------- 3. THÀNH TÍCH ---------------- */
  /* -> Promise<{thanhCong, theoMuc: {de: {thang, thua, hoa}, ...}, thuong: {de: 3, ...},
                 kimCuongHomNay, tranGame}> ; lỗi thì {thanhCong:false} */
  VC.layThanhTich = function (goiRpc, phien, troChoi) {
    if (!goiRpc || !phien || !phien.tenDangNhap) return Promise.resolve({ thanhCong: false });
    return Promise.resolve(goiRpc("kc_co_thanh_tich", {
      p_ten: phien.tenDangNhap, p_ma_phien: phien.maPhien || "", p_tro_choi: troChoi
    })).catch(() => ({ thanhCong: false })).then(kq => kq || { thanhCong: false });
  };

  /* ---------------- 4. CHẾ ĐỘ TẬP TRUNG ---------------- */
  const MAN_HINH_DIEN_THOAI = "(max-width: 600px), (max-height: 500px)";
  /* Trang game đặt class "vcAnKhiTapTrung" lên những gì cần ẩn khi chơi (header, thanh tab,
     khối chọn mức...). dangCoVan(): ván đang dở? (để hiện nút "🎯 Tập trung chơi tiếp"). */
  class TapTrung {
    constructor(dangCoVan, noiDatNutVao) {
      this.dangBat = false;
      this.dangCoVan = dangCoVan || (() => false);
      this.nutThoat = document.createElement("button");
      this.nutThoat.type = "button";
      this.nutThoat.className = "vcNutRaMenu";
      this.nutThoat.textContent = "🏠 Ra menu";
      this.nutThoat.addEventListener("click", () => this.thoat());
      document.body.appendChild(this.nutThoat);
      this.nutVao = document.createElement("button");
      this.nutVao.type = "button";
      this.nutVao.className = "vcNutVaoTapTrung";
      this.nutVao.textContent = "🎯 Tập trung chơi tiếp";
      this.nutVao.addEventListener("click", () => this.bat());
      if (noiDatNutVao) noiDatNutVao.appendChild(this.nutVao);
      window.addEventListener("popstate", () => { if (this.dangBat) this.thoat(true); });
      window.addEventListener("resize", () => {
        if (this.dangBat && !TapTrung.laDienThoai()) this.thoat();
        this.capNhatNut();
      });
      this.capNhatNut();
    }
    static laDienThoai() { return !!(window.matchMedia && window.matchMedia(MAN_HINH_DIEN_THOAI).matches); }
    /* Gọi khi bắt đầu ván: chỉ bật trên điện thoại */
    batNeuDienThoai() { if (TapTrung.laDienThoai()) this.bat(); }
    bat() {
      if (this.dangBat) return;
      this.dangBat = true;
      document.body.classList.add("vcTapTrung");
      try { history.pushState({ vcTapTrung: true }, ""); } catch (e) { /* còn nút Ra menu */ }
      this.capNhatNut();
      window.scrollTo(0, 0);
    }
    /* daQuayLaiLichSu = true khi gọi từ nút Back (mốc lịch sử đã tự gỡ) */
    thoat(daQuayLaiLichSu) {
      if (!this.dangBat) return;
      this.dangBat = false;
      document.body.classList.remove("vcTapTrung");
      if (!daQuayLaiLichSu && history.state && history.state.vcTapTrung) history.back();
      this.capNhatNut();
    }
    capNhatNut() {
      this.nutVao.style.display = (!this.dangBat && TapTrung.laDienThoai() && this.dangCoVan()) ? "inline-block" : "none";
    }
  }
  VC.TapTrung = TapTrung;
})(typeof window !== "undefined" ? window : globalThis);
// 21/10/2026 17:45 - BƯỚC: TC_02A
