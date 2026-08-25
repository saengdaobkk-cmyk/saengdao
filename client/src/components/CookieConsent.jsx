import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// แถบยินยอมคุกกี้ (PDPA) — เว็บใช้เฉพาะคุกกี้ที่จำเป็น · จำการเลือกไว้ใน localStorage
const KEY = "saengdao_cookie_consent";

export default function CookieConsent() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem(KEY)) setShow(true);
  }, []);
  const choose = (v) => { localStorage.setItem(KEY, v); setShow(false); };
  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4" role="dialog" aria-label="การยินยอมคุกกี้">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-line bg-white/95 p-4 shadow-lg backdrop-blur-xl sm:flex-row sm:items-center sm:gap-4">
        <p className="flex-1 text-[13px] leading-relaxed text-ink/80">
          เว็บไซต์นี้ใช้คุกกี้ที่จำเป็นเพื่อให้ระบบทำงาน เช่น การเข้าสู่ระบบและตะกร้าสินค้า —
          อ่านเพิ่มเติมได้ที่ <Link to="/privacy" className="font-medium text-accent hover:underline">นโยบายความเป็นส่วนตัว</Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button onClick={() => choose("necessary")} className="flex-1 whitespace-nowrap rounded-full border border-line px-4 py-2 text-[13px] font-medium text-ink transition hover:bg-mist sm:flex-none">เฉพาะที่จำเป็น</button>
          <button onClick={() => choose("accepted")} className="flex-1 whitespace-nowrap rounded-full bg-ink px-5 py-2 text-[13px] font-medium text-white transition hover:bg-ink/90 sm:flex-none">ยอมรับทั้งหมด</button>
        </div>
      </div>
    </div>
  );
}
