import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = Router();

// ค่าเริ่มต้น + ชนิดข้อมูลของแต่ละ setting
const BOOL_KEYS = ["cartDrawerEnabled", "showCardCategory", "showPublisherMarquee", "showCollectionCount", "showPromoRibbon", "showTextMarquee", "transparentHeader"];
const STRING_KEYS = [
  "logoUrl", // โลโก้ร้าน (URL รูป)
  "logoSize", // ความสูงโลโก้ (px) หน้าติดต่อ
  "logoSizeHeader", // ขนาดตัวอักษร SAENGDAO (px) แถบเมนูบน
  "logoSizeFooter", // ขนาดตัวอักษร SAENGDAO (px) ท้ายเว็บ
  "slideInterval", // หน่วงเวลาเปลี่ยนสไลด์ (วินาที)
  "slideAnimation", // เอฟเฟกต์เปลี่ยนสไลด์: fade|slide
  "homeSectionOrder", // ลำดับ section หน้าแรก (JSON array)
  "promptpayId", // เบอร์/เลขบัตร ปชช. พร้อมเพย์
  "promptpayName", // ชื่อบัญชีพร้อมเพย์
  "bankName", // ธนาคาร
  "bankAccountNo", // เลขบัญชี
  "bankAccountName", // ชื่อบัญชี
  // ข้อมูลติดต่อ (สาธารณะ — แสดงบนเว็บ)
  "contactPhone",
  "contactEmail",
  "contactLine",
  "contactAddress",
  "contactHours",
  "socialFacebook",
  "socialInstagram",
  "socialLine",
];
const DEFAULTS = {
  cartDrawerEnabled: true,
  showCardCategory: false, // แสดงชื่อหมวดหมู่บนการ์ดสินค้า (ปิดไว้ตามที่เลือก)
  showPublisherMarquee: true, // แถบโลโก้สำนักพิมพ์เลื่อนวน (หน้าแรก)
  promptpayId: "",
  promptpayName: "",
  bankName: "",
  bankAccountNo: "",
  bankAccountName: "",
  contactPhone: "",
  contactEmail: "",
  contactLine: "",
  contactAddress: "",
  contactHours: "",
  socialFacebook: "",
  socialInstagram: "",
  socialLine: "",
};

// 🔒 กันชั้นสอง (defense-in-depth): key ที่เข้าข่ายความลับ ห้ามหลุดออก client เด็ดขาด
// แม้จะเผลอใส่ไว้ใน whitelist ในอนาคต ก็จะถูกกรองทิ้งตรงนี้
const SECRET_KEY_RE = /secret|apikey|apisecret|password|passwd|token|private|service_role/i;

// อ่านค่าทั้งหมดจาก DB ทับค่า default (เฉพาะ key ที่ whitelist + ไม่ใช่ความลับ)
async function loadSettings() {
  const rows = await prisma.setting.findMany();
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const out = { ...DEFAULTS };
  for (const k of BOOL_KEYS) if (map[k] != null && !SECRET_KEY_RE.test(k)) out[k] = map[k] === "true";
  for (const k of STRING_KEYS) if (map[k] != null && !SECRET_KEY_RE.test(k)) out[k] = map[k];
  // การันตีขั้นสุดท้าย: ไม่มี key ความลับหลงเหลือใน output
  for (const k of Object.keys(out)) if (SECRET_KEY_RE.test(k)) delete out[k];
  return out;
}

// GET /api/settings — ทุกคนอ่านได้ (frontend ใช้ตัดสินใจ UI)
router.get("/", async (req, res, next) => {
  try {
    res.json(await loadSettings());
  } catch (err) {
    next(err);
  }
});

// PATCH /api/settings — เฉพาะ admin
router.patch("/", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const updates = req.body || {};

    for (const key of BOOL_KEYS) {
      if (key in updates) {
        const value = String(!!updates[key]);
        await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
      }
    }
    for (const key of STRING_KEYS) {
      if (key in updates) {
        const value = String(updates[key] ?? "").trim();
        await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
      }
    }

    res.json(await loadSettings());
  } catch (err) {
    next(err);
  }
});

export default router;
