import { Link } from "react-router-dom";
import { useCategories, usePublishers } from "../api/books";

// โทนสีพื้นการ์ดหมวดหมู่ (วนลูป)
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

  return (
    <section className="mx-auto max-w-page px-5 py-12">
      {/* หมวดหมู่ */}
      {categories?.length > 0 && (
        <div>
          <div className="mb-6">
            <p className="text-[13px] font-medium tracking-tight text-sub">เลือกตามหมวด</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tightest text-ink sm:text-3xl">หมวดหมู่หนังสือ</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((c, i) => (
              <Link
                key={c.id}
                to={`/?category=${c.slug}#catalog`}
                className={`group relative flex h-28 flex-col justify-end overflow-hidden rounded-2xl bg-gradient-to-br ${TILES[i % TILES.length]} p-4 text-white`}
              >
                <span className="pointer-events-none absolute -right-3 -top-4 text-6xl font-bold opacity-15">
                  {c.name[0]}
                </span>
                <p className="text-[15px] font-semibold">{c.name}</p>
                <p className="text-[12px] text-white/80">{c.bookCount} เล่ม</p>
              </Link>
            ))}
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
