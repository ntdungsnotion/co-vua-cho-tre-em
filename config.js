// ================================
// FILE: config.js
// CHUC NANG: Luu thong tin ket noi Supabase va tao supabase client dung chung
// BUOC: MIG_02
// PHU THUOC: thu vien supabase-js phai duoc nap TRUOC file nay trong index.html
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
// ================================

// Dia chi goc cua du an Supabase (KHONG kem /rest/v1/)
var CONFIG_SUPABASE_URL = "https://tstmjkacbglbcoqgvcnu.supabase.co";

// Khoa anon cong khai (an toan khi dat trong file giao dien, nho co RLS bao ve)
var CONFIG_SUPABASE_ANON_KEY = "sb_publishable_PS85mAD6PI5oK6QHJH3inw_qXxar3BW";

// Tao supabase client dung chung cho toan bo webapp
// Bien "supabase" la bien toan cuc do thu vien supabase-js (CDN) cung cap
var supabaseClient = supabase.createClient(CONFIG_SUPABASE_URL, CONFIG_SUPABASE_ANON_KEY);