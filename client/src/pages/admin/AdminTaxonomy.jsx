import { useState } from "react";
import { useCategories, usePublishers } from "../../api/books";
import { useSaveCategory, useDeleteCategory, useRenamePublisher } from "../../api/admin";

export default function AdminTaxonomy() {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Categories />
      <Publishers />
    </div>
  );
}

/* ---------- หมวดหมู่ ---------- */
function Categories() {
  const { data: categories, isLoading } = useCategories();
  const save = useSaveCategory();
  const del = useDeleteCategory();
  const [form, setForm] = useState({ name: "", slug: "" });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    setError("");
    const payload = editing ? { id: editing.id, ...form } : form;
    save.mutate(payload, {
      onSuccess: () => { setForm({ name: "", slug: "" }); setEditing(null); },
      onError: (err) => setError(err.response?.data?.error || "บันทึกไม่สำเร็จ"),
    });
  };

  return (
    <section className="rounded-2xl border border-line bg-white p-6">
      <h2 className="mb-4 text-[15px] font-semibold text-ink">หมวดหมู่</h2>

      <ul className="mb-5 divide-y divide-line">
        {isLoading && <p className="py-2 text-sub">กำลังโหลด...</p>}
        {categories?.map((c) => (
          <li key={c.id} className="flex items-center gap-3 py-2.5">
            <div className="flex-1">
              <p className="text-[14px] font-medium text-ink">{c.name}</p>
              <p className="text-[12px] text-sub">/{c.slug} · {c.bookCount} เล่ม</p>
            </div>
            <button onClick={() => { setEditing(c); setForm({ name: c.name, slug: c.slug }); setError(""); }} className="text-[13px] text-accent hover:underline">แก้ไข</button>
            <button
              onClick={() => confirm(`ลบหมวด "${c.name}"? หนังสือในหมวดจะกลายเป็นไม่มีหมวด (${c.bookCount} เล่ม)`) && del.mutate(c.id)}
              className="text-[13px] text-sub hover:text-red-600">ลบ</button>
          </li>
        ))}
        {categories?.length === 0 && <p className="py-2 text-sub">ยังไม่มีหมวดหมู่</p>}
      </ul>

      <form onSubmit={submit} className="rounded-xl bg-mist/50 p-4">
        <p className="mb-2 text-[13px] font-semibold text-ink">{editing ? `แก้ไข: ${editing.name}` : "เพิ่มหมวดใหม่"}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="ชื่อหมวด เช่น นิยาย"
            className="rounded-lg border border-line bg-white px-3 py-2 text-[14px] outline-none focus:border-ink/30" />
          <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="slug (เว้นว่าง = สร้างให้)"
            className="rounded-lg border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-ink/30" />
        </div>
        {error && <p className="mt-2 text-[12px] text-red-600">{error}</p>}
        <div className="mt-3 flex gap-2">
          <button type="submit" disabled={save.isPending || !form.name.trim()} className="rounded-full bg-accent px-5 py-2 text-[13px] font-medium text-white hover:bg-accent/90 disabled:opacity-50">
            {editing ? "บันทึก" : "เพิ่ม"}
          </button>
          {editing && <button type="button" onClick={() => { setEditing(null); setForm({ name: "", slug: "" }); setError(""); }} className="rounded-full border border-line px-4 py-2 text-[13px] text-ink hover:bg-white">ยกเลิก</button>}
        </div>
      </form>
    </section>
  );
}

/* ---------- สำนักพิมพ์ ---------- */
function Publishers() {
  const { data: publishers, isLoading } = usePublishers();
  const rename = useRenamePublisher();
  const [editing, setEditing] = useState(null); // ชื่อเดิม
  const [to, setTo] = useState("");
  const [msg, setMsg] = useState("");

  const doRename = (from) => {
    setMsg("");
    rename.mutate({ from, to: to.trim() }, {
      onSuccess: (r) => { setMsg(`อัปเดต ${r.updated} เล่ม`); setEditing(null); setTo(""); },
      onError: (e) => setMsg(e.response?.data?.error || "ไม่สำเร็จ"),
    });
  };

  return (
    <section className="rounded-2xl border border-line bg-white p-6">
      <h2 className="mb-1 text-[15px] font-semibold text-ink">สำนักพิมพ์</h2>
      <p className="mb-4 text-[12px] text-sub">เปลี่ยนชื่อ/รวมสำนักพิมพ์ (อัปเดตทุกเล่มที่ใช้) · เพิ่มสำนักพิมพ์ใหม่ได้ตอนแก้หนังสือ</p>

      {isLoading && <p className="text-sub">กำลังโหลด...</p>}
      <ul className="divide-y divide-line">
        {publishers?.map((p) => (
          <li key={p.name} className="py-2.5">
            {editing === p.name ? (
              <div className="flex flex-wrap items-center gap-2">
                <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="ชื่อใหม่ (ว่าง = ล้าง)"
                  className="flex-1 rounded-lg border border-line px-3 py-1.5 text-[14px] outline-none focus:border-ink/30" />
                <button onClick={() => doRename(p.name)} disabled={rename.isPending} className="rounded-full bg-accent px-4 py-1.5 text-[13px] font-medium text-white hover:bg-accent/90 disabled:opacity-50">บันทึก</button>
                <button onClick={() => { setEditing(null); setTo(""); }} className="rounded-full border border-line px-3 py-1.5 text-[13px] text-ink hover:bg-mist">ยกเลิก</button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-[14px] font-medium text-ink">{p.name}</p>
                  <p className="text-[12px] text-sub">{p.count} เล่ม</p>
                </div>
                <button onClick={() => { setEditing(p.name); setTo(p.name); setMsg(""); }} className="text-[13px] text-accent hover:underline">เปลี่ยนชื่อ</button>
                <button onClick={() => confirm(`ล้างสำนักพิมพ์ "${p.name}" ออกจาก ${p.count} เล่ม?`) && (setTo(""), doRename(p.name))} className="text-[13px] text-sub hover:text-red-600">ล้าง</button>
              </div>
            )}
          </li>
        ))}
        {publishers?.length === 0 && <p className="py-2 text-sub">ยังไม่มีสำนักพิมพ์ — เพิ่มได้ตอนแก้หนังสือ</p>}
      </ul>
      {msg && <p className="mt-3 text-[13px] text-emerald-600">{msg}</p>}
    </section>
  );
}
