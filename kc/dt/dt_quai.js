// ================================================================
// FILE: dt/dt_quai.js
// CHỨC NĂNG: QUÁI của Đấu Trường Tri Thức (đặc tả dac_ta.md V.2, dac_ta_tran_dau.md mục 1-2):
//            - taoQuai(ma, lv, ch): chỉ số quái theo loại + cấp (heSoCap).
//            - xacSuatDung(quai, doKho, ch): xác suất quái đúng theo bậc x độ khó câu, kẹp 5-95 %.
//            - giayTraLoi(quai, lop, ch, rng, nghiThem): thời điểm quái bấm (giây) trong khoảng của bậc,
//              nhân thêm cho bé nhỏ (heSoQuaiLopNho) và hệ số nghĩ thêm (chế độ Thong thả).
//            - traLoi(quai, cau, ch, rng): quái chọn đáp án (đúng theo xác suất; sai thì chọn bừa
//              một đáp án sai).
//            Không đụng DOM: chạy được trong node. Mọi con số đọc từ du_lieu/cau_hinh_tran_dau.json.
// BƯỚC: TC_D05
// NGÀY: 29/10/2026
// ================================================================
(function (goc) {
  "use strict";

  function dsLoai(ch) { return Object.keys(ch.quai.loai); }

  function taoQuai(ma, lv, ch) {
    const l = ch.quai.loai[ma];
    if (!l) throw new Error("Không có quái " + ma);
    const cap = Math.max(1, Math.floor(lv) || 1), k = cap - 1, hs = ch.quai.heSoCap;
    const hp = Math.round(l.hp * (1 + hs.hp * k));
    return {
      ma, ten: l.ten, bac: l.bac, mon: l.mon, lv: cap,
      hpToiDa: hp, hp, mpToiDa: l.mp, mp: 0,
      str: l.str, int: 0, agi: l.agi + hs.agi * k,
      def: Math.round(l.def * (1 + hs.def * k) * 10) / 10,
      uyLuc: Math.round(l.uyLuc * (1 + hs.uyLuc * k) * 10) / 10,
      chiSoDanh: "str"
    };
  }

  function xacSuatDung(quai, doKho, ch) {
    const bac = ch.quai.bac[quai.bac], gh = ch.quai.xacSuatGioiHan;
    const p = bac.xacSuat[doKho] != null ? bac.xacSuat[doKho] : bac.xacSuat.vua;
    return Math.min(gh[1], Math.max(gh[0], p));
  }

  // Hệ số "dòng đầu tiên có lớp <= denLop" dùng chung cho các bảng theo lớp
  function heSoLopNho(lop, ch) { return lop <= ch.heSoQuaiLopNho.denLop ? ch.heSoQuaiLopNho.heSo : 1; }

  function giayTraLoi(quai, lop, ch, rng, nghiThem) {
    const [a, b] = ch.quai.bac[quai.bac].giayTraLoi;
    return (a + (b - a) * rng()) * heSoLopNho(lop, ch) * (nghiThem || 1);
  }

  // Trả { dung, chiSo }: chiSo = vị trí đáp án quái chọn
  function traLoi(quai, cau, ch, rng) {
    const dung = rng() < xacSuatDung(quai, cau.doKho, ch);
    if (dung) return { dung, chiSo: cau.dung[0] };
    const sai = [];
    for (let i = 0; i < cau.dapAn.length; i++) if (cau.dung.indexOf(i) < 0) sai.push(i);
    return { dung, chiSo: sai.length ? sai[Math.floor(rng() * sai.length)] : cau.dung[0] };
  }

  goc.KC_DT_QUAI = { dsLoai, taoQuai, xacSuatDung, giayTraLoi, traLoi, heSoLopNho };
})(typeof window !== "undefined" ? window : globalThis);
// 29/10/2026 - BƯỚC: TC_D05
