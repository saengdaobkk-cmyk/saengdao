import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useBooks, useCategories } from "../api/books";
import BookCard from "./BookCard";

// ส่วนกรอง/grid/แบ่งหน้า — ค้นหาย้ายไปที่ไอคอนบนแถบเมนู (SearchModal → ?q=)
export default function BookCatalog({ eyebrow = "คอลเลกชัน", heading = "คัดสรรมาเพื่อคุณ", limit = 12, id }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCategory = searchParams.get("category") || "";
  const urlPublisher = searchParams.get("publisher") || "";
  const q = searchParams.get("q") || "";

  const [category, setCategory] = useState(urlCategory);
  const [publisher, setPublisher] = useState(urlPublisher);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setCategory(urlCategory);
    setPublisher(urlPublisher);
    setPage(1);
  }, [urlCategory, urlPublisher, q]);

  const clearSearch = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("q");
    setSearchParams(next);
  };

  const { data: categories } = useCategories();
  const { data, isLoading, isError } = useBooks({
    q: q || undefined,
    category: category || undefined,
    publisher: publisher || undefined,
    sort,
    page,
    limit,
  });

  const pickCategory = (slug) => {
    setCategory(slug);
    setPublisher("");
    setPage(1);
  };

  return (
    <section id={id} className="mx-auto max-w-page px-5 py-16 sm:py-20">
      {/* หัว */}
      <div className="mb-10">
        {q ? (
          <>
            <p className="text-[13px] font-medium tracking-tight text-sub">ผลการค้นหา</p>
            <h2 className="mt-1 text-3xl font-semibold tracking-tightest text-ink sm:text-4xl">“{q}”</h2>
            <p className="mt-2 flex items-center gap-3 text-[13px] text-sub">
              {data && <span>{data.total} เล่ม</span>}
              <button onClick={clearSearch} className="text-accent hover:underline">ล้างการค้นหา</button>
            </p>
          </>
        ) : (
          <>
            {eyebrow && <p className="text-[13px] font-medium tracking-tight text-sub">{eyebrow}</p>}
            <h2 className="mt-1 text-3xl font-semibold tracking-tightest text-ink sm:text-4xl">{heading}</h2>
            {data && <p className="mt-2 text-[13px] text-sub">{data.total} เล่ม</p>}
          </>
        )}
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
