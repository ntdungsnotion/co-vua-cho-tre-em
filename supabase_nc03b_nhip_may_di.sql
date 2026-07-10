-- ============================================================
-- FILE: supabase_nc03b_nhip_may_di.sql
-- BUOC: NC_03B (sua loi trai nghiem cua NC_03)
-- CHUC NANG:
--   1) Them 4 khoa cau hinh dieu khien "thoi gian nghi toi thieu" cua may
--      => may khong con di tuc thi, giong nhu dang doi voi mot ban nho.
--   2) Bao dam bang loi_dong_vien co du cau 'bi_an_quan' va 'bi_chieu'
--      (loi an ui khi be bi may an quan / bi chieu tuong).
--
-- AN TOAN: file nay CHAY LAI NHIEU LAN VAN DUOC (idempotent).
--   - ON CONFLICT DO NOTHING: khoa/cau da co thi giu nguyen gia tri dang dung,
--     KHONG ghi de len con so ma quan tri da tu chinh trong Table Editor.
--
-- CACH CHAY: Supabase Dashboard -> SQL Editor -> dan toan bo file -> Run.
-- KHONG can sua code sau khi chay.
-- ============================================================


-- ------------------------------------------------------------
-- PHAN 1: NHIP DI CUA MAY (cau_hinh_chung)
-- ------------------------------------------------------------
-- Cong thuc board.js dung moi luot may:
--   thoi_gian_nghi = may_nghi_toi_thieu_ms
--                  + (cap_may - 1) * may_nghi_moi_cap_ms
--                  + ngau_nhien(0 .. may_nghi_ngau_nhien_ms)
--   va bi chan tran boi may_nghi_toi_da_ms
--
-- Voi gia tri mac dinh ben duoi:
--   Cap 1  ~ 1,2 - 1,9 giay
--   Cap 10 ~ 1,7 - 2,4 giay
--   Cap 20 ~ 2,3 - 3,0 giay
--
-- MUON MAY DI CHAM HON: tang may_nghi_toi_thieu_ms (vi du 2000).
-- MUON MAY DI NHANH HON: giam may_nghi_toi_thieu_ms (vi du 600).
-- Dat may_nghi_ngau_nhien_ms = 0 thi nhip di deu tam tap (it giong nguoi that hon).
-- ------------------------------------------------------------

insert into cau_hinh_chung (khoa, gia_tri, mo_ta) values
  ('may_nghi_toi_thieu_ms',  '1200',
   'NC_03B: So mili giay TOI THIEU may phai "nghi" moi luot, du tim ra nuoc di ngay lap tuc. Nen cho moi cap.'),
  ('may_nghi_moi_cap_ms',    '60',
   'NC_03B: Cong them bao nhieu mili giay cho MOI cap may. Cap cao nghi lau hon cho ra ve dang can nhac.'),
  ('may_nghi_ngau_nhien_ms', '700',
   'NC_03B: Cong ngau nhien tu 0 den so nay (mili giay) de nhip di cua may khong deu tam tap. Dat 0 de tat.'),
  ('may_nghi_toi_da_ms',     '4000',
   'NC_03B: Tran thoi gian nghi (mili giay). Tre em khong phai cho lau hon muc nay.')
on conflict (khoa) do nothing;


-- ------------------------------------------------------------
-- PHAN 2: LOI AN UI / CANH BAO SAU NUOC DI CUA MAY (loi_dong_vien)
-- ------------------------------------------------------------
-- board.js da co cau mac dinh viet san trong code, nen thieu bang cung khong "cam".
-- Nhung nen co nhieu bien the de tro ly noi da dang, do nham chan.
--
--   bi_an_quan : be BI may an quan  -> dong vien
--   bi_chieu   : be BI may chieu    -> canh bao nhe nhang
--
-- Cot duong_dan_am_thanh de trong: he thong tu doc bang giong may / giong mang.
-- Chi dien link MP3 khi may khong the doc tieng Viet bang cach nao khac.
--
-- LUU Y KY THUAT: bang loi_dong_vien KHONG co rang buoc unique tren (loai, noi_dung),
-- nen KHONG dung duoc "on conflict do nothing" o day (no se khong bat gi ca va chay
-- lai file se tao dong trung). Thay vao do dung "where not exists" so theo noi_dung,
-- dung dung cach ma supabase_nc02_am_thanh.sql da lam.
-- ------------------------------------------------------------

insert into loi_dong_vien (loai, noi_dung)
select v.loai, v.noi_dung
from (values
  ('bi_an_quan', 'Không sao đâu, mất một quân vẫn còn cơ hội. Cố lên con!'),
  ('bi_an_quan', 'Ôi tiếc quá! Con bình tĩnh nghĩ nước tiếp theo nhé.'),
  ('bi_an_quan', 'Máy vừa ăn một quân của con. Đừng lo, con vẫn chơi tốt lắm!'),
  ('bi_chieu',   'Cẩn thận, Vua của con đang bị chiếu đấy!'),
  ('bi_chieu',   'Vua của con đang gặp nguy hiểm, con cứu Vua nhanh lên!')
) as v(loai, noi_dung)
where not exists (
  select 1 from loi_dong_vien ld
  where ld.loai = v.loai and ld.noi_dung = v.noi_dung
);


-- ------------------------------------------------------------
-- PHAN 3: KIEM TRA SAU KHI CHAY
-- Chay rieng 2 cau nay de xem ket qua da vao chua.
-- ------------------------------------------------------------
-- select khoa, gia_tri from cau_hinh_chung where khoa like 'may_nghi_%' order by khoa;
-- select loai, count(*) from loi_dong_vien where loai in ('bi_an_quan','bi_chieu') group by loai;
