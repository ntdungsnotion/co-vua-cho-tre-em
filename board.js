// ================================
// FILE: board.js
// CHỨC NĂNG: Bàn cờ vua thực tế, AI 20 cấp độ (đọc thông số từ Supabase),
//            khóa chọn cấp theo Level tài khoản, hiệu ứng thắng/thua và mở khóa,
//            phản hồi từng nước đi: GIỌNG NÓI ĐA THIẾT BỊ + bóng thoại chữ,
//            tô sáng nước vừa đi, thẻ thông tin trận đấu, lời khen theo Level,
//            NÚT GỢI Ý (Stockfish) + ÁP DỤNG TRANG BỊ (bộ quân/bàn cờ/hiệu ứng)
// BƯỚC: NC_03 (nâng cấp từ NC_02) - FILE NÀY CHỐT SỔ TẠI NC_03 (nguyên tắc gom
// SỬA 11/07/2026 - NC_06B (SỬA LỖI - đúng ngoại lệ mở file đóng băng): thẻ trận
//   đấu vẽ avatar cao cấp (URL) bằng <img> thay vì in URL thành chữ (mục 4.6).
//        việc theo file - xem HƯỚNG DẪN mục 7). Sau bước này chỉ mở lại board.js
//        khi SỬA LỖI, không thêm tính năng mới ở đây nữa.
// QUY ƯỚC TÊN HÀM/BIẾN: tất cả bắt đầu bằng "board" để tránh xung đột
// PHỤ THUỘC:
//   - chess.js 0.12.0 (nạp trong index.html, biến toàn cục "Chess")
//   - stockfish 10.0.2 nạp từ CDN vào Web Worker (có dự phòng đi ngẫu nhiên nếu lỗi)
//   - app.js: appLayTaiKhoanDangNhap(), appCapNhatTaiKhoanSauVanCo({levelMoi, diemMoi})
//   - api.js: apiCapNhatDiem(tenDangNhap, ketQua, levelMay), apiLayCauHinh(),
//             apiTruDiemGoiY(tenDangNhap) (mới NC_03)
//   - index.html: #banCo, #khuVucBanCoVaThe, #theDoiThu, #theBanThan, #chonLevelMay,
//                 #btnGoiY, #ghiChuGoiY (mới NC_03)...
// Thứ tự nạp trong index.html: config -> api -> app -> auth -> board -> rank
//
// ĐIỂM MỚI CỦA NC_01:
//   1) Gọi apiLayCauHinh() 1 lần lúc khởi động: lấy thông số 20 cấp máy từ bảng
//      cau_hinh_cap_do (tyLeNgauNhien, skillLevel, doSau). Sửa số trong Supabase
//      Table Editor là máy đổi cách chơi ngay, KHÔNG cần sửa code.
//   2) Mỗi lượt máy: tung xác suất tyLeNgauNhien -> trúng thì đánh 1 nước hợp lệ
//      NGẪU NHIÊN (cấp thấp hay "đi hớ", trẻ dễ thắng); không trúng thì hỏi
//      Stockfish với "setoption name Skill Level" + "go depth <doSau>".
//   3) Khóa chọn cấp: chỉ mở các cấp <= Level tài khoản; cấp cao hơn bị khóa (🔒).
//
// ĐIỂM MỚI CỦA NC_02:
//   4) Âm thanh (đã chỉnh theo góp ý): KHÔNG thuyết minh nước đi (ô đã tô sáng là đủ).
//      Trợ lý 🦉 chỉ nói: lời khen theo Level, câu sự kiện (bắt đầu/thắng/thua/hòa/
//      lên cấp), và hỏi "Con có cần gợi ý không?" khi trẻ lâu không đi
//      (khóa "giay_cho_hoi_goi_y", mặc định 30, 0 = tắt; chỉ hỏi khi level <= "hoi_goi_y_toi_level").
//   5) GIỌNG NÓI - cơ chế nhiều tầng, KHÔNG BAO GIỜ đọc tiếng Anh lơ lớ:
//        Tầng 1: Giọng tiếng Việt cài sẵn trên máy (Android, Edge, Windows có gói Việt).
//        Tầng 2: Giọng mạng tiếng Việt (3 nguồn dự phòng, cần Internet).
//        Tầng 3 (chỉ khi 2 tầng trên THẤT BẠI): phát FILE MP3 theo ĐƯỜNG DẪN lưu
//                trong Supabase - mỗi câu là 1 file trọn vẹn (không ghép), lấy từ
//                cột duong_dan_am_thanh của bảng loi_dong_vien (mọi câu nói của
//                trợ lý - khen, sự kiện, hỏi gợi ý - đều nằm trong bảng này).
//        Tầng 4: Không còn cách nào đọc tiếng Việt -> IM LẶNG và nút loa MỜ ĐI.
//      Có thanh cài đặt: bật/tắt tiếng, chọn kiểu giọng, chọn giọng cụ thể, nghe thử.
//      Lựa chọn được nhớ trong localStorage của máy đó.
//   6) Tô sáng ô xuất phát + ô đích của nước vừa đi gần nhất (lớp phủ vàng nhạt).
//   7) Thẻ thông tin trận đấu (#theDoiThu / #theBanThan): avatar, tên, level;
//      bên đang tới lượt được phát sáng + cờ hiệu phất phới (class "dangDenLuot").
//   8) Lời khen theo Level TÀI KHOẢN, câu chữ lấy từ bảng loi_dong_vien:
//        Lv 1..khen_moi_nuoc_toi_level (mặc định 5): khen MỌI nước.
//        Đến khen_nuoc_tot_toi_level (mặc định 9): chỉ khen NƯỚC TỐT
//          (ăn quân / chiếu tướng / nhập thành / phong cấp).
//        Từ Lv sau đó trở lên: TẮT khen (chỉ đọc mô tả nước đi).
//
// ĐIỂM MỚI CỦA NC_03:
//   9) NÚT "💡 Gợi Ý": hỏi Stockfish nước TỐT NHẤT ở thế cờ hiện tại, CHỈ NHẤP
//      NHÁY ô đi + ô đến (không tự đi thay trẻ). Chi phí/giới hạn đọc từ
//      cau_hinh_cap_do nhưng theo LEVEL TÀI KHOẢN (khác với AI đối thủ dùng
//      LEVEL MÁY): 2 cột mới goiYGioiHan/goiYChiPhi. Giới hạn lượt/ván board.js
//      tự đếm (boardSoLanDaGoiYVan); trừ kim cương do MÁY CHỦ quyết định qua RPC
//      tru_diem_goi_y (api.js: apiTruDiemGoiY) - không bao giờ âm, không trừ EXP.
//  10) (ĐÃ BỎ ở NC_03B) Hộp thoại xác nhận #hopThoaiHoiGoiY. Nay khi trẻ lâu không
//      đi, trợ lý CHỈ hỏi bằng GIỌNG NÓI và nút "💡 Gợi Ý" NHẤP NHÁY để mời bấm.
//      Không còn bong bóng che màn hình.
//  11) ÁP DỤNG TRANG BỊ khi vẽ bàn cờ: đọc trangBi (jsonb) của tài khoản đang
//      đăng nhập, ưu tiên HƠN quà tặng theo Level (Lv5 màu bàn cờ, Lv10 quân động
//      vật) vì đây là vật phẩm CHỦ ĐỘNG mua/đổi:
//        trangBi.bo_quan_co = { k,q,r,b,n,p: "emoji hoặc URL ảnh" } (HƯỚNG DẪN 4.6:
//          giá trị bắt đầu bằng "http" hoặc chứa "/" -> vẽ <img>, ngược lại vẽ emoji).
//        trangBi.ban_co = { mauSang, mauToi } (mã màu CSS).
//        trangBi.hieu_ung = { bieuTuong: [emoji,...] } (đổi bộ hạt pháo hoa mừng thắng).
//      Chưa có Cửa Hàng (NC_06B) nên kiểm thử bằng cách gán cột trang_bi tay trong
//      Supabase SQL Editor (xem ví dụ trong phần code bên dưới).
//
// ĐIỂM MỚI CỦA NC_03B (bản sửa lỗi trải nghiệm - 4 việc):
//  A) NÓI XONG MỚI CHO MÁY ĐI. Trước đây lời khen và nước đi của máy chạy song
//     song: máy đi sau ~0,6 giây trong khi câu khen còn dở, câu nói mới (lời an ủi
//     "con bị ăn quân") gọi speechSynthesis.cancel() rồi speak() ngay lập tức -
//     Chrome có lỗi nổi tiếng là NUỐT LUÔN câu mới trong tình huống này => trẻ
//     không nghe được lời an ủi. Nay boardNoiThongBao() nhận thêm tham số
//     khiNoiXong: chỉ khi câu nói kết thúc thật sự (onend / onended / hết file /
//     im lặng) mới gọi boardTiepTucChoMayDi() để máy bắt đầu suy nghĩ.
//     LƯỚI AN TOÀN: dù giọng nói treo, sau tối đa 15 giây máy vẫn đi (không kẹt ván).
//     Ngay khi trẻ vừa đi xong, bàn cờ bị KHÓA (boardDangChoAI = true) nên trẻ
//     không thể bấm trong lúc trợ lý đang khen.
//  B) LỜI AN ỦI khi bị ăn quân / bị chiếu: sửa xong (A) là hết bị nuốt. Ngoài ra
//     thêm câu mặc định viết trong code phòng khi bảng loi_dong_vien thiếu dòng
//     'bi_an_quan' / 'bi_chieu', và chỉ nói SAU khi đã kiểm tra ván chưa kết thúc
//     (tránh câu an ủi bị câu "thắng/thua/hòa" đè lên).
//  C) BÉ ĐI TIẾP KHI LỜI AN ỦI CHƯA XONG -> boardXuLyBamO() gọi boardDungNoiNgay()
//     ngay lúc bé CHẠM vào bàn cờ để chọn quân: tiếng tắt tức thì, không chồng câu.
//  D) MÁY ĐI CHẬM LẠI CHO GIỐNG NGƯỜI THẬT. Trước đây thời gian nghĩ chỉ dùng để
//     chỉnh độ khó nên cấp thấp đi gần như tức thì. Nay mỗi lượt máy có một
//     "thời gian nghĩ tối thiểu": tìm ra nước rồi vẫn giữ lại cho đủ thời gian ấy
//     mới đi. Công thức (đọc từ cau_hinh_chung, sửa trong Supabase không cần sửa code):
//       may_nghi_toi_thieu_ms  (mặc định 1200) : nền, áp dụng cho mọi cấp
//       may_nghi_moi_cap_ms    (mặc định 60)   : cộng thêm cho mỗi cấp máy
//       may_nghi_ngau_nhien_ms (mặc định 700)  : cộng ngẫu nhiên 0..N cho tự nhiên
//       may_nghi_toi_da_ms     (mặc định 4000) : trần, trẻ không phải chờ quá lâu
//     => Cấp 1 ~ 1,2-1,9 giây; Cấp 20 ~ 2,3-3,0 giây. Áp dụng cho CẢ nước "đi hớ"
//     ngẫu nhiên lẫn nước do Stockfish tính, nên máy không bao giờ đi tức thì nữa.
// ================================

// ----- Biến trạng thái ván cờ -----
var boardGame = null;            // Đối tượng Chess() đang chơi
var boardODangChon = null;       // Ô người chơi vừa bấm để chọn quân (ví dụ "e2")
var boardCacNuocHopLe = [];      // Danh sách ô đích hợp lệ của quân đang chọn
var boardKetThuc = true;         // true = chưa có ván nào hoặc ván đã xong -> không cho bấm
var boardDangChoAI = false;      // true = đang chờ máy tính đi, chặn người chơi bấm
var boardLevelMay = 1;           // Cấp độ máy (đối thủ) của ván hiện tại
var boardTimeoutAI = null;       // Bộ đếm giờ dự phòng nếu engine không trả lời

// ----- Biến điều phối "nói xong mới cho máy đi" (NC_03B - việc A) -----
var boardDaGoiMayDiLuotNay = false; // Chống gọi máy đi 2 lần trong cùng 1 lượt
var boardTimeoutChoNoiXong = null;  // Lưới an toàn: giọng treo thì máy vẫn đi

// ----- Biến "thời gian nghĩ tối thiểu" của máy (NC_03B - việc D) -----
var boardMocBatDauNghiAI = 0;       // Date.now() lúc máy bắt đầu suy nghĩ lượt này
var boardThoiGianNghiToiThieu = 0;  // Số mili giây tối thiểu máy phải "nghĩ" lượt này

// ----- Biến liên quan bộ não AI (Stockfish) -----
var boardEngine = null;          // Web Worker chứa engine Stockfish
var boardEngineSanSang = false;  // true nếu engine tải xong và sẵn sàng nhận lệnh

// ----- Biến cấu hình lấy từ Supabase (NC_01) -----
var boardCauHinhChung = {};      // Đối tượng khóa-giá trị từ bảng cau_hinh_chung
var boardCauHinhCapDo = [];      // Mảng 20 dòng thông số cấp máy
var boardLoiDongVien = [];       // Danh sách lời khen { loai, noiDung }
var boardLevelDaVeSelect = -1;   // Level đã dùng để vẽ danh sách cấp (biết khi nào vẽ lại)

// ----- Biến phục vụ phản hồi từng nước đi (NC_02) -----
var boardONguonNuocCuoi = null;  // Ô xuất phát của nước vừa đi gần nhất (tô sáng)
var boardODichNuocCuoi = null;   // Ô đích của nước vừa đi gần nhất (tô sáng)
var boardHenGioGoiY = null;      // Hẹn giờ hỏi "Con có cần gợi ý không?" khi trẻ lâu không đi

// ----- Biến phục vụ NÚT GỢI Ý (NC_03) -----
var boardSoLanDaGoiYVan = 0;     // Số lần đã dùng Gợi Ý trong ván hiện tại (đếm ở trình duyệt)
var boardONguonGoiY = null;      // Ô xuất phát của nước Gợi Ý đang nhấp nháy
var boardODichGoiY = null;       // Ô đích của nước Gợi Ý đang nhấp nháy
var boardDangChoGoiY = false;    // true = đang chờ Stockfish trả lời cho YÊU CẦU GỢI Ý
                                  // (khác boardDangChoAI - chờ nước đi CỦA MÁY ĐỐI THỦ)
var boardTimeoutGoiY = null;     // Bộ đếm giờ dự phòng nếu engine không trả lời gợi ý
var BOARD_DO_SAU_GOI_Y = 12;     // Độ sâu cố định khi tính Gợi Ý (không phụ thuộc cấp máy đối thủ)
var boardMaPhienNhapNhayGoiY = 0;// Số phiên nhấp nháy: gợi ý mới tăng số này để hẹn giờ
                                  // tự tắt của gợi ý CŨ không xóa nhầm nhấp nháy MỚI

// ----- Biến của hệ thống giọng nói (NC_02) -----
var BOARD_KHOA_BAT_TIENG = "coVua_giongBat";     // localStorage: "1" | "0"
var BOARD_KHOA_KIEU_GIONG = "coVua_giongKieu";   // "tu_dong" | "may" | "mang"
var BOARD_KHOA_TEN_GIONG = "coVua_giongTen";     // tên giọng máy đã chọn

var boardCoWebSpeech = (typeof window !== "undefined" && "speechSynthesis" in window);
var boardDanhSachGiong = [];     // Danh sách giọng đọc có trên máy này
var boardGiongDaChon = null;     // Đối tượng giọng đang dùng (SpeechSynthesisVoice)
var boardAmThanhMang = null;     // Thẻ <audio> dùng lại cho giọng mạng (tránh bị chặn)
var boardGiongMangHong = false;  // true nếu CẢ 3 nguồn giọng mạng đều lỗi
var boardNguonMangDangDung = 0;  // Nguồn giọng mạng đang thử (0, 1, 2)

