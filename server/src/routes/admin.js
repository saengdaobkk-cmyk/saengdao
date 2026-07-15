import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import bcrypt from "bcryptjs";
import { authenticate, requireAdmin, requireStaff } from "../middleware/auth.js";
import { uploadImage, uploadImages, uploadPdf } from "../lib/upload.js";
import { storeFile } from "../lib/storage.js";
import { CONTENT_DEFAULTS, SECTION_LABELS } from "../lib/contentDefaults.js";
import { ZK, ZORT_DEFAULT_BASE, ZORT_STOCK_SYNCED_AT, getZortConfig, testZortConnection, pushOrderToZort, syncStockFromZort } from "../lib/zort.js";
import { TPK, getThaipostConfig, testThaipostConnection, updateOrderTracking, isThaiPostMethod, buildTrackingUrl } from "../lib/thaipost.js";
import { TERM_TYPES, syncTermsFromBook, listTermsWithCount, renameTermInBooks, uniqueTermSlug } from "../lib/terms.js";
import { ensureNav } from "../lib/navDefaults.js";

const router = Router();
router.use(authenticate, requireStaff); // ต้องเป็นเจ้าหน้าที่ (STAFF/ADMIN)
// เมนูเฉพาะแอดมินเต็ม — STAFF เข้าไม่ได้ (พนักงานเห็นแค่ สินค้า/คำสั่งซื้อ/collection)
["/coupons", "/slides", "/content", "/integrations", "/nav", "/nav-reorder", "/users", "/shipping", "/shipping-reorder"].forEach((p) =>
  router.use(p, requireAdmin)
);

const ORDER_STATUS = ["PENDING", "PAID", "SHIPPED", "COMPLETED", "CANCELLED"];
const PAYMENT_STATUS = ["UNPAID", "PENDING_REVIEW", "PAID", "FAILED"];

/* ---------- Dashboard ---------- */
router.get("/stats", async (req, res, next) => {
  try {
    const [orders, pendingReview, books, paidAgg, users] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { paymentStatus: "PENDING_REVIEW" } }),
      prisma.book.count(),
      prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: "PAID" } }),
      prisma.user.count(),
    ]);
    res.json({
      orders,
      pendingReview,
      books,
      users,
      revenue: Number(paidAgg._sum.total || 0),
    });
  } catch (err) {
    next(err);
  }
});

/* ---------- Books ---------- */
router.get("/books", async (req, res, next) => {
  try {
    const books = await prisma.book.findMany({
      orderBy: { createdAt: "desc" },
      include: { category: { select: { name: true } }, variants: { orderBy: { order: "asc" } } },
    });
    res.json(books);
  } catch (err) {
    next(err);
  }
});

const num = (v) => (v === "" || v == null ? null : Number(v));
const int = (v) => (v === "" || v == null ? null : parseInt(v));
const str = (v) => (typeof v === "string" ? v.trim() || null : null);

// แยกฟิลด์ scalar ของ book (ไม่รวม variants)
function bookData(body) {
  return {
    title: str(body.title),
    author: str(body.author),
    translator: str(body.translator),
    isbn: str(body.isbn),
    description: str(body.description),
    price: num(body.price) ?? 0,
    discountPrice: num(body.discountPrice),
    hotDealPrice: num(body.hotDealPrice),
    hotDealStart: body.hotDealStart ? new Date(body.hotDealStart) : null,
    hotDealEnd: body.hotDealEnd ? new Date(body.hotDealEnd) : null,
    stock: int(body.stock) ?? 0,
    soldCount: int(body.soldCount) ?? 0,
    active: body.active === undefined ? true : !!body.active,
    featured: !!body.featured,
    tags: Array.isArray(body.tags) ? body.tags.map((t) => String(t).trim()).filter(Boolean) : [],
    coverImage: str(body.coverImage),
    backCoverImage: str(body.backCoverImage),
    galleryImages: Array.isArray(body.galleryImages) ? body.galleryImages.filter(Boolean) : [],
    previewPdf: str(body.previewPdf),
    categoryId: body.categoryId || null,
    publisher: str(body.publisher),
    edition: str(body.edition),
    pageCount: int(body.pageCount),
    dimensions: str(body.dimensions),
    weight: str(body.weight),
    paperType: str(body.paperType),
    coverType: str(body.coverType),
    sku: str(body.sku),
    metaTitle: str(body.metaTitle),
    metaDescription: str(body.metaDescription),
    slug: str(body.slug)?.toLowerCase() || null,
    importedAt: body.importedAt ? new Date(body.importedAt) : null,
  };
}

