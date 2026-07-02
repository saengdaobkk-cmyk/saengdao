import { Router } from "express";
import generatePayload from "promptpay-qr";
import QRCode from "qrcode";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { computeDiscount } from "../lib/coupon.js";
import { uploadSlip } from "../lib/upload.js";
import { storeFile } from "../lib/storage.js";

const router = Router();

const PAYMENT_METHODS = ["PROMPTPAY", "CARD", "TRANSFER"];
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ทุก route ในนี้ต้องล็อกอิน
router.use(authenticate);

// POST /api/orders — สร้างคำสั่งซื้อ
// body: { items:[{bookId, quantity}], shipName, shipPhone, shipAddress, paymentMethod }
router.post("/", async (req, res, next) => {
  try {
    const {
      items,
      shipName,
      shipPhone,
      shipAddress,
      email,
      paymentMethod,
      note,
      discountCode,
      needReceipt,
      receiptSameAsShipping,
      receiptName,
      receiptTaxId,
      receiptAddress,
    } = req.body;

    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: "ตะกร้าว่างเปล่า" });
    if (!shipName || !shipPhone || !shipAddress)
      return res.status(400).json({ error: "กรอกข้อมูลจัดส่งให้ครบ" });
    if (!email || !emailRe.test(email))
      return res.status(400).json({ error: "กรุณากรอกอีเมลให้ถูกต้อง" });
    if (!PAYMENT_METHODS.includes(paymentMethod))
      return res.status(400).json({ error: "เลือกวิธีชำระเงินไม่ถูกต้อง" });

    // ข้อมูลใบเสร็จ — ถ้าออกที่อยู่อื่นต้องกรอกชื่อ+ที่อยู่
    let receipt = { needReceipt: false, receiptName: null, receiptTaxId: null, receiptAddress: null };
    if (needReceipt) {
      const sameAs = receiptSameAsShipping !== false; // default ใช้ข้อมูลเดียวกับจัดส่ง
      if (sameAs) {
        receipt = {
          needReceipt: true,
          receiptName: shipName,
          receiptAddress: shipAddress,
          receiptTaxId: receiptTaxId?.trim() || null,
        };
      } else {
        if (!receiptName || !receiptAddress)
          return res.status(400).json({ error: "กรอกชื่อและที่อยู่สำหรับใบเสร็จให้ครบ" });
        receipt = {
          needReceipt: true,
          receiptName: receiptName.trim(),
          receiptAddress: receiptAddress.trim(),
          receiptTaxId: receiptTaxId?.trim() || null,
        };
      }
      if (receipt.receiptTaxId && !/^\d{13}$/.test(receipt.receiptTaxId))
        return res.status(400).json({ error: "เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก" });
    }

    // สร้างใน transaction: ตรวจสต็อก → คิดราคาจาก DB → ตัดสต็อก
    const order = await prisma.$transaction(async (tx) => {
      const ids = items.map((i) => i.bookId);
      const books = await tx.book.findMany({ where: { id: { in: ids } }, include: { variants: true } });
      const bookMap = new Map(books.map((b) => [b.id, b]));

      let subtotal = 0;
      const orderItems = [];

      for (const item of items) {
        const book = bookMap.get(item.bookId);
        const qty = parseInt(item.quantity);
        if (!book) throw httpError(400, "มีสินค้าในตะกร้าที่ไม่มีขายแล้ว กรุณาล้างตะกร้าแล้วเลือกใหม่");
        if (!qty || qty < 1) throw httpError(400, `จำนวนไม่ถูกต้อง: ${book.title}`);

        if (item.variantId) {
          // ---- ซื้อแบบเลือก variant → ตัดสต็อก/คิดราคาที่ variant ----
          const variant = book.variants.find((v) => v.id === item.variantId);
          if (!variant) throw httpError(400, `ตัวเลือกของ "${book.title}" ไม่มีแล้ว กรุณาเลือกใหม่`);
          if (variant.stock < qty)
            throw httpError(409, `"${book.title} (${variant.name})" มีไม่พอ (เหลือ ${variant.stock})`);

          const price = variant.discountPrice != null ? Number(variant.discountPrice) : Number(variant.price);
          subtotal += price * qty;
          orderItems.push({ bookId: book.id, variantId: variant.id, variantName: variant.name, quantity: qty, price });

          await tx.variant.update({ where: { id: variant.id }, data: { stock: { decrement: qty } } });
        } else {
          // ---- ซื้อทั้งเล่ม (ไม่มี variant) ----
          if (book.variants.length > 0)
            throw httpError(400, `กรุณาเลือกตัวเลือกของ "${book.title}" ก่อน`);
          if (book.stock < qty) throw httpError(409, `"${book.title}" มีไม่พอ (เหลือ ${book.stock})`);

          const price = book.discountPrice != null ? Number(book.discountPrice) : Number(book.price);
          subtotal += price * qty;
          orderItems.push({ bookId: book.id, quantity: qty, price });

          await tx.book.update({ where: { id: book.id }, data: { stock: { decrement: qty } } });
        }
      }

      // คิดส่วนลดฝั่ง server จากโค้ด (กันปลอม) — โยน error ถ้าโค้ดใช้ไม่ได้
      const { coupon, discount } = await computeDiscount(discountCode, subtotal);
      const total = subtotal - discount;

      return tx.order.create({
        data: {
          userId: req.user.id,
          total,
          discount,
          discountCode: coupon?.code || null,
          status: "PENDING",
          paymentMethod,
          paymentStatus: "UNPAID",
          shipName,
          shipPhone,
          shipAddress,
          email,
          note: note?.trim() || null,
          ...receipt,
          items: { create: orderItems },
        },
        include: { items: { include: { book: { select: { title: true } } } } },
      });
    });

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

// GET /api/orders — ประวัติคำสั่งซื้อของฉัน
router.get("/", async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      include: { items: { include: { book: { select: { title: true } } } } },
    });
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:id — รายละเอียดคำสั่งซื้อ (เฉพาะของเจ้าของ)
router.get("/:id", async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: { include: { book: { select: { title: true, author: true } } } } },
    });
    if (!order || order.userId !== req.user.id)
      return res.status(404).json({ error: "ไม่พบคำสั่งซื้อ" });
    res.json(order);
  } catch (err) {
    next(err);
  }
});

