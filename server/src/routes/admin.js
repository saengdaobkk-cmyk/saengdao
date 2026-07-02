import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { uploadImage, uploadImages, uploadPdf } from "../lib/upload.js";
import { storeFile } from "../lib/storage.js";
import { CONTENT_DEFAULTS, SECTION_LABELS } from "../lib/contentDefaults.js";
import { ZK, ZORT_DEFAULT_BASE, getZortConfig, testZortConnection, pushOrderToZort } from "../lib/zort.js";

const router = Router();
router.use(authenticate, requireAdmin); // ทุก endpoint เฉพาะ admin

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
    stock: int(body.stock) ?? 0,
    soldCount: int(body.soldCount) ?? 0,
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

        await prisma.book.create({
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
    const cat = await prisma.category.create({ data: { name, slug } });
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
    const cat = await prisma.category.update({ where: { id: req.params.id }, data: { name, slug } });
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

/* ---------- Publishers (เก็บเป็น string ใน Book) ---------- */
// เปลี่ยนชื่อ/รวมสำนักพิมพ์ — อัปเดตทุกเล่มที่ใช้ · to ว่าง = ล้างค่า
router.patch("/publishers", async (req, res, next) => {
  try {
    const from = String(req.body.from || "").trim();
    const to = String(req.body.to || "").trim();
    if (!from) return res.status(400).json({ error: "ระบุสำนักพิมพ์เดิม" });
    const r = await prisma.book.updateMany({
      where: { publisher: from },
      data: { publisher: to || null },
    });
    res.json({ updated: r.count });
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
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

const ORDER_TEXT_FIELDS = [
  "shipName", "shipPhone", "shipAddress", "email", "note",
  "receiptName", "receiptTaxId", "receiptAddress",
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

router.get("/integrations", async (req, res, next) => {
  try {
    res.json({ zort: publicZort(await getZortConfig()) });
  } catch (err) {
    next(err);
  }
});

router.patch("/integrations", async (req, res, next) => {
  try {
    const z = req.body?.zort || {};
    const set = (key, value) =>
      prisma.setting.upsert({ where: { key }, update: { value: String(value) }, create: { key, value: String(value) } });

    if ("enabled" in z) await set(ZK.enabled, !!z.enabled);
    if ("storename" in z) await set(ZK.storename, z.storename?.trim() || "");
    if ("apikey" in z) await set(ZK.apikey, z.apikey?.trim() || "");
    if ("baseUrl" in z) await set(ZK.baseUrl, z.baseUrl?.trim() || ZORT_DEFAULT_BASE);
    // apisecret อัปเดตเฉพาะเมื่อกรอกใหม่ (เว้นว่าง = คงของเดิม)
    if (z.apisecret) await set(ZK.apisecret, z.apisecret.trim());

    res.json({ zort: publicZort(await getZortConfig()) });
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

export default router;