/**
 * Ba nguồn giọng mạng tiếng Việt, thử lần lượt từ trên xuống.
 * Đều là dịch vụ công khai, không cần đăng ký, không cần khóa API.
 * Nguồn nào chạy được thì ghi nhớ và dùng tiếp cho các câu sau.
 */
var BOARD_NGUON_GIONG_MANG = [
  {
    ten: "StreamElements",
    taoUrl: function (chu) {
      return "https://api.streamelements.com/kappa/v2/speech?voice=vi-VN-Wavenet-A&text=" + encodeURIComponent(chu);
    }
  },
  {
    ten: "Google (googleapis)",
    taoUrl: function (chu) {
      return "https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=vi&q=" + encodeURIComponent(chu);
    }
  },
  {
    ten: "Google (translate)",
    taoUrl: function (chu) {
      return "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=vi&q=" + encodeURIComponent(chu);
    }
  }
];
var boardDaMoKhoaAmThanh = false;// true sau cú chạm/click đầu tiên (iOS/Android bắt buộc)
var boardWatchdogNoi = null;     // Vá lỗi Chrome tự ngắt giọng đọc giữa chừng

// ----- Điều phối "câu nói đã đọc xong chưa" (NC_03B - việc A, B, C) -----
// Mỗi câu nói mang 1 "mã phiên". Câu mới hoặc lệnh dừng đều tăng mã này lên, nhờ
// đó mọi sự kiện onend/onerror đến muộn của câu CŨ đều bị bỏ qua, không gọi nhầm
// callback (ví dụ không cho máy đi 2 lần).
var boardMaPhienNoi = 0;         // Mã phiên của câu nói đang phát
var boardCallbackNoi = null;     // Hàm cần chạy khi câu nói HIỆN TẠI đọc xong
var boardTimeoutNoiXong = null;  // Lưới an toàn: trình duyệt không báo onend thì tự coi là xong

// ----- Biến của tầng FILE ÂM THANH (đường dẫn lưu trong Supabase) -----
var boardAmThanhTep = null;      // Thẻ <audio> riêng để phát file MP3 theo đường dẫn
var boardMaPhienTep = 0;         // Số phiên phát: câu mới sẽ hủy file đang phát dở

// ----- Người chơi luôn cầm quân Trắng (đi trước), máy tính cầm quân Đen -----
var BOARD_MAU_NGUOI = "w";
var BOARD_MAU_MAY = "b";

// ----- Bộ ký tự quân cờ mặc định (ký tự cờ vua Unicode) -----
var BOARD_QUAN_MAC_DINH = { k: "\u265A", q: "\u265B", r: "\u265C", b: "\u265D", n: "\u265E", p: "\u265F" };
// ----- Bộ quân cờ hình động vật (mở khóa ở Level 10) -----
var BOARD_QUAN_DONG_VAT = { k: "\uD83E\uDD81", q: "\uD83E\uDD84", r: "\uD83D\uDC18", b: "\uD83E\uDD8A", n: "\uD83D\uDC0E", p: "\uD83D\uDC24" };
// ----- Tên quân cờ tiếng Việt (dùng để đọc thành lời) -----
var BOARD_TEN_QUAN_TIENG_VIET = { k: "Vua", q: "Hậu", r: "Xe", b: "Tượng", n: "Mã", p: "Tốt" };

/**
 * Hàm khởi tạo module bàn cờ, chạy khi trang tải xong
 */
function boardKhoiTao() {
  boardTiemCssHieuUng();
  boardTiemMetaReferrer();      // NC_02: giúp các nguồn giọng mạng không chặn localhost
  boardTaoThanhCaiDatGiong();   // NC_02: thanh bật/tắt tiếng + chọn giọng
  boardChuanBiGiongNoi();       // NC_02: quét giọng có trên máy
  boardDienLuaChonCapDoMay();

  var nutBatDau = document.getElementById("btnBatDauVan");
  if (nutBatDau) {
    nutBatDau.addEventListener("click", boardBatDauVanMoi);
  }

  // NC_03: nút "Gợi Ý". NC_03B: đã bỏ hộp thoại xác nhận, không còn 2 nút Đồng Ý/Thôi.
  var nutGoiY = document.getElementById("btnGoiY");
  if (nutGoiY) nutGoiY.addEventListener("click", boardYeuCauGoiY);

  // Trình duyệt di động chỉ cho phát tiếng sau khi người dùng chạm màn hình lần đầu.
  // Ta "mở khóa" âm thanh ngay ở cú chạm/click đầu tiên bất kỳ.
  document.addEventListener("click", boardMoKhoaAmThanh, { once: true });
  document.addEventListener("touchend", boardMoKhoaAmThanh, { once: true });

  // Tạo sẵn bộ não AI ngay từ đầu để lúc chơi khỏi phải chờ tải
  boardTaoEngine();

  // Lấy cấu hình 20 cấp máy + lời khen từ Supabase (NC_01)
  boardTaiCauHinh();

  // Vẽ sẵn 1 bàn cờ trạng thái ban đầu cho dễ nhìn (chưa tính điểm)
  boardGame = new Chess();
  boardKetThuc = true;
  boardVeBanCo();
  boardCapNhatThongTinLuot("Bấm \"Bắt Đầu Ván Mới\" để chơi", "Chưa bắt đầu");
  boardCapNhatTheThongTinTranDau();

  // Level có thể thay đổi sau khi đăng nhập / lên cấp -> vẽ lại danh sách cấp khi cần
  setInterval(boardDienLuaChonCapDoMay, 1500);
}

// ================================
// PHẦN 0: TẢI CẤU HÌNH TỪ SUPABASE (NC_01)
// ================================

/**
 * Hàm gọi apiLayCauHinh() đúng 1 lần lúc mở trang.
 * Lỗi mạng thì dùng thông số dự phòng tính bằng công thức, ván cờ vẫn chơi được.
 */
function boardTaiCauHinh() {
  if (typeof apiLayCauHinh !== "function") return;

  apiLayCauHinh().then(function (phanHoi) {
    if (phanHoi && phanHoi.thanhCong) {
      boardCauHinhChung = phanHoi.cauHinhChung || {};
      boardCauHinhCapDo = phanHoi.cauHinhCapDo || [];
      boardLoiDongVien = phanHoi.loiDongVien || [];
    }
  });
}

/**
 * Hàm đọc 1 khóa số trong cau_hinh_chung (giá trị lưu dạng chữ), có giá trị dự phòng
 */
function boardLayCauHinhChungSo(khoa, giaTriDuPhong) {
  var giaTri = parseInt(boardCauHinhChung[khoa], 10);
  if (isNaN(giaTri)) return giaTriDuPhong;
  return giaTri;
}

/**
 * Hàm lấy thông số của 1 cấp (1..20) trong bảng cau_hinh_cap_do.
 * Bảng này phục vụ 2 mục đích khác nhau tùy nơi gọi:
 *   - Độ khó AI ĐỐI THỦ (tyLeNgauNhien, skillLevel, doSau): gọi với LEVEL MÁY
 *     (boardLevelMay) đang chơi ván này.
 *   - Chi phí/giới hạn GỢI Ý (goiYGioiHan, goiYChiPhi - NC_03): gọi với LEVEL
 *     TÀI KHOẢN (boardLayLevelNguoiChoi()), KHÔNG liên quan cấp máy đang đấu.
 * Nếu chưa tải được cấu hình từ Supabase thì tính tạm bằng công thức tương đương
 * (đúng theo HƯỚNG DẪN 4.9: Lv1-4 gợi ý miễn phí không giới hạn, Lv5 không giới
 * hạn nhưng trừ 1, Lv6-20 giới hạn giảm dần 15->1 kèm chi phí tăng dần 2->16).
 */
function boardLayCauHinhCap(capDo) {
  for (var i = 0; i < boardCauHinhCapDo.length; i++) {
    if (parseInt(boardCauHinhCapDo[i].capDo, 10) === capDo) {
      return {
        tyLeNgauNhien: parseInt(boardCauHinhCapDo[i].tyLeNgauNhien, 10) || 0,
        skillLevel: parseInt(boardCauHinhCapDo[i].skillLevel, 10) || 0,
        doSau: parseInt(boardCauHinhCapDo[i].doSau, 10) || 1,
        goiYGioiHan: parseInt(boardCauHinhCapDo[i].goiYGioiHan, 10) || 0,
        goiYChiPhi: parseInt(boardCauHinhCapDo[i].goiYChiPhi, 10) || 0
      };
    }
  }

  // Dự phòng: cấp 1 gần như đi ngẫu nhiên hoàn toàn, cấp 20 chơi hết sức
  var tyLe = Math.round(100 - (capDo - 1) * (95 / 19));
  if (tyLe < 0) tyLe = 0;
  if (tyLe > 100) tyLe = 100;
  var skill = Math.round((capDo - 1) * 20 / 19);
  var doSau = Math.round(1 + (capDo - 1) * (17 / 19));

  // Dự phòng riêng cho Gợi Ý (0 = không giới hạn / miễn phí, cùng quy ước với
  // "giay_cho_hoi_goi_y" ở nơi khác trong file này)
  var gioiHanGoiY = 0;
  var chiPhiGoiY = 0;
  if (capDo === 5) {
    chiPhiGoiY = 1;
  } else if (capDo >= 6) {
    gioiHanGoiY = 15 - (capDo - 6);
    if (gioiHanGoiY < 1) gioiHanGoiY = 1;
    chiPhiGoiY = 2 + (capDo - 6);
  }

  return {
    tyLeNgauNhien: tyLe, skillLevel: skill, doSau: doSau,
    goiYGioiHan: gioiHanGoiY, goiYChiPhi: chiPhiGoiY
  };
}

// ================================
// PHẦN 1: KHỞI TẠO VÀ ĐIỀU KHIỂN BỘ NÃO AI (STOCKFISH)
// ================================

/**
 * Hàm tạo engine Stockfish bằng cách nạp file asm.js từ CDN vào trong 1 Web Worker.
 * Mẹo: trình duyệt không cho tạo Worker trực tiếp từ URL khác miền, nhưng bên trong
 * Worker lại được phép dùng importScripts() để nạp file khác miền -> ta bọc lại bằng Blob.
 * Nếu tạo thất bại thì boardEngineSanSang = false và AI tự chuyển sang đánh ngẫu nhiên.
 */
function boardTaoEngine() {
  try {
    var urlStockfish = "https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js";
    var maWorker = "importScripts('" + urlStockfish + "');";
    var blob = new Blob([maWorker], { type: "application/javascript" });
    var urlBlob = URL.createObjectURL(blob);

    boardEngine = new Worker(urlBlob);
    boardEngine.onmessage = boardXuLyPhanHoiEngine;
    boardEngine.onerror = function () {
      boardEngineSanSang = false;
    };

    boardEngine.postMessage("uci");
    boardEngine.postMessage("isready");
    boardEngineSanSang = true;
  } catch (loi) {
    boardEngineSanSang = false;
  }
}

/**
 * Hàm nhận mỗi tin nhắn từ engine Stockfish (chuỗi văn bản UCI).
 * Ta chỉ quan tâm dòng bắt đầu bằng "bestmove".
 * NC_03: engine dùng CHUNG cho cả nước đi của máy đối thủ VÀ tính toán Gợi Ý (2
 * việc không bao giờ xảy ra cùng lúc vì Gợi Ý chỉ bấm được ở lượt trẻ, còn máy đối
 * thủ chỉ nghĩ ở lượt của nó) - dùng cờ boardDangChoGoiY để biết trả lời này thuộc
 * yêu cầu nào rồi định tuyến đúng hàm xử lý.
 */
function boardXuLyPhanHoiEngine(suKien) {
  var duLieu = suKien.data;
  if (typeof duLieu !== "string") return;

  if (duLieu.indexOf("bestmove") === 0) {
    var cacPhan = duLieu.split(" ");
    if (boardDangChoGoiY) {
      boardApDungGoiY(cacPhan[1]);
    } else {
      // NC_03B (việc D): engine trả lời rất nhanh ở cấp thấp. Không đi ngay mà giữ
      // lại cho đủ "thời gian nghĩ tối thiểu" của lượt này, cho giống người thật.
      boardHenGioApDungNuocMay(cacPhan[1]);
    }
  }
}

/**
 * Hàm tính "thời gian nghĩ tối thiểu" (mili giây) của máy cho 1 lượt (NC_03B - việc D).
 * Toàn bộ 4 con số đọc từ bảng cau_hinh_chung trên Supabase, sửa trong Table Editor
 * là máy đổi nhịp đi ngay, KHÔNG cần sửa code:
 *   may_nghi_toi_thieu_ms  (1200) - nền cho mọi cấp
 *   may_nghi_moi_cap_ms    (60)   - cộng thêm mỗi cấp máy (cấp cao "nghĩ" lâu hơn)
 *   may_nghi_ngau_nhien_ms (700)  - cộng ngẫu nhiên 0..N để nhịp đi không đều tăm tắp
 *   may_nghi_toi_da_ms     (4000) - trần, trẻ em không phải chờ quá lâu
 */
function boardTinhThoiGianNghiToiThieu(capDo) {
  var nen = boardLayCauHinhChungSo("may_nghi_toi_thieu_ms", 1200);
  var themMoiCap = boardLayCauHinhChungSo("may_nghi_moi_cap_ms", 60);
  var ngauNhien = boardLayCauHinhChungSo("may_nghi_ngau_nhien_ms", 700);
  var toiDa = boardLayCauHinhChungSo("may_nghi_toi_da_ms", 4000);

  var ms = nen + (capDo - 1) * themMoiCap + Math.random() * ngauNhien;
  if (ms > toiDa) ms = toiDa;
  if (ms < 0) ms = 0;
  return Math.round(ms);
}

/**
 * Hàm nhận nước đi engine vừa tìm ra và HOÃN lại cho đủ thời gian nghĩ tối thiểu
 * rồi mới thật sự đi (NC_03B - việc D).
 * Dùng lại chính boardTimeoutAI làm đồng hồ hoãn: hủy bộ đếm dự phòng cũ (vốn để
 * phòng engine im lặng) và thay bằng bộ đếm đi nước này - không bao giờ có 2 bộ
 * đếm cùng chạy nên máy không thể đi 2 lần.
 */
function boardHenGioApDungNuocMay(nuocUci) {
  if (!boardDangChoAI || boardKetThuc || !boardGame) return;

  if (boardTimeoutAI) {
    clearTimeout(boardTimeoutAI);
    boardTimeoutAI = null;
  }

  var conLai = boardThoiGianNghiToiThieu - (Date.now() - boardMocBatDauNghiAI);
  if (conLai <= 0) {
    boardApDungNuocAiAnToan(nuocUci);
    return;
  }

  boardTimeoutAI = setTimeout(function () {
    boardApDungNuocAiAnToan(nuocUci);
  }, conLai);
}

/**
 * Hàm báo cho engine biết bắt đầu ván mới (xóa bộ nhớ ván cũ)
 */
function boardCauHinhDoKho(capDoMay) {
  if (!boardEngineSanSang || !boardEngine) return;
  var cfg = boardLayCauHinhCap(capDoMay);
  boardEngine.postMessage("ucinewgame");
  boardEngine.postMessage("setoption name Skill Level value " + cfg.skillLevel);
  boardEngine.postMessage("isready");
}

