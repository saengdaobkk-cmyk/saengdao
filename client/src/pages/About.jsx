import { Link } from "react-router-dom";
import { useContent } from "../api/content";

export default function About() {
  const { t } = useContent();
  const features = [
    { t: t("about.feature1_title", ""), d: t("about.feature1_desc", "") },
    { t: t("about.feature2_title", ""), d: t("about.feature2_desc", "") },
    { t: t("about.feature3_title", ""), d: t("about.feature3_desc", "") },
  ].filter((x) => x.t || x.d);

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:py-24">
      <p className="text-[13px] font-medium tracking-tight text-sub">{t("about.eyebrow", "เกี่ยวกับเรา")}</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tightest text-ink sm:text-5xl">
        {t("about.title", "ร้านหนังสือแสงดาว")}
      </h1>
      <p className="mt-6 whitespace-pre-line text-[17px] leading-relaxed text-ink/80">
        {t("about.intro", "")}
      </p>

      {/* จุดเด่น */}
      {features.length > 0 && (
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {features.map((x, i) => (
            <div key={i} className="rounded-2xl bg-mist p-6">
              <p className="text-[15px] font-semibold text-ink">{x.t}</p>
              <p className="mt-1.5 text-[14px] leading-relaxed text-sub">{x.d}</p>
            </div>
          ))}
        </div>
      )}

      {/* เรื่องราว */}
      {(t("about.story_heading", "") || t("about.story_body", "")) && (
        <div className="mt-14 border-t border-line pt-10">
          <h2 className="text-2xl font-semibold tracking-tightest text-ink">{t("about.story_heading", "เรื่องราวของเรา")}</h2>
          <p className="mt-4 whitespace-pre-line text-[16px] leading-relaxed text-ink/80">
            {t("about.story_body", "")}
          </p>
        </div>
      )}

      <div className="mt-12 flex flex-wrap gap-3">
        <Link to="/books" className="rounded-full bg-accent px-7 py-3 text-[15px] font-medium text-white transition hover:bg-accent/90">
          เลือกซื้อหนังสือ
        </Link>
        <Link to="/contact" className="rounded-full border border-line px-7 py-3 text-[15px] font-medium text-ink transition hover:bg-mist">
          ติดต่อเรา
        </Link>
      </div>
    </div>
  );
}
