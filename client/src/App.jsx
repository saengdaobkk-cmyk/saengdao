import { useState } from "react";
import { Outlet, Link, NavLink } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import { useCart } from "./cart/CartContext";
import { useSettings } from "./api/settings";
import { useContent } from "./api/content";
import CartDrawer from "./components/CartDrawer";

const nav = [
  { to: "/", label: "หน้าแรก", end: true },
  { to: "/?category=fiction", label: "นิยาย" },
  { to: "/?category=business", label: "ธุรกิจ" },
  { to: "/?category=children", label: "เด็ก" },
];

export default function App() {
  const { t } = useContent();
  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      {/* เมนูกระจกฝ้า ลอยติดบน */}
      <header className="sticky top-0 z-50">
        <div className="border-b border-line/70 bg-white/70 backdrop-blur-xl backdrop-saturate-150">
          <div className="mx-auto flex h-12 max-w-page items-center justify-between px-5">
            <Link
              to="/"
              className="text-[16px] font-semibold tracking-[0.22em] text-ink"
            >
              SAENGDAO
            </Link>

            <nav className="hidden items-center gap-8 sm:flex">
              {nav.map((n) => (
                <NavLink
                  key={n.label}
                  to={n.to}
                  end={n.end}
                  className={({ isActive }) =>
                    `text-[13px] tracking-tight transition-colors ${
                      isActive ? "text-ink" : "text-sub hover:text-ink"
                    }`
                  }
                >
                  {n.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-5 text-ink">
              <CartButton />
              <AccountMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <CartDrawer />

      <footer className="mt-24 border-t border-line bg-mist">
        <div className="mx-auto max-w-page px-5 py-12">
          <p className="text-[15px] font-semibold tracking-[0.22em]">SAENGDAO</p>
          <p className="mt-2 max-w-md text-[13px] leading-relaxed text-sub">
            {t("common.brand_tagline", "ร้านหนังสือแสงดาว คัดหนังสือดีมาเพื่อคุณ ส่งถึงบ้านทั่วประเทศ")}
          </p>
          <p className="mt-8 text-[12px] text-sub">
            {t("footer.copyright", "© 2026 SAENGDAO — ร้านหนังสือออนไลน์")}
          </p>
        </div>
      </footer>
    </div>
  );
}

function CartButton() {
  const { count, openDrawer } = useCart();
  const { cartDrawerEnabled } = useSettings();

  const badge = count > 0 && (
    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
      {count}
    </span>
  );

  // เปิด setting → เปิด drawer, ปิด → ไปหน้า /cart เต็มจอ
  if (cartDrawerEnabled)
    return (
      <button
        onClick={openDrawer}
        aria-label="ตะกร้า"
        className="relative text-sub transition-colors hover:text-ink"
      >
        <BagIcon />
        {badge}
      </button>
    );

  return (
    <Link to="/cart" aria-label="ตะกร้า" className="relative text-sub transition-colors hover:text-ink">
      <BagIcon />
      {badge}
    </Link>
  );
}

function AccountMenu() {
  const { user, loading, logout, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);

  if (loading) return <div className="h-[18px] w-[18px]" />;

  if (!user)
    return (
      <Link
        to="/login"
        className="text-[13px] tracking-tight text-sub transition-colors hover:text-ink"
      >
        เข้าสู่ระบบ
      </Link>
    );

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        aria-label="บัญชีของฉัน"
        className="flex items-center gap-1.5 text-sub transition-colors hover:text-ink"
      >
        <UserIcon />
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-56 overflow-hidden rounded-2xl border border-line bg-white/90 shadow-lg backdrop-blur-xl">
          <div className="border-b border-line px-4 py-3">
            <p className="text-[14px] font-medium text-ink">{user.name || "สมาชิก"}</p>
            <p className="truncate text-[12px] text-sub">{user.email}</p>
          </div>
          <div className="py-1.5 text-[14px]">
            <Link to="/account" className="block px-4 py-2 text-ink hover:bg-mist">
              บัญชีของฉัน
            </Link>
            {isAdmin && (
              <Link to="/admin" className="block px-4 py-2 text-ink hover:bg-mist">
                จัดการร้าน
              </Link>
            )}
            <button
              onClick={logout}
              className="block w-full px-4 py-2 text-left text-ink hover:bg-mist"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function UserIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" strokeLinecap="round" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 8h12l-1 12H7L6 8Z" strokeLinejoin="round" />
      <path d="M9 8a3 3 0 0 1 6 0" strokeLinecap="round" />
    </svg>
  );
}
