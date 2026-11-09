// ================================================================
// FILE: dt/dt_thu_vien_cau.js
// CHỨC NĂNG: THƯ VIỆN CÂU HỎI của Đấu Trường Tri Thức (TC_D06E, người dùng 05/11 + 09/11/2026): bé chọn câu giữ công trình
//            theo MÔN -> CHỦ ĐỀ (không lọc theo lớp; mỗi câu có nhãn lớp). Không đụng DOM: chạy được trong node và trên máy bé.
//            - Môn lấy từ cau_hinh.json "thuVien.mon" [{ ma, ten, bieuTuong, nguon: "sinh" | "soan" }]:
//              "sinh" = bộ sinh câu có sẵn (toan = dt_sinh_toan.js, tieng_anh = KC_DT_SINH_TA.tao(khoTu));
//              "soan" = câu soạn tay (Lý, Hoá... làm sau): đối tượng { chuDe: [{ ma, ten, lop, cau: [câu] }] } trang nạp từ
//              dt/cau_hoi/<ma>.json rồi đưa vào taoThuVien(..., { soan: { <ma>: đối tượng } }). Môn chưa có nguồn thì không hiện.
//            - Câu trả ra đúng dạng máy chủ giữ (như bảng chọn câu TC_D06C7e): { noiDung, dapAn[chữ], dung, loiGiai, mon, doKho,
//              hinhChu, amThanh } + lop, chuDe để hiện nhãn (máy chủ bỏ 2 trường này). Câu có hình (đường dẫn ảnh) và câu nghe
//              (bé không nghe thử được trong bảng) không vào thư viện.
// HÀM KHAI RA: KC_DT_THU_VIEN.taoThuVien(cauHinhThuVien, nguon, them) -> { dsMon(), dsChuDe(mon), cau(mon, chuDe, n, rng, tranh) }
//   nguon = { toan: KC_DT_SINH_TOAN, tieng_anh: KC_DT_SINH_TA.tao(...) }   them = { khoTu (kho_tu.json, cho chủ đề Tiếng Anh), soan }
//   tranh = Set nội dung câu đã có trong công trình (không gợi ý lại)
// BƯỚC: TC_D06E
// NGÀY: 09/11/2026
// ================================================================
(function (goc) {
  "use strict";
  const MUC = ["de", "vua", "kho"];
  const BO_DANG_TA = ["HINH", "NGHE"]; // Tiếng Anh: câu ảnh + câu nghe không vào thư viện
  const SO_TU_TOI_THIEU = 4;           // chủ đề Tiếng Anh cần ít nhất bấy nhiêu từ mới hiện

  // Câu thô của bộ sinh / soạn tay -> dạng máy chủ giữ; null nếu không dùng được
  function chuan(c, mon) {
    if (!c || c.hinh || typeof c.noiDung !== "string" || !c.noiDung.trim() || !Array.isArray(c.dapAn) || c.dapAn.length < 2) return null;
    if (!Array.isArray(c.dung) || !c.dung.length || c.amThanh) return null;
    return { noiDung: c.noiDung, dapAn: c.dapAn.map(String), dung: c.dung.slice(), loiGiai: c.loiGiai || "", mon: c.mon || mon,
      doKho: c.doKho || "", hinhChu: c.hinhChu || "", amThanh: "", lop: Number.isFinite(c.lop) ? c.lop : null, chuDe: c.chuDe || "" };
  }

  function taoThuVien(chTv, nguon, them) {
    const dsCh = (chTv && Array.isArray(chTv.mon)) ? chTv.mon : [];
    const ng = nguon || {}, ex = them || {}, soan = ex.soan || {};
    const TEN_TA = (goc.KC_DT_SINH_TA && goc.KC_DT_SINH_TA.TEN_CHU_DE) || {};

    // ----- Toán: chủ đề = chuDe của dạng (tên = tên dạng đầu tiên, lớp = lớp nhỏ nhất) -----
    function chuDeToan(ST) {
      const kq = [], theo = {};
      for (const d of ST.DANG) {
        if (!theo[d.chuDe]) { theo[d.chuDe] = { ma: d.chuDe, ten: d.ten, lop: d.lop }; kq.push(theo[d.chuDe]); }
        else theo[d.chuDe].lop = Math.min(theo[d.chuDe].lop, d.lop);
      }
      return kq.sort((a, b) => a.lop - b.lop || a.ten.localeCompare(b.ten, "vi"));
    }
    // ----- Tiếng Anh: chủ đề = nhóm từ (cột cd của kho từ), có đủ từ -----
    function chuDeTa() {
      const dem = {}, cap = {};
      for (const t of (ex.khoTu && ex.khoTu.tu) || []) {
        if (!t || !t.en || !t.vi || !/^[a-z]+$/i.test(t.en) || !(t.cap >= 1 && t.cap <= 4)) continue;
        const cd = t.cd || "khac";
        dem[cd] = (dem[cd] || 0) + 1; cap[cd] = Math.min(cap[cd] || 9, t.cap);
      }
      return Object.keys(dem).filter(cd => dem[cd] >= SO_TU_TOI_THIEU && cd !== "khac")
        .map(cd => ({ ma: "ta_" + cd, ten: TEN_TA[cd] || cd, lop: null, capTu: cap[cd] }))
        .sort((a, b) => a.capTu - b.capTu || a.ten.localeCompare(b.ten, "vi"));
    }

    const boChuDe = {};
    function dsChuDe(mon) {
      if (boChuDe[mon]) return boChuDe[mon];
      const m = dsCh.find(x => x.ma === mon);
      let kq = [];
      if (m && m.nguon === "soan") kq = ((soan[mon] && soan[mon].chuDe) || []).filter(c => c && c.ma && Array.isArray(c.cau) && c.cau.length)
        .map(c => ({ ma: c.ma, ten: c.ten || c.ma, lop: Number.isFinite(c.lop) ? c.lop : null }));
      else if (mon === "toan" && ng.toan) kq = chuDeToan(ng.toan);
      else if (mon === "tieng_anh" && ng.tieng_anh) kq = chuDeTa();
      return (boChuDe[mon] = kq);
    }
    const dsMon = () => dsCh.filter(m => m && m.ma && dsChuDe(m.ma).length).map(m => ({ ma: m.ma, ten: m.ten || m.ma, bieuTuong: m.bieuTuong || "📘" }));

    // Một câu ngẫu nhiên của (môn, chủ đề)
    function motCau(mon, chuDe, r) {
      const m = dsCh.find(x => x.ma === mon);
      if (m && m.nguon === "soan") {
        const cd = ((soan[mon] && soan[mon].chuDe) || []).find(c => c && c.ma === chuDe);
        const c = cd && cd.cau[Math.floor(r() * cd.cau.length)];
        return c ? chuan(Object.assign({ lop: cd.lop, chuDe }, c), mon) : null;
      }
      const hat = Math.floor(r() * 4294967296), muc = MUC[Math.floor(r() * MUC.length)];
      if (mon === "toan" && ng.toan) {
        const ds = ng.toan.DANG.filter(d => d.chuDe === chuDe);
        const d = ds[Math.floor(r() * ds.length)];
        return d ? chuan(ng.toan.taoCau(d.ma, muc, hat), mon) : null;
      }
      if (mon === "tieng_anh" && ng.tieng_anh) {
        const ds = ng.tieng_anh.DANG.filter(d => BO_DANG_TA.indexOf(d.dang) < 0);
        const d = ds[Math.floor(r() * ds.length)];
        return d ? chuan(ng.tieng_anh.taoCau(d.ma, muc, hat, chuDe), mon) : null; // cấp không có từ của chủ đề: null, thử lại
      }
      return null;
    }
    // n câu khác nhau của (môn, chủ đề); thiếu thì trả ít hơn
    function cau(mon, chuDe, n, rng, tranh) {
      const r = rng || Math.random, ds = [];
      for (let lan = 0; ds.length < n && lan < n * 30; lan++) {
        const c = motCau(mon, chuDe, r);
        if (!c || ds.some(d => d.noiDung === c.noiDung && String(d.dapAn) === String(c.dapAn))) continue;
        if (tranh && tranh.has(c.noiDung) && lan < n * 20) continue;
        ds.push(c);
      }
      return ds;
    }
    return { dsMon, dsChuDe, cau };
  }

  goc.KC_DT_THU_VIEN = { taoThuVien, chuan };
})(typeof window !== "undefined" ? window : globalThis);
// 09/11/2026 - BƯỚC: TC_D06E
