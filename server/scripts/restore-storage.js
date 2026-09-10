// อัปรูปจากโฟลเดอร์ backup กลับเข้า Supabase Storage (bucket uploads)
// ใช้: npm run storage:restore -- ../backups/storage-<วันเวลา>   (จากโฟลเดอร์ server)
// ต้องมีใน .env:  SUPABASE_URL, SUPABASE_SERVICE_KEY  (SUPABASE_BUCKET ไม่ใส่ = "uploads")
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";
const BUCKET = process.env.SUPABASE_BUCKET || "uploads";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ ต้องตั้งค่าใน server/.env ก่อน: SUPABASE_URL, SUPABASE_SERVICE_KEY (ดู Supabase → Settings → API)");
  process.exit(1);
}

const dir = process.argv[2];
if (!dir || dir.startsWith("--") || !fs.existsSync(dir)) {
  console.error("ใช้:  npm run storage:restore -- <โฟลเดอร์ backup รูป>");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const MIME = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
  gif: "image/gif", svg: "image/svg+xml", pdf: "application/pdf",
};

// เดินไฟล์ทุกไฟล์ในโฟลเดอร์แบบ recursive → คืน path เต็ม
function walk(base, rel = "") {
  const out = [];
  for (const name of fs.readdirSync(path.join(base, rel))) {
    const r = rel ? `${rel}/${name}` : name;
    const stat = fs.statSync(path.join(base, r));
    if (stat.isDirectory()) out.push(...walk(base, r));
    else if (name !== "_manifest.json") out.push(r);
  }
  return out;
}

async function main() {
  const keys = walk(dir).map((p) => p.split(path.sep).join("/")); // key ใช้ / เสมอ
  if (!keys.length) { console.log("ℹ️ ไม่พบไฟล์รูปในโฟลเดอร์นี้"); return; }

  console.log(`จะอัป ${keys.length} ไฟล์ กลับเข้า bucket "${BUCKET}" ...`);
  let ok = 0, fail = 0;
  for (const key of keys) {
    const buf = fs.readFileSync(path.join(dir, key));
    const ext = (key.split(".").pop() || "").toLowerCase();
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(key, buf, { contentType: MIME[ext] || "application/octet-stream", upsert: true });
    if (error) { console.warn(`  ⚠️ พลาด ${key}: ${error.message}`); fail++; }
    else { ok++; if (ok % 25 === 0) console.log(`  ...${ok}/${keys.length}`); }
  }
  console.log(`\n✅ อัปรูปกลับเสร็จ — สำเร็จ ${ok} ไฟล์` + (fail ? ` · พลาด ${fail}` : ""));
}

main().catch((e) => { console.error("❌ restore รูปล้มเหลว:", e.message); process.exit(1); });
