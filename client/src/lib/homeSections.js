// section หน้าแรก ที่สลับลำดับได้ (ใช้ร่วมกันระหว่างหน้าร้าน + admin)
export const HOME_SECTIONS = [
  { key: "hero", label: "สไลด์หน้าแรก (Hero)" },
  { key: "banner", label: "แบนเนอร์ภาพตรึง (Parallax)" },
  { key: "hotdeal", label: "Hot Deal" },
  { key: "new", label: "หนังสือมาใหม่" },
  { key: "bestseller", label: "หนังสือขายดี" },
  { key: "browse", label: "หมวดหมู่ (Browse)" },
  { key: "recommend", label: "แนะนำสำหรับคุณ (กริด)" },
  { key: "textmarquee", label: "แถบตัวอักษรเลื่อน" },
  { key: "ribbon", label: "แถบโปรโมชั่นเอียง" },
  { key: "brands", label: "สำนักพิมพ์" },
  { key: "author", label: "ผู้เขียนประจำเดือน" },
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
  { value: "random", label: "สุ่ม (เปลี่ยนไปเรื่อยๆ)" },
];

export const ROW_LIMIT_MAX = 30; // จำนวนเล่มสูงสุดต่อแถว (โหมดอัตโนมัติ + เลือกเอง)
const clampLimit = (v, def) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 1 ? Math.min(n, ROW_LIMIT_MAX) : def;
};

// section แถวหนังสือที่แก้ไขได้ (หัวข้อ/คำโปรย/โหมด/จำนวน) + ค่าเริ่มต้น
export const ROW_DEFAULTS = {
  new: { title: "มาใหม่", subtitle: "หนังสืออัปเดตล่าสุดจากเรา", mode: "auto", sort: "newest", limit: 10, bookIds: [] },
  bestseller: { title: "ขายดี", subtitle: "เล่มที่นักอ่านเลือกมากที่สุด", mode: "auto", sort: "popular", limit: 10, bookIds: [] },
  hotdeal: { title: "Hot Deal", subtitle: "ราคาพิเศษ มีเวลาจำกัด", mode: "auto", sort: "newest", limit: 10, bookIds: [] },
  recommend: { title: "แนะนำสำหรับคุณ", subtitle: "คัดสรรมาเพื่อนักอ่านทุกคน", mode: "auto", sort: "popular", limit: 12, bookIds: [] },
  blog: { title: "บทความ", subtitle: "เรื่องเล่า รีวิว และแรงบันดาลใจจากหนังสือ", mode: "auto", sort: "newest", limit: 4, bookIds: [] },
  browse: { title: "หมวดหมู่หนังสือ", subtitle: "เลือกอ่านตามหมวดที่คุณสนใจ", mode: "auto", sort: "newest", limit: 10, bookIds: [] },
  brands: { title: "สำนักพิมพ์ที่คัดสรร", subtitle: "รวมสำนักพิมพ์ชั้นนำที่เราภูมิใจนำเสนอ", mode: "auto", sort: "newest", limit: 10, bookIds: [] },
};
export const ROW_KEYS = Object.keys(ROW_DEFAULTS);

