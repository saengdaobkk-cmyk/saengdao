import { prisma } from "./prisma.js";

function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

// ตรวจโค้ด + คำนวณส่วนลดจาก subtotal — คืน { coupon, discount }
// โยน error ถ้าโค้ดใช้ไม่ได้ (ข้อความภาษาไทย)
export async function computeDiscount(code, subtotal) {
  if (!code || !code.trim()) return { coupon: null, discount: 0 };

  const coupon = await prisma.coupon.findUnique({
    where: { code: code.trim().toUpperCase() },
  });

  if (!coupon || !coupon.active) throw httpError(404, "ไม่พบโค้ดส่วนลดนี้");
  if (coupon.expiresAt && coupon.expiresAt < new Date())
    throw httpError(400, "โค้ดส่วนลดหมดอายุแล้ว");
  if (coupon.minSubtotal && subtotal < Number(coupon.minSubtotal))
    throw httpError(400, `ต้องซื้อขั้นต่ำ ${Number(coupon.minSubtotal).toLocaleString()} บาท`);

  let discount =
    coupon.type === "PERCENT"
      ? Math.round(((subtotal * Number(coupon.value)) / 100) * 100) / 100
      : Number(coupon.value);

  discount = Math.min(discount, subtotal); // ส่วนลดไม่เกินยอดรวม

  return { coupon, discount };
}
