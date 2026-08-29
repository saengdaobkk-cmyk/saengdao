import { useEffect, useRef, useState } from "react";

// ครอบ section ให้ค่อยๆ เฟด+เลื่อนขึ้นตอนเลื่อนเข้าจอ (ครั้งเดียว)
// .reveal-section ถูกยกเว้นจากกฎ reduced-motion ใน index.css → นุ่มทั้ง desktop/มือถือ
export default function Reveal({ children, className = "" }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { setShown(true); return; }
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal-section transition-all duration-[800ms] ease-out ${shown ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"} ${className}`}
    >
      {children}
    </div>
  );
}
