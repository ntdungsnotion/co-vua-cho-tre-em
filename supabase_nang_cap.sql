-- ============================================================
-- FILE: supabase_nang_cap.sql (BAN V6 - KHOP KE HOACH V9: THUONG 2 NGUOI,
--       DIEM THUA/HOA TACH RIENG, MOC TAT HOI GOI Y, THONG KE THEO DOI THU)
-- CHUC NANG: Xay dung TOAN BO backend Supabase cho GIAI DOAN 2 (NANG CAP)
--            Phuc vu: NC_01 (AI 20 cap), NC_02 (loi dong vien), NC_03 (goi y),
--            NC_04 (choi 2 nguoi), NC_05 (Trang Tai Khoan + menu theo vai tro),
--            NC_06 (Cua hang - Quan tri - Doi thuong), NC_07 (Hoc tap - Kham pha)
-- BUOC: NC_00
--
-- THAY DOI SO VOI BAN V5 (dong bo voi Ke hoach V9 + Huong dan V4):
--   1) TACH diem khich le: diem_khich_le_hoa (mac dinh 10) va
--      diem_khich_le_thua (mac dinh 5) trong cau_hinh_chung.
--      cap_nhat_diem doc 2 khoa moi (con du phong khoa cu diem_khich_le).
--   2) THUONG CHE DO 2 NGUOI: ket_thuc_phong CONG kim cuong + EXP cho ca
--      2 ben, bang 1/3 muc thuong dau may tuong duong (chia cho khoa
--      he_so_chia_thuong_2n, mac dinh 3; lam tron, toi thieu 1):
--        - Thang: (level DOI THU x he_so_diem_thang) / 3
--        - Hoa:   diem_khich_le_hoa / 3;  Thua: diem_khich_le_thua / 3
--      LUU Y: thang 2 nguoi KHONG len level (level chi tang khi thang may).
--   3) Khoa moi hoi_goi_y_toi_level (mac dinh 9): tu level 10 tro len
--      KHONG chu dong hoi "Con co can goi y khong?" (NC_03 doc tu lay_cau_hinh).
--   4) RPC MOI lay_thong_ke_doi_thu: gom nhom lich_su_tran theo DOI THU
--      (ke ca may) -> tong tran, thang, thua, hoa; sap mac dinh theo so tran
--      thang giam dan (NC_05 hien thi, tre xem duoc).
--   5) Sua chu thich cu con ghi sai "tieu kim cuong giam diem xep hang".
--
-- THAY DOI SO VOI BAN V4 (giu nguyen tu V5):
--   * BANG MOI lich_su_tran: ghi TUNG TRAN cho moi tre (dau may + dau nguoi).
--       - Dau may: doi_thu = 'May cap N', ghi trong cap_nhat_diem.
--       - Dau nguoi: moi tran tao 2 dong doi xung, ghi trong ket_thuc_phong.
--       - ket_qua chuan hoa: 'thang' | 'thua' | 'hoa'. Hien thi 50 tran gan nhat.
--   * lay_ho_so tra them 'lichSuTran' (50 tran); them RPC rieng lay_lich_su_tran.
--   * lay_xep_hang lam giau du lieu tho de GIAO DIEN tu sap theo 7 kieu:
--       EXP (mac dinh), tong thang, thang may, thang nguoi, ty le thang chung,
--       ty le thang dau nguoi, ty le thang dau may. Cac truong moi: thangMay,
--       thangNguoi, tongThang, tongTranMay, tongTranNguoi, tongTran, tyLeThang,
--       tyLeThangMay, tyLeThangNguoi. rank.js tu sap, khong can them RPC.
-- THAY DOI SO VOI BAN V3 (giu nguyen tu V4):
--   * XEP HANG THEO 3 TIEU CHI (EXP -> tong thang -> ty le thang -> ten),
--     KHONG con theo kim cuong -> tieu kim cuong KHONG giam thu hang.
--   * lay_xep_hang viet lai (ghi de MIG_01); ham phu tro tinh_tong_thang,
--     tinh_tong_tran, tinh_ty_le_thang, xep_hang_hon dung chung cong thuc.
-- THAY DOI SO VOI BAN V2 (giu nguyen tu V3):
--   1) HE THONG VAT PHAM TONG QUAT: cot loai tu do ('avatar', 'bo_quan_co',
--      'ban_co', 'hieu_ung', 'qua'...). Chi 'qua' la vat pham VAT LY (cho trao);
--      moi loai khac la vat pham SO (nhan ngay, chan mua trung, tu trang bi).
--   2) vat_pham them ma_dinh_danh + du_lieu (jsonb). Hieu ung dung CSS Animation
--      + SVG/emoji, dinh nghia bang DU LIEU, khong can sua code.
--   3) tai_khoan them cot trang_bi (jsonb) + RPC cap_nhat_trang_bi.
--   4) Bang y_tuong + 4 RPC (NC_07).
-- THAY DOI SO VOI BAN V1 (giu nguyen tu V2):
--   - dang_nhap/dang_ky tra them vaiTro + kinhNghiem + maPhien (Role-Based UI)
--   - ma_phien: admin KHONG dang nhap lan 2, khong luu mat khau o trinh duyet
--   - kinh_nghiem (EXP chi tang) + thanh tich dau may; lay_ho_so cho Trang Tai Khoan
--
-- CACH DUNG: Vao Supabase -> "SQL Editor" -> dan TOAN BO file nay -> bam "Run".
--            Chay lai nhieu lan van an toan, KE CA KHI DA CHAY BAN CU truoc do
--            (khong xoa bang, khong ghi de du lieu cau hinh da chinh sua).
-- LUU Y:     File nay BO SUNG cho supabase_setup.sql (MIG_01), KHONG thay the,
--            NHUNG co ghi de ham lay_xep_hang cua MIG_01 de xep theo EXP.
--            Cac ham dang_ky, dang_nhap, cap_nhat_diem, ket_thuc_phong, lay_xep_hang
--            duoc viet lai (giu nguyen ten ham va cac truong JSON cu).
-- ============================================================


-- ------------------------------------------------------------
-- PHAN A: BO SUNG COT CHO BANG tai_khoan
-- vai_tro:       'tre' hoac 'admin' (Role-Based UI, NC_05/NC_06)
-- ma_phien:      ma phien dang nhap, sinh moi moi lan dang nhap,
--                dung xac thuc cac RPC quan tri (khong can dang nhap lan 2)
-- kinh_nghiem:   EXP - chi tang khi choi, KHONG giam khi tieu kim cuong
--                (kim cuong = diem_so chi la TIEN TIEU XAI; xep hang theo EXP
--                 nen tieu kim cuong KHONG lam giam thu hang)
-- trang_bi:      vat pham SO dang dung (jsonb), khoa = loai vat pham, vi du:
--                { "avatar": "🦁", "bo_quan_co": "quan_khung_long", "ban_co": "bien_xanh", "hieu_ung": "phao_hoa_vang" }
-- tran_may_*:    thanh tich dau may (thang / khac = thua hoac hoa)
-- tran_2n_*:     thanh tich che do 2 nguoi (NC_04)
-- ------------------------------------------------------------
alter table tai_khoan add column if not exists vai_tro        text  not null default 'tre';
alter table tai_khoan add column if not exists ma_phien       text  default '';
alter table tai_khoan add column if not exists kinh_nghiem    int   not null default 0;
alter table tai_khoan add column if not exists trang_bi       jsonb not null default '{}'::jsonb;
alter table tai_khoan add column if not exists tran_may_thang int   not null default 0;
alter table tai_khoan add column if not exists tran_may_khac  int   not null default 0;
alter table tai_khoan add column if not exists tran_2n_thang  int   not null default 0;
alter table tai_khoan add column if not exists tran_2n_thua   int   not null default 0;
alter table tai_khoan add column if not exists tran_2n_hoa    int   not null default 0;

-- VIEC THU CONG SAU KHI CHAY: cap quyen quan tri cho tai khoan cua ban bang lenh:
-- update tai_khoan set vai_tro = 'admin' where ten_dang_nhap = 'TEN_TAI_KHOAN_CUA_BAN';


