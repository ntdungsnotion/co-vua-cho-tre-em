/* ================================================================
   FILE: san_tu/st_cau_hinh.js
   CHỨC NĂNG: TOÀN BỘ THAM SỐ của game "Săn Từ: Đường Đến Lâu Đài" (game chạy
              vượt chướng ngại vật + học từ tiếng Anh). Muốn chỉnh độ khó, thời
              gian chơi, số kim cương đổi mạng... chỉ sửa file này, không phải
              sửa logic.
   BƯỚC: TC_00B
   NGÀY: 15/10/2026
   CẬP NHẬT: 15/10/2026 - TC_00D: chia thành 10 ĐƯỜNG ĐUA x 7 MÀN, mỗi màn 1 phút,
             màn sau khó hơn màn trước (ST.MAN_CHOI); độ khó cũ thành CẤP TỪ VỰNG
             (chỉ quyết định từ khó hay dễ). ST.taoManChoi() ghép 2 phần thành một màn.
   CẬP NHẬT: 16/10/2026 - TC_00D2: bấm đúng là hành động NGAY; cú nhảy cự ly cố định
             (cuLyNhay); chỉ quái có THANH MÁU (tối đa 1/4 số quái) và vật cản cao hơn cú
             nhảy mới phải bắn, mỗi lần bấm đúng = 1 viên; máu tăng theo màn (mauQuai).
             Kim cương rải ngẫu nhiên trên đường, không gắn với quái / từ; số kim cương tối đa
             mỗi màn theo CẤP TỪ (cấp 1: 5, cấp 2: 8, cấp 3: 12, cấp 4: 15). Cấp 3-4 ẩn chữ:
             bé chỉ nghe đọc từ + nhìn hình để chọn (anChu).
   ĐƠN VỊ: khoảng cách tính bằng "đơn vị thế giới" (nhân vật cao 66 đơn vị),
           thời gian tính bằng giây, tốc độ = đơn vị/giây.
   CẬP NHẬT: 16/10/2026 - TC_00D2 (người dùng chốt lại): 1 quái = 1 đơn vị (60), cú nhảy 3 đơn vị
             (cuLyNhay 180, cao 130), vật phải nhảy thu về cỡ 1 đơn vị; kim cương thành CỤM riêng có
             từ riêng ở chỗ trống (loại "kimCuong", kimCuongMoiCum, kimCuongLe, tiLeDocKimCuong).
   CẬP NHẬT: 16/10/2026 - TC_00D2: đơn vị nhảy = kích thước CHÍNH vật sắp gặp (soDonViNhay,
             tiLeCaoNhay); vật cản / hố về kích thước đa dạng; quái bay luôn phải bắn.
   ================================================================ */
