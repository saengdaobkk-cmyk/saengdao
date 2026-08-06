import { prisma } from "./prisma.js";

// keys ใน Setting สำหรับระบบอีเมล (Brevo)
export const EK = {
  enabled: "email.enabled",
  apiKey: "email.brevoApiKey", // 🔒 ความลับ
  fromEmail: "email.fromEmail",
  fromName: "email.fromName",
  shopEmail: "email.shopEmail", // อีเมลร้าน (รับฟอร์มติดต่อ + สำเนาออเดอร์)
};

const SITE = "https://saengdao.vercel.app";
const baht = (n) => "฿" + Math.ceil(Number(n) || 0).toLocaleString("th-TH");
const orderNo = (id) => id.slice(0, 8).toUpperCase();
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export async function getEmailConfig() {
  const rows = await prisma.setting.findMany({ where: { key: { in: Object.values(EK) } } });
  const m = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    enabled: m[EK.enabled] === "true",
    apiKey: m[EK.apiKey] || "",
    fromEmail: m[EK.fromEmail] || "",
    fromName: m[EK.fromName] || "SAENGDAO",
    shopEmail: m[EK.shopEmail] || "",
  };
}

// เลย์เอาต์อีเมลกลาง (inline style — email client ต้องการ)
function layout(title, bodyHtml) {
  return `<!doctype html><html><body style="margin:0;background:#f5f5f7;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;color:#1d1d1f">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px">
    <div style="text-align:center;padding:8px 0 20px"><span style="font-size:22px;font-weight:700;letter-spacing:3px;color:#1d1d1f">SAENGDAO</span></div>
    <div style="background:#fff;border-radius:16px;padding:28px 24px;border:1px solid #e5e5e7">
      <h1 style="margin:0 0 16px;font-size:20px;color:#1d1d1f">${esc(title)}</h1>
      ${bodyHtml}
    </div>
    <p style="text-align:center;color:#86868b;font-size:12px;margin:18px 0 0">SAENGDAO · สำนักพิมพ์แสงดาว · <a href="${SITE}" style="color:#86868b">saengdao.vercel.app</a></p>
  </div></body></html>`;
}

// ส่งอีเมลผ่าน Brevo API — best-effort ไม่ throw
async function send({ to, toName, subject, html, replyTo }) {
  const cfg = await getEmailConfig();
  if (!cfg.enabled) return { skipped: true, reason: "email ปิดใช้งาน" };
  if (!cfg.apiKey || !cfg.fromEmail) return { ok: false, error: "ยังไม่ได้ตั้งค่า Brevo ให้ครบ" };
  if (!to) return { skipped: true, reason: "ไม่มีอีเมลผู้รับ" };
  try {
    const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "Content-Type": "application/json", accept: "application/json", "api-key": cfg.apiKey },
      body: JSON.stringify({
        sender: { email: cfg.fromEmail, name: cfg.fromName },
        to: [{ email: to, name: toName || to }],
        subject,
        htmlContent: html,
        ...(replyTo ? { replyTo } : {}),
      }),
    });
    if (!resp.ok) return { ok: false, error: (await resp.text().catch(() => "")).slice(0, 200) || `HTTP ${resp.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: "ส่งอีเมลไม่สำเร็จ: " + err.message };
  }
}

// ---------- อีเมลแต่ละแบบ ----------

const ORDER_INCLUDE = { items: { include: { book: { select: { title: true } } } } };

function itemsTable(order) {
  const rows = order.items
    .map(
      (it) => `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0">${esc(it.book?.title || "หนังสือ")}${it.variantName ? ` <span style="color:#86868b">(${esc(it.variantName)})</span>` : ""} <span style="color:#86868b">× ${it.quantity}</span></td>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right;white-space:nowrap">${baht(Number(it.price) * it.quantity)}</td>
    </tr>`
    )
    .join("");
  const shipping = Math.max(0, Number(order.shippingFee) || 0);
  const discount = Math.max(0, Number(order.discount) || 0);
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;margin:14px 0">
    ${rows}
    ${shipping ? `<tr><td style="padding:6px 0;color:#86868b">ค่าจัดส่ง</td><td style="padding:6px 0;text-align:right">${baht(shipping)}</td></tr>` : ""}
    ${discount ? `<tr><td style="padding:6px 0;color:#86868b">ส่วนลด</td><td style="padding:6px 0;text-align:right;color:#e2483d">-${baht(discount)}</td></tr>` : ""}
    <tr><td style="padding:12px 0 0;font-weight:700;font-size:16px">ยอดรวม</td><td style="padding:12px 0 0;text-align:right;font-weight:700;font-size:16px">${baht(order.total)}</td></tr>
  </table>`;
}

