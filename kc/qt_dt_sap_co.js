// ================================================================
// FILE: kc/qt_dt_sap_co.js
// CHỨC NĂNG: Các mục ĐẶT CHỖ TRƯỚC của nhóm "⚔️ Đấu Trường Tri Thức" trong trang quản trị (TC_D18A): mới chỉ có tên trên
//   thanh bên + thẻ "sắp có". Khi làm thật một mục: viết file riêng (vd qt_dt_cau_hoi.js) gọi QDT.dangKyMuc với dung / mo,
//   thêm dòng <script> vào quantri_NC.html và XOÁ dòng đặt chỗ tương ứng ở đây.
// BƯỚC: TC_D18A - NGÀY: 10/11/2026
// PHỤ THUỘC: qt_dt_khung.js (QDT).
// ================================================================

QDT.dangKyMuc({
  ma: "cauhoi", ten: "Câu hỏi", bieuTuong: "❓", sapCo: true,
  moTa: "Kho câu hỏi của Đấu Trường.",
  seCo: ["Duyệt câu thành lũy bé tự gõ", "Soạn câu hỏi tay, xem trước cả khổ điện thoại", "Bật / tắt từng dạng câu sinh tự động", "Xem trình độ từng bé"]
});
QDT.dangKyMuc({
  ma: "quandoi", ten: "Tướng & lính", bieuTuong: "🧙", sapCo: true,
  moTa: "Danh mục tướng, lính và kỹ năng.",
  seCo: ["Danh mục tướng chiêu mộ: máu, công, thủ, kỹ năng, giá", "Lính cung, kỵ binh, bộ binh: chỉ số và giá huấn luyện", "Cấp (Lv) Thủ lĩnh: điểm cần cho mỗi cấp"]
});
QDT.dangKyMuc({
  ma: "thoiky", ten: "Thời kỳ", bieuTuong: "🏛️", sapCo: true,
  moTa: "Bốn thời kỳ và điều kiện lên thời kỳ.",
  seCo: ["Tài nguyên cần để lên thời kỳ", "Tên, danh hiệu, phát minh của từng thời kỳ"]
});
