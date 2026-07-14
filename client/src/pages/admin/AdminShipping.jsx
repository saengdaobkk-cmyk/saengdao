import { useState } from "react";
import { formatPrice } from "../../lib/format";
import {
  useAdminShipping,
  useSaveShipping,
  useDeleteShipping,
  useReorderShipping,
} from "../../api/shipping";

const EMPTY = { name: "", fee: "", note: "" };

export default function AdminShipping() {
  const { data: items = [], isLoading } = useAdminShipping();
  const save = useSaveShipping();
  const del = useDeleteShipping();
  const reorder = useReorderShipping();

  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("กรอกชื่อช่องทางจัดส่ง");
    const payload = {
      name: form.name.trim(),
      fee: Math.max(0, Math.round(Number(form.fee) || 0)),
      note: form.note.trim(),
    };
    save.mutate(editing ? { id: editing.id, ...payload } : payload, {
      onSuccess: () => { setForm(EMPTY); setEditing(null); },
      onError: (err) => setError(err.response?.data?.error || "บันทึกไม่สำเร็จ"),
    });
  };

  const startEdit = (m) => {
    setEditing(m);
    setForm({ name: m.name, fee: String(Number(m.fee)), note: m.note || "" });
    setError("");
  };
  const cancel = () => { setEditing(null); setForm(EMPTY); setError(""); };

  const move = (index, dir) => {
    const next = [...items];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    reorder.mutate(next.map((m) => m.id));
  };

  const toggleActive = (m) => save.mutate({ id: m.id, active: !m.active });

  return (
    <div className="w-full space-y-6">
      <p className="text-[13px] text-sub">
        จัดการช่องทางจัดส่งที่ลูกค้าเลือกได้ตอนสั่งซื้อ — ตั้งชื่อ + ค่าส่ง (0 = ส่งฟรี) · ลากลำดับด้วยปุ่มลูกศร · ปิดไว้ชั่วคราวได้
      </p>

      {/* รายการช่องทาง */}
      <div className="rounded-2xl border border-line bg-white p-2">
        {isLoading && <p className="px-4 py-3 text-[13px] text-sub">กำลังโหลด...</p>}
        {!isLoading && items.length === 0 && (
          <p className="px-4 py-3 text-[13px] text-sub">ยังไม่มีช่องทางจัดส่ง — เพิ่มด้านล่าง</p>
        )}
        <ul className="divide-y divide-line">
          {items.map((m, i) => (
            <li key={m.id} className="flex items-center gap-3 px-2 py-2.5">
              <div className="flex flex-col gap-0.5">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="flex h-6 w-6 items-center justify-center rounded-md text-sub transition hover:bg-mist hover:text-ink disabled:opacity-20 disabled:hover:bg-transparent" aria-label="เลื่อนขึ้น" title="เลื่อนขึ้น">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M6 15l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <button onClick={() => move(i, 1)} disabled={i === items.length - 1} className="flex h-6 w-6 items-center justify-center rounded-md text-sub transition hover:bg-mist hover:text-ink disabled:opacity-20 disabled:hover:bg-transparent" aria-label="เลื่อนลง" title="เลื่อนลง">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-[14px] font-medium ${m.active ? "text-ink" : "text-sub line-through"}`}>{m.name}</p>
                {m.note && <p className="truncate text-[12px] text-sub">{m.note}</p>}
              </div>
              <span className="shrink-0 text-[14px] font-semibold text-ink">
                {Number(m.fee) === 0 ? <span className="text-emerald-600">ฟรี</span> : formatPrice(m.fee)}
              </span>
              <button onClick={() => toggleActive(m)} className={`text-[13px] ${m.active ? "text-sub hover:text-ink" : "text-accent"}`}>
                {m.active ? "ซ่อน" : "แสดง"}
              </button>
              <button onClick={() => startEdit(m)} className="text-[13px] text-accent">แก้ไข</button>
              <button onClick={() => confirm(`ลบช่องทาง "${m.name}"?`) && del.mutate(m.id)} className="text-[13px] text-sub hover:text-red-600">ลบ</button>
            </li>
          ))}
        </ul>
      </div>

      {/* ฟอร์มเพิ่ม/แก้ไข */}
      <form onSubmit={submit} className="rounded-2xl border border-line bg-white p-6">
        <p className="mb-3 text-[13px] font-semibold text-ink">{editing ? `แก้ไข: ${editing.name}` : "เพิ่มช่องทางจัดส่ง"}</p>

        <div className="grid gap-2 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-[12px] text-sub">ชื่อช่องทาง</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="เช่น ไปรษณีย์ EMS / Flash Express" className="w-full rounded-lg border border-line bg-white px-3 py-2 text-[14px] outline-none focus:border-ink/30" />
          </div>
          <div>
            <label className="mb-1 block text-[12px] text-sub">ค่าส่ง (บาท)</label>
            <input type="number" min="0" step="1" value={form.fee} onChange={(e) => setForm((f) => ({ ...f, fee: e.target.value }))} placeholder="0 = ฟรี" className="w-full rounded-lg border border-line bg-white px-3 py-2 text-[14px] outline-none focus:border-ink/30" />
          </div>
        </div>
        <div className="mt-2">
          <label className="mb-1 block text-[12px] text-sub">หมายเหตุ (ไม่บังคับ)</label>
          <input value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="เช่น ส่งถึงใน 1-2 วันทำการ" className="w-full rounded-lg border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-ink/30" />
        </div>

        {error && <p className="mt-2 text-[12px] text-red-600">{error}</p>}
        <div className="mt-4 flex gap-2">
          <button type="submit" disabled={save.isPending} className="rounded-full bg-accent px-5 py-2 text-[13px] font-medium text-white hover:bg-accent/90 disabled:opacity-50">{editing ? "บันทึก" : "เพิ่มช่องทาง"}</button>
          {editing && <button type="button" onClick={cancel} className="rounded-full border border-line px-4 py-2 text-[13px] text-ink hover:bg-mist">ยกเลิก</button>}
        </div>
      </form>
    </div>
  );
}
