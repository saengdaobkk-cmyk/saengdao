import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { DEFAULT_NAV } from "../lib/navDefaults.js";

const router = Router();

// GET /api/nav — เมนูที่เปิดใช้งาน (เรียงตาม order)
router.get("/", async (req, res, next) => {
  try {
    const items = await prisma.navItem.findMany({
      where: { active: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
    // ถ้ายังไม่เคยตั้งค่า → ใช้เมนูเริ่มต้น
    if (items.length === 0) {
      return res.json(DEFAULT_NAV.map((n) => ({ id: n.url, ...n })));
    }
    res.json(items);
  } catch (e) {
    next(e);
  }
});

export default router;
