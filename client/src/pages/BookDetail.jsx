import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useBook, useRelated } from "../api/books";
import { useCart } from "../cart/CartContext";
import { useSettings } from "../api/settings";
import { useContent } from "../api/content";
import BookCard from "../components/BookCard";
import FlipBook from "../components/FlipBook";
import { formatPrice } from "../lib/format";

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { add, openDrawer } = useCart();
  const { cartDrawerEnabled } = useSettings();
  const { t } = useContent();
  const { data: book, isLoading, isError } = useBook(id);
  const { data: related } = useRelated(id);

  const [flipped, setFlipped] = useState(false);
  const [variantId, setVariantId] = useState(null);
  const [variantErr, setVariantErr] = useState(false);
  const [qty, setQty] = useState(1);
  const [lbIndex, setLbIndex] = useState(null); // index รูปใน lightbox (null = ปิด)
  const [descOpen, setDescOpen] = useState(false);
  const [flipOpen, setFlipOpen] = useState(false); // เปิด flipbook ตัวอย่าง PDF

  const variant = book?.variants?.find((v) => v.id === variantId) || null;
  const hasVariants = book?.variants?.length > 0;
  const effStock = hasVariants ? (variant ? variant.stock : null) : book?.stock;

  // รูปทั้งหมด (ปกหน้า → ปกหลัง → แกลเลอรี) สำหรับ lightbox
  const front = variant?.coverImage || book?.coverImage;
  const back = variant?.backCoverImage || book?.backCoverImage;
  const gallery = book?.galleryImages || [];
  const allImages = [front, back, ...gallery].filter(Boolean);
  const openLb = (src) => setLbIndex(Math.max(0, allImages.indexOf(src)));
  const lbNext = (dir) => setLbIndex((i) => (i == null ? i : (i + dir + allImages.length) % allImages.length));

  // คีย์บอร์ด: Esc ปิด · ← → เลื่อน
  useEffect(() => {
    if (lbIndex == null) return;
    const onKey = (e) => {
      if (e.key === "Escape") setLbIndex(null);
      else if (e.key === "ArrowRight") lbNext(1);
      else if (e.key === "ArrowLeft") lbNext(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lbIndex, allImages.length]);

  const addToCart = (goCart = false) => {
    if (hasVariants && !variant) {
      setVariantErr(true);
      return;
    }
    add(book, qty, variant);
    if (goCart) navigate("/cart");
    else if (cartDrawerEnabled) openDrawer();
  };

  if (isLoading)
    return (
      <div className="mx-auto max-w-page px-5 py-20">
        <div className="grid animate-pulse gap-12 md:grid-cols-[minmax(0,380px)_1fr]">
          <div className="aspect-[145/210] rounded-3xl bg-mist" />
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
        <p className="mb-4 text-sub">{t("product.not_found", "ไม่พบหนังสือเล่มนี้")}</p>
        <Link to="/books" className="text-[14px] text-accent">{t("product.back_to_shop", "กลับไปร้านหนังสือ")}</Link>
      </div>
    );

  const showPrice = variant ? Number(variant.discountPrice ?? variant.price) : Number(book.discountPrice ?? book.price);
  const showFull = variant ? Number(variant.price) : Number(book.price);
  const showDiscount = variant ? variant.discountPrice != null : book.discountPrice != null;
  const pct = showDiscount ? Math.round((1 - showPrice / showFull) * 100) : 0;

  const meta = [
    [t("product.spec_publisher", "สำนักพิมพ์"), book.publisher],
    [t("product.spec_edition", "พิมพ์ครั้งที่"), book.edition],
    [t("product.spec_pages", "จำนวนหน้า"), book.pageCount && `${book.pageCount} ${t("product.unit_page", "หน้า")}`],
    [t("product.spec_dimensions", "ขนาด"), book.dimensions],
    [t("product.spec_weight", "น้ำหนัก"), book.weight],
    [t("product.spec_paper", "กระดาษเนื้อใน"), book.paperType],
    [t("product.spec_cover", "ปก"), book.coverType],
    [t("product.spec_isbn", "ISBN"), variant?.isbn || book.isbn],
  ].filter(([, v]) => v);

  const longDesc = (book.description || "").length > 220;

  return (
    <div className="mx-auto max-w-page px-5 py-10 sm:py-14">
      {/* breadcrumbs */}
      <nav className="flex flex-wrap items-center gap-1.5 text-[12px] text-sub">
        <Link to="/" className="hover:text-ink">{t("product.bc_home", "หน้าแรก")}</Link><span>›</span>
        <Link to="/books" className="hover:text-ink">{t("product.bc_shop", "ร้านหนังสือ")}</Link>
        {book.category && (<><span>›</span><Link to={`/books?category=${book.category.slug}`} className="hover:text-ink">{book.category.name}</Link></>)}
      </nav>

      <div className="mt-6 grid gap-12 md:grid-cols-[minmax(0,380px)_1fr] md:gap-16">
        {/* แกลเลอรี — ปกพลิกหน้า-หลัง */}
        <div className="md:sticky md:top-24 md:self-start">
          <div className={`relative aspect-[145/210] w-full ${back ? `flip-card ${flipped ? "flipped" : ""}` : "overflow-hidden rounded-3xl bg-mist ring-1 ring-line shadow-[0_18px_45px_-12px_rgba(0,0,0,0.3)]"}`}>
            {back ? (
              <div className="flip-inner">
                <div onClick={() => openLb(front)} role="button" aria-label="ดูปกหน้า"
                  className="flip-face flip-front cursor-zoom-in rounded-3xl bg-mist bg-cover bg-center ring-1 ring-line shadow-[0_18px_45px_-12px_rgba(0,0,0,0.3)]"
                  style={front ? { backgroundImage: `url("${front}")` } : undefined}>
                  {!front && <span className="flex h-full items-center justify-center text-6xl opacity-20">𝐀</span>}
                </div>
                <div onClick={() => openLb(back)} role="button" aria-label="ดูปกหลัง"
                  className="flip-face flip-back cursor-zoom-in rounded-3xl bg-mist bg-cover bg-center ring-1 ring-line shadow-[0_18px_45px_-12px_rgba(0,0,0,0.3)]"
                  style={{ backgroundImage: `url("${back}")` }} />
              </div>
            ) : (
              <button onClick={() => front && openLb(front)} className="flex h-full w-full items-center justify-center">
                {front ? <img src={front} alt={book.title} className="h-full w-full object-cover" /> : <span className="text-6xl opacity-20">𝐀</span>}
              </button>
            )}

            {/* ปุ่มพลิก */}
            {back && (
              <button
                onClick={() => setFlipped((f) => !f)}
                aria-label="พลิกดูปกหน้า/หลัง"
                title="พลิกปกหน้า/หลัง"
                className="flip-fab absolute bottom-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink shadow-md transition"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" />
                </svg>
              </button>
            )}
          </div>

          {/* thumbnails แกลเลอรี → lightbox */}
          {gallery.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2.5">
              {gallery.map((src, i) => (
                <button key={i} onClick={() => openLb(src)}
                  className="h-20 w-[62px] overflow-hidden rounded-lg border border-line transition hover:border-ink/40 hover:-translate-y-0.5">
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ข้อมูล */}
        <div>
          {/* chips */}
          <div className="flex flex-wrap items-center gap-2">
            {book.publisherLink && <Link to={`/publisher/${book.publisherLink.slug}`} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-[12px] text-ink transition hover:border-ink/40"><BuildingIcon />{book.publisherLink.name}</Link>}
            {book.category && <Link to={`/books?category=${book.category.slug}`} className="rounded-full bg-mist px-3 py-1 text-[12px] text-ink/70 transition hover:bg-line">{book.category.name}</Link>}
            {(book.tags || []).map((t) => <span key={t} className="rounded-full bg-mist px-2.5 py-1 text-[11px] text-ink/60">{t}</span>)}
          </div>

          <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tightest text-ink sm:text-4xl">{book.title}</h1>
          {book.authorLinks?.length > 0 && (
            <p className="mt-2 text-[15px] text-sub">
              {t("product.by", "โดย")} {book.authorLinks.map((a, i) => (
                <span key={a.slug}>{i > 0 && ", "}<Link to={`/author/${a.slug}`} className="font-medium text-ink transition-colors hover:text-accent">{a.name}</Link></span>
              ))}
            </p>
          )}
          {book.translatorLinks?.length > 0 && (
            <p className="mt-0.5 text-[14px] text-sub">
              {t("product.translated_by", "แปลโดย")} {book.translatorLinks.map((a, i) => (
                <span key={a.slug}>{i > 0 && ", "}<Link to={`/translator/${a.slug}`} className="font-medium text-ink transition-colors hover:text-accent">{a.name}</Link></span>
              ))}
            </p>
          )}

          {/* buybox */}
          <div className="mt-6 rounded-2xl border border-line p-5">
            <div className="flex items-end gap-3">
              <span className={`text-3xl font-semibold tracking-tight ${showDiscount ? "text-rose-600" : "text-ink"}`}>{formatPrice(showPrice)}</span>
              {showDiscount && (
                <>
                  <span className="pb-1 text-[16px] text-sub line-through">{formatPrice(showFull)}</span>
                  <span className="mb-1.5 rounded-full bg-rose-500 px-2 py-0.5 text-[12px] font-semibold text-white">{t("product.discount_label", "ลด")} {pct}%</span>
                </>
              )}
            </div>
            <p className="mt-1.5 text-[13px]">
              {hasVariants
                ? variant
                  ? variant.stock > 0 ? <span className="text-emerald-600">● {t("product.in_stock_prefix", "พร้อมส่ง")}</span> : <span className="font-medium text-rose-600">● {t("product.variant_out", "ตัวเลือกนี้สินค้าหมด")}</span>
                  : <span className="text-sub">{t("product.select_variant_hint", "เลือกตัวเลือกเพื่อดูราคา/สต็อก")}</span>
                : book.stock > 0 ? <span className="text-emerald-600">● {t("product.in_stock_prefix", "พร้อมส่ง")}</span> : <span className="font-medium text-rose-600">● {t("product.out_of_stock", "สินค้าหมด")}</span>}
            </p>

            {/* variant */}
            {hasVariants && (
              <div className="mt-4">
                <p className="mb-2 text-[13px] font-medium text-ink">{t("product.options_heading", "ตัวเลือก")} {variantErr && <span className="text-rose-500">· {t("product.select_first", "กรุณาเลือกก่อน")}</span>}</p>
                <div className="flex flex-wrap gap-2">
                  {book.variants.map((v) => {
                    const active = v.id === variantId, out = v.stock <= 0;
                    return (
                      <button key={v.id} disabled={out} onClick={() => { setVariantId(v.id); setVariantErr(false); setQty(1); }}
                        className={`rounded-xl border px-4 py-2 text-[13px] transition ${active ? "border-ink bg-ink text-white" : "border-line text-ink hover:border-ink/40"} ${out ? "cursor-not-allowed opacity-40" : ""}`}>
                        {v.name} <span className={active ? "text-white/70" : "text-sub"}>{formatPrice(v.discountPrice ?? v.price)}</span>{out && " · หมด"}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* qty + ปุ่ม */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-full border border-line">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-10 w-10 items-center justify-center text-[18px] text-ink hover:bg-mist">−</button>
                <span className="w-10 text-center text-[15px] tabular-nums">{qty}</span>
                <button onClick={() => setQty((q) => (effStock != null ? Math.min(effStock, q + 1) : q + 1))} className="flex h-10 w-10 items-center justify-center text-[18px] text-ink hover:bg-mist">+</button>
              </div>
              <button disabled={effStock != null && effStock <= 0} onClick={() => addToCart(false)}
                className="flex-1 rounded-full bg-accent px-8 py-3 text-[15px] font-medium text-white transition hover:bg-accent/90 active:scale-[0.98] disabled:opacity-40">
                {t("product.add_to_cart", "หยิบใส่ตะกร้า")}
              </button>
              {book.previewPdf && (
                <button type="button" onClick={() => setFlipOpen(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-line px-8 py-3 text-[15px] font-medium text-ink transition hover:bg-mist active:scale-[0.98] sm:w-auto">
                  <BookOpenIcon /> {t("product.preview", "อ่านตัวอย่าง")}
                </button>
              )}
            </div>

            {/* trust */}
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4 text-[13px] text-sub">
              <div className="flex items-center gap-2"><TruckIcon />{t("product.trust_shipping", "จัดส่งฟรีทั่วประเทศ")}</div>
              <div className="flex items-center gap-2"><ShieldCheckIcon />{t("product.trust_authentic", "ของแท้ 100%")}</div>
            </div>
          </div>

          {/* description */}
          {book.description && (
            <div className="mt-8">
              <h2 className="mb-3 text-[15px] font-semibold tracking-tight text-ink">{t("product.description_heading", "รายละเอียด")}</h2>
              <p className={`whitespace-pre-line text-[15px] leading-relaxed text-ink/80 ${!descOpen && longDesc ? "line-clamp-[7]" : ""}`}>
                {book.description}
              </p>
              {longDesc && (
                <button onClick={() => setDescOpen((o) => !o)} className="mt-2 text-[14px] font-medium text-accent">
                  {descOpen ? `${t("product.read_less", "ย่อ")} ▴` : `${t("product.read_more", "อ่านเพิ่ม")} ▾`}
                </button>
              )}
            </div>
          )}

          {/* specs */}
          {meta.length > 0 && (
            <div className="mt-8 border-t border-line pt-8">
              <h2 className="mb-3 text-[15px] font-semibold tracking-tight text-ink">{t("product.specs_heading", "ข้อมูลจำเพาะ")}</h2>
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

      {/* related */}
      {related?.length > 0 && (
        <section className="mt-20">
          <p className="text-[13px] font-medium tracking-tight text-sub">{t("product.related_eyebrow", "เล่มใกล้เคียง")}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tightest text-ink sm:text-3xl">{t("product.related_heading", "คุณอาจสนใจ")}</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-4">
            {related.map((b) => <BookCard key={b.id} book={b} />)}
          </div>
        </section>
      )}

      {/* flipbook ตัวอย่าง PDF */}
      {book.previewPdf && (
        <FlipBook pdfUrl={book.previewPdf} title={book.title} open={flipOpen} onClose={() => setFlipOpen(false)} />
      )}

      {/* lightbox */}
      {lbIndex != null && (
        <div onClick={() => setLbIndex(null)} className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/80 p-6 backdrop-blur-sm">
          <button className="absolute right-5 top-5 text-3xl leading-none text-white/80 hover:text-white" aria-label="ปิด">✕</button>

          {allImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); lbNext(-1); }}
                aria-label="รูปก่อนหน้า"
                className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-2xl text-white backdrop-blur transition hover:bg-white/30 sm:left-6"
              >‹</button>
              <button
                onClick={(e) => { e.stopPropagation(); lbNext(1); }}
                aria-label="รูปถัดไป"
                className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-2xl text-white backdrop-blur transition hover:bg-white/30 sm:right-6"
              >›</button>
            </>
          )}

          <img
            src={allImages[lbIndex]}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] max-w-full rounded-xl object-contain"
          />

          {allImages.length > 1 && (
            <span className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 text-[13px] text-white backdrop-blur">
              {lbIndex + 1} / {allImages.length}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ---- ไอคอนเส้นบางสไตล์มินิมอล ---- */
function BookOpenIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
      <path d="M12 6.5C10.5 5.2 8.5 4.5 6 4.5c-1 0-2 .1-3 .4v13c1-.3 2-.4 3-.4 2.5 0 4.5.7 6 2 1.5-1.3 3.5-2 6-2 1 0 2 .1 3 .4v-13c-1-.3-2-.4-3-.4-2.5 0-4.5.7-6 2Z" />
      <path d="M12 6.5v13" />
    </svg>
  );
}
function BuildingIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500">
      <path d="M4 21V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v15" />
      <path d="M15 9h3a2 2 0 0 1 2 2v10" /><path d="M3 21h18" />
      <path d="M8 8h.01M11 8h.01M8 12h.01M11 12h.01M8 16h.01M11 16h.01" />
    </svg>
  );
}
function TruckIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
      <path d="M2 7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v9H3a1 1 0 0 1-1-1V7Z" />
      <path d="M14 9h3.5a1 1 0 0 1 .8.4l2.4 3.1a1 1 0 0 1 .2.6V15a1 1 0 0 1-1 1h-1" />
      <circle cx="7" cy="17.5" r="2" /><circle cx="17.5" cy="17.5" r="2" />
      <path d="M9 17.5h6.5" />
    </svg>
  );
}
function ShieldCheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
      <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}


