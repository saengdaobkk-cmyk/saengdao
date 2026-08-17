import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// เลื่อนขึ้นบนสุดทุกครั้งที่เปลี่ยนหน้า (แก้ปัญหามือถือค้างกลางหน้า)
// ถ้ามี #hash ให้เลื่อนไปที่ element นั้นแทน (เช่น /books/slug#reviews)
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const id = hash.slice(1);
      // เนื้อหาบางส่วนโหลดแบบ async — ลองหาซ้ำสั้นๆ จนกว่าจะเจอ (สูงสุด ~2 วินาที)
      let tries = 0;
      const tryScroll = () => {
        const el = document.getElementById(id);
        if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
        if (tries++ < 20) setTimeout(tryScroll, 100);
      };
      tryScroll();
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}
