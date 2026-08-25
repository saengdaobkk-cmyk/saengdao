// เชื่อม Omise (PromptPay QR อัตโนมัติ + บัตรเครดิต) ผ่าน REST API — ไม่ต้องลง npm
// เงิน = สตางค์ (บาท×100) · auth = Basic base64(secretKey + ":")
import { prisma } from "./prisma.js";

const API = "https://api.omise.co";

// อ่านค่า Omise จาก settings (secret อยู่ฝั่งเซิร์ฟเวอร์เท่านั้น)
export async function getOmiseConfig() {
  const rows = await prisma.setting.findMany({ where: { key: { in: ["omiseEnabled", "omiseSecretKey", "omisePublicKey"] } } });
  const m = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    enabled: m.omiseEnabled === "true",
    secretKey: (m.omiseSecretKey || "").trim(),
    publicKey: (m.omisePublicKey || "").trim(),
  };
}

export async function omiseReady() {
  const c = await getOmiseConfig();
  return c.enabled && !!c.secretKey;
}

function authHeader(secretKey) {
  return "Basic " + Buffer.from(`${secretKey}:`).toString("base64");
}

// flatten object → form-encoded (รองรับ nested เช่น source[type], metadata[order_id])
function toForm(obj, prefix = "", out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    if (v == null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === "object" && !Array.isArray(v)) toForm(v, key, out);
    else out.append(key, String(v));
  }
  return out;
}

async function omiseRequest(path, { method = "GET", secretKey, body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: authHeader(secretKey),
      ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: body ? toForm(body).toString() : undefined,
  });
  const data = await res.json();
  if (!res.ok || data.object === "error") {
    throw new Error(data.message || `Omise error (${res.status})`);
  }
  return data;
}

const satang = (baht) => Math.round(Number(baht) * 100);

// สร้าง charge พร้อมเพย์ — คืน charge (มี QR ที่ source.scannable_code.image.download_uri)
export async function createPromptPayCharge({ secretKey, orderId, amount }) {
  return omiseRequest("/charges", {
    method: "POST",
    secretKey,
    body: {
      amount: satang(amount),
      currency: "thb",
      source: { type: "promptpay" },
      metadata: { order_id: orderId },
    },
  });
}

// สร้าง charge บัตรจาก token (tokn_...) — return_uri ใช้ตอน 3DS redirect กลับ
export async function createCardCharge({ secretKey, orderId, amount, token, returnUri }) {
  return omiseRequest("/charges", {
    method: "POST",
    secretKey,
    body: {
      amount: satang(amount),
      currency: "thb",
      card: token,
      return_uri: returnUri,
      metadata: { order_id: orderId },
    },
  });
}

export async function fetchCharge({ secretKey, chargeId }) {
  return omiseRequest(`/charges/${chargeId}`, { secretKey });
}

// charge จ่ายสำเร็จจริงไหม
export const chargePaid = (charge) => charge?.status === "successful" && charge?.paid === true;

// URL รูป QR ของ charge พร้อมเพย์ (ต้อง auth เวลาโหลด)
export const chargeQrUrl = (charge) => charge?.source?.scannable_code?.image?.download_uri || null;

// โหลดรูป QR (download_uri ต้องแนบ auth) → คืนเป็น data URL ให้ฝั่ง client แสดงได้เลย
export async function fetchQrDataUrl({ secretKey, url }) {
  const res = await fetch(url, { headers: { Authorization: authHeader(secretKey) } });
  if (!res.ok) throw new Error("โหลด QR ไม่สำเร็จ");
  const buf = Buffer.from(await res.arrayBuffer());
  const ct = res.headers.get("content-type") || "image/png";
  return `data:${ct};base64,${buf.toString("base64")}`;
}
