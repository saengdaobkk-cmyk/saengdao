import { useEffect, useState, useCallback } from "react";
import { useSlides } from "../api/slides";

// map ตำแหน่งข้อความ
const ALIGN = { left: "items-start text-left", center: "items-center text-center", right: "items-end text-right" };
const VALIGN = { top: "justify-start pt-24", center: "justify-center", bottom: "justify-end pb-24" };

export default function HeroSlider() {
  const { data: slides = [] } = useSlides();
  const [i, setI] = useState(0);
  const go = useCallback((n) => setI((n + slides.length) % slides.length), [slides.length]);

  // เลื่อนอัตโนมัติ
  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setI((p) => (p + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [slides.length]);

  // กัน index เกินหลังข้อมูลเปลี่ยน
  useEffect(() => {
    if (i >= slides.length) setI(0);
  }, [slides.length, i]);

  if (slides.length === 0)
    return <section className="h-[40vh] min-h-[300px] w-full bg-mist" />;

  return (
    <section className="relative aspect-[16/10] w-full overflow-hidden sm:aspect-auto sm:h-[78vh] sm:min-h-[460px]">
      {slides.map((s, idx) => {
        const hasImage = !!s.image;
        return (
          <div
            key={s.id}
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-[1100ms] ease-out"
            style={{
              background: hasImage ? undefined : s.bgColor || "#1d1d1f",
              backgroundImage: hasImage ? `url(${s.image})` : undefined,
              opacity: idx === i ? 1 : 0,
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
                    className={`whitespace-pre-line text-[44px] font-semibold leading-[1.05] tracking-tightest sm:text-6xl ${
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
