import { prisma } from "./prisma.js";

// เลือกกฎที่ให้ส่วนลดมากสุด (เท่ากัน → priority น้อยก่อน) จากเงื่อนไขตะกร้า
export function pickRuleDiscount(rules, subtotal, qty, now = new Date()) {
  let best = null;
  for (const r of rules) {
    if (!r.active) continue;
    if (r.startAt && now < new Date(r.startAt)) continue;
    if (r.endAt && now > new Date(r.endAt)) continue;
    if (subtotal < Number(r.minSubtotal || 0)) continue;
    if (qty < Number(r.minQty || 0)) continue;

    let d = r.discountType === "PERCENT"
      ? (subtotal * Number(r.discountValue)) / 100
      : Number(r.discountValue);
    if (r.discountType === "PERCENT" && r.maxDiscount != null) d = Math.min(d, Number(r.maxDiscount));
    d = Math.min(Math.floor(d), subtotal);
    if (d <= 0) continue;

    if (!best || d > best.discount || (d === best.discount && r.priority < best.rule.priority)) {
      best = { rule: r, discount: d };
    }
  }
  return best; // { rule, discount } หรือ null
}

// คำนวณส่วนลดอัตโนมัติจากยอด/จำนวนชิ้น (ดึงกฎ active จาก DB)
export async function computeCartRuleDiscount(subtotal, qty) {
  const s = Math.max(0, Math.round(Number(subtotal) || 0));
  const q = Math.max(0, parseInt(qty) || 0);
  if (s <= 0) return { discount: 0, name: null };
  const rules = await prisma.discountRule.findMany({ where: { active: true } });
  const best = pickRuleDiscount(rules, s, q);
  return best ? { discount: best.discount, name: best.rule.name } : { discount: 0, name: null };
}
