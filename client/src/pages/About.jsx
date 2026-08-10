import { Link } from "react-router-dom";
import { useContent } from "../api/content";
import ContactSection from "../components/ContactSection";

// ดาว ✦ — signature ของหน้า (สื่อ "แสงดาว")
const Star = ({ className = "" }) => <span className={`text-accent ${className}`} aria-hidden>✦</span>;

// สัญลักษณ์หนังสือแสงดาว (isometric) — ใช้ currentColor ปรับสี/ขนาดได้
const BookMark = ({ className = "" }) => (
  <svg viewBox="0 0 150 205" fill="none" className={className} aria-hidden="true">
    <g stroke="currentColor" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round">
      <path d="M60 14 L129 53 L88 76 L18 37 Z" />
      <path d="M60 14 L129 53 L129 170 L60 130 Z" />
      <path d="M60 14 L18 37 L18 154 L60 130 Z" />
      <path d="M40 25 L108 64" />
    </g>
  </svg>
);

export default function About() {
  const { t } = useContent();

  const stats = [
    { n: t("about.stat1_num", ""), l: t("about.stat1_label", "") },
    { n: t("about.stat2_num", ""), l: t("about.stat2_label", "") },
    { n: t("about.stat3_num", ""), l: t("about.stat3_label", "") },
  ].filter((x) => x.n || x.l);

  const missionLines = t("about.story_mission", "").split("\n").map((l) => l.trim()).filter(Boolean);

  return (
    <div>
      {/* ── Hero: คติเป็นประโยคเด่น ── */}
      <section className="overflow-hidden">
        <div className="relative mx-auto max-w-page px-5 pb-16 pt-16 sm:pb-24 sm:pt-24">
          <BookMark className="pointer-events-none absolute right-2 top-10 hidden w-[260px] text-ink/[0.06] lg:block xl:right-6 xl:w-[300px]" />
          <div className="relative max-w-4xl">
          <p className="flex items-center gap-2.5 text-[13.5px] font-semibold tracking-[0.03em] text-accent">
            <Star /> {t("about.eyebrow", "เกี่ยวกับเรา")}
          </p>
          <h1 className="mt-7 text-[2.5rem] font-semibold leading-[1.08] tracking-tightest text-ink sm:text-6xl">
            {t("about.tagline", "การอ่าน ทำให้เป็นคนโดยสมบูรณ์")}
          </h1>
          {t("about.tagline_note", "") && (
            <p className="mt-5 text-[13.5px] tracking-[0.04em] text-sub">{t("about.tagline_note", "")}</p>
          )}
          {t("about.intro", "") && (
            <p className="mt-9 max-w-2xl whitespace-pre-line text-[17px] leading-relaxed text-ink/70">{t("about.intro", "")}</p>
          )}
          {t("about.title", "") && (
            <p className="mt-7 text-[14px] font-medium tracking-[0.02em] text-sub">— {t("about.title", "")}</p>
          )}
          </div>
        </div>
      </section>

      {/* ── แถบสถิติ ── */}
      {stats.length > 0 && (
        <section className="border-y border-line bg-mist/40">
          <div className="mx-auto grid max-w-page grid-cols-3 divide-x divide-line px-5">
            {stats.map((st, i) => (
              <div key={i} className="px-3 py-9 text-center sm:py-14">
                <p className="text-[1.7rem] font-semibold tracking-tightest text-ink sm:text-5xl">{st.n}</p>
                {st.l && <p className="mt-2 text-[11.5px] leading-snug tracking-wide text-sub sm:text-[13px]">{st.l}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── เรื่องราวของแสงดาว (long-form) ── */}
      {(t("about.story_heading", "") || t("about.story_body", "")) && (
        <section className="relative overflow-hidden border-t border-line">
          {/* ลายน้ำสัญลักษณ์หนังสือจางๆ ด้านหลัง */}
          <BookMark className="pointer-events-none absolute -right-14 top-10 hidden w-[420px] text-ink/[0.045] lg:block" />
          <div className="relative mx-auto max-w-page px-5 py-20 sm:py-28">
            <div className="mx-auto max-w-2xl">
              {/* มาสต์เฮด: สัญลักษณ์หนังสือแสงดาว */}
              <BookMark className="mb-7 w-11 text-ink sm:w-[52px]" />

              <h2 className="text-3xl font-semibold tracking-tightest text-ink sm:text-[2.5rem] sm:leading-[1.1]">
                {t("about.story_heading", "เรื่องราวของแสงดาว")}
              </h2>

              {t("about.story_lead", "") && (
                <p className="mt-5 text-[1.4rem] font-medium leading-[1.4] tracking-tight text-ink sm:text-[1.7rem] sm:leading-[1.35]">
                  {t("about.story_lead", "")}
                </p>
              )}

              {t("about.story_body", "") && (
                <div className="mt-8 whitespace-pre-line text-[16.5px] leading-[1.95] text-ink/75">
                  {t("about.story_body", "")}
                </div>
              )}

              {/* บล็อกเน้น: บางเล่ม… */}
              {t("about.story_quote", "") && (
                <blockquote className="my-11 border-l-2 border-accent pl-6 sm:pl-8">
                  <p className="whitespace-pre-line text-xl font-medium leading-[1.7] tracking-tight text-ink sm:text-[1.55rem] sm:leading-[1.55]">
                    {t("about.story_quote", "")}
                  </p>
                </blockquote>
              )}

              {t("about.story_body2", "") && (
                <div className="whitespace-pre-line text-[16.5px] leading-[1.95] text-ink/75">
                  {t("about.story_body2", "")}
                </div>
              )}

              {/* ภารกิจ (3 บรรทัด) */}
              {missionLines.length > 0 && (
                <div className="mt-8 space-y-3.5">
                  {missionLines.map((line, i) => (
                    <p key={i} className="flex items-start gap-3 text-[17px] font-medium leading-snug text-ink">
                      <Star className="mt-[3px] shrink-0 text-[13px]" />
                      <span>{line}</span>
                    </p>
                  ))}
                </div>
              )}

              {t("about.story_coda", "") && (
                <p className="mt-10 whitespace-pre-line text-[19px] font-medium leading-relaxed tracking-tight text-ink">
                  {t("about.story_coda", "")}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── ข้อมูลติดต่อ (ไม่มีฟอร์ม) ── */}
      <ContactSection id="contact" />

      {/* ── ปิดท้าย: แถบท้องฟ้ายามค่ำ + แสงดาว + ลายน้ำโลโก้ ── */}
      {t("about.closing", "") && (
        <section className="relative overflow-hidden bg-ink">
          {/* ดาวจางๆ */}
          <div aria-hidden className="pointer-events-none absolute inset-0 text-white/25">
            <span className="absolute left-[12%] top-[22%] text-[10px]">✦</span>
            <span className="absolute left-[80%] top-[18%] text-[13px]">✦</span>
            <span className="absolute left-[28%] top-[70%] text-[9px]">✦</span>
            <span className="absolute left-[66%] top-[62%] text-[11px]">✦</span>
            <span className="absolute left-[46%] top-[30%] text-[8px]">✦</span>
          </div>
          <div className="relative mx-auto max-w-page px-5 py-24 text-center sm:py-32">
            <Star className="!text-white/70 text-xl" />
            <p className="mx-auto mt-6 max-w-2xl whitespace-pre-line text-2xl font-medium leading-[1.5] tracking-tight text-white sm:text-[2rem]">
              {t("about.closing", "")}
            </p>
            <Link
              to="/books"
              className="mt-10 inline-flex items-center rounded-full bg-white px-8 py-3.5 text-[15px] font-medium text-ink transition hover:bg-white/90 active:scale-[0.98]"
            >
              เลือกซื้อหนังสือ
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
