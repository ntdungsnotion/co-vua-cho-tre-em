/* ================================================================
   FILE: san_tu/st_duong_nuilua.js
   CHỨC NĂNG: Dữ liệu đường đua 7 "Núi lửa" (bé chạy, đội mũ bảo hộ có đèn). Hình vẽ ở st_ve_nuilua.js.
   BƯỚC: TC_00F
   NGÀY: 16/10/2026
   ================================================================ */
(function (goc) {
  "use strict";
  const ST = goc.ST;
  ST.themDuongDua("nuiLua", {
    tenHang: "Hang đá quý dung nham",
    nhom: {
      thap: ["daDungNham", "ongKhoi", "tinhTheLua", "goCayChay", "dongTro", "trungRong"],
      cao: ["cotDungNham", "thapDaDen"],
      dat: ["ocLua", "boHungLua", "nguoiDaNho", "thanLanLua", "rongCon"],
      khongLo: ["nguoiDaKhongLo", "rongLua"],
      bay: ["phuongHoang", "doiLua", "quaCauLua", "domDomLua"],
      ho: "hoDungNham"
    },
    loai: {
      daDungNham:  { ten: "Tảng đá nóng",      nhom: "can",     vaCham: "khung",   rong: [54, 68],  cao: [38, 50] },
      ongKhoi:     { ten: "Lỗ phun hơi",       nhom: "can",     vaCham: "khung",   rong: [50, 60],  cao: [40, 50] },
      tinhTheLua:  { ten: "Tinh thể đỏ",       nhom: "can",     vaCham: "khung",   rong: [46, 56],  cao: [50, 58] },
      goCayChay:   { ten: "Gốc cây cháy",      nhom: "can",     vaCham: "khung",   rong: [50, 60],  cao: [44, 54] },
      dongTro:     { ten: "Đống tro",          nhom: "can",     vaCham: "khung",   rong: [66, 82],  cao: [32, 42] },
      trungRong:   { ten: "Trứng rồng",        nhom: "can",     vaCham: "khung",   rong: [44, 50],  cao: [52, 58] },
      cotDungNham: { ten: "Cột dung nham",     nhom: "can",     vaCham: "khung",   rong: [58, 66],  cao: [178, 192], caoHonNhay: true },
      thapDaDen:   { ten: "Tháp đá đen",       nhom: "can",     vaCham: "khung",   rong: [56, 64],  cao: [180, 194], caoHonNhay: true },
      ocLua:       { ten: "Ốc lửa",            nhom: "quaiDat", vaCham: "matMang", rong: [54, 60],  cao: [44, 50], tocDoDi: 15 },
      boHungLua:   { ten: "Bọ lửa",            nhom: "quaiDat", vaCham: "matMang", rong: [58, 66],  cao: [38, 44], tocDoDi: 20 },
      nguoiDaNho:  { ten: "Người đá tí hon",   nhom: "quaiDat", vaCham: "matMang", rong: [48, 54],  cao: [52, 58], tocDoDi: 30 },
      thanLanLua:  { ten: "Kỳ nhông lửa",      nhom: "quaiDat", vaCham: "matMang", rong: [70, 80],  cao: [30, 36], tocDoDi: 45 },
      rongCon:     { ten: "Rồng con",          nhom: "quaiDat", vaCham: "matMang", rong: [54, 62],  cao: [48, 54], tocDoDi: 50 },
      nguoiDaKhongLo: { ten: "Người đá khổng lồ", nhom: "quaiDat", vaCham: "matMang", rong: [82, 88], cao: [168, 180], tocDoDi: 16, caoHonNhay: true },
      rongLua:     { ten: "Rồng lửa",          nhom: "quaiDat", vaCham: "matMang", rong: [84, 90],  cao: [170, 182], tocDoDi: 18, caoHonNhay: true },
      phuongHoang: { ten: "Phượng hoàng lửa",  nhom: "quaiBay", vaCham: "matMang", rong: [60, 66],  cao: [40, 46], bayCao: 26, tocDoDi: 55 },
      doiLua:      { ten: "Dơi lửa",           nhom: "quaiBay", vaCham: "matMang", rong: [56, 62],  cao: [34, 40], bayCao: 30, tocDoDi: 60 },
      quaCauLua:   { ten: "Quả cầu lửa",       nhom: "quaiBay", vaCham: "matMang", rong: [46, 52],  cao: [44, 50], bayCao: 20, tocDoDi: 40 },
      domDomLua:   { ten: "Đom đóm lửa",       nhom: "quaiBay", vaCham: "matMang", rong: [48, 54],  cao: [34, 40], bayCao: 22, tocDoDi: 45 },
      hoDungNham:  { ten: "Hố dung nham",      nhom: "ho",      vaCham: "roi",     rong: [70, 100], cao: [0, 0] }
    }
  });
})(typeof window !== "undefined" ? window : globalThis);
