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
//   TC_D06C1: quaiGiu(ten, id, x, z), quaiDanh(ten, id), quaiKet(ten, id, ket, nghiGiay, giu) (quái chung, như dt_may_chu.js);
//     vaoVung / layQuanh trả quai[] + nghiDen; lỗi trả thêm chu (bé đang đánh quái) / nghiDen.
//   TC_D06C2a: quaiGiu(ten, id, x, z, lao) gửi thêm p_lao (quái hung dữ tự lao vào Thủ lĩnh; cần SQL TC_D06C2a)
//   TC_D06C2b: nông dân đánh quái: quaiGiu(..., lao, dv) / quaiDanh(ten, id, dv) gửi p_dv (id nông dân; không có = Thủ lĩnh);
//     quaiKet(ten, id, ket, nghiGiay, giu, dan) gửi p_dv + p_mau (dan = { dv, mau }: máu nông dân còn; ket "quai" = nông dân bỏ
//     chạy, máy chủ xoá người dân đó). Cần SQL TC_D06C2b. donVi[].mau = máu nông dân (null = đầy).
//   TC_D06C2d: phaHuy(ten, id) -> kc_dt_pha_huy (phá hủy công trình đã xong của bé; Lều trại: la_leu).
//   TC_D06C2g: truCau / truKhai / truLuot / truTra / truRut (trụ phòng thủ, như dt_may_chu.js); quaiKet(..., dan = { mau }) không có dv
//     = máu Thủ lĩnh còn lại (giữ nguyên sau trận, không tự hồi). vaoVung trả congTrinh (số công trình từ bảng kc_dt_loai_cong_trinh).
// BƯỚC: TC_D02B3a; TC_D02B3b (chỉ ghi chú: layQuanh trả thêm chungLoai, mọc lại ở máy chủ); TC_D02C; TC_D03A; TC_D03B1; TC_D03B2; TC_D06C1; TC_D06C2a; TC_D06C2b
// NGÀY: 27/10/2026; 27/10/2026 20:55; 28/10/2026 00:05; 28/10/2026 10:50; 28/10/2026 15:10; 28/10/2026 19:05; 30/10/2026 17:30; 04/11/2026; 04/11/2026 23:xx
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
      vao_lanh_dia: "Đây là lãnh địa của bạn khác, không vào được.",
      dang_nghi: "Thủ lĩnh đang nghỉ ở Lều.", // TC_D06C1
      quai_mat: "Quái đã chạy mất rồi.",
      dang_danh: "Quái này đang giao chiến với bạn khác.",
      khong_giu: "Quái đã đi chỗ khác.",
      xa_qua: "Thủ lĩnh chưa tới chỗ quái.",
      la_leu: "Không phá được Lều trại: đó là nhà chính của làng.", // TC_D06C2d
      // TC_D06C2g: trụ phòng thủ
      khong_tru: "Không có trụ ở đây.", chua_cau: "Trụ chưa có câu hỏi.", dang_tran: "Thủ lĩnh đang giao chiến.", mien: "Trụ vừa giao chiến.",
      bao_ho: "Làng đang có vòng sáng bảo hộ.", het_tran: "Trận đã kết thúc.", cau: "Câu hỏi không đúng.",
      cho: "Trụ đang nạp tên." // TC_D06C2h
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
      if (!kq || kq.thanhCong !== true) return Object.assign({ ok: false, ma: (kq && kq.ma) || "mang", lyDo: loiCho(kq) },
        kq && kq.chu ? { chu: kq.chu } : null, kq && Number.isFinite(kq.nghiDen) ? { nghiDen: kq.nghiDen } : null, // TC_D06C1: ai đang đánh, giờ hết nghỉ
        kq && Number.isFinite(kq.con) ? { con: kq.con } : null); // TC_D06C2h: trụ còn chờ bấy nhiêu ms mới bắn
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
      async phaHuy(ten, id) { return goi("kc_dt_pha_huy", { p_id: id }); }, // TC_D06C2d: cần SQL TC_D06C2d
      async luuKhamPha(ten, chuoi, giu) { return goi("kc_dt_luu_kham_pha", { p_mat_na: chuoi }, giu); },
      // TC_D06C1: quái chung (giữ khi Thủ lĩnh tiến tới, vào trận, kết quả / thả)
      // TC_D06C2a: p_lao; TC_D06C2b: p_dv (nông dân đánh quái) chỉ gửi khi có, để SQL cũ vẫn nhận lời gọi của Thủ lĩnh
      async quaiGiu(ten, id, x, z, lao, dv) { return goi("kc_dt_quai_giu", Object.assign({ p_id: id, p_x: x, p_z: z, p_lao: !!lao }, dv != null ? { p_dv: dv } : null)); },
      async quaiDanh(ten, id, dv) { return goi("kc_dt_quai_danh", Object.assign({ p_id: id }, dv != null ? { p_dv: dv } : null)); },
      async quaiKet(ten, id, ket, nghiGiay, giu, dan) {
        const mau = dan && Number.isFinite(dan.mau) ? Math.max(0, Math.round(dan.mau)) : null;
        const them = dan && dan.dv != null ? { p_dv: dan.dv, p_mau: mau } : mau != null ? { p_mau: mau } : null; // TC_D06C2g: máu Thủ lĩnh (không có p_dv)
        return goi("kc_dt_quai_ket", Object.assign({ p_id: id, p_ket: ket, p_nghi_giay: Number.isFinite(nghiGiay) ? Math.round(nghiGiay) : null }, them), giu);
      },
      // TC_D06C2g: trụ phòng thủ (luật dt/dt_tru_tran.js; máy chủ giữ đáp án câu của trụ, chấm lượt bé)
      async truCau(ten, id, ds) { return goi("kc_dt_tru_cau", { p_id: id, p_cau: ds }); },
      // TC_D06C2h: p_dv chỉ gửi khi nông dân vào trận (Thủ lĩnh gọi như cũ); truBan = trụ tự bắn một phát nông dân
      async truKhai(ten, id, dv) { return goi("kc_dt_tru_khai", Object.assign({ p_id: id }, dv != null ? { p_dv: dv } : null)); },
      async truBan(ten, id, dv) { return goi("kc_dt_tru_ban", { p_id: id, p_dv: dv }); },
      async truLuot(ten, idTran) { return goi("kc_dt_tru_luot", { p_tran: idTran }); },
      async truTra(ten, idTran, tl) { return goi("kc_dt_tru_tra", { p_tran: idTran, p_chon: tl && Number.isInteger(tl.chon) ? tl.chon : null, p_be_dung: !!(tl && tl.beDung) }); },
      async truRut(ten, idTran, giu) { return goi("kc_dt_tru_rut", { p_tran: idTran }, giu); }
    };
  }

  goc.KC_DT_MAY_CHU_SB = { taoMayChuSupabase };
})(typeof window !== "undefined" ? window : globalThis);
// 30/10/2026 17:30 - BƯỚC: TC_D06C1; 04/11/2026 - TC_D06C2a (p_lao); 04/11/2026 23:xx - TC_D06C2b (p_dv, p_mau)
// 05/11/2026 - BƯỚC: TC_D06C2d (phaHuy)
// 05/11/2026 - BƯỚC: TC_D06C2g (trụ phòng thủ; p_mau của Thủ lĩnh)
// 06/11/2026 - BƯỚC: TC_D06C2h (truBan, truKhai p_dv: trụ tự bắn nông dân; cần SQL TC_D06C2h)
