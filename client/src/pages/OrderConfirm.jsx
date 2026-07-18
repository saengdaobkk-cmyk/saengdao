import { useState } from "react";
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

// ขั้นตอนของออเดอร์ (0..4) จากสถานะจ่ายเงิน + สถานะจัดการ
const STEP_LABELS = ["รับออเดอร์", "ชำระเงิน", "เตรียมของ", "จัดส่ง", "สำเร็จ"];
function stageIndex(order) {
  if (order.paymentStatus !== "PAID") return 1; // ยังอยู่ขั้นชำระเงิน
  if (order.status === "SHIPPED") return 3;
  if (order.status === "COMPLETED") return 4;
  return 2; // จ่ายแล้ว กำลังเตรียมของ
}

const TONES = {
  green: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  blue: "bg-blue-50 text-blue-600",
  red: "bg-red-50 text-red-600",
};

function headerFor(order) {
  if (order.status === "CANCELLED") return { tone: "red", icon: "x", title: "คำสั่งซื้อถูกยกเลิก", sub: "หากมีข้อสงสัย ติดต่อร้านได้เลย" };
  if (order.paymentStatus === "UNPAID") return { tone: "amber", icon: "clock", title: "รอชำระเงิน", sub: "ชำระเงินเพื่อยืนยันคำสั่งซื้อของคุณ" };
  if (order.paymentStatus === "PENDING_REVIEW") return { tone: "amber", icon: "clock", title: "รอตรวจสอบสลิป", sub: "ร้านกำลังตรวจสอบการชำระเงิน" };
  if (order.status === "SHIPPED") return { tone: "blue", icon: "truck", title: "จัดส่งแล้ว", sub: "พัสดุกำลังเดินทางไปหาคุณ" };
  if (order.status === "COMPLETED") return { tone: "green", icon: "check", title: "จัดส่งสำเร็จ", sub: "ขอบคุณที่สั่งซื้อกับ SAENGDAO" };
  return { tone: "green", icon: "box", title: "กำลังจัดเตรียมสินค้า", sub: "ร้านได้รับคำสั่งซื้อแล้ว และกำลังเตรียมของให้คุณ" };
}

function HeadIcon({ name }) {
  const p = {
    check: <path d="M20 6 9 17l-5-5" />,
    box: <><path d="M4 8l8-4 8 4v8l-8 4-8-4V8Z" /><path d="M4 8l8 4 8-4M12 12v8" /></>,
    truck: <><path d="M3 6h11v9H3zM14 9h4l3 3v3h-7z" /><circle cx="7" cy="18" r="1.6" /><circle cx="17.5" cy="18" r="1.6" /></>,
    clock: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>,
    x: <path d="M7 7l10 10M17 7 7 17" />,
  }[name];
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">{p}</svg>;
}

