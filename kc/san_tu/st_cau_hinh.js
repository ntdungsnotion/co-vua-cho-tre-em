/* ================================================================
   FILE: san_tu/st_cau_hinh.js
   CHỨC NĂNG: TOÀN BỘ THAM SỐ của game "Săn Từ: Đường Đến Lâu Đài" (game chạy
              vượt chướng ngại vật + học từ tiếng Anh). Muốn chỉnh độ khó, thời
              gian chơi, số kim cương đổi mạng... chỉ sửa file này, không phải
              sửa logic.
   BƯỚC: TC_00B
   NGÀY: 15/10/2026
   ĐƠN VỊ: khoảng cách tính bằng "đơn vị thế giới" (nhân vật cao 66 đơn vị),
           thời gian tính bằng giây, tốc độ = đơn vị/giây.
   ================================================================ */
(function (goc) {
  "use strict";
  const ST = goc.ST = goc.ST || {};

  /* ----- Tham số chung (không đổi theo độ khó) ----- */
  ST.CAU_HINH = {
    thoiGianChoi: 120,          // giây cho một lượt
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

  /* ----- Các mức độ khó -----
     soPhuongAn: số nút chọn từ; capTu: lấy từ ở cấp nào (st_tu_vung.js);
     doGiong: 0 = phương án nhiễu chọn ngẫu nhiên, 1 = chọn từ gần giống nhất;
     tocDo: tốc độ chạy; thoiGianPhanUng: giây từ lúc hiện từ đến lúc phải xử lý xong;
     khoangThem: khoảng cách thêm ngẫu nhiên giữa 2 chướng ngại vật (thưa / dày);
     thoiGianDiDuKien: quãng đường = tocDo x số giây này (phần còn lại của 120 giây
     là "đệm" cho các lần khựng / gặp nạn);
     loai: chướng ngại vật nào xuất hiện + trọng số;
     tiLeKimCuong / soVienKimCuong: xác suất một từ có kim cương, mỗi từ mấy viên;
     tiLeNguyHiemToiThieu: tỉ lệ tối thiểu quái / hố trên đường (mức Dễ cần vì quái thưa). */
  ST.DO_KHO = {
    de: {
      ten: "Dễ", moTa: "2 từ để chọn · chạy chậm", bieuTuong: "🌱",
      soPhuongAn: 2, capTu: [1], capNhieu: [1], doGiong: 0,
      tocDo: 150, thoiGianPhanUng: 5.0, khoangThem: [40, 200], thoiGianDiDuKien: 90,
      loai: { cong: 3, da: 2, gocCay: 2, nam: 2, ho: 2, vit: 2 },
      tiLeKimCuong: 0.5, soVienKimCuong: [2, 3], kimCuongLienTiepToiDa: 2,
      tiLeNguyHiemToiThieu: 0.4 // ít nhất 40% là quái / hố: không bấm gì thì không thể thắng
    },
    vua: {
      ten: "Trung bình", moTa: "3 từ để chọn", bieuTuong: "🌼",
      soPhuongAn: 3, capTu: [2], capNhieu: [2], doGiong: 0.3,
      tocDo: 175, thoiGianPhanUng: 4.2, khoangThem: [30, 170], thoiGianDiDuKien: 92,
      loai: { cong: 2, da: 2, gocCay: 1, nam: 2, nhim: 2, ho: 2, vit: 2, ong: 1 },
      tiLeKimCuong: 0.45, soVienKimCuong: [1, 3], kimCuongLienTiepToiDa: 2
    },
    kho: {
      ten: "Khó", moTa: "4 từ · chạy nhanh", bieuTuong: "🔥",
      soPhuongAn: 4, capTu: [3], capNhieu: [3, 2], doGiong: 0.65,
      tocDo: 205, thoiGianPhanUng: 3.5, khoangThem: [20, 140], thoiGianDiDuKien: 94,
      loai: { cong: 2, da: 1, gocCay: 1, nam: 2, nhim: 2, slime: 2, ho: 2, vit: 2, ong: 2 },
      tiLeKimCuong: 0.4, soVienKimCuong: [1, 3], kimCuongLienTiepToiDa: 2
    },
    thuThach: {
      ten: "Thử thách", moTa: "4 từ dễ nhầm · rất nhanh", bieuTuong: "👑",
      soPhuongAn: 4, capTu: [4, 4, 3], capNhieu: [4, 3], doGiong: 1,
      tocDo: 230, thoiGianPhanUng: 3.0, khoangThem: [10, 110], thoiGianDiDuKien: 96,
      loai: { cong: 1, da: 1, gocCay: 1, nam: 2, nhim: 2, slime: 3, ho: 3, vit: 2, ong: 2 },
      tiLeKimCuong: 0.38, soVienKimCuong: [1, 3], kimCuongLienTiepToiDa: 2
    }
  };
  ST.THU_TU_DO_KHO = ["de", "vua", "kho", "thuThach"];

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
