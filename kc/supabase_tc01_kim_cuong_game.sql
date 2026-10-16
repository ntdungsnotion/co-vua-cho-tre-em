-- ================================================================
-- FILE: supabase_tc01_kim_cuong_game.sql
-- BUOC: TC_01
-- NGAY: 16/10/2026
-- MUC DICH: kim cuong be NHAT DUOC trong game Giai Cuu Meo Con (San Tu) duoc
--   CONG THANG vao kho kim cuong chung cua be (tai_khoan.diem_so) sau MOI MAN.
--   Nguoi dung chot 16/10/2026:
--   - tran ngay 200 kim cuong (khoa kc_thuong_ngay_toi_da, admin sua duoc o
--     man hinh "Cau hinh chung" cua trang Quan Tri);
--   - chi cong so CON LAI: nhat duoc trong man tru so da doi lay mang (game
--     tu tinh, may chu chan tren bang tran moi man + tran ngay).
--
-- KET LUAN KHAO SAT (Huong Dan 1.11): chua co bang/RPC nao ghi thuong game.
--   -> tao doi tuong MOI tien to kc_ (luat 1.10). Khong dung whitelist moi.
--   Chi UPDATE cot diem_so cua tai_khoan (So Tay A1), KHONG dung kinh_nghiem
--   (luat thuong 3.4). Kim cuong be tu kiem KHONG di qua kc_qua_tang (qua bam
--   nhan danh cho qua tu nguoi khac tang - thu thach, bo me).
--   kc_kiem_tra_dang_nhap: tao lai Y HET ban KC_00C-2 de file chay doc lap.
--
-- CHONG GIAN LAN (kiem tra o MAY CHU, khong tin trinh duyet - Huong Dan 3.8):
--   - phai dang nhap, chi tai khoan vai_tro = 'tre' duoc cong;
--   - moi man cong toi da kc_santu_kc_toi_da_moi_man (mac dinh 30);
--   - tong cong trong ngay (gio Viet Nam) khong vuot kc_thuong_ngay_toi_da;
--   - moi man co 1 ma_luot rieng: gui lai (mat mang, bam 2 lan) khong cong 2 lan.
--
-- CACH CHAY: Supabase -> SQL Editor -> dan TOAN BO file -> Run.
--   Ket qua cuoi cung hien BANG KIEM TRA (doi tuong kc_ + 2 khoa cau hinh).
-- AN TOAN: file idempotent - dan chay lai nhieu lan khong hong du lieu.
-- ================================================================

-- ================================================================
-- (1) HAM NOI BO: kiem tra "da dang nhap hop le" (mau So Tay D1, y het KC_00C-2)
-- ================================================================
create or replace function kc_kiem_tra_dang_nhap(p_ten text, p_ma_phien text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from tai_khoan
    where ten_dang_nhap = p_ten
      and p_ma_phien is not null
      and length(p_ma_phien) > 10
  );
$$;
revoke execute on function kc_kiem_tra_dang_nhap(text, text) from anon;

-- ================================================================
-- (2) KHOA CAU HINH (mac dinh; admin da luu gia tri khac thi giu nguyen)
-- ================================================================
insert into cau_hinh_chung (khoa, gia_tri, mo_ta) values
  ('kc_thuong_ngay_toi_da', '200', 'Kids Challenge: tran kim cuong thuong moi ngay (cau do + tro choi cong lai, gio Viet Nam) - TC_01'),
  ('kc_santu_kc_toi_da_moi_man', '30', 'Giai Cuu Meo Con: so kim cuong toi da cong vao kho cho MOT man (cap 4: 15 tren duong + 10 trong hang + 5 on tap) - TC_01')
on conflict (khoa) do nothing;

