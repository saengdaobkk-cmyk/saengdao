import { useMemo, useState, useEffect } from "react";
import { formatPrice } from "../../lib/format";
import {
  useAdminCustomers, useSaveCustomer, useDeleteCustomer,
  useCustomerTags, useCustomerDetail, useAddNote, useToggleNote, useDeleteNote, useAdjustPoints,
} from "../../api/admin";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" }) : "—");
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");

const STATUS = {
  PENDING: ["รอชำระ", "bg-amber-100 text-amber-700"],
  PAID: ["ชำระแล้ว", "bg-blue-100 text-blue-700"],
  SHIPPED: ["จัดส่งแล้ว", "bg-indigo-100 text-indigo-700"],
  COMPLETED: ["สำเร็จ", "bg-emerald-100 text-emerald-700"],
  CANCELLED: ["ยกเลิก", "bg-rose-100 text-rose-600"],
};

export default function AdminCustomers() {
  const { data: customers, isLoading } = useAdminCustomers();
  const { data: allTags = [] } = useCustomerTags();
  const del = useDeleteCustomer();

  const [q, setQ] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [openId, setOpenId] = useState(null);

  const list = useMemo(() => {
    let arr = customers || [];
    if (tagFilter) arr = arr.filter((c) => (c.tags || []).includes(tagFilter));
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      arr = arr.filter((c) => [c.name, c.email, c.phone].some((x) => x?.toLowerCase().includes(s)));
    }
    return arr;
  }, [customers, q, tagFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-sub">ลูกค้าทั้งหมด {customers && `(${customers.length})`}</p>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาชื่อ/อีเมล/เบอร์..."
          className="w-64 rounded-lg border border-line px-3 py-2 text-[13px] outline-none focus:border-ink/30" />
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setTagFilter("")}
            className={`rounded-full border px-3 py-1 text-[12px] transition ${!tagFilter ? "border-ink bg-ink text-white" : "border-line text-sub hover:border-ink/25"}`}>ทั้งหมด</button>
          {allTags.map((t) => (
            <button key={t} onClick={() => setTagFilter(tagFilter === t ? "" : t)}
              className={`rounded-full border px-3 py-1 text-[12px] transition ${tagFilter === t ? "border-accent bg-accent/10 text-accent" : "border-line text-sub hover:border-ink/25"}`}>{t}</button>
          ))}
        </div>
      )}

      <div className="w-full overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-left text-[14px]">
          <thead className="border-b border-line bg-mist/40 text-[12px] text-sub">
            <tr>
              <th className="px-5 py-3 font-medium">ลูกค้า</th>
              <th className="px-5 py-3 font-medium">แท็ก</th>
              <th className="px-5 py-3 text-right font-medium">ยอดซื้อ</th>
              <th className="px-5 py-3 text-right font-medium">แต้ม</th>
              <th className="px-5 py-3 text-right font-medium">ออเดอร์</th>
              <th className="px-5 py-3 text-right font-medium">ล่าสุด</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {isLoading && <tr><td colSpan={6} className="px-5 py-4 text-sub">กำลังโหลด...</td></tr>}
            {list.map((c) => (
              <tr key={c.id} onClick={() => setOpenId(c.id)} className="cursor-pointer hover:bg-mist/40">
                <td className="px-5 py-3">
                  <p className="font-medium text-ink">{c.name || "—"}</p>
                  <p className="text-[12px] text-sub">{c.email}</p>
                </td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(c.tags || []).slice(0, 3).map((t) => (
                      <span key={t} className="rounded-full bg-mist px-2 py-0.5 text-[11px] text-sub">{t}</span>
                    ))}
                    {(c.tags?.length || 0) > 3 && <span className="text-[11px] text-sub">+{c.tags.length - 3}</span>}
                  </div>
                </td>
                <td className="px-5 py-3 text-right font-medium text-ink">{formatPrice(c.totalSpent || 0)}</td>
                <td className="px-5 py-3 text-right text-ink">{c.points || 0}</td>
                <td className="px-5 py-3 text-right text-sub">{c.orderCount || 0}</td>
                <td className="px-5 py-3 text-right text-[12px] text-sub">{fmtDate(c.lastOrderAt)}</td>
              </tr>
            ))}
            {!isLoading && list.length === 0 && <tr><td colSpan={6} className="px-5 py-4 text-sub">{q || tagFilter ? "ไม่พบลูกค้า" : "ยังไม่มีลูกค้า"}</td></tr>}
          </tbody>
        </table>
      </div>

      {openId && <CustomerDrawer id={openId} onClose={() => setOpenId(null)} onDelete={del} />}
    </div>
  );
}

