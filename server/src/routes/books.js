import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { splitNames } from "../lib/terms.js";
import { hotDealWhere } from "../lib/pricing.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// หา bookId จาก id หรือ slug
async function resolveBookId(key) {
  const b = await prisma.book.findFirst({ where: { OR: [{ id: key }, { slug: key }] }, select: { id: true } });
  return b?.id || null;
}

// GET /api/books?q=&category=&page=1&limit=12&sort=newest
// รองรับ ค้นหา (title/author) + กรองหมวด (slug) + แบ่งหน้า + เรียง
router.get("/", async (req, res, next) => {
  try {
    const { q, category, publisher, sort } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(48, Math.max(1, parseInt(req.query.limit) || 12));

    // โหมดเลือกเอง: ?ids=a,b,c → คืนเฉพาะเล่มที่ระบุ เรียงตามลำดับที่ส่งมา (ไม่แบ่งหน้า)
    if (req.query.ids != null) {
      const ids = String(req.query.ids).split(",").map((s) => s.trim()).filter(Boolean).slice(0, 30);
      if (ids.length === 0) return res.json({ items: [], total: 0, page: 1, pageSize: 0, totalPages: 0 });
      const found = await prisma.book.findMany({
        where: { active: true, id: { in: ids } },
        include: { category: { select: { name: true, slug: true } }, variants: { select: { stock: true } } },
      });
      const byId = new Map(found.map((b) => [b.id, b]));
      const items = ids.map((id) => byId.get(id)).filter(Boolean); // คงลำดับที่แอดมินจัด
      return res.json({ items, total: items.length, page: 1, pageSize: items.length, totalPages: 1 });
    }

    const where = { active: true };
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { author: { contains: q, mode: "insensitive" } },
        { translator: { contains: q, mode: "insensitive" } },
        { isbn: { contains: q, mode: "insensitive" } },
        { variants: { some: { isbn: { contains: q, mode: "insensitive" } } } },
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
    const book = await prisma.book.findFirst({
      where: { OR: [{ id: req.params.id }, { slug: req.params.id }] },
      select: { id: true, categoryId: true },
    });
    if (!book) return res.json([]);
    const related = await prisma.book.findMany({
      where: { id: { not: book.id }, categoryId: book.categoryId || undefined, active: true },
      orderBy: { soldCount: "desc" },
      take: 4,
      include: { category: { select: { name: true } } },
    });
    res.json(related);
  } catch (err) {
    next(err);
  }
});

/* ---------- รีวิวสินค้า ---------- */

// GET /api/books/:id/reviews — รายการรีวิว (แบ่งหน้า) + คะแนนเฉลี่ยจากทั้งหมด
router.get("/:id/reviews", async (req, res, next) => {
  try {
    const bookId = await resolveBookId(req.params.id);
    if (!bookId) return res.json({ items: [], avg: 0, count: 0, page: 1, totalPages: 1 });
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 5));
    const where = { bookId, hidden: false };
    const [agg, reviews] = await Promise.all([
      prisma.review.aggregate({ where, _avg: { rating: true }, _count: true }),
      prisma.review.findMany({
        where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize,
        include: { user: { select: { name: true, email: true } } },
      }),
    ]);
    const count = agg._count;
    const avg = count ? Math.round((agg._avg.rating || 0) * 10) / 10 : 0;
    res.json({
      avg, count, page, pageSize, totalPages: Math.max(1, Math.ceil(count / pageSize)),
      items: reviews.map((r) => ({
        id: r.id, rating: r.rating, comment: r.comment, verified: r.verified, createdAt: r.createdAt,
        name: r.user?.name || (r.user?.email ? r.user.email.split("@")[0] : "ลูกค้า"),
      })),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/books/:id/reviews/mine — รีวิวของฉัน (prefill ฟอร์ม)
router.get("/:id/reviews/mine", authenticate, async (req, res, next) => {
  try {
    const bookId = await resolveBookId(req.params.id);
    if (!bookId) return res.json(null);
    const r = await prisma.review.findUnique({ where: { bookId_userId: { bookId, userId: req.user.id } } });
    res.json(r ? { rating: r.rating, comment: r.comment } : null);
  } catch (err) {
    next(err);
  }
});

// POST /api/books/:id/reviews — เขียน/แก้รีวิว (ล็อกอิน · 1 รีวิว/คน/เล่ม)
router.post("/:id/reviews", authenticate, async (req, res, next) => {
  try {
    const bookId = await resolveBookId(req.params.id);
    if (!bookId) return res.status(404).json({ error: "ไม่พบสินค้า" });
    const rating = Math.round(Number(req.body?.rating) || 0);
    const comment = String(req.body?.comment || "").trim();
    if (rating < 1 || rating > 5) return res.status(400).json({ error: "ให้คะแนน 1-5 ดาว" });
    if (!comment) return res.status(400).json({ error: "กรอกความคิดเห็น" });
    // ซื้อจริงไหม — มีออเดอร์ที่ชำระแล้ว/ไม่ยกเลิก ที่มีสินค้านี้
    const bought = await prisma.order.findFirst({
      where: { userId: req.user.id, status: { not: "CANCELLED" }, paymentStatus: "PAID", items: { some: { bookId } } },
      select: { id: true },
    });
    await prisma.review.upsert({
      where: { bookId_userId: { bookId, userId: req.user.id } },
      update: { rating, comment, verified: !!bought },
      create: { bookId, userId: req.user.id, rating, comment, verified: !!bought },
    });
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
