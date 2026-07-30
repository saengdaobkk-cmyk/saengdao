import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { useAdminBlog, useSaveBlogPost, useDeleteBlogPost } from "../../api/blog";
import { uploadImage } from "../../api/admin";
import { MD_COMPONENTS } from "../BlogPost";

const inp = "w-full rounded-lg border border-line bg-white px-3 py-2 text-[14px] outline-none focus:border-ink/30";
const EMPTY = { title: "", slug: "", excerpt: "", coverImage: "", content: "", author: "", published: false };
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" }) : "—");

export default function AdminBlog() {
  const { data: posts, isLoading } = useAdminBlog();
  const save = useSaveBlogPost();
  const del = useDeleteBlogPost();
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [imgBusy, setImgBusy] = useState(false);
  const contentRef = useRef(null);

  // แก้ไขข้อความในช่องเนื้อหา (คงตำแหน่งเคอร์เซอร์)
  const applyEdit = (fn) => {
    const el = contentRef.current;
    if (!el) return;
    const { text, selStart, selEnd } = fn(form.content || "", el.selectionStart, el.selectionEnd);
    setForm((f) => ({ ...f, content: text }));
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(selStart, selEnd); });
  };
  const wrap = (before, after = before) => applyEdit((val, s, e) => {
    const sel = val.slice(s, e) || "ข้อความ";
    return { text: val.slice(0, s) + before + sel + after + val.slice(e), selStart: s + before.length, selEnd: s + before.length + sel.length };
  });
  const linePrefix = (prefix) => applyEdit((val, s, e) => {
    const ls = val.lastIndexOf("\n", s - 1) + 1;
    return { text: val.slice(0, ls) + prefix + val.slice(ls), selStart: s + prefix.length, selEnd: e + prefix.length };
  });
  const insert = (str) => applyEdit((val, s) => ({ text: val.slice(0, s) + str + val.slice(s), selStart: s + str.length, selEnd: s + str.length }));

  const onInsertImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImgBusy(true);
    try {
      const url = await uploadImage(file);
      insert(`\n\n![](${url})\n\n`);
    } catch { /* */ } finally { setImgBusy(false); }
  };

  const openNew = () => { setForm({ ...EMPTY }); setError(""); };
  const openEdit = (p) => {
    setForm({ id: p.id, title: p.title, slug: p.slug || "", excerpt: p.excerpt || "", coverImage: p.coverImage || "", content: p.content || "", author: p.author || "", published: p.published });
    setError("");
  };
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onCover = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setForm((f) => ({ ...f, coverImage: url }));
    } catch { /* */ } finally { setUploading(false); }
  };

  const submit = (e) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) return setError("กรอกหัวข้อบทความ");
    save.mutate(form, { onSuccess: () => setForm(null), onError: (err) => setError(err.response?.data?.error || "บันทึกไม่สำเร็จ") });
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] text-sub">บทความ/บล็อก — แสดงที่หน้า /blog · เผยแพร่แล้วเท่านั้นที่ลูกค้าเห็น</p>
        <button onClick={openNew} className="shrink-0 rounded-full bg-ink px-5 py-2.5 text-[14px] font-medium text-white transition hover:bg-ink/90">+ เขียนบทความ</button>
      </div>

      <div className="rounded-2xl border border-line bg-white">
        {isLoading && <p className="px-4 py-3 text-[14px] text-sub">กำลังโหลด...</p>}
        {!isLoading && !posts?.length && <p className="px-4 py-8 text-center text-[14px] text-sub">ยังไม่มีบทความ</p>}
        <ul className="divide-y divide-line">
          {posts?.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-4 py-3">
              <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-mist">
                {p.coverImage && <img src={p.coverImage} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium text-ink">{p.title}</p>
                <p className="text-[12px] text-sub">{fmtDate(p.publishedAt || p.createdAt)}{p.author ? ` · ${p.author}` : ""}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${p.published ? "bg-emerald-100 text-emerald-700" : "bg-mist text-sub"}`}>
                {p.published ? "เผยแพร่" : "ฉบับร่าง"}
              </span>
              <button onClick={() => openEdit(p)} className="text-[13px] text-accent">แก้ไข</button>
              <button onClick={() => confirm(`ลบบทความ "${p.title}"?`) && del.mutate(p.id)} className="text-[13px] text-sub hover:text-red-600">ลบ</button>
            </li>
          ))}
        </ul>
      </div>

      {form && (
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-line bg-white p-6">
          <p className="text-[14px] font-semibold text-ink">{form.id ? "แก้ไขบทความ" : "เขียนบทความใหม่"}</p>

          <Field label="หัวข้อ"><input value={form.title} onChange={set("title")} placeholder="เช่น 5 หนังสือที่เปลี่ยนความคิด" className={inp} /></Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Slug (URL — เว้นว่างได้)"><input value={form.slug} onChange={set("slug")} placeholder="books-changed-my-mind" className={inp} /></Field>
            <Field label="ผู้เขียน"><input value={form.author} onChange={set("author")} placeholder="ชื่อผู้เขียน" className={inp} /></Field>
          </div>

          <Field label="คำโปรย (แสดงในหน้ารายการ)"><textarea value={form.excerpt} onChange={set("excerpt")} rows={2} className={`${inp} resize-none`} /></Field>

          <Field label="รูปปก">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-24 w-40 items-center justify-center overflow-hidden rounded-xl border border-line bg-mist">
                {form.coverImage ? <img src={form.coverImage} alt="ปก" className="h-full w-full object-cover" /> : <span className="text-[12px] text-sub">ยังไม่มีรูป</span>}
              </div>
              <label className="cursor-pointer rounded-full border border-line px-5 py-2.5 text-[14px] font-medium text-ink transition hover:bg-mist">
                {uploading ? "กำลังอัปโหลด..." : form.coverImage ? "เปลี่ยนรูป" : "อัปโหลดรูป"}
                <input type="file" accept="image/*" onChange={onCover} className="hidden" />
              </label>
              {form.coverImage && <button type="button" onClick={() => setForm((f) => ({ ...f, coverImage: "" }))} className="text-[13px] text-sub hover:text-red-600">ลบรูป</button>}
            </div>
          </Field>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[12px] text-sub">เนื้อหา (Markdown — หัวข้อย่อย/ตัวหนา/รูป)</span>
              <button type="button" onClick={() => setPreview((v) => !v)} className="text-[12px] font-medium text-accent">
                {preview ? "← แก้ไข" : "ดูตัวอย่าง →"}
              </button>
            </div>
            {preview ? (
              <div className="min-h-[280px] space-y-4 rounded-lg border border-line bg-white px-4 py-3">
                {form.content?.trim()
                  ? <ReactMarkdown components={MD_COMPONENTS}>{form.content}</ReactMarkdown>
                  : <p className="text-[13px] text-sub">ยังไม่มีเนื้อหา</p>}
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-1 rounded-t-lg border border-b-0 border-line bg-mist/50 px-2 py-1.5">
                  <TB onClick={() => linePrefix("## ")}>หัวข้อย่อย</TB>
                  <TB onClick={() => linePrefix("### ")}>หัวข้อรอง</TB>
                  <span className="mx-1 h-4 w-px bg-line" />
                  <TB onClick={() => wrap("**")} className="font-bold">B</TB>
                  <TB onClick={() => wrap("*")} className="italic">I</TB>
                  <TB onClick={() => linePrefix("- ")}>• รายการ</TB>
                  <TB onClick={() => wrap("[", "](https://)")}>ลิงก์</TB>
                  <span className="mx-1 h-4 w-px bg-line" />
                  <label className="cursor-pointer rounded px-2 py-1 text-[12px] text-ink transition hover:bg-white">
                    {imgBusy ? "อัปโหลด..." : "🖼 แทรกรูป"}
                    <input type="file" accept="image/*" onChange={onInsertImage} className="hidden" />
                  </label>
                </div>
                <textarea
                  ref={contentRef}
                  value={form.content}
                  onChange={set("content")}
                  rows={14}
                  placeholder={"เขียนบทความ...\n\n## หัวข้อย่อย\nเนื้อหา **ตัวหนา** และ *ตัวเอียง*\n\n![](แทรกรูปด้วยปุ่มด้านบน)"}
                  className={`${inp} resize-y rounded-t-none font-mono text-[13px] leading-relaxed`}
                />
                <p className="mt-1 text-[11px] text-sub">รองรับ Markdown · เว้นบรรทัดว่างเพื่อขึ้นย่อหน้าใหม่</p>
              </>
            )}
          </div>

          <label className="flex items-center gap-2 text-[14px] text-ink">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} className="h-4 w-4 accent-accent" />
            เผยแพร่ (ให้ลูกค้าเห็น)
          </label>

          {error && <p className="text-[13px] text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={save.isPending} className="rounded-full bg-accent px-6 py-2.5 text-[14px] font-medium text-white hover:bg-accent/90 disabled:opacity-50">{form.id ? "บันทึก" : "สร้างบทความ"}</button>
            <button type="button" onClick={() => setForm(null)} className="rounded-full border border-line px-5 py-2.5 text-[14px] text-ink hover:bg-mist">ยกเลิก</button>
          </div>
        </form>
      )}
    </div>
  );
}

function TB({ onClick, children, className = "" }) {
  return (
    <button type="button" onClick={onClick} className={`rounded px-2 py-1 text-[12px] text-ink transition hover:bg-white ${className}`}>
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] text-sub">{label}</span>
      {children}
    </label>
  );
}
