// จำกัดจำนวนคำขอต่อ key (ค่าเริ่มต้น = IP) แบบเก็บในหน่วยความจำ
// เหมาะกับ backend instance เดียว (Hostinger) — ไม่ต้องพึ่ง dependency ภายนอก
const buckets = new Map(); // key -> number[] (timestamps)

export function rateLimit({ windowMs, max, message = "คำขอถี่เกินไป กรุณาลองใหม่ในภายหลัง", keyFn } = {}) {
  return (req, res, next) => {
    const id = String((keyFn ? keyFn(req) : req.ip) || "unknown");
    const now = Date.now();
    const hits = (buckets.get(id) || []).filter((t) => now - t < windowMs);
    if (hits.length >= max) {
      const retryMs = windowMs - (now - hits[0]);
      res.set("Retry-After", String(Math.max(1, Math.ceil(retryMs / 1000))));
      return res.status(429).json({ error: message });
    }
    hits.push(now);
    buckets.set(id, hits);
    next();
  };
}

// เก็บกวาด bucket ที่หมดอายุเป็นระยะ กันหน่วยความจำบวม
const sweep = setInterval(() => {
  const now = Date.now();
  for (const [id, arr] of buckets) {
    const live = arr.filter((t) => now - t < 3_600_000); // เก็บย้อนหลังสูงสุด 1 ชม.
    if (live.length) buckets.set(id, live);
    else buckets.delete(id);
  }
}, 600_000);
sweep.unref?.();
