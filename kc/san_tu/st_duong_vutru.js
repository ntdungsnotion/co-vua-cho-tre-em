/* ================================================================
   FILE: san_tu/st_duong_vutru.js
   CHỨC NĂNG: Dữ liệu đường đua 10 "Vũ trụ" (bé cưỡi TÀU TÊN LỬA nhỏ, đội mũ phi hành gia; luật
              chạy / nhảy giữ nguyên, chỉ đổi hình). Hình vẽ ở st_ve_vutru.js.
   BƯỚC: TC_00F
   NGÀY: 16/10/2026
   ================================================================ */
(function (goc) {
  "use strict";
  const ST = goc.ST;
  ST.themDuongDua("vuTru", {
    tenHang: "Hang pha lê sao băng",
    nhom: {
      thap: ["daThienThach", "chaoAngTen", "roBotNgu", "hopCungCap", "tinhTheSao", "xeTuHanh"],
      cao: ["tenLuaCao", "cotAngTen"],
      dat: ["senVuTru", "roBotNho", "ngoaiHanhTinh", "choRobot", "thoMatTrang"],
      khongLo: ["roBotKhongLo", "ngoaiHanhTinhKhongLo"],
      bay: ["diaBay", "saoChoi", "veTinh", "suaVuTru"],
      ho: "hoThienThach"
    },
    loai: {
      daThienThach:{ ten: "Đá thiên thạch",    nhom: "can",     vaCham: "khung",   rong: [52, 66],  cao: [38, 50] },
      chaoAngTen:  { ten: "Chảo ăng-ten",      nhom: "can",     vaCham: "khung",   rong: [50, 60],  cao: [48, 56] },
      roBotNgu:    { ten: "Rô-bốt ngủ quên",   nhom: "can",     vaCham: "khung",   rong: [46, 54],  cao: [50, 58] },
      hopCungCap:  { ten: "Thùng hàng vũ trụ", nhom: "can",     vaCham: "khung",   rong: [52, 60],  cao: [44, 52] },
      tinhTheSao:  { ten: "Tinh thể sao",      nhom: "can",     vaCham: "khung",   rong: [46, 56],  cao: [50, 58] },
      xeTuHanh:    { ten: "Xe tự hành",        nhom: "can",     vaCham: "khung",   rong: [72, 86],  cao: [38, 46] },
      tenLuaCao:   { ten: "Tên lửa trên bệ",   nhom: "can",     vaCham: "khung",   rong: [60, 68],  cao: [180, 194], caoHonNhay: true },
      cotAngTen:   { ten: "Cột ăng-ten cao",   nhom: "can",     vaCham: "khung",   rong: [58, 66],  cao: [178, 192], caoHonNhay: true },
      senVuTru:    { ten: "Sên vũ trụ",        nhom: "quaiDat", vaCham: "matMang", rong: [62, 70],  cao: [36, 42], tocDoDi: 15 },
      roBotNho:    { ten: "Rô-bốt tí hon",     nhom: "quaiDat", vaCham: "matMang", rong: [46, 52],  cao: [50, 56], tocDoDi: 20 },
      ngoaiHanhTinh: { ten: "Người ngoài hành tinh", nhom: "quaiDat", vaCham: "matMang", rong: [46, 52], cao: [52, 58], tocDoDi: 30 },
      choRobot:    { ten: "Chó rô-bốt",        nhom: "quaiDat", vaCham: "matMang", rong: [62, 70],  cao: [42, 48], tocDoDi: 45 },
      thoMatTrang: { ten: "Thỏ mặt trăng",     nhom: "quaiDat", vaCham: "matMang", rong: [48, 54],  cao: [48, 54], tocDoDi: 50 },
      roBotKhongLo:{ ten: "Rô-bốt khổng lồ",   nhom: "quaiDat", vaCham: "matMang", rong: [82, 88],  cao: [168, 180], tocDoDi: 16, caoHonNhay: true },
      ngoaiHanhTinhKhongLo: { ten: "Quái vật ba mắt", nhom: "quaiDat", vaCham: "matMang", rong: [84, 90], cao: [170, 182], tocDoDi: 18, caoHonNhay: true },
      diaBay:      { ten: "Đĩa bay",           nhom: "quaiBay", vaCham: "matMang", rong: [62, 68],  cao: [34, 40], bayCao: 28, tocDoDi: 55 },
      saoChoi:     { ten: "Sao chổi",          nhom: "quaiBay", vaCham: "matMang", rong: [56, 62],  cao: [36, 42], bayCao: 24, tocDoDi: 60 },
      veTinh:      { ten: "Vệ tinh",           nhom: "quaiBay", vaCham: "matMang", rong: [64, 70],  cao: [34, 40], bayCao: 26, tocDoDi: 45 },
      suaVuTru:    { ten: "Sứa vũ trụ",        nhom: "quaiBay", vaCham: "matMang", rong: [46, 52],  cao: [44, 50], bayCao: 20, tocDoDi: 35 },
      hoThienThach:{ ten: "Miệng hố thiên thạch", nhom: "ho",   vaCham: "roi",     rong: [70, 100], cao: [0, 0] }
    }
  });
})(typeof window !== "undefined" ? window : globalThis);
