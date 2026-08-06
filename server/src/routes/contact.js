import { Router } from "express";
import { sendContactMessage } from "../lib/email.js";

const router = Router();

// POST /api/contact — ฟอร์มติดต่อจากหน้าเว็บ → ส่งอีเมลเข้าร้าน
router.post("/", async (req, res, next) => {
  try {
    const { name, email, phone, message } = req.body || {};
    if (!String(name || "").trim() || !String(message || "").trim())
      return res.status(400).json({ error: "กรอกชื่อและข้อความให้ครบ" });
    const r = await sendContactMessage({
      name: String(name).trim(),
      email: String(email || "").trim(),
      phone: String(phone || "").trim(),
      message: String(message).trim(),
    });
    if (r.ok || r.skipped) return res.json({ ok: true }); // ไม่ทำให้ลูกค้าเห็น error แม้อีเมลยังไม่ตั้งค่า
    return res.status(502).json({ error: r.error || "ส่งข้อความไม่สำเร็จ" });
  } catch (err) {
    next(err);
  }
});

export default router;