export function OrderHeader({ order }) {
  const h = headerFor(order);
  return (
    <div className="text-center">
      <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${TONES[h.tone]}`}>
        <HeadIcon name={h.icon} />
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tightest text-ink">{h.title}</h1>
      <p className="mt-2 text-[14px] text-sub">{h.sub} · เลขคำสั่งซื้อ #{order.id.slice(0, 8).toUpperCase()}</p>
    </div>
  );
}

// แถบความคืบหน้า 5 ขั้น
export function OrderSteps({ order }) {
  if (order.status === "CANCELLED") return null;
  const idx = stageIndex(order);
  return (
    <div className="mt-8 grid grid-cols-5">
      {STEP_LABELS.map((label, i) => {
        const done = i < idx;
        const current = i === idx;
        return (
          <div key={label} className="flex flex-col items-center">
            <div className="flex w-full items-center">
              <div className={`h-0.5 flex-1 ${i === 0 ? "opacity-0" : i <= idx ? "bg-accent" : "bg-line"}`} />
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-white transition ${
                done ? "bg-accent" : current ? "bg-accent ring-4 ring-accent/15" : "border-2 border-line bg-white"
              }`}>
                {done ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                ) : (
                  <span className={`h-2 w-2 rounded-full ${current ? "bg-white" : "bg-line"}`} />
                )}
              </div>
              <div className={`h-0.5 flex-1 ${i === STEP_LABELS.length - 1 ? "opacity-0" : i < idx ? "bg-accent" : "bg-line"}`} />
            </div>
            <span className={`mt-2 text-[9px] ${current ? "font-semibold text-ink" : done ? "text-ink/70" : "text-sub"}`}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function OrderConfirm() {
  const { id } = useParams();
  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => (await api.get(`/orders/${id}`)).data,
    // อัปเดตสถานะสด — หยุดเมื่อถึงสถานะสุดท้าย (สำเร็จ/ยกเลิก) เท่านั้น
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      return s === "COMPLETED" || s === "CANCELLED" ? false : 15000;
    },
    refetchOnWindowFocus: true,
  });

  if (isLoading) return <div className="py-24 text-center text-sub">กำลังโหลด...</div>;
  if (isError || !order)
    return (
      <div className="py-24 text-center">
        <p className="text-sub">ไม่พบคำสั่งซื้อ</p>
        <Link to="/" className="mt-4 inline-block text-[14px] text-accent">
          กลับหน้าแรก
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-xl px-5 py-16">
      {/* หัว — เปลี่ยนตามสถานะ */}
      <OrderHeader order={order} />

      {/* แถบความคืบหน้า */}
      <OrderSteps order={order} />

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

        {(Number(order.discount) > 0 || Number(order.ruleDiscount) > 0 || Number(order.shippingFee) > 0) && (
          <div className="mt-5 space-y-2 border-t border-line pt-5 text-[14px]">
            {Number(order.ruleDiscount) > 0 && (
              <div className="flex justify-between">
                <span className="text-sub">{order.ruleName || "ส่วนลดอัตโนมัติ"}</span>
                <span className="text-emerald-600">−{formatPrice(order.ruleDiscount)}</span>
              </div>
            )}
            {Number(order.discount) > 0 && (
              <div className="flex justify-between">
                <span className="text-sub">ส่วนลด {order.discountCode && `(${order.discountCode})`}</span>
                <span className="text-emerald-600">−{formatPrice(order.discount)}</span>
              </div>
            )}
            {Number(order.shippingFee) > 0 && (
              <div className="flex justify-between">
                <span className="text-sub">ค่าจัดส่ง{order.shippingMethod && ` · ${order.shippingMethod}`}</span>
                <span className="text-ink">{formatPrice(order.shippingFee)}</span>
              </div>
            )}
          </div>
        )}

        <div className={`flex justify-between text-[16px] font-semibold text-ink ${Number(order.discount) > 0 || Number(order.ruleDiscount) > 0 || Number(order.shippingFee) > 0 ? "mt-3" : "mt-5 border-t border-line pt-5"}`}>
          <span>ยอดรวม</span>
          <span>{formatPrice(order.total)}</span>
        </div>

        <dl className="mt-6 space-y-1.5 text-[13px]">
          <Row label="วิธีชำระเงิน" value={PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod} />
          {order.shippingMethod && <Row label="วิธีจัดส่ง" value={order.shippingMethod} />}
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

      {/* ติดตามพัสดุ */}
      <TrackingCard order={order} />

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

// การ์ดติดตามพัสดุ (ไปรษณีย์ไทย) — โชว์สถานะล่าสุด (กดดูประวัติทั้งหมดได้)
export function TrackingCard({ order }) {
  const [showAll, setShowAll] = useState(false);
  if (!order.trackingNumber) return null;
  const isTP = /ไปรษณีย์|thailand\s*post/i.test(order.shippingMethod || "");
  const history = Array.isArray(order.trackingHistory) ? order.trackingHistory : [];
  const timeline = [...history].reverse(); // ล่าสุดอยู่บน
  const latestLoc = timeline[0]?.location || "";
  const fmt = (d) => {
    if (!d) return "";
    const t = new Date(d);
    return isNaN(t) ? "" : t.toLocaleString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };
  return (
    <div className="mt-8 rounded-2xl border border-line p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[15px] font-semibold text-ink">ติดตามพัสดุ</h3>
        {order.trackingLink && (
          <a
            href={order.trackingLink}
            target="_blank"
            rel="noreferrer"
            className="text-[13px] text-accent"
          >
            {isTP ? "ไปรษณีย์ไทย ↗" : "ติดตามพัสดุ ↗"}
          </a>
        )}
      </div>
      <p className="mt-1 font-mono text-[13px] text-sub">
        {order.trackingNumber}{order.shippingMethod && !isTP && ` · ${order.shippingMethod}`}
      </p>

      {!isTP ? (
        <p className="mt-3 text-[13px] text-sub">
          {order.trackingLink
            ? "กดลิงก์ด้านบนเพื่อดูสถานะพัสดุกับผู้ให้บริการขนส่ง"
            : "ตรวจสอบสถานะได้จากเลขพัสดุด้านบนกับผู้ให้บริการขนส่ง"}
        </p>
      ) : order.trackingStatus ? (
        <>
          {/* สถานะล่าสุด */}
          <div className="mt-4 flex gap-3">
            <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
            <div>
              <p className="text-[13px] font-medium text-ink">{order.trackingStatus}</p>
              <p className="text-[12px] text-sub">
                {fmt(order.trackingStatusDate)}{latestLoc && ` · ${latestLoc}`}
              </p>
            </div>
          </div>

          {history.length > 1 && (
            <>
              <button
                onClick={() => setShowAll((s) => !s)}
                className="mt-3 text-[12px] text-accent hover:underline"
              >
                {showAll ? "ซ่อนประวัติ" : `ดูประวัติทั้งหมด (${history.length})`}
              </button>
              {showAll && (
                <ol className="mt-3 space-y-3 border-t border-line pt-4">
                  {timeline.map((h, i) => (
                    <li key={i} className="flex gap-3">
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${i === 0 ? "bg-emerald-500" : "bg-line"}`} />
                      <div>
                        <p className={`text-[12px] ${i === 0 ? "font-medium text-ink" : "text-sub"}`}>{h.status}</p>
                        <p className="text-[11px] text-sub">{fmt(h.date)}{h.location && ` · ${h.location}`}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </>
          )}
        </>
      ) : (
        <p className="mt-3 text-[13px] text-sub">ยังไม่มีข้อมูลสถานะ — ระบบจะอัปเดตให้อัตโนมัติ</p>
      )}
    </div>
  );
}