// แปลง variants จาก body → nested create
function variantCreate(body) {
  if (!Array.isArray(body.variants)) return [];
  return body.variants
    .filter((v) => v && String(v.name).trim())
    .map((v, i) => ({
      name: String(v.name).trim(),
      isbn: str(v.isbn),
      coverImage: str(v.coverImage),
      backCoverImage: str(v.backCoverImage),
      price: num(v.price) ?? 0,
      discountPrice: num(v.discountPrice),
      stock: int(v.stock) ?? 0,
      order: i,
    }));
}

router.post("/books", async (req, res, next) => {
  try {
    const data = bookData(req.body);
    if (!data.title || !data.author)
      return res.status(400).json({ error: "กรอกชื่อหนังสือและผู้แต่ง" });
    const book = await prisma.book.create({
      data: { ...data, variants: { create: variantCreate(req.body) } },
      include: { variants: true },
    });
    await syncTermsFromBook(book);
    res.status(201).json(book);
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "ISBN หรือ Slug ซ้ำกับเล่มอื่น" });
    next(err);
  }
});

router.patch("/books/:id", async (req, res, next) => {
  try {
    const data = bookData(req.body);
    if (!data.title || !data.author)
      return res.status(400).json({ error: "กรอกชื่อหนังสือและผู้แต่ง" });
    // variants: ลบของเดิมแล้วสร้างใหม่ (ง่ายและถูกต้อง)
    const book = await prisma.book.update({
      where: { id: req.params.id },
      data: { ...data, variants: { deleteMany: {}, create: variantCreate(req.body) } },
      include: { variants: true },
    });
    await syncTermsFromBook(book);
    res.json(book);
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "ISBN หรือ Slug ซ้ำกับเล่มอื่น" });
    next(err);
  }
});

router.delete("/books/:id", async (req, res, next) => {
  try {
    // กันลบหนังสือที่มีในออเดอร์แล้ว
    const inOrder = await prisma.orderItem.count({ where: { bookId: req.params.id } });
    if (inOrder > 0)
      return res.status(409).json({ error: "ลบไม่ได้ — หนังสือนี้มีในคำสั่งซื้อแล้ว" });
    await prisma.book.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// POST /admin/books/import — นำเข้าหลายเล่มจากตาราง (rows = array ของ object)
router.post("/books/import", async (req, res, next) => {
  try {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    if (rows.length === 0) return res.status(400).json({ error: "ไม่มีข้อมูลให้นำเข้า" });
    if (rows.length > 2000) return res.status(400).json({ error: "นำเข้าได้ครั้งละไม่เกิน 2000 แถว" });

    // เตรียมหมวด (หา/สร้างตามชื่อ)
    const cats = await prisma.category.findMany();
    const catByName = new Map(cats.map((c) => [c.name.trim().toLowerCase(), c]));
    const slugify = (s) =>
      String(s).trim().toLowerCase().replace(/[^\w฀-๿]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || null;

    const val = (r, ...keys) => {
      for (const k of keys) if (r[k] != null && String(r[k]).trim() !== "") return String(r[k]).trim();
      return "";
    };
    const truthy = (v) => v === 1 || v === "1" || v === true || /^(true|yes|y|ใช่)$/i.test(String(v || ""));

    let created = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const line = i + 2; // แถวในไฟล์ (มี header)
      try {
        const title = val(r, "title", "ชื่อหนังสือ", "ชื่อสินค้า");
        if (!title) { errors.push({ line, error: "ไม่มีชื่อหนังสือ (title)" }); continue; }
        const price = Number(val(r, "price", "ราคา", "ราคาปกติ"));
        if (!price || price <= 0) { errors.push({ line, error: "ราคาไม่ถูกต้อง" }); continue; }

        // หมวด
        let categoryId = null;
        const cname = val(r, "category", "หมวด", "หมวดหมู่");
        if (cname) {
          let cat = catByName.get(cname.toLowerCase());
          if (!cat) {
            cat = await prisma.category.create({ data: { name: cname, slug: slugify(cname) || `cat-${Date.now()}` } });
            catByName.set(cname.toLowerCase(), cat);
          }
          categoryId = cat.id;
        }

        const saleRaw = val(r, "sale_price", "ราคาลด", "discount_price");
        const pagesRaw = val(r, "pages", "pageCount", "จำนวนหน้า");
        const tagsRaw = val(r, "tags", "แท็ก");

        const newBook = await prisma.book.create({
          data: {
            title,
            author: val(r, "author", "ผู้เขียน", "ผู้แต่ง"),
            translator: val(r, "translator", "ผู้แปล") || null,
            price,
            discountPrice: saleRaw ? Number(saleRaw) : null,
            stock: parseInt(val(r, "stock", "สต็อก")) || 0,
            featured: truthy(r.is_featured ?? r.featured ?? r["แนะนำ"]),
            publisher: val(r, "publisher", "สำนักพิมพ์") || null,
            edition: val(r, "edition", "พิมพ์ครั้งที่") || null,
            pageCount: pagesRaw ? parseInt(pagesRaw) : null,
            dimensions: val(r, "dimensions", "ขนาด") || null,
            weight: val(r, "weight", "น้ำหนัก") || null,
            paperType: val(r, "paper_inner", "paperType", "กระดาษเนื้อใน") || null,
            coverType: val(r, "cover_type", "coverType", "ปก") || null,
            isbn: val(r, "isbn", "ISBN") || null,
            sku: val(r, "sku", "SKU") || null,
            coverImage: val(r, "image_url", "coverImage", "รูปปก") || null,
            description: val(r, "description", "รายละเอียด") || null,
            tags: tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [],
            categoryId,
          },
        });
        await syncTermsFromBook(newBook);
        created++;
      } catch (e) {
        errors.push({ line, error: e.code === "P2002" ? "ISBN/Slug ซ้ำกับเล่มอื่น" : e.message });
      }
    }

    res.json({ created, failed: errors.length, errors: errors.slice(0, 50) });
  } catch (err) {
    next(err);
  }
});

/* ---------- Categories ---------- */
// auto slug ถ้าไม่กรอก
const autoSlug = (name, slug) =>
  (slug?.trim() || String(name).trim().toLowerCase().replace(/[^\w฀-๿]+/g, "-").replace(/^-+|-+$/g, "")).slice(0, 40);

router.post("/categories", async (req, res, next) => {
  try {
    const name = req.body.name?.trim();
    const slug = autoSlug(name, req.body.slug);
    if (!name || !slug) return res.status(400).json({ error: "กรอกชื่อหมวด" });
    const cat = await prisma.category.create({ data: { name, slug, image: req.body.image?.trim() || null } });
    res.status(201).json(cat);
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "ชื่อหมวดหรือ slug ซ้ำ" });
    next(err);
  }
});

router.patch("/categories/:id", async (req, res, next) => {
  try {
    const name = req.body.name?.trim();
    const slug = autoSlug(name, req.body.slug);
    if (!name || !slug) return res.status(400).json({ error: "กรอกชื่อหมวด" });
    const data = { name, slug };
    if (req.body.image !== undefined) data.image = req.body.image?.trim() || null;
    const cat = await prisma.category.update({ where: { id: req.params.id }, data });
    res.json(cat);
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "ชื่อหมวดหรือ slug ซ้ำ" });
    next(err);
  }
});

