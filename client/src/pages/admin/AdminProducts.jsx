import { useMemo, useState } from "react";
import { useAdminBooks, useSaveBook, useDeleteBook, uploadImage, uploadImages, uploadPdf } from "../../api/admin";
import { useCategories, useTermList } from "../../api/books";
import { formatPrice } from "../../lib/format";
import ImportBooks from "./ImportBooks";

const EMPTY = {
  title: "", author: "", translator: "", categoryId: "", tags: [], description: "",
  price: "", discountPrice: "", stock: "", featured: false, coverImage: "", backCoverImage: "",
  galleryImages: [], previewPdf: "", publisher: "", edition: "", pageCount: "", dimensions: "",
  weight: "", paperType: "", coverType: "", isbn: "", sku: "", metaTitle: "", metaDescription: "",
  slug: "", importedAt: "", variants: [],
};

export default function AdminProducts() {
  const { data: books, isLoading } = useAdminBooks();
  const { data: categories } = useCategories();
  const del = useDeleteBook();
  const [editing, setEditing] = useState(null);
  const [importing, setImporting] = useState(false);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [status, setStatus] = useState("");

  const filtered = useMemo(() => {
    let list = books || [];
    if (q) {
      const s = q.toLowerCase();
      list = list.filter((b) => [b.title, b.isbn, b.author].some((x) => x?.toLowerCase().includes(s)));
    }
    if (cat) list = list.filter((b) => b.category?.name === cat || b.categoryId === cat);
    if (status === "instock") list = list.filter((b) => b.stock > 0);
    if (status === "out") list = list.filter((b) => b.stock <= 0);
    if (status === "featured") list = list.filter((b) => b.featured);
    return list;
  }, [books, q, cat, status]);

  if (editing) return <BookForm book={editing} categories={categories || []} onClose={() => setEditing(null)} />;

  return (
    <div>
      {/* หัว + filters */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <h2 className="mr-2 text-[15px] font-semibold text-ink">หนังสือทั้งหมด ({books?.length || 0})</h2>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาชื่อ / ISBN / ผู้เขียน..."
          className="w-56 rounded-lg border border-line px-3 py-2 text-[13px] outline-none focus:border-ink/30" />
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="rounded-lg border border-line px-3 py-2 text-[13px] outline-none focus:border-ink/30">
          <option value="">ทุกหมวด</option>
          {categories?.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-line px-3 py-2 text-[13px] outline-none focus:border-ink/30">
          <option value="">ทุกสถานะ</option>
          <option value="instock">มีสต็อก</option>
          <option value="out">สินค้าหมด</option>
          <option value="featured">แนะนำหน้าแรก</option>
        </select>
        <div className="ml-auto flex gap-2">
          <button onClick={() => setImporting(true)} className="rounded-full border border-line px-5 py-2.5 text-[14px] font-medium text-ink transition hover:bg-mist">
            ⬆ นำเข้า CSV/Excel
          </button>
          <button onClick={() => setEditing(EMPTY)} className="rounded-full bg-accent px-5 py-2.5 text-[14px] font-medium text-white transition hover:bg-accent/90">
            + เพิ่มหนังสือ
          </button>
        </div>
      </div>

      {importing && <ImportBooks onClose={() => setImporting(false)} />}

      {isLoading ? (
        <p className="text-sub">กำลังโหลด...</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full text-left text-[14px]">
            <thead className="border-b border-line bg-mist/50 text-[12px] text-sub">
              <tr>
                <th className="px-4 py-3 font-medium">รหัส (ISBN)</th>
                <th className="px-4 py-3 font-medium">ชื่อสินค้า</th>
                <th className="px-4 py-3 font-medium">หมวดหมู่</th>
                <th className="px-4 py-3 font-medium">ราคา</th>
                <th className="px-4 py-3 font-medium">สต็อก</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-mist/30">
                  <td className="px-4 py-3 text-[12px] text-sub">{b.isbn || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-9 shrink-0 items-center justify-center overflow-hidden rounded bg-mist">
                        {b.coverImage ? <img src={b.coverImage} alt="" className="h-full w-full object-cover" /> : <span className="text-[10px] opacity-30">𝐀</span>}
                      </div>
                      <div>
                        <p className="font-medium text-ink">{b.title}</p>
                        <div className="mt-0.5 flex flex-wrap gap-1">
                          {b.featured && <Tag color="indigo">แนะนำ</Tag>}
                          {b.discountPrice != null && <Tag color="rose">ลดราคา</Tag>}
                          {(b.tags || []).map((t) => <Tag key={t} color="gray">{t}</Tag>)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sub">{b.category?.name || "—"}</td>
                  <td className="px-4 py-3">
                    {b.discountPrice != null ? (
                      <span><span className="text-ink">{formatPrice(b.discountPrice)}</span> <span className="text-[11px] text-sub line-through">{formatPrice(b.price)}</span></span>
                    ) : <span className="text-ink">{formatPrice(b.price)}</span>}
                  </td>
                  <td className={`px-4 py-3 ${b.stock <= 5 ? "text-amber-600" : "text-ink"}`}>{b.stock}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button onClick={() => setEditing(b)} className="rounded-lg border border-line px-3 py-1 text-[12px] text-ink hover:bg-mist">แก้ไข</button>
                    <button onClick={() => confirm(`ลบ "${b.title}"?`) && del.mutate(b.id, { onError: (e) => alert(e.response?.data?.error || "ลบไม่สำเร็จ") })}
                      className="ml-2 rounded-lg border border-line px-3 py-1 text-[12px] text-sub hover:text-red-600">ลบ</button>
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

function Tag({ children, color }) {
  const c = { indigo: "bg-indigo-50 text-indigo-600", rose: "bg-rose-50 text-rose-500", gray: "bg-gray-100 text-gray-500" }[color];
  return <span className={`rounded px-1.5 py-0.5 text-[10px] ${c}`}>{children}</span>;
}

/* ============ ฟอร์มเต็มหน้า ============ */
function BookForm({ book, categories, onClose }) {
  const save = useSaveBook();
  const pubs = useTermList("PUBLISHER").data || [];
  const authors = useTermList("AUTHOR").data || [];
  const translators = useTermList("TRANSLATOR").data || [];
  const [form, setForm] = useState({ ...EMPTY, ...book, tags: book.tags || [], variants: book.variants || [], galleryImages: book.galleryImages || [], importedAt: book.importedAt ? book.importedAt.slice(0, 10) : "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState({});
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setBusyFor = (k, v) => setBusy((b) => ({ ...b, [k]: v }));

  // อัปโหลด
  const onCover = async (e, field) => {
    const file = e.target.files?.[0]; if (!file) return;
    setBusyFor(field, true);
    try { const url = await uploadImage(file); setForm((f) => ({ ...f, [field]: url })); } catch { setError("อัปโหลดรูปไม่สำเร็จ"); } finally { setBusyFor(field, false); }
  };
  const onGallery = async (e) => {
    const files = e.target.files; if (!files?.length) return;
    setBusyFor("gallery", true);
    try { const urls = await uploadImages(files); setForm((f) => ({ ...f, galleryImages: [...f.galleryImages, ...urls] })); } catch { setError("อัปโหลดรูปไม่สำเร็จ"); } finally { setBusyFor("gallery", false); }
  };
  const onPdf = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setBusyFor("pdf", true);
    try { const url = await uploadPdf(file); setForm((f) => ({ ...f, previewPdf: url })); } catch { setError("อัปโหลด PDF ไม่สำเร็จ"); } finally { setBusyFor("pdf", false); }
  };

  // ราคาลดเป็น %
  const setDiscountPct = (pct) => {
    const p = Number(form.price);
    if (p && pct) setForm((f) => ({ ...f, discountPrice: Math.round(p * (1 - Number(pct) / 100) * 100) / 100 }));
  };

  // variants
  const addVariant = () => setForm((f) => ({ ...f, variants: [...f.variants, { name: "", price: "", discountPrice: "", stock: "" }] }));
  const setVariant = (i, k, v) => setForm((f) => ({ ...f, variants: f.variants.map((x, idx) => idx === i ? { ...x, [k]: v } : x) }));
  const delVariant = (i) => setForm((f) => ({ ...f, variants: f.variants.filter((_, idx) => idx !== i) }));

  const submit = (e) => {
    e.preventDefault();
    setError("");
    save.mutate(form, { onSuccess: onClose, onError: (err) => setError(err.response?.data?.error || "บันทึกไม่สำเร็จ") });
  };

  return (
    <form onSubmit={submit}>
      {/* datalist แนะนำรายชื่อ (จาก collection) */}
      <datalist id="dl-publisher">{pubs.map((n) => <option key={n} value={n} />)}</datalist>
      <datalist id="dl-author">{authors.map((n) => <option key={n} value={n} />)}</datalist>
      <datalist id="dl-translator">{translators.map((n) => <option key={n} value={n} />)}</datalist>

      <h2 className="mb-6 text-2xl font-semibold tracking-tightest text-ink">{book.id ? "แก้ไขหนังสือ" : "เพิ่มหนังสือ"}</h2>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* ซ้าย */}
        <div className="space-y-6">
          <Card>
            <F label="ชื่อหนังสือ *"><Inp value={form.title} onChange={set("title")} /></F>
            <div className="grid gap-4 sm:grid-cols-2">
              <F label="ผู้เขียน" hint="หลายชื่อคั่นด้วย ,"><Inp value={form.author} onChange={set("author")} list="dl-author" /></F>
              <F label="ผู้แปล" hint="หลายชื่อคั่นด้วย ,"><Inp value={form.translator} onChange={set("translator")} list="dl-translator" /></F>
            </div>
            <F label="หมวดหนังสือ">
              <Select value={form.categoryId || ""} onChange={set("categoryId")}>
                <option value="">— ไม่ระบุ —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </F>
            <F label="แท็ก (Tags)" hint="เช่น ขายดี, ใหม่, แนะนำ — คั่นด้วย ,">
              <Inp value={form.tags.join(", ")} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) }))} placeholder="เช่น ขายดี, ใหม่, แนะนำ" />
            </F>
            <F label="รายละเอียด"><textarea value={form.description} onChange={set("description")} rows={5} className="w-full resize-y rounded-xl border border-line px-4 py-2.5 text-[14px] outline-none focus:border-ink/30" /></F>
          </Card>

          <Card title="ราคา">
            <div className="grid gap-4 sm:grid-cols-3">
              <F label="ราคาปกติ (บาท) *"><Inp type="number" value={form.price} onChange={set("price")} /></F>
              <F label="ราคาลด (บาท)"><Inp type="number" value={form.discountPrice ?? ""} onChange={set("discountPrice")} /></F>
              <F label="หรือลดเป็น %" hint="กรอก % แล้วคำนวณราคาลดให้"><Inp type="number" placeholder="เช่น 20" onChange={(e) => setDiscountPct(e.target.value)} /></F>
            </div>
          </Card>

          <Card title="ข้อมูลจำเพาะ (Meta)">
            <div className="grid gap-4 sm:grid-cols-2">
              <F label="สำนักพิมพ์"><Inp value={form.publisher} onChange={set("publisher")} list="dl-publisher" /></F>
              <F label="พิมพ์ครั้งที่"><Inp value={form.edition} onChange={set("edition")} /></F>
              <F label="จำนวนหน้า"><Inp type="number" value={form.pageCount ?? ""} onChange={set("pageCount")} /></F>
              <F label="ขนาด"><Inp value={form.dimensions} onChange={set("dimensions")} placeholder="14.5 × 21 cm." /></F>
              <F label="น้ำหนัก"><Inp value={form.weight} onChange={set("weight")} placeholder="330 g" /></F>
              <F label="กระดาษเนื้อใน"><Inp value={form.paperType} onChange={set("paperType")} /></F>
              <F label="ปก"><Inp value={form.coverType} onChange={set("coverType")} placeholder="ปกอ่อน / ปกแข็ง" /></F>
            </div>
          </Card>

          <Card title="รหัสสินค้า & SEO">
            <div className="grid gap-4 sm:grid-cols-2">
              <F label="ISBN" hint="ISBN-13 ใช้เป็น GTIN ใน Google"><Inp value={form.isbn} onChange={set("isbn")} /></F>
              <F label="SKU (รหัสภายในร้าน)"><Inp value={form.sku} onChange={set("sku")} /></F>
            </div>
            <F label="Meta Title" hint="เว้นว่าง = ใช้ชื่อหนังสือ · ≤ 60 ตัวอักษร"><Inp value={form.metaTitle} onChange={set("metaTitle")} /></F>
            <F label="Meta Description" hint="เว้นว่าง = ใช้รายละเอียด · ≤ 160 ตัวอักษร"><textarea value={form.metaDescription} onChange={set("metaDescription")} rows={2} className="w-full resize-y rounded-xl border border-line px-4 py-2.5 text-[14px] outline-none focus:border-ink/30" /></F>
            <F label="Slug (URL หน้าหนังสือ)" hint="เว้นว่าง = ใช้ id · ใช้อังกฤษ-เลข"><Inp value={form.slug} onChange={set("slug")} placeholder="asia-vol1" /></F>
            <F label="ไฟล์ตัวอย่าง (PDF)" hint="อ่านตัวอย่างแบบ flip book · ≤ 25MB">
              {form.previewPdf && <a href={form.previewPdf} target="_blank" rel="noreferrer" className="mb-2 block text-[12px] text-accent hover:underline">เปิดดู PDF ปัจจุบัน</a>}
              <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-line py-2 text-[13px] text-sub hover:text-ink">
                {busy.pdf ? "กำลังอัปโหลด..." : "อัปโหลด PDF"}
                <input type="file" accept="application/pdf" onChange={onPdf} className="hidden" />
              </label>
            </F>
          </Card>

          <Card title="ตัวเลือกสินค้า (Variant)" subtitle="เช่น ปกอ่อน / ปกแข็ง / Boxset — แต่ละแบบมีราคาและสต็อกของตัวเอง">
            {form.variants.length > 0 && (
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_90px_90px_70px_28px] gap-2 text-[11px] text-sub">
                  <span>ชื่อแบบ</span><span>ราคา</span><span>ราคาลด</span><span>สต็อก</span><span />
                </div>
                {form.variants.map((v, i) => (
                  <div key={i} className="grid grid-cols-[1fr_90px_90px_70px_28px] gap-2">
                    <Inp value={v.name} onChange={(e) => setVariant(i, "name", e.target.value)} placeholder="ปกแข็ง" />
                    <Inp type="number" value={v.price} onChange={(e) => setVariant(i, "price", e.target.value)} />
                    <Inp type="number" value={v.discountPrice ?? ""} onChange={(e) => setVariant(i, "discountPrice", e.target.value)} />
                    <Inp type="number" value={v.stock} onChange={(e) => setVariant(i, "stock", e.target.value)} />
                    <button type="button" onClick={() => delVariant(i)} className="text-sub hover:text-red-600">✕</button>
                  </div>
                ))}
              </div>
            )}
            <button type="button" onClick={addVariant} className="mt-3 rounded-xl border border-dashed border-line px-4 py-2 text-[13px] text-ink hover:bg-mist">+ เพิ่มตัวเลือก</button>
          </Card>

          <Card title="รูปภาพเพิ่มเติม" subtitle="ปกหน้าใช้ช่อง “รูปปก” ทางขวา · ตรงนี้เพิ่ม ปกหลัง + รูปแกลเลอรี">
            <F label="ปกหลัง (กดพลิกได้)">
              {form.backCoverImage && <img src={form.backCoverImage} alt="" className="mb-2 h-24 w-16 rounded object-cover" />}
              <UploadBtn busy={busy.backCoverImage} onChange={(e) => onCover(e, "backCoverImage")} label={form.backCoverImage ? "เปลี่ยนปกหลัง" : "อัปโหลดปกหลัง"} />
              {form.backCoverImage && <button type="button" onClick={() => setForm((f) => ({ ...f, backCoverImage: "" }))} className="mt-1 text-[12px] text-sub hover:text-red-600">ลบปกหลัง</button>}
            </F>
            <F label="รูปแกลเลอรี (เลือกได้หลายรูป)">
              <div className="mb-2 flex flex-wrap gap-2">
                {form.galleryImages.map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} alt="" className="h-20 w-16 rounded object-cover" />
                    <button type="button" onClick={() => setForm((f) => ({ ...f, galleryImages: f.galleryImages.filter((_, idx) => idx !== i) }))}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] text-white">✕</button>
                  </div>
                ))}
              </div>
              <UploadBtn busy={busy.gallery} onChange={onGallery} multiple label="อัปโหลดรูปแกลเลอรี" />
            </F>
          </Card>
        </div>

        {/* ขวา */}
        <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <F label="รูปปก" hint="สัดส่วน 145:210 (เช่น 600×870) · jpg/png/webp ≤ 4MB">
              <div className="mb-3 flex aspect-[145/210] items-center justify-center overflow-hidden rounded-xl bg-mist">
                {form.coverImage ? <img src={form.coverImage} alt="" className="h-full w-full object-cover" /> : <span className="text-3xl opacity-25">𝐀</span>}
              </div>
              <UploadBtn busy={busy.coverImage} onChange={(e) => onCover(e, "coverImage")} label={form.coverImage ? "เปลี่ยนรูปปก" : "อัปโหลดรูปปก"} />
            </F>
          </Card>

          <Card>
            <div className="grid grid-cols-2 gap-3">
              <F label="สต็อก (เล่ม)" hint="ใช้เมื่อไม่มี variant"><Inp type="number" value={form.stock} onChange={set("stock")} /></F>
              <label className="flex items-end gap-2 pb-2 text-[13px] text-ink">
                <input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} className="h-4 w-4 accent-accent" />
                แนะนำหน้าแรก
              </label>
            </div>
            <F label="วันที่นำเข้า" hint="ใช้จัดลำดับ · เว้นว่าง = วันนี้"><Inp type="date" value={form.importedAt} onChange={set("importedAt")} /></F>
          </Card>

          {error && <p className="text-[13px] text-red-600">{error}</p>}

          <button type="submit" disabled={save.isPending} className="w-full rounded-full bg-accent py-3 text-[15px] font-medium text-white transition hover:bg-accent/90 disabled:opacity-50">
            {save.isPending ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
          </button>
          <button type="button" onClick={onClose} className="w-full rounded-full border border-line py-3 text-[15px] text-ink hover:bg-mist">ยกเลิก</button>
        </div>
      </div>
    </form>
  );
}

const Card = ({ title, subtitle, children }) => (
  <div className="space-y-4 rounded-2xl border border-line bg-white p-6">
    {title && <div><p className="text-[15px] font-semibold text-ink">{title}</p>{subtitle && <p className="mt-0.5 text-[12px] text-sub">{subtitle}</p>}</div>}
    {children}
  </div>
);
const F = ({ label, hint, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-[12px] font-medium text-ink">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-[11px] text-sub">{hint}</span>}
  </label>
);
const Inp = (props) => <input {...props} className="w-full rounded-xl border border-line px-4 py-2.5 text-[14px] text-ink outline-none focus:border-ink/30" />;
const Select = (props) => <select {...props} className="w-full rounded-xl border border-line px-4 py-2.5 text-[14px] text-ink outline-none focus:border-ink/30" />;
const UploadBtn = ({ busy, onChange, label, multiple }) => (
  <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-line py-2 text-[13px] text-sub hover:text-ink">
    {busy ? "กำลังอัปโหลด..." : label}
    <input type="file" accept="image/*" multiple={multiple} onChange={onChange} className="hidden" />
  </label>
);


