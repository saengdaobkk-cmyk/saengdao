import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useBooks } from "../api/books";
import BookCard from "./BookCard";
import { img } from "../lib/img";

// ผู้เขียนประจำเดือน — ปกใหญ่ฝั่งซ้าย + โปรไฟล์ผู้เขียน + แถวหนังสือฝั่งขวา
export default function AuthorSpotlight({ cfg }) {
  if (!cfg?.enabled || !cfg.name?.trim()) return null;

  // ปกใหญ่ฝั่งซ้าย (หนังสือเด่น 1 เล่ม)
  const { data: featData } = useBooks(
    { ids: cfg.featuredBookId },
    { enabled: !!cfg.featuredBookId }
  );
  const featured = featData?.items?.[0];

  // แถวหนังสือฝั่งขวา — auto = ดึงของผู้เขียนคนนี้ · manual = เลือกเอง
  const manual = cfg.mode === "manual" && cfg.bookIds.length > 0;
  const { data: booksData } = useBooks(
    manual
      ? { ids: cfg.bookIds.join(",") }
      : { author: cfg.name, sort: "newest", page: 1, limit: cfg.limit || 3 }
  );
  const books = (booksData?.items || []).slice(0, cfg.mode === "manual" ? cfg.bookIds.length : cfg.limit || 3);

  // resolve ชื่อ → slug สำหรับลิงก์ไปหน้าผู้เขียน
  const { data: term } = useQuery({
    queryKey: ["term", "AUTHOR", cfg.name],
    queryFn: async () => (await api.get(`/terms/author/${encodeURIComponent(cfg.name)}`)).data,
    enabled: !!cfg.name?.trim(),
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
  const authorLink = term?.slug ? `/author/${term.slug}` : `/author/${encodeURIComponent(cfg.name)}`;

  const featTo = featured ? `/books/${featured.slug || featured.id}` : null;

  return (
    <section className="mx-auto max-w-page px-5 py-10">
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.85fr)_1fr] lg:gap-16">
        {/* ปกใหญ่ฝั่งซ้าย */}
        {featured && featured.coverImage ? (
          <Link to={featTo} className="group block">
            <div className="relative overflow-hidden rounded-3xl bg-mist shadow-lg ring-1 ring-line">
              <img
                src={img(featured.coverImage, 900)}
                alt={featured.title}
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              />
            </div>
          </Link>
        ) : (
          <div className="flex aspect-[3/4] items-center justify-center rounded-3xl bg-mist text-sub ring-1 ring-line">
            <span className="text-5xl opacity-25">𝐀</span>
          </div>
        )}

        {/* โปรไฟล์ผู้เขียน + หนังสือ */}
        <div>
          <div className="flex items-start gap-5 sm:gap-6">
            {cfg.photo && (
              <img
                src={img(cfg.photo, 240)}
                alt={cfg.name}
                className="h-20 w-20 shrink-0 rounded-full object-cover ring-1 ring-line sm:h-24 sm:w-24"
              />
            )}
            <div className="min-w-0">
              {cfg.eyebrow && (
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-sub">{cfg.eyebrow}</p>
              )}
              <h2 className="mt-1.5 text-3xl font-semibold tracking-tightest text-ink sm:text-4xl">{cfg.name}</h2>
            </div>
          </div>

          {cfg.bio && (
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-sub">{cfg.bio}</p>
          )}

          {cfg.buttonText && (
            <Link
              to={authorLink}
              className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-6 py-2.5 text-[14px] font-medium text-ink transition hover:border-ink/30 hover:bg-mist"
            >
              {cfg.buttonText}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          )}

          {/* หนังสือของผู้เขียน */}
          {books.length > 0 && (
            <div className="mt-10 grid grid-cols-3 gap-4 sm:gap-5">
              {books.map((b) => (
                <BookCard key={b.id} book={b} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
