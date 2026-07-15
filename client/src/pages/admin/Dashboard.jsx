import { Link } from "react-router-dom";
import { useAdminStats } from "../../api/admin";
import { formatPrice } from "../../lib/format";

export default function Dashboard() {
  const { data, isLoading } = useAdminStats();

  if (isLoading) return <p className="text-sub">กำลังโหลด...</p>;

  const cards = [
    { label: "ยอดขาย (ชำระแล้ว)", value: formatPrice(data.revenue), accent: true },
    { label: "คำสั่งซื้อทั้งหมด", value: data.orders },
    { label: "รอตรวจสลิป", value: data.pendingReview, warn: data.pendingReview > 0 },
    { label: "หนังสือในระบบ", value: data.books },
    { label: "สมาชิก", value: data.users },
  ];

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`rounded-2xl border p-5 ${
              c.accent ? "border-ink bg-ink text-white" : "border-line bg-white"
            }`}
          >
            <p className={`text-[14px] ${c.accent ? "text-white/70" : "text-sub"}`}>{c.label}</p>
            <p className={`mt-2 text-2xl font-semibold tracking-tight ${c.warn ? "text-amber-600" : ""}`}>
              {c.value}
            </p>
          </div>
        ))}
      </div>

      {data.pendingReview > 0 && (
        <Link
          to="/admin/orders"
          className="mt-6 flex items-center justify-between rounded-2xl bg-amber-50 px-5 py-4 text-amber-800 transition hover:bg-amber-100"
        >
          <span className="text-[15px] font-medium">
            มี {data.pendingReview} คำสั่งซื้อรอตรวจสลิป
          </span>
          <span className="text-[14px]">ไปตรวจสอบ →</span>
        </Link>
      )}
    </div>
  );
}