router.delete("/categories/:id", async (req, res, next) => {
  try {
    // ปลดหนังสือออกจากหมวด (ไม่ลบหนังสือ) แล้วค่อยลบหมวด
    await prisma.book.updateMany({ where: { categoryId: req.params.id }, data: { categoryId: null } });
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/* ---------- Terms: สำนักพิมพ์ / ผู้เขียน / ผู้แปล (collection) ---------- */
// GET /admin/terms?type=PUBLISHER|AUTHOR|TRANSLATOR
router.get("/terms", async (req, res, next) => {
  try {
    const type = String(req.query.type || "").toUpperCase();
    if (!TERM_TYPES.includes(type)) return res.status(400).json({ error: "type ไม่ถูกต้อง" });
    res.json(await listTermsWithCount(type));
  } catch (err) {
    next(err);
  }
});

router.post("/terms", async (req, res, next) => {
  try {
    const type = String(req.body.type || "").toUpperCase();
    const name = String(req.body.name || "").trim();
    if (!TERM_TYPES.includes(type)) return res.status(400).json({ error: "type ไม่ถูกต้อง" });
    if (!name) return res.status(400).json({ error: "กรอกชื่อ" });
    const slug = await uniqueTermSlug(type, name);
    const t = await prisma.term.create({ data: { type, name, slug } });
    res.status(201).json(t);
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "มีชื่อนี้อยู่แล้ว" });
    next(err);
  }
});

router.patch("/terms/:id", async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ error: "กรอกชื่อ" });
    const term = await prisma.term.findUnique({ where: { id: req.params.id } });
    if (!term) return res.status(404).json({ error: "ไม่พบรายชื่อ" });

    const updated = await renameTermInBooks(term.type, term.name, name); // อัปเดตหนังสือ
    try {
      const slug = await uniqueTermSlug(term.type, name, term.id);
      const data = { name, slug };
      if (req.body.image !== undefined) data.image = req.body.image?.trim() || null;
      const t = await prisma.term.update({ where: { id: term.id }, data });
      res.json({ ...t, updated });
    } catch (e) {
      // ชื่อใหม่ซ้ำกับ term ที่มีอยู่ → รวมกัน (ลบตัวเดิม)
      if (e.code === "P2002") {
        await prisma.term.delete({ where: { id: term.id } });
        return res.json({ merged: true, updated });
      }
      throw e;
    }
  } catch (err) {
    next(err);
  }
});

