import { useState } from "react";
import { formatPrice } from "../../lib/format";
import { useDiscountRules, useSaveRule, useDeleteRule } from "../../api/discounts";

const EMPTY = {
  name: "", priority: 0, minSubtotal: "", minQty: "",
  discountType: "PERCENT", discountValue: "", maxDiscount: "",
  startAt: "", endAt: "", active: true,
};

const toLocalInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

function ruleSummary(r) {
  const cond = [];
  if (Number(r.minSubtotal) > 0) cond.push(`ยอด ≥ ${formatPrice(r.minSubtotal)}`);
  if (Number(r.minQty) > 0) cond.push(`≥ ${r.minQty} ชิ้น`);
  const disc = r.discountType === "PERCENT"
    ? `ลด ${Number(r.discountValue)}%${r.maxDiscount != null ? ` (สูงสุด ${formatPrice(r.maxDiscount)})` : ""}`
    : `ลด ${formatPrice(r.discountValue)}`;
  return `${cond.length ? cond.join(" · ") + " → " : "ทุกออเดอร์ → "}${disc}`;
}

export default function AdminDiscountRules() {
  const { data: rules = [], isLoading } = useDiscountRules();
  const save = useSaveRule();
  const del = useDeleteRule();
  const [form, setForm] = useState(null); // null = ปิดฟอร์ม
  const [error, setError] = useState("");

  const openNew = () => { setForm({ ...EMPTY }); setError(""); };
  const openEdit = (r) => {
    setForm({
      id: r.id, name: r.name, priority: r.priority,
      minSubtotal: Number(r.minSubtotal) || "", minQty: r.minQty || "",
      discountType: r.discountType, discountValue: Number(r.discountValue) || "",
      maxDiscount: r.maxDiscount != null ? Number(r.maxDiscount) : "",
      startAt: toLocalInput(r.startAt), endAt: toLocalInput(r.endAt), active: r.active,
    });
    setError("");
  };
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("กรอกชื่อกฎ");
    const payload = {
      ...form,
      startAt: form.startAt ? new Date(form.startAt).toISOString() : "",
      endAt: form.endAt ? new Date(form.endAt).toISOString() : "",
    };
    save.mutate(payload, {
      onSuccess: () => setForm(null),
      onError: (err) => setError(err.response?.data?.error || "บันทึกไม่สำเร็จ"),
    });
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] text-sub">กฎส่วนลดอัตโนมัติ — ลูกค้าได้ส่วนลดเองเมื่อเข้าเงื่อนไข (ไม่ต้องใส่โค้ด) · เลือกกฎที่ลดมากสุดให้อัตโนมัติ</p>
        <button onClick={openNew} className="shrink-0 rounded-full bg-ink px-5 py-2.5 text-[14px] font-medium text-white transition hover:bg-ink/90">+ เพิ่มกฎ</button>
      </div>

      <div className="rounded-2xl border border-line bg-white p-2">
        {isLoading && <p className="px-4 py-3 text-[14px] text-sub">กำลังโหลด...</p>}
        {!isLoading && rules.length === 0 && <p className="px-4 py-8 text-center text-[14px] text-sub">ยังไม่มีกฎส่วนลด — เพิ่มด้านบน</p>}
        <ul className="divide-y divide-line">
          {rules.map((r) => (
            <li key={r.id} className="flex items-center gap-3 px-3 py-3">
              <div className="min-w-0 flex-1">
                <p className={`truncate text-[14px] font-medium ${r.active ? "text-ink" : "text-sub line-through"}`}>{r.name}</p>
                <p className="truncate text-[12px] text-sub">{ruleSummary(r)}</p>
              </div>
              <button onClick={() => save.mutate({ id: r.id, active: !r.active })} className={`text-[13px] ${r.active ? "text-sub hover:text-ink" : "text-accent"}`}>
                {r.active ? "ปิด" : "เปิด"}
              </button>
              <button onClick={() => openEdit(r)} className="text-[13px] text-accent">แก้ไข</button>
              <button onClick={() => confirm(`ลบกฎ "${r.name}"?`) && del.mutate(r.id)} className="text-[13px] text-sub hover:text-red-600">ลบ</button>
            </li>
          ))}
        </ul>
      </div>

      {form && (
        <form onSubmit={submit} className="rounded-2xl border border-line bg-white p-6">
          <p className="mb-4 text-[14px] font-semibold text-ink">{form.id ? `แก้ไข: ${form.name || "กฎ"}` : "เพิ่มกฎส่วนลด"}</p>

          <Field label="ชื่อกฎ (แสดงให้ลูกค้าเห็นตอน checkout)">
            <input value={form.name} onChange={set("name")} placeholder="เช่น ซื้อครบ 1,000 ลด 10%" className={inp} />
          </Field>

          <p className="mb-2 mt-5 text-[13px] font-semibold text-ink">เงื่อนไข (เว้นว่าง = ไม่กำหนด)</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="ยอดซื้อขั้นต่ำ (บาท)"><input type="number" min="0" value={form.minSubtotal} onChange={set("minSubtotal")} placeholder="เช่น 1000" className={inp} /></Field>
            <Field label="จำนวนชิ้นขั้นต่ำ"><input type="number" min="0" value={form.minQty} onChange={set("minQty")} placeholder="เช่น 3" className={inp} /></Field>
          </div>

          <p className="mb-2 mt-5 text-[13px] font-semibold text-ink">ส่วนลด</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="ประเภท">
              <select value={form.discountType} onChange={set("discountType")} className={inp}>
                <option value="PERCENT">เปอร์เซ็นต์ (%)</option>
                <option value="FIXED">จำนวนเงิน (บาท)</option>
              </select>
            </Field>
            <Field label={form.discountType === "PERCENT" ? "ลด (%)" : "ลด (บาท)"}><input type="number" min="0" value={form.discountValue} onChange={set("discountValue")} className={inp} /></Field>
            {form.discountType === "PERCENT" && (
              <Field label="เพดานส่วนลด (บาท)"><input type="number" min="0" value={form.maxDiscount} onChange={set("maxDiscount")} placeholder="ไม่จำกัด" className={inp} /></Field>
            )}
          </div>

          <p className="mb-2 mt-5 text-[13px] font-semibold text-ink">ช่วงเวลา (ไม่บังคับ)</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="เริ่ม"><input type="datetime-local" value={form.startAt} onChange={set("startAt")} className={inp} /></Field>
            <Field label="สิ้นสุด"><input type="datetime-local" value={form.endAt} onChange={set("endAt")} className={inp} /></Field>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <label className="flex items-center gap-2 text-[14px] text-ink">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="h-4 w-4 accent-accent" />
              เปิดใช้งาน
            </label>
            <Field label="ลำดับความสำคัญ" inline><input type="number" value={form.priority} onChange={set("priority")} className="w-20 rounded-lg border border-line px-3 py-2 text-[14px] outline-none focus:border-ink/30" /></Field>
          </div>

          {error && <p className="mt-2 text-[13px] text-red-600">{error}</p>}
          <div className="mt-5 flex gap-2">
            <button type="submit" disabled={save.isPending} className="rounded-full bg-accent px-6 py-2.5 text-[14px] font-medium text-white hover:bg-accent/90 disabled:opacity-50">{form.id ? "บันทึก" : "เพิ่มกฎ"}</button>
            <button type="button" onClick={() => setForm(null)} className="rounded-full border border-line px-5 py-2.5 text-[14px] text-ink hover:bg-mist">ยกเลิก</button>
          </div>
        </form>
      )}
    </div>
  );
}

const inp = "w-full rounded-lg border border-line bg-white px-3 py-2 text-[14px] outline-none focus:border-ink/30";
function Field({ label, children, inline }) {
  return (
    <label className={inline ? "flex items-center gap-2" : "block"}>
      <span className={`${inline ? "" : "mb-1 block"} text-[12px] text-sub`}>{label}</span>
      {children}
    </label>
  );
}
