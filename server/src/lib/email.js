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

// เลย์เอาต์อีเมลกลาง (table-based + inline style — เพื่อความเข้ากันได้กับ email client)
function badge(color, glyph) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 18px"><tr>
    <td align="center" valign="middle" width="56" height="56" style="width:56px;height:56px;background:${color};border-radius:56px;text-align:center;vertical-align:middle;mso-line-height-rule:exactly;line-height:56px;font-size:26px;font-weight:700;color:#ffffff">${glyph}</td>
  </tr></table>`;
}

function layout(title, bodyHtml, opts = {}) {
  const eyebrow = opts.eyebrow || "";
  const icon = opts.icon;
  const head = icon ? "center" : "left";
  return `<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:#f0f0f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,'IBM Plex Sans Thai',sans-serif;-webkit-font-smoothing:antialiased">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f2"><tr><td align="center" style="padding:36px 16px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:544px;margin:0 auto">
    <tr><td align="center" style="padding:0 0 26px">
      <span style="font-size:23px;font-weight:700;letter-spacing:6px;color:#1d1d1f">SAENGDAO</span>
      <div style="width:30px;height:3px;background:#0071e3;border-radius:3px;margin:11px auto 0;line-height:0;font-size:0">&nbsp;</div>
    </td></tr>
    <tr><td style="background:#ffffff;border-radius:20px;padding:34px 30px;box-shadow:0 6px 24px -12px rgba(0,0,0,0.12)">
      ${icon ? badge(icon.color, icon.glyph) : ""}
      ${eyebrow ? `<p style="margin:0 0 6px;text-align:${head};font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#0071e3">${esc(eyebrow)}</p>` : ""}
      <h1 style="margin:0 0 20px;text-align:${head};font-size:21px;font-weight:600;line-height:1.3;letter-spacing:-0.3px;color:#1d1d1f">${esc(title)}</h1>
      ${bodyHtml}
    </td></tr>
    <tr><td align="center" style="padding:22px 8px 0">
      <p style="margin:0;color:#a1a1a6;font-size:12px;line-height:1.7">สำนักพิมพ์แสงดาว · SAENGDAO<br><a href="${SITE}" style="color:#0071e3;text-decoration:none">saengdao.vercel.app</a></p>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