/**
 * Hàm tính trần thời gian suy nghĩ (mili giây) theo độ sâu tìm kiếm.
 * Cấp cao tìm sâu hơn nhưng trẻ em không phải chờ quá lâu.
 */
function boardTranThoiGianSuyNghi(doSau) {
  var ms = 400 + doSau * 200; // độ sâu 1 ~ 600ms, độ sâu 18 ~ 4000ms
  if (ms > 4000) ms = 4000;
  return ms;
}

// ================================
// PHẦN 2: BẮT ĐẦU VÁN, VẼ BÀN CỜ, XỬ LÝ NƯỚC ĐI CỦA NGƯỜI CHƠI
// ================================

/**
 * Hàm bắt đầu 1 ván cờ mới khi người chơi bấm nút "Bắt Đầu Ván Mới"
 * NC_01: chặn tuyệt đối việc chơi cấp máy cao hơn Level tài khoản
 */
function boardBatDauVanMoi() {
  var oChonLevel = document.getElementById("chonLevelMay");
  boardLevelMay = oChonLevel ? parseInt(oChonLevel.value, 10) : 1;
  if (!boardLevelMay || boardLevelMay < 1) boardLevelMay = 1;

  // Lớp bảo vệ thứ 2, phòng khi thẻ select bị can thiệp
  var levelNguoiChoi = boardLayLevelNguoiChoi();
  if (boardLevelMay > levelNguoiChoi) {
    boardLevelMay = levelNguoiChoi;
    if (oChonLevel) oChonLevel.value = boardLevelMay;
  }

  boardGame = new Chess();      // Ván cờ mới tinh
  boardODangChon = null;
  boardCacNuocHopLe = [];
  boardKetThuc = false;
  boardDangChoAI = false;
  boardONguonNuocCuoi = null;   // NC_02: ván mới -> chưa có nước nào để tô sáng
  boardODichNuocCuoi = null;

  // NC_03B: ván mới -> dừng mọi lời nói dở dang và mọi đồng hồ chờ nói/chờ máy đi
  boardDungNoiNgay();
  boardDaGoiMayDiLuotNay = false;
  if (boardTimeoutChoNoiXong) {
    clearTimeout(boardTimeoutChoNoiXong);
    boardTimeoutChoNoiXong = null;
  }
  if (boardTimeoutAI) {
    clearTimeout(boardTimeoutAI);
    boardTimeoutAI = null;
  }

  // NC_03: ván mới -> đặt lại toàn bộ trạng thái Gợi Ý
  boardSoLanDaGoiYVan = 0;
  boardXoaNhapNhayGoiY();
  boardDangChoGoiY = false;
  if (boardTimeoutGoiY) {
    clearTimeout(boardTimeoutGoiY);
    boardTimeoutGoiY = null;
  }
  boardTatNhapNhayNutGoiY();

  // Ẩn khung kết quả của ván trước (nếu đang hiện)
  var khungKetQua = document.getElementById("thongBaoKetQuaVan");
  if (khungKetQua) {
    khungKetQua.style.display = "none";
    khungKetQua.classList.remove("thang", "thua");
  }
  var khungMoc = document.getElementById("hieuUngDatMocMoi");
  if (khungMoc) khungMoc.style.display = "none";

  boardCauHinhDoKho(boardLevelMay);

  boardVeBanCo();
  boardCapNhatThongTinLuot("Đến lượt bạn (Quân Trắng)", "Đang chơi - Máy cấp " + boardLevelMay);
  boardCapNhatTheThongTinTranDau();
  boardNoiCauSuKien("bat_dau_van", "Bắt đầu ván mới. Đến lượt bạn.");
  boardBatDauChoGoiY(); // Lượt đầu tiên của trẻ -> bắt đầu hẹn giờ nhắc gợi ý
}

/**
 * Hàm vẽ toàn bộ bàn cờ 8x8 vào khung #banCo dựa theo trạng thái boardGame hiện tại
 * Tự động áp dụng phần thưởng mở khóa: màu bàn cờ mới (Lv5), quân động vật (Lv10)
 * NC_02: phủ màu vàng nhạt lên ô xuất phát và ô đích của nước vừa đi gần nhất
 */
function boardVeBanCo() {
  var khungBanCo = document.getElementById("banCo");
  if (!khungBanCo || !boardGame) return;

  var level = boardLayLevelNguoiChoi();
  var dungMauMoi = level >= 5;       // Mốc Level 5: màu bàn cờ mới
  var dungQuanDongVat = level >= 10; // Mốc Level 10: bộ quân cờ hình động vật

  // NC_03: ÁP DỤNG TRANG BỊ - vật phẩm tài khoản đã mua/đổi ƯU TIÊN HƠN quà Level,
  // vì đây là lựa chọn CHỦ ĐỘNG của trẻ. Cấu trúc trangBi xem chú thích đầu file.
  var taiKhoan = (typeof appLayTaiKhoanDangNhap === "function") ? appLayTaiKhoanDangNhap() : null;
  var trangBi = (taiKhoan && taiKhoan.trangBi) || {};
  var banCoTrangBi = trangBi.ban_co || null;
  var boQuanTrangBi = trangBi.bo_quan_co || null;

  var mauSang = (banCoTrangBi && banCoTrangBi.mauSang) ? banCoTrangBi.mauSang : (dungMauMoi ? "#e8f4ff" : "#f0d9b5");
  var mauToi = (banCoTrangBi && banCoTrangBi.mauToi) ? banCoTrangBi.mauToi : (dungMauMoi ? "#5b8def" : "#b58863");

  khungBanCo.innerHTML = "";
  khungBanCo.style.display = "grid";
  khungBanCo.style.gridTemplateColumns = "repeat(8, 1fr)";
  khungBanCo.style.gridTemplateRows = "repeat(8, 1fr)";
  khungBanCo.style.overflow = "hidden";
  khungBanCo.style.userSelect = "none";

  var cacCot = ["a", "b", "c", "d", "e", "f", "g", "h"];
  var luoiQuan = boardGame.board(); // Mảng 2 chiều từ hàng 8 xuống hàng 1

  for (var hang = 0; hang < 8; hang++) {
    for (var cot = 0; cot < 8; cot++) {
      var tenO = cacCot[cot] + (8 - hang); // Ví dụ "e4"
      var oVuong = document.createElement("div");
      oVuong.setAttribute("data-o", tenO);

      var laOSang = (hang + cot) % 2 === 0;
      oVuong.style.backgroundColor = laOSang ? mauSang : mauToi;
      oVuong.style.display = "flex";
      oVuong.style.alignItems = "center";
      oVuong.style.justifyContent = "center";
      oVuong.style.cursor = boardKetThuc ? "default" : "pointer";
      oVuong.style.position = "relative";
      oVuong.style.fontSize = "clamp(22px, 7vw, 44px)";
      oVuong.style.lineHeight = "1";

      // NC_02: lớp phủ vàng nhạt cho ô xuất phát / ô đích của nước vừa đi
      if (tenO === boardONguonNuocCuoi || tenO === boardODichNuocCuoi) {
        var lopPhu = document.createElement("div");
        lopPhu.style.position = "absolute";
        lopPhu.style.left = "0";
        lopPhu.style.top = "0";
        lopPhu.style.width = "100%";
        lopPhu.style.height = "100%";
        lopPhu.style.pointerEvents = "none";
        lopPhu.style.background = "rgba(255, 213, 79, 0.45)";
        if (tenO === boardODichNuocCuoi) {
          // Ô đích nổi bật hơn: thêm viền vàng
          lopPhu.style.boxShadow = "inset 0 0 0 3px rgba(255, 183, 3, 0.85)";
        }
        oVuong.appendChild(lopPhu);
      }

      // NC_03: nhấp nháy ô đi + ô đến của nước Gợi Ý (viền xanh lá, xem style.css)
      if (tenO === boardONguonGoiY || tenO === boardODichGoiY) {
        oVuong.classList.add("oGoiYNhapNhay");
      }

      // Tô sáng ô đang được chọn
      if (tenO === boardODangChon) {
        oVuong.style.boxShadow = "inset 0 0 0 4px rgba(255, 183, 3, 0.9)";
      }

      // Vẽ quân cờ nếu ô này có quân
      var quan = luoiQuan[hang][cot];
      if (quan) {
        var oQuan = boardTaoPhanTuQuan(quan, dungQuanDongVat, boQuanTrangBi);
        oVuong.appendChild(oQuan);

        // Tô đỏ ô có Vua đang bị chiếu để trẻ em dễ nhận biết
        if (quan.type === "k" && boardGame.in_check() && quan.color === boardGame.turn()) {
          oVuong.style.boxShadow = "inset 0 0 0 4px rgba(231, 76, 60, 0.9)";
        }
      }

      // Vẽ chấm tròn đánh dấu ô có thể đi tới (khi đang chọn 1 quân)
      if (boardCacNuocHopLe.indexOf(tenO) !== -1) {
        var cham = document.createElement("div");
        cham.style.position = "absolute";
        cham.style.width = quan ? "80%" : "34%";
        cham.style.height = quan ? "80%" : "34%";
        cham.style.borderRadius = "50%";
        cham.style.pointerEvents = "none";
        if (quan) {
          cham.style.border = "4px solid rgba(46, 204, 113, 0.9)";
          cham.style.background = "transparent";
        } else {
          cham.style.background = "rgba(46, 204, 113, 0.65)";
        }
        oVuong.appendChild(cham);
      }

      // Gán sự kiện bấm ô (dùng IIFE để "đóng băng" giá trị tenO cho từng ô)
      (function (tenODaChon) {
        oVuong.addEventListener("click", function () {
          boardXuLyBamO(tenODaChon);
        });
      })(tenO);

      khungBanCo.appendChild(oVuong);
    }
  }

  // NC_03: mọi lần vẽ lại bàn cờ đều đồng bộ luôn trạng thái nút Gợi Ý (bật/tắt,
  // dòng chú thích số lượt còn lại) - gộp vào đây để không quên gọi ở chỗ khác.
  boardCapNhatNutGoiY();
}

/**
 * Hàm tạo 1 phần tử hiển thị quân cờ.
 * Thứ tự ƯU TIÊN (NC_03): vật phẩm TRANG BỊ (mua/đổi) > bộ quân động vật (quà
 * Level 10) > ký tự Unicode mặc định.
 * boQuanTrangBi: object { k,q,r,b,n,p } lấy từ trangBi.bo_quan_co (NC_03) - mỗi
 * giá trị là EMOJI hoặc URL ẢNH (HƯỚNG DẪN 4.6): giá trị bắt đầu bằng "http" hoặc
 * chứa "/" thì vẽ thẻ <img>, ngược lại vẽ thẳng làm chữ (emoji).
 */
function boardTaoPhanTuQuan(quan, coDungDongVat, boQuanTrangBi) {
  var oQuan = document.createElement("span");
  oQuan.style.pointerEvents = "none";
  oQuan.style.display = "flex";
  oQuan.style.alignItems = "center";
  oQuan.style.justifyContent = "center";
  oQuan.style.position = "relative"; // nằm trên lớp phủ nước cuối

  var giaTriTrangBi = boQuanTrangBi ? boQuanTrangBi[quan.type] : null;
  var laAnhTrangBi = !!giaTriTrangBi &&
    (String(giaTriTrangBi).indexOf("http") === 0 || String(giaTriTrangBi).indexOf("/") !== -1);

  if (laAnhTrangBi) {
    // NC_03: bộ quân cờ bằng ẢNH do quản trị tải lên Storage (HƯỚNG DẪN 4.6)
    var oAnh = document.createElement("img");
    oAnh.src = giaTriTrangBi;
    oAnh.alt = BOARD_TEN_QUAN_TIENG_VIET[quan.type] || "";
    oAnh.style.width = "88%";
    oAnh.style.height = "88%";
    oAnh.style.objectFit = "contain";
    oAnh.style.pointerEvents = "none";
    oQuan.appendChild(oAnh);
  } else if (giaTriTrangBi || coDungDongVat) {
    // Emoji TRANG BỊ tùy chỉnh HOẶC bộ quân động vật (quà Level 10): vẽ trong
    // khung tròn để vẫn phân biệt được bên Trắng/Đen dù emoji trung tính màu sắc
    oQuan.textContent = giaTriTrangBi || BOARD_QUAN_DONG_VAT[quan.type];
    oQuan.style.width = "84%";
    oQuan.style.height = "84%";
    oQuan.style.borderRadius = "50%";
    oQuan.style.fontSize = "0.8em";
    if (quan.color === "w") {
      oQuan.style.background = "rgba(255, 255, 255, 0.9)";
      oQuan.style.border = "2px solid #2f6cad";
    } else {
      oQuan.style.background = "rgba(44, 44, 60, 0.9)";
      oQuan.style.border = "2px solid #111";
    }
  } else {
    oQuan.textContent = BOARD_QUAN_MAC_DINH[quan.type];
    if (quan.color === "w") {
      oQuan.style.color = "#ffffff";
      oQuan.style.textShadow = "0 0 2px #000, 1px 1px 2px #000";
    } else {
      oQuan.style.color = "#1a1a1a";
      oQuan.style.textShadow = "0 0 2px rgba(255,255,255,0.5)";
    }
  }
  return oQuan;
}

/**
 * Hàm xử lý khi người chơi bấm vào 1 ô trên bàn cờ
 */
function boardXuLyBamO(tenO) {
  if (boardKetThuc || boardDangChoAI || !boardGame) return;
  if (boardGame.turn() !== BOARD_MAU_NGUOI) return;

  // NC_03B (việc C): bé vừa CHẠM vào bàn cờ để chọn quân -> cắt ngay lời an ủi
  // hoặc câu hỏi gợi ý đang phát dở, và tắt nhấp nháy mời bấm Gợi Ý.
  // Lúc này chắc chắn đang là lượt của bé (đã kiểm tra ở trên) nên không có
  // callback "cho máy đi" nào đang chờ - dừng tiếng ở đây tuyệt đối an toàn.
  boardDungNoiNgay();
  boardTatNhapNhayNutGoiY();

  if (boardODangChon && boardCacNuocHopLe.indexOf(tenO) !== -1) {
    boardThucHienNuocNguoi(boardODangChon, tenO);
    return;
  }

  var quanTaiO = boardGame.get(tenO);
  if (quanTaiO && quanTaiO.color === BOARD_MAU_NGUOI) {
    boardODangChon = tenO;
    var cacNuoc = boardGame.moves({ square: tenO, verbose: true });
    boardCacNuocHopLe = cacNuoc.map(function (nuoc) { return nuoc.to; });
  } else {
    boardODangChon = null;
    boardCacNuocHopLe = [];
  }
  boardVeBanCo();
}

/**
 * Hàm thực hiện nước đi của người chơi từ ô "từ" đến ô "đến"
 * Tự động phong cấp Hậu ("q") để đơn giản cho trẻ em.
 *
 * NC_03B (việc A) - THỨ TỰ MỚI, rất quan trọng:
 *   1. Đi quân, ghi nhớ ô để tô sáng.
 *   2. KHÓA BÀN CỜ NGAY (boardDangChoAI = true): trong lúc trợ lý khen, bé không
 *      bấm được, nên không thể vừa nghe khen vừa đi tiếp.
 *   3. Vẽ lại + hiệu ứng sấm sét (nếu có).
 *   4. Kiểm tra ván đã kết thúc chưa (nếu rồi thì nói câu thắng/thua/hòa và dừng,
 *      KHÔNG khen nữa để 2 câu không đè lên nhau).
 *   5. Nói LỜI KHEN. Chỉ khi câu khen ĐỌC XONG mới gọi boardTiepTucChoMayDi().
 *      Không có câu khen -> cho máy đi luôn.
 */