-- ------------------------------------------------------------
-- PHAN A2: VIET LAI HAM DANG KY + DANG NHAP (thay ban MIG_01)
-- Giu nguyen ten ham, tham so va cac truong JSON cu.
-- BO SUNG trong duLieuTaiKhoan: vaiTro, kinhNghiem, maPhien, trangBi
-- -> Giao dien biet vai tro NGAY KHI dang nhap de dung menu phu hop,
--    va co ma phien de goi cac RPC quan tri ma khong dang nhap lai.
-- ------------------------------------------------------------
create or replace function dang_ky(p_ten text, p_mat_khau text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ton_tai  int;
  v_ma_phien text;
begin
  if p_ten is null or p_mat_khau is null or length(p_ten) = 0 or length(p_mat_khau) = 0 then
    return json_build_object('thanhCong', false, 'thongBao', 'Vui long nhap day du ten dang nhap va mat khau');
  end if;

  select count(*) into v_ton_tai from tai_khoan where ten_dang_nhap = p_ten;
  if v_ton_tai > 0 then
    return json_build_object('thanhCong', false, 'thongBao', 'Ten dang nhap da ton tai, vui long chon ten khac');
  end if;

  v_ma_phien := gen_random_uuid()::text;

  insert into tai_khoan(ten_dang_nhap, mat_khau, level, diem_so, avatar_da_chon, ngay_tao, lan_choi_cuoi, vai_tro, ma_phien, kinh_nghiem)
  values (p_ten, p_mat_khau, 1, 0, '', now(), now(), 'tre', v_ma_phien, 0);

  return json_build_object(
    'thanhCong', true,
    'thongBao', 'Dang ky thanh cong',
    'duLieuTaiKhoan', json_build_object(
      'tenDangNhap',  p_ten,
      'level',        1,
      'diemSo',       0,
      'avatarDaChon', '',
      'vaiTro',       'tre',
      'kinhNghiem',   0,
      'maPhien',      v_ma_phien,
      'trangBi',      '{}'::jsonb
    )
  );
end;
$$;

create or replace function dang_nhap(p_ten text, p_mat_khau text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row      tai_khoan%rowtype;
  v_ma_phien text;
begin
  if p_ten is null or p_mat_khau is null or length(p_ten) = 0 or length(p_mat_khau) = 0 then
    return json_build_object('thanhCong', false, 'thongBao', 'Vui long nhap day du ten dang nhap va mat khau');
  end if;

  select * into v_row from tai_khoan where ten_dang_nhap = p_ten;

  if not found or v_row.mat_khau <> p_mat_khau then
    return json_build_object('thanhCong', false, 'thongBao', 'Sai ten dang nhap hoac mat khau');
  end if;

  -- Sinh ma phien moi cho lan dang nhap nay
  v_ma_phien := gen_random_uuid()::text;
  update tai_khoan set lan_choi_cuoi = now(), ma_phien = v_ma_phien
    where ten_dang_nhap = p_ten;

  return json_build_object(
    'thanhCong', true,
    'thongBao', 'Dang nhap thanh cong',
    'duLieuTaiKhoan', json_build_object(
      'tenDangNhap',  v_row.ten_dang_nhap,
      'level',        v_row.level,
      'diemSo',       v_row.diem_so,
      'avatarDaChon', coalesce(v_row.avatar_da_chon, ''),
      'vaiTro',       v_row.vai_tro,
      'kinhNghiem',   v_row.kinh_nghiem,
      'maPhien',      v_ma_phien,
      'trangBi',      coalesce(v_row.trang_bi, '{}'::jsonb)
    )
  );
end;
$$;


-- ------------------------------------------------------------
-- PHAN B: BANG CAU HINH CHUNG (khoa - gia tri)
-- Moi gia tri co the thay doi khi van hanh deu nam o day,
-- quan tri sua truc tiep trong Table Editor, KHONG can sua JavaScript.
-- ------------------------------------------------------------
create table if not exists cau_hinh_chung (
  khoa    text primary key,
  gia_tri text not null,
  mo_ta   text default ''
);

alter table cau_hinh_chung enable row level security;

insert into cau_hinh_chung (khoa, gia_tri, mo_ta) values
  ('he_so_diem_thang',        '100', 'Thang may: cong (level may x he so) kim cuong'),
  ('diem_khich_le_hoa',       '10',  'HOA (dau may): cong so kim cuong khich le nay'),
  ('diem_khich_le_thua',      '5',   'THUA (dau may): cong so kim cuong khich le nay'),
  ('he_so_chia_thuong_2n',    '3',   'Che do 2 nguoi: thuong = thuong dau may tuong duong CHIA cho so nay (mac dinh 1/3)'),
  ('level_toi_da',            '20',  'Level cao nhat cua tai khoan'),
  ('khen_moi_nuoc_toi_level', '5',   'Tai khoan tu level 1 den muc nay: khen MOI nuoc di'),
  ('khen_nuoc_tot_toi_level', '9',   'Tai khoan tu level (muc tren + 1) den muc nay: chi khen nuoc tot; cao hon thi tat khen'),
  ('giay_cho_hoi_goi_y',      '30',  'Qua so giay nay chua di thi hien hop hoi goi y'),
  ('hoi_goi_y_toi_level',     '9',   'Chi CHU DONG hoi goi y voi tai khoan tu level 1 den muc nay; lv cao hon khong hoi (van bam nut Goi Y duoc)'),
  ('chu_ky_polling_giay',     '2',   'Che do 2 nguoi: chu ky tu tai lai neu Realtime truc trac'),
  ('y_tuong_do_dai_toi_da',   '500', 'So ky tu toi da cua 1 y tuong tre gui (NC_07)')
on conflict (khoa) do nothing;

-- Don dep khoa cu 'diem_khich_le' (da tach thanh _hoa va _thua):
-- neu CSDL cu da co khoa nay thi CHUYEN gia tri sang khoa _hoa (giu so lieu
-- quan tri da chinh), sau do xoa khoa cu de tranh nham lan.
do $$
declare
  v_cu text;
begin
  select gia_tri into v_cu from cau_hinh_chung where khoa = 'diem_khich_le';
  if found then
    update cau_hinh_chung set gia_tri = v_cu where khoa = 'diem_khich_le_hoa';
    delete from cau_hinh_chung where khoa = 'diem_khich_le';
  end if;
end $$;


-- ------------------------------------------------------------
-- PHAN C: BANG CAU HINH THEO CAP DO 1..20
-- Gom chung 2 nhom thong so cung danh so theo cap:
--   1) Thong so AI cua MAY theo cap may (NC_01):
--      ty_le_ngau_nhien (%), skill_level (0-20), do_sau (depth)
--   2) Quy tac GOI Y theo level TAI KHOAN (NC_03):
--      goi_y_gioi_han (null = khong gioi han), goi_y_chi_phi (kim cuong tru moi lan)
-- Seed dung "on conflict do nothing" nen quan tri sua so lieu se KHONG bi ghi de.
-- ------------------------------------------------------------
create table if not exists cau_hinh_cap_do (
  cap_do           int primary key,
  ty_le_ngau_nhien int not null,
  skill_level      int not null,
  do_sau           int not null,
  goi_y_gioi_han   int,
  goi_y_chi_phi    int not null default 0
);

alter table cau_hinh_cap_do enable row level security;

insert into cau_hinh_cap_do (cap_do, ty_le_ngau_nhien, skill_level, do_sau, goi_y_gioi_han, goi_y_chi_phi) values
  ( 1, 100,  0,  1, null,  0),
  ( 2,  90,  0,  1, null,  0),
  ( 3,  77,  0,  1, null,  0),
  ( 4,  65,  0,  1, null,  0),
  ( 5,  50,  0,  1, null,  1),
  ( 6,  40,  1,  2,   15,  2),
  ( 7,  30,  1,  2,   14,  3),
  ( 8,  22,  2,  3,   13,  4),
  ( 9,  15,  2,  3,   12,  5),
  (10,  10,  3,  3,   11,  6),
  (11,   8,  5,  4,   10,  7),
  (12,   6,  6,  5,    9,  8),
  (13,   4,  8,  5,    8,  9),
  (14,   2,  9,  6,    7, 10),
  (15,   0, 11,  8,    6, 11),
  (16,   0, 13, 10,    5, 12),
  (17,   0, 15, 12,    4, 13),
  (18,   0, 17, 14,    3, 14),
  (19,   0, 19, 16,    2, 15),
  (20,   0, 20, 18,    1, 16)
on conflict (cap_do) do nothing;


-- ------------------------------------------------------------
-- PHAN D: BANG LOI DONG VIEN / LOI KHEN (NC_02, NC_03)
-- loai: 'moi_nuoc'  = cau co vu cho MOI nuoc di cua tre
--       'nuoc_tot'  = cau khen khi tre di nuoc tot (an quan, chieu, nhap thanh, phong cap)
--       'hoi_goi_y' = cau chu dong hoi khi tre cham di
-- NOI DUNG du lieu de tieng Viet CO DAU vi can doc bang giong noi (Web Speech API).
-- Neu sau khi chay thay chu bi loi font, sua truc tiep trong Table Editor.
-- Seed chi chay khi bang con trong, nen chay lai file khong bi trung dong.
-- ------------------------------------------------------------
create table if not exists loi_dong_vien (
  id       bigint generated always as identity primary key,
  loai     text not null,
  noi_dung text not null,
  hien_thi boolean not null default true
);

alter table loi_dong_vien enable row level security;

insert into loi_dong_vien (loai, noi_dung)
select v.loai, v.noi_dung
from (values
  ('moi_nuoc',  'Con đi hay lắm!'),
  ('moi_nuoc',  'Nước đi tuyệt vời!'),
  ('moi_nuoc',  'Giỏi quá, tiếp tục nhé!'),
  ('moi_nuoc',  'Cố lên, con làm tốt lắm!'),
  ('moi_nuoc',  'Xuất sắc, đi tiếp nào!'),
  ('nuoc_tot',  'Ăn quân xuất sắc!'),
  ('nuoc_tot',  'Nước chiếu rất hay!'),
  ('nuoc_tot',  'Nhập thành thông minh!'),
  ('nuoc_tot',  'Phong cấp tuyệt vời!'),
  ('nuoc_tot',  'Nước đi của cao thủ!'),
  ('hoi_goi_y', 'Con có cần gợi ý không?')
) as v(loai, noi_dung)
where not exists (select 1 from loi_dong_vien);


-- ------------------------------------------------------------
-- PHAN E: BANG PHONG CHO - CHE DO 2 NGUOI CHOI (NC_04)
-- trang_thai: 'mo' -> 'cho_duyet' -> 'dang_choi' -> 'ket_thuc'
-- Chu phong cam quan Trang (w), khach cam quan Den (b).
-- danh_sach_nuoc: mang JSON cac nuoc di dang UCI (vi du "e2e4").
-- ------------------------------------------------------------
create table if not exists phong_cho (
  id             bigint generated always as identity primary key,
  ten_phong      text not null,
  chu_phong      text not null references tai_khoan(ten_dang_nhap),
  khach          text references tai_khoan(ten_dang_nhap),
  trang_thai     text not null default 'mo',
  fen_hien_tai   text not null default 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  nuoc_di_cuoi   text default '',
  danh_sach_nuoc jsonb not null default '[]'::jsonb,
  luot_hien_tai  text not null default 'w',
  ket_qua        text default '',
  ngay_tao       timestamptz default now(),
  cap_nhat_luc   timestamptz default now()
);

alter table phong_cho enable row level security;

-- Cho phep DOC cong khai bang phong_cho: bat buoc de Supabase Realtime
-- day duoc thay doi ve trinh duyet. Phong khong chua mat khau nen an toan.
-- Moi thao tac GHI van chi di qua cac ham RPC ben duoi.
drop policy if exists "doc_phong_cho" on phong_cho;
create policy "doc_phong_cho" on phong_cho for select to anon using (true);

-- Bat Realtime cho bang phong_cho (bo qua neu da bat truoc do)
do $$
begin
  alter publication supabase_realtime add table phong_cho;
exception
  when duplicate_object then null;
  when others then raise notice 'Chua bat duoc Realtime cho phong_cho, co the bat trong Dashboard: %', sqlerrm;
end $$;


-- ------------------------------------------------------------
-- PHAN F: HE THONG VAT PHAM TONG QUAT (NC_05, NC_06)
-- loai: TU DO, goi y cac gia tri chuan:
--   'avatar'     = hinh dai dien
--   'bo_quan_co' = bo quan co (emoji/hinh, tham so trong du_lieu)
--   'ban_co'     = giao dien ban co (bo mau trong du_lieu)
--   'hieu_ung'   = hieu ung CSS/SVG/emoji (tham so trong du_lieu)
--   'qua'        = qua VAT LY - loai DUY NHAT can quan tri trao tay
--   (tuong lai them loai moi: chi can them dong du lieu, khong sua CSDL)
-- ma_dinh_danh: ma ngan gon de JavaScript nhan dien va ap dung
--   (vi du 'quan_khung_long', 'ban_co_bien_xanh', 'phao_hoa_vang')
-- du_lieu (jsonb): tham so hien thi cua vat pham, vi du:
--   bo_quan_co: {"k":"🦖","q":"🦕","r":"🐢","b":"🦎","n":"🐊","p":"🥚"}
--   ban_co:     {"mauSang":"#e8f4ff","mauToi":"#5b8def"}
--   hieu_ung:   {"kieu":"phao_hoa","boEmoji":["✨","🎉"],"thoiLuongGiay":3}
-- CONG NGHE HIEU UNG: CSS Animation + SVG/emoji (khong dung Lottie de giu nhe);
--   hieu ung moi = them dong du lieu, board.js doc du_lieu de chay.
-- so_luong: null = khong gioi han. moc_level: khac null = mien phi khi du level.
-- ------------------------------------------------------------
create table if not exists vat_pham (
  id              bigint generated always as identity primary key,
  loai            text not null,
  ten             text not null,
  mo_ta           text default '',
  gia_kim_cuong   int not null default 0,
  url_hinh        text default '',
  ma_dinh_danh    text default '',
  du_lieu         jsonb not null default '{}'::jsonb,
  so_luong        int,
  da_doi          int not null default 0,
  hien_thi        boolean not null default true,
  thu_tu_hien_thi int not null default 0,
  moc_level       int
);

