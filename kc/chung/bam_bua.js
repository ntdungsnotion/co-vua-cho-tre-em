/* ================================================================
   FILE: chung/bam_bua.js
   CHỨC NĂNG: MODULE CHỐNG BẤM BỪA DÙNG CHUNG TOÀN APP (KC_BAM_BUA). Luật toàn app Hướng Dẫn 1.8B: mọi tính
              năng hỏi câu có thưởng (kể cả tính năng mới) phải qua module này; module CHỈ chặn thưởng,
              không đổi chấm điểm, đồng hồ, chuỗi ngày, Sổ Ghi Nhớ, trình độ, cách màn hỏi nhận câu trả lời.
              Đặc tả: repo riêng Thiet_Ke_Chong_Bam_Bua.md (bản 1.2) mục 4 + 9.
              - Bộ ghi chạm: mọi lần chạm vào vùng đáp án (kể cả lúc nút đang tắt). App chỉ nhận lần chạm đầu;
                các lần còn lại là CHẠM THỪA, gắn vào "khoảng trước lần chọn" của câu.
              - Dấu hiệu một câu: D1 bấm dồn (≥ 2 chạm thừa cách nhau ≤ 1 giây), D2 chạm tức thì (< 0,4 giây
                sau lúc mở, câu đã đảo), D3 nhanh như đoán mò (nhanh hơn ngưỡng giờ bài VÀ cả nhóm câu nhanh
                đúng không hơn đoán mò, xác suất chính xác).
              - Kết luận lượt: ≥ 5 câu tính được, ≥ 3 câu và ≥ 50 % câu có dấu hiệu => "bua" (lượt bấm bừa).
              Máy chủ (KC_11C, kc_bb_ket_luan) dùng CÙNG thuật toán; bài thử so JS = SQL.
   DÙNG:
     KC_BAM_BUA.MAC_DINH                       // cấu hình mặc định (giống kc_bb_mac_dinh() máy chủ)
     KC_BAM_BUA.cauHinh(rieng?)                // gộp sâu phần admin sửa vào mặc định
     KC_BAM_BUA.taoBoGhi(tc?)                  // bộ ghi THUẦN (không DOM, đồng hồ tự cấp): cauMoi() mo(t) cham(t) an() chon(t, {phim})
     KC_BAM_BUA.ganVung(goc, boGhi, laVung)    // nối bộ ghi vào trang: pointerdown pha capture + visibilitychange; trả hàm gỡ
     KC_BAM_BUA.nguongD3(giayGioi, ch?)        // ngưỡng giây D3 của một câu
     KC_BAM_BUA.dauHieu(cau, ch?)              // { d1, d2, nhanh } của một câu (D3 cần cả lượt)
     KC_BAM_BUA.ketLuan(ds, ch?)               // kết luận lượt (mục 4.4)
     KC_BAM_BUA.canNhac(ds, ch?)               // true nếu câu vừa xong là câu thứ sau_lien liền có D1 / D2 (bong bóng nhắc, KC_11C)
     KC_BAM_BUA.xacSuatItNhat(ps, k)           // P(số đúng khi đoán mò ≥ k), ps = xác suất đoán đúng từng câu
   Một câu trong ds: { hanhVi: { thua, thuaDon, som, an }, giay, nguongD3, dung, soDapAn, hoiLai, o }
   BƯỚC: KC_11B
   NGÀY: 27/11/2026
   ================================================================ */
