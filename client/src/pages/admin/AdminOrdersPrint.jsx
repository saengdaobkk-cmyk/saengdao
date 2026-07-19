import { useEffect } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useAdminOrders } from "../../api/admin";
import { useSettings } from "../../api/settings";
import { formatPrice } from "../../lib/format";

const DOC_TITLE = {
  picking: "ใบจัดเตรียมสินค้า",
  label: "ใบปะหน้าพัสดุ",
  invoice: "ใบแจ้งหนี้ / ใบเสร็จ",
};

const PAYMENT_LABEL = { PROMPTPAY: "พร้อมเพย์", TRANSFER: "โอนเงิน", CARD: "บัตรเครดิต" };
const fmtDateFull = (d) => new Date(d).toLocaleString("th-TH", { dateStyle: "long", timeStyle: "short" });
const oid = (id) => "#" + id.slice(0, 8).toUpperCase();

export default function AdminOrdersPrint() {
  const { user, loading, isStaff } = useAuth();
  const [params] = useSearchParams();
  const { data: orders, isLoading } = useAdminOrders();
  const settings = useSettings();

  const doc = params.get("doc") || "invoice";
  const ids = (params.get("ids") || "").split(",").filter(Boolean);

  const ready = !isLoading && orders;
  const list = ready ? ids.map((id) => orders.find((o) => o.id === id)).filter(Boolean) : [];

  useEffect(() => {
    if (ready && list.length > 0) {
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [ready, list.length]);

  if (loading) return null;
  if (!user || !isStaff) return <Navigate to="/admin/login" replace />;
  if (!ready) return <p style={{ padding: 24 }}>กำลังโหลด...</p>;
  if (list.length === 0) return <p style={{ padding: 24 }}>ไม่พบคำสั่งซื้อที่เลือก</p>;

  const shopName = "ร้านหนังสือ แสงดาว";

  return (
    <div className="prt">
      <style>{CSS}</style>

      {/* แถบเครื่องมือ — ไม่พิมพ์ */}
      <div className="prt-bar no-print">
        <span>{DOC_TITLE[doc]} · {list.length} รายการ</span>
        <div>
          <button onClick={() => window.print()} className="prt-btn">พิมพ์</button>
          <button onClick={() => window.close()} className="prt-btn ghost">ปิด</button>
        </div>
      </div>

      {list.map((o) => (
        <div className="sheet" key={o.id}>
          {doc === "picking" && <Picking o={o} shopName={shopName} />}
          {doc === "label" && <Label o={o} shopName={shopName} settings={settings} />}
          {doc === "invoice" && <Invoice o={o} shopName={shopName} settings={settings} />}
        </div>
      ))}
    </div>
  );
}

/* ── ใบจัดเตรียมสินค้า (Picking) ── */
function Picking({ o, shopName }) {
  const totalQty = o.items.reduce((s, it) => s + it.quantity, 0);
  return (
    <>
      <div className="head">
        <div>
          <h1>ใบจัดเตรียมสินค้า</h1>
          <p className="muted">{shopName}</p>
        </div>
        <div className="right">
          <p className="big">{oid(o.id)}</p>
          <p className="muted">{fmtDateFull(o.createdAt)}</p>
        </div>
      </div>

      <div className="row2">
        <div><span className="muted">ลูกค้า</span><p>{o.shipName} · {o.shipPhone}</p></div>
        <div><span className="muted">จัดส่ง</span><p>{o.shippingMethod || "-"}</p></div>
      </div>

      <table className="tbl">
        <thead><tr><th style={{ width: 40 }}>#</th><th>รายการสินค้า</th><th className="c" style={{ width: 90 }}>จำนวน</th><th className="c" style={{ width: 70 }}>เก็บแล้ว</th></tr></thead>
        <tbody>
          {o.items.map((it, i) => (
            <tr key={it.id}>
              <td>{i + 1}</td>
              <td>{it.book.title}{it.variantName && <span className="muted"> ({it.variantName})</span>}</td>
              <td className="c big">× {it.quantity}</td>
              <td className="c">☐</td>
            </tr>
          ))}
        </tbody>
        <tfoot><tr><td colSpan={2} className="r bold">รวมจำนวน</td><td className="c bold">{totalQty}</td><td /></tr></tfoot>
      </table>
      {o.note && <p className="note">📝 หมายเหตุ: {o.note}</p>}
    </>
  );
}

/* ── ใบปะหน้าพัสดุ (Label) ── */
function Label({ o, shopName, settings }) {
  return (
    <div className="label">
      <div className="label-from">
        <span className="muted">ผู้ส่ง / FROM</span>
        <p className="bold">{shopName}</p>
        {settings.contactAddress && <p className="sm">{settings.contactAddress}</p>}
        {settings.contactPhone && <p className="sm">โทร. {settings.contactPhone}</p>}
      </div>
      <div className="label-to">
        <span className="muted">ผู้รับ / TO</span>
        <p className="bold xl">{o.shipName}</p>
        <p className="lg">โทร. {o.shipPhone}</p>
        <p className="addr">{o.shipAddress}</p>
      </div>
      <div className="label-foot">
        <div><span className="muted">คำสั่งซื้อ</span><p className="bold">{oid(o.id)}</p></div>
        <div><span className="muted">ขนส่ง</span><p className="bold">{o.shippingMethod || "-"}</p></div>
        {o.trackingNumber && <div><span className="muted">เลขพัสดุ</span><p className="bold">{o.trackingNumber}</p></div>}
      </div>
    </div>
  );
}

/* ── ใบแจ้งหนี้ / ใบเสร็จ (Invoice) ── */
function Invoice({ o, shopName, settings }) {
  const subtotal = o.items.reduce((s, it) => s + Number(it.price) * it.quantity, 0);
  return (
    <>
      <div className="head">
        <div>
          <h1>{o.needReceipt ? "ใบเสร็จรับเงิน / ใบกำกับภาษีอย่างย่อ" : "ใบแจ้งหนี้"}</h1>
          <p className="bold">{shopName}</p>
          {settings.contactAddress && <p className="muted sm">{settings.contactAddress}</p>}
          {settings.contactPhone && <p className="muted sm">โทร. {settings.contactPhone}</p>}
        </div>
        <div className="right">
          <p className="big">{oid(o.id)}</p>
          <p className="muted">{fmtDateFull(o.createdAt)}</p>
          <p className="muted sm">ชำระโดย: {PAYMENT_LABEL[o.paymentMethod] || o.paymentMethod}</p>
        </div>
      </div>

      <div className="row2">
        <div>
          <span className="muted">ลูกค้า / จัดส่งถึง</span>
          <p className="bold">{o.shipName} · {o.shipPhone}</p>
          <p className="sm">{o.shipAddress}</p>
          {o.email && <p className="sm muted">{o.email}</p>}
        </div>
        {o.needReceipt && (
          <div>
            <span className="muted">ออกใบเสร็จในนาม</span>
            <p className="bold">{o.receiptName}</p>
            {o.receiptTaxId && <p className="sm">เลขผู้เสียภาษี {o.receiptTaxId}</p>}
            <p className="sm">{o.receiptAddress}</p>
          </div>
        )}
      </div>

      <table className="tbl">
        <thead><tr><th style={{ width: 34 }}>#</th><th>รายการ</th><th className="c" style={{ width: 60 }}>จำนวน</th><th className="r" style={{ width: 90 }}>ราคา</th><th className="r" style={{ width: 100 }}>รวม</th></tr></thead>
        <tbody>
          {o.items.map((it, i) => (
            <tr key={it.id}>
              <td>{i + 1}</td>
              <td>{it.book.title}{it.variantName && <span className="muted"> ({it.variantName})</span>}</td>
              <td className="c">{it.quantity}</td>
              <td className="r">{formatPrice(it.price)}</td>
              <td className="r">{formatPrice(Number(it.price) * it.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="sum">
        <Line label="ยอดรวมสินค้า" value={formatPrice(subtotal)} />
        {Number(o.ruleDiscount) > 0 && <Line label={o.ruleName || "ส่วนลดอัตโนมัติ"} value={"−" + formatPrice(o.ruleDiscount)} />}
        {Number(o.discount) > 0 && <Line label={"ส่วนลด" + (o.discountCode ? ` (${o.discountCode})` : "")} value={"−" + formatPrice(o.discount)} />}
        {Number(o.pointsDiscount) > 0 && <Line label={`ใช้ ${o.pointsUsed} แต้ม`} value={"−" + formatPrice(o.pointsDiscount)} />}
        {Number(o.shippingFee) > 0 && <Line label={"ค่าจัดส่ง" + (o.shippingMethod ? ` · ${o.shippingMethod}` : "")} value={formatPrice(o.shippingFee)} />}
        <Line label="ยอดชำระทั้งสิ้น" value={formatPrice(o.total)} total />
      </div>
      {o.note && <p className="note">หมายเหตุ: {o.note}</p>}
    </>
  );
}

function Line({ label, value, total }) {
  return (
    <div className={`sumline${total ? " total" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

const CSS = `
.prt { font-family: 'IBM Plex Sans Thai', sans-serif; color: #1d1d1f; background: #f5f5f7; }
.prt-bar { position: sticky; top: 0; display: flex; align-items: center; justify-content: space-between;
  gap: 12px; padding: 12px 20px; background: #1d1d1f; color: #fff; font-size: 14px; }
.prt-btn { border: 0; border-radius: 999px; padding: 8px 20px; font-size: 13px; font-weight: 600;
  background: #fff; color: #1d1d1f; cursor: pointer; margin-left: 8px; }
.prt-btn.ghost { background: transparent; color: #fff; border: 1px solid rgba(255,255,255,.4); }
.sheet { background: #fff; width: 190mm; min-height: 130mm; margin: 16px auto; padding: 16mm;
  box-shadow: 0 2px 12px rgba(0,0,0,.08); box-sizing: border-box; }
.head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1d1d1f; padding-bottom: 12px; }
.head h1 { font-size: 20px; font-weight: 700; margin: 0 0 4px; }
.head .right { text-align: right; }
.big { font-size: 18px; font-weight: 700; }
.muted { color: #86868b; }
.sm { font-size: 12px; }
.bold { font-weight: 700; }
.row2 { display: flex; gap: 32px; margin: 14px 0; }
.row2 > div { flex: 1; }
.row2 span.muted { font-size: 12px; }
.tbl { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
.tbl th { background: #f5f5f7; text-align: left; padding: 8px 10px; border-bottom: 1px solid #e5e5e7; font-weight: 600; }
.tbl td { padding: 8px 10px; border-bottom: 1px solid #eee; vertical-align: top; }
.tbl .c { text-align: center; }
.tbl .r { text-align: right; }
.tbl tfoot td { border-top: 2px solid #1d1d1f; }
.sum { margin-left: auto; margin-top: 12px; width: 300px; }
.sumline { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
.sumline.total { border-top: 2px solid #1d1d1f; margin-top: 6px; padding-top: 8px; font-size: 16px; font-weight: 700; }
.note { margin-top: 16px; font-size: 12px; color: #555; }
/* label */
.label { border: 2px solid #1d1d1f; padding: 10mm; }
.label-from { border-bottom: 1px dashed #999; padding-bottom: 8px; }
.label-to { padding: 14px 0; border-bottom: 1px dashed #999; }
.label-to .xl { font-size: 24px; }
.label-to .lg { font-size: 16px; }
.label-to .addr { font-size: 16px; margin-top: 4px; line-height: 1.5; }
.label-foot { display: flex; gap: 24px; padding-top: 10px; }
.label-foot span.muted { font-size: 11px; }
@media print {
  .no-print { display: none !important; }
  .prt, body { background: #fff !important; }
  .sheet { box-shadow: none; margin: 0; width: auto; min-height: auto; page-break-after: always; padding: 0; }
  .sheet:last-child { page-break-after: auto; }
}
@page { size: A4; margin: 14mm; }
`;
