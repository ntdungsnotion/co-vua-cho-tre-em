/* ================================================================
   FILE: san_tu/st_duong_troi.js
   CHỨC NĂNG: Dữ liệu đường đua 8 "Bầu trời mây" (bé ĐEO CÁNH bay trên con đường mây; "nhảy" thành
              "vỗ cánh bay vọt lên", luật giữ nguyên). Hình vẽ ở st_ve_troi.js.
   BƯỚC: TC_00F
   NGÀY: 16/10/2026
   ================================================================ */
(function (goc) {
  "use strict";
  const ST = goc.ST;
  ST.themDuongDua("troi", {
    tenHang: "Hang mây cầu vồng",
    nhom: {
      thap: ["mayDen", "cauVong", "dieuGiay", "coiXayGio", "gioKhinhKhi", "saoRoi"],
      cao: ["thapMay", "cayDauThan"],
      dat: ["cuuMay", "heoCanh", "ngoiSaoDi", "kyLanCon", "tiaSetNho"],
      khongLo: ["nguoiKhongLoMay", "mayGiongKhongLo"],
      bay: ["chimEn", "buomCauVong", "dieuRong", "giotMua"],
      ho: "khoangTroi"
    },
    loai: {
      mayDen:      { ten: "Đám mây đen",       nhom: "can",     vaCham: "khung",   rong: [62, 78],  cao: [36, 46] },
      cauVong:     { ten: "Cầu vồng nhỏ",      nhom: "can",     vaCham: "khung",   rong: [66, 80],  cao: [38, 46] },
      dieuGiay:    { ten: "Con diều mắc kẹt",  nhom: "can",     vaCham: "khung",   rong: [46, 54],  cao: [50, 58] },
      coiXayGio:   { ten: "Cối xay gió",       nhom: "can",     vaCham: "khung",   rong: [50, 58],  cao: [52, 58] },
      gioKhinhKhi: { ten: "Giỏ khinh khí cầu", nhom: "can",     vaCham: "khung",   rong: [52, 62],  cao: [40, 50] },
      saoRoi:      { ten: "Ngôi sao rơi",      nhom: "can",     vaCham: "khung",   rong: [48, 56],  cao: [44, 52] },
      thapMay:     { ten: "Tháp mây",          nhom: "can",     vaCham: "khung",   rong: [62, 70],  cao: [178, 192], caoHonNhay: true },
      cayDauThan:  { ten: "Cây đậu thần",      nhom: "can",     vaCham: "khung",   rong: [58, 66],  cao: [180, 194], caoHonNhay: true },
      cuuMay:      { ten: "Cừu mây",           nhom: "quaiDat", vaCham: "matMang", rong: [58, 66],  cao: [42, 48], tocDoDi: 15 },
      heoCanh:     { ten: "Heo có cánh",       nhom: "quaiDat", vaCham: "matMang", rong: [56, 64],  cao: [42, 48], tocDoDi: 20 },
      ngoiSaoDi:   { ten: "Ngôi sao biết đi",  nhom: "quaiDat", vaCham: "matMang", rong: [48, 54],  cao: [50, 56], tocDoDi: 30 },
      kyLanCon:    { ten: "Kỳ lân con",        nhom: "quaiDat", vaCham: "matMang", rong: [60, 68],  cao: [50, 56], tocDoDi: 45 },
      tiaSetNho:   { ten: "Tia sét tinh nghịch", nhom: "quaiDat", vaCham: "matMang", rong: [44, 50], cao: [50, 56], tocDoDi: 50 },
      nguoiKhongLoMay: { ten: "Người khổng lồ mây", nhom: "quaiDat", vaCham: "matMang", rong: [82, 88], cao: [168, 180], tocDoDi: 16, caoHonNhay: true },
      mayGiongKhongLo: { ten: "Mây giông khổng lồ", nhom: "quaiDat", vaCham: "matMang", rong: [84, 90], cao: [170, 182], tocDoDi: 18, caoHonNhay: true },
      chimEn:      { ten: "Chim én",           nhom: "quaiBay", vaCham: "matMang", rong: [54, 60],  cao: [32, 38], bayCao: 26, tocDoDi: 60 },
      buomCauVong: { ten: "Bướm cầu vồng",     nhom: "quaiBay", vaCham: "matMang", rong: [50, 56],  cao: [40, 46], bayCao: 20, tocDoDi: 40 },
      dieuRong:    { ten: "Diều rồng",         nhom: "quaiBay", vaCham: "matMang", rong: [62, 68],  cao: [36, 42], bayCao: 28, tocDoDi: 50 },
      giotMua:     { ten: "Giọt mưa tinh nghịch", nhom: "quaiBay", vaCham: "matMang", rong: [44, 50], cao: [46, 52], bayCao: 22, tocDoDi: 35 },
      khoangTroi:  { ten: "Khoảng trời trống", nhom: "ho",      vaCham: "roi",     rong: [70, 100], cao: [0, 0] }
    }
  });
})(typeof window !== "undefined" ? window : globalThis);
