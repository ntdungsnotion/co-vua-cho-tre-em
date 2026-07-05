// ================================
// FILE: board.js
// CHỨC NĂNG: Bàn cờ vua thực tế, AI Stockfish 20 cấp độ, hiệu ứng thắng/thua và mở khóa
// BƯỚC: MIG_04
// QUY ƯỚC TÊN HÀM/BIẾN: tất cả bắt đầu bằng "board" để tránh xung đột
// PHỤ THUỘC:
//   - chess.js (đã nạp sẵn trong index.html, biến toàn cục "Chess")
//   - app.js: appLayTaiKhoanDangNhap(), appCapNhatTaiKhoanSauVanCo({levelMoi, diemMoi})
//   - api.js: apiCapNhatDiem(tenDangNhap, ketQua, levelMay)
// Thứ tự nạp trong index.html: config -> api -> app -> auth -> board -> rank
// ================================

// ----- Biến trạng thái ván cờ -----
var boardGame = null;            // Đối tượng Chess() đang chơi
var boardODangChon = null;       // Ô người chơi vừa bấm để chọn quân (ví dụ "e2"), null nếu chưa chọn
var boardCacNuocHopLe = [];      // Danh sách ô đích hợp lệ của quân đang chọn (để tô sáng)
var boardKetThuc = true;         // true = chưa có ván nào hoặc ván đã xong -> không cho bấm
var boardDangChoAI = false;      // true = đang chờ máy tính đi, chặn người chơi bấm
var boardLevelMay = 1;           // Cấp độ máy (đối thủ) của ván hiện tại
var boardTimeoutAI = null;       // Bộ đếm giờ dự phòng nếu engine không trả lời

// ----- Biến liên quan bộ não AI (Stockfish) -----
var boardEngine = null;          // Web Worker chứa engine Stockfish
var boardEngineSanSang = false;  // true nếu engine tải xong và sẵn sàng nhận lệnh

// ----- Người chơi luôn cầm quân Trắng (đi trước), máy tính cầm quân Đen -----
var BOARD_MAU_NGUOI = "w";
var BOARD_MAU_MAY = "b";

// ----- Bộ ký tự quân cờ mặc định (dùng ký tự cờ vua Unicode) -----
var BOARD_QUAN_MAC_DINH = { k: "\u265A", q: "\u265B", r: "\u265C", b: "\u265D", n: "\u265E", p: "\u265F" };
// ----- Bộ quân cờ hình động vật (mở khóa ở Level 10) -----
var BOARD_QUAN_DONG_VAT = { k: "\uD83E\uDD81", q: "\uD83E\uDD84", r: "\uD83D\uDC18", b: "\uD83E\uDD8A", n: "\uD83D\uDC0E", p: "\uD83D\uDC24" };

/**
 * Hàm khởi tạo module bàn cờ, chạy khi trang tải xong
 * Điền 20 lựa chọn cấp độ máy, gán sự kiện nút, tiêm CSS hiệu ứng, tạo engine
 */
function boardKhoiTao() {
  boardTiemCssHieuUng();
  boardDienLuaChonCapDoMay();

  var nutBatDau = document.getElementById("btnBatDauVan");
  if (nutBatDau) {
    nutBatDau.addEventListener("click", boardBatDauVanMoi);
  }

  // Tạo sẵn bộ não AI ngay từ đầu để lúc chơi khỏi phải chờ tải
  boardTaoEngine();

  // Vẽ sẵn 1 bàn cờ trạng thái ban đầu cho dễ nhìn (chưa tính điểm)
  boardGame = new Chess();
  boardKetThuc = true;
  boardVeBanCo();
  boardCapNhatThongTinLuot("Bấm \"Bắt Đầu Ván Mới\" để chơi", "Chưa bắt đầu");
}

// ================================
// PHẦN 1: KHỞI TẠO VÀ ĐIỀU KHIỂN BỘ NÃO AI (STOCKFISH)
// ================================

