import { useState } from "react";
import { Navigate, NavLink, Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useAdminStats } from "../../api/admin";

// adminOnly: true = เฉพาะแอดมินเต็ม · พนักงาน (STAFF) เห็นเฉพาะที่ไม่มี flag
const nav = [
  { to: "/admin", label: "ภาพรวม", end: true, icon: HomeIcon },
  { to: "/admin/orders", label: "คำสั่งซื้อ", icon: OrdersIcon, badge: "pendingReview" },
  { to: "/admin/products", label: "สินค้า", icon: ProductIcon },
  { to: "/admin/collections", label: "Collection", icon: FolderIcon },
  { to: "/admin/customers", label: "ลูกค้า", icon: CustomerIcon },
  { to: "/admin/pages", label: "เพจ / เมนู", icon: PagesIcon, adminOnly: true },
  { to: "/admin/slides", label: "สไลด์หน้าแรก", icon: SlideIcon, adminOnly: true },
  { to: "/admin/content", label: "ข้อความในเว็บ", icon: TextIcon, adminOnly: true },
  { to: "/admin/coupons", label: "โค้ดส่วนลด", icon: TagIcon, adminOnly: true },
  { to: "/admin/shipping", label: "ช่องทางจัดส่ง", icon: TruckIcon, adminOnly: true },
  { to: "/admin/users", label: "ผู้ใช้งาน (เจ้าหน้าที่)", icon: UsersIcon, adminOnly: true },
  { to: "/admin/integrations", label: "การเชื่อมต่อ", icon: PlugIcon, adminOnly: true },
];
const settingsItem = { to: "/admin/settings", label: "ตั้งค่า", icon: GearIcon, adminOnly: true };

// path ที่เฉพาะแอดมินเต็ม (กัน STAFF เข้าตรงๆ ผ่าน URL)
const ADMIN_ONLY_PATHS = ["/admin/pages", "/admin/slides", "/admin/content", "/admin/coupons", "/admin/users", "/admin/integrations", "/admin/settings"];

const TITLES = {
  "/admin": "ภาพรวม",
  "/admin/orders": "คำสั่งซื้อ",
  "/admin/products": "สินค้า",
  "/admin/collections": "Collection",
  "/admin/collections/publishers": "Collection",
  "/admin/collections/authors": "Collection",
  "/admin/collections/translators": "Collection",
  "/admin/customers": "ลูกค้า",
  "/admin/pages": "เพจ / เมนูนำทาง",
  "/admin/slides": "สไลด์หน้าแรก",
  "/admin/content": "ข้อความในเว็บ",
  "/admin/coupons": "โค้ดส่วนลด",
  "/admin/shipping": "ช่องทางจัดส่ง",
  "/admin/users": "ผู้ใช้งาน (เจ้าหน้าที่)",
  "/admin/integrations": "การเชื่อมต่อ",
  "/admin/settings": "ตั้งค่า",
};

