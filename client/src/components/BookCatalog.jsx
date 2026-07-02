import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useBooks, useCategories } from "../api/books";
import BookCard from "./BookCard";

// ส่วนค้นหา/กรอง/grid/แบ่งหน้า — ใช้ทั้งหน้าแรก (section) และหน้า /books
export default function BookCatalog({ eyebrow = "คอลเลกชัน", heading = "คัดสรรมาเพื่อคุณ", limit = 12, id }) {
  const [searchParams] = useSearchParams();
  const urlCategory = searchParams.get("category") || "";
  const urlPublisher = searchParams.get("publisher") || "";

  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState(urlCategory);
  const [publisher, setPublisher] = useState(urlPublisher);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setCategory(urlCategory);
    setPublisher(urlPublisher);
    setPage(1);
  }, [urlCategory, urlPublisher]);

  const { data: categories } = useCategories();
  const { data, isLoading, isError } = useBooks({
    q: q || undefined,
    category: category || undefined,
    publisher: publisher || undefined,
    sort,
    page,
    limit,
  });

  const submitSearch = (e) => {
    e.preventDefault();
    setQ(search);
    setPage(1);
  };
  const pickCategory = (slug) => {
    setCategory(slug);
    setPublisher("");
    setPage(1);
  };

  return (
    <section id={id} className="mx-auto max-w-page px-5 py-16 sm:py-20">
      {/* หัว + ค้นหา */}
      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {eyebrow && <p className="text-[13px] font-medium tracking-tight text-sub">{eyebrow}</p>}
          <h2 className="mt-1 text-3xl font-semibold tracking-tightest text-ink sm:text-4xl">{heading}</h2>
          {data && <p className="mt-2 text-[13px] text-sub">{data.total} เล่ม</p>}
        </div>
        <form onSubmit={submitSearch} className="relative w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาหนังสือ หรือผู้แต่ง"
            className="w-full rounded-full border border-line bg-mist px-4 py-2.5 pr-10 text-[14px] text-ink outline-none transition focus:border-ink/30 focus:bg-white"
          />
          <button type="submit" aria-label="ค้นหา" className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-2 text-sub hover:text-ink">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
          </button>
        </form>
      </div>

      {/* ตัวกรอง */}
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => pickCategory("")} className={chip(category === "" && !publisher)}>ทั้งหมด</button>
          {categories?.map((c) => (
            <button key={c.id} onClick={() => pickCategory(c.slug)} className={chip(category === c.slug)}>{c.name}</button>
          ))}
          {publisher && (
            <span className="flex items-center gap-1.5 rounded-full bg-ink px-3 py-2 text-[13px] text-white">
              สำนักพิมพ์: {publisher}
              <button onClick={() => { setPublisher(""); setPage(1); }} aria-label="ล้าง" className="text-white/70 hover:text-white">✕</button>
            </span>
          )}
        </div>
        <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}
          className="rounded-full border border-line bg-white px-4 py-2 text-[13px] text-ink outline-none focus:border-ink/30">
          <option value="newest">มาใหม่ล่าสุด</option>
          <option value="popular">ขายดี</option>
          <option value="price_asc">ราคาน้อย → มาก</option>
          <option value="price_desc">ราคามาก → น้อย</option>
        </select>
      </div>

      {/* รายการ */}
      {isLoading && <GridSkeleton n={limit} />}
      {isError && <p className="py-12 text-center text-sub">โหลดข้อมูลไม่สำเร็จ ลองรีเฟรชอีกครั้ง</p>}
      {data && data.items.length === 0 && <p className="py-20 text-center text-sub">ไม่พบหนังสือที่ค้นหา</p>}

      {data && data.items.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {data.items.map((book) => <BookCard key={book.id} book={book} />)}
          </div>
          {data.totalPages > 1 && (
            <div className="mt-16 flex items-center justify-center gap-6">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="text-[14px] text-sub transition hover:text-ink disabled:opacity-30">← ก่อนหน้า</button>
              <span className="text-[13px] tabular-nums text-sub">{data.page} / {data.totalPages}</span>
              <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="text-[14px] text-sub transition hover:text-ink disabled:opacity-30">ถัดไป →</button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function chip(active) {
  return `rounded-full px-4 py-2 text-[13px] tracking-tight transition ${active ? "bg-ink text-white" : "bg-mist text-ink/70 hover:bg-line"}`;
}

function GridSkeleton({ n = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[145/210] rounded-2xl bg-mist" />
          <div className="mt-3 h-3 w-1/3 rounded bg-mist" />
          <div className="mt-2 h-3.5 w-2/3 rounded bg-mist" />
        </div>
      ))}
    </div>
  );
}
