import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUpdateOrder, useZortSyncOrder, refreshTracking } from "../../api/admin";
import { formatPrice } from "../../lib/format";

// วันที่-เวลาแบบไทยสั้นๆ
export function fmtDate(d) {
  if (!d) return "";
  const t = new Date(d);
  if (isNaN(t)) return "";
  return t.toLocaleString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export const PAYMENT_LABEL = { PROMPTPAY: "พร้อมเพย์", TRANSFER: "โอนเงิน", CARD: "บัตร" };

export const PAY_BADGE = {
  UNPAID: "bg-gray-100 text-gray-600",
  PENDING_REVIEW: "bg-amber-100 text-amber-700",
  PAID: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-red-100 text-red-600",
};
export const PAY_TH = { UNPAID: "ยังไม่ชำระ", PENDING_REVIEW: "รอตรวจสลิป", PAID: "ชำระแล้ว", FAILED: "ไม่สำเร็จ" };

export const ORDER_BADGE = {
  PENDING: "bg-gray-100 text-gray-600",
  PAID: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-indigo-100 text-indigo-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-600",
};
export const STATUS = [
  ["PENDING", "รอดำเนินการ"],
  ["PAID", "กำลังดำเนินการ"],
  ["SHIPPED", "จัดส่งแล้ว"],
  ["COMPLETED", "สำเร็จ"],
  ["CANCELLED", "ยกเลิก"],
];
export const ORDER_TH = Object.fromEntries(STATUS);

export const CANCELLED_BY_TH = {
  ADMIN: "ยกเลิกโดยแอดมิน",
  CUSTOMER: "ยกเลิกโดยลูกค้า",
  SYSTEM: "ยกเลิกอัตโนมัติ (เกินกำหนดชำระ)",
};

export function Badge({ cls, children }) {
  return <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-medium ${cls}`}>{children}</span>;
}

export function Block({ title, children }) {
  return (
    <div>
      <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-sub">{title}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

export function hasProfileReceipt(user) {
  return !!(user?.receiptName || user?.receiptTaxId || user?.receiptAddress);
}

function EditField({ label, value, onChange, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[11px] font-medium text-sub">{label}</span>
      <input value={value} onChange={onChange} className="w-full rounded-lg border border-line bg-white px-3 py-2 text-[13px] text-ink outline-none focus:border-ink/30" />
    </label>
  );
}

// สรุปยอดสินค้า (ใช้ในหน้ารายละเอียด)
export function ItemsSummary({ order }) {
  return (
    <ul className="space-y-1.5 text-[13px]">
      {order.items.map((it) => {
        const gross = Number(it.price) * it.quantity;
        const net = Math.round(gross * (1 - (it.discountPercent || 0) / 100));
        return (
          <li key={it.id} className="flex justify-between gap-3">
            <span className="text-ink">
              {it.book.title}{it.variantName && ` (${it.variantName})`} <span className="text-sub">× {it.quantity}</span>
              {it.discountPercent > 0 && <span className="text-emerald-600"> (ลด {it.discountPercent}%)</span>}
            </span>
            <span className="text-ink">{formatPrice(net)}</span>
          </li>
        );
      })}
      {Number(order.ruleDiscount) > 0 && (
        <li className="flex justify-between text-emerald-600"><span>ส่วนลดโปรโมชั่น{order.ruleName ? ` · ${order.ruleName}` : ""}</span><span>−{formatPrice(order.ruleDiscount)}</span></li>
      )}
      {Number(order.pointsDiscount) > 0 && (
        <li className="flex justify-between text-emerald-600"><span>ใช้แต้มเป็นส่วนลด ({order.pointsUsed} แต้ม)</span><span>−{formatPrice(order.pointsDiscount)}</span></li>
      )}
      {Number(order.discount) > 0 && (
        <li className="flex justify-between text-emerald-600"><span>คูปอง {order.discountCode && `(${order.discountCode})`}</span><span>−{formatPrice(order.discount)}</span></li>
      )}
      {Number(order.shippingFee) > 0 && (
        <li className="flex justify-between"><span className="text-sub">ค่าจัดส่ง{order.shippingMethod && ` · ${order.shippingMethod}`}</span><span className="text-ink">{formatPrice(order.shippingFee)}</span></li>
      )}
      <li className="flex justify-between border-t border-line pt-1.5 text-[15px] font-semibold text-ink"><span>ยอดรวม</span><span>{formatPrice(order.total)}</span></li>
    </ul>
  );
}

// สลิป + อนุมัติการชำระเงิน
export function PaymentBlock({ order }) {
  const update = useUpdateOrder();
  return (
    <div>
      <p className="mb-2 text-[13px] font-medium text-ink">สลิปการชำระเงิน</p>
      {order.slipImage ? (
        <a href={order.slipImage} target="_blank" rel="noreferrer" className="block">
          <img src={order.slipImage} alt="สลิป" className="mx-auto max-h-72 w-auto rounded-xl border border-line" />
        </a>
      ) : (
        <div className="flex h-32 items-center justify-center rounded-xl bg-mist text-[12px] text-sub">ยังไม่มีสลิป</div>
      )}
      {order.paymentStatus !== "PAID" ? (
        <>
          <button
            onClick={() => update.mutate({ id: order.id, paymentStatus: "PAID" })}
            disabled={update.isPending}
            className="mt-3 w-full rounded-full bg-emerald-600 py-2.5 text-[13px] font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            ✓ อนุมัติการชำระเงิน
          </button>
          {order.paymentStatus === "PENDING_REVIEW" && (
            <button
              onClick={() => update.mutate({ id: order.id, paymentStatus: "FAILED" })}
              className="mt-2 w-full rounded-full border border-line py-2 text-[12px] text-sub hover:text-red-600"
            >
              ปฏิเสธสลิป
            </button>
          )}
        </>
      ) : (
        <p className="mt-3 rounded-full bg-emerald-50 py-2.5 text-center text-[13px] font-medium text-emerald-700">✓ ชำระเงินแล้ว</p>
      )}
    </div>
  );
}

// เลขพัสดุ + ดึงสถานะไปรษณีย์ไทย
export function TrackingBlock({ order }) {
  const update = useUpdateOrder();
  const qc = useQueryClient();
  const [num, setNum] = useState(order.trackingNumber || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const history = Array.isArray(order.trackingHistory) ? order.trackingHistory : [];
  const dirty = num.trim() !== (order.trackingNumber || "");
  const isTP = /ไปรษณีย์|thailand\s*post/i.test(order.shippingMethod || "");

  const saveNum = () => {
    setMsg(null);
    update.mutate({ id: order.id, trackingNumber: num.trim() || null });
  };

  const refresh = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await refreshTracking(order.id);
      if (r.ok) {
        setMsg({ ok: true, text: "อัปเดตสถานะแล้ว" });
        qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      } else {
        setMsg({ ok: false, text: r.error || "ดึงสถานะไม่สำเร็จ" });
      }
    } catch (err) {
      setMsg({ ok: false, text: err.response?.data?.error || "ดึงสถานะไม่สำเร็จ" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Block title={`ติดตามพัสดุ${order.shippingMethod ? ` · ${order.shippingMethod}` : ""}`}>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={num}
          onChange={(e) => setNum(e.target.value.toUpperCase())}
          placeholder={isTP ? "เลขพัสดุ เช่น EF667142218TH" : "เลขพัสดุ (ถ้ามี)"}
          className="min-w-52 flex-1 rounded-lg border border-line px-3 py-2 text-[13px] uppercase outline-none focus:border-ink/30"
        />
        <button
          onClick={saveNum}
          disabled={!dirty || update.isPending}
          className="rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-white transition hover:bg-ink/90 disabled:opacity-40"
        >
          บันทึกเลข
        </button>
        {isTP && (
          <button
            onClick={refresh}
            disabled={busy || !order.trackingNumber || dirty}
            title={dirty ? "บันทึกเลขพัสดุก่อน" : ""}
            className="rounded-full border border-line px-4 py-2 text-[13px] font-medium text-ink transition hover:bg-mist disabled:opacity-40"
          >
            {busy ? "กำลังดึง..." : "อัปเดตสถานะ"}
          </button>
        )}
      </div>

      {!isTP && (
        <p className="mt-2 text-[12px] text-sub">
          ช่องทางนี้ไม่รองรับติดตามสถานะอัตโนมัติ — เมื่อจัดส่ง/ส่งถึงแล้ว เปลี่ยน “สถานะคำสั่งซื้อ” เอง (เป็น จัดส่งแล้ว → สำเร็จ)
        </p>
      )}

      {isTP && order.trackingStatus && (
        <div className="mt-3 rounded-xl bg-mist px-3 py-2.5 text-[13px]">
          <p className="font-medium text-ink">{order.trackingStatus}</p>
          <p className="text-[12px] text-sub">
            {fmtDate(order.trackingStatusDate)}
            {order.trackingUpdatedAt && ` · อัปเดตเมื่อ ${fmtDate(order.trackingUpdatedAt)}`}
          </p>
          {history.length > 1 && (
            <button onClick={() => setShowHistory((s) => !s)} className="mt-1 text-[12px] text-accent">
              {showHistory ? "ซ่อนประวัติ" : `ดูประวัติทั้งหมด (${history.length})`}
            </button>
          )}
          {showHistory && (
            <ul className="mt-2 space-y-1.5 border-t border-line pt-2">
              {[...history].reverse().map((h, i) => (
                <li key={i} className="text-[12px]">
                  <span className="text-ink">{h.status}</span>
                  <span className="text-sub"> · {fmtDate(h.date)}{h.location && ` · ${h.location}`}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {msg && <p className={`mt-2 text-[12px] ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>{msg.text}</p>}
      {order.trackingLink && (
        <a href={order.trackingLink} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[12px] text-sub hover:text-ink">
          {isTP ? "เปิดหน้าไปรษณีย์ไทย ↗" : "เปิดหน้าติดตามพัสดุ ↗"}
        </a>
      )}
    </Block>
  );
}

