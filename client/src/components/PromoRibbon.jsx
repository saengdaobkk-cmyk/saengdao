import { useEffect, useRef } from "react";
import { useTermDirectory } from "../api/books";
import { useSettings } from "../api/settings";
import { useContent } from "../api/content";
import { img } from "../lib/img";

// แถบโปรโมชั่นเอียง เลื่อนไม่รู้จบ — ผสมข้อความ + โลโก้สำนักพิมพ์ (rAF กัน iOS กระพริบ)
export default function PromoRibbon() {
  const { data } = useTermDirectory("PUBLISHER");
  const { showPromoRibbon } = useSettings();
  const { t } = useContent();
  const trackRef = useRef(null);

  const logos = (data || []).filter((p) => p?.image);
  const phrases = t("ribbon.phrases", "ส่งฟรีทั่วไทย · ลดสูงสุด 50% · เฉพาะสัปดาห์นี้ · ของแท้ 100%")
    .split(/[·|]/)
    .map((s) => s.trim())
    .filter(Boolean);

  // ผสมข้อความสลับกับโลโก้
  const items = [];
  const n = Math.max(6, phrases.length, logos.length);
  for (let i = 0; i < n; i++) {
    if (phrases.length) items.push({ kind: "text", v: phrases[i % phrases.length] });
    if (logos.length) items.push({ kind: "logo", v: logos[i % logos.length] });
  }
  const enough = items.length >= 3;

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !enough || !showPromoRibbon) return;
    let raf, x = 0, last = performance.now();
    const SPEED = 55; // px/วินาที
    const tick = (now) => {
      const dt = Math.min(50, now - last) / 1000;
      last = now;
      x -= SPEED * dt;
      const half = track.scrollWidth / 2;
      if (half > 0 && -x >= half) x += half;
      track.style.transform = `translate3d(${x}px, 0, 0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enough, showPromoRibbon, items.length]);

  if (!showPromoRibbon || !enough) return null;
  const loop = [...items, ...items];

  return (
    <section className="relative overflow-hidden py-12 sm:py-16">
      <div
        className="-ml-[10%] w-[120%] -rotate-2 py-4 shadow-sm"
        style={{ backgroundImage: "linear-gradient(to right, #e9f2ff, #d3e6ff, #e9f2ff)" }}
      >
        <div className="overflow-hidden">
          <div ref={trackRef} className="flex w-max items-center gap-12 whitespace-nowrap px-6" style={{ transform: "translate3d(0,0,0)" }}>
            {loop.map((it, i) =>
              it.kind === "text" ? (
                <span key={i} className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">{it.v}</span>
              ) : (
                <img key={i} src={img(it.v.image, 200)} alt={it.v.name} loading="lazy" decoding="async" className="h-8 w-auto max-w-[130px] object-contain sm:h-9" />
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
