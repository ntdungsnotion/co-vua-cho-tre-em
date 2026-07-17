-- ================================================================
-- FILE: supabase_kc00_chuyen_muc_y_tuong.sql
-- BUOC: KC_00
-- NGAY: 17/07/2026
-- MUC DICH: DIEM CHAM WHITELIST SO 1 (Huong Dan 3.5, So Tay muc C1) - them
--   chuyen muc 'thu_thach' vao danh sach hop le cua ham gui_y_tuong de trang
--   thuthach_NC.html cua Kids Challenge co the dung lai RPC nay.
-- KET LUAN KHAO SAT (Huong Dan 1.11): da co san RPC gui_y_tuong tren Co Vua,
--   dung lai duoc, CHI can mo rong danh sach chuyen muc hop le - KHONG tao
--   doi tuong SQL moi. Day la 1 trong 2 diem cham whitelist da duoc nguoi
--   dung duyet truoc (xem So Tay muc C).
-- CACH CHAM (dung luat 1.10): CREATE OR REPLACE lai toan bo ham, CHI doi 2
--   dong kiem tra chuyen muc; MOI phan con lai giu NGUYEN VAN theo ban goc
--   chep trong So Tay muc C1 (nguon: supabase_nang_cap.sql V6, dong 1526-1559).
--   Grant san co cho anon giu nguyen (CREATE OR REPLACE khong lam mat grant).
-- AN TOAN: file idempotent - dan chay lai nhieu lan khong hong du lieu.
-- SAU KHI CHAY, BAT BUOC TEST CHEO (luat 1.10d):
--   1. Gui y tuong tu trang Co Vua (chuyen muc cu hoc_tap/kham_pha/tro_choi)
--      van chay binh thuong.
--   2. Gui y tuong chuyen muc thu_thach tu trang Kids Challenge -> thanh cong.
--   3. admin_lay_y_tuong (trang Quan Tri Co Vua) thay duoc y tuong chuyen
--      muc thu_thach moi gui.
-- ================================================================

create or replace function gui_y_tuong(p_ten text, p_chuyen_muc text, p_noi_dung text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ton_tai int;
  v_toi_da  int;
begin
  select count(*) into v_ton_tai from tai_khoan where ten_dang_nhap = p_ten;
  if v_ton_tai = 0 then
    return json_build_object('thanhCong', false, 'thongBao', 'Khong tim thay tai khoan: ' || p_ten);
  end if;

  if p_chuyen_muc not in ('hoc_tap', 'kham_pha', 'tro_choi', 'thu_thach') then
    return json_build_object('thanhCong', false, 'thongBao', 'Chuyen muc phai la hoc_tap, kham_pha, tro_choi hoac thu_thach');
  end if;

  select coalesce((select gia_tri::int from cau_hinh_chung where khoa = 'y_tuong_do_dai_toi_da'), 500) into v_toi_da;

  if p_noi_dung is null or length(trim(p_noi_dung)) = 0 then
    return json_build_object('thanhCong', false, 'thongBao', 'Vui long nhap noi dung y tuong');
  end if;
  if length(p_noi_dung) > v_toi_da then
    return json_build_object('thanhCong', false, 'thongBao', 'Y tuong dai qua ' || v_toi_da || ' ky tu, hay viet ngan lai nhe');
  end if;

  insert into y_tuong (ten_dang_nhap, chuyen_muc, noi_dung)
    values (p_ten, p_chuyen_muc, trim(p_noi_dung));

  return json_build_object('thanhCong', true, 'thongBao', 'Da gui y tuong, cam on con!');
end;
$$;

-- ================================================================
-- 17/07/2026 - BUOC: KC_00
-- ================================================================
