-- ================================================================
-- FILE: supabase_kc00c_qua_tang.sql
-- BUOC: KC_00C-2
-- NGAY: 15/10/2026
-- MUC DICH: "Qua tang chua nhan" DUNG CHUNG CHO TOAN APP (nguoi dung chot
--   15/10/2026). Moi khu (Thu Thach, Tro Choi, Hoc Tap, bo me tang...) chi
--   viec GHI qua vao bang kc_qua_tang; be BAM "Nhan qua!" o Trang chu thi
--   kim cuong moi duoc cong (Huong Dan 3.0, Ke Hoach KC_00C).
--
-- KET LUAN KHAO SAT (Huong Dan 1.11): chua co bang/RPC qua tang nao (ca Co
--   Vua lan KC). lich_su_doi_qua cua Co Vua la lich su DOI vat pham (tieu kim
--   cuong), khac han. -> tao doi tuong MOI tien to kc_, hop le theo luat 1.10.
--   Khong dung whitelist moi. Chi UPDATE cot diem_so cua tai_khoan (So Tay A1),
--   KHONG dung kinh_nghiem (luat thuong 3.4).
--   kc_kiem_tra_dang_nhap: tao lai Y HET ban trong supabase_kc02_quan_tri.sql
--   (create or replace cung noi dung) de file nay chay doc lap duoc du KC_02
--   da chay hay chua.
--
-- CACH CHAY: Supabase -> SQL Editor -> dan TOAN BO file -> Run.
--   Ket qua cuoi cung hien BANG KIEM TRA cac doi tuong kc_ dang co.
-- AN TOAN: file idempotent - dan chay lai nhieu lan khong hong du lieu.
-- ================================================================

-- ================================================================
-- (1) HAM NOI BO: kiem tra "da dang nhap hop le" (mau So Tay D1)
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
-- (2) BANG kc_qua_tang
--   nguon: khu tang qua - 'thu_thach' | 'tro_choi' | 'hoc_tap' | 'kham_pha'
--          | 'bo_me' | 'he_thong' ... (chu thuong + gach duoi, de mo rong)
--   ma_nguon: ma cua viec sinh ra qua (vd id thu thach) - chong tang TRUNG
--          2 lan cho cung 1 viec (unique theo nguon + ma_nguon).
-- ================================================================
create table if not exists kc_qua_tang (
  id bigint generated always as identity primary key,
  tre text not null references tai_khoan(ten_dang_nhap),
  nguon text not null default 'he_thong' check (nguon ~ '^[a-z_]+$'),
  ma_nguon text,
  tieu_de text not null,
  loi_nhan text not null default '',
  so_kim_cuong int not null check (so_kim_cuong > 0),
  nguoi_tang text,
  ngay_tao timestamptz not null default now(),
  da_nhan boolean not null default false,
  ngay_nhan timestamptz
);

comment on table kc_qua_tang is 'Kids Challenge: qua tang chua nhan dung chung toan app (KC_00C-2)';

create index if not exists kc_qua_tang_chua_nhan_idx on kc_qua_tang (tre) where not da_nhan;
create unique index if not exists kc_qua_tang_nguon_uidx on kc_qua_tang (nguon, ma_nguon) where ma_nguon is not null;

-- Khoa RLS: trinh duyet KHONG doc/ghi thang bang, moi truy cap qua RPC (So Tay D2)
alter table kc_qua_tang enable row level security;

