/* ================================================================
   FILE: san_tu/st_duong_dem.js
   CHỨC NĂNG: Dữ liệu đường đua 9 "Lâu đài đêm trăng" (bé chạy, khoác áo choàng; quái dễ thương,
              không đáng sợ). Hình vẽ ở st_ve_dem.js.
   BƯỚC: TC_00F
   NGÀY: 16/10/2026
   ================================================================ */
(function (goc) {
  "use strict";
  const ST = goc.ST;
  ST.themDuongDua("dem", {
    tenHang: "Hầm kho báu lâu đài",
    nhom: {
      thap: ["biNgo", "chongSach", "nenChay", "vacPhuThuy", "hangRaoSat", "gieng"],
      cao: ["thapDongHo", "aoGiapHiepSi"],
      dat: ["nhenNho", "maNho", "boXuong", "chuotDem", "soiCon"],
      khongLo: ["maKhongLo", "hiepSiMa"],
      bay: ["doiDem", "cuMeo", "phuThuyChoi", "maTroi"],
      ho: "hamToi"
    },
    loai: {
      biNgo:        { ten: "Quả bí ngô",        nhom: "can",     vaCham: "khung",   rong: [54, 66],  cao: [40, 50] },
      chongSach:    { ten: "Chồng sách phép",   nhom: "can",     vaCham: "khung",   rong: [48, 58],  cao: [50, 58] },
      nenChay:      { ten: "Chân nến",          nhom: "can",     vaCham: "khung",   rong: [46, 54],  cao: [50, 58] },
      vacPhuThuy:   { ten: "Vạc phù thủy",      nhom: "can",     vaCham: "khung",   rong: [58, 70],  cao: [40, 50] },
      hangRaoSat:   { ten: "Hàng rào sắt",      nhom: "can",     vaCham: "khung",   rong: [66, 84],  cao: [48, 56] },
      gieng:        { ten: "Giếng đá",          nhom: "can",     vaCham: "khung",   rong: [60, 72],  cao: [40, 50] },
      thapDongHo:   { ten: "Tháp đồng hồ",      nhom: "can",     vaCham: "khung",   rong: [60, 68],  cao: [178, 192], caoHonNhay: true },
      aoGiapHiepSi: { ten: "Tượng hiệp sĩ",     nhom: "can",     vaCham: "khung",   rong: [58, 66],  cao: [180, 194], caoHonNhay: true },
      nhenNho:      { ten: "Nhện con",          nhom: "quaiDat", vaCham: "matMang", rong: [56, 64],  cao: [40, 46], tocDoDi: 15 },
      maNho:        { ten: "Con ma nhỏ",        nhom: "quaiDat", vaCham: "matMang", rong: [46, 52],  cao: [50, 56], tocDoDi: 20 },
      boXuong:      { ten: "Bộ xương vui nhộn", nhom: "quaiDat", vaCham: "matMang", rong: [46, 52],  cao: [52, 58], tocDoDi: 30 },
      chuotDem:     { ten: "Chuột đêm",         nhom: "quaiDat", vaCham: "matMang", rong: [60, 70],  cao: [32, 38], tocDoDi: 45 },
      soiCon:       { ten: "Sói con",           nhom: "quaiDat", vaCham: "matMang", rong: [64, 72],  cao: [46, 52], tocDoDi: 50 },
      maKhongLo:    { ten: "Con ma khổng lồ",   nhom: "quaiDat", vaCham: "matMang", rong: [82, 88],  cao: [168, 180], tocDoDi: 16, caoHonNhay: true },
      hiepSiMa:     { ten: "Hiệp sĩ ma",        nhom: "quaiDat", vaCham: "matMang", rong: [78, 86],  cao: [170, 182], tocDoDi: 18, caoHonNhay: true },
      doiDem:       { ten: "Dơi đêm",           nhom: "quaiBay", vaCham: "matMang", rong: [56, 62],  cao: [34, 40], bayCao: 30, tocDoDi: 60 },
      cuMeo:        { ten: "Cú mèo",            nhom: "quaiBay", vaCham: "matMang", rong: [52, 58],  cao: [42, 48], bayCao: 22, tocDoDi: 45 },
      phuThuyChoi:  { ten: "Phù thủy nhí cưỡi chổi", nhom: "quaiBay", vaCham: "matMang", rong: [62, 68], cao: [44, 50], bayCao: 24, tocDoDi: 50 },
      maTroi:       { ten: "Đốm ma trơi",       nhom: "quaiBay", vaCham: "matMang", rong: [44, 50],  cao: [44, 50], bayCao: 20, tocDoDi: 35 },
      hamToi:       { ten: "Hầm tối",           nhom: "ho",      vaCham: "roi",     rong: [70, 100], cao: [0, 0] }
    }
  });
})(typeof window !== "undefined" ? window : globalThis);
