import { Link } from "react-router-dom";
import { useContent } from "../api/content";
import ContactSection from "../components/ContactSection";

// ดาว ✦ — signature ของหน้า (สื่อ "แสงดาว")
const Star = ({ className = "" }) => <span className={`text-accent ${className}`} aria-hidden>✦</span>;

// สัญลักษณ์หนังสือแสงดาว (โลโก้จริง) — ใช้ currentColor ปรับสี/ขนาด/ความจางได้
const BookMark = ({ className = "" }) => (
  <svg viewBox="0 0 1838.65 1838.65" fill="currentColor" className={className} aria-hidden="true">
    <path d="M1413.16,458.83c-.56-50.38-20.82-104.16-68.56-151.9-44.52-44.51-97.26-68.44-152.53-69.07-51.36-.31-99.73,19.11-136.24,55.61l-144.62,144.62v-178.09c0-12.25-7.39-23.28-18.71-27.96-11.29-4.71-24.34-2.13-32.98,6.53l-379.2,379.21c-32.23,32.23-53.03,77.8-54.89,127.36-.47,2.1-.73,4.28-.73,6.49v628.69c0,56.07,24.55,111.48,69.12,156.05,48.39,48.42,103.06,68.56,154.03,68.56s100.89-21.3,134.71-55.11l144.64-144.59v174.91c0,12.21,7.34,23.22,18.62,27.95,3.76,1.55,7.74,2.32,11.68,2.32,7.8,0,15.5-3.02,21.26-8.73l425.89-420.9c5.75-5.68,9-13.44,9-21.51V464.22c0-1.84-.17-3.64-.5-5.38ZM1098.67,336.33c24.87-24.88,58.02-38.2,92.67-37.93,39.12.5,77.3,18.24,110.42,51.38,71.1,71.03,60.61,155.99,13.51,203.11l-144.69,144.64v-178.12c0-12.24-7.35-23.3-18.67-27.99-11.31-4.68-24.35-2.09-33,6.55l-379.19,379.2c-3.56,3.58-7.42,6.84-11.37,9.98v-180.53l370.31-370.29ZM523.16,660.59l327.48-327.49v165.55l-173.97,174.02c-5.69,5.64-8.9,13.34-8.9,21.39v219.1c-41.32,6.2-88.67-6.98-131.13-49.47-71.1-71.1-60.61-155.98-13.48-203.11ZM739.73,1506.98c-47.12,47.14-131.98,57.65-203.09-13.45-33.14-33.12-51.38-73.32-51.38-113.21v-482.73c2.77,3,5.6,5.98,8.57,8.94,48.39,48.41,103.06,68.56,154.05,68.56s100.88-21.29,134.7-55.08l327.47-327.5v165.6l-173.95,173.93c-5.69,5.69-8.88,13.39-8.88,21.43v366.14l-187.48,187.36ZM1353.07,1146.6l-365.31,361.06v-541.67l365.31-365.27v545.88Z"/>
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
        <section className="border-t border-line">
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
