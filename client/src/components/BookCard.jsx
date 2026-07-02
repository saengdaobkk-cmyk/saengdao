import { Link } from "react-router-dom";
import { formatPrice } from "../lib/format";

export default function BookCard({ book }) {
  return (
    <Link to={`/books/${book.id}`} className="group block">
      {/* ปก */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-mist">
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
        {book.stock <= 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-sub backdrop-blur">
            สินค้าหมด
          </span>
        )}
        {/* ป้ายลดราคา */}
        {book.discountPrice != null && book.stock > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-rose-500 px-2.5 py-1 text-[11px] font-semibold text-white">
            -{Math.round((1 - Number(book.discountPrice) / Number(book.price)) * 100)}%
          </span>
        )}
      </div>

      {/* ข้อมูล */}
      <div className="px-1 pt-3">
        {book.category && (
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