(function (goc) {
  "use strict";
  const dong = o => { Object.values(o).forEach(v => { if (v && typeof v === "object") dong(v); }); return Object.freeze(o); };
  const MAC_DINH = dong({
    che_do: "day_du", // KC_11D: bé đã có đường phản hồi + admin bù thưởng -> cắt thưởng lượt ⛔ (= kc_bb_mac_dinh() máy chủ)
    phan_hoi: { bat: true, han_phan_hoi_ngay: 3, do_dai_loi_toi_thieu: 5, do_dai_loi: 200,
                mau_tra_thuong: "Con làm thật rồi, Cô Cú xin lỗi con nhé!", mau_giu_nguyen: "Lần sau mình đọc kỹ từng câu nhé!" },
    cham: { giay_don: 1.0, cham_thua_toi_thieu: 2, giay_tuc_thi: 0.4 },
    d3: { bat: true, ty_le_nhanh: 0.30, san: 1.0, tran: 4.0, so_cau_toi_thieu: 3, p_doan: 0.10 }, // p_doan 0,10 (đặc tả 0,05): bài thử bé giả KC_11B, 0,05 bắt oan nhóm 3-4 câu nhanh đúng 3
    luot: { so_cau_toi_thieu: 5, so_dau_hieu_toi_thieu: 3, ty_le_dau_hieu: 0.50 },
    nhac: { sau_lien: 2, toi_da: 2, giay_hien: 2.5,
            chu: ["Cô Cú nhắc con nhé! Mình đọc kỹ câu hỏi rồi hãy chọn nha 😊", "Con bình tĩnh một chút nhé! Trả lời thật chắc sẽ tốt hơn đấy!"] },
    phu_huynh: { bao_lan: 3, bao_ngay: 7 },
    noi: {
      theo_mon: { che_do: null, nhac: true, cat_thuong: true },
      tong_hop: { che_do: null, nhac: true, cat_thuong: true },
      on_sau_tran: { che_do: null, nhac: true, cat_thuong: true },
      toc_do: { che_do: "chi_ghi", nhac: false, cat_thuong: false },
      chinh_phuc: { che_do: null, nhac: true, cat_thuong: false }
    }
  });

  const laObj = v => v && typeof v === "object" && !Array.isArray(v);
  function gop(a, b) {
    const r = Object.assign({}, a);
    if (!laObj(b)) return r;
    Object.keys(b).forEach(k => { r[k] = laObj(a[k]) && laObj(b[k]) ? gop(a[k], b[k]) : b[k]; });
    return r;
  }
  const cauHinh = rieng => (rieng && rieng.__bb ? rieng : Object.assign(gop(MAC_DINH, rieng), { __bb: true }));
  const so = (x, md) => (Number.isFinite(+x) && x !== null && x !== "" ? +x : md);
  const kep = (x, a, b) => Math.min(b, Math.max(a, x));

  // ---------------- Bộ ghi chạm (thuần, đồng hồ do người gọi cấp, đơn vị mili giây) ----------------
  // Khoảng của một câu = từ lần chọn câu trước (hoặc lúc bắt đầu lượt) tới lần chọn câu này.
  // Lần chạm được nhận = lần chạm cuối cùng SAU lúc mở, cách lần chọn ≤ 1,5 giây (click tới sau pointerdown ~0,05-0,3 giây).
  // Chọn bằng phím (máy tính) thì không có lần chạm được nhận: mọi chạm trong khoảng là thừa.
  function taoBoGhi(tc) {
    const ch = cauHinh(tc && tc.cauHinh);
    let cham = [], moLuc = null, an = false, chamTruoc = null;
    return {
      cauMoi() { moLuc = null; an = false; },              // câu mới hiện (nút có thể còn tắt)
      mo(t) { moLuc = t; an = false; },                    // nút đáp án bấm được
      cham(t) { cham.push(t); },                           // một lần chạm vào vùng đáp án
      an() { if (moLuc != null) an = true; },              // trang bị ẩn lúc câu đang mở
      chon(t, o) {
        const phim = !!(o && o.phim);
        let nhan = -1;
        if (!phim) for (let i = cham.length - 1; i >= 0; i--) { if (cham[i] <= t && moLuc != null && cham[i] >= moLuc && t - cham[i] <= 1500) { nhan = i; break; } }
        const giayDon = so(ch.cham.giay_don, 1) * 1000;
        let thua = 0, thuaDon = 0, som = 0, truoc = chamTruoc;
        cham.forEach((x, i) => {
          if (x > t) return;
          if (i !== nhan) {
            thua++;
            if (moLuc == null || x < moLuc) som++;
            if (truoc != null && x - truoc <= giayDon) thuaDon++;
          }
          truoc = x;
        });
        const hv = { thua: Math.min(200, thua), thuaDon: Math.min(200, thuaDon), som: Math.min(200, som), an: !!an };
        chamTruoc = nhan >= 0 ? cham[nhan] : (cham.filter(x => x <= t).pop() ?? chamTruoc);
        cham = cham.filter(x => x > t); moLuc = null; an = false;
        return hv;
      }
    };
  }

  // Nối bộ ghi vào trang. laVung(diem) -> true nếu cú chạm nằm trong vùng đáp án.
  // Nghe pointerdown ở pha capture trên khung (nút disabled không phát click; pointer events vẫn tới tổ tiên).
  function ganVung(khung, boGhi, laVung) {
    const doc = khung.ownerDocument || goc.document;
    const nghe = e => { try { if (e.isPrimary === false) return; if (laVung(e)) boGhi.cham(performance.now()); } catch (x) { /* bỏ qua */ } };
    const an = () => { if (doc.visibilityState === "hidden") boGhi.an(); };
    khung.addEventListener("pointerdown", nghe, true);
    doc.addEventListener("visibilitychange", an);
    return () => { khung.removeEventListener("pointerdown", nghe, true); doc.removeEventListener("visibilitychange", an); };
  }

  // ---------------- Dấu hiệu ----------------
  function nguongD3(giayGioi, ch) {
    ch = cauHinh(ch);
    const g = so(giayGioi, 0);
    if (!(g > 0)) return 0;
    return Math.round(kep(so(ch.d3.ty_le_nhanh, 0.3) * g, so(ch.d3.san, 1), so(ch.d3.tran, 4)) * 10) / 10;
  }
  const laDao = c => so(c.soDapAn, 0) >= 3; // trắc nghiệm ≥ 3 đáp án luôn được máy chủ đảo; đúng / sai thì không
  function dauHieu(c, ch) {
    ch = cauHinh(ch);
    const hv = c.hanhVi || {};
    const d1 = so(hv.thuaDon, 0) >= so(ch.cham.cham_thua_toi_thieu, 2);
    const giay = so(c.giay, Infinity);
    const d2 = laDao(c) && !c.hoiLai && giay < so(ch.cham.giay_tuc_thi, 0.4);
    const nhanh = so(c.nguongD3, 0) > 0 && giay < so(c.nguongD3, 0);
    return { d1, d2, nhanh };
  }
  const tinhDuoc = c => !c.hoiLai && !(c.hanhVi && c.hanhVi.an);

  // P(X ≥ k), X = tổng các biến Bernoulli(ps[i]) (phân phối nhị thức nhiều xác suất, quy hoạch động)
  function xacSuatItNhat(ps, k) {
    let f = [1];
    ps.forEach(p => {
      const g = new Array(f.length + 1).fill(0);
      f.forEach((v, j) => { g[j] += v * (1 - p); g[j + 1] += v * p; });
      f = g;
    });
    let s = 0; for (let j = Math.max(0, k); j < f.length; j++) s += f[j];
    return Math.min(1, s);
  }

  // ---------------- Kết luận lượt (mục 4.4) ----------------
  function ketLuan(ds, ch) {
    ch = cauHinh(ch);
    ds = Array.isArray(ds) ? ds : [];
    const cau = ds.map(c => Object.assign({ tinh: tinhDuoc(c) }, dauHieu(c, ch), { d3: false }));
    // D3: nhóm câu tính được, nhanh hơn ngưỡng, chưa có D1 / D2
    const ung = [];
    cau.forEach((x, i) => { if (x.tinh && x.nhanh && !x.d1 && !x.d2) ung.push(i); });
    let pD3 = null;
    if (ch.d3.bat && ung.length >= so(ch.d3.so_cau_toi_thieu, 3)) {
      const ps = ung.map(i => 1 / Math.max(2, so(ds[i].soDapAn, 4)));
      const dung = ung.filter(i => ds[i].dung).length;
      pD3 = xacSuatItNhat(ps, dung);
      if (pD3 >= so(ch.d3.p_doan, 0.05)) ung.forEach(i => { cau[i].d3 = true; });
    }
    let soTinh = 0, soDh = 0, d1 = 0, d2 = 0, d3 = 0;
    cau.forEach(x => {
      if (!x.tinh) return;
      soTinh++;
      if (x.d1) d1++; if (x.d2) d2++; if (x.d3) d3++;
      if (x.d1 || x.d2 || x.d3) soDh++;
    });
    // V cùng ô: chỉ ghi
    const dem = {}; let soDao = 0;
    ds.forEach((c, i) => { if (cau[i].tinh && laDao(c) && Number.isInteger(c.o)) { soDao++; dem[c.o] = (dem[c.o] || 0) + 1; } });
    let oNhieu = null, nO = 0; Object.keys(dem).forEach(k => { if (dem[k] > nO) { nO = dem[k]; oNhieu = +k; } });
    const L = ch.luot;
    const bua = soTinh >= so(L.so_cau_toi_thieu, 5) && soDh >= so(L.so_dau_hieu_toi_thieu, 3) && soDh >= so(L.ty_le_dau_hieu, 0.5) * soTinh - 1e-9;
    return {
      ketLuan: bua ? "bua" : "on", soCauTinh: soTinh, soDauHieu: soDh, d1, d2, d3,
      pD3: pD3 == null ? null : Math.round(pD3 * 1000) / 1000,
      oNhieuNhat: oNhieu, tyLeO: soDao ? Math.round(nO / soDao * 100) / 100 : null,
      cau: cau.map(x => ({ d1: x.d1, d2: x.d2, d3: x.d3, tinh: x.tinh }))
    };
  }

  // Bong bóng nhắc (KC_11C): câu vừa xong và (sau_lien − 1) câu tính được liền trước đều có D1 / D2
  function canNhac(ds, ch) {
    ch = cauHinh(ch);
    const n = Math.max(1, so(ch.nhac.sau_lien, 2));
    const tinh = (ds || []).filter(tinhDuoc);
    if (tinh.length < n) return false;
    return tinh.slice(-n).every(c => { const d = dauHieu(c, ch); return d.d1 || d.d2; });
  }

  goc.KC_BAM_BUA = Object.freeze({ MAC_DINH, cauHinh, taoBoGhi, ganVung, nguongD3, dauHieu, ketLuan, canNhac, xacSuatItNhat });
})(typeof window !== "undefined" ? window : globalThis);
// 27/11/2026 - BƯỚC: KC_11B (lõi chống bấm bừa: bộ ghi chạm, D1 / D2 / D3, kết luận lượt; chưa gửi máy chủ)
// 27/11/2026 - BƯỚC: KC_11C (mặc định che_do chi_ghi như máy chủ kc_bb_mac_dinh, KC_11D đổi day_du)
// 27/11/2026 - BƯỚC: KC_11D (mặc định che_do day_du: bật cắt thưởng cùng lúc với máy chủ)
