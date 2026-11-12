// ================================================================
// FILE: dt/3d/dt3d_luu_san.js  (ES module) - LƯU SẴN FILE NẶNG TRONG TRÌNH DUYỆT
// CHỨC NĂNG: (KC_06B2, người dùng 12/11/2026: "cảnh chiến đấu luôn xảy ra => tải ngay khi mở game, lưu sẵn trong trình duyệt;
//            vào trận chỉ cần ping xem có bản mới không, mới thì tải lại, cũ thì dùng bản lưu => tiết kiệm dữ liệu, tải nhanh")
//            - File mô hình (.glb) lưu ở Cache Storage của trình duyệt (bền, không bị xoá sau 10 phút như bộ nhớ đệm thường).
//            - Lần đầu dùng một file trong mỗi lần mở trang: hỏi máy chủ BẰNG HEAD (vài trăm byte, "ping") xem ETag /
//              Last-Modified / độ dài còn như bản lưu không: giống -> dùng bản lưu; khác -> tải lại và lưu đè.
//              Người dùng 12/11/2026: "mở game thì ping luôn, khi bắt đầu trận đấu ping thêm" -> mỗi trang (bản đồ, mỗi
//              trận mở trong khung) ping riêng một lần cho mỗi file nó dùng; trong cùng trang thì nhớ kết quả.
//            - Mất mạng / ping lỗi mà có bản lưu: dùng bản lưu. Trình duyệt không có Cache Storage: tải thường.
//            - taiTruoc(ds): tải sẵn ở luồng nền (Web Worker), lần lượt từng file (bản đồ tải xong rồi mới tải cảnh trận).
// HÀM KHAI RA:
//   layTep(url, baoTai(đã, tổng)?) -> Promise<ArrayBuffer>
//   taiTruoc(ds url) -> Promise (không bao giờ lỗi)
// BƯỚC: KC_06B2 - NGÀY: 12/11/2026
// ================================================================
const TEN_KHO = "kc-dt-luu-san-v1";
const coKho = typeof caches !== "undefined" && typeof window !== "undefined" && window.isSecureContext !== false;
const dangLay = new Map(); // url tuyệt đối -> Promise<ArrayBuffer> (trong trang này)

const tuyetDoi = url => new URL(url, location.href).href;
const dauVet = r => [r.headers.get("etag") || "", r.headers.get("last-modified") || "", r.headers.get("content-length") || ""].join("|");

// tải cả file, báo tiến độ (thanh tải bản đồ)
async function taiVe(url, baoTai) {
  const r = await fetch(url, { cache: "no-cache" });
  if (!r.ok) throw new Error("Không tải được " + url + " (" + r.status + ")");
  const tong = Number(r.headers.get("content-length")) || 0;
  let buf;
  if (baoTai && r.body && r.body.getReader) {
    const doc = r.body.getReader(), manh = []; let da = 0;
    for (;;) { const { done, value } = await doc.read(); if (done) break; manh.push(value); da += value.length; baoTai(da, tong || da); }
    const u = new Uint8Array(da); let i = 0; manh.forEach(m => { u.set(m, i); i += m.length; }); buf = u.buffer;
  } else buf = await r.arrayBuffer();
  return { buf, vet: dauVet(r), loai: r.headers.get("content-type") || "application/octet-stream" };
}

async function layTuKho(url, baoTai) {
  const kho = await caches.open(TEN_KHO);
  const cu = await kho.match(url);
  if (cu) {
    let giong;
    try {
      const h = await fetch(url, { method: "HEAD", cache: "no-store" }); // ping: chỉ hỏi dấu vết file, không tải
      giong = h.ok ? dauVet(h) === (cu.headers.get("x-kc-vet") || "") : h.status >= 500; // máy chủ trục trặc: tạm dùng bản lưu
    } catch (e) { giong = true; } // mất mạng: dùng bản lưu
    if (giong) { const buf = await cu.arrayBuffer(); if (baoTai) baoTai(buf.byteLength, buf.byteLength); return buf; }
  }
  const t = await taiVe(url, baoTai);
  try {
    await kho.put(url, new Response(t.buf.slice(0), { headers: { "content-type": t.loai, "x-kc-vet": t.vet } }));
  } catch (e) { /* hết chỗ lưu: vẫn chơi được, lần sau tải lại */ }
  return t.buf;
}

export function layTep(url, baoTai) {
  const u = tuyetDoi(url);
  if (!coKho) return taiVe(u, baoTai).then(t => t.buf);
  if (!dangLay.has(u)) {
    const p = layTuKho(u, baoTai).catch(() => taiVe(u, baoTai).then(t => t.buf));
    dangLay.set(u, p);
    p.catch(() => dangLay.delete(u));
  } else if (baoTai) dangLay.get(u).then(b => baoTai(b.byteLength, b.byteLength), () => null);
  return dangLay.get(u);
}

// Tải sẵn ở LUỒNG NỀN (Web Worker dt3d_luu_san_nen.js), từng file một: luồng vẽ bản đồ không phải làm gì, không giật.
// .glb vào kho bền (Cache Storage); file mã / dữ liệu vào bộ nhớ đệm thường (trình duyệt tự hỏi bản mới khi dùng).
// File đã lưu thì chỉ ping. Trình duyệt không có Worker / Cache Storage: bỏ qua (vào trận sẽ tải như thường).
export function taiTruoc(ds) {
  const ds2 = (ds || []).map(tuyetDoi).filter(u => !dangLay.has(u)); // trang đang / đã dùng file này
  if (!coKho || typeof Worker === "undefined" || !ds2.length) return Promise.resolve();
  return new Promise(xong => {
    let w;
    try { w = new Worker(new URL("./dt3d_luu_san_nen.js", import.meta.url)); } catch (e) { return xong(); }
    const het = () => { try { w.terminate(); } catch (e) { /* đã tắt */ } xong(); };
    w.onmessage = het; w.onerror = het;
    w.postMessage({ ds: ds2 });
  });
}
// 12/11/2026 - BƯỚC: KC_06B2 (lưu sẵn file mô hình trong trình duyệt, ping bản mới)
