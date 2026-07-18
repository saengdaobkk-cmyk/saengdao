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
    let raf, x1 = 0, x2 = 0, inited = false, last = performance.now();
    const SPEED = 70; // px/วินาที
    const tick = (now) => {
      const dt = Math.min(50, now - last) / 1000;
      last = now;
      const h1 = (row1.current?.scrollWidth || 0) / 2;
      const h2 = (row2.current?.scrollWidth || 0) / 2;
      if (!inited && h2) { x2 = -h2; inited = true; }
      x1 -= SPEED * dt;         // แถวบนเลื่อนซ้าย
      x2 += SPEED * dt;         // แถวล่างเลื่อนขวา
      if (h1 && -x1 >= h1) x1 += h1;
      if (h2 && x2 >= 0) x2 -= h2;
      if (row1.current) row1.current.style.transform = `translate3d(${x1}px, 0, 0)`;
      if (row2.current) row2.current.style.transform = `translate3d(${x2}px, 0, 0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
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
