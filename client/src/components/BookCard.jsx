import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatPrice } from "../lib/format";
import { priceInfo } from "../lib/pricing";
import { useSettings } from "../api/settings";
import { useCart } from "../cart/CartContext";

export default function BookCard({ book }) {
  const { showCardCategory } = useSettings();
  const { add } = useCart();
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);

  // มี variant → ใช้ผลรวมสต็อกของ variant, ไม่มี → ใช้สต็อกของเล่ม
  const stock = book.variants?.length ? book.variants.reduce((s, v) => s + (Number(v.stock) || 0), 0) : book.stock;
  const pi = priceInfo(book);
  const pct = pi.price < pi.original ? Math.round((1 - pi.price / pi.original) * 100) : 0;
  const hasVariants = book.variants?.length > 0;
  const canQuickAdd = stock > 0 && !hasVariants;

  const onCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (stock <= 0) return;
    if (!canQuickAdd) { navigate(`/books/${book.id}`); return; } // มีตัวเลือก → ไปเลือกที่หน้าสินค้า
    add(book, 1, null);
    setAdded(true);
    setTimeout(() => setAdded(false), 1300);
  };

  return (
    <Link to={`/books/${book.id}`} className="group block">
      {/* ปก */}
      <div className="relative aspect-[145/210] overflow-hidden rounded-2xl bg-mist ring-1 ring-line shadow-sm transition-shadow duration-300 group-hover:shadow-md">
        {book.coverImage ? (
          <img
            src={book.coverImage}
            alt={book.title}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-4xl opacity-25">𝐀</span>
          </div>
        )}
        {stock <= 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[13px] font-medium text-sub backdrop-blur">
            สินค้าหมด
          </span>
        )}
        {/* ป้ายลดราคา / Hot Deal */}
        {pct > 0 && stock > 0 && (
          <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[13px] font-semibold text-white ${pi.hot ? "bg-orange-500" : "bg-rose-500"}`}>
            {pi.hot && "🔥 "}-{pct}%
          </span>
        )}

        {/* ปุ่มหยิบใส่ตะกร้า — โผล่ตอน hover (จอใหญ่) / แสดงบนมือถือ · กดแล้วเด้ง+เปลี่ยนเป็นเครื่องหมายถูก */}
        {stock > 0 && (
          <button
            type="button"
            onClick={onCart}
            aria-label={canQuickAdd ? "หยิบใส่ตะกร้า" : "เลือกตัวเลือก"}
            title={canQuickAdd ? "หยิบใส่ตะกร้า" : "เลือกตัวเลือก"}
            className={`absolute bottom-2.5 right-2.5 z-[6] flex h-9 w-9 items-center justify-center rounded-full shadow-md backdrop-blur transition-all duration-200 active:scale-90 sm:opacity-0 sm:group-hover:opacity-100 ${
              added
                ? "cart-added !opacity-100 bg-emerald-500 text-white"
                : "bg-white/95 text-ink hover:bg-accent hover:text-white"
            }`}
          >
            {added ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12l4.5 4.5L19 7" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8h12l-1 11H7L6 8Z" />
                <path d="M9 8a3 3 0 0 1 6 0" />
                <path d="M12 12v3M10.5 13.5h3" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* ข้อมูล */}
      <div className="px-1 pt-3">
        {showCardCategory && book.category && (
          <p className="text-[13px] font-medium tracking-tight text-sub">
            {book.category.name}
          </p>
        )}
        <h3 className="mt-0.5 line-clamp-1 text-[17px] font-medium tracking-tight text-ink transition-colors group-hover:text-accent">
          {book.title}
        </h3>
        <p className="line-clamp-1 text-[15px] text-sub">{book.author}</p>
        {pct > 0 ? (
          <p className="mt-1.5 flex items-center gap-2">
            <span className={`text-[17px] font-semibold tracking-tight ${pi.hot ? "text-orange-600" : "text-rose-600"}`}>{formatPrice(pi.price)}</span>
            <span className="text-[14px] text-sub line-through">{formatPrice(pi.original)}</span>
          </p>
        ) : (
          <p className="mt-1.5 text-[17px] font-semibold tracking-tight text-ink">{formatPrice(pi.price)}</p>
        )}
      </div>
    </Link>
  );
}