router.delete("/terms/:id", async (req, res, next) => {
  try {
    const term = await prisma.term.findUnique({ where: { id: req.params.id } });
    if (!term) return res.json({ ok: true });
    const cleared = await renameTermInBooks(term.type, term.name, null); // ล้างออกจากหนังสือ
    await prisma.term.delete({ where: { id: term.id } });
    res.json({ ok: true, cleared });
  } catch (err) {
    next(err);
  }
});

/* ---------- Nav / เมนูหน้าร้าน ---------- */
router.get("/nav", async (req, res, next) => {
  try {
    res.json(await ensureNav(prisma));
  } catch (err) {
    next(err);
  }
});

router.post("/nav", async (req, res, next) => {
  try {
    const label = String(req.body.label || "").trim();
    const url = String(req.body.url || "").trim();
    if (!label) return res.status(400).json({ error: "กรอกชื่อเมนู" });
    if (!url) return res.status(400).json({ error: "เลือกหน้า/ใส่ลิงก์" });
    const max = await prisma.navItem.aggregate({ _max: { order: true } });
    const item = await prisma.navItem.create({
      data: { label, url, order: (max._max.order ?? -1) + 1 },
    });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

router.patch("/nav/:id", async (req, res, next) => {
  try {
    const data = {};
    if (req.body.label !== undefined) data.label = String(req.body.label).trim();
    if (req.body.url !== undefined) data.url = String(req.body.url).trim();
    if (req.body.active !== undefined) data.active = !!req.body.active;
    if (req.body.order !== undefined) data.order = Number(req.body.order);
    const item = await prisma.navItem.update({ where: { id: req.params.id }, data });
    res.json(item);
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "ไม่พบเมนู" });
    next(err);
  }
});

router.delete("/nav/:id", async (req, res, next) => {
  try {
    await prisma.navItem.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    if (err.code === "P2025") return res.json({ ok: true });
    next(err);
  }
});

// จัดเรียงใหม่ — รับ ids ตามลำดับที่ต้องการ
router.patch("/nav-reorder", async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    await prisma.$transaction(
      ids.map((id, i) => prisma.navItem.update({ where: { id }, data: { order: i } }))
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/* ---------- Shipping / ช่องทางจัดส่ง ---------- */
router.get("/shipping", async (req, res, next) => {
  try {
    const methods = await prisma.shippingMethod.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
    res.json(methods);
  } catch (err) {
    next(err);
  }
});

router.post("/shipping", async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ error: "กรอกชื่อช่องทางจัดส่ง" });
    const fee = Math.max(0, Math.round(Number(req.body.fee) || 0));
    const note = String(req.body.note || "").trim() || null;
    const trackingUrl = String(req.body.trackingUrl || "").trim() || null;
    const max = await prisma.shippingMethod.aggregate({ _max: { order: true } });
    const item = await prisma.shippingMethod.create({
      data: { name, fee, note, trackingUrl, order: (max._max.order ?? -1) + 1 },
    });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

router.patch("/shipping/:id", async (req, res, next) => {
  try {
    const data = {};
    if (req.body.name !== undefined) data.name = String(req.body.name).trim();
    if (req.body.fee !== undefined) data.fee = Math.max(0, Math.round(Number(req.body.fee) || 0));
    if (req.body.note !== undefined) data.note = String(req.body.note).trim() || null;
    if (req.body.trackingUrl !== undefined) data.trackingUrl = String(req.body.trackingUrl).trim() || null;
    if (req.body.active !== undefined) data.active = !!req.body.active;
    if (req.body.order !== undefined) data.order = Number(req.body.order);
    const item = await prisma.shippingMethod.update({ where: { id: req.params.id }, data });
    res.json(item);
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "ไม่พบช่องทางจัดส่ง" });
    next(err);
  }
});

router.delete("/shipping/:id", async (req, res, next) => {
  try {
    await prisma.shippingMethod.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    if (err.code === "P2025") return res.json({ ok: true });
    next(err);
  }
});

