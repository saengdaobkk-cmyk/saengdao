import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useBooks } from "../api/books";
import { useSettings } from "../api/settings";
import { useContent } from "../api/content";
import BookCard from "../components/BookCard";
import BookLoader from "../components/BookLoader";
import { SortDropdown } from "../components/BookCatalog";
import { img } from "../lib/img";

const TYPE_LABEL = { PUBLISHER: "สำนักพิมพ์", AUTHOR: "ผู้เขียน", TRANSLATOR: "ผู้แปล" };
const TYPE_PARAM = { PUBLISHER: "publisher", AUTHOR: "author", TRANSLATOR: "translator" };

export default function TermCollection({ type }) {
  const { slug } = useParams();
  const { showCollectionCount } = useSettings();
  const { t } = useContent();
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  // resolve slug → ชื่อจริง
  const { data: term, isLoading: loadingTerm, isError } = useQuery({
    queryKey: ["term", type, slug],
    queryFn: async () => (await api.get(`/terms/${type.toLowerCase()}/${encodeURIComponent(slug)}`)).data,
    retry: false,
  });

  const { data, isLoading, isPlaceholderData } = useBooks(
    {
      [TYPE_PARAM[type]]: term?.name,
      sort,
      page,
      limit: 16,
    },
    { enabled: !!term?.name } // รอให้รู้ชื่อสำนักพิมพ์ก่อน ไม่งั้นจะดึงหนังสือทั้งหมดมาแว็บนึง
  );
  // isPlaceholderData = กำลังโหลดชุดใหม่แต่ยังถือข้อมูลเก่า (คนละหมวด/สำนักพิมพ์) → ถือเป็นกำลังโหลด ไม่โชว์ของเก่า
  const booksLoading = isLoading || isPlaceholderData;

  if (loadingTerm) return <div className="py-24"><BookLoader /></div>;
  if (isError || !term)
    return (
      <div className="mx-auto max-w-page px-5 py-32 text-center">
        <p className="mb-4 text-sub">ไม่พบ{TYPE_LABEL[type]}นี้</p>
        <Link to="/books" className="text-[14px] text-accent">กลับไปร้านหนังสือ</Link>
      </div>
    );

  const isPerson = type === "AUTHOR" || type === "TRANSLATOR";
  const hasProfile = isPerson && (term.image || term.bio);

  const breadcrumb = (
    <nav className="flex flex-wrap items-center gap-1.5 text-[12px] text-sub sm:justify-end">
      <Link to="/" className="hover:text-ink">{t("product.bc_home", "หน้าแรก")}</Link><span>›</span>
      <Link to={`/${TYPE_PARAM[type]}s`} className="hover:text-ink">{TYPE_LABEL[type]}</Link><span>›</span>
      <span className="text-ink">{term.name}</span>
    </nav>
  );
  const sortSelect = <SortDropdown value={sort} onChange={(v) => { setSort(v); setPage(1); }} />;

  return (
    <div className="mx-auto max-w-page px-5 py-12 sm:py-16">
      {hasProfile ? (
        <>
          {/* breadcrumb ด้านบน */}
          <div className="mb-8">{breadcrumb}</div>
          {/* โปรไฟล์ — รูปซ้าย + ชื่อ/ประวัติขวา */}
          <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:gap-9">
            {term.image && (
              <img src={img(term.image, 480)} alt={term.name}
                className="h-52 w-52 shrink-0 self-center rounded-2xl object-cover ring-1 ring-line sm:h-60 sm:w-60 sm:self-start" />
            )}
            <div className="min-w-0">
              <h1 className="text-3xl font-semibold tracking-tightest text-ink sm:text-4xl">{term.name}</h1>
              {term.bio && <p className="mt-4 max-w-2xl whitespace-pre-line text-[15px] leading-relaxed text-sub">{term.bio}</p>}
            </div>
          </div>
          {/* หัวข้อ "หนังสือโดย X" + เรียงลำดับ */}
          <div className="mb-8 flex items-center justify-between gap-3 border-b border-line pb-4">
            <h2 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">{t("term.books_by", "หนังสือโดย")} {term.name}</h2>
            {sortSelect}
          </div>
        </>
      ) : (
        <>
          {/* หัวหน้า — ชื่อซ้าย / breadcrumb ขวา */}
          <div className="mb-8 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl font-semibold tracking-tightest text-ink sm:text-4xl">{term.name}</h1>
            {breadcrumb}
          </div>
          {/* จำนวน (ซ้าย) + เรียงลำดับ (ขวา) */}
          <div className="mb-10 flex items-center justify-between gap-3">
            <p className="text-[13px] text-sub">{data && !booksLoading && showCollectionCount ? `${data.total} เล่ม` : ""}</p>
            {sortSelect}
          </div>
        </>
      )}

      {booksLoading ? (
        <BookLoader />
      ) : data?.items.length === 0 ? (
        <p className="py-20 text-center text-sub">ยังไม่มีหนังสือ</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {data.items.map((b, i) => <BookCard key={b.id} book={b} index={i} reveal />)}
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
