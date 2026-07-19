import { useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { useAdminOrders, useUpdateOrder } from "../../api/admin";
import { formatPrice } from "../../lib/format";
import { fmtDate, PAYMENT_LABEL, PAY_BADGE, PAY_TH, ORDER_BADGE, ORDER_TH, Badge } from "./orderUi";

// แท็บกรอง — predicate ต่อ order
const FILTERS = [
  { key: "all", label: "ทั้งหมด", match: () => true },
  { key: "review", label: "รอตรวจสลิป", match: (o) => o.paymentStatus === "PENDING_REVIEW" },
  { key: "unpaid", label: "ยังไม่ชำระ", match: (o) => o.paymentStatus === "UNPAID" && o.status !== "CANCELLED" },
  { key: "processing", label: "กำลังดำเนินการ", match: (o) => o.paymentStatus === "PAID" && o.status === "PAID" },
  { key: "shipped", label: "จัดส่งแล้ว", match: (o) => o.status === "SHIPPED" },
  { key: "completed", label: "สำเร็จ", match: (o) => o.status === "COMPLETED" },
  { key: "cancelled", label: "ยกเลิก", match: (o) => o.status === "CANCELLED" },
];

const PAGE_SIZES = [20, 50, 100];

// เอกสารที่พิมพ์ได้
export const PRINT_DOCS = [
  ["picking", "ใบจัดเตรียมสินค้า"],
  ["label", "ใบปะหน้าพัสดุ (label)"],
  ["invoice", "ใบแจ้งหนี้ / ใบเสร็จ"],
];
export const openPrint = (doc, ids) =>
  window.open(`/admin/print/orders?doc=${doc}&ids=${ids.join(",")}`, "_blank", "noopener");

// คอลัมน์: ☐ / # / วันที่ / คำสั่งซื้อ / ลูกค้า / ช่องทาง / มูลค่า / การชำระเงิน / สถานะ / เมนู
const COLS = "grid grid-cols-[32px_36px_130px_120px_minmax(140px,1fr)_90px_100px_110px_120px_40px] items-center gap-3";

export default function AdminOrders() {
  const { data: orders, isLoading } = useAdminOrders();
  const [filter, setFilter] = useState("all");
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(() => new Set());

  const toggle = (id) => setSelected((s) => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const counts = useMemo(() => {
    const c = {};
    for (const f of FILTERS) c[f.key] = (orders || []).filter(f.match).length;
    return c;
  }, [orders]);

  if (isLoading) return <p className="text-sub">กำลังโหลด...</p>;
  if (!orders?.length) return <p className="py-12 text-center text-sub">ยังไม่มีคำสั่งซื้อ</p>;

  const list = orders.filter(FILTERS.find((f) => f.key === filter).match);
  const pageCount = Math.max(1, Math.ceil(list.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageItems = list.slice((safePage - 1) * pageSize, safePage * pageSize);
  const from = list.length ? (safePage - 1) * pageSize + 1 : 0;
  const to = Math.min(safePage * pageSize, list.length);

  const allChecked = pageItems.length > 0 && pageItems.every((o) => selected.has(o.id));
  const toggleAll = () => setSelected((s) => {
    const n = new Set(s);
    if (allChecked) pageItems.forEach((o) => n.delete(o.id));
    else pageItems.forEach((o) => n.add(o.id));
    return n;
  });

  return (
    <div>
      {/* แท็บกรอง */}
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key); setPage(1); }}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-[13px] transition ${
              filter === f.key ? "bg-ink text-white" : "bg-mist text-ink/70 hover:bg-line"
            }`}
          >
            {f.label}
            <span className={`rounded-full px-1.5 text-[11px] ${filter === f.key ? "bg-white/20" : "bg-white text-sub"}`}>
              {counts[f.key]}
            </span>
          </button>
        ))}
      </div>

      {/* แถบเลือกหลายรายการ + พิมพ์ */}
      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink/15 bg-ink/[0.03] px-4 py-2.5">
          <span className="text-[13px] font-medium text-ink">เลือก {selected.size} รายการ</span>
          <div className="flex items-center gap-2">
            <PrintMenu ids={[...selected]} />
            <button onClick={() => setSelected(new Set())} className="text-[13px] text-sub hover:text-ink">ล้างการเลือก</button>
          </div>
        </div>
      )}

      {list.length === 0 ? (
        <p className="py-12 text-center text-sub">ไม่มีคำสั่งซื้อในหมวดนี้</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-line bg-white">
            <div className="min-w-[940px]">
              {/* หัวตาราง */}
              <div className={`${COLS} border-b border-line px-4 py-3 text-[12px] font-medium text-sub`}>
                <input type="checkbox" checked={allChecked} onChange={toggleAll} className="h-4 w-4 accent-ink" aria-label="เลือกทั้งหมด" />
                <span>#</span>
                <span>วันที่</span>
                <span>คำสั่งซื้อ</span>
                <span>ลูกค้า</span>
                <span>ช่องทาง</span>
                <span className="text-right">มูลค่า</span>
                <span>การชำระเงิน</span>
                <span>สถานะ</span>
                <span />
              </div>
              {/* แถวข้อมูล */}
              {pageItems.map((o, i) => (
                <div key={o.id} className={`${COLS} border-b border-line px-4 py-3 text-[13px] transition last:border-0 hover:bg-mist/40 ${selected.has(o.id) ? "bg-accent/[0.04]" : ""}`}>
                  <input type="checkbox" checked={selected.has(o.id)} onChange={() => toggle(o.id)} className="h-4 w-4 accent-ink" aria-label="เลือก" />
                  <span className="text-sub">{from + i}</span>
                  <span className="text-[12px] text-sub">{fmtDate(o.createdAt)}</span>
                  <Link to={`/admin/orders/${o.id}`} className="truncate font-medium text-accent hover:underline">
                    #{o.id.slice(0, 8).toUpperCase()}
                  </Link>
                  <span className="truncate text-ink">{o.user?.name || o.user?.email}</span>
                  <span className="text-sub">{PAYMENT_LABEL[o.paymentMethod]}</span>
                  <span className="text-right font-semibold text-ink">{formatPrice(o.total)}</span>
                  <span><Badge cls={PAY_BADGE[o.paymentStatus]}>{PAY_TH[o.paymentStatus]}</Badge></span>
                  <span><Badge cls={ORDER_BADGE[o.status]}>{ORDER_TH[o.status]}</Badge></span>
                  <RowMenu order={o} />
                </div>
              ))}
            </div>
          </div>

          {pageCount > 1 && <Pager page={safePage} totalPages={pageCount} onChange={setPage} />}

          {/* แถบควบคุม: จำนวนผลลัพธ์ + เลือกจำนวนต่อหน้า */}
          <div className="mt-4 flex items-center justify-between gap-3 px-1 text-[12px] text-sub">
            <span>แสดง {from}–{to} จาก {list.length}</span>
            <label className="flex items-center gap-2">
              <span>ต่อหน้า</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="rounded-lg border border-line bg-white px-2 py-1 text-[12px] text-ink outline-none focus:border-ink/30"
              >
                {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          </div>
        </>
      )}
    </div>
  );
}

// เมนู 3 จุดท้ายแถว
const MENU_ITEM = "block w-full px-4 py-2 text-left text-[13px] text-ink transition hover:bg-mist";
function RowMenu({ order }) {
  const [pos, setPos] = useState(null); // {top,left} หรือ null (ปิด)
  const btnRef = useRef(null);
  const update = useUpdateOrder();
  const id = order.id;

  const open = () => {
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: Math.max(8, r.right - 224) });
  };
  const close = () => setPos(null);
  const print = (doc) => { openPrint(doc, [id]); close(); };
  const cancel = () => {
    close();
    if (confirm(`ยกเลิกคำสั่งซื้อ #${id.slice(0, 8).toUpperCase()} ?`)) update.mutate({ id, status: "CANCELLED" });
  };

  return (
    <div className="flex justify-center">
      <button ref={btnRef} onClick={() => (pos ? close() : open())} aria-label="เมนู" className="rounded-lg p-1.5 text-sub transition hover:bg-mist hover:text-ink">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="19" r="1.6" /></svg>
      </button>
      {pos && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={close} />
          <div className="fixed z-50 w-56 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-xl" style={{ top: pos.top, left: pos.left }}>
            <Link to={`/admin/orders/${id}`} onClick={close} className={MENU_ITEM}>ดูรายละเอียด</Link>
            <Link to={`/admin/orders/${id}?edit=1`} onClick={close} className={MENU_ITEM}>แก้ไข</Link>
            <div className="my-1 border-t border-line" />
            <button onClick={() => print("picking")} className={MENU_ITEM}>พิมพ์ ใบจัดเตรียมสินค้า</button>
            <button onClick={() => print("label")} className={MENU_ITEM}>พิมพ์ ใบปะหน้าพัสดุ (label)</button>
            <button onClick={() => print("invoice")} className={MENU_ITEM}>พิมพ์ ใบสั่งซื้อ</button>
            {order.status !== "CANCELLED" && (
              <>
                <div className="my-1 border-t border-line" />
                <button onClick={cancel} className="block w-full px-4 py-2 text-left text-[13px] text-red-600 transition hover:bg-red-50">ยกเลิกรายการ</button>
              </>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

// ปุ่มพิมพ์ + เลือกชนิดเอกสาร (ใช้ทั้งลิสต์และหน้ารายละเอียด)
export function PrintMenu({ ids, label = "พิมพ์" }) {
  const [open, setOpen] = useState(false);
  if (!ids.length) return null;
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-1.5 text-[13px] font-medium text-white transition hover:bg-ink/90">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 9V3h12v6M6 18H4v-6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6h-2M6 14h12v6H6z" strokeLinecap="round" strokeLinejoin="round" /></svg>
        {label} ▾
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-20 w-52 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-lg">
            {PRINT_DOCS.map(([doc, name]) => (
              <button key={doc} onClick={() => { openPrint(doc, ids); setOpen(false); }} className="block w-full px-4 py-2 text-left text-[13px] text-ink transition hover:bg-mist">
                {name}
              </button>
            ))}
          </div>
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
