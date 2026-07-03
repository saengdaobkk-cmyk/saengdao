import { prisma } from "./prisma.js";

export const TERM_TYPES = ["PUBLISHER", "AUTHOR", "TRANSLATOR"];
export const TERM_FIELD = { PUBLISHER: "publisher", AUTHOR: "author", TRANSLATOR: "translator" };
const MULTI = { PUBLISHER: false, AUTHOR: true, TRANSLATOR: true }; // author/translator = หลายชื่อคั่น ,

export function splitNames(v) {
  return [...new Set(String(v || "").split(",").map((s) => s.trim()).filter(Boolean))];
}

// upsert รายชื่อจากหนังสือ 1 เล่มเข้า Term (auto-sync ตอนสร้าง/แก้หนังสือ)
export async function syncTermsFromBook(book) {
  const items = [];
  if (book.publisher?.trim()) items.push({ type: "PUBLISHER", name: book.publisher.trim() });
  for (const n of splitNames(book.author)) items.push({ type: "AUTHOR", name: n });
  for (const n of splitNames(book.translator)) items.push({ type: "TRANSLATOR", name: n });
  for (const it of items) {
    await prisma.term
      .upsert({ where: { type_name: { type: it.type, name: it.name } }, update: {}, create: it })
      .catch(() => {});
  }
}

// รายชื่อ term + จำนวนเล่มที่ใช้
export async function listTermsWithCount(type) {
  const terms = await prisma.term.findMany({ where: { type }, orderBy: { name: "asc" } });
  const field = TERM_FIELD[type];
  const books = await prisma.book.findMany({ select: { [field]: true } });
  const count = new Map();
  for (const b of books) {
    const names = MULTI[type] ? splitNames(b[field]) : b[field]?.trim() ? [b[field].trim()] : [];
    for (const n of names) count.set(n, (count.get(n) || 0) + 1);
  }
  return terms.map((t) => ({ id: t.id, name: t.name, count: count.get(t.name) || 0 }));
}

// เปลี่ยนชื่อ (to) หรือลบ (to=null) รายชื่อในหนังสือทุกเล่มที่ใช้ — คืนจำนวนเล่มที่อัปเดต
export async function renameTermInBooks(type, from, to) {
  const field = TERM_FIELD[type];
  if (!MULTI[type]) {
    const r = await prisma.book.updateMany({ where: { [field]: from }, data: { [field]: to || null } });
    return r.count;
  }
  const books = await prisma.book.findMany({ where: { [field]: { contains: from } } });
  let n = 0;
  for (const b of books) {
    const list = splitNames(b[field]);
    const idx = list.indexOf(from);
    if (idx === -1) continue; // contains อาจ match บางส่วน — เช็ค token ตรง
    if (to) list[idx] = to;
    else list.splice(idx, 1);
    await prisma.book.update({ where: { id: b.id }, data: { [field]: [...new Set(list)].join(", ") || null } });
    n++;
  }
  return n;
}