router.patch("/shipping-reorder", async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    await prisma.$transaction(
      ids.map((id, i) => prisma.shippingMethod.update({ where: { id }, data: { order: i } }))
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/* ---------- Orders ---------- */
router.get("/orders", async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        // รวมข้อมูลใบเสร็จที่ลูกค้าบันทึกไว้ในโปรไฟล์ (เผื่อแอดมินดึงมาใช้)
        user: {
          select: {
            email: true, name: true, phone: true, address: true,
            receiptName: true, receiptTaxId: true, receiptAddress: true,
          },
        },
        items: { include: { book: { select: { title: true } } } },
      },
    });
    // แนบลิงก์ tracking ให้แต่ละออเดอร์ (ไปรษณีย์ไทย = เว็บไปรษณีย์, อื่นๆ = template ของขนส่ง)
    const methods = await prisma.shippingMethod.findMany({ select: { name: true, trackingUrl: true } });
    const urlByName = new Map(methods.map((m) => [m.name, m.trackingUrl]));
    for (const o of orders) {
      if (!o.trackingNumber) continue;
      o.trackingLink = isThaiPostMethod(o.shippingMethod)
        ? `https://track.thailandpost.co.th/?trackNumber=${encodeURIComponent(o.trackingNumber)}`
        : buildTrackingUrl(urlByName.get(o.shippingMethod), o.trackingNumber);
    }
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

const ORDER_TEXT_FIELDS = [
  "shipName", "shipPhone", "shipAddress", "email", "note",
  "receiptName", "receiptTaxId", "receiptAddress",
  "trackingNumber",
];

router.patch("/orders/:id", async (req, res, next) => {
  try {
    const body = req.body || {};
    const data = {};

    if (body.status) {
      if (!ORDER_STATUS.includes(body.status)) return res.status(400).json({ error: "สถานะไม่ถูกต้อง" });
      data.status = body.status;
    }
    if (body.paymentStatus) {
      if (!PAYMENT_STATUS.includes(body.paymentStatus))
        return res.status(400).json({ error: "สถานะการชำระเงินไม่ถูกต้อง" });
      data.paymentStatus = body.paymentStatus;
      if (body.paymentStatus === "PAID" && !body.status) data.status = "PAID";
    }

    // แก้ไขข้อมูลออเดอร์
    for (const f of ORDER_TEXT_FIELDS) {
      if (f in body) data[f] = typeof body[f] === "string" ? body[f].trim() || null : body[f] ?? null;
    }
    if ("needReceipt" in body) data.needReceipt = !!body.needReceipt;

    if (data.shipName === null) return res.status(400).json({ error: "ชื่อผู้รับห้ามว่าง" });
    if (data.receiptTaxId && !/^\d{13}$/.test(data.receiptTaxId))
      return res.status(400).json({ error: "เลขผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก" });

    const order = await prisma.order.update({ where: { id: req.params.id }, data });

    // ยืนยันชำระเงินแล้ว → ส่งออเดอร์ไป ZORT อัตโนมัติ (best-effort ไม่บล็อกการอนุมัติ)
    let zort;
    if (data.paymentStatus === "PAID" && !order.zortOrderId) {
      zort = await pushOrderToZort(order.id).catch((e) => ({ ok: false, error: e.message }));
    }

    res.json({ ...order, zortSync: zort });
  } catch (err) {
    next(err);
  }
});

// ส่งออเดอร์ไป ZORT ด้วยตนเอง (retry)
router.post("/orders/:id/zort-sync", async (req, res, next) => {
  try {
    res.json(await pushOrderToZort(req.params.id));
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// ดึงสถานะพัสดุล่าสุดจากไปรษณีย์ไทย
router.post("/orders/:id/tracking-refresh", async (req, res, next) => {
  try {
    res.json(await updateOrderTracking(req.params.id));
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

/* ---------- Coupons ---------- */
router.get("/coupons", async (req, res, next) => {
  try {
    res.json(await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } }));
  } catch (err) {
    next(err);
  }
});

function couponData(body) {
  return {
    code: body.code?.trim().toUpperCase(),
    type: body.type === "FIXED" ? "FIXED" : "PERCENT",
    value: Number(body.value) || 0,
    minSubtotal: body.minSubtotal ? Number(body.minSubtotal) : null,
    active: body.active !== false,
    expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
  };
}

router.post("/coupons", async (req, res, next) => {
  try {
    const data = couponData(req.body);
    if (!data.code) return res.status(400).json({ error: "กรอกโค้ด" });
    if (data.value <= 0) return res.status(400).json({ error: "มูลค่าส่วนลดต้องมากกว่า 0" });
    const coupon = await prisma.coupon.create({ data });
    res.status(201).json(coupon);
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "โค้ดนี้มีอยู่แล้ว" });
    next(err);
  }
});

router.patch("/coupons/:id", async (req, res, next) => {
  try {
    const coupon = await prisma.coupon.update({ where: { id: req.params.id }, data: couponData(req.body) });
    res.json(coupon);
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "โค้ดนี้มีอยู่แล้ว" });
    next(err);
  }
});

