import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

// GET /api/categories — พร้อมจำนวนหนังสือในแต่ละหมวด
router.get("/", async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { books: true } } },
    });
    res.json(
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        image: c.image,
        bookCount: c._count.books,
      }))
    );
  } catch (err) {
    next(err);
  }
});

export default router;