// ปุ่ม (bulletproof — ใช้ table กัน email client เพี้ยน)
function button(href, text, dark = false) {
  const bg = dark ? "#1d1d1f" : "#0071e3";
  return `<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:18px auto 2px"><tr><td style="border-radius:999px;background:${bg}">
    <a href="${href}" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px">${esc(text)}</a>
  </td></tr></table>`;
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

const ORDER_INCLUDE = { items: { include: { book: { select: { title: true, coverImage: true } } } } };

// รูปสินค้าเป็น URL เต็มเสมอ (บาง client บล็อก path สัมพัทธ์)
const imgUrl = (u) => {
  const s = String(u || "").trim();
  if (!s) return "";
  return /^https?:\/\//i.test(s) ? s : `${SITE}${s.startsWith("/") ? "" : "/"}${s}`;
};

// รูปปก 44×60 มุมมน — ถ้าไม่มีรูปใช้กล่องเทาแทน (คงระยะให้แถวตรงกัน)
function coverCell(url) {
  const u = imgUrl(url);
  const inner = u
    ? `<img src="${u}" width="44" height="60" alt="" style="display:block;width:44px;height:60px;border-radius:7px;object-fit:cover;border:1px solid #ececef">`
    : `<div style="width:44px;height:60px;border-radius:7px;background:#f0f0f2"></div>`;
  return `<td width="44" style="padding:11px 12px 11px 0;border-bottom:1px solid #f0f0f2;vertical-align:top;width:44px">${inner}</td>`;
}

function itemsTable(order) {
  const rows = order.items
    .map(
      (it) => `<tr>
      ${coverCell(it.book?.coverImage)}
      <td style="padding:11px 0;border-bottom:1px solid #f0f0f2;font-size:14px;color:#1d1d1f;line-height:1.45;vertical-align:top">${esc(it.book?.title || "หนังสือ")}${it.variantName ? `<br><span style="font-size:12px;color:#a1a1a6">${esc(it.variantName)}</span>` : ""}<br><span style="font-size:12px;color:#a1a1a6">จำนวน ${it.quantity}</span></td>
      <td style="padding:11px 0;border-bottom:1px solid #f0f0f2;text-align:right;font-size:14px;color:#1d1d1f;white-space:nowrap;vertical-align:top">${baht(Number(it.price) * it.quantity)}</td>
    </tr>`
    )
    .join("");
  const shipping = Math.max(0, Number(order.shippingFee) || 0);
  const discount = Math.max(0, Number(order.discount) || 0);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 4px;border-collapse:collapse">
    ${rows}
    ${shipping ? `<tr><td colspan="2" style="padding:9px 0 0;font-size:13px;color:#86868b">ค่าจัดส่ง</td><td style="padding:9px 0 0;text-align:right;font-size:13px;color:#515154">${baht(shipping)}</td></tr>` : ""}
    ${discount ? `<tr><td colspan="2" style="padding:7px 0 0;font-size:13px;color:#86868b">ส่วนลด</td><td style="padding:7px 0 0;text-align:right;font-size:13px;color:#e2483d">-${baht(discount)}</td></tr>` : ""}
    <tr><td colspan="2" style="padding:15px 0 0;font-size:15px;font-weight:700;color:#1d1d1f">ยอดรวม</td><td style="padding:15px 0 0;text-align:right;font-size:19px;font-weight:700;color:#1d1d1f">${baht(order.total)}</td></tr>
  </table>`;
}

// แถวข้อมูล (label ซ้าย · ค่าขวา) — value เป็น HTML แล้ว (esc มาก่อน)
function infoRows(pairs) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
    ${pairs.filter(Boolean).map(([k, v]) => `<tr><td style="padding:7px 0;font-size:13px;color:#a1a1a6;width:84px;vertical-align:top">${esc(k)}</td><td style="padding:7px 0;font-size:14px;color:#1d1d1f;line-height:1.5">${v}</td></tr>`).join("")}
  </table>`;
}

// แถวข้อมูลแบบ label เล็กอยู่บน–ค่าอยู่ล่าง (เลี่ยงช่องว่างเมื่อ label ยาวไม่เท่ากัน) — value esc มาก่อน
function stackRows(pairs) {
  return pairs.filter(Boolean).map(([k, v]) =>
    `<div style="margin:0 0 11px"><div style="font-size:11px;letter-spacing:0.3px;color:#a1a1a6;margin:0 0 2px">${esc(k)}</div><div style="font-size:14px;line-height:1.45;color:#1d1d1f">${v}</div></div>`
  ).join("");
}

// กล่องที่อยู่จัดส่ง — ชื่อผู้รับ · เบอร์ · ที่อยู่
function shipBlock(order) {
  const line1 = [order.shipName, order.shipPhone].filter(Boolean).map(esc).join("  ·  ");
  return `<div style="background:#f7f7f9;border-radius:14px;padding:15px 17px;margin:16px 0 2px">
    <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#86868b">จัดส่งไปที่</p>
    ${line1 ? `<p style="margin:0 0 3px;font-size:14px;font-weight:600;color:#1d1d1f">${line1}</p>` : ""}
    <p style="margin:0;font-size:13px;line-height:1.55;color:#515154">${esc(order.shipAddress || "")}</p>
  </div>`;
}

// กล่องข้อมูลออกใบเสร็จ/ใบกำกับภาษี — โชว์เฉพาะเมื่อลูกค้าขอ (needReceipt)
function receiptBlock(order) {
  if (!order.needReceipt) return "";
  return `<div style="background:#f7f7f9;border-radius:14px;padding:15px 17px;margin:12px 0 2px">
    <p style="margin:0 0 12px;font-size:12px;font-weight:600;letter-spacing:0.3px;color:#86868b">ข้อมูลออกใบกำกับภาษี</p>
    ${stackRows([
      ["ชื่อ", esc(order.receiptName || order.shipName || "-")],
      order.receiptTaxId && ["เลขผู้เสียภาษี", esc(order.receiptTaxId)],
      ["ที่อยู่", esc(order.receiptAddress || order.shipAddress || "-")],
    ])}
    <p style="margin:2px 0 0;font-size:11px;line-height:1.5;color:#a1a1a6">โปรดตรวจสอบความถูกต้อง หากมีข้อผิดพลาดกรุณาแจ้งเราภายใน 3 วัน</p>
  </div>`;
}

const trackOrderBtn = (order) => button(`${SITE}/orders/${order.id}`, "ดูรายละเอียดคำสั่งซื้อ");

// 1) ยืนยันคำสั่งซื้อ
export async function sendOrderConfirmation(orderId) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: ORDER_INCLUDE });
  if (!order?.email) return { skipped: true };
  const html = layout(`ได้รับคำสั่งซื้อแล้ว #${orderNo(order.id)}`,
    `<p style="margin:0 0 4px;font-size:15px;line-height:1.6;color:#515154;text-align:center">สวัสดีค่ะ คุณ${esc(order.shipName || "")}<br>ขอบคุณที่สั่งซื้อกับแสงดาว — เราได้รับคำสั่งซื้อเรียบร้อยแล้ว</p>
    ${itemsTable(order)}
    ${shipBlock(order)}
    ${receiptBlock(order)}
    ${trackOrderBtn(order)}`,
    { eyebrow: "ยืนยันคำสั่งซื้อ", icon: { color: "#0071e3", glyph: "✓" } });
  return send({ to: order.email, toName: order.shipName, subject: `SAENGDAO · ยืนยันคำสั่งซื้อ #${orderNo(order.id)}`, html });
}

