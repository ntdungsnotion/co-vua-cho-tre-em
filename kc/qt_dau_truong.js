// ================================================================
// FILE: kc/qt_dau_truong.js
// CHỨC NĂNG: Mục "⚔️ Đấu Trường Tri Thức › 🎛️ Thông số" của trang quản trị (quantri_NC.html#dautruong-thongso, TC_D18A).
//   Người lớn sửa MỌI SỐ CÂN BẰNG của game mà không cần lập trình:
//   - 3 file số mặc định trong repo (dt/du_lieu/cau_hinh.json, cau_hinh_tran_dau.json, cau_hinh_trinh_do.json): trang tự
//     dựng ô nhập cho mọi số / bật-tắt / mảng; lưu CHỈ PHẦN KHÁC MẶC ĐỊNH lên Supabase (kc_dt_admin_luu_thong_so). Game
//     (dt/dt_cau_hinh.js) và máy chủ (SQL kc_dt_tron) trộn mặc định + phần sửa -> có hiệu lực ngay, không cần chạy lại SQL.
//   - 3 bảng Supabase: công trình (kc_dt_loai_cong_trinh: máu, công, thủ, giá, giới hạn...), quái rơi đồ (kc_dt_loai_quai),
//     danh mục đồ (kc_dt_vat_pham) -> kc_dt_admin_luu_bang.
//   - Lịch sử mọi lần sửa + ↩ hoàn tác (kc_dt_admin_hoan_tac).
//   Mỗi ô: tên dễ hiểu + mã khoá, số mặc định, nút ↺ về mặc định; ô khác mặc định tô vàng, ô chưa lưu tô xanh.
//   Ô tìm + "chỉ ô đã sửa". Máy tính: lưới nhiều cột + bảng như Excel; điện thoại: một cột, bảng thành thẻ.
// BƯỚC: TC_D18A - NGÀY: 10/11/2026; KC_06B2 11/11/2026 (nhãn Tụ lực lúc chờ chấm)
// PHỤ THUỘC: qt_dt_khung.js (QDT: mục này gắn vào khung, vỏ màn hình dựng ở QDT.dangKyMuc bên dưới), ../admin_NC.js, quantri_NC.js,
//   dt/dt_cau_hinh.js (KC_DT_CAU_HINH: tron, khac), qt_dau_truong.css; SQL repo_rieng SQL/supabase_tc_d18a_thong_so.sql.
// ================================================================

var QD = {
  MAN: "dautruong-thongso",
  URL: { cau_hinh: "dt/du_lieu/cau_hinh.json", cau_hinh_tran_dau: "dt/du_lieu/cau_hinh_tran_dau.json", cau_hinh_trinh_do: "dt/du_lieu/cau_hinh_trinh_do.json" },
  TEN_TEP: { cau_hinh: "Số làng / bản đồ", cau_hinh_tran_dau: "Số trận đấu", cau_hinh_trinh_do: "Độ khó câu hỏi" },
  daTai: false, coMayChu: false, dangLuu: false,
  md: {}, daLuu: {}, ht: {},        // mặc định (file repo) / đã lưu (mặc định + phần sửa trên máy chủ) / đang sửa trên trang
  bang: {}, bangSua: {},            // hàng 3 bảng; bangSua[bảng][khoá hàng] = { cột: giá trị mới }
  lichSu: [], nhom: "lang", tim: "", chiSua: false
};

// ----------------------------------------------------------------
// NHÓM + THẺ: [tệp, khoá khối] ; khối "*": mọi khoá còn lại của tệp; moiCon: mỗi khoá con một thẻ
// ----------------------------------------------------------------
QD.NHOM = [
  { ma: "lang", ten: "🌲 Làng & tài nguyên", the: [["cau_hinh", "lang"], ["cau_hinh", "xay"], ["cau_hinh", "kho"], ["cau_hinh", "danSo"], ["cau_hinh", "banDo"]] },
  { ma: "congtrinh", ten: "🏠 Công trình", the: [["cau_hinh", "congTrinh", { moiCon: true }]], bang: ["kc_dt_loai_cong_trinh"] },
  { ma: "quai", ten: "👾 Quái & đồ rơi", the: [["cau_hinh", "quaiBanDo"], ["cau_hinh_tran_dau", "quai"]], bang: ["kc_dt_loai_quai", "kc_dt_vat_pham"] },
  { ma: "tru", ten: "🏹 Trụ, phá & sửa nhà", the: [["cau_hinh", "tru"], ["cau_hinh", "muaCau"], ["cau_hinh", "sua"], ["cau_hinh", "chay"], ["cau_hinh", "thuVien"]] },
  { ma: "tran", ten: "⚔️ Trận đấu", the: [["cau_hinh_tran_dau", "*"]] },
  { ma: "trinhdo", ten: "🎓 Độ khó câu hỏi", the: [["cau_hinh_trinh_do", "*"]] },
  { ma: "khac", ten: "🧩 Số khác", the: [["cau_hinh", "*"]] },
  { ma: "lichsu", ten: "🕘 Lịch sử sửa" }
];

// Ghi chú (khoá _ghiChu* cấp đầu của tệp) hiện ở thẻ nào
QD.GHI_CHU = {
  "cau_hinh.lang": ["_ghiChu", "_ghiChuKhamPha", "_ghiChuVangMat"], "cau_hinh.xay": ["_ghiChuXay"], "cau_hinh.kho": ["_ghiChuKho"],
  "cau_hinh.danSo": ["_ghiChuDanSo"], "cau_hinh.banDo": ["_ghiChuBanDo"], "cau_hinh.congTrinh": ["_ghiChuCongTrinh", "_ghiChuRuong", "_ghiChuChoi"],
  "cau_hinh.quaiBanDo": ["_ghiChuQuaiBanDo"], "cau_hinh.tru": ["_ghiChuTru", "_ghiChuMauCongTrinh", "_ghiChuDanh"],
  "cau_hinh.muaCau": ["_ghiChuMuaCau"], "cau_hinh.sua": ["_ghiChuSua"], "cau_hinh.chay": ["_ghiChuSua"],
  "cau_hinh_tran_dau.*": ["_ghiChu", "_ghiChuSatThuong"], "cau_hinh_tran_dau.thoiGian": ["_ghiChuLuot"], "cau_hinh_tran_dau.latBaiGiay": ["_ghiChuLatBai"], "cau_hinh_tran_dau.tuLuc": ["_ghiChuTuLuc"],
  "cau_hinh_tran_dau.satThuong": ["_ghiChuSatThuong"], "cau_hinh_tran_dau.luatChan": ["_ghiChuChan"], "cau_hinh_tran_dau.thuLinh": ["_ghiChuThuLinh"],
  "cau_hinh_tran_dau.nongDan": ["_ghiChuNongDan"], "cau_hinh_tran_dau.quai": ["_ghiChuQuai"],
  "cau_hinh_trinh_do.*": ["_ghiChu", "_ghiChuThang"], "cau_hinh_trinh_do.K": ["_ghiChuK"], "cau_hinh_trinh_do.onTap": ["_ghiChuOnTap"],
  "cau_hinh_trinh_do.thuong": ["_ghiChuThuong"], "cau_hinh_trinh_do.thanhThao": ["_ghiChuThanhThao"], "cau_hinh_trinh_do.tiengAnh": ["_ghiChuTiengAnh"]
};

