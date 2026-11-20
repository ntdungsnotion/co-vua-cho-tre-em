/* ================================================================
   FILE: chung/gio_bai.js
   CHỨC NĂNG: MODULE TÍNH GIỜ BÀI DÙNG CHUNG TOÀN APP (KC_GIO_BAI). Người dùng 20/11/2026: "code tính toán
              thời gian này cần dùng cho toàn app = module riêng, để các game / nội dung khác không phải viết lại".
              Cùng thuật toán với SQL kc_gio_bai / kc_gio_bai_kc (máy chủ là chuẩn khi có lượt trên máy chủ):
              - Tổng giờ CẢ BÀI a + mốc t₀ theo đơn vị đọc + độ khó của từng câu + lớp của bé.
                t₀ = k × P90(giỏi); a = t₀ + k × max((P90 khá − P90 giỏi) / 0,3 ; (P90 TB − P90 giỏi) / 0,5).
              - 💎 theo giờ: ≤ t₀ giữ nguyên; ≥ a = 0; giữa: chia (a − t₀) thành "tối đa" khoảng, vào khoảng nào trừ 1.
   DÙNG:
     KC_GIO_BAI.tinh(cau, lop, cauHinh?)     // cau: [{ noiDung, dapAn: [..], muc: "de"|"vua"|"kho", coHinh }]
                                             //  -> { a, t0, lop, p90: { gioi, kha, tb } } (giây, số nguyên)
     KC_GIO_BAI.kcSauGio(truoc, toiDa, giay, t0, a)   // 💎 còn lại sau khi trừ theo giờ
     KC_GIO_BAI.truSai(toiDa, soCau)         // 💎 trừ mỗi câu sai = ⌊tổng 💎 / tổng câu⌋ (người dùng 20/11/2026 14:43)
     KC_GIO_BAI.donViDoc(chu, chuDau?)       // đơn vị đọc của một chuỗi (từ / số = 1, ký hiệu = 0,5)
     KC_GIO_BAI.napCauHinh(goiRpc)           // tuỳ chọn: lấy số admin đã sửa (RPC kc_gio_bai_doc_cau_hinh), lưu làm mặc định
     KC_GIO_BAI.MAC_DINH                     // số mặc định (giống kc_gio_bai_mac_dinh trong SQL)
   Đặc tả: repo riêng Thiet_Ke_On_The.md mục 4.0.
   BƯỚC: TC_D34B (phần 2; phần 3: truSai; phần 4: số theo tài liệu khoa học)
   NGÀY: 20/11/2026
   ================================================================ */
