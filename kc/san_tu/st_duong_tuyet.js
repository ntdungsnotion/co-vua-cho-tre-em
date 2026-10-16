/* ================================================================
   FILE: san_tu/st_duong_tuyet.js
   CHỨC NĂNG: Dữ liệu đường đua 4 "Núi tuyết" (bé TRƯỢT VÁN tuyết; luật chạy / nhảy giữ nguyên,
              chỉ đổi hình). Hình vẽ ở st_ve_tuyet.js.
   BƯỚC: TC_00F
   NGÀY: 16/10/2026
   ================================================================ */
(function (goc) {
  "use strict";
  const ST = goc.ST;
  ST.themDuongDua("tuyet", {
    tenHang: "Hang băng bí mật",
    nhom: {
      thap: ["dongTuyet", "khoiBang", "nguoiTuyetNho", "goThong", "xeTruot", "hangRaoTuyet"],
      cao: ["thapBang", "thongTuyetCao"],
      dat: ["canhCut", "haiCau", "banhTuyetLan", "thoTuyet", "caoTuyet"],
      khongLo: ["yeti", "nguoiTuyetKhongLo"],
      bay: ["cuTuyet", "chimCoDo", "bongTuyetBay", "doiBang"],
      ho: "hoBang"
    },
    loai: {
      dongTuyet:     { ten: "Đống tuyết",        nhom: "can",     vaCham: "khung",   rong: [60, 80],  cao: [32, 42] },
      khoiBang:      { ten: "Khối băng",         nhom: "can",     vaCham: "khung",   rong: [48, 60],  cao: [44, 56] },
      nguoiTuyetNho: { ten: "Người tuyết nhỏ",   nhom: "can",     vaCham: "khung",   rong: [44, 50],  cao: [52, 58] },
      goThong:       { ten: "Gốc thông phủ tuyết", nhom: "can",   vaCham: "khung",   rong: [50, 62],  cao: [42, 54] },
      xeTruot:       { ten: "Xe trượt tuyết",    nhom: "can",     vaCham: "khung",   rong: [72, 88],  cao: [34, 42] },
      hangRaoTuyet:  { ten: "Hàng rào tuyết",    nhom: "can",     vaCham: "khung",   rong: [66, 84],  cao: [48, 56] },
      thapBang:      { ten: "Tháp băng",         nhom: "can",     vaCham: "khung",   rong: [58, 66],  cao: [176, 190], caoHonNhay: true },
      thongTuyetCao: { ten: "Cây thông tuyết cao", nhom: "can",   vaCham: "khung",   rong: [62, 70],  cao: [180, 194], caoHonNhay: true },
      canhCut:       { ten: "Chim cánh cụt",     nhom: "quaiDat", vaCham: "matMang", rong: [46, 52],  cao: [50, 56], tocDoDi: 20 },
      haiCau:        { ten: "Hải cẩu",           nhom: "quaiDat", vaCham: "matMang", rong: [66, 76],  cao: [34, 40], tocDoDi: 15 },
      banhTuyetLan:  { ten: "Quả cầu tuyết lăn", nhom: "quaiDat", vaCham: "matMang", rong: [50, 56],  cao: [50, 56], tocDoDi: 30 },
      thoTuyet:      { ten: "Thỏ tuyết",         nhom: "quaiDat", vaCham: "matMang", rong: [48, 54],  cao: [44, 50], tocDoDi: 45 },
      caoTuyet:      { ten: "Cáo tuyết",         nhom: "quaiDat", vaCham: "matMang", rong: [66, 76],  cao: [38, 44], tocDoDi: 50 },
      yeti:          { ten: "Người tuyết Yeti",  nhom: "quaiDat", vaCham: "matMang", rong: [80, 88],  cao: [168, 180], tocDoDi: 18, caoHonNhay: true },
      nguoiTuyetKhongLo: { ten: "Người tuyết khổng lồ", nhom: "quaiDat", vaCham: "matMang", rong: [80, 86], cao: [170, 182], tocDoDi: 16, caoHonNhay: true },
      cuTuyet:       { ten: "Cú tuyết",          nhom: "quaiBay", vaCham: "matMang", rong: [54, 60],  cao: [40, 46], bayCao: 24, tocDoDi: 45 },
      chimCoDo:      { ten: "Chim cổ đỏ",        nhom: "quaiBay", vaCham: "matMang", rong: [50, 56],  cao: [36, 40], bayCao: 22, tocDoDi: 50 },
      bongTuyetBay:  { ten: "Bông tuyết tinh nghịch", nhom: "quaiBay", vaCham: "matMang", rong: [46, 50], cao: [44, 48], bayCao: 20, tocDoDi: 35 },
      doiBang:       { ten: "Dơi băng",          nhom: "quaiBay", vaCham: "matMang", rong: [56, 62],  cao: [34, 40], bayCao: 30, tocDoDi: 60 },
      hoBang:        { ten: "Khe băng",          nhom: "ho",      vaCham: "roi",     rong: [70, 100], cao: [0, 0] }
    }
  });
})(typeof window !== "undefined" ? window : globalThis);
