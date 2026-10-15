/* ================================================================
   FILE: san_tu/st_tu_vung.js
   CHỨC NĂNG: KHO TỪ VỰNG (VocabularyManager) của game Săn Từ: từ chia theo cấp,
              chọn từ cho từng chướng ngại vật (không lặp trong một lượt) và tạo
              các phương án nhiễu theo độ khó (dễ: ngẫu nhiên; khó: gần giống chữ).
   BƯỚC: TC_00B
   NGÀY: 15/10/2026
   THÊM TỪ: thêm một dòng { en, e (hình emoji), vi } vào đúng cấp. Chỉ dùng TỪ
            HOÀN CHỈNH, viết thường, không dấu cách.
   ================================================================ */
(function (goc) {
  "use strict";
  const ST = goc.ST = goc.ST || {};

  // Cấp 1: từ ngắn, quen thuộc (Dễ) - cấp 2: từ thông dụng (Trung bình)
  // Cấp 3: từ dài hơn (Khó) - cấp 4: từ ít quen hơn, dễ nhầm (Thử thách)
  const KHO = {
    1: [
      ["cat", "🐱", "con mèo"], ["dog", "🐶", "con chó"], ["sun", "☀️", "mặt trời"], ["hat", "👒", "cái mũ"],
      ["cup", "☕", "cái cốc"], ["bus", "🚌", "xe buýt"], ["egg", "🥚", "quả trứng"], ["pig", "🐷", "con heo"],
      ["cow", "🐮", "con bò"], ["fox", "🦊", "con cáo"], ["bee", "🐝", "con ong"], ["car", "🚗", "xe hơi"],
      ["bed", "🛏️", "cái giường"], ["box", "📦", "cái hộp"], ["pen", "🖊️", "cây bút"], ["ant", "🐜", "con kiến"],
      ["owl", "🦉", "con cú"], ["key", "🔑", "chìa khóa"], ["fish", "🐟", "con cá"], ["duck", "🦆", "con vịt"],
      ["frog", "🐸", "con ếch"], ["ball", "⚽", "quả bóng"], ["book", "📕", "quyển sách"], ["cake", "🍰", "bánh ngọt"],
      ["moon", "🌙", "mặt trăng"], ["star", "⭐", "ngôi sao"], ["tree", "🌳", "cái cây"], ["milk", "🥛", "sữa"],
      ["bird", "🐦", "con chim"], ["door", "🚪", "cửa ra vào"], ["bear", "🐻", "con gấu"], ["lion", "🦁", "sư tử"]
    ],
    2: [
      ["apple", "🍎", "quả táo"], ["happy", "😊", "vui vẻ"], ["water", "💧", "nước"], ["house", "🏠", "ngôi nhà"],
      ["horse", "🐴", "con ngựa"], ["train", "🚆", "tàu hỏa"], ["chair", "🪑", "cái ghế"], ["bread", "🍞", "bánh mì"],
      ["green", "🟢", "màu xanh lá"], ["smile", "😄", "nụ cười"], ["cloud", "☁️", "đám mây"], ["grape", "🍇", "quả nho"],
      ["tiger", "🐯", "con hổ"], ["mouse", "🐭", "con chuột"], ["sheep", "🐑", "con cừu"], ["snake", "🐍", "con rắn"],
      ["juice", "🧃", "nước ép"], ["lemon", "🍋", "quả chanh"], ["piano", "🎹", "đàn piano"], ["clock", "⏰", "đồng hồ"],
      ["shoes", "👟", "đôi giày"], ["plant", "🪴", "cây trồng"], ["beach", "🏖️", "bãi biển"], ["robot", "🤖", "người máy"],
      ["pizza", "🍕", "bánh pizza"], ["queen", "👸", "nữ hoàng"], ["river", "🏞️", "dòng sông"], ["light", "💡", "ánh sáng"],
      ["sweet", "🍬", "ngọt"], ["truck", "🚚", "xe tải"]
    ],
    3: [
      ["rabbit", "🐰", "con thỏ"], ["garden", "🌷", "khu vườn"], ["morning", "🌅", "buổi sáng"], ["monkey", "🐒", "con khỉ"],
      ["flower", "🌸", "bông hoa"], ["school", "🏫", "trường học"], ["pencil", "✏️", "bút chì"], ["window", "🪟", "cửa sổ"],
      ["orange", "🍊", "quả cam"], ["banana", "🍌", "quả chuối"], ["turtle", "🐢", "con rùa"], ["rocket", "🚀", "tên lửa"],
      ["castle", "🏰", "lâu đài"], ["dragon", "🐉", "con rồng"], ["bridge", "🌉", "cây cầu"], ["planet", "🪐", "hành tinh"],
      ["kitchen", "🍳", "nhà bếp"], ["chicken", "🐔", "con gà"], ["rainbow", "🌈", "cầu vồng"], ["teacher", "🧑‍🏫", "giáo viên"],
      ["doctor", "🩺", "bác sĩ"], ["guitar", "🎸", "đàn ghi-ta"], ["jacket", "🧥", "áo khoác"], ["button", "🔘", "cái nút"],
      ["carrot", "🥕", "củ cà rốt"], ["butter", "🧈", "bơ"], ["bottle", "🍼", "cái chai"], ["island", "🏝️", "hòn đảo"],
      ["winter", "⛄", "mùa đông"], ["summer", "🏖️", "mùa hè"], ["mitten", "🧤", "găng tay"], ["kitten", "🐈", "mèo con"]
    ],
    4: [
      ["elephant", "🐘", "con voi"], ["butterfly", "🦋", "con bướm"], ["umbrella", "☂️", "cái ô"], ["dinosaur", "🦕", "khủng long"],
      ["strawberry", "🍓", "dâu tây"], ["helicopter", "🚁", "trực thăng"], ["telescope", "🔭", "kính thiên văn"], ["penguin", "🐧", "chim cánh cụt"],
      ["giraffe", "🦒", "hươu cao cổ"], ["octopus", "🐙", "bạch tuộc"], ["vegetable", "🥦", "rau củ"], ["mountain", "⛰️", "ngọn núi"],
      ["library", "📚", "thư viện"], ["birthday", "🎂", "sinh nhật"], ["pumpkin", "🎃", "quả bí ngô"], ["kangaroo", "🦘", "chuột túi"],
      ["airplane", "✈️", "máy bay"], ["scissors", "✂️", "cái kéo"], ["treasure", "💰", "kho báu"], ["thunder", "⛈️", "sấm sét"],
      ["compass", "🧭", "la bàn"], ["squirrel", "🐿️", "con sóc"], ["dolphin", "🐬", "cá heo"], ["sandwich", "🥪", "bánh mì kẹp"],
      ["backpack", "🎒", "ba lô"], ["princess", "👸", "công chúa"], ["volcano", "🌋", "núi lửa"], ["astronaut", "🧑‍🚀", "phi hành gia"],
      ["crocodile", "🐊", "cá sấu"], ["chocolate", "🍫", "sô-cô-la"], ["notebook", "📓", "quyển vở"], ["firework", "🎆", "pháo hoa"],
      ["fountain", "⛲", "đài phun nước"], ["captain", "🧑‍✈️", "thuyền trưởng"], ["blanket", "🛌", "cái chăn"], ["pancake", "🥞", "bánh kếp"]
    ]
  };

  // Khoảng cách chỉnh sửa (Levenshtein): số chữ phải sửa để biến từ này thành từ kia
  function khoangCachChu(a, b) {
    const d = [];
    for (let i = 0; i <= a.length; i++) d[i] = [i];
    for (let j = 0; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++)
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  // Điểm "dễ nhầm": càng nhỏ càng giống (giống chữ đầu, chữ cuối, độ dài gần nhau)
  function diemGiong(a, b) {
    return khoangCachChu(a, b) / Math.max(a.length, b.length)
      - (a[0] === b[0] ? 0.25 : 0) - (a.slice(-2) === b.slice(-2) ? 0.15 : 0)
      + Math.abs(a.length - b.length) * 0.05;
  }

  class KhoTuVung {
    constructor(doKho, ngauNhien) {
      this.dk = doKho;
      this.rng = ngauNhien || Math.random;
      this.daDung = new Set();
    }
    static tatCa(cap) { return KHO[cap].map(([en, e, vi]) => ({ en, e, vi, cap })); }
    tron(mang) {
      const a = mang.slice();
      for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(this.rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
      return a;
    }
    // Chọn một từ cho chướng ngại vật mới; hết từ chưa dùng thì cho dùng lại
    layTu() {
      const cap = this.dk.capTu[Math.floor(this.rng() * this.dk.capTu.length)];
      let ds = KhoTuVung.tatCa(cap).filter(t => !this.daDung.has(t.en));
      if (!ds.length) {
        KhoTuVung.tatCa(cap).forEach(t => this.daDung.delete(t.en));
        ds = KhoTuVung.tatCa(cap);
      }
      const tu = ds[Math.floor(this.rng() * ds.length)];
      this.daDung.add(tu.en);
      return tu;
    }
    // Tạo danh sách phương án (đã xáo trộn vị trí) gồm từ đúng + các từ nhiễu
    taoPhuongAn(tuDung) {
      const n = this.dk.soPhuongAn;
      let nguon = [];
      this.dk.capNhieu.forEach(c => { nguon = nguon.concat(KhoTuVung.tatCa(c)); });
      nguon = nguon.filter(t => t.en !== tuDung.en);
      let nhieu;
      if (this.rng() < this.dk.doGiong) {
        // Lấy trong nhóm từ gần giống nhất, rồi bốc ngẫu nhiên để không lặp mãi một bộ
        const sx = nguon.map(t => ({ t, d: diemGiong(tuDung.en, t.en) + this.rng() * 0.1 })).sort((a, b) => a.d - b.d);
        nhieu = this.tron(sx.slice(0, Math.max(n + 2, 5)).map(x => x.t)).slice(0, n - 1);
      } else {
        nhieu = this.tron(nguon).slice(0, n - 1);
      }
      return this.tron([tuDung].concat(nhieu)).map(t => t.en);
    }
  }

  ST.KHO_TU = KHO;
  ST.KhoTuVung = KhoTuVung;
  ST.khoangCachChu = khoangCachChu;
})(typeof window !== "undefined" ? window : globalThis);
