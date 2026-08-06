import { Link } from "react-router-dom";
import { useBooks } from "../api/books";
import { formatPrice } from "../lib/format";
import { priceInfo } from "../lib/pricing";
import { img } from "../lib/img";
import SectionHeading from "./SectionHeading";

// section แนะนำ — กริดการ์ดแนวนอน (ปกซ้าย + ข้อมูลขวา) + ปุ่มดูทั้งหมด
// โหมดอัตโนมัติ: เรียงตาม sort · โหมดเลือกเอง: ตาม bookIds
export default function BookGridSection({ title, subtitle, sort, mode = "auto", bookIds = [], limit = 12 }) {
  const manual = mode === "manual" && bookIds.length > 0;
  const { data } = useBooks(manual ? { ids: bookIds.join(",") } : { sort, page: 1, limit });
  const items = data?.items || [];
  if (!items.length) return null;

  return (
    <section className="mx-auto max-w-page px-5 py-10">
      <SectionHeading
        title={title}
        subtitle={subtitle}
        className="mb-8"
        right={
          <Link to="/books" className="border-b border-ink pb-0.5 text-[14px] text-ink transition hover:opacity-60">
            ดูหนังสือทั้งหมด
          </Link>
        }
      />
      <div className="grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((book) => <MiniCard key={book.id} book={book} />)}
      </div>
    </section>
  );
}

// การ์ดแนวนอน: ปกเล็กซ้าย + ผู้แต่ง/ชื่อ/ราคา ขวา
function MiniCard({ book }) {
  const pi = priceInfo(book);
  const hasCut = pi.price < pi.original;
  return (
    <Link to={`/books/${book.slug || book.id}`} className="group flex gap-4">
      <div className="aspect-[145/210] w-[104px] shrink-0 overflow-hidden rounded-lg bg-mist ring-1 ring-line">
        {book.coverImage ? (
          <img src={img(book.coverImage, 300)} alt={book.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl opacity-25">𝐀</div>
        )}
      </div>
      <div className="min-w-0 flex-1 self-center">
        {hasCut && (
          <span className={`mb-1.5 inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold text-white ${pi.hot ? "bg-orange-500" : "bg-rose-500"}`}>Sale</span>
        )}
        {book.author && <p className="truncate text-[11px] font-medium uppercase tracking-wide text-sub">{book.author}</p>}
        <h3 className="mt-0.5 line-clamp-2 text-[15px] font-medium leading-snug text-ink transition-colors group-hover:text-accent">{book.title}</h3>
        {hasCut ? (
          <p className="mt-1.5 flex items-center gap-2">
            <span className={`text-[14px] font-semibold ${pi.hot ? "text-orange-600" : "text-rose-600"}`}>{formatPrice(pi.price)}</span>
            <span className="text-[12px] text-sub line-through">{formatPrice(pi.original)}</span>
          </p>
        ) : (
          <p className="mt-1.5 text-[14px] font-semibold text-ink">{formatPrice(pi.price)}</p>
        )}
      </div>
    </Link>
  );
}
