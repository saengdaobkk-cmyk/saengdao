import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTermDirectory } from "../api/books";
import { useSettings } from "../api/settings";
import { img } from "../lib/img";
import BookLoader from "../components/BookLoader";

const META = {
  PUBLISHER: { label: "สำนักพิมพ์", path: "publisher", title: "สำนักพิมพ์ทั้งหมด", desc: "เลือกดูหนังสือตามสำนักพิมพ์" },
  AUTHOR: { label: "ผู้เขียน", path: "author", title: "ผู้เขียนทั้งหมด", desc: "เลือกดูหนังสือตามผู้เขียน" },
  TRANSLATOR: { label: "ผู้แปล", path: "translator", title: "ผู้แปลทั้งหมด", desc: "เลือกดูหนังสือตามผู้แปล" },
};

export default function TermDirectory({ type }) {
  const meta = META[type];
  const { data: items, isLoading } = useTermDirectory(type);
  const { showCollectionCount } = useSettings();
  const [q, setQ] = useState("");

  // เรียงตามจำนวนเล่ม (มาก→น้อย) แล้วชื่อ · กรองด้วยคำค้น
  const list = useMemo(() => {
    let arr = [...(items || [])];
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      arr = arr.filter((t) => t.name.toLowerCase().includes(s));
    }
    return arr.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "th"));
  }, [items, q]);

  return (
    <div className="mx-auto max-w-page px-5 py-12 sm:py-16">
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-[12px] text-sub">
        <Link to="/" className="hover:text-ink">หน้าแรก</Link><span>›</span>
        <Link to="/books" className="hover:text-ink">ร้านหนังสือ</Link><span>›</span>
        <span className="text-ink">{meta.label}</span>
      </nav>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] font-medium tracking-tight text-sub">{meta.desc}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tightest text-ink sm:text-4xl">{meta.title}</h1>
          {items && showCollectionCount && <p className="mt-2 text-[13px] text-sub">{items.length} {meta.label}</p>}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`ค้นหา${meta.label}...`}
          className="w-full rounded-full border border-line bg-white px-5 py-2.5 text-[14px] text-ink outline-none focus:border-ink/30 sm:w-72"
        />
      </div>

      {isLoading ? (
        <BookLoader />
      ) : list.length === 0 ? (
        <p className="py-20 text-center text-sub">{q ? "ไม่พบรายชื่อที่ค้นหา" : `ยังไม่มี${meta.label}`}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {list.map((t) => (
            <Link
              key={t.slug}
              to={`/${meta.path}/${t.slug}`}
              className="group flex flex-col items-center rounded-2xl border border-line bg-white px-4 py-8 text-center transition hover:border-ink/30 hover:shadow-md"
            >
              <span className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-line bg-mist">
                {t.image ? (
                  <img src={img(t.image, 360)} alt="" className="h-full w-full object-contain p-2.5" />
                ) : (
                  <span className="text-[32px] font-semibold text-sub">{(t.name || "?").slice(0, 1)}</span>
                )}
              </span>
              <span className="mt-5 block w-full truncate text-[16px] font-semibold text-ink transition-colors group-hover:text-accent">{t.name}</span>
              {showCollectionCount && <span className="mt-1 block text-[13px] text-sub">{t.count} เล่ม</span>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