function boardThucHienNuocNguoi(oTu, oDen) {
  var nuoc = boardGame.move({ from: oTu, to: oDen, promotion: "q" });

  boardODangChon = null;
  boardCacNuocHopLe = [];

  if (!nuoc) {
    boardVeBanCo();
    return;
  }

  // NC_02: ghi nhớ ô xuất phát/đích để tô sáng nước vừa đi
  boardONguonNuocCuoi = nuoc.from;
  boardODichNuocCuoi = nuoc.to;

  // NC_03: trẻ vừa đi -> hủy lời nhắc gợi ý đang chờ + xóa nhấp nháy Gợi Ý cũ
  // (làm TRƯỚC khi vẽ lại bàn cờ để không hiện sót 1 khung hình gợi ý cũ)
  boardHuyChoGoiY();
  boardXoaNhapNhayGoiY();

  // NC_03B: cắt sạch câu nói cũ (lời an ủi, câu hỏi gợi ý) trước khi khen
  boardDungNoiNgay();

  var gayChieu = boardGame.in_check();

  // NC_03B (việc A): khóa bàn cờ NGAY, trước cả khi trợ lý mở miệng khen
  boardDangChoAI = true;
  boardDaGoiMayDiLuotNay = false;

  boardVeBanCo();
  boardCapNhatTheThongTinTranDau();

  // Người chơi gây chiếu tướng -> hiệu ứng sấm sét (mở khóa Lv15)
  if (gayChieu && boardLayLevelNguoiChoi() >= 15) {
    boardHieuUngSamSet();
  }

  // Ván đã xong: boardKiemTraKetThuc() tự đặt lại boardDangChoAI = false và nói
  // câu thắng/thua/hòa. Không khen thêm để 2 câu không tranh nhau.
  if (boardKiemTraKetThuc()) return;

  boardCapNhatThongTinLuot("Máy tính đang suy nghĩ...", "Đang chơi - Máy cấp " + boardLevelMay);

  // NC_02 (chỉnh): KHÔNG thuyết minh nước đi nữa (ô đã được tô sáng là đủ).
  // Chỉ nói LỜI KHEN theo Level tài khoản (nếu có), kèm link file của câu khen đó.
  var khen = boardXacDinhCauKhen(nuoc, gayChieu);

  if (!khen) {
    boardTiepTucChoMayDi();
    return;
  }

  // LƯỚI AN TOÀN TUYỆT ĐỐI: nếu vì lý do nào đó trình duyệt không bao giờ báo
  // "đọc xong" (mất mạng giữa chừng, tab bị ẩn...), sau 15 giây máy vẫn phải đi.
  // boardTiepTucChoMayDi() chỉ chạy đúng 1 lần nhờ cờ boardDaGoiMayDiLuotNay.
  if (boardTimeoutChoNoiXong) clearTimeout(boardTimeoutChoNoiXong);
  boardTimeoutChoNoiXong = setTimeout(boardTiepTucChoMayDi, 15000);

  boardNoiThongBao(khen.noiDung, khen.duongDanAmThanh, boardTiepTucChoMayDi);
}

/**
 * Hàm cho máy bắt đầu suy nghĩ, gọi SAU KHI lời khen đã đọc xong (NC_03B - việc A).
 * Chống gọi 2 lần trong cùng 1 lượt (vừa có callback "nói xong", vừa có lưới an toàn
 * 15 giây) bằng cờ boardDaGoiMayDiLuotNay.
 */
function boardTiepTucChoMayDi() {
  if (boardTimeoutChoNoiXong) {
    clearTimeout(boardTimeoutChoNoiXong);
    boardTimeoutChoNoiXong = null;
  }
  if (boardDaGoiMayDiLuotNay) return;
  boardDaGoiMayDiLuotNay = true;

  // Ván có thể đã kết thúc / bắt đầu lại trong lúc trợ lý đang nói
  if (boardKetThuc || !boardGame) return;
  if (boardGame.turn() !== BOARD_MAU_MAY) return;

  boardYeuCauAiDiChuyen();
}

// ================================
// PHẦN 3: LƯỢT ĐI CỦA MÁY TÍNH (AI 20 CẤP - NC_01)
// ================================

/**
 * Hàm yêu cầu máy tính (AI) tìm nước đi theo đúng thông số cấp máy trong Supabase.
 *   Tầng 1 - Xác suất đi hớ: tung số ngẫu nhiên 0..99, nhỏ hơn tyLeNgauNhien thì máy
 *            đánh 1 nước HỢP LỆ NGẪU NHIÊN (cấp 1 gần như luôn đi hớ -> trẻ dễ thắng).
 *   Tầng 2 - Không "hớ": hỏi Stockfish với Skill Level + độ sâu của cấp đó.
 * Luôn đặt bộ đếm giờ dự phòng: engine "im lặng" quá lâu thì tự đánh ngẫu nhiên.
 */
function boardYeuCauAiDiChuyen() {
  boardDangChoAI = true;
  boardHuyChoGoiY(); // Đang lượt máy -> không nhắc gợi ý
  boardCapNhatThongTinLuot("Máy tính đang suy nghĩ...", "Đang chơi - Máy cấp " + boardLevelMay);
  boardVeBanCo(); // Vẽ lại để con trỏ chuyển thành "không bấm được"
  boardCapNhatTheThongTinTranDau();

  var cfg = boardLayCauHinhCap(boardLevelMay);

  // NC_03B (việc D): chốt "thời gian nghĩ tối thiểu" của lượt này ngay từ đầu, để
  // dù engine trả lời sau 50ms hay 3 giây thì tổng thời gian nhìn thấy vẫn tự nhiên.
  boardMocBatDauNghiAI = Date.now();
  boardThoiGianNghiToiThieu = boardTinhThoiGianNghiToiThieu(boardLevelMay);

  var maySeDiNgauNhien = (Math.random() * 100) < cfg.tyLeNgauNhien;

  if (boardTimeoutAI) clearTimeout(boardTimeoutAI);

  if (maySeDiNgauNhien || !boardEngineSanSang || !boardEngine) {
    // Nước "đi hớ" tìm ra tức thì -> vẫn phải chờ đủ thời gian nghĩ tối thiểu
    boardTimeoutAI = setTimeout(function () {
      boardApDungNuocAiAnToan(null); // null -> ép dùng nước ngẫu nhiên
    }, boardThoiGianNghiToiThieu);
    return;
  }

  var tranThoiGian = boardTranThoiGianSuyNghi(cfg.doSau);
  boardEngine.postMessage("setoption name Skill Level value " + cfg.skillLevel);
  boardEngine.postMessage("position fen " + boardGame.fen());
  boardEngine.postMessage("go depth " + cfg.doSau + " movetime " + tranThoiGian);

  // Bộ đếm dự phòng: engine "im lặng" quá lâu thì tự đánh ngẫu nhiên.
  // Phải dài hơn cả thời gian nghĩ tối thiểu, nếu không nó sẽ cướp lượt của
  // boardHenGioApDungNuocMay() và máy luôn đi nước ngẫu nhiên.
  var hanDuPhong = Math.max(tranThoiGian + 3000, boardThoiGianNghiToiThieu + 2000);
  boardTimeoutAI = setTimeout(function () {
    boardApDungNuocAiAnToan(null);
  }, hanDuPhong);
}

/**
 * Hàm áp dụng nước đi của máy 1 cách "an toàn" (chống bị gọi 2 lần)
 */
function boardApDungNuocAiAnToan(nuocUci) {
  if (!boardDangChoAI || boardKetThuc || !boardGame) return;
  boardDangChoAI = false;
  if (boardTimeoutAI) {
    clearTimeout(boardTimeoutAI);
    boardTimeoutAI = null;
  }

  var nuocDaDi = null;

  if (nuocUci && nuocUci.length >= 4 && nuocUci !== "(none)") {
    var oTu = nuocUci.substring(0, 2);
    var oDen = nuocUci.substring(2, 4);
    var phongCap = nuocUci.length > 4 ? nuocUci.substring(4, 5) : "q";
    nuocDaDi = boardGame.move({ from: oTu, to: oDen, promotion: phongCap });
  }

  // Đi hớ theo xác suất, engine lỗi, hoặc dự phòng -> chọn ngẫu nhiên 1 nước hợp lệ
  if (!nuocDaDi) {
    var cacNuoc = boardGame.moves({ verbose: true });
    if (cacNuoc.length > 0) {
      var chon = cacNuoc[Math.floor(Math.random() * cacNuoc.length)];
      nuocDaDi = boardGame.move({ from: chon.from, to: chon.to, promotion: "q" });
    }
  }

  // NC_02: ghi nhớ ô xuất phát/đích của nước máy vừa đi để tô sáng
  if (nuocDaDi) {
    boardONguonNuocCuoi = nuocDaDi.from;
    boardODichNuocCuoi = nuocDaDi.to;
  }
  boardXoaNhapNhayGoiY(); // NC_03: máy vừa đi -> xóa nhấp nháy Gợi Ý cũ (nếu có)

  var gayChieu = boardGame.in_check();

  boardVeBanCo();
  boardCapNhatTheThongTinTranDau();

  // NC_02 (chỉnh): không thuyết minh nước máy đi (ô đã tô sáng).
  // Nhưng có 2 tình huống đáng nói sau nước của MÁY (chỉ với tài khoản level thấp,
  // cùng mốc khen_nuoc_tot_toi_level): trẻ BỊ CHIẾU (cảnh báo) hoặc BỊ ĂN QUÂN
  // (động viên). Ưu tiên cảnh báo bị chiếu.
  //
  // NC_03B (việc B): CHỈ CHỌN CÂU ở đây, CHƯA NÓI. Phải kiểm tra ván kết thúc trước
  // đã - nếu máy vừa chiếu bí thì câu "Máy tính đã chiếu bí..." mới là câu cần nói,
  // nói lời an ủi rồi bị đè lên là vô nghĩa.
  // Ngoài ra thêm câu mặc định viết trong code: nếu bảng loi_dong_vien trên Supabase
  // chưa có dòng 'bi_an_quan' / 'bi_chieu' thì trợ lý vẫn nói, không bị "câm".
  var loiSauNuocMay = null;
  if (nuocDaDi && boardLayLevelNguoiChoi() <= boardLayCauHinhChungSo("khen_nuoc_tot_toi_level", 9)) {
    var flagsMay = nuocDaDi.flags || "";
    if (gayChieu) {
      loiSauNuocMay = boardLayLoiTinhHuong(["bi_chieu"]) ||
        { noiDung: "Cẩn thận, Vua của con đang bị chiếu đấy!", duongDanAmThanh: null };
    } else if (flagsMay.indexOf("c") !== -1 || flagsMay.indexOf("e") !== -1) {
      loiSauNuocMay = boardLayLoiTinhHuong(["bi_an_quan"]) ||
        { noiDung: "Không sao đâu, mất một quân vẫn còn cơ hội. Cố lên con!", duongDanAmThanh: null };
    }
  }

  if (gayChieu && boardLayLevelNguoiChoi() >= 15) {
    boardHieuUngSamSet();
  }

  if (boardKiemTraKetThuc()) return;

  boardCapNhatThongTinLuot("Đến lượt bạn (Quân Trắng)", "Đang chơi - Máy cấp " + boardLevelMay);
  boardVeBanCo();
  boardCapNhatTheThongTinTranDau();

  // Giờ mới nói lời an ủi/cảnh báo. Nếu bé sốt ruột chạm bàn cờ đi luôn thì
  // boardXuLyBamO() sẽ gọi boardDungNoiNgay() cắt tiếng ngay lập tức (việc C).
  if (loiSauNuocMay) {
    boardNoiThongBao(loiSauNuocMay.noiDung, loiSauNuocMay.duongDanAmThanh);
  }

  boardBatDauChoGoiY(); // Tới lượt trẻ -> hẹn giờ hỏi "Con có cần gợi ý không?"
}

// ================================
// PHẦN 4: KIỂM TRA KẾT THÚC VÁN VÀ CHẤM ĐIỂM
// ================================

/**
 * Hàm kiểm tra ván cờ đã kết thúc chưa
 * Máy chủ phân biệt "thua" và "hoa" với mức thưởng khác nhau -> gửi đúng chuỗi "hoa".
 */
function boardKiemTraKetThuc() {
  if (!boardGame.game_over()) return false;

  boardKetThuc = true;
  boardDangChoAI = false;
  boardHuyChoGoiY(); // Ván xong -> không nhắc gợi ý nữa

  var ketQua;    // "thang" | "thua" | "hoa"
  var laHoa = false;
  var thongBao;

  if (boardGame.in_checkmate()) {
    if (boardGame.turn() === BOARD_MAU_MAY) {
      ketQua = "thang";
      thongBao = "Bạn đã CHIẾU BÍ thành công! Chiến thắng rực rỡ!";
    } else {
      ketQua = "thua";
      thongBao = "Máy tính đã chiếu bí. Cố gắng lần sau nhé!";
    }
  } else {
    laHoa = true;
    ketQua = "hoa";
    thongBao = "Ván cờ HÒA! Bạn nhận kim cương khích lệ.";
  }

  boardCapNhatThongTinLuot(thongBao, laHoa ? "Hòa cờ" : "Kết thúc");
  boardCapNhatTheThongTinTranDau();
  boardNoiCauSuKien(ketQua + "_van", thongBao); // thang_van / thua_van / hoa_van
  boardGuiKetQuaLenMayChu(ketQua, laHoa, thongBao);
  return true;
}

/**
 * Hàm gửi kết quả ván cờ lên máy chủ (api.js -> apiCapNhatDiem)
 */
function boardGuiKetQuaLenMayChu(ketQua, laHoa, thongBaoThangThua) {
  var taiKhoan = (typeof appLayTaiKhoanDangNhap === "function") ? appLayTaiKhoanDangNhap() : null;
  if (!taiKhoan) {
    boardHienKhungKetQua(thongBaoThangThua, laHoa, ketQua, null);
    return;
  }

  apiCapNhatDiem(taiKhoan.tenDangNhap, ketQua, boardLevelMay).then(function (phanHoi) {
    if (phanHoi && phanHoi.thanhCong && phanHoi.ketQuaCapNhat) {
      boardHienKhungKetQua(thongBaoThangThua, laHoa, ketQua, phanHoi.ketQuaCapNhat);

      if (typeof appCapNhatTaiKhoanSauVanCo === "function") {
        appCapNhatTaiKhoanSauVanCo({
          levelMoi: phanHoi.ketQuaCapNhat.levelMoi,
          diemMoi: phanHoi.ketQuaCapNhat.diemMoi
        });
      }
      boardDienLuaChonCapDoMay(); // Lên cấp -> mở thêm cấp máy mới
    } else {
      boardHienKhungKetQua(thongBaoThangThua, laHoa, ketQua, null);
    }
  });
}

/**
 * Hàm hiện khung kết quả ván (#thongBaoKetQuaVan) và đổ số liệu từ api.js vào
 */
