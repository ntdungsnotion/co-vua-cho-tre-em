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
              - Máy đánh 3 mức (de / vua / kho), cách tính "cửa sổ 5 ô": mỗi ô trống
                được cộng điểm theo mọi đoạn 5 ô đi qua nó mà chưa có quân đối phương
                (đoạn càng nhiều quân mình càng giá trị) - bắt được cả thế cờ có lỗ
                (❌❌_❌❌). Điểm = tấn công + hệ số x phòng thủ.
                Thứ tự cứng trước khi tính điểm: thắng được thì thắng; bé sắp thắng
                thì chặn (Dễ có lúc quên chặn - để bé thắng được).
   BƯỚC: TC_02A
   NGÀY: 21/10/2026 17:20
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
    kho: { heSoThu: 1.15, quenChan: 0,    ngauNhien: 0,    chonTrong: 1, nguong: 1 }
  };

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

  /* ---------------- VÁN CỜ ---------------- */
  /* Một ván: giữ bàn + danh sách nước đi (bé đi các nước chẵn 0, 2, 4...). */
  class VanCaro {
    constructor(muc) {
      this.muc = CR.MUC[muc] ? muc : "vua";
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
    /* Máy đi một nước; trả về ô đã đi hoặc -1. */
    mayDi(ngauNhien) {
      if (this.daXong || this.luot !== CR.MAY) return -1;
      const o = CR.mayDi(this.ban, this.muc, ngauNhien);
      return this.di(o) ? o : -1;
    }
  }
  CR.VanCaro = VanCaro;
})(typeof window !== "undefined" ? window : globalThis);
// 21/10/2026 17:20 - BƯỚC: TC_02A
