import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCategories } from "../../api/books";
import { useAdminTerms } from "../../api/admin";
import { useAdminNav, useSaveNavItem, useDeleteNavItem, useReorderNav } from "../../api/nav";

// เพจสำเร็จรูปในเว็บ
const STATIC_PAGES = [
  { label: "หน้าแรก", url: "/" },
  { label: "หนังสือทั้งหมด", url: "/books" },
  { label: "สำนักพิมพ์ทั้งหมด", url: "/publishers" },
  { label: "ผู้เขียนทั้งหมด", url: "/authors" },
  { label: "ผู้แปลทั้งหมด", url: "/translators" },
  { label: "เกี่ยวกับเรา", url: "/about" },
  { label: "ติดต่อ", url: "/contact" },
  { label: "ติดตามคำสั่งซื้อ", url: "/track" },
];

export default function AdminNav() {
  const { data: items = [], isLoading } = useAdminNav();
  const save = useSaveNavItem();
  const del = useDeleteNavItem();
  const reorder = useReorderNav();

  const [form, setForm] = useState({ label: "", url: "" });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");

  // แหล่งเพจ/collection ที่เลือกมาทำลิงก์ได้
  const cats = useCategories();
  const pubs = useAdminTerms("PUBLISHER");
  const authors = useAdminTerms("AUTHOR");
  const translators = useAdminTerms("TRANSLATOR");

  const groups = useMemo(() => [
    { label: "เพจ", options: STATIC_PAGES },
    { label: "หมวดหมู่", options: (cats.data || []).map((c) => ({ label: c.name, url: `/books?category=${c.slug}` })) },
    { label: "สำนักพิมพ์", options: (pubs.data || []).map((t) => ({ label: t.name, url: `/publisher/${t.slug}` })) },
    { label: "ผู้เขียน", options: (authors.data || []).map((t) => ({ label: t.name, url: `/author/${t.slug}` })) },
    { label: "ผู้แปล", options: (translators.data || []).map((t) => ({ label: t.name, url: `/translator/${t.slug}` })) },
  ], [cats.data, pubs.data, authors.data, translators.data]);

  const pickPage = (url) => {
    if (!url) return;
    const found = groups.flatMap((g) => g.options).find((o) => o.url === url);
    setForm((f) => ({ label: f.label.trim() ? f.label : found?.label || "", url }));
  };

  const submit = (e) => {
    e.preventDefault();
    setError("");
    if (!form.label.trim() || !form.url.trim()) return setError("กรอกชื่อเมนูและเลือกหน้า/ลิงก์");
    save.mutate(editing ? { id: editing.id, ...form } : form, {
      onSuccess: () => { setForm({ label: "", url: "" }); setEditing(null); },
      onError: (err) => setError(err.response?.data?.error || "บันทึกไม่สำเร็จ"),
    });
  };

  const startEdit = (n) => { setEditing(n); setForm({ label: n.label, url: n.url }); setError(""); };
  const cancel = () => { setEditing(null); setForm({ label: "", url: "" }); setError(""); };

  // เลื่อนขึ้น/ลง — ส่งลำดับ id ใหม่
  const move = (index, dir) => {
    const next = [...items];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    reorder.mutate(next.map((n) => n.id));
  };

  const toggleActive = (n) => save.mutate({ id: n.id, active: !n.active });

  return (
    <div className="w-full space-y-6">
      <p className="text-[13px] text-sub">
        จัดการเมนูบนแถบนำทางหน้าร้าน — เลือกหน้า/หมวดหมู่/สำนักพิมพ์/ผู้เขียน/ผู้แปล มาทำเป็นลิงก์ หรือใส่ลิงก์เอง · ลากลำดับด้วยปุ่มลูกศร · ปิดเมนูไว้ชั่วคราวได้
      </p>

      {/* รายการเมนู */}
      <div className="rounded-2xl border border-line bg-white p-2">
        {isLoading && <p className="px-4 py-3 text-[13px] text-sub">กำลังโหลด...</p>}
        {!isLoading && items.length === 0 && <p className="px-4 py-3 text-[13px] text-sub">ยังไม่มีเมนู — เพิ่มด้านล่าง</p>}
        <ul className="divide-y divide-line">
          {items.map((n, i) => (
            <li key={n.id} className="flex items-center gap-3 px-2 py-2.5">
              <div className="flex flex-col gap-0.5">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="flex h-6 w-6 items-center justify-center rounded-md text-sub transition hover:bg-mist hover:text-ink disabled:opacity-20 disabled:hover:bg-transparent" aria-label="เลื่อนขึ้น" title="เลื่อนขึ้น">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M6 15l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <button onClick={() => move(i, 1)} disabled={i === items.length - 1} className="flex h-6 w-6 items-center justify-center rounded-md text-sub transition hover:bg-mist hover:text-ink disabled:opacity-20 disabled:hover:bg-transparent" aria-label="เลื่อนลง" title="เลื่อนลง">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-[14px] font-medium ${n.active ? "text-ink" : "text-sub line-through"}`}>{n.label}</p>
                <p className="truncate text-[12px] text-sub">{n.url}</p>
              </div>
              <Link to={n.url} target="_blank" className="text-[13px] text-sub hover:text-ink">ดู ↗</Link>
              <button onClick={() => toggleActive(n)} className={`text-[13px] ${n.active ? "text-sub hover:text-ink" : "text-accent"}`}>
                {n.active ? "ซ่อน" : "แสดง"}
              </button>
              <button onClick={() => startEdit(n)} className="text-[13px] text-accent">แก้ไข</button>
              <button onClick={() => confirm(`ลบเมนู "${n.label}"?`) && del.mutate(n.id)} className="text-[13px] text-sub hover:text-red-600">ลบ</button>
            </li>
          ))}
        </ul>
      </div>

      {/* ฟอร์มเพิ่ม/แก้ไข */}
      <form onSubmit={submit} className="rounded-2xl border border-line bg-white p-6">
        <p className="mb-3 text-[13px] font-semibold text-ink">{editing ? `แก้ไขเมนู: ${editing.label}` : "เพิ่มเมนูใหม่"}</p>

        <label className="mb-1 block text-[12px] text-sub">เลือกหน้า / collection</label>
        <select
          value={groups.flatMap((g) => g.options).some((o) => o.url === form.url) ? form.url : ""}
          onChange={(e) => pickPage(e.target.value)}
          className="mb-3 w-full rounded-lg border border-line bg-white px-3 py-2 text-[14px] outline-none focus:border-ink/30"
        >
          <option value="">— เลือกหน้าเพื่อสร้างลิงก์ (หรือใส่ลิงก์เองด้านล่าง) —</option>
          {groups.map((g) => g.options.length > 0 && (
            <optgroup key={g.label} label={g.label}>
              {g.options.map((o) => <option key={o.url} value={o.url}>{o.label}</option>)}
            </optgroup>
          ))}
        </select>

        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[12px] text-sub">ชื่อเมนู (ที่แสดง)</label>
            <input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder="เช่น นิยาย" className="w-full rounded-lg border border-line bg-white px-3 py-2 text-[14px] outline-none focus:border-ink/30" />
          </div>
          <div>
            <label className="mb-1 block text-[12px] text-sub">ลิงก์ (URL)</label>
            <input value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="/books?category=fiction หรือ https://..." className="w-full rounded-lg border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-ink/30" />
          </div>
        </div>

        {error && <p className="mt-2 text-[12px] text-red-600">{error}</p>}
        <div className="mt-4 flex gap-2">
          <button type="submit" disabled={save.isPending} className="rounded-full bg-accent px-5 py-2 text-[13px] font-medium text-white hover:bg-accent/90 disabled:opacity-50">{editing ? "บันทึก" : "เพิ่มเมนู"}</button>
          {editing && <button type="button" onClick={cancel} className="rounded-full border border-line px-4 py-2 text-[13px] text-ink hover:bg-mist">ยกเลิก</button>}
        </div>
      </form>
    </div>
  );
}