const trackOrderBtn = (order) =>
  `<div style="margin-top:8px"><a href="${SITE}/orders/${order.id}" style="display:inline-block;background:#0071e3;color:#fff;text-decoration:none;padding:11px 22px;border-radius:999px;font-size:14px;font-weight:500">ดูรายละเอียดคำสั่งซื้อ</a></div>`;

// 1) ยืนยันคำสั่งซื้อ
export async function sendOrderConfirmation(orderId) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: ORDER_INCLUDE });
  if (!order?.email) return { skipped: true };
  const html = layout(`ได้รับคำสั่งซื้อแล้ว · #${orderNo(order.id)}`,
    `<p style="font-size:14px;color:#515154">สวัสดีค่ะ คุณ${esc(order.shipName || "")} — ขอบคุณที่สั่งซื้อกับแสงดาว 🙏<br>เราได้รับคำสั่งซื้อของคุณแล้ว รายละเอียดด้านล่างค่ะ</p>
    ${itemsTable(order)}
    <p style="font-size:13px;color:#86868b">จัดส่งไปที่: ${esc(order.shipAddress || "")}</p>
    ${trackOrderBtn(order)}`);
  return send({ to: order.email, toName: order.shipName, subject: `SAENGDAO · ยืนยันคำสั่งซื้อ #${orderNo(order.id)}`, html });
}

// 1.5) แจ้งเตือนร้าน — มีออเดอร์ใหม่เข้ามา
const PAY_LABEL = { PROMPTPAY: "พร้อมเพย์", TRANSFER: "โอนธนาคาร", CARD: "บัตรเครดิต" };
export async function sendNewOrderToShop(orderId) {
  const cfg = await getEmailConfig();
  if (!cfg.shopEmail) return { skipped: true, reason: "ยังไม่ได้ตั้งอีเมลร้าน" };
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: ORDER_INCLUDE });
  if (!order) return { skipped: true };
  const html = layout(`🔔 ออเดอร์ใหม่ · #${orderNo(order.id)}`,
    `<table style="width:100%;font-size:14px;border-collapse:collapse">
      <tr><td style="padding:5px 0;color:#86868b;width:90px">ลูกค้า</td><td style="padding:5px 0">${esc(order.shipName)}</td></tr>
      <tr><td style="padding:5px 0;color:#86868b">โทร</td><td style="padding:5px 0">${esc(order.shipPhone)}</td></tr>
      ${order.email ? `<tr><td style="padding:5px 0;color:#86868b">อีเมล</td><td style="padding:5px 0">${esc(order.email)}</td></tr>` : ""}
      <tr><td style="padding:5px 0;color:#86868b;vertical-align:top">ที่อยู่</td><td style="padding:5px 0">${esc(order.shipAddress)}</td></tr>
      <tr><td style="padding:5px 0;color:#86868b">ชำระเงิน</td><td style="padding:5px 0">${PAY_LABEL[order.paymentMethod] || esc(order.paymentMethod || "-")}</td></tr>
      ${order.note ? `<tr><td style="padding:5px 0;color:#86868b;vertical-align:top">หมายเหตุ</td><td style="padding:5px 0">${esc(order.note)}</td></tr>` : ""}
    </table>
    ${itemsTable(order)}
    <div style="margin-top:8px"><a href="${SITE}/sdpub/orders/${order.id}" style="display:inline-block;background:#1d1d1f;color:#fff;text-decoration:none;padding:11px 22px;border-radius:999px;font-size:14px;font-weight:500">เปิดในหลังบ้าน</a></div>`);
  return send({ to: cfg.shopEmail, subject: `SAENGDAO · ออเดอร์ใหม่ #${orderNo(order.id)} · ${baht(order.total)}`, html });
}

