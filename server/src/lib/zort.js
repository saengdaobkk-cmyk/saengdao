import { prisma } from "./prisma.js";
import { sendShipped } from "./email.js";
import { cacheClearPrefix } from "./cache.js";

// keys ใน Setting สำหรับ ZORT
export const ZK = {
  enabled: "zort.enabled",
  storename: "zort.storename",
  apikey: "zort.apikey",
  apisecret: "zort.apisecret", // 🔒 ความลับ
  baseUrl: "zort.baseUrl",
};
export const ZORT_DEFAULT_BASE = "https://open-api.zortout.com/v4";
export const ZORT_STOCK_SYNCED_AT = "zort.stockSyncedAt";

// fetch พร้อม timeout กัน ZORT ค้าง
async function fetchT(url, options = {}, ms = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

// การชำระเงินที่ระบุใน ZORT — พร้อมเพย์/โอนธนาคาร เงินเข้าบัญชีเดียวกัน
const ZORT_PAY_METHOD = {
  PROMPTPAY: "ธ.กรุงเทพ กระแสรายวัน",
  TRANSFER: "ธ.กรุงเทพ กระแสรายวัน",
  CARD: "บัตรเครดิต",
};

// วัน-เวลาโซนไทยจาก Date
const toBkk = (d) => new Date(d.getTime() + 7 * 3600 * 1000);
const zortDateStr = (d) => toBkk(d).toISOString().slice(0, 16).replace("T", " "); // YYYY-MM-DD HH:mm
function thaiDateTime(d) {
  const b = toBkk(d);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(b.getUTCDate())}/${p(b.getUTCMonth() + 1)}/${b.getUTCFullYear()} ${p(b.getUTCHours())}:${p(b.getUTCMinutes())}`;
}

export async function getZortConfig() {
  const rows = await prisma.setting.findMany({ where: { key: { in: Object.values(ZK) } } });
  const m = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    enabled: m[ZK.enabled] === "true",
    storename: m[ZK.storename] || "",
    apikey: m[ZK.apikey] || "",
    apisecret: m[ZK.apisecret] || "",
    baseUrl: m[ZK.baseUrl] || ZORT_DEFAULT_BASE,
  };
}

function zortHeaders(cfg) {
  return {
    "Content-Type": "application/json",
    storename: cfg.storename,
    apikey: cfg.apikey,
    apisecret: cfg.apisecret,
  };
}

// ทดสอบการเชื่อมต่อ (GetProducts) — เช็ค res:200 ใน body
export async function testZortConnection() {
  const cfg = await getZortConfig();
  if (!cfg.storename || !cfg.apikey || !cfg.apisecret)
    return { ok: false, error: "กรอก storename / apikey / apisecret ให้ครบก่อน" };
  try {
    const resp = await fetchT(`${cfg.baseUrl}/Product/GetProducts?page=1&limit=1`, { headers: zortHeaders(cfg) });
    const data = await resp.json().catch(() => null);

    // สำเร็จ = HTTP 200 + มีข้อมูลสินค้า (GetProducts บาง response ไม่มีฟิลด์ res)
    const code = Number(data?.res ?? data?.resCode);
    const success = resp.ok && data && (Array.isArray(data.list) || data.count != null || code === 200);
    if (success)
      return { ok: true, message: `เชื่อมต่อ ZORT สำเร็จ (พบสินค้า ${data.count ?? data.list?.length ?? 0} รายการ)` };

    // แสดงสาเหตุจริงจาก ZORT ให้อ่านออก
    const detail =
      data?.resDesc ||
      data?.message ||
      (data?.res && typeof data.res === "object" ? JSON.stringify(data.res) : data?.res) ||
      `HTTP ${resp.status}`;
    return { ok: false, error: `ZORT ปฏิเสธ: ${detail}` };
  } catch (err) {
    return { ok: false, error: "เชื่อมต่อไม่ได้: " + err.message };
  }
}

// วันที่-เวลาแบบ ZORT (โซนไทย): "YYYY-MM-DD HH:mm"
// ส่งออเดอร์ไป ZORT (Order/AddOrder) — โครงเดียวกับโปรแกรม All Chat, best-effort ไม่ throw
export async function pushOrderToZort(orderId) {
  const cfg = await getZortConfig();
  if (!cfg.enabled) return { skipped: true, reason: "ZORT ปิดใช้งาน" };
  if (!cfg.storename || !cfg.apikey || !cfg.apisecret)
    return { ok: false, error: "ยังไม่ได้ตั้งค่า ZORT ให้ครบ" };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { book: true } } },
  });
  if (!order) return { ok: false, error: "ไม่พบออเดอร์" };
  if (order.zortOrderId) return { ok: true, zortOrderId: order.zortOrderId, already: true };

  const total = Number(order.total);
  const shipping = Math.max(0, Number(order.shippingFee) || 0);
  const discount = Math.max(0, Number(order.discount) || 0);
  const paymentMethod = ZORT_PAY_METHOD[order.paymentMethod] || "อื่นๆ";
  const paidDate = order.paidAt ? new Date(order.paidAt) : new Date(); // เวลาชำระตามสลิป (ถ้าไม่มีใช้เวลาปัจจุบัน)
  const websiteNo = order.id.slice(0, 8).toUpperCase(); // เลขออเดอร์ของเว็บ (ที่โชว์เป็น #XXXXXXXX)

  // AddOrder: ฟิลด์ระดับ root (ไม่มี wrapper) — ตามแนวทาง All Chat
  const body = {
    number: websiteNo, // ใช้เลขออเดอร์ของเว็บไซต์เป็นเลขที่ออเดอร์ใน ZORT
    // ผู้ซื้อ (ถ้าออกใบกำกับภาษี ใช้ชื่อ/ที่อยู่/เลขภาษีของใบกำกับ)
    customername: order.needReceipt ? order.receiptName || order.shipName : order.shipName,
    customerphone: order.shipPhone,
    customeremail: order.email || "",
    customeraddress: order.needReceipt ? order.receiptAddress || order.shipAddress : order.shipAddress,
    ...(order.needReceipt && order.receiptTaxId ? { customeridnumber: order.receiptTaxId } : {}),
    // จัดส่ง
    shippingname: order.shipName,
    shippingphone: order.shipPhone,
    shippingaddress: order.shipAddress,
    shippingamount: shipping,
    shippingchannel: order.shippingMethod || "",
    // ZORT buyerAmount (มูลค่ารวมสุทธิ) = amount เป๊ะ (ไม่บวกค่าส่ง/ไม่หักส่วนลดซ้ำ)
    // → ส่งยอดสุทธิสุดท้าย · shippingamount/discount เป็นแค่ตัวแสดง
    amount: total,
    discount: discount > 0 ? String(discount) : "",
    saleschannel: "SAENGDAO Web",
    // การชำระเงิน (ยิงตอนยืนยันชำระแล้ว → mark ว่าจ่ายแล้วใน ZORT)
    paymentmethod: paymentMethod,
    paymentamount: total,
    paymentdate: zortDateStr(paidDate),
    description: [
      order.note?.trim(),
      `วันที่ชำระเงิน: ${thaiDateTime(paidDate)}`,
      `ช่องทางชำระเงิน: ${paymentMethod}`,
    ].filter(Boolean).join("\n"),
    list: order.items.map((it) => {
      // ส่งราคาต่อหน่วย "หลังหักส่วนลดรายชิ้นแล้ว" (ปัดเศษตามเว็บเรียบร้อย)
      // — ZORT ไม่ปัดขึ้นแบบเว็บ ถ้าส่งราคาเต็ม+% แล้วให้ ZORT คำนวณเองยอดจะเพี้ยน
      const netUnit = Number(it.price);
      return {
        sku: (it.book.isbn || "SD-" + it.book.id.slice(0, 8)) + (it.variantId ? "-" + it.variantId.slice(0, 6) : ""),
        name: it.book.title + (it.variantName ? ` (${it.variantName})` : ""),
        number: it.quantity,
        pricepernumber: netUnit, // ราคาต่อหน่วยสุทธิ (หลังหักส่วนลดรายชิ้น)
        discount: 0, // ไม่ส่ง % รายชิ้น — สะท้อนในราคาต่อหน่วยแล้ว
        totalprice: netUnit * it.quantity, // ยอดสุทธิรายบรรทัด = ราคาต่อหน่วย × จำนวน
      };
    }),
  };

  try {
    const resp = await fetch(`${cfg.baseUrl}/Order/AddOrder`, {
      method: "POST",
      headers: zortHeaders(cfg),
      body: JSON.stringify(body),
    });
    const data = await resp.json().catch(() => null);
    const code = Number(data?.resCode ?? data?.res);
    if (!resp.ok || code !== 200)
      return { ok: false, error: data?.resDesc || `ZORT ตอบกลับ ${resp.status}` };

    // ใช้เลขออเดอร์ของเว็บที่ส่งไป (ZORT gen เลขเองไม่ได้เพราะเราระบุ number แล้ว)
    await prisma.order.update({ where: { id: orderId }, data: { zortOrderId: websiteNo } });
    return { ok: true, zortOrderId: websiteNo };
  } catch (err) {
    return { ok: false, error: "ส่งไป ZORT ไม่สำเร็จ: " + err.message };
  }
}

/* ---------- Sync สถานะ + เลขพัสดุ จาก ZORT → เว็บ (ZORT = ตัวตั้ง) ---------- */

// map สถานะ ZORT → สถานะออเดอร์ในเว็บ
const ZORT_TO_WEB_STATUS = {
  pending: "PAID", approved: "PAID", packing: "PAID", packed: "PAID",
  shipping: "SHIPPED", shipped: "SHIPPED",
  delivered: "COMPLETED", completed: "COMPLETED", success: "COMPLETED",
  // void / cancelled → ไม่แตะอัตโนมัติ (กันผลข้างเคียง คืน/ริบแต้ม + สต็อก)
};
// ลำดับสถานะ — อัปเดตเฉพาะเดินหน้า (ไม่ดึงถอยหลัง)
const STATUS_RANK = { PENDING: 0, PAID: 1, SHIPPED: 2, COMPLETED: 3 };

let lastOrdersPull = 0;

// ดึงสถานะ/เลขพัสดุจาก ZORT มาอัปเดตออเดอร์ในเว็บ — throttled, เรียกจาก endpoint ที่มีคนเข้า
export async function syncOrdersFromZort({ throttleMs = 2 * 60 * 1000, force = false } = {}) {
  const now = Date.now();
  if (!force && now - lastOrdersPull < throttleMs) return { skipped: true };
  lastOrdersPull = now;

  const cfg = await getZortConfig();
  if (!cfg.enabled || !cfg.storename || !cfg.apikey || !cfg.apisecret) return { ok: false, reason: "ZORT ปิด/ตั้งค่าไม่ครบ" };

  // ออเดอร์ในเว็บที่ส่งไป ZORT แล้ว และยังไม่จบ
  const webOrders = await prisma.order.findMany({
    where: { zortOrderId: { not: null }, status: { notIn: ["COMPLETED", "CANCELLED"] } },
    select: { id: true, zortOrderId: true, status: true, trackingNumber: true, shippingMethod: true },
  });
  if (webOrders.length === 0) return { ok: true, updated: 0 };

  try {
    const resp = await fetchT(`${cfg.baseUrl}/Order/GetOrders?offset=0&limit=500`, { headers: zortHeaders(cfg) });
    if (!resp.ok) return { ok: false, error: `ZORT ตอบกลับ ${resp.status}` };
    const data = await resp.json().catch(() => null);
    const list = Array.isArray(data?.list) ? data.list : [];
    const byNumber = new Map();
    for (const o of list) if (o?.number) byNumber.set(String(o.number).toUpperCase(), o);

    let updated = 0;
    for (const w of webOrders) {
      const z = byNumber.get(String(w.zortOrderId).toUpperCase());
      if (!z) continue;
      const patch = {};

      // สถานะ — อัปเดตเฉพาะเดินหน้า
      const mapped = ZORT_TO_WEB_STATUS[String(z.status || "").toLowerCase()];
      if (mapped && mapped !== w.status && (STATUS_RANK[mapped] ?? 0) > (STATUS_RANK[w.status] ?? 0)) {
        patch.status = mapped;
      }
      // เลขพัสดุ (จาก trackingno หรือ trackingList)
      const track = z.trackingno || z.trackingList?.find((t) => t?.trackingno)?.trackingno;
      if (track && track !== w.trackingNumber) patch.trackingNumber = String(track).trim();
      // ช่องทางขนส่ง (ถ้าเว็บยังว่าง)
      const channel = z.shippingchannel || z.trackingList?.find((t) => t?.shippingchannel)?.shippingchannel;
      if (channel && !w.shippingMethod) patch.shippingMethod = channel;

      if (Object.keys(patch).length) {
        await prisma.order.update({ where: { id: w.id }, data: patch });
        updated++;
        // เพิ่งเปลี่ยนเป็นจัดส่ง → อีเมลแจ้งลูกค้า + เลขพัสดุ (best-effort)
        if (patch.status === "SHIPPED") sendShipped(w.id).catch(() => {});
      }
    }
    return { ok: true, updated, zortOrders: list.length };
  } catch (err) {
    return { ok: false, error: "ดึงสถานะจาก ZORT ไม่สำเร็จ: " + err.message };
  }
}

/* ---------- Sync สต็อกจาก ZORT (ZORT = ตัวตั้ง, จับคู่ตาม SKU=ISBN) ---------- */

// ดึงสินค้าทั้งหมดจาก ZORT (แบ่งหน้า)
async function fetchAllZortProducts(cfg) {
  const all = [];
  const limit = 200;
  for (let page = 1; page <= 200; page++) {
    const resp = await fetchT(`${cfg.baseUrl}/Product/GetProducts?page=${page}&limit=${limit}`, { headers: zortHeaders(cfg) });
    const data = await resp.json().catch(() => null);
    const list = data?.list;
    if (!Array.isArray(list) || list.length === 0) break;
    all.push(...list);
    const total = Number(data?.count ?? 0);
    if ((total && all.length >= total) || list.length < limit) break;
  }
  return all;
}

// อ่านจำนวนสต็อกจาก product ของ ZORT (รองรับหลายชื่อฟิลด์)
function zortStockOf(p) {
  const raw = p.availablestock ?? p.stock ?? p.balance ?? p.onhand ?? 0;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0;
}

// ดึงสต็อกจาก ZORT มาอัปเดตเว็บ (Book + Variant) ตาม ISBN
export async function syncStockFromZort() {
  const cfg = await getZortConfig();
  if (!cfg.enabled) return { ok: false, error: "ZORT ปิดใช้งาน" };
  if (!cfg.storename || !cfg.apikey || !cfg.apisecret)
    return { ok: false, error: "ยังไม่ได้ตั้งค่า ZORT ให้ครบ" };

  try {
    const products = await fetchAllZortProducts(cfg);
    // map: SKU(=ISBN) → stock
    const stockBySku = new Map();
    for (const p of products) {
      const sku = String(p.sku ?? "").trim().toUpperCase();
      if (sku) stockBySku.set(sku, zortStockOf(p));
    }
    if (stockBySku.size === 0)
      return { ok: false, error: "ไม่พบสินค้าที่มี SKU ใน ZORT" };

    const [books, variants] = await Promise.all([
      prisma.book.findMany({ where: { isbn: { not: null } }, select: { id: true, isbn: true, stock: true } }),
      prisma.variant.findMany({ where: { isbn: { not: null } }, select: { id: true, isbn: true, stock: true } }),
    ]);

    const ops = [];
    let matched = 0;
    for (const b of books) {
      const s = stockBySku.get(b.isbn.trim().toUpperCase());
      if (s === undefined) continue;
      matched++;
      if (s !== b.stock) ops.push(prisma.book.update({ where: { id: b.id }, data: { stock: s } }));
    }
    for (const v of variants) {
      const s = stockBySku.get(v.isbn.trim().toUpperCase());
      if (s === undefined) continue;
      matched++;
      if (s !== v.stock) ops.push(prisma.variant.update({ where: { id: v.id }, data: { stock: s } }));
    }

    // ทยอยอัปเดตทีละชุด กันคำสั่งเยอะเกิน
    for (let i = 0; i < ops.length; i += 50) await prisma.$transaction(ops.slice(i, i + 50));
    if (ops.length) cacheClearPrefix("books:"); // สต็อกเปลี่ยน → ล้าง cache รายการหนังสือ

    const now = new Date().toISOString();
    await prisma.setting.upsert({
      where: { key: ZORT_STOCK_SYNCED_AT },
      update: { value: now },
      create: { key: ZORT_STOCK_SYNCED_AT, value: now },
    });

    return { ok: true, zortProducts: products.length, matched, updated: ops.length };
  } catch (err) {
    return { ok: false, error: "ดึงสต็อกไม่สำเร็จ: " + err.message };
  }
}
