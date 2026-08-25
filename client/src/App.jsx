import { useState, useEffect, useRef } from "react";
import { Outlet, Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import { useCart } from "./cart/CartContext";
import { useSettings, useSettingsLoaded } from "./api/settings";
import { useContent } from "./api/content";
import { useNav } from "./api/nav";
import CartDrawer from "./components/CartDrawer";
import SearchModal from "./components/SearchModal";

export default function App() {
  const { t } = useContent();
  const s = useSettings();
  const settingsLoaded = useSettingsLoaded(); // กันโลโก้กระพริบ text ก่อนขึ้นรูป
  const { data: nav = [] } = useNav();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // header โปร่งใสทับสไลด์ (หน้าแรก + ยังไม่ scroll) → ทึบเมื่อ scroll
  useEffect(() => {
    const onScroll = () => setScrolled((window.scrollY || 0) > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const isHome = location.pathname === "/";
  const overHero = s.transparentHeader !== false && isHome && !scrolled;

  // โลโก้รูปบนแถบเมนู — แยกพื้นสว่าง/พื้นเข้ม + ปรับขนาดได้ (ไม่มีรูป = ใช้ข้อความ SAENGDAO)
  const hdrLogoLight = s.headerLogoOnLight || ""; // ใช้บนพื้นสว่าง (แถบขาว)
  const hdrLogoDark = s.headerLogoOnDark || ""; // ใช้บนพื้นเข้ม (ทับสไลด์)
  const hdrLogoSize = Number(s.headerLogoSize) || 32;
  const hdrLogo = overHero ? hdrLogoDark || hdrLogoLight : hdrLogoLight || hdrLogoDark;

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
      {/* เมนูลอยติดบน — โปร่งใสทับสไลด์ตอนอยู่บนสุดหน้าแรก */}
      <header className="fixed inset-x-0 top-0 z-50">
        <div className={`transition-colors duration-300 ${overHero ? "" : "border-b border-line/70 bg-white/80 backdrop-blur-xl backdrop-saturate-150"}`}>
          <div className="mx-auto flex h-16 max-w-page items-center justify-between px-5">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setMobileOpen(true)}
                aria-label="เมนู"
                className={`-ml-1 rounded-lg p-1 transition sm:hidden ${overHero ? "text-white hover:bg-white/15" : "text-ink hover:bg-mist"}`}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
                </svg>
              </button>
              {!settingsLoaded ? (
                <span className="block w-28" style={{ height: `${hdrLogoSize}px` }} aria-hidden="true" />
              ) : hdrLogo ? (
                <Link to="/" className="shrink-0">
                  <img src={hdrLogo} alt="SAENGDAO" style={{ height: `${hdrLogoSize}px` }} className="w-auto object-contain" />
                </Link>
              ) : (
                <Link
                  to="/"
                  className={`font-semibold tracking-[0.22em] transition-colors ${overHero ? "text-white" : "text-ink"}`}
                  style={{ fontSize: `${Number(s.logoSizeHeader) || 18}px` }}
                >
                  SAENGDAO
                </Link>
              )}
            </div>

            <nav className="hidden items-center gap-8 sm:flex">
              {nav.map((n) =>
                n.dropdown?.length ? (
                  <NavDropdown key={n.id} item={n} overHero={overHero} />
                ) : (
                  <NavLink
                    key={n.id}
                    to={n.url}
                    end={n.url === "/"}
                    className={({ isActive }) => navLinkCls(isActive, overHero)}
                  >
                    {n.label}
                  </NavLink>
                )
              )}
            </nav>

            <div className="flex items-center gap-5">
              <button
                onClick={() => setSearchOpen(true)}
                aria-label="ค้นหา"
                className={`group transition-colors ${overHero ? "text-white/90 hover:text-white" : "text-sub hover:text-ink"}`}
              >
                <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                  className="block transition-transform duration-200 group-hover:scale-110 group-active:scale-90">
                  <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" />
                </svg>
              </button>
              <CartButton overHero={overHero} />
              <AccountMenu overHero={overHero} />
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
            {!settingsLoaded ? (
              <span className="block w-24" style={{ height: `${hdrLogoSize}px` }} aria-hidden="true" />
            ) : hdrLogoLight || hdrLogoDark ? (
              <img src={hdrLogoLight || hdrLogoDark} alt="SAENGDAO" style={{ height: `${hdrLogoSize}px` }} className="w-auto object-contain" />
            ) : (
              <span className="font-semibold tracking-[0.22em] text-ink" style={{ fontSize: `${Number(s.logoSizeHeader) || 16}px` }}>SAENGDAO</span>
            )}
            <button onClick={() => setMobileOpen(false)} aria-label="ปิด" className="rounded-lg p-1 text-sub hover:bg-mist hover:text-ink">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto p-3">
            {nav.map((n) =>
              n.dropdown?.length ? (
                <MobileNavGroup key={n.id} item={n} onNavigate={() => setMobileOpen(false)} />
              ) : (
                <NavLink
                  key={n.id}
                  to={n.url}
                  end={n.url === "/"}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-xl px-4 py-3 text-[15px] transition ${isActive ? "bg-ink text-white" : "text-ink hover:bg-mist"}`
                  }
                >
                  {n.label}
                </NavLink>
              )
            )}
          </nav>
          <div className="border-t border-line p-3">
            {user ? (
              <>
                <Link to="/account" onClick={() => setMobileOpen(false)} className="block rounded-xl px-4 py-3 text-[15px] text-ink hover:bg-mist">บัญชีของฉัน</Link>
                <Link to="/orders" onClick={() => setMobileOpen(false)} className="block rounded-xl px-4 py-3 text-[15px] text-ink hover:bg-mist">ประวัติคำสั่งซื้อ</Link>
              </>
            ) : (
              <Link to="/login" onClick={() => setMobileOpen(false)} className="block rounded-xl px-4 py-3 text-[15px] font-medium text-accent hover:bg-mist">เข้าสู่ระบบ</Link>
            )}
          </div>
        </div>
      </div>

      <main className={`flex-1 ${isHome && s.transparentHeader !== false ? "" : "pt-16"}`}>
        <Outlet />
      </main>

      <CartDrawer />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      <footer className="bg-ink text-white">
        <div className="mx-auto max-w-page px-5">
          {/* บน: โลโก้ · เมนู · โซเชียล */}
          <div className="flex flex-col items-center gap-6 py-8 sm:flex-row sm:justify-between sm:gap-4">
            <Link to="/" className="shrink-0">
              {!settingsLoaded ? (
                <span className="block w-36" style={{ height: `${Number(s.footerLogoSize) || 36}px` }} aria-hidden="true" />
              ) : s.footerLogoUrl ? (
                <img src={s.footerLogoUrl} alt="logo" style={{ height: `${Number(s.footerLogoSize) || 36}px` }} className="w-auto object-contain" />
              ) : (
                <span className="text-[26px] font-bold tracking-[0.12em] sm:text-[30px]">{s.footerLogoText || "SAENGDAO"}</span>
              )}
            </Link>

            <nav className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-[14px] text-white/70">
              {parseFooterNav(s.footerNav).map((n, i) =>
                n.url?.startsWith("http") ? (
                  <a key={i} href={n.url} target="_blank" rel="noreferrer" className="transition hover:text-white">{n.label}</a>
                ) : (
                  <Link key={i} to={n.url || "/"} className="transition hover:text-white">{n.label}</Link>
                )
              )}
            </nav>

            <div className="flex gap-3">
              {s.socialFacebook && <Social label="Facebook" href={s.socialFacebook}><path d="M14 9V7c0-1 .5-1.5 1.5-1.5H17V2.5h-2.5C12 2.5 11 4 11 6v3H9v3h2v9h3v-9h2l.5-3H14Z" /></Social>}
              {s.socialInstagram && <Social label="Instagram" href={s.socialInstagram}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></Social>}
              {s.socialLine && <Social label="LINE" href={s.socialLine}><circle cx="12" cy="11" r="8" /><path d="M8 11h1M12 11h.01M15 9v4" /></Social>}
            </div>
          </div>

          {/* ล่าง: ลิขสิทธิ์ · ลิงก์ */}
          <div className="flex flex-col items-center gap-2.5 border-t border-white/10 py-5 text-[12px] text-white/45 sm:flex-row sm:justify-between">
            <p>{t("footer.copyright", "© 2026 SAENGDAO สงวนลิขสิทธิ์")}</p>
            <div className="flex gap-6">
              <Link to="/terms" className="transition hover:text-white/80">เงื่อนไขการใช้งาน</Link>
              <Link to="/privacy" className="transition hover:text-white/80">นโยบายความเป็นส่วนตัว</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// อ่านเมนู footer จาก setting (JSON) → array { label, url }; ไม่ถูกต้อง = ใช้ค่าเริ่มต้น
function parseFooterNav(raw) {
  const DEF = [
    { label: "หนังสือ", url: "/books" },
    { label: "ติดตามคำสั่งซื้อ", url: "/track" },
    { label: "เกี่ยวกับเรา", url: "/about" },
    { label: "ติดต่อ", url: "/contact" },
  ];
  // ยังไม่เคยตั้งค่า (null/ว่าง) → ใช้ค่าเริ่มต้น; ตั้งค่าแล้ว (รวมถึงตั้งเป็นว่าง) → เคารพค่านั้น
  if (raw == null || raw === "") return DEF;
  try {
    const p = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Array.isArray(p)) return p.filter((x) => x && x.label && x.url);
  } catch { /* ผิดรูป → ใช้ค่าเริ่มต้น */ }
  return DEF;
}

// สไตล์ลิงก์เมนูบน (พื้นสว่าง/ทับสไลด์)
const navLinkCls = (isActive, overHero) =>
  `text-[15px] tracking-tight transition-colors ${
    overHero ? (isActive ? "text-white" : "text-white/80 hover:text-white") : isActive ? "text-ink" : "text-sub hover:text-accent"
  }`;

// เมนูบนที่มี dropdown — กางเมื่อ hover/โฟกัส
function NavDropdown({ item, overHero }) {
  const { pathname, search } = useLocation();
  const current = pathname + search; // เทียบรวม query เพื่อไม่ให้ /books?category=* active พร้อมกันหมด
  const [closed, setClosed] = useState(false); // ปิดชั่วคราวหลังคลิก จนกว่าเมาส์จะออกแล้วชี้ใหม่
  return (
    <div className="group relative" onMouseLeave={() => setClosed(false)}>
      <NavLink to={item.url} end={item.url === "/"} onClick={(e) => { setClosed(true); e.currentTarget.blur(); }} className={({ isActive }) => `flex items-center gap-1 ${navLinkCls(isActive, overHero)}`}>
        {item.label}
        <svg className="mt-px transition-transform duration-200 group-hover:rotate-180" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </NavLink>
      <div className={`absolute left-1/2 top-full z-50 min-w-[224px] -translate-x-1/2 pt-3 transition-all duration-150 ${closed ? "invisible opacity-0" : "invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"}`}>
        <div className="max-h-[70vh] overflow-auto rounded-2xl border border-line bg-white/95 py-2 shadow-xl backdrop-blur-xl">
          {item.dropdown.map((c, i) => {
            const active = c.url === current; // ตรงหน้าปัจจุบันเป๊ะ (รวม query)
            return (
              <Link key={i} to={c.url} onClick={(e) => { setClosed(true); e.currentTarget.blur(); }} className={`block px-4 py-2 text-[14px] transition-colors ${active ? "text-accent" : "text-sub hover:bg-mist hover:text-accent"}`}>
                {c.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// เมนูมือถือที่มี dropdown — accordion กางลง
function MobileNavGroup({ item, onNavigate }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className="flex items-center">
        <NavLink to={item.url} end={item.url === "/"} onClick={onNavigate}
          className={({ isActive }) => `flex-1 rounded-xl px-4 py-3 text-[15px] transition ${isActive ? "bg-ink text-white" : "text-ink hover:bg-mist"}`}>
          {item.label}
        </NavLink>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-label="เปิดเมนูย่อย" aria-expanded={open}
          className="ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sub transition hover:bg-mist hover:text-ink">
          <svg className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
      {open && (
        <div className="mb-1 ml-3 border-l border-line pl-2">
          {item.dropdown.map((c, i) => (
            <NavLink key={i} to={c.url} onClick={onNavigate} className="block rounded-lg px-4 py-2 text-[14px] text-sub transition hover:bg-mist hover:text-accent">
              {c.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

function Social({ label, href, children }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/70 transition hover:border-white/40 hover:text-white">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </a>
  );
}

function CartButton({ overHero }) {
  const { count, openDrawer } = useCart();
  const { cartDrawerEnabled } = useSettings();
  const [bump, setBump] = useState(false);
  const prev = useRef(count);

  // เด้งไอคอนเมื่อจำนวนสินค้าเพิ่ม
  useEffect(() => {
    if (count > prev.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 500);
      return () => clearTimeout(t);
    }
    prev.current = count;
  }, [count]);
  useEffect(() => { prev.current = count; }, [count]);

  const inner = (
    <>
      <span className={`block transition-transform duration-200 group-hover:scale-110 group-active:scale-90 ${bump ? "cart-bump" : ""}`}>
        <BagIcon />
      </span>
      {count > 0 && (
        <span className={`absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white ${bump ? "cart-badge-pop" : ""}`}>
          {count}
        </span>
      )}
    </>
  );

  const cls = `group relative inline-flex items-center transition-colors ${overHero ? "text-white/90 hover:text-white" : "text-sub hover:text-ink"}`;
  // เปิด setting → เปิด drawer, ปิด → ไปหน้า /cart เต็มจอ
  return cartDrawerEnabled ? (
    <button onClick={openDrawer} aria-label="ตะกร้า" className={cls}>{inner}</button>
  ) : (
    <Link to="/cart" aria-label="ตะกร้า" className={cls}>{inner}</Link>
  );
}

function AccountMenu({ overHero }) {
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // ปิดเมนูเมื่อแตะ/คลิกนอกเมนู หรือกด Esc (onBlur ไม่ทำงานบนมือถือ)
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  if (loading) return <div className="h-[18px] w-[18px]" />;

  if (!user)
    return (
      <Link
        to="/login"
        className={`text-[14px] tracking-tight transition-colors ${overHero ? "text-white/90 hover:text-white" : "text-sub hover:text-ink"}`}
      >
        เข้าสู่ระบบ
      </Link>
    );

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="บัญชีของฉัน"
        aria-expanded={open}
        className={`group flex items-center gap-1.5 transition-colors ${overHero ? "text-white/90 hover:text-white" : "text-sub hover:text-ink"}`}
      >
        <span className="block transition-transform duration-200 group-hover:scale-110 group-active:scale-90">
          <UserIcon />
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-56 overflow-hidden rounded-2xl border border-line bg-white/90 shadow-lg backdrop-blur-xl">
          <div className="border-b border-line px-4 py-3">
            <p className="text-[14px] font-medium text-ink">{user.name || "สมาชิก"}</p>
            <p className="truncate text-[12px] text-sub">{user.email}</p>
          </div>
          <div className="py-1.5 text-[14px]">
            <Link to="/account" onClick={() => setOpen(false)} className="block px-4 py-2 text-ink hover:bg-mist">
              บัญชีของฉัน
            </Link>
            <Link to="/orders" onClick={() => setOpen(false)} className="block px-4 py-2 text-ink hover:bg-mist">
              ประวัติคำสั่งซื้อ
            </Link>
            <button
              onClick={() => { setOpen(false); logout(); }}
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
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" strokeLinecap="round" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.33 8h11.34a2 2 0 0 1 1.977 2.304l-1.255 8.152A3 3 0 0 1 15.43 21H8.57a3 3 0 0 1-2.966-2.544l-1.255-8.152A2 2 0 0 1 6.33 8Z" />
      <path d="M9 11V6a3 3 0 0 1 6 0v5" />
    </svg>
  );
}
