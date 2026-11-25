// ================================================================
// FILE: dt/dt_tuong.js
// CHỨC NĂNG: SỔ TƯỚNG CHUNG của Đấu Trường Tri Thức (đặc tả repo_rieng dau_truong_tri_thuc/dac_ta_tuong.md).
//            NƠI DUY NHẤT trả lời "Thủ lĩnh / tướng này là mẫu nào, file 3D nào, kỹ năng nào, trình diễn ra sao".
//            Màn đấu, bản đồ Thung Lũng, trang Quản trị, sau này Quán Anh Hùng đều hỏi module này;
//            KHÔNG nơi nào khác được đọc thẳng tuong.json / ky_nang.json / hieu_ung.json.
//            Dữ liệu = 3 file mặc định trong du_lieu/ + phần Quản trị sửa (trộn sẵn bởi hàm napTep do trang đưa vào).
//            Chỉ dữ liệu: không Three.js, không DOM, không luật trận -> chạy được trong node (kiểm thử).
// HÀM KHAI RA (goc.KC_DT_TUONG; node: module.exports):
//   TEP = ["tuong", "ky_nang", "hieu_ung"]          tên 3 file (cũng là tên cài đặt Quản trị)
//   HO_TRO = { bo: [...], ham: [...] }               bộ động tác (dt3d_tuong.js) + hàm trình diễn (dt3d_tran.js) mã đang có
//   tai({ napTep(ten) -> Promise<json> }) -> Promise<so>   (lỗi một file -> file đó rỗng, sổ vẫn dùng được)
//   tao(tuong, kyNang, hieuUng) -> so                (đồng bộ: kiểm thử, Quản trị xem trước bản sắp lưu)
//   so.thuLinh({ chungLoai, gioi, thoiKy, tuong? }) -> mẫu  (đời lùi dần; KHÔNG bao giờ null: tệ nhất mẫu "kaykit", tep null)
//   so.mau(ma) / so.kyNang(ma) / so.trinhDien(ma)  -> object | null
//   so.chieuCua(mau) -> { thuong, chiMang, ketLieu, chon[] }   mỗi chiêu = { ma, ...kỹ năng, td: trình diễn } | null
//   so.tepCanTai(dsHoSo?) -> [tep .glb]  hồ sơ đưa vào đứng trước, rồi MỌI mẫu còn lại (luật tải nền: tải toàn bộ)
//   so.loc({ nhom, toc }) -> [mẫu]    so.kiem() -> [chuỗi lỗi]    so.du -> { tuong, kyNang, hieuUng } đã chuẩn hoá
//   Mẫu trả về luôn có thêm `ma`.
// BƯỚC: TC_D05C0a - NGÀY: 25/11/2026
// ================================================================
(function (goc) {
  "use strict";

  const TEP = ["tuong", "ky_nang", "hieu_ung"];
  // mã mà phần vẽ đang biết; thêm bộ / hàm mới = sửa mã (dt3d_tuong.js BO_DONG_TAC, dt3d_tran.js TRINH_DIEN) + dòng này
  const HO_TRO = {
    bo: ["can_chien", "quy", "tien"],
    ham: ["chem", "cau_phep", "vet_x", "cot_lua", "set", "chieu_them", "chieu_vung"]
  };
  const KAYKIT = { ma: "kaykit", ten: "Thủ lĩnh", nhom: "thu_linh", tep: null, dongTac: { bo: "can_chien" }, kyNang: {} };
  const laObj = v => v !== null && typeof v === "object" && !Array.isArray(v);
  const MA = /^[a-z0-9_]+$/;

  function tao(tuong, kyNang, hieuUng) {
    const T = laObj(tuong) ? tuong : {}, K = laObj(kyNang) ? kyNang : {}, H = laObj(hieuUng) ? hieuUng : {};
    const kho = laObj(T.kho) ? T.kho : {}, bangTl = laObj(T.thuLinh) ? T.thuLinh : {};
    const dsKn = laObj(K.kyNang) ? K.kyNang : {}, dsTd = laObj(H.trinhDien) ? H.trinhDien : {};
    const thuTuDoi = Array.isArray(T.doi) && T.doi.length ? T.doi : ["do_da"];

    const mau = ma => (typeof ma === "string" && laObj(kho[ma]) && !kho[ma].an) ? Object.assign({ ma }, kho[ma]) : null;
    const kn = ma => (typeof ma === "string" && laObj(dsKn[ma])) ? Object.assign({ ma }, dsKn[ma]) : null;
    const td = ma => (typeof ma === "string" && laObj(dsTd[ma])) ? Object.assign({ ma }, dsTd[ma]) : null;

    // đời của bé -> đời trước ... -> đời đầu -> duPhong -> KayKit
    function thuLinh(hoSo) {
      const h = hoSo || {};
      if (h.tuong) { const m = mau(h.tuong); if (m) return m; }
      const theoGioi = laObj(bangTl[h.chungLoai]) && bangTl[h.chungLoai][h.gioi === "nu" ? "nu" : "nam"];
      if (laObj(theoGioi)) {
        let i = thuTuDoi.indexOf(h.thoiKy); if (i < 0) i = 0;
        for (; i >= 0; i--) { const m = mau(theoGioi[thuTuDoi[i]]); if (m) return m; }
      }
      return mau(T.duPhong) || Object.assign({}, KAYKIT);
    }

    function chieu(ma) { const k = kn(ma); if (!k) return null; k.td = td(k.trinhDien); return k; }
    function chieuCua(m) {
      const k = (m && laObj(m.kyNang)) ? m.kyNang : {};
      return {
        thuong: chieu(k.thuong), chiMang: chieu(k.chiMang), ketLieu: chieu(k.ketLieu),
        chon: (Array.isArray(k.chon) ? k.chon.slice(0, 4) : []).map(chieu).filter(Boolean)
      };
    }

    function tepCanTai(dsHoSo) {
      const ds = [];
      const them = t => { if (t && ds.indexOf(t) < 0) ds.push(t); };
      (dsHoSo || []).forEach(h => them(thuLinh(h).tep));
      Object.keys(kho).forEach(ma => { const m = mau(ma); if (m) them(m.tep); });
      return ds;
    }

    function loc(dk) {
      const d = dk || {};
      return Object.keys(kho).map(mau).filter(m => m && (!d.nhom || m.nhom === d.nhom) && (!d.toc || m.toc === d.toc));
    }

    function kiem() {
      const loi = [];
      Object.keys(kho).forEach(ma => {
        const m = kho[ma], o = "tướng " + ma;
        if (!MA.test(ma)) loi.push(o + ": mã sai dạng");
        if (!laObj(m)) { loi.push(o + ": không phải object"); return; }
        if (typeof m.tep !== "string" || !/\.glb$/.test(m.tep)) loi.push(o + ": thiếu tep .glb");
        const bo = laObj(m.dongTac) ? m.dongTac.bo : null;
        if (HO_TRO.bo.indexOf(bo) < 0) loi.push(o + ": bộ động tác '" + bo + "' không có trong mã");
        const k = laObj(m.kyNang) ? m.kyNang : {};
        ["thuong", "chiMang", "ketLieu"].forEach(o2 => { if (k[o2] != null && !kn(k[o2])) loi.push(o + ": kỹ năng " + o2 + " '" + k[o2] + "' không có"); });
        if (!k.thuong) loi.push(o + ": thiếu kỹ năng thường");
        if (k.chon != null && !Array.isArray(k.chon)) loi.push(o + ": kyNang.chon phải là mảng");
        if (Array.isArray(k.chon)) {
          if (k.chon.length > 4) loi.push(o + ": quá 4 kỹ năng chọn");
          k.chon.forEach(c => { if (!kn(c)) loi.push(o + ": kỹ năng chọn '" + c + "' không có"); });
        }
      });
      Object.keys(bangTl).forEach(toc => {
        const g = bangTl[toc];
        if (!laObj(g)) { loi.push("thuLinh." + toc + ": không phải object"); return; }
        ["nam", "nu"].forEach(gi => {
          const d = g[gi];
          if (!laObj(d)) { loi.push("thuLinh." + toc + "." + gi + ": thiếu"); return; }
          if (!d[thuTuDoi[0]]) loi.push("thuLinh." + toc + "." + gi + ": thiếu đời đầu " + thuTuDoi[0]);
          Object.keys(d).forEach(doi => {
            if (thuTuDoi.indexOf(doi) < 0) loi.push("thuLinh." + toc + "." + gi + ": đời lạ " + doi);
            if (!mau(d[doi])) loi.push("thuLinh." + toc + "." + gi + "." + doi + ": tướng '" + d[doi] + "' không có");
          });
        });
      });
      if (T.duPhong && !mau(T.duPhong)) loi.push("duPhong '" + T.duPhong + "' không có");
      Object.keys(dsKn).forEach(ma => {
        const k = dsKn[ma];
        if (!MA.test(ma)) loi.push("kỹ năng " + ma + ": mã sai dạng");
        if (!laObj(k)) { loi.push("kỹ năng " + ma + ": không phải object"); return; }
        if (!td(k.trinhDien)) loi.push("kỹ năng " + ma + ": trình diễn '" + k.trinhDien + "' không có");
        ["heSo", "mp", "hoiChieu"].forEach(s => { if (typeof k[s] !== "number" || k[s] < 0) loi.push("kỹ năng " + ma + ": " + s + " phải là số ≥ 0"); });
      });
      Object.keys(dsTd).forEach(ma => {
        const t = dsTd[ma];
        if (!MA.test(ma)) loi.push("trình diễn " + ma + ": mã sai dạng");
        if (!laObj(t) || HO_TRO.ham.indexOf(t.ham) < 0) loi.push("trình diễn " + ma + ": hàm '" + (t && t.ham) + "' không có trong mã");
      });
      return loi;
    }

    return { thuLinh, mau, kyNang: kn, trinhDien: td, chieuCua, tepCanTai, loc, kiem, du: { tuong: T, kyNang: K, hieuUng: H } };
  }

  // napTep(ten) do trang đưa vào: bản đồ = KC_DT_CAU_HINH.tai (file + phần Quản trị sửa); trang trận trong khung = nhờ bản đồ.
  function tai(tuyChon) {
    const nap = (tuyChon && tuyChon.napTep) || (() => Promise.resolve(null));
    return Promise.all(TEP.map(ten => Promise.resolve().then(() => nap(ten)).catch(() => null)))
      .then(([t, k, h]) => {
        const so = tao(t, k, h);
        const loi = so.kiem();
        if (loi.length && typeof console !== "undefined") console.warn("Sổ tướng có chỗ sai (dùng phần đúng, chỗ sai lùi về dự phòng):", loi);
        return so;
      });
  }

  const KC_DT_TUONG = { TEP, HO_TRO, tai, tao };
  goc.KC_DT_TUONG = KC_DT_TUONG;
  if (typeof module !== "undefined" && module.exports) module.exports = KC_DT_TUONG;
})(typeof window !== "undefined" ? window : globalThis);
// 25/11/2026 - BƯỚC: TC_D05C0a (tạo module)
