import { useState, useMemo } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useAdminOrders, useUpdateOrder, useEditOrder, useAdminBooks } from "../../api/admin";
import { useAdminShipping } from "../../api/shipping";
import { formatPrice } from "../../lib/format";
import { PrintMenu } from "./AdminOrders";
import {
  fmtDate, PAYMENT_LABEL, PAY_BADGE, PAY_TH, ORDER_BADGE, STATUS, ORDER_TH, CANCELLED_BY_TH,
  Badge, ItemsSummary, PaymentBlock, TrackingBlock, ZortBlock, OrderInfo,
} from "./orderUi";

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { data: orders, isLoading } = useAdminOrders();
  const update = useUpdateOrder();
  const [editItems, setEditItems] = useState(false);

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
        <div className="flex items-center gap-3">
          <Badge cls={ORDER_BADGE[order.status]}>{ORDER_TH[order.status]}</Badge>
          <PrintMenu ids={[order.id]} />
        </div>
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

      {/* สินค้า / แก้ไข */}
      {editItems ? (
        <Card title="แก้ไขสินค้า · ส่วนลด · ขนส่ง">
          <OrderEditor order={order} onClose={() => setEditItems(false)} />
        </Card>
      ) : (
        <Card title="สินค้า" action={order.status !== "CANCELLED" && <button onClick={() => setEditItems(true)} className="text-[13px] text-accent">แก้ไข</button>}>
          <ItemsSummary order={order} />
        </Card>
      )}

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

function Card({ title, action, children }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && <p className="text-[14px] font-semibold text-ink">{title}</p>}
          {action}
        </div>
      )}
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

const keyOf = (bookId, variantId) => `${bookId}|${variantId || ""}`;
const unitPrice = (o) => Math.ceil(Number(o.discountPrice != null ? o.discountPrice : o.price));

function OrderEditor({ order, onClose }) {
  const edit = useEditOrder();
  const { data: shipping = [] } = useAdminShipping();
  const [rows, setRows] = useState(() =>
    order.items.map((it) => ({
      key: keyOf(it.bookId, it.variantId),
      bookId: it.bookId, variantId: it.variantId || null,
      title: it.book.title, variantName: it.variantName || null,
      price: Number(it.price), quantity: it.quantity, discountPercent: it.discountPercent || 0,
    }))
  );
  const matchedShip = shipping.find((m) => m.name === order.shippingMethod);
  const [shippingId, setShippingId] = useState(matchedShip?.id || "");
  const [discType, setDiscType] = useState("FIXED");
  const [discVal, setDiscVal] = useState(Number(order.discount) || "");
  const [error, setError] = useState("");

  const setQty = (key, q) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, quantity: Math.max(1, q) } : r)));
  const setDisc = (key, d) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, discountPercent: Math.min(100, Math.max(0, d || 0)) } : r)));
  const remove = (key) => setRows((rs) => rs.filter((r) => r.key !== key));
  const lineNet = (r) => Math.round(r.price * r.quantity * (1 - (r.discountPercent || 0) / 100));
  const addLine = (line) =>
    setRows((rs) => {
      const ex = rs.find((r) => r.key === line.key);
      if (ex) return rs.map((r) => (r.key === line.key ? { ...r, quantity: r.quantity + 1 } : r));
      return [...rs, line];
    });

  const subtotal = rows.reduce((s, r) => s + lineNet(r), 0);
  const discount = Math.min(subtotal, discType === "PERCENT" ? Math.floor((subtotal * (Number(discVal) || 0)) / 100) : Math.floor(Number(discVal) || 0));
  const shipFee = shippingId ? Math.round(Number(shipping.find((m) => m.id === shippingId)?.fee || 0)) : Number(order.shippingFee);
  const ruleDiscount = Number(order.ruleDiscount);
  const pointsDiscount = Number(order.pointsDiscount);
  const total = Math.max(0, subtotal - discount - ruleDiscount - pointsDiscount) + shipFee;

  const save = () => {
    setError("");
    if (rows.length === 0) return setError("ต้องมีสินค้าอย่างน้อย 1 รายการ");
    edit.mutate(
      {
        id: order.id,
        items: rows.map((r) => ({ bookId: r.bookId, variantId: r.variantId, quantity: r.quantity, discountPercent: r.discountPercent || 0 })),
        ...(shippingId ? { shippingMethodId: shippingId } : {}),
        discountType: discType,
        discountValue: Number(discVal) || 0,
      },
      { onSuccess: onClose, onError: (err) => setError(err.response?.data?.error || "บันทึกไม่สำเร็จ") }
    );
  };

  return (
    <div className="space-y-5">
      {/* รายการสินค้า */}
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.key} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-line px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] text-ink">{r.title}{r.variantName && <span className="text-sub"> ({r.variantName})</span>}</p>
              <p className="text-[12px] text-sub">ราคาต่อหน่วย {formatPrice(r.price)}</p>
            </div>
            {/* จำนวน */}
            <div className="flex items-center gap-1">
              <button onClick={() => setQty(r.key, r.quantity - 1)} className="h-7 w-7 rounded-lg border border-line text-ink hover:bg-mist">−</button>
              <input type="number" min="1" value={r.quantity} onChange={(e) => setQty(r.key, parseInt(e.target.value) || 1)}
                className="h-7 w-12 rounded-lg border border-line text-center text-[13px] outline-none focus:border-ink/30" />
              <button onClick={() => setQty(r.key, r.quantity + 1)} className="h-7 w-7 rounded-lg border border-line text-ink hover:bg-mist">+</button>
            </div>
            {/* ส่วนลด % */}
            <label className="flex items-center gap-1 text-[12px] text-sub">
              ลด
              <input type="number" min="0" max="100" value={r.discountPercent || ""} placeholder="0"
                onChange={(e) => setDisc(r.key, parseInt(e.target.value) || 0)}
                className="h-7 w-12 rounded-lg border border-line text-center text-[13px] outline-none focus:border-ink/30" />
              %
            </label>
            {/* จำนวนเงิน */}
            <span className="w-20 text-right text-[13px] font-medium text-ink">
              {formatPrice(lineNet(r))}
              {r.discountPercent > 0 && <span className="block text-[11px] font-normal text-sub line-through">{formatPrice(r.price * r.quantity)}</span>}
            </span>
            <button onClick={() => remove(r.key)} className="text-sub hover:text-red-600" aria-label="ลบ">✕</button>
          </div>
        ))}
        {rows.length === 0 && <p className="text-[13px] text-sub">ยังไม่มีสินค้า — เพิ่มด้านล่าง</p>}
      </div>

      <AddProduct onAdd={addLine} />

      {/* ขนส่ง + ส่วนลด */}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[12px] text-sub">ช่องทางจัดส่ง</span>
          <select value={shippingId} onChange={(e) => setShippingId(e.target.value)} className={INP}>
            <option value="">{order.shippingMethod ? `คงเดิม · ${order.shippingMethod} (${formatPrice(order.shippingFee)})` : "ไม่มีค่าจัดส่ง"}</option>
            {shipping.map((m) => <option key={m.id} value={m.id}>{m.name} · {formatPrice(m.fee)}</option>)}
          </select>
        </label>
        <div>
          <span className="mb-1 block text-[12px] text-sub">ส่วนลดท้ายบิล</span>
          <div className="flex gap-2">
            <select value={discType} onChange={(e) => setDiscType(e.target.value)} className={`${INP} w-28`}>
              <option value="FIXED">บาท</option>
              <option value="PERCENT">%</option>
            </select>
            <input type="number" min="0" value={discVal} onChange={(e) => setDiscVal(e.target.value)} placeholder="0" className={INP} />
          </div>
        </div>
      </div>

      {/* สรุปยอด */}
      <div className="ml-auto w-64 space-y-1 text-[13px]">
        <Sum label="ยอดรวมสินค้า" value={formatPrice(subtotal)} />
        {ruleDiscount > 0 && <Sum label="ส่วนลดโปรโมชั่น" value={"−" + formatPrice(ruleDiscount)} green />}
        {pointsDiscount > 0 && <Sum label="ใช้แต้มเป็นส่วนลด" value={"−" + formatPrice(pointsDiscount)} green />}
        {discount > 0 && <Sum label="ส่วนลดท้ายบิล (คูปอง/แก้มือ)" value={"−" + formatPrice(discount)} green />}
        <Sum label="ค่าจัดส่ง" value={formatPrice(shipFee)} />
        <div className="flex justify-between border-t border-line pt-1.5 text-[15px] font-semibold text-ink"><span>ยอดรวม</span><span>{formatPrice(total)}</span></div>
      </div>

      {error && <p className="text-[13px] text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button onClick={save} disabled={edit.isPending} className="rounded-full bg-accent px-6 py-2.5 text-[14px] font-medium text-white hover:bg-accent/90 disabled:opacity-50">
          {edit.isPending ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
        </button>
        <button onClick={onClose} className="rounded-full border border-line px-5 py-2.5 text-[14px] text-ink hover:bg-mist">ยกเลิก</button>
      </div>
      <p className="text-[12px] text-sub">* ระบบจะปรับสต็อกตามจำนวนที่เปลี่ยน และคิดยอดรวมใหม่อัตโนมัติ</p>
    </div>
  );
}

