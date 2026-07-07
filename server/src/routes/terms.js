import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { TERM_TYPES, listTermsWithCount } from "../lib/terms.js";

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

// GET /api/terms/list/:type — รายชื่อทั้งหมด + slug + จำนวนเล่ม (สำหรับหน้า directory)
router.get("/list/:type", async (req, res, next) => {
  try {
    const type = String(req.params.type || "").toUpperCase();
    if (!TERM_TYPES.includes(type)) return res.json([]);
    const terms = await listTermsWithCount(type);
    res.json(terms.map((t) => ({ name: t.name, slug: t.slug, image: t.image, count: t.count })));
  } catch (err) {
    next(err);
  }
});

// GET /api/terms/:type/:key — resolve slug (หรือ name) → { type, name, slug }
router.get("/:type/:key", async (req, res, next) => {
  try {
    const type = String(req.params.type || "").toUpperCase();
    if (!TERM_TYPES.includes(type)) return res.status(404).json({ error: "ไม่พบ" });
    const key = decodeURIComponent(req.params.key);
    const term = await prisma.term.findFirst({
      where: { type, OR: [{ slug: key }, { name: key }] },
    });
    if (!term) return res.status(404).json({ error: "ไม่พบ" });
    res.json({ type: term.type, name: term.name, slug: term.slug });
  } catch (err) {
    next(err);
  }
});

export default router;
