import { useParams, useSearchParams, Link } from "react-router-dom";
import { useAdminOrders, useUpdateOrder } from "../../api/admin";
import { formatPrice } from "../../lib/format";
import {
  fmtDate, PAYMENT_LABEL, PAY_BADGE, PAY_TH, ORDER_BADGE, STATUS, ORDER_TH, CANCELLED_BY_TH,
  Badge, ItemsSummary, PaymentBlock, TrackingBlock, ZortBlock, OrderInfo,
} from "./orderUi";

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { data: orders, isLoading } = useAdminOrders();
  const update = useUpdateOrder();

  if (isLoading) return <p className="text-sub">กำลังโหลด...</p>;
  const order = orders?.find((o) => o.id === id);
  if (!order)
    return (
      <div className="py-12 text-center">
        <p className="text-sub">ไม่พบคำสั่งซื้อ</p>
        <Link to="/admin/orders" className="mt-3 inline-block text-[14px] text-accent">← กลับหน้าคำสั่งซื้อ</Link>
      </div>
    );

  const shipStatus = order.trackingStatus || (order.status === "SHIPPED" ? "จัดส่งแล้ว" : order.status === "COMPLETED" ? "ส่งสำเร็จ" : "-");

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {/* หัว */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/admin/orders" className="text-[13px] text-sub transition hover:text-ink">← คำสั่งซื้อทั้งหมด</Link>
          <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-ink">คำสั่งซื้อ #{order.id.slice(0, 8).toUpperCase()}</h1>
          <p className="text-[13px] text-sub">{fmtDate(order.createdAt)} · {PAYMENT_LABEL[order.paymentMethod]} · {order.user?.name || order.user?.email}</p>
        </div>
        <Badge cls={ORDER_BADGE[order.status]}>{ORDER_TH[order.status]}</Badge>
      </div>

      {/* การ์ดสถานะ */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="สถานะการชำระเงิน"><Badge cls={PAY_BADGE[order.paymentStatus]}>{PAY_TH[order.paymentStatus]}</Badge></StatCard>
        <StatCard label="สถานะคำสั่งซื้อ">
          <Badge cls={ORDER_BADGE[order.status]}>{ORDER_TH[order.status]}</Badge>
          {order.status === "CANCELLED" && order.cancelledBy && (
            <p className="mt-1.5 text-[11px] text-red-600">{CANCELLED_BY_TH[order.cancelledBy]}{order.cancelledAt && ` · ${fmtDate(order.cancelledAt)}`}</p>
          )}
        </StatCard>
        <StatCard label="การจัดส่ง"><span className="text-[14px] text-ink">{shipStatus}</span></StatCard>
      </div>

      {/* ข้อมูล + ลูกค้า */}
      <div className="grid gap-5 md:grid-cols-2">
        <Card title="ข้อมูล">
          <Info label="เลขที่คำสั่งซื้อ" value={`#${order.id.slice(0, 8).toUpperCase()}`} />
          <Info label="วันที่สั่งซื้อ" value={fmtDate(order.createdAt)} />
          <Info label="ช่องทางชำระเงิน" value={PAYMENT_LABEL[order.paymentMethod]} />
          {order.shippingMethod && <Info label="วิธีจัดส่ง" value={order.shippingMethod} />}
        </Card>
        <Card title="ลูกค้า">
          <Info label="ชื่อ" value={order.user?.name || "—"} />
          <Info label="เบอร์โทร" value={order.shipPhone || order.user?.phone || "—"} />
          {(order.email || order.user?.email) && <Info label="อีเมล" value={order.email || order.user?.email} />}
          <Info label="ที่อยู่จัดส่ง" value={order.shipAddress} />
        </Card>
      </div>

      {/* สินค้า */}
      <Card title="สินค้า">
        <ItemsSummary order={order} />
      </Card>

      {/* ชำระเงิน + ZORT */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="การชำระเงิน">
          <PaymentBlock order={order} />
        </Card>
        <div className="space-y-5">
          <Card title="จัดการสถานะ">
            <select
              value={order.status}
              onChange={(e) => update.mutate({ id: order.id, status: e.target.value })}
              className="w-full rounded-lg border border-line px-3 py-2 text-[13px] outline-none focus:border-ink/30"
            >
              {STATUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Card>
          <Card title="ZORT">
            <ZortBlock order={order} />
          </Card>
        </div>
      </div>

      {/* ข้อมูลจัดส่ง/ใบเสร็จ (แก้ไขได้) */}
      <Card title="ข้อมูลจัดส่ง & ใบเสร็จ">
        <OrderInfo order={order} defaultEditing={params.get("edit") === "1"} />
      </Card>

      {/* ติดตามพัสดุ */}
      <Card title="">
        <TrackingBlock order={order} />
      </Card>
    </div>
  );
}

function StatCard({ label, children }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="mb-2 text-[12px] text-sub">{label}</p>
      {children}
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      {title && <p className="mb-3 text-[14px] font-semibold text-ink">{title}</p>}
      {children}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-1 text-[13px]">
      <dt className="shrink-0 text-sub">{label}</dt>
      <dd className="whitespace-pre-line text-right text-ink">{value}</dd>
    </div>
  );
}