// ดึง order ที่เป็นของ user เท่านั้น
async function getOwnedOrder(id, userId) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.userId !== userId) return null;
  return order;
}

async function getSetting(key) {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value || "";
}

// GET /api/orders/:id/promptpay — สร้าง QR PromptPay สำหรับยอดของออเดอร์
router.get("/:id/promptpay", async (req, res, next) => {
  try {
    const order = await getOwnedOrder(req.params.id, req.user.id);
    if (!order) return res.status(404).json({ error: "ไม่พบคำสั่งซื้อ" });

    const promptpayId = await getSetting("promptpayId");
    if (!promptpayId)
      return res.status(400).json({ error: "ร้านยังไม่ได้ตั้งค่าพร้อมเพย์" });

    const amount = Number(order.total);
    const payload = generatePayload(promptpayId, { amount });
    const qr = await QRCode.toDataURL(payload, { margin: 1, width: 480 });

    res.json({
      qr,
      amount,
      promptpayId,
      promptpayName: await getSetting("promptpayName"),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/orders/:id/slip — อัปโหลดสลิป (PromptPay / โอนเงิน)
router.post("/:id/slip", (req, res, next) => {
  uploadSlip(req, res, async (uploadErr) => {
    try {
      if (uploadErr) return res.status(400).json({ error: uploadErr.message });

      const order = await getOwnedOrder(req.params.id, req.user.id);
      if (!order) return res.status(404).json({ error: "ไม่พบคำสั่งซื้อ" });
      if (!req.file) return res.status(400).json({ error: "กรุณาแนบไฟล์สลิป" });

      const slipUrl = await storeFile(req.file, "slip");
      const updated = await prisma.order.update({
        where: { id: order.id },
        data: {
          slipImage: slipUrl,
          paymentStatus: "PENDING_REVIEW", // รอ admin ตรวจ (Phase 6)
        },
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  });
});

function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

export default router;