/* ─────────── Customer 360° Drawer ─────────── */
function CustomerDrawer({ id, onClose }) {
  const { data: c, isLoading } = useCustomerDetail(id);
  const [tab, setTab] = useState("info");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  const TABS = [
    ["info", "ข้อมูล"],
    ["points", "แต้มสะสม"],
    ["notes", "โน้ต & ติดตาม"],
    ["orders", `ออเดอร์${c ? ` (${c.orders.length})` : ""}`],
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div onClick={onClose} className="absolute inset-0 bg-ink/40 backdrop-blur-sm" />
      <div className="relative flex h-full w-full max-w-xl flex-col bg-mist shadow-2xl">
        {isLoading || !c ? (
          <div className="flex h-full items-center justify-center text-sub">กำลังโหลด...</div>
        ) : (
          <>
            {/* header */}
            <div className="flex items-start gap-3 border-b border-line bg-white px-6 py-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink text-[18px] font-semibold text-white">
                {(c.name || c.email)[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[17px] font-semibold text-ink">{c.name || "ไม่ระบุชื่อ"}</p>
                <p className="truncate text-[13px] text-sub">{c.email}{c.phone ? ` · ${c.phone}` : ""}</p>
              </div>
              <div className="shrink-0 rounded-xl bg-accent/10 px-3 py-1.5 text-center">
                <p className="text-[16px] font-bold text-accent">{c.points}</p>
                <p className="text-[10px] text-accent/80">แต้ม</p>
              </div>
              <button onClick={onClose} className="shrink-0 rounded-lg p-1.5 text-sub hover:bg-mist hover:text-ink">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" /></svg>
              </button>
            </div>

            {/* tags */}
            <div className="border-b border-line bg-white px-6 pb-4">
              <TagsEditor id={c.id} tags={c.tags} />
            </div>

            {/* stats */}
            <div className="grid grid-cols-4 gap-px border-b border-line bg-line text-center">
              <Stat label="ยอดซื้อรวม" value={formatPrice(c.stats.totalSpent)} />
              <Stat label="ออเดอร์" value={c.stats.paidCount} />
              <Stat label="เฉลี่ย/ครั้ง" value={formatPrice(c.stats.avgOrder)} />
              <Stat label="ลูกค้าตั้งแต่" value={fmtDate(c.stats.firstOrderAt || c.createdAt)} />
            </div>

            {/* tabs */}
            <div className="flex gap-1 border-b border-line bg-white px-4">
              {TABS.map(([k, label]) => (
                <button key={k} onClick={() => setTab(k)}
                  className={`border-b-2 px-3 py-3 text-[13px] font-medium transition ${tab === k ? "border-ink text-ink" : "border-transparent text-sub hover:text-ink"}`}>{label}</button>
              ))}
            </div>

            {/* body */}
            <div className="flex-1 overflow-y-auto p-6">
              {tab === "info" && <InfoTab c={c} onClose={onClose} />}
              {tab === "points" && <PointsTab c={c} />}
              {tab === "notes" && <NotesTab c={c} />}
              {tab === "orders" && <OrdersTab c={c} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-white py-3">
      <p className="text-[15px] font-semibold text-ink">{value}</p>
      <p className="text-[11px] text-sub">{label}</p>
    </div>
  );
}

/* ---- tags ---- */
function TagsEditor({ id, tags }) {
  const save = useSaveCustomer();
  const { data: allTags = [] } = useCustomerTags();
  const [input, setInput] = useState("");
  const commit = (next) => save.mutate({ id, tags: next });
  const add = (t) => {
    const v = t.trim();
    if (v && !tags.includes(v)) commit([...tags, v]);
    setInput("");
  };
  const remove = (t) => commit(tags.filter((x) => x !== t));
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-full bg-accent/10 py-1 pl-3 pr-1.5 text-[12px] text-accent">
          {t}
          <button onClick={() => remove(t)} className="rounded-full p-0.5 hover:bg-accent/20">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" /></svg>
          </button>
        </span>
      ))}
      <input
        list="tag-suggestions" value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add(input))}
        onBlur={() => input && add(input)}
        placeholder="+ เพิ่มแท็ก"
        className="w-28 rounded-full border border-dashed border-line px-3 py-1 text-[12px] outline-none focus:border-ink/30"
      />
      <datalist id="tag-suggestions">{allTags.map((t) => <option key={t} value={t} />)}</datalist>
    </div>
  );
}

