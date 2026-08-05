import { useRef } from "react";
import { useBooks } from "../api/books";
import BookCard from "./BookCard";
import SectionHeading from "./SectionHeading";

// แถวเลื่อนแนวนอน — หัวข้อ + ปุ่มเลื่อนซ้าย/ขวา
// โหมดอัตโนมัติ: เรียงตาม sort · โหมดเลือกเอง: ส่ง bookIds มาแสดงตามลำดับที่จัด
export default function BookRow({ title, subtitle, sort, mode = "auto", bookIds = [] }) {
  const scroller = useRef(null);
  const manual = mode === "manual" && bookIds.length > 0;
  const { data, isLoading } = useBooks(
    manual ? { ids: bookIds.join(",") } : { sort, page: 1, limit: 10 }
  );

  const scroll = (dir) => {
    scroller.current?.scrollBy({ left: dir * 520, behavior: "smooth" });
  };

  return (
    <section className="mx-auto max-w-page px-5 py-10">
      <SectionHeading
        subtitle={subtitle}
        title={title}
        className="mb-8"
        right={
          <div className="hidden gap-2 sm:flex">
            <ArrowBtn dir="left" onClick={() => scroll(-1)} />
            <ArrowBtn dir="right" onClick={() => scroll(1)} />
          </div>
        }
      />

      {isLoading ? (
        <div className="flex gap-5 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-[160px] shrink-0 animate-pulse sm:w-[200px]">
              <div className="aspect-[145/210] rounded-2xl bg-mist" />
              <div className="mt-3 h-3 w-2/3 rounded bg-mist" />
            </div>
          ))}
        </div>
      ) : (
        <div
          ref={scroller}
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {(data?.items || []).map((book) => (
            <div key={book.id} className="w-[160px] shrink-0 snap-start sm:w-[200px]">
              <BookCard book={book} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ArrowBtn({ dir, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={dir === "left" ? "เลื่อนซ้าย" : "เลื่อนขวา"}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-sub transition hover:border-ink/30 hover:text-ink"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {dir === "left" ? (
          <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </button>
  );
}
