import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import { UPLOAD_DIR } from "../lib/storage.js";

const router = Router();
const SUPABASE_URL = process.env.SUPABASE_URL || "";

// GET /api/preview/pdf?src=<url> — คืนไฟล์ PDF เป็น base64 (JSON)
// ทำไมต้องผ่าน API: ตัวดักดาวน์โหลด (IDM/FDM) จับ request ที่เป็น .pdf/application-pdf
// การส่งเป็น JSON base64 เลี่ยงการถูกจับ + จัดการ CORS ของ Supabase ให้ในตัว
// 🔒 whitelist กัน SSRF: รับเฉพาะไฟล์ในระบบเราเท่านั้น
router.get("/pdf", async (req, res, next) => {
  try {
    const src = String(req.query.src || "");
    let buffer;

    if (src.startsWith("/uploads/")) {
      // dev: อ่านจาก disk · basename กัน path traversal
      const file = path.join(UPLOAD_DIR, path.basename(src));
      if (!file.startsWith(UPLOAD_DIR) || !fs.existsSync(file))
        return res.status(404).json({ error: "ไม่พบไฟล์" });
      buffer = fs.readFileSync(file);
    } else if (SUPABASE_URL && src.startsWith(SUPABASE_URL)) {
      // prod: ดึงจาก Supabase Storage ฝั่ง server
      const r = await fetch(src);
      if (!r.ok) return res.status(502).json({ error: "ดึงไฟล์ไม่สำเร็จ" });
      buffer = Buffer.from(await r.arrayBuffer());
    } else {
      return res.status(400).json({ error: "ไม่อนุญาตแหล่งไฟล์นี้" });
    }

    // ไม่ให้ cache — กัน 304 body ว่างทำให้ฝั่ง client ได้ข้อมูลไม่ครบ
    res.set("Cache-Control", "no-store");
    res.json({ data: buffer.toString("base64") });
  } catch (err) {
    next(err);
  }
});

export default router;