// Khoá của công trình mà bảng kc_dt_loai_cong_trinh giữ (máy chủ chép bảng đè lên) -> sửa ở bảng, ẩn ở thẻ
QD.CT_BANG_GIU = ["ten", "rong", "sau", "giayXay", "gia", "gioiHan", "tru", "danh"];

// Tên dễ hiểu của khoá (khoá lạ: hiện mã)
QD.NHAN = {
  // khối
  lang: "Làng & nông dân", xay: "Xây nhà", kho: "Kho chứa", danSo: "Dân số", banDo: "Bản đồ", congTrinh: "Công trình", quaiBanDo: "Quái trên bản đồ",
  tru: "Trụ & trận công trình", muaCau: "Mua câu phòng thủ", sua: "Sửa công trình", chay: "Lửa cháy", thuVien: "Thư viện câu hỏi",
  thoiGian: "Thời gian suy nghĩ", thongTha: "Thong thả (bé nhỏ)", latBaiGiay: "Lật bài (giây)", tuLuc: "Tụ lực lúc chờ chấm", toiThieuGiay: "Thời gian tụ (giây)", manhSauGiay: "Tụ mạnh sau (giây)", choMangGiay: "Báo chờ mạng sau (giây)", satThuong: "Sát thương", combo: "Combo",
  chiMang: "Chí mạng", ne: "Né", luatChan: "Luật chặn đòn", thua: "Khi thua", thuLinh: "Thủ lĩnh", nongDan: "Nông dân", quai: "Quái (trận đấu)",
  K: "Tốc độ đổi trình độ (K)", onTap: "Ôn tập", thuong: "Thưởng theo độ khó", thanhThao: "Thành thạo chủ đề", tiengAnh: "Tiếng Anh",
  // làng
  nguon: "Nguồn tài nguyên", taiNguyen: "Loại tài nguyên", sucMang: "Sức mang mỗi chuyến", khoangTuChuyenO: "Tự chuyển nguồn gần (ô)",
  banKinhChonBia: "Bán kính chọn đích (ô)", tamVoi: "Tầm với (ô)", tocDo: "Tốc độ (ô/giây)", rung: "Rừng", mocLai: "Mọc lại", vangMat: "Vắng mặt",
  khamPhaTuDo: "Tự khám phá", truLuong: "Trữ lượng", nhipLam: "Nhịp làm (đơn vị/giây)", mocLaiGio: "Mọc lại sau (giờ)", tiLeCo: "Tỉ lệ cỡ",
  soLoai: "Số loại cây", ganRungO: "Gần rừng (ô)", cachLeuO: "Cách Lều (ô)", tiLeCoMoi: "Tỉ lệ cỡ cây mới", sauGiay: "Sau (giây)",
  tinhLaiGiay: "Tính lại mỗi (giây)", heSoDuong: "Hệ số đường đi", di: "Đi", chay: "Chạy", chayKhiXaHon: "Chạy khi xa hơn (ô)",
  cay: "Cây", mo_da: "Mỏ đá", mo_vang: "Mỏ vàng", mo_sat: "Mỏ sắt", bai_ca: "Bãi cá", bui_trai_cay: "Bụi trái cây", ruong: "Ruộng",
  go: "Gỗ", da: "Đá", vang: "Vàng", sat: "Sắt", luong_thuc: "Lương thực", nho: "Nhỏ", vua: "Vừa", to: "To",
  nhan: "Nhân tộc", quy: "Quỷ tộc", tien: "Tiên tộc",
  heSoNguoi: "Hệ số người cùng xây", heSoCap: "Hệ số theo cấp [cấp 1, 2, 3]", treGiay: "Cho trễ (giây)", heSoChungLoai: "Hệ số theo chủng loại",
  tinh: "Loại tính vào dân số", tamNhin: "Tầm nhìn (ô)", themTien: "Tiên tộc nhìn thêm (ô)", banKinhCong: "Sáng sẵn quanh cổng (ô)",
  soBeToiDa: "Số bé tối đa mỗi vùng", chuKyGui: "Gửi máy chủ mỗi (giây)", thayNhaThemO: "Thấy nhà bạn thêm (ô)",
  chuKyLuuKhamPha: "Lưu khám phá mỗi (giây)", cachNhauKhamPha: "Khám phá cách nhau (ô)", nong_dan: "Nông dân", thu_linh: "Thủ lĩnh", linh: "Lính",
  leu: "Lều trại", nha: "Nhà", thap_canh: "Tháp canh", tru_ten: "Trụ tên", tuong: "Tường", cong: "Công",
  kho_go: "Kho gỗ", kho_da: "Kho đá", kho_vang: "Kho vàng", vua_luong_thuc: "Vựa lương thực", nha_o: "Nhà ở", choi_hai_luom: "Chòi hái lượm", choi_mo: "Chòi mỏ",
  // công trình
  ten: "Tên", rong: "Rộng (ô)", sau: "Sâu (ô)", giayXay: "Giây xây", nongDanDau: "Nông dân tặng khi dựng", sucChua: "Sức chứa", choO: "Chỗ ở",
  sinh: "Sinh nông dân", gia: "Giá", giay: "Giây", hangToiDa: "Hàng chờ tối đa", doanToiDa: "Đoạn tường tối đa (ô)", gioiHan: "Tối đa mỗi bé",
  danh: "Khi bị đánh", cat: "Nhận cất", chinGiay: "Lúa chín sau (giây)", sanLuong: "Sản lượng [cấp 1, 2, 3]", coSauGiay: "Thành cỏ sau (giây)",
  giaTrongLai: "Giá trồng lại", mauMoiCau: "Máu mỗi câu", thu: "Thủ", soCau: "Số câu (= số lượt)", tiLeDung: "Tỉ lệ trả lời đúng",
  dangCap: "Đẳng cấp", tam: "Tầm (ô)", capTren: "Cấp trên",
  // quái bản đồ
  soQuai: "Số quái hoang cả vùng", quanhLeu: "Quái quanh Lều", so: "Số", tu: "Từ (ô)", den: "Đến (ô)", loai: "Tỉ lệ / loại",
  lvTheoCapLang: "Lv quái theo cấp làng [[cấp làng, Lv cao nhất]]", kcSauNhat: "Xa cổng nhất (ô) = Lv cao nhất", lechLv: "Lệch Lv ±",
  khongGanCong: "Không gần cổng (ô)", khongGanLeu: "Không gần Lều (ô)", cachNhau: "Hai quái cách nhau (ô)", banKinhLangThang: "Bán kính lang thang (ô)",
  tocDoChay: "Tốc độ bỏ chạy", chayGiay: "Chạy bao lâu (giây)", chuKyGiay: "Đổi chỗ mỗi (giây)", diToiDa: "Phần đi tối đa", hoiSinhGiay: "Hồi sinh sau (giây)",
  thuLaiGiay: "Thử lại sau (giây)", lanThuSinh: "Số lần thử chỗ sinh", vaoTranCach: "Vào trận khi cách (ô)", khoaToiGiay: "Giữ quái khi tới tối đa (giây)",
  khoaDanhGiay: "Giữ quái khi đánh tối đa (giây)", giuLechO: "Cho lệch chỗ (ô)", danhCachO: "Đánh khi cách (ô)", buGiay: "Máy chủ bù mỗi (giây)",
  nghiToiDaGiay: "Nghỉ tối đa (giây)", mauKhung: "Màu khung", xanhDenLech: "Xanh đến lệch Lv", vangDenLech: "Vàng đến lệch Lv",
  capThuLinh: "Cấp Thủ lĩnh (tạm)", hung: "Quái hung dữ", tiLe: "Tỉ lệ", dungCach: "Dừng cách (ô)", duoiToiDa: "Đuổi tối đa (ô)", tocDoLao: "Tốc độ lao",
  mienGiay: "Miễn đánh lại (giây)", slime_so: "Slime Số", nam_chu_cai: "Nấm Chữ Cái", dom_dom: "Đom Đóm",
  // trụ
  hpThuLinh: "Máu Thủ lĩnh", tiLeToiDa: "Tỉ lệ đúng tối đa", giayBe: "Giây bé trả lời", giayTru: "Giây trụ nghĩ [ít, nhiều]", hongGiay: "Đống gạch mất sau (giây)",
  phamViLang: "Bảo hộ quanh Lều (ô)", boGiay: "Bỏ trận sau (giây)", nghiGiay: "Về Lều nghỉ (giây)", nhipBanGiay: "Bắn mỗi (giây)", hpNongDan: "Máu nông dân",
  chayThemO: "Nông dân chạy thêm (ô)", giuBanGiay: "Giữ phát bắn (giây)", chamO: "Chạm công trình (ô)", soCauKho: "Số câu lấy từ kho",
  congThuLinh: "Công Thủ lĩnh", congNongDan: "Công nông dân", coSan: "Câu có sẵn khi xây", giaRieng: "Giá riêng theo loại", toiDaMoiLan: "Mua tối đa mỗi lần",
  soGoiY: "Số câu gợi ý", tiLeGia: "Tỉ lệ giá sửa", tiLeGiay: "Tỉ lệ giây sửa", mon: "Môn",
  // trận
  be: "Bé", lv1: "Lv 1", lv10: "Lv 10", giamMoiLv: "Giảm mỗi Lv", toiThieu: "Tối thiểu", nhoHonBe: "Quái nghĩ so với bé", heSoBac: "Hệ số theo bậc quái",
  thuong_bac: "Thường", chuyen_mon: "Chuyên môn", tinh_anh: "Tinh anh", trum: "Trùm", denLop: "Đến lớp", heSoNghi: "Hệ số nghĩ", boSoHo: "Bỏ sơ hở",
  tuaKhiDaBamGiay: "Tua khi đã bấm (giây)", dung: "Đúng", sai: "Sai", heSoDef: "Hệ số thủ (DEF)", soHo: "Hệ số sơ hở", buoc: "Bước", toiDa: "Tối đa",
  heSo: "Hệ số", moiCombo: "Mỗi combo", khiCauKho: "Khi câu khó", goc: "Gốc", moiAgi: "Mỗi điểm AGI", mpPhongThuDung: "MP khi phòng thủ đúng",
  soLuotToiDa: "Số lượt tối đa", hp: "Máu (HP)", mp: "MP", str: "Sức mạnh (STR)", int: "Trí tuệ (INT)", agi: "Nhanh nhẹn (AGI)", def: "Thủ (DEF)",
  uyLuc: "Uy lực", chiSoDanh: "Chỉ số đánh", xacSuatDung: "Xác suất đúng", giayTraLoi: "Giây trả lời [ít, nhiều]", chiSo: "Chỉ số",
  xacSuatGioiHan: "Giới hạn xác suất [thấp, cao]", tanCong: "Khi tấn công", phongThu: "Khi phòng thủ", bac: "Bậc", xacSuat: "Xác suất",
  de: "Dễ", kho_muc: "Khó",
  // độ khó
  batDau: "Trình độ bắt đầu", lopToiDa: "Lớp tối đa", cuoiLop: "Cuối lớp", mucTieu: "Tỉ lệ đúng mục tiêu", vungVuaSuc: "Vùng vừa sức [thấp, cao]",
  doDoc: "Độ dốc", mucDoKho: "Độ khó theo mức", leoNhanh: "K leo nhanh", soCauLeoNhanh: "Số câu leo nhanh", soSaiLeoNhanh: "Số câu sai leo nhanh",
  onDinh: "K ổn định", heSoSaiKhiLeo: "Hệ số sai khi leo", tiLeOnTap: "Tỉ lệ câu ôn tập", soChuDeToiThieu: "Số chủ đề tối thiểu", duoi: "Xác suất dưới",
  soLan: "Số lần gần nhất", trongSo: "Trọng số", batDauCap: "Điểm bắt đầu theo cấp từ", mucCong: "Cộng theo mức", phienBan: "Phiên bản"
};
// Khoá trùng tên mà nghĩa khác theo chỗ (đường dẫn kết thúc bằng ...)
QD.NHAN_THEO_CHO = { "kho.kho": "Kho chứa", "mucDoKho.kho": "Khó", "xacSuat.kho": "Khó", "trongSo.kho": "Khó", "mucCong.kho": "Khó",
  "heSoBac.thuong": "Thường", "bac.thuong": "Thường", "congTrinh.cong": "Cổng", "tamNhin.cong": "Cổng", "giaRieng.cong": "Cổng" };

