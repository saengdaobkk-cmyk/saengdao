import { Link } from "react-router-dom";
import { useContent } from "../api/content";
import ContactSection from "../components/ContactSection";

// ดาว ✦ — signature ของหน้า (สื่อ "แสงดาว")
const Star = ({ className = "" }) => <span className={`text-accent ${className}`} aria-hidden>✦</span>;

export default function About() {
  const { t } = useContent();

  const stats = [
    { n: t("about.stat1_num", ""), l: t("about.stat1_label", "") },
    { n: t("about.stat2_num", ""), l: t("about.stat2_label", "") },
    { n: t("about.stat3_num", ""), l: t("about.stat3_label", "") },
  ].filter((s) => s.n || s.l);

  const features = [
    { t: t("about.feature1_title", ""), d: t("about.feature1_desc", "") },
    { t: t("about.feature2_title", ""), d: t("about.feature2_desc", "") },
    { t: t("about.feature3_title", ""), d: t("about.feature3_desc", "") },
  ].filter((x) => x.t || x.d);

  return (
    <div>
      {/* ── Hero: คติเป็นประโยคเด่น ── */}
      <section className="mx-auto max-w-page px-5 pb-16 pt-16 sm:pb-24 sm:pt-24">
        <div className="max-w-4xl">
          <p className="flex items-center gap-2.5 text-[13px] font-medium tracking-[0.22em] text-accent">
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
            <p className="mt-7 text-[13px] font-medium tracking-[0.16em] text-sub">— {t("about.title", "")}</p>
          )}
        </div>
      </section>

      {/* ── แถบสถิติ ── */}
      {stats.length > 0 && (
        <section className="border-y border-line bg-mist/40">
          <div className="mx-auto grid max-w-page grid-cols-3 divide-x divide-line px-5">
            {stats.map((s, i) => (
              <div key={i} className="px-3 py-9 text-center sm:py-14">
                <p className="text-[1.7rem] font-semibold tracking-tightest text-ink sm:text-5xl">{s.n}</p>
                {s.l && <p className="mt-2 text-[11.5px] leading-snug tracking-wide text-sub sm:text-[13px]">{s.l}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── เรื่องราว: 2 คอลัมน์ ── */}
      {(t("about.story_heading", "") || t("about.story_body", "")) && (
        <section className="mx-auto max-w-page px-5 py-20 sm:py-28">
          <div className="grid gap-8 sm:grid-cols-[0.42fr_0.58fr] sm:gap-16">
            <div>
              <Star className="text-xl" />
              <h2 className="mt-3 text-3xl font-semibold tracking-tightest text-ink sm:text-[2.5rem] sm:leading-[1.1]">
                {t("about.story_heading", "เรื่องราวของแสงดาว")}
              </h2>
            </div>
            <div className="whitespace-pre-line text-[16px] leading-[1.95] text-ink/75">
              {t("about.story_body", "")}
            </div>
          </div>
        </section>
      )}

      {/* ── สิ่งที่เรายึดถือ ── */}
      {features.length > 0 && (
        <section className="border-t border-line">
          <div className="mx-auto max-w-page px-5 py-20 sm:py-24">
            <p className="text-[13px] font-medium tracking-[0.2em] text-sub">{t("about.values_heading", "สิ่งที่เรายึดถือ")}</p>
            <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
              {features.map((x, i) => (
                <div key={i} className="bg-white p-8 transition-colors hover:bg-mist/40">
                  <Star className="text-lg" />
                  <p className="mt-5 text-[17px] font-semibold tracking-tight text-ink">{x.t}</p>
                  <p className="mt-2 text-[14px] leading-relaxed text-sub">{x.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── ข้อมูลติดต่อ (ไม่มีฟอร์ม) ── */}
      <ContactSection id="contact" />

      {/* ── ปิดท้าย: แถบท้องฟ้ายามค่ำ + แสงดาว ── */}
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
