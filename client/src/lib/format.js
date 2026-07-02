// แปลงราคา (Prisma Decimal มาเป็น string) → "฿295"
export function formatPrice(value) {
  const n = Number(value);
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
  }).format(n);
}
