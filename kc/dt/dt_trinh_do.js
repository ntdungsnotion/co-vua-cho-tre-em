// ================================================================
// FILE: dt/dt_trinh_do.js
// CHỨC NĂNG: ĐỘ KHÓ THÍCH ỨNG của Đấu Trường Tri Thức (Ke_Hoach_Dau_Truong.md mục 5). Không
//            đụng DOM: chạy được trong node (kiểm thử, mô phỏng bé giả) và trên máy bé.
//            - Hồ sơ trình độ của bé: mỗi môn một ĐIỂM TRÌNH ĐỘ theo thang lớp (2,4 = "khoảng giữa
//              lớp 2"); ai cũng bắt đầu ở 1,0. Hồ sơ là JSON thuần (sau này lưu Supabase, TC_D09).
//            - Điểm độ khó của câu = lớp + mức (Dễ / Vừa / Khó, cau_hinh_trinh_do.json "mucDoKho").
//            - Xác suất bé đúng = logistic(doDoc x (trình độ - độ khó) + logit(mucTieu)):
//              trình độ BẰNG độ khó thì bé đúng đúng mucTieu (mặc định 75 %). Nghĩa là "trình độ 2,5"
//              = câu lớp 2 mức Vừa bé đúng khoảng 3 / 4.
//            - Chọn độ khó: trong các (lớp, mức) đang có câu, lớp không quá trần, ưu tiên xác suất
//              trong vùng vừa sức (65-85 %), gần mucTieu nhất thì nặng ký nhất.
//            - Cập nhật sau mỗi câu: trình độ += K x (kết quả - xác suất dự đoán) (kiểu Elo). K lớn lúc đầu
//              ("leo nhanh"), giảm dần tới K ổn định theo số câu sai / số câu đã làm. Sai liền thì
//              tự hạ (mỗi câu sai trừ K x xác suất dự đoán). Kẹp trong [batDau, trần]; trần = cuối lớp đang học (vuotLop: tới lớp 12).
//            - Hệ số thưởng công bằng theo xác suất dự đoán: câu vừa sức x1, câu khó hơn trình độ thưởng
//              thêm, câu dễ hơn nhiều (ôn tập) thưởng ít -> hai bé chăm như nhau kiếm như nhau.
//            - Thành thạo chủ đề 0-100 %: 'soLan' lần trả lời gần nhất của chủ đề, câu khó nặng ký hơn.
//            MỌI CON SỐ đọc từ du_lieu/cau_hinh_trinh_do.json (tách khỏi cau_hinh.json vì file đó được chép vào SQL bản đồ), không viết cứng (MAC_DINH chỉ để chạy
//            khi chưa nạp được file). Đặc tả: repo_rieng dau_truong_tri_thuc/dac_ta_trinh_do.md.
// BƯỚC: TC_D04A; TC_D04B (diemDoKho: thang riêng của nguồn, Tiếng Anh theo cấp từ; khối tiengAnh)
// NGÀY: 29/10/2026
// ================================================================
(function (goc) {
  "use strict";

  // Bản sao của cau_hinh_trinh_do.json để lõi vẫn chạy khi chưa nạp file (kiểm thử so khớp 2 bản)
  const MAC_DINH = {
    batDau: 1.0,
    lopToiDa: 12,
    cuoiLop: 0.99,
    mucTieu: 0.75,
    vungVuaSuc: [0.65, 0.85],
    doDoc: 1.6,
    mucDoKho: { de: 0.1, vua: 0.5, kho: 0.9 },
    K: { leoNhanh: 2.0, soCauLeoNhanh: 40, soSaiLeoNhanh: 6, onDinh: 0.12, heSoSaiKhiLeo: 0.5 },
    tiLeOnTap: 0.2,
    onTap: { xacSuat: 0.88, soChuDeToiThieu: 3 },
    thuong: [
      { duoi: 0.5, heSo: 1.5 },
      { duoi: 0.65, heSo: 1.25 },
      { duoi: 0.86, heSo: 1 },
      { duoi: 0.95, heSo: 0.6 },
      { duoi: 1.01, heSo: 0.3 }
    ],
    thanhThao: { soLan: 10, trongSo: { de: 1, vua: 2, kho: 3 } },
    tiengAnh: { batDauCap: [1, 3, 5, 7], mucCong: { de: 0, vua: 0.67, kho: 1.33 } }
  };
  const MUC = ["de", "vua", "kho"];

  // Ghép cấu hình đọc từ file lên bản mặc định (thiếu khóa nào lấy mặc định khóa đó)
  function cauHinh(ch) {
    const c = Object.assign({}, MAC_DINH, ch || {});
    c.K = Object.assign({}, MAC_DINH.K, (ch && ch.K) || {});
    c.mucDoKho = Object.assign({}, MAC_DINH.mucDoKho, (ch && ch.mucDoKho) || {});
    c.onTap = Object.assign({}, MAC_DINH.onTap, (ch && ch.onTap) || {});
    c.thanhThao = Object.assign({}, MAC_DINH.thanhThao, (ch && ch.thanhThao) || {});
    c.tiengAnh = Object.assign({}, MAC_DINH.tiengAnh, (ch && ch.tiengAnh) || {});
    return c;
  }

  const logit = p => Math.log(p / (1 - p));
  const kep = (x, a, b) => Math.min(b, Math.max(a, x));
  const lam2 = x => Math.round(x * 1000) / 1000;

  // ---------- Hồ sơ ----------
  // lop: lớp bé đang học (1-12, từ tiến độ Đấu Trường); vuotLop: bé / phụ huynh mở "thử thách vượt lớp"
  function taoHoSo(lop, ch) {
    const c = cauHinh(ch);
    return { lop: kep(Math.round(+lop) || 1, 1, c.lopToiDa), vuotLop: false, mon: {}, chuDe: {} };
  }
  function mon(hs, ma, ch) {
    if (!hs.mon[ma]) hs.mon[ma] = { d: cauHinh(ch).batDau, soCau: 0, soSai: 0 };
    return hs.mon[ma];
  }
  // Hồ sơ đọc từ nơi lưu: giá trị lạ thì sửa về hợp lệ (không làm lỗi game)
  function chuanHoa(hs, ch) {
    const c = cauHinh(ch);
    const kq = taoHoSo(hs && hs.lop, c);
    if (!hs || typeof hs !== "object") return kq;
    kq.vuotLop = hs.vuotLop === true;
    Object.keys(hs.mon || {}).forEach(m => {
      const x = hs.mon[m] || {};
      kq.mon[m] = {
        d: kep(isFinite(+x.d) ? +x.d : c.batDau, c.batDau, tran(kq, c)),
        soCau: Math.max(0, Math.floor(+x.soCau) || 0),
        soSai: Math.max(0, Math.floor(+x.soSai) || 0)
      };
    });
    Object.keys(hs.chuDe || {}).forEach(cd => {
      const ds = Array.isArray(hs.chuDe[cd]) ? hs.chuDe[cd] : [];
      kq.chuDe[cd] = ds.filter(v => Array.isArray(v) && v.length === 2).slice(-c.thanhThao.soLan)
        .map(v => [v[0] ? 1 : 0, +v[1] || 1]);
    });
    return kq;
  }

  // Trần trình độ: cuối lớp đang học; vượt lớp thì tới cuối lớp 12. lopCoCau: lớp cao nhất đang có câu
  function tran(hs, ch, lopCoCau) {
    const c = cauHinh(ch);
    let l = hs.vuotLop ? c.lopToiDa : hs.lop;
    if (lopCoCau) l = Math.min(l, lopCoCau);
    return l + c.cuoiLop;
  }
  function lopDuocHoi(hs, ch) { return hs.vuotLop ? cauHinh(ch).lopToiDa : hs.lop; }

  // ---------- Xác suất + chọn độ khó ----------
  function doKho(lop, muc, ch) { return lop + cauHinh(ch).mucDoKho[muc]; }
  // Điểm độ khó của một câu / một (lớp, mức): nguồn có thang riêng (Tiếng Anh theo cấp từ) thì ghi sẵn
  // diemDoKho (câu) / doKho (mục của dsMuc); không có thì lớp + mức
  const diemCau = (cau, ch) => cau.diemDoKho != null ? cau.diemDoKho : doKho(cau.lop, cau.doKho, ch);
  function xacSuat(d, dk, ch) {
    const c = cauHinh(ch);
    return 1 / (1 + Math.exp(-(c.doDoc * (d - dk) + logit(c.mucTieu))));
  }

  // dsMuc: [{ lop, muc }] đang có câu (của môn). mucTieu: xác suất muốn nhắm (mặc định c.mucTieu;
  // câu ôn tập nhắm dễ hơn). Trả { lop, muc, doKho, p } hoặc null nếu không có (lớp, mức) nào.
  function chonDoKho(hs, maMon, dsMuc, rng, ch, mucTieu) {
    const c = cauHinh(ch);
    const d = mon(hs, maMon, c).d;
    const tranLop = lopDuocHoi(hs, c);
    const nhamP = mucTieu || c.mucTieu;
    const ung = dsMuc.filter(m => m.lop <= tranLop).map(m => {
      const dk = typeof m.doKho === "number" ? m.doKho : doKho(m.lop, m.muc, c);
      return Object.assign({}, m, { doKho: dk, p: xacSuat(d, dk, c) });
    });
    if (!ung.length) return null;
    const [thap, cao] = c.vungVuaSuc;
    let chon = mucTieu ? ung : ung.filter(u => u.p >= thap && u.p <= cao);
    if (!chon.length) {
      // không có câu vừa sức (vd. bé đã ở trần): lấy câu có xác suất gần nhất
      const gan = Math.min(...ung.map(u => Math.abs(u.p - nhamP)));
      chon = ung.filter(u => Math.abs(u.p - nhamP) <= gan + 1e-9);
    }
    // gần xác suất nhắm thì nặng ký hơn; vẫn ngẫu nhiên để câu không lặp một kiểu
    const w = chon.map(u => Math.exp(-Math.pow((u.p - nhamP) / 0.08, 2)) + 1e-6);
    let r = rng() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < chon.length; i++) { r -= w[i]; if (r <= 0) return chon[i]; }
    return chon[chon.length - 1];
  }

  // ---------- Cập nhật ----------
  // LEO NHANH: K lớn lúc đầu, giảm đều về K ổn định theo số câu SAI (bé leo đúng liền thì vẫn leo nhanh tới
  // khi gặp câu vừa sức) hoặc số câu đã làm (bé đã ở trần lớp, đúng mãi cũng thôi leo nhanh), cái nào tới trước.
  // Không tăng K theo chuỗi đúng / sai: thử mô phỏng thấy làm trình độ lệch khỏi sức học thật.
  function heSoK(m, ch) {
    const k = cauHinh(ch).K;
    const tien = Math.min(1, Math.max(m.soSai / k.soSaiLeoNhanh, m.soCau / k.soCauLeoNhanh));
    return k.leoNhanh + (k.onDinh - k.leoNhanh) * tien;
  }
  function heSoThuong(p, ch) {
    const bang = cauHinh(ch).thuong;
    for (const h of bang) if (p < h.duoi) return h.heSo;
    return bang[bang.length - 1].heSo;
  }

  // cau: { mon, lop, doKho (mức), chuDe, diemDoKho? }. dung: true / false. dsLopCoCau (tùy chọn): lớp cao nhất có câu.
  // Trả { truoc, sau, p, k, heSoThuong } (heSoThuong = 0 khi sai).
  function capNhat(hs, cau, dung, ch, lopCoCau) {
    const c = cauHinh(ch);
    const m = mon(hs, cau.mon, c);
    const p = xacSuat(m.d, diemCau(cau, c), c);
    const k = heSoK(m, c);
    // đang leo nhanh mà sai một câu: chỉ hạ theo K đã nhân heSoSaiKhiLeo (một câu sơ ý không kéo tụt cả lớp);
    // sai thêm thì soSai tăng, K tự nhỏ dần, trình độ vẫn về đúng sức học
    const kSai = m.soSai < c.K.soSaiLeoNhanh ? Math.max(c.K.onDinh, k * c.K.heSoSaiKhiLeo) : k;
    const truoc = m.d;
    m.d = lam2(kep(m.d + (dung ? k : kSai) * ((dung ? 1 : 0) - p), c.batDau, tran(hs, c, lopCoCau)));
    m.soCau++;
    if (!dung) m.soSai++;
    if (cau.chuDe) {
      const ds = hs.chuDe[cau.chuDe] || (hs.chuDe[cau.chuDe] = []);
      ds.push([dung ? 1 : 0, c.thanhThao.trongSo[cau.doKho] || 1]);
      while (ds.length > c.thanhThao.soLan) ds.shift();
    }
    return { truoc, sau: m.d, p, k, heSoThuong: dung ? heSoThuong(p, c) : 0 };
  }

  // Thành thạo chủ đề 0-100 (null = chưa làm câu nào)
  function thanhThao(hs, chuDe) {
    const ds = hs.chuDe[chuDe];
    if (!ds || !ds.length) return null;
    let tu = 0, mau = 0;
    ds.forEach(([d, w]) => { tu += d * w; mau += w; });
    return Math.round(100 * tu / mau);
  }

  // Chủ đề yếu nhất trong số bé đã làm (để ôn tập). chiTrong: chỉ xét các chủ đề này (tùy chọn)
  function chuDeYeu(hs, chiTrong, ch) {
    const c = cauHinh(ch);
    const ds = Object.keys(hs.chuDe).filter(cd => !chiTrong || chiTrong.indexOf(cd) >= 0);
    if (ds.length < c.onTap.soChuDeToiThieu) return null;
    let tot = null, thap = 101;
    ds.forEach(cd => { const t = thanhThao(hs, cd); if (t !== null && t < thap) { thap = t; tot = cd; } });
    return tot;
  }

  // Bộ ngẫu nhiên có hạt (mô phỏng, kiểm thử, câu sinh lặp lại được)
  function rngHat(hat) {
    let a = (hat >>> 0) || 1;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  goc.KC_DT_TRINH_DO = {
    MAC_DINH, MUC, cauHinh, taoHoSo, mon, chuanHoa, tran, lopDuocHoi, doKho, xacSuat,
    diemCau, chonDoKho, heSoK, heSoThuong, capNhat, thanhThao, chuDeYeu, rngHat
  };
})(typeof window !== "undefined" ? window : globalThis);
// 29/10/2026 - BƯỚC: TC_D04A
