/* ================================================================
   FILE: san_tu/st_duong_khunglong.js
   CHỨC NĂNG: Dữ liệu đường đua 5 "Thung lũng khủng long" (bé CƯỠI khủng long con; luật chạy /
              nhảy giữ nguyên, chỉ đổi hình). Hình vẽ ở st_ve_khunglong.js.
   BƯỚC: TC_00F
   NGÀY: 16/10/2026
   ================================================================ */
(function (goc) {
  "use strict";
  const ST = goc.ST;
  ST.themDuongDua("khungLong", {
    tenHang: "Hang hóa thạch",
    nhom: {
      thap: ["trungKhungLong", "xuongKhungLong", "buiDuongXi", "tangDaReu", "toTrung", "khucGoCo"],
      cao: ["cotDaCao", "cayTueCao"],
      dat: ["khungLongGiap", "khungLongBaSung", "khungLongMoVit", "khungLongCon", "khungLongVuot"],
      khongLo: ["khungLongBaoChua", "khungLongCoDai"],
      bay: ["thanLanBay", "chuonChuonKhong", "chimThuyTo", "boCanhCung"],
      ho: "hoBunSoi"
    },
    loai: {
      trungKhungLong:  { ten: "Quả trứng khủng long", nhom: "can",  vaCham: "khung",   rong: [44, 50],  cao: [52, 58] },
      xuongKhungLong:  { ten: "Đống xương hóa thạch", nhom: "can",  vaCham: "khung",   rong: [70, 86],  cao: [34, 42] },
      buiDuongXi:      { ten: "Bụi dương xỉ",       nhom: "can",     vaCham: "khung",   rong: [60, 76],  cao: [42, 52] },
      tangDaReu:       { ten: "Tảng đá rêu",        nhom: "can",     vaCham: "khung",   rong: [52, 66],  cao: [38, 50] },
      toTrung:         { ten: "Tổ trứng",           nhom: "can",     vaCham: "khung",   rong: [66, 80],  cao: [32, 40] },
      khucGoCo:        { ten: "Khúc gỗ cổ",         nhom: "can",     vaCham: "khung",   rong: [76, 92],  cao: [32, 40] },
      cotDaCao:        { ten: "Cột đá cao",         nhom: "can",     vaCham: "khung",   rong: [60, 68],  cao: [178, 192], caoHonNhay: true },
      cayTueCao:       { ten: "Cây tuế cổ thụ",     nhom: "can",     vaCham: "khung",   rong: [64, 72],  cao: [180, 194], caoHonNhay: true },
      khungLongGiap:   { ten: "Khủng long giáp",    nhom: "quaiDat", vaCham: "matMang", rong: [70, 80],  cao: [38, 44], tocDoDi: 15 },
      khungLongBaSung: { ten: "Khủng long ba sừng", nhom: "quaiDat", vaCham: "matMang", rong: [68, 76],  cao: [46, 54], tocDoDi: 20 },
      khungLongMoVit:  { ten: "Khủng long mỏ vịt",  nhom: "quaiDat", vaCham: "matMang", rong: [56, 64],  cao: [52, 58], tocDoDi: 30 },
      khungLongCon:    { ten: "Khủng long con",     nhom: "quaiDat", vaCham: "matMang", rong: [50, 56],  cao: [44, 50], tocDoDi: 45 },
      khungLongVuot:   { ten: "Khủng long vuốt",    nhom: "quaiDat", vaCham: "matMang", rong: [64, 72],  cao: [44, 50], tocDoDi: 50 },
      khungLongBaoChua:{ ten: "Khủng long bạo chúa", nhom: "quaiDat", vaCham: "matMang", rong: [82, 88], cao: [168, 180], tocDoDi: 18, caoHonNhay: true },
      khungLongCoDai:  { ten: "Khủng long cổ dài",  nhom: "quaiDat", vaCham: "matMang", rong: [84, 90],  cao: [172, 184], tocDoDi: 14, caoHonNhay: true },
      thanLanBay:      { ten: "Thằn lằn bay",       nhom: "quaiBay", vaCham: "matMang", rong: [62, 68],  cao: [36, 42], bayCao: 28, tocDoDi: 55 },
      chuonChuonKhong: { ten: "Chuồn chuồn khổng lồ", nhom: "quaiBay", vaCham: "matMang", rong: [56, 62], cao: [32, 38], bayCao: 22, tocDoDi: 50 },
      chimThuyTo:      { ten: "Chim thủy tổ",       nhom: "quaiBay", vaCham: "matMang", rong: [54, 60],  cao: [38, 44], bayCao: 24, tocDoDi: 45 },
      boCanhCung:      { ten: "Bọ cánh cứng bay",   nhom: "quaiBay", vaCham: "matMang", rong: [48, 54],  cao: [36, 42], bayCao: 20, tocDoDi: 40 },
      hoBunSoi:        { ten: "Hố bùn sôi",         nhom: "ho",      vaCham: "roi",     rong: [70, 100], cao: [0, 0] }
    }
  });
})(typeof window !== "undefined" ? window : globalThis);
