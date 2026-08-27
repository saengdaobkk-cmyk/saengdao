import { useState } from "react";
import { useAdminRedirects, useSaveRedirect, useDeleteRedirect } from "../../api/admin";

const inp = "w-full rounded-lg border border-line bg-white px-3 py-2 text-[14px] outline-none focus:border-ink/30";

export default function AdminRedirects() {
  const { data: rows = [], isLoading } = useAdminRedirects();
  const save = useSaveRedirect();
  const del = useDeleteRedirect();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [error, setError] = useState("");

  const add = () => {
    setError("");
    if (!from.trim() || !to.trim()) return setError("กรอก URL เดิมและปลายทางให้ครบ");
    save.mutate({ fromPath: from.trim(), toPath: to.trim() }, {
      onSuccess: () => { setFrom(""); setTo(""); },
      onError: (e) => setError(e.response?.data?.error || "บันทึกไม่สำเร็จ"),
    });
  };

  return (
    <div className="space-y-6">
      <p className="max-w-3xl text-[13px] leading-relaxed text-sub">
        ตั้งค่าเปลี่ยนเส้นทางจาก URL เดิม (เว็บเก่า) มาหน้าใหม่ — เช่น <code className="rounded bg-mist px-1">/product/old-book</code> → <code className="rounded bg-mist px-1">/books/new-slug</code> ·
        ช่องปลายทางใส่ได้ทั้ง path (<code>/...</code>) หรือ URL เต็ม (<code>https://...</code>) · เมื่อมีคนเปิด URL เก่า ระบบจะพามาหน้าที่ถูกต้องอัตโนมัติ (กัน 404 + รักษา SEO)
      </p>

      {/* ฟอร์มเพิ่ม */}
      <div className="rounded-2xl border border-line bg-white p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="block">
            <span className="mb-1 block text-[12px] text-sub">URL เดิม (path)</span>
            <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="/product/old-book" className={inp} onKeyDown={(e) => e.key === "Enter" && add()} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] text-sub">ปลายทาง</span>
            <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="/books/new-slug" className={inp} onKeyDown={(e) => e.key === "Enter" && add()} />
          </label>
          <button onClick={add} disabled={save.isPending} className="h-[38px] rounded-full bg-accent px-6 text-[14px] font-medium text-white transition hover:bg-accent/90 disabled:opacity-50">
            + เพิ่ม
          </button>
        </div>
        {error && <p className="mt-2 text-[13px] text-red-600">{error}</p>}
      </div>

      {/* ตาราง */}
      {isLoading ? (
        <p className="text-sub">กำลังโหลด...</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-10 text-center text-[14px] text-sub">ยังไม่มี redirect — เพิ่มด้านบน</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <table className="w-full text-left text-[14px]">
            <thead className="border-b border-line bg-mist/50 text-[12px] text-sub">
              <tr>
                <th className="px-4 py-3 font-medium">URL เดิม</th>
                <th className="px-4 py-3 font-medium">ปลายทาง</th>
                <th className="px-4 py-3 text-center font-medium">ครั้ง</th>
                <th className="px-4 py-3 text-center font-medium">เปิดใช้</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id} className={`hover:bg-mist/30 ${!r.active ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3 font-mono text-[13px] text-ink">{r.fromPath}</td>
                  <td className="px-4 py-3 font-mono text-[13px] text-accent">{r.toPath}</td>
                  <td className="px-4 py-3 text-center tabular-nums text-sub">{r.hits}</td>
                  <td className="px-4 py-3 text-center">
                    <input type="checkbox" checked={r.active} onChange={(e) => save.mutate({ id: r.id, active: e.target.checked })} className="h-4 w-4 cursor-pointer accent-accent" />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button onClick={() => confirm(`ลบ redirect "${r.fromPath}"?`) && del.mutate(r.id)} className="text-[13px] text-sub hover:text-red-600">ลบ</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