// 1.5) แจ้งเตือนร้าน — มีออเดอร์ใหม่เข้ามา
const PAY_LABEL = { PROMPTPAY: "พร้อมเพย์", TRANSFER: "โอนธนาคาร", CARD: "บัตรเครดิต" };
export async function sendNewOrderToShop(orderId) {
  const cfg = await getEmailConfig();
  if (!cfg.shopEmail) return { skipped: true, reason: "ยังไม่ได้ตั้งอีเมลร้าน" };
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: ORDER_INCLUDE });
  if (!order) return { skipped: true };
  const html = layout(`ออเดอร์ใหม่ #${orderNo(order.id)}`,
    `${infoRows([
      ["ลูกค้า", esc(order.shipName)],
      ["โทร", esc(order.shipPhone)],
      order.email && ["อีเมล", esc(order.email)],
      ["ที่อยู่", esc(order.shipAddress)],
      ["ชำระเงิน", PAY_LABEL[order.paymentMethod] || esc(order.paymentMethod || "-")],
      order.note && ["หมายเหตุ", esc(order.note)],
    ])}
    ${receiptBlock(order)}
    ${itemsTable(order)}
    ${button(`${SITE}/sdpub/orders/${order.id}`, "เปิดในหลังบ้าน", true)}`,
    { eyebrow: "คำสั่งซื้อใหม่", icon: { color: "#ef9f27", glyph: "!" } });
  return send({ to: cfg.shopEmail, subject: `SAENGDAO · ออเดอร์ใหม่ #${orderNo(order.id)} · ${baht(order.total)}`, html });
}

