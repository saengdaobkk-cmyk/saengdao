import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "./prisma.js";

// คีย์ตั้งค่าใน Setting สำหรับ Claude AI (แปลชื่อหนังสือ → slug อังกฤษ)
export const AIK = {
  enabled: "ai.enabled",
  apiKey: "ai.anthropicApiKey", // 🔒 ความลับ (SECRET_KEY_RE จับ "apikey")
  model: "ai.model",
};

const DEFAULT_MODEL = "claude-opus-5";

export async function getAiConfig() {
  const rows = await prisma.setting.findMany({ where: { key: { in: Object.values(AIK) } } });
  const m = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    enabled: m[AIK.enabled] === "true",
    apiKey: m[AIK.apiKey] || "",
    model: m[AIK.model] || DEFAULT_MODEL,
  };
}

// ทำความสะอาดเป็น slug อังกฤษ-เลข-ขีด ล้วน (กันผลลัพธ์ AI ที่มีเครื่องหมาย/ช่องว่าง/แท็ก)
const slugSan = (s) =>
  String(s || "").trim().toLowerCase()
    .replace(/\s+/g, "-").replace(/[^a-z0-9-]+/g, "")
    .replace(/-+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

const SYSTEM = [
  "You convert a Thai book title into a short English URL slug.",
  "If the book is a Thai translation of a work originally written in English (or another Western language), return that work's REAL original title.",
  "Otherwise translate the meaning into concise, natural English (about 3-8 words).",
  "Output ONLY the title in plain English words — no Thai characters, no quotes, no punctuation, no explanation, no markdown, nothing else.",
].join(" ");

// แปลชื่อหนังสือไทย → base slug อังกฤษ ด้วย Claude
// คืน "" เมื่อ: ปิดใช้งาน / ไม่มี key / ชื่อเป็นอังกฤษอยู่แล้ว / เรียกไม่สำเร็จ → ให้ผู้เรียก fallback ไปถอดเสียงเอง
export async function aiSlugBase(title, author = "") {
  const cfg = await getAiConfig();
  if (!cfg.enabled || !cfg.apiKey || !title) return "";
  if (!/[฀-๿]/.test(title)) return ""; // ไม่มีอักษรไทย = อังกฤษอยู่แล้ว ไม่ต้องเรียก AI
  try {
    const client = new Anthropic({ apiKey: cfg.apiKey });
    const resp = await client.messages.create({
      model: cfg.model,
      max_tokens: 512, // เผื่อ thinking (เปิดโดยค่าเริ่มต้นบน Opus/Sonnet 5) + คำตอบสั้นๆ
      system: SYSTEM,
      messages: [{ role: "user", content: author ? `Title: ${title}\nAuthor: ${author}` : `Title: ${title}` }],
    });
    const text = resp.content?.find((b) => b.type === "text")?.text || "";
    return slugSan(text);
  } catch {
    return ""; // เงียบไว้ — ปล่อยให้ fallback ถอดเสียง (ห้าม throw เพื่อไม่บล็อกการบันทึกหนังสือ)
  }
}

// ทดสอบการเชื่อมต่อ + โชว์ตัวอย่างการแปล (สำหรับปุ่มทดสอบในหลังบ้าน)
export async function aiTest() {
  const cfg = await getAiConfig();
  if (!cfg.apiKey) return { ok: false, error: "ยังไม่ได้ใส่ API key" };
  try {
    const client = new Anthropic({ apiKey: cfg.apiKey });
    const r = await client.messages.create({
      model: cfg.model,
      max_tokens: 512,
      system: SYSTEM,
      messages: [{ role: "user", content: "Title: โลกลี้ลับที่พืชรับรู้: คู่มืออ่านใจพืชฉบับนักชีววิทยา\nAuthor: Daniel Chamovitz" }],
    });
    const text = r.content?.find((b) => b.type === "text")?.text || "";
    return { ok: true, model: cfg.model, sample: slugSan(text) || "(ว่าง)" };
  } catch (e) {
    return { ok: false, error: (e?.message || "เรียก API ไม่สำเร็จ").slice(0, 200) };
  }
}
