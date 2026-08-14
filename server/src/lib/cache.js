// cache ในหน่วยความจำอย่างง่าย (TTL) — เหมาะกับ backend instance เดียว (Hostinger)
// ใช้ลดภาระ DB สำหรับ query ที่อ่านซ้ำบ่อย เช่น รายการหนังสือต่อหมวด
const store = new Map(); // key -> { exp, val }

export function cacheGet(key) {
  const e = store.get(key);
  if (!e) return null;
  if (Date.now() > e.exp) { store.delete(key); return null; }
  return e.val;
}

export function cacheSet(key, val, ttlMs) {
  store.set(key, { exp: Date.now() + ttlMs, val });
}

// ล้างทุกคีย์ที่ขึ้นต้นด้วย prefix (เช่น "books:") — เรียกตอนข้อมูลเปลี่ยน
export function cacheClearPrefix(prefix) {
  for (const k of store.keys()) if (k.startsWith(prefix)) store.delete(k);
}

// เก็บกวาดคีย์หมดอายุเป็นระยะ กันหน่วยความจำบวม
const sweep = setInterval(() => {
  const now = Date.now();
  for (const [k, e] of store) if (now > e.exp) store.delete(k);
}, 60_000);
sweep.unref?.();
