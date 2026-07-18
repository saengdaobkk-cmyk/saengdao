import { prisma } from "./prisma.js";

// items = [{ bookId, price, quantity }]
// คืน subtotal + qty เฉพาะสินค้าที่กฎครอบคลุม (ตาม productScope)
function eligibleOf(rule, items) {
  const ids = new Set(rule.productIds || []);
  let subtotal = 0, qty = 0;
  for (const it of items) {
    const q = Number(it.quantity) || 0;
    const price = Number(it.price) || 0;
    if (q <= 0 || price < 0) continue;
    const inList = ids.has(it.bookId);
    const ok =
      rule.productScope === "INCLUDE" ? inList :
      rule.productScope === "EXCLUDE" ? !inList :
      true; // ALL
    if (!ok) continue;
    subtotal += price * q;
    qty += q;
  }
  return { subtotal: Math.round(subtotal), qty };
}

// เลือกกฎที่ให้ส่วนลดมากสุด (เท่ากัน → priority น้อยก่อน)
export function pickRuleDiscount(rules, items, now = new Date()) {
  let best = null;
  for (const r of rules) {
    if (!r.active) continue;
    if (r.startAt && now < new Date(r.startAt)) continue;
    if (r.endAt && now > new Date(r.endAt)) continue;

    const { subtotal, qty } = eligibleOf(r, items);
    if (subtotal <= 0) continue; // ไม่มีสินค้าที่เข้าเงื่อนไขขอบเขต
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

// คำนวณส่วนลดอัตโนมัติจากรายการสินค้า (ดึงกฎ active จาก DB)
export async function computeCartRuleDiscount(items) {
  const list = Array.isArray(items) ? items : [];
  if (list.length === 0) return { discount: 0, name: null };
  const rules = await prisma.discountRule.findMany({ where: { active: true } });
  const best = pickRuleDiscount(rules, list);
  return best ? { discount: best.discount, name: best.rule.name } : { discount: 0, name: null };
}