/**
 * Hàm tạo engine Stockfish bằng cách nạp file asm.js từ CDN vào trong 1 Web Worker.
 * Mẹo: trình duyệt không cho tạo Worker trực tiếp từ URL khác miền, nhưng bên trong
 * Worker lại được phép dùng importScripts() để nạp file khác miền -> ta bọc lại bằng Blob.
 * Nếu tạo thất bại (mạng chặn, môi trường hạn chế...) thì boardEngineSanSang = false,
 * lúc đó AI sẽ tự động chuyển sang đánh nước hợp lệ ngẫu nhiên để ván cờ vẫn chơi được.
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
      // Nếu engine lỗi giữa chừng, đánh dấu là không sẵn sàng để chuyển sang chế độ dự phòng
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
 * Hàm nhận mỗi tin nhắn từ engine Stockfish trả về (dạng chuỗi văn bản UCI)
 * Ta chỉ quan tâm dòng bắt đầu bằng "bestmove" (nước đi tốt nhất engine chọn)
 */
function boardXuLyPhanHoiEngine(suKien) {
  var duLieu = suKien.data;
  if (typeof duLieu !== "string") return;

  if (duLieu.indexOf("bestmove") === 0) {
    // Ví dụ: "bestmove e7e5 ponder d2d4" -> lấy phần tử thứ 2 là nước đi
    var cacPhan = duLieu.split(" ");
    var nuocUci = cacPhan[1];
    boardApDungNuocAiAnToan(nuocUci);
  }
}

/**
 * Hàm gửi cấu hình độ khó cho engine dựa theo cấp độ máy (1..20)
 * Stockfish có tham số "Skill Level" từ 0 (yếu nhất) đến 20 (mạnh nhất)
 * Ta ánh xạ cấp 1..20 của webapp thành Skill Level 0..20 cho tương ứng
 */
function boardCauHinhDoKho(capDoMay) {
  if (!boardEngineSanSang || !boardEngine) return;

  // Cấp 1 -> Skill 0, Cấp 20 -> Skill 20 (chia đều)
  var skill = Math.round((capDoMay - 1) * 20 / 19);
  if (skill < 0) skill = 0;
  if (skill > 20) skill = 20;

  boardEngine.postMessage("ucinewgame");
  boardEngine.postMessage("setoption name Skill Level value " + skill);
  boardEngine.postMessage("isready");
}

/**
 * Hàm tính thời gian suy nghĩ (mili giây) cho máy theo cấp độ
 * Cấp càng cao máy nghĩ càng lâu -> chơi mạnh hơn, nhưng vẫn giới hạn để trẻ em không phải chờ lâu
 */
function boardThoiGianSuyNghi(capDoMay) {
  var ms = 200 + capDoMay * 50; // Cấp 1 ~ 250ms, Cấp 20 ~ 1200ms
  if (ms > 1200) ms = 1200;
  return ms;
}

// ================================
// PHẦN 2: BẮT ĐẦU VÁN, VẼ BÀN CỜ, XỬ LÝ NƯỚC ĐI CỦA NGƯỜI CHƠI
// ================================

/**
 * Hàm bắt đầu 1 ván cờ mới khi người chơi bấm nút "Bắt Đầu Ván Mới"
 */
function boardBatDauVanMoi() {
  var oChonLevel = document.getElementById("chonLevelMay");
  boardLevelMay = oChonLevel ? parseInt(oChonLevel.value, 10) : 1;
  if (!boardLevelMay || boardLevelMay < 1) boardLevelMay = 1;

  boardGame = new Chess();      // Ván cờ mới tinh
  boardODangChon = null;
  boardCacNuocHopLe = [];
  boardKetThuc = false;
  boardDangChoAI = false;

  // Ẩn khung kết quả của ván trước (nếu đang hiện)
  var khungKetQua = document.getElementById("thongBaoKetQuaVan");
  if (khungKetQua) {
    khungKetQua.style.display = "none";
    khungKetQua.classList.remove("thang", "thua");
  }
  var khungMoc = document.getElementById("hieuUngDatMocMoi");
  if (khungMoc) khungMoc.style.display = "none";

  // Cấu hình độ khó cho engine ứng với cấp độ máy vừa chọn
  boardCauHinhDoKho(boardLevelMay);

  boardVeBanCo();
  boardCapNhatThongTinLuot("Đến lượt bạn (Quân Trắng)", "Đang chơi");
}

/**
 * Hàm vẽ toàn bộ bàn cờ 8x8 vào khung #banCo dựa theo trạng thái boardGame hiện tại
 * Tự động áp dụng phần thưởng mở khóa: màu bàn cờ mới (Lv5), quân động vật (Lv10)
 */
