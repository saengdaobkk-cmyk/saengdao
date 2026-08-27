import { useState } from "react";
import { Link } from "react-router-dom";
import { useAdminStats, useAdminAnalytics } from "../../api/admin";
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
        <Action to="/sdpub/orders" tone={data.pendingReview > 0 ? "amber" : "muted"} n={data.pendingReview} label="รอตรวจสลิป" />
        <Action to="/sdpub/orders" tone={data.unpaid > 0 ? "blue" : "muted"} n={data.unpaid} label="ยังไม่ชำระเงิน" />
        <Action to="/sdpub/orders" tone={data.toShip > 0 ? "indigo" : "muted"} n={data.toShip} label="รอจัดส่ง" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* คำสั่งซื้อล่าสุด */}
        <section className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <h2 className="text-[15px] font-semibold text-ink">คำสั่งซื้อล่าสุด</h2>
            <Link to="/sdpub/orders" className="text-[13px] text-accent hover:underline">ดูทั้งหมด →</Link>
          </div>
          <ul className="divide-y divide-line">
            {data.recentOrders?.map((o) => (
              <li key={o.id}>
                <Link to="/sdpub/orders" className="flex items-center gap-3 px-5 py-3 transition hover:bg-mist/40">
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
                <Link to={`/books/${b.slug || b.id}`} target="_blank" className="flex items-center gap-3 px-5 py-3 transition hover:bg-mist/40">
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

      <SalesAnalytics />
    </div>
  );
}

/* ================= รายงานยอดขาย (จาก order) ================= */
const RANGES = [{ d: 7, label: "7 วัน" }, { d: 30, label: "30 วัน" }, { d: 90, label: "90 วัน" }];

function SalesAnalytics() {
  const [days, setDays] = useState(30);
  const { data, isFetching } = useAdminAnalytics(days);

  return (
    <section className="space-y-5 pt-2">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-ink">รายงานยอดขาย</h2>
        <div className="flex gap-1 rounded-full border border-line bg-white p-0.5">
          {RANGES.map((r) => (
            <button key={r.d} onClick={() => setDays(r.d)}
              className={`rounded-full px-3 py-1 text-[12px] font-medium transition ${days === r.d ? "bg-ink text-white" : "text-sub hover:text-ink"}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {!data ? (
        <p className="text-[13px] text-sub">กำลังโหลด...</p>
      ) : (
        <div className={`space-y-5 transition-opacity ${isFetching ? "opacity-60" : ""}`}>
          {/* KPI */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Kpi label={`ยอดขาย ${days} วัน (ชำระแล้ว)`} value={formatPrice(data.revenue)} sub={`${data.paidOrders} คำสั่งซื้อ`} />
            <Kpi label="มูลค่าเฉลี่ยต่อออเดอร์ (AOV)" value={formatPrice(data.aov)} />
            <Kpi label="อัตราลูกค้าซื้อซ้ำ" value={`${data.returningRate}%`} sub="ของลูกค้าที่ชำระแล้ว" />
          </div>

          {/* กราฟ + breakdown */}
          <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
            <div className="rounded-2xl border border-line bg-white p-5">
              <p className="text-[13px] font-medium text-sub">ยอดขายตามเวลา</p>
              <AreaChart data={data.salesByDay} />
            </div>
            <div className="rounded-2xl border border-line bg-white p-5">
              <p className="mb-3 text-[13px] font-medium text-sub">สรุปยอดขาย</p>
              <BreakRow label="ยอดขายสินค้า" value={formatPrice(data.breakdown.goods)} />
              <BreakRow label="ส่วนลด" value={`-${formatPrice(data.breakdown.discount)}`} tone="rose" />
              <BreakRow label="ค่าจัดส่ง" value={formatPrice(data.breakdown.shipping)} />
              <div className="mt-2 border-t border-line pt-2">
                <BreakRow label="ยอดสุทธิ" value={formatPrice(data.breakdown.net)} bold />
              </div>
            </div>
          </div>

          {/* แยกหมวด / สำนักพิมพ์ */}
          <div className="grid gap-5 lg:grid-cols-2">
            <BarCard title="ยอดขายตามหมวดหมู่" rows={data.byCategory} />
            <BarCard title="ยอดขายตามสำนักพิมพ์" rows={data.byPublisher} />
          </div>
        </div>
      )}
    </section>
  );
}

// กราฟพื้นที่ (area) วาดด้วย SVG เอง
function AreaChart({ data }) {
  const w = 640, h = 180, pad = 6;
  if (!data?.length) return <p className="py-10 text-center text-[13px] text-sub">ยังไม่มีข้อมูล</p>;
  const max = Math.max(1, ...data.map((d) => d.total));
  const n = data.length;
  const x = (i) => pad + (i / Math.max(1, n - 1)) * (w - pad * 2);
  const y = (v) => h - pad - (v / max) * (h - pad * 2);
  const line = data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(d.total).toFixed(1)}`).join(" ");
  const area = `${line} L ${x(n - 1).toFixed(1)} ${h - pad} L ${x(0).toFixed(1)} ${h - pad} Z`;
  const total = data.reduce((s, d) => s + d.total, 0);
  return (
    <div className="mt-1">
      <p className="text-2xl font-semibold tracking-tight text-ink">{formatPrice(total)}</p>
      <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 w-full" preserveAspectRatio="none" style={{ height: 180 }}>
        <path d={area} fill="#0071e3" fillOpacity="0.08" />
        <path d={line} fill="none" stroke="#0071e3" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="mt-1 flex justify-between text-[11px] text-sub">
        <span>{new Date(data[0].date).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}</span>
        <span>{new Date(data[n - 1].date).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}</span>
      </div>
    </div>
  );
}

function BreakRow({ label, value, tone, bold }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className={`text-[13px] ${bold ? "font-semibold text-ink" : "text-sub"}`}>{label}</span>
      <span className={`text-[14px] tabular-nums ${bold ? "font-semibold text-ink" : tone === "rose" ? "text-rose-500" : "text-ink"}`}>{value}</span>
    </div>
  );
}

function BarCard({ title, rows }) {
  const max = Math.max(1, ...(rows || []).map((r) => r.total));
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <p className="mb-4 text-[13px] font-medium text-sub">{title}</p>
      {(!rows || rows.length === 0) ? (
        <p className="py-6 text-center text-[13px] text-sub">ยังไม่มีข้อมูล</p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.name}>
              <div className="mb-1 flex items-center justify-between gap-3">
                <span className="truncate text-[13px] text-ink">{r.name}</span>
                <span className="shrink-0 text-[13px] font-medium tabular-nums text-ink">{formatPrice(r.total)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-mist">
                <div className="h-full rounded-full bg-accent" style={{ width: `${(r.total / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
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
