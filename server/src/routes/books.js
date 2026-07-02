import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

// GET /api/books?q=&category=&page=1&limit=12&sort=newest
// รองรับ ค้นหา (title/author) + กรองหมวด (slug) + แบ่งหน้า + เรียง
router.get("/", async (req, res, next) => {
  try {
    const { q, category, sort } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(48, Math.max(1, parseInt(req.query.limit) || 12));

    const where = {};
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { author: { contains: q, mode: "insensitive" } },
      ];
    }
    if (category) {
      where.category = { slug: category };
    }

    const orderBy =
      sort === "price_asc"
        ? { price: "asc" }
        : sort === "price_desc"
        ? { price: "desc" }
        : sort === "popular"
        ? { soldCount: "desc" } // ขายดี
        : { createdAt: "desc" }; // newest (default)

    const [items, total] = await Promise.all([
      prisma.book.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: { category: { select: { name: true, slug: true } } },
      }),
      prisma.book.count({ where }),
    ]);

    res.json({
      items,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/books/:id — รองรับทั้ง id และ slug
router.get("/:id", async (req, res, next) => {
  try {
    const key = req.params.id;
    const book = await prisma.book.findFirst({
      where: { OR: [{ id: key }, { slug: key }] },
      include: {
        category: { select: { name: true, slug: true } },
        variants: { orderBy: { order: "asc" } },
      },
    });
    if (!book) return res.status(404).json({ error: "ไม่พบหนังสือเล่มนี้" });
    res.json(book);
  } catch (err) {
    next(err);
  }
});

export default router;
