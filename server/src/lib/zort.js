import { prisma } from "./prisma.js";

// keys ใน Setting สำหรับ ZORT
export const ZK = {
  enabled: "zort.enabled",
  storename: "zort.storename",
  apikey: "zort.apikey",
  apisecret: "zort.apisecret", // 🔒 ความลับ
  baseUrl: "zort.baseUrl",
};
export const ZORT_DEFAULT_BASE = "https://open-api.zortout.com/v4";

const PAYMENT_LABEL = {
  PROMPTPAY: "พร้อมเพย์",
  TRANSFER: "เงินโอน",
  CARD: "บัตรเครดิต",
};

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
    const resp = await fetch(`${cfg.baseUrl}/Product/GetProducts?page=1&limit=1`, { headers: zortHeaders(cfg) });
    if (!resp.ok) return { ok: false, error: `ZORT ตอบกลับสถานะ ${resp.status}` };
    const data = await resp.json().catch(() => null);
    if (!data || Number(data.res) !== 200)
      return { ok: false, error: `credential ไม่ถูกต้อง หรือ ZORT ปฏิเสธ (res=${data?.res ?? "?"})` };
    return { ok: true, message: `เชื่อมต่อ ZORT สำเร็จ (พบสินค้า ${data.count ?? 0} รายการ)` };
  } catch (err) {
    return { ok: false, error: "เชื่อมต่อไม่ได้: " + err.message };
  }
}

// ส่งออเดอร์ไป ZORT (Order/AddOrder) — best-effort, ไม่ throw
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
  const discount = Number(order.discount);

  const payload = {
    number: "SD-" + order.id.slice(0, 8).toUpperCase(),
    orderdate: order.createdAt.toISOString().slice(0, 10),
    amount: total,
    status: "Success", // ยืนยันชำระเงินแล้ว
    customername: order.shipName,
    customerphone: order.shipPhone,
    customeremail: order.email || "",
    customeraddress: order.shipAddress,
    shippingname: order.shipName,
    shippingaddress: order.shipAddress,
    shippingphone: order.shipPhone,
    paymentmethod: PAYMENT_LABEL[order.paymentMethod] || "อื่นๆ",
    paymentamount: total,
    paymentdate: new Date().toISOString().slice(0, 16).replace("T", " "),
    saleschannel: "SAENGDAO Web",
    description: order.note || "",
    ...(discount > 0 ? { discount: String(discount) } : {}),
    // ใบกำกับภาษี (ถ้าลูกค้าขอ)
    ...(order.needReceipt
      ? {
          customername: order.receiptName || order.shipName,
          customeridnumber: order.receiptTaxId || "",
          customeraddress: order.receiptAddress || order.shipAddress,
        }
      : {}),
    list: order.items.map((it) => ({
      sku: (it.book.isbn || "SD-" + it.book.id.slice(0, 8)) + (it.variantId ? "-" + it.variantId.slice(0, 6) : ""),
      name: it.book.title + (it.variantName ? ` (${it.variantName})` : ""),
      number: it.quantity,
      pricepernumber: Number(it.price),
      totalprice: Number(it.price) * it.quantity,
    })),
  };

  try {
    const resp = await fetch(`${cfg.baseUrl}/Order/AddOrder`, {
      method: "POST",
      headers: zortHeaders(cfg),
      body: JSON.stringify(payload),
    });
    const data = await resp.json().catch(() => null);
    // AddOrder ใช้ resCode, บาง endpoint ใช้ res
    const code = Number(data?.resCode ?? data?.res);
    if (!resp.ok || code !== 200)
      return { ok: false, error: data?.resDesc || `ZORT ตอบกลับ ${resp.status}` };

    const zortOrderId = String(data?.detail?.id ?? "");
    await prisma.order.update({ where: { id: orderId }, data: { zortOrderId } });
    return { ok: true, zortOrderId };
  } catch (err) {
    return { ok: false, error: "ส่งไป ZORT ไม่สำเร็จ: " + err.message };
  }
}
