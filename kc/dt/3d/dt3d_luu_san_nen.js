// ================================================================
// FILE: dt/3d/dt3d_luu_san_nen.js  (Web Worker, script thường) - TẢI SẴN Ở LUỒNG NỀN
// CHỨC NĂNG: (KC_06B2, 12/11/2026) nhận danh sách địa chỉ file từ dt3d_luu_san.js taiTruoc, tải từng file vào kho
//            "kc-dt-luu-san-v1" (Cache Storage) NGOÀI luồng vẽ của trang -> bản đồ không giật lúc tải sẵn cảnh trận.
//            File đã lưu: chỉ ping (HEAD) xem có bản mới. Cách ghi dấu vết (x-kc-vet) GIỐNG HỆT dt3d_luu_san.js.
// NHẬN: { ds: [url tuyệt đối] }   GỬI LẠI: { xong: true }
// BƯỚC: KC_06B2 - NGÀY: 12/11/2026
// ================================================================
"use strict";
const TEN_KHO = "kc-dt-luu-san-v1";
const dauVet = r => [r.headers.get("etag") || "", r.headers.get("last-modified") || "", r.headers.get("content-length") || ""].join("|");
async function luuSan(url) {
  const kho = await caches.open(TEN_KHO), cu = await kho.match(url);
  if (cu) {
    const h = await fetch(url, { method: "HEAD", cache: "no-store" }).catch(() => null);
    if (!h || !h.ok || dauVet(h) === (cu.headers.get("x-kc-vet") || "")) return;
  }
  const r = await fetch(url, { cache: "no-cache" });
  if (!r.ok) return;
  if (/\.glb(\?|$)/i.test(url)) {
    await kho.put(url, new Response(r.body, { headers: { "content-type": r.headers.get("content-type") || "application/octet-stream", "x-kc-vet": dauVet(r) } }));
  } else await r.arrayBuffer(); // file mã / âm thanh: chỉ cần nằm trong bộ nhớ đệm thường của trình duyệt (tự hỏi bản mới)
}
self.onmessage = async e => {
  for (const url of (e.data && e.data.ds) || []) { try { await luuSan(url); } catch (er) { /* hỏng: lúc cần trang tự tải */ } }
  self.postMessage({ xong: true });
};
// 12/11/2026 - BƯỚC: KC_06B2