router.delete("/coupons/:id", async (req, res, next) => {
  try {
    await prisma.coupon.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/* ---------- Slides (hero หน้าแรก) ---------- */
router.get("/slides", async (req, res, next) => {
  try {
    res.json(await prisma.slide.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] }));
  } catch (err) {
    next(err);
  }
});

function slideData(body) {
  return {
    eyebrow: body.eyebrow?.trim() || null,
    title: body.title?.trim() || "",
    subtitle: body.subtitle?.trim() || null,
    ctaText: body.ctaText?.trim() || null,
    ctaLink: body.ctaLink?.trim() || "#catalog",
    image: body.image?.trim() || null,
    bgColor: body.bgColor?.trim() || null,
    dark: body.dark !== false,
    align: ["left", "center", "right"].includes(body.align) ? body.align : "center",
    valign: ["top", "center", "bottom"].includes(body.valign) ? body.valign : "center",
    overlay: Math.min(100, Math.max(0, parseInt(body.overlay) || 0)),
    linkUrl: body.linkUrl?.trim() || null,
    textColor: body.textColor?.trim() || null,
    buttonColor: body.buttonColor?.trim() || null,
    buttonTextColor: body.buttonTextColor?.trim() || null,
    order: parseInt(body.order) || 0,
    active: body.active !== false,
  };
}

router.post("/slides", async (req, res, next) => {
  try {
    const data = slideData(req.body);
    if (!data.title) return res.status(400).json({ error: "กรอกหัวข้อสไลด์" });
    res.status(201).json(await prisma.slide.create({ data }));
  } catch (err) {
    next(err);
  }
});

router.patch("/slides/:id", async (req, res, next) => {
  try {
    const data = slideData(req.body);
    if (!data.title) return res.status(400).json({ error: "กรอกหัวข้อสไลด์" });
    res.json(await prisma.slide.update({ where: { id: req.params.id }, data }));
  } catch (err) {
    next(err);
  }
});

