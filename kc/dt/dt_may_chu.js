// ================================================================
// FILE: dt/dt_may_chu.js
// CHỨC NĂNG: LỚP MÁY CHỦ của bản đồ chung Đấu Trường Tri Thức (dac_ta_ban_do.md mục 9-10).
//            Trang game CHỈ gọi máy chủ qua lớp này. Bản đầu (TC_D02B2a) là MÁY CHỦ GIẢ lưu
//            localStorage trên máy bé (một hoặc vài bé cùng máy); TC_D02B3 thay bằng bản gọi
//            RPC Supabase CÙNG GIAO DIỆN (cùng tên hàm, cùng tham số, cùng dạng kết quả, đều
//            trả Promise) -> phần vẽ + lõi không phải sửa.
//            Máy chủ giữ luật (bé sửa mã trên máy cũng không gian lận được ở bản Supabase):
//            - xếp bé vào vùng + cấp cổng thung lũng trống, mở sẵn vùng quanh cổng
//            - chỉ trả đơn vị đối thủ đứng trong vùng SÁNG của bé (chống xem trộm, mục 8)
//            - kiểm lại ô xây được (mục 4), ai tới trước được
//            - thu hoạch gộp: cắt theo trữ lượng còn lại + tốc độ tối đa (mục 6)
//            - mặt nạ khám phá chỉ thêm, không bớt
// HÀM KHAI RA (goc.KC_DT_MAY_CHU):
//   taoMayChuGia({ vung, cauHinh, kho?, dongHo? }) -> máy chủ có các hàm (đều async):
//     vaoVung(ten)                 -> { ok, maVung, banSao, cong, lanDau, khamPha, donVi[], kho, gio }
//     layQuanh(ten)                -> { ok, gio, nguon[{ma, con}], congTrinh[], donVi[] }
//     guiLenh(ten, idDonVi, lenh)  -> { ok, batDau, tu }
//         lenh = { tu: [x, z], den: [ô x, ô y], viec?: mã nguồn đang làm, khamPha?: đang tự khám phá }
//     guiThuHoach(ten, [{ma, so}]) -> { ok, ds[{ma, duoc}], kho }
//     xay(ten, { loai, x, y, xoay? }) -> { ok, id, boTuong[], kho } | { ok: false, ma, lyDo }   (đặt móng)
//     xayTuong(ten, [[x, y]...])   -> { ok, ds[{id, x, y}], kho } | { ok: false, ma, lyDo, o }   (TC_D02C)
//     xayXong(ten, id)             -> { ok, donVi[] } (Lều trại: kèm nông dân đầu tiên) | { ok: false, lyDo }
//     luuKhamPha(ten, chuoiBase64) -> { ok }
//     phaHuy(ten, id)              -> { ok, id, kho, hang } | { ok: false, ma: khong_phai_nha | chua_xong } (TC_D06C2d; TC_D06C7c: cả Lều trại)
//     gio()                        -> giờ máy chủ (ms)
//   kho: giống localStorage (getItem / setItem); không có thì giữ trong bộ nhớ.
//   TC_D02C: trừ giá khi đặt móng + giới hạn số mỗi bé; lãnh địa (tường + cổng đã xong khép kín):
//   bé khác không xây trong đó, lệnh đi không vào đó; tháp canh / tường / cổng soi sương theo tầm nhìn riêng.
//   TC_D03A - MÁY CHỦ GIỮ TIẾN ĐỘ XÂY + TÍNH BÙ KHI BÉ VẮNG MẶT (SQL làm y hệt):
//   - lenh có thêm xay (id công trình đang tới xây) + hang (id móng xây tiếp). tinhXay(bé): mô phỏng từ lần
//     tính trước tới giờ: mỗi công trình tiến theo số người ĐÃ TỚI nơi (KC_DT_LANG.tocDoXay), xong thì người
//     xây sang móng kế trong hàng, hết hàng thì nghỉ. Gọi trước mọi việc đổi lệnh + khi hỏi lại -> điều người
//     đi thì công trình dừng đúng chỗ. xayXong chỉ nhận khi máy chủ thấy đã xong (cho sớm tối đa xay.treGiay giây).
//   - bé không liên lạc quá lang.vangMat.sauGiay giây = vắng mặt: tinhVang(bé) tính bù việc nông dân đang
//     làm (chuyến đi về lều theo khoảng cách + sức mang + nhịp làm), nguồn cạn thì sang nguồn sát bên, kho
//     đầy thì dừng; không giới hạn số giờ. Bé khác đang chơi: tính bù tối đa mỗi tinhLaiGiay giây (nguồn
//     chung vơi đúng). vaoVung trả vang = { giay, thu{tài nguyên: số}, xong[loại], day{tài nguyên} }.
//   - guiThuHoach: kho mỗi loại không quá sức chứa (congTrinh.*.sucChua của công trình đã xong).
//   TC_D03B1 - KHO RIÊNG + DÂN SỐ + SINH NÔNG DÂN (SQL làm y hệt):
//   - sức chứa theo cấp + chủng loại (KC_DT_LANG.sucChuaCt); tính bù vắng mặt: chuyến đi về chỗ cất GẦN NHẤT nhận
//     loại tài nguyên đó (Lều trại hoặc kho đúng loại).
//   - sinhNongDan(ten) -> { ok, hang{so, batDau}, kho, danSo, choO } | { ok: false, ma: chua_leu | hang_day | cho_o | thieu }:
//     xếp hàng ở Lều trại, trả giá lúc xếp; tinhSinh(bé) ra từng người mỗi congTrinh.leu.sinh.giay giây theo giờ máy
//     chủ (cả khi bé vắng mặt; vang.sinh = số người ra lúc vắng). vaoVung + layQuanh trả hang (null = không có ai chờ).
//   TC_D03B2 - RUỘNG (SQL làm y hệt): ruộng xong (hoanThanh) có trongLuc / con (sanLuong theo cấp) / gatLuc; chín sau
//     chinGiay giây giờ máy chủ. Lệnh viec < 0 = gặt ruộng id -viec: guiThuHoach nhận khi chín, gặt hết -> gatLuc (bãi);
//     tinhVang gặt bù khi vắng mặt (chờ chín, chuyến về chỗ cất gần nhất như hái quả; vang.gat = số ruộng gặt hết);
//     donRuong: bãi quá coSauGiay giây thành cỏ (bỏ ruộng); ruộng xây ở bất kỳ chỗ nào hợp lệ như mọi công trình;
//     trongLai(ten, id) -> { ok, id, trongLuc, con, kho } | { ok: false, ma: het_bai | chua_gat | thieu }.
//   TC_D06C1 - QUÁI CHUNG (SQL làm y hệt): vaoVung / layQuanh trả quai[] (bản ghi: id, ma, lv, x, z, hat, sinhLuc, khoa, chay;
//     đường đi tính ở máy bé bằng KC_DT_QUAI_BAN_DO.viTri) + nghiDen (giờ hết nghỉ của Thủ lĩnh); quaiGiu(ten, id, x, z),
//     quaiDanh(ten, id), quaiKet(ten, id, ket, nghiGiay): khoá quái cho một bé, kết quả, giờ nghỉ khi thua. quaiBu sinh quái hoang
//     (quaiBanDo.soQuai) + quái quanh mỗi Lều trại (quanhLeu), thả khoá quá hạn, sinh lại sau hoiSinhGiay.
//   TC_D06C2a - QUÁI HUNG DỮ: quái sinh ở ô ngoài vùng sáng của mọi bé thì hung (tỉ lệ quaiBanDo.hung.tiLe), bản ghi có hung;
//     quaiGiu(ten, id, x, z, lao): lao = quái hung tự lao vào Thủ lĩnh (khoá trang "lao", được xa chỗ ở tới hung.duoiToiDa + giuLechO).
//   TC_D06C2b - NÔNG DÂN ĐÁNH QUÁI: quaiGiu(ten, id, x, z, lao, dv) / quaiDanh(ten, id, dv) / quaiKet(ten, id, ket, nghiGiay, giu, dan)
//     với dv = id nông dân của bé (không có = Thủ lĩnh): khoá quái ghi thêm khoa.dv; mỗi người (Thủ lĩnh / từng nông dân) giữ một
//     con; Thủ lĩnh đang nghỉ không cản nông dân. dan = { dv, mau }: mau = máu nông dân còn (chỉ giảm, không tự hồi; donVi[].mau,
//     null = đầy); ket "quai" với nông dân = nông dân bỏ chạy -> XOÁ người dân đó (mất cả đồ đang vác), Thủ lĩnh không nghỉ.
//   TC_D06C2g - TRỤ PHÒNG THỦ (SQL làm y hệt, luật dt/dt_tru_tran.js): truCau(ten, id, ds) chủ trụ gắn soCau câu; truKhai(ten, id) trụ
//     của bé khác khai chiến Thủ lĩnh trong tầm (không chính chủ, chưa câu, đang nghỉ, miễn mienGiay, làng vắng mặt có bảo hộ);
//     truLuot / truTra(ten, idTran, { chon, beDung }) / truRut: lượt trụ / lượt bé, máy chủ giữ đáp án; máu ghi ngay; trụ thua -> hongLuc
//     (đống gạch, xoá sau hongGiay giây); Thủ lĩnh thua -> nghỉ, nghỉ xong đủ máu. layQuanh: câu chỉ trả cho chủ trụ (coCau cho bé khác).
//     quaiKet(..., dan = { mau }) không có dv: máu Thủ lĩnh còn lại (chỉ giảm); thua quái -> đủ máu sau nghỉ.
//   TC_D06C2h: truBan(ten, id, dv): trụ tự bắn một phát nông dân dv (máy chủ quyết trúng, nhịp tru.nhipBanGiay); truKhai(ten, id, dv):
//     nông dân vào trận câu hỏi với trụ (thua = mất nông dân); ct.ban = [{ luc, dv, trung }] phát bắn gần nhất (cả lượt trụ trong trận).
//   TC_D06C4 - QUÁI RƠI ĐỒ (SQL kc_dt_quai_thang / kc_dt_doc_roi_do làm y hệt; repo_rieng dac_ta_roi_do.md): opt.roiDo = bảng rơi đồ
//     (du_lieu/roi_do.json; không có = không rơi). quaiThang(ten, id, dan) = quaiKet(..., "be", ...) + chỉ khi chính người đó đang giữ
//     quái thì gieo đồ (dt_roi_do.js gieo): đồ NẰM TRÊN ĐẤT chỗ quái, chỉ bé thắng thấy, mất sau giayMat giây -> thêm { roi[] }.
//     nhatDo(ten, id, dv): nông dân tới sát món đồ nhặt -> CẦM TRÊN TAY (TC_D06C5). catDo(ten, dv): nông dân cầm đồ tới Lều / kho -> kho (không quá
//     sức chứa) / túi đồ. nongDanMienPhi(ten): làng hết nông dân -> tặng 1 người. doRoiDs(ten): đồ trên đất trong vùng (của bé + bé khác) + đồ bé đang cầm.
//     bangRoiDo() -> { ok, vatPham, quai, macDinh }.
//   TC_D06C7a (07/11/2026): vaoVung / layQuanh trả lanhDia [{ chu, mat (base64, BD.maHoaLanhDia) }] lãnh địa của MỌI bé; quái không đứng trên ô cổng;
//     quái đã có mà bị rào kín vẫn sống trong vùng rào (không bị dọn), chỉ không sinh mới trong lãnh địa.
//   TC_D06C7b (08/11/2026): cauKho(ten, ds) kho câu của bé; danhKhai(ten, id, duPhong) Thủ lĩnh đánh công trình thường của bé khác (trận
//     dùng truLuot / truTra / truRut như trụ, câu giữ trong trận tr.cau); vaoVung trả soCauKho; thua -> đống gạch, rào / cổng thôi là
//     lãnh địa ngay; bảo hộ khi chủ vắng = cách Lều không quá tru.phamViLang ô (bỏ "trong lãnh địa").
//   TC_D06C7d (08/11/2026): SỐ CÂU RIÊNG từng công trình (ct.soCau; xây mới có sẵn muaCau.coSan câu): muaCau(ten, id, so) bé mua câu bằng
//     vàng (+ máu), suaCt(ten, id) sửa = mua lại máu đã mất; trận (danhKhai / truKhai) theo TT.soCt; trận trụ giữ đủ câu trong tr.cau
//     (câu của trụ + bù từ kho câu của chủ).
//   TC_D06C7e (08/11/2026): muaCau(ten, id, so, cau) câu bé tự chọn gắn vào công trình (trận hỏi trước, thiếu bù kho câu của chủ);
//   TC_D06E (09/11/2026): doiCau(ten, id, viTri, cau) bé đổi từng câu bằng thư viện câu hỏi, miễn phí;
//     suaCt(ten, id) trừ tài nguyên (không vàng), ct.sua = { tienDo, giay }: nông dân tới sửa như xây (tinhXay, guiLenh, xayXong báo sửa xong).
// BƯỚC: TC_D02B2a; TC_D02B2b (dựng lều + nông dân đầu tiên, kho tài nguyên, lệnh nhớ việc); TC_D02C; TC_D03A; TC_D03B1; TC_D03B2; TC_D06C1; TC_D06C2a; TC_D06C2b
// NGÀY: 26/10/2026; 27/10/2026; 28/10/2026 00:05; 28/10/2026 10:50; 28/10/2026 15:10; 28/10/2026 19:05; 30/10/2026 17:30; 04/11/2026; 04/11/2026 23:xx
// PHỤ THUỘC: dt/dt_luoi.js, dt/dt_lang.js (KC_DT_LANG), dt/dt_ban_do.js (KC_DT_BAN_DO), dt/dt_quai_ban_do.js (KC_DT_QUAI_BAN_DO, TC_D06C1),
//   dt/dt_roi_do.js (KC_DT_ROI_DO, TC_D06C4: chỉ cần khi có opt.roiDo)
// ================================================================
(function (goc) {
  "use strict";
  const PHIEN_BAN = 1;
  const khoaLuu = maVung => "kc_dt_may_chu_gia_" + maVung;
  const tenChuan = t => String(t || "").trim().toLowerCase();

  function taoMayChuGia(opt) {
    const LANG = goc.KC_DT_LANG, BD = goc.KC_DT_BAN_DO;
    const vung = opt.vung, CH = opt.cauHinh, CB = CH.banDo;
    const gio = () => (opt.dongHo ? opt.dongHo() : Date.now());
    const boNho = {};
    const kho = opt.kho || { getItem: k => (k in boNho ? boNho[k] : null), setItem: (k, v) => { boNho[k] = String(v); } };

    // Trạng thái chung (bản Supabase: các bảng kc_dt_vung / _nguon / _cong_trinh / _don_vi / _kham_pha)
    function docTrangThai() {
      try {
        const t = JSON.parse(kho.getItem(khoaLuu(vung.ma)) || "null");
        if (t && t.phienBan === PHIEN_BAN) return t;
      } catch (e) { /* dữ liệu hỏng: làm lại từ đầu */ }
      return { phienBan: PHIEN_BAN, be: {}, donVi: [], congTrinh: [], nguon: {}, soId: 0 };
    }
    let tt = docTrangThai();
    const luu = () => { try { kho.setItem(khoaLuu(vung.ma), JSON.stringify(tt)); } catch (e) { /* bộ nhớ đầy / bị chặn */ } };

    // Lõi làng của máy chủ: giữ trữ lượng nguồn chung + lưới đường đi để tính vị trí từ lệnh
    const lang = LANG.taoLang({ banDo: vung, cauHinh: CH, dongHo: gio });
    for (const ma in tt.nguon) {
      const n = lang.nguonTheoMa(Number(ma));
      if (n) { n.con = Math.min(n.con, tt.nguon[ma].con); }
    }
    // Lãnh địa từng bé (TC_D02C): tường + cổng ĐÃ DỰNG XONG
    const lanhDia = BD.taoBoLanhDia(vung.rong, vung.cao);
    const LUOI = goc.KC_DT_LUOI;
    const oCua = (ct, f) => { for (let oy = ct.y; oy < ct.y + ct.sau; oy++) for (let ox = ct.x; ox < ct.x + ct.rong; ox++) if (ox >= 0 && oy >= 0 && ox < vung.rong && oy < vung.cao) f(ox, oy); };
    const datCt = ct => {
      lang.datMong(ct.x, ct.y, ct.rong, ct.sau);
      if (ct.loai === "cong") lang.datCong(ct.x, ct.y, ct.rong, ct.sau, ct.chu, true);
      if (ct.loai === "ruong") oCua(ct, (ox, oy) => LUOI.datChan(lang.luoi, ox, oy, false)); // TC_D03B2: ô ruộng đi được
      if (ct.xongLuc && !ct.hongLuc && BD.LA_RAO[ct.loai]) lanhDia.dat(ct.chu, ct.x, ct.y, ct.rong, ct.sau, true); // TC_D06C7b: rào đã sụp không tính
    };
    for (const ct of tt.congTrinh) datCt(ct);
    // TC_D06C7a: lãnh địa của MỌI bé (cả chỗ bé chưa khám phá) để quái trên máy bé tránh đúng như máy chủ: [{ chu, mat (base64) }]
    const lanhDiaRa = () => lanhDia.dsChu().map(chu => { const m = lanhDia.cua(chu); return m ? { chu, mat: BD.maHoaLanhDia(m) } : null; }).filter(Boolean);

    const viTri = dv => dv.lenh ? BD.viTriTuLenh(lang, dv.lenh, gio(), null, dv.chu) : { x: dv.x, z: dv.z };
    const khoCua = be => { const k = {}; for (const t in CH.lang.taiNguyen) k[t] = (be.kho && be.kho[t]) || 0; return k; };
    const hangCua = be => (be && be.hangSinh && be.hangSinh.so ? { so: be.hangSinh.so, batDau: be.hangSinh.batDau } : null); // TC_D03B1
    const cuaBe = ten => tt.donVi.filter(d => d.chu === ten);
    const cungPhe = ten => chu => chu === ten; // đồng minh: TC_D17B
    const trongCt = (c, x, y) => x >= c.x && x < c.x + c.rong && y >= c.y && y < c.y + c.sau;
    const laRaoCua = (ten, loai) => (x, y) => tt.congTrinh.some(c => c.chu === ten && (loai ? c.loai === loai : BD.LA_RAO[c.loai]) && trongCt(c, x, y));
    // Tài nguyên còn thiếu cho giá x n (null = đủ)
    const thieuGia = (be, gia, n) => { for (const t in gia || {}) if (((be.kho && be.kho[t]) || 0) < gia[t] * n) return t; return null; };
    const truGia = (be, gia, n) => { be.kho = be.kho || {}; for (const t in gia || {}) be.kho[t] = (be.kho[t] || 0) - gia[t] * n; };
    const loiThieu = t => ({ ok: false, ma: "thieu", lyDo: BD.LY_DO.thieu(CH.lang.taiNguyen[t].ten.toLowerCase()) });

    // ---------------- TC_D03A: tiến độ xây + tính bù khi vắng mặt ----------------
    const VM = CH.lang.vangMat, TOC = CH.lang.tocDo;
    const mauCt = loai => (CH.congTrinh && CH.congTrinh[loai]) || { giayXay: 0 };
    // Giây đi hết lệnh theo đường thẳng (như SQL kc_dt_giay_di; Thủ lĩnh chạy khi xa, như viTriTuLenh)
    function giayDi(l) {
      const L = Math.hypot(l.den[0] + 0.5 - l.tu[0], l.den[1] + 0.5 - l.tu[1]);
      if (l.vaiTro === "thu_linh" && L > TOC.chayKhiXaHon) return (L - TOC.chayKhiXaHon) / TOC.chay + TOC.chayKhiXaHon / TOC.di;
      return L / TOC.di;
    }
    const toiLuc = l => l.batDau + giayDi(l) * 1000;
    // Sức chứa mỗi loại tài nguyên của bé: tổng sucChua công trình đã xong (lõi: lang.sucChua; TC_D03B1: theo cấp + chủng loại)
    function sucChua(ten, t) {
      const cl = tt.be[ten] && tt.be[ten].chungLoai;
      let s = 0;
      for (const c of tt.congTrinh) if (c.chu === ten && c.xongLuc) s += LANG.sucChuaCt(CH, c.loai, c.cap, cl, t);
      return s;
    }
    // TC_D03B1: chỗ ở (Lều 5, Nhà ở 3 mỗi nhà đã xong) + dân số (đơn vị chiếm chỗ ở: nông dân)
    const choO = ten => tt.congTrinh.reduce((s, c) => s + (c.chu === ten && c.xongLuc ? LANG.choOCt(CH, c.loai) : 0), 0);
    const danSo = ten => tt.donVi.filter(d => d.chu === ten && LANG.chiemCho(CH, d.loai)).length;
    const leuXongCua = ten => tt.congTrinh.find(c => c.chu === ten && c.loai === "leu" && c.xongLuc) || null;
    // Ô quanh lều đi được, gần cửa (phía nam) trước (SQL: kc_dt_cho_quanh)
    function choQuanh(ct) {
      const cho = [], cx = ct.x + ct.rong / 2, cz = ct.y + ct.sau + 1;
      for (let oy = ct.y - 1; oy <= ct.y + ct.sau; oy++) for (let ox = ct.x - 1; ox <= ct.x + ct.rong; ox++) {
        if (oy >= ct.y && oy < ct.y + ct.sau && ox >= ct.x && ox < ct.x + ct.rong) continue;
        if (goc.KC_DT_LUOI.diDuoc(lang.luoi, ox, oy)) cho.push({ x: ox + 0.5, z: oy + 0.5, d: Math.hypot(ox + 0.5 - cx, oy + 0.5 - cz) });
      }
      cho.sort((a, b) => a.d - b.d);
      return cho.length ? cho : [{ x: cx, z: cz }];
    }
    // Công trình xong (mô phỏng hoặc báo xong): tường / cổng tính lại lãnh địa; Lều trại sinh nông dân đầu tiên
    function hoanThanh(ct, luc) {
      ct.xongLuc = luc; ct.tienDo = 1;
      if (BD.LA_RAO[ct.loai]) lanhDia.dat(ct.chu, ct.x, ct.y, ct.rong, ct.sau, true);
      if (ct.loai === "ruong") { ct.trongLuc = luc; ct.con = LANG.sanLuongRuong(CH, ct.cap); ct.gatLuc = null; } // TC_D03B2: xong là trồng
      if (ct.loai !== "leu") return;
      if (tt.be[ct.chu] && tt.be[ct.chu].doiLeu) return; // TC_D06C7c: Lều dựng lại sau khi tự phá không tặng thêm nông dân
      const cho = choQuanh(ct); // mỗi người một ô
      for (let i = 0; i < (mauCt("leu").nongDanDau || 0); i++) {
        const p = cho[i % cho.length];
        tt.donVi.push({ id: ++tt.soId, chu: ct.chu, loai: "nong_dan", x: p.x, z: p.z, lenh: null });
      }
    }
    // TC_D03B1: hàng sinh nông dân ở Lều trại (be.hangSinh = { so, batDau }: batDau = lúc người đầu hàng bắt đầu).
    // Mỗi sinh.giay giây ra một người ở ô quanh lều (theo giờ máy chủ, cả khi bé vắng mặt). Trả số người vừa ra.
    function tinhSinh(ten, bay) {
      const be = tt.be[ten], h = be.hangSinh, leu = leuXongCua(ten);
      if (!h || !h.so || !leu) return 0;
      const ms = mauCt("leu").sinh.giay * 1000, cho = choQuanh(leu);
      let ra = 0;
      while (h.so > 0 && h.batDau + ms <= bay) {
        if (danSo(ten) >= choO(ten)) break; // hết chỗ ở (chỉ khi cài đặt đổi): chờ, có chỗ thì ra ngay
        const p = cho[danSo(ten) % cho.length];
        tt.donVi.push({ id: ++tt.soId, chu: ten, loai: "nong_dan", x: p.x, z: p.z, lenh: null });
        h.so--; h.batDau += ms; ra++;
      }
      if (!h.so) be.hangSinh = null;
      return ra;
    }
    // TC_D06C7e (người dùng 08/11/2026: nông dân tới sửa): công trình đã xong bị đánh, bé bấm Sửa -> ct.sua = { tienDo, giay } (giay = TT.giaySua:
    // giây 1 người sửa xong). Nông dân sửa như xây móng (lệnh xay = id, tốc độ theo số người + hệ số cấp); xong thì máu đầy.
    const dangLam = c => !c.xongLuc || (!!c.sua && !c.hongLuc);
    const tienLam = c => (c.sua ? c.sua.tienDo || 0 : c.tienDo || 0);
    const tocDoLam = (c, n) => LANG.tocDoXay(CH, { giayXay: c.sua ? c.sua.giay : mauCt(c.loai).giayXay, cap: c.cap }, n);
    function suaXong(c) {
      c.sua = null; c.mau = null;
      if (!Number.isInteger(c.soCau) && TT) c.soCau = TT.soCt(CH, c).soCau; // công trình xây trước TC_D06C7d: ghi số câu ra
      for (const d of tt.donVi) if (d.lenh && d.lenh.xay === c.id) d.lenh = Object.assign({}, d.lenh, { xay: null }); // người sửa thôi lệnh sửa
    }
    // Mô phỏng xây của bé từ be.xayBuLuc tới bay (SQL: kc_dt_tinh_xay). Trả các công trình vừa xong.
    function tinhXay(ten, bay) {
      const be = tt.be[ten];
      const tu = be.xayBuLuc != null ? be.xayBuLuc : be.vaoLuc;
      be.xayBuLuc = Math.max(tu, bay);
      const ct = new Map();
      for (const c of tt.congTrinh) if (c.chu === ten && dangLam(c)) ct.set(c.id, c);
      const tho = [];
      for (const d of tt.donVi) if (d.chu === ten && d.lenh && d.lenh.xay != null) {
        const c = ct.get(d.lenh.xay);
        tho.push({ d, dich: c && LANG.duocXay(d.loai, c.loai) ? c.id : null, hang: (d.lenh.hang || []).slice(), toi: toiLuc(d.lenh), doi: false });
      }
      if (!ct.size || !tho.length || bay <= tu) return [];
      const conXay = (t, id) => { const c = ct.get(id); return !!c && dangLam(c) && LANG.duocXay(t.d.loai, c.loai); };
      const sangTiep = (t, luc) => { // đích xong / không xây được: sang móng kế (ngay tại chỗ), hết thì nghỉ
        t.dich = null; t.doi = true;
        while (t.hang.length) { const id = t.hang.shift(); if (conXay(t, id)) { t.dich = id; t.toi = luc; break; } }
      };
      for (const t of tho) if (t.dich == null && (t.d.lenh.xay != null)) sangTiep(t, Math.max(tu, t.toi));
      const xong = [];
      let t0 = tu;
      for (let vong = 0; vong < 2000 && t0 < bay; vong++) {
        const so = new Map(); let toiSau = Infinity;
        for (const t of tho) if (t.dich != null) { if (t.toi <= t0) so.set(t.dich, (so.get(t.dich) || 0) + 1); else toiSau = Math.min(toiSau, t.toi); }
        if (!so.size && toiSau === Infinity) break;
        let t1 = Math.min(bay, toiSau);
        for (const [id, n] of so) { const c = ct.get(id), v = tocDoLam(c, n); t1 = Math.min(t1, t0 + (1 - tienLam(c)) / v * 1000); }
        for (const [id, n] of so) {
          const c = ct.get(id), v = tocDoLam(c, n), p = Math.min(1, tienLam(c) + v * (t1 - t0) / 1000);
          if (c.sua) { c.sua.tienDo = p; if (p >= 1 - 1e-9) suaXong(c); continue; } // TC_D06C7e: sửa xong không tính là "xây xong"
          c.tienDo = p;
          if (c.tienDo >= 1 - 1e-9) { hoanThanh(c, Math.round(t1)); xong.push(c); }
        }
        for (const t of tho) if (t.dich != null && !dangLam(ct.get(t.dich))) sangTiep(t, t1);
        t0 = t1;
      }
      // người đã sang móng khác / thôi xây: chỉ đổi phần xây của lệnh, GIỮ chỗ đứng (lệnh kế của máy bé so tốc độ
      // với chỗ thật; móng kế liền bên nên coi như đã tới)
      for (const t of tho) if (t.doi) {
        const c = t.dich != null ? ct.get(t.dich) : null;
        t.d.lenh = Object.assign({}, t.d.lenh, c ? { xay: c.id, hang: t.hang, viec: null } : { xay: null, hang: [] });
      }
      return xong;
    }
    // Số món một nông dân mang về mỗi mili giây ở nguồn n (đi về chỗ cất + làm đủ một lần vác).
    // TC_D03B1: chỗ cất = công trình đã xong của bé GẦN NHẤT nhận loại tài nguyên đó (Lều trại hoặc kho đúng loại);
    // quãng = từ nguồn tới tâm công trình trừ (nửa cạnh dài + 1) ô (Lều 2 x 2: trừ 2 như TC_D03A)
    function nhipThu(n, ten, cl) {
      const sm = CH.lang.sucMang[cl] || CH.lang.sucMang.nhan;
      let d = Infinity;
      for (const c of tt.congTrinh) if (c.chu === ten && c.xongLuc && LANG.nhanCat(CH, c.loai, n.taiNguyen))
        d = Math.min(d, Math.hypot(n.x - (c.x + c.rong / 2), n.z - (c.y + c.sau / 2)) - (Math.max(c.rong, c.sau) / 2 + 1));
      if (d === Infinity) return 0;
      d = Math.max(0.5, d);
      return sm / (2 * d * VM.heSoDuong / TOC.di + sm * CH.lang.nguon[n.loai].nhipLam) / 1000;
    }
    // ---------------- TC_D03B2: ruộng (công trình có thêm trongLuc, con, gatLuc) ----------------
    const MR = LANG.mauRuong(CH);
    const ruongCua = (ten, id) => tt.congTrinh.find(c => c.id === id && c.chu === ten && c.loai === "ruong" && c.xongLuc) || null;
    const chinLuc = ct => ct.trongLuc + MR.chinGiay * 1000;
    const tamRuong = ct => ({ x: ct.x + ct.rong / 2, z: ct.y + ct.sau / 2, taiNguyen: CH.lang.nguon.ruong.taiNguyen, loai: "ruong" });
    // Bãi gặt hết bỏ quá coSauGiay giây thành cỏ: bỏ ruộng, trả ô (SQL: kc_dt_don_ruong)
    function donRuong(ten, bay) {
      tt.congTrinh = tt.congTrinh.filter(c => {
        if (c.chu !== ten || c.loai !== "ruong" || c.gatLuc == null || LANG.giaiDoanRuong(CH, c, bay) !== "co") return true;
        oCua(c, (ox, oy) => { lang.danh[oy * vung.rong + ox] = 0; LUOI.datChan(lang.luoi, ox, oy, false); });
        return false;
      });
    }
    // Tính bù việc nông dân lúc bé vắng mặt (SQL: kc_dt_tinh_vang)
    function tinhVang(ten, bay, bao) {
      const be = tt.be[ten];
      const tu = Math.max(be.songLuc || be.vaoLuc, be.buLuc || 0);
      be.buLuc = Math.max(tu, bay);
      const leu = tt.congTrinh.find(c => c.chu === ten && c.loai === "leu" && c.xongLuc);
      if (!leu || bay <= tu) return;
      be.kho = be.kho || {};
      for (const d of cuaBe(ten)) {
        const l = d.lenh;
        if (d.loai !== "nong_dan" || !l || l.viec == null || l.xay != null) continue;
        if (l.viec < 0) { // TC_D03B2: gặt ruộng: chờ lúa chín, gánh về chỗ cất gần nhất; gặt hết thì thành bãi (không tự trồng lại)
          const ct = ruongCua(ten, -l.viec);
          if (!ct || ct.gatLuc != null) continue;
          const nr = tamRuong(ct), tn = nr.taiNguyen, cho = sucChua(ten, tn) - (be.kho[tn] || 0);
          const t = Math.max(tu, toiLuc(l), leu.xongLuc, chinLuc(ct));
          if (t >= bay) continue;
          if (cho <= 0) { bao.day[tn] = true; continue; }
          const v = nhipThu(nr, ten, be.chungLoai), lay = v > 0 ? Math.min(Math.floor(v * (bay - t)), ct.con, cho) : 0;
          if (lay <= 0) continue;
          ct.con -= lay;
          be.kho[tn] = (be.kho[tn] || 0) + lay;
          bao.thu[tn] = (bao.thu[tn] || 0) + lay;
          if (ct.con <= 0) { ct.gatLuc = Math.round(t + lay / v); bao.gat = (bao.gat || 0) + 1; }
          if (lay === cho) bao.day[tn] = true;
          continue;
        }
        let n = lang.nguonTheoMa(l.viec), doi = false, t = Math.max(tu, toiLuc(l), leu.xongLuc);
        while (n && lang.dangSong(n) && t < bay) {
          const tn = n.taiNguyen, cho = sucChua(ten, tn) - (be.kho[tn] || 0);
          if (cho <= 0) { bao.day[tn] = true; break; }
          const v = nhipThu(n, ten, be.chungLoai), lay = v > 0 ? Math.min(Math.floor(v * (bay - t)), n.con, cho) : 0;
          if (lay <= 0) break;
          n.con -= lay;
          tt.nguon[n.ma] = { con: n.con, hetLuc: n.con <= 0 ? bay : null };
          be.kho[tn] = (be.kho[tn] || 0) + lay;
          bao.thu[tn] = (bao.thu[tn] || 0) + lay;
          t += lay / v;
          if (lay === cho) { bao.day[tn] = true; break; } // vừa đầy kho
          if (n.con > 0) break; // hết giờ hoặc kho đầy
          const tiep = lang.nguonSatBen(n);
          if (!tiep) break;
          n = tiep; doi = true;
        }
        if (doi) d.lenh = Object.assign({}, l, { tu: [l.den[0] + 0.5, l.den[1] + 0.5], den: [n.o.x, n.o.y], batDau: Math.round(t), viec: n.ma });
      }
    }
    // Tính bù cho một bé trước khi trả lời: xây (luôn) + việc nông dân (khi bé vắng mặt; bé khác hỏi thì
    // tối đa mỗi tinhLaiGiay giây). Ghi lời báo vắng mặt vào be.baoVang (vaoVung trả rồi xoá).
    function tinhBu(ten, bay, laChinh) {
      const be = tt.be[ten];
      const vang = bay - (be.songLuc || be.vaoLuc) > VM.sauGiay * 1000;
      if (!laChinh && vang && bay - (be.buLuc || 0) < VM.tinhLaiGiay * 1000) return;
      const bao = vang ? (be.baoVang = be.baoVang || { tu: be.songLuc || be.vaoLuc, thu: {}, xong: [], day: {} }) : null;
      const xong = tinhXay(ten, bay);
      const sinh = tinhSinh(ten, bay); // TC_D03B1: sau xây (Nhà ở vừa xong thì có chỗ)
      donRuong(ten, bay); // TC_D03B2
      if (!bao) return;
      for (const c of xong) bao.xong.push(c.loai);
      if (sinh) bao.sinh = (bao.sinh || 0) + sinh;
      tinhVang(ten, bay, bao);
      donRuong(ten, bay); // ruộng gặt hết lúc vắng mặt mà đã quá hạn bãi
    }
    const songLai = (ten, bay) => { tinhBu(ten, bay, true); tt.be[ten].songLuc = bay; };

    // Sương mù của một bé, tính tại máy chủ: đã khám phá (lưu) + sáng (đơn vị + công trình đã xong của phe)
    function suongCua(ten) {
      const s = BD.taoSuongMu(vung.rong, vung.cao), be = tt.be[ten];
      if (be && be.khamPha) s.nap(be.khamPha);
      const cl = be && be.chungLoai;
      const nguonSoi = cuaBe(ten).map(d => { const p = viTri(d); return { x: p.x, z: p.z, r: BD.tamNhin(CB, d.loai, cl) }; });
      for (const ct of tt.congTrinh) if (ct.chu === ten && ct.xongLuc) nguonSoi.push({ x: ct.x + ct.rong / 2, z: ct.y + ct.sau / 2, r: BD.tamNhinCt(CB, ct.loai, cl) });
      s.soi(nguonSoi);
      s.nguonSoi = nguonSoi; // TC_D06C2i: layQuanh trả cả nhà của bạn ngay ngoài tầm nhìn (banDo.thayNhaThemO)
      return s;
    }
    // Điều kiện ô xây được của bé (mục 4): sương, đơn vị đối thủ, lãnh địa đối thủ; cổng được đè tường của bé
    function theXay(ten, loai) {
      const oDoiThu = new Set();
      for (const d of tt.donVi) if (d.chu !== ten) { const p = viTri(d); oDoiThu.add(Math.floor(p.z) * vung.rong + Math.floor(p.x)); }
      return { lang, suong: suongCua(ten), coDoiThu: (ox, oy) => oDoiThu.has(oy * vung.rong + ox),
        laLanhDiaDoiThu: (ox, oy) => !!lanhDia.chuO(ox, oy, ten), deLen: loai === "cong" ? laRaoCua(ten, "tuong") : null };
    }

    // ---------------- TC_D06C1: QUÁI CHUNG (SQL kc_dt_quai làm y hệt) ----------------
    // Mỗi quái một bản ghi { id, leu (id Lều trại nếu là quái quanh làng), ma, lv, x, z (chỗ ở), hat, sinhLuc, khoa, chay };
    // đường lang thang mọi máy tự tính (KC_DT_QUAI_BAN_DO.viTri). quaiBu tối đa mỗi buGiay giây: thả khoá quá hạn,
    // bỏ quái của lều đã mất, chỗ ở bị chặn thì quái đi mất, tới hẹn thì sinh lại chỗ mới, sinh thêm cho đủ số.
    const QB = goc.KC_DT_QUAI_BAN_DO, CQ = CH.quaiBanDo;
    const dsLeu = () => tt.congTrinh.filter(c => c.loai === "leu").map(c => ({ id: c.id, chu: c.chu, x: c.x + c.rong / 2, z: c.y + c.sau / 2, xong: !!c.xongLuc }));
    const laRuong = (x, y) => tt.congTrinh.some(c => c.loai === "ruong" && trongCt(c, x, y));
    // Ô quái đứng / đi được: như lõi trang (dt3d_quai_ban_do.js): không chặn, không ruộng, không lãnh địa, không sát lều
    // TC_D06C7a: ô cổng không đứng được; quaiNhaDuoc = chỗ ở còn dùng được: như trên nhưng KHÔNG xét lãnh địa (người dùng 07/11/2026:
    // quái đã có mà bị rào kín thì vẫn sống bình thường trong vùng rào, chỉ không sinh quái mới trong đó)
    const quaiNhaDuoc = leu => (x, y) => LUOI.diDuoc(lang.luoi, x, y) && !laRuong(x, y) && lang.chuCong(x, y) === null
      && !leu.some(l => Math.hypot(l.x - x - 0.5, l.z - y - 0.5) < CQ.khongGanLeu);
    const quaiDiDuoc = leu => { const nha = quaiNhaDuoc(leu); return (x, y) => nha(x, y) && !lanhDia.chuO(x, y, null); };
    const banGhiQuai = q => ({ id: q.id, ma: q.ma, lv: q.lv, x: q.x, z: q.z, hat: q.hat, sinhLuc: q.sinhLuc, hung: !!q.hung, khoa: q.khoa ? { ...q.khoa } : null, chay: q.chay ? { ...q.chay } : null });
    // Quái còn trên bản đồ hoặc vừa bỏ chạy (máy bé vẽ nốt lúc chạy); quái chờ sinh lại thì không trả
    const dsQuai = bay => (tt.quai || []).filter(q => !q.chay || bay < q.chay.luc + CQ.chayGiay * 1000 + 10000).map(banGhiQuai);
    // TC_D06C2a: ô (x, y) có nằm trong vùng sáng của bé nào không (đơn vị + công trình đã xong của mọi bé, như SQL kc_dt_soi)
    function sangAi() {
      const soi = [];
      for (const d of tt.donVi) { const p = viTri(d), be = tt.be[d.chu]; soi.push({ x: p.x, z: p.z, r: BD.tamNhin(CB, d.loai, be && be.chungLoai) }); }
      for (const ct of tt.congTrinh) if (ct.xongLuc) { const be = tt.be[ct.chu]; soi.push({ x: ct.x + ct.rong / 2, z: ct.y + ct.sau / 2, r: BD.tamNhinCt(CB, ct.loai, be && be.chungLoai) }); }
      return (x, y) => soi.some(n => (x + 0.5 - n.x) ** 2 + (y + 0.5 - n.z) ** 2 <= n.r * n.r);
    }
    let sangNay = null; // sangAi() của lần quaiBu đang chạy
    function datQuai(q, c, bay) {
      q.ma = QB.chonLoai(CQ, Math.random()); q.lv = c.lv; q.x = c.x + 0.5; q.z = c.y + 0.5;
      q.hung = QB.coHung(CQ, !!(sangNay && sangNay(c.x, c.y)), Math.random()); // TC_D06C2a
      q.hat = Math.floor(Math.random() * 2147483647); q.sinhLuc = bay; q.khoa = null; q.chay = null;
    }
    function quaiBu(bay) {
      if (!QB || !CQ) return;
      if (!tt.quai) { tt.quai = []; tt.soIdQuai = 0; }
      if (tt.quaiBuLuc && bay - tt.quaiBuLuc < CQ.buGiay * 1000) return;
      tt.quaiBuLuc = bay;
      const leu = dsLeu(), dd = quaiDiDuoc(leu);
      sangNay = sangAi();
      for (const q of tt.quai) if (q.khoa && bay - q.khoa.luc > (q.khoa.trang === "danh" ? CQ.khoaDanhGiay : CQ.khoaToiGiay) * 1000) q.khoa = null;
      tt.quai = tt.quai.filter(q => q.leu == null || leu.some(l => l.id === q.leu && l.xong));
      const henLai = q => { q.chay = { x: q.x, z: q.z, huong: 0, luc: bay + (CQ.thuLaiGiay - CQ.hoiSinhGiay) * 1000 }; }; // mất ngay, sinh lại sau thuLaiGiay
      const ddNha = quaiNhaDuoc(leu); // TC_D06C7a: chỗ ở bị rào kín không tính là bị chặn
      for (const q of tt.quai) if (!q.chay && !q.khoa && !ddNha(Math.floor(q.x), Math.floor(q.z))) henLai(q);
      // cấp làng cao nhất vùng = cấp Lều trại đã dựng cao nhất (chưa có Lều nào: 1) -> Lv quái mới tối đa (lvTheoCapLang)
      const capLang = Math.max(1, ...tt.congTrinh.filter(c => c.loai === "leu" && c.xongLuc).map(c => c.cap || 1));
      const sinh = leuId => QB.chonCho({ ch: CQ, W: vung.rong, H: vung.cao, diDuoc: dd, cong: vung.cong, leu, capLang,
        nha: tt.quai.filter(q => !q.chay).map(q => ({ x: q.x, z: q.z })), quanh: leuId != null ? leu.find(l => l.id === leuId) : null });
      for (const q of tt.quai) if (q.chay && bay >= q.chay.luc + CQ.hoiSinhGiay * 1000) { const c = sinh(q.leu); if (c) datQuai(q, c, bay); else henLai(q); }
      const them = leuId => { const c = sinh(leuId); if (!c) return false; const q = { id: ++tt.soIdQuai, leu: leuId }; datQuai(q, c, bay); tt.quai.push(q); return true; };
      while (tt.quai.filter(q => q.leu == null).length < CQ.soQuai) if (!them(null)) break;
      for (const l of leu) if (l.xong) while (tt.quai.filter(q => q.leu === l.id).length < CQ.quanhLeu.so) if (!them(l.id)) break;
    }
    const tlCua = ten => cuaBe(ten).find(d => d.loai === "thu_linh");
    // TC_D06C2b: người đánh quái: nông dân id dv của bé (dv không có = Thủ lĩnh)
    const nguoiDanh = (ten, dv) => dv == null ? tlCua(ten) : cuaBe(ten).find(d => d.id === Number(dv) && d.loai === "nong_dan") || null;
    const banGhiDo = d => { const vp = (opt.roiDo && opt.roiDo.vatPham[d.ma]) || {}; return { id: d.id, chu: d.chu, camDv: d.camDv == null ? null : d.camDv, ma: d.ma, so: d.so, x: d.x, z: d.z, roiLuc: d.roiLuc, hetLuc: d.hetLuc, ten: vp.ten || d.ma, bieuTuong: vp.bieuTuong || "🎁", nhom: vp.nhom || "tai_nguyen" }; }; // TC_D06C4
    const cungNguoi = (k, ten, dv) => k && k.ten === ten && (k.dv == null ? dv == null : k.dv === Number(dv));

    // ---------------- TC_D06C2g: trụ phòng thủ ----------------
    const TT = goc.KC_DT_TRU_TRAN, LECH_O = 1.5; // Thủ lĩnh (vị trí máy chủ tính) được xa tầm trụ thêm bấy nhiêu ô
    // Câu bé gắn cho trụ: đúng n câu, mỗi câu có nội dung, 2-6 đáp án, đáp án đúng nằm trong số đó (giống SQL kc_dt_cau_sach)
    function chuanCau(ds, n) {
      if (!Array.isArray(ds) || ds.length !== n) return null;
      const chu = (s, max) => (typeof s === "string" ? s.slice(0, max) : "");
      const ra = [];
      for (const c of ds) {
        if (!c || typeof c.noiDung !== "string" || !c.noiDung.trim() || !Array.isArray(c.dapAn) || c.dapAn.length < 2 || c.dapAn.length > 6) return null;
        const dung = (Array.isArray(c.dung) ? c.dung : []).filter(i => Number.isInteger(i) && i >= 0 && i < c.dapAn.length);
        if (!dung.length) return null;
        ra.push({ noiDung: chu(c.noiDung, 300), dapAn: c.dapAn.map(d => chu(String(d), 80)), dung, loiGiai: chu(c.loiGiai, 300),
          mon: chu(c.mon, 20), doKho: chu(c.doKho, 10), hinhChu: chu(c.hinhChu, 20), amThanh: chu(c.amThanh, 120) });
      }
      return ra;
    }
    // Trụ / công trình trong vùng bảo hộ: cách Lều trại của chủ không quá phamViLang ô (TC_D06C7b, người dùng 08/11/2026:
    // bỏ "hoặc nằm trong lãnh địa của chủ")
    const truTrongLang = ct => TT.trongBaoHo(CH, ct, tt.congTrinh.find(c => c.chu === ct.chu && c.loai === "leu"));
    // TC_D06C7b: chủ vắng mặt + công trình trong vùng bảo hộ -> không đánh được
    const baoHo = (ct, bay) => truTrongLang(ct) && !(tt.be[ct.chu] && (tt.be[ct.chu].songLuc || 0) >= bay - VM.sauGiay * 1000);
    // TC_D06C7b: công trình sụp: hàng rào / cổng thôi tính lãnh địa ngay (ô vẫn là đống gạch tới khi máy chủ dọn)
    function sup(ct, bay) {
      ct.hongLuc = bay; ct.sua = null; // TC_D06C7e: đang sửa mà sụp thì thôi sửa
      if (BD.LA_RAO[ct.loai] && ct.xongLuc) lanhDia.dat(ct.chu, ct.x, ct.y, ct.rong, ct.sau, false);
    }
    // Trận bỏ dở quá boGiay giây (bé đóng trang): coi như rút lui; đống gạch quá hongGiay giây thì dọn
    function boTranCu(bay) {
      for (const t of tt.truTran || []) if (!t.ket && bay - t.moLuc > CH.tru.boGiay * 1000) { t.ket = "rut"; t.ben = null; t.ketLuc = bay; }
      tt.truTran = (tt.truTran || []).filter(t => !t.ketLuc || bay - t.ketLuc < CH.tru.mienGiay * 1000 * 2);
      const con = tt.congTrinh.filter(c => !(c.hongLuc && bay - c.hongLuc > CH.tru.hongGiay * 1000));
      for (const c of tt.congTrinh) if (!con.includes(c)) lang.boO(c.x, c.y, c.rong, c.sau);
      tt.congTrinh = con;
    }
    // Máu sau mỗi lượt ghi ngay (bé đóng trang giữa trận vẫn mất máu); kết thúc: trụ thua thành đống gạch, Thủ lĩnh thua về Lều
    function ghiMauTran(tr, ct, bay) {
      if (tr.dv != null) return ghiMauDan(tr, ct, bay); // TC_D06C2h: nông dân đánh trụ
      const tl = tlCua(tr.ten);
      if (tl) tl.mau = tr.mauBe;
      if (ct) ct.mau = tr.mauTru;
      if (!tr.ket) return;
      tr.ketLuc = bay;
      if (tr.ket === "be" && ct) sup(ct, bay);
      if (tr.ket === "tru") { tt.be[tr.ten].nghiDen = bay + CH.tru.nghiGiay * 1000; if (tl) tl.mau = null; } // nghỉ xong đủ máu
    }
    // TC_D06C2h: trận trụ của NÔNG DÂN (tr.dv): máu ghi vào nông dân; thua = nông dân bỏ chạy (mất hẳn, thả quái nó giữ)
    function boDan(ten, nd) {
      tt.donVi = tt.donVi.filter(d => d !== nd);
      for (const q of tt.quai || []) if (q.khoa && q.khoa.ten === ten && q.khoa.dv === nd.id) q.khoa = null;
    }
    function ghiMauDan(tr, ct, bay) {
      const nd = cuaBe(tr.ten).find(d => d.id === tr.dv);
      if (nd) nd.mau = tr.mauBe;
      if (ct) ct.mau = tr.mauTru;
      if (!tr.ket) return;
      tr.ketLuc = bay;
      if (tr.ket === "be" && ct) sup(ct, bay);
      if (tr.ket === "tru" && nd) boDan(tr.ten, nd);
    }
    // TC_D06C2h: các phát trụ bắn gần nhất (máy chủ trụ vẽ lại mũi tên): { luc, dv, trung }, giữ tru.giuBanGiay giây
    function ghiBan(ct, b, bay) {
      ct.banLuc = bay;
      ct.ban = (ct.ban || []).filter(x => bay - x.luc < CH.tru.giuBanGiay * 1000).concat([b]).slice(-8);
    }
    // Câu của lượt bé đang mở: trận công trình thường giữ câu trong trận (tr.cau, TC_D06C7b); trận trụ dùng câu của trụ
    const cauTran = (t, ct) => { const ds = t.cau || (ct && ct.cau); return ds ? ds[t.so / 2 - 1] || null : null; };
    const tranRa = t => ({ id: t.id, truId: t.truId, dv: t.dv == null ? null : t.dv, chu: t.chu, loai: t.loai, cap: t.cap, soCau: t.soCau, tiLe: t.tiLe, cong: t.cong, beDanh: t.beDanh,
      mauBe: t.mauBe, mauBeToiDa: t.mauBeToiDa, mauTru: t.mauTru, mauTruToiDa: t.mauTruToiDa, so: t.so, ket: t.ket });
    function luotRa(t) {
      if (t.ben === "tru") return { so: t.so, ben: "tru", giayTru: t.giayTru, moLuc: t.moLuc };
      const c = cauTran(t, tt.congTrinh.find(k => k.id === t.truId));
      return { so: t.so, ben: "be", han: CH.tru.giayBe, moLuc: t.moLuc,
        cau: c ? { noiDung: c.noiDung, dapAn: c.dapAn, mon: c.mon, doKho: c.doKho, hinhChu: c.hinhChu, amThanh: c.amThanh } : null }; // không có đáp án
    }
    // TC_D06C7d: công trình mới xây (đánh được, trừ Lều) có sẵn muaCau.coSan câu (ct.soCau); bé mua thêm bằng vàng (muaCau)
    const soCauMoi = loai => (TT && TT.danhDuoc(CH, loai) ? { soCau: TT.coSan(CH) } : null);
    // TC_D06C7d: công trình đang trong trận (chưa xong) thì chưa mua câu / sửa được (trận giữ máu riêng, cuối trận ghi đè)
    const dangBiDanh = id => (tt.truTran || []).some(t => t.truId === id && !t.ket);
    // Công trình trả cho bé: câu của trụ chỉ chủ trụ thấy (bé khác chỉ biết trụ đã có câu)
    function ctRa(ct, ten) {
      const r = Object.assign({}, ct);
      if (ct.chu !== ten) delete r.cau;
      if (TT && TT.laTru(CH, ct.loai)) r.coCau = Array.isArray(ct.cau) && ct.cau.length > 0;
      return r;
    }

    const api = {
      gio: () => gio(),

      async vaoVung(ten, chungLoai) {
        ten = tenChuan(ten);
        if (!ten) return { ok: false, lyDo: "Chưa có tên đăng nhập." };
        let be = tt.be[ten], lanDau = false;
        if (!be) {
          const daDung = new Set(Object.values(tt.be).map(b => b.cong));
          if (daDung.size >= Math.min(CB.soBeToiDa, vung.cong.length)) return { ok: false, lyDo: "Thung lũng đã đủ bạn rồi." }; // bản sao: TC_D02B3
          const cong = vung.cong.find(c => !daDung.has(c.so));
          const s = BD.taoSuongMu(vung.rong, vung.cao);
          s.khamPha(cong.x, cong.z, CB.banKinhCong);
          be = tt.be[ten] = { cong: cong.so, vaoLuc: gio(), khamPha: s.xuat(), chungLoai: chungLoai || "nhan", kho: {} };
          tt.donVi.push({ id: ++tt.soId, chu: ten, loai: "thu_linh", x: cong.x, z: cong.z, lenh: null });
          lanDau = true;
        } else if (chungLoai && be.chungLoai !== chungLoai) be.chungLoai = chungLoai;
        // TC_D03A: tính bù lúc vắng mặt rồi mới trả trạng thái; lời báo trả một lần
        const bay = gio();
        songLai(ten, bay);
        quaiBu(bay); // TC_D06C1
        const b = be.baoVang;
        delete be.baoVang;
        luu();
        const vang = b ? { giay: Math.round((bay - b.tu) / 1000), thu: b.thu, xong: b.xong, day: Object.keys(b.day), sinh: b.sinh || 0, gat: b.gat || 0 } : null;
        const cong = vung.cong.find(c => c.so === be.cong);
        return { ok: true, maVung: vung.ma, banSao: 1, cong: { so: cong.so, x: cong.x, z: cong.z }, lanDau, khamPha: be.khamPha,
          donVi: cuaBe(ten).map(d => ({ id: d.id, loai: d.loai, x: d.x, z: d.z, lenh: d.lenh, mau: d.mau == null ? null : d.mau })), kho: khoCua(be), vang, gio: bay, hang: hangCua(be),
          quai: dsQuai(bay), nghiDen: be.nghiDen || 0, lanhDia: lanhDiaRa(), soCauKho: (be.cauKho || []).length }; // TC_D06C7b
      },

      async layQuanh(ten) {
        ten = tenChuan(ten);
        if (!tt.be[ten]) return { ok: false, lyDo: "Con chưa vào thung lũng." };
        const bay = gio(); // TC_D03A: bé này còn đang chơi; tính bù xây mọi bé + việc của bé vắng mặt
        tt.be[ten].songLuc = bay;
        for (const k in tt.be) tinhBu(k, bay, false);
        quaiBu(bay); // TC_D06C1
        luu();
        const s = suongCua(ten);
        const thay = BD.locDonViThayDuoc(tt.donVi, cungPhe(ten), s, viTri);
        const nguon = Object.keys(tt.nguon).map(ma => ({ ma: Number(ma), con: tt.nguon[ma].con }));
        if (TT) boTranCu(bay); // TC_D06C2g: dọn đống gạch quá hạn, trận bỏ dở
        const them = CB.thayNhaThemO || 0, gan = (x, y) => s.nguonSoi.some(n => (x + 0.5 - n.x) ** 2 + (y + 0.5 - n.z) ** 2 <= (n.r + them) ** 2);
        const congTrinh = tt.congTrinh.filter(ct => ct.chu === ten || s.muc(ct.x, ct.y) !== BD.DEN || gan(ct.x, ct.y)).map(ct => ctRa(ct, ten));
        return { ok: true, gio: gio(), nguon, congTrinh, donVi: thay.map(d => ({ id: d.id, chu: d.chu, loai: d.loai, x: d.x, z: d.z, lenh: d.lenh, mau: d.mau == null ? null : d.mau })),
          hang: hangCua(tt.be[ten]), quai: dsQuai(bay), nghiDen: tt.be[ten].nghiDen || 0, lanhDia: lanhDiaRa() };
      },

      // TC_D06C1: bé chạm quái (Thủ lĩnh bắt đầu tiến tới): giữ quái đứng ở (x, z) cho mọi bé thấy; mỗi bé giữ một con.
      // -> { ok, quai } | { ok: false, ma: dang_nghi (nghiDen) | quai_mat | dang_danh (chu) }
      // TC_D06C2a: lao = true: quái hung dữ tự lao vào Thủ lĩnh (khoá trang "lao"; chỗ đứng được xa chỗ ở tới hung.duoiToiDa + giuLechO)
      async quaiGiu(ten, id, x, z, lao, dv) {
        ten = tenChuan(ten);
        const be = tt.be[ten];
        if (!be) return { ok: false, lyDo: "Con chưa vào thung lũng." };
        const bay = gio();
        quaiBu(bay);
        dv = dv == null ? null : Number(dv); // TC_D06C2b
        if (dv != null && !nguoiDanh(ten, dv)) return { ok: false, ma: "khong_phai_nguoi", lyDo: "Đây không phải người của con." };
        if (dv == null && (be.nghiDen || 0) > bay) return { ok: false, ma: "dang_nghi", nghiDen: be.nghiDen, lyDo: "Thủ lĩnh đang nghỉ ở Lều." };
        const q = (tt.quai || []).find(k => k.id === id);
        if (!q || q.chay) return { ok: false, ma: "quai_mat", lyDo: "Quái đã chạy mất rồi." };
        if (q.khoa && q.khoa.ten !== ten) return { ok: false, ma: "dang_danh", chu: q.khoa.ten, lyDo: "Quái này đang giao chiến với bạn khác." };
        if (q.khoa && !cungNguoi(q.khoa, ten, dv)) return { ok: false, ma: "dang_danh", chu: q.khoa.ten, lyDo: "Quái này đang giao chiến với người khác." }; // TC_D06C2b
        for (const k of tt.quai) if (k !== q && cungNguoi(k.khoa, ten, dv)) k.khoa = null; // mỗi người giữ một con
        let px = Number(x), pz = Number(z);
        const laoDuoc = !!(lao && q.hung && CQ.hung && !q.khoa); // TC_D06C2a
        const xa = laoDuoc ? CQ.hung.duoiToiDa + CQ.giuLechO : CQ.banKinhLangThang + CQ.giuLechO;
        if (!Number.isFinite(px) || !Number.isFinite(pz) || Math.hypot(px - q.x, pz - q.z) > xa) { px = q.x; pz = q.z; }
        if (!q.khoa) q.khoa = Object.assign({ ten, x: px, z: pz, trang: laoDuoc ? "lao" : "toi", luc: bay }, dv != null ? { dv } : null);
        luu();
        return { ok: true, quai: banGhiQuai(q), gio: bay };
      },
      // TC_D06C1: Thủ lĩnh đã tới sát quái đang giữ -> vào trận (bé khác thấy hoạt ảnh đánh nhau). -> { ok, quai } | { ok: false, ma: khong_giu | xa_qua }
      async quaiDanh(ten, id, dv) {
        ten = tenChuan(ten);
        if (!tt.be[ten]) return { ok: false, lyDo: "Con chưa vào thung lũng." };
        dv = dv == null ? null : Number(dv); // TC_D06C2b
        const bay = gio(), q = (tt.quai || []).find(k => k.id === id);
        if (!q || q.chay || !cungNguoi(q.khoa, ten, dv)) return { ok: false, ma: "khong_giu", lyDo: "Quái đã đi chỗ khác." };
        const tl = nguoiDanh(ten, dv), p = tl && viTri(tl);
        if (!p || Math.hypot(p.x - q.khoa.x, p.z - q.khoa.z) > CQ.danhCachO) return { ok: false, ma: "xa_qua", lyDo: "Thủ lĩnh chưa tới chỗ quái." };
        q.khoa.trang = "danh"; q.khoa.luc = bay;
        luu();
        return { ok: true, quai: banGhiQuai(q), gio: bay };
      },
      // TC_D06C1: kết quả trận / thôi đánh. ket: "be" | "hoa" (quái bỏ chạy) | "quai" (thua: Thủ lĩnh nghỉ nghiGiay giây,
      // tối đa nghiToiDaGiay) | "rut" | "tha" (thả quái). -> { ok, nghiDen, quai }
      async quaiKet(ten, id, ket, nghiGiay, giuKetNoi, dan) {
        ten = tenChuan(ten);
        const be = tt.be[ten];
        if (!be) return { ok: false, lyDo: "Con chưa vào thung lũng." };
        const dv = dan && dan.dv != null ? Number(dan.dv) : null, nd = dv != null ? nguoiDanh(ten, dv) : null; // TC_D06C2b
        const bay = gio(), q = (tt.quai || []).find(k => k.id === id);
        const giu = q && !q.chay && cungNguoi(q.khoa, ten, dv);
        if (nd && Number.isFinite(Number(dan.mau))) { // máu nông dân chỉ giảm (không tự hồi)
          const m = Math.max(0, Math.round(Number(dan.mau)));
          nd.mau = nd.mau == null ? m : Math.min(nd.mau, m);
        }
        const tlMau = dv == null && dan && dan.mau != null && Number.isFinite(Number(dan.mau)) ? tlCua(ten) : null; // TC_D06C2g: máu Thủ lĩnh giữ nguyên
        if (tlMau) { const m = Math.max(0, Math.round(Number(dan.mau))); tlMau.mau = tlMau.mau == null ? m : Math.min(tlMau.mau, m); }
        if (dv == null && ket === "quai") { const tl = tlCua(ten); if (tl) tl.mau = null; } // thua: về Lều nghỉ, nghỉ xong đủ máu
        if (nd && ket === "quai") { tt.donVi = tt.donVi.filter(d => d !== nd); if (giu) q.khoa = null; luu(); return { ok: true, mat: true, nghiDen: be.nghiDen || 0, quai: q ? banGhiQuai(q) : null, gio: bay }; }
        if (ket === "be" || ket === "hoa") {
          if (giu) {
            const tl = dv != null ? nd : tlCua(ten), p = tl ? viTri(tl) : { x: q.khoa.x, z: q.khoa.z };
            q.chay = { x: q.khoa.x, z: q.khoa.z, huong: Math.atan2(q.khoa.x - p.x, q.khoa.z - p.z), luc: bay }; q.khoa = null;
          }
        } else {
          if (giu) q.khoa = null;
          if (ket === "quai" && dv == null) be.nghiDen = bay + Math.min(Math.max(Number(nghiGiay) || 0, 0), CQ.nghiToiDaGiay) * 1000;
        }
        luu();
        return { ok: true, nghiDen: be.nghiDen || 0, quai: q ? banGhiQuai(q) : null, gio: bay };
      },

      // TC_D06C4: bé (Thủ lĩnh / nông dân dan.dv) THẮNG quái đang giữ: quái bỏ chạy như quaiKet "be" + đồ rơi NẰM TRÊN ĐẤT ở giữa ô
      // quái đứng (các món tỏa quanh, cách 0,3 ô), mất sau giayMat giây (chỉ khi chính người đó đang giữ quái: gọi lại không rơi nữa).
      // -> quaiKet + { roi: [{ id, ma, ten, bieuTuong, nhom, so, x, z, roiLuc, hetLuc }] }
      async quaiThang(ten, id, dan) {
        const t = tenChuan(ten), be = tt.be[t];
        const dv = dan && dan.dv != null ? Number(dan.dv) : null, q = (tt.quai || []).find(k => k.id === id);
        const giu = !!(be && q && !q.chay && cungNguoi(q.khoa, t, dv));
        const kx = giu ? q.khoa.x : 0, kz = giu ? q.khoa.z : 0;
        const kq = await api.quaiKet(ten, id, "be", null, false, dan);
        if (!kq.ok || !giu || !opt.roiDo || !goc.KC_DT_ROI_DO) return Object.assign(kq, { roi: [] });
        const B = opt.roiDo, bay = gio(), ds = goc.KC_DT_ROI_DO.gieo(B, q.ma, q.lv), cx = Math.floor(kx) + 0.5, cz = Math.floor(kz) + 0.5;
        tt.doRoi = (tt.doRoi || []).filter(d => d.camDv != null || d.hetLuc > bay);
        const roi = ds.map((d, i) => {
          const vp = B.vatPham[d.ma], g = 2 * Math.PI * i / ds.length, xa = ds.length > 1 ? 0.3 : 0;
          const m = { id: ++tt.soId, chu: t, ma: d.ma, so: d.so, x: cx + xa * Math.cos(g), z: cz + xa * Math.sin(g), roiLuc: bay, hetLuc: bay + (vp.giayMat || 300) * 1000 };
          tt.doRoi.push(m);
          return banGhiDo(m);
        });
        luu();
        return Object.assign(kq, { roi });
      },
      // TC_D06C4 + TC_D06C5 (người dùng chọn "Nông dân mang đồ về kho"): nông dân dv của bé tới sát món đồ id (cách không quá
      // lang.tamVoi + quaiBanDo.giuLechO ô) -> đồ CẦM TRÊN TAY (camDv), chưa vào kho. -> { ok, id, ma, so, camDv }
      // | { ok: false, ma: do_mat | khong_cua_ban | khong_phai_nguoi | xa_qua }
      async nhatDo(ten, id, dv) {
        const t = tenChuan(ten), be = tt.be[t], bay = gio();
        if (!be) return { ok: false, lyDo: "Con chưa vào thung lũng." };
        tt.doRoi = (tt.doRoi || []).filter(d => d.camDv != null || d.hetLuc > bay);
        const d = tt.doRoi.find(k => k.id === id);
        if (!d || d.camDv != null) return { ok: false, ma: "do_mat", lyDo: "Đồ đã mất rồi." };
        if (d.chu !== t) return { ok: false, ma: "khong_cua_ban", lyDo: "Đây không phải đồ của bạn" }; // bé khác thấy nhưng không nhặt được
        const nd = tt.donVi.find(u => u.id === Number(dv) && u.chu === t && u.loai === "nong_dan");
        if (!nd) return { ok: false, ma: "khong_phai_nguoi", lyDo: "Chỉ nông dân của con mới nhặt được." };
        const p = viTri(nd);
        if (Math.hypot(p.x - d.x, p.z - d.z) > CH.lang.tamVoi + CQ.giuLechO) return { ok: false, ma: "xa_qua", lyDo: "Nông dân chưa tới chỗ đồ." };
        d.camDv = nd.id; luu();
        return { ok: true, id: d.id, ma: d.ma, so: d.so, camDv: nd.id, gio: bay };
      },
      // TC_D06C5: nông dân dv đang cầm đồ tới sát Lều / kho của bé (công trình xong nhận cất loại đồ đó; vật phẩm: Lều trại) ->
      // tài nguyên vào kho (không quá sức chứa, phần còn lại vẫn cầm), vật phẩm vào túi đồ.
      // -> { ok, cat: [{ id, ma, duoc, con }], kho } | { ok: false, ma: khong_phai_nguoi | khong_cam | xa_qua | kho_day }
      async catDo(ten, dv) {
        const t = tenChuan(ten), be = tt.be[t], bay = gio();
        if (!be) return { ok: false, lyDo: "Con chưa vào thung lũng." };
        const nd = tt.donVi.find(u => u.id === Number(dv) && u.chu === t && u.loai === "nong_dan");
        if (!nd) return { ok: false, ma: "khong_phai_nguoi", lyDo: "Chỉ nông dân của con mới làm được." };
        const cam = (tt.doRoi || []).filter(d => d.camDv === nd.id);
        if (!cam.length) return { ok: false, ma: "khong_cam", lyDo: "Nông dân không cầm đồ." };
        const p = viTri(nd), tam = CH.lang.tamVoi + CQ.giuLechO, LG = goc.KC_DT_LANG;
        const loaiDo = d => (opt.roiDo && opt.roiDo.vatPham[d.ma]) || { nhom: "tai_nguyen" };
        const gan = (c, d) => {
          const nhan = loaiDo(d).nhom === "tai_nguyen" ? !!(LG && LG.nhanCat(CH, c.loai, d.ma)) : c.loai === "leu";
          const dx = Math.max(c.x - p.x, 0, p.x - (c.x + c.rong)), dz = Math.max(c.y - p.z, 0, p.z - (c.y + c.sau));
          return nhan && Math.hypot(dx, dz) <= tam;
        };
        const ct = tt.congTrinh.filter(c => c.chu === t && c.xongLuc);
        const cat = []; let coGan = false;
        for (const d of cam) {
          if (!ct.some(c => gan(c, d))) continue;
          coGan = true;
          let duoc = d.so;
          if (loaiDo(d).nhom === "tai_nguyen") {
            duoc = d.ma in CH.lang.taiNguyen ? Math.max(0, Math.min(d.so, sucChua(t, d.ma) - (be.kho[d.ma] || 0))) : 0;
            if (duoc > 0) be.kho[d.ma] = (be.kho[d.ma] || 0) + duoc;
          } else {
            tt.tuiDo = tt.tuiDo || {}; tt.tuiDo[t] = tt.tuiDo[t] || {};
            tt.tuiDo[t][d.ma] = (tt.tuiDo[t][d.ma] || 0) + duoc;
          }
          if (duoc <= 0) continue;
          d.so -= duoc;
          cat.push({ id: d.id, ma: d.ma, duoc, con: d.so });
        }
        tt.doRoi = tt.doRoi.filter(d => d.so > 0);
        if (!coGan) return { ok: false, ma: "xa_qua", lyDo: "Nông dân chưa tới Lều / kho." };
        if (!cat.length) return { ok: false, ma: "kho_day", lyDo: "Kho đầy rồi." };
        luu();
        return { ok: true, cat, kho: khoCua(be), gio: bay };
      },
      // TC_D06C5 (người dùng 06/11/2026: "tài khoản không còn nông dân thì có một nông dân miễn phí"): bé đã có Lều trại xong mà
      // không còn nông dân nào -> máy chủ tặng một người ở ô quanh Lều (không trả giá). -> { ok, donVi: { id, x, z } } | { ok: false, ma: con_nong_dan | chua_co_leu }
      async nongDanMienPhi(ten) {
        const t = tenChuan(ten), be = tt.be[t];
        if (!be) return { ok: false, lyDo: "Con chưa vào thung lũng." };
        const leu = leuXongCua(t);
        if (!leu) return { ok: false, ma: "chua_co_leu", lyDo: "Chưa có Lều trại." };
        if (tt.donVi.some(u => u.chu === t && u.loai === "nong_dan")) return { ok: false, ma: "con_nong_dan", lyDo: "Còn nông dân rồi." };
        const p = choQuanh(leu)[0], u = { id: ++tt.soId, chu: t, loai: "nong_dan", x: p.x, z: p.z, lenh: null };
        tt.donVi.push(u); luu();
        return { ok: true, donVi: { id: u.id, x: u.x, z: u.z }, gio: gio() };
      },
      async doRoiDs(ten) { // TC_D06C5: + đồ nông dân của bé đang cầm (camDv); người cầm không còn thì đồ mất
        const t = tenChuan(ten), bay = gio();
        tt.doRoi = (tt.doRoi || []).filter(d => d.camDv != null ? tt.donVi.some(u => u.id === d.camDv) : d.hetLuc > bay);
        return { ok: true, ds: tt.doRoi.filter(d => d.camDv == null || d.chu === t).map(banGhiDo), gio: bay };
      },
      async bangRoiDo() { const B = opt.roiDo || {}; return { ok: true, vatPham: B.vatPham || {}, quai: B.quai || {}, macDinh: B.macDinh || [], gio: gio() }; },
      tuiDo(ten) { return Object.assign({}, (tt.tuiDo || {})[tenChuan(ten)]); }, // TC_D06C4: kiểm thử

      // TC_D03B1: xếp một nông dân vào hàng sinh ở Lều trại (chỉ nhà chính sinh nông dân). Trả giá lúc xếp; cần
      // lều xong, hàng chưa đủ sinh.hangToiDa, dân số + hàng chờ < chỗ ở. -> { ok, hang, kho, danSo, choO }
      async sinhNongDan(ten) {
        ten = tenChuan(ten);
        const be = tt.be[ten];
        if (!be) return { ok: false, lyDo: "Con chưa vào thung lũng." };
        const bay = gio();
        songLai(ten, bay);
        if (!leuXongCua(ten)) return { ok: false, ma: "chua_leu", lyDo: BD.LY_DO.chua_leu() };
        const S = mauCt("leu").sinh, h = be.hangSinh || { so: 0, batDau: bay };
        if (h.so >= S.hangToiDa) return { ok: false, ma: "hang_day", lyDo: BD.LY_DO.hang_day(S.hangToiDa) };
        const co = danSo(ten) + h.so, toiDa = choO(ten);
        if (co >= toiDa) return { ok: false, ma: "cho_o", co, toiDa, lyDo: BD.LY_DO.cho_o(co, toiDa) };
        const thieu = thieuGia(be, S.gia, 1);
        if (thieu) return loiThieu(thieu);
        truGia(be, S.gia, 1);
        if (!h.so) h.batDau = bay;
        h.so++; be.hangSinh = h;
        luu();
        return { ok: true, hang: hangCua(be), kho: khoCua(be), danSo: danSo(ten), choO: toiDa, gio: bay };
      },

      // TC_D03B2: trồng lại trên bãi đã gặt (chưa thành cỏ), trả congTrinh.ruong.ruong.giaTrongLai
      // -> { ok, id, trongLuc, con, kho } | { ok: false, ma: het_bai | chua_gat | thieu }
      async trongLai(ten, id) {
        ten = tenChuan(ten);
        const be = tt.be[ten];
        if (!be) return { ok: false, lyDo: "Con chưa vào thung lũng." };
        const bay = gio();
        songLai(ten, bay); // bãi quá hạn thì đã thành cỏ
        const ct = tt.congTrinh.find(c => c.id === id && c.chu === ten && c.loai === "ruong");
        if (!ct) return { ok: false, ma: "het_bai", lyDo: BD.LY_DO.het_bai() };
        if (!ct.xongLuc || ct.gatLuc == null) return { ok: false, ma: "chua_gat", lyDo: BD.LY_DO.chua_gat() };
        const thieu = thieuGia(be, MR.giaTrongLai, 1);
        if (thieu) return loiThieu(thieu);
        truGia(be, MR.giaTrongLai, 1);
        ct.trongLuc = bay; ct.con = LANG.sanLuongRuong(CH, ct.cap); ct.gatLuc = null;
        luu();
        return { ok: true, id: ct.id, trongLuc: bay, con: ct.con, kho: khoCua(be), gio: bay };
      },

      async guiLenh(ten, idDonVi, lenh) {
        ten = tenChuan(ten);
        const dv = tt.donVi.find(d => d.id === idDonVi);
        if (!dv || dv.chu !== ten) return { ok: false, lyDo: "Đây không phải người của con." };
        const den = lenh && lenh.den, tu = lenh && lenh.tu;
        if (!Array.isArray(den) || !Array.isArray(tu) || !den.every(Number.isFinite) || !tu.every(Number.isFinite)) return { ok: false, lyDo: "Lệnh không đúng." };
        // TC_D02C: không đi vào lãnh địa của bé khác (đường đi máy bé đã vòng qua tường; đây là chốt chặn)
        if (lanhDia.chuO(Math.floor(den[0]), Math.floor(den[1]), ten)) return { ok: false, ma: "vao_lanh_dia", lyDo: "Đây là lãnh địa của bạn khác, không vào được." };
        // TC_D03A: chốt tiến độ xây tới giờ này TRƯỚC khi đổi lệnh (người rời móng thì móng dừng đúng chỗ)
        const batDau = gio();
        songLai(ten, batDau);
        // Chỗ xuất phát: tin máy bé nếu không xa hơn tốc độ tối đa cho phép từ lệnh trước (như SQL kc_dt_gui_lenh,
        // TC_D03A: máy chủ tính "tới nơi xây" theo chỗ này), xa quá thì dùng vị trí máy chủ tính
        const cu = dv.lenh, goc0 = cu ? cu.tu : [dv.x, dv.z], tGiay = cu ? Math.max(0, (batDau - cu.batDau) / 1000) : 0;
        const vMax = dv.loai === "thu_linh" ? TOC.chay : TOC.di;
        const tinDuoc = Math.hypot(tu[0] - goc0[0], tu[1] - goc0[1]) <= vMax * tGiay + 2;
        const p = tinDuoc ? { x: Math.min(Math.max(tu[0], 0), vung.rong), z: Math.min(Math.max(tu[1], 0), vung.cao) } : viTri(dv);
        // xay: chỉ công trình chưa xong của chính bé mà người này được xây; hang: tối đa doanToiDa móng như thế
        const laMong = id => Number.isInteger(id) && tt.congTrinh.some(c => c.id === id && c.chu === ten && dangLam(c) && LANG.duocXay(dv.loai, c.loai)); // TC_D06C7e: + đang sửa
        const xay = laMong(lenh.xay) ? lenh.xay : null;
        dv.lenh = { tu: [p.x, p.z], den: [Math.floor(den[0]), Math.floor(den[1])], batDau, vaiTro: dv.loai,
          viec: xay == null && Number.isInteger(lenh.viec) ? lenh.viec : null, khamPha: !!lenh.khamPha,
          xay, hang: xay != null && Array.isArray(lenh.hang) ? lenh.hang.filter(laMong).slice(0, CH.congTrinh.tuong.doanToiDa) : [] };
        luu();
        return { ok: true, batDau, tu: dv.lenh.tu };
      },

      async guiThuHoach(ten, ds) {
        ten = tenChuan(ten);
        const be = tt.be[ten];
        if (!be) return { ok: false, lyDo: "Con chưa vào thung lũng." };
        const bay = gio();
        songLai(ten, bay);
        // TC_D03A: phần máy chủ đã tính bù lúc vắng mặt không tính lại (từ max(guiLuc, buLuc))
        const giay = Math.max(0, (bay - Math.max(be.guiLuc || be.vaoLuc, be.buLuc || 0)) / 1000);
        const soNd = cuaBe(ten).filter(d => d.loai === "nong_dan").length;
        const ra = [];
        be.kho = be.kho || {};
        for (const { ma, so } of ds || []) {
          if (ma < 0) { // TC_D03B2: ruộng của chính bé, chỉ khi chín (cho sớm xay.treGiay giây: giờ máy bé lệch); gặt hết thì thành bãi
            const ct = ruongCua(ten, -ma);
            if (!ct || ct.gatLuc != null || bay + CH.xay.treGiay * 1000 < chinLuc(ct) || !(so > 0)) { ra.push({ ma, duoc: 0 }); continue; }
            const tn = CH.lang.nguon.ruong.taiNguyen;
            const toiDa = Math.floor(soNd * giay / CH.lang.nguon.ruong.nhipLam), cho = Math.max(0, sucChua(ten, tn) - (be.kho[tn] || 0));
            const duoc = Math.max(0, Math.min(Math.floor(so), ct.con, toiDa, cho));
            ct.con -= duoc;
            if (ct.con <= 0) ct.gatLuc = bay;
            be.kho[tn] = (be.kho[tn] || 0) + duoc;
            ra.push({ ma, duoc, con: ct.con });
            continue;
          }
          const n = lang.nguonTheoMa(ma);
          if (!n || !lang.dangSong(n) || !(so > 0)) { ra.push({ ma, duoc: 0 }); continue; }
          // tốc độ tối đa: mọi nông dân của bé cùng làm nguồn loại này trong suốt khoảng giờ đó
          const toiDa = Math.floor(soNd * giay / lang.CH.nguon[n.loai].nhipLam);
          const cho = Math.max(0, sucChua(ten, n.taiNguyen) - (be.kho[n.taiNguyen] || 0)); // TC_D03A: sức chứa
          const duoc = Math.max(0, Math.min(Math.floor(so), n.con, toiDa, cho));
          n.con -= duoc;
          tt.nguon[ma] = { con: n.con, hetLuc: n.con <= 0 ? bay : null };
          be.kho[n.taiNguyen] = (be.kho[n.taiNguyen] || 0) + duoc; // kho của bé giữ ở máy chủ
          ra.push({ ma, duoc, con: n.con });
        }
        be.guiLuc = bay;
        luu();
        return { ok: true, ds: ra, kho: khoCua(be) };
      },

      // xoay (TC_D02C): cổng dọc 1 x 3. Trừ giá (cau_hinh congTrinh.*.gia) khỏi kho của bé; giới hạn số mỗi bé.
      // Cổng đè lên tường của chính bé: các ô tường đó bị bỏ (kq.boTuong = id tường đã bỏ).
      async xay(ten, yeuCau) {
        ten = tenChuan(ten);
        const be = tt.be[ten];
        if (!be) return { ok: false, lyDo: "Con chưa vào thung lũng." };
        songLai(ten, gio());
        const { loai, x, y } = yeuCau, mau = CH.congTrinh && CH.congTrinh[loai];
        let rong = mau ? mau.rong : yeuCau.rong || 1, sau = mau ? mau.sau : yeuCau.sau || 1; // cỡ theo cau_hinh, không tin máy bé
        if (yeuCau.xoay) [rong, sau] = [sau, rong];
        if (loai === "tuong") return { ok: false, ma: "lenh", lyDo: "Lệnh không đúng." }; // tường: xayTuong
        if (loai === "leu" && tt.congTrinh.some(ct => ct.chu === ten && ct.loai === "leu")) return { ok: false, ma: "da_co", lyDo: "Con đã có Lều trại rồi." };
        if (mau && mau.gioiHan && tt.congTrinh.filter(ct => ct.chu === ten && ct.loai === loai).length >= mau.gioiHan) return { ok: false, ma: "gioi_han", lyDo: BD.LY_DO.gioi_han(mau.ten) };
        const thieu = thieuGia(be, mau && mau.gia, 1);
        if (thieu) return loiThieu(thieu);
        const kq = BD.oXayDuocVung(theXay(ten, loai), x, y, rong, sau);
        if (!kq.duoc) return { ok: false, lyDo: kq.lyDo, ma: kq.ma };
        const boTuong = [];
        if (loai === "cong") tt.congTrinh = tt.congTrinh.filter(c => {
          let de = false;
          for (let oy = y; oy < y + sau && !de; oy++) for (let ox = x; ox < x + rong; ox++) if (trongCt(c, ox, oy)) { de = true; break; }
          if (!de || c.chu !== ten || c.loai !== "tuong") return true;
          boTuong.push(c.id);
          if (c.xongLuc) lanhDia.dat(ten, c.x, c.y, c.rong, c.sau, false);
          return false;
        });
        truGia(be, mau && mau.gia, 1);
        const ct = Object.assign({ id: ++tt.soId, chu: ten, loai, x, y, rong, sau, cap: 1, tienDo: 0, xayLuc: gio(), xongLuc: null }, soCauMoi(loai));
        tt.congTrinh.push(ct);
        datCt(ct);
        luu();
        return { ok: true, id: ct.id, boTuong, kho: khoCua(be) };
      },

      // Đoạn tường (TC_D02C): dsO = [[x, y], ...] tối đa doanToiDa ô; ô đã có tường / cổng của bé thì bỏ qua
      // (nối góc); mọi ô còn lại phải xây được, không thì không xây ô nào. -> { ok, ds[{id, x, y}], kho }
      async xayTuong(ten, dsO) {
        ten = tenChuan(ten);
        const be = tt.be[ten], mau = CH.congTrinh.tuong;
        if (!be) return { ok: false, lyDo: "Con chưa vào thung lũng." };
        if (!Array.isArray(dsO) || !dsO.length || dsO.length > mau.doanToiDa || !dsO.every(o => Array.isArray(o) && o.every(Number.isInteger))) return { ok: false, ma: "lenh", lyDo: "Lệnh không đúng." };
        songLai(ten, gio());
        const raoMinh = laRaoCua(ten), daCo = new Set(), moi = [];
        for (const [ox, oy] of dsO) { const k = oy * vung.rong + ox; if (!daCo.has(k) && !raoMinh(ox, oy)) moi.push([ox, oy]); daCo.add(k); }
        if (!moi.length) return { ok: true, ds: [], kho: khoCua(be) };
        const thieu = thieuGia(be, mau.gia, moi.length);
        if (thieu) return loiThieu(thieu);
        const the = theXay(ten, "tuong");
        for (const [ox, oy] of moi) { const k = BD.oXayDuoc(the, ox, oy); if (!k.duoc) return { ok: false, ma: k.ma, lyDo: k.lyDo, o: [ox, oy] }; }
        truGia(be, mau.gia, moi.length);
        const ds = moi.map(([ox, oy]) => {
          const ct = Object.assign({ id: ++tt.soId, chu: ten, loai: "tuong", x: ox, y: oy, rong: 1, sau: 1, cap: 1, tienDo: 0, xayLuc: gio(), xongLuc: null }, soCauMoi("tuong"));
          tt.congTrinh.push(ct); datCt(ct);
          return { id: ct.id, x: ox, y: oy };
        });
        luu();
        return { ok: true, ds, kho: khoCua(be) };
      },

      // Dựng xong (máy bé báo khi người đứng sát móng làm đủ). TC_D03A: máy chủ tự mô phỏng tiến độ theo
      // người đã tới xây (tinhXay); chỉ nhận khi còn lại không quá xay.treGiay giây. Báo lần đầu thì trả
      // nông dân đầu tiên (Lều trại; máy chủ có thể đã sinh sẵn khi mô phỏng thấy xong), lần sau: da_xong.
      async xayXong(ten, id) {
        ten = tenChuan(ten);
        const ct = tt.congTrinh.find(c => c.id === id);
        if (!ct || ct.chu !== ten) return { ok: false, lyDo: "Đây không phải nhà của con." };
        const bay = gio();
        songLai(ten, bay);
        if (ct.sua && !ct.hongLuc) { // TC_D06C7e: máy bé báo sửa xong (như dựng xong: chỉ nhận khi còn lại không quá xay.treGiay giây)
          const n = tt.donVi.filter(d => d.chu === ten && d.lenh && d.lenh.xay === ct.id && toiLuc(d.lenh) <= bay).length;
          if (!n || (1 - tienLam(ct)) / tocDoLam(ct, n) > CH.xay.treGiay) return { ok: false, ma: "chua_xong", lyDo: "Chưa sửa xong đâu, con chờ thêm chút nhé." };
          suaXong(ct); luu();
          return { ok: true, donVi: [], sua: true };
        }
        if (ct.baoXong) return { ok: false, ma: "da_xong", lyDo: "Nhà này dựng xong rồi." };
        if (!ct.xongLuc) {
          const n = tt.donVi.filter(d => d.chu === ten && d.lenh && d.lenh.xay === ct.id && toiLuc(d.lenh) <= bay).length;
          const v = LANG.tocDoXay(CH, { giayXay: mauCt(ct.loai).giayXay, cap: ct.cap }, Math.max(1, n));
          if ((ct.tienDo || 0) < 1 - 1e-9 && (!n || (1 - (ct.tienDo || 0)) / v > CH.xay.treGiay)) return { ok: false, ma: "chua_xong", lyDo: "Chưa dựng xong đâu, con chờ thêm chút nhé." };
          hoanThanh(ct, bay);
        }
        ct.baoXong = true;
        luu();
        const moi = ct.loai === "leu" ? cuaBe(ten).filter(d => d.loai === "nong_dan").map(d => ({ id: d.id, loai: d.loai, x: d.x, z: d.z, lenh: d.lenh, mau: d.mau == null ? null : d.mau })) : [];
        return { ok: true, donVi: moi };
      },

      // TC_D06C2d: phá hủy công trình ĐÃ XONG của chính bé (SQL: kc_dt_pha_huy). Xoá ngay, không hoàn tài nguyên.
      // Tường / cổng: lãnh địa tính lại. Ruộng: người đang gặt ở đó thôi việc (ruongCua không còn).
      // TC_D06C7c (người dùng 07/11/2026: tự phá Lều, dời làng): chủ phá được Lều trại của mình (bé khác vẫn không: danhDuoc);
      // hàng chờ sinh nông dân hoàn lương thực; be.doiLeu = Lều dựng lại không tặng nông dân đầu. Kho, nông dân, nhà cũ giữ nguyên.
      async phaHuy(ten, id) {
        ten = tenChuan(ten);
        const be = tt.be[ten];
        if (!be) return { ok: false, ma: "chua_vao", lyDo: "Con chưa vào thung lũng." };
        songLai(ten, gio()); // tính bù trước: hàng sinh ra người tới lúc phá
        const ct = tt.congTrinh.find(c => c.id === id);
        if (!ct || ct.chu !== ten) return { ok: false, ma: "khong_phai_nha", lyDo: "Đây không phải nhà của con." };
        if (!ct.xongLuc) return { ok: false, ma: "chua_xong", lyDo: "Chưa dựng xong đâu, con chờ thêm chút nhé." };
        tt.congTrinh = tt.congTrinh.filter(c => c !== ct);
        lang.boO(ct.x, ct.y, ct.rong, ct.sau);
        if (BD.LA_RAO[ct.loai]) lanhDia.dat(ct.chu, ct.x, ct.y, ct.rong, ct.sau, false);
        if (ct.loai === "leu") {
          const h = be.hangSinh;
          if (h && h.so > 0) truGia(be, mauCt("leu").sinh.gia, -h.so);
          be.hangSinh = null; be.doiLeu = true;
        }
        luu();
        return { ok: true, id, kho: khoCua(be), hang: hangCua(be), gio: gio() };
      },

      async luuKhamPha(ten, chuoi) {
        ten = tenChuan(ten);
        const be = tt.be[ten];
        if (!be) return { ok: false, lyDo: "Con chưa vào thung lũng." };
        const s = BD.taoSuongMu(vung.rong, vung.cao);
        s.nap(be.khamPha);
        if (!s.nap(chuoi)) return { ok: false, lyDo: "Mặt nạ không đúng." };
        be.khamPha = s.xuat();
        be.songLuc = Math.max(be.songLuc || 0, gio());
        luu();
        return { ok: true };
      },

      // TC_D06C2g - TRỤ PHÒNG THỦ (luật ở dt/dt_tru_tran.js; SQL làm y hệt)
      // truCau(ten, id, ds): chủ trụ gắn soCau câu cho trụ của mình (máy bé chọn ngẫu nhiên trong kho; TC_D06E: thư viện)
      async truCau(ten, id, ds) {
        ten = tenChuan(ten);
        const ct = tt.congTrinh.find(c => c.id === id);
        if (!ct || ct.chu !== ten || !TT.laTru(CH, ct.loai)) return { ok: false, ma: "khong_phai_nha", lyDo: "Đây không phải trụ của con." };
        const sach = chuanCau(ds, TT.soTru(CH, ct.loai, ct.cap).soCau);
        if (!sach) return { ok: false, ma: "cau", lyDo: "Câu hỏi không đúng." };
        ct.cau = sach; luu();
        return { ok: true, id, gio: gio() };
      },
      // TC_D06C7b - cauKho(ten, ds): KHO CÂU của bé (1..60 câu, máy bé chọn theo trình độ của bé): trận công trình thường của bé
      // lấy câu ngẫu nhiên trong kho này (máy chủ giữ đáp án)
      async cauKho(ten, ds) {
        ten = tenChuan(ten);
        const be = tt.be[ten];
        if (!be) return { ok: false, ma: "chua_vao", lyDo: "Con chưa vào thung lũng." };
        const sach = Array.isArray(ds) && ds.length >= 1 && ds.length <= 60 ? chuanCau(ds, ds.length) : null;
        if (!sach) return { ok: false, ma: "cau", lyDo: "Câu hỏi không đúng." };
        be.cauKho = sach; luu();
        return { ok: true, so: sach.length, gio: gio() };
      },
      // TC_D06C7b - danhKhai(ten, id, duPhong): Thủ lĩnh của ten (đứng sát công trình thường id của bé khác) bấm ⚔️ Tấn công ->
      // { ok, tran } (trận y luật trụ, số theo congTrinh.<loai>.danh) | { ok: false, ma: khong_danh | dang_nghi | dang_tran | mien | xa_qua
      // | bao_ho | chua_cau }. Câu: soCau câu ngẫu nhiên trong kho câu của chủ; chủ chưa có kho thì dùng duPhong (câu máy ten chọn).
      async danhKhai(ten, id, duPhong) {
        ten = tenChuan(ten);
        const be = tt.be[ten];
        if (!be) return { ok: false, ma: "chua_vao", lyDo: "Con chưa vào thung lũng." };
        const bay = gio(), C = CH.tru;
        boTranCu(bay);
        const ct = tt.congTrinh.find(c => c.id === id);
        if (!ct || !TT.laDanh(CH, ct.loai) || !ct.xongLuc || ct.hongLuc || ct.chu === ten) return { ok: false, ma: "khong_danh", lyDo: "Không đánh được công trình này." };
        if ((be.nghiDen || 0) > bay) return { ok: false, ma: "dang_nghi", nghiDen: be.nghiDen, lyDo: "Thủ lĩnh đang nghỉ ở Lều." };
        const dang = (tt.truTran || []).find(t => t.ten === ten && !t.ket);
        if (dang) return dang.truId === id && dang.dv == null ? { ok: true, tran: tranRa(dang), gio: bay } : { ok: false, ma: "dang_tran", lyDo: "Đang giao chiến." };
        if ((tt.truTran || []).some(t => t.ten === ten && t.truId === id && t.dv == null && t.ketLuc && bay - t.ketLuc < C.mienGiay * 1000)) return { ok: false, ma: "mien", lyDo: "Vừa giao chiến xong." };
        const s = TT.soCt(CH, ct), tl = tlCua(ten), p = tl && viTri(tl); // TC_D06C7d: số câu riêng của công trình
        if (!p || TT.kcMep(ct, p.x, p.z) > C.chamO + LECH_O) return { ok: false, ma: "xa_qua", lyDo: "Thủ lĩnh chưa tới sát công trình." };
        if (baoHo(ct, bay)) return { ok: false, ma: "bao_ho", lyDo: "Làng đang có vòng sáng bảo hộ." };
        const kho = (tt.be[ct.chu] && tt.be[ct.chu].cauKho) || null;
        const nen = kho && kho.length ? kho : (Array.isArray(duPhong) && duPhong.length ? chuanCau(duPhong.slice(0, 60), Math.min(60, duPhong.length)) : null);
        const cau = TT.cauDu(ct.cau, nen || [], s.soCau); // TC_D06C7e: câu bé chủ tự chọn hỏi trước, thiếu mới bù
        if (!cau) return { ok: false, ma: "chua_cau", lyDo: "Chưa có câu hỏi." };
        const toiDa = TT.hpThuLinh(CH, be.chungLoai);
        const tr = { id: ++tt.soId, truId: id, dv: null, chu: ct.chu, ten, loai: ct.loai, cap: ct.cap || 1, soCau: s.soCau, tiLe: s.tiLe, cong: s.cong, beDanh: TT.beDanhCt(CH, s, be.chungLoai, false),
          mauBe: tl.mau == null ? toiDa : Math.min(toiDa, tl.mau), mauBeToiDa: toiDa, mauTru: ct.mau == null ? s.mauToiDa : Math.min(ct.mau, s.mauToiDa), mauTruToiDa: s.mauToiDa,
          so: 0, ben: null, moLuc: bay, ket: null, taoLuc: bay, cau };
        (tt.truTran = tt.truTran || []).push(tr); luu();
        return { ok: true, tran: tranRa(tr), gio: bay };
      },
      // truKhai(ten, id, dv?): trụ id (của bé khác) khai chiến Thủ lĩnh của ten -> { ok, tran } | { ok: false, ma }
      // TC_D06C2h: dv = id nông dân của ten (bé bấm ⚔️ vào đánh trụ đang bắn nông dân đó)
      async truKhai(ten, id, dv) {
        ten = tenChuan(ten);
        const be = tt.be[ten];
        if (!be) return { ok: false, ma: "chua_vao", lyDo: "Con chưa vào thung lũng." };
        const bay = gio(), C = CH.tru;
        boTranCu(bay);
        const ct = tt.congTrinh.find(c => c.id === id);
        if (!ct || !TT.laTru(CH, ct.loai) || !ct.xongLuc || ct.hongLuc || ct.chu === ten) return { ok: false, ma: "khong_tru", lyDo: "Không có trụ ở đây." };
        if (!Array.isArray(ct.cau) || !ct.cau.length) return { ok: false, ma: "chua_cau", lyDo: "Trụ chưa có câu hỏi." };
        const nd = dv != null ? nguoiDanh(ten, dv) : null; // TC_D06C2h
        if (dv != null && !nd) return { ok: false, ma: "khong_phai_nguoi", lyDo: "Đây không phải người của con." };
        if (!nd && (be.nghiDen || 0) > bay) return { ok: false, ma: "dang_nghi", nghiDen: be.nghiDen, lyDo: "Thủ lĩnh đang nghỉ ở Lều." };
        const dvSo = nd ? nd.id : null, cungDv = t => (t.dv == null ? null : t.dv) === dvSo;
        const dang = (tt.truTran || []).find(t => t.ten === ten && !t.ket);
        if (dang) return dang.truId === id && cungDv(dang) ? { ok: true, tran: tranRa(dang), gio: bay } : { ok: false, ma: "dang_tran", lyDo: "Đang giao chiến." };
        if ((tt.truTran || []).some(t => t.ten === ten && t.truId === id && cungDv(t) && t.ketLuc && bay - t.ketLuc < C.mienGiay * 1000)) return { ok: false, ma: "mien", lyDo: "Trụ vừa giao chiến." };
        const s = TT.soCt(CH, ct), tl = nd || tlCua(ten), p = tl && viTri(tl); // TC_D06C7d: số câu riêng của trụ
        if (!p || Math.hypot(p.x - (ct.x + ct.rong / 2), p.z - (ct.y + ct.sau / 2)) > s.tam + LECH_O) return { ok: false, ma: "xa_qua", lyDo: "Thủ lĩnh ngoài tầm trụ." };
        if (truTrongLang(ct) && !(tt.be[ct.chu] && (tt.be[ct.chu].songLuc || 0) >= bay - VM.sauGiay * 1000)) return { ok: false, ma: "bao_ho", lyDo: "Làng đang có vòng sáng bảo hộ." };
        const toiDa = nd ? TT.hpNongDan(CH, be.chungLoai) : TT.hpThuLinh(CH, be.chungLoai);
        // TC_D06C7d: trận giữ đủ soCau câu: câu chủ trụ gắn + bù từ kho câu của chủ (trụ mua thêm câu)
        const cau = TT.cauDu(ct.cau, tt.be[ct.chu] && tt.be[ct.chu].cauKho, s.soCau);
        const tr = { id: ++tt.soId, truId: id, dv: dvSo, chu: ct.chu, ten, loai: ct.loai, cap: ct.cap || 1, soCau: cau.length, tiLe: s.tiLe, cong: s.cong, beDanh: TT.beDanhCt(CH, s, be.chungLoai, !!nd), // TC_D06C7b: công - thủ
          mauBe: tl.mau == null ? toiDa : Math.min(toiDa, tl.mau), mauBeToiDa: toiDa, mauTru: TT.mauCt(CH, ct, s), mauTruToiDa: s.mauToiDa,
          so: 0, ben: null, moLuc: bay, ket: null, taoLuc: bay, cau };
        (tt.truTran = tt.truTran || []).push(tr); luu();
        return { ok: true, tran: tranRa(tr), gio: bay };
      },
      // truLuot(ten, idTran): mở lượt kế -> { ok, luot { so, ben, giayTru? | han, cau (không có đáp án) } }
      async truLuot(ten, idTran) {
        ten = tenChuan(ten);
        const tr = (tt.truTran || []).find(t => t.id === idTran && t.ten === ten);
        if (!tr || tr.ket) return { ok: false, ma: "het_tran", lyDo: "Trận đã kết thúc." };
        const bay = gio();
        if (tr.ben) return { ok: true, luot: luotRa(tr), gio: bay }; // lượt đang mở (trang tải lại): trả lại đúng lượt đó
        TT.moLuot(tr, CH, bay); luu();
        return { ok: true, luot: luotRa(tr), gio: bay };
      },
      // truTra(ten, idTran, { chon, beDung }) -> { ok, kq (dt_tru_tran traLoi; lượt bé có dapAnDung + loiGiai) }
      async truTra(ten, idTran, tl) {
        ten = tenChuan(ten);
        const tr = (tt.truTran || []).find(t => t.id === idTran && t.ten === ten);
        if (!tr || tr.ket || !tr.ben) return { ok: false, ma: "het_tran", lyDo: "Trận đã kết thúc." };
        const bay = gio(), ct = tt.congTrinh.find(c => c.id === tr.truId);
        const cau = tr.ben === "be" ? cauTran(tr, ct) : null;
        const kq = TT.traLoi(tr, CH, bay, tl || {}, cau);
        if (cau) kq.loiGiai = cau.loiGiai || "";
        if (ct && kq.ben === "tru" && TT.laTru(CH, tr.loai)) { const ai = tr.dv != null ? tr.dv : (tlCua(ten) || {}).id; if (ai != null) ghiBan(ct, { luc: bay, dv: ai, trung: kq.kieu === "trung" }, bay); } // TC_D06C2h; TC_D06C7b: chỉ trụ ghi phát bắn
        ghiMauTran(tr, ct, bay);
        luu();
        return { ok: true, kq, gio: bay };
      },
      // TC_D06C2h - truBan(ten, id, dv): trụ id (của bé khác) tự bắn MỘT PHÁT vào nông dân dv của ten (máy bé ten hỏi khi nông
      // dân đứng trong tầm). Máy chủ quyết trúng / trượt, mỗi trụ nhiều nhất một phát mỗi tru.nhipBanGiay giây. Hết máu: nông dân bỏ
      // chạy (mất hẳn). -> { ok, trung, satThuong, mau, toiDa, mat } | { ok: false, ma: khong_tru | khong_phai_nguoi | dang_tran |
      // xa_qua | bao_ho | cho (con = ms còn chờ) }
      async truBan(ten, id, dv) {
        ten = tenChuan(ten);
        const be = tt.be[ten];
        if (!be) return { ok: false, ma: "chua_vao", lyDo: "Con chưa vào thung lũng." };
        const bay = gio(), C = CH.tru;
        boTranCu(bay);
        const ct = tt.congTrinh.find(c => c.id === id);
        if (!ct || !TT.laTru(CH, ct.loai) || !ct.xongLuc || ct.hongLuc || ct.chu === ten) return { ok: false, ma: "khong_tru", lyDo: "Không có trụ ở đây." };
        const nd = dv != null ? nguoiDanh(ten, dv) : null;
        if (!nd) return { ok: false, ma: "khong_phai_nguoi", lyDo: "Đây không phải người của con." };
        if ((tt.truTran || []).some(t => t.ten === ten && !t.ket && t.dv === nd.id)) return { ok: false, ma: "dang_tran", lyDo: "Đang giao chiến." };
        const s = TT.soTru(CH, ct.loai, ct.cap), p = viTri(nd);
        if (Math.hypot(p.x - (ct.x + ct.rong / 2), p.z - (ct.y + ct.sau / 2)) > s.tam + LECH_O) return { ok: false, ma: "xa_qua", lyDo: "Ngoài tầm trụ." };
        if (truTrongLang(ct) && !(tt.be[ct.chu] && (tt.be[ct.chu].songLuc || 0) >= bay - VM.sauGiay * 1000)) return { ok: false, ma: "bao_ho", lyDo: "Làng đang có vòng sáng bảo hộ." };
        if (ct.banLuc && bay - ct.banLuc < C.nhipBanGiay * 1000) return { ok: false, ma: "cho", con: C.nhipBanGiay * 1000 - (bay - ct.banLuc), lyDo: "Trụ đang nạp tên." };
        const toiDa = TT.hpNongDan(CH, be.chungLoai), mau = nd.mau == null ? toiDa : Math.min(toiDa, nd.mau);
        const k = TT.banMot(s, mau);
        ghiBan(ct, { luc: bay, dv: nd.id, trung: k.trung }, bay);
        const mat = k.mau <= 0;
        if (mat) boDan(ten, nd); else if (k.trung) nd.mau = k.mau;
        luu();
        return { ok: true, trung: k.trung, satThuong: k.satThuong, mau: k.mau, toiDa, mat, gio: bay };
      },
      // TC_D06C7d - muaCau(ten, id, so, cau): bé mua so câu phòng thủ cho công trình của mình (đã xong, chưa sụp, không đang bị đánh) bằng vàng
      // (TT.giaCau x so, mỗi lần 1..muaCau.toiDaMoiLan): số câu + so, máu tối đa + so x mauMoiCau, máu đang có cũng + chừng ấy.
      // TC_D06C7e: cau = so câu BÉ TỰ CHỌN (kho chung theo trình độ) gắn vào công trình (TT.ganCauMua); đang sửa thì chưa mua.
      // -> { ok, id, soCau, mau (null = đầy), mauToiDa, kho } | { ok: false, ma: chua_vao | khong_phai_nha | chua_xong | hong | so | dang_tran
      //    | dang_sua | cau | thieu }
      async muaCau(ten, id, so, cau) {
        ten = tenChuan(ten);
        const be = tt.be[ten];
        if (!be) return { ok: false, ma: "chua_vao", lyDo: "Con chưa vào thung lũng." };
        const bay = gio();
        songLai(ten, bay); boTranCu(bay);
        const ct = tt.congTrinh.find(c => c.id === id), M = CH.muaCau || {};
        if (!ct || ct.chu !== ten || !TT.danhDuoc(CH, ct.loai)) return { ok: false, ma: "khong_phai_nha", lyDo: "Đây không phải nhà của con." };
        if (!ct.xongLuc) return { ok: false, ma: "chua_xong", lyDo: "Chưa dựng xong đâu, con chờ thêm chút nhé." };
        if (ct.hongLuc) return { ok: false, ma: "hong", lyDo: "Công trình đã sụp rồi." };
        if (!Number.isInteger(so) || so < 1 || so > (M.toiDaMoiLan || 10)) return { ok: false, ma: "so", lyDo: "Số câu không đúng." };
        if (dangBiDanh(id)) return { ok: false, ma: "dang_tran", lyDo: "Công trình đang bị đánh, chờ trận xong nhé." };
        if (ct.sua) return { ok: false, ma: "dang_sua", lyDo: "Nông dân đang sửa, sửa xong rồi mua câu nhé." };
        const sach = chuanCau(cau, so);
        if (!sach) return { ok: false, ma: "cau", lyDo: "Con chọn câu hỏi trước nhé." };
        const gia = TT.giaCau(CH, ct.loai), thieu = thieuGia(be, gia, so);
        if (thieu) return loiThieu(thieu);
        truGia(be, gia, so);
        const s = TT.soCt(CH, ct);
        if (ct.mau != null) ct.mau = TT.mauCt(CH, ct, s) + so * s.mauMoiCau;
        ct.cau = TT.ganCauMua(ct.cau, s.soCau, sach);
        ct.soCau = s.soCau + so;
        luu();
        const s2 = TT.soCt(CH, ct);
        return { ok: true, id, soCau: ct.soCau, mau: ct.mau == null ? null : ct.mau, mauToiDa: s2.mauToiDa, kho: khoCua(be), gio: bay };
      },
      // TC_D06E - doiCau(ten, id, viTri, cau): bé đổi câu thứ viTri (0..soCau-1) của công trình của mình bằng 1 câu chọn trong thư viện
      // (TT.doiCau), MIỄN PHÍ, số câu / máu giữ nguyên; đang sửa / đang bị đánh vẫn đổi được (trận đang đánh giữ bản câu riêng).
      // -> { ok, id, soDaGan (số câu đã gắn) } | { ok: false, ma: chua_vao | khong_phai_nha | chua_xong | hong | vi_tri | cau }
      async doiCau(ten, id, viTri, cau) {
        ten = tenChuan(ten);
        const be = tt.be[ten];
        if (!be) return { ok: false, ma: "chua_vao", lyDo: "Con chưa vào thung lũng." };
        const ct = tt.congTrinh.find(c => c.id === id);
        if (!ct || ct.chu !== ten || !TT.danhDuoc(CH, ct.loai)) return { ok: false, ma: "khong_phai_nha", lyDo: "Đây không phải nhà của con." };
        if (!ct.xongLuc) return { ok: false, ma: "chua_xong", lyDo: "Chưa dựng xong đâu, con chờ thêm chút nhé." };
        if (ct.hongLuc) return { ok: false, ma: "hong", lyDo: "Công trình đã sụp rồi." };
        if (!Number.isInteger(viTri) || viTri < 0 || viTri >= TT.soCt(CH, ct).soCau) return { ok: false, ma: "vi_tri", lyDo: "Không có câu số này." };
        const sach = chuanCau(cau, 1);
        if (!sach) return { ok: false, ma: "cau", lyDo: "Con chọn câu hỏi trước nhé." };
        ct.cau = TT.doiCau(ct.cau, viTri, sach[0]);
        luu();
        return { ok: true, id, soDaGan: ct.cau.length, gio: gio() };
      },
      // TC_D06C7e (người dùng 08/11/2026: thay cách TC_D06C7d "mua lại máu bằng vàng") - suaCt(ten, id): sửa công trình bị đánh mất máu
      // KHÔNG tốn vàng: trừ tài nguyên TT.giaSua (giá xây x tiLeGia x phần máu mất) rồi ghi ct.sua = { tienDo 0, giay TT.giaySua }: NÔNG DÂN
      // tới sửa (lệnh xay = id như xây móng), xong thì máu đầy. -> { ok, id, sua, gia, kho } | { ok: false, ma: chua_vao | khong_phai_nha
      // | chua_xong | hong | dang_tran | dang_sua | khong_hu | thieu }
      async suaCt(ten, id) {
        ten = tenChuan(ten);
        const be = tt.be[ten];
        if (!be) return { ok: false, ma: "chua_vao", lyDo: "Con chưa vào thung lũng." };
        const bay = gio();
        songLai(ten, bay); boTranCu(bay);
        const ct = tt.congTrinh.find(c => c.id === id);
        if (!ct || ct.chu !== ten || !TT.danhDuoc(CH, ct.loai)) return { ok: false, ma: "khong_phai_nha", lyDo: "Đây không phải nhà của con." };
        if (!ct.xongLuc) return { ok: false, ma: "chua_xong", lyDo: "Chưa dựng xong đâu, con chờ thêm chút nhé." };
        if (ct.hongLuc) return { ok: false, ma: "hong", lyDo: "Công trình đã sụp rồi." };
        if (dangBiDanh(id)) return { ok: false, ma: "dang_tran", lyDo: "Công trình đang bị đánh, chờ trận xong nhé." };
        if (ct.sua) return { ok: false, ma: "dang_sua", lyDo: "Nông dân đang sửa rồi.", sua: ct.sua };
        if (!(TT.phanMat(CH, ct) > 0)) return { ok: false, ma: "khong_hu", lyDo: "Công trình còn nguyên, không cần sửa." };
        const gia = TT.giaSua(CH, ct), thieu = thieuGia(be, gia, 1);
        if (thieu) return loiThieu(thieu);
        truGia(be, gia, 1);
        ct.sua = { tienDo: 0, giay: Math.max(0.5, Math.round(TT.giaySua(CH, ct) * 100) / 100) };
        luu();
        return { ok: true, id, sua: ct.sua, gia, kho: khoCua(be), gio: bay };
      },
      // truRut(ten, idTran): rút lui giữa trận (giữ máu hai bên)
      async truRut(ten, idTran) {
        ten = tenChuan(ten);
        const tr = (tt.truTran || []).find(t => t.id === idTran && t.ten === ten);
        if (tr && !tr.ket) { tr.ket = "rut"; tr.ben = null; tr.ketLuc = gio(); luu(); }
        return { ok: true, gio: gio() };
      },

      // Chỉ trang thử + kiểm thử (bản Supabase không có): xoá hết để bé vào lại từ đầu (tải lại
      // trang sau khi gọi); đọc trạng thái thô
      async xoaHet() { tt = { phienBan: PHIEN_BAN, be: {}, donVi: [], congTrinh: [], nguon: {}, soId: 0 }; luu(); return { ok: true }; },
      _trangThai: () => tt, _lanhDia: lanhDia,
      // TC_D06C1 (chỉ kiểm thử): dời chỗ ở một quái tới (x, z), lang thang lại từ bây giờ; buộc quaiBu chạy ở lần gọi tới
      // TC_D06C2a: hung = true / false thì đặt luôn quái hung dữ / hiền (không truyền: giữ nguyên)
      _dichQuai(id, x, z, hung) { const q = (tt.quai || []).find(k => k.id === id); if (!q) return false; q.x = x; q.z = z; q.sinhLuc = gio(); q.khoa = null; q.chay = null; if (hung != null) q.hung = !!hung; luu(); return true; },
      _buNgay() { tt.quaiBuLuc = 0; }
    };
    return api;
  }

  goc.KC_DT_MAY_CHU = { taoMayChuGia };
})(typeof window !== "undefined" ? window : globalThis);
// 30/10/2026 17:30 - BƯỚC: TC_D06C1; 04/11/2026 - TC_D06C2a (quái hung dữ); 04/11/2026 23:xx - TC_D06C2b (nông dân đánh quái)
// 05/11/2026 - BƯỚC: TC_D06C2d (phaHuy: phá hủy công trình đã xong của bé)
// 05/11/2026 - BƯỚC: TC_D06C2g (trụ phòng thủ: truCau / truKhai / truLuot / truTra / truRut; máu Thủ lĩnh sau trận quái)
// 06/11/2026 - BƯỚC: TC_D06C2h (truBan: trụ tự bắn nông dân; truKhai(..., dv): nông dân vào trận với trụ; ct.ban: phát bắn gần nhất)
// 06/11/2026 - BƯỚC: TC_D06C4 (quaiThang: quái rơi đồ vào kho / túi đồ; bangRoiDo)
// 06/11/2026 - BƯỚC: TC_D06C5 (nhatDo cầm trên tay, catDo, nongDanMienPhi)
// 08/11/2026 - BƯỚC: TC_D06C7b (cauKho, danhKhai: mọi công trình bị bé khác đánh sập; rào sụp tính lại lãnh địa; bảo hộ = vòng quanh Lều)
// 07/11/2026 23:5x - BƯỚC: TC_D06C7a (lanhDia mọi bé, quái không đứng trên cổng)
// 08/11/2026 16:xx - BƯỚC: TC_D06C7e (muaCau kèm câu bé chọn; suaCt bằng tài nguyên + nông dân sửa ct.sua; danhKhai hỏi câu bé chọn trước)
// 08/11/2026 22:xx - BƯỚC: TC_D06C7c (phaHuy nhận Lều của chủ: hoàn hàng sinh, be.doiLeu; Lều dựng lại không tặng nông dân đầu)
// 09/11/2026 - BƯỚC: TC_D06E (doiCau: bé đổi từng câu của công trình bằng thư viện câu hỏi)
