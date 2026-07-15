import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";

// โหลด PDF.js + StPageFlip จาก CDN เฉพาะตอนเปิดครั้งแรก (เหมือนร้าน PHP เดิม)
const PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
const PDFWK = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
const FLIP = "https://cdn.jsdelivr.net/npm/page-flip@2.0.7/dist/js/page-flip.browser.min.js";

// โหลดสคริปต์ CDN — ตรวจ global จริง ถ้าไม่มี (เช่นโหลดพลาดตอนเน็ตหลุด) จะลบ tag เก่าแล้วโหลดใหม่
function loadScript(src, ready) {
  return new Promise((res, rej) => {
    if (ready && ready()) return res();
    const old = document.querySelector(`script[data-fb="${CSS.escape(src)}"]`);
    if (old) old.remove();
    const s = document.createElement("script");
    s.src = src;
    s.dataset.fb = src;
    s.onload = () => (ready && !ready() ? rej(new Error("script loaded but global missing")) : res());
    s.onerror = () => { s.remove(); rej(new Error("load fail " + src)); };
    document.head.appendChild(s);
  });
}

export default function FlipBook({ pdfUrl, title, open, onClose }) {
  const stageRef = useRef(null);
  const pageFlipRef = useRef(null);
  const builtRef = useRef(false);
  const pagesRef = useRef(null); // เก็บรูปหน้าที่ render แล้ว (รีบิลด์ตอนหมุนจอ/ปรับขนาดโดยไม่ต้องโหลดใหม่)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scrollMode, setScrollMode] = useState(false); // มือถือ = เลื่อนดูภาพ (อ่านชัด), เดสก์ท็อป = flip

  // ล็อกสกอลล์ + คีย์บอร์ด ตอนเปิด
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") pageFlipRef.current?.flipPrev();
      else if (e.key === "ArrowRight") pageFlipRef.current?.flipNext();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // สร้าง flipbook ครั้งแรกที่เปิด · เปิดซ้ำแค่ update ขนาด (page-flip โหมด stretch ปรับ resize เอง)
  useEffect(() => {
    if (!open || !pdfUrl) return;
    if (!builtRef.current) {
      builtRef.current = true;
      render();
    } else if (pageFlipRef.current) {
      setTimeout(() => { try { pageFlipRef.current.update(); } catch { /* noop */ } }, 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pdfUrl]);

  async function render() {
    try {
      setLoading(true);
      setError("");
      await loadScript(PDFJS, () => window.pdfjsLib);
      await loadScript(FLIP, () => window.St);
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFWK;
      // ดึงไฟล์ผ่าน API เป็น base64 (เลี่ยงตัวดักดาวน์โหลดที่จับ .pdf + จัดการ CORS ให้)
      const { data: payload } = await api.get("/preview/pdf", { params: { src: pdfUrl } });
      if (!payload?.data) throw new Error("empty preview payload");
      const bin = atob(payload.data);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const pdf = await window.pdfjsLib.getDocument({ data: bytes, disableRange: true, disableStream: true }).promise;
      const pages = [];
      for (let i = 1; i <= pdf.numPages; i++) pages.push(await renderPage(pdf, i));
      pagesRef.current = pages;
      setLoading(false);
      build(pages);
    } catch (e) {
      console.error("[FlipBook]", e);
      setError("โหลดตัวอย่างไม่สำเร็จ: " + (e?.message || String(e)));
      setLoading(false);
    }
  }

  async function renderPage(pdf, num) {
    const page = await pdf.getPage(num);
    // render ละเอียดตามจอ (retina/high-DPI) กันภาพเบลอ — cap ที่ 3 กันหน่วง
    const scale = Math.min(3, 2 * (window.devicePixelRatio || 1));
    const vp = page.getViewport({ scale });
    const c = document.createElement("canvas");
    c.width = vp.width;
    c.height = vp.height;
    await page.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise;
    return { src: c.toDataURL("image/jpeg", 0.92), w: vp.width, h: vp.height };
  }

  function build(pages) {
    if (!pages.length || !stageRef.current) { setError("ไม่มีหน้าตัวอย่าง"); return; }
    // ใช้สัดส่วนที่พบบ่อยสุด (หน้าเนื้อใน) — กันหน้าปกขนาดต่างทำให้หน้ากระดาษเกินขอบรูป
    const counts = {};
    let ratio = pages[0].h / pages[0].w, bestN = 0;
    for (const p of pages) {
      const r = p.h / p.w;
      const k = r.toFixed(2);
      counts[k] = (counts[k] || 0) + 1;
      if (counts[k] > bestN) { bestN = counts[k]; ratio = r; }
    }
    const availW = window.innerWidth - 24;
    const availH = window.innerHeight - 96; // หักแถบบน/ล่าง
    const el = stageRef.current;
    el.style.cssText = ""; // ล้าง inline เก่าตอน rebuild

    // มือถือ/แท็บเล็ตแนวตั้ง/จอแคบ = เลื่อนดูภาพเต็มความกว้าง (flip คู่หน้าเล็กจนอ่านไม่ออก)
    // ต่ำกว่า 900 = คู่หน้าจะแคบกว่า ~430px ต่อหน้า → อ่านยาก จึงใช้โหมดเลื่อนภาพแทน
    if (availW < 900) {
      setScrollMode(true);
      el.style.cssText = "display:block;width:100%;height:100%;overflow-y:auto;-webkit-overflow-scrolling:touch;";
      el.innerHTML = "";
      for (const p of pages) {
        const img = document.createElement("img");
        img.src = p.src;
        img.loading = "lazy";
        img.style.cssText = "display:block;width:100%;max-width:820px;height:auto;margin:0 auto 10px;background:#fff;border-radius:2px;";
        el.appendChild(img);
      }
      return;
    }

    // เดสก์ท็อป = flipbook · maxWidth/maxHeight ต้องสอดคล้องสัดส่วนหน้าจริง (กันหน้าผิดสัดส่วน)
    setScrollMode(false);
    const twoPage = availW >= 720; // จอกว้าง → คู่หน้า
    const perW = (twoPage ? availW / 2 : availW) - 8;
    const maxW = Math.max(200, Math.round(Math.min(perW, availH / ratio, 900)));
    const minW = Math.min(360, maxW);
    const pf = new window.St.PageFlip(el, {
      width: maxW,
      height: Math.round(maxW * ratio),
      size: "stretch",
      minWidth: minW,
      maxWidth: maxW,
      minHeight: Math.round(minW * ratio),
      maxHeight: Math.round(maxW * ratio), // สอดคล้อง maxWidth × สัดส่วน
      drawShadow: true,
      maxShadowOpacity: 0.5,
      showCover: true,
      mobileScrollSupport: true,
      usePortrait: true,
    });
    pf.loadFromImages(pages.map((p) => p.src));
    pageFlipRef.current = pf;
  }

  const btn = "flex h-9 w-9 items-center justify-center rounded-full text-[21px] text-white/80 transition hover:bg-white/10 hover:text-white";

  return (
    <div className={`fixed inset-0 z-[100] flex-col bg-[#12161f] ${open ? "flex" : "hidden"}`}>
      {/* แถบบน */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <span className="flex min-w-0 items-center gap-2 text-[15px] text-white/90">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M12 6.5C10.5 5.2 8.5 4.5 6 4.5c-1 0-2 .1-3 .4v13c1-.3 2-.4 3-.4 2.5 0 4.5.7 6 2 1.5-1.3 3.5-2 6-2 1 0 2 .1 3 .4v-13c-1-.3-2-.4-3-.4-2.5 0-4.5.7-6 2Z" />
            <path d="M12 6.5v13" />
          </svg>
          <span className="truncate">ตัวอย่าง: {title}</span>
        </span>
        <div className="flex items-center gap-1">
          {!scrollMode && <>
            <button onClick={() => pageFlipRef.current?.flipPrev()} className={btn} title="หน้าก่อน">‹</button>
            <button onClick={() => pageFlipRef.current?.flipNext()} className={btn} title="หน้าถัดไป">›</button>
          </>}
          <button onClick={onClose} className={`${btn} text-[16px]`} title="ปิด">✕</button>
        </div>
      </div>

      {/* เวที flipbook */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center p-3">
        <div ref={stageRef} className="flip-stage h-full w-full" />
        {loading && !error && <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/85">กำลังโหลดตัวอย่าง…</p>}
        {error && <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/85">{error}</p>}
      </div>

      <div className="pb-3 text-center text-[13px] text-white/45">
        {scrollMode ? "เลื่อนขึ้น-ลงเพื่อดูหน้าถัดไป" : "ลากที่มุมหน้า หรือกดปุ่ม ‹ › เพื่อพลิกหน้า"}
      </div>
    </div>
  );
}
