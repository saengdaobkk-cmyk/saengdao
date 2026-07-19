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

      {doc === "picking" ? (
        <div className="sheet"><PickingCombined list={list} shopName={shopName} /></div>
      ) : (
        list.map((o) => (
          <div className={doc === "label" ? "sheet label-sheet" : "sheet"} key={o.id}>
            {doc === "label" && <Label o={o} shopName={shopName} settings={settings} />}
            {doc === "invoice" && <Invoice o={o} shopName={shopName} settings={settings} />}
          </div>
        ))
      )}
    </div>
  );
}

/* ── ใบจัดเตรียมสินค้า (Picking) — รวมทุกออเดอร์เป็นรายการเดียว ── */
function PickingCombined({ list, shopName }) {
  // รวมจำนวนตามสินค้า (bookId + variant)
  const map = new Map();
  for (const o of list) {
    for (const it of o.items) {
      const key = `${it.bookId}|${it.variantId || ""}`;
      const code = it.book.isbn || it.book.sku || "-";
      const name = it.book.title + (it.variantName ? ` (${it.variantName})` : "");
      const cur = map.get(key) || { code, name, qty: 0 };
      cur.qty += it.quantity;
      map.set(key, cur);
    }
  }
  const rows = [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "th"));
  const totalQty = rows.reduce((s, r) => s + r.qty, 0);

  return (
    <>
      <div className="head">
        <div>
          <h1>ใบจัดเตรียมสินค้า</h1>
          <p className="muted">{shopName}</p>
        </div>
        <div className="right">
          <p className="muted">{fmtDateFull(new Date())}</p>
          <p className="muted">{list.length} ออเดอร์ · {rows.length} รายการ</p>
        </div>
      </div>

      <table className="tbl">
        <thead>
          <tr>
            <th style={{ width: 36 }}>#</th>
            <th style={{ width: 120 }}>รหัสสินค้า</th>
            <th>รายการสินค้า</th>
            <th className="c" style={{ width: 80 }}>จำนวน</th>
            <th className="c" style={{ width: 70 }}>จัดแล้ว</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{r.code}</td>
              <td>{r.name}</td>
              <td className="c big">× {r.qty}</td>
              <td className="c">☐</td>
            </tr>
          ))}
        </tbody>
        <tfoot><tr><td colSpan={3} className="r bold">รวมจำนวน</td><td className="c bold">{totalQty}</td><td /></tr></tfoot>
      </table>
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
const ORDER_STATUS_TH = { PENDING: "รอดำเนินการ", PAID: "กำลังดำเนินการ", SHIPPED: "จัดส่งแล้ว", COMPLETED: "สำเร็จ", CANCELLED: "ยกเลิก" };

