import { useRef } from "react";
import { Link } from "react-router-dom";
import { useCategories, usePublishers } from "../api/books";

// โทนสีพื้นการ์ดหมวดหมู่ (fallback เมื่อยังไม่มีรูป — วนลูป)
const TILES = [
  "from-indigo-500 to-indigo-700",
  "from-rose-500 to-rose-700",
  "from-emerald-500 to-emerald-700",
  "from-amber-500 to-amber-600",
  "from-sky-500 to-sky-700",
  "from-violet-500 to-violet-700",
];

export default function BrowseSections() {
  const { data: categories } = useCategories();
  const { data: publishers } = usePublishers();
  const scroller = useRef(null);
  const scroll = (dir) => scroller.current?.scrollBy({ left: dir * 360, behavior: "smooth" });

  return (
    <section className="mx-auto max-w-page px-5 py-12">
      {/* หมวดหมู่ — carousel การ์ดรูป */}
      {categories?.length > 0 && (
        <div>
          <div className="mb-6 flex items-center gap-4">
            <h2 className="whitespace-nowrap text-2xl font-semibold tracking-tightest text-ink sm:text-3xl">หมวดหมู่หนังสือ</h2>
            <div className="hidden h-px flex-1 bg-line sm:block" />
            <Link to="/books" className="shrink-0 rounded-full bg-ink px-5 py-2 text-[13px] font-medium text-white transition hover:bg-ink/90">
              ดูทั้งหมด →
            </Link>
          </div>

          <div className="relative">
            <div ref={scroller} className="no-scrollbar flex snap-x gap-4 overflow-x-auto scroll-smooth">
              {categories.map((c, i) => (
                <Link
                  key={c.id}
                  to={`/?category=${c.slug}#catalog`}
                  className="group relative aspect-[16/10] w-[260px] shrink-0 snap-start overflow-hidden rounded-2xl sm:w-[340px]"
                >
                  {c.image ? (
                    <img src={c.image} alt={c.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${TILES[i % TILES.length]}`}>
                      <span className="text-7xl font-bold text-white/25">{c.name[0]}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-[18px] font-semibold text-white drop-shadow-sm">{c.name}</p>
                    <p className="text-[12px] text-white/80">{c.bookCount} เล่ม</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* ลูกศรเลื่อน (เดสก์ท็อป) */}
            <button onClick={() => scroll(-1)} aria-label="ก่อนหน้า"
              className="absolute left-1 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white/90 text-ink shadow-md backdrop-blur transition hover:bg-white sm:flex">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button onClick={() => scroll(1)} aria-label="ถัดไป"
              className="absolute right-1 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white/90 text-ink shadow-md backdrop-blur transition hover:bg-white sm:flex">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* สำนักพิมพ์ */}
      {publishers?.length > 0 && (
        <div className="mt-14">
          <div className="mb-6">
            <p className="text-[13px] font-medium tracking-tight text-sub">เลือกตามสำนักพิมพ์</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tightest text-ink sm:text-3xl">สำนักพิมพ์</h2>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {publishers.map((p) => (
              <Link
                key={p.name}
                to={`/?publisher=${encodeURIComponent(p.name)}#catalog`}
                className="flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-[14px] text-ink transition hover:border-ink/40"
              >
                {p.name}
                <span className="rounded-full bg-mist px-1.5 text-[11px] text-sub">{p.count}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