function boardHienKhungKetQua(thongBaoThangThua, laHoa, ketQua, ketQuaCapNhat) {
  var khung = document.getElementById("thongBaoKetQuaVan");
  var oThangThua = document.getElementById("ketQuaThangThua");
  var oDiemCong = document.getElementById("ketQuaDiemVuaCong");
  var oLevelCu = document.getElementById("ketQuaLevelCu");
  var oLevelMoi = document.getElementById("ketQuaLevelMoi");
  var khungMoc = document.getElementById("hieuUngDatMocMoi");

  if (oThangThua) oThangThua.textContent = thongBaoThangThua;

  if (ketQuaCapNhat) {
    if (oDiemCong) oDiemCong.textContent = ketQuaCapNhat.diemVuaCong;
    if (oLevelCu) oLevelCu.textContent = ketQuaCapNhat.levelCu;
    if (oLevelMoi) oLevelMoi.textContent = ketQuaCapNhat.levelMoi;
  } else {
    if (oDiemCong) oDiemCong.textContent = "0";
    if (oLevelCu) oLevelCu.textContent = "-";
    if (oLevelMoi) oLevelMoi.textContent = "-";
  }

  if (khung) {
    khung.style.display = "block";
    khung.classList.remove("thang", "thua");
    khung.classList.add(ketQua === "thang" ? "thang" : "thua");
  }

  if (ketQua === "thang" && !laHoa) {
    boardHieuUngPhaoHoa();
  }

  if (khungMoc) {
    if (ketQuaCapNhat && ketQuaCapNhat.vuaDatMocMoi) {
      var levelMoi = ketQuaCapNhat.levelMoi;
      khungMoc.style.display = "block";
      khungMoc.textContent = boardThongBaoMocMoi(levelMoi);
      boardNoiCauSuKien("len_cap", boardThongBaoMocMoi(levelMoi));
      if (levelMoi >= 20) {
        boardHieuUngKhoBau();
      } else {
        boardHieuUngPhaoHoa();
      }
    } else {
      khungMoc.style.display = "none";
    }
  }
}

/**
 * Hàm trả về câu thông báo mở khóa ứng với từng mốc Level đặc biệt
 */
function boardThongBaoMocMoi(level) {
  if (level >= 20) return "CHÚC MỪNG VUA KỲ THỦ! Mở khóa Rương Kho Báu: pháo hoa và cúp vàng!";
  if (level >= 15) return "Đạt Level 15! Mở khóa hiệu ứng Sấm Sét khi chiếu tướng!";
  if (level >= 10) return "Đạt Level 10! Mở khóa bộ quân cờ hình Động Vật!";
  if (level >= 5) return "Đạt Level 5! Mở khóa Màu Bàn Cờ Mới!";
  return "Chúc mừng bạn đã lên cấp mới!";
}

// ================================
// PHẦN 4.5: PHẢN HỒI TỪNG NƯỚC ĐI - GIỌNG NÓI, BÓNG THOẠI, LỜI KHEN (NC_02)
// ================================

/**
 * Bộ hẹn giờ NHẮC GỢI Ý: đến lượt trẻ mà lâu không đi thì trợ lý hỏi
 * "Con có cần gợi ý không?" (câu lấy từ loai='hoi_goi_y' trong bảng loi_dong_vien,
 * có thể kèm link file âm thanh ở cột duong_dan_am_thanh).
 * Số giây chờ đọc từ khóa "giay_nhac_goi_y" trong cau_hinh_chung (mặc định 30).
 * Mỗi lượt chỉ nhắc 1 lần, không lải nhải.
 */
function boardBatDauChoGoiY() {
  boardHuyChoGoiY();
  if (boardKetThuc) return;

  // Chỉ CHỦ ĐỘNG hỏi với tài khoản level thấp (khóa hoi_goi_y_toi_level, mặc định 9);
  // trẻ level cao vẫn tự bấm nút Gợi Ý được (NC_03) nhưng trợ lý không hỏi trước.
  if (boardLayLevelNguoiChoi() > boardLayCauHinhChungSo("hoi_goi_y_toi_level", 9)) return;

  var soGiay = boardLayCauHinhChungSo("giay_cho_hoi_goi_y", 30);
  if (soGiay <= 0) return; // Quản trị đặt 0 = tắt tính năng nhắc

  boardHenGioGoiY = setTimeout(function () {
    boardHenGioGoiY = null;
    // Chỉ nhắc khi ván còn diễn ra và vẫn đang là lượt của trẻ
    if (boardKetThuc || boardDangChoAI || !boardGame) return;
    if (boardGame.turn() !== BOARD_MAU_NGUOI) return;

    // NC_03B: KHÔNG hiện bong bóng che màn hình nữa. Trợ lý chỉ HỎI BẰNG GIỌNG,
    // đồng thời nút "💡 Gợi Ý" nhấp nháy để mời bé bấm. Bé muốn thì bấm, không
    // muốn thì cứ đi tiếp - chạm vào bàn cờ là tiếng tắt và nút hết nhấp nháy.
    var loiHoi = boardLayLoiNgauNhien("hoi_goi_y");
    if (loiHoi) {
      boardNoiThongBao(loiHoi.noiDung, loiHoi.duongDanAmThanh);
    } else {
      boardNoiThongBao("Con có cần gợi ý không?", null);
    }

    // Chỉ nhấp nháy khi còn lượt Gợi Ý trong ván (mời bấm nút đã hết lượt là vô ích)
    var cfgConLuot = boardLayCauHinhCap(boardLayLevelNguoiChoi());
    if (!(cfgConLuot.goiYGioiHan > 0 && boardSoLanDaGoiYVan >= cfgConLuot.goiYGioiHan)) {
      boardBatNhapNhayNutGoiY();
    }
  }, soGiay * 1000);
}

/**
 * Hàm hủy lời nhắc gợi ý đang chờ (trẻ vừa đi, máy đang nghĩ, hoặc ván kết thúc)
 * NC_03B: đồng thời tắt nhấp nháy nút Gợi Ý nếu đang bật (mọi lý do hủy hẹn giờ
 * đều là lý do hợp lệ để thôi mời bấm - ván đã sang trạng thái khác rồi).
 */
function boardHuyChoGoiY() {
  if (boardHenGioGoiY) {
    clearTimeout(boardHenGioGoiY);
    boardHenGioGoiY = null;
  }
  boardTatNhapNhayNutGoiY();
}

// ================================
// PHẦN 4.55: NÚT GỢI Ý - STOCKFISH GỢI Ý NƯỚC TỐT NHẤT (NC_03)
// board.js CHỐT SỔ tại bước này - xem chú thích đầu file.
// ================================

/**
 * Hàm xóa nhấp nháy Gợi Ý đang hiển thị (không tự vẽ lại bàn cờ ở đây; nơi gọi
 * hàm này đều đã có 1 lượt boardVeBanCo() ngay sau đó trong luồng xử lý).
 */
function boardXoaNhapNhayGoiY() {
  boardONguonGoiY = null;
  boardODichGoiY = null;
}

/**
 * Hàm xử lý khi trẻ bấm nút "💡 Gợi Ý" (NC_03B: đây là lối vào DUY NHẤT, hộp thoại
 * xác nhận đã bị bỏ). Hỏi Stockfish nước TỐT NHẤT ở thế cờ hiện tại, KHÔNG tự đi thay trẻ -
 * chỉ NHẤP NHÁY ô đi + ô đến (boardVeBanCo() vẽ class "oGoiYNhapNhay", xem style.css).
 * Giới hạn lượt/ván board.js tự đếm (boardSoLanDaGoiYVan so với goiYGioiHan đọc
 * theo LEVEL TÀI KHOẢN); trừ kim cương do MÁY CHỦ quyết định (boardApDungGoiY).
 */
function boardYeuCauGoiY() {
  if (boardKetThuc || boardDangChoAI || boardDangChoGoiY || !boardGame) return;
  if (boardGame.turn() !== BOARD_MAU_NGUOI) return;

  // NC_03B: bé đã trả lời câu hỏi bằng hành động -> tắt nhấp nháy và cắt câu hỏi
  // đang đọc dở, để câu "Đang nghĩ gợi ý..." (nếu có) không bị chồng tiếng.
  boardTatNhapNhayNutGoiY();
  boardDungNoiNgay();

  var cfg = boardLayCauHinhCap(boardLayLevelNguoiChoi());
  if (cfg.goiYGioiHan > 0 && boardSoLanDaGoiYVan >= cfg.goiYGioiHan) {
    boardVeBanCo(); // Đồng bộ lại nút (phòng khi đang hiển thị sai trạng thái)
    return;
  }

  if (!boardEngineSanSang || !boardEngine) {
    boardNoiThongBao("Bộ não máy chưa sẵn sàng, con thử lại sau vài giây nhé!", null);
    return;
  }

  // Xóa nhấp nháy cũ (nếu có) trước khi tính gợi ý mới; hủy luôn hẹn giờ nhắc
  // bằng giọng vì trẻ vừa TỰ hành động rồi, không cần nhắc nữa
  boardHuyChoGoiY();
  boardXoaNhapNhayGoiY();
  boardDangChoGoiY = true;
  boardVeBanCo(); // Vẽ lại ngay: xóa nhấp nháy cũ + khóa nút Gợi Ý (boardCapNhatNutGoiY)

  boardEngine.postMessage("position fen " + boardGame.fen());
  boardEngine.postMessage("go depth " + BOARD_DO_SAU_GOI_Y + " movetime 1500");

  if (boardTimeoutGoiY) clearTimeout(boardTimeoutGoiY);
  boardTimeoutGoiY = setTimeout(function () {
    if (!boardDangChoGoiY) return; // Đã có phản hồi trước khi hết giờ -> bỏ qua
    boardDangChoGoiY = false;
    boardVeBanCo();
    boardNoiThongBao("Gợi ý gặp sự cố, con thử lại nhé!", null);
  }, 4000);
}

/**
 * Hàm nhận nước TỐT NHẤT do Stockfish trả lời cho YÊU CẦU GỢI Ý (phân biệt với
 * nước đi của máy ĐỐI THỦ bằng cờ boardDangChoGoiY trong boardXuLyPhanHoiEngine).
 * Chỉ NHẤP NHÁY ô đi/đến - KHÔNG áp dụng nước đi vào boardGame. Sau khi có gợi ý
 * hợp lệ mới tính 1 lượt (boardSoLanDaGoiYVan++) và gọi máy chủ trừ kim cương.
 */
function boardApDungGoiY(nuocUci) {
  boardDangChoGoiY = false;
  if (boardTimeoutGoiY) {
    clearTimeout(boardTimeoutGoiY);
    boardTimeoutGoiY = null;
  }

  if (!nuocUci || nuocUci.length < 4 || nuocUci === "(none)") {
    boardVeBanCo();
    boardNoiThongBao("Máy chưa nghĩ ra gợi ý, con thử lại nhé!", null);
    return;
  }

  boardONguonGoiY = nuocUci.substring(0, 2);
  boardODichGoiY = nuocUci.substring(2, 4);
  boardSoLanDaGoiYVan++;

  boardVeBanCo(); // Vẽ nhấp nháy + cập nhật nút/dòng chú thích lượt còn lại

  // Tự tắt nhấp nháy sau vài giây nếu trẻ chưa đi ngay (KHÔNG tự đi thay trẻ)
  var maPhienGoiYHienTai = ++boardMaPhienNhapNhayGoiY;
  setTimeout(function () {
    if (maPhienGoiYHienTai !== boardMaPhienNhapNhayGoiY) return; // Đã có gợi ý mới hơn
    boardXoaNhapNhayGoiY();
    boardVeBanCo();
  }, 6000);

  // Trừ kim cương: MÁY CHỦ tự tra chi phí theo Level TÀI KHOẢN, không bao giờ âm,
  // không trừ EXP (HƯỚNG DẪN 4.9) - board.js không tự tính số phải trừ.
  var taiKhoan = (typeof appLayTaiKhoanDangNhap === "function") ? appLayTaiKhoanDangNhap() : null;
  if (taiKhoan && typeof apiTruDiemGoiY === "function") {
    apiTruDiemGoiY(taiKhoan.tenDangNhap).then(function (phanHoi) {
      if (phanHoi && phanHoi.thanhCong && typeof appCapNhatTaiKhoanSauVanCo === "function") {
        appCapNhatTaiKhoanSauVanCo({
          levelMoi: taiKhoan.level,
          diemMoi: phanHoi.diemMoi
        });
      }
    });
  }
}

/**
 * Hàm cập nhật nút #btnGoiY + dòng chú thích #ghiChuGoiY cho khớp trạng thái hiện
 * tại (đang chờ engine, hết lượt, còn bao nhiêu lượt, chi phí bao nhiêu). Được
 * gọi tự động ở cuối boardVeBanCo() nên luôn đồng bộ, không cần nhớ gọi thủ công.
 */
function boardCapNhatNutGoiY() {
  var nut = document.getElementById("btnGoiY");
  var ghiChu = document.getElementById("ghiChuGoiY");
  if (!nut) return;

  if (boardDangChoGoiY) {
    nut.disabled = true;
    if (ghiChu) ghiChu.textContent = "Đang nghĩ gợi ý cho con...";
    return;
  }

  var dangDenLuotNguoi = !boardKetThuc && boardGame && !boardDangChoAI && boardGame.turn() === BOARD_MAU_NGUOI;
  var cfg = boardLayCauHinhCap(boardLayLevelNguoiChoi());
  var conLuot = !(cfg.goiYGioiHan > 0 && boardSoLanDaGoiYVan >= cfg.goiYGioiHan);

  nut.disabled = !dangDenLuotNguoi || !conLuot || !boardEngineSanSang;

  if (!ghiChu) return;
  if (!conLuot) {
    ghiChu.textContent = "Hết lượt gợi ý trong ván này.";
  } else if (cfg.goiYGioiHan > 0) {
    var conLai = cfg.goiYGioiHan - boardSoLanDaGoiYVan;
    ghiChu.textContent = cfg.goiYChiPhi > 0
      ? "Còn " + conLai + " lượt gợi ý (mỗi lần trừ " + cfg.goiYChiPhi + " 💎)."
      : "Còn " + conLai + " lượt gợi ý.";
  } else {
    ghiChu.textContent = cfg.goiYChiPhi > 0
      ? "Không giới hạn lượt (mỗi lần trừ " + cfg.goiYChiPhi + " 💎)."
      : "Không giới hạn, hoàn toàn miễn phí.";
  }
}

/**
 * Hàm BẬT nhấp nháy nút "💡 Gợi Ý" (NC_03B - thay cho hộp thoại xác nhận cũ).
 * Chỉ là 1 class CSS; khung hiệu ứng nằm trong boardTiemCssHieuUng().
 */
function boardBatNhapNhayNutGoiY() {
  var nut = document.getElementById("btnGoiY");
  if (nut) nut.classList.add("boardNutGoiYNhapNhay");
}

/** Hàm TẮT nhấp nháy nút "💡 Gợi Ý" */
function boardTatNhapNhayNutGoiY() {
  var nut = document.getElementById("btnGoiY");
  if (nut) nut.classList.remove("boardNutGoiYNhapNhay");
}

/**
 * Hàm xác định 1 nước đi có phải "nước tốt" hay không
 * (ăn quân, chiếu tướng, nhập thành, phong cấp)
 */
function boardLaNuocTot(nuoc, gayChieu) {
  if (!nuoc) return false;
  if (gayChieu) return true;
  var flags = nuoc.flags || "";
  if (flags.indexOf("c") !== -1) return true;  // ăn quân
  if (flags.indexOf("e") !== -1) return true;  // bắt tốt qua đường
  if (flags.indexOf("k") !== -1) return true;  // nhập thành gần
  if (flags.indexOf("q") !== -1) return true;  // nhập thành xa
  if (flags.indexOf("p") !== -1) return true;  // phong cấp
  return false;
}

/**
 * Hàm nhận diện TÌNH HUỐNG của 1 nước đi để chọn nhóm câu nói phù hợp.
 * Thứ tự ưu tiên khi 1 nước rơi vào nhiều tình huống (ví dụ ăn quân + chiếu):
 * chiếu tướng > phong cấp > ăn quân > nhập thành > nước thường.
 * Trả về mã loai trong bảng loi_dong_vien.
 */
