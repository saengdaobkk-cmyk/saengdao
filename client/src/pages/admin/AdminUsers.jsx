import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { useAdminUsers, useSaveUser, useDeleteUser } from "../../api/admin";

const ROLE_META = {
  ADMIN: { label: "แอดมินเต็ม", cls: "bg-ink text-white", desc: "เข้าถึงทุกเมนู + จัดการผู้ใช้" },
  STAFF: { label: "พนักงาน", cls: "bg-indigo-100 text-indigo-700", desc: "สินค้า / คำสั่งซื้อ / Collection" },
  USER: { label: "ลูกค้า", cls: "bg-gray-100 text-gray-500", desc: "ซื้อของหน้าร้าน (ไม่เข้าหลังบ้าน)" },
};
const EMPTY = { email: "", name: "", password: "", role: "STAFF" };

export default function AdminUsers() {
  const { user: me } = useAuth();
  const { data: users, isLoading } = useAdminUsers();
  const save = useSaveUser();
  const del = useDeleteUser();

  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null); // user object หรือ null
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    setError("");
    const payload = editing
      ? { id: editing.id, name: form.name, role: form.role, ...(form.password ? { password: form.password } : {}) }
      : form;
    save.mutate(payload, {
      onSuccess: () => { setForm(EMPTY); setEditing(null); },
      onError: (err) => setError(err.response?.data?.error || "บันทึกไม่สำเร็จ"),
    });
  };

  const startEdit = (u) => { setEditing(u); setForm({ email: u.email, name: u.name || "", password: "", role: u.role }); setError(""); };
  const cancel = () => { setEditing(null); setForm(EMPTY); setError(""); };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* ตารางผู้ใช้ */}
      <div className="w-full overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-left text-[15px]">
          <thead className="border-b border-line bg-mist/40 text-[13px] text-sub">
            <tr>
              <th className="px-5 py-3 font-medium">ผู้ใช้</th>
              <th className="px-5 py-3 font-medium">สิทธิ์</th>
              <th className="px-5 py-3 font-medium">คำสั่งซื้อ</th>
              <th className="px-5 py-3 text-right font-medium">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {isLoading && <tr><td colSpan={4} className="px-5 py-4 text-sub">กำลังโหลด...</td></tr>}
            {users?.map((u) => {
              const meta = ROLE_META[u.role] || ROLE_META.USER;
              const self = u.id === me?.id;
              return (
                <tr key={u.id} className="hover:bg-mist/30">
                  <td className="px-5 py-3">
                    <p className="font-medium text-ink">{u.name || "—"} {self && <span className="text-[12px] text-sub">(คุณ)</span>}</p>
                    <p className="text-[13px] text-sub">{u.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[12px] font-medium ${meta.cls}`}>{meta.label}</span>
                  </td>
                  <td className="px-5 py-3 text-sub">{u.orderCount || 0}</td>
                  <td className="whitespace-nowrap px-5 py-3">
                    <div className="flex justify-end gap-4">
                      <button onClick={() => startEdit(u)} className="text-[14px] text-accent">แก้ไข</button>
                      <button
                        disabled={self}
                        onClick={() => confirm(`ลบผู้ใช้ "${u.email}"?`) && del.mutate(u.id, { onError: (e) => alert(e.response?.data?.error || "ลบไม่สำเร็จ") })}
                        className="text-[14px] text-sub hover:text-red-600 disabled:opacity-30">ลบ</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {users?.length === 0 && <tr><td colSpan={4} className="px-5 py-4 text-sub">ยังไม่มีผู้ใช้</td></tr>}
          </tbody>
        </table>
      </div>

      {/* ฟอร์มเพิ่ม/แก้ไข */}
      <form onSubmit={submit} className="h-fit space-y-3 rounded-2xl border border-line bg-white p-5 lg:sticky lg:top-20">
        <p className="text-[14px] font-semibold text-ink">{editing ? `แก้ไข: ${editing.email}` : "เพิ่มผู้ใช้ใหม่"}</p>

        <label className="block">
          <span className="mb-1 block text-[13px] text-sub">อีเมล</span>
          <input type="email" value={form.email} disabled={!!editing} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="staff@saengdao.com" className="w-full rounded-lg border border-line bg-white px-3 py-2 text-[15px] outline-none focus:border-ink/30 disabled:bg-mist disabled:text-sub" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[13px] text-sub">ชื่อ</span>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="ชื่อ-นามสกุล" className="w-full rounded-lg border border-line bg-white px-3 py-2 text-[15px] outline-none focus:border-ink/30" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[13px] text-sub">{editing ? "รหัสผ่านใหม่ (เว้นว่าง = คงเดิม)" : "รหัสผ่าน"}</span>
          <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="อย่างน้อย 6 ตัวอักษร" className="w-full rounded-lg border border-line bg-white px-3 py-2 text-[15px] outline-none focus:border-ink/30" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[13px] text-sub">สิทธิ์</span>
          <select value={form.role} disabled={editing?.id === me?.id} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-[15px] outline-none focus:border-ink/30 disabled:bg-mist">
            <option value="STAFF">พนักงาน — สินค้า/คำสั่งซื้อ/Collection</option>
            <option value="ADMIN">แอดมินเต็ม — ทุกเมนู</option>
          </select>
          <span className="mt-1 block text-[12px] text-sub/70">{ROLE_META[form.role]?.desc}</span>
        </label>

        {error && <p className="text-[13px] text-red-600">{error}</p>}
        <div className="flex gap-2 pt-1">
          <button type="submit" disabled={save.isPending} className="rounded-full bg-accent px-5 py-2 text-[14px] font-medium text-white hover:bg-accent/90 disabled:opacity-50">{editing ? "บันทึก" : "เพิ่มผู้ใช้"}</button>
          {editing && <button type="button" onClick={cancel} className="rounded-full border border-line px-4 py-2 text-[14px] text-ink hover:bg-mist">ยกเลิก</button>}
        </div>
      </form>
    </div>
  );
}
