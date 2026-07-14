import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

// GET /api/shipping — ช่องทางจัดส่งที่เปิดใช้งาน (สำหรับ checkout)
router.get("/", async (req, res, next) => {
  try {
    const methods = await prisma.shippingMethod.findMany({
      where: { active: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
    res.json(methods);
  } catch (e) {
    next(e);
  }
});

export default router;
