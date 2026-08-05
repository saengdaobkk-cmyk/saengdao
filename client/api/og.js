// Serverless function — คืน HTML ที่มี Open Graph meta ถูกต้องให้ bot (Facebook/LINE/Twitter ฯลฯ)
// เรียกจาก middleware เฉพาะเมื่อ user-agent เป็น bot · คนจริงได้ SPA ปกติ
const API = (process.env.VITE_API_URL || "https://royalblue-partridge-940351.hostingersite.com").replace(/\/$/, "") + "/api";
const SITE = "https://saengdao.vercel.app";

const esc = (s) => String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clean = (s) => String(s || "").replace(/[#*_>`\-\[\]!]/g, "").replace(/\s+/g, " ").trim().slice(0, 200);

export default async function handler(req, res) {
  const path = String(req.query.path || "/");
  let title = "SAENGDAO — ร้านหนังสือออนไลน์";
  let desc = "ร้านหนังสือออนไลน์ สำนักพิมพ์แสงดาว";
  let image = "";
  let type = "website";

  try {
    if (path.startsWith("/blog/")) {
      const p = await (await fetch(`${API}/blog/${encodeURIComponent(path.slice(6))}`)).json();
      if (p?.title) { title = p.title; desc = clean(p.excerpt || p.content); image = p.coverImage || ""; type = "article"; }
    } else if (path.startsWith("/books/")) {
      const b = await (await fetch(`${API}/books/${encodeURIComponent(path.slice(7))}`)).json();
      if (b?.title) { title = `${b.title}${b.author ? " · " + b.author : ""}`; desc = clean(b.description); image = b.coverImage || ""; type = "product"; }
    }
  } catch { /* ใช้ค่าตั้งต้น */ }

  const url = SITE + path;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300");
  res.status(200).send(`<!doctype html><html lang="th"><head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="SAENGDAO">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
${image ? `<meta property="og:image" content="${esc(image)}">` : ""}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
${image ? `<meta name="twitter:image" content="${esc(image)}">` : ""}
</head><body><a href="${esc(url)}">${esc(title)}</a></body></html>`);
}
