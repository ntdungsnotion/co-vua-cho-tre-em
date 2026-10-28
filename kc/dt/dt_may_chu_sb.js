// ================================================================
// FILE: dt/dt_may_chu_sb.js
// CHỨC NĂNG: LỚP MÁY CHỦ THẬT của bản đồ chung Đấu Trường Tri Thức: gọi RPC Supabase
//            (repo_rieng SQL/supabase_tc_d02b3_ban_do.sql) với CÙNG GIAO DIỆN máy chủ giả
//            dt/dt_may_chu.js (cùng tên hàm, tham số, dạng kết quả, đều trả Promise) -> phần vẽ +
//            lõi không phải sửa. Máy chủ giữ luật (dac_ta_ban_do.md mục 4-8); lớp này chỉ:
//            - gửi tên đăng nhập + mã phiên + mã vùng kèm mọi lời gọi
//            - giữ "giờ máy chủ" (lệch giờ đo ở mỗi lời gọi) cho vị trí tính từ lệnh
//            - đổi mã lỗi máy chủ thành câu cho bé (có dấu), lỗi mạng không làm vỡ trang
// HÀM KHAI RA (goc.KC_DT_MAY_CHU_SB):
//   taoMayChuSupabase({ goiRpc(tenHam, thamSo) -> Promise<json>, goiRpcGiu?, ten, maPhien, vung, cauHinh })
//     -> { vaoVung, layQuanh, guiLenh, guiThuHoach, xay, xayXong, luuKhamPha, gio } (như dt_may_chu.js)
//   guiThuHoach trả thêm ds[].con (trữ lượng còn lại thật, để máy bé sửa khi bạn khác lấy trước).
//   layQuanh (TC_D02B3b): donVi[].chungLoai (chủng loại chủ đơn vị: vẽ đúng hình bạn); nguồn cạn đã
//     tới giờ mọc lại thì máy chủ bỏ khỏi nguon[] (= đầy lại theo bản đồ). Trang game hỏi mỗi chuKyGui giây.
//   guiThuHoach(ten, ds, giu) / luuKhamPha(ten, chuoi, giu): giu = true lúc rời trang -> gọi goiRpcGiu
//     (fetch keepalive: trình duyệt gửi nốt dù trang đã đóng).
//   TC_D02C: xay(ten, { loai, x, y, xoay }) (cổng dọc), xayTuong(ten, [[x, y]...]) (đoạn tường); lỗi thiếu
//     tài nguyên / đủ số nhà / lãnh địa bạn khác thành câu cho bé.
//   TC_D03A: guiLenh gửi thêm xay (id công trình đang tới xây) + hang (móng xây tiếp); vaoVung trả vang (lời báo
//     vắng mặt), layQuanh: congTrinh[].tienDo (tiến độ máy chủ giữ).
//   TC_D03B1: sinhNongDan(ten) (xếp hàng sinh nông dân ở Lều trại); vaoVung / layQuanh trả hang, vang.sinh;
//     lỗi chỗ ở / hàng chờ đầy thành câu có số.
//   TC_D03B2: trongLai(ten, id) (trồng lại ruộng trên bãi đã gặt); layQuanh congTrinh[] của
//     ruộng có trongLuc / con / gatLuc; vaoVung vang.gat (số ruộng gặt hết lúc vắng mặt).
// BƯỚC: TC_D02B3a; TC_D02B3b (chỉ ghi chú: layQuanh trả thêm chungLoai, mọc lại ở máy chủ); TC_D02C; TC_D03A; TC_D03B1; TC_D03B2
// NGÀY: 27/10/2026; 27/10/2026 20:55; 28/10/2026 00:05; 28/10/2026 10:50; 28/10/2026 15:10; 28/10/2026 19:05
// PHỤ THUỘC: dt/dt_ban_do.js (KC_DT_BAN_DO: câu lý do không xây được); goiRpc: kcGoiRpc của kc_api.js
// ================================================================
(function (goc) {
  "use strict";

  function taoMayChuSupabase(opt) {
    const BD = goc.KC_DT_BAN_DO, CH = opt.cauHinh;
    const tenNguon = loai => ((CH.lang.nguon[loai] || {}).ten || "tài nguyên").toLowerCase();
    const LOI = {
      mang: "Không kết nối được máy chủ, con thử lại nhé.",
      dang_nhap: "Con đăng nhập lại rồi vào thung lũng nhé.",
      vung: "Thung lũng này chưa mở, con quay lại sau nhé.",
      chua_vao: "Con chưa vào thung lũng.",
      khong_phai_nguoi: "Đây không phải người của con.",
      khong_phai_nha: "Đây không phải nhà của con.",
      lenh: "Lệnh không đúng.",
      loai: "Chưa xây được loại nhà này.",
      da_co: "Con đã có Lều trại rồi.",
      da_xong: "Nhà này dựng xong rồi.",
      chua_xong: "Chưa dựng xong đâu, con chờ thêm chút nhé.",
      mat_na: "Mặt nạ không đúng.",
      nhanh_qua: "Đi khám phá nhanh quá, máy chủ chưa ghi kịp.",
      vao_lanh_dia: "Đây là lãnh địa của bạn khác, không vào được."
    };
    // Tên đưa vào câu lý do: loại nguồn (còn cây ở đây), tài nguyên thiếu (gỗ), loại nhà đã đủ (Tháp canh)
    const tenTrongLyDo = kq => (kq.loaiNguon ? tenNguon(kq.loaiNguon)
      : kq.thieu ? ((CH.lang.taiNguyen[kq.thieu] || {}).ten || "tài nguyên").toLowerCase()
        : kq.loai ? ((CH.congTrinh || {})[kq.loai] || {}).ten : undefined);
    const loiCho = kq => {
      const ma = (kq && kq.ma) || "mang";
      if (ma === "cho_o") return BD.LY_DO.cho_o(kq.co, kq.toiDa); // TC_D03B1
      if (ma === "hang_day") return BD.LY_DO.hang_day(kq.toiDa);
      if (BD.LY_DO[ma]) return BD.LY_DO[ma](tenTrongLyDo(kq));
      return LOI[ma] || LOI.mang;
    };

    let lech = 0; // giờ máy chủ - giờ máy bé (ms)
    const gio = () => Date.now() + lech;
    // giu = true: lúc rời trang, gửi kiểu "giữ kết nối" (opt.goiRpcGiu, fetch keepalive) để không mất phần cuối
    async function goi(ham, thamSo, giu) {
      const t0 = Date.now(), goiRpc = giu && opt.goiRpcGiu ? opt.goiRpcGiu : opt.goiRpc;
      let kq;
      try { kq = await goiRpc(ham, Object.assign({ p_ten: opt.ten, p_ma_phien: opt.maPhien, p_ma_vung: opt.vung.ma }, thamSo)); }
      catch (e) { kq = null; }
      if (kq && Number.isFinite(kq.gio)) lech = kq.gio - (t0 + Date.now()) / 2; // giữa lúc gửi và lúc nhận
      if (!kq || kq.thanhCong !== true) return { ok: false, ma: (kq && kq.ma) || "mang", lyDo: loiCho(kq) };
      return Object.assign({ ok: true }, kq);
    }

    return {
      gio,
      async vaoVung(ten, chungLoai) { return goi("kc_dt_vao_vung", { p_chung_loai: chungLoai || null }); },
      async layQuanh() { return goi("kc_dt_lay_quanh", {}); },
      async guiLenh(ten, idDonVi, lenh) {
        return goi("kc_dt_gui_lenh", { p_id: idDonVi, p_lenh: { tu: lenh.tu, den: lenh.den, viec: Number.isInteger(lenh.viec) ? lenh.viec : null, khamPha: !!lenh.khamPha,
          xay: Number.isInteger(lenh.xay) ? lenh.xay : null, hang: Array.isArray(lenh.hang) ? lenh.hang.filter(Number.isInteger) : [] } }); // TC_D03A
      },
      async guiThuHoach(ten, ds, giu) { return goi("kc_dt_gui_thu_hoach", { p_ds: (ds || []).map(d => ({ ma: d.ma, so: d.so })) }, giu); },
      async xay(ten, yeuCau) { return goi("kc_dt_xay", { p_loai: yeuCau.loai, p_x: Math.floor(yeuCau.x), p_y: Math.floor(yeuCau.y), p_xoay: !!yeuCau.xoay }); },
      async xayTuong(ten, dsO) { return goi("kc_dt_xay_tuong", { p_o: (dsO || []).map(o => [Math.floor(o[0]), Math.floor(o[1])]) }); },
      async xayXong(ten, id) { return goi("kc_dt_xay_xong", { p_id: id }); },
      async sinhNongDan() { return goi("kc_dt_sinh_nong_dan", {}); }, // TC_D03B1
      async trongLai(ten, id) { return goi("kc_dt_trong_lai", { p_id: id }); }, // TC_D03B2
      async luuKhamPha(ten, chuoi, giu) { return goi("kc_dt_luu_kham_pha", { p_mat_na: chuoi }, giu); }
    };
  }

  goc.KC_DT_MAY_CHU_SB = { taoMayChuSupabase };
})(typeof window !== "undefined" ? window : globalThis);
// 28/10/2026 19:05 - BƯỚC: TC_D03B2