-- Bo sung cot moi neu bang da ton tai tu ban V1/V2
alter table vat_pham add column if not exists ma_dinh_danh text default '';
alter table vat_pham add column if not exists du_lieu jsonb not null default '{}'::jsonb;

alter table vat_pham enable row level security;


-- ------------------------------------------------------------
-- PHAN G: BANG LICH SU DOI QUA (NC_05 xem, NC_06 ghi va xac nhan)
-- trang_thai: 'cho_trao' (qua vat ly, cho quan tri xac nhan) hoac 'da_nhan'
-- Vat pham SO nhan ngay nen ghi 'da_nhan' luon.
-- Bang nay dong thoi la nguon xac dinh VAT PHAM SO DA SO HUU cua moi tai khoan.
-- ------------------------------------------------------------
create table if not exists lich_su_doi_qua (
  id                 bigint generated always as identity primary key,
  ten_dang_nhap      text not null references tai_khoan(ten_dang_nhap),
  vat_pham_id        bigint not null references vat_pham(id),
  gia_luc_doi        int not null,
  trang_thai         text not null default 'cho_trao',
  thoi_gian_doi      timestamptz default now(),
  thoi_gian_xac_nhan timestamptz
);

alter table lich_su_doi_qua enable row level security;


-- ------------------------------------------------------------
-- PHAN G1B: BANG LICH SU TUNG TRAN (thong ke chi tiet moi tran cho tre)
-- Moi tran ghi 1 dong theo GOC NHIN cua chinh tre do:
--   - Dau may: doi_thu = 'May cap N', che_do = 'may'
--   - Dau nguoi: doi_thu = ten tre kia, che_do = 'nguoi'; MOI tran tao 2 dong
--     doi xung (moi ben 1 dong) de moi tre xem duoc lich su cua minh.
-- ket_qua chuan hoa: 'thang' | 'thua' | 'hoa' (dau may chi co thang/thua/hoa;
--     theo luat hien tai dau may khong thang thi tinh la thua/hoa -> 'thua').
-- Bang nay chi de HIEN THI lich su; so dem tong van giu o bang tai_khoan
-- (tran_may_*, tran_2n_*) de xep hang nhanh.
-- ------------------------------------------------------------
create table if not exists lich_su_tran (
  id            bigint generated always as identity primary key,
  ten_dang_nhap text not null references tai_khoan(ten_dang_nhap),
  che_do        text not null,          -- 'may' hoac 'nguoi'
  doi_thu       text not null default '',
  ket_qua       text not null,          -- 'thang' | 'thua' | 'hoa'
  cap_may       int,                    -- chi co y nghia khi che_do='may'
  thoi_gian     timestamptz default now()
);

alter table lich_su_tran enable row level security;

-- Chi so giup lay nhanh 50 tran gan nhat cua 1 tre
create index if not exists idx_lich_su_tran_ten_thoi_gian
  on lich_su_tran (ten_dang_nhap, thoi_gian desc);


-- ------------------------------------------------------------
-- PHAN G2: BANG Y TUONG CUA TRE (NC_07 - Hoc tap & Kham pha)
-- chuyen_muc: 'hoc_tap' (tu trang hoctap.html), 'kham_pha' (tu khampha.html),
--             'tro_choi' (gop y tinh nang tro choi)
-- trang_thai: 'moi' | 'da_xem' (quan tri danh dau)
-- ------------------------------------------------------------
create table if not exists y_tuong (
  id            bigint generated always as identity primary key,
  ten_dang_nhap text not null references tai_khoan(ten_dang_nhap),
  chuyen_muc    text not null,
  noi_dung      text not null,
  trang_thai    text not null default 'moi',
  ngay_gui      timestamptz default now()
);

alter table y_tuong enable row level security;


-- ------------------------------------------------------------
-- PHAN H: VIET LAI HAM cap_nhat_diem (thay ban MIG_01)
-- Giu nguyen ten ham, tham so va cau truc JSON tra ve -> board.js KHONG phai sua.
-- Khac biet:
--   1) He so diem thang, diem khich le HOA/THUA (tach rieng), level toi da
--      DOC TU BANG cau_hinh_chung: thang = level may x he_so_diem_thang;
--      hoa = diem_khich_le_hoa (mac dinh 10); thua = diem_khich_le_thua (mac dinh 5).
--   2) Cong don kinh_nghiem (EXP) = tong diem tung kiem duoc, KHONG giam khi tieu.
--   3) Cong don thanh tich dau may: tran_may_thang / tran_may_khac.
--   4) Bo sung 'kinhNghiemMoi' vao ketQuaCapNhat (truong moi, code cu khong hong).
-- ------------------------------------------------------------
create or replace function cap_nhat_diem(p_ten text, p_ket_qua text, p_level_may int)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row           tai_khoan%rowtype;
  v_he_so         int;
  v_khich_le_hoa  int;
  v_khich_le_thua int;
  v_level_max     int;
  v_level_cu      int;
  v_diem_cu       int;
  v_level_moi     int;
  v_diem_moi      int;
  v_diem_cong     int;
  v_exp_moi       int;
  v_dat_moc       boolean;
begin
  select * into v_row from tai_khoan where ten_dang_nhap = p_ten;
  if not found then
    return json_build_object('thanhCong', false, 'thongBao', 'Khong tim thay tai khoan: ' || p_ten);
  end if;

  -- Doc cac he so tu bang cau hinh, co gia tri du phong neu thieu
  select coalesce((select gia_tri::int from cau_hinh_chung where khoa = 'he_so_diem_thang'), 100) into v_he_so;
  select coalesce((select gia_tri::int from cau_hinh_chung where khoa = 'diem_khich_le_hoa'), 10) into v_khich_le_hoa;
  select coalesce((select gia_tri::int from cau_hinh_chung where khoa = 'diem_khich_le_thua'), 5) into v_khich_le_thua;
  select coalesce((select gia_tri::int from cau_hinh_chung where khoa = 'level_toi_da'), 20) into v_level_max;

  v_level_cu  := v_row.level;
  v_diem_cu   := v_row.diem_so;
  v_level_moi := v_level_cu;

  if p_ket_qua = 'thang' then
    v_diem_cong := p_level_may * v_he_so;
    if v_level_cu < v_level_max then
      v_level_moi := v_level_cu + 1;
    end if;
  elsif p_ket_qua = 'hoa' then
    v_diem_cong := v_khich_le_hoa;
  else
    v_diem_cong := v_khich_le_thua;
  end if;

  v_diem_moi := v_diem_cu + v_diem_cong;
  v_exp_moi  := v_row.kinh_nghiem + v_diem_cong;

  update tai_khoan set
    level          = v_level_moi,
    diem_so        = v_diem_moi,
    kinh_nghiem    = v_exp_moi,
    tran_may_thang = tran_may_thang + (case when p_ket_qua = 'thang' then 1 else 0 end),
    tran_may_khac  = tran_may_khac  + (case when p_ket_qua = 'thang' then 0 else 1 end),
    lan_choi_cuoi  = now()
  where ten_dang_nhap = p_ten;

  -- Ghi 1 dong lich su tran dau may (goc nhin cua tre).
  -- Chuan hoa ket qua: 'thang' giu nguyen; con lai coi la 'thua' (dau may
  -- theo luat hien tai khong tinh hoa rieng, nhung neu goi vao 'hoa' van ghi dung).
  insert into lich_su_tran (ten_dang_nhap, che_do, doi_thu, ket_qua, cap_may)
  values (
    p_ten, 'may', 'May cap ' || coalesce(p_level_may, 0)::text,
    case when p_ket_qua = 'thang' then 'thang'
         when p_ket_qua = 'hoa'   then 'hoa'
         else 'thua' end,
    p_level_may
  );

  v_dat_moc := (v_level_moi <> v_level_cu) and (v_level_moi in (5, 10, 15, 20));

  return json_build_object(
    'thanhCong', true,
    'thongBao', case when p_ket_qua = 'thang' then 'Chuc mung ban da thang!'
                     when p_ket_qua = 'hoa'   then 'Van co hoa, choi tot lam!'
                     else 'Ban da thua, co gang lan sau nhe!' end,
    'ketQuaCapNhat', json_build_object(
      'levelCu',       v_level_cu,
      'levelMoi',      v_level_moi,
      'diemCu',        v_diem_cu,
      'diemMoi',       v_diem_moi,
      'diemVuaCong',   v_diem_cong,
      'kinhNghiemMoi', v_exp_moi,
      'danhHieu',      tinh_danh_hieu(v_level_moi),
      'vuaDatMocMoi',  v_dat_moc,
      'trangThaiMoKhoa', json_build_object(
        'mauBanCoMoi',        v_level_moi >= 5,
        'quanCoDongVat',      v_level_moi >= 10,
        'hieuUngSamSet',      v_level_moi >= 15,
        'ruongKhoBauDacBiet', v_level_moi >= 20
      )
    )
  );
end;
$$;


-- ------------------------------------------------------------
-- PHAN I: RPC LAY TOAN BO CAU HINH (NC_01, NC_02, NC_03)
-- Giao dien goi 1 lan luc khoi dong de lay: cau hinh chung, 20 cap do,
-- va danh sach loi dong vien dang hien thi.
-- ------------------------------------------------------------
create or replace function lay_cau_hinh()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_chung  json;
  v_cap_do json;
  v_loi    json;
begin
  select json_object_agg(khoa, gia_tri) into v_chung from cau_hinh_chung;

  select json_agg(json_build_object(
    'capDo',          cap_do,
    'tyLeNgauNhien',  ty_le_ngau_nhien,
    'skillLevel',     skill_level,
    'doSau',          do_sau,
    'goiYGioiHan',    goi_y_gioi_han,
    'goiYChiPhi',     goi_y_chi_phi
  ) order by cap_do) into v_cap_do from cau_hinh_cap_do;

  select json_agg(json_build_object('loai', loai, 'noiDung', noi_dung))
    into v_loi from loi_dong_vien where hien_thi = true;

  return json_build_object(
    'thanhCong',    true,
    'thongBao',     'Lay cau hinh thanh cong',
    'cauHinhChung', coalesce(v_chung, '{}'::json),
    'cauHinhCapDo', coalesce(v_cap_do, '[]'::json),
    'loiDongVien',  coalesce(v_loi, '[]'::json)
  );
end;
$$;


