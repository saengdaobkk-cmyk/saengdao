// สำรองรูปทั้งหมดจาก Supabase Storage (bucket uploads) ลงเครื่อง
// ใช้: npm run storage:backup   (จากโฟลเดอร์ server)
// ต้องมีใน .env:  SUPABASE_URL, SUPABASE_SERVICE_KEY  (SUPABASE_BUCKET ไม่ใส่ = "uploads")
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";
const BUCKET = process.env.SUPABASE_BUCKET || "uploads";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ ต้องตั้งค่าใน server/.env ก่อน:");
  console.error("   SUPABASE_URL=https://xxxx.supabase.co");
  console.error("   SUPABASE_SERVICE_KEY=... (service_role key)");
  console.error("   ดูได้ที่ Supabase Dashboard → Settings → API  (หรือก๊อปจาก env ฝั่ง Hostinger)");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// list แบบ recursive (Supabase list ไม่ recursive เอง — โฟลเดอร์ = item ที่ id เป็น null)
async function listAll(prefix = "") {
  const files = [];
  let offset = 0;
  const LIMIT = 100;
  for (;;) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(prefix, { limit: LIMIT, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw new Error(`list "${prefix}" ล้มเหลว: ${error.message}`);
    if (!data || !data.length) break;
    for (const item of data) {
      const full = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) files.push(...(await listAll(full))); // โฟลเดอร์ → ลงลึก
      else files.push(full);
    }
    if (data.length < LIMIT) break;
    offset += LIMIT;
  }
  return files;
}

async function main() {
  console.log(`กำลังอ่านรายการไฟล์จาก bucket "${BUCKET}" ...`);
  const keys = await listAll();
  if (!keys.length) {
    console.log("ℹ️  ไม่พบไฟล์ใน bucket นี้");
    return;
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outDir = path.join(__dirname, "../../backups", `storage-${stamp}`);
  fs.mkdirSync(outDir, { recursive: true });

  let ok = 0, fail = 0, bytes = 0;
  for (const key of keys) {
    const { data, error } = await supabase.storage.from(BUCKET).download(key);
    if (error || !data) { console.warn(`  ⚠️ ข้าม ${key}: ${error?.message || "no data"}`); fail++; continue; }
    const buf = Buffer.from(await data.arrayBuffer());
    const dest = path.join(outDir, key);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buf);
    ok++; bytes += buf.length;
    if (ok % 25 === 0) console.log(`  ...${ok}/${keys.length}`);
  }

  // manifest รายการไฟล์ทั้งหมด
  fs.writeFileSync(path.join(outDir, "_manifest.json"),
    JSON.stringify({ bucket: BUCKET, createdAt: new Date().toISOString(), count: ok, files: keys }, null, 2));

  console.log(`\n✅ สำรองรูปเสร็จ: ${outDir}`);
  console.log(`   สำเร็จ ${ok} ไฟล์ · ${(bytes / 1024 / 1024).toFixed(1)} MB` + (fail ? ` · พลาด ${fail}` : ""));
  console.log("\n👉 เก็บโฟลเดอร์นี้ไว้นอกเครื่องด้วย (Google Drive/ไดรฟ์นอก) — ห้าม commit ขึ้น git");
}

main().catch((e) => { console.error("❌ backup รูปล้มเหลว:", e.message); process.exit(1); });
