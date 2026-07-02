import { createClient } from "@supabase/supabase-js";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_DIR = path.join(__dirname, "../../uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// 🔒 service key ใช้ฝั่ง server เท่านั้น (ดู never-expose-secrets)
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";
const BUCKET = process.env.SUPABASE_BUCKET || "uploads";

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null;

export const usingSupabase = !!supabase;

function extOf(file) {
  const e = (file.originalname?.split(".").pop() || "").toLowerCase();
  return e && e.length <= 5 ? e : file.mimetype === "application/pdf" ? "pdf" : "jpg";
}

// เก็บไฟล์ (buffer จาก multer memoryStorage) → คืน URL
// prod: Supabase Storage (URL เต็ม) · dev/ไม่ได้ตั้งค่า: local disk (/uploads/..)
export async function storeFile(file, prefix = "file") {
  const name = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e6)}.${extOf(file)}`;

  if (supabase) {
    const key = `${prefix}/${name}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(key, file.buffer, { contentType: file.mimetype, upsert: false });
    if (error) throw new Error("อัปโหลดไป Supabase ไม่สำเร็จ: " + error.message);
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(key);
    return data.publicUrl;
  }

  // fallback: เขียนลง disk (สำหรับ dev)
  fs.writeFileSync(path.join(UPLOAD_DIR, name), file.buffer);
  return `/uploads/${name}`;
}
