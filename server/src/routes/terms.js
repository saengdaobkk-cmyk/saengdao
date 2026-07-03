import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { TERM_TYPES } from "../lib/terms.js";

const router = Router();

// GET /api/terms?type=PUBLISHER|AUTHOR|TRANSLATOR → รายชื่อ (สำหรับ dropdown/datalist)
router.get("/", async (req, res, next) => {
  try {
    const type = String(req.query.type || "").toUpperCase();
    if (!TERM_TYPES.includes(type)) return res.json([]);
    const terms = await prisma.term.findMany({
      where: { type },
      orderBy: { name: "asc" },
      select: { name: true },
    });
    res.json(terms.map((t) => t.name));
  } catch (err) {
    next(err);
  }
});

export default router;
