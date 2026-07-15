import { useMemo, useState } from "react";
import { useAdminCustomers, useSaveCustomer, useDeleteCustomer } from "../../api/admin";

const BLANK = { name: "", email: "", phone: "", address: "", receiptName: "", receiptTaxId: "", receiptAddress: "" };

export default function AdminCustomers() {
  const { data: customers, isLoading } = useAdminCustomers();
  const save = useSaveCustomer();
  const del = useDeleteCustomer();

  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null); // customer หรือ null
  const [form, setForm] = useState(BLANK);
  const [error, setError] = useState("");

  const list = useMemo(() => {
    let arr = customers || [];
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      arr = arr.filter((c) => [c.name, c.email, c.phone].some((x) => x?.toLowerCase().includes(s)));
    }
    return arr;
  }, [customers, q]);

  const startEdit = (c) => {
    setEditing(c);
    setForm({
      name: c.name || "", email: c.email || "", phone: c.phone || "", address: c.address || "",
      receiptName: c.receiptName || "", receiptTaxId: c.receiptTaxId || "", receiptAddress: c.receiptAddress || "",
    });
    setError("");
  };
  const cancel = () => { setEditing(null); setForm(BLANK); setError(""); };

  const submit = (e) => {
    e.preventDefault();
    setError("");
    save.mutate({ id: editing.id, ...form }, {
      onSuccess: cancel,
      onError: (err) => setError(err.response?.data?.error || "บันทึกไม่สำเร็จ"),
    });
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* ตารางลูกค้า */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[16px] text-sub">ลูกค้าทั้งหมด {customers && `(${customers.length})`}</p>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาชื่อ/อีเมล/เบอร์..."
            className="w-56 rounded-lg border border-line px-3 py-2 text-[16px] outline-none focus:border-ink/30" />
        </div>
        <div className="w-full overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full text-left text-[17px]">
            <thead className="border-b border-line bg-mist/40 text-[15px] text-sub">
              <tr>
                <th className="px-5 py-3 font-medium">ลูกค้า</th>
                <th className="px-5 py-3 font-medium">เบอร์โทร</th>
                <th className="px-5 py-3 font-medium">คำสั่งซื้อ</th>
                <th className="px-5 py-3 text-right font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {isLoading && <tr><td colSpan={4} className="px-5 py-4 text-sub">กำลังโหลด...</td></tr>}
              {list.map((c) => (
                <tr key={c.id} className="hover:bg-mist/30">
                  <td className="px-5 py-3">
                    <p className="font-medium text-ink">{c.name || "—"}</p>
                    <p className="text-[15px] text-sub">{c.email}</p>
                  </td>
                  <td className="px-5 py-3 text-sub">{c.phone || "—"}</td>
                  <td className="px-5 py-3 text-sub">{c.orderCount || 0}</td>
                  <td className="whitespace-nowrap px-5 py-3">
                    <div className="flex justify-end gap-4">
                      <button onClick={() => startEdit(c)} className="text-[16px] text-accent">แก้ไข</button>
                      <button
                        onClick={() => confirm(`ลบลูกค้า "${c.email}"?`) && del.mutate(c.id, { onError: (e) => alert(e.response?.data?.error || "ลบไม่สำเร็จ") })}
                        className="text-[16px] text-sub hover:text-red-600">ลบ</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && list.length === 0 && <tr><td colSpan={4} className="px-5 py-4 text-sub">{q ? "ไม่พบลูกค้า" : "ยังไม่มีลูกค้า"}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* ฟอร์มแก้ไข (เลือกลูกค้าก่อน) */}
      <div className="h-fit rounded-2xl border border-line bg-white p-5 lg:sticky lg:top-20">
        {editing ? (
          <form onSubmit={submit} className="space-y-3">
            <p className="text-[16px] font-semibold text-ink">แก้ไขลูกค้า</p>
            <Field label="ชื่อ" value={form.name} onChange={set("name")} />
            <Field label="อีเมล" type="email" value={form.email} onChange={set("email")} />
            <Field label="เบอร์โทร" value={form.phone} onChange={set("phone")} />
            <Field label="ที่อยู่จัดส่ง" value={form.address} onChange={set("address")} textarea />
            <div className="border-t border-line pt-3">
              <p className="mb-2 text-[15px] font-medium text-sub">ข้อมูลใบเสร็จ/ใบกำกับภาษี</p>
              <Field label="ชื่อออกใบเสร็จ" value={form.receiptName} onChange={set("receiptName")} />
              <Field label="เลขผู้เสียภาษี (13 หลัก)" value={form.receiptTaxId} onChange={set("receiptTaxId")} />
              <Field label="ที่อยู่ใบเสร็จ" value={form.receiptAddress} onChange={set("receiptAddress")} textarea />
            </div>
            {error && <p className="text-[15px] text-red-600">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={save.isPending} className="rounded-full bg-accent px-5 py-2 text-[16px] font-medium text-white hover:bg-accent/90 disabled:opacity-50">บันทึก</button>
              <button type="button" onClick={cancel} className="rounded-full border border-line px-4 py-2 text-[16px] text-ink hover:bg-mist">ยกเลิก</button>
            </div>
          </form>
        ) : (
          <p className="py-6 text-center text-[16px] text-sub">เลือกลูกค้าจากตาราง<br />แล้วกด "แก้ไข" เพื่อดู/แก้ข้อมูล</p>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", textarea }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[15px] text-sub">{label}</span>
      {textarea ? (
        <textarea value={value} onChange={onChange} rows={2}
          className="w-full resize-none rounded-lg border border-line bg-white px-3 py-2 text-[17px] outline-none focus:border-ink/30" />
      ) : (
        <input type={type} value={value} onChange={onChange}
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-[17px] outline-none focus:border-ink/30" />
      )}
    </label>
  );
}
