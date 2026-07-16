import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { api } from "../lib/api";
import { formatPrice } from "../lib/format";
import { priceInfo } from "../lib/pricing";

// lightbox ค้นหาแบบ live — ค้นจาก ชื่อ/ผู้เขียน/ผู้แปล/ISBN
export default function SearchModal({ open, onClose }) {
  const [term, setTerm] = useState("");
  const [dq, setDq] = useState(""); // debounced
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // debounce การพิมพ์
  useEffect(() => {
    const t = setTimeout(() => setDq(term.trim()), 220);
    return () => clearTimeout(t);
  }, [term]);

  // โฟกัส + ล็อกสกรอลตอนเปิด · ปิดด้วย Esc
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    const id = setTimeout(() => inputRef.current?.focus(), 40);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      clearTimeout(id);
    };
  }, [open, onClose]);

  // ล้างคำค้นเมื่อปิด
  useEffect(() => {
    if (!open) { setTerm(""); setDq(""); }
  }, [open]);

  const { data, isFetching } = useQuery({
    queryKey: ["search", dq],
    queryFn: async () => (await api.get("/books", { params: { q: dq, limit: 8 } })).data,
    enabled: open && dq.length >= 1,
    placeholderData: keepPreviousData,
  });

  const items = dq ? data?.items || [] : [];
  const total = data?.total || 0;

  const goAll = () => {
    if (!dq) return;
    onClose();
    navigate(`/books?q=${encodeURIComponent(dq)}`);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      {/* ฉากหลัง */}
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />

      {/* กล่องค้นหา */}
      <div className="absolute inset-x-0 top-0 flex justify-center px-4 pt-[8vh]">
        <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
          {/* ช่องพิมพ์ */}
          <form onSubmit={(e) => { e.preventDefault(); goAll(); }} className="flex items-center gap-3 border-b border-line px-5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="shrink-0 text-sub">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
            <input
              ref={inputRef}
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="ค้นหาชื่อหนังสือ ผู้เขียน ผู้แปล หรือ ISBN"
              className="w-full bg-transparent py-4 text-[16px] text-ink outline-none placeholder:text-sub/70"
            />
            {term && (
              <button type="button" onClick={() => setTerm("")} aria-label="ล้าง" className="shrink-0 rounded-full p-1 text-sub hover:bg-mist hover:text-ink">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
              </button>
            )}
            <button type="button" onClick={onClose} className="shrink-0 rounded-lg px-2 py-1 text-[12px] text-sub hover:text-ink">ปิด</button>
          </form>

          {/* ผลลัพธ์ */}
          <div className="max-h-[62vh] overflow-y-auto">
            {dq && items.length === 0 && !isFetching && (
              <p className="px-5 py-10 text-center text-[13px] text-sub">ไม่พบผลลัพธ์สำหรับ “{dq}”</p>
            )}

            {items.length > 0 && (
              <ul className="py-2">
                {items.map((b) => {
                  const pi = priceInfo(b);
                  return (
                    <li key={b.id}>
                      <Link
                        to={`/books/${b.id}`}
                        onClick={onClose}
                        className="flex items-center gap-4 px-5 py-2.5 transition hover:bg-mist"
                      >
                        <div className="h-14 w-10 shrink-0 overflow-hidden rounded-md bg-mist ring-1 ring-line">
                          {b.coverImage && <img src={b.coverImage} alt="" className="h-full w-full object-cover" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p title={b.title} className="truncate text-[14px] font-medium text-ink">{b.title}</p>
                          <p
                            title={b.author + (b.translator ? ` · แปล ${b.translator}` : "")}
                            className="truncate text-[12.5px] text-sub"
                          >
                            {b.author}
                            {b.translator && ` · แปล ${b.translator}`}
                          </p>
                        </div>
                        <span className={`shrink-0 text-[13px] font-semibold ${pi.price < pi.original ? "text-rose-600" : "text-ink"}`}>
                          {formatPrice(pi.price)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}

            {dq && total > items.length && (
              <button onClick={goAll} className="w-full border-t border-line px-5 py-3 text-left text-[13px] font-medium text-accent hover:bg-mist">
                ดูผลการค้นหาทั้งหมด ({total}) →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
