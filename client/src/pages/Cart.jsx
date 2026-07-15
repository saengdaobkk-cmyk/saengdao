import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../cart/CartContext";
import { useAuth } from "../auth/AuthContext";
import { useContent } from "../api/content";
import { formatPrice } from "../lib/format";

export default function Cart() {
  const { items, setQty, remove, subtotal } = useCart();
  const { user } = useAuth();
  const { t } = useContent();
  const navigate = useNavigate();

  const goCheckout = () => {
    if (!user) navigate("/login", { state: { from: "/checkout" } });
    else navigate("/checkout");
  };

  if (items.length === 0)
    return (
      <div className="mx-auto max-w-page px-5 py-24 text-center">
        <p className="text-5xl opacity-20">🛍️</p>
        <h1 className="mt-6 text-2xl font-semibold tracking-tightest text-ink">{t("cart.empty_title", "ตะกร้าว่างเปล่า")}</h1>
        <p className="mt-2 text-[15px] text-sub">{t("cart.empty_desc", "เลือกหนังสือที่คุณชอบกันก่อนนะ")}</p>
        <Link
          to="/"
          className="mt-8 inline-block rounded-full bg-accent px-7 py-3 text-[16px] font-medium text-white transition hover:bg-accent/90"
        >
          {t("cart.empty_cta", "เลือกซื้อหนังสือ")}
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-page px-5 py-12 sm:py-16">
      <h1 className="mb-8 text-3xl font-semibold tracking-tightest text-ink">ตะกร้าสินค้า</h1>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        {/* รายการ */}
        <ul className="divide-y divide-line">
          {items.map((item) => (
            <li key={item.key} className="flex gap-4 py-5">
              <div className="flex h-24 w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-mist">
                {item.coverImage ? (
                  <img src={item.coverImage} alt={item.title} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl opacity-25">𝐀</span>
                )}
              </div>

              <div className="flex flex-1 flex-col">
                <Link to={`/books/${item.id}`} className="text-[16px] font-medium text-ink hover:text-accent">
                  {item.title}
                </Link>
                {item.variantName && (
                  <span className="mt-0.5 w-fit rounded-full bg-mist px-2 py-0.5 text-[12px] text-ink/70">{item.variantName}</span>
                )}
                <p className="text-[14px] text-sub">{item.author}</p>

                <div className="mt-auto flex items-center justify-between pt-3">
                  {/* ตัวปรับจำนวน */}
                  <div className="flex items-center rounded-full border border-line">
                    <QtyBtn onClick={() => setQty(item.key, item.quantity - 1)} disabled={item.quantity <= 1}>−</QtyBtn>
                    <span className="w-8 text-center text-[15px] tabular-nums">{item.quantity}</span>
                    <QtyBtn onClick={() => setQty(item.key, item.quantity + 1)} disabled={item.quantity >= item.stock}>+</QtyBtn>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-[16px] font-semibold text-ink">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                    <button
                      onClick={() => remove(item.key)}
                      className="text-[14px] text-sub transition hover:text-red-600"
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* สรุปยอด */}
        <aside className="h-fit rounded-2xl border border-line bg-mist/50 p-6 lg:sticky lg:top-20">
          <h2 className="text-[16px] font-semibold text-ink">สรุปคำสั่งซื้อ</h2>
          <div className="mt-4 flex justify-between text-[15px] text-sub">
            <span>ยอดรวมสินค้า</span>
            <span className="text-ink">{formatPrice(subtotal)}</span>
          </div>
          <div className="mt-2 flex justify-between text-[15px] text-sub">
            <span>ค่าจัดส่ง</span>
            <span className="text-emerald-600">ฟรี</span>
          </div>
          <div className="mt-4 flex justify-between border-t border-line pt-4 text-[17px] font-semibold text-ink">
            <span>ยอดชำระ</span>
            <span>{formatPrice(subtotal)}</span>
          </div>

          <button
            onClick={goCheckout}
            className="mt-6 w-full rounded-full bg-accent py-3 text-[16px] font-medium text-white transition hover:bg-accent/90 active:scale-[0.99]"
          >
            ดำเนินการสั่งซื้อ
          </button>
          <Link to="/" className="mt-3 block text-center text-[14px] text-sub hover:text-ink">
            เลือกซื้อต่อ
          </Link>
        </aside>
      </div>
    </div>
  );
}

function QtyBtn({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-8 w-8 items-center justify-center text-[17px] text-ink transition hover:bg-line/60 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
