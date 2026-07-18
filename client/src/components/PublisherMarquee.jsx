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
            className="overflow-hidden rounded-xl border border-line bg-white transition-all duration-200 ease-out hover:-translate-y-1.5 hover:border-ink/25 hover:shadow-lg"
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