export default function AdminLayout() {
  const { user, loading, isAdmin, isStaff } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  if (loading)
    return <div className="flex min-h-screen items-center justify-center text-sub">กำลังโหลด...</div>;
  // ยังไม่ล็อกอิน หรือเป็นลูกค้า → ไปหน้า login หลังบ้าน (แยกจากลูกค้า)
  if (!user || !isStaff)
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  // STAFF เข้า path เฉพาะแอดมินตรงๆ → เด้งกลับภาพรวม
  if (!isAdmin && ADMIN_ONLY_PATHS.some((p) => location.pathname.startsWith(p)))
    return <Navigate to="/admin" replace />;

  const navItems = nav.filter((n) => isAdmin || !n.adminOnly);
  const title = TITLES[location.pathname] || "จัดการร้าน";

  return (
    <div className="min-h-screen bg-mist text-ink">
      {/* overlay มือถือ */}
      {open && <div onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-ink/30 lg:hidden" />}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-line bg-white transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center gap-2 border-b border-line px-5">
          <span className="text-[15px] font-semibold tracking-[0.18em]">SAENGDAO</span>
          <span className="rounded bg-ink px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-white">{isAdmin ? "ADMIN" : "STAFF"}</span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((n) => (
            <SideLink key={n.to} item={n} onClick={() => setOpen(false)} />
          ))}
        </nav>

        <div className="space-y-1 border-t border-line p-3">
          {isAdmin && <SideLink item={settingsItem} onClick={() => setOpen(false)} />}
          <Link
            to="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] text-sub transition hover:bg-mist hover:text-ink"
          >
            <StoreIcon />
            ดูหน้าร้าน
          </Link>
          <AccountBox />
        </div>
      </aside>

      {/* เนื้อหา */}
      <div className="lg:pl-60">
        {/* แถบบน */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-white/80 px-5 backdrop-blur-xl">
          <button
            onClick={() => setOpen(true)}
            aria-label="เมนู"
            className="rounded-lg p-1.5 text-ink hover:bg-mist lg:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
          <h1 className="text-[16px] font-semibold tracking-tight text-ink">{title}</h1>
        </header>

        <main className="w-full px-5 py-8 sm:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SideLink({ item, onClick }) {
  const stats = useAdminStats();
  const count = item.badge ? stats.data?.[item.badge] : 0;
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition ${
          isActive ? "bg-ink text-white" : "text-sub hover:bg-mist hover:text-ink"
        }`
      }
    >
      <Icon />
      <span className="flex-1">{item.label}</span>
      {count > 0 && (
        <span className="rounded-full bg-amber-500 px-1.5 text-[11px] font-semibold text-white">{count}</span>
      )}
    </NavLink>
  );
}

function AccountBox() {
  const { user, logout } = useAuth();
  return (
    <div className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-mist text-[13px] font-medium text-ink">
        {(user.name || user.email)[0].toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-medium text-ink">{user.name || "ผู้ดูแล"}</p>
        <button onClick={logout} className="text-[11px] text-sub hover:text-red-600">ออกจากระบบ</button>
      </div>
    </div>
  );
}

/* ---- icons ---- */
function base(props) {
  return { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", ...props };
}
function HomeIcon() { return <svg {...base()}><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></svg>; }
function OrdersIcon() { return <svg {...base()}><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 7h8M8 11h8M8 15h5" /></svg>; }
function ProductIcon() { return <svg {...base()}><path d="M4 5h13l3 4v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5Z" /><path d="M4 9h16" /></svg>; }
function TagIcon() { return <svg {...base()}><path d="M3 3h8l10 10-8 8L3 11V3Z" /><circle cx="7.5" cy="7.5" r="1.5" /></svg>; }
function GearIcon() { return <svg {...base()}><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2l-.4-2.6H9.9l-.4 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2l.4 2.6h4.2l.4-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z" /></svg>; }
function StoreIcon() { return <svg {...base()}><path d="M4 9V5h16v4M4 9l1 11h14l1-11M4 9h16" /></svg>; }
function SlideIcon() { return <svg {...base()}><rect x="3" y="5" width="18" height="12" rx="2" /><path d="M8 21h8M12 17v4" /></svg>; }
function FolderIcon() { return <svg {...base()}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" /></svg>; }
function PagesIcon() { return <svg {...base()}><path d="M8 3h9a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" /><path d="M4 6v13a1 1 0 0 0 1 1h9" opacity=".5" /><path d="M10 8h5M10 11h5" /></svg>; }
function TextIcon() { return <svg {...base()}><path d="M4 6h16M4 6V4h16v2M9 6v14M9 20H7m2 0h2" /></svg>; }
function PlugIcon() { return <svg {...base()}><path d="M9 2v6M15 2v6M7 8h10v3a5 5 0 0 1-10 0V8ZM12 16v6" /></svg>; }
function UsersIcon() { return <svg {...base()}><circle cx="9" cy="8" r="3" /><path d="M3.5 20c0-3 2.5-5 5.5-5s5.5 2 5.5 5" /><path d="M16 5.5a3 3 0 0 1 0 5.5M17.5 20c0-2.3-1-3.8-2.5-4.6" /></svg>; }
function CustomerIcon() { return <svg {...base()}><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" /></svg>; }
function TruckIcon() { return <svg {...base()}><path d="M3 6h11v9H3zM14 9h4l3 3v3h-7z" /><circle cx="7" cy="18" r="1.6" /><circle cx="17.5" cy="18" r="1.6" /></svg>; }