QD.BANG = {
  kc_dt_loai_cong_trinh: {
    ten: "🏠 Bảng công trình (mỗi hàng = loại x cấp)", khoa: ["loai", "cap"],
    ghiChu: "Máu công trình = số câu x máu mỗi câu. Mỗi câu bé đánh đúng, công trình mất max(1, công người đánh - thủ). Công = công trình đánh trúng thì người đánh mất bấy nhiêu máu. Tầm có số = trụ (tự bắn); trống = công trình thường. Cấp 2, 3 của trụ là số nâng cấp (bước sau).",
    tieuDe: function (r) { return (r.ten || r.loai) + " · cấp " + r.cap + (r.mo ? "" : " (chưa mở)"); },
    cot: [["ten", "Tên", "chu"], ["mo", "Cho bé xây", "bool"], ["rong", "Rộng (ô)", "so"], ["sau", "Sâu (ô)", "so"], ["giay_xay", "Giây xây", "so"],
      ["gia_go", "Giá 🪵", "so"], ["gia_da", "Giá 🪨", "so"], ["gia_vang", "Giá 🪙", "so"], ["gia_sat", "Giá ⛓️", "so"],
      ["gioi_han", "Tối đa mỗi bé", "soTrong"], ["mau_moi_cau", "Máu mỗi câu", "soTrong"], ["thu", "Thủ", "soTrong"], ["cong", "Công", "soTrong"],
      ["tam", "Tầm (ô)", "soTrong"], ["so_cau", "Số câu", "soTrong"], ["ti_le_dung", "Tỉ lệ đúng (0-1)", "soTrong"]]
  },
  kc_dt_loai_quai: {
    ten: "👾 Bảng quái rơi đồ", khoa: ["ma"],
    ghiChu: "Mỗi quái 7 ô đồ: mã đồ + % rơi (0-100). Ô để trống = không rơi gì. Số lượng mỗi lần rơi ở bảng danh mục đồ.",
    tieuDe: function (r) { return r.ten + " (" + r.ma + ")"; },
    cot: [["ten", "Tên", "chu"]].concat([1, 2, 3, 4, 5, 6, 7].reduce(function (a, i) {
      return a.concat([["vat_pham_" + i, "Đồ ô " + i, "do"], ["ti_le_" + i, "% rơi ô " + i, "so"]]);
    }, []))
  },
  kc_dt_vat_pham: {
    ten: "🎒 Danh mục đồ rơi", khoa: ["ma"],
    ghiChu: "Mỗi lần rơi: từ … đến … cái (quái Lv 1), mỗi Lv trên 1 cộng thêm \"thêm mỗi Lv\". Đồ nằm trên đất \"giây mất\" giây thì biến mất.",
    tieuDe: function (r) { return (r.bieu_tuong || "") + " " + r.ten + " (" + r.ma + ")"; },
    cot: [["ten", "Tên", "chu"], ["bieu_tuong", "Biểu tượng", "chu"], ["so_tu", "Số từ", "so"], ["so_den", "Số đến", "so"],
      ["them_moi_lv", "Thêm mỗi Lv", "so"], ["giay_mat", "Giây mất", "so"]]
  }
};