function boardVeBanCo() {
  var khungBanCo = document.getElementById("banCo");
  if (!khungBanCo || !boardGame) return;

  // Lấy level tài khoản để biết đã mở khóa những gì
  var level = boardLayLevelNguoiChoi();
  var dungMauMoi = level >= 5;      // Mốc Level 5: màu bàn cờ mới
  var dungQuanDongVat = level >= 10; // Mốc Level 10: bộ quân cờ hình động vật

  var mauSang = dungMauMoi ? "#e8f4ff" : "#f0d9b5";
  var mauToi = dungMauMoi ? "#5b8def" : "#b58863";

  // Dùng CSS Grid 8x8 lấp đầy khung #banCo
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

      // Màu nền ô sáng/tối xen kẽ
      var laOSang = (hang + cot) % 2 === 0;
      oVuong.style.backgroundColor = laOSang ? mauSang : mauToi;
      oVuong.style.display = "flex";
      oVuong.style.alignItems = "center";
      oVuong.style.justifyContent = "center";
      oVuong.style.cursor = boardKetThuc ? "default" : "pointer";
      oVuong.style.position = "relative";
      oVuong.style.fontSize = "clamp(22px, 7vw, 44px)";
      oVuong.style.lineHeight = "1";

      // Tô sáng ô đang được chọn
      if (tenO === boardODangChon) {
        oVuong.style.boxShadow = "inset 0 0 0 4px rgba(255, 183, 3, 0.9)";
      }

      // Vẽ quân cờ nếu ô này có quân
      var quan = luoiQuan[hang][cot];
      if (quan) {
        var oQuan = boardTaoPhanTuQuan(quan, dungQuanDongVat);
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
          // Ô có quân đích (ăn quân): vẽ vòng tròn viền đỏ
          cham.style.border = "4px solid rgba(46, 204, 113, 0.9)";
          cham.style.background = "transparent";
        } else {
          // Ô trống: vẽ chấm tròn mờ
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
}

/**
 * Hàm tạo 1 phần tử hiển thị quân cờ (chữ Unicode hoặc emoji động vật)
 * Nhận vào: quan = { type: "p/n/b/r/q/k", color: "w/b" }, coDungDongVat = true/false
 */
function boardTaoPhanTuQuan(quan, coDungDongVat) {
  var oQuan = document.createElement("span");
  oQuan.style.pointerEvents = "none";
  oQuan.style.display = "flex";
  oQuan.style.alignItems = "center";
  oQuan.style.justifyContent = "center";

  if (coDungDongVat) {
    // Dùng emoji động vật, phân biệt 2 bên bằng màu nền vòng tròn
    oQuan.textContent = BOARD_QUAN_DONG_VAT[quan.type];
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
    // Dùng ký tự cờ vua Unicode, tô màu trắng/đen rõ ràng
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
 * Lần 1: chọn quân của mình -> hiện các nước đi hợp lệ
 * Lần 2: bấm ô đích hợp lệ -> thực hiện nước đi
 */
function boardXuLyBamO(tenO) {
  // Chặn bấm khi ván chưa bắt đầu / đã kết thúc / đang chờ máy đi
  if (boardKetThuc || boardDangChoAI || !boardGame) return;
  // Chỉ cho người chơi đi khi đến lượt Trắng
  if (boardGame.turn() !== BOARD_MAU_NGUOI) return;

  // Nếu đang có quân được chọn và ô vừa bấm nằm trong nước hợp lệ -> đi quân
  if (boardODangChon && boardCacNuocHopLe.indexOf(tenO) !== -1) {
    boardThucHienNuocNguoi(boardODangChon, tenO);
    return;
  }

  // Ngược lại: thử chọn quân tại ô vừa bấm (phải là quân Trắng của người chơi)
  var quanTaiO = boardGame.get(tenO);
  if (quanTaiO && quanTaiO.color === BOARD_MAU_NGUOI) {
    boardODangChon = tenO;
    // Lấy danh sách ô đích hợp lệ từ quân này
    var cacNuoc = boardGame.moves({ square: tenO, verbose: true });
    boardCacNuocHopLe = cacNuoc.map(function (nuoc) { return nuoc.to; });
  } else {
    // Bấm ra ngoài hoặc ô trống -> bỏ chọn
    boardODangChon = null;
    boardCacNuocHopLe = [];
  }
  boardVeBanCo();
}

/**
 * Hàm thực hiện nước đi của người chơi từ ô "từ" đến ô "đến"
 * Tự động phong cấp Hậu ("q") để đơn giản cho trẻ em
 */
function boardThucHienNuocNguoi(oTu, oDen) {
  var nuoc = boardGame.move({ from: oTu, to: oDen, promotion: "q" });

  // Bỏ chọn sau khi đi
  boardODangChon = null;
  boardCacNuocHopLe = [];

  if (!nuoc) {
    // Nước không hợp lệ (hiếm khi xảy ra) -> chỉ vẽ lại
    boardVeBanCo();
    return;
  }

  boardVeBanCo();

  // Nếu nước đi của người chơi gây chiếu tướng -> hiệu ứng sấm sét (mở khóa Lv15)
  if (boardGame.in_check() && boardLayLevelNguoiChoi() >= 15) {
    boardHieuUngSamSet();
  }

  // Kiểm tra ván đã kết thúc chưa sau nước của người chơi
  if (boardKiemTraKetThuc()) return;

  // Chưa kết thúc -> đến lượt máy tính suy nghĩ
  boardYeuCauAiDiChuyen();
}

// ================================
// PHẦN 3: LƯỢT ĐI CỦA MÁY TÍNH (AI)
// ================================

/**
 * Hàm yêu cầu máy tính (AI) tìm nước đi
 * Nếu engine sẵn sàng: gửi thế cờ hiện tại cho Stockfish tính
 * Nếu không: dùng nước đi ngẫu nhiên hợp lệ làm dự phòng
 * Luôn đặt 1 bộ đếm giờ: nếu engine "im lặng" quá lâu thì tự đánh dự phòng
 */
function boardYeuCauAiDiChuyen() {
  boardDangChoAI = true;
  boardCapNhatThongTinLuot("Máy tính đang suy nghĩ...", "Đang chơi");
  boardVeBanCo(); // Vẽ lại để con trỏ chuyển thành "không bấm được"

  if (boardEngineSanSang && boardEngine) {
    var thoiGian = boardThoiGianSuyNghi(boardLevelMay);
    boardEngine.postMessage("position fen " + boardGame.fen());
    boardEngine.postMessage("go movetime " + thoiGian);

    // Dự phòng: nếu sau (thoiGian + 3 giây) vẫn chưa có bestmove -> tự đánh ngẫu nhiên
    if (boardTimeoutAI) clearTimeout(boardTimeoutAI);
    boardTimeoutAI = setTimeout(function () {
      boardApDungNuocAiAnToan(null); // null -> ép dùng nước ngẫu nhiên
    }, thoiGian + 3000);
  } else {
    // Không có engine: chờ 1 chút cho giống thật rồi đánh ngẫu nhiên
    setTimeout(function () {
      boardApDungNuocAiAnToan(null);
    }, 500);
  }
}

/**
 * Hàm áp dụng nước đi của máy 1 cách "an toàn" (chống bị gọi 2 lần)
 * Nếu nuocUci hợp lệ thì dùng, ngược lại (null hoặc lỗi) thì đánh nước ngẫu nhiên hợp lệ
 */
function boardApDungNuocAiAnToan(nuocUci) {
  // Nếu không còn ở trạng thái chờ AI (đã xử lý rồi) thì bỏ qua
  if (!boardDangChoAI || boardKetThuc || !boardGame) return;
  boardDangChoAI = false;
  if (boardTimeoutAI) {
    clearTimeout(boardTimeoutAI);
    boardTimeoutAI = null;
  }

  var nuocDaDi = null;

  if (nuocUci && nuocUci.length >= 4 && nuocUci !== "(none)") {
    // Tách chuỗi UCI: 2 ký tự đầu là ô đi, 2 ký tự tiếp là ô đến, ký tự 5 (nếu có) là phong cấp
    var oTu = nuocUci.substring(0, 2);
    var oDen = nuocUci.substring(2, 4);
    var phongCap = nuocUci.length > 4 ? nuocUci.substring(4, 5) : "q";
    nuocDaDi = boardGame.move({ from: oTu, to: oDen, promotion: phongCap });
  }

  // Nếu chưa đi được (engine lỗi hoặc dự phòng) -> chọn ngẫu nhiên 1 nước hợp lệ
  if (!nuocDaDi) {
    var cacNuoc = boardGame.moves({ verbose: true });
    if (cacNuoc.length > 0) {
      var chon = cacNuoc[Math.floor(Math.random() * cacNuoc.length)];
      nuocDaDi = boardGame.move({ from: chon.from, to: chon.to, promotion: "q" });
    }
  }

  boardVeBanCo();

  // Sấm sét nếu máy chiếu tướng người chơi và đã mở khóa Lv15
  if (boardGame.in_check() && boardLayLevelNguoiChoi() >= 15) {
    boardHieuUngSamSet();
  }

  // Kiểm tra kết thúc; nếu chưa thì trả lượt lại cho người chơi
  if (boardKiemTraKetThuc()) return;
  boardCapNhatThongTinLuot("Đến lượt bạn (Quân Trắng)", "Đang chơi");
  boardVeBanCo();
}

// ================================
// PHẦN 4: KIỂM TRA KẾT THÚC VÁN VÀ CHẤM ĐIỂM
// ================================

/**
 * Hàm kiểm tra ván cờ đã kết thúc chưa
 * Trả về true nếu đã kết thúc (và đã xử lý chấm điểm), false nếu vẫn còn chơi
 */
function boardKiemTraKetThuc() {
  if (!boardGame.game_over()) return false;

  boardKetThuc = true;
  boardDangChoAI = false;

  var ketQua;    // "thang" hoặc "thua" gửi về máy chủ
  var laHoa = false;
  var thongBao;

  if (boardGame.in_checkmate()) {
    // Bên đang tới lượt bị chiếu bí. Nếu là quân Đen (máy) bị chiếu bí -> người chơi THẮNG
    if (boardGame.turn() === BOARD_MAU_MAY) {
      ketQua = "thang";
      thongBao = "Bạn đã CHIẾU BÍ thành công! Chiến thắng rực rỡ!";
    } else {
      ketQua = "thua";
      thongBao = "Máy tính đã chiếu bí. Cố gắng lần sau nhé!";
    }
  } else {
    // Các trường hợp hòa: hết nước đi (stalemate), lặp nước, không đủ quân, luật 50 nước
    laHoa = true;
    ketQua = "thua"; // Hòa: không lên cấp, nhưng vẫn được cộng điểm khích lệ (giống thua)
    thongBao = "Ván cờ HÒA! Bạn nhận điểm khích lệ.";
  }

  boardCapNhatThongTinLuot(thongBao, laHoa ? "Hòa cờ" : "Kết thúc");
  boardGuiKetQuaLenMayChu(ketQua, laHoa, thongBao);
  return true;
}

/**
 * Hàm gửi kết quả ván cờ lên máy chủ (api.js -> apiCapNhatDiem) để cập nhật điểm và cấp độ
 * Sau khi có phản hồi: hiện khung kết quả, cập nhật Dashboard, bật hiệu ứng nếu đạt mốc mới
 */
function boardGuiKetQuaLenMayChu(ketQua, laHoa, thongBaoThangThua) {
  var taiKhoan = (typeof appLayTaiKhoanDangNhap === "function") ? appLayTaiKhoanDangNhap() : null;
  if (!taiKhoan) {
    // Trường hợp hiếm: chưa đăng nhập mà vẫn vào được màn chơi -> chỉ hiện kết quả cơ bản
    boardHienKhungKetQua(thongBaoThangThua, laHoa, ketQua, null);
    return;
  }

  apiCapNhatDiem(taiKhoan.tenDangNhap, ketQua, boardLevelMay).then(function (phanHoi) {
    if (phanHoi && phanHoi.thanhCong && phanHoi.ketQuaCapNhat) {
      boardHienKhungKetQua(thongBaoThangThua, laHoa, ketQua, phanHoi.ketQuaCapNhat);

      // Đồng bộ lại dữ liệu tài khoản (điểm/level mới) lên Dashboard qua app.js
      if (typeof appCapNhatTaiKhoanSauVanCo === "function") {
        appCapNhatTaiKhoanSauVanCo({
          levelMoi: phanHoi.ketQuaCapNhat.levelMoi,
          diemMoi: phanHoi.ketQuaCapNhat.diemMoi
        });
      }
    } else {
      // Máy chủ báo lỗi -> vẫn hiện kết quả nhưng không có số liệu cập nhật
      boardHienKhungKetQua(thongBaoThangThua, laHoa, ketQua, null);
    }
  });
}

/**
 * Hàm hiện khung kết quả ván (#thongBaoKetQuaVan) và đổ số liệu từ api.js vào
 * Nếu thắng: bắn pháo hoa. Nếu đạt mốc Level đặc biệt: hiện hiệu ứng mốc + thông báo mở khóa
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
    // Hòa cũng dùng khung màu "thua" cho nhẹ nhàng (màu trung tính)
    khung.classList.add(ketQua === "thang" ? "thang" : "thua");
  }

  // Thắng thì bắn pháo hoa ăn mừng
  if (ketQua === "thang" && !laHoa) {
    boardHieuUngPhaoHoa();
  }

  // Xử lý hiệu ứng khi vừa đạt mốc Level đặc biệt (5, 10, 15, 20)
  if (khungMoc) {
    if (ketQuaCapNhat && ketQuaCapNhat.vuaDatMocMoi) {
      var levelMoi = ketQuaCapNhat.levelMoi;
      khungMoc.style.display = "block";
      khungMoc.textContent = boardThongBaoMocMoi(levelMoi);
      // Mốc Level 20: rương kho báu (pháo hoa lớn + cúp vàng)
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
// PHẦN 5: CÁC HÀM PHỤ TRỢ GIAO DIỆN VÀ HIỆU ỨNG
// ================================

/**
 * Hàm điền 20 lựa chọn cấp độ máy vào thẻ <select id="chonLevelMay">
 * Mặc định chọn đúng Level hiện tại của người chơi (nếu đã đăng nhập)
 */
function boardDienLuaChonCapDoMay() {
  var oChon = document.getElementById("chonLevelMay");
  if (!oChon) return;

  oChon.innerHTML = "";
  for (var i = 1; i <= 20; i++) {
    var luaChon = document.createElement("option");
    luaChon.value = i;
    var chuThich = "";
    if (i === 1) chuThich = " (Dễ nhất)";
    else if (i === 20) chuThich = " (Khó nhất)";
    luaChon.textContent = "Cấp " + i + chuThich;
    oChon.appendChild(luaChon);
  }

  // Mặc định chọn bằng Level của người chơi để thắng là lên cấp hợp lý
  var level = boardLayLevelNguoiChoi();
  if (level >= 1 && level <= 20) {
    oChon.value = level;
  }
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
 * Hàm tiêm 1 khối CSS (keyframes) phục vụ các hiệu ứng pháo hoa, sấm sét...
 * Chỉ tiêm 1 lần duy nhất. Làm cách này để không cần tạo thêm file CSS riêng.
 */
function boardTiemCssHieuUng() {
  if (document.getElementById("boardCssHieuUng")) return;
  var the = document.createElement("style");
  the.id = "boardCssHieuUng";
  the.textContent =
    "@keyframes boardBayLen { 0% { transform: translateY(0) scale(0.6); opacity: 1; } 100% { transform: translateY(-160px) scale(1.4); opacity: 0; } }" +
    "@keyframes boardChopSang { 0%,100% { opacity: 0; } 50% { opacity: 0.85; } }" +
    ".boardLopHieuUng { position: fixed; left: 0; top: 0; width: 100%; height: 100%; pointer-events: none; z-index: 9999; overflow: hidden; }";
  document.head.appendChild(the);
}

/**
 * Hàm hiệu ứng pháo hoa: bắn 1 loạt emoji bay lên rồi tan biến
 */
function boardHieuUngPhaoHoa() {
  var cacEmoji = ["\uD83C\uDF86", "\uD83C\uDF87", "\u2728", "\uD83C\uDF89", "\uD83C\uDF8A"];
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
 * Hàm hiệu ứng sấm sét: chớp trắng toàn màn hình kèm biểu tượng tia sét (mở khóa Lv15)
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