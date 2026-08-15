import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = Router();

// ค่าเริ่มต้น + ชนิดข้อมูลของแต่ละ setting
const BOOL_KEYS = ["cartDrawerEnabled", "showCardCategory", "showPublisherMarquee", "showCollectionCount", "showPromoRibbon", "showTextMarquee", "transparentHeader", "loyaltyEnabled", "showProductTrust", "showBlogShare", "turnstileEnabled", "contactMapEnabled", "productStickyCover"];
const STRING_KEYS = [
  "logoUrl", // โลโก้ร้าน (URL รูป)
  "lineQrUrl", // QR LINE (URL รูป) — แสดงบนใบปะหน้าพัสดุ
  "logoSize", // ความสูงโลโก้ (px) หน้าติดต่อ
  "headerLogoOnLight", // โลโก้รูปบนแถบเมนู — พื้นสว่าง (แถบขาว)
  "headerLogoOnDark", // โลโก้รูปบนแถบเมนู — พื้นเข้ม (ทับสไลด์)
  "headerLogoSize", // ความสูงโลโก้รูปบนแถบเมนู (px)
  "logoSizeHeader", // ขนาดตัวอักษร SAENGDAO (px) แถบเมนูบน
  "logoSizeFooter", // ขนาดตัวอักษร SAENGDAO (px) ท้ายเว็บ
  "slideInterval", // หน่วงเวลาเปลี่ยนสไลด์ (วินาที)
  "slideAnimation", // เอฟเฟกต์เปลี่ยนสไลด์: fade|slide
  "homeSectionOrder", // ลำดับ section หน้าแรก (JSON array)
  "homeRows", // ตั้งค่าแถวหนังสือหน้าแรก: หัวข้อ/คำโปรย/โหมดอัตโนมัติ-เลือกเอง (JSON)
  "homeCustomRows", // แถวหนังสือที่แอดมินสร้างเอง (JSON array)
  "homeBanner", // แบนเนอร์ภาพตรึง parallax หน้าแรก (JSON เดี่ยว)
  "homeAuthorSpotlight", // ผู้เขียนประจำเดือน หน้าแรก (JSON เดี่ยว)
  "coverTypeOptions", // ตัวเลือกประเภทปก (JSON array)
  "paperTypeOptions", // ตัวเลือกกระดาษเนื้อใน (JSON array)
  "dimensionUnit", // หน่วยขนาด (เติมท้ายอัตโนมัติ) เช่น "cm."
  "weightUnit", // หน่วยน้ำหนัก (เติมท้ายอัตโนมัติ) เช่น "g"
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
  "contactMapUrl", // แผนที่ร้าน — ลิงก์ Google Maps embed หรือโค้ด iframe (เว้นว่าง = สร้างจากที่อยู่อัตโนมัติ)
  "socialFacebook",
  "socialInstagram",
  "socialLine",
  "loyaltyBahtPerPoint", // ยอดซื้อ (บาท) ต่อ 1 แต้ม เช่น 100 = ทุก 100 บาทได้ 1 แต้ม
  "loyaltyPointValue", // มูลค่า 1 แต้ม (บาท) เวลานำมาแลกส่วนลด เช่น 1 = 1 แต้ม = 1 บาท
  "orderExpiryDays", // ออเดอร์ที่ยังไม่ชำระเกินกี่วัน = ยกเลิกอัตโนมัติ (0 = ปิด)
  "footerLogoText", // ข้อความโลโก้ที่ footer (ใช้เมื่อไม่มีรูป)
  "footerLogoUrl", // โลโก้ที่ footer (รูปภาพ) — มีรูปใช้รูปก่อน
  "footerLogoSize", // ความสูงโลโก้รูปที่ footer (px)
  "footerNav", // เมนู footer (JSON array ของ { label, url })
  "turnstileSiteKey", // Cloudflare Turnstile — Site Key (public)
  "turnstileSecretKey", // 🔒 Secret Key — บันทึกได้ แต่ SECRET_KEY_RE กรองไม่ให้หลุด client
];
const DEFAULTS = {
  cartDrawerEnabled: true,
  showCardCategory: false, // แสดงชื่อหมวดหมู่บนการ์ดสินค้า (ปิดไว้ตามที่เลือก)
  showPublisherMarquee: true, // แถบโลโก้สำนักพิมพ์เลื่อนวน (หน้าแรก)
  showProductTrust: true, // แถบจุดเด่น (จัดส่งฟรี/รับประกัน) ในหน้าสินค้า
  showBlogShare: true, // ปุ่มแชร์ในหน้าบทความ
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
  contactMapEnabled: false,
  contactMapUrl: "",
  socialFacebook: "",
  socialInstagram: "",
  socialLine: "",
  loyaltyEnabled: false,
  loyaltyBahtPerPoint: "100",
  loyaltyPointValue: "1",
  orderExpiryDays: "7",
  headerLogoOnLight: "",
  headerLogoOnDark: "",
  headerLogoSize: "28",
  footerLogoText: "SAENGDAO",
  footerLogoUrl: "",
  footerLogoSize: "36",
  footerNav: JSON.stringify([
    { label: "หนังสือ", url: "/books" },
    { label: "ติดตามคำสั่งซื้อ", url: "/track" },
    { label: "เกี่ยวกับเรา", url: "/about" },
    { label: "ติดต่อ", url: "/contact" },
  ]),
  coverTypeOptions: JSON.stringify(["ปกอ่อน", "ปกแข็ง"]),
  paperTypeOptions: JSON.stringify(["กระดาษถนอมสายตา", "กระดาษปอนด์", "กระดาษอาร์ตมัน"]),
  dimensionUnit: "cm.",
  weightUnit: "g",
  turnstileEnabled: false,
  turnstileSiteKey: "",
  productStickyCover: false, // ปกสินค้าค้าง (sticky) ตอนเลื่อน
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
