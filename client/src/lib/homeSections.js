// section หน้าแรก ที่สลับลำดับได้ (ใช้ร่วมกันระหว่างหน้าร้าน + admin)
export const HOME_SECTIONS = [
  { key: "hero", label: "สไลด์หน้าแรก (Hero)" },
  { key: "hotdeal", label: "Hot Deal" },
  { key: "new", label: "หนังสือมาใหม่" },
  { key: "bestseller", label: "หนังสือขายดี" },
  { key: "browse", label: "หมวดหมู่ (Browse)" },
  { key: "recommend", label: "แนะนำสำหรับคุณ (กริด)" },
  { key: "textmarquee", label: "แถบตัวอักษรเลื่อน" },
  { key: "ribbon", label: "แถบโปรโมชั่นเอียง" },
  { key: "brands", label: "สำนักพิมพ์" },
  { key: "blog", label: "บทความ / บล็อก" },
];

export const DEFAULT_ORDER = HOME_SECTIONS.map((s) => s.key);
export const SECTION_LABEL = Object.fromEntries(HOME_SECTIONS.map((s) => [s.key, s.label]));

// ตัวเลือกเรียงลำดับสำหรับโหมดอัตโนมัติ
export const ROW_SORTS = [
  { value: "newest", label: "หนังสือมาใหม่ (ล่าสุดก่อน)" },
  { value: "popular", label: "ขายดี (ขายมากก่อน)" },
  { value: "price_asc", label: "ราคาถูก → แพง" },
  { value: "price_desc", label: "ราคาแพง → ถูก" },
];

// section แถวหนังสือที่แก้ไขได้ (หัวข้อ/คำโปรย/โหมด) + ค่าเริ่มต้น
export const ROW_DEFAULTS = {
  new: { title: "มาใหม่", subtitle: "หนังสืออัปเดตล่าสุดจากเรา", mode: "auto", sort: "newest", bookIds: [] },
  bestseller: { title: "ขายดี", subtitle: "เล่มที่นักอ่านเลือกมากที่สุด", mode: "auto", sort: "popular", bookIds: [] },
  hotdeal: { title: "Hot Deal", subtitle: "ราคาพิเศษ มีเวลาจำกัด", mode: "auto", sort: "newest", bookIds: [] },
  recommend: { title: "แนะนำสำหรับคุณ", subtitle: "คัดสรรมาเพื่อนักอ่านทุกคน", mode: "auto", sort: "popular", bookIds: [] },
  blog: { title: "บทความ", subtitle: "เรื่องเล่า รีวิว และแรงบันดาลใจจากหนังสือ", mode: "auto", sort: "newest", bookIds: [] },
};
export const ROW_KEYS = Object.keys(ROW_DEFAULTS);
// แถว built-in ที่เลือกหนังสือเอง/อัตโนมัติได้ (Hot Deal/บทความ ดึงอัตโนมัติ แก้ได้แค่หัวข้อ/คำโปรย)
export const BOOKS_EDITABLE_KEYS = ["new", "bestseller", "recommend"];

// แถวที่ผู้ใช้สร้างเอง — เก็บใน setting homeCustomRows (JSON array)
export function parseCustomRows(raw) {
  let arr = [];
  try {
    const p = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Array.isArray(p)) arr = p;
  } catch { /* ว่าง */ }
  return arr
    .filter((r) => r && typeof r.id === "string")
    .map((r) => ({
      id: r.id,
      title: typeof r.title === "string" && r.title.trim() ? r.title : "แถวหนังสือ",
      subtitle: typeof r.subtitle === "string" ? r.subtitle : "",
      mode: r.mode === "manual" ? "manual" : "auto",
      sort: ROW_SORTS.some((s) => s.value === r.sort) ? r.sort : "newest",
      bookIds: Array.isArray(r.bookIds) ? r.bookIds.filter((x) => typeof x === "string") : [],
    }));
}

// สร้างแถวใหม่ (id สุ่ม) + คีย์สำหรับลำดับ section
export function newCustomRow() {
  const id = (crypto.randomUUID?.() || String(Date.now())).slice(0, 8);
  return { id, title: "แถวหนังสือใหม่", subtitle: "", mode: "auto", sort: "newest", bookIds: [] };
}
export const customKey = (id) => `custom:${id}`;
export const isCustomKey = (k) => typeof k === "string" && k.startsWith("custom:");
export const customIdOf = (k) => (isCustomKey(k) ? k.slice(7) : null);

// อ่านค่าตั้งค่าแถวหนังสือจาก setting (JSON) → merge ทับ default (กันค่าหาย/ผิดชนิด)
export function parseRows(raw) {
  let obj = {};
  try {
    const p = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (p && typeof p === "object") obj = p;
  } catch { /* ใช้ค่าเริ่มต้น */ }
  const out = {};
  for (const k of ROW_KEYS) {
    const d = ROW_DEFAULTS[k];
    const c = obj[k] || {};
    out[k] = {
      title: typeof c.title === "string" && c.title.trim() ? c.title : d.title,
      subtitle: typeof c.subtitle === "string" ? c.subtitle : d.subtitle,
      mode: c.mode === "manual" ? "manual" : "auto",
      sort: ROW_SORTS.some((s) => s.value === c.sort) ? c.sort : d.sort,
      bookIds: Array.isArray(c.bookIds) ? c.bookIds.filter((x) => typeof x === "string") : [],
    };
  }
  return out;
}

// อ่านลำดับจากค่า setting (JSON) → คืน array ที่ถูกต้อง + เติม section ที่ยังไม่มีต่อท้าย
// customKeys = คีย์ของแถวที่ผู้ใช้สร้างเอง (custom:<id>) — เก็บเฉพาะที่ยังมีอยู่จริง
export function parseOrder(raw, customKeys = []) {
  const validCustom = new Set(customKeys);
  let arr = [];
  try {
    const p = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Array.isArray(p)) arr = p.filter((k) => DEFAULT_ORDER.includes(k) || validCustom.has(k));
  } catch { /* ใช้ค่าเริ่มต้น */ }
  for (const k of DEFAULT_ORDER) if (!arr.includes(k)) arr.push(k);
  for (const k of customKeys) if (!arr.includes(k)) arr.push(k); // แถวที่เพิ่งสร้าง → ต่อท้าย
  return arr;
}
