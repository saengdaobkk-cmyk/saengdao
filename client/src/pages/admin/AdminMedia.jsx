import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMedia, useDeleteMedia, uploadImage, uploadPdf } from "../../api/admin";

const isImage = (k) => /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(k);
const isPdf = (k) => /\.pdf$/i.test(k);
const fmtSize = (b) => (b >= 1024 * 1024 ? (b / 1024 / 1024).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB");

export default function AdminMedia() {
  const { data: files = [], isLoading } = useMedia();
  const del = useDeleteMedia();
  const qc = useQueryClient();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  const onFiles = async (e) => {
    const list = [...(e.target.files || [])];
    e.target.value = "";
    if (!list.length) return;
    setUploading(true);
    setError("");
    try {
      for (const f of list) {
        if (f.type === "application/pdf") await uploadPdf(f);
        else await uploadImage(f);
      }
      qc.invalidateQueries({ queryKey: ["admin", "media"] });
    } catch (err) {
      setError(err.response?.data?.error || "อัปโหลดไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  };

  const copy = (url) => {
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopied(url);
    setTimeout(() => setCopied(""), 1500);
  };
  const remove = (f) => {
    const msg = f.refs > 0
      ? `⚠️ ไฟล์นี้ถูกใช้อยู่ ${f.refs} ที่ (สินค้า/สไลด์/แบนเนอร์ ฯลฯ)\nลบแล้วรูปจะหายจากที่นั่นด้วย!\n\n${f.key}\n\nยืนยันลบ?`
      : `ลบไฟล์นี้?\n${f.key}`;
    if (confirm(msg)) del.mutate(f.key);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-sub">ไฟล์ทั้งหมด {files.length} ไฟล์ — ปกหนังสือ / แบนเนอร์ / สไลด์ / PDF</p>
        <div>
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="rounded-full bg-ink px-5 py-2.5 text-[14px] font-medium text-white transition hover:bg-ink/90 disabled:opacity-50">
            {uploading ? "กำลังอัปโหลด..." : "+ อัปโหลดไฟล์"}
          </button>
          <input ref={fileRef} type="file" accept="image/*,application/pdf" multiple onChange={onFiles} className="hidden" />
        </div>
      </div>
      {error && <p className="text-[13px] text-red-600">{error}</p>}

      {isLoading ? (
        <p className="text-sub">กำลังโหลด...</p>
      ) : files.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-12 text-center text-[14px] text-sub">ยังไม่มีไฟล์ — กด “อัปโหลดไฟล์” ด้านบน</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {files.map((f) => (
            <div key={f.key} className="overflow-hidden rounded-xl border border-line bg-white">
              <div className="relative flex aspect-square items-center justify-center bg-mist">
                {isImage(f.key) ? (
                  <img src={f.url} alt="" loading="lazy" className="h-full w-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-sub">
                    <PdfIcon />
                    <span className="text-[11px] font-medium">{isPdf(f.key) ? "PDF" : "ไฟล์"}</span>
                  </div>
                )}
                <button onClick={() => remove(f)} disabled={del.isPending} aria-label="ลบ"
                  className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-sub shadow transition hover:bg-red-500 hover:text-white">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>
                </button>
              </div>
              <div className="p-2">
                <p className="truncate text-[11px] text-sub" title={f.key}>{f.key.split("/").pop()}</p>
                <div className="mt-1 flex items-center justify-between gap-1">
                  <span className="shrink-0 text-[10px] text-sub/70">{fmtSize(f.size)}</span>
                  {f.refs > 0 ? (
                    <span className="shrink-0 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700" title="ถูกใช้งานอยู่">ใช้อยู่ {f.refs}</span>
                  ) : (
                    <span className="shrink-0 text-[10px] text-sub/60" title="ไม่พบการใช้งาน">ไม่ถูกใช้</span>
                  )}
                </div>
                <button onClick={() => copy(f.url)} className="mt-1 block w-full truncate text-left text-[11px] text-accent hover:underline">{copied === f.url ? "คัดลอกแล้ว ✓" : "คัดลอก URL"}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PdfIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" />
    </svg>
  );
}
