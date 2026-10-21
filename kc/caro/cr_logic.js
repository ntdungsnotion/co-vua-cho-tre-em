/* ================================================================
   FILE: caro/cr_logic.js
   CHỨC NĂNG: LÕI CỜ CARO - không chạm giao diện, chạy được cả trong trình duyệt
              lẫn Node (kiểm thử repo_rieng/kiem_thu/cr_kiem_thu_node.js).
              - Bàn 15 x 15, mỗi ô một số: 0 trống, 1 bé (❌, luôn đi trước), 2 máy (⭕).
                Ô đánh số o = hang * 15 + cot (0..224) - cùng cách đánh số với
                SQL kc_caro_kiem_van_thang, nên danh sách nước đi gửi lên máy chủ
                kiểm lại được.
              - Thắng: 5 quân LIỀN NHAU trở lên theo ngang / dọc / 2 đường chéo.
                Không áp luật chặn hai đầu (người dùng chốt 21/10/2026, cho trẻ nhỏ).
              - "Bộ não cũ" (TC_02A), cách tính "cửa sổ 5 ô": mỗi ô trống được cộng điểm
                theo mọi đoạn 5 ô đi qua nó mà chưa có quân đối phương (đoạn càng nhiều
                quân mình càng giá trị) - bắt được cả thế cờ có lỗ (❌❌_❌❌).
                Điểm = tấn công + hệ số x phòng thủ. Thứ tự cứng trước khi tính điểm:
                thắng được thì thắng; bé sắp thắng thì chặn (mức thấp có lúc quên chặn).
              - TC_02C: 20 CẤP MÁY (CR.CAP, giống Cờ Vua: bé thắng máy đúng cấp của mình thì
                lên cấp - máy chủ giữ cấp). Cấp 1-5 = bộ não cũ, càng lên càng ít quên chặn;
                cấp 6-20 = thư viện Gomoku Engine (thu_vien/gomoku_engine.js) nghĩ sâu dần
                (giây nghĩ tăng), cấp 6-16 thỉnh thoảng đi theo bộ não cũ ("sai" = xác suất)
                cho dễ thở. Bảng cấp chỉnh theo kết quả tự đấu (nhật ký TC_02C).
                Mã mức gửi máy chủ: 'c<cấp>'. Mức cũ 'de' | 'vua' | 'kho' giữ cho tương thích.
              - Trình duyệt: cấp 6-20 nghĩ trong Web Worker (caro/cr_may_nghi.js) cho màn hình
                không đơ; CR.mayDiCap chạy được cả ở luồng chính, Worker và Node.
   BƯỚC: TC_02A | TC_02C (20 cấp máy + Gomoku Engine)
   NGÀY: 21/10/2026 17:20 | 21/10/2026 23:22
   ================================================================ */
