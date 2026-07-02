import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CONTENT_DEFAULTS } from "../src/lib/contentDefaults.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding...");

  // --- ข้อความในเว็บ (Content) — upsert ไม่ลบค่าที่ admin แก้ไว้ ---
  for (const c of CONTENT_DEFAULTS) {
    await prisma.content.upsert({
      where: { key: c.key },
      update: { section: c.section, label: c.label, order: c.order ?? 0 },
      create: { ...c, order: c.order ?? 0 },
    });
  }

  // ข้ามการสร้างข้อมูลตัวอย่างถ้ามีหนังสืออยู่แล้ว
  // (กัน id หนังสือเปลี่ยนทุกครั้งที่ seed ซึ่งทำให้ตะกร้าเก่าใน localStorage พัง)
  const existingBooks = await prisma.book.count();
  if (existingBooks > 0) {
    console.log(`⏭️  มีหนังสือ ${existingBooks} เล่มอยู่แล้ว — ข้ามการสร้างข้อมูลตัวอย่าง`);
    await ensureAdmin();
    console.log("✅ Seed (content/admin) done.");
    return;
  }

  // --- โค้ดส่วนลดตัวอย่าง ---
  await prisma.coupon.deleteMany();
  await prisma.coupon.createMany({
    data: [
      { code: "WELCOME10", type: "PERCENT", value: 10 }, // ลด 10%
      { code: "SAVE50", type: "FIXED", value: 50, minSubtotal: 300 }, // ลด 50 บาท (ขั้นต่ำ 300)
    ],
  });

  // --- Categories ---
  const fiction = await prisma.category.create({ data: { name: "นิยาย", slug: "fiction" } });
  const business = await prisma.category.create({ data: { name: "ธุรกิจ/การลงทุน", slug: "business" } });
  const children = await prisma.category.create({ data: { name: "หนังสือเด็ก", slug: "children" } });
  const selfdev = await prisma.category.create({ data: { name: "พัฒนาตัวเอง", slug: "self-development" } });

  // --- Books (soldCount = ยอดขาย ใช้จัด "ขายดี") ---
  const books = [
    { title: "เจ้าชายน้อย", author: "อ็องตวน เดอ แซ็งเตกซูว์เปรี", price: 195, stock: 30, soldCount: 420, categoryId: fiction.id },
    { title: "พ่อรวยสอนลูก", author: "Robert Kiyosaki", price: 295, stock: 50, soldCount: 980, categoryId: business.id },
    { title: "Atomic Habits", author: "James Clear", price: 275, stock: 40, soldCount: 1250, categoryId: selfdev.id },
    { title: "แฮร์รี่ พอตเตอร์ เล่ม 1", author: "J.K. Rowling", price: 350, stock: 25, soldCount: 760, categoryId: fiction.id },
    { title: "นิทานก่อนนอนสำหรับเด็ก", author: "สำนักพิมพ์ตัวอย่าง", price: 150, stock: 60, soldCount: 210, categoryId: children.id },
    { title: "The Psychology of Money", author: "Morgan Housel", price: 285, stock: 35, soldCount: 1100, categoryId: business.id },
    { title: "Sapiens ประวัติย่อมนุษยชาติ", author: "Yuval Noah Harari", price: 395, stock: 20, soldCount: 890, categoryId: selfdev.id },
    { title: "วิธีชนะมิตรและจูงใจคน", author: "Dale Carnegie", price: 245, stock: 45, soldCount: 670, categoryId: selfdev.id },
    { title: "1984", author: "George Orwell", price: 265, stock: 18, soldCount: 540, categoryId: fiction.id },
    { title: "ลงทุนหุ้นฉบับมือใหม่", author: "ทีมการเงิน", price: 320, stock: 28, soldCount: 430, categoryId: business.id },
    { title: "ABC สัตว์น้อยน่ารัก", author: "สำนักพิมพ์เด็กดี", price: 180, stock: 55, soldCount: 320, categoryId: children.id },
    { title: "คิดแบบยิว ทำแบบญี่ปุ่น", author: "ผู้เขียนรับเชิญ", price: 230, stock: 33, soldCount: 150, categoryId: business.id },
  ];

  // create ทีละเล่มให้ createdAt ต่างกัน (ใช้จัด "มาใหม่")
  for (const b of books) {
    await prisma.book.create({ data: b });
  }

  await ensureAdmin();

  // --- สไลด์ hero หน้าแรก (ตัวอย่าง) ---
  await prisma.slide.deleteMany();
  await prisma.slide.createMany({
    data: [
      { eyebrow: "SAENGDAO · ร้านหนังสือแสงดาว", title: "อ่านเล่มโปรด\nได้ทุกที่", subtitle: "คัดหนังสือดีมาเพื่อคุณ ส่งถึงบ้านทั่วประเทศ", ctaText: "เลือกซื้อเลย", ctaLink: "#catalog", bgColor: "#1d1d1f", dark: true, order: 1 },
      { eyebrow: "มาใหม่", title: "เล่มใหม่\nที่ทุกคนรอ", subtitle: "อัปเดตหนังสือออกใหม่ก่อนใคร", ctaText: "ดูเล่มใหม่", ctaLink: "#catalog", bgColor: "#eceef1", dark: false, order: 2 },
      { eyebrow: "คัดสรรพิเศษ", title: "เปลี่ยนเวลาว่าง\nให้มีความหมาย", subtitle: "นิยาย ธุรกิจ และหนังสือเด็ก ครบในที่เดียว", ctaText: "เริ่มอ่าน", ctaLink: "#catalog", bgColor: "#f5f5f7", dark: false, order: 3 },
    ],
  });

  // --- ค่าตั้งต้นการชำระเงิน (ตัวอย่าง — แก้ได้ในจัดการร้าน) ---
  const settings = [
    { key: "promptpayId", value: "0812345678" },
    { key: "promptpayName", value: "ร้านหนังสือแสงดาว" },
    { key: "bankName", value: "ธนาคารกสิกรไทย" },
    { key: "bankAccountNo", value: "123-4-56789-0" },
    { key: "bankAccountName", value: "บจก. แสงดาว บุ๊คสโตร์" },
  ];
  for (const s of settings) {
    await prisma.setting.upsert({ where: { key: s.key }, update: {}, create: s });
  }

  console.log(`✅ Seed done. ${books.length} books, 4 categories, payment settings. Admin: admin@bookstore.com / admin1234`);
}

// สร้าง/คงบัญชี admin ไว้เสมอ
async function ensureAdmin() {
  await prisma.user.upsert({
    where: { email: "admin@bookstore.com" },
    update: {},
    create: {
      email: "admin@bookstore.com",
      password: await bcrypt.hash("admin1234", 10),
      name: "Admin",
      role: "ADMIN",
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
