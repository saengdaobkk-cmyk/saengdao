import { prisma } from "./prisma.js";

// keys ใน Setting สำหรับ Thailand Post Track & Trace
export const TPK = {
  enabled: "thpost.enabled",
  apikey: "thpost.apikey", // 🔒 ความลับ (API key จาก track.thailandpost.co.th)
};

const AUTH_URL = "https://trackapi.thailandpost.co.th/post/api/v1/authenticate/token";
const TRACK_URL = "https://trackapi.thailandpost.co.th/post/api/v1/track";

// คำอธิบายสถานะบอกว่า "นำจ่ายสำเร็จ" หรือไม่ (ใช้ reconcile ปิดออเดอร์)
export function looksDelivered(statusText) {
  return /นำจ่ายสำเร็จ|จ่ายสำเร็จ|delivered/i.test(statusText || "");
}

// ช่องทางจัดส่งเป็นไปรษณีย์ไทยหรือไม่ (รองรับติดตามอัตโนมัติผ่าน API)
export function isThaiPostMethod(name) {
  return /ไปรษณีย์|thailand\s*post/i.test(name || "");
}

// สร้างลิงก์ tracking จาก template ของขนส่ง ({code} = เลขพัสดุ)
export function buildTrackingUrl(tpl, code) {
  if (!tpl || !code) return null;
  const c = encodeURIComponent(String(code).trim());
  return tpl.includes("{code}") ? tpl.replace(/\{code\}/g, c) : tpl;
}

// แปลงวันที่จากไปรษณีย์ไทย → ISO string
// รูปแบบไทย "DD/MM/YYYY HH:mm:ss+07:00" (ปี พ.ศ.) — new Date() แปลงตรงๆ ไม่ได้
function toIso(s) {
  if (!s) return null;
  const str = String(s).trim();
  const m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})[ T](\d{2}):(\d{2}):(\d{2})(.*)$/);
  if (m) {
    let [, dd, mm, yyyy, HH, MM, SS, tz] = m;
    let year = parseInt(yyyy, 10);
    if (year > 2200) year -= 543; // พ.ศ. → ค.ศ.
    tz = tz.trim() || "+07:00";
    const d = new Date(`${year}-${mm}-${dd}T${HH}:${MM}:${SS}${tz}`);
    return isNaN(d) ? null : d.toISOString();
  }
  const d = new Date(str); // เผื่อ API คืน ISO อยู่แล้ว
  return isNaN(d) ? null : d.toISOString();
}

// fetch พร้อม timeout — กัน API ค้างจนหน้าเว็บโหลดนาน
async function fetchT(url, options = {}, ms = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

export async function getThaipostConfig() {
  const rows = await prisma.setting.findMany({ where: { key: { in: Object.values(TPK) } } });
  const m = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    enabled: m[TPK.enabled] === "true",
    apikey: m[TPK.apikey] || "",
  };
}

// cache JWT token ในหน่วยความจำ (ต่อ apikey) — ขอใหม่เมื่อใกล้หมดอายุ
const tokenCache = new Map(); // apikey -> { token, expireMs }

async function getToken(apikey) {
  const cached = tokenCache.get(apikey);
  if (cached && cached.expireMs - Date.now() > 60_000) return cached.token;

  const resp = await fetchT(AUTH_URL, {
    method: "POST",
    headers: { Authorization: `Token ${apikey}`, "Content-Type": "application/json" },
  });
  const data = await resp.json().catch(() => null);
  if (!resp.ok || !data?.token)
    throw new Error(data?.message || `ขอ token ไม่สำเร็จ (สถานะ ${resp.status})`);

  const expireMs = data.expire ? new Date(data.expire).getTime() : Date.now() + 60 * 60 * 1000;
  tokenCache.set(apikey, { token: data.token, expireMs });
  return data.token;
}

// ทดสอบการเชื่อมต่อ — แค่ขอ token ได้ก็ถือว่า key ใช้ได้
export async function testThaipostConnection() {
  const cfg = await getThaipostConfig();
  if (!cfg.apikey) return { ok: false, error: "กรอก API key ของไปรษณีย์ไทยก่อน" };
  try {
    tokenCache.delete(cfg.apikey); // บังคับขอใหม่
    await getToken(cfg.apikey);
    return { ok: true, message: "เชื่อมต่อไปรษณีย์ไทยสำเร็จ" };
  } catch (err) {
    return { ok: false, error: "เชื่อมต่อไม่ได้: " + err.message };
  }
}