(function (goc) {
  "use strict";
  const MAC_DINH = Object.freeze({
    he_so_k: 1,
    // Số theo tài liệu (người dùng 20/11/2026 15:55: "tham khảo tài liệu khoa học, không dự đoán"; nguồn: đặc tả 4.0):
    // doc_tb_lop[lớp 0..12] = tiếng / phút của bé trung bình: lớp 1-5 theo chuẩn GDPT 2018 môn Tiếng Việt
    //   (40-60, 60-70, 70-80, 80-90, 90-100 tiếng / phút, lấy giữa), từ lớp 3 đọc thầm nhanh hơn đọc to ≥ 30 %
    //   (Hiebert, Samuels, Rasinski 2014); lớp 6-12 tăng ~12 / lớp (Carver 1989), lớp 12 gần người lớn 238 (Brysbaert 2019).
    // khá = bách phân vị 75 ≈ × 1,2; giỏi = bách phân vị 90 ≈ × 1,4 (Hasbrouck & Tindal 2017, lớp 2-6).
    // nghi_tb_lop = giây nghĩ + chọn mỗi câu của bé trung bình (tính nhân một chữ số: lớp 3 ~3,1 giây, lớp 4 ~2,3 giây,
    //   Soltanlou 2015; lớp 3-5 ~1,2-1,5 giây, Dickson 2022); khá × 0,85, giỏi × 0,7; độ khó nhân vào phần nghĩ
    //   (bài khó chậm hơn ~1,3 lần, Dickson 2022). Dao động mỗi câu ~ 30 % (Soltanlou 2015: SD / trung bình ≈ 0,4 gồm cả khác biệt giữa các bé).
    doc_tb_lop: Object.freeze([40, 50, 65, 98, 110, 124, 140, 152, 164, 176, 188, 200, 212]),
    he_so_doc_kha: 1.2, he_so_doc_gioi: 1.4,
    nghi_tb_lop: Object.freeze([4, 3.5, 3.5, 3, 2.3, 2, 1.5, 1.5, 1.4, 1.3, 1.2, 1.1, 1]),
    he_so_nghi_kha: 0.85, he_so_nghi_gioi: 0.7,
    he_so_de: 1, he_so_vua: 1.15, he_so_kho: 1.3, giay_hinh: 2, chu_dau: 0.5,
    cv_cau: 0.3, cv_bai: 0.1, z: 1.2816, muc_kha: 70, muc_tb: 50
  });
  let chung = MAC_DINH; // số đang dùng (MAC_DINH hoặc số admin nạp từ máy chủ)
  const CO_CHU = /[0-9A-Za-zÀ-ÖØ-öø-ỹ]/;
  const so = (x, md) => (Number.isFinite(+x) && x !== null && x !== "" ? +x : md);

  function donViDoc(chu, chuDau) {
    const d = so(chuDau, 0.5);
    return String(chu == null ? "" : chu).trim().split(/\s+/).filter(Boolean).reduce((s, w) => s + (CO_CHU.test(w) ? 1 : d), 0);
  }

  // rieng: cấu hình riêng của từng game / nội dung — he_so_k riêng NHÂN với he_so_k chung, khoá khác đè lên khoá chung
  function tinh(cau, lop, rieng) {
    rieng = rieng || {};
    const b = Object.assign({}, chung, rieng);
    const L = Math.min(12, Math.max(0, Number.isFinite(+lop) && lop !== null ? Math.round(+lop) : 6));
    const docTb = Math.max(1, so((b.doc_tb_lop || [])[L], 140)) / 60, nghiTb = Math.max(0, so((b.nghi_tb_lop || [])[L], 1.5));
    const DOC = { gioi: so(b.he_so_doc_gioi, 1.4), kha: so(b.he_so_doc_kha, 1.2), tb: 1 };
    const NGHI = { gioi: so(b.he_so_nghi_gioi, 0.7), kha: so(b.he_so_nghi_kha, 0.85), tb: 1 };
    const k = Math.max(0.1, so(chung.he_so_k, 1)) * Math.max(0.1, so(rieng.he_so_k, 1));
    const z = Math.max(0, so(b.z, 1.2816)), cv = Math.max(0, so(b.cv_cau, 0.35)), cvb = Math.max(0, so(b.cv_bai, 0.15));
    const mk = Math.min(99, Math.max(1, so(b.muc_kha, 70))), mt = Math.min(99, Math.max(1, so(b.muc_tb, 50)));
    const dau = Math.max(0, so(b.chu_dau, 0.5)), hinh = Math.max(0, so(b.giay_hinh, 2));
    const P = {};
    for (const ten of ["gioi", "kha", "tb"]) {
      let mu = 0, va = 0;
      for (const c of cau || []) {
        const n = donViDoc(c.noiDung, dau) + (c.dapAn || []).reduce((s, x) => s + donViDoc(x, dau), 0);
        const hm = Math.max(0.1, so(b["he_so_" + (c.muc || "vua")], 1));
        // thời gian = đọc (đơn vị / tốc độ đọc) + nghĩ × độ khó + xem hình
        const m = n / (docTb * Math.max(0.1, DOC[ten])) + hm * nghiTb * Math.max(0.1, NGHI[ten]) + (c.coHinh ? hinh : 0);
        mu += m; va += (cv * m) ** 2;
      }
      if (mu <= 0) return { a: 0, t0: 0, lop: L, p90: null };
      const s2 = Math.log(1 + (va + (cvb * mu) ** 2) / (mu * mu)); // P90 log-chuẩn khớp moment
      P[ten] = mu * Math.exp(-s2 / 2 + z * Math.sqrt(s2));
    }
    const t0 = Math.ceil(k * P.gioi);
    const a = t0 + Math.max(1, Math.ceil(k * Math.max((P.kha - P.gioi) / (1 - mk / 100), (P.tb - P.gioi) / (1 - mt / 100))));
    const tron = x => Math.round(x * 10) / 10;
    return { a, t0, lop: L, p90: { gioi: tron(P.gioi), kha: tron(P.kha), tb: tron(P.tb) } };
  }

  function kcSauGio(truoc, toiDa, giay, t0, a) {
    truoc = Math.max(0, +truoc || 0);
    if (!(a > 0) || giay <= t0) return truoc;
    if (giay >= a) return 0;
    return Math.max(0, truoc - Math.ceil((giay - t0) * Math.max(0, +toiDa || 0) / Math.max(1, a - t0)));
  }

  // người dùng 20/11/2026 14:43: "không cố định 3, mà tổng kc / tổng câu hỏi, làm tròn xuống" (SQL kc_gio_bai_tru_sai)
  function truSai(toiDa, soCau) { return soCau > 0 ? Math.max(0, Math.floor((+toiDa || 0) / soCau)) : 0; }

  async function napCauHinh(goiRpc) {
    try {
      const kq = await goiRpc("kc_gio_bai_doc_cau_hinh", {});
      if (kq && kq.cauHinh && typeof kq.cauHinh === "object") chung = Object.freeze(Object.assign({}, MAC_DINH, kq.cauHinh));
    } catch (e) { /* giữ số mặc định */ }
    return chung;
  }

  goc.KC_GIO_BAI = Object.freeze({ MAC_DINH, tinh, kcSauGio, truSai, donViDoc, napCauHinh, get cauHinh() { return chung; } });
})(typeof window !== "undefined" ? window : globalThis);
// 20/11/2026 - BƯỚC: TC_D34B (phần 2)
