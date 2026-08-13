import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { DEFAULT_NAV } from "../lib/navDefaults.js";

const router = Router();

const TERM_PATH = { PUBLISHER: "publisher", AUTHOR: "author", TRANSLATOR: "translator" };

// สร้างรายการย่อยแบบอัตโนมัติจากแหล่งข้อมูลจริง (แคชผลไว้กันดึงซ้ำ)
async function dynamicItems(source, cache) {
  if (source === "categories") {
    cache.categories ??= prisma.category.findMany({ orderBy: { name: "asc" }, select: { name: true, slug: true } });
    return (await cache.categories).filter((c) => c.slug).map((c) => ({ label: c.name, url: `/books?category=${c.slug}` }));
  }
  const type = { publishers: "PUBLISHER", authors: "AUTHOR", translators: "TRANSLATOR" }[source];
  if (!type) return [];
  cache[type] ??= prisma.term.findMany({ where: { type }, orderBy: { name: "asc" }, select: { name: true, slug: true } });
  return (await cache[type]).filter((t) => t.slug).map((t) => ({ label: t.name, url: `/${TERM_PATH[type]}/${t.slug}` }));
}

function parseChildren(raw) {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => x && x.label && x.url).map((x) => ({ label: String(x.label), url: String(x.url) })) : [];
  } catch {
    return [];
  }
}

// GET /api/nav — เมนูที่เปิดใช้งาน (พร้อม dropdown ที่ resolve แล้ว)
router.get("/", async (req, res, next) => {
  try {
    const items = await prisma.navItem.findMany({
      where: { active: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
    const list = items.length ? items : DEFAULT_NAV.map((n) => ({ id: n.url, ...n, dropdownSource: null, children: null }));

    const cache = {};
    const out = [];
    for (const it of list) {
      let dropdown = parseChildren(it.children); // ลิงก์ย่อยใส่เองมาก่อน
      if (it.dropdownSource) dropdown = dropdown.concat(await dynamicItems(it.dropdownSource, cache));
      out.push({ id: it.id, label: it.label, url: it.url, dropdown });
    }
    res.json(out);
  } catch (e) {
    next(e);
  }
});

export default router;
