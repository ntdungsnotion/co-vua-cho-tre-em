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
   ĐƠN VỊ: khoảng cách tính bằng "đơn vị thế giới" (nhân vật cao 66 đơn vị),
           thời gian tính bằng giây, tốc độ = đơn vị/giây.
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
    doCaoNhay: 125,             // độ cao cú nhảy vượt chướng ngại vật
    doCaoNhayKimCuong: 115,     // độ cao cú nhảy nhặt kim cương (sau khi bắn phép)
    thoiGianNhayKimCuong: 0.8,  // thời gian cú nhảy nhặt kim cương
    thoiGianNhayToiThieu: 0.72, // cú nhảy ngắn nhất (giây)
    leNhay: 40,                 // khoảng an toàn mỗi bên khi nhảy qua vật cản
    nhanVat: { rong: 40, cao: 66 },
    tocDoDan: 1000,             // tốc độ viên phép thuật
    khoangPhepToiThieu: 90,     // quái phải còn cách ít nhất chừng này thì mới kịp bắn
    tamBanPhep: 330,            // trả lời đúng sớm: bé giơ đũa chờ, quái vào tầm này (trong màn hình) mới bắn
    choTruocKhiVaoDuong: 2.4,   // giây chạy khởi động trước chướng ngại vật đầu tiên
    khoangCuoiTruocLauDai: 420, // khoảng trống cuối đường trước cổng lâu đài
    leQuaChuongNgai: 130,       // đã đi qua chướng ngại vật thêm chừng này mới mở thử thách mới
    leHoiSinh: 80,              // hồi sinh cách mép sau chướng ngại vật chừng này
    kichThuocKimCuong: 26,
    khoaLuuCaiDat: "kc_santu_cai_dat" // localStorage: bật/tắt âm thanh
  };

  /* ----- CẤP TỪ VỰNG (bé / phụ huynh chọn): chỉ quyết định từ dễ hay khó -----
     capTu: lấy từ ở cấp nào (st_kho_tu.js); capNhieu: phương án nhiễu lấy từ cấp nào.
     (Giữ tên ST.DO_KHO / mã de, vua, kho, thuThach để không vỡ cài đặt đã lưu.) */
  ST.DO_KHO = {
    de:       { ma: "de",       ten: "Cấp 1", moTa: "Từ quen thuộc", bieuTuong: "🌱", capTu: [1], capNhieu: [1] },
    vua:      { ma: "vua",      ten: "Cấp 2", moTa: "Từ thường gặp", bieuTuong: "🌼", capTu: [2], capNhieu: [2] },
    kho:      { ma: "kho",      ten: "Cấp 3", moTa: "Từ khó hơn",    bieuTuong: "🔥", capTu: [3], capNhieu: [3, 2] },
    thuThach: { ma: "thuThach", ten: "Cấp 4", moTa: "Từ dài, khó",   bieuTuong: "👑", capTu: [4, 4, 3], capNhieu: [4, 3] }
  };
  ST.THU_TU_DO_KHO = ["de", "vua", "kho", "thuThach"];

  /* ----- 7 MÀN CỦA MỘT ĐƯỜNG ĐUA: màn sau khó hơn màn trước -----
     soPhuongAn: số nút chọn từ; doGiong: 0 = phương án nhiễu ngẫu nhiên, 1 = gần giống nhất;
     tocDo: tốc độ chạy; thoiGianPhanUng: giây từ lúc hiện từ đến lúc phải xử lý xong;
     khoangThem: khoảng cách thêm ngẫu nhiên giữa 2 chướng ngại vật (thưa / dày);
     thoiGianDiDuKien: quãng đường = tocDo x số giây này (phần còn lại của thoiGianChoi
     là "đệm" cho các lần khựng / gặp nạn);
     loai: chướng ngại vật nào xuất hiện + trọng số (màn đầu chưa có quái khó);
     tiLeKimCuong / soVienKimCuong: xác suất một từ có kim cương, mỗi từ mấy viên;
     tiLeNguyHiemToiThieu: tỉ lệ tối thiểu quái / hố: không bấm gì thì không thể qua màn. */
  const chung = { thoiGianChoi: 60, soVienKimCuong: [1, 3], kimCuongLienTiepToiDa: 2, tiLeNguyHiemToiThieu: 0.6 };
  ST.MAN_CHOI = [
    { soPhuongAn: 2, doGiong: 0,    tocDo: 140, thoiGianPhanUng: 4.6, khoangThem: [30, 140], thoiGianDiDuKien: 49,
      loai: { cong: 3, da: 2, gocCay: 2, nam: 3, ho: 2 }, tiLeKimCuong: 0.55, soVienKimCuong: [2, 3] },
    { soPhuongAn: 2, doGiong: 0.15, tocDo: 150, thoiGianPhanUng: 4.3, khoangThem: [30, 130], thoiGianDiDuKien: 49,
      loai: { cong: 2, da: 2, gocCay: 2, nam: 2, ho: 2, vit: 2 }, tiLeKimCuong: 0.5, soVienKimCuong: [2, 3] },
    { soPhuongAn: 3, doGiong: 0.25, tocDo: 160, thoiGianPhanUng: 4.0, khoangThem: [25, 120], thoiGianDiDuKien: 49,
      loai: { cong: 2, da: 2, gocCay: 1, nam: 2, nhim: 2, ho: 2, vit: 2 }, tiLeKimCuong: 0.45 },
    { soPhuongAn: 3, doGiong: 0.4,  tocDo: 175, thoiGianPhanUng: 3.7, khoangThem: [20, 110], thoiGianDiDuKien: 50,
      loai: { cong: 2, da: 1, gocCay: 1, nam: 2, nhim: 2, ho: 2, vit: 2, ong: 1 }, tiLeKimCuong: 0.45 },
    { soPhuongAn: 3, doGiong: 0.55, tocDo: 190, thoiGianPhanUng: 3.5, khoangThem: [20, 100], thoiGianDiDuKien: 50,
      loai: { cong: 2, da: 1, gocCay: 1, nam: 2, nhim: 2, slime: 2, ho: 2, vit: 2, ong: 2 }, tiLeKimCuong: 0.4 },
    { soPhuongAn: 4, doGiong: 0.7,  tocDo: 205, thoiGianPhanUng: 3.3, khoangThem: [15, 90], thoiGianDiDuKien: 50,
      loai: { cong: 1, da: 1, gocCay: 1, nam: 2, nhim: 2, slime: 2, ho: 3, vit: 2, ong: 2 }, tiLeKimCuong: 0.4 },
    { soPhuongAn: 4, doGiong: 0.85, tocDo: 220, thoiGianPhanUng: 3.1, khoangThem: [10, 80], thoiGianDiDuKien: 50,
      loai: { cong: 1, da: 1, gocCay: 1, nam: 2, nhim: 2, slime: 3, ho: 3, vit: 2, ong: 2 }, tiLeKimCuong: 0.38 }
  ].map((m, i) => Object.assign({}, chung, m, { soMan: i + 1 }));
  ST.SO_MAN = ST.MAN_CHOI.length;

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
    const n = Math.max(1, Math.min(ST.SO_MAN, soMan | 0 || 1));
    const cap = ST.DO_KHO[maCapTu] || ST.DO_KHO.de;
    return Object.assign({}, ST.MAN_CHOI[n - 1], {
      ma: duong.ma + "-" + n + "-" + cap.ma, maDuong: duong.ma, duong, soMan: n, laManCuoi: n === ST.SO_MAN,
      maCapTu: cap.ma, ten: "Màn " + n, capTu: cap.capTu, capNhieu: cap.capNhieu, tenCap: cap.ten
    });
  };

  /* ----- Các loại chướng ngại vật -----
     nhom: can (vật cản) | quaiDat (quái mặt đất) | quaiBay (quái bay) | ho (hố sâu)
     hanhDong: nhay (bé nhảy qua) | phep (bé bắn phép thuật)
     vaCham: khung (chỉ khựng lại, KHÔNG mất mạng) | matMang | roi (rơi hố -> mất mạng)
     rong/cao: [nhỏ nhất, lớn nhất] - mỗi lần sinh chọn ngẫu nhiên trong khoảng
     bayCao: quái bay lơ lửng cách mặt đất chừng này (đúng tầm va vào người bé)
     tocDoDi: quái tiến về phía bé (đơn vị/giây) sau khi thử thách hiện ra */
  ST.LOAI_CHUONG_NGAI = {
    cong:   { ten: "Ống cống",      nhom: "can",     hanhDong: "nhay", vaCham: "khung",  rong: [80, 92],  cao: [56, 64] },
    da:     { ten: "Tảng đá",       nhom: "can",     hanhDong: "nhay", vaCham: "khung",  rong: [46, 70],  cao: [34, 52] },
    gocCay: { ten: "Gốc cây",       nhom: "can",     hanhDong: "nhay", vaCham: "khung",  rong: [48, 62],  cao: [44, 58] },
    nam:    { ten: "Nấm tí hon",    nhom: "quaiDat", hanhDong: "nhay", vaCham: "matMang", rong: [50, 54], cao: [52, 56], tocDoDi: 30 },
    nhim:   { ten: "Nhím gai",      nhom: "quaiDat", hanhDong: "nhay", vaCham: "matMang", rong: [56, 60], cao: [38, 42], tocDoDi: 45 },
    slime:  { ten: "Thạch khổng lồ", nhom: "quaiDat", hanhDong: "phep", vaCham: "matMang", rong: [78, 84], cao: [140, 150], tocDoDi: 20 },
    vit:    { ten: "Vịt bay",       nhom: "quaiBay", hanhDong: "phep", vaCham: "matMang", rong: [58, 62], cao: [42, 46], bayCao: 26, tocDoDi: 55 },
    ong:    { ten: "Ong bay",       nhom: "quaiBay", hanhDong: "phep", vaCham: "matMang", rong: [44, 48], cao: [40, 42], bayCao: 18, tocDoDi: 40 },
    ho:     { ten: "Hố sâu",        nhom: "ho",      hanhDong: "nhay", vaCham: "roi",    rong: [100, 150], cao: [0, 0] }
  };
})(typeof window !== "undefined" ? window : globalThis);
