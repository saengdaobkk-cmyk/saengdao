import { useState } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import { useCategories } from "../../api/books";
import {
  useSaveCategory, useDeleteCategory,
  useAdminTerms, useSaveTerm, useDeleteTerm,
  uploadImage,
} from "../../api/admin";

const subtabs = [
  { to: "/admin/collections", label: "หมวดหมู่", end: true },
  { to: "/admin/collections/publishers", label: "สำนักพิมพ์" },
  { to: "/admin/collections/authors", label: "ผู้เขียน" },
  { to: "/admin/collections/translators", label: "ผู้แปล" },
];

export default function AdminCollections() {
  return (
    <div>
      <nav className="mb-6 flex flex-wrap gap-2">
        {subtabs.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end}
            className={({ isActive }) => `rounded-full px-4 py-2 text-[13px] transition ${isActive ? "bg-ink text-white" : "bg-mist text-ink/70 hover:bg-line"}`}>
            {t.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}

/* ---------- หมวดหมู่ ---------- */
export function CategoryManager() {
  const { data: categories, isLoading } = useCategories();
  const save = useSaveCategory();
  const del = useDeleteCategory();
  const [form, setForm] = useState({ name: "", slug: "", image: "" });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => { setForm({ name: "", slug: "", image: "" }); setEditing(null); setError(""); };

  const submit = (e) => {
    e.preventDefault();
    setError("");
    save.mutate(editing ? { id: editing.id, ...form } : form, {
      onSuccess: reset,
      onError: (err) => setError(err.response?.data?.error || "บันทึกไม่สำเร็จ"),
    });
  };

  const onImage = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setBusy(true);
    try { const url = await uploadImage(file); setForm((f) => ({ ...f, image: url })); }
    catch { setError("อัปโหลดรูปไม่สำเร็จ"); }
    finally { setBusy(false); }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* ตาราง */}
      <div className="w-full overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-left text-[14px]">
          <thead className="border-b border-line bg-mist/40 text-[12px] text-sub">
            <tr>
              <th className="px-5 py-3 font-medium">ชื่อหมวดหมู่</th>
              <th className="px-5 py-3 font-medium">Slug</th>
              <th className="px-5 py-3 font-medium">จำนวน</th>
              <th className="px-5 py-3 text-right font-medium">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {isLoading && <tr><td colSpan={4} className="px-5 py-4 text-sub">กำลังโหลด...</td></tr>}
            {categories?.map((c) => (
              <tr key={c.id} className="hover:bg-mist/30">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-16 shrink-0 items-center justify-center overflow-hidden rounded bg-mist">
                      {c.image ? <img src={c.image} alt="" className="h-full w-full object-cover" /> : <span className="text-[10px] text-sub">ไม่มีรูป</span>}
                    </div>
                    <span className="font-medium text-ink">{c.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-sub">/{c.slug}</td>
                <td className="px-5 py-3 text-sub">{c.bookCount} เล่ม</td>
                <td className="whitespace-nowrap px-5 py-3">
                  <div className="flex justify-end gap-4">
                    <Link to={`/books?category=${c.slug}`} target="_blank" className="text-[13px] text-sub hover:text-ink">ดู ↗</Link>
                    <button onClick={() => { setEditing(c); setForm({ name: c.name, slug: c.slug, image: c.image || "" }); setError(""); }} className="text-[13px] text-accent">แก้ไข</button>
                    <button onClick={() => confirm(`ลบหมวด "${c.name}"? หนังสือจะกลายเป็นไม่มีหมวด (${c.bookCount} เล่ม)`) && del.mutate(c.id)} className="text-[13px] text-sub hover:text-red-600">ลบ</button>
                  </div>
                </td>
              </tr>
            ))}
            {categories?.length === 0 && <tr><td colSpan={4} className="px-5 py-4 text-sub">ยังไม่มีหมวดหมู่</td></tr>}
          </tbody>
        </table>
      </div>

      {/* ฟอร์มเพิ่ม/แก้ไข */}
      <form onSubmit={submit} className="h-fit rounded-2xl border border-line bg-white p-5 lg:sticky lg:top-20">
        <p className="mb-3 text-[13px] font-semibold text-ink">{editing ? `แก้ไข: ${editing.name}` : "เพิ่มหมวดใหม่"}</p>
        <div className="space-y-2">
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="ชื่อหมวด เช่น นิยาย" className="w-full rounded-lg border border-line bg-white px-3 py-2 text-[14px] outline-none focus:border-ink/30" />
          <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="slug (เว้นว่าง = สร้างให้)" className="w-full rounded-lg border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-ink/30" />
        </div>

        {/* รูปการ์ดหมวดหมู่ (หน้าแรก) */}
        <div className="mt-3">
          <p className="mb-1.5 text-[12px] text-sub">รูปการ์ด (หน้าแรก) · สัดส่วน 16:10</p>
          <div className="mb-2 flex aspect-[16/10] items-center justify-center overflow-hidden rounded-xl bg-mist">
            {form.image ? <img src={form.image} alt="" className="h-full w-full object-cover" /> : <span className="text-[12px] text-sub">ยังไม่มีรูป</span>}
          </div>
          <div className="flex items-center gap-3">
            <label className="cursor-pointer rounded-lg border border-dashed border-line px-3 py-1.5 text-[12px] text-sub hover:text-ink">
              {busy ? "กำลังอัปโหลด..." : form.image ? "เปลี่ยนรูป" : "อัปโหลดรูป"}
              <input type="file" accept="image/*" onChange={onImage} className="hidden" />
            </label>
            {form.image && <button type="button" onClick={() => setForm((f) => ({ ...f, image: "" }))} className="text-[12px] text-sub hover:text-red-600">ลบรูป</button>}
          </div>
        </div>

        {error && <p className="mt-2 text-[12px] text-red-600">{error}</p>}
        <div className="mt-3 flex gap-2">
          <button type="submit" disabled={save.isPending || !form.name.trim()} className="rounded-full bg-accent px-5 py-2 text-[13px] font-medium text-white hover:bg-accent/90 disabled:opacity-50">{editing ? "บันทึก" : "เพิ่ม"}</button>
          {editing && <button type="button" onClick={reset} className="rounded-full border border-line px-4 py-2 text-[13px] text-ink hover:bg-mist">ยกเลิก</button>}
        </div>
      </form>
    </div>
  );
}

/* ---------- สำนักพิมพ์ / ผู้เขียน / ผู้แปล ---------- */
const TERM_META = {
  PUBLISHER: { label: "สำนักพิมพ์", ph: "เช่น แสงดาว", path: "publisher" },
  AUTHOR: { label: "ผู้เขียน", ph: "เช่น J.K. Rowling", path: "author" },
  TRANSLATOR: { label: "ผู้แปล", ph: "ชื่อผู้แปล", path: "translator" },
};

export function TermManager({ type }) {
  const meta = TERM_META[type];
  const { data: terms, isLoading } = useAdminTerms(type);
  const save = useSaveTerm(type);
  const del = useDeleteTerm(type);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");
  const [uploadingId, setUploadingId] = useState(null);

  const onLogo = async (t, e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingId(t.id);
    setError("");
    try { const url = await uploadImage(file); save.mutate({ id: t.id, name: t.name, image: url }); }
    catch { setError("อัปโหลดโลโก้ไม่สำเร็จ"); }
    finally { setUploadingId(null); }
  };

  const add = (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) return;
    save.mutate({ name: name.trim() }, { onSuccess: () => setName(""), onError: (err) => setError(err.response?.data?.error || "เพิ่มไม่สำเร็จ") });
  };
  const saveEdit = () => save.mutate({ id: editing.id, name: editName.trim() }, { onSuccess: () => setEditing(null), onError: (err) => setError(err.response?.data?.error || "แก้ไม่สำเร็จ") });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-sub">จัดการ{meta.label} — แก้ชื่อจะอัปเดตทุกเล่มที่ใช้ · คลิก "ดู" เพื่อดูหน้ารวมของ{meta.label}นั้น</p>
        {/* เพิ่มรายการใหม่ (บาร์ด้านบน) */}
        <form onSubmit={add} className="flex gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={meta.ph} className="w-56 rounded-lg border border-line px-3 py-2 text-[13px] outline-none focus:border-ink/30" />
          <button type="submit" disabled={save.isPending || !name.trim()} className="whitespace-nowrap rounded-full bg-ink px-5 py-2 text-[13px] font-medium text-white hover:bg-ink/90 disabled:opacity-50">+ เพิ่ม{meta.label}</button>
        </form>
      </div>
      {error && <p className="text-[12px] text-red-600">{error}</p>}

      <div className="w-full overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-left text-[14px]">
          <thead className="border-b border-line bg-mist/40 text-[12px] text-sub">
            <tr>
              <th className="px-5 py-3 font-medium">ชื่อ{meta.label}</th>
              <th className="px-5 py-3 font-medium">Slug</th>
              <th className="px-5 py-3 font-medium">จำนวน</th>
              <th className="px-5 py-3 text-right font-medium">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {isLoading && <tr><td colSpan={4} className="px-5 py-4 text-sub">กำลังโหลด...</td></tr>}
            {terms?.map((t) => (
              <tr key={t.id} className="hover:bg-mist/30">
                {editing?.id === t.id ? (
                  <>
                    <td className="px-5 py-2" colSpan={3}>
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full max-w-sm rounded-lg border border-line px-3 py-1.5 text-[14px] outline-none focus:border-ink/30" autoFocus />
                    </td>
                    <td className="whitespace-nowrap px-5 py-2">
                      <div className="flex justify-end gap-4">
                        <button onClick={saveEdit} className="text-[13px] font-medium text-accent">บันทึก</button>
                        <button onClick={() => setEditing(null)} className="text-[13px] text-sub hover:text-ink">ยกเลิก</button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {type === "PUBLISHER" && (
                          <div className="flex h-9 w-14 shrink-0 items-center justify-center overflow-hidden rounded border border-line bg-white">
                            {t.image ? <img src={t.image} alt="" className="h-full w-full object-contain p-1" /> : <span className="text-[9px] text-sub">โลโก้</span>}
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-ink">{t.name}</span>
                          {type === "PUBLISHER" && (
                            <div className="mt-0.5 flex gap-2 text-[11px]">
                              <label className="cursor-pointer text-accent hover:opacity-80">
                                {uploadingId === t.id ? "กำลังอัป..." : t.image ? "เปลี่ยนโลโก้" : "อัปโหลดโลโก้"}
                                <input type="file" accept="image/*" onChange={(e) => onLogo(t, e)} className="hidden" />
                              </label>
                              {t.image && <button onClick={() => save.mutate({ id: t.id, name: t.name, image: "" })} className="text-sub hover:text-red-600">ลบโลโก้</button>}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sub">/{t.slug}</td>
                    <td className="px-5 py-3 text-sub">{t.count} เล่ม</td>
                    <td className="whitespace-nowrap px-5 py-3">
                      <div className="flex justify-end gap-4">
                        <Link to={`/${meta.path}/${t.slug}`} target="_blank" className="text-[13px] text-sub hover:text-ink">ดู ↗</Link>
                        <button onClick={() => { setEditing(t); setEditName(t.name); setError(""); }} className="text-[13px] text-accent">แก้ไข</button>
                        <button onClick={() => confirm(`ลบ "${t.name}"? จะเอาออกจากหนังสือ ${t.count} เล่มด้วย`) && del.mutate(t.id)} className="text-[13px] text-sub hover:text-red-600">ลบ</button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {terms?.length === 0 && <tr><td colSpan={4} className="px-5 py-4 text-[13px] text-sub">ยังไม่มี — เพิ่มด้านบน</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
