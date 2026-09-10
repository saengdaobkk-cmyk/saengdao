// สำรองฐานข้อมูลทั้งหมดเป็นไฟล์ JSON เดียว (กู้กลับด้วย restore-db.js)
// ใช้: npm run db:backup   (จากโฟลเดอร์ server)
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

// ลำดับ parent → child (สำคัญตอนกู้กลับ: ใส่ parent ก่อน / ลบ child ก่อน)
export const MODELS = [
  "setting", "navItem", "content", "slide", "term", "coupon", "category",
  "user", "discountRule", "shippingMethod", "blogPost", "redirect",
  "book", "variant", "review", "customerNote", "pointEntry", "order", "orderItem",
];

async function main() {
  const data = {};
  const counts = {};
  for (const m of MODELS) {
    const rows = await prisma[m].findMany();
    data[m] = rows;
    counts[m] = rows.length;
  }

  const backupDir = path.join(__dirname, "../../backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const file = path.join(backupDir, `saengdao-db-${stamp}.json`);

  const payload = {
    _meta: {
      app: "saengdao",
      createdAt: new Date().toISOString(),
      models: MODELS,
      counts,
      totalRows: Object.values(counts).reduce((a, b) => a + b, 0),
    },
    data,
  };
  fs.writeFileSync(file, JSON.stringify(payload, null, 2));

  console.log("\n✅ สำรองข้อมูลเสร็จ:", file);
  console.log("   ขนาดไฟล์:", (fs.statSync(file).size / 1024).toFixed(0), "KB · รวม", payload._meta.totalRows, "แถว");
  console.table(counts);
  console.log("\n👉 เก็บไฟล์นี้ไว้ในที่ปลอดภัย (Google Drive/ไดรฟ์นอก) — ห้าม commit ขึ้น git (มีข้อมูลลูกค้า)");
}

main()
  .catch((e) => { console.error("❌ backup ล้มเหลว:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