/* ---- info tab ---- */
function InfoTab({ c, onClose }) {
  const save = useSaveCustomer();
  const del = useDeleteCustomer();
  const [form, setForm] = useState({
    name: c.name || "", email: c.email || "", phone: c.phone || "", address: c.address || "",
    receiptName: c.receiptName || "", receiptTaxId: c.receiptTaxId || "", receiptAddress: c.receiptAddress || "",
  });
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = (e) => {
    e.preventDefault();
    setError("");
    save.mutate({ id: c.id, ...form }, { onError: (err) => setError(err.response?.data?.error || "บันทึกไม่สำเร็จ") });
  };
  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="ชื่อ" value={form.name} onChange={set("name")} />
      <Field label="อีเมล" type="email" value={form.email} onChange={set("email")} />
      <Field label="เบอร์โทร" value={form.phone} onChange={set("phone")} />
      <Field label="ที่อยู่จัดส่ง" value={form.address} onChange={set("address")} textarea />
      <div className="border-t border-line pt-3">
        <p className="mb-2 text-[12px] font-medium text-sub">ข้อมูลใบเสร็จ/ใบกำกับภาษี</p>
        <div className="space-y-3">
          <Field label="ชื่อออกใบเสร็จ" value={form.receiptName} onChange={set("receiptName")} />
          <Field label="เลขผู้เสียภาษี (13 หลัก)" value={form.receiptTaxId} onChange={set("receiptTaxId")} />
          <Field label="ที่อยู่ใบเสร็จ" value={form.receiptAddress} onChange={set("receiptAddress")} textarea />
        </div>
      </div>
      {error && <p className="text-[12px] text-red-600">{error}</p>}
      <div className="flex items-center justify-between pt-1">
        <button type="submit" disabled={save.isPending} className="rounded-full bg-accent px-6 py-2 text-[13px] font-medium text-white hover:bg-accent/90 disabled:opacity-50">บันทึก</button>
        <button type="button"
          onClick={() => confirm(`ลบลูกค้า "${c.email}"?`) && del.mutate(c.id, { onSuccess: onClose, onError: (e) => alert(e.response?.data?.error || "ลบไม่สำเร็จ") })}
          className="text-[13px] text-sub hover:text-red-600">ลบลูกค้า</button>
      </div>
    </form>
  );
}

