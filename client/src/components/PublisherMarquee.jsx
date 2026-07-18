import { Link } from "react-router-dom";
import { useTermDirectory } from "../api/books";
import { useSettings } from "../api/settings";
import { useContent } from "../api/content";
import { img } from "../lib/img";

// section สำนักพิมพ์ — การ์ดโลโก้เรียงกลางจอ
export default function PublisherMarquee() {
  const { data } = useTermDirectory("PUBLISHER");
  const { showPublisherMarquee } = useSettings();
  const { t } = useContent();
  const items = (data || []).filter((p) => p?.slug);

  if (!showPublisherMarquee || items.length < 2) return null;

  // สุ่มทิศทางเด้งทุกครั้งที่ชี้เมาส์
  const randomBounce = (e) => {
    const a = Math.random() * Math.PI * 2;
    const d = 8 + Math.random() * 5; // 8–13px
    e.currentTarget.style.setProperty("--bx", `${(Math.cos(a) * d).toFixed(1)}px`);
    e.currentTarget.style.setProperty("--by", `${(Math.sin(a) * d).toFixed(1)}px`);
  };

  return (
    <section className="mx-auto max-w-page px-5 py-16 sm:py-20">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-[13px] font-medium tracking-tight text-accent">{t("common.brands_eyebrow", "สำนักพิมพ์")}</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tightest text-ink sm:text-4xl">
          {t("common.marquee_title", "สำนักพิมพ์ที่คัดสรร")}
        </h2>
        <p className="mt-3 text-[15px] text-sub">{t("common.brands_subtitle", "รวมสำนักพิมพ์ชั้นนำที่เราภูมิใจนำเสนอ")}</p>
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-4">
        {items.map((p) => (
          <Link
            key={p.slug}
            to={`/publisher/${p.slug}`}
            title={p.name}
            onMouseEnter={randomBounce}
            className="brand-card overflow-hidden rounded-xl border border-line bg-white hover:border-ink/25"
          >
            {p.image ? (
              <img
                src={img(p.image, 400)}
                alt={p.name}
                loading="lazy"
                decoding="async"
                className="block h-24 w-auto object-contain sm:h-28"
              />
            ) : (
              <span className="flex h-24 items-center justify-center px-6 text-center text-[15px] font-semibold tracking-tight text-ink/70 sm:h-28">{p.name}</span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
