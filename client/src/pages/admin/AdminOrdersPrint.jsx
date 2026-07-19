import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
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
// ไปรษณีย์ไทยทุกบริการ → แสดง "ไปรษณีย์ไทย" · อื่นๆ คงชื่อเดิม
const carrierName = (m) => (/ไปรษณีย์|thailand\s*post/i.test(m || "") ? "ไปรษณีย์ไทย" : m || "พัสดุ");

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

  const shopName = "สำนักพิมพ์แสงดาว";

  return (
    <div className="prt">
      <style>{BASE_CSS + (doc === "label" ? LABEL_CSS : A4_CSS)}</style>

      {/* แถบเครื่องมือ — ไม่พิมพ์ */}
      <div className="prt-bar no-print">
        <span>{DOC_TITLE[doc]} · {list.length} รายการ</span>
        <div>
          <button onClick={() => window.print()} className="prt-btn">พิมพ์</button>
          <button onClick={() => window.close()} className="prt-btn ghost">ปิด</button>
        </div>
      </div>

      {list.map((o) => (
        <div className={doc === "label" ? "sheet label-sheet" : "sheet"} key={o.id}>
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

/* ── ใบปะหน้าพัสดุ (Label) — สติ๊กเกอร์ 100×150mm ── */
function Label({ o, shopName, settings }) {
  const logo = settings.logoUrl;
  const qr = settings.lineQrUrl;
  return (
    <div className="lbl">
      {/* แถบขนส่ง */}
      <div className="lbl-carrier">
        <span className="lbl-carrier-name">{carrierName(o.shippingMethod)}</span>
      </div>

      {/* บาร์โค้ดเลขออเดอร์ */}
      <div className="lbl-barcode">
        <Barcode value={o.id.slice(0, 8).toUpperCase()} />
      </div>

      {/* ผู้ส่ง */}
      <div className="lbl-from">
        <span className="lbl-tag">ผู้ส่ง · FROM</span>
        <div className="lbl-from-name">{shopName}</div>
        <div className="lbl-from-body">
          {settings.contactAddress}
          {settings.contactPhone ? `${settings.contactAddress ? " · " : ""}โทร. ${settings.contactPhone}` : ""}
        </div>
      </div>

      {/* ผู้รับ */}
      <div className="lbl-to">
        <span className="lbl-tag">ผู้รับ · TO</span>
        <div className="lbl-name">{o.shipName}</div>
        <div className="lbl-phone">โทร. {o.shipPhone}</div>
        <div className="lbl-addr">{o.shipAddress}</div>
      </div>

      {/* ล่าง: โลโก้ / QR LINE + ระวังแตก */}
      <div className="lbl-foot">
        <div className="lbl-brand">
          {logo && <img className="lbl-logo" src={logo} alt="" />}
          {qr && (
            <div className="lbl-qr">
              <img src={qr} alt="LINE QR" />
              <span>เพิ่มเพื่อน LINE</span>
            </div>
          )}
        </div>
        <div className="lbl-fragile">
          <div className="lbl-fragile-big">⚠ ระวังแตก</div>
          <div className="lbl-fragile-sm">สินค้าหนังสือ · ห้ามพับ / โยน / โดนน้ำ</div>
        </div>
      </div>
    </div>
  );
}

/* บาร์โค้ด Code128 ของเลขออเดอร์ */
function Barcode({ value }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    try {
      JsBarcode(ref.current, value, { format: "CODE128", displayValue: true, fontSize: 15, height: 42, width: 1.7, margin: 0, fontOptions: "bold" });
    } catch {
      /* ค่าไม่รองรับ */
    }
  }, [value]);
  return <svg ref={ref} className="lbl-barcode-svg" />;
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

// สไตล์ที่ใช้ร่วมทุกเอกสาร (แถบเครื่องมือ + เนื้อหา invoice/picking + ดีไซน์ label)
const BASE_CSS = `
.prt { font-family: 'IBM Plex Sans Thai', sans-serif; color: #1d1d1f; background: #e9e9ec; }
.prt-bar { position: sticky; top: 0; z-index: 5; display: flex; align-items: center; justify-content: space-between;
  gap: 12px; padding: 12px 20px; background: #1d1d1f; color: #fff; font-size: 14px; }
.prt-btn { border: 0; border-radius: 999px; padding: 8px 20px; font-size: 13px; font-weight: 600;
  background: #fff; color: #1d1d1f; cursor: pointer; margin-left: 8px; }
.prt-btn.ghost { background: transparent; color: #fff; border: 1px solid rgba(255,255,255,.4); }
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

/* ── ใบปะหน้าพัสดุ (100×150mm) ── */
.lbl { width: 100%; height: 100%; box-sizing: border-box; display: flex; flex-direction: column;
  border: 0.6mm solid #1d1d1f; overflow: hidden; }
.lbl-carrier { display: flex; align-items: center; justify-content: space-between; gap: 3mm;
  background: #1d1d1f; color: #fff; padding: 2.5mm 4mm; }
.lbl-carrier-name { flex: 1; min-width: 0; font-size: 15pt; font-weight: 800; line-height: 1.1;
  text-transform: uppercase; letter-spacing: .2px; word-break: break-word; }
.lbl-carrier-id { font-size: 11pt; font-weight: 700; white-space: nowrap; }
/* บาร์โค้ดเลขออเดอร์ */
.lbl-barcode { display: flex; justify-content: center; padding: 2mm 4mm 1.5mm; border-bottom: 0.4mm solid #ddd; }
.lbl-barcode-svg { width: auto; max-width: 100%; height: 15mm; }
/* แท็ก ผู้ส่ง/ผู้รับ — ชิปดำ ขนาด+ความยาวเท่ากัน (ไม่ยืดในกล่อง flex) */
.lbl-tag { display: inline-block; align-self: flex-start; box-sizing: border-box; width: 30mm; text-align: center;
  background: #1d1d1f; color: #fff; font-size: 8.5pt; font-weight: 800; letter-spacing: .5px;
  padding: 1.2mm 3mm; border-radius: 1.2mm; margin-bottom: 2mm; }
.lbl-from { padding: 3mm 4mm; border-bottom: 0.4mm dashed #999; }
.lbl-from-name { font-size: 13pt; font-weight: 800; line-height: 1.2; }
.lbl-from-body { font-size: 10pt; line-height: 1.4; color: #222; margin-top: 0.8mm; }
.lbl-to { flex: 1; padding: 4mm; border-bottom: 0.6mm solid #1d1d1f; display: flex; flex-direction: column; }
.lbl-name { font-size: 21pt; font-weight: 800; line-height: 1.15; }
.lbl-phone { font-size: 13.5pt; font-weight: 700; margin-top: 1.5mm; }
.lbl-addr { font-size: 12.5pt; line-height: 1.5; margin-top: 2.5mm; }
/* ล่าง: โลโก้ / QR + ระวังแตก */
.lbl-foot { display: flex; align-items: center; justify-content: space-between; gap: 3mm; padding: 3mm 4mm; min-height: 24mm; }
.lbl-brand { display: flex; align-items: center; gap: 3mm; }
.lbl-logo { max-height: 20mm; max-width: 40mm; object-fit: contain; }
.lbl-qr { display: flex; flex-direction: column; align-items: center; }
.lbl-qr img { width: 18mm; height: 18mm; object-fit: contain; }
.lbl-qr span { font-size: 6.5pt; font-weight: 600; margin-top: 0.5mm; }
.lbl-fragile { text-align: center; margin-left: auto; }
.lbl-fragile-big { font-size: 15pt; font-weight: 800; color: #c0271e; line-height: 1.1; }
.lbl-fragile-sm { font-size: 8pt; font-weight: 600; color: #333; margin-top: 0.5mm; }

@media print {
  .no-print { display: none !important; }
  .prt, body { background: #fff !important; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;

// A4 — ใบจัดเตรียมสินค้า / ใบแจ้งหนี้
const A4_CSS = `
.sheet { background: #fff; width: 190mm; min-height: 130mm; margin: 16px auto; padding: 16mm;
  box-shadow: 0 2px 12px rgba(0,0,0,.08); box-sizing: border-box; }
@media print {
  .sheet { box-shadow: none; margin: 0; width: auto; min-height: auto; page-break-after: always; padding: 0; }
  .sheet:last-child { page-break-after: auto; }
}
@page { size: A4; margin: 14mm; }
`;

// สติ๊กเกอร์ 100×150mm — ใบปะหน้าพัสดุ
const LABEL_CSS = `
.label-sheet { background: #fff; width: 100mm; height: 150mm; margin: 12px auto; padding: 0;
  box-shadow: 0 2px 12px rgba(0,0,0,.18); box-sizing: border-box; }
@media print {
  .label-sheet { box-shadow: none; margin: 0; page-break-after: always; }
  .label-sheet:last-child { page-break-after: auto; }
}
@page { size: 100mm 150mm; margin: 0; }
`;
