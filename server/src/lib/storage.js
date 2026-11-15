import { createClient } from "@supabase/supabase-js";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_DIR = path.join(__dirname, "../../uploads");
// prod ใช้ Supabase Storage — โฟลเดอร์ local ไว้ fallback ตอน dev เท่านั้น
// ห่อ try/catch กัน boot ล่มบนโฮสต์ที่ path เขียนไม่ได้ (read-only filesystem)
try { fs.mkdirSync(UPLOAD_DIR, { recursive: true }); } catch { /* ข้าม — prod ไม่ต้องใช้ */ }

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

// รายการไฟล์ทั้งหมดในคลัง (ปก/แบนเนอร์/PDF ฯลฯ) — คืน { key, url, size, createdAt }
export async function listUploads() {
  if (supabase) {
    const walk = async (prefix = "") => {
      const out = [];
      let offset = 0;
      for (;;) {
        const { data, error } = await supabase.storage
          .from(BUCKET)
          .list(prefix, { limit: 100, offset, sortBy: { column: "created_at", order: "desc" } });
        if (error) throw new Error(error.message);
        if (!data || !data.length) break;
        for (const item of data) {
          const full = prefix ? `${prefix}/${item.name}` : item.name;
          if (item.id === null) out.push(...(await walk(full))); // โฟลเดอร์ → ลงลึก
          else out.push({ key: full, size: item.metadata?.size || 0, createdAt: item.created_at || item.updated_at || null });
        }
        if (data.length < 100) break;
        offset += 100;
      }
      return out;
    };
    const files = await walk();
    files.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    return files.map((f) => ({ ...f, url: supabase.storage.from(BUCKET).getPublicUrl(f.key).data.publicUrl }));
  }
  // dev: อ่านจาก disk
  const out = [];
  const walkDisk = (dir, rel = "") => {
    let names = [];
    try { names = fs.readdirSync(dir); } catch { return; }
    for (const name of names) {
      const full = path.join(dir, name);
      const r = rel ? `${rel}/${name}` : name;
      const st = fs.statSync(full);
      if (st.isDirectory()) walkDisk(full, r);
      else out.push({ key: r, size: st.size, createdAt: st.mtime.toISOString(), url: `/uploads/${r}` });
    }
  };
  walkDisk(UPLOAD_DIR);
  out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return out;
}

// ลบไฟล์จากคลัง
export async function deleteUpload(key) {
  const k = String(key || "").replace(/^\/+/, "").replace(/^uploads\//, "");
  if (!k) throw new Error("ไม่พบไฟล์");
  if (supabase) {
    const { error } = await supabase.storage.from(BUCKET).remove([k]);
    if (error) throw new Error(error.message);
    return;
  }
  const p = path.join(UPLOAD_DIR, k);
  if (p.startsWith(UPLOAD_DIR) && fs.existsSync(p)) fs.unlinkSync(p);
}
