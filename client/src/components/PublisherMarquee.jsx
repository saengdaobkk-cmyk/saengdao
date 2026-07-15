import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useTermDirectory } from "../api/books";
import { useSettings } from "../api/settings";
import { useContent } from "../api/content";

// แถบโลโก้สำนักพิมพ์เลื่อนวนไม่รู้จบ — ขับด้วย requestAnimationFrame (ไม่พึ่ง CSS animation ที่ iOS กระพริบ)
export default function PublisherMarquee() {
  const { data } = useTermDirectory("PUBLISHER");
  const { showPublisherMarquee } = useSettings();
  const { t } = useContent();
  const trackRef = useRef(null);
  const items = (data || []).filter((p) => p?.slug);
  const enough = items.length >= 2;

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !enough) return;
    let raf, x = 0, last = performance.now();
    const SPEED = 45; // px/วินาที
    const tick = (now) => {
      const dt = Math.min(50, now - last) / 1000;
      last = now;
      x -= SPEED * dt;
      const half = track.scrollWidth / 2; // ความกว้าง 1 กลุ่ม (track = 2 กลุ่ม)
      if (half > 0 && -x >= half) x += half; // วนกลับแบบไร้รอยต่อ
      track.style.transform = `translate3d(${x}px, 0, 0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enough, items.length]);

  if (!showPublisherMarquee || !enough) return null;

  // ทำซ้ำให้เต็มจอ (อย่างน้อย ~16 รายการ) แล้ววาง 2 ชุด → เลื่อนครบ 1 ชุดแล้ววนกลับเนียน
  const reps = Math.max(2, Math.ceil(16 / items.length));
  const group = Array.from({ length: reps }, () => items).flat();
  const loop = [...group, ...group];

  return (
    <section className="mt-6 border-t border-line bg-white pb-6 pt-7">
      <p className="mb-5 text-center text-[16px] font-medium tracking-tight text-sub">{t("common.marquee_title", "สำนักพิมพ์ที่ร่วมกับเรา")}</p>
      <div className="marquee relative">
        <div ref={trackRef} className="flex" style={{ transform: "translate3d(0,0,0)" }}>
          {loop.map((p, i) => (
            <Link
              key={i}
              to={`/publisher/${p.slug}`}
              title={p.name}
              className="flex h-12 shrink-0 items-center justify-center px-8 opacity-60 grayscale transition hover:opacity-100 hover:grayscale-0"
            >
              {p.image ? (
                <img src={p.image} alt={p.name} className="h-10 w-auto max-w-[150px] object-contain" />
              ) : (
                <span className="whitespace-nowrap text-[20px] font-semibold tracking-tight text-ink/70">{p.name}</span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
