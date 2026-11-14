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
//   TC_D06C4: quaiThang(ten, id, dan) (thắng quái + đồ rơi trên đất, RPC kc_dt_quai_thang), nhatDo(ten, id, dv) (kc_dt_nhat_do),
//     doRoiDs() (kc_dt_do_roi_ds), bangRoiDo() (kc_dt_doc_roi_do).
//   TC_D06C2g: truCau / truKhai / truLuot / truTra / truRut (trụ phòng thủ, như dt_may_chu.js); quaiKet(..., dan = { mau }) không có dv
//     = máu Thủ lĩnh còn lại (giữ nguyên sau trận, không tự hồi). vaoVung trả congTrinh (số công trình từ bảng kc_dt_loai_cong_trinh).
//   TC_D06C7a (07/11/2026): vaoVung / layQuanh trả thêm lanhDia [{ chu, mat (base64) }] (lãnh địa mọi bé, cần SQL TC_D06C7a;
//     máy chủ chưa chạy SQL thì không có trường này, trang giữ cách cũ). Lớp gọi không đổi: trả nguyên kết quả RPC.
//   KC_06B1 (11/11/2026): công trình chỉ nhận MÃ câu kho (truCau / muaCau / doiCau gửi c.id; không còn cauKho); mucLuc() + thuVien(hoi)
//     đọc kho câu chung (RPC kc_cau_hoi_muc_luc / kc_cau_hoi_thu_vien, không gửi p_ma_vung). Có thuVien = trang dùng kho máy chủ.
// BƯỚC: KC_06B2 (11/11/2026: kho("o" | "lo" | "cham") câu kho trận quái, máy chủ chấm); TC_D02B3a; TC_D02B3b (chỉ ghi chú: layQuanh trả thêm chungLoai, mọc lại ở máy chủ); TC_D02C; TC_D03A; TC_D03B1; TC_D03B2; TC_D06C1; TC_D06C2a; TC_D06C2b
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
      bao_ho: "Làng đang có vòng sáng bảo hộ.", het_tran: "Trận đã kết thúc.", cau: "Câu này không dùng được nữa, con chọn câu khác nhé.",
      cho: "Trụ đang nạp tên.", // TC_D06C2h
      khong_danh: "Không đánh được công trình này.", // TC_D06C7b
      hong: "Công trình đã sụp rồi.", so: "Số câu không đúng.", khong_hu: "Công trình còn nguyên, không cần sửa.", // TC_D06C7d
      dang_sua: "Nông dân đang sửa, sửa xong rồi làm tiếp nhé.", // TC_D06C7e
      do_mat: "Đồ đã mất rồi.", khong_cua_ban: "Đây không phải đồ của bạn", con_nong_dan: "Còn nông dân rồi.", khong_cam: "Nông dân không cầm đồ.", chua_co_leu: "Chưa có Lều trại.", kho_day: "Kho đầy rồi.", khong_phai_nguoi: "Chỉ nông dân của con mới làm được." // TC_D06C4
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

    // KC_06B1: câu (hoặc số) -> mảng mã câu kho; câu không có mã (máy sinh cũ) bị bỏ
    const dsMa = ds => (Array.isArray(ds) ? ds : []).map(c => (c && typeof c === "object" ? c.id : c)).filter(m => Number.isInteger(m) && m > 0);
    // KC_06B1: RPC kho câu dùng chung toàn app (không theo vùng: không gửi p_ma_vung)
    async function goiCau(ham, thamSo) { // KC_06D/E2: trả cả mã lỗi + chi tiết (loai, giongVoi, luot...) cho màn soạn câu
      let kq;
      try { kq = await opt.goiRpc(ham, Object.assign({ p_ten: opt.ten, p_ma_phien: opt.maPhien }, thamSo)); } catch (e) { kq = null; }
      if (!kq || typeof kq !== "object") return { ok: false, ma: "mang" };
      return Object.assign({}, kq, { ok: kq.thanhCong === true, ma: kq.thanhCong === true ? undefined : (kq.ma || "mang") });
    }
    async function goiKho(ham, thamSo) {
      let kq;
      try { kq = await opt.goiRpc(ham, Object.assign({ p_ten: opt.ten, p_ma_phien: opt.maPhien }, thamSo)); } catch (e) { kq = null; }
      if (!kq || kq.thanhCong !== true) return { ok: false, ma: (kq && kq.ma) || "mang", lyDo: loiCho(kq) };
      return Object.assign({ ok: true }, kq);
    }

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
        kq && Number.isFinite(kq.con) ? { con: kq.con } : null, // TC_D06C2h: trụ còn chờ bấy nhiêu ms mới bắn
        kq && kq.sua ? { sua: kq.sua } : null); // TC_D06C7e: đang sửa (tiến độ) -> máy bé gửi nông dân tới sửa tiếp
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
      async phaHuy(ten, id) { return goi("kc_dt_pha_huy", { p_id: id }); }, // TC_D06C2d: cần SQL TC_D06C2d; TC_D06C7c: cả Lều (trả kho, hang)
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
      // TC_D06C4: bé thắng quái -> quái bỏ chạy + đồ rơi nằm trên đất; nông dân tới nhặt (nhatDo) -> kho / túi đồ (cần SQL TC_D06C4: repo_rieng SQL/supabase_tc_d06c4_roi_do.sql)
      async quaiThang(ten, id, dan) {
        const mau = dan && Number.isFinite(dan.mau) ? Math.max(0, Math.round(dan.mau)) : null;
        return goi("kc_dt_quai_thang", Object.assign({ p_id: id, p_mau: mau }, dan && dan.dv != null ? { p_dv: dan.dv } : null));
      },
      async bangRoiDo() { return goi("kc_dt_doc_roi_do", {}); },
      async nhatDo(ten, id, dv) { return goi("kc_dt_nhat_do", { p_id: id, p_dv: dv }); },
      async catDo(ten, dv) { return goi("kc_dt_cat_do", { p_dv: dv }); }, // TC_D06C5: nông dân cầm đồ về tới Lều / kho
      async doRoiDs() { return goi("kc_dt_do_roi_ds", {}); },
      // TC_D06C5: không còn nông dân -> tặng một người (cần SQL TC_D06C5: repo_rieng SQL/supabase_tc_d06c5_nong_dan_mien_phi.sql)
      async nongDanMienPhi() { return goi("kc_dt_nong_dan_mien_phi", {}); },
      // TC_D06C2g: trụ phòng thủ (luật dt/dt_tru_tran.js; máy chủ giữ đáp án câu của trụ, chấm lượt bé)
      // KC_06B1: chỉ gửi MÃ câu kho (ds = câu có id); không có mã = máy chủ tự bốc câu kho theo lớp của chủ
      async truCau(ten, id, ds) { const ma = dsMa(ds); return goi("kc_dt_tru_cau", { p_id: id, p_ma: ma.length ? ma : null }); },
      // TC_D06C2h: p_dv chỉ gửi khi nông dân vào trận (Thủ lĩnh gọi như cũ); truBan = trụ tự bắn một phát nông dân
      async truKhai(ten, id, dv) { return goi("kc_dt_tru_khai", Object.assign({ p_id: id }, dv != null ? { p_dv: dv } : null)); },
      async truBan(ten, id, dv) { return goi("kc_dt_tru_ban", { p_id: id, p_dv: dv }); },
      async truLuot(ten, idTran) { return goi("kc_dt_tru_luot", { p_tran: idTran }); },
      // KC_06B3: lượt trụ gửi mã lượt + mã câu phòng thủ (máy chủ tự chấm, SQL kc06b3)
      async truTra(ten, idTran, tl) {
        const ts = { p_tran: idTran, p_chon: tl && Number.isInteger(tl.chon) ? tl.chon : null, p_be_dung: !!(tl && tl.beDung) }; // SQL kc06b3 bỏ qua p_be_dung
        if (tl && typeof tl.maLuot === "string" && Number.isInteger(tl.id)) { ts.p_ma_luot = tl.maLuot; ts.p_cau_id = tl.id; }
        return goi("kc_dt_tru_tra", ts);
      },
      async truRut(ten, idTran, giu) { return goi("kc_dt_tru_rut", { p_tran: idTran }, giu); },
      // TC_D06C7b: Thủ lĩnh đánh công trình thường của bé khác. KC_06B1: bỏ kho câu máy bé gửi (cauKho) + câu dự phòng: máy chủ tự bốc câu kho
      async danhKhai(ten, id) { return goi("kc_dt_danh_khai", { p_id: id }); },
      // TC_D06C7d: bé mua câu phòng thủ bằng vàng / sửa công trình bị đánh (cần SQL TC_D06C7d)
      // TC_D06C7e: p_cau = câu bé tự chọn; sửa bằng tài nguyên, nông dân tới sửa (cần SQL TC_D06C7e)
      async muaCau(ten, id, so, cau) { return goi("kc_dt_mua_cau", { p_id: id, p_so: so, p_ma: dsMa(cau).length ? dsMa(cau) : null }); }, // KC_06B1: mã câu kho
      async suaCt(ten, id) { return goi("kc_dt_sua_ct", { p_id: id }); },
      // TC_D06E: bé đổi câu thứ viTri bằng câu thư viện, miễn phí (cần SQL TC_D06E)
      async doiCau(ten, id, viTri, cau) { const ma = dsMa(cau); return goi("kc_dt_doi_cau", { p_id: id, p_vi_tri: viTri, p_ma: ma.length === 1 ? ma[0] : null }); }, // KC_06B1
      // KC_06B1: KHO CÂU HỎI CHUNG (Hướng Dẫn 3.17: bé mở kho để chọn câu thì thấy đáp án). mucLuc() -> { ok, mon: [{ ma, ten, bieuTuong,
      // chuDe: [{ ma, ten, soCau, lopTu, lopDen }] }] }; thuVien({ mon?, chuDe?, lop?, n?, boQua? }) -> { ok, cau: [câu có id + đáp án] }
      // (không có mon = gợi ý theo lớp cho bảng chọn câu 🛡️)
      async mucLuc() { return goiKho("kc_cau_hoi_muc_luc", {}); },
      async thuVien(hoi) {
        const h = hoi || {};
        return goiKho("kc_cau_hoi_thu_vien", { p_mon: h.mon || null, p_chu_de: h.chuDe || null, p_lop: Number.isInteger(h.lop) ? h.lop : null,
          p_n: Number.isInteger(h.n) ? h.n : 4, p_bo_qua: dsMa(h.boQua) });
      },
      // KC_06B2: câu kho cho TRẬN QUÁI / lượt trụ tấn công, MÁY CHỦ CHẤM (trang trận dt/thu_tran_dau.html nhờ bản đồ gọi hộ, dt/dt_nguon_kho.js):
      //   kho("o") -> { ok, o: [{ mon, chuDe, lop, muc, n }] }        ô câu để chọn độ khó (RPC kc_cau_hoi_o)
      //   kho("lo", { mon, lop, muc, chuDe?, n, boQua, nhanh? }) -> { ok, cau: [câu có id, KHÔNG có đáp án] }   (kc_cau_hoi_lo, KC_06A;
      //        nhanh: kc_cau_hoi_lo_tran kèm muoi + k để chấm nhanh trên máy, 12/11/2026)
      //   kho("cham", { maLuot, id, chon, giay, gapO }) -> { ok, dung, dapAnDung, loiGiai }   (kc_cau_hoi_cham; gửi lại cùng maLuot không tính 2 lần)
      async kho(ham, ts) {
        const h = ts || {}, so = (v, d) => Number.isInteger(v) ? v : d;
        if (ham === "o") return goiKho("kc_cau_hoi_o", {});
        if (ham === "lo") {
          const ts = { p_mon: String(h.mon || "toan"), p_lop: so(h.lop, null), p_muc: h.muc || null, p_n: so(h.n, 20), p_bo_qua: dsMa(h.boQua), p_chu_de: h.chuDe || null };
          if (h.nhanh) { const kq = await goiKho("kc_cau_hoi_lo_tran", ts); if (kq.ok) return kq; } // 12/11: lô kèm mã chấm nhanh; chưa chạy SQL mới -> lô cũ
          return goiKho("kc_cau_hoi_lo", ts);
        }
        if (ham === "cham") return goiKho("kc_cau_hoi_cham", { p_ma_luot: String(h.maLuot || ""), p_cau_id: so(h.id, null), p_chon: so(h.chon, null),
          p_giay: Number.isFinite(h.giay) ? Math.round(h.giay * 100) / 100 : null, p_gap_o: h.gapO || null });
        return { ok: false, ma: "lenh", lyDo: LOI.lenh };
      },
      // KC_06D: BÉ TỰ ĐẶT CÂU (cần SQL KC_06D). cauCuaBe() -> { ok, luot: { conLai, gioiHan, khoa }, lop, cau: [câu của bé + trangThai,
      //   lyDo, goiY, daXem, soCongTrinh] }; guiCau(id | null, { mon, lop, noiDung, dapAn[4], dung, loiGiai }) -> { ok, cau, luot, goiAi }
      //   hoặc { ok: false, ma (het_luot | khoa | chan | trung | sai_khuon | khong_sua | dang_nhap | mang), loai?, giongVoi?, luot? };
      //   daXemCau(ids): bé đã đọc tin của các câu; monChuDe(): danh sách môn của kho (RPC không cần đăng nhập)
      async cauCuaBe() { return goiKho("kc_cau_hoi_cua_be", {}); },
      // KC_06E2: phải 🔍 Kiểm tra trước (kiemCau -> maKiem), Gửi kèm maKiem; ma 'chua_kiem' = chưa kiểm / câu đã đổi sau khi kiểm
      async guiCau(id, cau, maKiem) { return goiCau("kc_cau_hoi_gui", { p_id: Number.isInteger(id) ? id : null, p_cau: cau || {}, p_ma_kiem: maKiem || null }); },
      //   kiemCau(id | null, cau) -> { ok, maKiem, goiAi, nhayCam, luot } | { ok: false, ma (chan | trung | sai_khuon | het_kiem | khoa ...), cuaBe? }
      async kiemCau(id, cau) { return goiCau("kc_cau_hoi_kiem", { p_id: Number.isInteger(id) ? id : null, p_cau: cau || {} }); },
      //   aiKiem(maKiem): Cô Cú (AI) chấm phiếu kiểm -> { ok, ketQua (dat | loai | loi | bo_qua), lyDo, goiY, nhayCam }
      async aiKiem(maKiem) {
        const sb = typeof window !== "undefined" ? window.kcSupabaseClient : null;
        if (!sb || !sb.functions) return { ok: false, ma: "mang" };
        try { const r = await sb.functions.invoke("kc-duyet-cau", { body: { nguon: "be", maKiem } }); return Object.assign({ ok: !r.error }, r.data || {}); }
        catch (e) { return { ok: false, ma: "mang" }; }
      },
      // KC_06E3: xoaCau(id) -> { ok, goCongTrinh } | { ok: false, ma (cong_khai | khong_xoa) }; docLai(id): nhờ Cô Cú đọc lại câu đang chờ
      async xoaCau(id) { return goiCau("kc_cau_hoi_be_xoa", { p_id: id }); },
      async docLai(id) { return goiCau("kc_cau_hoi_be_doc_lai", { p_id: id }); },
      //   xemKiem(maKiem) -> { ok, ai (tat | cho | dat | loai | loi), lyDo, goiY, nhayCam }
      async xemKiem(maKiem) { return goiKho("kc_cau_hoi_kiem_xem", { p_ma: maKiem }); },
      // KC_06E: đánh thức AI chấm hàng chờ (Edge Function kc-duyet-cau; khoá Gemini chỉ ở máy chủ). Lỗi thì thôi: lịch máy chủ chấm sau.
      async goiAi() {
        const sb = typeof window !== "undefined" ? window.kcSupabaseClient : null;
        if (!sb || !sb.functions) return { ok: false, ma: "mang" };
        try { const r = await sb.functions.invoke("kc-duyet-cau", { body: { nguon: "be" } }); return { ok: !r.error }; } catch (e) { return { ok: false, ma: "mang" }; }
      },
      async daXemCau(ids) { return goiKho("kc_cau_hoi_be_da_xem", { p_ids: dsMa(ids) }); },
      async monChuDe() {
        let kq; try { kq = await opt.goiRpc("kc_mon_chu_de", {}); } catch (e) { kq = null; }
        return kq && kq.thanhCong === true ? Object.assign({ ok: true }, kq) : { ok: false, ma: "mang" };
      }
    };
  }

  goc.KC_DT_MAY_CHU_SB = { taoMayChuSupabase };
})(typeof window !== "undefined" ? window : globalThis);
// 30/10/2026 17:30 - BƯỚC: TC_D06C1; 04/11/2026 - TC_D06C2a (p_lao); 04/11/2026 23:xx - TC_D06C2b (p_dv, p_mau)
// 05/11/2026 - BƯỚC: TC_D06C2d (phaHuy)
// 05/11/2026 - BƯỚC: TC_D06C2g (trụ phòng thủ; p_mau của Thủ lĩnh)
// 06/11/2026 - BƯỚC: TC_D06C2h (truBan, truKhai p_dv: trụ tự bắn nông dân; cần SQL TC_D06C2h)
// 06/11/2026 - BƯỚC: TC_D06C4 (quaiThang, bangRoiDo; cần SQL TC_D06C4)
// 08/11/2026 - BƯỚC: TC_D06C7b (cauKho, danhKhai; cần SQL TC_D06C7b)
// 08/11/2026 - BƯỚC: TC_D06C7d (muaCau, suaCt; cần SQL TC_D06C7d)
// 08/11/2026 16:xx - BƯỚC: TC_D06C7e (muaCau p_cau; suaCt trả sua; cần SQL TC_D06C7e)
// 08/11/2026 22:xx - BƯỚC: TC_D06C7c (phaHuy nhận Lều trại; cần SQL TC_D06C7c)
// 09/11/2026 - BƯỚC: TC_D06E (doiCau; cần SQL TC_D06E)
// 11/11/2026 - BƯỚC: KC_06B1 (truCau / muaCau / doiCau chỉ gửi mã câu kho; bỏ cauKho + câu dự phòng; mucLuc / thuVien kho câu chung; cần SQL KC_06B1)
// 11/11/2026 - BƯỚC: KC_06B2 (kho: ô câu / lô câu không đáp án / máy chủ chấm; cần SQL KC_06B2)
// 12/11/2026 - BƯỚC: KC_06B2 (kho("lo", { nhanh }): kc_cau_hoi_lo_tran, chấm nhanh trên máy)
// 12/11/2026 - BƯỚC: KC_06B3 (truTra: p_ma_luot + p_cau_id, cần SQL kc06b3)
// 12/11/2026 - BƯỚC: KC_06D (cauCuaBe / guiCau / daXemCau / monChuDe: bé tự đặt câu; cần SQL KC_06D)
// 14/11/2026 - BƯỚC: KC_06E3 (xoaCau, docLai); KC_06E2 (kiemCau / aiKiem / xemKiem: Kiểm tra trước, Gửi sau)
