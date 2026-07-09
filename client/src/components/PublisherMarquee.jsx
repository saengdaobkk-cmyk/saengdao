import { Link } from "react-router-dom";
import { useTermDirectory } from "../api/books";
import { useSettings } from "../api/settings";
import { useContent } from "../api/content";

// แถบโลโก้สำนักพิมพ์เลื่อนวนไม่รู้จบ (ก่อน footer)
export default function PublisherMarquee() {
  const { data } = useTermDirectory("PUBLISHER");
  const { showPublisherMarquee } = useSettings();
  const { t } = useContent();
  const items = (data || []).filter((p) => p?.slug);
  if (!showPublisherMarquee || items.length < 2) return null;

  // ทำซ้ำให้ "1 กลุ่ม" กว้างพอ (อย่างน้อย ~16 รายการ) เต็มจอเสมอ แล้ววาง 2 กลุ่มเหมือนกัน
  // → แต่ละกลุ่มเลื่อน -100% พร้อมกัน = วนต่อเนื่องไร้รอยต่อ
  const reps = Math.max(2, Math.ceil(16 / items.length));
  const group = Array.from({ length: reps }, () => items).flat();
  const duration = `${group.length * 2.4}s`; // ความเร็วคงที่ไม่ว่ามีกี่รายการ

  return (
    <section className="mt-6 border-t border-line bg-white pb-6 pt-7">
      <p className="mb-5 text-center text-[13px] font-medium tracking-tight text-sub">{t("common.marquee_title", "สำนักพิมพ์ที่ร่วมกับเรา")} <span className="text-[10px] text-rose-500">[build-0708b]</span></p>
      <div className="marquee relative">
        {/* ขอบซ้าย-ขวาไล่จางให้ดูลื่น */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent" />
        {[0, 1].map((g) => (
          <div key={g} className="marquee-group" style={{ animationDuration: duration }} aria-hidden={g === 1}>
            {group.map((p, i) => (
              <Link
                key={i}
                to={`/publisher/${p.slug}`}
                title={p.name}
                className="flex h-12 shrink-0 items-center justify-center px-8 opacity-60 grayscale transition hover:opacity-100 hover:grayscale-0"
              >
                {p.image ? (
                  <img src={p.image} alt={p.name} className="h-10 w-auto max-w-[150px] object-contain" />
                ) : (
                  <span className="whitespace-nowrap text-[17px] font-semibold tracking-tight text-ink/70">{p.name}</span>
                )}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
