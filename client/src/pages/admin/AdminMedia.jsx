import { useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMedia, uploadImage, uploadPdf } from "../../api/admin";
import { api } from "../../lib/api";

const isImage = (k) => /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(k);
const isPdf = (k) => /\.pdf$/i.test(k);
const fmtSize = (b) => (b >= 1024 * 1024 ? (b / 1024 / 1024).toFixed(2) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB");
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" }) : "—");

export default function AdminMedia() {
  const { data: files = [], isLoading } = useMedia();
  const qc = useQueryClient();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [sel, setSel] = useState(() => new Set());
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [preview, setPreview] = useState(null);
  const [page, setPage] = useState(1);
  const PER = 100;

  const list = useMemo(() => {
    if (!q.trim()) return files;
    const s = q.trim().toLowerCase();
    return files.filter((f) => f.key.toLowerCase().includes(s));
  }, [files, q]);

  const totalPages = Math.max(1, Math.ceil(list.length / PER));
  const curPage = Math.min(page, totalPages);
  const pageItems = list.slice((curPage - 1) * PER, curPage * PER);

  const allSelected = pageItems.length > 0 && pageItems.every((f) => sel.has(f.key));
  const toggle = (key) => setSel((p) => { const n = new Set(p); n.has(key) ? n.delete(key) : n.add(key); return n; });
  const toggleAll = () => setSel((p) => {
    const n = new Set(p);
    if (allSelected) pageItems.forEach((f) => n.delete(f.key));
    else pageItems.forEach((f) => n.add(f.key));
    return n;
  });

  const onFiles = async (e) => {
    const picked = [...(e.target.files || [])];
    e.target.value = "";
    if (!picked.length) return;
    setUploading(true); setError("");
    try {
      for (const f of picked) f.type === "application/pdf" ? await uploadPdf(f) : await uploadImage(f);
      qc.invalidateQueries({ queryKey: ["admin", "media"] });
    } catch (err) { setError(err.response?.data?.error || "อัปโหลดไม่สำเร็จ"); }
    finally { setUploading(false); }
  };

  const copy = (url) => { navigator.clipboard?.writeText(url).catch(() => {}); setCopied(url); setTimeout(() => setCopied(""), 1500); };

  const delKeys = async (keys, warn) => {
    if (!keys.length || !confirm(warn)) return;
    setBusy(true);
    try { for (const k of keys) await api.delete("/admin/media", { data: { key: k } }); }
    catch (err) { alert(err.response?.data?.error || "ลบไม่สำเร็จ"); }
    finally { setBusy(false); setSel(new Set()); qc.invalidateQueries({ queryKey: ["admin", "media"] }); }
  };
  const delOne = (f) => delKeys([f.key], f.refs > 0
    ? `⚠️ ไฟล์นี้ถูกใช้อยู่ ${f.refs} ที่ — ลบแล้วรูปจะหายจากที่นั่นด้วย!\n\n${f.key}\n\nยืนยันลบ?`
    : `ลบไฟล์นี้?\n${f.key}`);
  const delSelected = () => {
    const keys = list.filter((f) => sel.has(f.key)).map((f) => f.key);
    const used = list.filter((f) => sel.has(f.key) && f.refs > 0).length;
    delKeys(keys, `ลบ ${keys.length} ไฟล์ที่เลือก?${used ? `\n\n⚠️ มี ${used} ไฟล์ที่ถูกใช้งานอยู่ — รูปจะหายจากที่นั่นด้วย` : ""}`);
  };

  return (
    <div className="space-y-4">
      {/* แถบบน */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="ค้นหาชื่อไฟล์..."
          className="w-64 rounded-lg border border-line px-3 py-2 text-[13px] outline-none focus:border-ink/30" />
        <div>
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="rounded-full bg-ink px-5 py-2.5 text-[14px] font-medium text-white transition hover:bg-ink/90 disabled:opacity-50">
            {uploading ? "กำลังอัปโหลด..." : "+ อัปโหลดไฟล์"}
          </button>
          <input ref={fileRef} type="file" accept="image/*,application/pdf" multiple onChange={onFiles} className="hidden" />
        </div>
      </div>
      {error && <p className="text-[13px] text-red-600">{error}</p>}

      {/* แถบเลือกหลายไฟล์ */}
      {sel.size > 0 && (
        <div className="flex items-center gap-4 rounded-xl border border-line bg-mist/50 px-4 py-2.5">
          <span className="text-[13px] font-medium text-ink">เลือก {sel.size} ไฟล์</span>
          <button onClick={delSelected} disabled={busy} className="text-[13px] font-medium text-red-600 hover:text-red-700 disabled:opacity-50">ลบที่เลือก</button>
          <button onClick={() => setSel(new Set())} className="text-[13px] text-sub hover:text-ink">ยกเลิก</button>
        </div>
      )}

      {isLoading ? (
        <p className="text-sub">กำลังโหลด...</p>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-12 text-center text-[14px] text-sub">{q ? "ไม่พบไฟล์ที่ค้นหา" : "ยังไม่มีไฟล์ — กด “อัปโหลดไฟล์” ด้านบน"}</div>
      ) : (
        <div className="w-full overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[640px] text-left text-[14px]">
            <thead className="border-b border-line bg-mist/40 text-[12px] text-sub">
              <tr>
                <th className="w-10 px-4 py-3"><input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 cursor-pointer accent-accent" /></th>
                <th className="px-3 py-3 font-medium">ชื่อไฟล์</th>
                <th className="px-3 py-3 font-medium">วันที่เพิ่ม</th>
                <th className="px-3 py-3 text-right font-medium">ขนาด</th>
                <th className="px-3 py-3 font-medium">References</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {pageItems.map((f) => (
                <tr key={f.key} className={`transition hover:bg-mist/30 ${sel.has(f.key) ? "bg-accent/5" : ""}`}>
                  <td className="px-4 py-2.5"><input type="checkbox" checked={sel.has(f.key)} onChange={() => toggle(f.key)} className="h-4 w-4 cursor-pointer accent-accent" /></td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <button type="button"
                        onClick={() => (isImage(f.key) ? setPreview(f) : window.open(f.url, "_blank", "noopener"))}
                        className="flex h-11 w-11 shrink-0 cursor-zoom-in items-center justify-center overflow-hidden rounded-md border border-line bg-mist transition hover:ring-2 hover:ring-accent/40">
                        {isImage(f.key) ? <img src={f.url} alt="" loading="lazy" className="h-full w-full object-cover" /> : <PdfIcon />}
                      </button>
                      <a href={f.url} target="_blank" rel="noreferrer" className="min-w-0 truncate font-medium text-ink hover:text-accent" title={f.key}>{f.key.split("/").pop()}</a>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-[13px] text-sub">{fmtDate(f.createdAt)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right text-[13px] text-sub">{fmtSize(f.size)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-[13px]">
                    {f.refs > 0 ? <span className="text-ink">ใช้อยู่ {f.refs} ที่</span> : <span className="text-sub/50">—</span>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => copy(f.url)} className="text-[12px] text-accent hover:underline">{copied === f.url ? "คัดลอกแล้ว ✓" : "คัดลอก"}</button>
                      <button onClick={() => delOne(f)} disabled={busy} className="text-[12px] text-sub hover:text-red-600 disabled:opacity-50">ลบ</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-6">
          <button disabled={curPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="text-[14px] text-sub transition hover:text-ink disabled:opacity-30">← ก่อนหน้า</button>
          <span className="text-[13px] tabular-nums text-sub">{curPage} / {totalPages}</span>
          <button disabled={curPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="text-[14px] text-sub transition hover:text-ink disabled:opacity-30">ถัดไป →</button>
        </div>
      )}
      <p className="text-[12px] text-sub">
        ไฟล์ทั้งหมด {files.length} ไฟล์ — ปกหนังสือ / แบนเนอร์ / สไลด์ / PDF
        {list.length > 0 && ` · แสดง ${(curPage - 1) * PER + 1}–${Math.min(curPage * PER, list.length)} จาก ${list.length}`}
      </p>

      {/* ขยายรูป (lightbox) */}
      {preview && (
        <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-ink/70 p-6 backdrop-blur-sm" onClick={() => setPreview(null)}>
          <img src={preview.url} alt={preview.key} onClick={(e) => e.stopPropagation()} className="max-h-[80vh] max-w-full rounded-xl object-contain shadow-2xl" />
          <div className="mt-4 flex items-center gap-4 text-[13px] text-white" onClick={(e) => e.stopPropagation()}>
            <span className="max-w-[60vw] truncate">{preview.key.split("/").pop()}</span>
            <button onClick={() => copy(preview.url)} className="text-white/80 hover:text-white">{copied === preview.url ? "คัดลอกแล้ว ✓" : "คัดลอก URL"}</button>
            <button onClick={() => setPreview(null)} className="text-white/80 hover:text-white">ปิด ✕</button>
          </div>
        </div>
      )}
    </div>
  );
}

function PdfIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-sub">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" />
    </svg>
  );
}