// ---- แบนเนอร์ภาพตรึง (parallax) — เก็บใน setting homeBanner (JSON เดี่ยว) ----
export const BANNER_HEIGHTS = [
  { value: "sm", label: "เตี้ย" },
  { value: "md", label: "กลาง" },
  { value: "lg", label: "สูง" },
];
export const BANNER_PARALLAX_MAX = 400; // ระยะขยับ parallax สูงสุด (px)
export const BANNER_DEFAULT = {
  enabled: true,
  image: "",
  title: "ของขวัญสุดพิเศษ",
  subtitle: "มอบหนังสือดีๆ ให้คนที่คุณรัก",
  buttonText: "เลือกซื้อเลย",
  buttonLink: "/books",
  height: "md",
  overlay: 25, // ความเข้มฉากมืดทับรูป (%) เพื่อให้ตัวอักษรอ่านชัด — 0..60
  align: "center", // ตำแหน่งข้อความ แนวนอน: left | center | right
  valign: "middle", // ตำแหน่งข้อความ แนวตั้ง: top | middle | bottom
  imageX: "center", // โฟกัสรูป แนวนอน: left | center | right
  imageY: "center", // โฟกัสรูป แนวตั้ง: top | center | bottom
  parallax: 220, // ระยะขยับภาพ parallax (px) — 0 = ปิด (ภาพนิ่ง)
};
export function parseBanner(raw) {
  let o = {};
  try {
    const p = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (p && typeof p === "object") o = p;
  } catch { /* ใช้ค่าเริ่มต้น */ }
  const d = BANNER_DEFAULT;
  const str = (v, def) => (typeof v === "string" ? v : def);
  // โฟกัสรูป: รับทั้งคำ preset และเปอร์เซ็นต์ "NN%" (0-100)
  const focus = (v, allow, def) => {
    if (typeof v === "string" && /^\d{1,3}%$/.test(v.trim())) {
      const n = parseFloat(v);
      if (n >= 0 && n <= 100) return `${Math.round(n)}%`;
    }
    return allow.includes(v) ? v : def;
  };
  return {
    enabled: o.enabled !== false,
    image: str(o.image, d.image),
    title: str(o.title, d.title),
    subtitle: str(o.subtitle, d.subtitle),
    buttonText: str(o.buttonText, d.buttonText),
    buttonLink: str(o.buttonLink, d.buttonLink),
    height: BANNER_HEIGHTS.some((h) => h.value === o.height) ? o.height : d.height,
    overlay: Math.min(60, Math.max(0, Math.round(Number(o.overlay)) || 0)),
    align: o.align === "left" || o.align === "right" ? o.align : "center",
    valign: o.valign === "top" || o.valign === "bottom" ? o.valign : "middle",
    imageX: focus(o.imageX, ["left", "center", "right"], "center"),
    imageY: focus(o.imageY, ["top", "center", "bottom"], "center"),
    parallax: Math.min(BANNER_PARALLAX_MAX, Math.max(0, o.parallax == null ? d.parallax : Math.round(Number(o.parallax)) || 0)),
  };
}
// ---- ผู้เขียนประจำเดือน (Author of the Month) — เก็บใน setting homeAuthorSpotlight (JSON เดี่ยว) ----
export const AUTHOR_SPOTLIGHT_MAX = 6; // จำนวนหนังสือฝั่งขวาสูงสุด
export const AUTHOR_SPOTLIGHT_DEFAULT = {
  enabled: true,
  eyebrow: "ผู้เขียนประจำเดือน",
  name: "", // ชื่อผู้เขียน (ใช้ดึงหนังสือของเขาแบบอัตโนมัติด้วย)
  bio: "", // ประวัติย่อ
  photo: "", // รูปผู้เขียน (วงกลม)
  buttonText: "ดูผลงานทั้งหมด",
  featuredBookId: "", // ปกใหญ่ฝั่งซ้าย (เลือกหนังสือ 1 เล่ม)
  mode: "auto", // auto = ดึงหนังสือของผู้เขียนนี้ | manual = เลือกเอง
  bookIds: [], // หนังสือฝั่งขวา (โหมดเลือกเอง)
  limit: 3, // จำนวนหนังสือฝั่งขวา (โหมดอัตโนมัติ)
};
export function parseAuthorSpotlight(raw) {
  let o = {};
  try {
    const p = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (p && typeof p === "object") o = p;
  } catch { /* ใช้ค่าเริ่มต้น */ }
  const d = AUTHOR_SPOTLIGHT_DEFAULT;
  const str = (v, def) => (typeof v === "string" ? v : def);
  return {
    enabled: o.enabled !== false,
    eyebrow: str(o.eyebrow, d.eyebrow),
    name: str(o.name, d.name),
    bio: str(o.bio, d.bio),
    photo: str(o.photo, d.photo),
    buttonText: str(o.buttonText, d.buttonText),
    featuredBookId: str(o.featuredBookId, d.featuredBookId),
    mode: o.mode === "manual" ? "manual" : "auto",
    bookIds: Array.isArray(o.bookIds) ? o.bookIds.filter((x) => typeof x === "string").slice(0, AUTHOR_SPOTLIGHT_MAX) : [],
    limit: clampLimit(o.limit, d.limit) > AUTHOR_SPOTLIGHT_MAX ? AUTHOR_SPOTLIGHT_MAX : clampLimit(o.limit, d.limit),
  };
}

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
      limit: clampLimit(r.limit, 12),
      bookIds: Array.isArray(r.bookIds) ? r.bookIds.filter((x) => typeof x === "string") : [],
    }));
}

// สร้างแถวใหม่ (id สุ่ม) + คีย์สำหรับลำดับ section
export function newCustomRow() {
  const id = (crypto.randomUUID?.() || String(Date.now())).slice(0, 8);
  return { id, title: "แถวหนังสือใหม่", subtitle: "", mode: "auto", sort: "newest", limit: 12, bookIds: [] };
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
      limit: clampLimit(c.limit, d.limit),
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