function AddProduct({ onAdd }) {
  const { data: books = [] } = useAdminBooks();
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return books.filter((b) => [b.title, b.isbn, b.author].some((x) => x?.toLowerCase().includes(s))).slice(0, 20);
  }, [books, q]);

  const addBook = (b) => onAdd({ key: keyOf(b.id, null), bookId: b.id, variantId: null, title: b.title, variantName: null, price: unitPrice(b), quantity: 1 });
  const addVariant = (b, v) => onAdd({ key: keyOf(b.id, v.id), bookId: b.id, variantId: v.id, title: b.title, variantName: v.name, price: unitPrice(v), quantity: 1 });

  return (
    <div className="rounded-xl border border-dashed border-line p-3">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="+ เพิ่มสินค้า — ค้นหาชื่อ / ISBN / ผู้เขียน" className={INP} />
      {results.length > 0 && (
        <div className="mt-2 max-h-56 space-y-1 overflow-y-auto">
          {results.map((b) => (
            <div key={b.id} className="rounded-lg px-2 py-1.5 hover:bg-mist">
              {b.variants?.length > 0 ? (
                <>
                  <p className="text-[13px] text-ink">{b.title}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {b.variants.map((v) => (
                      <button key={v.id} onClick={() => addVariant(b, v)} className="rounded-full border border-line px-2.5 py-0.5 text-[12px] text-accent hover:border-accent">
                        + {v.name} ({formatPrice(unitPrice(v))})
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <button onClick={() => addBook(b)} className="flex w-full items-center justify-between text-left">
                  <span className="truncate text-[13px] text-ink">{b.title}</span>
                  <span className="ml-2 shrink-0 text-[12px] text-accent">+ {formatPrice(unitPrice(b))}</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Sum({ label, value, green }) {
  return (
    <div className={`flex justify-between ${green ? "text-emerald-600" : "text-sub"}`}>
      <span>{label}</span>
      <span className={green ? "" : "text-ink"}>{value}</span>
    </div>
  );
}

const INP = "w-full rounded-lg border border-line bg-white px-3 py-2 text-[13px] text-ink outline-none focus:border-ink/30";