// ================================================================
// KHỞI ĐỘNG
// ================================================================
// TC_D18A (khung): mục này gắn vào khung QDT (qt_dt_khung.js) thay vì tự dựng; vỏ màn hình nằm ở đây, không còn trong HTML.
QDT.dangKyMuc({
  ma: "thongso", ten: "Thông số", bieuTuong: "🎛️", tieuDe: "Thông Số Đấu Trường Tri Thức",
  moTa: "Mọi số cân bằng của game. Số trong file của game chỉ là <strong>mặc định</strong>; ở đây chỉ lưu các ô bạn sửa khác mặc định. "
    + "Lưu xong là máy chủ dùng ngay, bé mở lại trang là thấy số mới (không phải chạy lại SQL). Bấm ↺ để về mặc định, "
    + "xem / hoàn tác các lần sửa ở 🕘 Lịch sử sửa. Kim cương thưởng (nếu có) nằm ở ⚙️ Cấu hình chung.",
  dung: function (than) {
    than.innerHTML = '<div class="qdChips" id="qdChips" role="tablist" aria-label="Nhóm thông số"></div>'
      + '<div class="qdThanhCongCu"><input type="search" id="qdTim" placeholder="🔍 Tìm ô (vd: máu, tốc độ, giây...)" aria-label="Tìm ô">'
      + '<label class="qdChonSua"><input type="checkbox" id="qdChiSua"> Chỉ ô đã sửa</label>'
      + '<button class="adminNut adminNutPhu" id="qdLamMoi" type="button">🔄 Tải lại</button></div>'
      + '<div class="qdChuGiai"><span class="cgSua">khác mặc định</span><span class="cgLuu">chưa lưu</span></div>'
      + '<div class="qdTrangThai" id="qdTrangThai"></div>'
      + '<div class="qdLuoi" id="qdNoiDung"><p class="adminDangTai">Đang tải...</p></div>'
      + '<div class="qdThanhLuu" id="qdThanhLuu"><strong id="qdSoChuaLuu">0 ô chưa lưu</strong>'
      + '<input type="text" id="qdGhiChuLuu" maxlength="300" placeholder="Ghi chú lần sửa (không bắt buộc)">'
      + '<button class="adminNut adminNutPhu" id="qdBo" type="button">Bỏ</button>'
      + '<button class="adminNut" id="qdLuu" type="button">💾 Lưu</button></div>';
  },
  mo: function () { qdGanSuKien(); QD.daTai = true; qdTai(); },
  soChuaLuu: function () { return qdSoChuaLuu(); }
});

