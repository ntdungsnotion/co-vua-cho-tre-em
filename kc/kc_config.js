// ================================================================
// FILE: kc_config.js
// CHỨC NĂNG: Kết nối Supabase RIÊNG của Kids Challenge (dùng CHUNG project
//            Supabase với webapp Cờ Vua, nhưng đây là bản cấu hình ĐỘC LẬP -
//            không nạp file config.js của Cờ Vua, theo kiến trúc HƯỚNG DẪN
//            mục 2: "Frontend HOÀN TOÀN RIÊNG").
// BƯỚC: KC_00
// NGÀY: 17/07/2026
// PHỤ THUỘC: thư viện supabase-js phải được nạp TRƯỚC file này, ví dụ:
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
// GHI CHÚ: 2 giá trị bên dưới COPY NGUYÊN từ config.js của repo Cờ Vua (cùng
//   một project Supabase - xem Sổ Tay Tham Khảo mục A6). Khóa anon là khóa
//   công khai, an toàn khi đặt trong file giao diện vì đã có RLS + RPC bảo vệ.
// ================================================================

var KC_CONFIG_SUPABASE_URL = "https://tstmjkacbglbcoqgvcnu.supabase.co";
var KC_CONFIG_SUPABASE_ANON_KEY = "sb_publishable_PS85mAD6PI5oK6QHJH3inw_qXxar3BW";

// Biến "supabase" là biến toàn cục do thư viện supabase-js (CDN) cung cấp.
// Đặt tên client là "kcSupabaseClient" (KHÔNG phải "supabaseClient" như bên
// Cờ Vua) để không bao giờ nhầm lẫn nếu sau này có ai vô tình nạp cả 2 bộ
// file trên cùng 1 trang.
var kcSupabaseClient = supabase.createClient(KC_CONFIG_SUPABASE_URL, KC_CONFIG_SUPABASE_ANON_KEY);
