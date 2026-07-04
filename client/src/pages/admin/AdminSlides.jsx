import { useState } from "react";
import { useAdminSlides, useSaveSlide, useDeleteSlide, uploadImage } from "../../api/admin";

const EMPTY = {
  eyebrow: "", title: "", subtitle: "", ctaText: "เลือกซื้อเลย", ctaLink: "#catalog",
  image: "", bgColor: "#1d1d1f", dark: true, align: "center", valign: "center", overlay: 0,
  linkUrl: "", textColor: "", buttonColor: "", buttonTextColor: "", order: 0, active: true,
};

// map ตำแหน่ง → คลาส flex (ใช้ทั้ง preview หน้า admin)
const ALIGN = { left: "items-start text-left", center: "items-center text-center", right: "items-end text-right" };
const VALIGN = { top: "justify-start", center: "justify-center", bottom: "justify-end" };

export default function AdminSlides() {
  const { data: slides, isLoading } = useAdminSlides();
  const del = useDeleteSlide();
  const [editing, setEditing] = useState(null);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-[14px] text-sub">{slides?.length || 0} สไลด์ · เรียงตามลำดับ order</p>
        <button
          onClick={() => setEditing({ ...EMPTY, order: (slides?.length || 0) + 1 })}
          className="rounded-full bg-ink px-5 py-2.5 text-[14px] font-medium text-white transition hover:bg-ink/90"
        >
          + เพิ่มสไลด์
        </button>
      </div>

      {isLoading ? (
        <p className="text-sub">กำลังโหลด...</p>
      ) : (
        <div className="space-y-3">
          {slides.map((s) => (
            <div key={s.id} className="flex items-center gap-4 rounded-2xl border border-line bg-white p-3">
              {/* preview ย่อ */}
              <div
                className="flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-cover bg-center text-center"
                style={{ background: s.image ? undefined : s.bgColor, backgroundImage: s.image ? `url(${s.image})` : undefined }}
              >
                <span className={`px-1 text-[10px] font-semibold leading-tight ${s.dark ? "text-white" : "text-ink"}`}>
                  {s.title.split("\n")[0]}
                </span>
              </div>

              <div className="flex-1">
                <p className="text-[14px] font-medium text-ink">{s.title.replace(/\n/g, " ")}</p>
                <p className="text-[12px] text-sub">
                  #{s.order} · {s.eyebrow || "ไม่มี eyebrow"} {s.image ? "· มีรูป" : "· พื้นสี"}
                </p>
              </div>

              <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${s.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                {s.active ? "แสดง" : "ซ่อน"}
              </span>
              <button onClick={() => setEditing(s)} className="text-[13px] text-accent">แก้ไข</button>
              <button
                onClick={() => confirm("ลบสไลด์นี้?") && del.mutate(s.id)}
                className="text-[13px] text-sub hover:text-red-600"
              >
                ลบ
              </button>
            </div>
          ))}
        </div>
      )}

      {editing && <SlideForm slide={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function SlideForm({ slide, onClose }) {
  const save = useSaveSlide();
  const [form, setForm] = useState({ ...EMPTY, ...slide });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setForm((f) => ({ ...f, image: url }));
    } catch {
      setError("อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    setError("");
    save.mutate(form, { onSuccess: onClose, onError: (err) => setError(err.response?.data?.error || "บันทึกไม่สำเร็จ") });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-5 text-[17px] font-semibold text-ink">{slide.id ? "แก้ไขสไลด์" : "เพิ่มสไลด์"}</h3>

        {/* Live preview — สะท้อนตำแหน่งข้อความ */}
        <div
          className={`relative mb-6 flex h-44 flex-col overflow-hidden rounded-2xl bg-cover bg-center p-5 ${ALIGN[form.align]} ${VALIGN[form.valign]}`}
          style={{ background: form.image ? undefined : form.bgColor, backgroundImage: form.image ? `url(${form.image})` : undefined }}
        >
          {form.image && form.overlay > 0 && (
            <div className="absolute inset-0" style={{ backgroundColor: form.dark ? "#000" : "#fff", opacity: form.overlay / 100 }} />
          )}
          <div className={`relative max-w-[70%] ${form.dark ? "text-white" : "text-ink"}`} style={form.textColor ? { color: form.textColor } : undefined}>
            {form.eyebrow && <p className="text-[10px] opacity-80">{form.eyebrow}</p>}
            <p className="whitespace-pre-line text-lg font-semibold leading-tight">{form.title || "หัวข้อสไลด์"}</p>
            {form.ctaText && (
              <span
                className="mt-2 inline-block rounded-full bg-accent px-3 py-1 text-[11px] text-white"
                style={{ backgroundColor: form.buttonColor || undefined, color: form.buttonTextColor || undefined }}
              >
                {form.ctaText}
              </span>
            )}
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <F label="Eyebrow (ข้อความบน)"><Inp value={form.eyebrow} onChange={set("eyebrow")} /></F>
            <F label="ปุ่ม (CTA)"><Inp value={form.ctaText} onChange={set("ctaText")} /></F>
          </div>
          <F label="หัวข้อใหญ่ * (Enter ขึ้นบรรทัดใหม่)">
            <textarea value={form.title} onChange={set("title")} rows={2} className="w-full resize-none rounded-xl border border-line px-4 py-2.5 text-[14px] outline-none focus:border-ink/30" />
          </F>
          <F label="คำอธิบาย"><Inp value={form.subtitle} onChange={set("subtitle")} /></F>

          {/* รูป / สีพื้น */}
          <div className="grid gap-4 sm:grid-cols-2">
            <F label="รูปพื้นหลัง — แนะนำ 1920×1080 (16:9), < 500KB">
              <div className="flex gap-2">
                <label className="flex flex-1 cursor-pointer items-center justify-center rounded-xl border border-dashed border-line py-2 text-[13px] text-sub hover:text-ink">
                  {uploading ? "กำลังอัปโหลด..." : form.image ? "เปลี่ยนรูป" : "อัปโหลดรูป"}
                  <input type="file" accept="image/*" onChange={onFile} className="hidden" />
                </label>
                {form.image && (
                  <button type="button" onClick={() => setForm((f) => ({ ...f, image: "" }))} className="rounded-xl border border-line px-3 text-[13px] text-sub hover:text-red-600">
                    เอาออก
                  </button>
                )}
              </div>
            </F>
            <F label="สีพื้นหลัง (ถ้าไม่มีรูป)">
              <div className="flex items-center gap-2">
                <input type="color" value={form.bgColor || "#1d1d1f"} onChange={set("bgColor")} className="h-10 w-12 rounded border border-line" />
                <Inp value={form.bgColor} onChange={set("bgColor")} />
              </div>
            </F>
          </div>

          {/* ตำแหน่งข้อความ + แรเงา */}
          <div className="grid gap-4 sm:grid-cols-2">
            <F label="ตำแหน่งข้อความ">
              <PositionPicker
                align={form.align}
                valign={form.valign}
                onChange={(align, valign) => setForm((f) => ({ ...f, align, valign }))}
              />
            </F>
            <F label={`แผ่นแรเงาบนรูป (${form.overlay || 0}%)`}>
              <input
                type="range"
                min="0"
                max="80"
                value={form.overlay || 0}
                onChange={(e) => setForm((f) => ({ ...f, overlay: Number(e.target.value) }))}
                className="w-full accent-accent"
                disabled={!form.image}
              />
              <p className="mt-1 text-[11px] text-sub">
                {form.image ? "0% = เห็นรูปชัด · เพิ่มขึ้นเพื่อให้ตัวอักษรอ่านง่าย" : "ใช้เมื่อมีรูปพื้นหลัง"}
              </p>
            </F>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <F label="ลิงก์ปุ่ม (CTA)"><Inp value={form.ctaLink} onChange={set("ctaLink")} /></F>
            <F label="ลิงก์เมื่อคลิกที่รูป (ถ้ามี)"><Inp value={form.linkUrl} onChange={set("linkUrl")} placeholder="เช่น /books/xxx หรือ https://..." /></F>
          </div>

          {/* สีกำหนดเอง */}
          <div className="grid gap-4 sm:grid-cols-3">
            <ColorField label="สีตัวอักษร" value={form.textColor} fallback={form.dark ? "#ffffff" : "#1d1d1f"} onChange={(v) => setForm((f) => ({ ...f, textColor: v }))} />
            <ColorField label="สีปุ่ม" value={form.buttonColor} fallback="#0071e3" onChange={(v) => setForm((f) => ({ ...f, buttonColor: v }))} />
            <ColorField label="สีอักษรปุ่ม" value={form.buttonTextColor} fallback="#ffffff" onChange={(v) => setForm((f) => ({ ...f, buttonTextColor: v }))} />
          </div>

          <F label="ลำดับ (order)"><Inp type="number" value={form.order} onChange={set("order")} /></F>

          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.dark} onChange={(e) => setForm((f) => ({ ...f, dark: e.target.checked }))} className="h-4 w-4 accent-accent" />
              <span className="text-[14px] text-ink">ตัวหนังสือสีขาว (พื้นเข้ม)</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="h-4 w-4 accent-accent" />
              <span className="text-[14px] text-ink">แสดงสไลด์นี้</span>
            </label>
          </div>

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

// ตาราง 3×3 เลือกตำแหน่งข้อความ (แบบ Elementor)
function PositionPicker({ align, valign, onChange }) {
  const rows = ["top", "center", "bottom"];
  const cols = ["left", "center", "right"];
  return (
    <div className="inline-grid grid-cols-3 gap-1 rounded-xl border border-line p-1">
      {rows.map((v) =>
        cols.map((h) => {
          const active = align === h && valign === v;
          return (
            <button
              key={`${v}-${h}`}
              type="button"
              onClick={() => onChange(h, v)}
              aria-label={`${v} ${h}`}
              className={`flex h-8 w-10 items-center justify-center rounded-lg transition ${
                active ? "bg-ink" : "hover:bg-mist"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-white" : "bg-line"}`} />
            </button>
          );
        })
      )}
    </div>
  );
}

// ช่องเลือกสี — ว่าง = ใช้ค่าเริ่มต้น (fallback)
function ColorField({ label, value, fallback, onChange }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-[12px] font-medium text-sub">
        {label}
        {value && (
          <button type="button" onClick={() => onChange("")} className="text-[11px] text-accent">
            รีเซ็ต
          </button>
        )}
      </span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || fallback}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-10 shrink-0 rounded border border-line"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="ค่าเริ่มต้น"
          className="w-full rounded-xl border border-line px-3 py-2 text-[12px] text-ink outline-none focus:border-ink/30"
        />
      </div>
    </label>
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