-- ================================================================
-- (3) BANG kc_kim_cuong_kiem_duoc: moi dong = MOT lan be cat kim cuong tu
--   kiem (mot man game...). Dung CHUNG cho moi tro choi / cau do sau nay
--   (cot nguon) de tinh tran ngay chung.
--   nguon: 'san_tu' (Giai Cuu Meo Con); sau nay 'cau_do', 'caro'...
--   ma_luot: ma ngau nhien trinh duyet tao cho moi man - chong cong trung.
--   so_xin: so game gui len; so_cong: so thuc su cong (sau khi chan tran).
--   ngay: ngay theo gio Viet Nam (tinh tran ngay).
-- ================================================================
create table if not exists kc_kim_cuong_kiem_duoc (
  id bigint generated always as identity primary key,
  tre text not null references tai_khoan(ten_dang_nhap),
  nguon text not null check (nguon ~ '^[a-z_]+$'),
  ma_luot text not null check (ma_luot ~ '^[A-Za-z0-9_-]{8,64}$'),
  chi_tiet jsonb not null default '{}'::jsonb,
  so_xin int not null check (so_xin >= 0),
  so_cong int not null check (so_cong >= 0),
  ngay date not null,
  thoi_diem timestamptz not null default now()
);

comment on table kc_kim_cuong_kiem_duoc is 'Kids Challenge: kim cuong be tu kiem (game, cau do) da cong vao kho - TC_01';

create unique index if not exists kc_kim_cuong_kiem_duoc_luot_uidx on kc_kim_cuong_kiem_duoc (tre, ma_luot);
create index if not exists kc_kim_cuong_kiem_duoc_ngay_idx on kc_kim_cuong_kiem_duoc (tre, ngay);

-- Khoa RLS: trinh duyet KHONG doc/ghi thang bang, moi truy cap qua RPC (So Tay D2)
alter table kc_kim_cuong_kiem_duoc enable row level security;

-- ================================================================
-- (4) HAM NOI BO: doc 1 khoa cau hinh so nguyen, sai dinh dang thi dung mac dinh
--   (tranh loi ep kieu khi admin go nham chu vao o gia tri).
-- ================================================================
create or replace function kc_cau_hinh_so(p_khoa text, p_mac_dinh int)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select case when trim(gia_tri) ~ '^[0-9]{1,9}$' then trim(gia_tri)::int end
       from cau_hinh_chung where khoa = p_khoa),
    p_mac_dinh);
$$;
revoke execute on function kc_cau_hinh_so(text, int) from anon;

