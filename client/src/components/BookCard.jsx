import { Link } from "react-router-dom";
import { formatPrice } from "../lib/format";
import { useSettings } from "../api/settings";

export default function BookCard({ book }) {
  const { showCardCategory } = useSettings();
  // มี variant → ใช้ผลรวมสต็อกของ variant, ไม่มี → ใช้สต็อกของเล่ม
  const stock = book.variants?.length ? book.variants.reduce((s, v) => s + (Number(v.stock) || 0), 0) : book.stock;
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
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-sub backdrop-blur">
            สินค้าหมด
          </span>
        )}
        {/* ป้ายลดราคา */}
        {book.discountPrice != null && stock > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-rose-500 px-2.5 py-1 text-[11px] font-semibold text-white">
            -{Math.round((1 - Number(book.discountPrice) / Number(book.price)) * 100)}%
          </span>
        )}
      </div>

      {/* ข้อมูล */}
      <div className="px-1 pt-3">
        {showCardCategory && book.category && (
          <p className="text-[11px] font-medium tracking-tight text-sub">
            {book.category.name}
          </p>
        )}
        <h3 className="mt-0.5 line-clamp-1 text-[15px] font-medium tracking-tight text-ink transition-colors group-hover:text-accent">
          {book.title}
        </h3>
        <p className="line-clamp-1 text-[13px] text-sub">{book.author}</p>
        {book.discountPrice != null ? (
          <p className="mt-1.5 flex items-center gap-2">
            <span className="text-[15px] font-semibold tracking-tight text-rose-600">{formatPrice(book.discountPrice)}</span>
            <span className="text-[12px] text-sub line-through">{formatPrice(book.price)}</span>
          </p>
        ) : (
          <p className="mt-1.5 text-[15px] font-semibold tracking-tight text-ink">{formatPrice(book.price)}</p>
        )}
      </div>
    </Link>
  );
}
