// กู้ฐานข้อมูลจากไฟล์ backup (JSON) — ลบข้อมูลปัจจุบันทั้งหมดแล้วแทนที่
// ใช้: npm run db:restore -- <ไฟล์.json> --yes   (จากโฟลเดอร์ server)
// ⚠️ ทำแบบ transaction เดียว: ถ้าพลาดกลางทางจะย้อนกลับให้เอง (ไม่พังครึ่งๆ)
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import { MODELS } from "./backup-db.js";

const prisma = new PrismaClient();

async function main() {
  const file = process.argv[2];
  const confirmed = process.argv.includes("--yes");

  if (!file || file.startsWith("--")) {
    console.error("ใช้:  npm run db:restore -- <ไฟล์ backup .json> --yes");
    process.exit(1);
  }
  if (!fs.existsSync(file)) {
    console.error("❌ ไม่พบไฟล์:", file);
    process.exit(1);
  }

  const payload = JSON.parse(fs.readFileSync(file, "utf8"));
  const data = payload.data || {};

  console.log("\nจะกู้ข้อมูลจากไฟล์:", file);
  console.log("สร้างเมื่อ:", payload._meta?.createdAt || "-");
  console.table(payload._meta?.counts || {});

  if (!confirmed) {
    console.error("⚠️  คำสั่งนี้จะ **ลบข้อมูลปัจจุบันทั้งหมด** แล้วแทนที่ด้วยไฟล์นี้");
    console.error("    ถ้าแน่ใจ ให้เติม --yes ท้ายคำสั่ง แล้วรันอีกครั้ง");
    process.exit(1);
  }

  await prisma.$transaction(
    async (tx) => {
      // ลบย้อนลำดับ (child → parent) กัน FK
      for (const m of [...MODELS].reverse()) await tx[m].deleteMany();
      // ใส่กลับตามลำดับ (parent → child)
      for (const m of MODELS) {
        const rows = data[m] || [];
        if (rows.length) await tx[m].createMany({ data: rows, skipDuplicates: true });
        console.log(`  ↻ ${m}: ${rows.length}`);
      }
    },
    { timeout: 120000, maxWait: 120000 },
  );

  console.log("\n✅ กู้ข้อมูลเสร็จเรียบร้อย — ลองเปิดเว็บ/หลังบ้านเช็คได้เลย");
}

main()
  .catch((e) => { console.error("❌ restore ล้มเหลว (ข้อมูลเดิมไม่ถูกแตะ):", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