-- ================================================================
-- (5) RPC: game cat kim cuong cua MOT MAN vao kho cua be
--   p_so: so kim cuong CON LAI cua man (game da tru phan doi mang).
--   p_duong, p_man, p_cap, p_thang: chi de ghi nhat ky (chi_tiet).
--   Tra ve: { thanhCong, thongBao, ma, soXin, soCong, daNhanHomNay, tranNgay,
--             daDuTran, trungLap, diemSoMoi }
--   ma: '' khi thanh cong; 'phien_het_han' | 'khong_phai_tre' | 'ma_luot_sai'
--       khi bi tu choi (trinh duyet dua vao ma de biet giu lai hay bo).
--   Khoa dong tai_khoan cua be (for update) trong ca ham -> 2 man gui cung luc
--   van tinh tran ngay dung, khong cong trung.
-- ================================================================
create or replace function kc_santu_cat_kim_cuong(
  p_ten text,
  p_ma_phien text,
  p_ma_luot text,
  p_so int,
  p_duong text default null,
  p_man int default null,
  p_cap text default null,
  p_thang boolean default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vai_tro text;
  v_diem int;
  v_toi_da_man int;
  v_tran_ngay int;
  v_ngay date;
  v_da_nhan int;
  v_so int;
  v_cong int;
  v_cu kc_kim_cuong_kiem_duoc%rowtype;
begin
  if not kc_kiem_tra_dang_nhap(p_ten, p_ma_phien) then
    return json_build_object('thanhCong', false, 'ma', 'phien_het_han',
      'thongBao', 'Phien dang nhap da het han, con dang nhap lai nhe');
  end if;

  select vai_tro, coalesce(diem_so, 0) into v_vai_tro, v_diem
    from tai_khoan where ten_dang_nhap = p_ten
    for update;

  if v_vai_tro is distinct from 'tre' then
    return json_build_object('thanhCong', false, 'ma', 'khong_phai_tre',
      'thongBao', 'Chi tai khoan cua be moi cat kim cuong vao kho');
  end if;

  if p_ma_luot is null or p_ma_luot !~ '^[A-Za-z0-9_-]{8,64}$' then
    return json_build_object('thanhCong', false, 'ma', 'ma_luot_sai',
      'thongBao', 'Ma luot choi khong hop le');
  end if;

  v_tran_ngay := kc_cau_hinh_so('kc_thuong_ngay_toi_da', 200);
  v_ngay := (now() at time zone 'Asia/Ho_Chi_Minh')::date;

  -- Man nay da cat roi (gui lai sau khi mat mang): tra lai ket qua cu, khong cong them
  select * into v_cu from kc_kim_cuong_kiem_duoc where tre = p_ten and ma_luot = p_ma_luot;
  if found then
    select coalesce(sum(so_cong), 0) into v_da_nhan
      from kc_kim_cuong_kiem_duoc where tre = p_ten and ngay = v_ngay;
    return json_build_object('thanhCong', true, 'ma', '', 'thongBao', '', 'trungLap', true,
      'soXin', v_cu.so_xin, 'soCong', v_cu.so_cong, 'daNhanHomNay', v_da_nhan,
      'tranNgay', v_tran_ngay, 'daDuTran', v_da_nhan >= v_tran_ngay, 'diemSoMoi', v_diem);
  end if;

  v_toi_da_man := kc_cau_hinh_so('kc_santu_kc_toi_da_moi_man', 30);
  v_so := greatest(0, least(coalesce(p_so, 0), v_toi_da_man));

  select coalesce(sum(so_cong), 0) into v_da_nhan
    from kc_kim_cuong_kiem_duoc where tre = p_ten and ngay = v_ngay;
  v_cong := greatest(0, least(v_so, v_tran_ngay - v_da_nhan));

  insert into kc_kim_cuong_kiem_duoc (tre, nguon, ma_luot, chi_tiet, so_xin, so_cong, ngay)
    values (p_ten, 'san_tu', p_ma_luot,
            jsonb_build_object('duong', left(coalesce(p_duong, ''), 30), 'man', p_man,
                               'cap', left(coalesce(p_cap, ''), 20), 'thang', p_thang),
            greatest(0, coalesce(p_so, 0)), v_cong, v_ngay);

  if v_cong > 0 then
    update tai_khoan
      set diem_so = coalesce(diem_so, 0) + v_cong
      where ten_dang_nhap = p_ten
      returning diem_so into v_diem;
  end if;

  return json_build_object('thanhCong', true, 'ma', '', 'thongBao', '', 'trungLap', false,
    'soXin', greatest(0, coalesce(p_so, 0)), 'soCong', v_cong,
    'daNhanHomNay', v_da_nhan + v_cong, 'tranNgay', v_tran_ngay,
    'daDuTran', v_da_nhan + v_cong >= v_tran_ngay, 'diemSoMoi', v_diem);
end;
$$;
grant execute on function kc_santu_cat_kim_cuong(text, text, text, int, text, int, text, boolean) to anon;

-- ================================================================
-- (6) XEM THU (chi doc) - bo dau "--" roi chay RIENG doan nay:
--   cac man be 'thu' da cat hom nay + tong.
-- ================================================================
-- select thoi_diem, chi_tiet, so_xin, so_cong from kc_kim_cuong_kiem_duoc
--   where tre = 'thu' and ngay = (now() at time zone 'Asia/Ho_Chi_Minh')::date order by id;
--
-- XOA DU LIEU THU (KHONG tru lai kim cuong da cong vao kho):
-- delete from kc_kim_cuong_kiem_duoc where tre = 'thu';

-- ================================================================
-- (7) BANG KIEM TRA (chi doc): doi tuong kc_ dang co + 2 khoa cau hinh TC_01.
-- ================================================================
select 'bang' as loai, c.relname as ten
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'kc\_%'
union all
select 'ham', p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')'
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname like 'kc\_%'
union all
select 'cau_hinh', khoa || ' = ' || gia_tri
  from cau_hinh_chung where khoa in ('kc_thuong_ngay_toi_da', 'kc_santu_kc_toi_da_moi_man')
order by 1, 2;

-- 16/10/2026 - BUOC: TC_01
