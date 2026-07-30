import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

// GET /api/blog?page=&pageSize= — บทความที่เผยแพร่ (แบ่งหน้า)
router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(24, Math.max(1, parseInt(req.query.pageSize) || 9));
    const where = { published: true };
    const [total, items] = await Promise.all([
      prisma.blogPost.count({ where }),
      prisma.blogPost.findMany({
        where,
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: { id: true, title: true, slug: true, excerpt: true, coverImage: true, author: true, publishedAt: true, createdAt: true },
      }),
    ]);
    res.json({ items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
  } catch (err) {
    next(err);
  }
});

// GET /api/blog/:key — บทความเดียว (slug หรือ id · เฉพาะที่เผยแพร่)
router.get("/:key", async (req, res, next) => {
  try {
    const key = req.params.key;
    const post = await prisma.blogPost.findFirst({ where: { published: true, OR: [{ slug: key }, { id: key }] } });
    if (!post) return res.status(404).json({ error: "ไม่พบบทความ" });
    res.json(post);
  } catch (err) {
    next(err);
  }
});

export default router;