function qdEl(id) { return document.getElementById(id); }
function qdLaObj(v) { return v !== null && typeof v === "object" && !Array.isArray(v); }
function qdChep(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }
function qdGiong(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
function qdLay(o, duong) { for (var i = 0; i < duong.length; i++) { if (o === null || o === undefined) return undefined; o = o[duong[i]]; } return o; }
function qdDat(o, duong, v) { for (var i = 0; i < duong.length - 1; i++) o = o[duong[i]]; o[duong[duong.length - 1]] = v; }
function qdHtml(s) { return String(s === null || s === undefined ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function qdChuSo(v) {
  if (v === undefined) return "(không có)";
  if (v === null) return "(trống)";
  if (typeof v === "boolean") return v ? "Bật" : "Tắt";
  if (Array.isArray(v) || qdLaObj(v)) return JSON.stringify(v).replace(/,/g, ", ");
  return String(v);
}

function qdNhan(duong) {
  var k = duong[duong.length - 1];
  if (typeof k === "number") return "#" + (k + 1);
  var truoc = duong.length > 1 ? duong[duong.length - 2] : "";
  return QD.NHAN_THEO_CHO[truoc + "." + k] || QD.NHAN[k] || k;
}

// ================================================================
// TẢI
// ================================================================
function qdTai() {
  qdBaoTrangThai("Đang tải số mặc định và phần đã sửa…", "");
  var md = Object.keys(QD.URL).map(function (t) {
    return fetch(QD.URL[t], { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(t + ": HTTP " + r.status); return r.json(); });
  });
  return Promise.all([Promise.all(md), adminGoiRpc("kc_dt_admin_thong_so", {})]).then(function (kq) {
    var dsMd = kq[0], may = kq[1] || {};
    QD.coMayChu = !!may.thanhCong;
    var sua = (QD.coMayChu && may.sua) || {};
    Object.keys(QD.URL).forEach(function (t, i) {
      QD.md[t] = dsMd[i];
      QD.daLuu[t] = KC_DT_CAU_HINH.tron(dsMd[i], sua[t]);
      QD.ht[t] = qdChep(QD.daLuu[t]);
    });
    QD.bang = { kc_dt_loai_cong_trinh: may.congTrinh || [], kc_dt_loai_quai: may.quai || [], kc_dt_vat_pham: may.vatPham || [] };
    QD.bangSua = { kc_dt_loai_cong_trinh: {}, kc_dt_loai_quai: {}, kc_dt_vat_pham: {} };
    QD.lichSu = may.lichSu || [];
    if (QD.coMayChu) {
      qdBaoTrangThai("", "");
    } else {
      qdBaoTrangThai("⚠️ Chưa đọc được máy chủ (" + (may.thongBao || "lỗi không rõ") + "). Trang đang hiện SỐ MẶC ĐỊNH, chưa lưu được. "
        + "Nếu chưa chạy SQL TC_D18A (repo_rieng SQL/supabase_tc_d18a_thong_so.sql) thì chạy trong Supabase rồi bấm 🔄.", "loi");
    }
    qdVe();
  }).catch(function (e) {
    qdBaoTrangThai("❌ Không tải được file số mặc định: " + e.message, "loi");
  });
}

function qdBaoTrangThai(chu, kieu) {
  var o = qdEl("qdTrangThai");
  o.textContent = chu;
  o.className = "qdTrangThai" + (chu ? " hien" : "") + (kieu ? " " + kieu : "");
}

// ================================================================
// VẼ
// ================================================================
function qdVe() {
  var chips = QD.NHOM.map(function (n) {
    return '<button type="button" class="qdChip' + (n.ma === QD.nhom ? " dangChon" : "") + '" data-nhom="' + n.ma + '">' + qdHtml(n.ten)
      + '<span class="qdSoChip" data-so-nhom="' + n.ma + '"></span></button>';
  }).join("");
  qdEl("qdChips").innerHTML = chips;
  var nhom = QD.NHOM.find(function (n) { return n.ma === QD.nhom; }) || QD.NHOM[0];
  var html = "";
  if (nhom.ma === "lichsu") {
    html = qdVeLichSu();
  } else {
    (nhom.the || []).forEach(function (t) { html += qdVeThe(t[0], t[1], t[2] || {}); });
    (nhom.bang || []).forEach(function (b) { html += qdVeBang(b); });
    if (!html) html = '<p class="adminGhiChu">Không có số nào ở nhóm này.</p>';
  }
  qdEl("qdNoiDung").innerHTML = html;
  qdLoc();
  qdCapNhatDem();
}

/** Các khoá được dùng ở thẻ riêng (để khối "*" bỏ qua) */
function qdKhoaDaDung(tep) {
  var kq = {};
  QD.NHOM.forEach(function (n) { (n.the || []).forEach(function (t) { if (t[0] === tep && t[1] !== "*") kq[t[1]] = true; }); });
  return kq;
}

function qdGhiChuThe(tep, khoa, giaTri) {
  var ds = (QD.GHI_CHU[tep + "." + khoa] || []).map(function (k) { return QD.md[tep][k]; }).filter(Boolean);
  if (qdLaObj(giaTri)) Object.keys(giaTri).forEach(function (k) { if (k.indexOf("_ghiChu") === 0) ds.push(giaTri[k]); });
  if (!ds.length) return "";
  return '<details class="qdGiaiThich"><summary>ℹ️ Giải thích</summary>' + ds.map(function (g) { return "<p>" + qdHtml(g) + "</p>"; }).join("") + "</details>";
}

function qdVeThe(tep, khoa, tuyChon) {
  var ht = QD.ht[tep];
  if (!ht) return "";
  if (khoa === "*") {
    var daDung = qdKhoaDaDung(tep), le = [], html = "";
    Object.keys(ht).forEach(function (k) {
      if (k.charAt(0) === "_" || daDung[k] || k === "phienBan") return;
      if (qdLaObj(ht[k])) html += qdTheHtml(tep, [k], qdNhan([k]), qdGhiChuThe(tep, k, ht[k]));
      else le.push(k);
    });
    if (le.length) {
      var dong = le.map(function (k) { return qdDongHtml(tep, [k]); }).join("");
      html = qdTheBoc(tep, "Chung", qdGhiChuThe(tep, "*", null), dong) + html;
    }
    return html;
  }
  if (!(khoa in ht)) return "";
  if (tuyChon.moiCon && qdLaObj(ht[khoa])) {
    var dau = '<div class="qdGhiChuNhom">' + qdGhiChuThe(tep, khoa, ht[khoa]) + "</div>";
    return dau + Object.keys(ht[khoa]).filter(function (k) { return k.charAt(0) !== "_"; }).map(function (k) {
      return qdTheHtml(tep, [khoa, k], qdNhan([khoa, k]), "");
    }).join("");
  }
  if (!qdLaObj(ht[khoa])) return qdTheBoc(tep, qdNhan([khoa]), "", qdDongHtml(tep, [khoa]));
  return qdTheHtml(tep, [khoa], qdNhan([khoa]), qdGhiChuThe(tep, khoa, ht[khoa]));
}

function qdTheBoc(tep, tieuDe, ghiChu, ruot) {
  return '<section class="qdThe" data-the><h4>' + qdHtml(tieuDe) + ' <span class="qdTep">' + qdHtml(QD.TEN_TEP[tep]) + "</span></h4>"
    + ghiChu + '<div class="qdDsO">' + ruot + "</div></section>";
}

function qdTheHtml(tep, duong, tieuDe, ghiChu) {
  var ruot = qdKhoiHtml(tep, duong, qdLay(QD.ht[tep], duong));
  // công trình có hàng trong bảng: các số bảng giữ ẩn ở đây
  if (tep === "cau_hinh" && duong[0] === "congTrinh" && duong.length === 2 && qdCoTrongBang(duong[1])) {
    ghiChu += '<p class="qdNhacBang">Tên, cỡ móng, giá, giây xây, giới hạn và số trận của nhà này sửa ở <strong>Bảng công trình</strong> cuối trang.</p>';
  }
  return qdTheBoc(tep, tieuDe, ghiChu, ruot || '<p class="adminGhiChu">Không có số riêng.</p>');
}

function qdCoTrongBang(loai) {
  return (QD.bang.kc_dt_loai_cong_trinh || []).some(function (r) { return r.loai === loai; });
}

function qdKhoiHtml(tep, duong, gt) {
  var html = "";
  var anBang = tep === "cau_hinh" && duong[0] === "congTrinh" && duong.length === 2 && qdCoTrongBang(duong[1]);
  var cacKhoa = Array.isArray(gt) ? gt.map(function (_, i) { return i; }) : Object.keys(gt);
  cacKhoa.forEach(function (k) {
    if (typeof k === "string" && k.charAt(0) === "_") return;
    if (anBang && QD.CT_BANG_GIU.indexOf(k) >= 0) return;
    var p = duong.concat([k]), v = gt[k];
    if (qdLaObj(v) || (Array.isArray(v) && v.some(qdLaObj))) {
      html += '<div class="qdCon"><div class="qdTenCon">' + qdHtml(qdNhan(p)) + ' <code>' + qdHtml(k) + "</code></div>" + qdKhoiHtml(tep, p, v) + "</div>";
    } else if (typeof (qdLay(QD.md[tep], p) === undefined ? v : qdLay(QD.md[tep], p)) !== "string") {
      html += qdDongHtml(tep, p); // chữ (tên, biểu tượng, mã) không phải thông số: không hiện
    }
  });
  return html;
}

function qdKieuO(v, k) {
  if (typeof v === "number" || v === null) return "so";
  if (typeof v === "boolean") return "bool";
  if (Array.isArray(v)) return "mang";
  if (typeof v === "string") return (k === "ten" || k === "bieuTuong") ? "chu" : "doc";
  return "doc";
}

function qdDongHtml(tep, duong) {
  var v = qdLay(QD.ht[tep], duong), md = qdLay(QD.md[tep], duong), k = duong[duong.length - 1];
  var kieu = qdKieuO(md === undefined ? v : md, k), o;
  var thuoc = ' data-tep="' + tep + '" data-duong="' + qdHtml(JSON.stringify(duong)) + '" data-kieu="' + kieu + '"';
  if (kieu === "so") o = '<input type="number" step="any" inputmode="decimal" class="qdNhap"' + thuoc + ' value="' + (v === null || v === undefined ? "" : v) + '">';
  else if (kieu === "bool") o = '<select class="qdNhap"' + thuoc + '><option value="true"' + (v ? " selected" : "") + '>Bật</option><option value="false"' + (v ? "" : " selected") + ">Tắt</option></select>";
  else if (kieu === "mang") o = '<input type="text" class="qdNhap qdMang" spellcheck="false"' + thuoc + ' value="' + qdHtml(JSON.stringify(v)) + '">';
  else if (kieu === "chu") o = '<input type="text" class="qdNhap"' + thuoc + ' value="' + qdHtml(v) + '">';
  else o = '<span class="qdChiDoc" title="Mã dùng trong code, không sửa ở đây">' + qdHtml(qdChuSo(v)) + "</span>";
  var tim = (qdNhan(duong) + " " + duong.join(" ")).toLowerCase();
  return '<div class="qdO' + qdLopO(tep, duong) + '" data-o data-tim="' + qdHtml(tim) + '">'
    + '<div class="qdTen" title="' + qdHtml(tep + ": " + duong.join(".")) + '">' + qdHtml(qdNhan(duong)) + ' <code>' + qdHtml(k) + "</code></div>"
    + '<div class="qdO_nhap">' + o + "</div>"
    + '<div class="qdMd">mặc định <b>' + qdHtml(qdChuSo(md)) + "</b>"
    + (kieu === "doc" ? "" : ' <button type="button" class="qdVe" data-ve title="Về số mặc định">↺</button>') + "</div></div>";
}

function qdLopO(tep, duong) {
  var v = qdLay(QD.ht[tep], duong);
  return (qdGiong(v, qdLay(QD.md[tep], duong)) ? "" : " daSua") + (qdGiong(v, qdLay(QD.daLuu[tep], duong)) ? "" : " chuaLuu");
}

// ----- bảng Supabase -----
function qdKhoaHang(bang, r) { return QD.BANG[bang].khoa.map(function (k) { return r[k]; }).join("|"); }

function qdVeBang(bang) {
  var def = QD.BANG[bang], hang = QD.bang[bang] || [];
  var dau = '<section class="qdThe qdTheBang" data-the><h4>' + qdHtml(def.ten) + ' <span class="qdTep">Supabase</span></h4>'
    + '<p class="adminGhiChu">' + qdHtml(def.ghiChu) + "</p>";
  if (!QD.coMayChu) return dau + '<p class="adminGhiChu">Chưa đọc được máy chủ nên chưa hiện bảng.</p></section>';
  if (!hang.length) return dau + '<p class="adminGhiChu">Bảng chưa có hàng nào.</p></section>';
  var dsDo = (QD.bang.kc_dt_vat_pham || []).map(function (v) { return v.ma; });
  var th = "<th>" + (bang === "kc_dt_loai_cong_trinh" ? "Công trình" : "Mã") + "</th>" + def.cot.map(function (c) { return "<th>" + qdHtml(c[1]) + "</th>"; }).join("");
  var tr = hang.map(function (r) {
    var kh = qdKhoaHang(bang, r), sua = QD.bangSua[bang][kh] || {};
    var tim = (def.tieuDe(r) + " " + kh).toLowerCase();
    var td = def.cot.map(function (c) {
      var ten = c[0], v = (ten in sua) ? sua[ten] : r[ten], thuoc = ' data-bang="' + bang + '" data-khoa="' + qdHtml(kh) + '" data-cot="' + ten + '" data-kieu="' + c[2] + '"';
      var o;
      if (c[2] === "bool") o = '<select class="qdNhapBang"' + thuoc + '><option value="true"' + (v ? " selected" : "") + '>Có</option><option value="false"' + (v ? "" : " selected") + ">Không</option></select>";
      else if (c[2] === "do") o = '<select class="qdNhapBang"' + thuoc + '><option value="">—</option>' + dsDo.map(function (m) {
        return '<option value="' + qdHtml(m) + '"' + (m === v ? " selected" : "") + ">" + qdHtml(m) + "</option>"; }).join("") + "</select>";
      else if (c[2] === "chu") o = '<input type="text" class="qdNhapBang"' + thuoc + ' value="' + qdHtml(v) + '">';
      else o = '<input type="number" step="any" inputmode="decimal" class="qdNhapBang"' + thuoc + ' value="' + (v === null || v === undefined ? "" : v) + '"' + (c[2] === "soTrong" ? ' placeholder="trống"' : "") + ">";
      return '<td data-nhan="' + qdHtml(c[1]) + '" class="' + ((ten in sua) ? "chuaLuu" : "") + '">' + o + "</td>";
    }).join("");
    return '<tr data-o data-tim="' + qdHtml(tim) + '" class="' + (Object.keys(sua).length ? "chuaLuu" : "") + '"><th class="qdTenHang">' + qdHtml(def.tieuDe(r)) + "</th>" + td + "</tr>";
  }).join("");
  return dau + '<div class="qdCuonBang"><table class="qdBang"><thead><tr>' + th + "</tr></thead><tbody>" + tr + "</tbody></table></div></section>";
}

// ----- lịch sử -----
function qdPhang(o, tien, kq) {
  kq = kq || {};
  if (qdLaObj(o)) Object.keys(o).forEach(function (k) { if (k.charAt(0) !== "_") qdPhang(o[k], tien ? tien + "." + k : k, kq); });
  else kq[tien] = o;
  return kq;
}

function qdKhacNhau(a, b) {
  var pa = qdPhang(a, ""), pb = qdPhang(b, ""), ds = [];
  Object.keys(Object.assign({}, pa, pb)).forEach(function (k) {
    if (!qdGiong(pa[k], pb[k])) ds.push({ k: k, cu: pa[k], moi: pb[k] });
  });
  return ds;
}

function qdVeLichSu() {
  if (!QD.coMayChu) return '<p class="adminGhiChu">Chưa đọc được máy chủ nên chưa có lịch sử.</p>';
  if (!QD.lichSu.length) return '<p class="adminGhiChu">Chưa có lần sửa nào.</p>';
  return '<section class="qdThe qdTheBang"><h4>🕘 60 lần sửa gần nhất</h4><p class="adminGhiChu">↩ Hoàn tác = trả lại số trước lần sửa đó (ghi thành một lần sửa mới, hoàn tác tiếp được).</p>'
    + '<ul class="qdLichSu">' + QD.lichSu.map(function (l) {
      var ds, tieuDe;
      if (l.loai === "tep") {
        tieuDe = QD.TEN_TEP[l.ten] || l.ten;
        var md = QD.md[l.ten] || {};
        ds = qdKhacNhau(KC_DT_CAU_HINH.tron(md, l.cu), KC_DT_CAU_HINH.tron(md, l.moi));
      } else if (l.loai === "tai_khoan") {
        tieuDe = "👤 Tài khoản › " + l.ten;
        ds = qdKhacNhau(l.cu || {}, l.moi || {});
      } else {
        tieuDe = (QD.BANG[l.ten] ? QD.BANG[l.ten].ten : l.ten) + " › " + (l.moi && QD.BANG[l.ten] ? QD.BANG[l.ten].tieuDe(l.moi) : JSON.stringify(l.khoa));
        ds = qdKhacNhau(l.cu || {}, l.moi || {});
      }
      var dong = ds.slice(0, 8).map(function (d) { return "<li><code>" + qdHtml(d.k) + "</code>: " + qdHtml(qdChuSo(d.cu)) + " → <b>" + qdHtml(qdChuSo(d.moi)) + "</b></li>"; }).join("")
        + (ds.length > 8 ? "<li>… và " + (ds.length - 8) + " ô khác</li>" : "") + (ds.length ? "" : "<li>(về như cũ)</li>");
      return '<li class="qdMucLs"><div class="qdDauLs"><span>#' + l.id + " · " + qdHtml(typeof adminDinhDangGio === "function" ? adminDinhDangGio(l.luc) : l.luc)
        + " · " + qdHtml(l.boi || "") + "</span><strong>" + qdHtml(tieuDe) + "</strong>"
        + '<button type="button" class="adminNut adminNutPhu" data-hoan-tac="' + l.id + '">↩ Hoàn tác</button></div>'
        + (l.ghi_chu ? '<div class="qdGhiChuLs">“' + qdHtml(l.ghi_chu) + "”</div>" : "") + "<ul>" + dong + "</ul></li>";
    }).join("") + "</ul></section>";
}

// ================================================================
// SỬA, LỌC, ĐẾM
// ================================================================
function qdGanSuKien() {
  var man = qdEl("manhinh-" + QD.MAN);
  man.addEventListener("click", function (su) {
    var t = su.target;
    var chip = t.closest("[data-nhom]");
    if (chip) { QD.nhom = chip.getAttribute("data-nhom"); qdVe(); return; }
    if (t.closest("[data-ve]")) { qdVeMacDinh(t.closest("[data-o]")); return; }
    var ht = t.closest("[data-hoan-tac]");
    if (ht) { qdHoanTac(Number(ht.getAttribute("data-hoan-tac"))); return; }
  });
  man.addEventListener("change", function (su) {
    if (su.target.classList.contains("qdNhap")) qdNhan_O(su.target);
    if (su.target.classList.contains("qdNhapBang")) qdNhan_Bang(su.target);
  });
  man.addEventListener("input", function (su) {
    if (su.target.classList.contains("qdNhap") && su.target.tagName === "INPUT") qdNhan_O(su.target, true);
  });
  qdEl("qdTim").addEventListener("input", function () { QD.tim = this.value.trim().toLowerCase(); qdLoc(); });
  qdEl("qdChiSua").addEventListener("change", function () { QD.chiSua = this.checked; qdLoc(); });
  qdEl("qdLamMoi").addEventListener("click", function () {
    if (qdSoChuaLuu() > 0 && !confirm("Bỏ " + qdSoChuaLuu() + " ô chưa lưu và tải lại?")) return;
    qdTai();
  });
  qdEl("qdLuu").addEventListener("click", qdLuu);
  qdEl("qdBo").addEventListener("click", function () {
    if (!confirm("Bỏ mọi ô chưa lưu?")) return;
    Object.keys(QD.ht).forEach(function (t) { QD.ht[t] = qdChep(QD.daLuu[t]); });
    Object.keys(QD.bangSua).forEach(function (b) { QD.bangSua[b] = {}; });
    qdVe();
  });
}

/** Đọc ô nhập -> giá trị; undefined = chưa hợp lệ */
function qdDocO(el) {
  var kieu = el.getAttribute("data-kieu"), s = el.value;
  if (kieu === "bool") return s === "true";
  if (kieu === "chu") return s;
  if (kieu === "mang") { try { var v = JSON.parse(s); return Array.isArray(v) ? v : undefined; } catch (e) { return undefined; } }
  if (kieu === "so" || kieu === "soTrong") {
    if (s.trim() === "") return kieu === "soTrong" ? null : undefined;
    var n = Number(s);
    return isFinite(n) ? n : undefined;
  }
  if (kieu === "do") return s === "" ? null : s;
  return s;
}

function qdNhan_O(el, dangGo) {
  var tep = el.getAttribute("data-tep"), duong = JSON.parse(el.getAttribute("data-duong"));
  var v = qdDocO(el), dong = el.closest("[data-o]");
  if (v === undefined) {
    // ô số đang gõ dở ("", "-") hoặc mảng chưa đúng dạng: báo, chưa ghi
    dong.classList.add("loi");
    return;
  }
  dong.classList.remove("loi");
  if (v === null && qdLay(QD.md[tep], duong) !== null) { dong.classList.add("loi"); return; }
  qdDat(QD.ht[tep], duong, v);
  dong.className = "qdO" + qdLopO(tep, duong);
  qdCapNhatDem();
  if (!dangGo) qdLoc();
}

function qdNhan_Bang(el) {
  var bang = el.getAttribute("data-bang"), kh = el.getAttribute("data-khoa"), cot = el.getAttribute("data-cot");
  var v = qdDocO(el), td = el.closest("td"), tr = el.closest("tr");
  var goc = (QD.bang[bang] || []).find(function (r) { return qdKhoaHang(bang, r) === kh; });
  if (v === undefined) { td.classList.add("loi"); return; }
  td.classList.remove("loi");
  var sua = QD.bangSua[bang][kh] || (QD.bangSua[bang][kh] = {});
  if (goc && qdGiong(goc[cot], v)) delete sua[cot]; else sua[cot] = v;
  if (!Object.keys(sua).length) delete QD.bangSua[bang][kh];
  td.classList.toggle("chuaLuu", cot in sua);
  tr.classList.toggle("chuaLuu", !!QD.bangSua[bang][kh]);
  qdCapNhatDem();
}

function qdVeMacDinh(dong) {
  var el = dong.querySelector(".qdNhap");
  var tep = el.getAttribute("data-tep"), duong = JSON.parse(el.getAttribute("data-duong"));
  var md = qdChep(qdLay(QD.md[tep], duong));
  qdDat(QD.ht[tep], duong, md);
  var kieu = el.getAttribute("data-kieu");
  if (kieu === "bool") el.value = md ? "true" : "false";
  else if (kieu === "mang") el.value = JSON.stringify(md);
  else el.value = md === null ? "" : md;
  dong.className = "qdO" + qdLopO(tep, duong);
  qdCapNhatDem();
}

function qdLoc() {
  var tim = QD.tim, chiSua = QD.chiSua;
  var cacThe = qdEl("qdNoiDung").querySelectorAll("[data-the]");
  for (var i = 0; i < cacThe.length; i++) {
    var dsO = cacThe[i].querySelectorAll("[data-o]"), hien = 0;
    for (var j = 0; j < dsO.length; j++) {
      var o = dsO[j];
      var ok = (!tim || o.getAttribute("data-tim").indexOf(tim) >= 0)
        && (!chiSua || o.classList.contains("daSua") || o.classList.contains("chuaLuu"));
      o.style.display = ok ? "" : "none";
      if (ok) hien++;
    }
    var cacCon = cacThe[i].querySelectorAll(".qdCon");
    for (var c = cacCon.length - 1; c >= 0; c--) {
      var coO = Array.prototype.some.call(cacCon[c].querySelectorAll("[data-o]"), function (x) { return x.style.display !== "none"; });
      cacCon[c].style.display = coO ? "" : "none";
    }
    cacThe[i].style.display = (hien || (!tim && !chiSua && !dsO.length)) ? "" : "none";
  }
}

function qdSoChuaLuuTep(t) {
  if (!QD.ht[t]) return 0;
  return qdKhacNhau(QD.daLuu[t], QD.ht[t]).length;
}

function qdSoChuaLuu() {
  var so = 0;
  Object.keys(QD.ht).forEach(function (t) { so += qdSoChuaLuuTep(t); });
  Object.keys(QD.bangSua).forEach(function (b) { Object.keys(QD.bangSua[b]).forEach(function (k) { so += Object.keys(QD.bangSua[b][k]).length; }); });
  return so;
}

function qdCapNhatDem() {
  var so = qdSoChuaLuu();
  var thanh = qdEl("qdThanhLuu");
  thanh.classList.toggle("hien", so > 0);
  qdEl("qdSoChuaLuu").textContent = so + " ô chưa lưu";
  qdEl("qdLuu").disabled = QD.dangLuu || !QD.coMayChu;
  // số ô khác mặc định theo nhóm (chip)
  QD.NHOM.forEach(function (n) {
    var o = document.querySelector('[data-so-nhom="' + n.ma + '"]');
    if (!o) return;
    var dem = 0;
    (n.the || []).forEach(function (t) {
      var tep = t[0];
      if (!QD.ht[tep]) return;
      if (t[1] === "*") {
        var daDung = qdKhoaDaDung(tep);
        Object.keys(QD.ht[tep]).forEach(function (k) { if (k.charAt(0) !== "_" && !daDung[k] && k !== "phienBan") dem += qdKhacNhau(QD.md[tep][k], QD.ht[tep][k]).length; });
      } else {
        dem += qdKhacNhau(QD.md[tep][t[1]], QD.ht[tep][t[1]]).length;
      }
    });
    (n.bang || []).forEach(function (b) { dem += Object.keys(QD.bangSua[b] || {}).length; });
    o.textContent = dem ? String(dem) : "";
  });
}

// ================================================================
// LƯU, HOÀN TÁC
// ================================================================
function qdLuu() {
  if (QD.dangLuu || !QD.coMayChu) return;
  var loi = qdEl("qdNoiDung").querySelector(".loi");
  if (loi) { adminBaoTin("❌ Còn ô chưa đúng dạng (tô đỏ). Sửa lại rồi lưu.", false); return; }
  var ghiChu = qdEl("qdGhiChuLuu").value.trim() || null;
  var viec = [];
  Object.keys(QD.ht).forEach(function (t) {
    if (!qdSoChuaLuuTep(t)) return;
    var sua = KC_DT_CAU_HINH.khac(QD.md[t], QD.ht[t]) || {};
    var giu = qdChep(QD.ht[t]);
    viec.push({ ten: QD.TEN_TEP[t], giu: function () { QD.ht[t] = giu; }, goi: function () { return adminGoiRpc("kc_dt_admin_luu_thong_so", { p_ten: t, p_sua: sua, p_ghi_chu: ghiChu }); } });
  });
  Object.keys(QD.bangSua).forEach(function (b) {
    var ds = Object.keys(QD.bangSua[b]).map(function (kh) {
      var goc = QD.bang[b].find(function (r) { return qdKhoaHang(b, r) === kh; }), khoa = {};
      QD.BANG[b].khoa.forEach(function (k) { khoa[k] = goc[k]; });
      return { khoa: khoa, moi: QD.bangSua[b][kh] };
    });
    var giuB = qdChep(QD.bangSua[b]);
    if (ds.length) viec.push({ ten: QD.BANG[b].ten, giu: function () { QD.bangSua[b] = giuB; }, goi: function () { return adminGoiRpc("kc_dt_admin_luu_bang", { p_bang: b, p_ds: ds, p_ghi_chu: ghiChu }); } });
  });
  if (!viec.length) return;
  QD.dangLuu = true; qdCapNhatDem();
  qdEl("qdLuu").textContent = "Đang lưu…";
  var loiDs = [], hong = [];
  viec.reduce(function (p, v) {
    return p.then(function () { return v.goi().then(function (kq) {
      if (!kq || !kq.thanhCong) { loiDs.push(v.ten + ": " + ((kq && kq.thongBao) || "lỗi")); hong.push(v); }
    }); });
  }, Promise.resolve()).then(function () {
    QD.dangLuu = false;
    qdEl("qdLuu").textContent = "💾 Lưu";
    if (!loiDs.length) qdEl("qdGhiChuLuu").value = "";
    return qdTai();
  }).then(function () {
    // phần lưu hỏng: giữ lại các ô chưa lưu để sửa tiếp (phần lưu được đã nạp lại từ máy chủ)
    if (hong.length) { hong.forEach(function (v) { v.giu(); }); qdVe(); adminBaoTin("❌ " + loiDs.join(" · "), false); }
    else adminBaoTin("✅ Đã lưu. Game dùng số mới từ lần bé mở trang kế tiếp.", true);
  });
}

function qdHoanTac(id) {
  if (qdSoChuaLuu() > 0) { adminBaoTin("❌ Đang có ô chưa lưu: lưu hoặc bỏ trước khi hoàn tác.", false); return; }
  if (!confirm("Hoàn tác lần sửa #" + id + "?")) return;
  adminGoiRpc("kc_dt_admin_hoan_tac", { p_id: id }).then(function (kq) {
    if (kq && kq.thanhCong) adminBaoTin("✅ Đã hoàn tác lần sửa #" + id + ".", true);
    else adminBaoTin("❌ " + ((kq && kq.thongBao) || "Không hoàn tác được"), false);
    qdTai();
  });
}
