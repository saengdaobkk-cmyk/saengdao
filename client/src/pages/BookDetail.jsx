import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useBook } from "../api/books";
import { useCart } from "../cart/CartContext";
import { useSettings } from "../api/settings";
import { formatPrice } from "../lib/format";

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { add, openDrawer } = useCart();
  const { cartDrawerEnabled } = useSettings();
  const { data: book, isLoading, isError } = useBook(id);
  const [activeImg, setActiveImg] = useState(0);
  const [variantId, setVariantId] = useState(null);
  const [variantErr, setVariantErr] = useState(false);

  const variant = book?.variants?.find((v) => v.id === variantId) || null;
  const hasVariants = book?.variants?.length > 0;
  // สต็อกที่ใช้ได้: ถ้ามี variant ใช้ของ variant (ต้องเลือกก่อน) ไม่งั้นของเล่ม
  const effStock = hasVariants ? (variant ? variant.stock : null) : book?.stock;

  const addToCart = (b, goCart = false) => {
    if (hasVariants && !variant) {
      setVariantErr(true);
      return;
    }
    add(b, 1, variant);
    if (goCart) navigate("/cart");
    else if (cartDrawerEnabled) openDrawer();
  };

  if (isLoading)
    return (
      <div className="mx-auto max-w-page px-5 py-20">
        <div className="grid animate-pulse gap-12 md:grid-cols-[minmax(0,360px)_1fr]">
          <div className="aspect-[3/4] rounded-3xl bg-mist" />
          <div className="space-y-4 pt-4">
            <div className="h-3 w-24 rounded bg-mist" />
            <div className="h-8 w-2/3 rounded bg-mist" />
            <div className="h-4 w-1/3 rounded bg-mist" />
          </div>
        </div>
      </div>
    );

  if (isError || !book)
    return (
      <div className="mx-auto max-w-page px-5 py-32 text-center">
        <p className="mb-4 text-sub">ไม่พบหนังสือเล่มนี้</p>
        <Link to="/" className="text-[14px] text-accent hover:underline">
          กลับหน้าแรก
        </Link>
      </div>
    );

  const images = [book.coverImage, book.backCoverImage, ...(book.galleryImages || [])].filter(Boolean);
  const hasDiscount = book.discountPrice != null;
  const meta = [
    ["สำนักพิมพ์", book.publisher],
    ["ผู้แปล", book.translator],
    ["พิมพ์ครั้งที่", book.edition],
    ["จำนวนหน้า", book.pageCount],
    ["ขนาด", book.dimensions],
    ["น้ำหนัก", book.weight],
    ["กระดาษเนื้อใน", book.paperType],
    ["ปก", book.coverType],
    ["ISBN", book.isbn],
  ].filter(([, v]) => v);

  return (
    <div className="mx-auto max-w-page px-5 py-12 sm:py-16">
      <Link to="/" className="inline-flex items-center gap-1 text-[13px] text-sub transition hover:text-ink">
        ← ทั้งหมด
      </Link>

      <div className="mt-8 grid gap-12 md:grid-cols-[minmax(0,380px)_1fr] md:gap-16">
        {/* แกลเลอรีรูป */}
        <div>
          <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-3xl bg-mist">
            {images.length > 0 ? (
              <img src={images[activeImg] || images[0]} alt={book.title} className="h-full w-full object-cover" />
            ) : (
              <span className="text-6xl opacity-20">𝐀</span>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`h-16 w-12 overflow-hidden rounded-lg border-2 transition ${i === activeImg ? "border-ink" : "border-transparent opacity-70 hover:opacity-100"}`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          {book.previewPdf && (
            <a href={book.previewPdf} target="_blank" rel="noreferrer" className="mt-4 flex items-center justify-center gap-2 rounded-full border border-line py-2.5 text-[14px] font-medium text-ink transition hover:bg-mist">
              📖 อ่านตัวอย่าง
            </a>
          )}
        </div>

        {/* ข้อมูล */}
        <div className="md:pt-2">
          <div className="flex flex-wrap items-center gap-2">
            {book.category && <span className="text-[13px] font-medium tracking-tight text-sub">{book.category.name}</span>}
            {(book.tags || []).map((t) => (
              <span key={t} className="rounded-full bg-mist px-2.5 py-0.5 text-[11px] text-ink/70">{t}</span>
            ))}
          </div>
          <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tightest text-ink sm:text-4xl">
            {book.title}
          </h1>
          <p className="mt-2 text-[15px] text-sub">
            โดย {book.author}{book.translator && ` · แปลโดย ${book.translator}`}
          </p>

          {/* ราคา — ถ้าเลือก variant แล้วโชว์ราคา variant */}
          {(() => {
            const showPrice = variant ? Number(variant.discountPrice ?? variant.price) : (hasDiscount ? Number(book.discountPrice) : Number(book.price));
            const showFull = variant ? Number(variant.price) : Number(book.price);
            const showDiscount = variant ? variant.discountPrice != null : hasDiscount;
            return (
              <div className="mt-7 flex items-end gap-3">
                <span className={`text-3xl font-semibold tracking-tight ${showDiscount ? "text-rose-600" : "text-ink"}`}>
                  {formatPrice(showPrice)}
                </span>
                {showDiscount && (
                  <>
                    <span className="pb-1 text-[16px] text-sub line-through">{formatPrice(showFull)}</span>
                    <span className="mb-1.5 rounded-full bg-rose-500 px-2 py-0.5 text-[12px] font-semibold text-white">
                      -{Math.round((1 - showPrice / showFull) * 100)}%
                    </span>
                  </>
                )}
              </div>
            );
          })()}
          <p className="mt-2 text-[13px]">
            {hasVariants ? (
              variant ? (
                variant.stock > 0 ? (
                  <span className="text-emerald-600">พร้อมส่ง · เหลือ {variant.stock} ชิ้น</span>
                ) : (
                  <span className="text-sub">ตัวเลือกนี้สินค้าหมด</span>
                )
              ) : (
                <span className="text-sub">เลือกตัวเลือกเพื่อดูราคาและสต็อก</span>
              )
            ) : book.stock > 0 ? (
              <span className="text-emerald-600">พร้อมส่ง · เหลือ {book.stock} เล่ม</span>
            ) : (
              <span className="text-sub">สินค้าหมด</span>
            )}
          </p>

          {/* ตัวเลือกสินค้า (variant) — กดเลือกได้ */}
          {hasVariants && (
            <div className="mt-5">
              <p className="mb-2 text-[13px] font-medium text-ink">
                ตัวเลือก {variantErr && <span className="text-rose-500">· กรุณาเลือกก่อน</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {book.variants.map((v) => {
                  const active = v.id === variantId;
                  const soldOut = v.stock <= 0;
                  return (
                    <button
                      key={v.id}
                      disabled={soldOut}
                      onClick={() => { setVariantId(v.id); setVariantErr(false); }}
                      className={`rounded-xl border px-4 py-2 text-[13px] transition ${
                        active ? "border-ink bg-ink text-white" : "border-line text-ink hover:border-ink/40"
                      } ${soldOut ? "cursor-not-allowed opacity-40" : ""}`}
                    >
                      <span className="font-medium">{v.name}</span>
                      <span className={`ml-2 ${active ? "text-white/70" : "text-sub"}`}>
                        {formatPrice(v.discountPrice ?? v.price)}
                      </span>
                      {soldOut && <span className="ml-1">· หมด</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ปุ่ม */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              disabled={effStock != null && effStock <= 0}
              onClick={() => addToCart(book)}
              className="rounded-full bg-accent px-8 py-3 text-[15px] font-medium text-white transition hover:bg-accent/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              หยิบใส่ตะกร้า
            </button>
            <button
              disabled={effStock != null && effStock <= 0}
              onClick={() => addToCart(book, true)}
              className="rounded-full border border-line px-8 py-3 text-[15px] font-medium text-ink transition hover:bg-mist disabled:opacity-40"
            >
              ซื้อเลย
            </button>
          </div>

          {book.description && (
            <div className="mt-10 border-t border-line pt-8">
              <h2 className="mb-3 text-[15px] font-semibold tracking-tight text-ink">รายละเอียด</h2>
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink/80">
                {book.description}
              </p>
            </div>
          )}

          {/* ข้อมูลจำเพาะ */}
          {meta.length > 0 && (
            <div className="mt-8 border-t border-line pt-8">
              <h2 className="mb-3 text-[15px] font-semibold tracking-tight text-ink">ข้อมูลจำเพาะ</h2>
              <dl className="grid gap-x-8 gap-y-2 text-[14px] sm:grid-cols-2">
                {meta.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-line/60 py-1.5">
                    <dt className="text-sub">{k}</dt>
                    <dd className="text-right text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
