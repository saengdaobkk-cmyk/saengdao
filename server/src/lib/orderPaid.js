// มาร์คออเดอร์เป็น "ชำระเงินแล้ว" + ผลข้างเคียง (สะสมแต้ม/อีเมล/ZORT) — ใช้ร่วมกันทั้ง Omise webhook และช่องทางอื่น
// idempotent: ถ้าจ่ายแล้วหรือยกเลิกแล้ว จะไม่ทำซ้ำ
import { prisma } from "./prisma.js";
import { pushOrderToZort } from "./zort.js";
import { sendPaymentReceived } from "./email.js";

async function awardLoyaltyPoints(order) {
  if (!order.userId) return;
  const rows = await prisma.setting.findMany({ where: { key: { in: ["loyaltyEnabled", "loyaltyBahtPerPoint"] } } });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  if (map.loyaltyEnabled !== "true") return;
  const per = Number(map.loyaltyBahtPerPoint) || 0;
  if (per <= 0) return;
  const pts = Math.floor(Number(order.total) / per);
  if (pts <= 0) return;
  const existing = await prisma.pointEntry.findFirst({ where: { orderId: order.id, delta: { gt: 0 } } });
  if (existing) return;
  await prisma.$transaction([
    prisma.user.update({ where: { id: order.userId }, data: { points: { increment: pts } } }),
    prisma.pointEntry.create({ data: { userId: order.userId, delta: pts, reason: "สะสมจากการซื้อ", orderId: order.id } }),
  ]);
}

export async function markOrderPaid(orderId, { chargeId } = {}) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, reason: "not_found" };
  if (order.paymentStatus === "PAID") return { ok: true, already: true };
  if (order.status === "CANCELLED") return { ok: false, reason: "cancelled" };

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: "PAID",
      paidAt: new Date(),
      status: order.status === "PENDING" ? "PAID" : order.status,
      ...(chargeId ? { omiseChargeId: chargeId } : {}),
    },
  });

  // ผลข้างเคียง (best-effort — ไม่ให้ล้มกระทบการมาร์คจ่าย)
  await awardLoyaltyPoints(updated).catch((e) => console.error("loyalty:", e.message));
  sendPaymentReceived(updated.id).catch(() => {});
  if (!updated.zortOrderId) pushOrderToZort(updated.id).catch((e) => console.error("zort:", e.message));

  return { ok: true, order: updated };
}