(function (goc) {
  "use strict";
  const ST = goc.ST = goc.ST || {};

  /* ----- Tham số chung (không đổi theo độ khó) ----- */
  ST.CAU_HINH = {
    thoiGianChoi: 60,           // giây cho một màn (mặc định; mỗi màn có thể đặt riêng)
    buocVatLy: 1 / 120,         // bước tính vật lý cố định (không phụ thuộc khung hình)
    mangBanDau: 3,              // mạng lúc bắt đầu (KHÁC mạng dự trữ đổi từ kim cương)
    kimCuongDoiMang: 10,        // số kim cương đổi 1 mạng dự trữ
    mangDuTruToiDa: 3,          // giữ tối đa bao nhiêu mạng dự trữ cùng lúc
    thoiGianBatTu: 2.2,         // giây bất tử sau khi hồi sinh (nhấp nháy)
    thoiGianKhung: 1.3,         // giây bị khựng khi va ống cống / đá / gốc cây
    thoiGianChamSauKhung: 1.6,  // sau khi leo qua, bé còn chạy chậm thêm chừng này giây
    tiLeTocDoCham: 0.55,        // tốc độ lúc chạy chậm (so với bình thường)
    thoiGianGapNan: 1.5,        // giây diễn hoạt cảnh gặp nạn trước khi hồi sinh
    // Người dùng chốt 16/10/2026: 1 ĐƠN VỊ = kích thước của CHÍNH quái / vật cản / hố sắp gặp
    // (quái to thì đơn vị to); cú nhảy vượt 3 đơn vị -> bấm sớm / trễ một chút vẫn qua được.
    soDonViNhay: 3,             // cự ly cú nhảy = 3 x bề ngang của vật sắp gặp
    tiLeCaoNhay: 2,             // độ cao cú nhảy = 2 x chiều cao của vật (ít nhất 1/3 cự ly)
    doCaoNhay: 150,             // cú nhảy cao tối đa chừng này; vật cao hơn phải bắn
    cuLyNhay: 180,              // cú nhảy lấy cụm kim cương (cụm không có "quái" để đo)
    doCaoNhayKimCuong: 130,
    leNhay: 4,                  // khoảng an toàn khi tính "cửa sổ" bấm nhảy (để không sượt qua mép)
    coVaCham: 10,               // thu nhỏ hộp va chạm của chướng ngại vật cho dễ thở
    nhanVat: { rong: 24, cao: 66 }, // hộp va chạm của bé (hẹp hơn hình vẽ cho dễ thở)
    tocDoDan: 1000,             // tốc độ viên phép thuật
    khoangPhepToiThieu: 90,     // quái có máu: thanh đếm ngược hết khi quái còn cách chừng này
    thoiGianThemMoiVien: 0.45,  // quái nhiều máu: thêm chừng này giây đọc từ cho mỗi viên từ viên thứ 2
    choTruocKhiVaoDuong: 2.4,   // giây chạy khởi động trước chướng ngại vật đầu tiên
    khoangCuoiTruocLauDai: 420, // khoảng trống cuối đường trước cổng lâu đài
    leQuaChuongNgai: 130,       // đã đi qua chướng ngại vật thêm chừng này mới mở thử thách mới
    leHoiSinh: 80,              // hồi sinh cách mép sau chướng ngại vật chừng này
    kichThuocKimCuong: 26,
    kimCuongMoiCum: 5,          // một cụm kim cương (một từ riêng) có tối đa chừng này viên, xếp theo đường cong cú nhảy
    tiLeDocKimCuong: 0.6,       // cụm kim cương: thời gian đọc từ = 60% thời gian của chướng ngại vật (bỏ lỡ không mất gì)
    kimCuongLe: 22,             // cụm kim cương: bấm lệch khỏi lúc lý tưởng chừng này vẫn lấy đủ cả cụm
    soCapOnTap: 6,              // bảng ôn tập cuối màn: tối đa chừng này cặp hình - chữ
    khoaLuuCaiDat: "kc_santu_cai_dat" // localStorage: bật/tắt âm thanh
  };

  /* ----- CẤP TỪ VỰNG (bé / phụ huynh chọn): chỉ quyết định từ dễ hay khó -----
     capTu: lấy từ ở cấp nào (st_kho_tu.js); capNhieu: phương án nhiễu lấy từ cấp nào;
     kimCuongToiDa: số kim cương nhiều nhất xuất hiện trong MỘT màn (7 màn: 35 / 56 / 84 / 105);
     anChu: ẩn chữ tiếng Anh (biển chữ, khung từ): bé chỉ NGHE đọc từ và nhìn HÌNH để chọn.
     (Giữ tên ST.DO_KHO / mã de, vua, kho, thuThach để không vỡ cài đặt đã lưu.) */
  ST.DO_KHO = {
    de:       { ma: "de",       ten: "Cấp 1", moTa: "Từ quen thuộc", bieuTuong: "🌱", capTu: [1], capNhieu: [1], kimCuongToiDa: 5 },
    vua:      { ma: "vua",      ten: "Cấp 2", moTa: "Từ thường gặp", bieuTuong: "🌼", capTu: [2], capNhieu: [2], kimCuongToiDa: 8 },
    kho:      { ma: "kho",      ten: "Cấp 3", moTa: "Nghe + nhìn hình, từ khó hơn", bieuTuong: "🔥", capTu: [3], capNhieu: [3, 2], kimCuongToiDa: 12, anChu: true },
    thuThach: { ma: "thuThach", ten: "Cấp 4", moTa: "Nghe + nhìn hình, từ dài", bieuTuong: "👑", capTu: [4, 4, 3], capNhieu: [4, 3], kimCuongToiDa: 15, anChu: true }
  };
  ST.THU_TU_DO_KHO = ["de", "vua", "kho", "thuThach"];

  /* ----- 7 MÀN CỦA MỘT ĐƯỜNG ĐUA: màn sau khó hơn màn trước -----
     soPhuongAn: số nút chọn từ; doGiong: 0 = phương án nhiễu ngẫu nhiên, 1 = gần giống nhất;
     tocDo: tốc độ chạy; thoiGianPhanUng: giây từ lúc hiện từ đến lúc phải xử lý xong;
     khoangThem: khoảng cách thêm ngẫu nhiên giữa 2 chướng ngại vật (thưa / dày);
     thoiGianDiDuKien: quãng đường = tocDo x số giây này (phần còn lại của thoiGianChoi
     là "đệm" cho các lần khựng / gặp nạn);
     loai: chướng ngại vật nào xuất hiện + trọng số (màn đầu chưa có quái khó);
     Kim cương: số lượng theo CẤP TỪ (ST.DO_KHO.kimCuongToiDa), chia thành các CỤM đứng riêng ở
       đoạn đường trống (không có vật cản / quái), mỗi cụm có MỘT TỪ riêng như một chướng ngại vật:
       bé bấm đúng từ để nhảy lên lấy (cụm lơ lửng theo đường cong cú nhảy, chạy dưới đất không chạm);
     tiLeNguyHiemToiThieu: tỉ lệ tối thiểu quái / hố: không bấm gì thì không thể qua màn;
     mauQuai: số viên phải bắn trúng để hạ quái có thanh máu / vật cản cao (càng về cuối càng nhiều);
     tiLeCoMau: xác suất một quái được mang thanh máu (luôn giữ KHÔNG QUÁ 1/4 tổng số quái). */
  const chung = { thoiGianChoi: 60, tiLeNguyHiemToiThieu: 0.6, tiLeCoMau: 0.6 };
  ST.MAN_CHOI = [
    { mauQuai: 2, soPhuongAn: 2, doGiong: 0,    tocDo: 140, thoiGianPhanUng: 4.6, khoangThem: [30, 140], thoiGianDiDuKien: 49,
      loai: { cong: 3, da: 2, gocCay: 2, nam: 3, ho: 2 } },
    { mauQuai: 2, soPhuongAn: 2, doGiong: 0.15, tocDo: 150, thoiGianPhanUng: 4.3, khoangThem: [30, 130], thoiGianDiDuKien: 49,
      loai: { cong: 2, da: 2, gocCay: 2, nam: 2, ho: 2, vit: 2 } },
    { mauQuai: 3, soPhuongAn: 3, doGiong: 0.25, tocDo: 160, thoiGianPhanUng: 4.0, khoangThem: [25, 120], thoiGianDiDuKien: 49,
      loai: { cong: 2, da: 2, gocCay: 1, nam: 2, nhim: 2, ho: 2, vit: 2, tuongDa: 1 } },
    { mauQuai: 3, soPhuongAn: 3, doGiong: 0.4,  tocDo: 175, thoiGianPhanUng: 3.7, khoangThem: [20, 110], thoiGianDiDuKien: 50,
      loai: { cong: 2, da: 1, gocCay: 1, nam: 2, nhim: 2, ho: 2, vit: 2, ong: 1, tuongDa: 1 } },
    { mauQuai: 4, soPhuongAn: 3, doGiong: 0.55, tocDo: 190, thoiGianPhanUng: 3.5, khoangThem: [20, 100], thoiGianDiDuKien: 50,
      loai: { cong: 2, da: 1, gocCay: 1, nam: 2, nhim: 2, slime: 2, ho: 2, vit: 2, ong: 2, tuongDa: 1 } },
    { mauQuai: 4, soPhuongAn: 4, doGiong: 0.7,  tocDo: 205, thoiGianPhanUng: 3.3, khoangThem: [15, 90], thoiGianDiDuKien: 50,
      loai: { cong: 1, da: 1, gocCay: 1, nam: 2, nhim: 2, slime: 2, ho: 3, vit: 2, ong: 2, tuongDa: 2 } },
    { mauQuai: 5, soPhuongAn: 4, doGiong: 0.85, tocDo: 220, thoiGianPhanUng: 3.1, khoangThem: [10, 80], thoiGianDiDuKien: 50,
      loai: { cong: 1, da: 1, gocCay: 1, nam: 2, nhim: 2, slime: 3, ho: 3, vit: 2, ong: 2, tuongDa: 2 } }
  ].map((m, i) => Object.assign({}, chung, m, { soMan: i + 1 }));
  ST.SO_MAN = ST.MAN_CHOI.length;

  /* ----- MÀN "TẬP CHƠI" (màn 0, người dùng yêu cầu 16/10/2026) -----
     Chạy chậm, nhiều giờ đọc, các chướng ngại vật xếp SẴN theo thứ tự để bé lần lượt học:
     nhảy qua vật cản, nhảy lấy kim cương, nhảy qua hố, nhảy qua quái không có
     thanh máu, bắn quái có thanh máu, bắn vỡ tường đá. CHỈ màn này có dải xanh hướng dẫn nhảy.
     Không tính sao, không mở khóa gì; chơi lại bao nhiêu lần cũng được. */
  ST.MAN_HUONG_DAN = Object.assign({}, chung, {
    soMan: 0, laHuongDan: true, mauQuai: 2, soPhuongAn: 2, doGiong: 0, tocDo: 120, thoiGianPhanUng: 5.2,
    khoangThem: [60, 120], thoiGianChoi: 150, loai: { cong: 1 },
    thuTu: [{ loai: "cong" }, { loai: "kimCuong", so: 3 }, { loai: "da" }, { loai: "ho" }, { loai: "nam" }, { loai: "nam", mau: 2 }, { loai: "tuongDa", mau: 2 }]
  });

  /* ----- 10 ĐƯỜNG ĐUA: mỗi đường một chủ đề, 7 màn cùng chủ đề -----
     cachDi: chay | truot | cuoi | boi | bay | tau (cách bé di chuyển);
     daCo: false = chưa làm hình / cách chơi, hiện "Sắp có";
     dich / bieuTuongDich: nơi mèo con bị nhốt ở màn cuối. */
  ST.DUONG_DUA = [
    { ma: "rung",    ten: "Rừng xanh",            bieuTuong: "🌳", cachDi: "chay",  daCo: true,  dich: "Lâu đài",        bieuTuongDich: "🏰" },
    { ma: "keo",     ten: "Xứ sở kẹo ngọt",       bieuTuong: "🍭", cachDi: "chay",  daCo: false, dich: "Lâu đài kẹo",    bieuTuongDich: "🧁" },
    { ma: "saMac",   ten: "Sa mạc kim tự tháp",   bieuTuong: "🏜️", cachDi: "chay",  daCo: false, dich: "Kim tự tháp",    bieuTuongDich: "🔺" },
    { ma: "tuyet",   ten: "Núi tuyết",            bieuTuong: "❄️", cachDi: "truot", daCo: false, dich: "Lâu đài băng",   bieuTuongDich: "🏔️" },
    { ma: "khungLong", ten: "Thung lũng khủng long", bieuTuong: "🦖", cachDi: "cuoi", daCo: false, dich: "Hang núi",     bieuTuongDich: "🌋" },
    { ma: "bien",    ten: "Biển san hô",          bieuTuong: "🌊", cachDi: "boi",   daCo: false, dich: "Tàu đắm",        bieuTuongDich: "🚢" },
    { ma: "nuiLua",  ten: "Núi lửa",              bieuTuong: "🌋", cachDi: "chay",  daCo: false, dich: "Pháo đài lửa",   bieuTuongDich: "🔥" },
    { ma: "troi",    ten: "Bầu trời mây",         bieuTuong: "🦅", cachDi: "bay",   daCo: false, dich: "Lâu đài mây",    bieuTuongDich: "☁️" },
    { ma: "dem",     ten: "Lâu đài đêm trăng",    bieuTuong: "🌙", cachDi: "chay",  daCo: false, dich: "Lâu đài ma",     bieuTuongDich: "🏯" },
    { ma: "vuTru",   ten: "Vũ trụ",               bieuTuong: "🚀", cachDi: "tau",   daCo: false, dich: "Trạm vũ trụ",    bieuTuongDich: "🛰️" }
  ];
  ST.layDuongDua = ma => ST.DUONG_DUA.find(d => d.ma === ma) || ST.DUONG_DUA[0];

  // Ghép đường đua + số màn (1..7) + cấp từ vựng thành cấu hình đầy đủ cho một màn chơi
  ST.taoManChoi = function (maDuong, soMan, maCapTu) {
    const duong = ST.layDuongDua(maDuong);
    const huongDan = soMan === 0; // màn 0 = màn "Tập chơi"
    const n = huongDan ? 0 : Math.max(1, Math.min(ST.SO_MAN, soMan | 0 || 1));
    const cap = ST.DO_KHO[maCapTu] || ST.DO_KHO.de;
    if (huongDan) return Object.assign({}, ST.MAN_HUONG_DAN, {
      ma: duong.ma + "-0-" + cap.ma, maDuong: duong.ma, duong, laManCuoi: false, ten: "Tập chơi",
      maCapTu: cap.ma, capTu: cap.capTu, capNhieu: cap.capNhieu, tenCap: cap.ten, anChu: !!cap.anChu,
      soKimCuong: [Math.min(3, cap.kimCuongToiDa), Math.min(3, cap.kimCuongToiDa)] // cụm ở thuTu
    });
    return Object.assign({}, ST.MAN_CHOI[n - 1], {
      ma: duong.ma + "-" + n + "-" + cap.ma, maDuong: duong.ma, duong, soMan: n, laManCuoi: n === ST.SO_MAN,
      maCapTu: cap.ma, ten: "Màn " + n, capTu: cap.capTu, capNhieu: cap.capNhieu, tenCap: cap.ten,
      anChu: !!cap.anChu, soKimCuong: [Math.ceil(cap.kimCuongToiDa * 0.6), cap.kimCuongToiDa]
    });
  };

  /* ----- Các loại chướng ngại vật -----
     nhom: can (vật cản) | quaiDat (quái mặt đất) | quaiBay (quái bay) | ho (hố sâu)
           | kimCuong (cụm kim cương có từ riêng, không va chạm; chỉ dùng khi sinh đường, không bốc thăm)
     Cú nhảy tính theo chính vật đó: dài 3 x bề ngang (xem thongSoNhay trong st_logic.js).
     quaiBay: LUÔN phải bắn (có thanh máu), không tính vào giới hạn 1/4.
     caoHonNhay: cao hơn cú nhảy -> LUÔN phải bắn (vật cản cao / thạch khổng lồ).
       Các loại khác bé nhảy qua; riêng quái được gắn THANH MÁU (lúc sinh đường, tối đa
       1/4 số quái) thì phải bắn. Việc bé làm (nhảy / bắn) ghi ở từng chướng ngại vật.
     vaCham: khung (chỉ khựng lại, KHÔNG mất mạng) | matMang | roi (rơi hố -> mất mạng)
     rong/cao: [nhỏ nhất, lớn nhất] - mỗi lần sinh chọn ngẫu nhiên trong khoảng
     bayCao: quái bay lơ lửng cách mặt đất chừng này (đúng tầm va vào người bé)
     tocDoDi: quái tiến về phía bé (đơn vị/giây) sau khi thử thách hiện ra */
  ST.LOAI_CHUONG_NGAI = {
    cong:    { ten: "Ống cống",       nhom: "can",     vaCham: "khung",   rong: [80, 92],   cao: [56, 64] },
    da:      { ten: "Tảng đá",        nhom: "can",     vaCham: "khung",   rong: [46, 70],   cao: [34, 52] },
    gocCay:  { ten: "Gốc cây",        nhom: "can",     vaCham: "khung",   rong: [48, 62],   cao: [44, 58] },
    tuongDa: { ten: "Tường đá",       nhom: "can",     vaCham: "khung",   rong: [58, 66],   cao: [176, 190], caoHonNhay: true },
    nam:     { ten: "Nấm tí hon",     nhom: "quaiDat", vaCham: "matMang", rong: [50, 54],   cao: [52, 56], tocDoDi: 30 },
    nhim:    { ten: "Nhím gai",       nhom: "quaiDat", vaCham: "matMang", rong: [56, 60],   cao: [38, 42], tocDoDi: 45 },
    slime:   { ten: "Thạch khổng lồ", nhom: "quaiDat", vaCham: "matMang", rong: [78, 84],   cao: [166, 176], tocDoDi: 20, caoHonNhay: true },
    vit:     { ten: "Vịt bay",        nhom: "quaiBay", vaCham: "matMang", rong: [58, 62],   cao: [42, 46], bayCao: 26, tocDoDi: 55 },
    ong:     { ten: "Ong bay",        nhom: "quaiBay", vaCham: "matMang", rong: [44, 48],   cao: [40, 42], bayCao: 18, tocDoDi: 40 },
    ho:      { ten: "Hố sâu",         nhom: "ho",      vaCham: "roi",     rong: [70, 100],  cao: [0, 0] },
    kimCuong:{ ten: "Kim cương",      nhom: "kimCuong", vaCham: "khong",  rong: [0, 0],     cao: [0, 0] }
  };
})(typeof window !== "undefined" ? window : globalThis);
