// section หน้าแรก ที่สลับลำดับได้ (ใช้ร่วมกันระหว่างหน้าร้าน + admin)
export const HOME_SECTIONS = [
  { key: "hero", label: "สไลด์หน้าแรก (Hero)" },
  { key: "hotdeal", label: "Hot Deal" },
  { key: "new", label: "หนังสือมาใหม่" },
  { key: "bestseller", label: "หนังสือขายดี" },
  { key: "browse", label: "หมวดหมู่ (Browse)" },
  { key: "textmarquee", label: "แถบตัวอักษรเลื่อน" },
  { key: "ribbon", label: "แถบโปรโมชั่นเอียง" },
  { key: "brands", label: "สำนักพิมพ์" },
];

export const DEFAULT_ORDER = HOME_SECTIONS.map((s) => s.key);
export const SECTION_LABEL = Object.fromEntries(HOME_SECTIONS.map((s) => [s.key, s.label]));

// อ่านลำดับจากค่า setting (JSON) → คืน array ที่ถูกต้อง + เติม section ใหม่ที่ยังไม่มีต่อท้าย
export function parseOrder(raw) {
  let arr = [];
  try {
    const p = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Array.isArray(p)) arr = p.filter((k) => DEFAULT_ORDER.includes(k));
  } catch { /* ใช้ค่าเริ่มต้น */ }
  for (const k of DEFAULT_ORDER) if (!arr.includes(k)) arr.push(k);
  return arr;
}
