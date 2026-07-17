import { Link } from "react-router-dom";
import { useAdminStats } from "../../api/admin";
import { formatPrice } from "../../lib/format";
import { img } from "../../lib/img";

const PAY_BADGE = {
  UNPAID: "bg-gray-100 text-gray-600",
  PENDING_REVIEW: "bg-amber-100 text-amber-700",
  PAID: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-red-100 text-red-600",
};
const PAY_TH = { UNPAID: "ยังไม่ชำระ", PENDING_REVIEW: "รอตรวจสลิป", PAID: "ชำระแล้ว", FAILED: "ไม่สำเร็จ" };

export default function Dashboard() {
  const { data, isLoading } = useAdminStats();
  if (isLoading || !data) return <p className="text-sub">กำลังโหลด...</p>;

  return (
    <div className="space-y-6">
      {/* ตัวเลขหลัก */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi dark label="ยอดขายรวม (ชำระแล้ว)" value={formatPrice(data.revenue)} sub={`เดือนนี้ ${formatPrice(data.revenueMonth)}`} />
        <Kpi label="คำสั่งซื้อทั้งหมด" value={data.orders} />
        <Kpi label="หนังสือในระบบ" value={data.books} sub={data.lowStock > 0 ? `${data.lowStock} เล่มใกล้หมด` : "สต็อกปกติ"} subWarn={data.lowStock > 0} />
        <Kpi label="สมาชิก" value={data.users} />
      </div>

      {/* ต้องดำเนินการ */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Action to="/admin/orders" tone={data.pendingReview > 0 ? "amber" : "muted"} n={data.pendingReview} label="รอตรวจสลิป" />
        <Action to="/admin/orders" tone={data.unpaid > 0 ? "blue" : "muted"} n={data.unpaid} label="ยังไม่ชำระเงิน" />
        <Action to="/admin/orders" tone={data.toShip > 0 ? "indigo" : "muted"} n={data.toShip} label="รอจัดส่ง" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* คำสั่งซื้อล่าสุด */}
        <section className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <h2 className="text-[15px] font-semibold text-ink">คำสั่งซื้อล่าสุด</h2>
            <Link to="/admin/orders" className="text-[13px] text-accent hover:underline">ดูทั้งหมด →</Link>
          </div>
          <ul className="divide-y divide-line">
            {data.recentOrders?.map((o) => (
              <li key={o.id}>
                <Link to="/admin/orders" className="flex items-center gap-3 px-5 py-3 transition hover:bg-mist/40">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ink">
                      #{o.id.slice(0, 8).toUpperCase()}
                      <span className="ml-2 font-normal text-sub">{o.user?.name || o.shipName || o.user?.email}</span>
                    </p>
                    <p className="text-[12px] text-sub">{new Date(o.createdAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${PAY_BADGE[o.paymentStatus]}`}>{PAY_TH[o.paymentStatus]}</span>
                  <span className="w-20 shrink-0 text-right text-[13px] font-semibold text-ink">{formatPrice(o.total)}</span>
                </Link>
              </li>
            ))}
            {(!data.recentOrders || data.recentOrders.length === 0) && (
              <li className="px-5 py-10 text-center text-[13px] text-sub">ยังไม่มีคำสั่งซื้อ</li>
            )}
          </ul>
        </section>

        {/* ขายดี */}
        <section className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="border-b border-line px-5 py-3.5">
            <h2 className="text-[15px] font-semibold text-ink">ขายดี</h2>
          </div>
          <ul className="divide-y divide-line">
            {data.topBooks?.map((b, i) => (
              <li key={b.id}>
                <Link to={`/books/${b.id}`} target="_blank" className="flex items-center gap-3 px-5 py-3 transition hover:bg-mist/40">
                  <span className="w-4 text-center text-[13px] font-semibold text-sub">{i + 1}</span>
                  <div className="h-12 w-9 shrink-0 overflow-hidden rounded bg-mist ring-1 ring-line">
                    {b.coverImage && <img src={img(b.coverImage, 80)} alt="" loading="lazy" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ink">{b.title}</p>
                    <p className="text-[12px] text-sub">{formatPrice(b.price)}</p>
                  </div>
                  <span className="shrink-0 text-[13px] font-semibold text-ink">
                    {b.soldCount}<span className="ml-1 text-[11px] font-normal text-sub">ขาย</span>
                  </span>
                </Link>
              </li>
            ))}
            {(!data.topBooks || data.topBooks.length === 0) && (
              <li className="px-5 py-10 text-center text-[13px] text-sub">ยังไม่มียอดขาย</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, subWarn, dark }) {
  return (
    <div className={`rounded-2xl border p-5 ${dark ? "border-ink bg-ink text-white" : "border-line bg-white"}`}>
      <p className={`text-[13px] ${dark ? "text-white/60" : "text-sub"}`}>{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {sub && <p className={`mt-1 text-[12px] ${subWarn ? "text-amber-500" : dark ? "text-white/50" : "text-sub"}`}>{sub}</p>}
    </div>
  );
}

const TONES = {
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
  muted: "border-line bg-white text-sub",
};
function Action({ to, tone, n, label }) {
  return (
    <Link to={to} className={`flex items-center justify-between rounded-2xl border px-5 py-4 transition hover:shadow-sm ${TONES[tone]}`}>
      <span className="text-[14px] font-medium">{label}</span>
      <span className="text-2xl font-semibold tabular-nums">{n}</span>
    </Link>
  );
}
