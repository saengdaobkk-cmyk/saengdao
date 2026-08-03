import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useCart } from "../cart/CartContext";
import { useAuth } from "../auth/AuthContext";
import { img } from "../lib/img";
import { formatPrice } from "../lib/format";

export default function CartDrawer() {
  const { items, setQty, remove, subtotal, count, note, setNote, drawerOpen, closeDrawer } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [noteOpen, setNoteOpen] = useState(false);

  // ปิด drawer อัตโนมัติเมื่อเปลี่ยนหน้า (กันค้างทับหน้าอื่น)
  useEffect(() => {
    closeDrawer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // ปิดด้วย Esc + ล็อกการสกอลล์พื้นหลังตอนเปิด
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e) => e.key === "Escape" && closeDrawer();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [drawerOpen, closeDrawer]);

  const goCheckout = () => {
    closeDrawer();
    // ยังไม่ล็อกอิน → ไป login ก่อน แล้วกลับมา checkout ต่อ
    if (!user) navigate("/login", { state: { from: "/checkout" } });
    else navigate("/checkout");
  };

  return (
    <>
      {/* overlay */}
      <div
        onClick={closeDrawer}
        className={`fixed inset-0 z-[60] bg-ink/30 backdrop-blur-[2px] transition-opacity duration-300 ${
          drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
      />

      {/* panel */}
      <aside
        role="dialog"
        aria-label="ตะกร้าสินค้า"
        aria-modal="true"
        className={`fixed right-0 top-0 z-[70] flex h-full w-full max-w-[420px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* หัว */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-[15px] font-semibold tracking-tight text-ink">
            ตะกร้า {count > 0 && <span className="text-sub">({count})</span>}
          </h2>
          <button
            onClick={closeDrawer}
            aria-label="ปิด"
            className="group flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-ink hover:bg-ink hover:text-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="transition-transform duration-300 ease-out group-hover:rotate-90">
              <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* รายการ */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-mist">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-sub/70">
                <path d="M6 8h12l-1 10.5a2 2 0 0 1-2 1.8H9a2 2 0 0 1-2-1.8L6 8Z" />
                <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
              </svg>
            </div>
            <p className="mt-4 text-[14px] text-sub">ตะกร้ายังว่างอยู่</p>
            <button
              onClick={closeDrawer}
              className="mt-6 rounded-full bg-accent px-6 py-2.5 text-[14px] font-medium text-white transition hover:bg-accent/90"
            >
              เลือกซื้อหนังสือ
            </button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {items.map((item) => (
                <li key={item.key} className="flex gap-4 py-5">
                  <Link
                    to={`/books/${item.id}`}
                    onClick={closeDrawer}
                    className="flex h-[92px] w-[64px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-mist shadow-[0_6px_16px_-6px_rgba(0,0,0,0.35)] ring-1 ring-black/[0.06] transition-transform duration-300 hover:-translate-y-0.5"
                  >
                    {item.coverImage ? (
                      <img src={img(item.coverImage, 200)} alt={item.title} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xl opacity-25">𝐀</span>
                    )}
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <Link
                      to={`/books/${item.id}`}
                      onClick={closeDrawer}
                      className="line-clamp-2 text-[14px] font-medium leading-snug text-ink hover:text-accent"
                    >
                      {item.title}
                    </Link>
                    {item.variantName && <span className="mt-0.5 text-[11px] text-ink/60">{item.variantName}</span>}
                    <p className="mt-0.5 text-[13px] font-semibold text-ink">{formatPrice(item.price)}</p>
                    <div className="mt-auto flex items-center justify-between pt-2.5">
                      <div className="flex items-center rounded-full border border-line">
                        <Qty onClick={() => setQty(item.key, item.quantity - 1)} disabled={item.quantity <= 1}>−</Qty>
                        <span className="w-7 text-center text-[13px] tabular-nums">{item.quantity}</span>
                        <Qty onClick={() => setQty(item.key, item.quantity + 1)} disabled={item.quantity >= item.stock}>+</Qty>
                      </div>
                      <button
                        onClick={() => remove(item.key)}
                        aria-label="ลบออกจากตะกร้า"
                        title="ลบออกจากตะกร้า"
                        className="cart-trash-btn rounded-lg p-1.5 text-sub transition hover:bg-red-50 hover:text-red-600"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* ท้าย */}
            <div className="border-t border-line">
              {/* หมายเหตุถึงร้าน */}
              <button
                onClick={() => setNoteOpen((v) => !v)}
                className="flex w-full items-center justify-center gap-2 py-3.5 text-[13px] font-medium text-ink transition hover:bg-mist/50"
              >
                <NoteIcon />
                หมายเหตุถึงร้าน
                {note.trim() && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
              </button>
              {noteOpen && (
                <div className="px-5 pb-3">
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    placeholder="ข้อความถึงร้าน เช่น เวลาที่สะดวกรับของ (ถ้ามี)"
                    className="w-full resize-none rounded-lg border border-line px-3 py-2 text-[13px] outline-none focus:border-ink/30"
                  />
                </div>
              )}

              {/* ยอดรวม */}
              <div className="flex items-end justify-between gap-3 border-t border-line bg-mist/30 px-5 py-4">
                <p className="max-w-[56%] text-[12px] leading-relaxed text-sub">ค่าจัดส่งคำนวณตอนชำระเงิน</p>
                <div className="text-right">
                  <p className="text-[12px] text-sub">ยอดรวม</p>
                  <p className="text-[26px] font-semibold leading-tight tracking-tight text-ink">{formatPrice(subtotal)}</p>
                </div>
              </div>

              {/* ปุ่ม */}
              <div className="grid grid-cols-2 gap-2.5 px-5 pb-5 pt-3">
                <button
                  onClick={goCheckout}
                  className="flex items-center justify-center gap-2 rounded-full bg-accent py-3.5 text-[14px] font-medium text-white transition hover:bg-accent/90 active:scale-[0.99]"
                >
                  <LockIcon />
                  ชำระเงิน
                </button>
                <Link
                  to="/cart"
                  onClick={closeDrawer}
                  className="flex items-center justify-center rounded-full border border-line py-3.5 text-[14px] font-medium text-ink transition hover:border-ink/40 hover:bg-mist/50"
                >
                  ดูตะกร้า
                </Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

// ไอคอนถังขยะ (ฝาถังยกเปิดตอน hover + ตัวถังมี X ข้างใน)
function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="overflow-visible">
      <g className="cart-trash-lid">
        <path d="M4 7h16" />
        <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
      </g>
      <g className="cart-trash-body">
        <path d="M6.5 7l.9 12a1.6 1.6 0 0 0 1.6 1.5h6a1.6 1.6 0 0 0 1.6-1.5l.9-12" />
        <path d="M10 11l4 5M14 11l-4 5" />
      </g>
    </svg>
  );
}

// ไอคอนหมายเหตุ (กระดาษโน้ต)
function NoteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15.5 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L15.5 3Z" />
      <path d="M15 3v5h5M8 13h8M8 17h5" />
    </svg>
  );
}

// ไอคอนแม่กุญแจ (ชำระเงินปลอดภัย)
function LockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function Qty({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-7 w-7 items-center justify-center text-[15px] text-ink transition hover:bg-line/60 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
