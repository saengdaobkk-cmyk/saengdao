// ปัดราคาขึ้นเป็นจำนวนเต็มบาทเสมอ (ไม่เอาทศนิยม) เช่น 195.5 → 196
export function ceilPrice(value) {
  return Math.ceil(Number(value) || 0);
}

// แปลงราคา (Prisma Decimal มาเป็น string) → "฿296" (ปัดขึ้น ไม่มีทศนิยม)
export function formatPrice(value) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(ceilPrice(value));
}

// จำนวนเต็ม + คอมม่าหลักพัน เช่น 1168 → "1,168"
export function formatCount(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString("en-US") : value;
}

// แปลงค่าสเปกที่ผู้ดูแลพิมพ์อิสระ (เช่น "1300 g", "14.5 x 21 cm")
//  - ใส่คอมม่าให้เลขจำนวนเต็มตั้งแต่ 4 หลักขึ้นไป (ไม่ยุ่งกับทศนิยมสั้นๆ เช่น 14.5)
//  - แปลงหน่วยอังกฤษเป็นไทย: kg→กก., g→กรัม, cm→ซม., mm→มม.
export function localizeSpec(value) {
  if (value == null) return value;
  return String(value)
    .replace(/\d{4,}/g, (m) => Number(m).toLocaleString("en-US"))
    .replace(/\bkg\b\.?/gi, "กก.")
    .replace(/\bg\b\.?/gi, "กรัม")
    .replace(/\bcm\b\.?/gi, "ซม.")
    .replace(/\bmm\b\.?/gi, "มม.");
}
