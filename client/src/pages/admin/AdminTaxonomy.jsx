import { useState } from "react";
import { useCategories } from "../../api/books";
import {
  useSaveCategory, useDeleteCategory,
  useAdminTerms, useSaveTerm, useDeleteTerm,
} from "../../api/admin";

export default function AdminTaxonomy() {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Categories />
      <div className="space-y-8">
        <TermList type="PUBLISHER" title="สำนักพิมพ์" placeholder="เช่น แสงดาว" />
        <TermList type="AUTHOR" title="ผู้เขียน" placeholder="เช่น J.K. Rowling" />
        <TermList type="TRANSLATOR" title="ผู้แปล" placeholder="ชื่อผู้แปล" />
      </div>
    </div>
  );
}

/* ---------- หมวดหมู่ (entity) ---------- */
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
    save.mutate(editing ? { id: editing.id, ...form } : form, {
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
            <button onClick={() => confirm(`ลบหมวด "${c.name}"? หนังสือจะกลายเป็นไม่มีหมวด (${c.bookCount} เล่ม)`) && del.mutate(c.id)} className="text-[13px] text-sub hover:text-red-600">ลบ</button>
          </li>
        ))}
        {categories?.length === 0 && <p className="py-2 text-sub">ยังไม่มีหมวดหมู่</p>}
      </ul>
      <form onSubmit={submit} className="rounded-xl bg-mist/50 p-4">
        <p className="mb-2 text-[13px] font-semibold text-ink">{editing ? `แก้ไข: ${editing.name}` : "เพิ่มหมวดใหม่"}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="ชื่อหมวด เช่น นิยาย" className="rounded-lg border border-line bg-white px-3 py-2 text-[14px] outline-none focus:border-ink/30" />
          <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="slug (เว้นว่าง = สร้างให้)" className="rounded-lg border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-ink/30" />
        </div>
        {error && <p className="mt-2 text-[12px] text-red-600">{error}</p>}
        <div className="mt-3 flex gap-2">
          <button type="submit" disabled={save.isPending || !form.name.trim()} className="rounded-full bg-accent px-5 py-2 text-[13px] font-medium text-white hover:bg-accent/90 disabled:opacity-50">{editing ? "บันทึก" : "เพิ่ม"}</button>
          {editing && <button type="button" onClick={() => { setEditing(null); setForm({ name: "", slug: "" }); setError(""); }} className="rounded-full border border-line px-4 py-2 text-[13px] text-ink hover:bg-white">ยกเลิก</button>}
        </div>
      </form>
    </section>
  );
}

/* ---------- Term collection (สำนักพิมพ์/ผู้เขียน/ผู้แปล) ---------- */
function TermList({ type, title, placeholder }) {
  const { data: terms, isLoading } = useAdminTerms(type);
  const save = useSaveTerm(type);
  const del = useDeleteTerm(type);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(null); // {id,name}
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");

  const add = (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) return;
    save.mutate({ name: name.trim() }, {
      onSuccess: () => setName(""),
      onError: (err) => setError(err.response?.data?.error || "เพิ่มไม่สำเร็จ"),
    });
  };
  const saveEdit = () => {
    save.mutate({ id: editing.id, name: editName.trim() }, {
      onSuccess: () => setEditing(null),
      onError: (err) => setError(err.response?.data?.error || "แก้ไม่สำเร็จ"),
    });
  };

  return (
    <section className="rounded-2xl border border-line bg-white p-6">
      <h2 className="mb-4 text-[15px] font-semibold text-ink">{title} <span className="text-[13px] font-normal text-sub">({terms?.length || 0})</span></h2>

      <ul className="mb-4 max-h-56 divide-y divide-line overflow-y-auto">
        {isLoading && <p className="py-2 text-sub">กำลังโหลด...</p>}
        {terms?.map((t) => (
          <li key={t.id} className="flex items-center gap-3 py-2">
            {editing?.id === t.id ? (
              <>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 rounded-lg border border-line px-3 py-1.5 text-[14px] outline-none focus:border-ink/30" autoFocus />
                <button onClick={saveEdit} className="text-[13px] font-medium text-accent hover:underline">บันทึก</button>
                <button onClick={() => setEditing(null)} className="text-[13px] text-sub hover:text-ink">ยกเลิก</button>
              </>
            ) : (
              <>
                <div className="flex-1">
                  <p className="text-[14px] text-ink">{t.name}</p>
                  <p className="text-[12px] text-sub">{t.count} เล่ม</p>
                </div>
                <button onClick={() => { setEditing(t); setEditName(t.name); setError(""); }} className="text-[13px] text-accent hover:underline">แก้ไข</button>
                <button onClick={() => confirm(`ลบ "${t.name}"? จะเอาออกจากหนังสือ ${t.count} เล่มด้วย`) && del.mutate(t.id)} className="text-[13px] text-sub hover:text-red-600">ลบ</button>
              </>
            )}
          </li>
        ))}
        {terms?.length === 0 && <p className="py-2 text-[13px] text-sub">ยังไม่มี — เพิ่มด้านล่าง</p>}
      </ul>

      <form onSubmit={add} className="flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={placeholder} className="flex-1 rounded-lg border border-line px-3 py-2 text-[14px] outline-none focus:border-ink/30" />
        <button type="submit" disabled={save.isPending || !name.trim()} className="rounded-full bg-ink px-5 py-2 text-[13px] font-medium text-white hover:bg-ink/90 disabled:opacity-50">เพิ่ม</button>
      </form>
      {error && <p className="mt-2 text-[12px] text-red-600">{error}</p>}
    </section>
  );
}
