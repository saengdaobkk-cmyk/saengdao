import { Router } from "express";
import { computeDiscount } from "../lib/coupon.js";

const router = Router();

// POST /api/coupons/apply { code, subtotal } — ตรวจโค้ดและคำนวณส่วนลด
router.post("/apply", async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;
    const sub = Number(subtotal);
    if (!sub || sub <= 0) return res.status(400).json({ error: "ยอดสั่งซื้อไม่ถูกต้อง" });

    const { coupon, discount } = await computeDiscount(code, sub);
    if (!coupon) return res.status(400).json({ error: "กรุณากรอกโค้ดส่วนลด" });

    res.json({
      code: coupon.code,
      type: coupon.type,
      value: Number(coupon.value),
      discount,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
