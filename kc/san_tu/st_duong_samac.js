/* ================================================================
   FILE: san_tu/st_duong_samac.js
   CHỨC NĂNG: Dữ liệu đường đua 3 "Sa mạc kim tự tháp" (game Giải Cứu Mèo Con): các loại quái /
              vật cản theo chủ đề sa mạc, xếp theo nhóm để ST.themDuongDua tự dựng kho 7 màn
              (mở dần như Rừng xanh) và bài Tập chơi. Hình vẽ ở st_ve_samac.js.
   BƯỚC: TC_00F
   NGÀY: 16/10/2026
   ================================================================ */
(function (goc) {
  "use strict";
  const ST = goc.ST;
  ST.themDuongDua("saMac", {
    tenHang: "Hầm báu kim tự tháp",
    nhom: {
      thap: ["daCat", "binhGom", "cotDo", "xuongRong", "ruongCo", "dunCat"],
      cao: ["tuongNhanSu", "thapDa"],
      dat: ["boHung", "ruaSaMac", "boCap", "thanLan", "xacUop"],
      khongLo: ["xacUopKhongLo", "xuongRongKhongLo"],
      bay: ["kenKen", "chauChau", "doiTaiTo", "thamBay"],
      ho: "hoCatLun"
    },
    loai: {
      daCat:      { ten: "Tảng đá cát",      nhom: "can",     vaCham: "khung",   rong: [48, 68],  cao: [34, 50] },
      binhGom:    { ten: "Bình gốm",         nhom: "can",     vaCham: "khung",   rong: [46, 54],  cao: [48, 58] },
      cotDo:      { ten: "Cột đá đổ",        nhom: "can",     vaCham: "khung",   rong: [78, 92],  cao: [32, 40] },
      xuongRong:  { ten: "Cây xương rồng",   nhom: "can",     vaCham: "khung",   rong: [48, 58],  cao: [50, 58] },
      ruongCo:    { ten: "Rương cổ",         nhom: "can",     vaCham: "khung",   rong: [54, 62],  cao: [44, 52] },
      dunCat:     { ten: "Đụn cát",          nhom: "can",     vaCham: "khung",   rong: [70, 86],  cao: [34, 44] },
      tuongNhanSu:{ ten: "Tượng nhân sư",    nhom: "can",     vaCham: "khung",   rong: [62, 68],  cao: [176, 190], caoHonNhay: true },
      thapDa:     { ten: "Cột tháp đá",      nhom: "can",     vaCham: "khung",   rong: [56, 62],  cao: [180, 194], caoHonNhay: true },
      boHung:     { ten: "Bọ hung lăn bi",   nhom: "quaiDat", vaCham: "matMang", rong: [56, 64],  cao: [44, 52], tocDoDi: 20 },
      ruaSaMac:   { ten: "Rùa sa mạc",       nhom: "quaiDat", vaCham: "matMang", rong: [60, 66],  cao: [40, 46], tocDoDi: 15 },
      boCap:      { ten: "Bọ cạp",           nhom: "quaiDat", vaCham: "matMang", rong: [62, 70],  cao: [40, 46], tocDoDi: 30 },
      thanLan:    { ten: "Thằn lằn",         nhom: "quaiDat", vaCham: "matMang", rong: [70, 80],  cao: [28, 34], tocDoDi: 50 },
      xacUop:     { ten: "Xác ướp tí hon",   nhom: "quaiDat", vaCham: "matMang", rong: [46, 52],  cao: [52, 58], tocDoDi: 30 },
      xacUopKhongLo:   { ten: "Xác ướp khổng lồ",     nhom: "quaiDat", vaCham: "matMang", rong: [78, 86], cao: [168, 180], tocDoDi: 18, caoHonNhay: true },
      xuongRongKhongLo:{ ten: "Xương rồng khổng lồ",  nhom: "quaiDat", vaCham: "matMang", rong: [80, 88], cao: [170, 182], tocDoDi: 16, caoHonNhay: true },
      kenKen:     { ten: "Kền kền",          nhom: "quaiBay", vaCham: "matMang", rong: [60, 66],  cao: [38, 44], bayCao: 26, tocDoDi: 55 },
      chauChau:   { ten: "Châu chấu",        nhom: "quaiBay", vaCham: "matMang", rong: [50, 56],  cao: [34, 40], bayCao: 20, tocDoDi: 50 },
      doiTaiTo:   { ten: "Dơi tai to",       nhom: "quaiBay", vaCham: "matMang", rong: [56, 62],  cao: [36, 42], bayCao: 30, tocDoDi: 60 },
      thamBay:    { ten: "Thảm bay",         nhom: "quaiBay", vaCham: "matMang", rong: [62, 68],  cao: [30, 36], bayCao: 24, tocDoDi: 45 },
      hoCatLun:   { ten: "Hố cát lún",       nhom: "ho",      vaCham: "roi",     rong: [70, 100], cao: [0, 0] }
    }
  });
})(typeof window !== "undefined" ? window : globalThis);
