import { Router } from "express";
import { computeCartRuleDiscount } from "../lib/discountRules.js";

const router = Router();

// POST /api/discounts/preview — ส่วนลดอัตโนมัติจากรายการสินค้า (แสดงตอน checkout)
// body: { items: [{ bookId, price, quantity }] }
router.post("/preview", async (req, res, next) => {
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    res.json(await computeCartRuleDiscount(items));
  } catch (err) {
    next(err);
  }
});

export default router;
