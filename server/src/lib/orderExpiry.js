import { prisma } from "./prisma.js";

// คืนแต้มที่ลูกค้าใช้แลกส่วนลด เมื่อออเดอร์ถูกยกเลิก (idempotent)
export async function refundUsedPoints(order) {
  if (!order.pointsUsed || order.pointsUsed <= 0) return;
  const already = await prisma.pointEntry.findFirst({ where: { orderId: order.id, reason: "คืนแต้ม (ยกเลิกออเดอร์)" } });
  if (already) return;
  await prisma.$transaction([
    prisma.user.update({ where: { id: order.userId }, data: { points: { increment: order.pointsUsed } } }),
    prisma.pointEntry.create({ data: { userId: order.userId, delta: order.pointsUsed, reason: "คืนแต้ม (ยกเลิกออเดอร์)", orderId: order.id } }),
  ]);
}

let lastRun = 0;

// ยกเลิกออเดอร์ที่ยังไม่ชำระเงินเกินกำหนดโดยอัตโนมัติ (cancelledBy = SYSTEM)
// เรียกแบบ throttled จาก endpoint ที่มีคนเข้าบ่อย — ไม่ต้องมี cron แยก
export async function expireStaleOrders({ throttleMs = 5 * 60 * 1000, force = false } = {}) {
  const now = Date.now();
  if (!force && now - lastRun < throttleMs) return { skipped: true };
  lastRun = now;

  const row = await prisma.setting.findUnique({ where: { key: "orderExpiryDays" } });
  const raw = row?.value;
  const days = raw == null || raw === "" ? 7 : Number(raw); // ไม่ได้ตั้ง = ค่าเริ่มต้น 7 วัน
  if (!Number.isFinite(days) || days <= 0) return { expired: 0 }; // ตั้ง 0 = ปิดระบบ

  const cutoff = new Date(now - days * 24 * 60 * 60 * 1000);
  const stale = await prisma.order.findMany({
    where: { status: "PENDING", paymentStatus: "UNPAID", createdAt: { lt: cutoff } },
    select: { id: true, userId: true, pointsUsed: true },
  });

  for (const o of stale) {
    await prisma.order.update({
      where: { id: o.id },
      data: { status: "CANCELLED", cancelledBy: "SYSTEM", cancelledAt: new Date() },
    });
    await refundUsedPoints(o).catch(() => {});
  }
  return { expired: stale.length };
}
