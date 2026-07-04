import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// เลื่อนขึ้นบนสุดทุกครั้งที่เปลี่ยนหน้า (แก้ปัญห​ามือถือค้างกลางหน้า)
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
