import { useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useCart } from "../cart/CartContext";
import { useAuth } from "../auth/AuthContext";
import { formatPrice } from "../lib/format";

export default function CartDrawer() {
  const { items, setQty, remove, subtotal, count, drawerOpen, closeDrawer } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
          <h2 className="text-[16px] font-semibold tracking-tight text-ink">
            ตะกร้า {count > 0 && <span className="text-sub">({count})</span>}
          </h2>
          <button
            onClick={closeDrawer}
            aria-label="ปิด"
            className="rounded-full p-1.5 text-sub transition hover:bg-mist hover:text-ink"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* รายการ */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <span className="text-4xl opacity-20">🛍️</span>
            <p className="mt-4 text-[15px] text-sub">ตะกร้ายังว่างอยู่</p>
            <button
              onClick={closeDrawer}
              className="mt-6 rounded-full bg-accent px-6 py-2.5 text-[15px] font-medium text-white transition hover:bg-accent/90"
            >
              เลือกซื้อหนังสือ
            </button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {items.map((item) => (
                <li key={item.key} className="flex gap-3 py-4">
                  <div className="flex h-20 w-[60px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-mist">
                    {item.coverImage ? (
                      <img src={item.coverImage} alt={item.title} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xl opacity-25">𝐀</span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <Link
                      to={`/books/${item.id}`}
                      onClick={closeDrawer}
                      className="line-clamp-1 text-[15px] font-medium text-ink hover:text-accent"
                    >
                      {item.title}
                    </Link>
                    {item.variantName && <span className="text-[12px] text-ink/60">{item.variantName}</span>}
                    <p className="text-[13px] text-sub">{formatPrice(item.price)}</p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-full border border-line">
                        <Qty onClick={() => setQty(item.key, item.quantity - 1)} disabled={item.quantity <= 1}>−</Qty>
                        <span className="w-7 text-center text-[14px] tabular-nums">{item.quantity}</span>
                        <Qty onClick={() => setQty(item.key, item.quantity + 1)} disabled={item.quantity >= item.stock}>+</Qty>
                      </div>
                      <button
                        onClick={() => remove(item.key)}
                        className="text-[13px] text-sub transition hover:text-red-600"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* ท้าย */}
            <div className="border-t border-line px-5 py-4">
              <div className="flex items-center justify-between text-[16px]">
                <span className="text-sub">ยอดรวม</span>
                <span className="font-semibold text-ink">{formatPrice(subtotal)}</span>
              </div>
              <p className="mt-1 text-[13px] text-sub">ค่าจัดส่งฟรีทั่วประเทศ</p>
              <button
                onClick={goCheckout}
                className="mt-4 w-full rounded-full bg-accent py-3 text-[16px] font-medium text-white transition hover:bg-accent/90 active:scale-[0.99]"
              >
                ดำเนินการสั่งซื้อ
              </button>
              <Link
                to="/cart"
                onClick={closeDrawer}
                className="mt-2 block text-center text-[14px] text-sub hover:text-ink"
              >
                ดูตะกร้าแบบเต็ม
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function Qty({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-7 w-7 items-center justify-center text-[16px] text-ink transition hover:bg-line/60 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
