import { useEffect, useRef } from "react";
import { useSettings } from "../api/settings";
import { useContent } from "../api/content";

export default function TextMarquee() {
  const { showTextMarquee } = useSettings();
  const { t } = useContent();
  const text = t("textmarquee.text", "SAENGDAO BOOKS");
  const row1 = useRef(null);
  const row2 = useRef(null);

  // เลื่อนตาม scroll — สองแถวสวนทางกัน
  useEffect(() => {
    if (!showTextMarquee) return;
    let ticking = false, y = window.scrollY || 0;
    const FACTOR = 0.6;
    const apply = () => {
      ticking = false;
      const h1 = (row1.current?.scrollWidth || 0) / 2;
      const h2 = (row2.current?.scrollWidth || 0) / 2;
      if (row1.current && h1) row1.current.style.transform = `translate3d(${-((y * FACTOR) % h1)}px, 0, 0)`;
      if (row2.current && h2) row2.current.style.transform = `translate3d(${((y * FACTOR) % h2) - h2}px, 0, 0)`;
    };
    const onScroll = () => { y = window.scrollY || 0; if (!ticking) { ticking = true; requestAnimationFrame(apply); } };
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, [showTextMarquee, text]);

  if (!showTextMarquee) return null;

  const rep = Array.from({ length: 8 });
  const rowCls = "flex w-max whitespace-nowrap text-[52px] font-extrabold uppercase leading-none tracking-tight sm:text-8xl";
  const Repeat = () => <>{rep.map((_, i) => <span key={i} className="mr-10 inline-block">{text}</span>)}</>;

  return (
    <section className="relative overflow-hidden py-14 sm:py-20">
      {/* แถวบน (ดำ) เอียงลง */}
      <div className="-rotate-2">
        <div ref={row1} className={`${rowCls} text-ink`} style={{ transform: "translate3d(0,0,0)" }}><Repeat /></div>
      </div>
      {/* แถวล่าง (ฟ้า) เอียงขึ้น + ทับขึ้นมาให้ไขว้กัน */}
      <div className="-mt-6 rotate-2 sm:-mt-12">
        <div ref={row2} className={`${rowCls} text-accent`} style={{ transform: "translate3d(0,0,0)" }}><Repeat /></div>
      </div>
    </section>
  );
}