function boardTinhHuongNuocDi(nuoc, gayChieu) {
  var flags = (nuoc && nuoc.flags) || "";
  if (gayChieu) return "chieu_tuong";
  if (flags.indexOf("p") !== -1) return "phong_cap";
  if (flags.indexOf("c") !== -1 || flags.indexOf("e") !== -1) return "an_quan";
  if (flags.indexOf("k") !== -1 || flags.indexOf("q") !== -1) return "nhap_thanh";
  return "nuoc_thuong";
}

/**
 * Hàm lấy 1 câu nói theo DANH SÁCH LOẠI ưu tiên: thử loại đầu, hết câu thì
 * lùi sang loại dự phòng kế tiếp (ví dụ ["an_quan","nuoc_tot"]).
 * Nhờ đó: quản trị chưa kịp nhập câu cho tình huống chi tiết thì hệ thống
 * vẫn dùng câu của nhóm chung, không bao giờ "câm" vì thiếu dữ liệu.
 */
function boardLayLoiTinhHuong(cacLoai) {
  for (var i = 0; i < cacLoai.length; i++) {
    var loi = boardLayLoiNgauNhien(cacLoai[i]);
    if (loi) return loi;
  }
  return null;
}

/**
 * Hàm lấy ngẫu nhiên 1 câu trong boardLoiDongVien theo đúng "loai" yêu cầu.
 * Trả về đối tượng { noiDung, duongDanAmThanh } - link do quản trị điền trong
 * Supabase (cột duong_dan_am_thanh), có thể trống.
 * Trả về null nếu chưa tải được câu nào thuộc loại đó (ví dụ lỗi mạng lúc khởi động).
 */
function boardLayLoiNgauNhien(loai) {
  var danhSach = [];
  for (var i = 0; i < boardLoiDongVien.length; i++) {
    if (boardLoiDongVien[i].loai === loai) {
      danhSach.push(boardLoiDongVien[i]);
    }
  }
  if (danhSach.length === 0) return null;
  var chon = danhSach[Math.floor(Math.random() * danhSach.length)];
  return {
    noiDung: chon.noiDung,
    duongDanAmThanh: (chon.duongDanAmThanh && String(chon.duongDanAmThanh).trim())
      ? String(chon.duongDanAmThanh).trim() : null
  };
}

/**
 * Hàm xác định câu khen cho nước đi CỦA NGƯỜI CHƠI, theo mốc Level tài khoản
 * trong cau_hinh_chung. Trả về { noiDung, duongDanAmThanh } hoặc null (không khen):
 *   Lv 1..khen_moi_nuoc_toi_level (mặc định 5): khen MỌI nước.
 *   Lv tiếp theo..khen_nuoc_tot_toi_level (mặc định 9): CHỈ khen nước tốt.
 *   Từ Lv sau đó trở lên: TẮT khen hoàn toàn.
 */
function boardXacDinhCauKhen(nuoc, gayChieu) {
  var level = boardLayLevelNguoiChoi();
  var mocKhenMoiNuoc = boardLayCauHinhChungSo("khen_moi_nuoc_toi_level", 5);
  var mocKhenNuocTot = boardLayCauHinhChungSo("khen_nuoc_tot_toi_level", 9);
  var laNuocTot = boardLaNuocTot(nuoc, gayChieu);

  // Chọn câu theo TÌNH HUỐNG cụ thể, thiếu thì lùi về nhóm chung:
  //   an_quan / chieu_tuong / nhap_thanh / phong_cap -> nuoc_tot
  //   nuoc_thuong -> moi_nuoc (tương thích dữ liệu cũ)
  var tinhHuong = boardTinhHuongNuocDi(nuoc, gayChieu);

  if (level <= mocKhenMoiNuoc) {
    if (laNuocTot) {
      return boardLayLoiTinhHuong([tinhHuong, "nuoc_tot", "nuoc_thuong", "moi_nuoc"]);
    }
    return boardLayLoiTinhHuong(["nuoc_thuong", "moi_nuoc"]);
  }

  if (level <= mocKhenNuocTot) {
    return laNuocTot ? boardLayLoiTinhHuong([tinhHuong, "nuoc_tot"]) : null;
  }

  return null;
}

/**
 * Hàm cập nhật thẻ thông tin trận đấu (#theDoiThu và #theBanThan):
 * avatar, tên, level của mỗi bên; bật/tắt cờ hiệu + phát sáng (class "dangDenLuot")
 * cho bên đang đến lượt.
 */
