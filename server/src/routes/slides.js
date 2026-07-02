import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

// GET /api/slides — สไลด์ที่เปิดใช้งาน เรียงตาม order (ลูกค้าเห็น)
router.get("/", async (req, res, next) => {
  try {
    const slides = await prisma.slide.findMany({
      where: { active: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
    res.json(slides);
  } catch (err) {
    next(err);
  }
});

export default router;
