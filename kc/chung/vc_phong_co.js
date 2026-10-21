/* ================================================================
   FILE: chung/vc_phong_co.js
   CHỨC NĂNG: PHÒNG CHƠI 2 NGƯỜI Ở 2 MÁY, DÙNG CHUNG cho mọi game cờ của Kids Challenge
              (Caro TC_02B, Cờ Tướng TC_03 sau này). Bọc các RPC kc_co_* của bảng
              kc_phong_co (SQL repo_rieng/SQL/supabase_tc02b_phong_co.sql):
              - sảnh: danh sách phòng đang chờ bạn vào + phòng chưa xong của chính mình;
              - tạo phòng / vào phòng / đi một nước / xin hoà, đồng ý hoà, chịu thua,
                chơi lại, rời phòng;
              - THEO DÕI phòng: Supabase Realtime báo có thay đổi thì hỏi lại ngay; kèm hỏi
                định kỳ (Realtime trục trặc vẫn chơi được, và báo máy chủ "con vẫn ở đây").
              MÁY CHỦ giữ luật (kiểm lượt, ô, tự nhận thắng / hoà) và tự cộng kim cương khi
              hết ván, nên trang game chỉ hiện những gì phòng trả về.
              Không nạp file nào của Cờ Vua, không đụng bảng phong_cho (Hướng Dẫn 3.16).
   BƯỚC: TC_02B
   NGÀY: 21/10/2026 20:30
   PHỤ THUỘC: chung/vc_van_co.js (VC); trang game truyền kcGoiRpc, kcDocPhien,
              kcSupabaseClient vào khi tạo.
   ================================================================ */
