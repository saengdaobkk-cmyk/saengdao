import { useEffect, useState, useCallback } from "react";
import { useSlides } from "../api/slides";
import { useSettings } from "../api/settings";
import { img } from "../lib/img";

// map ตำแหน่งข้อความ
const ALIGN = { left: "items-start text-left", center: "items-center text-center", right: "items-end text-right" };
const VALIGN = { top: "justify-start pt-24", center: "justify-center", bottom: "justify-end pb-24" };
const TITLE_SIZE = { sm: "text-[32px] sm:text-5xl", md: "text-[44px] sm:text-6xl", lg: "text-[52px] sm:text-7xl" };
const BG_POS = { top: "center top", center: "center", bottom: "center bottom" };

export default function HeroSlider() {
  const { data: slides = [] } = useSlides();
  const cfg = useSettings();
  const isSlide = cfg.slideAnimation === "slide";
  const intervalMs = Math.max(2, Number(cfg.slideInterval) || 6) * 1000;
  const [i, setI] = useState(0);
  const go = useCallback((n) => setI((n + slides.length) % slides.length), [slides.length]);

  // เลื่อนอัตโนมัติ (หน่วงเวลาตาม setting กลาง)
  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setI((p) => (p + 1) % slides.length), intervalMs);
    return () => clearInterval(t);
  }, [slides.length, intervalMs]);

  // กัน index เกินหลังข้อมูลเปลี่ยน
  useEffect(() => {
    if (i >= slides.length) setI(0);
  }, [slides.length, i]);

  if (slides.length === 0)
    return <section className="h-[40vh] min-h-[300px] w-full bg-mist" />;

  return (
    <section className="relative h-[78vh] min-h-[460px] w-full overflow-hidden">
      {slides.map((s, idx) => {
        const hasImage = !!s.image;
        return (
          <div
            key={s.id}
            className={`absolute inset-0 bg-cover ease-out ${isSlide ? "transition-transform duration-700" : "transition-opacity duration-[1100ms]"}`}
            style={{
              background: hasImage ? undefined : s.bgColor || "#1d1d1f",
              backgroundImage: hasImage ? `url(${img(s.image, 1600)})` : undefined,
              backgroundPosition: hasImage ? (BG_POS[s.imagePosition] || "center") : undefined,
              opacity: isSlide ? 1 : idx === i ? 1 : 0,
              transform: isSlide ? `translateX(${(idx - i) * 100}%)` : undefined,
            }}
            aria-hidden={idx !== i}
          >
            {/* แผ่นแรเงา — ตามค่า overlay (0 = ไม่มี, เห็นรูปชัด) */}
            {hasImage && s.overlay > 0 && (
              <div
                className="absolute inset-0"
                style={{
                  backgroundColor: s.dark ? "#000" : "#fff",
                  opacity: s.overlay / 100,
                }}
              />
            )}
            {/* แรเงาไล่ระดับจากล่าง — ช่วยให้ตัวหนังสืออ่านง่ายบนรูป */}
            {hasImage && s.overlayGradient && (
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `linear-gradient(to top, ${s.dark ? "rgba(0,0,0,.65)" : "rgba(255,255,255,.7)"}, transparent 62%)`,
                }}
              />
            )}

            {/* ลิงก์คลุมรูป banner (คลิกที่พื้นที่ว่างไป URL) */}
            {s.linkUrl && (
              <a href={s.linkUrl} aria-label={s.title} className="absolute inset-0 z-[5]" />
            )}

            <div
              className={`pointer-events-none relative z-10 mx-auto flex h-full max-w-page flex-col px-5 ${
                ALIGN[s.align] || ALIGN.center
              } ${VALIGN[s.valign] || VALIGN.center}`}
            >
              {idx === i && (
                <div key={i} className="pointer-events-auto w-full max-w-xl animate-fadeUp">
                  {s.eyebrow && (
                    <p
                      className={`mb-3 text-[13px] font-medium tracking-tight ${s.dark ? "text-white/70" : "text-sub"}`}
                      style={s.textColor ? { color: s.textColor, opacity: 0.8 } : undefined}
                    >
                      {s.eyebrow}
                    </p>
                  )}
                  <h1
                    className={`whitespace-pre-line font-semibold leading-[1.05] tracking-tightest ${TITLE_SIZE[s.titleSize] || TITLE_SIZE.md} ${
                      s.dark ? "text-white" : "text-ink"
                    }`}
                    style={s.textColor ? { color: s.textColor } : undefined}
                  >
                    {s.title}
                  </h1>
                  {s.subtitle && (
                    <p
                      className={`mt-5 text-[15px] leading-relaxed sm:text-lg ${s.dark ? "text-white/75" : "text-sub"}`}
                      style={s.textColor ? { color: s.textColor, opacity: 0.85 } : undefined}
                    >
                      {s.subtitle}
                    </p>
                  )}
                  {s.ctaText && (
                    <a
                      href={s.ctaLink || "#catalog"}
                      className="mt-8 inline-flex items-center rounded-full bg-accent px-6 py-2.5 text-[15px] font-medium text-white transition-transform hover:scale-[1.03] active:scale-95"
                      style={{
                        backgroundColor: s.buttonColor || undefined,
                        color: s.buttonTextColor || undefined,
                      }}
                    >
                      {s.ctaText}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* จุดเปลี่ยนสไลด์ */}
      {slides.length > 1 && (
        <div className="absolute bottom-7 left-1/2 z-10 flex -translate-x-1/2 gap-2.5">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => go(idx)}
              aria-label={`สไลด์ ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === i
                  ? `w-7 ${slides[i]?.dark ? "bg-white" : "bg-ink"}`
                  : `w-1.5 ${slides[i]?.dark ? "bg-white/40" : "bg-ink/25"}`
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