function boardCapNhatTheThongTinTranDau() {
  var taiKhoan = (typeof appLayTaiKhoanDangNhap === "function") ? appLayTaiKhoanDangNhap() : null;

  var oDoiThuLevel = document.getElementById("theDoiThuLevel");
  if (oDoiThuLevel) oDoiThuLevel.textContent = "Cấp " + (boardLevelMay || 1);

  var oBanThanAvatar = document.getElementById("theBanThanAvatar");
  var oBanThanTen = document.getElementById("theBanThanTen");
  var oBanThanLevel = document.getElementById("theBanThanLevel");
  // SỬA 11/07/2026 - NC_06B (sửa lỗi, đúng ngoại lệ mở file đóng băng): avatar
  // cao cấp là URL ảnh -> vẽ <img> tròn; emoji -> đặt chữ như cũ. Trước đây dùng
  // textContent nên URL dài in ra thành chữ tràn thẻ (HƯỚNG DẪN 4.6).
  if (oBanThanAvatar) {
    var boardAvt = ((taiKhoan && taiKhoan.avatarDaChon) || "").trim();
    if (boardAvt && (boardAvt.indexOf("http") === 0 || boardAvt.indexOf("/") >= 0)) {
      oBanThanAvatar.innerHTML = '<img src="' + boardAvt.replace(/"/g, "&quot;") + '" alt="avatar" ' +
        'style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
    } else {
      oBanThanAvatar.textContent = boardAvt || "\u2753";
    }
  }
  if (oBanThanTen) oBanThanTen.textContent = (taiKhoan && taiKhoan.tenDangNhap) || "Bạn";
  if (oBanThanLevel) oBanThanLevel.textContent = "Level " + boardLayLevelNguoiChoi();

  var theDoiThu = document.getElementById("theDoiThu");
  var theBanThan = document.getElementById("theBanThan");
  var dangChoi = !boardKetThuc && boardGame;
  var denLuotMay = dangChoi && boardGame.turn() === BOARD_MAU_MAY;
  var denLuotNguoi = dangChoi && boardGame.turn() === BOARD_MAU_NGUOI;

  if (theDoiThu) theDoiThu.classList.toggle("dangDenLuot", !!denLuotMay);
  if (theBanThan) theBanThan.classList.toggle("dangDenLuot", !!denLuotNguoi);
}

// ================================
// PHẦN 4.6: HỆ THỐNG GIỌNG NÓI ĐA THIẾT BỊ (NC_02)
// Vì đa số máy tính Windows KHÔNG có sẵn giọng tiếng Việt, còn điện thoại Android
// thì thường có, ta dùng cơ chế 4 tầng tự động chọn cách đọc phù hợp từng máy.
// ================================

/**
 * Hàm đọc 1 khóa cài đặt giọng từ localStorage (an toàn với chế độ ẩn danh)
 */
function boardDocCaiDat(khoa, macDinh) {
  try {
    var giaTri = window.localStorage.getItem(khoa);
    return (giaTri === null || giaTri === undefined) ? macDinh : giaTri;
  } catch (loi) {
    return macDinh;
  }
}

/**
 * Hàm ghi 1 khóa cài đặt giọng vào localStorage
 */
function boardGhiCaiDat(khoa, giaTri) {
  try {
    window.localStorage.setItem(khoa, giaTri);
  } catch (loi) {
    // Trình duyệt chặn localStorage -> bỏ qua, cài đặt chỉ có hiệu lực trong phiên này
  }
}

/**
 * Hàm kiểm tra 1 giọng có phải giọng tiếng Việt hay không
 */
function boardLaGiongViet(giong) {
  if (!giong) return false;
  var ma = (giong.lang || "").replace("_", "-").toLowerCase();
  var ten = (giong.name || "").toLowerCase();
  return ma.indexOf("vi") === 0 || ten.indexOf("viet") !== -1 || ten.indexOf("việt") !== -1;
}

/**
 * Hàm quét danh sách giọng có trên máy này và chọn giọng phù hợp.
 * Chrome nạp giọng CHẬM và bất đồng bộ -> phải nghe sự kiện onvoiceschanged.
 */
function boardChuanBiGiongNoi() {
  if (!boardCoWebSpeech) {
    boardCapNhatThanhGiong();
    return;
  }

  boardQuetGiongNoi();
  window.speechSynthesis.onvoiceschanged = function () {
    boardQuetGiongNoi();
  };
  // Một số máy nạp giọng trễ vài trăm mili giây, quét lại cho chắc
  setTimeout(boardQuetGiongNoi, 800);
  setTimeout(boardQuetGiongNoi, 2500);
}

/**
 * Hàm lấy danh sách giọng và chọn giọng đang dùng:
 * ưu tiên giọng người dùng đã chọn -> giọng tiếng Việt -> giọng mặc định của máy
 */
function boardQuetGiongNoi() {
  if (!boardCoWebSpeech) return;

  var danhSachMoi = window.speechSynthesis.getVoices() || [];
  if (danhSachMoi.length === 0) return;

  var soLuongCu = boardDanhSachGiong.length;
  boardDanhSachGiong = danhSachMoi;

  var tenDaLuu = boardDocCaiDat(BOARD_KHOA_TEN_GIONG, "");
  var i;

  boardGiongDaChon = null;

  if (tenDaLuu) {
    for (i = 0; i < boardDanhSachGiong.length; i++) {
      if (boardDanhSachGiong[i].name === tenDaLuu) {
        boardGiongDaChon = boardDanhSachGiong[i];
        break;
      }
    }
  }

  if (!boardGiongDaChon) {
    for (i = 0; i < boardDanhSachGiong.length; i++) {
      if (boardLaGiongViet(boardDanhSachGiong[i])) {
        boardGiongDaChon = boardDanhSachGiong[i];
        break;
      }
    }
  }

  // Danh sách giọng vừa thay đổi -> vẽ lại thanh cài đặt
  if (danhSachMoi.length !== soLuongCu) {
    boardCapNhatThanhGiong();
  }
}

/**
 * Hàm kiểm tra máy này có giọng tiếng Việt cài sẵn hay không
 */
function boardCoGiongViet() {
  for (var i = 0; i < boardDanhSachGiong.length; i++) {
    if (boardLaGiongViet(boardDanhSachGiong[i])) return true;
  }
  return false;
}

/**
 * Hàm "mở khóa" âm thanh ở cú chạm/click đầu tiên.
 * iOS và nhiều bản Android chỉ cho phát tiếng nếu lệnh phát bắt nguồn từ 1 thao tác
 * của người dùng. Ta phát 1 đoạn âm câm + 1 câu rỗng để trình duyệt ghi nhận là
 * "đã được phép", các lần sau (kể cả nước đi của máy) phát tiếng bình thường.
 */
function boardMoKhoaAmThanh() {
  if (boardDaMoKhoaAmThanh) return;
  boardDaMoKhoaAmThanh = true;

  try {
    if (!boardAmThanhMang) boardAmThanhMang = new Audio();
    if (!boardAmThanhTep) boardAmThanhTep = new Audio();
    // File WAV câm siêu ngắn, chỉ để trình duyệt cho phép các thẻ audio này phát về sau
    var wavCam = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
    boardAmThanhMang.src = wavCam;
    boardAmThanhTep.src = wavCam;
    var hua1 = boardAmThanhMang.play();
    if (hua1 && hua1.catch) hua1.catch(function () {});
    var hua2 = boardAmThanhTep.play();
    if (hua2 && hua2.catch) hua2.catch(function () {});
  } catch (loi) {
    // Bỏ qua
  }

  try {
    if (boardCoWebSpeech) {
      var loiRong = new SpeechSynthesisUtterance(" ");
      loiRong.volume = 0;
      window.speechSynthesis.speak(loiRong);
    }
  } catch (loi2) {
    // Bỏ qua
  }
}

/**
 * Hàm ước lượng thời gian đọc tối đa của 1 câu (mili giây) - NC_03B.
 * Dùng làm LƯỚI AN TOÀN: nếu trình duyệt không bao giờ báo "đọc xong" (Chrome đôi
 * khi nuốt sự kiện onend, hoặc tab bị ẩn), sau ngần này mili giây ta vẫn tự coi là
 * đã xong để không kẹt ván cờ.
 */
function boardUocLuongThoiGianNoi(cauNoi) {
  var ms = 3000 + String(cauNoi).length * 120;
  if (ms > 15000) ms = 15000;
  return ms;
}

/**
 * Hàm DỪNG NGAY mọi âm thanh đang phát và HỦY callback "nói xong" đang chờ (NC_03B).
 * Gọi khi: bé chạm bàn cờ (việc C), bé bấm nút Gợi Ý, bắt đầu ván mới, hoặc trước
 * khi phát 1 câu mới.
 * Cách hủy: tăng boardMaPhienNoi lên 1 - mọi sự kiện onend/onerror đến muộn của câu
 * cũ đều mang mã phiên cũ nên bị boardHoanTatNoi() bỏ qua.
 *
 * AN TOÀN: hàm này KHÔNG BAO GIỜ gây kẹt ván. Callback duy nhất từng được gắn vào
 * lời nói là boardTiepTucChoMayDi (lượt của MÁY, bàn cờ đang khóa nên bé không bấm
 * được), và ngay cả khi nó bị hủy thì lưới an toàn 15 giây trong
 * boardThucHienNuocNguoi() vẫn cho máy đi.
 */
function boardDungNoiNgay() {
  boardMaPhienNoi++;
  boardCallbackNoi = null;

  if (boardTimeoutNoiXong) {
    clearTimeout(boardTimeoutNoiXong);
    boardTimeoutNoiXong = null;
  }

  try {
    if (boardCoWebSpeech) window.speechSynthesis.cancel();
  } catch (loi) { /* Bỏ qua */ }
  boardDungWatchdogNoi();

  try {
    if (boardAmThanhMang) {
      boardAmThanhMang.onerror = null;
      boardAmThanhMang.onended = null;
      boardAmThanhMang.onplaying = null;
      boardAmThanhMang.pause();
    }
  } catch (loi2) { /* Bỏ qua */ }

  try {
    if (boardAmThanhTep) {
      boardAmThanhTep.onerror = null;
      boardAmThanhTep.onended = null;
      boardAmThanhTep.pause();
    }
  } catch (loi3) { /* Bỏ qua */ }
  boardMaPhienTep++;
}

/**
 * Hàm đánh dấu "câu nói mã phiên này đã đọc xong" và chạy callback kèm theo (nếu có).
 * Mọi tầng giọng (máy / mạng / file / im lặng) đều đổ về đây, nên callback chắc chắn
 * chạy đúng 1 lần, dù câu được đọc bằng cách nào.
 */
function boardHoanTatNoi(phien) {
  if (phien !== boardMaPhienNoi) return; // Sự kiện đến muộn của câu cũ -> bỏ qua

  boardMaPhienNoi++; // Khóa phiên này lại, onend gọi lần 2 cũng vô hiệu

  if (boardTimeoutNoiXong) {
    clearTimeout(boardTimeoutNoiXong);
    boardTimeoutNoiXong = null;
  }

  var ham = boardCallbackNoi;
  boardCallbackNoi = null;
  if (typeof ham === "function") ham();
}

/**
 * HÀM CHÍNH: đọc 1 câu thông báo cho trẻ.
 * cauNoi: câu chữ đầy đủ (dùng cho giọng máy / giọng mạng).
 * duongDanTep: URL file MP3 của CHÍNH CÂU NÀY, lấy từ Supabase (cột
 *              duong_dan_am_thanh của bảng loi_dong_vien). Chưa có link -> null.
 * khiNoiXong: (NC_03B) hàm chạy khi câu này đọc XONG THẬT SỰ. Nếu tắt tiếng, câu
 *             rỗng, hoặc không có cách nào đọc tiếng Việt -> chạy NGAY LẬP TỨC
 *             (im lặng vẫn coi là "nói xong"), nhờ vậy ván cờ không bao giờ đứng.
 * NGUYÊN TẮC: chỉ đọc khi đọc được TIẾNG VIỆT. File âm thanh CHỈ dùng khi các
 * cách khác thất bại. Không còn cách nào -> IM LẶNG (nút loa sẽ mờ đi).
 */
function boardNoiThongBao(cauNoi, duongDanTep, khiNoiXong) {
  var xong = (typeof khiNoiXong === "function") ? khiNoiXong : null;

  if (!cauNoi) {
    if (xong) xong();
    return;
  }
  if (boardDocCaiDat(BOARD_KHOA_BAT_TIENG, "1") !== "1") {
    if (xong) xong(); // Đang tắt tiếng: coi như đã "nói xong" tức thì
    return;
  }

  boardDungNoiNgay();              // Cắt câu cũ, hủy callback cũ
  var phien = ++boardMaPhienNoi;   // Mã phiên của CÂU NÀY
  boardCallbackNoi = xong;

  boardTimeoutNoiXong = setTimeout(function () {
    boardHoanTatNoi(phien);        // Lưới an toàn: coi như đã đọc xong
  }, boardUocLuongThoiGianNoi(cauNoi));

  var kieu = boardDocCaiDat(BOARD_KHOA_KIEU_GIONG, "tu_dong");

  if (kieu === "may") {
    // Người dùng tự chọn giọng cụ thể -> tôn trọng lựa chọn đó
    boardDocBangGiongMay(cauNoi, phien);
    return;
  }
  if (kieu === "tep") {
    boardPhatTep(duongDanTep, phien);
    return;
  }
  if (kieu === "mang") {
    boardDocBangGiongMang(cauNoi, undefined, duongDanTep, phien);
    return;
  }

  // Kiểu "tu_dong": chọn tầng tốt nhất mà máy này làm được
  if (boardCoWebSpeech && boardGiongDaChon && boardLaGiongViet(boardGiongDaChon)) {
    boardDocBangGiongMay(cauNoi, phien);                 // Tầng 1: giọng Việt cài sẵn
  } else if (!boardGiongMangHong && navigator.onLine !== false) {
    // Tầng 2: giọng mạng; nếu cả 3 nguồn đều lỗi sẽ tự rơi xuống file (tầng 3)
    boardDocBangGiongMang(cauNoi, undefined, duongDanTep, phien);
  } else {
    boardPhatTep(duongDanTep, phien);                    // Tầng 3: file MP3 theo link Supabase
  }
  // Tầng 4: im lặng (boardPhatTep tự gọi boardHoanTatNoi ngay khi link trống)
}

/**
 * Tầng 1: đọc bằng Web Speech API với giọng cài sẵn trên máy.
 * Ở chế độ Tự động, hàm này chỉ được gọi khi giọng là TIẾNG VIỆT.
 * Ở chế độ "Giọng cài trên máy", đọc đúng giọng người dùng đã tự tay chọn.
 *
 * NC_03B: Chrome có lỗi cố hữu - gọi speak() NGAY sau cancel() trong cùng một nhịp
 * thì câu mới bị nuốt mất, không phát ra tiếng nào. Đây chính là lý do lời an ủi
 * "con bị ăn quân" trước đây không bao giờ nghe thấy. Ta lùi speak() lại 80ms.
 */
function boardDocBangGiongMay(cauNoi, phien) {
  if (!boardCoWebSpeech) {
    boardHoanTatNoi(phien);
    return;
  }

  try {
    window.speechSynthesis.cancel(); // Hủy câu đang đọc dở, tránh dồn hàng đợi

    setTimeout(function () {
      if (phien !== boardMaPhienNoi) return; // Đã có câu mới hơn / đã bị dừng

      try {
        var loiNoi = new SpeechSynthesisUtterance(cauNoi);
        if (boardGiongDaChon) {
          loiNoi.voice = boardGiongDaChon;
          loiNoi.lang = boardGiongDaChon.lang;
        } else {
          loiNoi.lang = "vi-VN";
        }
        loiNoi.rate = 0.95;
        loiNoi.onend = function () {
          boardDungWatchdogNoi();
          boardHoanTatNoi(phien);
        };
        loiNoi.onerror = function () {
          boardDungWatchdogNoi();
          boardHoanTatNoi(phien);
        };

        window.speechSynthesis.speak(loiNoi);
        boardBatWatchdogNoi();
      } catch (loiTrong) {
        boardHoanTatNoi(phien);
      }
    }, 80);
  } catch (loi) {
    boardHoanTatNoi(phien); // Không đọc được -> im lặng, nhưng vẫn báo "xong"
  }
}

/**
 * Tầng 3: phát 1 file MP3 trọn câu theo đường dẫn lưu trong Supabase.
 * Link trống hoặc file lỗi -> im lặng (không đọc tiếng Anh thay thế).
 * Mỗi lần gọi hủy file đang phát dở bằng cách tăng mã phiên.
 * NC_03B: mọi lối thoát đều gọi boardHoanTatNoi(phien) để callback không bị mất.
 */
function boardPhatTep(duongDan, phien) {
  if (!duongDan || !String(duongDan).trim()) {
    boardHoanTatNoi(phien); // Im lặng cũng là một cách "nói xong"
    return;
  }

  boardMaPhienTep++;
  var phienTep = boardMaPhienTep;

  try {
    if (!boardAmThanhTep) boardAmThanhTep = new Audio();
    boardAmThanhTep.pause();

    boardAmThanhTep.onerror = function () {
      // File hỏng hoặc link sai -> im lặng
      if (phienTep !== boardMaPhienTep) return;
      boardHoanTatNoi(phien);
    };
    boardAmThanhTep.onended = function () {
      if (phienTep !== boardMaPhienTep) return;
      boardHoanTatNoi(phien);
    };

    if (phienTep !== boardMaPhienTep) return;
    boardAmThanhTep.src = String(duongDan).trim();

    var hua = boardAmThanhTep.play();
    if (hua && hua.catch) {
      hua.catch(function () {
        // Trình duyệt chặn tự động phát -> im lặng lần này
        if (phienTep !== boardMaPhienTep) return;
        boardHoanTatNoi(phien);
      });
    }
  } catch (loi) {
    boardHoanTatNoi(phien);
  }
}

/**
 * Hàm nói 1 câu SỰ KIỆN (bắt đầu ván, thắng, thua, hòa, lên cấp, chào hỏi).
 * Ưu tiên biến thể do quản trị nhập trong bảng loi_dong_vien (theo mã loai);
 * bảng chưa có câu nào thuộc loại đó thì dùng câu mặc định viết sẵn trong code.
 * NC_03B: chuyển tiếp luôn tham số khiNoiXong cho boardNoiThongBao().
 */
function boardNoiCauSuKien(loai, cauMacDinh, khiNoiXong) {
  var loi = boardLayLoiNgauNhien(loai);
  if (loi) {
    boardNoiThongBao(loi.noiDung, loi.duongDanAmThanh, khiNoiXong);
  } else {
    boardNoiThongBao(cauMacDinh, null, khiNoiXong);
  }
}

/**
 * Hàm kiểm tra bảng loi_dong_vien có ÍT NHẤT 1 link file âm thanh nào không
 * (dùng để quyết định nút trợ lý có mờ đi hay không khi máy không đọc được).
 */
function boardCoLinkAmThanhNao() {
  for (var j = 0; j < boardLoiDongVien.length; j++) {
    var link = boardLoiDongVien[j].duongDanAmThanh;
    if (link && String(link).trim()) return true;
  }
  return false;
}

/**
 * Hàm chèn thẻ <meta name="referrer" content="no-referrer"> vào <head>.
 * Lý do: các dịch vụ giọng mạng thường TỪ CHỐI (lỗi 403) khi thấy trang gọi tới là
 * "http://localhost:8000". Bỏ thông tin trang gọi đi thì dịch vụ trả tiếng bình thường.
 * Việc này không ảnh hưởng Supabase (Supabase xác thực bằng khóa, không bằng referrer).
 */
function boardTiemMetaReferrer() {
  if (document.querySelector('meta[name="referrer"]')) return;
  var the = document.createElement("meta");
  the.name = "referrer";
  the.content = "no-referrer";
  document.head.appendChild(the);
}

/**
 * Tầng 2: đọc bằng giọng mạng qua thẻ <audio>.
 * Máy tính không cài giọng tiếng Việt vẫn nghe được giọng Việt thật, chỉ cần Internet.
 * Có 3 nguồn dự phòng: nguồn này lỗi thì tự thử nguồn kế tiếp; hết cả 3 mới chịu thua
 * và rơi xuống tầng 3 (giọng ngoại đọc chữ bỏ dấu).
 *
 * viTriNguon: chỉ số nguồn muốn thử; bỏ trống = dùng nguồn đang chạy tốt.
 * duongDanTep: link file MP3 dự phòng CUỐI CÙNG (từ Supabase) khi cả 3 nguồn hỏng.
 * phien: mã phiên nói (NC_03B) - dùng để báo "đọc xong" đúng câu, bỏ qua câu cũ.
 */
function boardDocBangGiongMang(cauNoi, viTriNguon, duongDanTep, phien) {
  var viTri = (typeof viTriNguon === "number") ? viTriNguon : boardNguonMangDangDung;

  // NC_03B: câu này đã bị hủy (bé chạm bàn cờ / có câu mới) -> thôi, không thử tiếp
  if (phien !== boardMaPhienNoi) return;

  if (viTri >= BOARD_NGUON_GIONG_MANG.length) {
    // Cả 3 nguồn đều hỏng -> ghi nhớ để khỏi thử lại, rơi xuống tầng FILE
    boardGiongMangHong = true;
    boardCapNhatThanhGiong();
    boardPhatTep(duongDanTep, phien);
    return;
  }

  try {
    var chu = cauNoi.length > 190 ? cauNoi.substring(0, 190) : cauNoi;
    if (!boardAmThanhMang) boardAmThanhMang = new Audio();

    boardAmThanhMang.pause();

    // Nguồn này lỗi (403, mất mạng, sai định dạng...) -> thử ngay nguồn kế tiếp
    boardAmThanhMang.onerror = function () {
      boardDocBangGiongMang(cauNoi, viTri + 1, duongDanTep, phien);
    };
    // Phát được -> ghi nhớ nguồn tốt, các câu sau dùng thẳng nguồn này
    boardAmThanhMang.onplaying = function () {
      if (boardNguonMangDangDung !== viTri) {
        boardNguonMangDangDung = viTri;
        boardGiongMangHong = false;
        boardCapNhatThanhGiong();
      }
    };
    // NC_03B: phát hết câu -> báo "đọc xong" để máy được phép đi tiếp
    boardAmThanhMang.onended = function () {
      boardHoanTatNoi(phien);
    };

    boardAmThanhMang.src = BOARD_NGUON_GIONG_MANG[viTri].taoUrl(chu);

    var hua = boardAmThanhMang.play();
    if (hua && hua.catch) {
      hua.catch(function () {
        // Trình duyệt chặn tự động phát (chưa có thao tác của người dùng) -> im lặng lần này
        boardHoanTatNoi(phien);
      });
    }
  } catch (loi) {
    boardDocBangGiongMang(cauNoi, viTri + 1, duongDanTep, phien);
  }
}

/**
 * Vá lỗi Chrome trên máy tính: giọng đọc bị tự ngắt sau khoảng 15 giây.
 * Cứ 5 giây gọi resume() một lần trong lúc đang đọc.
 */
function boardBatWatchdogNoi() {
  boardDungWatchdogNoi();
  boardWatchdogNoi = setInterval(function () {
    if (!boardCoWebSpeech) return boardDungWatchdogNoi();
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.resume();
    } else {
      boardDungWatchdogNoi();
    }
  }, 5000);
}

function boardDungWatchdogNoi() {
  if (boardWatchdogNoi) {
    clearInterval(boardWatchdogNoi);
    boardWatchdogNoi = null;
  }
}

// ================================
// PHẦN 4.7: THANH CÀI ĐẶT GIỌNG (NC_02)
// ================================

/**
 * Hàm dựng thanh cài đặt giọng nói, đặt ngay trên khu vực bàn cờ.
 * Gồm: nút bật/tắt tiếng, chọn kiểu giọng, chọn giọng cụ thể, nút nghe thử,
 * và 1 dòng nhắc nhở tình trạng giọng trên máy này.
 */
function boardTaoThanhCaiDatGiong() {
  if (document.getElementById("boardThanhGiong")) return;

  var thanh = document.createElement("div");
  thanh.id = "boardThanhGiong";
  thanh.className = "boardThanhGiong";

  // 1) Nút bật/tắt tiếng
  var nutTieng = document.createElement("button");
  nutTieng.id = "boardNutBatTieng";
  nutTieng.type = "button";
  nutTieng.addEventListener("click", function () {
    var dangBat = boardDocCaiDat(BOARD_KHOA_BAT_TIENG, "1") === "1";
    boardGhiCaiDat(BOARD_KHOA_BAT_TIENG, dangBat ? "0" : "1");
    // NC_03B: tắt tiếng thì dừng cả giọng máy, giọng mạng lẫn file MP3 đang phát dở
    if (dangBat) boardDungNoiNgay();
    boardCapNhatThanhGiong();
  });
  thanh.appendChild(nutTieng);

  // 2) Chọn kiểu giọng
  var nhanKieu = document.createElement("label");
  nhanKieu.setAttribute("for", "boardChonKieuGiong");
  nhanKieu.textContent = "Kiểu giọng:";
  thanh.appendChild(nhanKieu);

  var chonKieu = document.createElement("select");
  chonKieu.id = "boardChonKieuGiong";
  var cacKieu = [
    { ma: "tu_dong", ten: "Tự động (khuyên dùng)" },
    { ma: "may", ten: "Giọng cài trên máy" },
    { ma: "tep", ten: "File âm thanh (Supabase)" },
    { ma: "mang", ten: "Giọng mạng (cần Internet)" }
  ];
  for (var i = 0; i < cacKieu.length; i++) {
    var luaChon = document.createElement("option");
    luaChon.value = cacKieu[i].ma;
    luaChon.textContent = cacKieu[i].ten;
    chonKieu.appendChild(luaChon);
  }
  chonKieu.addEventListener("change", function () {
    boardGhiCaiDat(BOARD_KHOA_KIEU_GIONG, chonKieu.value);
    // Người dùng chọn lại -> cho thử giọng mạng lần nữa, bắt đầu từ nguồn đầu tiên
    boardGiongMangHong = false;
    boardNguonMangDangDung = 0;
    boardCapNhatThanhGiong();
  });
  thanh.appendChild(chonKieu);

  // 3) Chọn giọng cụ thể (chỉ hiện khi máy có giọng đọc)
  var chonGiong = document.createElement("select");
  chonGiong.id = "boardChonGiong";
  chonGiong.addEventListener("change", function () {
    boardGhiCaiDat(BOARD_KHOA_TEN_GIONG, chonGiong.value);
    boardQuetGiongNoi();
    boardCapNhatThanhGiong();
  });
  thanh.appendChild(chonGiong);

  // 4) Nút nghe thử (cũng là thao tác mở khóa âm thanh cho di động)
  var nutThu = document.createElement("button");
  nutThu.id = "boardNutNgheThu";
  nutThu.type = "button";
  nutThu.textContent = "Nghe thử";
  nutThu.addEventListener("click", function () {
    boardMoKhoaAmThanh();
    boardNoiCauSuKien("chao_hoi", "Xin chào! Chúc con chơi cờ vui vẻ.");
  });
  thanh.appendChild(nutThu);

  // 5) Dòng nhắc tình trạng giọng
  var ghiChu = document.createElement("p");
  ghiChu.id = "boardGhiChuGiong";
  ghiChu.className = "boardGhiChuGiong";
  thanh.appendChild(ghiChu);

  // Đặt thanh này ngay trước khu vực bàn cờ
  var khuVuc = document.getElementById("khuVucBanCoVaThe");
  if (khuVuc && khuVuc.parentNode) {
    khuVuc.parentNode.insertBefore(thanh, khuVuc);
  } else {
    var muc = document.getElementById("section-play");
    if (muc) muc.appendChild(thanh);
  }

  boardCapNhatThanhGiong();
}