function Invoice({ o, shopName, settings }) {
  const subtotal = o.items.reduce((s, it) => s + Number(it.price) * it.quantity, 0);
  const code = (it) => it.book.isbn || it.book.sku || "-";
  return (
    <div className="inv">
      {/* หัวกระดาษ */}
      <div className="inv-top">
        <div className="inv-brand">
          {settings.logoUrl && <img className="inv-logo" src={settings.logoUrl} alt="" />}
          <div>
            <div className="inv-shop">{shopName}</div>
            {settings.contactAddress && <div className="inv-shop-sub">{settings.contactAddress}</div>}
            <div className="inv-shop-sub">
              {settings.contactPhone && `โทร. ${settings.contactPhone}`}
              {settings.contactEmail && `${settings.contactPhone ? " · " : ""}${settings.contactEmail}`}
            </div>
          </div>
        </div>
        <div className="inv-title-box">
          <div className="inv-title">ใบสั่งซื้อ</div>
          <table className="inv-meta">
            <tbody>
              <tr><td>เลขที่</td><td>{oid(o.id)}</td></tr>
              <tr><td>วันที่</td><td>{fmtDateFull(o.createdAt)}</td></tr>
              <tr><td>ชำระโดย</td><td>{PAYMENT_LABEL[o.paymentMethod] || o.paymentMethod}</td></tr>
              <tr><td>สถานะ</td><td>{ORDER_STATUS_TH[o.status] || o.status}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ผู้ขาย / ลูกค้า */}
      <div className="inv-parties">
        <div className="inv-box">
          <div className="inv-box-h">จัดส่งถึง (ลูกค้า)</div>
          <div className="inv-box-b">
            <b>{o.shipName}</b> · {o.shipPhone}
            <div>{o.shipAddress}</div>
            {o.email && <div className="muted">{o.email}</div>}
          </div>
        </div>
        <div className="inv-box">
          <div className="inv-box-h">รายละเอียด</div>
          <div className="inv-box-b">
            <div>วิธีจัดส่ง: <b>{o.shippingMethod || "-"}</b></div>
            {o.needReceipt ? (
              <>
                <div className="inv-hr" />
                <div className="muted">ออกใบกำกับภาษีในนาม</div>
                <b>{o.receiptName}</b>
                {o.receiptTaxId && <div>เลขผู้เสียภาษี {o.receiptTaxId}</div>}
                <div>{o.receiptAddress}</div>
              </>
            ) : (
              o.note && <div className="muted">หมายเหตุ: {o.note}</div>
            )}
          </div>
        </div>
      </div>

      {/* ตารางสินค้า */}
      <table className="inv-tbl">
        <thead>
          <tr>
            <th style={{ width: 32 }}>#</th>
            <th style={{ width: 110 }}>รหัสสินค้า</th>
            <th>รายการ</th>
            <th className="c" style={{ width: 54 }}>จำนวน</th>
            <th className="r" style={{ width: 92 }}>ราคา/หน่วย</th>
            <th className="r" style={{ width: 100 }}>รวม</th>
          </tr>
        </thead>
        <tbody>
          {o.items.map((it, i) => (
            <tr key={it.id}>
              <td>{i + 1}</td>
              <td>{code(it)}</td>
              <td>{it.book.title}{it.variantName && <span className="muted"> ({it.variantName})</span>}</td>
              <td className="c">{it.quantity}</td>
              <td className="r">{formatPrice(it.price)}</td>
              <td className="r">{formatPrice(Number(it.price) * it.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* สรุปยอด */}
      <div className="inv-bottom">
        <div className="inv-note">
          {o.needReceipt && o.note && <div>หมายเหตุ: {o.note}</div>}
          <div className="inv-thanks">ขอบคุณที่อุดหนุน {shopName} 🙏</div>
        </div>
        <div className="inv-sum">
          <div className="inv-sumline"><span>ยอดรวมสินค้า</span><span>{formatPrice(subtotal)}</span></div>
          {Number(o.ruleDiscount) > 0 && <div className="inv-sumline"><span>{o.ruleName || "ส่วนลดอัตโนมัติ"}</span><span>−{formatPrice(o.ruleDiscount)}</span></div>}
          {Number(o.discount) > 0 && <div className="inv-sumline"><span>ส่วนลด{o.discountCode ? ` (${o.discountCode})` : ""}</span><span>−{formatPrice(o.discount)}</span></div>}
          {Number(o.pointsDiscount) > 0 && <div className="inv-sumline"><span>ใช้ {o.pointsUsed} แต้ม</span><span>−{formatPrice(o.pointsDiscount)}</span></div>}
          {Number(o.shippingFee) > 0 && <div className="inv-sumline"><span>ค่าจัดส่ง</span><span>{formatPrice(o.shippingFee)}</span></div>}
          <div className="inv-sum-total"><span>ยอดชำระทั้งสิ้น</span><span>{formatPrice(o.total)}</span></div>
        </div>
      </div>

      {/* ลายเซ็น */}
      <div className="inv-sign">
        <div><div className="inv-sign-line" />ผู้จัดเตรียมสินค้า</div>
        <div><div className="inv-sign-line" />ผู้รับสินค้า / วันที่</div>
      </div>
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

/* ── ใบสั่งซื้อ (Invoice) — ฟอร์มเต็ม ── */
.inv { color: #1d1d1f; font-size: 13px; }
.inv-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; border-bottom: 3px solid #1d1d1f; padding-bottom: 14px; }
.inv-brand { display: flex; gap: 12px; align-items: flex-start; }
.inv-logo { max-height: 54px; max-width: 130px; object-fit: contain; }
.inv-shop { font-size: 20px; font-weight: 800; line-height: 1.2; }
.inv-shop-sub { font-size: 11px; color: #666; margin-top: 2px; line-height: 1.45; }
.inv-title-box { text-align: right; min-width: 210px; }
.inv-title { font-size: 24px; font-weight: 800; letter-spacing: 1px; margin-bottom: 8px; }
.inv-meta { margin-left: auto; border-collapse: collapse; font-size: 12px; }
.inv-meta td { padding: 1.5px 0 1.5px 12px; }
.inv-meta td:first-child { color: #999; text-align: right; }
.inv-meta td:last-child { font-weight: 600; }
.inv-parties { display: flex; gap: 14px; margin: 16px 0; }
.inv-box { flex: 1; border: 1px solid #d8d8dd; border-radius: 8px; overflow: hidden; }
.inv-box-h { background: #f5f5f7; padding: 6px 12px; font-size: 11px; font-weight: 700; color: #555; letter-spacing: .5px; border-bottom: 1px solid #e5e5e7; }
.inv-box-b { padding: 10px 12px; font-size: 12.5px; line-height: 1.55; }
.inv-hr { border-top: 1px dashed #ccc; margin: 6px 0; }
.inv-tbl { width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 12.5px; }
.inv-tbl th { background: #1d1d1f; color: #fff; text-align: left; padding: 8px 10px; font-weight: 600; font-size: 12px; }
.inv-tbl th.c, .inv-tbl td.c { text-align: center; }
.inv-tbl th.r, .inv-tbl td.r { text-align: right; }
.inv-tbl td { padding: 8px 10px; border-bottom: 1px solid #eee; }
.inv-tbl tbody tr:nth-child(even) { background: #fafafa; }
.inv-bottom { display: flex; justify-content: space-between; gap: 24px; margin-top: 16px; }
.inv-note { flex: 1; font-size: 12px; color: #555; }
.inv-thanks { margin-top: 10px; font-size: 13px; font-weight: 700; color: #1d1d1f; }
.inv-sum { width: 270px; }
.inv-sumline { display: flex; justify-content: space-between; padding: 4px 2px; font-size: 13px; }
.inv-sum-total { display: flex; justify-content: space-between; margin-top: 8px; padding: 11px 14px; border-radius: 8px; background: #1d1d1f; color: #fff; font-size: 16px; font-weight: 800; }
.inv-sign { display: flex; justify-content: space-between; gap: 48px; margin-top: 44px; }
.inv-sign > div { flex: 1; text-align: center; font-size: 12px; color: #555; }
.inv-sign-line { border-top: 1px solid #999; margin: 0 16px 6px; }

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
