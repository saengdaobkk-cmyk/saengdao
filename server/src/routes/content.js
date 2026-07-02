import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { CONTENT_DEFAULTS } from "../lib/contentDefaults.js";

const router = Router();

// GET /api/content — คืน map { key: value } (ค่าใน DB ทับ default)
router.get("/", async (req, res, next) => {
  try {
    const rows = await prisma.content.findMany();
    const map = Object.fromEntries(CONTENT_DEFAULTS.map((c) => [c.key, c.value]));
    for (const r of rows) map[r.key] = r.value;
    res.json(map);
  } catch (err) {
    next(err);
  }
});

export default router;