/**
 * Hàm vẽ lại thanh cài đặt cho khớp trạng thái hiện tại (giọng vừa nạp xong,
 * người dùng vừa bật/tắt tiếng, giọng mạng vừa lỗi...)
 */
function boardCapNhatThanhGiong() {
  var nutTieng = document.getElementById("boardNutBatTieng");
  var chonKieu = document.getElementById("boardChonKieuGiong");
  var chonGiong = document.getElementById("boardChonGiong");
  var ghiChu = document.getElementById("boardGhiChuGiong");
  if (!nutTieng || !chonKieu || !chonGiong || !ghiChu) return;

  var dangBat = boardDocCaiDat(BOARD_KHOA_BAT_TIENG, "1") === "1";
  nutTieng.textContent = dangBat ? "\uD83E\uDD89 Trợ lý: đang nói" : "\uD83E\uDD89 Trợ lý: im lặng";
  nutTieng.classList.toggle("dangTat", !dangBat);

  var kieu = boardDocCaiDat(BOARD_KHOA_KIEU_GIONG, "tu_dong");
  chonKieu.value = kieu;

  // Danh sách giọng của máy: giọng tiếng Việt xếp trước
  var giongViet = [];
  var giongKhac = [];
  for (var i = 0; i < boardDanhSachGiong.length; i++) {
    if (boardLaGiongViet(boardDanhSachGiong[i])) giongViet.push(boardDanhSachGiong[i]);
    else giongKhac.push(boardDanhSachGiong[i]);
  }
  var tatCa = giongViet.concat(giongKhac);

  chonGiong.innerHTML = "";
  if (tatCa.length === 0) {
    chonGiong.style.display = "none";
  } else {
    chonGiong.style.display = "";
    for (var j = 0; j < tatCa.length; j++) {
      var luaChon = document.createElement("option");
      luaChon.value = tatCa[j].name;
      luaChon.textContent = tatCa[j].name + (boardLaGiongViet(tatCa[j]) ? " (Tiếng Việt)" : " [" + tatCa[j].lang + "]");
      chonGiong.appendChild(luaChon);
    }
    if (boardGiongDaChon) chonGiong.value = boardGiongDaChon.name;
  }

  // Dòng nhắc: giải thích máy này đang đọc bằng cách nào (kèm số liệu để dễ chẩn đoán)
  var soLieu = "Máy này có " + tatCa.length + " giọng, trong đó " + giongViet.length + " giọng tiếng Việt. ";
  var coLink = boardCoLinkAmThanhNao();
  var tenNguon = BOARD_NGUON_GIONG_MANG[boardNguonMangDangDung]
    ? BOARD_NGUON_GIONG_MANG[boardNguonMangDangDung].ten : "?";

  // KHÔNG CÒN CÁCH NÀO phát tiếng Việt trên máy này -> nút loa MỜ ĐI
  // (không giọng Việt cài sẵn + giọng mạng đã hỏng + Supabase chưa điền link nào)
  var khongPhatDuoc = !boardCoGiongViet() && boardGiongMangHong && !coLink;
  nutTieng.classList.toggle("khongPhatDuoc", dangBat && khongPhatDuoc);

  if (!dangBat) {
    ghiChu.textContent = "Đang tắt tiếng.";
  } else if (khongPhatDuoc) {
    ghiChu.textContent = soLieu + "Không có cách nào đọc tiếng Việt trên máy này (giọng mạng bị chặn, chưa có link file âm thanh trong Supabase) nên tạm im lặng.";
  } else if (kieu === "tep") {
    ghiChu.textContent = coLink
      ? "Đang đọc bằng file âm thanh theo đường dẫn trong Supabase. Câu nào chưa có link thì im lặng; câu mô tả nước đi không có file."
      : "Bảng loi_dong_vien chưa có link file âm thanh nào (cột duong_dan_am_thanh) nên chế độ này im lặng.";
  } else if (kieu === "mang") {
    ghiChu.textContent = boardGiongMangHong
      ? soLieu + "Cả 3 nguồn giọng mạng đều bị chặn." + (coLink ? " Đang dự phòng bằng file âm thanh từ Supabase." : "")
      : soLieu + "Đang dùng giọng mạng (" + tenNguon + "): không cần cài gì, nhưng cần Internet.";
  } else if (kieu === "may") {
    ghiChu.textContent = boardCoGiongViet()
      ? soLieu + "Đang đọc bằng giọng tiếng Việt cài sẵn, không cần Internet."
      : soLieu + "Không có giọng tiếng Việt: giọng nước ngoài sẽ đọc sai. Nên chọn \"Tự động\".";
  } else if (boardCoGiongViet()) {
    ghiChu.textContent = soLieu + "Tự động: đang đọc bằng giọng tiếng Việt cài sẵn.";
  } else if (!boardGiongMangHong) {
    ghiChu.textContent = soLieu + "Tự động: đang đọc bằng giọng mạng (" + tenNguon + ").";
  } else {
    ghiChu.textContent = soLieu + "Tự động: giọng mạng bị chặn, đang dự phòng bằng file âm thanh từ Supabase (chỉ câu khen và câu sự kiện có file).";
  }
}

// ================================
// PHẦN 5: CÁC HÀM PHỤ TRỢ GIAO DIỆN VÀ HIỆU ỨNG
// ================================

/**
 * Hàm điền danh sách cấp độ máy vào thẻ <select id="chonLevelMay"> (NC_01)
 * - Chỉ MỞ các cấp <= Level tài khoản; cấp cao hơn bị KHÓA (disabled + ổ khóa).
 * - Mặc định chọn đúng Level hiện tại của người chơi.
 * - Chỉ vẽ lại khi Level thay đổi để không phá lựa chọn đang có của người chơi.
 */
function boardDienLuaChonCapDoMay() {
  var oChon = document.getElementById("chonLevelMay");
  if (!oChon) return;

  var level = boardLayLevelNguoiChoi();
  if (level === boardLevelDaVeSelect) return;
  boardLevelDaVeSelect = level;

  oChon.innerHTML = "";
  for (var i = 1; i <= 20; i++) {
    var luaChon = document.createElement("option");
    luaChon.value = i;

    if (i > level) {
      luaChon.disabled = true;
      luaChon.textContent = "\uD83D\uDD12 Cấp " + i + " (cần Level " + i + ")";
    } else {
      var chuThich = "";
      if (i === 1) chuThich = " (Dễ nhất)";
      else if (i === 20) chuThich = " (Khó nhất)";
      luaChon.textContent = "Cấp " + i + chuThich;
    }
    oChon.appendChild(luaChon);
  }

  if (level >= 1 && level <= 20) oChon.value = level;
}

/**
 * Hàm lấy Level của tài khoản đang đăng nhập (trả về 1 nếu chưa đăng nhập)
 */
function boardLayLevelNguoiChoi() {
  var taiKhoan = (typeof appLayTaiKhoanDangNhap === "function") ? appLayTaiKhoanDangNhap() : null;
  if (taiKhoan && taiKhoan.level) return parseInt(taiKhoan.level, 10) || 1;
  return 1;
}

/**
 * Hàm cập nhật 2 dòng thông tin: lượt đi hiện tại và trạng thái ván
 */
function boardCapNhatThongTinLuot(chuLuotDi, chuTrangThai) {
  var oLuot = document.getElementById("hienThiLuotDi");
  var oTrangThai = document.getElementById("hienThiTrangThaiVan");
  if (oLuot) oLuot.textContent = chuLuotDi;
  if (oTrangThai) oTrangThai.textContent = chuTrangThai;
}

/**
 * Hàm tiêm 1 khối CSS phục vụ hiệu ứng pháo hoa, sấm sét, bóng thoại, thanh giọng.
 * Chỉ tiêm 1 lần duy nhất, không cần sửa file style.css.
 */
function boardTiemCssHieuUng() {
  if (document.getElementById("boardCssHieuUng")) return;
  var the = document.createElement("style");
  the.id = "boardCssHieuUng";
  the.textContent =
    "@keyframes boardBayLen { 0% { transform: translateY(0) scale(0.6); opacity: 1; } 100% { transform: translateY(-160px) scale(1.4); opacity: 0; } }" +
    "@keyframes boardChopSang { 0%,100% { opacity: 0; } 50% { opacity: 0.85; } }" +
    "@keyframes boardNayNhe { 0% { transform: scale(0.96); } 60% { transform: scale(1.03); } 100% { transform: scale(1); } }" +
    ".boardLopHieuUng { position: fixed; left: 0; top: 0; width: 100%; height: 100%; pointer-events: none; z-index: 9999; overflow: hidden; }" +
    ".boardThanhGiong { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 12px 0; padding: 10px 12px; border-radius: 12px; background: #f3f6fb; border: 1px solid #dde3ec; }" +
    ".boardThanhGiong label { font-weight: bold; font-size: 0.92rem; }" +
    ".boardThanhGiong select { padding: 6px 8px; border-radius: 8px; border: 1px solid #c9d2e0; max-width: 220px; font-size: 0.9rem; }" +
    ".boardThanhGiong button { padding: 7px 12px; border-radius: 8px; border: none; cursor: pointer; font-weight: bold; background: #2f6cad; color: #fff; font-size: 0.9rem; }" +
    ".boardThanhGiong button:hover { filter: brightness(1.08); }" +
    ".boardThanhGiong button.dangTat { background: #97a3b4; }" +
    ".boardThanhGiong button.khongPhatDuoc { opacity: 0.4; filter: grayscale(1); }" +
    ".boardGhiChuGiong { flex-basis: 100%; margin: 2px 0 0; font-size: 0.82rem; color: #5b6673; line-height: 1.4; }" +
    // NC_03B: nút "Gợi Ý" nhấp nháy mời bấm, thay cho hộp thoại hỏi đã bỏ.
    // :not(:disabled) để nút đang khóa (lượt máy, hết lượt gợi ý) không nhấp nháy vô duyên.
    "@keyframes boardNutGoiYNhay { 0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.7); } 50% { transform: scale(1.07); box-shadow: 0 0 0 12px rgba(46, 204, 113, 0); } }" +
    "#btnGoiY.boardNutGoiYNhapNhay:not(:disabled) { animation: boardNutGoiYNhay 0.9s ease-in-out infinite; }";
  document.head.appendChild(the);
}

/**
 * Hàm hiệu ứng pháo hoa: bắn 1 loạt emoji bay lên rồi tan biến.
 * NC_03 - ÁP DỤNG TRANG BỊ: nếu tài khoản đã trang bị vật phẩm loại 'hieu_ung' với
 * trangBi.hieu_ung.bieuTuong là 1 mảng emoji, dùng bộ đó thay cho bộ pháo hoa mặc
 * định (ví dụ gán tay: trang_bi->'hieu_ung' = {"bieuTuong":["💎","🌟","⭐"]}).
 */
function boardHieuUngPhaoHoa() {
  var taiKhoan = (typeof appLayTaiKhoanDangNhap === "function") ? appLayTaiKhoanDangNhap() : null;
  var hieuUngTrangBi = (taiKhoan && taiKhoan.trangBi && taiKhoan.trangBi.hieu_ung) || null;
  var cacEmoji = (hieuUngTrangBi && Array.isArray(hieuUngTrangBi.bieuTuong) && hieuUngTrangBi.bieuTuong.length > 0)
    ? hieuUngTrangBi.bieuTuong
    : ["\uD83C\uDF86", "\uD83C\uDF87", "\u2728", "\uD83C\uDF89", "\uD83C\uDF8A"];
  var lop = document.createElement("div");
  lop.className = "boardLopHieuUng";

  for (var i = 0; i < 30; i++) {
    var hat = document.createElement("div");
    hat.textContent = cacEmoji[Math.floor(Math.random() * cacEmoji.length)];
    hat.style.position = "absolute";
    hat.style.left = (Math.random() * 100) + "%";
    hat.style.top = (60 + Math.random() * 30) + "%";
    hat.style.fontSize = (20 + Math.random() * 24) + "px";
    hat.style.animation = "boardBayLen " + (1.2 + Math.random() * 1.2) + "s ease-out forwards";
    hat.style.animationDelay = (Math.random() * 0.6) + "s";
    lop.appendChild(hat);
  }

  document.body.appendChild(lop);
  setTimeout(function () {
    if (lop.parentNode) lop.parentNode.removeChild(lop);
  }, 3000);
}

/**
 * Hàm hiệu ứng sấm sét: chớp trắng toàn màn hình kèm tia sét (mở khóa Lv15)
 */
function boardHieuUngSamSet() {
  var lop = document.createElement("div");
  lop.className = "boardLopHieuUng";
  lop.style.background = "#ffffff";
  lop.style.animation = "boardChopSang 0.5s ease-in-out 2";

  var set = document.createElement("div");
  set.textContent = "\u26A1";
  set.style.position = "absolute";
  set.style.left = "50%";
  set.style.top = "40%";
  set.style.transform = "translate(-50%, -50%)";
  set.style.fontSize = "90px";
  lop.appendChild(set);

  document.body.appendChild(lop);
  setTimeout(function () {
    if (lop.parentNode) lop.parentNode.removeChild(lop);
  }, 1100);
}

/**
 * Hàm hiệu ứng rương kho báu (mốc Level 20): pháo hoa lớn kèm cúp vàng
 */
function boardHieuUngKhoBau() {
  boardHieuUngPhaoHoa();

  var lop = document.createElement("div");
  lop.className = "boardLopHieuUng";

  var cup = document.createElement("div");
  cup.textContent = "\uD83C\uDFC6"; // Cúp vàng
  cup.style.position = "absolute";
  cup.style.left = "50%";
  cup.style.top = "45%";
  cup.style.transform = "translate(-50%, -50%)";
  cup.style.fontSize = "110px";
  cup.style.animation = "boardBayLen 2.4s ease-out forwards";
  lop.appendChild(cup);

  document.body.appendChild(lop);
  setTimeout(function () {
    if (lop.parentNode) lop.parentNode.removeChild(lop);
  }, 2600);
}

// Chạy hàm khởi tạo ngay khi toàn bộ HTML đã được dựng xong
document.addEventListener("DOMContentLoaded", boardKhoiTao);
