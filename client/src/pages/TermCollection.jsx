import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useBooks } from "../api/books";
import BookCard from "../components/BookCard";

const TYPE_LABEL = { PUBLISHER: "สำนักพิมพ์", AUTHOR: "ผู้เขียน", TRANSLATOR: "ผู้แปล" };
const TYPE_PARAM = { PUBLISHER: "publisher", AUTHOR: "author", TRANSLATOR: "translator" };

export default function TermCollection({ type }) {
  const { slug } = useParams();
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  // resolve slug → ชื่อจริง
  const { data: term, isLoading: loadingTerm, isError } = useQuery({
    queryKey: ["term", type, slug],
    queryFn: async () => (await api.get(`/terms/${type.toLowerCase()}/${encodeURIComponent(slug)}`)).data,
    retry: false,
  });

  const { data, isLoading } = useBooks({
    [TYPE_PARAM[type]]: term?.name,
    sort,
    page,
    limit: 16,
  });

  if (loadingTerm) return <div className="py-24 text-center text-sub">กำลังโหลด...</div>;
  if (isError || !term)
    return (
      <div className="mx-auto max-w-page px-5 py-32 text-center">
        <p className="mb-4 text-sub">ไม่พบ{TYPE_LABEL[type]}นี้</p>
        <Link to="/books" className="text-[14px] text-accent">กลับไปร้านหนังสือ</Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-page px-5 py-12 sm:py-16">
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-[12px] text-sub">
        <Link to="/" className="hover:text-ink">หน้าแรก</Link><span>›</span>
        <Link to="/books" className="hover:text-ink">ร้านหนังสือ</Link><span>›</span>
        <span className="text-ink">{TYPE_LABEL[type]}</span>
      </nav>

      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] font-medium tracking-tight text-sub">{TYPE_LABEL[type]}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tightest text-ink sm:text-4xl">{term.name}</h1>
          {data && <p className="mt-2 text-[13px] text-sub">{data.total} เล่ม</p>}
        </div>
        <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}
          className="rounded-full border border-line bg-white px-4 py-2 text-[13px] text-ink outline-none focus:border-ink/30">
          <option value="newest">มาใหม่ล่าสุด</option>
          <option value="popular">ขายดี</option>
          <option value="price_asc">ราคาน้อย → มาก</option>
          <option value="price_desc">ราคามาก → น้อย</option>
        </select>
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-sub">กำลังโหลด...</p>
      ) : data?.items.length === 0 ? (
        <p className="py-20 text-center text-sub">ยังไม่มีหนังสือ</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {data.items.map((b) => <BookCard key={b.id} book={b} />)}
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
    </div>
  );
}
