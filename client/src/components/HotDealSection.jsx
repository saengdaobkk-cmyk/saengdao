import { useEffect, useState } from "react";
import { useHotDeals } from "../api/books";
import { hotDealActive } from "../lib/pricing";
import BookCard from "./BookCard";

// section Hot Deal หน้าแรก — ซ่อนถ้าไม่มีสินค้าที่ราคาพิเศษกำลัง active
export default function HotDealSection() {
  const { data: books } = useHotDeals();
  const [, tick] = useState(0); // บังคับ re-render ตอนโปรหมดเวลา

  // ตั้งเวลา re-render ตอนโปรที่ใกล้หมดสุดหมดอายุ → ตัวที่หมดจะหายทันที
  useEffect(() => {
    if (!books?.length) return;
    const now = Date.now();
    const nextEnd = Math.min(
      ...books.map((b) => (b.hotDealEnd ? new Date(b.hotDealEnd).getTime() : Infinity)).filter((t) => t > now)
    );
    if (!isFinite(nextEnd)) return;
    const t = setTimeout(() => tick((n) => n + 1), nextEnd - now + 500);
    return () => clearTimeout(t);
  }, [books]);

  const active = (books || []).filter((b) => hotDealActive(b));
  if (active.length === 0) return null;

  return (
    <section className="bg-gradient-to-b from-rose-50 to-white py-12">
      <div className="mx-auto max-w-page px-5">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[14px] font-semibold tracking-tight text-rose-500">🔥 ราคาพิเศษ มีเวลาจำกัด</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tightest text-ink sm:text-3xl">Hot Deal</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {active.slice(0, 8).map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      </div>
    </section>
  );
}
