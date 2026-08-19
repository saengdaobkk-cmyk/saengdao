import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import { api } from "../lib/api";
import { formatPrice } from "../lib/format";
import BookLoader from "../components/BookLoader";

// จ่ายแล้ว → โชว์สถานะจัดการออเดอร์ · ยังไม่จ่าย → โชว์สถานะการชำระเงิน
const ORDER_STATUS_TH = {
  PENDING: { label: "กำลังดำเนินการ", cls: "bg-gray-100 text-gray-600" },
  PAID: { label: "กำลังดำเนินการ", cls: "bg-gray-100 text-gray-600" },
  SHIPPED: { label: "จัดส่งแล้ว", cls: "bg-blue-100 text-blue-700" },
  COMPLETED: { label: "สำเร็จ", cls: "bg-emerald-100 text-emerald-700" },
  CANCELLED: { label: "ยกเลิก", cls: "bg-red-100 text-red-600" },
};

const PAYMENT_STATUS_TH = {
  UNPAID: { label: "รอชำระเงิน", cls: "bg-amber-100 text-amber-700" },
  PENDING_REVIEW: { label: "รอตรวจสอบสลิป", cls: "bg-amber-100 text-amber-700" },
  FAILED: { label: "ชำระไม่สำเร็จ", cls: "bg-red-100 text-red-600" },
};

function orderBadge(o) {
  if (o.status === "CANCELLED") return ORDER_STATUS_TH.CANCELLED; // ยกเลิกแล้ว → โชว์ "ยกเลิก" เสมอ แม้ยังไม่จ่าย
  if (o.paymentStatus && o.paymentStatus !== "PAID")
    return PAYMENT_STATUS_TH[o.paymentStatus] || { label: o.paymentStatus, cls: "bg-gray-100 text-gray-600" };
  return ORDER_STATUS_TH[o.status] || ORDER_STATUS_TH.PENDING;
}

export default function Orders() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["my-orders", page],
    queryFn: async () => (await api.get(`/orders?page=${page}&pageSize=10`)).data,
    placeholderData: keepPreviousData,
    enabled: !!user,
  });

  if (loading) return <div className="py-24"><BookLoader /></div>;
  if (!user) return <Navigate to="/login" state={{ from: "/orders" }} replace />;

  const orders = data?.orders || [];
  const totalPages = data?.totalPages || 1;

  const goto = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-[12px] text-sub">
        <Link to="/" className="hover:text-ink">หน้าแรก</Link><span>›</span>
        <Link to="/account" className="hover:text-ink">บัญชีของฉัน</Link><span>›</span>
        <span className="text-ink">ประวัติคำสั่งซื้อ</span>
      </nav>

      <h1 className="mb-8 text-2xl font-semibold tracking-tightest text-ink sm:text-3xl">
        ประวัติคำสั่งซื้อ
        {data?.total > 0 && <span className="ml-2 text-[15px] font-normal text-sub">({data.total})</span>}
      </h1>

      {isLoading ? (
        <BookLoader />
      ) : data?.total === 0 ? (
        <div className="rounded-2xl border border-line p-10 text-center">
          <p className="text-[14px] text-sub">ยังไม่มีคำสั่งซื้อ</p>
          <Link to="/books" className="mt-3 inline-block text-[14px] text-accent">เลือกซื้อหนังสือ</Link>
        </div>
      ) : (
        <>
          <div className={`space-y-3 transition-opacity ${isFetching ? "opacity-50" : ""}`}>
            {orders.map((o) => {
              const st = orderBadge(o);
              const needPay = o.paymentStatus === "UNPAID" && o.status !== "CANCELLED";
              return (
                <Link
                  key={o.id}
                  to={`/orders/${o.id}`}
                  className="flex items-center gap-4 rounded-2xl border border-line p-4 transition hover:border-ink/20"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-ink">
                      #{o.id.slice(0, 8).toUpperCase()}
                      <span className="ml-2 text-[12px] font-normal text-sub">
                        {new Date(o.createdAt).toLocaleDateString("th-TH", { dateStyle: "medium" })}
                      </span>
                    </p>
                    <p className="text-[12px] text-sub">
                      {o.items.length} รายการ
                      {needPay && <span className="ml-2 text-accent">· ชำระเงิน/แนบสลิป →</span>}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${st.cls}`}>{st.label}</span>
                  <span className="w-20 shrink-0 text-right text-[14px] font-semibold text-ink">{formatPrice(o.total)}</span>
                </Link>
              );
            })}
          </div>
          {totalPages > 1 && <Pager page={page} totalPages={totalPages} onChange={goto} />}
        </>
      )}
    </div>
  );
}

// เลขหน้าแบบ 1 … 4 5 6 … 20
function pageWindow(cur, total) {
  const keep = new Set([1, total, cur, cur - 1, cur + 1]);
  const arr = [...keep].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const p of arr) {
    if (p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
}

function Pager({ page, totalPages, onChange }) {
  const arrow = "flex h-9 w-9 items-center justify-center rounded-full text-[15px] text-ink transition hover:bg-mist disabled:opacity-30 disabled:hover:bg-transparent";
  return (
    <div className="mt-6 flex items-center justify-center gap-1">
      <button onClick={() => onChange(page - 1)} disabled={page === 1} aria-label="ก่อนหน้า" className={arrow}>‹</button>
      {pageWindow(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-1.5 text-[14px] text-sub">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`h-9 min-w-9 rounded-full px-3 text-[14px] transition ${p === page ? "bg-ink font-medium text-white" : "text-ink hover:bg-mist"}`}
          >
            {p}
          </button>
        )
      )}
      <button onClick={() => onChange(page + 1)} disabled={page === totalPages} aria-label="ถัดไป" className={arrow}>›</button>
    </div>
  );
}