// ดึงสถานะพัสดุจาก barcode → คืน { ok, latest, history } หรือ { ok:false, error }
export async function trackBarcode(barcode, apikeyOverride) {
  const cfg = apikeyOverride ? { apikey: apikeyOverride } : await getThaipostConfig();
  if (!cfg.apikey) return { ok: false, error: "ยังไม่ได้ตั้งค่า API key ไปรษณีย์ไทย" };
  const code = String(barcode || "").trim().toUpperCase();
  if (!code) return { ok: false, error: "ไม่มีเลขพัสดุ" };

  const doTrack = async (token) => {
    const resp = await fetchT(TRACK_URL, {
      method: "POST",
      headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ status: "all", language: "TH", barcode: [code] }),
    });
    return resp;
  };

  try {
    let token = await getToken(cfg.apikey);
    let resp = await doTrack(token);
    // token หมดอายุ/ถูกปฏิเสธ → ขอใหม่ครั้งเดียว
    if (resp.status === 401 || resp.status === 403) {
      tokenCache.delete(cfg.apikey);
      token = await getToken(cfg.apikey);
      resp = await doTrack(token);
    }
    const data = await resp.json().catch(() => null);
    if (!resp.ok || data?.status === false)
      return { ok: false, error: data?.message || `ไปรษณีย์ไทยตอบกลับ ${resp.status}` };

    const items = data?.response?.items?.[code];
    if (!Array.isArray(items) || items.length === 0)
      return { ok: false, error: "ยังไม่มีข้อมูลพัสดุนี้ (ตรวจสอบเลขพัสดุอีกครั้ง)" };

    // API เรียงจากเก่า→ใหม่; ล่าสุด = ตัวสุดท้าย · แปลงวันที่ไทย(พ.ศ.)→ISO
    const history = items.map((it) => ({
      status: it.status_description || it.status || "",
      date: toIso(it.status_date),
      location: it.location || "",
    }));
    const last = items[items.length - 1];
    // นำจ่ายสำเร็จ = status code 501 หรือคำอธิบายบอกว่าจ่ายสำเร็จ
    const isDelivered = (it) =>
      String(it.status) === "501" || looksDelivered(it.status_description);
    return {
      ok: true,
      delivered: items.some(isDelivered),
      latest: {
        status: last.status_description || last.status || "",
        date: toIso(last.status_date),
        location: last.location || "",
      },
      history,
    };
  } catch (err) {
    return { ok: false, error: "ดึงสถานะไม่สำเร็จ: " + err.message };
  }
}

// อัปเดตสถานะพัสดุของออเดอร์ลง DB — best-effort
export async function updateOrderTracking(orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, trackingNumber: true, status: true },
  });
  if (!order) return { ok: false, error: "ไม่พบออเดอร์" };
  if (!order.trackingNumber) return { ok: false, error: "ออเดอร์นี้ยังไม่มีเลขพัสดุ" };

  const res = await trackBarcode(order.trackingNumber);
  if (!res.ok) {
    // บันทึกเวลาที่ลองดึง เพื่อ throttle การเรียกซ้ำ
    await prisma.order.update({ where: { id: orderId }, data: { trackingUpdatedAt: new Date() } });
    return res;
  }

  // พัสดุนำจ่ายสำเร็จ → ปิดออเดอร์เป็น "สำเร็จ" อัตโนมัติ (ยกเว้นที่ยกเลิกไปแล้ว)
  const data = {
    trackingStatus: res.latest.status,
    trackingStatusDate: res.latest.date ? new Date(res.latest.date) : null,
    trackingUpdatedAt: new Date(),
    trackingHistory: res.history,
  };
  if (res.delivered && order.status !== "CANCELLED" && order.status !== "COMPLETED") {
    data.status = "COMPLETED";
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data,
  });
  return { ok: true, order: updated, latest: res.latest, history: res.history };
}