/* ---- points tab ---- */
function PointsTab({ c }) {
  const adjust = useAdjustPoints();
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const submit = (sign) => {
    setError("");
    const n = Math.abs(parseInt(delta) || 0);
    if (!n) return setError("ระบุจำนวนแต้ม");
    adjust.mutate({ id: c.id, delta: sign * n, reason },
      { onSuccess: () => { setDelta(""); setReason(""); }, onError: (e) => setError(e.response?.data?.error || "ปรับไม่สำเร็จ") });
  };
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-line bg-white p-5 text-center">
        <p className="text-[12px] text-sub">แต้มคงเหลือ</p>
        <p className="text-[34px] font-bold text-accent">{c.points}</p>
      </div>

      <div className="rounded-2xl border border-line bg-white p-4">
        <p className="mb-2 text-[13px] font-semibold text-ink">ปรับแต้มด้วยมือ</p>
        <div className="flex gap-2">
          <input type="number" min="1" value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="จำนวน"
            className="w-24 rounded-lg border border-line px-3 py-2 text-[14px] outline-none focus:border-ink/30" />
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="เหตุผล (เช่น แลกของรางวัล)"
            className="flex-1 rounded-lg border border-line px-3 py-2 text-[14px] outline-none focus:border-ink/30" />
        </div>
        {error && <p className="mt-2 text-[12px] text-red-600">{error}</p>}
        <div className="mt-3 flex gap-2">
          <button onClick={() => submit(1)} disabled={adjust.isPending} className="flex-1 rounded-full bg-emerald-600 py-2 text-[13px] font-medium text-white hover:bg-emerald-700 disabled:opacity-50">+ เพิ่มแต้ม</button>
          <button onClick={() => submit(-1)} disabled={adjust.isPending} className="flex-1 rounded-full bg-rose-500 py-2 text-[13px] font-medium text-white hover:bg-rose-600 disabled:opacity-50">− หักแต้ม</button>
        </div>
      </div>

      <div>
        <p className="mb-2 text-[13px] font-semibold text-ink">ประวัติแต้ม</p>
        {c.pointLogs.length === 0 && <p className="text-[13px] text-sub">ยังไม่มีรายการ</p>}
        <ul className="space-y-1.5">
          {c.pointLogs.map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-2.5">
              <span className={`text-[15px] font-bold ${p.delta > 0 ? "text-emerald-600" : "text-rose-500"}`}>{p.delta > 0 ? `+${p.delta}` : p.delta}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] text-ink">{p.reason}</p>
                <p className="text-[11px] text-sub">{fmtDateTime(p.createdAt)}{p.authorName ? ` · ${p.authorName}` : ""}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ---- notes tab ---- */
const KINDS = { NOTE: ["โน้ต", "bg-mist text-sub"], CALL: ["โทร", "bg-blue-100 text-blue-700"], FOLLOWUP: ["ติดตาม", "bg-amber-100 text-amber-700"] };
function NotesTab({ c }) {
  const add = useAddNote();
  const toggle = useToggleNote();
  const delNote = useDeleteNote();
  const [kind, setKind] = useState("NOTE");
  const [body, setBody] = useState("");
  const [dueAt, setDueAt] = useState("");
  const submit = (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    add.mutate({ id: c.id, kind, body, dueAt: kind === "FOLLOWUP" ? dueAt : undefined },
      { onSuccess: () => { setBody(""); setDueAt(""); } });
  };
  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="rounded-2xl border border-line bg-white p-4">
        <div className="mb-2 flex gap-1.5">
          {Object.entries(KINDS).map(([k, [label]]) => (
            <button type="button" key={k} onClick={() => setKind(k)}
              className={`rounded-full border px-3 py-1 text-[12px] transition ${kind === k ? "border-accent bg-accent/10 text-accent" : "border-line text-sub hover:border-ink/25"}`}>{label}</button>
          ))}
        </div>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} placeholder="บันทึกการคุย / สิ่งที่ต้องติดตาม..."
          className="w-full resize-none rounded-lg border border-line px-3 py-2 text-[14px] outline-none focus:border-ink/30" />
        <div className="mt-2 flex items-center justify-between gap-2">
          {kind === "FOLLOWUP" ? (
            <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)}
              className="rounded-lg border border-line px-3 py-1.5 text-[13px] outline-none focus:border-ink/30" />
          ) : <span />}
          <button type="submit" disabled={add.isPending || !body.trim()} className="rounded-full bg-ink px-5 py-2 text-[13px] font-medium text-white hover:bg-ink/90 disabled:opacity-40">บันทึก</button>
        </div>
      </form>

      {c.notes.length === 0 && <p className="text-[13px] text-sub">ยังไม่มีโน้ต</p>}
      <ul className="space-y-2">
        {c.notes.map((n) => {
          const [label, cls] = KINDS[n.kind] || KINDS.NOTE;
          return (
            <li key={n.id} className="rounded-xl border border-line bg-white p-3.5">
              <div className="mb-1 flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[11px] ${cls}`}>{label}</span>
                {n.kind === "FOLLOWUP" && n.dueAt && (
                  <span className={`text-[11px] ${n.done ? "text-sub line-through" : "text-amber-600"}`}>ครบกำหนด {fmtDateTime(n.dueAt)}</span>
                )}
                <span className="ml-auto text-[11px] text-sub">{fmtDateTime(n.createdAt)}</span>
              </div>
              <p className={`text-[14px] text-ink ${n.kind === "FOLLOWUP" && n.done ? "text-sub line-through" : ""}`}>{n.body}</p>
              <div className="mt-1.5 flex items-center gap-4">
                {n.authorName && <span className="text-[11px] text-sub">โดย {n.authorName}</span>}
                {n.kind === "FOLLOWUP" && (
                  <button onClick={() => toggle.mutate({ noteId: n.id, id: c.id, done: !n.done })}
                    className={`text-[12px] ${n.done ? "text-sub hover:text-ink" : "text-emerald-600"}`}>{n.done ? "ทำเครื่องหมายยังไม่เสร็จ" : "✓ เสร็จแล้ว"}</button>
                )}
                <button onClick={() => delNote.mutate({ noteId: n.id, id: c.id })} className="ml-auto text-[12px] text-sub hover:text-red-600">ลบ</button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---- orders tab ---- */
function OrdersTab({ c }) {
  if (!c.orders.length) return <p className="text-[13px] text-sub">ยังไม่มีคำสั่งซื้อ</p>;
  return (
    <ul className="space-y-2">
      {c.orders.map((o) => {
        const [label, cls] = STATUS[o.status] || ["—", "bg-mist text-sub"];
        return (
          <li key={o.id} className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-ink">#{o.id.slice(0, 8)}</p>
              <p className="text-[11px] text-sub">{fmtDateTime(o.createdAt)} · {o.itemCount} รายการ</p>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-[11px] ${cls}`}>{label}</span>
            <span className="w-24 text-right text-[14px] font-semibold text-ink">{formatPrice(o.total)}</span>
          </li>
        );
      })}
    </ul>
  );
}

/* ---- shared field ---- */
function Field({ label, value, onChange, type = "text", textarea }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] text-sub">{label}</span>
      {textarea ? (
        <textarea value={value} onChange={onChange} rows={2}
          className="w-full resize-none rounded-lg border border-line bg-white px-3 py-2 text-[14px] outline-none focus:border-ink/30" />
      ) : (
        <input type={type} value={value} onChange={onChange}
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-[14px] outline-none focus:border-ink/30" />
      )}
    </label>
  );
}