// สถานะ/ปุ่มส่งออเดอร์ไป ZORT
export function ZortBlock({ order }) {
  const sync = useZortSyncOrder();
  const [msg, setMsg] = useState(null);

  const run = () => {
    setMsg(null);
    sync.mutate(order.id, {
      onSuccess: (r) =>
        setMsg(r.ok ? { ok: true, text: `ส่งไป ZORT แล้ว #${r.zortOrderId}` } : { ok: false, text: r.error || r.reason || "ส่งไม่สำเร็จ" }),
      onError: (e) => setMsg({ ok: false, text: e.response?.data?.error || "ส่งไม่สำเร็จ" }),
    });
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[12px] font-semibold uppercase tracking-wide text-sub">ZORT</span>
      {order.zortOrderId ? (
        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium text-emerald-700">ส่งแล้ว #{order.zortOrderId}</span>
      ) : (
        <button
          onClick={run}
          disabled={sync.isPending}
          className="rounded-full border border-line px-3 py-1.5 text-[12px] font-medium text-ink transition hover:bg-mist disabled:opacity-50"
        >
          {sync.isPending ? "กำลังส่ง..." : "ส่งไป ZORT"}
        </button>
      )}
      {msg && <p className={`text-[12px] ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>{msg.text}</p>}
    </div>
  );
}

// เตรียมค่าเริ่มต้นของฟอร์มแก้ไขจาก order
function buildForm(order) {
  return {
    shipName: order.shipName || "",
    shipPhone: order.shipPhone || "",
    shipAddress: order.shipAddress || "",
    email: order.email || "",
    note: order.note || "",
    needReceipt: order.needReceipt,
    receiptName: order.receiptName || "",
    receiptTaxId: order.receiptTaxId || "",
    receiptAddress: order.receiptAddress || "",
  };
}

// ข้อมูลจัดส่ง/ใบเสร็จ — ดูอย่างเดียว หรือกดแก้ไข
export function OrderInfo({ order, defaultEditing = false }) {
  const update = useUpdateOrder();
  const [editing, setEditing] = useState(defaultEditing);
  const [form, setForm] = useState(() => (defaultEditing ? buildForm(order) : null));
  const [error, setError] = useState("");

  const startEdit = () => {
    setError("");
    setForm(buildForm(order));
    setEditing(true);
  };
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = () => {
    setError("");
    update.mutate(
      { id: order.id, ...form },
      { onSuccess: () => setEditing(false), onError: (err) => setError(err.response?.data?.error || "บันทึกไม่สำเร็จ") }
    );
  };

  if (!editing)
    return (
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-sub">ที่อยู่จัดส่ง</p>
            <button onClick={startEdit} className="text-[12px] text-accent">แก้ไข</button>
          </div>
          <p className="text-ink">{order.shipName} · {order.shipPhone}</p>
          <p className="text-sub">{order.shipAddress}</p>
          {order.email && <p className="text-sub">{order.email}</p>}
          {order.note && <p className="mt-1 text-ink">📝 {order.note}</p>}
        </div>
        {order.needReceipt && (
          <Block title="ใบเสร็จ / ใบกำกับภาษี">
            <p className="text-ink">{order.receiptName}</p>
            {order.receiptTaxId && <p className="text-sub">เลขภาษี {order.receiptTaxId}</p>}
            <p className="text-sub">{order.receiptAddress}</p>
          </Block>
        )}
      </div>
    );

  return (
    <div className="rounded-xl border border-line bg-mist/40 p-4">
      <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-sub">แก้ไขข้อมูลจัดส่ง</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <EditField label="ชื่อผู้รับ" value={form.shipName} onChange={set("shipName")} />
        <EditField label="เบอร์โทร" value={form.shipPhone} onChange={set("shipPhone")} />
        <EditField label="อีเมล" value={form.email} onChange={set("email")} />
        <EditField label="ที่อยู่" value={form.shipAddress} onChange={set("shipAddress")} className="sm:col-span-2" />
        <EditField label="หมายเหตุ" value={form.note} onChange={set("note")} className="sm:col-span-2" />
      </div>

      <label className="mt-3 flex items-center gap-2 text-[13px] text-ink">
        <input
          type="checkbox"
          checked={form.needReceipt}
          onChange={(e) => {
            const on = e.target.checked;
            setForm((f) => ({
              ...f,
              needReceipt: on,
              receiptName: on && !f.receiptName ? f.shipName : f.receiptName,
              receiptAddress: on && !f.receiptAddress ? f.shipAddress : f.receiptAddress,
            }));
          }}
          className="h-4 w-4 accent-accent"
        />
        ต้องการใบเสร็จ / ใบกำกับภาษี
      </label>
      {form.needReceipt && (
        <div className="mt-2 flex flex-wrap gap-4">
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, receiptName: f.shipName, receiptAddress: f.shipAddress }))}
            className="text-[12px] text-accent"
          >
            ↺ ใช้ข้อมูลเดียวกับที่อยู่จัดส่ง
          </button>
          {hasProfileReceipt(order.user) && (
            <button
              type="button"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  receiptName: order.user.receiptName || f.receiptName,
                  receiptTaxId: order.user.receiptTaxId || f.receiptTaxId,
                  receiptAddress: order.user.receiptAddress || f.receiptAddress,
                }))
              }
              className="text-[12px] font-medium text-accent"
            >
              ⬇ ดึงข้อมูลใบเสร็จของลูกค้า
            </button>
          )}
        </div>
      )}
      {form.needReceipt && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <EditField label="ชื่อ/บริษัท (ใบเสร็จ)" value={form.receiptName} onChange={set("receiptName")} />
          <EditField label="เลขผู้เสียภาษี" value={form.receiptTaxId} onChange={set("receiptTaxId")} />
          <EditField label="ที่อยู่ใบเสร็จ" value={form.receiptAddress} onChange={set("receiptAddress")} className="sm:col-span-2" />
        </div>
      )}

      {error && <p className="mt-2 text-[12px] text-red-600">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button onClick={save} disabled={update.isPending} className="rounded-full bg-accent px-5 py-2 text-[13px] font-medium text-white transition hover:bg-accent/90 disabled:opacity-50">
          {update.isPending ? "กำลังบันทึก..." : "บันทึก"}
        </button>
        <button onClick={() => setEditing(false)} className="rounded-full border border-line px-4 py-2 text-[13px] text-ink hover:bg-white">ยกเลิก</button>
      </div>
    </div>
  );
}
