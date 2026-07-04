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
