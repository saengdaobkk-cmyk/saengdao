import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { formatPrice } from "../lib/format";
import PaymentPanel from "../components/PaymentPanel";

const PAYMENT_LABEL = {
  PROMPTPAY: "พร้อมเพย์ (PromptPay)",
  TRANSFER: "โอนเงินผ่านธนาคาร",
  CARD: "บัตรเครดิต/เดบิต",
};

const PAYMENT_STATUS_LABEL = {
  UNPAID: "รอชำระเงิน",
  PENDING_REVIEW: "รอตรวจสอบสลิป",
  PAID: "ชำระเงินแล้ว",
  FAILED: "ชำระเงินไม่สำเร็จ",
};

// เมื่อชำระเงินแล้ว แสดงสถานะการจัดการออเดอร์แทน
const ORDER_STATUS_LABEL = {
  PENDING: "กำลังดำเนินการ",
  PAID: "กำลังดำเนินการ",
  SHIPPED: "จัดส่งแล้ว",
  COMPLETED: "จัดส่งสำเร็จ",
  CANCELLED: "ยกเลิก",
};

// จ่ายแล้ว → โชว์สถานะจัดการ (กำลังดำเนินการ ...) · ยังไม่จ่าย → โชว์สถานะการชำระเงิน
function displayStatus(order) {
  if (order.paymentStatus === "PAID")
    return ORDER_STATUS_LABEL[order.status] || "กำลังดำเนินการ";
  return PAYMENT_STATUS_LABEL[order.paymentStatus] || order.paymentStatus;
}

export default function OrderConfirm() {
  const { id } = useParams();
  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => (await api.get(`/orders/${id}`)).data,
    // อัปเดตสถานะสด — พอแอดมินอนุมัติ การ์ดเปลี่ยนเองภายใน ~15 วิ
    refetchInterval: (q) => (q.state.data?.paymentStatus === "PAID" ? false : 15000),
    refetchOnWindowFocus: true,
  });

  if (isLoading) return <div className="py-24 text-center text-sub">กำลังโหลด...</div>;
  if (isError || !order)
    return (
      <div className="py-24 text-center">
        <p className="text-sub">ไม่พบคำสั่งซื้อ</p>
        <Link to="/" className="mt-4 inline-block text-[14px] text-accent hover:underline">
          กลับหน้าแรก
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-xl px-5 py-16">
      {/* หัว */}
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tightest text-ink">รับคำสั่งซื้อแล้ว</h1>
        <p className="mt-2 text-[14px] text-sub">
          ขอบคุณที่สั่งซื้อกับ SAENGDAO · เลขคำสั่งซื้อ #{order.id.slice(0, 8).toUpperCase()}
        </p>
      </div>

      {/* รายละเอียด */}
      <div className="mt-10 rounded-2xl border border-line p-6">
        <ul className="space-y-3">
          {order.items.map((it) => (
            <li key={it.id} className="flex justify-between gap-3 text-[14px]">
              <span className="text-ink">
                {it.book.title}{it.variantName && ` (${it.variantName})`} <span className="text-sub">× {it.quantity}</span>
              </span>
              <span className="shrink-0 text-ink">{formatPrice(Number(it.price) * it.quantity)}</span>
            </li>
          ))}
        </ul>

        {Number(order.discount) > 0 && (
          <div className="mt-5 flex justify-between border-t border-line pt-5 text-[14px]">
            <span className="text-sub">
              ส่วนลด {order.discountCode && `(${order.discountCode})`}
            </span>
            <span className="text-emerald-600">−{formatPrice(order.discount)}</span>
          </div>
        )}

        <div className={`flex justify-between text-[16px] font-semibold text-ink ${Number(order.discount) > 0 ? "mt-3" : "mt-5 border-t border-line pt-5"}`}>
          <span>ยอดรวม</span>
          <span>{formatPrice(order.total)}</span>
        </div>

        <dl className="mt-6 space-y-1.5 text-[13px]">
          <Row label="วิธีชำระเงิน" value={PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod} />
          <Row label="สถานะ" value={displayStatus(order)} />
          <Row label="จัดส่งถึง" value={`${order.shipName} · ${order.shipPhone}`} />
          {order.email && <Row label="อีเมล" value={order.email} />}
          <Row label="ที่อยู่" value={order.shipAddress} />
          {order.note && <Row label="หมายเหตุ" value={order.note} />}
        </dl>

        {order.needReceipt && (
          <div className="mt-6 border-t border-line pt-5">
            <p className="mb-2 text-[13px] font-semibold text-ink">ใบเสร็จรับเงิน</p>
            <dl className="space-y-1.5 text-[13px]">
              <Row label="ในนาม" value={order.receiptName} />
              {order.receiptTaxId && <Row label="เลขผู้เสียภาษี" value={order.receiptTaxId} />}
              <Row label="ที่อยู่" value={order.receiptAddress} />
            </dl>
          </div>
        )}
      </div>

      {/* ชำระเงิน */}
      <PaymentPanel order={order} />

      <Link
        to="/"
        className="mt-8 block rounded-full border border-line py-3 text-center text-[15px] font-medium text-ink transition hover:bg-mist"
      >
        เลือกซื้อต่อ
      </Link>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-sub">{label}</dt>
      <dd className="text-right text-ink">{value}</dd>
    </div>
  );
}
