import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// แถบ + ตั้งค่าคุกกี้ (PDPA) — เก็บการเลือกแยกหมวดใน localStorage
// หมายเหตุ: ปัจจุบันเว็บใช้เฉพาะคุกกี้ที่จำเป็น · หมวดวิเคราะห์/การตลาดเป็นโครงไว้รองรับเครื่องมือในอนาคต
const KEY = "saengdao_cookie_consent";

export function getCookieConsent() {
  try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; }
}

export default function CookieConsent() {
  const [show, setShow] = useState(false);
  const [openPrefs, setOpenPrefs] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => { if (!getCookieConsent()) setShow(true); }, []);

  const save = (a, m) => {
    localStorage.setItem(KEY, JSON.stringify({ necessary: true, analytics: a, marketing: m, ts: Date.now() }));
    setShow(false); setOpenPrefs(false);
  };
  const acceptAll = () => save(true, true);
  const necessaryOnly = () => save(false, false);
  const saveSelected = () => save(analytics, marketing);

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4" role="dialog" aria-label="การตั้งค่าคุกกี้">
      <div className="mx-auto max-w-3xl rounded-2xl border border-line bg-white/95 shadow-lg backdrop-blur-xl">
        {!openPrefs ? (
          // แถบหลัก
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
            <p className="flex-1 text-[13px] leading-relaxed text-ink/80">
              เราใช้คุกกี้เพื่อให้เว็บทำงานและปรับปรุงประสบการณ์ของคุณ คุณเลือกได้ว่าจะยอมรับหมวดใด —
              อ่าน <Link to="/privacy" className="font-medium text-accent hover:underline">นโยบายความเป็นส่วนตัว</Link>
            </p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setOpenPrefs(true)} className="rounded-full border border-line px-4 py-2 text-[13px] font-medium text-ink transition hover:bg-mist">ตั้งค่า</button>
              <button onClick={necessaryOnly} className="rounded-full border border-line px-4 py-2 text-[13px] font-medium text-ink transition hover:bg-mist">เฉพาะที่จำเป็น</button>
              <button onClick={acceptAll} className="rounded-full bg-ink px-5 py-2 text-[13px] font-medium text-white transition hover:bg-ink/90">ยอมรับทั้งหมด</button>
            </div>
          </div>
        ) : (
          // ตั้งค่าแยกหมวด
          <div className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[15px] font-semibold text-ink">การตั้งค่าคุกกี้</p>
              <button onClick={() => setOpenPrefs(false)} className="text-[13px] text-sub hover:text-ink">← กลับ</button>
            </div>
            <div className="space-y-3">
              <CookieRow title="คุกกี้ที่จำเป็น" desc="จำเป็นต่อการทำงานของเว็บ เช่น การเข้าสู่ระบบและตะกร้าสินค้า — เปิดใช้เสมอ" checked disabled />
              <CookieRow title="คุกกี้เพื่อการวิเคราะห์" desc="ช่วยเราเข้าใจการใช้งานเพื่อปรับปรุงเว็บ (ปัจจุบันยังไม่มีการใช้งาน)" checked={analytics} onChange={setAnalytics} />
              <CookieRow title="คุกกี้เพื่อการตลาด" desc="ใช้แสดงเนื้อหา/โฆษณาที่เกี่ยวข้อง (ปัจจุบันยังไม่มีการใช้งาน)" checked={marketing} onChange={setMarketing} />
            </div>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button onClick={saveSelected} className="rounded-full border border-line px-5 py-2 text-[13px] font-medium text-ink transition hover:bg-mist">บันทึกที่เลือก</button>
              <button onClick={acceptAll} className="rounded-full bg-ink px-5 py-2 text-[13px] font-medium text-white transition hover:bg-ink/90">ยอมรับทั้งหมด</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CookieRow({ title, desc, checked, onChange, disabled }) {
  return (
    <label className={`flex items-start gap-3 rounded-xl border border-line p-3.5 ${disabled ? "bg-mist/40" : "cursor-pointer"}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange?.(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-accent disabled:opacity-60" />
      <span className="min-w-0">
        <span className="block text-[14px] font-medium text-ink">{title}</span>
        <span className="mt-0.5 block text-[12px] leading-relaxed text-sub">{desc}</span>
      </span>
    </label>
  );
}