-- ================================================================
-- (3) HAM NOI BO: tao 1 qua cho 1 be. CHI cac RPC kc_ khac (TT_03, game...)
--   hoac admin chay SQL moi goi duoc. TUYET DOI khong cho trinh duyet goi
--   (goi duoc = tu in kim cuong) -> revoke khoi public, anon, authenticated.
--   Tra ve id qua moi; da co qua cung (nguon, ma_nguon) thi tra id cu.
-- ================================================================
create or replace function kc_tao_qua(
  p_tre text,
  p_nguon text,
  p_tieu_de text,
  p_so_kim_cuong int,
  p_loi_nhan text default '',
  p_nguoi_tang text default null,
  p_ma_nguon text default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id bigint;
begin
  if not exists (select 1 from tai_khoan where ten_dang_nhap = p_tre) then
    raise exception 'kc_tao_qua: khong tim thay tai khoan %', p_tre;
  end if;
  if p_so_kim_cuong is null or p_so_kim_cuong <= 0 then
    raise exception 'kc_tao_qua: so kim cuong phai lon hon 0';
  end if;

  if p_ma_nguon is not null then
    select id into v_id from kc_qua_tang where nguon = p_nguon and ma_nguon = p_ma_nguon;
    if v_id is not null then
      return v_id;
    end if;
  end if;

  insert into kc_qua_tang (tre, nguon, ma_nguon, tieu_de, loi_nhan, so_kim_cuong, nguoi_tang)
    values (p_tre, p_nguon, p_ma_nguon, coalesce(nullif(trim(p_tieu_de), ''), 'Qua tang'),
            coalesce(p_loi_nhan, ''), p_so_kim_cuong, p_nguoi_tang)
    returning id into v_id;
  return v_id;
end;
$$;
revoke execute on function kc_tao_qua(text, text, text, int, text, text, text) from public, anon, authenticated;

-- ================================================================
-- (4) RPC: be lay danh sach qua CHUA NHAN cua minh (cu nhat truoc)
-- ================================================================
create or replace function kc_lay_qua_chua_nhan(p_ten text, p_ma_phien text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ds json;
  v_so int;
begin
  if not kc_kiem_tra_dang_nhap(p_ten, p_ma_phien) then
    return json_build_object('thanhCong', false, 'thongBao', 'Phien dang nhap da het han, con dang nhap lai nhe');
  end if;

  select count(*) into v_so from kc_qua_tang where tre = p_ten and not da_nhan;

  select coalesce(json_agg(json_build_object(
      'id', q.id,
      'nguon', q.nguon,
      'tieuDe', q.tieu_de,
      'loiNhan', q.loi_nhan,
      'soKimCuong', q.so_kim_cuong,
      'nguoiTang', q.nguoi_tang,
      'ngayTao', q.ngay_tao
    ) order by q.ngay_tao asc, q.id asc), '[]'::json) into v_ds
  from (
    select * from kc_qua_tang
    where tre = p_ten and not da_nhan
    order by ngay_tao asc, id asc
    limit 50
  ) q;

  return json_build_object('thanhCong', true, 'thongBao', '', 'soQua', v_so, 'danhSachQua', v_ds);
end;
$$;
grant execute on function kc_lay_qua_chua_nhan(text, text) to anon;

-- ================================================================
-- (5) RPC: be bam "Nhan qua!" -> cong kim cuong DUNG 1 LAN
--   Mot cau UPDATE ... where not da_nhan duy nhat -> 2 lan bam cung luc thi
--   chi 1 lan thanh cong (lan sau khong con dong nao khop). Cong diem_so
--   trong cung transaction cua ham. KHONG dung kinh_nghiem (luat 3.4).
-- ================================================================
create or replace function kc_nhan_qua(p_ten text, p_ma_phien text, p_id bigint)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_so_kc int;
  v_diem_moi int;
begin
  if not kc_kiem_tra_dang_nhap(p_ten, p_ma_phien) then
    return json_build_object('thanhCong', false, 'thongBao', 'Phien dang nhap da het han, con dang nhap lai nhe');
  end if;

  update kc_qua_tang
    set da_nhan = true, ngay_nhan = now()
    where id = p_id and tre = p_ten and not da_nhan
    returning so_kim_cuong into v_so_kc;

  if v_so_kc is null then
    return json_build_object('thanhCong', false, 'thongBao', 'Qua nay con da nhan roi hoac khong con nua');
  end if;

  update tai_khoan
    set diem_so = coalesce(diem_so, 0) + v_so_kc
    where ten_dang_nhap = p_ten
    returning diem_so into v_diem_moi;

  return json_build_object('thanhCong', true, 'thongBao', 'Con nhan duoc ' || v_so_kc || ' kim cuong!',
                           'soKimCuong', v_so_kc, 'diemSoMoi', v_diem_moi);
end;
$$;
grant execute on function kc_nhan_qua(text, text, bigint) to anon;

-- ================================================================
-- (6) QUA THU (de thu o KC_00C-2) - MUON CHEN THI BO DAU "--" O 2 DONG
--   select ben duoi roi chay RIENG doan do. Doi 'thu' thanh ten be khac
--   neu muon. Chay lai khong tao trung (co ma_nguon).
-- ================================================================
-- select kc_tao_qua('thu', 'he_thong', 'Quà chào mừng Trang chủ mới', 5, 'Chúc mừng con! 🎉', 'Mèo Đen', 'thu_kc00c_1');
-- select kc_tao_qua('thu', 'bo_me', 'Quà bố mẹ tặng', 3, 'Mẹ tự hào về con!', 'Mẹ', 'thu_kc00c_2');
--
-- XOA QUA THU (chua nhan hoac da nhan; KHONG tru lai kim cuong da cong):
-- delete from kc_qua_tang where ma_nguon like 'thu_kc00c_%';

-- ================================================================
-- (7) BANG KIEM TRA (chi doc): cac bang va ham kc_ dang co trong Supabase.
--   Dan ket qua nay cho Claude de doi chieu (vd: KC_02 da chay chua).
-- ================================================================
select 'bang' as loai, c.relname as ten
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'kc\_%'
union all
select 'ham', p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')'
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname like 'kc\_%'
order by 1, 2;

-- 15/10/2026 - BUOC: KC_00C-2