router.delete("/slides/:id", async (req, res, next) => {
  try {
    await prisma.slide.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/* ---------- Content (ข้อความในเว็บ) ---------- */
// GET /admin/content — รวม default กับค่าใน DB, จัดกลุ่มตาม section
router.get("/content", async (req, res, next) => {
  try {
    const rows = await prisma.content.findMany();
    const dbMap = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    const items = CONTENT_DEFAULTS.map((c) => ({
      key: c.key,
      section: c.section,
      label: c.label,
      order: c.order ?? 0,
      value: dbMap[c.key] ?? c.value,
    }));
    // จัดกลุ่ม
    const sections = {};
    for (const it of items) {
      (sections[it.section] ??= []).push(it);
    }
    for (const k of Object.keys(sections)) sections[k].sort((a, b) => a.order - b.order);
    res.json({
      sections: Object.keys(sections).map((s) => ({
        key: s,
        label: SECTION_LABELS[s] || s,
        items: sections[s],
      })),
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /admin/content — บันทึกหลาย key พร้อมกัน { updates: { key: value } }
router.patch("/content", async (req, res, next) => {
  try {
    const updates = req.body?.updates || {};
    const valid = Object.fromEntries(CONTENT_DEFAULTS.map((c) => [c.key, c]));
    for (const [key, value] of Object.entries(updates)) {
      const def = valid[key];
      if (!def) continue; // เขียนได้เฉพาะ key ที่รู้จัก
      await prisma.content.upsert({
        where: { key },
        update: { value: String(value ?? "") },
        create: { key, section: def.section, label: def.label, order: def.order ?? 0, value: String(value ?? "") },
      });
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/* ---------- Integrations (เชื่อม API แอปภายนอก) ---------- */
// ส่งกลับ client แบบปลอดภัย (ไม่มี apisecret)
function publicZort(z) {
  return {
    enabled: z.enabled,
    storename: z.storename,
    apikey: z.apikey,
    hasSecret: !!z.apisecret,
    baseUrl: z.baseUrl,
    connected: z.enabled && !!z.storename && !!z.apikey && !!z.apisecret,
  };
}

// ซ่อน API key — คืนแค่สถานะว่าตั้งค่าไว้แล้วหรือยัง
function publicThpost(c) {
  return { enabled: c.enabled, hasKey: !!c.apikey, connected: c.enabled && !!c.apikey };
}

async function integrationsPayload() {
  const [zort, thpost, syncedRow] = await Promise.all([
    getZortConfig(),
    getThaipostConfig(),
    prisma.setting.findUnique({ where: { key: ZORT_STOCK_SYNCED_AT } }),
  ]);
  return {
    zort: { ...publicZort(zort), stockSyncedAt: syncedRow?.value || null },
    thpost: publicThpost(thpost),
  };
}

router.get("/integrations", async (req, res, next) => {
  try {
    res.json(await integrationsPayload());
  } catch (err) {
    next(err);
  }
});

router.patch("/integrations", async (req, res, next) => {
  try {
    const z = req.body?.zort || {};
    const tp = req.body?.thpost || {};
    const set = (key, value) =>
      prisma.setting.upsert({ where: { key }, update: { value: String(value) }, create: { key, value: String(value) } });

    if ("enabled" in z) await set(ZK.enabled, !!z.enabled);
    if ("storename" in z) await set(ZK.storename, z.storename?.trim() || "");
    if ("apikey" in z) await set(ZK.apikey, z.apikey?.trim() || "");
    if ("baseUrl" in z) await set(ZK.baseUrl, z.baseUrl?.trim() || ZORT_DEFAULT_BASE);
    // apisecret อัปเดตเฉพาะเมื่อกรอกใหม่ (เว้นว่าง = คงของเดิม)
    if (z.apisecret) await set(ZK.apisecret, z.apisecret.trim());

    // Thailand Post
    if ("enabled" in tp) await set(TPK.enabled, !!tp.enabled);
    if (tp.apikey) await set(TPK.apikey, tp.apikey.trim()); // เว้นว่าง = คงของเดิม

    res.json(await integrationsPayload());
  } catch (err) {
    next(err);
  }
});

// ทดสอบการเชื่อมต่อ ZORT (เรียกจาก server เท่านั้น — creds ไม่ออกจาก backend)
router.post("/integrations/zort/test", async (req, res, next) => {
  try {
    res.json(await testZortConnection());
  } catch (err) {
    res.json({ ok: false, error: "เชื่อมต่อไม่ได้: " + err.message });
  }
});

// ทดสอบการเชื่อมต่อไปรษณีย์ไทย
router.post("/integrations/thpost/test", async (req, res, next) => {
  try {
    res.json(await testThaipostConnection());
  } catch (err) {
    res.json({ ok: false, error: "เชื่อมต่อไม่ได้: " + err.message });
  }
});

// ดึงสต็อกจาก ZORT มาอัปเดตเว็บ (ตาม SKU=ISBN)
router.post("/integrations/zort/sync-stock", async (req, res, next) => {
  try {
    res.json(await syncStockFromZort());
  } catch (err) {
    res.json({ ok: false, error: "ดึงสต็อกไม่สำเร็จ: " + err.message });
  }
});

/* ---------- Image upload ---------- */
router.post("/upload", (req, res) => {
  uploadImage(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "ไม่พบไฟล์" });
    try {
      res.json({ url: await storeFile(req.file, "img") });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
});

// อัปโหลดหลายรูป (แกลเลอรี) → { urls: [] }
router.post("/upload-images", (req, res) => {
  uploadImages(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.files?.length) return res.status(400).json({ error: "ไม่พบไฟล์" });
    try {
      res.json({ urls: await Promise.all(req.files.map((f) => storeFile(f, "img"))) });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
});

// อัปโหลด PDF ตัวอย่าง → { url }
router.post("/upload-pdf", (req, res) => {
  uploadPdf(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "ไม่พบไฟล์" });
    try {
      res.json({ url: await storeFile(req.file, "pdf") });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
});

/* ---------- Users (จัดการผู้ใช้/สิทธิ์ — แอดมินเต็มเท่านั้น) ---------- */
const ROLES = ["USER", "STAFF", "ADMIN"];
const userPublic = (u) => ({ id: u.id, email: u.email, name: u.name, role: u.role, createdAt: u.createdAt });
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.get("/users", async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: { in: ["STAFF", "ADMIN"] } }, // เฉพาะเจ้าหน้าที่ (ลูกค้าอยู่เมนู "ลูกค้า")
      orderBy: [{ role: "desc" }, { createdAt: "asc" }],
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    res.json(users.map(userPublic));
  } catch (err) {
    next(err);
  }
});

router.post("/users", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const name = String(req.body.name || "").trim() || null;
    const role = ["STAFF", "ADMIN"].includes(req.body.role) ? req.body.role : "STAFF"; // เมนูนี้สร้างได้เฉพาะเจ้าหน้าที่
    if (!emailRe.test(email)) return res.status(400).json({ error: "อีเมลไม่ถูกต้อง" });
    if (password.length < 6) return res.status(400).json({ error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" });
    const user = await prisma.user.create({
      data: { email, password: await bcrypt.hash(password, 10), name, role },
    });
    res.status(201).json(userPublic(user));
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "อีเมลนี้ถูกใช้งานแล้ว" });
    next(err);
  }
});

router.patch("/users/:id", async (req, res, next) => {
  try {
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) return res.status(404).json({ error: "ไม่พบผู้ใช้" });
    const data = {};

    if (req.body.name !== undefined) data.name = String(req.body.name).trim() || null;

    if (req.body.role !== undefined && req.body.role !== target.role) {
      if (!ROLES.includes(req.body.role)) return res.status(400).json({ error: "สิทธิ์ไม่ถูกต้อง" });
      if (target.id === req.user.id) return res.status(400).json({ error: "เปลี่ยนสิทธิ์ของตัวเองไม่ได้" });
      // กันถอด ADMIN คนสุดท้าย
      if (target.role === "ADMIN" && req.body.role !== "ADMIN") {
        const admins = await prisma.user.count({ where: { role: "ADMIN" } });
        if (admins <= 1) return res.status(400).json({ error: "ต้องมีแอดมินอย่างน้อย 1 คน" });
      }
      data.role = req.body.role;
    }

    if (req.body.password) {
      if (String(req.body.password).length < 6)
        return res.status(400).json({ error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" });
      data.password = await bcrypt.hash(String(req.body.password), 10);
    }

    const user = await prisma.user.update({ where: { id: target.id }, data });
    res.json(userPublic(user));
  } catch (err) {
    next(err);
  }
});

router.delete("/users/:id", async (req, res, next) => {
  try {
    const target = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { orders: true } } },
    });
    if (!target) return res.json({ ok: true });
    if (target.id === req.user.id) return res.status(400).json({ error: "ลบบัญชีตัวเองไม่ได้" });
    if (target._count.orders > 0)
      return res.status(409).json({ error: "ลบไม่ได้ — ผู้ใช้นี้มีคำสั่งซื้อแล้ว (ลดสิทธิ์เป็นลูกค้าแทนได้)" });
    if (target.role === "ADMIN") {
      const admins = await prisma.user.count({ where: { role: "ADMIN" } });
      if (admins <= 1) return res.status(400).json({ error: "ต้องมีแอดมินอย่างน้อย 1 คน" });
    }
    await prisma.user.delete({ where: { id: target.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/* ---------- Customers (ลูกค้า — เจ้าหน้าที่ดู/แก้ข้อมูลได้) ---------- */
const customerPublic = (u) => ({
  id: u.id, email: u.email, name: u.name, phone: u.phone, address: u.address,
  receiptName: u.receiptName, receiptTaxId: u.receiptTaxId, receiptAddress: u.receiptAddress,
  createdAt: u.createdAt,
});

router.get("/customers", async (req, res, next) => {
  try {
    const rows = await prisma.user.findMany({
      where: { role: "USER" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, email: true, name: true, phone: true, address: true,
        receiptName: true, receiptTaxId: true, receiptAddress: true, createdAt: true,
        _count: { select: { orders: true } },
      },
    });
    res.json(rows.map((c) => ({ ...customerPublic(c), orderCount: c._count.orders })));
  } catch (err) {
    next(err);
  }
});

router.patch("/customers/:id", async (req, res, next) => {
  try {
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target || target.role !== "USER") return res.status(404).json({ error: "ไม่พบลูกค้า" });
    const b = req.body || {};
    const data = {};
    for (const f of ["name", "phone", "address", "receiptName", "receiptAddress"]) {
      if (b[f] !== undefined) data[f] = String(b[f]).trim() || null;
    }
    if (b.receiptTaxId !== undefined) {
      const tid = String(b.receiptTaxId).trim() || null;
      if (tid && !/^\d{13}$/.test(tid)) return res.status(400).json({ error: "เลขผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก" });
      data.receiptTaxId = tid;
    }
    if (b.email !== undefined && b.email !== target.email) {
      const email = String(b.email).trim().toLowerCase();
      if (!emailRe.test(email)) return res.status(400).json({ error: "อีเมลไม่ถูกต้อง" });
      const exists = await prisma.user.findUnique({ where: { email } });
      if (exists && exists.id !== target.id) return res.status(409).json({ error: "อีเมลนี้ถูกใช้งานแล้ว" });
      data.email = email;
    }
    const user = await prisma.user.update({ where: { id: target.id }, data });
    res.json(customerPublic(user));
  } catch (err) {
    next(err);
  }
});

router.delete("/customers/:id", async (req, res, next) => {
  try {
    const target = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { orders: true } } },
    });
    if (!target || target.role !== "USER") return res.json({ ok: true });
    if (target._count.orders > 0)
      return res.status(409).json({ error: "ลบไม่ได้ — ลูกค้ามีคำสั่งซื้อแล้ว" });
    await prisma.user.delete({ where: { id: target.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
