// เมนูเริ่มต้น (ใช้ตอน DB ว่าง / seed ครั้งแรก)
export const DEFAULT_NAV = [
  { label: "หน้าแรก", url: "/", order: 0 },
  { label: "หนังสือ", url: "/books", order: 1 },
  { label: "นิยาย", url: "/books?category=fiction", order: 2 },
  { label: "ธุรกิจ", url: "/books?category=business", order: 3 },
  { label: "เด็ก", url: "/books?category=children", order: 4 },
  { label: "เกี่ยวกับเรา", url: "/about", order: 5 },
  { label: "ติดต่อ", url: "/contact", order: 6 },
];

// สร้าง default ถ้าตารางว่าง — คืนรายการทั้งหมด
export async function ensureNav(prisma) {
  const count = await prisma.navItem.count();
  if (count === 0) {
    await prisma.navItem.createMany({ data: DEFAULT_NAV });
  }
  return prisma.navItem.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
}
