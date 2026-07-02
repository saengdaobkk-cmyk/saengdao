import { useState } from "react";
import { useAdminCoupons, useSaveCoupon, useDeleteCoupon } from "../../api/admin";
import { formatPrice } from "../../lib/format";

const EMPTY = { code: "", type: "PERCENT", value: "", minSubtotal: "", active: true };

export default function AdminCoupons() {
  const { data: coupons, isLoading } = useAdminCoupons();
  const del = useDeleteCoupon();
  const [editing, setEditing] = useState(null);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-[14px] text-sub">{coupons?.length || 0} โค้ด</p>
        <button
          onClick={() => setEditing(EMPTY)}
          className="rounded-full bg-ink px-5 py-2.5 text-[14px] font-medium text-white transition hover:bg-ink/90"
        >
          + เพิ่มโค้ด
        </button>
      </div>

      {isLoading ? (
        <p className="text-sub">กำลังโหลด...</p>
      ) : (
        <div className="space-y-3">
          {coupons.map((c) => (
            <div key={c.id} className="flex items-center gap-4 rounded-2xl border border-line bg-white px-5 py-4">
              <div className="flex-1">
                <p className="text-[15px] font-semibold tracking-wide text-ink">{c.code}</p>
                <p className="text-[12px] text-sub">
                  {c.type === "PERCENT" ? `ลด ${Number(c.value)}%` : `ลด ${formatPrice(c.value)}`}
                  {c.minSubtotal && ` · ขั้นต่ำ ${formatPrice(c.minSubtotal)}`}
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${c.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                {c.active ? "ใช้งาน" : "ปิด"}
              </span>
              <button onClick={() => setEditing(c)} className="text-[13px] text-accent hover:underline">แก้ไข</button>
              <button
                onClick={() => confirm(`ลบโค้ด ${c.code}?`) && del.mutate(c.id)}
                className="text-[13px] text-sub hover:text-red-600"
              >
                ลบ
              </button>
            </div>
          ))}
        </div>
      )}

      {editing && <CouponForm coupon={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function CouponForm({ coupon, onClose }) {
  const save = useSaveCoupon();
  const [form, setForm] = useState({ ...EMPTY, ...coupon, value: coupon.value ?? "", minSubtotal: coupon.minSubtotal ?? "" });
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    setError("");
    save.mutate(form, {
      onSuccess: onClose,
      onError: (err) => setError(err.response?.data?.error || "บันทึกไม่สำเร็จ"),
    });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-5 text-[17px] font-semibold text-ink">{coupon.id ? "แก้ไขโค้ด" : "เพิ่มโค้ดส่วนลด"}</h3>
        <form onSubmit={submit} className="space-y-4">
          <F label="โค้ด *">
            <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} className="w-full rounded-xl border border-line px-4 py-2.5 text-[14px] uppercase outline-none focus:border-ink/30" />
          </F>
          <div className="grid grid-cols-2 gap-4">
            <F label="ประเภท">
              <select value={form.type} onChange={set("type")} className="w-full rounded-xl border border-line px-4 py-2.5 text-[14px] outline-none focus:border-ink/30">
                <option value="PERCENT">เปอร์เซ็นต์ (%)</option>
                <option value="FIXED">จำนวนเงิน (บาท)</option>
              </select>
            </F>
            <F label={form.type === "PERCENT" ? "ลด (%)" : "ลด (บาท)"}>
              <Inp type="number" value={form.value} onChange={set("value")} />
            </F>
          </div>
          <F label="ยอดขั้นต่ำ (บาท) — เว้นว่างได้">
            <Inp type="number" value={form.minSubtotal} onChange={set("minSubtotal")} />
          </F>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="h-4 w-4 accent-accent" />
            <span className="text-[14px] text-ink">เปิดใช้งาน</span>
          </label>

          {error && <p className="text-[13px] text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={save.isPending} className="flex-1 rounded-full bg-accent py-2.5 text-[14px] font-medium text-white transition hover:bg-accent/90 disabled:opacity-50">
              {save.isPending ? "กำลังบันทึก..." : "บันทึก"}
            </button>
            <button type="button" onClick={onClose} className="rounded-full border border-line px-6 py-2.5 text-[14px] text-ink hover:bg-mist">ยกเลิก</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const F = ({ label, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-[12px] font-medium text-sub">{label}</span>
    {children}
  </label>
);
const Inp = (props) => (
  <input {...props} className="w-full rounded-xl border border-line px-4 py-2.5 text-[14px] text-ink outline-none focus:border-ink/30" />
);
