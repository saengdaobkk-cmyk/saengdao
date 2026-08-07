import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { img } from "../lib/img";

// แบนเนอร์ภาพตรึง (parallax) — ขยับเลเยอร์ภาพตาม scroll ด้วย JS
// ใช้ได้ทุกอุปกรณ์รวมมือถือ (iOS ไม่รองรับ background-attachment:fixed จึงเลี่ยงมาใช้ transform)
const HEIGHT_CLS = {
  sm: "min-h-[240px] md:min-h-[300px]",
  md: "min-h-[320px] md:min-h-[430px]",
  lg: "min-h-[420px] md:min-h-[560px]",
};

export default function ParallaxBanner({ banner }) {
  const sectionRef = useRef(null);
  const bgRef = useRef(null);

  const enabled = banner?.enabled;
  const image = banner?.image;
  // ระยะขยับ parallax (px) จากหลังบ้าน — 0 = ปิด (ภาพนิ่ง)
  const overscan = Math.max(0, Number(banner?.parallax ?? 220));

  useEffect(() => {
    const sec = sectionRef.current;
    const bg = bgRef.current;
    if (!sec || !bg || !image || overscan <= 0) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = sec.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (rect.bottom < 0 || rect.top > vh) return; // นอกจอ — ข้าม
      // progress: -1 (แบนเนอร์อยู่ล่างสุดจอ) → +1 (บนสุดจอ), 0 = กึ่งกลาง
      const progress = (rect.top + rect.height / 2 - vh / 2) / (vh / 2 + rect.height / 2);
      const y = Math.max(-1, Math.min(1, progress)) * overscan;
      bg.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [image, overscan]);

  if (!enabled) return null;
  const {
    title, subtitle, buttonText, buttonLink,
    height = "md", overlay = 25, align = "center",
  } = banner;

  const bg = image ? `url("${img(image, 1800, 72)}")` : "linear-gradient(135deg,#2b2b2f,#0071e3)";
  const scrim = `rgba(0,0,0,${Math.min(60, Math.max(0, overlay)) / 100})`;
  const left = align === "left";
  const external = /^https?:\/\//i.test(buttonLink || "");

  return (
    <section ref={sectionRef} className="relative w-full overflow-hidden">
      {/* ชั้นภาพพื้นหลัง — ยื่นเกินขอบบน-ล่าง แล้วขยับด้วย transform (parallax) */}
      <div
        ref={bgRef}
        aria-hidden
        className="absolute inset-x-0 bg-cover bg-center will-change-transform"
        style={{ top: -overscan, bottom: -overscan, backgroundImage: bg }}
      />
      {/* ฉากมืดทับให้ตัวอักษรอ่านชัด */}
      <div aria-hidden className="absolute inset-0" style={{ background: scrim }} />

      <div
        className={`relative z-[1] mx-auto flex max-w-page flex-col justify-center px-6 py-16 ${HEIGHT_CLS[height] || HEIGHT_CLS.md} ${
          left ? "items-start text-left" : "items-center text-center"
        }`}
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
