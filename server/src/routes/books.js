import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

// GET /api/books?q=&category=&page=1&limit=12&sort=newest
// รองรับ ค้นหา (title/author) + กรองหมวด (slug) + แบ่งหน้า + เรียง
router.get("/", async (req, res, next) => {
  try {
    const { q, category, publisher, sort } = req.query;
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
    if (publisher) {
      where.publisher = publisher;
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

// GET /api/books/publishers — รายชื่อสำนักพิมพ์ + จำนวนหนังสือ
router.get("/publishers", async (req, res, next) => {
  try {
    const rows = await prisma.book.groupBy({
      by: ["publisher"],
      where: { publisher: { not: null } },
      _count: { publisher: true },
      orderBy: { _count: { publisher: "desc" } },
    });
    res.json(
      rows
        .filter((r) => r.publisher?.trim())
        .map((r) => ({ name: r.publisher, count: r._count.publisher }))
    );
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

// GET /api/books/:id/related — เล่มใกล้เคียง (หมวดเดียวกัน, ไม่รวมเล่มนี้)
router.get("/:id/related", async (req, res, next) => {
  try {
    const book = await prisma.book.findUnique({
      where: { id: req.params.id },
      select: { categoryId: true },
    });
    if (!book) return res.json([]);
    const related = await prisma.book.findMany({
      where: { id: { not: req.params.id }, categoryId: book.categoryId || undefined },
      orderBy: { soldCount: "desc" },
      take: 4,
      include: { category: { select: { name: true } } },
    });
    res.json(related);
  } catch (err) {
    next(err);
  }
});

export default router;