(function (goc) {
  "use strict";
  const CR = goc.CR = goc.CR || {};

  const N = CR.KICH_THUOC = 15;
  CR.SO_O = N * N;
  CR.TRONG = 0; CR.BE = 1; CR.MAY = 2;
  const HUONG = [[0, 1], [1, 0], [1, 1], [1, -1]];   // ngang, dọc, chéo xuống, chéo lên

  // Điểm một đoạn 5 ô theo số quân mình trong đoạn SAU khi đặt thêm quân (1..5)
  const DIEM_DOAN = [0, 1, 12, 120, 1500, 1000000];

  /* Mỗi mức: heSoThu = coi trọng chặn bé bao nhiêu; quenChan = xác suất quên chặn
     nước bé sắp thắng; ngauNhien = xác suất đi bừa một ô gần quân; chonTrong + nguong =
     chọn ngẫu nhiên trong tối đa chonTrong ô điểm cao nhất mà điểm >= nguong x điểm ô tốt nhất. */
  CR.MUC = {
    de:  { heSoThu: 0.45, quenChan: 0.45, ngauNhien: 0.30, chonTrong: 5, nguong: 0 },
    vua: { heSoThu: 1.0,  quenChan: 0,    ngauNhien: 0.04, chonTrong: 3, nguong: 0.6 },
    kho: { heSoThu: 1.15, quenChan: 0,    ngauNhien: 0,    chonTrong: 1, nguong: 1 },
    // TC_02C: cấp 1-5 (c1 = de, c5 = kho)
    c1:  { heSoThu: 0.45, quenChan: 0.45, ngauNhien: 0.30, chonTrong: 5, nguong: 0 },
    c2:  { heSoThu: 0.6,  quenChan: 0.32, ngauNhien: 0.20, chonTrong: 4, nguong: 0.3 },
    c3:  { heSoThu: 0.8,  quenChan: 0.18, ngauNhien: 0.10, chonTrong: 3, nguong: 0.5 },
    c4:  { heSoThu: 1.0,  quenChan: 0.06, ngauNhien: 0.04, chonTrong: 3, nguong: 0.6 },
    c5:  { heSoThu: 1.15, quenChan: 0,    ngauNhien: 0,    chonTrong: 1, nguong: 1 }
  };

  /* TC_02C: 20 cấp máy. hinh + ten = nhân vật bé thấy. Cấp 6-20: giay = thời gian Gomoku
     Engine được nghĩ (giây, máy tính để bàn; điện thoại chậm hơn thì tự nghĩ nông hơn),
     sai = xác suất đi theo bộ não cũ mức kho thay cho engine. */
  CR.CAP_TOI_DA = 20;
  CR.CAP = [null,
    { hinh: "🐣", ten: "Gà Con" },
    { hinh: "🐰", ten: "Thỏ Bông" },
    { hinh: "🐢", ten: "Rùa Xanh" },
    { hinh: "🐱", ten: "Mèo Mướp" },
    { hinh: "🐶", ten: "Cún Con" },
    { hinh: "🦊", ten: "Cáo Nhỏ",     giay: 0.2,  sai: 0.4 },
    { hinh: "🦉", ten: "Cú Mèo",      giay: 0.25, sai: 0.33 },
    { hinh: "🐼", ten: "Gấu Trúc",    giay: 0.3,  sai: 0.27 },
    { hinh: "🐵", ten: "Khỉ Lanh",    giay: 0.35, sai: 0.21 },
    { hinh: "🐺", ten: "Sói Xám",     giay: 0.4,  sai: 0.16 },
    { hinh: "🦅", ten: "Đại Bàng",    giay: 0.45, sai: 0.12 },
    { hinh: "🐆", ten: "Báo Đốm",     giay: 0.5,  sai: 0.08 },
    { hinh: "🐻", ten: "Gấu Nâu",     giay: 0.55, sai: 0.05 },
    { hinh: "🦁", ten: "Sư Tử",       giay: 0.6,  sai: 0.03 },
    { hinh: "🐯", ten: "Hổ Lớn",      giay: 0.7,  sai: 0.02 },
    { hinh: "🐘", ten: "Voi Thông Thái", giay: 0.85, sai: 0.01 },
    { hinh: "🦈", ten: "Cá Mập",      giay: 1.0,  sai: 0 },
    { hinh: "🦖", ten: "Khủng Long",  giay: 1.3,  sai: 0 },
    { hinh: "🦄", ten: "Kỳ Lân",      giay: 1.6,  sai: 0 },
    { hinh: "🐉", ten: "Rồng Lửa",    giay: 2.0,  sai: 0 }
  ];
  CR.CAP.forEach((c, i) => { if (c) { c.cap = i; c.muc = "c" + i; c.dungEngine = typeof c.giay === "number"; } });
  /* 'c7' -> 7; không phải mã cấp -> 0 */
  CR.capCuaMuc = function (muc) {
    const m = /^c([0-9]{1,2})$/.exec(String(muc || ""));
    const n = m ? Number(m[1]) : 0;
    return n >= 1 && n <= CR.CAP_TOI_DA ? n : 0;
  };
  CR.mucHopLe = muc => !!(CR.MUC[muc] || CR.capCuaMuc(muc));

  CR.taoBan = function () { return new Array(N * N).fill(0); };
  CR.hang = o => Math.floor(o / N);
  CR.cot = o => o % N;
  CR.doiThu = nguoi => (nguoi === CR.BE ? CR.MAY : CR.BE);
  CR.hopLe = (ban, o) => Number.isInteger(o) && o >= 0 && o < N * N && ban[o] === 0;
  CR.hetCho = ban => ban.indexOf(0) === -1;

  /* Ô o vừa có quân -> trả về dãy ô thắng (>= 5 quân liền, gồm o) hoặc null. */
  CR.dayThang = function (ban, o) {
    const nguoi = ban[o];
    if (!nguoi) return null;
    const h0 = CR.hang(o), c0 = CR.cot(o);
    for (const [dh, dc] of HUONG) {
      const day = [o];
      for (const chieu of [1, -1]) {
        let h = h0 + dh * chieu, c = c0 + dc * chieu;
        while (h >= 0 && h < N && c >= 0 && c < N && ban[h * N + c] === nguoi) {
          day.push(h * N + c);
          h += dh * chieu; c += dc * chieu;
        }
      }
      if (day.length >= 5) return day.sort((a, b) => a - b);
    }
    return null;
  };

  /* Điểm của ô trống o nếu người `nguoi` đặt vào đó. */
  CR.diemO = function (ban, o, nguoi) {
    const doi = CR.doiThu(nguoi);
    const h0 = CR.hang(o), c0 = CR.cot(o);
    let tong = 0;
    for (const [dh, dc] of HUONG) {
      for (let lui = -4; lui <= 0; lui++) {        // đoạn 5 ô bắt đầu cách o "lui" bước
        let cua = 0, chan = false;
        for (let k = 0; k < 5; k++) {
          const h = h0 + dh * (lui + k), c = c0 + dc * (lui + k);
          if (h < 0 || h >= N || c < 0 || c >= N) { chan = true; break; }
          const v = ban[h * N + c];
          if (v === doi) { chan = true; break; }
          if (v === nguoi) cua++;
        }
        if (!chan) tong += DIEM_DOAN[cua + 1];
      }
    }
    return tong;
  };

  /* Các ô trống cách quân gần nhất <= 2 ô (bàn trống: ô giữa). */
  CR.oUngVien = function (ban) {
    const ds = [];
    let coQuan = false;
    for (let o = 0; o < N * N; o++) {
      if (ban[o]) { coQuan = true; continue; }
      const h0 = CR.hang(o), c0 = CR.cot(o);
      let gan = false;
      for (let dh = -2; dh <= 2 && !gan; dh++) {
        for (let dc = -2; dc <= 2; dc++) {
          const h = h0 + dh, c = c0 + dc;
          if (h >= 0 && h < N && c >= 0 && c < N && ban[h * N + c]) { gan = true; break; }
        }
      }
      if (gan) ds.push(o);
    }
    if (!coQuan) return [Math.floor(N / 2) * N + Math.floor(N / 2)];
    return ds;
  };

  /* Ô mà `nguoi` đặt vào là thắng ngay (null nếu không có). */
  CR.oThangNgay = function (ban, nguoi, dsO) {
    for (const o of dsO || CR.oUngVien(ban)) {
      if (ban[o]) continue;
      ban[o] = nguoi;
      const thang = CR.dayThang(ban, o);
      ban[o] = 0;
      if (thang) return o;
    }
    return null;
  };

  /* Máy chọn nước đi. ngauNhien(): hàm trả số [0,1) (mặc định Math.random) -
     kiểm thử truyền hàm cố định để chạy lại được đúng ván. */
  CR.mayDi = function (ban, muc, ngauNhien) {
    const rnd = ngauNhien || Math.random;
    const m = CR.MUC[muc] || CR.MUC.vua;
    const dsO = CR.oUngVien(ban);
    if (!dsO.length) return -1;

    const thang = CR.oThangNgay(ban, CR.MAY, dsO);
    if (thang !== null) return thang;
    const chan = CR.oThangNgay(ban, CR.BE, dsO);
    if (chan !== null && rnd() >= m.quenChan) return chan;

    if (m.ngauNhien && rnd() < m.ngauNhien) {
      // đi bừa nhưng vẫn sát quân, cho giống người đang tập chơi
      return dsO[Math.floor(rnd() * dsO.length)];
    }

    const xep = dsO.map(o => ({
      o,
      diem: CR.diemO(ban, o, CR.MAY) + m.heSoThu * CR.diemO(ban, o, CR.BE)
             + (rnd() * 0.5)                         // phá thế hoà điểm, đỡ lặp ván
    })).sort((a, b) => b.diem - a.diem);
    const top = xep.slice(0, Math.max(1, m.chonTrong)).filter(x => x.diem >= m.nguong * xep[0].diem);
    return top[Math.floor(rnd() * top.length)].o;
  };

  /* TC_02C: máy (⭕, người đi sau) chọn nước theo cấp 1-20 từ danh sách nước đi của ván.
     GE: thư viện GomokuEngine (thiếu - vd trình duyệt không chạy được Worker - thì cấp 6-20
     đi bằng bộ não cũ mức kho). Trả về ô 0..224 hoặc -1 nếu hết chỗ. */
  CR.mayDiCap = function (nuocDi, cap, ngauNhien, GE) {
    const rnd = ngauNhien || Math.random;
    const c = CR.CAP[cap] || CR.CAP[1];
    const ban = CR.taoBan();
    nuocDi.forEach((o, i) => { ban[o] = i % 2 === 0 ? CR.BE : CR.MAY; });
    if (!c.dungEngine || !GE) return CR.mayDi(ban, c.dungEngine ? "kho" : c.muc, rnd);
    if (c.sai && rnd() < c.sai) return CR.mayDi(ban, "kho", rnd);
    // Engine: Đen = 1 = bé đi trước, Trắng = 2 = máy; tắt VCT (bản này tính VCT sai - nhật ký TC_02C)
    const b = new GE.Board();
    nuocDi.forEach((o, i) => b.play(CR.hang(o), CR.cot(o), i % 2 === 0 ? GE.BLACK : GE.WHITE));
    const thu = CR.nuocPhaChuoiBon(b, GE, c.giay);
    const kq = GE.chooseMove(b, GE.WHITE, c.giay, { vct: false });
    let o = kq && kq.move ? kq.move[0] * N + kq.move[1] : -1;
    // máy tự thắng / tự ép thắng bằng chuỗi 4 thì đi luôn, khỏi thủ
    const chac = kq && kq.info && ["five", "block-five", "vcf"].indexOf(kq.info.kill) !== -1;
    if (!chac && thu && thu.length && thu.indexOf(o) === -1) o = thu[0];
    return CR.hopLe(ban, o) ? o : CR.mayDi(ban, "kho", rnd);
  };

  /* TC_02C: engine chỉ dò chuỗi ép thắng bằng 4 quân liên tiếp (VCF) cho CHÍNH NÓ, không dò cho bé
     -> thua kiểu bé dựng sẵn chuỗi 4 mà máy đi chỗ khác (đo khi tự đấu). Trước khi engine nghĩ:
     bé có VCF thì trả về các ô của máy phá được chuỗi đó (theo thứ tự nước tốt của engine);
     null = bé không có VCF (hoặc máy tự thắng / phải chặn 5 ngay - engine tự lo). */
  CR.nuocPhaChuoiBon = function (b, GE, giay) {
    const W = GE.WHITE, B = GE.BLACK;
    const ungVien = b.candidates();
    for (const mv of ungVien) if (GE.makesFive(b, mv[0], mv[1], W) || GE.makesFive(b, mv[0], mv[1], B)) return null;
    const han = Date.now() + Math.max(40, Math.min(400, giay * 300));
    const chuoi = GE.vcf(b, B, 12, new Map(), han);
    if (!chuoi || !chuoi.length) return null;
    const thu = [];
    const daXet = new Set();
    const xet = GE.legalMoves(b, W, 40).concat(chuoi);
    for (const mv of xet) {
      const o = mv[0] * N + mv[1];
      if (daXet.has(o) || b.b[mv[0]][mv[1]] !== GE.EMPTY) continue;
      daXet.add(o);
      if (Date.now() > han + 400) break;
      b.play(mv[0], mv[1], W);
      const conChuoi = GE.vcf(b, B, 12, new Map(), Date.now() + 60);
      b.undo();
      if (!conChuoi) thu.push(o);
    }
    return thu;
  };

  /* ---------------- VÁN CỜ ---------------- */
  /* Một ván: giữ bàn + danh sách nước đi (bé đi các nước chẵn 0, 2, 4...).
     muc: 'c1'..'c20' (TC_02C) hoặc mức cũ 'de' | 'vua' | 'kho'. */
  class VanCaro {
    constructor(muc) {
      this.muc = CR.mucHopLe(muc) ? muc : "vua";
      this.ban = CR.taoBan();
      this.nuocDi = [];
      this.ketQua = "";        // "" đang chơi | "thang" (bé) | "thua" | "hoa"
      this.dayThang = null;
    }
    get luot() { return this.nuocDi.length % 2 === 0 ? CR.BE : CR.MAY; }
    get daXong() { return this.ketQua !== ""; }
    /* Đặt quân của người đang tới lượt. Trả về true nếu hợp lệ. */
    di(o) {
      if (this.daXong || !CR.hopLe(this.ban, o)) return false;
      const nguoi = this.luot;
      this.ban[o] = nguoi;
      this.nuocDi.push(o);
      const day = CR.dayThang(this.ban, o);
      if (day) { this.dayThang = day; this.ketQua = nguoi === CR.BE ? "thang" : "thua"; }
      else if (CR.hetCho(this.ban)) this.ketQua = "hoa";
      return true;
    }
    beDi(o) { return this.luot === CR.BE && this.di(o); }
    /* Máy đi một nước; trả về ô đã đi hoặc -1. Cấp 6-20 dùng GomokuEngine nếu đã nạp
       (Node / Worker); trang game gọi Worker thay vì hàm này cho cấp cao. */
    mayDi(ngauNhien) {
      if (this.daXong || this.luot !== CR.MAY) return -1;
      const cap = CR.capCuaMuc(this.muc);
      const o = cap ? CR.mayDiCap(this.nuocDi, cap, ngauNhien, goc.GomokuEngine)
                    : CR.mayDi(this.ban, this.muc, ngauNhien);
      return this.di(o) ? o : -1;
    }
  }
  CR.VanCaro = VanCaro;
})(typeof window !== "undefined" ? window : globalThis);
// 21/10/2026 23:22 - BƯỚC: TC_02C (20 cấp máy) | 21/10/2026 17:20 - BƯỚC: TC_02A
