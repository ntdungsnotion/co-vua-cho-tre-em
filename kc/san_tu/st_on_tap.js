/* ================================================================
   FILE: san_tu/st_on_tap.js
   CHỨC NĂNG: BẢNG ÔN TẬP cuối màn (phần lõi, không đụng giao diện, chạy được trong Node):
              chọn các từ bé vừa gặp trong màn, xếp thành thẻ HÌNH và thẻ CHỮ xáo trộn;
              bé bấm một hình + một chữ khớp nhau thì cặp đó biến mất. Hết thẻ = ôn xong,
              lúc đó mới mở màn tiếp (người dùng yêu cầu 16/10/2026).
   BƯỚC: TC_00D2
   NGÀY: 16/10/2026
   CẬP NHẬT: 16/10/2026 - TC_00G: đồng hồ thưởng kim cương (CAU_HINH.thuongOnTap): ghép càng nhanh
             càng nhiều kim cương (tối đa 5, trung bình 1, chậm 0), bấm sai thì bị trừ sớm hơn.
   CẬP NHẬT: 20/10/2026 - TC_T03A: so trùng hình theo hình riêng của từ (nếu có), không chỉ emoji.
   ================================================================ */
(function (goc) {
  "use strict";
  const ST = goc.ST = goc.ST || {};

  function xaoTron(a, rng) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  /* Chọn tối đa soCap từ: ưu tiên từ bé làm sai / không kịp, rồi tới các từ còn lại (ngẫu nhiên).
     Bỏ từ trùng hình với từ đã chọn để bé không bị bối rối (2 thẻ hình giống nhau). */
  function chonTuOnTap(dsTu, tuSai, soCap, rng) {
    rng = rng || Math.random;
    const sai = new Set(tuSai || []), daCo = new Set(), hinh = new Set(), kq = [];
    const khoaHinh = t => (t.hinh ? "h:" + t.hinh : "e:" + t.e); // TC_T03A: hình riêng hoặc emoji
    const uuTien = xaoTron(dsTu.filter(t => sai.has(t.en)), rng).concat(xaoTron(dsTu.filter(t => !sai.has(t.en)), rng));
    for (const t of uuTien) {
      if (kq.length >= soCap) break;
      if (!t || daCo.has(t.en) || hinh.has(khoaHinh(t))) continue;
      daCo.add(t.en); hinh.add(khoaHinh(t)); kq.push(t);
    }
    return kq;
  }

  /* Số kim cương thưởng khi ghép xong ở giây thứ `giay` (đã cộng giây phạt vì bấm sai).
     Trả về { kc, nac }: nac = phần còn lại (1 -> 0) trước khi mất viên kế tiếp, để vẽ thanh đồng hồ. */
  function tinhThuongOnTap(giay, soCap, th) {
    const nhanh = th.giayCucNhanh * soCap, buoc = th.giayMoiNac * soCap;
    if (giay <= nhanh) return { kc: th.toiDa, nac: 1 - giay / nhanh };
    const mat = Math.ceil((giay - nhanh) / buoc - 1e-9);
    const kc = Math.max(0, th.toiDa - mat);
    return { kc, nac: kc > 0 ? mat - (giay - nhanh) / buoc : 0 };
  }

  class BangOnTap {
    constructor(dsTu, rng, thuong) {
      rng = rng || Math.random;
      this.thuong = thuong || (ST.CAU_HINH && ST.CAU_HINH.thuongOnTap) || null;
      this.giayPhat = 0;                               // giây cộng thêm vì bấm sai
      this.kimCuongThuong = null;                      // chốt khi ghép xong

      this.tu = dsTu.slice();
      this.hinh = xaoTron(dsTu.map(t => t.en), rng);   // thứ tự thẻ hình
      this.chu = xaoTron(dsTu.map(t => t.en), rng);    // thứ tự thẻ chữ
      this.daXong = new Set();
      this.dangChon = null;                            // { ben: "hinh" | "chu", en }
      this.soLanSai = 0;
    }
    get conLai() { return this.tu.length - this.daXong.size; }
    /* Thưởng hiện tại sau `giay` giây kể từ lúc hiện bảng (đã xong thì trả số đã chốt) */
    thuongLuc(giay) {
      if (!this.thuong) return { kc: 0, nac: 0 };
      if (this.kimCuongThuong !== null) return { kc: this.kimCuongThuong, nac: 0 };
      return tinhThuongOnTap(giay + this.giayPhat, this.tu.length, this.thuong);
    }
    get xong() { return this.conLai === 0; }
    layTu(en) { return this.tu.find(t => t.en === en); }
    /* Bé bấm một thẻ. Trả về:
       { kq: "chon" }            - mới chọn thẻ đầu (hoặc đổi thẻ cùng bên)
       { kq: "boChon" }          - bấm lại thẻ đang chọn
       { kq: "dung", en, xong }  - khớp: cặp biến mất
       { kq: "sai", truoc, en }  - không khớp: bỏ chọn, bé thử lại
       { kq: "boQua" }           - thẻ đã biến mất
       giay: số giây kể từ lúc hiện bảng (để chốt kim cương thưởng khi ghép xong) */
    bam(ben, en, giay) {
      if (this.daXong.has(en) || !this.layTu(en)) return { kq: "boQua" };
      const c = this.dangChon;
      if (!c || c.ben === ben) {
        if (c && c.en === en) { this.dangChon = null; return { kq: "boChon" }; }
        this.dangChon = { ben, en };
        return { kq: "chon" };
      }
      this.dangChon = null;
      if (c.en === en) {
        this.daXong.add(en);
        if (this.xong && this.thuong) this.kimCuongThuong = this.thuongLuc(giay || 0).kc;
        return { kq: "dung", en, xong: this.xong };
      }
      this.soLanSai++;
      if (this.thuong) this.giayPhat += this.thuong.giayMoiNac * this.tu.length * this.thuong.phatSai;
      return { kq: "sai", truoc: c, en };
    }
  }

  ST.chonTuOnTap = chonTuOnTap;
  ST.BangOnTap = BangOnTap;
  ST.tinhThuongOnTap = tinhThuongOnTap;
})(typeof window !== "undefined" ? window : globalThis);
