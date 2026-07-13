import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { splitNames } from "../lib/terms.js";
import { hotDealWhere } from "../lib/pricing.js";

const router = Router();

// GET /api/books?q=&category=&page=1&limit=12&sort=newest
// รองรับ ค้นหา (title/author) + กรองหมวด (slug) + แบ่งหน้า + เรียง
router.get("/", async (req, res, next) => {
  try {
    const { q, category, publisher, sort } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(48, Math.max(1, parseInt(req.query.limit) || 12));

    const where = { active: true };
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
    if (req.query.author) {
      where.author = { contains: req.query.author, mode: "insensitive" };
    }
    if (req.query.translator) {
      where.translator = { contains: req.query.translator, mode: "insensitive" };
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
        include: {
          category: { select: { name: true, slug: true } },
          variants: { select: { stock: true } }, // ใช้รวมสต็อกในการ์ด
        },
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

// GET /api/books/hot-deals — หนังสือที่มี Hot Deal กำลัง active (สำหรับ section หน้าแรก)
router.get("/hot-deals", async (req, res, next) => {
  try {
    const items = await prisma.book.findMany({
      where: { active: true, ...hotDealWhere() },
      orderBy: { hotDealEnd: "asc" }, // ใกล้หมดโปรก่อน
      take: 16,
      include: {
        category: { select: { name: true, slug: true } },
        variants: { select: { stock: true } },
      },
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

// GET /api/books/publishers — รายชื่อสำนักพิมพ์ + จำนวนหนังสือ
router.get("/publishers", async (req, res, next) => {
  try {
    const rows = await prisma.book.groupBy({
      by: ["publisher"],
      where: { publisher: { not: null }, active: true },
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
      where: { active: true, OR: [{ id: key }, { slug: key }] },
      include: {
        category: { select: { name: true, slug: true } },
        variants: { orderBy: { order: "asc" } },
      },
    });
    if (!book) return res.status(404).json({ error: "ไม่พบหนังสือเล่มนี้" });

    // แนบ slug ของ สำนักพิมพ์/ผู้เขียน/ผู้แปล (ให้หน้าสินค้าลิงก์ไป collection)
    const authorNames = splitNames(book.author);
    const translatorNames = splitNames(book.translator);
    const allNames = [book.publisher?.trim(), ...authorNames, ...translatorNames].filter(Boolean);
    const terms = allNames.length
      ? await prisma.term.findMany({ where: { name: { in: allNames } }, select: { type: true, name: true, slug: true } })
      : [];
    const slugOf = (type, name) => terms.find((t) => t.type === type && t.name === name)?.slug || encodeURIComponent(name);
    book.publisherLink = book.publisher?.trim() ? { name: book.publisher.trim(), slug: slugOf("PUBLISHER", book.publisher.trim()) } : null;
    book.authorLinks = authorNames.map((n) => ({ name: n, slug: slugOf("AUTHOR", n) }));
    book.translatorLinks = translatorNames.map((n) => ({ name: n, slug: slugOf("TRANSLATOR", n) }));

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
      where: { id: { not: req.params.id }, categoryId: book.categoryId || undefined, active: true },
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
