/* ================================================================
   FILE: san_tu/st_on_tap.js
   CHỨC NĂNG: BẢNG ÔN TẬP cuối màn (phần lõi, không đụng giao diện, chạy được trong Node):
              chọn các từ bé vừa gặp trong màn, xếp thành thẻ HÌNH và thẻ CHỮ xáo trộn;
              bé bấm một hình + một chữ khớp nhau thì cặp đó biến mất. Hết thẻ = ôn xong,
              lúc đó mới mở màn tiếp (người dùng yêu cầu 16/10/2026).
   BƯỚC: TC_00D2
   NGÀY: 16/10/2026
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
    const uuTien = xaoTron(dsTu.filter(t => sai.has(t.en)), rng).concat(xaoTron(dsTu.filter(t => !sai.has(t.en)), rng));
    for (const t of uuTien) {
      if (kq.length >= soCap) break;
      if (!t || daCo.has(t.en) || hinh.has(t.e)) continue;
      daCo.add(t.en); hinh.add(t.e); kq.push(t);
    }
    return kq;
  }

  class BangOnTap {
    constructor(dsTu, rng) {
      rng = rng || Math.random;
      this.tu = dsTu.slice();
      this.hinh = xaoTron(dsTu.map(t => t.en), rng);   // thứ tự thẻ hình
      this.chu = xaoTron(dsTu.map(t => t.en), rng);    // thứ tự thẻ chữ
      this.daXong = new Set();
      this.dangChon = null;                            // { ben: "hinh" | "chu", en }
      this.soLanSai = 0;
    }
    get conLai() { return this.tu.length - this.daXong.size; }
    get xong() { return this.conLai === 0; }
    layTu(en) { return this.tu.find(t => t.en === en); }
    /* Bé bấm một thẻ. Trả về:
       { kq: "chon" }            - mới chọn thẻ đầu (hoặc đổi thẻ cùng bên)
       { kq: "boChon" }          - bấm lại thẻ đang chọn
       { kq: "dung", en, xong }  - khớp: cặp biến mất
       { kq: "sai", truoc, en }  - không khớp: bỏ chọn, bé thử lại
       { kq: "boQua" }           - thẻ đã biến mất */
    bam(ben, en) {
      if (this.daXong.has(en) || !this.layTu(en)) return { kq: "boQua" };
      const c = this.dangChon;
      if (!c || c.ben === ben) {
        if (c && c.en === en) { this.dangChon = null; return { kq: "boChon" }; }
        this.dangChon = { ben, en };
        return { kq: "chon" };
      }
      this.dangChon = null;
      if (c.en === en) { this.daXong.add(en); return { kq: "dung", en, xong: this.xong }; }
      this.soLanSai++;
      return { kq: "sai", truoc: c, en };
    }
  }

  ST.chonTuOnTap = chonTuOnTap;
  ST.BangOnTap = BangOnTap;
})(typeof window !== "undefined" ? window : globalThis);
