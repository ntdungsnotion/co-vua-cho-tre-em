/* ================================================================
   FILE: san_tu/st_duong_bien.js
   CHỨC NĂNG: Dữ liệu đường đua 6 "Biển san hô" (bé BƠI dưới biển với kính lặn, ống thở, chân vịt;
              "nhảy" thành "bơi vọt lên", luật giữ nguyên). Hình vẽ ở st_ve_bien.js.
   BƯỚC: TC_00F
   NGÀY: 16/10/2026
   ================================================================ */
(function (goc) {
  "use strict";
  const ST = goc.ST;
  ST.themDuongDua("bien", {
    tenHang: "Hang ngọc trai",
    nhom: {
      thap: ["sanHoNao", "soKhongLo", "moNeo", "ruongDam", "thungGoBien", "cumRongBien"],
      cao: ["cotSanHo", "rongBienCao"],
      dat: ["saoBien", "cuaBien", "ocMuonHon", "caNoc", "tomHum"],
      khongLo: ["bachTuoc", "caNguaKhongLo"],
      bay: ["caHe", "sua", "caDuoi", "ruaBien"],
      ho: "hoVucBien"
    },
    loai: {
      sanHoNao:     { ten: "San hô não",        nhom: "can",     vaCham: "khung",   rong: [56, 70],  cao: [36, 46] },
      soKhongLo:    { ten: "Con sò khổng lồ",   nhom: "can",     vaCham: "khung",   rong: [60, 74],  cao: [40, 50] },
      moNeo:        { ten: "Mỏ neo",            nhom: "can",     vaCham: "khung",   rong: [48, 56],  cao: [52, 58] },
      ruongDam:     { ten: "Rương châu báu",    nhom: "can",     vaCham: "khung",   rong: [56, 64],  cao: [44, 52] },
      thungGoBien:  { ten: "Thùng gỗ đắm",      nhom: "can",     vaCham: "khung",   rong: [46, 54],  cao: [48, 56] },
      cumRongBien:  { ten: "Bụi rong biển",     nhom: "can",     vaCham: "khung",   rong: [56, 70],  cao: [48, 56] },
      cotSanHo:     { ten: "Cột san hô",        nhom: "can",     vaCham: "khung",   rong: [60, 68],  cao: [178, 192], caoHonNhay: true },
      rongBienCao:  { ten: "Rừng tảo bẹ cao",   nhom: "can",     vaCham: "khung",   rong: [58, 66],  cao: [180, 194], caoHonNhay: true },
      saoBien:      { ten: "Sao biển",          nhom: "quaiDat", vaCham: "matMang", rong: [50, 56],  cao: [44, 50], tocDoDi: 15 },
      cuaBien:      { ten: "Cua biển",          nhom: "quaiDat", vaCham: "matMang", rong: [62, 70],  cao: [38, 44], tocDoDi: 20 },
      ocMuonHon:    { ten: "Ốc mượn hồn",       nhom: "quaiDat", vaCham: "matMang", rong: [52, 58],  cao: [46, 52], tocDoDi: 30 },
      caNoc:        { ten: "Cá nóc",            nhom: "quaiDat", vaCham: "matMang", rong: [50, 56],  cao: [46, 52], tocDoDi: 45 },
      tomHum:       { ten: "Tôm hùm",           nhom: "quaiDat", vaCham: "matMang", rong: [70, 80],  cao: [34, 40], tocDoDi: 50 },
      bachTuoc:     { ten: "Bạch tuộc khổng lồ", nhom: "quaiDat", vaCham: "matMang", rong: [82, 88], cao: [168, 180], tocDoDi: 18, caoHonNhay: true },
      caNguaKhongLo:{ ten: "Cá ngựa khổng lồ",  nhom: "quaiDat", vaCham: "matMang", rong: [78, 86],  cao: [172, 184], tocDoDi: 16, caoHonNhay: true },
      caHe:         { ten: "Cá hề",             nhom: "quaiBay", vaCham: "matMang", rong: [54, 60],  cao: [34, 40], bayCao: 24, tocDoDi: 50 },
      sua:          { ten: "Con sứa",           nhom: "quaiBay", vaCham: "matMang", rong: [46, 52],  cao: [44, 50], bayCao: 20, tocDoDi: 35 },
      caDuoi:       { ten: "Cá đuối",           nhom: "quaiBay", vaCham: "matMang", rong: [64, 70],  cao: [30, 36], bayCao: 28, tocDoDi: 55 },
      ruaBien:      { ten: "Rùa biển",          nhom: "quaiBay", vaCham: "matMang", rong: [62, 68],  cao: [36, 42], bayCao: 26, tocDoDi: 45 },
      hoVucBien:    { ten: "Vực biển sâu",      nhom: "ho",      vaCham: "roi",     rong: [70, 100], cao: [0, 0] }
    }
  });
})(typeof window !== "undefined" ? window : globalThis);
