import { Router } from "express";
import { getOmiseConfig, fetchCharge, chargePaid } from "../lib/omise.js";
import { markOrderPaid } from "../lib/orderPaid.js";

const router = Router();

// POST /api/webhooks/omise — Omise ยิงมาเมื่อสถานะ charge เปลี่ยน
// กันปลอม: ไม่เชื่อ payload ตรงๆ → ดึง charge จริงจาก Omise มายืนยันสถานะอีกที
router.post("/omise", async (req, res) => {
  // ตอบ 200 เสมอ (กัน Omise retry รัว) แล้วค่อยประมวลผล
  res.json({ ok: true });
  try {
    const event = req.body || {};
    const data = event.data || {};
    if (!String(event.key || "").startsWith("charge.")) return;
    const chargeId = data.id;
    if (!chargeId) return;

    const cfg = await getOmiseConfig();
    if (!cfg.secretKey) return;

    const charge = await fetchCharge({ secretKey: cfg.secretKey, chargeId });
    if (!chargePaid(charge)) return;

    const orderId = charge.metadata?.order_id;
    if (!orderId) return;
    await markOrderPaid(orderId, { chargeId });
  } catch (err) {
    console.error("omise webhook:", err.message);
  }
});

export default router;
