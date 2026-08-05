import { next, rewrite } from "@vercel/edge";

// เฉพาะหน้าบทความ + สินค้า (ที่ต้องการ preview ตอนแชร์)
export const config = { matcher: ["/blog/:path*", "/books/:path*"] };

// bot ที่มาดึงลิงก์เพื่อทำ preview
const BOT = /facebookexternalhit|facebookcatalog|Facebot|Twitterbot|line-poker|LINE|Slackbot|Discordbot|WhatsApp|TelegramBot|Pinterest|LinkedInBot|Googlebot|bingbot|redditbot|Applebot|SkypeUriPreview|vkShare|W3C_Validator/i;

export default function middleware(req) {
  const ua = req.headers.get("user-agent") || "";
  if (!BOT.test(ua)) return next(); // คนจริง → SPA ปกติ

  // bot → ให้ serverless function คืน OG meta ของหน้านั้น
  const url = new URL(req.url);
  return rewrite(new URL(`/api/og?path=${encodeURIComponent(url.pathname)}`, url.origin));
}
