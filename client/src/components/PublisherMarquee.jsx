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
            className="group flex h-28 w-32 items-center justify-center rounded-2xl border border-line bg-white p-4 transition hover:border-ink/20 hover:shadow-md sm:h-32 sm:w-40"
          >
            {p.image ? (
              <img
                src={img(p.image, 400)}
                alt={p.name}
                loading="lazy"
                decoding="async"
                className="max-h-16 max-w-[85%] object-contain transition duration-300 group-hover:scale-105 sm:max-h-20"
              />
            ) : (
              <span className="line-clamp-3 text-center text-[13px] font-semibold tracking-tight text-ink/70">{p.name}</span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
