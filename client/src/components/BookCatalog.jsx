import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useBooks, useCategories } from "../api/books";
import { useSettings } from "../api/settings";
import BookCard from "./BookCard";

const SORT_OPTIONS = [
  { value: "newest", label: "มาใหม่ล่าสุด" },
  { value: "popular", label: "ขายดี" },
  { value: "price_asc", label: "ราคาน้อย → มาก" },
  { value: "price_desc", label: "ราคามาก → น้อย" },
];

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

  const { showCollectionCount } = useSettings();
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
            <p className="text-[15px] font-medium tracking-tight text-sub">ผลการค้นหา</p>
            <h2 className="mt-1 text-3xl font-semibold tracking-tightest text-ink sm:text-4xl">“{q}”</h2>
            <p className="mt-2 flex items-center gap-3 text-[15px] text-sub">
              {data && <span>{data.total} เล่ม</span>}
              <button onClick={clearSearch} className="text-accent hover:underline">ล้างการค้นหา</button>
            </p>
          </>
        ) : (
          <>
            {eyebrow && <p className="text-[15px] font-medium tracking-tight text-sub">{eyebrow}</p>}
            <h2 className="mt-1 text-3xl font-semibold tracking-tightest text-ink sm:text-4xl">{heading}</h2>
            {data && showCollectionCount && <p className="mt-2 text-[15px] text-sub">{data.total} เล่ม</p>}
          </>
        )}
      </div>

      {/* ตัวกรอง — หมวดหมู่เลื่อนแนวนอนได้ (รองรับหมวดเยอะๆ) */}
      <div className="mb-10 flex items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <div className="no-scrollbar flex gap-2 overflow-x-auto scroll-smooth py-0.5 pr-8">
            <button onClick={() => pickCategory("")} className={chip(category === "" && !publisher)}>ทั้งหมด</button>
            {categories?.map((c) => (
              <button key={c.id} onClick={() => pickCategory(c.slug)} className={chip(category === c.slug)}>{c.name}</button>
            ))}
            {publisher && (
              <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-ink px-3.5 py-2 text-[15px] text-white">
                สำนักพิมพ์: {publisher}
                <button onClick={() => { setPublisher(""); setPage(1); }} aria-label="ล้าง" className="text-white/70 hover:text-white">✕</button>
              </span>
            )}
          </div>
          {/* fade ขวา บอกว่ามีหมวดต่อ */}
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent" />
        </div>
        <SortDropdown value={sort} onChange={(v) => { setSort(v); setPage(1); }} />
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
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="text-[16px] text-sub transition hover:text-ink disabled:opacity-30">← ก่อนหน้า</button>
              <span className="text-[15px] tabular-nums text-sub">{data.page} / {data.totalPages}</span>
              <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="text-[16px] text-sub transition hover:text-ink disabled:opacity-30">ถัดไป →</button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

// dropdown เรียงลำดับ — ปุ่ม pill + เมนู popover (แทน select เดิม)
function SortDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = SORT_OPTIONS.find((o) => o.value === value) || SORT_OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex items-center gap-2 rounded-full border bg-white px-4 py-2.5 text-[15.5px] text-ink transition ${open ? "border-ink/40" : "border-line hover:border-ink/25"}`}
      >
        <span className="whitespace-nowrap">{current.label}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`text-sub transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-20 mt-2 min-w-[190px] overflow-hidden rounded-xl border border-line bg-white py-1 shadow-lg"
        >
          {SORT_OPTIONS.map((o) => {
            const active = o.value === value;
            return (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => { onChange(o.value); setOpen(false); }}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-[15.5px] transition hover:bg-mist ${active ? "font-medium text-ink" : "text-sub"}`}
                >
                  {o.label}
                  {active && (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-accent">
                      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function chip(active) {
  return `shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[15px] tracking-tight transition ${active ? "bg-ink text-white" : "bg-mist text-ink/70 hover:bg-line"}`;
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