// 2) ยืนยันรับชำระเงิน
export async function sendPaymentReceived(orderId) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: ORDER_INCLUDE });
  if (!order?.email) return { skipped: true };
  const html = layout(`ได้รับชำระเงินแล้ว · #${orderNo(order.id)}`,
    `<p style="font-size:14px;color:#515154">เราได้รับชำระเงินสำหรับคำสั่งซื้อ #${orderNo(order.id)} เรียบร้อยแล้ว ✅<br>กำลังเตรียมจัดส่งให้เร็วที่สุดค่ะ</p>
    ${itemsTable(order)}
    ${trackOrderBtn(order)}`);
  return send({ to: order.email, toName: order.shipName, subject: `SAENGDAO · ยืนยันการชำระเงิน #${orderNo(order.id)}`, html });
}

// 3) แจ้งจัดส่ง + เลข tracking
export async function sendShipped(orderId) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: ORDER_INCLUDE });
  if (!order?.email) return { skipped: true };
  const track = order.trackingNumber
    ? `<div style="background:#f5f5f7;border-radius:12px;padding:14px 16px;margin:14px 0">
        <p style="margin:0;font-size:13px;color:#86868b">เลขพัสดุ${order.shippingMethod ? ` · ${esc(order.shippingMethod)}` : ""}</p>
        <p style="margin:4px 0 0;font-size:18px;font-weight:700;letter-spacing:1px">${esc(order.trackingNumber)}</p>
      </div>`
    : "";
  const html = layout(`พัสดุกำลังจัดส่ง · #${orderNo(order.id)}`,
    `<p style="font-size:14px;color:#515154">คำสั่งซื้อ #${orderNo(order.id)} ถูกจัดส่งแล้ว 📦</p>
    ${track}
    ${trackOrderBtn(order)}`);
  return send({ to: order.email, toName: order.shipName, subject: `SAENGDAO · จัดส่งแล้ว #${orderNo(order.id)}`, html });
}

// 4) ฟอร์มติดต่อ → อีเมลร้าน
export async function sendContactMessage({ name, email, phone, message }) {
  const cfg = await getEmailConfig();
  if (!cfg.shopEmail) return { skipped: true, reason: "ยังไม่ได้ตั้งอีเมลร้าน" };
  const html = layout("ข้อความใหม่จากฟอร์มติดต่อ",
    `<table style="width:100%;font-size:14px;border-collapse:collapse">
      <tr><td style="padding:6px 0;color:#86868b;width:80px">ชื่อ</td><td style="padding:6px 0">${esc(name)}</td></tr>
      <tr><td style="padding:6px 0;color:#86868b">อีเมล</td><td style="padding:6px 0">${esc(email)}</td></tr>
      ${phone ? `<tr><td style="padding:6px 0;color:#86868b">โทร</td><td style="padding:6px 0">${esc(phone)}</td></tr>` : ""}
    </table>
    <div style="background:#f5f5f7;border-radius:12px;padding:14px 16px;margin:14px 0;white-space:pre-wrap;font-size:14px">${esc(message)}</div>`);
  return send({ to: cfg.shopEmail, subject: `SAENGDAO · ข้อความติดต่อจาก ${name}`, html, replyTo: email ? { email, name } : undefined });
}

// ทดสอบระบบ
export async function sendTestEmail(to) {
  return send({ to, subject: "SAENGDAO · ทดสอบระบบอีเมล", html: layout("ทดสอบระบบอีเมล", `<p style="font-size:14px">ระบบอีเมลผ่าน Brevo ทำงานปกติแล้ว ✅</p>`) });
}