// 2) ยืนยันรับชำระเงิน
export async function sendPaymentReceived(orderId) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: ORDER_INCLUDE });
  if (!order?.email) return { skipped: true };
  const html = layout(`ได้รับชำระเงินแล้ว #${orderNo(order.id)}`,
    `<p style="margin:0;font-size:15px;line-height:1.6;color:#515154;text-align:center">เราได้รับชำระเงินสำหรับคำสั่งซื้อนี้เรียบร้อยแล้ว<br>กำลังเตรียมจัดส่งให้เร็วที่สุดค่ะ</p>
    ${itemsTable(order)}
    ${trackOrderBtn(order)}`,
    { eyebrow: "ชำระเงินสำเร็จ", icon: { color: "#1d9e75", glyph: "✓" } });
  return send({ to: order.email, toName: order.shipName, subject: `SAENGDAO · ยืนยันการชำระเงิน #${orderNo(order.id)}`, html });
}

// 3) แจ้งจัดส่ง + เลข tracking
export async function sendShipped(orderId) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: ORDER_INCLUDE });
  if (!order?.email) return { skipped: true };
  const track = order.trackingNumber
    ? `<div style="background:#f0f0f2;border-radius:14px;padding:16px 18px;margin:18px 0 4px">
        <p style="margin:0;font-size:12px;color:#86868b">เลขพัสดุ${order.shippingMethod ? ` · ${esc(order.shippingMethod)}` : ""}</p>
        <p style="margin:5px 0 0;font-size:20px;font-weight:700;letter-spacing:1.5px;color:#1d1d1f">${esc(order.trackingNumber)}</p>
      </div>`
    : "";
  const html = layout(`พัสดุกำลังจัดส่ง #${orderNo(order.id)}`,
    `<p style="margin:0;font-size:15px;line-height:1.6;color:#515154;text-align:center">คำสั่งซื้อของคุณถูกจัดส่งแล้ว ติดตามพัสดุได้จากเลขด้านล่างค่ะ</p>
    ${track}
    ${trackOrderBtn(order)}`,
    { eyebrow: "จัดส่งแล้ว", icon: { color: "#5b53d6", glyph: "→" } });
  return send({ to: order.email, toName: order.shipName, subject: `SAENGDAO · จัดส่งแล้ว #${orderNo(order.id)}`, html });
}

// 4) ฟอร์มติดต่อ → อีเมลร้าน
export async function sendContactMessage({ name, email, phone, message }) {
  const cfg = await getEmailConfig();
  if (!cfg.shopEmail) return { skipped: true, reason: "ยังไม่ได้ตั้งอีเมลร้าน" };
  const html = layout("ข้อความใหม่จากลูกค้า",
    `${infoRows([
      ["ชื่อ", esc(name)],
      ["อีเมล", esc(email)],
      phone && ["โทร", esc(phone)],
    ])}
    <div style="background:#f0f0f2;border-radius:14px;padding:16px 18px;margin:16px 0 2px;white-space:pre-wrap;font-size:14px;line-height:1.6;color:#1d1d1f">${esc(message)}</div>`,
    { eyebrow: "ฟอร์มติดต่อ", icon: { color: "#0071e3", glyph: "✉" } });
  return send({ to: cfg.shopEmail, subject: `SAENGDAO · ข้อความติดต่อจาก ${name}`, html, replyTo: email ? { email, name } : undefined });
}

// ทดสอบระบบ
export async function sendTestEmail(to) {
  return send({ to, subject: "SAENGDAO · ทดสอบระบบอีเมล", html: layout("ระบบอีเมลพร้อมใช้งาน", `<p style="margin:0;font-size:15px;line-height:1.6;color:#515154;text-align:center">ยินดีด้วยค่ะ — ระบบอีเมลผ่าน Brevo ทำงานปกติแล้ว<br>อีเมลยืนยันคำสั่งซื้อ ชำระเงิน จัดส่ง และฟอร์มติดต่อ จะส่งอัตโนมัติจากนี้ไป</p>`, { eyebrow: "ทดสอบ", icon: { color: "#1d9e75", glyph: "✓" } }) });
}
