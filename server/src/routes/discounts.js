import { Router } from "express";
import { computeCartRuleDiscount } from "../lib/discountRules.js";

const router = Router();

// POST /api/discounts/preview — ส่วนลดอัตโนมัติจากยอด/จำนวนชิ้น (แสดงตอน checkout)
router.post("/preview", async (req, res, next) => {
  try {
    const { subtotal, qty } = req.body || {};
    res.json(await computeCartRuleDiscount(subtotal, qty));
  } catch (err) {
    next(err);
  }
});

export default router;
