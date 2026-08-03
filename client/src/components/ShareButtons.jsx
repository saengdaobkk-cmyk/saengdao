import { useState } from "react";

// ปุ่มแชร์บทความ — Facebook / LINE / X / คัดลอกลิงก์ (ใช้ URL หน้าปัจจุบัน)
export default function ShareButtons({ title = "" }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : "";
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);

  const open = (href) => window.open(href, "_blank", "noopener,noreferrer,width=600,height=520");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* บางเบราว์เซอร์บล็อก */ }
  };

  const btn = "flex h-10 w-10 items-center justify-center rounded-full border border-line text-sub transition hover:border-ink/30 hover:text-ink";

  return (
    <div className="flex items-center gap-2.5">
      <span className="mr-1 text-[13px] text-sub">แชร์</span>

      <button onClick={() => open(`https://www.facebook.com/sharer/sharer.php?u=${u}`)} className={btn} aria-label="แชร์ไป Facebook" title="Facebook">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 9H16l.5-3h-3V4.2c0-.9.3-1.5 1.6-1.5H16.6V0.1C16.3.06 15.3 0 14.1 0 11.7 0 10 1.5 10 4.2V6H7.5v3H10v9h3.5V9Z" /></svg>
      </button>

      <button onClick={() => open(`https://social-plugins.line.me/lineit/share?url=${u}`)} className={btn} aria-label="แชร์ไป LINE" title="LINE">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 5.7 2 10.2c0 4 3.6 7.4 8.4 8 .3.07.8.2.9.5.08.27.05.68.03.95l-.15.9c-.04.27-.2 1.05.92.57s6.05-3.56 8.25-6.1C21.6 13.4 22 11.9 22 10.2 22 5.7 17.5 2 12 2ZM8 12.7H6.1c-.28 0-.5-.22-.5-.5V8.4c0-.28.22-.5.5-.5s.5.22.5.5v3.3H8c.28 0 .5.22.5.5s-.22.5-.5.5Zm2-.5c0 .28-.22.5-.5.5s-.5-.22-.5-.5V8.4c0-.28.22-.5.5-.5s.5.22.5.5v3.8Zm4.6 0a.5.5 0 0 1-.9.3l-1.9-2.6v2.3c0 .28-.22.5-.5.5s-.5-.22-.5-.5V8.4c0-.22.14-.4.35-.47a.5.5 0 0 1 .55.17l1.9 2.6V8.4c0-.28.22-.5.5-.5s.5.22.5.5v3.8Zm3.3-2.4c.28 0 .5.22.5.5s-.22.5-.5.5h-1.4v.9h1.4c.28 0 .5.22.5.5s-.22.5-.5.5h-1.9a.5.5 0 0 1-.5-.5V8.4c0-.28.22-.5.5-.5h1.9c.28 0 .5.22.5.5s-.22.5-.5.5h-1.4v.9h1.4Z" /></svg>
      </button>

      <button onClick={() => open(`https://twitter.com/intent/tweet?url=${u}&text=${t}`)} className={btn} aria-label="แชร์ไป X" title="X">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 1.5h3.6l-7.9 9 9.3 12.3h-7.3l-5.7-7.5-6.5 7.5H1.2l8.4-9.6L.7 1.5H8.2l5.2 6.9 5.5-6.9Zm-1.3 19.6h2L7.1 3.6H5l12.6 17.5Z" /></svg>
      </button>

      <button onClick={copy} className={`${btn} ${copied ? "!border-emerald-400 !text-emerald-600" : ""}`} aria-label="คัดลอกลิงก์" title={copied ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}>
        {copied ? (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4.5 4.5L19 7" /></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 15l6-6M10.5 6.5l1-1a3.5 3.5 0 0 1 5 5l-1 1M13.5 17.5l-1 1a3.5 3.5 0 0 1-5-5l1-1" /></svg>
        )}
      </button>
    </div>
  );
}
