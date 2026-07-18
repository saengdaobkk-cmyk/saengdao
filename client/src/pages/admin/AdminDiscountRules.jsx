import { useState, useMemo } from "react";
import { formatPrice } from "../../lib/format";
import { useDiscountRules, useSaveRule, useDeleteRule } from "../../api/discounts";
import { useAdminBooks } from "../../api/admin";
import { useCategories } from "../../api/books";

const EMPTY = {
  name: "", priority: 0, ruleType: "CART", minSubtotal: "", minQty: "",
  discountType: "PERCENT", discountValue: "", maxDiscount: "",
  bulkTiers: [{ minQty: "", discountType: "PERCENT", discountValue: "", maxDiscount: "" }],
  buyQty: "", getQty: "", getPercent: 100,
  productScope: "ALL", productIds: [], categoryIds: [],
  startAt: "", endAt: "", active: true,
};

const RULE_TYPES = [
  ["CART", "ส่วนลดปกติ"],
  ["BULK", "ขั้นบันได (ตามจำนวน)"],
  ["BOGO", "ซื้อ X แถม/ลด Y"],
];

const toLocalInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

function ruleSummary(r) {
  let core;
  if (r.ruleType === "BOGO") {
    const pct = r.getPercent ?? 100;
    core = `ซื้อ ${r.buyQty} แถม ${r.getQty}${pct < 100 ? ` (ลด ${pct}%)` : ""}`;
  } else if (r.ruleType === "BULK") {
    const n = Array.isArray(r.bulkTiers) ? r.bulkTiers.length : 0;
    core = `ขั้นบันได ${n} ระดับ`;
  } else {
    const cond = [];
    if (Number(r.minSubtotal) > 0) cond.push(`ยอด ≥ ${formatPrice(r.minSubtotal)}`);
    if (Number(r.minQty) > 0) cond.push(`≥ ${r.minQty} ชิ้น`);
    const disc = r.discountType === "PERCENT"
      ? `ลด ${Number(r.discountValue)}%${r.maxDiscount != null ? ` (สูงสุด ${formatPrice(r.maxDiscount)})` : ""}`
      : `ลด ${formatPrice(r.discountValue)}`;
    core = `${cond.length ? cond.join(" · ") + " → " : "ทุกออเดอร์ → "}${disc}`;
  }
  const nItems = (r.productIds?.length || 0) + (r.categoryIds?.length || 0);
  const scope =
    r.productScope === "INCLUDE" ? ` · เฉพาะ ${nItems} รายการ` :
    r.productScope === "EXCLUDE" ? ` · ยกเว้น ${nItems} รายการ` : "";
  return `${core}${scope}`;
}

function ProductPicker({ selected, onChange }) {
  const { data: books = [] } = useAdminBooks();
  const [q, setQ] = useState("");
  const sel = new Set(selected);
  const toggle = (id) => {
    const next = new Set(sel);
    next.has(id) ? next.delete(id) : next.add(id);
    onChange([...next]);
  };
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (books || []).filter((b) => !s || [b.title, b.isbn, b.author].some((x) => x?.toLowerCase().includes(s))).slice(0, 80);
  }, [books, q]);
  return (
    <div className="mt-2 rounded-lg border border-line">
      <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาหนังสือ / ISBN / ผู้เขียน" className="flex-1 bg-transparent text-[13px] outline-none" />
        <span className="shrink-0 text-[12px] text-sub">เลือกแล้ว {selected.length}</span>
      </div>
      <div className="max-h-56 overflow-y-auto p-1">
        {filtered.map((b) => (
          <label key={b.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-mist">
            <input type="checkbox" checked={sel.has(b.id)} onChange={() => toggle(b.id)} className="h-4 w-4 accent-accent" />
            <span className="truncate text-[13px] text-ink">{b.title}</span>
            <span className="ml-auto shrink-0 text-[12px] text-sub">{formatPrice(b.price)}</span>
          </label>
        ))}
        {filtered.length === 0 && <p className="px-2 py-3 text-center text-[12px] text-sub">ไม่พบสินค้า</p>}
      </div>
    </div>
  );
}

function CategoryPicker({ selected, onChange }) {
  const { data: cats = [] } = useCategories();
  const sel = new Set(selected);
  const toggle = (id) => {
    const next = new Set(sel);
    next.has(id) ? next.delete(id) : next.add(id);
    onChange([...next]);
  };
  if (!cats.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {cats.map((c) => {
        const on = sel.has(c.id);
        return (
          <button type="button" key={c.id} onClick={() => toggle(c.id)}
            className={`rounded-full border px-3 py-1.5 text-[13px] transition ${on ? "border-accent bg-accent/10 text-accent" : "border-line text-sub hover:border-ink/25"}`}>
            {c.name}
          </button>
        );
      })}
    </div>
  );
}

