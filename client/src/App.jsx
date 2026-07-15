import { useState, useEffect } from "react";
import { Outlet, Link, NavLink } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import { useCart } from "./cart/CartContext";
import { useSettings } from "./api/settings";
import { useContent } from "./api/content";
import { useNav } from "./api/nav";
import CartDrawer from "./components/CartDrawer";
import SearchModal from "./components/SearchModal";

export default function App() {
  const { t } = useContent();
  const s = useSettings();
  const { data: nav = [] } = useNav();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // ล็อกสกอลล์ + ปิดด้วย Esc ตอนเปิดเมนูมือถือ
  useEffect(() => {
    if (!mobileOpen) return;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && setMobileOpen(false);
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [mobileOpen]);

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      {/* เมนูกระจกฝ้า ลอยติดบน */}
      <header className="sticky top-0 z-50">
        <div className="border-b border-line/70 bg-white/70 backdrop-blur-xl backdrop-saturate-150">
          <div className="mx-auto flex h-12 max-w-page items-center justify-between px-5">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setMobileOpen(true)}
                aria-label="เมนู"
                className="-ml-1 rounded-lg p-1 text-ink transition hover:bg-mist sm:hidden"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
                </svg>
              </button>
              <Link
                to="/"
                className="text-[19px] font-semibold tracking-[0.22em] text-ink"
              >
                SAENGDAO
              </Link>
            </div>

            <nav className="hidden items-center gap-8 sm:flex">
              {nav.map((n) => (
                <NavLink
                  key={n.id}
                  to={n.url}
                  end={n.url === "/"}
                  className={({ isActive }) =>
                    `text-[16px] tracking-tight transition-colors ${
                      isActive ? "text-ink" : "text-sub hover:text-ink"
                    }`
                  }
                >
                  {n.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-5 text-ink">
              <button
                onClick={() => setSearchOpen(true)}
                aria-label="ค้นหา"
                className="rounded-lg p-1 text-ink transition hover:bg-mist"
              >
                <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" />
                </svg>
              </button>
              <CartButton />
              <AccountMenu />
            </div>
          </div>
        </div>
      </header>

      {/* เมนู slide-out มือถือ */}
      <div className={`fixed inset-0 z-[60] sm:hidden ${mobileOpen ? "" : "pointer-events-none"}`}>
        <div
          onClick={() => setMobileOpen(false)}
          className={`absolute inset-0 bg-ink/30 backdrop-blur-sm transition-opacity duration-300 ${mobileOpen ? "opacity-100" : "opacity-0"}`}
        />
        <div className={`absolute left-0 top-0 flex h-full w-72 max-w-[80%] flex-col bg-white shadow-2xl transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex h-12 items-center justify-between border-b border-line px-5">
            <span className="text-[18px] font-semibold tracking-[0.22em] text-ink">SAENGDAO</span>
            <button onClick={() => setMobileOpen(false)} aria-label="ปิด" className="rounded-lg p-1 text-sub hover:bg-mist hover:text-ink">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto p-3">
            {nav.map((n) => (
              <NavLink
                key={n.id}
                to={n.url}
                end={n.url === "/"}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block rounded-xl px-4 py-3 text-[18px] transition ${isActive ? "bg-ink text-white" : "text-ink hover:bg-mist"}`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-line p-3">
            <Link to="/account" onClick={() => setMobileOpen(false)} className="block rounded-xl px-4 py-3 text-[18px] text-ink hover:bg-mist">บัญชีของฉัน</Link>
          </div>
        </div>
      </div>

      <main className="flex-1">
        <Outlet />
      </main>

      <CartDrawer />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      <footer className="mt-14 border-t border-line bg-mist">
        <div className="mx-auto max-w-page px-5 py-14">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* แบรนด์ */}
            <div className="lg:col-span-1">
              <p className="text-[18px] font-semibold tracking-[0.22em]">SAENGDAO</p>
              <p className="mt-3 max-w-xs text-[16px] leading-relaxed text-sub">
                {t("common.brand_tagline", "ร้านหนังสือแสงดาว คัดหนังสือดีมาเพื่อคุณ ส่งถึงบ้านทั่วประเทศ")}
              </p>
              <div className="mt-4 flex gap-3">
                {s.socialFacebook && <Social label="Facebook" href={s.socialFacebook}><path d="M14 9V7c0-1 .5-1.5 1.5-1.5H17V2.5h-2.5C12 2.5 11 4 11 6v3H9v3h2v9h3v-9h2l.5-3H14Z" /></Social>}
                {s.socialInstagram && <Social label="Instagram" href={s.socialInstagram}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></Social>}
                {s.socialLine && <Social label="LINE" href={s.socialLine}><circle cx="12" cy="11" r="8" /><path d="M8 11h1M12 11h.01M15 9v4" /></Social>}
              </div>
            </div>

            {/* หมวดหมู่ */}
            <FooterCol title="หมวดหมู่" links={[
              { to: "/?category=fiction", label: "นิยาย" },
              { to: "/?category=business", label: "ธุรกิจ" },
              { to: "/?category=children", label: "หนังสือเด็ก" },
              { to: "/?category=self-development", label: "พัฒนาตัวเอง" },
            ]} />

            {/* บริการ */}
            <FooterCol title="ร้านค้า" links={[
              { to: "/track", label: "ติดตามคำสั่งซื้อ" },
              { to: "/about", label: "เกี่ยวกับเรา" },
              { to: "/contact", label: "ติดต่อเรา" },
              { to: "/account", label: "บัญชีของฉัน" },
              { to: "/cart", label: "ตะกร้าสินค้า" },
            ]} />

            {/* ช่องทางชำระเงิน */}
            <div>
              <p className="mb-3 text-[16px] font-semibold text-ink">ชำระเงินปลอดภัย</p>
              <div className="flex flex-wrap gap-2">
                {["พร้อมเพย์", "โอนเงิน", "บัตรเครดิต"].map((p) => (
                  <span key={p} className="rounded-lg border border-line bg-white px-2.5 py-1 text-[14px] text-sub">{p}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 border-t border-line pt-6 text-[15px] text-sub">
            {t("footer.copyright", "© 2026 SAENGDAO — ร้านหนังสือออนไลน์")}
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <p className="mb-3 text-[16px] font-semibold text-ink">{title}</p>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="text-[16px] text-sub transition hover:text-ink">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Social({ label, href, children }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-sub transition hover:border-ink/30 hover:text-ink">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </a>
  );
}

function CartButton() {
  const { count, openDrawer } = useCart();
  const { cartDrawerEnabled } = useSettings();

  const badge = count > 0 && (
    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[13px] font-semibold text-white">
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
  const { user, loading, logout, isStaff } = useAuth();
  const [open, setOpen] = useState(false);

  if (loading) return <div className="h-[18px] w-[18px]" />;

  if (!user)
    return (
      <Link
        to="/login"
        className="text-[16px] tracking-tight text-sub transition-colors hover:text-ink"
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
            <p className="text-[17px] font-medium text-ink">{user.name || "สมาชิก"}</p>
            <p className="truncate text-[15px] text-sub">{user.email}</p>
          </div>
          <div className="py-1.5 text-[17px]">
            <Link to="/account" className="block px-4 py-2 text-ink hover:bg-mist">
              บัญชีของฉัน
            </Link>
            {isStaff && (
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
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" strokeLinecap="round" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 8h12l-1 12H7L6 8Z" strokeLinejoin="round" />
      <path d="M9 8a3 3 0 0 1 6 0" strokeLinecap="round" />
    </svg>
  );
}
