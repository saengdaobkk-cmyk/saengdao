import { Link } from "react-router-dom";
import { img } from "../lib/img";

// แบนเนอร์ภาพตรึง (parallax) — พื้นหลังตรึงกับ viewport, เนื้อหาเลื่อนทับตอน scroll
// บนมือถือ (iOS ไม่รองรับ bg-fixed) จะ fallback เป็นภาพนิ่งอัตโนมัติ
const HEIGHT_CLS = {
  sm: "min-h-[240px] md:min-h-[300px]",
  md: "min-h-[320px] md:min-h-[430px]",
  lg: "min-h-[420px] md:min-h-[560px]",
};

export default function ParallaxBanner({ banner }) {
  if (!banner?.enabled) return null;
  const {
    image, title, subtitle, buttonText, buttonLink,
    height = "md", overlay = 25, align = "center",
  } = banner;

  const bg = image ? `url("${img(image, 1800, 72)}")` : "linear-gradient(135deg,#2b2b2f,#0071e3)";
  const scrim = `rgba(0,0,0,${Math.min(60, Math.max(0, overlay)) / 100})`;
  const left = align === "left";
  const external = /^https?:\/\//i.test(buttonLink || "");

  return (
    <section className="relative w-full overflow-hidden">
      {/* ชั้นภาพพื้นหลังตรึง (parallax) */}
      <div
        aria-hidden
        className="absolute inset-0 bg-scroll bg-cover bg-center md:bg-fixed"
        style={{ backgroundImage: bg }}
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
