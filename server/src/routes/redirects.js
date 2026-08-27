import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

// GET /api/redirects — รายการ redirect ที่เปิดใช้ (ฝั่ง client เอาไปเช็ค path)
router.get("/", async (req, res, next) => {
  try {
    const rows = await prisma.redirect.findMany({ where: { active: true }, select: { fromPath: true, toPath: true } });
    res.json(rows.map((r) => ({ from: r.fromPath, to: r.toPath })));
  } catch (err) {
    next(err);
  }
});

// POST /api/redirects/hit — นับจำนวนครั้งที่ถูก redirect (best-effort)
router.post("/hit", async (req, res) => {
  try {
    const from = String(req.body?.from || "").trim();
    if (from) await prisma.redirect.updateMany({ where: { fromPath: from }, data: { hits: { increment: 1 } } });
  } catch { /* เงียบไว้ */ }
  res.json({ ok: true });
});

export default router;
