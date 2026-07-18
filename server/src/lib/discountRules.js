import { prisma } from "./prisma.js";

// items = [{ bookId, price, quantity, categoryId }]
function eligibleItems(rule, items) {
  const pids = new Set(rule.productIds || []);
  const cids = new Set(rule.categoryIds || []);
  const inList = (it) => pids.has(it.bookId) || (it.categoryId && cids.has(it.categoryId));
  const ok = (it) =>
    rule.productScope === "INCLUDE" ? inList(it) :
    rule.productScope === "EXCLUDE" ? !inList(it) :
    true;
  return items.filter((it) => Number(it.quantity) > 0 && Number(it.price) >= 0 && ok(it));
}

function flatDiscount(type, value, max, subtotal) {
  let d = type === "PERCENT" ? (subtotal * Number(value)) / 100 : Number(value);
  if (type === "PERCENT" && max != null && max !== "") d = Math.min(d, Number(max));
  return Math.min(Math.floor(d), subtotal);
}

// ส่วนลดของกฎเดียวจากรายการสินค้า
function ruleDiscount(rule, items) {
  const elig = eligibleItems(rule, items);
  const subtotal = Math.round(elig.reduce((s, it) => s + Number(it.price) * Number(it.quantity), 0));
  const qty = elig.reduce((s, it) => s + Number(it.quantity), 0);
  if (subtotal <= 0) return 0;

  // ── BOGO: ซื้อ X แถม/ลด Y ──
  if (rule.ruleType === "BOGO") {
    const buy = parseInt(rule.buyQty) || 0;
    const get = parseInt(rule.getQty) || 0;
    if (buy <= 0 || get <= 0) return 0;
    const pct = Math.min(100, Math.max(0, rule.getPercent ?? 100));
    const units = [];
    for (const it of elig) for (let i = 0; i < Number(it.quantity); i++) units.push(Number(it.price));
    units.sort((a, b) => a - b); // ให้ส่วนลดกับชิ้นที่ถูกสุด
    const sets = Math.floor(units.length / (buy + get));
    const freeUnits = sets * get;
    let d = 0;
    for (let i = 0; i < freeUnits; i++) d += (units[i] * pct) / 100;
    return Math.min(Math.floor(d), subtotal);
  }

  // เงื่อนไขขั้นต่ำ (CART/BULK)
  if (subtotal < Number(rule.minSubtotal || 0)) return 0;
  if (qty < Number(rule.minQty || 0)) return 0;

  // ── BULK: ขั้นบันไดตามจำนวนชิ้น ──
  if (rule.ruleType === "BULK") {
    const tiers = Array.isArray(rule.bulkTiers) ? rule.bulkTiers : [];
    const tier = tiers
      .filter((t) => qty >= (parseInt(t.minQty) || 0))
      .sort((a, b) => (parseInt(b.minQty) || 0) - (parseInt(a.minQty) || 0))[0];
    if (!tier) return 0;
    return flatDiscount(tier.discountType === "FIXED" ? "FIXED" : "PERCENT", tier.discountValue, tier.maxDiscount, subtotal);
  }

  // ── CART: ส่วนลดปกติ ──
  return flatDiscount(rule.discountType, rule.discountValue, rule.maxDiscount, subtotal);
}

// เลือกกฎที่ให้ส่วนลดมากสุด (เท่ากัน → priority น้อยก่อน)
export function pickRuleDiscount(rules, items, now = new Date()) {
  let best = null;
  for (const r of rules) {
    if (!r.active) continue;
    if (r.startAt && now < new Date(r.startAt)) continue;
    if (r.endAt && now > new Date(r.endAt)) continue;
    const d = ruleDiscount(r, items);
    if (d <= 0) continue;
    if (!best || d > best.discount || (d === best.discount && r.priority < best.rule.priority)) {
      best = { rule: r, discount: d };
    }
  }
  return best;
}

// เติม categoryId ให้แต่ละ item แล้วคำนวณส่วนลด
export async function computeCartRuleDiscount(items) {
  const list = Array.isArray(items) ? items.filter((i) => i.bookId) : [];
  if (list.length === 0) return { discount: 0, name: null };
  const ids = [...new Set(list.map((i) => i.bookId))];
  const books = await prisma.book.findMany({ where: { id: { in: ids } }, select: { id: true, categoryId: true } });
  const catOf = new Map(books.map((b) => [b.id, b.categoryId]));
  const enriched = list.map((i) => ({ ...i, categoryId: catOf.get(i.bookId) || null }));
  const rules = await prisma.discountRule.findMany({ where: { active: true } });
  const best = pickRuleDiscount(rules, enriched);
  return best ? { discount: best.discount, name: best.rule.name } : { discount: 0, name: null };
}
