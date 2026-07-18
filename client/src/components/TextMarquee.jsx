import { useEffect, useRef } from "react";
import { useSettings } from "../api/settings";
import { useContent } from "../api/content";

// องศาเอียงต่อคำ (วนซ้ำ) — ทำให้ตัวอักษรดูโยกเล่นๆ
const TILT = [-3, 2, -1.5, 3, -2, 1.5, -2.5, 2];

function Words({ text }) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <span className="mr-8 inline-flex gap-4">
      {words.map((w, i) => (
        <span key={i} className="inline-block" style={{ transform: `rotate(${TILT[i % TILT.length]}deg)` }}>{w}</span>
      ))}
    </span>
  );
}

export default function TextMarquee() {
  const { showTextMarquee } = useSettings();
  const { t } = useContent();
  const text = t("textmarquee.text", "SAENGDAO BOOKS");
  const row1 = useRef(null);
  const row2 = useRef(null);

  useEffect(() => {
    if (!showTextMarquee) return;
    let ticking = false, y = window.scrollY || 0;
    const FACTOR = 0.6; // เลื่อนหน้า 1px → ตัวอักษรขยับ 0.6px
    const apply = () => {
      ticking = false;
      const h1 = (row1.current?.scrollWidth || 0) / 2;
      const h2 = (row2.current?.scrollWidth || 0) / 2;
      if (row1.current && h1) row1.current.style.transform = `translate3d(${-(((y * FACTOR) % h1))}px, 0, 0)`; // เลื่อนซ้าย
      if (row2.current && h2) row2.current.style.transform = `translate3d(${((y * FACTOR) % h2) - h2}px, 0, 0)`; // เลื่อนขวา
    };
    const onScroll = () => {
      y = window.scrollY || 0;
      if (!ticking) { ticking = true; requestAnimationFrame(apply); }
    };
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [showTextMarquee, text]);

  if (!showTextMarquee) return null;

  const rep = Array.from({ length: 8 });
  const rowCls = "flex w-max whitespace-nowrap text-[46px] font-extrabold uppercase leading-none tracking-tight sm:text-7xl";

  return (
    <section className="overflow-hidden bg-mist py-10 sm:py-14">
      <div className="overflow-hidden">
        <div ref={row1} className={`${rowCls} text-ink`} style={{ transform: "translate3d(0,0,0)" }}>
          {rep.map((_, i) => <Words key={i} text={text} />)}
        </div>
      </div>
      <div className="mt-3 overflow-hidden">
        <div ref={row2} className={`${rowCls} text-accent`} style={{ transform: "translate3d(0,0,0)" }}>
          {rep.map((_, i) => <Words key={i} text={text} />)}
        </div>
      </div>
    </section>
  );
}