-- ------------------------------------------------------------
-- PHAN J: RPC TRU KIM CUONG KHI DUNG GOI Y (NC_03)
-- May chu tu doc level tai khoan -> tra cuu chi phi trong cau_hinh_cap_do.
-- Kim cuong khong bao gio am. Gioi han so lan goi y MOI VAN do giao dien
-- theo doi (dua tren goiYGioiHan tra ve tu lay_cau_hinh).
-- Luu y: goi y KHONG tru EXP (kinh_nghiem chi tang).
-- ------------------------------------------------------------
create or replace function tru_diem_goi_y(p_ten text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row      tai_khoan%rowtype;
  v_cfg      cau_hinh_cap_do%rowtype;
  v_chi_phi  int := 0;
  v_gioi_han int := null;
  v_diem_moi int;
begin
  select * into v_row from tai_khoan where ten_dang_nhap = p_ten;
  if not found then
    return json_build_object('thanhCong', false, 'thongBao', 'Khong tim thay tai khoan: ' || p_ten);
  end if;

  select * into v_cfg from cau_hinh_cap_do where cap_do = v_row.level;
  if found then
    v_chi_phi  := v_cfg.goi_y_chi_phi;
    v_gioi_han := v_cfg.goi_y_gioi_han;
  end if;

  -- Tru toi da bang so kim cuong dang co (khong de am)
  v_chi_phi  := least(v_chi_phi, v_row.diem_so);
  v_diem_moi := v_row.diem_so - v_chi_phi;

  update tai_khoan set diem_so = v_diem_moi, lan_choi_cuoi = now()
    where ten_dang_nhap = p_ten;

  return json_build_object(
    'thanhCong',   true,
    'thongBao',    'Da tru kim cuong goi y',
    'chiPhiDaTru', v_chi_phi,
    'diemMoi',     v_diem_moi,
    'gioiHanMoiVan', v_gioi_han
  );
end;
$$;


-- ------------------------------------------------------------
-- PHAN K: RPC CA NHAN (NC_05 - TRANG TAI KHOAN)
-- cap_nhat_avatar:       giu lai cho tuong thich (avatar la 1 loai trang bi)
-- cap_nhat_trang_bi:     chon vat pham so dang dung theo loai (avatar,
--                        bo_quan_co, ban_co, hieu_ung...) - giao dien chi cho
--                        chon trong danh sach mien phi hoac da so huu
-- lay_thong_tin_ca_nhan: ban nhe cho THANH TREN CUNG (goi thuong xuyen)
-- lay_ho_so:             ban day du cho TRANG TAI KHOAN, gom trong 1 lan goi:
--                        thong tin + vat pham so huu + lich su doi thuong
-- ------------------------------------------------------------
create or replace function cap_nhat_avatar(p_ten text, p_avatar text)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  update tai_khoan set
    avatar_da_chon = coalesce(p_avatar, ''),
    trang_bi = jsonb_set(coalesce(trang_bi, '{}'::jsonb), array['avatar'], to_jsonb(coalesce(p_avatar, '')))
    where ten_dang_nhap = p_ten;
  if not found then
    return json_build_object('thanhCong', false, 'thongBao', 'Khong tim thay tai khoan: ' || p_ten);
  end if;
  return json_build_object('thanhCong', true, 'thongBao', 'Da doi avatar', 'avatarDaChon', coalesce(p_avatar, ''));
end;
$$;

create or replace function cap_nhat_trang_bi(p_ten text, p_loai text, p_ma text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trang_bi jsonb;
begin
  if p_loai is null or length(p_loai) = 0 then
    return json_build_object('thanhCong', false, 'thongBao', 'Thieu loai trang bi');
  end if;

  update tai_khoan set
    trang_bi = jsonb_set(coalesce(trang_bi, '{}'::jsonb), array[p_loai], to_jsonb(coalesce(p_ma, ''))),
    avatar_da_chon = case when p_loai = 'avatar' then coalesce(p_ma, '') else avatar_da_chon end
    where ten_dang_nhap = p_ten
    returning trang_bi into v_trang_bi;

  if v_trang_bi is null then
    return json_build_object('thanhCong', false, 'thongBao', 'Khong tim thay tai khoan: ' || p_ten);
  end if;

  return json_build_object('thanhCong', true, 'thongBao', 'Da cap nhat trang bi', 'trangBi', v_trang_bi);
end;
$$;

-- ------------------------------------------------------------
-- PHAN K2: HAM PHU TRO TINH XEP HANG (dung chung cho ca nhan va bang xep hang)
-- XEP HANG THEO 3 TIEU CHI (yeu cau moi cua nguoi dung):
--   1) EXP (kinh_nghiem) - giam dan
--   2) Tong so tran thang = thang may + thang nguoi - giam dan
--   3) Ty le thang = tong thang / tong tran (gop ca may va nguoi) - giam dan
--   4) Ten dang nhap - tang dan (pha hoa tuyet doi de hang on dinh)
-- Luu y: KIM CUONG (diem_so) KHONG con anh huong xep hang, nen tieu kim cuong
--        KHONG lam giam thu hang (dung yeu cau moi).
-- ------------------------------------------------------------

-- Tong so tran thang (may + nguoi)
create or replace function tinh_tong_thang(r tai_khoan)
returns int
language sql
immutable
as $$
  select coalesce(r.tran_may_thang, 0) + coalesce(r.tran_2n_thang, 0);
$$;

-- Tong so tran da choi (may: thang + khac; nguoi: thang + thua + hoa)
create or replace function tinh_tong_tran(r tai_khoan)
returns int
language sql
immutable
as $$
  select coalesce(r.tran_may_thang, 0) + coalesce(r.tran_may_khac, 0)
       + coalesce(r.tran_2n_thang, 0) + coalesce(r.tran_2n_thua, 0) + coalesce(r.tran_2n_hoa, 0);
$$;

-- Ty le thang (0..1); chua choi tran nao thi = 0, khong chia cho 0
create or replace function tinh_ty_le_thang(r tai_khoan)
returns numeric
language sql
immutable
as $$
  select case when tinh_tong_tran(r) = 0 then 0
              else tinh_tong_thang(r)::numeric / tinh_tong_tran(r)::numeric end;
$$;

-- Tra ve TRUE neu tai khoan a xep TREN tai khoan b theo 3 tieu chi + ten
create or replace function xep_hang_hon(a tai_khoan, b tai_khoan)
returns boolean
language sql
immutable
as $$
  select
    (a.kinh_nghiem >  b.kinh_nghiem)
    or (a.kinh_nghiem = b.kinh_nghiem and tinh_tong_thang(a) >  tinh_tong_thang(b))
    or (a.kinh_nghiem = b.kinh_nghiem and tinh_tong_thang(a) =  tinh_tong_thang(b)
        and tinh_ty_le_thang(a) >  tinh_ty_le_thang(b))
    or (a.kinh_nghiem = b.kinh_nghiem and tinh_tong_thang(a) =  tinh_tong_thang(b)
        and tinh_ty_le_thang(a) =  tinh_ty_le_thang(b)
        and a.ten_dang_nhap < b.ten_dang_nhap);
$$;

