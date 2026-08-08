import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { img } from "../lib/img";

// แบนเนอร์ภาพตรึง (parallax) — ขยับเลเยอร์ภาพตาม scroll
// หลัก: CSS Scroll-Driven Animation (วิ่งบน compositor → ลื่นบน iOS Safari ตอน momentum)
// สำรอง: JS rAF loop สำหรับ browser ที่ยังไม่รองรับ (iOS ≤17 บางเวอร์ชัน ฯลฯ)
const HEIGHT_CLS = {
  sm: "min-h-[240px] md:min-h-[300px]",
  md: "min-h-[320px] md:min-h-[430px]",
  lg: "min-h-[420px] md:min-h-[560px]",
};
// รองรับ CSS scroll-driven animation หรือไม่ (ตรวจครั้งเดียวตอนโหลด)
const SUPPORTS_CSS_PARALLAX =
  typeof CSS !== "undefined" && CSS.supports?.("animation-timeline: view()");

export default function ParallaxBanner({ banner }) {
  const sectionRef = useRef(null);
  const bgRef = useRef(null);

  const enabled = banner?.enabled;
  const image = banner?.image;
  // ระยะขยับ parallax (px) จากหลังบ้าน — 0 = ปิด (ภาพนิ่ง)
  const overscan = Math.max(0, Number(banner?.parallax ?? 220));
  const useCss = SUPPORTS_CSS_PARALLAX && !!image && overscan > 0;

  useEffect(() => {
    if (useCss) return; // CSS scroll-timeline จัดการเองบน compositor
    const sec = sectionRef.current;
    const bg = bgRef.current;
    if (!sec || !bg || !image || overscan <= 0) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    // rAF loop วิ่งเฉพาะตอนแบนเนอร์อยู่ในจอ — ไม่พึ่ง scroll event
    // (Safari/iOS ยิง scroll event ไม่สม่ำเสมอตอน momentum; rAF ทำงานเหมือนกันทุก browser)
    let running = false;
    let raf = 0;
    const frame = () => {
      const rect = sec.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      // progress: -1 (แบนเนอร์อยู่ล่างสุดจอ) → +1 (บนสุดจอ), 0 = กึ่งกลาง
      const progress = (rect.top + rect.height / 2 - vh / 2) / (vh / 2 + rect.height / 2);
      const y = Math.max(-1, Math.min(1, progress)) * overscan;
      bg.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
      if (running) raf = requestAnimationFrame(frame);
    };
    const start = () => { if (!running) { running = true; raf = requestAnimationFrame(frame); } };
    const stop = () => { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; };

    const io = new IntersectionObserver(
      ([e]) => (e.isIntersecting ? start() : stop()),
      { rootMargin: "120px 0px" }
    );
    io.observe(sec);
    return () => { stop(); io.disconnect(); };
  }, [image, overscan, useCss]);

  if (!enabled) return null;
  const {
    title, subtitle, buttonText, buttonLink,
    height = "md", overlay = 25, align = "center", valign = "middle",
    imageX = "center", imageY = "center",
  } = banner;

  const scrim = `rgba(0,0,0,${Math.min(60, Math.max(0, overlay)) / 100})`;
  const alignCls =
    align === "left" ? "items-start text-left" : align === "right" ? "items-end text-right" : "items-center text-center";
  const valignCls = valign === "top" ? "justify-start" : valign === "bottom" ? "justify-end" : "justify-center";
  const objectPosition = `${imageX} ${imageY}`; // โฟกัสรูปเมื่อถูก crop
  const external = /^https?:\/\//i.test(buttonLink || "");

  return (
    <section ref={sectionRef} className={`relative w-full overflow-hidden ${useCss ? "sd-parallax-wrap" : ""}`}>
      {/* ชั้นภาพพื้นหลัง — ใช้ <img> จริง (Safari จัดการ transform ได้ลื่นกว่า background-image)
          ภาพสูงเกินกรอบด้านละ overscan แล้วขยับด้วย transform (parallax) */}
      {image ? (
        <img
          ref={bgRef}
          src={img(image, 1800, 72)}
          alt=""
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 w-full object-cover will-change-transform ${useCss ? "sd-parallax-css" : ""}`}
          style={{
            top: -overscan,
            height: `calc(100% + ${overscan * 2}px)`,
            objectPosition,
            WebkitBackfaceVisibility: "hidden",
            backfaceVisibility: "hidden",
            ...(useCss ? { "--sd-ov": overscan } : null),
          }}
        />
      ) : (
        <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(135deg,#2b2b2f,#0071e3)" }} />
      )}
      {/* ฉากมืดทับให้ตัวอักษรอ่านชัด */}
      <div aria-hidden className="absolute inset-0" style={{ background: scrim }} />

      <div
        className={`relative z-[1] mx-auto flex max-w-page flex-col px-6 py-16 ${HEIGHT_CLS[height] || HEIGHT_CLS.md} ${valignCls} ${alignCls}`}
      >
        {title && (
          <h2
            className="max-w-2xl text-[30px] font-bold leading-[1.15] tracking-[-0.5px] text-white sm:text-[42px] md:text-[52px]"
            style={{ textShadow: "0 2px 18px rgba(0,0,0,0.28)" }}
          >
            {title}
          </h2>
        )}
        {subtitle && (
          <p
            className="mt-3 max-w-xl text-[15px] font-light leading-relaxed text-white/85 sm:text-[18px]"
            style={{ textShadow: "0 1px 12px rgba(0,0,0,0.3)" }}
          >
            {subtitle}
          </p>
        )}
        {buttonText &&
          (external ? (
            <a
              href={buttonLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex items-center rounded-full bg-accent px-8 py-3 text-[15px] font-medium text-white shadow-lg shadow-black/10 transition hover:bg-accent/90 active:scale-[0.98]"
            >
              {buttonText}
            </a>
          ) : (
            <Link
              to={buttonLink || "/books"}
              className="mt-7 inline-flex items-center rounded-full bg-accent px-8 py-3 text-[15px] font-medium text-white shadow-lg shadow-black/10 transition hover:bg-accent/90 active:scale-[0.98]"
            >
              {buttonText}
            </Link>
          ))}
      </div>
    </section>
  );
}