(function (goc) {
  "use strict";
  const VC = goc.VC = goc.VC || {};

  const HOI_KHI_CO_REALTIME = 6000;   // ms: vẫn hỏi để báo "con còn ở đây" (máy chủ coi > 20 giây là vắng)
  const HOI_KHI_KHONG_REALTIME = 2000;
  const HOI_SANH = 3000;

  /* Phòng a mới hơn hoặc bằng phòng b? (bỏ qua câu trả lời đến muộn của lần hỏi cũ) */
  function moiHon(a, b) {
    if (!b) return true;
    if (a.id !== b.id) return true;
    const ta = Date.parse(a.capNhatLuc), tb = Date.parse(b.capNhatLuc);
    if (isNaN(ta) || isNaN(tb)) return true;
    return ta >= tb;
  }
  VC.phongMoiHon = moiHon;

  class PhongCo {
    /* troChoi: 'caro'...; goiRpc = kcGoiRpc; layPhien = kcDocPhien; khachSupabase = kcSupabaseClient (có thể null) */
    constructor(troChoi, goiRpc, layPhien, khachSupabase) {
      this.troChoi = troChoi;
      this.goiRpc = goiRpc;
      this.layPhien = layPhien || (() => null);
      this.sb = khachSupabase || null;
      this.phong = null;            // phòng mới nhất đã biết
      this.khiCo = null;            // hàm nhận phòng mới
      this.henHoi = null;
      this.kenh = null;
      this.coRealtime = false;
      this.sanh = { hen: null, kenh: null };
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && this.phong) this.hoiNgay();
      });
    }

    goi(tenHam, thamSo) {
      const p = this.layPhien();
      if (!p || !p.tenDangNhap) return Promise.resolve({ thanhCong: false, ma: "phien_het_han" });
      const ts = Object.assign({ p_ten: p.tenDangNhap, p_ma_phien: p.maPhien || "" }, thamSo || {});
      return Promise.resolve(this.goiRpc(tenHam, ts)).catch(() => null)
        .then(kq => kq || { thanhCong: false, ma: "", thongBao: "Không kết nối được máy chủ" });
    }

    /* Câu trả lời có kèm phòng: cập nhật nếu mới hơn rồi báo trang game */
    nhanPhong(kq) {
      if (kq && kq.phong && this.phong && kq.phong.id === this.phong.id && moiHon(kq.phong, this.phong)) {
        this.phong = kq.phong;
        if (this.khiCo) this.khiCo(this.phong);
      }
      return kq;
    }

    /* ---------- SẢNH ---------- */
    dsPhong() { return this.goi("kc_co_ds_phong", { p_tro_choi: this.troChoi }); }
    taoPhong() { return this.goi("kc_co_tao_phong", { p_tro_choi: this.troChoi }); }
    vaoPhong(id) { return this.goi("kc_co_vao_phong", { p_id: id }); }

    /* Hỏi danh sách phòng định kỳ (+ Realtime) cho tới khi gọi ngungSanh(). khiCo(kq của dsPhong) */
    theoDoiSanh(khiCo) {
      this.ngungSanh();
      const hoi = () => this.dsPhong().then(kq => { if (this.sanh.hen) khiCo(kq); });
      this.sanh.hen = setInterval(hoi, HOI_SANH);
      if (this.sb && this.sb.channel) {
        try {
          this.sanh.kenh = this.sb.channel("kc-sanh-" + this.troChoi + "-" + Date.now())
            .on("postgres_changes", { event: "*", schema: "public", table: "kc_phong_co", filter: "tro_choi=eq." + this.troChoi }, hoi)
            .subscribe();
        } catch (e) { this.sanh.kenh = null; }
      }
      hoi();
    }
    ngungSanh() {
      if (this.sanh.hen) clearInterval(this.sanh.hen);
      this.sanh.hen = null;
      if (this.sanh.kenh && this.sb) { try { this.sb.removeChannel(this.sanh.kenh); } catch (e) { /* bỏ qua */ } }
      this.sanh.kenh = null;
    }

    /* ---------- MỘT PHÒNG ---------- */
    /* Bắt đầu theo dõi phòng (đã có từ tạo / vào / sảnh). khiCo(phong) gọi mỗi khi phòng đổi. */
    theoDoi(phong, khiCo) {
      this.ngung();
      this.phong = phong;
      this.khiCo = khiCo;
      this.coRealtime = false;
      if (this.sb && this.sb.channel) {
        try {
          this.kenh = this.sb.channel("kc-phong-" + phong.id + "-" + Date.now())
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "kc_phong_co", filter: "id=eq." + phong.id },
              () => this.hoiNgay())
            .subscribe(trangThai => {
              this.coRealtime = trangThai === "SUBSCRIBED";
              this.datLichHoi();
            });
        } catch (e) { this.kenh = null; }
      }
      this.datLichHoi();
      if (khiCo) khiCo(phong);
    }
    datLichHoi() {
      if (this.henHoi) clearInterval(this.henHoi);
      if (!this.phong) return;
      this.henHoi = setInterval(() => this.hoiNgay(), this.coRealtime ? HOI_KHI_CO_REALTIME : HOI_KHI_KHONG_REALTIME);
    }
    hoiNgay() {
      if (!this.phong) return Promise.resolve(null);
      const id = this.phong.id;
      return this.goi("kc_co_lay_phong", { p_id: id }).then(kq => {
        if (!this.phong || this.phong.id !== id) return kq;
        if (kq && kq.ma === "khong_co_phong" && this.khiCo) {
          this.khiCo(Object.assign({}, this.phong, { trangThai: "dong", roiPhong: "" }));
        }
        return this.nhanPhong(kq);
      });
    }
    ngung() {
      if (this.henHoi) clearInterval(this.henHoi);
      this.henHoi = null;
      if (this.kenh && this.sb) { try { this.sb.removeChannel(this.kenh); } catch (e) { /* bỏ qua */ } }
      this.kenh = null;
      this.phong = null;
      this.khiCo = null;
    }

    /* soNuoc = số nước đang thấy trên bàn (máy chủ từ chối nếu bàn đã đổi); nuoc = nước đi của game */
    di(soNuoc, nuoc) {
      if (!this.phong) return Promise.resolve({ thanhCong: false });
      return this.goi("kc_co_di", { p_id: this.phong.id, p_so_nuoc: soNuoc, p_nuoc: nuoc }).then(kq => this.nhanPhong(kq));
    }
    /* viec: 'xin_hoa' | 'dong_y_hoa' | 'tu_choi_hoa' | 'dau_hang' | 'choi_lai' | 'roi_phong' */
    hanhDong(viec) {
      if (!this.phong) return Promise.resolve({ thanhCong: false });
      return this.goi("kc_co_hanh_dong", { p_id: this.phong.id, p_viec: viec }).then(kq => this.nhanPhong(kq));
    }
  }
  VC.PhongCo = PhongCo;

  /* Hai bên trong phòng nhìn từ phía "tôi": {toi, ban, avatarToi, avatarBan, toiDiTruoc} */
  VC.haiBenPhong = function (phong) {
    const laChu = phong.toi === "chu";
    return {
      toi: laChu ? phong.chuPhong : phong.khach,
      ban: laChu ? phong.khach : phong.chuPhong,
      avatarToi: laChu ? phong.avatarChu : phong.avatarKhach,
      avatarBan: laChu ? phong.avatarKhach : phong.avatarChu,
      banVangGiay: laChu ? phong.khachVangGiay : phong.chuVangGiay,
      toiDiTruoc: phong.nguoiDiTruoc === (laChu ? phong.chuPhong : phong.khach)
    };
  };
})(typeof window !== "undefined" ? window : globalThis);
// 21/10/2026 20:30 - BƯỚC: TC_02B
