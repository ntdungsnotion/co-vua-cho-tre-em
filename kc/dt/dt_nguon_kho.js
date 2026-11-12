// ================================================================
// FILE: dt/dt_nguon_kho.js
// CHỨC NĂNG: NGUỒN CÂU "KHO" của Đấu Trường Tri Thức (KC_06B2, Hướng Dẫn 3.17): trận quái + lượt trụ tấn công hỏi câu
//            trong KHO CÂU CHUNG kc_cau_hoi, máy bé KHÔNG có đáp án, máy chủ chấm từng lượt.
//            - Cùng giao diện nguồn với bộ sinh câu (dsMuc / dangCho / coChuDe / taoCau) nên dt_cau_hoi.js (chọn độ khó vừa
//              sức, ôn tập chủ đề yếu, độ khó tự nâng) dùng nguyên. "Dạng" ở đây = "lớp|chủ đề" của một ô câu.
//            - Ô câu (môn x chủ đề x lớp x mức -> số câu) hỏi máy chủ một lần (kho("o")); mỗi (môn, lớp, mức) giữ một
//              lô câu xin trước (kho("lo"), 20 câu, không đáp án); lô còn ít thì tự xin thêm, bỏ câu vừa hỏi.
//            - taoCau đồng bộ: lô trống thì trả null + xin lô; trang chờ cho() rồi chọn lại (ô thiếu câu: lấy ô gần nhất,
//              cuối cùng câu bất kỳ của môn ở lớp thấp hơn, Thiet_Ke_Kho_Cau_Hoi.md mục 11 ý 3c).
//            - cham(cau, chon, giay): máy chủ chấm; mất mạng thì gửi lại CÙNG mã lượt (không tính 2 lần) tới khi được.
//            - CHẤM NHANH (12/11/2026, người dùng chọn "chấm ngay trên máy" để tụ chiêu ngắn): lô xin kèm nhanh: true ->
//              mỗi câu có muoi + k = 12 ký tự đầu sha256("muoi:id:vị trí đúng") (RPC kc_cau_hoi_lo_tran). cham() thử bấm từng
//              vị trí, biết đúng / sai NGAY (lô nhanh kèm luôn lời giải: người dùng 12/11 "game cho trẻ học, không cần bảo mật cao"); vẫn gửi máy chủ chấm ở nền (ghi tiến độ, Sổ Ghi Nhớ) và trả lời giải khi về (khiLoiGiai).
//              Câu không có k (máy chủ chưa chạy SQL mới): chờ máy chủ chấm như cũ.
//            Không đụng DOM: chạy được trong node (kiểm thử, mô phỏng).
// HÀM KHAI RA (goc.KC_DT_NGUON_KHO):
//   tao({ goi(ham, ts) -> Promise<kq>, gapO, n? }) -> kho = { batDau() -> Promise<bool>, nguon: { <môn>: nguồn }, mon: [mã môn],
//        cho() -> Promise (đợi các lô đang xin), cauTiep(bo, hs, mon, rng?) -> Promise<{ cau, p, doKho, onTap }|null> (bo của
//        dt_cau_hoi.js trên kho.nguon), cauDuPhong(mon, lop) -> Promise<câu|null>,
//        cham(cau, chon, giay, { khiCho(giay), dung(), khiLoiGiai(loiGiai) }) -> Promise<{ dung, dapAnDung, loiGiai, nhanh? }> }
//   khoGia(nguonSinh, { soMoiO, chamMs, nhanh }) -> { goi(ham, ts) } kho GIẢ dựng từ bộ sinh câu (trang thử, máy chủ giả, kiểm thử):
//        cùng khuôn kết quả với RPC thật, giữ đáp án trong bộ nhớ.
// BƯỚC: KC_06B2 - NGÀY: 11/11/2026
// ================================================================
(function (goc) {
  "use strict";
  const LO_N = 20, LO_THAP = 6, NHO_GAN_DAY = 200, CHO_LAI_MS = [800, 1500, 3000, 5000];

  function taoUuid() {
    const c = goc.crypto;
    if (c && typeof c.randomUUID === "function") return c.randomUUID();
    const b = new Uint8Array(16);
    if (c && c.getRandomValues) c.getRandomValues(b); else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
    b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
    const h = Array.from(b, x => x.toString(16).padStart(2, "0")).join("");
    return h.slice(0, 8) + "-" + h.slice(8, 12) + "-" + h.slice(12, 16) + "-" + h.slice(16, 20) + "-" + h.slice(20);
  }
  const ngu = ms => new Promise(x => setTimeout(x, ms));
  // chấm nhanh: 12 ký tự đầu sha256 (hex) của chuỗi; trình duyệt / node 20+ đều có crypto.subtle
  const subtle = goc.crypto && goc.crypto.subtle;
  async function bam12(s) {
    const b = await subtle.digest("SHA-256", new TextEncoder().encode(s));
    return Array.from(new Uint8Array(b), x => x.toString(16).padStart(2, "0")).join("").slice(0, 12);
  }
  async function dapAnNhanh(cau) {
    if (!subtle || !cau || !cau.k || !cau.muoi) return null;
    try { for (let i = 0; i < cau.dapAn.length; i++) if (await bam12(cau.muoi + ":" + cau.id + ":" + i) === cau.k) return i; } catch (e) { /* không bấm được: chờ máy chủ */ }
    return null;
  }

  // câu máy chủ gửi (kc_cau_hoi_lo) -> câu Đấu Trường (dung rỗng = chưa biết đáp án)
  function doiCau(c) {
    if (!c || !Number.isInteger(c.id) || typeof c.noiDung !== "string" || !Array.isArray(c.dapAn) || c.dapAn.length < 2) return null;
    return { id: c.id, mon: c.mon, lop: Number.isInteger(c.lopTu) ? c.lopTu : 1, doKho: c.muc || "vua", chuDe: c.chuDe || "", noiDung: c.noiDung,
      dapAn: c.dapAn.map(String), dung: [], loiGiai: "", hinh: c.hinh || "", hinhChu: c.hinhChu || "", amThanh: c.amThanh || "", kho: true,
      k: typeof c.k === "string" ? c.k : "", muoi: typeof c.muoi === "string" ? c.muoi : "",
      lgSan: c.k && typeof c.loiGiai === "string" ? c.loiGiai : "" }; // lô chấm nhanh kèm lời giải (hiện ngay khi lật bài)
  }

  function tao(opt) {
    const goi = opt.goi, gapO = opt.gapO || "dau_truong_quai", loN = opt.n || LO_N;
    let o = [];                 // ô câu
    const lo = new Map();       // "mon|lop|muc" -> [câu]
    const dangXin = new Map();  // khoá -> Promise
    const trong = new Set();    // khoá ô đã xin mà máy chủ không còn câu
    const ganDay = [];          // mã câu vừa đưa ra (không xin lại)
    const nguon = {};

    const khoa = (mon, lop, muc) => mon + "|" + lop + "|" + muc;
    function nho(id) { ganDay.push(id); while (ganDay.length > NHO_GAN_DAY) ganDay.shift(); }

    function xin(mon, lop, muc, chuDe) {
      const k = khoa(mon, lop, muc) + (chuDe ? "|" + chuDe : "");
      if (dangXin.has(k)) return dangXin.get(k);
      const kl = khoa(mon, lop, muc), dangCo = () => (lo.get(kl) || []).map(c => c.id);
      const hoi = boQua => Promise.resolve(goi("lo", { mon, lop, muc, chuDe: chuDe || null, n: loN, boQua, nhanh: true }));
      // ô ít câu, bé đã gặp hết: cho hỏi lại câu cũ (chỉ bỏ câu đang nằm trong lô) thay vì coi ô là trống
      const p = hoi(ganDay.concat(dangCo()).slice(-NHO_GAN_DAY))
        .then(kq => kq && kq.ok && !(kq.cau || []).length && ganDay.length ? hoi(dangCo()) : kq)
        .then(kq => {
          const ds = kq && kq.ok ? (kq.cau || []).map(doiCau).filter(Boolean) : null;
          if (ds) {
            const cu = lo.get(kl) || [];
            ds.forEach(c => { if (!cu.some(x => x.id === c.id)) cu.push(c); });
            lo.set(kl, cu);
            if (!ds.length && !chuDe && !cu.length) trong.add(kl);
          }
        }).catch(() => null).then(() => { dangXin.delete(k); });
      dangXin.set(k, p);
      return p;
    }

    function taoNguon(mon) {
      const oMon = () => o.filter(x => x.mon === mon && !trong.has(khoa(mon, x.lop, x.muc)));
      return {
        mon,
        dsMuc() {
          const kq = [], co = new Set();
          oMon().forEach(x => { const k = x.lop + "|" + x.muc; if (!co.has(k)) { co.add(k); kq.push({ lop: x.lop, muc: x.muc }); } });
          return kq;
        },
        dangCho(m, chuDe) {
          const co = new Set();
          return oMon().filter(x => x.lop === m.lop && x.muc === m.muc && (!chuDe || x.chuDe === chuDe) && !co.has(x.chuDe) && co.add(x.chuDe))
            .map(x => ({ ma: x.lop + "|" + x.chuDe, chuDe: x.chuDe, lop: x.lop }));
        },
        coChuDe: cd => o.some(x => x.mon === mon && x.chuDe === cd),
        // maDang = "lớp|chủ đề"; chuDe (ôn tập) = phải đúng chủ đề này
        taoCau(maDang, muc, hat, chuDe) {
          const [l, cd] = String(maDang).split("|"), lop = Number(l), kl = khoa(mon, lop, muc);
          const ds = lo.get(kl) || [];
          let i = ds.findIndex(c => c.chuDe === (chuDe || cd));
          if (i < 0 && !chuDe) i = ds.length ? Math.floor(((hat >>> 0) % 997) / 997 * ds.length) : -1;
          if (ds.length - (i >= 0 ? 1 : 0) < LO_THAP) xin(mon, lop, muc);
          if (i < 0) { if (chuDe) xin(mon, lop, muc, chuDe); return null; }
          const c = ds.splice(i, 1)[0];
          nho(c.id);
          return Object.assign({}, c, { dapAn: c.dapAn.slice(), dung: [] });
        }
      };
    }

    async function batDau() {
      let kq = null;
      for (let lan = 0; lan < 3 && !(kq && kq.ok); lan++) { kq = await Promise.resolve(goi("o", {})).catch(() => null); if (!(kq && kq.ok)) await ngu(CHO_LAI_MS[lan]); }
      if (!kq || !kq.ok) return false;
      o = (kq.o || []).filter(x => x && typeof x.mon === "string" && Number.isInteger(x.lop) && /^(de|vua|kho)$/.test(x.muc) && x.n > 0);
      [...new Set(o.map(x => x.mon))].forEach(m => { nguon[m] = taoNguon(m); });
      return o.length > 0;
    }

    const cho = () => Promise.all([...dangXin.values()]);

    // Ô thiếu câu: câu bất kỳ của môn ở lớp <= lop (gần nhất trước), cuối cùng lớp bất kỳ
    async function cauDuPhong(mon, lop) {
      const dsLop = [...new Set(o.filter(x => x.mon === mon).map(x => x.lop))].sort((a, b) => Math.abs(a - lop) - Math.abs(b - lop) || a - b);
      const thu = dsLop.filter(l => l <= lop).concat(dsLop.filter(l => l > lop));
      for (const l of thu.slice(0, 4)) {
        const kq = await Promise.resolve(goi("lo", { mon, lop: l, muc: null, n: 4, boQua: ganDay.slice(-NHO_GAN_DAY), nhanh: true })).catch(() => null);
        const c = kq && kq.ok ? (kq.cau || []).map(doiCau).filter(Boolean)[0] : null;
        if (c) { nho(c.id); return c; }
      }
      return null;
    }

    // Câu tiếp theo cho trận (bo = dt_cau_hoi.js taoBoChon(ch, kho.nguon)): chọn độ khó vừa sức như bộ sinh; lô trống thì đợi xin
    // xong rồi chọn lại (tối đa 3 vòng); vẫn không có thì câu dự phòng ở lớp gần nhất. Trả { cau, p, doKho, onTap } hoặc null.
    async function cauTiep(bo, hs, mon, rng) {
      if (!nguon[mon]) mon = Object.keys(nguon)[0];
      if (!mon) return null;
      for (let vong = 0; vong < 3; vong++) {
        const x = bo.cauTiep(hs, mon, rng);
        if (x && x.cau) return x;
        await cho();
      }
      const TD = goc.KC_DT_TRINH_DO, lop = TD ? TD.lopDuocHoi(hs, bo.ch) : (hs && hs.lop) || 1;
      const c = await cauDuPhong(mon, lop);
      return c ? { cau: c, p: null, doKho: null, onTap: false, duPhong: true } : null;
    }

    // Máy chủ chấm. Lỗi mạng: gửi lại cùng maLuot (khiCho(giây đã chờ) để trang hiện "Đang chờ mạng..."). Câu không còn dùng được
    // / hết phiên đăng nhập: trả { loi: ma } (trang coi như không có đáp án).
    async function cham(cau, chon, giay, tuyChon) {
      const d = await dapAnNhanh(cau);
      if (d == null) return chamMayChu(cau, chon, giay, tuyChon);
      // chấm nhanh: kết quả ngay; máy chủ chấm ở nền để ghi tiến độ + lấy lời giải (mất mạng thì thử lại ít lần)
      const khiLoiGiai = tuyChon && tuyChon.khiLoiGiai;
      chamMayChu(cau, chon, giay, { lanToiDa: 6 }).then(k => { if (!k.loi && khiLoiGiai) khiLoiGiai(k.loiGiai || ""); }, () => null);
      return { dung: Number.isInteger(chon) && chon === d, dapAnDung: d, loiGiai: cau.lgSan || "", nhanh: true };
    }
    async function chamMayChu(cau, chon, giay, tuyChon) {
      const maLuot = cau.maLuot || (cau.maLuot = taoUuid()), t0 = Date.now(), khiCho = tuyChon && tuyChon.khiCho;
      for (let lan = 0; ; lan++) {
        const kq = await Promise.resolve(goi("cham", { maLuot, id: cau.id, chon: Number.isInteger(chon) ? chon : null, giay, gapO })).catch(() => null);
        if (kq && kq.ok && Number.isInteger(kq.dapAnDung)) return { dung: !!kq.dung, dapAnDung: kq.dapAnDung, loiGiai: kq.loiGiai || "" };
        if (kq && kq.ma && kq.ma !== "mang") return { loi: kq.ma, dung: false, dapAnDung: -1, loiGiai: "" };
        if (tuyChon && tuyChon.dung && tuyChon.dung()) return { loi: "dung", dung: false, dapAnDung: -1, loiGiai: "" }; // trang đã đóng trận
        if (tuyChon && tuyChon.lanToiDa && lan + 1 >= tuyChon.lanToiDa) return { loi: "mang", dung: false, dapAnDung: -1, loiGiai: "" };
        if (khiCho) khiCho((Date.now() - t0) / 1000);
        await ngu(CHO_LAI_MS[Math.min(lan, CHO_LAI_MS.length - 1)]);
      }
    }

    return { batDau, nguon, get mon() { return Object.keys(nguon); }, cho, cauTiep, cauDuPhong, cham, _lo: lo, _o: () => o };
  }

  // ---------- KHO GIẢ từ bộ sinh câu (trang thử / máy chủ giả / kiểm thử) ----------
  // nguonSinh = { toan: KC_DT_SINH_TOAN, tieng_anh: KC_DT_SINH_TA.tao(...) }
  function khoGia(nguonSinh, tc) {
    const soMoiO = (tc && tc.soMoiO) || 12, chamMs = tc && Number.isFinite(tc.chamMs) ? tc.chamMs : 0;
    const coNhanh = !(tc && tc.nhanh === false); // nhanh: false = giả máy chủ chưa chạy SQL chấm nhanh (thử đường chờ máy chủ)
    const cau = [], theoId = new Map();
    let id = 1;
    Object.keys(nguonSinh || {}).forEach(mon => {
      const ng = nguonSinh[mon];
      ng.dsMuc().forEach(m => ng.dangCho(m).forEach(d => {
        for (let k = 0; k < soMoiO; k++) {
          const c = ng.taoCau(d.ma, m.muc, (k * 2654435761 + id * 97) >>> 0, null);
          if (!c || !Array.isArray(c.dung) || !c.dung.length) continue;
          const lop = Number.isInteger(c.lop) ? c.lop : m.lop;
          const x = { id: id++, mon, chuDe: String(c.chuDe || d.chuDe || "khac").replace(/^ta_/, ""), lopTu: lop, lopDen: lop, muc: m.muc, noiDung: c.noiDung,
            dapAn: c.dapAn.map(String), dung: c.dung.slice(), loiGiai: c.loiGiai || "", hinh: c.hinh || "", hinhChu: c.hinhChu || "", amThanh: c.amThanh || "" };
          cau.push(x); theoId.set(x.id, x);
        }
      }));
    });
    const daCham = new Map();
    const tre = v => chamMs ? ngu(chamMs).then(() => v) : Promise.resolve(v);
    function goi(ham, ts) {
      const h = ts || {};
      if (ham === "o") {
        const dem = new Map();
        cau.forEach(c => { const k = [c.mon, c.chuDe, c.lopTu, c.muc].join("|"); dem.set(k, (dem.get(k) || 0) + 1); });
        return tre({ ok: true, o: [...dem].map(([k, n]) => { const [mon, chuDe, lop, muc] = k.split("|"); return { mon, chuDe, lop: +lop, muc, n }; }) });
      }
      if (ham === "lo") {
        const bo = new Set(h.boQua || []);
        const ds = cau.filter(c => c.mon === h.mon && (h.lop == null || c.lopTu === h.lop) && (!h.muc || c.muc === h.muc) && (!h.chuDe || c.chuDe === h.chuDe) && !bo.has(c.id));
        for (let i = ds.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ds[i], ds[j]] = [ds[j], ds[i]]; }
        const ra = ds.slice(0, h.n || 20).map(c => { const x = Object.assign({}, c); delete x.dung; delete x.loiGiai; return x; });
        if (!h.nhanh || !coNhanh || !subtle) return tre({ ok: true, cau: ra });
        // như kc_cau_hoi_lo_tran: muoi ngẫu nhiên + k = 12 ký tự đầu sha256("muoi:id:vị trí đúng")
        return Promise.all(ra.map(x => { x.muoi = Math.random().toString(36).slice(2) + Date.now().toString(36); return bam12(x.muoi + ":" + x.id + ":" + theoId.get(x.id).dung[0]).then(k => { x.k = k; }); }))
          .then(() => { ra.forEach(x => { x.loiGiai = theoId.get(x.id).loiGiai; }); return tre({ ok: true, cau: ra }); });
      }
      if (ham === "cham") {
        const c = theoId.get(h.id);
        if (!c) return tre({ ok: false, ma: "cau" });
        const cu = daCham.get(h.maLuot);
        const dung = cu != null ? cu : Number.isInteger(h.chon) && c.dung.indexOf(h.chon) >= 0;
        daCham.set(h.maLuot, dung);
        return tre({ ok: true, dung, dapAnDung: c.dung[0], loiGiai: c.loiGiai, cu: cu != null });
      }
      return tre({ ok: false, ma: "lenh" });
    }
    // dap(id): đáp án đúng (CHỈ kịch bản thử dùng để bấm đúng; trang trận không gọi được)
    return { goi, soCau: cau.length, dap: id => { const c = theoId.get(id); return c ? c.dung[0] : null; } };
  }

  goc.KC_DT_NGUON_KHO = { tao, khoGia, doiCau, dapAnNhanh }; // KC_06B3: dapAnNhanh(cau) cho trận trụ / công trình (chấm ngay)
})(typeof window !== "undefined" ? window : globalThis);
// 11/11/2026 - BƯỚC: KC_06B2
// 12/11/2026 - BƯỚC: KC_06B2 (chấm nhanh trên máy: lô kèm muoi + k, máy chủ chấm ở nền)
// 12/11/2026 - BƯỚC: KC_06B3 (xuất dapAnNhanh cho trận trụ / công trình của bạn)
