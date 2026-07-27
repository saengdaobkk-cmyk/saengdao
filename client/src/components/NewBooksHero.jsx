import { Link } from "react-router-dom";
import { useBooks } from "../api/books";
import { img } from "../lib/img";

// section "หนังสือมาใหม่" แนว 3 มิติ — การ์ดปกเรียงพัด + แผงข้างเอียงสร้างมิติ
export default function NewBooksHero() {
  const { data, isLoading } = useBooks({ sort: "newest", page: 1, limit: 10 });
  const books = data?.items || [];

  if (isLoading) return <HeroSkeleton />;
  if (books.length === 0) return null;

  const fan = books.slice(0, 5);
  const mid = (fan.length - 1) / 2;
  const sideA = books[5]?.coverImage || fan[0]?.coverImage;
  const sideB = books[6]?.coverImage || fan[fan.length - 1]?.coverImage;

  return (
    <section className="relative overflow-hidden bg-[#0e0e11] py-16 text-white sm:py-24">
      {/* แสงนวลกลางจอ */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]" />

      {/* แผงข้างซ้าย/ขวา — เอียงเข้าหากลางสร้างมิติ (ซ่อนบนจอเล็ก) */}
      <SidePanel src={sideA} side="left" />
      <SidePanel src={sideB} side="right" />

      {/* เนื้อหากลาง */}
      <div className="relative mx-auto max-w-3xl px-5 text-center">
        <div className="mb-3 flex flex-col items-center gap-2.5">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/80">
            <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10a2 2 0 0 1 2 2v13a1.6 1.6 0 0 0-1.5-1H5.5A1.5 1.5 0 0 1 4 16.5v-11Z" />
            <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H14a2 2 0 0 0-2 2v13a1.6 1.6 0 0 1 1.5-1h5A1.5 1.5 0 0 0 20 16.5v-11Z" />
          </svg>
          <p className="text-[12px] font-medium tracking-[0.32em] text-white/45">SAENGDAO</p>
        </div>
        <h2 className="text-3xl font-semibold tracking-tightest sm:text-[42px]">หนังสือมาใหม่</h2>

        {/* การ์ดปกเรียงพัด */}
        <div className="mt-10 flex items-end justify-center gap-2 sm:mt-12 sm:gap-3">
          {fan.map((b, i) => {
            const off = i - mid;
            const style = {
              transform: `rotate(${off * 6}deg) translateY(${Math.abs(off) * 18}px)`,
              zIndex: 10 - Math.abs(off),
            };
            return (
              <Link
                key={b.id}
                to={`/books/${b.id}`}
                style={style}
                className="group relative block w-[92px] shrink-0 origin-bottom transition-transform duration-300 hover:-translate-y-2 sm:w-[132px]"
              >
                <div className="aspect-[145/210] overflow-hidden rounded-xl bg-white/5 shadow-2xl ring-1 ring-white/10">
                  {b.coverImage ? (
                    <img src={img(b.coverImage, 300)} alt={b.title} loading="lazy"
                      className="h-full w-full object-cover transition duration-300 group-hover:brightness-110" />
                  ) : (
                    <div className="flex h-full items-center justify-center p-2 text-center text-[10px] text-white/60">{b.title}</div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        <p className="mx-auto mt-10 max-w-md text-[14px] leading-relaxed text-white/55 sm:mt-12">
          รวมหนังสือใหม่ล่าสุด คัดมาเพื่อคุณ — อัปเดตอยู่เสมอ พร้อมส่งถึงบ้านทั่วประเทศ
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link to="/books" className="rounded-full bg-white px-7 py-3 text-[14px] font-medium text-ink transition hover:bg-white/90 active:scale-[0.98]">
            ดูหนังสือใหม่ทั้งหมด
          </Link>
          <Link to="/books" className="rounded-full border border-white/20 px-6 py-3 text-[14px] font-medium text-white/90 transition hover:border-white/40 hover:text-white">
            หมวดหมู่หนังสือ
          </Link>
        </div>
      </div>
    </section>
  );
}

function SidePanel({ src, side }) {
  if (!src) return null;
  const left = side === "left";
  return (
    <div className={`pointer-events-none absolute inset-y-6 hidden w-[19%] [perspective:1100px] lg:block ${left ? "left-0" : "right-0"}`}>
      <div
        className={`relative h-full w-full ${left ? "origin-left" : "origin-right"}`}
        style={{ transform: `rotateY(${left ? 34 : -34}deg)` }}
      >
        <img src={img(src, 520)} alt="" className={`h-full w-full object-cover opacity-70 ${left ? "rounded-r-3xl" : "rounded-l-3xl"}`} />
        <div className={`absolute inset-0 ${left ? "rounded-r-3xl bg-gradient-to-r" : "rounded-l-3xl bg-gradient-to-l"} from-transparent via-[#0e0e11]/30 to-[#0e0e11]`} />
      </div>
    </div>
  );
}

function HeroSkeleton() {
  return (
    <section className="bg-[#0e0e11] py-20">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-5">
        <div className="h-8 w-48 animate-pulse rounded bg-white/10" />
        <div className="mt-10 flex items-end justify-center gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="aspect-[145/210] w-[92px] animate-pulse rounded-xl bg-white/10 sm:w-[132px]" />
          ))}
        </div>
      </div>
    </section>
  );
}