export default function AdminDiscountRules() {
  const { data: rules = [], isLoading } = useDiscountRules();
  const save = useSaveRule();
  const del = useDeleteRule();
  const [form, setForm] = useState(null); // null = ปิดฟอร์ม
  const [error, setError] = useState("");

  const openNew = () => { setForm({ ...EMPTY }); setError(""); };
  const openEdit = (r) => {
    const tiers = Array.isArray(r.bulkTiers) && r.bulkTiers.length
      ? r.bulkTiers.map((t) => ({
          minQty: t.minQty ?? "", discountType: t.discountType || "PERCENT",
          discountValue: Number(t.discountValue) || "", maxDiscount: t.maxDiscount != null ? Number(t.maxDiscount) : "",
        }))
      : [{ minQty: "", discountType: "PERCENT", discountValue: "", maxDiscount: "" }];
    setForm({
      id: r.id, name: r.name, priority: r.priority, ruleType: r.ruleType || "CART",
      minSubtotal: Number(r.minSubtotal) || "", minQty: r.minQty || "",
      discountType: r.discountType, discountValue: Number(r.discountValue) || "",
      maxDiscount: r.maxDiscount != null ? Number(r.maxDiscount) : "",
      bulkTiers: tiers,
      buyQty: r.buyQty || "", getQty: r.getQty || "", getPercent: r.getPercent ?? 100,
      productScope: r.productScope || "ALL", productIds: r.productIds || [], categoryIds: r.categoryIds || [],
      startAt: toLocalInput(r.startAt), endAt: toLocalInput(r.endAt), active: r.active,
    });
    setError("");
  };
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setTier = (i, k, v) => setForm((f) => ({ ...f, bulkTiers: f.bulkTiers.map((t, j) => (j === i ? { ...t, [k]: v } : t)) }));
  const addTier = () => setForm((f) => ({ ...f, bulkTiers: [...f.bulkTiers, { minQty: "", discountType: "PERCENT", discountValue: "", maxDiscount: "" }] }));
  const delTier = (i) => setForm((f) => ({ ...f, bulkTiers: f.bulkTiers.filter((_, j) => j !== i) }));

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

          <p className="mb-2 mt-5 text-[13px] font-semibold text-ink">ประเภทกฎ</p>
          <div className="flex flex-wrap gap-2">
            {RULE_TYPES.map(([v, label]) => (
              <button type="button" key={v} onClick={() => setForm((f) => ({ ...f, ruleType: v }))}
                className={`rounded-full border px-4 py-2 text-[13px] transition ${form.ruleType === v ? "border-accent bg-accent/10 text-accent" : "border-line text-sub hover:border-ink/25"}`}>
                {label}
              </button>
            ))}
          </div>

          {form.ruleType === "CART" && (
            <>
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
            </>
          )}

          {form.ruleType === "BULK" && (
            <>
              <p className="mb-1 mt-5 text-[13px] font-semibold text-ink">ราคาขั้นบันได (ยิ่งซื้อมาก ยิ่งลดมาก)</p>
              <p className="mb-2 text-[12px] text-sub">คิดจากจำนวนชิ้นในกลุ่มสินค้าที่เข้าเงื่อนไข — ระบบเลือกขั้นสูงสุดที่ถึงให้อัตโนมัติ</p>
              <div className="space-y-2">
                {form.bulkTiers.map((t, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2">
                    <Field label="ตั้งแต่ (ชิ้น)"><input type="number" min="1" value={t.minQty} onChange={(e) => setTier(i, "minQty", e.target.value)} className={inp} /></Field>
                    <Field label="ประเภท">
                      <select value={t.discountType} onChange={(e) => setTier(i, "discountType", e.target.value)} className={inp}>
                        <option value="PERCENT">%</option>
                        <option value="FIXED">บาท</option>
                      </select>
                    </Field>
                    <Field label={t.discountType === "PERCENT" ? "ลด (%)" : "ลด (บาท)"}><input type="number" min="0" value={t.discountValue} onChange={(e) => setTier(i, "discountValue", e.target.value)} className={inp} /></Field>
                    <button type="button" onClick={() => delTier(i)} disabled={form.bulkTiers.length === 1} className="mb-1 rounded-lg border border-line px-3 py-2 text-[13px] text-sub hover:text-red-600 disabled:opacity-40">ลบ</button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addTier} className="mt-2 text-[13px] text-accent">+ เพิ่มขั้น</button>
            </>
          )}

          {form.ruleType === "BOGO" && (
            <>
              <p className="mb-1 mt-5 text-[13px] font-semibold text-ink">ซื้อ X แถม/ลด Y</p>
              <p className="mb-2 text-[12px] text-sub">เช่น ซื้อ 2 แถม 1 (ลด 100%) — ส่วนลดจะไปตกที่ชิ้นราคาถูกที่สุดในกลุ่ม</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="ซื้อ (ชิ้น)"><input type="number" min="1" value={form.buyQty} onChange={set("buyQty")} placeholder="เช่น 2" className={inp} /></Field>
                <Field label="แถม/ลด (ชิ้น)"><input type="number" min="1" value={form.getQty} onChange={set("getQty")} placeholder="เช่น 1" className={inp} /></Field>
                <Field label="ลดชิ้นที่แถม (%)"><input type="number" min="0" max="100" value={form.getPercent} onChange={set("getPercent")} placeholder="100 = ฟรี" className={inp} /></Field>
              </div>
            </>
          )}

          <p className="mb-2 mt-5 text-[13px] font-semibold text-ink">ขอบเขตสินค้า</p>
          <select value={form.productScope} onChange={set("productScope")} className={inp}>
            <option value="ALL">สินค้าทั้งหมด</option>
            <option value="INCLUDE">เฉพาะสินค้า / หมวดที่กำหนด</option>
            <option value="EXCLUDE">ยกเว้นสินค้า / หมวดที่กำหนด</option>
          </select>
          {form.productScope !== "ALL" && (
            <>
              <p className="mb-1 mt-3 text-[12px] font-medium text-sub">เลือกตามหมวดหมู่</p>
              <CategoryPicker
                selected={form.categoryIds}
                onChange={(ids) => setForm((f) => ({ ...f, categoryIds: ids }))}
              />
              <p className="mb-1 mt-3 text-[12px] font-medium text-sub">หรือเลือกรายเล่ม</p>
              <ProductPicker
                selected={form.productIds}
                onChange={(ids) => setForm((f) => ({ ...f, productIds: ids }))}
              />
            </>
          )}

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
