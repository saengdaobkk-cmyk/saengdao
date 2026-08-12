import { prisma } from "./prisma.js";

// keys ใน Setting สำหรับ Cloudflare Turnstile
export const TSK = {
  enabled: "turnstileEnabled",
  siteKey: "turnstileSiteKey",
  secretKey: "turnstileSecretKey", // 🔒 (ชื่อมี "secret" → SECRET_KEY_RE กรองไม่ให้หลุด client)
};

export async function getTurnstileConfig() {
  const rows = await prisma.setting.findMany({ where: { key: { in: Object.values(TSK) } } });
  const m = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    enabled: m[TSK.enabled] === "true",
    siteKey: m[TSK.siteKey] || "",
    secretKey: m[TSK.secretKey] || "",
  };
}

// บังคับ CAPTCHA ก็ต่อเมื่อ เปิด + มี key ครบ (ไม่ครบ = ไม่บล็อก เว็บทำงานปกติ)
export function turnstileActive(cfg) {
  return cfg.enabled && !!cfg.siteKey && !!cfg.secretKey;
}

// ยืนยัน token กับ Cloudflare — คืน { ok, error?, skipped? }
export async function verifyTurnstile(token, remoteip) {
  const cfg = await getTurnstileConfig();
  if (!turnstileActive(cfg)) return { ok: true, skipped: true }; // ไม่ได้เปิดใช้ = ผ่าน
  if (!token) return { ok: false, error: "กรุณายืนยันว่าคุณไม่ใช่บอท แล้วลองใหม่" };
  try {
    const body = new URLSearchParams({ secret: cfg.secretKey, response: String(token) });
    if (remoteip) body.set("remoteip", remoteip);
    const resp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = await resp.json().catch(() => ({}));
    return data.success ? { ok: true } : { ok: false, error: "ยืนยันตัวตนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" };
  } catch {
    return { ok: false, error: "ยืนยันตัวตนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" };
  }
}