create or replace function lay_thong_tin_ca_nhan(p_ten text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row  tai_khoan%rowtype;
  v_hang int;
begin
  select * into v_row from tai_khoan where ten_dang_nhap = p_ten;
  if not found then
    return json_build_object('thanhCong', false, 'thongBao', 'Khong tim thay tai khoan: ' || p_ten);
  end if;

  -- Hang = so nguoi xep TREN minh + 1 (theo 3 tieu chi EXP -> tong thang -> ty le thang)
  select count(*) + 1 into v_hang
  from tai_khoan t
  where xep_hang_hon(t, v_row);

  return json_build_object(
    'thanhCong', true,
    'thongBao',  'Lay thong tin thanh cong',
    'thongTin', json_build_object(
      'tenDangNhap',  v_row.ten_dang_nhap,
      'level',        v_row.level,
      'diemSo',       v_row.diem_so,
      'kinhNghiem',   v_row.kinh_nghiem,
      'danhHieu',     tinh_danh_hieu(v_row.level),
      'avatarDaChon', coalesce(v_row.avatar_da_chon, ''),
      'trangBi',      coalesce(v_row.trang_bi, '{}'::jsonb),
      'vaiTro',       v_row.vai_tro,
      'hangThu',      v_hang,
      'tranMayThang', v_row.tran_may_thang,
      'tranMayKhac',  v_row.tran_may_khac,
      'tran2nThang',  v_row.tran_2n_thang,
      'tran2nThua',   v_row.tran_2n_thua,
      'tran2nHoa',    v_row.tran_2n_hoa,
      'tongThang',    tinh_tong_thang(v_row),
      'tongTran',     tinh_tong_tran(v_row),
      'tyLeThang',    round(tinh_ty_le_thang(v_row) * 100, 1)  -- phan tram, 1 chu so thap phan
    )
  );
end;
$$;

-- ------------------------------------------------------------
-- PHAN K3: RPC BANG XEP HANG (viet lai, thay ban MIG_01)
-- Giu nguyen ten ham lay_xep_hang va cau truc danhSachXepHang de rank.js
-- KHONG phai sua. Bo sung cac truong kinhNghiem/tongThang/tyLeThang de sau nay
-- giao dien co the doi cot "Diem So" thanh "EXP" (viec do lam o buoc NC_05).
-- Sap xep theo 3 tieu chi: EXP -> tong thang -> ty le thang -> ten.
-- ------------------------------------------------------------
create or replace function lay_xep_hang()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ds json;
begin
  select json_agg(row_to_json(t)) into v_ds
  from (
    select
      row_number() over (
        order by kinh_nghiem desc,
                 (coalesce(tran_may_thang,0) + coalesce(tran_2n_thang,0)) desc,
                 (case when (coalesce(tran_may_thang,0)+coalesce(tran_may_khac,0)+coalesce(tran_2n_thang,0)+coalesce(tran_2n_thua,0)+coalesce(tran_2n_hoa,0)) = 0
                       then 0
                       else (coalesce(tran_may_thang,0)+coalesce(tran_2n_thang,0))::numeric
                            / (coalesce(tran_may_thang,0)+coalesce(tran_may_khac,0)+coalesce(tran_2n_thang,0)+coalesce(tran_2n_thua,0)+coalesce(tran_2n_hoa,0))::numeric
                  end) desc,
                 ten_dang_nhap asc
      )                                                                   as "hangThu",
      ten_dang_nhap                                                       as "tenDangNhap",
      coalesce(avatar_da_chon, '')                                        as "avatarDaChon",
      level                                                              as "level",
      diem_so                                                            as "diemSo",
      kinh_nghiem                                                        as "kinhNghiem",
      tinh_danh_hieu(level)                                              as "danhHieu",
      -- So lieu tho cho 7 kieu sap xep phia giao dien (rank.js tu sap):
      coalesce(tran_may_thang,0)                                          as "thangMay",
      coalesce(tran_2n_thang,0)                                           as "thangNguoi",
      (coalesce(tran_may_thang,0) + coalesce(tran_2n_thang,0))            as "tongThang",
      (coalesce(tran_may_thang,0)+coalesce(tran_may_khac,0))             as "tongTranMay",
      (coalesce(tran_2n_thang,0)+coalesce(tran_2n_thua,0)+coalesce(tran_2n_hoa,0)) as "tongTranNguoi",
      (coalesce(tran_may_thang,0)+coalesce(tran_may_khac,0)+coalesce(tran_2n_thang,0)+coalesce(tran_2n_thua,0)+coalesce(tran_2n_hoa,0)) as "tongTran",
      -- Ty le thang CHUNG (%), gop may + nguoi
      round(
        (case when (coalesce(tran_may_thang,0)+coalesce(tran_may_khac,0)+coalesce(tran_2n_thang,0)+coalesce(tran_2n_thua,0)+coalesce(tran_2n_hoa,0)) = 0
              then 0
              else (coalesce(tran_may_thang,0)+coalesce(tran_2n_thang,0))::numeric
                   / (coalesce(tran_may_thang,0)+coalesce(tran_may_khac,0)+coalesce(tran_2n_thang,0)+coalesce(tran_2n_thua,0)+coalesce(tran_2n_hoa,0))::numeric
         end) * 100, 1)                                                  as "tyLeThang",
      -- Ty le thang khi dau MAY (%)
      round(
        (case when (coalesce(tran_may_thang,0)+coalesce(tran_may_khac,0)) = 0
              then 0
              else coalesce(tran_may_thang,0)::numeric
                   / (coalesce(tran_may_thang,0)+coalesce(tran_may_khac,0))::numeric
         end) * 100, 1)                                                  as "tyLeThangMay",
      -- Ty le thang khi dau NGUOI (%)
      round(
        (case when (coalesce(tran_2n_thang,0)+coalesce(tran_2n_thua,0)+coalesce(tran_2n_hoa,0)) = 0
              then 0
              else coalesce(tran_2n_thang,0)::numeric
                   / (coalesce(tran_2n_thang,0)+coalesce(tran_2n_thua,0)+coalesce(tran_2n_hoa,0))::numeric
         end) * 100, 1)                                                  as "tyLeThangNguoi"
    from tai_khoan
    order by "hangThu"
    limit 100
  ) t;

  return json_build_object(
    'thanhCong', true,
    'thongBao',  'Lay bang xep hang thanh cong',
    'danhSachXepHang', coalesce(v_ds, '[]'::json)
  );
end;
$$;

create or replace function lay_ho_so(p_ten text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_thong_tin json;
  v_vat_pham  json;
  v_lich_su   json;
  v_lich_su_tran json;
begin
  -- Phan 1: thong tin ca nhan (dung lai ham tren)
  v_thong_tin := lay_thong_tin_ca_nhan(p_ten);
  if (v_thong_tin ->> 'thanhCong') <> 'true' then
    return v_thong_tin; -- tra nguyen thong bao loi
  end if;

  -- Phan 2: danh sach VAT PHAM SO DA SO HUU (moi loai tru 'qua'),
  -- suy ra tu lich su doi qua; dung de tre chon trang bi
  select json_agg(json_build_object(
    'id', t.id, 'loai', t.loai, 'ten', t.ten,
    'maDinhDanh', t.ma_dinh_danh, 'urlHinh', t.url_hinh, 'duLieu', t.du_lieu
  )) into v_vat_pham
  from (
    select distinct vp.id, vp.loai, vp.ten, vp.ma_dinh_danh, vp.url_hinh, vp.du_lieu
    from lich_su_doi_qua ls
    join vat_pham vp on vp.id = ls.vat_pham_id
    where ls.ten_dang_nhap = p_ten and vp.loai <> 'qua'
  ) t;

  -- Phan 3: lich su doi thuong cua chinh minh
  select json_agg(json_build_object(
    'id',              ls.id,
    'tenVatPham',      vp.ten,
    'loai',            vp.loai,
    'urlHinh',         vp.url_hinh,
    'giaLucDoi',       ls.gia_luc_doi,
    'trangThai',       ls.trang_thai,
    'thoiGianDoi',     ls.thoi_gian_doi,
    'thoiGianXacNhan', ls.thoi_gian_xac_nhan
  ) order by ls.thoi_gian_doi desc) into v_lich_su
  from lich_su_doi_qua ls
  join vat_pham vp on vp.id = ls.vat_pham_id
  where ls.ten_dang_nhap = p_ten;

  -- Phan 4: lich su 50 tran gan nhat (dau may + dau nguoi)
  select json_agg(row_to_json(x)) into v_lich_su_tran
  from (
    select
      id                     as "id",
      che_do                 as "cheDo",
      doi_thu                as "doiThu",
      ket_qua                as "ketQua",
      cap_may                as "capMay",
      thoi_gian              as "thoiGian"
    from lich_su_tran
    where ten_dang_nhap = p_ten
    order by thoi_gian desc
    limit 50
  ) x;

  return json_build_object(
    'thanhCong', true,
    'thongBao',  'Lay ho so thanh cong',
    'hoSo', json_build_object(
      'thongTin',      v_thong_tin -> 'thongTin',
      'vatPhamSoHuu',  coalesce(v_vat_pham, '[]'::json),
      'lichSuDoiQua',  coalesce(v_lich_su, '[]'::json),
      'lichSuTran',    coalesce(v_lich_su_tran, '[]'::json)
    )
  );
end;
$$;

-- RPC rieng lay 50 tran gan nhat (dung khi Trang Tai Khoan chi can lam moi bang tran)
create or replace function lay_lich_su_tran(p_ten text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ds json;
begin
  select json_agg(row_to_json(x)) into v_ds
  from (
    select
      id         as "id",
      che_do     as "cheDo",
      doi_thu    as "doiThu",
      ket_qua    as "ketQua",
      cap_may    as "capMay",
      thoi_gian  as "thoiGian"
    from lich_su_tran
    where ten_dang_nhap = p_ten
    order by thoi_gian desc
    limit 50
  ) x;

  return json_build_object('thanhCong', true, 'thongBao', 'Lay lich su tran thanh cong',
                           'lichSuTran', coalesce(v_ds, '[]'::json));
end;
$$;

-- RPC THONG KE THEO DOI THU (NC_05 - Trang Tai Khoan, tre xem duoc):
-- Gom nhom TOAN BO lich_su_tran cua 1 tre theo DOI THU (ke ca 'May cap N'),
-- tra ve: doi thu, che do, tong tran, so thang, so thua, so hoa.
-- Sap xep MAC DINH: so tran THANG giam dan -> tong tran giam dan -> ten doi thu.
create or replace function lay_thong_ke_doi_thu(p_ten text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ds json;
begin
  select json_agg(row_to_json(x)) into v_ds
  from (
    select
      doi_thu                                                    as "doiThu",
      che_do                                                     as "cheDo",
      count(*)::int                                              as "tongTran",
      count(*) filter (where ket_qua = 'thang')::int             as "thang",
      count(*) filter (where ket_qua = 'thua')::int              as "thua",
      count(*) filter (where ket_qua = 'hoa')::int               as "hoa"
    from lich_su_tran
    where ten_dang_nhap = p_ten
    group by doi_thu, che_do
    order by count(*) filter (where ket_qua = 'thang') desc,
             count(*) desc,
             doi_thu asc
  ) x;

  return json_build_object('thanhCong', true, 'thongBao', 'Lay thong ke doi thu thanh cong',
                           'thongKeDoiThu', coalesce(v_ds, '[]'::json));
end;
$$;


-- ------------------------------------------------------------
-- PHAN L: RPC CHE DO 2 NGUOI CHOI (NC_04)
-- ------------------------------------------------------------

-- Ham phu tro: dong goi 1 phong thanh JSON camelCase cho giao dien
create or replace function phong_thanh_json(p phong_cho)
returns json
language sql
stable
as $$
  select json_build_object(
    'id',            p.id,
    'tenPhong',      p.ten_phong,
    'chuPhong',      p.chu_phong,
    'khach',         coalesce(p.khach, ''),
    'trangThai',     p.trang_thai,
    'fenHienTai',    p.fen_hien_tai,
    'nuocDiCuoi',    coalesce(p.nuoc_di_cuoi, ''),
    'danhSachNuoc',  p.danh_sach_nuoc,
    'luotHienTai',   p.luot_hien_tai,
    'ketQua',        coalesce(p.ket_qua, ''),
    'capNhatLuc',    p.cap_nhat_luc
  );
$$;

-- Tao phong moi. Tu dong dong cac phong cu chua ket thuc cua cung chu phong.
create or replace function tao_phong(p_ten text, p_ten_phong text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ton_tai int;
  v_phong   phong_cho%rowtype;
begin
  select count(*) into v_ton_tai from tai_khoan where ten_dang_nhap = p_ten;
  if v_ton_tai = 0 then
    return json_build_object('thanhCong', false, 'thongBao', 'Khong tim thay tai khoan: ' || p_ten);
  end if;

  update phong_cho set trang_thai = 'ket_thuc', cap_nhat_luc = now()
    where chu_phong = p_ten and trang_thai in ('mo', 'cho_duyet', 'dang_choi');

  insert into phong_cho (ten_phong, chu_phong)
    values (coalesce(nullif(trim(p_ten_phong), ''), 'Phong cua ' || p_ten), p_ten)
    returning * into v_phong;

  return json_build_object('thanhCong', true, 'thongBao', 'Da tao phong', 'phong', phong_thanh_json(v_phong));
end;
$$;

-- Lay danh sach phong dang mo hoac dang cho duyet
create or replace function lay_danh_sach_phong()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ds json;
begin
  select json_agg(phong_thanh_json(p) order by p.ngay_tao desc) into v_ds
  from (
    select * from phong_cho
    where trang_thai in ('mo', 'cho_duyet')
    order by ngay_tao desc
    limit 20
  ) p;

  return json_build_object('thanhCong', true, 'thongBao', 'Lay danh sach phong thanh cong',
                           'danhSachPhong', coalesce(v_ds, '[]'::json));
end;
$$;

-- Khach xin vao 1 phong dang mo
create or replace function xin_vao_phong(p_id bigint, p_ten text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phong phong_cho%rowtype;
begin
  select * into v_phong from phong_cho where id = p_id;
  if not found then
    return json_build_object('thanhCong', false, 'thongBao', 'Khong tim thay phong');
  end if;
  if v_phong.trang_thai <> 'mo' then
    return json_build_object('thanhCong', false, 'thongBao', 'Phong nay khong con mo');
  end if;
  if v_phong.chu_phong = p_ten then
    return json_build_object('thanhCong', false, 'thongBao', 'Ban la chu phong, khong the tu xin vao');
  end if;

  update phong_cho set khach = p_ten, trang_thai = 'cho_duyet', cap_nhat_luc = now()
    where id = p_id
    returning * into v_phong;

  return json_build_object('thanhCong', true, 'thongBao', 'Da gui yeu cau, cho chu phong dong y', 'phong', phong_thanh_json(v_phong));
end;
$$;

-- Chu phong tra loi yeu cau xin vao: dong y -> dang_choi, tu choi -> mo lai
create or replace function tra_loi_xin_vao(p_id bigint, p_ten_chu text, p_dong_y boolean)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phong phong_cho%rowtype;
begin
  select * into v_phong from phong_cho where id = p_id;
  if not found then
    return json_build_object('thanhCong', false, 'thongBao', 'Khong tim thay phong');
  end if;
  if v_phong.chu_phong <> p_ten_chu then
    return json_build_object('thanhCong', false, 'thongBao', 'Chi chu phong moi duoc tra loi');
  end if;
  if v_phong.trang_thai <> 'cho_duyet' then
    return json_build_object('thanhCong', false, 'thongBao', 'Phong khong o trang thai cho duyet');
  end if;

  if p_dong_y then
    update phong_cho set trang_thai = 'dang_choi', cap_nhat_luc = now()
      where id = p_id returning * into v_phong;
  else
    update phong_cho set khach = null, trang_thai = 'mo', cap_nhat_luc = now()
      where id = p_id returning * into v_phong;
  end if;

  return json_build_object('thanhCong', true,
    'thongBao', case when p_dong_y then 'Da dong y, bat dau van co' else 'Da tu choi yeu cau' end,
    'phong', phong_thanh_json(v_phong));
end;
$$;

-- Gui 1 nuoc di. Giao dien tinh san FEN moi va luot moi bang chess.js roi gui len.
-- Chu phong = quan Trang (w), khach = quan Den (b).
create or replace function gui_nuoc_di(p_id bigint, p_ten text, p_nuoc text, p_fen_moi text, p_luot_moi text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phong phong_cho%rowtype;
  v_mau   text;
begin
  select * into v_phong from phong_cho where id = p_id;
  if not found then
    return json_build_object('thanhCong', false, 'thongBao', 'Khong tim thay phong');
  end if;
  if v_phong.trang_thai <> 'dang_choi' then
    return json_build_object('thanhCong', false, 'thongBao', 'Phong khong o trang thai dang choi');
  end if;

  if p_ten = v_phong.chu_phong then v_mau := 'w';
  elsif p_ten = v_phong.khach then v_mau := 'b';
  else
    return json_build_object('thanhCong', false, 'thongBao', 'Ban khong o trong phong nay');
  end if;

  if v_phong.luot_hien_tai <> v_mau then
    return json_build_object('thanhCong', false, 'thongBao', 'Chua den luot cua ban');
  end if;

  update phong_cho set
    danh_sach_nuoc = danh_sach_nuoc || to_jsonb(p_nuoc),
    fen_hien_tai   = p_fen_moi,
    nuoc_di_cuoi   = p_nuoc,
    luot_hien_tai  = p_luot_moi,
    cap_nhat_luc   = now()
  where id = p_id
  returning * into v_phong;

  return json_build_object('thanhCong', true, 'thongBao', 'Da ghi nuoc di', 'phong', phong_thanh_json(v_phong));
end;
$$;

-- Lay trang thai 1 phong (dung cho polling du phong khi Realtime truc trac)
create or replace function lay_phong(p_id bigint)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phong phong_cho%rowtype;
begin
  select * into v_phong from phong_cho where id = p_id;
  if not found then
    return json_build_object('thanhCong', false, 'thongBao', 'Khong tim thay phong');
  end if;
  return json_build_object('thanhCong', true, 'thongBao', 'Lay phong thanh cong', 'phong', phong_thanh_json(v_phong));
end;
$$;

-- Ket thuc van 2 nguoi + cap nhat thong ke thang/thua/hoa cho ca 2 ben
-- + CONG KIM CUONG & EXP cho ca 2 ben (yeu cau NC_04, Ke hoach V9):
--   Muc thuong = muc thuong dau may tuong duong CHIA cho he_so_chia_thuong_2n
--   (mac dinh 3, tuc bang 1/3 so voi may; quan tri chinh trong Table Editor):
--     - Ben THANG: (level cua DOI THU x he_so_diem_thang) / he_so (doi thu
--       level cang cao thuong cang lon, giong logic level may khi dau may)
--     - HOA:  diem_khich_le_hoa / he_so   - THUA: diem_khich_le_thua / he_so
--   Lam tron thong thuong, TOI THIEU 1 kim cuong de tre luon duoc khich le.
--   EXP cong BANG so kim cuong cong (quy tac chung cua he thong).
--   LUU Y: thang 2 nguoi KHONG len level (level chi tang khi thang MAY o
--   dung cap - giu nguyen quy tac cu, tranh 2 tre "keo level" cho nhau).
-- p_ket_qua: 'chu_thang' | 'khach_thang' | 'hoa' | 'huy' (huy = khong tinh thong ke)
create or replace function ket_thuc_phong(p_id bigint, p_ten text, p_ket_qua text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phong          phong_cho%rowtype;
  v_he_so          int;
  v_khich_le_hoa   int;
  v_khich_le_thua  int;
  v_chia           int;
  v_level_chu      int;
  v_level_khach    int;
  v_thuong_chu     int := 0;
  v_thuong_khach   int := 0;
begin
  select * into v_phong from phong_cho where id = p_id;
  if not found then
    return json_build_object('thanhCong', false, 'thongBao', 'Khong tim thay phong');
  end if;
  if p_ten <> v_phong.chu_phong and p_ten <> coalesce(v_phong.khach, '') then
    return json_build_object('thanhCong', false, 'thongBao', 'Ban khong o trong phong nay');
  end if;
  if v_phong.trang_thai = 'ket_thuc' then
    return json_build_object('thanhCong', true, 'thongBao', 'Phong da ket thuc truoc do', 'phong', phong_thanh_json(v_phong));
  end if;

  -- Chi cap nhat thong ke + thuong khi van dang choi that su va co ket qua ro rang
  if v_phong.trang_thai = 'dang_choi' and v_phong.khach is not null then

    -- Doc he so thuong tu cau hinh (co gia tri du phong)
    select coalesce((select gia_tri::int from cau_hinh_chung where khoa = 'he_so_diem_thang'), 100) into v_he_so;
    select coalesce((select gia_tri::int from cau_hinh_chung where khoa = 'diem_khich_le_hoa'), 10) into v_khich_le_hoa;
    select coalesce((select gia_tri::int from cau_hinh_chung where khoa = 'diem_khich_le_thua'), 5) into v_khich_le_thua;
    select greatest(coalesce((select gia_tri::int from cau_hinh_chung where khoa = 'he_so_chia_thuong_2n'), 3), 1) into v_chia;

    select level into v_level_chu   from tai_khoan where ten_dang_nhap = v_phong.chu_phong;
    select level into v_level_khach from tai_khoan where ten_dang_nhap = v_phong.khach;

    if p_ket_qua = 'chu_thang' then
      v_thuong_chu   := greatest(round(v_level_khach * v_he_so / v_chia::numeric)::int, 1);
      v_thuong_khach := greatest(round(v_khich_le_thua / v_chia::numeric)::int, 1);
      update tai_khoan set tran_2n_thang = tran_2n_thang + 1 where ten_dang_nhap = v_phong.chu_phong;
      update tai_khoan set tran_2n_thua  = tran_2n_thua  + 1 where ten_dang_nhap = v_phong.khach;
      -- Ghi 2 dong lich su doi xung (goc nhin tung ben)
      insert into lich_su_tran (ten_dang_nhap, che_do, doi_thu, ket_qua)
      values (v_phong.chu_phong, 'nguoi', v_phong.khach,      'thang'),
             (v_phong.khach,     'nguoi', v_phong.chu_phong,  'thua');
    elsif p_ket_qua = 'khach_thang' then
      v_thuong_khach := greatest(round(v_level_chu * v_he_so / v_chia::numeric)::int, 1);
      v_thuong_chu   := greatest(round(v_khich_le_thua / v_chia::numeric)::int, 1);
      update tai_khoan set tran_2n_thang = tran_2n_thang + 1 where ten_dang_nhap = v_phong.khach;
      update tai_khoan set tran_2n_thua  = tran_2n_thua  + 1 where ten_dang_nhap = v_phong.chu_phong;
      insert into lich_su_tran (ten_dang_nhap, che_do, doi_thu, ket_qua)
      values (v_phong.khach,     'nguoi', v_phong.chu_phong,  'thang'),
             (v_phong.chu_phong, 'nguoi', v_phong.khach,      'thua');
    elsif p_ket_qua = 'hoa' then
      v_thuong_chu   := greatest(round(v_khich_le_hoa / v_chia::numeric)::int, 1);
      v_thuong_khach := v_thuong_chu;
      update tai_khoan set tran_2n_hoa = tran_2n_hoa + 1
        where ten_dang_nhap in (v_phong.chu_phong, v_phong.khach);
      insert into lich_su_tran (ten_dang_nhap, che_do, doi_thu, ket_qua)
      values (v_phong.chu_phong, 'nguoi', v_phong.khach,     'hoa'),
             (v_phong.khach,     'nguoi', v_phong.chu_phong, 'hoa');
    end if;

    -- Cong kim cuong + EXP cho ca 2 ben (EXP = kim cuong; KHONG len level)
    if v_thuong_chu > 0 then
      update tai_khoan set diem_so = diem_so + v_thuong_chu,
                           kinh_nghiem = kinh_nghiem + v_thuong_chu,
                           lan_choi_cuoi = now()
        where ten_dang_nhap = v_phong.chu_phong;
    end if;
    if v_thuong_khach > 0 then
      update tai_khoan set diem_so = diem_so + v_thuong_khach,
                           kinh_nghiem = kinh_nghiem + v_thuong_khach,
                           lan_choi_cuoi = now()
        where ten_dang_nhap = v_phong.khach;
    end if;
  end if;

  update phong_cho set trang_thai = 'ket_thuc', ket_qua = coalesce(p_ket_qua, ''), cap_nhat_luc = now()
    where id = p_id
    returning * into v_phong;

  return json_build_object('thanhCong', true, 'thongBao', 'Da ket thuc van',
    'phong', phong_thanh_json(v_phong),
    'thuong', json_build_object(
      'chuPhong', json_build_object('ten', v_phong.chu_phong, 'kimCuongCong', v_thuong_chu),
      'khach',    json_build_object('ten', coalesce(v_phong.khach, ''), 'kimCuongCong', v_thuong_khach)
    ));
end;
$$;

-- Huy phong (chu phong huy khi chua choi) hoac khach rut yeu cau xin vao
create or replace function huy_phong(p_id bigint, p_ten text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phong phong_cho%rowtype;
begin
  select * into v_phong from phong_cho where id = p_id;
  if not found then
    return json_build_object('thanhCong', false, 'thongBao', 'Khong tim thay phong');
  end if;

  if p_ten = v_phong.chu_phong and v_phong.trang_thai in ('mo', 'cho_duyet') then
    update phong_cho set trang_thai = 'ket_thuc', cap_nhat_luc = now() where id = p_id;
    return json_build_object('thanhCong', true, 'thongBao', 'Da huy phong');
  end if;

  if p_ten = coalesce(v_phong.khach, '') and v_phong.trang_thai = 'cho_duyet' then
    update phong_cho set khach = null, trang_thai = 'mo', cap_nhat_luc = now() where id = p_id;
    return json_build_object('thanhCong', true, 'thongBao', 'Da rut yeu cau xin vao');
  end if;

  return json_build_object('thanhCong', false, 'thongBao', 'Khong the huy o trang thai hien tai');
end;
$$;


-- ------------------------------------------------------------
-- PHAN M: RPC CUA HANG DANH CHO TRE (NC_06)
-- ------------------------------------------------------------

-- Lay danh sach vat pham dang hien thi (kem so luong con lai)
create or replace function lay_danh_sach_vat_pham()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ds json;
begin
  select json_agg(json_build_object(
    'id',           id,
    'loai',         loai,
    'ten',          ten,
    'moTa',         mo_ta,
    'giaKimCuong',  gia_kim_cuong,
    'urlHinh',      url_hinh,
    'maDinhDanh',   ma_dinh_danh,
    'duLieu',       du_lieu,
    'conLai',       case when so_luong is null then null else greatest(so_luong - da_doi, 0) end,
    'mocLevel',     moc_level
  ) order by thu_tu_hien_thi, id) into v_ds
  from vat_pham
  where hien_thi = true;

  return json_build_object('thanhCong', true, 'thongBao', 'Lay danh sach vat pham thanh cong',
                           'danhSachVatPham', coalesce(v_ds, '[]'::json));
end;
$$;

-- Doi vat pham bang kim cuong (dung cho MOI loai vat pham).
-- Quy tac chung:
--   - Vat pham co moc_level: MIEN PHI neu level tai khoan >= moc_level.
--   - loai = 'qua' (vat ly): ghi lich su 'cho_trao', cho quan tri xac nhan.
--   - Moi loai khac (vat pham SO: avatar, bo_quan_co, ban_co, hieu_ung...):
--     chan doi trung neu da so huu; nhan ngay ('da_nhan') va TU TRANG BI luon;
--     rieng avatar dong bo them cot avatar_da_chon.
create or replace function doi_vat_pham(p_ten text, p_vat_pham_id bigint)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nguoi tai_khoan%rowtype;
  v_vp    vat_pham%rowtype;
  v_la_qua boolean;
  v_gia   int;
  v_diem_moi int;
  v_trang_thai text;
  v_ma_trang_bi text;
begin
  select * into v_nguoi from tai_khoan where ten_dang_nhap = p_ten;
  if not found then
    return json_build_object('thanhCong', false, 'thongBao', 'Khong tim thay tai khoan: ' || p_ten);
  end if;

  select * into v_vp from vat_pham where id = p_vat_pham_id;
  if not found or v_vp.hien_thi = false then
    return json_build_object('thanhCong', false, 'thongBao', 'Vat pham khong ton tai hoac dang an');
  end if;

  v_la_qua := (v_vp.loai = 'qua');

  -- Chan doi trung vat pham SO da so huu
  if not v_la_qua then
    if exists (select 1 from lich_su_doi_qua
               where ten_dang_nhap = p_ten and vat_pham_id = p_vat_pham_id) then
      return json_build_object('thanhCong', false, 'thongBao', 'Ban da so huu vat pham nay roi');
    end if;
  end if;

  if v_vp.so_luong is not null and v_vp.da_doi >= v_vp.so_luong then
    return json_build_object('thanhCong', false, 'thongBao', 'Vat pham da het hang');
  end if;

  -- Tinh gia: vat pham moc mien phi khi du level
  v_gia := v_vp.gia_kim_cuong;
  if v_vp.moc_level is not null and v_nguoi.level >= v_vp.moc_level then
    v_gia := 0;
  end if;

  if v_nguoi.diem_so < v_gia then
    return json_build_object('thanhCong', false, 'thongBao', 'Khong du kim cuong de doi vat pham nay');
  end if;

  v_diem_moi := v_nguoi.diem_so - v_gia;
  update tai_khoan set diem_so = v_diem_moi, lan_choi_cuoi = now() where ten_dang_nhap = p_ten;
  update vat_pham set da_doi = da_doi + 1 where id = p_vat_pham_id;

  if not v_la_qua then
    v_trang_thai := 'da_nhan';

    -- Xac dinh gia tri trang bi: avatar dung hinh/ten hien thi, loai khac dung ma dinh danh
    if v_vp.loai = 'avatar' then
      v_ma_trang_bi := coalesce(nullif(v_vp.url_hinh, ''), v_vp.ten);
      update tai_khoan set avatar_da_chon = v_ma_trang_bi where ten_dang_nhap = p_ten;
    else
      v_ma_trang_bi := coalesce(nullif(v_vp.ma_dinh_danh, ''), v_vp.id::text);
    end if;

    -- Tu trang bi vat pham vua doi
    update tai_khoan set
      trang_bi = jsonb_set(coalesce(trang_bi, '{}'::jsonb), array[v_vp.loai], to_jsonb(v_ma_trang_bi))
      where ten_dang_nhap = p_ten;

    insert into lich_su_doi_qua (ten_dang_nhap, vat_pham_id, gia_luc_doi, trang_thai, thoi_gian_xac_nhan)
      values (p_ten, p_vat_pham_id, v_gia, v_trang_thai, now());
  else
    v_trang_thai := 'cho_trao';
    insert into lich_su_doi_qua (ten_dang_nhap, vat_pham_id, gia_luc_doi, trang_thai)
      values (p_ten, p_vat_pham_id, v_gia);
  end if;

  return json_build_object(
    'thanhCong',  true,
    'thongBao',   case when v_la_qua then 'Doi qua thanh cong, cho trao thuong' else 'Doi vat pham thanh cong, da trang bi ngay' end,
    'diemMoi',    v_diem_moi,
    'giaDaTru',   v_gia,
    'trangThai',  v_trang_thai
  );
end;
$$;

-- Tre xem lich su doi qua cua CHINH MINH (Trang Tai Khoan dung lay_ho_so
-- da gom san; ham nay giu lai de goi rieng khi can lam moi nhanh)
create or replace function lay_lich_su_doi_qua(p_ten text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ds json;
begin
  select json_agg(json_build_object(
    'id',              ls.id,
    'tenVatPham',      vp.ten,
    'loai',            vp.loai,
    'urlHinh',         vp.url_hinh,
    'giaLucDoi',       ls.gia_luc_doi,
    'trangThai',       ls.trang_thai,
    'thoiGianDoi',     ls.thoi_gian_doi,
    'thoiGianXacNhan', ls.thoi_gian_xac_nhan
  ) order by ls.thoi_gian_doi desc) into v_ds
  from lich_su_doi_qua ls
  join vat_pham vp on vp.id = ls.vat_pham_id
  where ls.ten_dang_nhap = p_ten;

  return json_build_object('thanhCong', true, 'thongBao', 'Lay lich su thanh cong',
                           'lichSu', coalesce(v_ds, '[]'::json));
end;
$$;


-- ------------------------------------------------------------
-- PHAN M2: RPC Y TUONG CUA TRE (NC_07 - Hoc tap & Kham pha)
-- ------------------------------------------------------------

-- Tre gui 1 y tuong tu trang hoctap.html / khampha.html
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

  if p_chuyen_muc not in ('hoc_tap', 'kham_pha', 'tro_choi') then
    return json_build_object('thanhCong', false, 'thongBao', 'Chuyen muc phai la hoc_tap, kham_pha hoac tro_choi');
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

-- Tre xem lai cac y tuong CHINH MINH da gui
create or replace function lay_y_tuong_cua_toi(p_ten text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ds json;
begin
  select json_agg(json_build_object(
    'id',        id,
    'chuyenMuc', chuyen_muc,
    'noiDung',   noi_dung,
    'trangThai', trang_thai,
    'ngayGui',   ngay_gui
  ) order by ngay_gui desc) into v_ds
  from y_tuong
  where ten_dang_nhap = p_ten;

  return json_build_object('thanhCong', true, 'thongBao', 'Lay danh sach y tuong thanh cong',
                           'danhSachYTuong', coalesce(v_ds, '[]'::json));
end;
$$;


-- ------------------------------------------------------------
-- PHAN N: RPC QUAN TRI (NC_06, NC_07)
-- Xac thuc bang TEN + MA PHIEN (lay tu ket qua dang_nhap) + vai_tro='admin'.
-- Admin KHONG can dang nhap lan 2, trinh duyet KHONG luu mat khau.
-- ------------------------------------------------------------

-- Ham noi bo kiem tra quyen admin (KHONG cap cho anon)
create or replace function kiem_tra_admin(p_ten text, p_ma_phien text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from tai_khoan
    where ten_dang_nhap = p_ten
      and vai_tro = 'admin'
      and p_ma_phien is not null
      and length(p_ma_phien) > 10
      and ma_phien = p_ma_phien
  );
$$;

-- Admin xem TOAN BO vat pham (ke ca dang an)
create or replace function admin_lay_vat_pham(p_ten_admin text, p_ma_phien_admin text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ds json;
begin
  if not kiem_tra_admin(p_ten_admin, p_ma_phien_admin) then
    return json_build_object('thanhCong', false, 'thongBao', 'Ban khong co quyen quan tri hoac phien da het han, hay dang nhap lai');
  end if;

  select json_agg(json_build_object(
    'id',            id,
    'loai',          loai,
    'ten',           ten,
    'moTa',          mo_ta,
    'giaKimCuong',   gia_kim_cuong,
    'urlHinh',       url_hinh,
    'maDinhDanh',    ma_dinh_danh,
    'duLieu',        du_lieu,
    'soLuong',       so_luong,
    'daDoi',         da_doi,
    'hienThi',       hien_thi,
    'thuTuHienThi',  thu_tu_hien_thi,
    'mocLevel',      moc_level
  ) order by thu_tu_hien_thi, id) into v_ds from vat_pham;

  return json_build_object('thanhCong', true, 'thongBao', 'Lay danh sach thanh cong',
                           'danhSachVatPham', coalesce(v_ds, '[]'::json));
end;
$$;

-- Xoa ban cu cua admin_luu_vat_pham (chu ky V1/V2, 12 tham so) neu co,
-- de tranh ton tai 2 ham trung ten gay nham lan khi goi RPC
drop function if exists admin_luu_vat_pham(text, text, bigint, text, text, text, int, text, int, boolean, int, int);

-- Admin them moi (p_id = null) hoac sua vat pham (p_id co gia tri)
-- p_loai tu do (goi y: avatar, bo_quan_co, ban_co, hieu_ung, qua)
-- p_du_lieu: jsonb tham so hien thi; truyen '{}' neu khong dung
create or replace function admin_luu_vat_pham(
  p_ten_admin text, p_ma_phien_admin text,
  p_id bigint, p_loai text, p_ten text, p_mo_ta text,
  p_gia int, p_url_hinh text, p_ma_dinh_danh text, p_du_lieu jsonb,
  p_so_luong int, p_hien_thi boolean, p_thu_tu int, p_moc_level int
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id bigint;
begin
  if not kiem_tra_admin(p_ten_admin, p_ma_phien_admin) then
    return json_build_object('thanhCong', false, 'thongBao', 'Ban khong co quyen quan tri hoac phien da het han, hay dang nhap lai');
  end if;
  if p_loai is null or length(trim(p_loai)) = 0 then
    return json_build_object('thanhCong', false, 'thongBao', 'Vui long nhap loai vat pham (vi du: avatar, bo_quan_co, ban_co, hieu_ung, qua)');
  end if;
  if p_ten is null or length(trim(p_ten)) = 0 then
    return json_build_object('thanhCong', false, 'thongBao', 'Vui long nhap ten vat pham');
  end if;

  if p_id is null then
    insert into vat_pham (loai, ten, mo_ta, gia_kim_cuong, url_hinh, ma_dinh_danh, du_lieu, so_luong, hien_thi, thu_tu_hien_thi, moc_level)
    values (trim(p_loai), p_ten, coalesce(p_mo_ta, ''), coalesce(p_gia, 0), coalesce(p_url_hinh, ''),
            coalesce(p_ma_dinh_danh, ''), coalesce(p_du_lieu, '{}'::jsonb),
            p_so_luong, coalesce(p_hien_thi, true), coalesce(p_thu_tu, 0), p_moc_level)
    returning id into v_id;
  else
    update vat_pham set
      loai            = trim(p_loai),
      ten             = p_ten,
      mo_ta           = coalesce(p_mo_ta, ''),
      gia_kim_cuong   = coalesce(p_gia, 0),
      url_hinh        = coalesce(p_url_hinh, ''),
      ma_dinh_danh    = coalesce(p_ma_dinh_danh, ''),
      du_lieu         = coalesce(p_du_lieu, '{}'::jsonb),
      so_luong        = p_so_luong,
      hien_thi        = coalesce(p_hien_thi, true),
      thu_tu_hien_thi = coalesce(p_thu_tu, 0),
      moc_level       = p_moc_level
    where id = p_id
    returning id into v_id;

    if v_id is null then
      return json_build_object('thanhCong', false, 'thongBao', 'Khong tim thay vat pham can sua');
    end if;
  end if;

  return json_build_object('thanhCong', true, 'thongBao', 'Da luu vat pham', 'id', v_id);
end;
$$;

-- Admin xem TOAN BO lich su doi qua cua moi nguoi
create or replace function admin_lay_lich_su(p_ten_admin text, p_ma_phien_admin text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ds json;
begin
  if not kiem_tra_admin(p_ten_admin, p_ma_phien_admin) then
    return json_build_object('thanhCong', false, 'thongBao', 'Ban khong co quyen quan tri hoac phien da het han, hay dang nhap lai');
  end if;

  select json_agg(json_build_object(
    'id',              ls.id,
    'tenDangNhap',     ls.ten_dang_nhap,
    'tenVatPham',      vp.ten,
    'loai',            vp.loai,
    'giaLucDoi',       ls.gia_luc_doi,
    'trangThai',       ls.trang_thai,
    'thoiGianDoi',     ls.thoi_gian_doi,
    'thoiGianXacNhan', ls.thoi_gian_xac_nhan
  ) order by ls.thoi_gian_doi desc) into v_ds
  from lich_su_doi_qua ls
  join vat_pham vp on vp.id = ls.vat_pham_id;

  return json_build_object('thanhCong', true, 'thongBao', 'Lay lich su thanh cong',
                           'lichSu', coalesce(v_ds, '[]'::json));
end;
$$;

-- Admin xac nhan da trao thuong that cho tre
create or replace function admin_xac_nhan_trao(p_ten_admin text, p_ma_phien_admin text, p_lich_su_id bigint)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if not kiem_tra_admin(p_ten_admin, p_ma_phien_admin) then
    return json_build_object('thanhCong', false, 'thongBao', 'Ban khong co quyen quan tri hoac phien da het han, hay dang nhap lai');
  end if;

  update lich_su_doi_qua
    set trang_thai = 'da_nhan', thoi_gian_xac_nhan = now()
    where id = p_lich_su_id and trang_thai = 'cho_trao';

  if not found then
    return json_build_object('thanhCong', false, 'thongBao', 'Khong tim thay muc cho trao thuong nay');
  end if;

  return json_build_object('thanhCong', true, 'thongBao', 'Da xac nhan trao thuong');
end;
$$;

-- Admin xem TOAN BO y tuong tre gui (y tuong 'moi' xep truoc)
create or replace function admin_lay_y_tuong(p_ten_admin text, p_ma_phien_admin text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ds json;
begin
  if not kiem_tra_admin(p_ten_admin, p_ma_phien_admin) then
    return json_build_object('thanhCong', false, 'thongBao', 'Ban khong co quyen quan tri hoac phien da het han, hay dang nhap lai');
  end if;

  select json_agg(json_build_object(
    'id',          id,
    'tenDangNhap', ten_dang_nhap,
    'chuyenMuc',   chuyen_muc,
    'noiDung',     noi_dung,
    'trangThai',   trang_thai,
    'ngayGui',     ngay_gui
  ) order by (trang_thai = 'moi') desc, ngay_gui desc) into v_ds
  from y_tuong;

  return json_build_object('thanhCong', true, 'thongBao', 'Lay danh sach y tuong thanh cong',
                           'danhSachYTuong', coalesce(v_ds, '[]'::json));
end;
$$;

-- Admin danh dau y tuong da xem (hoac tra ve 'moi' neu can)
create or replace function admin_xu_ly_y_tuong(p_ten_admin text, p_ma_phien_admin text, p_id bigint, p_trang_thai text)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if not kiem_tra_admin(p_ten_admin, p_ma_phien_admin) then
    return json_build_object('thanhCong', false, 'thongBao', 'Ban khong co quyen quan tri hoac phien da het han, hay dang nhap lai');
  end if;
  if p_trang_thai not in ('moi', 'da_xem') then
    return json_build_object('thanhCong', false, 'thongBao', 'Trang thai phai la moi hoac da_xem');
  end if;

  update y_tuong set trang_thai = p_trang_thai where id = p_id;
  if not found then
    return json_build_object('thanhCong', false, 'thongBao', 'Khong tim thay y tuong');
  end if;

  return json_build_object('thanhCong', true, 'thongBao', 'Da cap nhat trang thai y tuong');
end;
$$;


-- ------------------------------------------------------------
-- PHAN O: SUPABASE STORAGE - KHO HINH VAT PHAM (NC_06)
-- Tao bucket cong khai 'hinh-vat-pham'.
-- DANH DOI CHAP NHAN: cho phep khoa anon tai hinh len bucket nay de trang
-- admin hoat dong tren web (he thong khong dung Supabase Auth). Voi quy mo
-- ~3 nguoi choi, rui ro thap. Neu phan nay bao loi, tao bucket + policy
-- thu cong trong Dashboard (Storage -> New bucket -> Public).
-- ------------------------------------------------------------
do $$
begin
  insert into storage.buckets (id, name, public)
    values ('hinh-vat-pham', 'hinh-vat-pham', true)
    on conflict (id) do nothing;
exception when others then
  raise notice 'Khong tao duoc bucket bang SQL, hay tao thu cong trong Dashboard: %', sqlerrm;
end $$;

do $$
begin
  execute 'drop policy if exists "doc_hinh_vat_pham" on storage.objects';
  execute 'create policy "doc_hinh_vat_pham" on storage.objects for select to public using (bucket_id = ''hinh-vat-pham'')';
  execute 'drop policy if exists "them_hinh_vat_pham" on storage.objects';
  execute 'create policy "them_hinh_vat_pham" on storage.objects for insert to anon with check (bucket_id = ''hinh-vat-pham'')';
  execute 'drop policy if exists "sua_hinh_vat_pham" on storage.objects';
  execute 'create policy "sua_hinh_vat_pham" on storage.objects for update to anon using (bucket_id = ''hinh-vat-pham'')';
  execute 'drop policy if exists "xoa_hinh_vat_pham" on storage.objects';
  execute 'create policy "xoa_hinh_vat_pham" on storage.objects for delete to anon using (bucket_id = ''hinh-vat-pham'')';
exception when others then
  raise notice 'Khong tao duoc policy Storage bang SQL, hay tao thu cong trong Dashboard: %', sqlerrm;
end $$;


-- ------------------------------------------------------------
-- PHAN P: CAP QUYEN GOI HAM CHO KHACH (role "anon")
-- Chu y: kiem_tra_admin la ham NOI BO, KHONG cap cho anon.
-- ------------------------------------------------------------
grant execute on function dang_ky(text, text)                                to anon;
grant execute on function dang_nhap(text, text)                              to anon;
grant execute on function lay_cau_hinh()                                     to anon;
grant execute on function tru_diem_goi_y(text)                               to anon;
grant execute on function cap_nhat_avatar(text, text)                        to anon;
grant execute on function cap_nhat_trang_bi(text, text, text)                to anon;
grant execute on function lay_thong_tin_ca_nhan(text)                        to anon;
grant execute on function lay_xep_hang()                                     to anon;
grant execute on function lay_ho_so(text)                                    to anon;
grant execute on function lay_lich_su_tran(text)                             to anon;
grant execute on function lay_thong_ke_doi_thu(text)                         to anon;
grant execute on function tao_phong(text, text)                              to anon;
grant execute on function lay_danh_sach_phong()                              to anon;
grant execute on function xin_vao_phong(bigint, text)                        to anon;
grant execute on function tra_loi_xin_vao(bigint, text, boolean)             to anon;
grant execute on function gui_nuoc_di(bigint, text, text, text, text)        to anon;
grant execute on function lay_phong(bigint)                                  to anon;
grant execute on function ket_thuc_phong(bigint, text, text)                 to anon;
grant execute on function huy_phong(bigint, text)                            to anon;
grant execute on function lay_danh_sach_vat_pham()                           to anon;
grant execute on function doi_vat_pham(text, bigint)                         to anon;
grant execute on function lay_lich_su_doi_qua(text)                          to anon;
grant execute on function gui_y_tuong(text, text, text)                      to anon;
grant execute on function lay_y_tuong_cua_toi(text)                          to anon;
grant execute on function admin_lay_vat_pham(text, text)                     to anon;
grant execute on function admin_luu_vat_pham(text, text, bigint, text, text, text, int, text, text, jsonb, int, boolean, int, int) to anon;
grant execute on function admin_lay_lich_su(text, text)                      to anon;
grant execute on function admin_xac_nhan_trao(text, text, bigint)            to anon;
grant execute on function admin_lay_y_tuong(text, text)                      to anon;
grant execute on function admin_xu_ly_y_tuong(text, text, bigint, text)      to anon;

revoke execute on function kiem_tra_admin(text, text) from anon;

-- ============================================================
-- HET FILE. Sau khi Run thanh cong:
-- 1) Cap quyen admin: update tai_khoan set vai_tro='admin' where ten_dang_nhap='...';
-- 2) Kiem tra bucket 'hinh-vat-pham' trong muc Storage (neu chua co thi tao tay).
-- 3) Test nhanh trong SQL Editor:
--      select dang_nhap('TEN_CO_THAT', 'MAT_KHAU_DUNG');  -- phai thay vaiTro + maPhien + trangBi
--      select lay_cau_hinh();
--      select lay_ho_so('TEN_CO_THAT');
--      select lay_xep_hang();   -- hangThu xep theo EXP -> tong thang -> ty le thang
--      select lay_lich_su_tran('TEN_CO_THAT');   -- 50 tran gan nhat
--      select lay_thong_ke_doi_thu('TEN_CO_THAT');  -- gom theo doi thu, sap theo so thang
--      select gui_y_tuong('TEN_CO_THAT', 'hoc_tap', 'Con muon hoc chieu hau');
-- Backend cho toan bo NC_01 -> NC_07 da san sang.
-- ============================================================
