import { useState } from "react";
import { useSettings, useUpdateSettings } from "../../api/settings";
import { useBooks } from "../../api/books";
import { uploadImage } from "../../api/admin";
import {
  parseOrder, parseRows, parseCustomRows, parseBanner, newCustomRow, customKey, isCustomKey,
  SECTION_LABEL, ROW_SORTS, ROW_KEYS, ROW_DEFAULTS, BOOKS_EDITABLE_KEYS, ROW_LIMIT_MAX,
  BANNER_HEIGHTS, BANNER_DEFAULT, BANNER_PARALLAX_MAX,
} from "../../lib/homeSections";
import { img } from "../../lib/img";

const inp = "w-full rounded-lg border border-line bg-white px-3 py-2 text-[14px] outline-none focus:border-ink/30";

// คำอธิบายสำหรับแถวที่เลือกหนังสือเองไม่ได้ (ดึงอัตโนมัติ)
const ROW_NOTE = {
  hotdeal: "แถวนี้ดึงหนังสือที่ตั้งราคา Hot Deal ไว้โดยอัตโนมัติ — แก้ได้เฉพาะหัวข้อ/คำโปรย",
  blog: "แถวนี้ดึงบทความล่าสุดจากระบบบล็อกโดยอัตโนมัติ — แก้ได้เฉพาะหัวข้อ/คำโปรย",
  browse: "แถวนี้แสดงหมวดหมู่ทั้งหมดโดยอัตโนมัติ — แก้ได้เฉพาะหัวข้อ/คำโปรย",
  brands: "แถวนี้แสดงสำนักพิมพ์โดยอัตโนมัติ — แก้ได้เฉพาะหัวข้อ/คำโปรย",
};

export default function AdminHomeLayout() {
  const settings = useSettings();
  const update = useUpdateSettings();
  const rows = parseRows(settings.homeRows);
  const custom = parseCustomRows(settings.homeCustomRows);
  const customBy = Object.fromEntries(custom.map((r) => [customKey(r.id), r]));
  const order = parseOrder(settings.homeSectionOrder, custom.map((r) => customKey(r.id)));
  const banner = parseBanner(settings.homeBanner);
  const [editing, setEditing] = useState("");

  const move = (i, dir) => {
    const next = [...order];
    const t = i + dir;
    if (t < 0 || t >= next.length) return;
    [next[i], next[t]] = [next[t], next[i]];
    update.mutate({ homeSectionOrder: JSON.stringify(next) });
  };

  // บันทึกแถว built-in (new/bestseller/hotdeal) → homeRows
  const saveRow = (key, cfg) =>
    update.mutate({ homeRows: JSON.stringify({ ...rows, [key]: cfg }) }, { onSuccess: () => setEditing("") });

  // บันทึกแถวที่สร้างเอง → homeCustomRows
  const saveCustom = (id, cfg) =>
    update.mutate({ homeCustomRows: JSON.stringify(custom.map((r) => (r.id === id ? { ...r, ...cfg } : r))) }, { onSuccess: () => setEditing("") });

  // บันทึกแบนเนอร์ parallax → homeBanner
  const saveBanner = (cfg) =>
    update.mutate({ homeBanner: JSON.stringify(cfg) }, { onSuccess: () => setEditing("") });

  const addCustom = () => {
    const row = newCustomRow();
    update.mutate(
      { homeCustomRows: JSON.stringify([...custom, row]), homeSectionOrder: JSON.stringify([...order, customKey(row.id)]) },
      { onSuccess: () => setEditing(customKey(row.id)) }
    );
  };

  const deleteCustom = (id) => {
    const k = customKey(id);
    update.mutate(
      { homeCustomRows: JSON.stringify(custom.filter((r) => r.id !== id)), homeSectionOrder: JSON.stringify(order.filter((o) => o !== k)) },
      { onSuccess: () => setEditing("") }
    );
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-start justify-between gap-3">
        <p className="max-w-3xl text-[13px] text-sub">
          เรียงลำดับ section ด้วยปุ่มลูกศร ▲▼ · แถวหนังสือ (มาใหม่/ขายดี/Hot Deal/แถวที่สร้างเอง) กด “แก้ไข” เพื่อตั้งหัวข้อ คำโปรย และเลือกหนังสือ · บาง section ต้องเปิดที่ ตั้งค่า → การแสดงผล
        </p>
        <button onClick={addCustom} className="shrink-0 rounded-full bg-ink px-5 py-2.5 text-[14px] font-medium text-white transition hover:bg-ink/90">+ เพิ่มแถวใหม่</button>
      </div>

      <div className="rounded-2xl border border-line bg-white p-2">
        <ul className="divide-y divide-line">
          {order.map((key, i) => {
            const cust = isCustomKey(key);
            const isBanner = key === "banner";
            const cfg = cust ? customBy[key] : isBanner ? banner : rows[key];
            const editable = cust || ROW_KEYS.includes(key) || isBanner;
            const booksEditable = cust || BOOKS_EDITABLE_KEYS.includes(key);
            const isOpen = editing === key;
            if (cust && !cfg) return null; // แถวถูกลบไปแล้ว
            return (
              <li key={key} className="px-2 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => move(i, -1)} disabled={i === 0} className="flex h-6 w-6 items-center justify-center rounded-md text-sub transition hover:bg-mist hover:text-ink disabled:opacity-20 disabled:hover:bg-transparent" aria-label="เลื่อนขึ้น">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M6 15l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                    <button onClick={() => move(i, 1)} disabled={i === order.length - 1} className="flex h-6 w-6 items-center justify-center rounded-md text-sub transition hover:bg-mist hover:text-ink disabled:opacity-20 disabled:hover:bg-transparent" aria-label="เลื่อนลง">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                  </div>
                  <span className="w-6 text-center text-[13px] font-semibold text-sub">{i + 1}</span>
                  <div className="flex-1">
                    <span className="text-[14px] font-medium text-ink">{cust ? cfg.title : SECTION_LABEL[key] || key}</span>
                    {cust && <span className="ml-2 rounded-full bg-mist px-2 py-0.5 text-[11px] text-sub">แถวที่สร้างเอง</span>}
                    {isBanner ? (
                      <span className="ml-2 text-[12px] text-sub">
                        · {cfg.enabled ? (cfg.image ? "เปิด" : "เปิด (ยังไม่ใส่รูป)") : "ปิดอยู่"}{cfg.title ? ` · ${cfg.title}` : ""}
                      </span>
                    ) : editable && (
                      <span className="ml-2 text-[12px] text-sub">
                        · {cfg.title} {!booksEditable ? "(อัตโนมัติ)" : cfg.mode === "manual" ? `(เลือกเอง ${cfg.bookIds.length} เล่ม)` : "(อัตโนมัติ)"}
                      </span>
                    )}
                  </div>
                  {editable && (
                    <button onClick={() => setEditing(isOpen ? "" : key)} className="shrink-0 rounded-full border border-line px-4 py-1.5 text-[13px] font-medium text-ink transition hover:bg-mist">
                      {isOpen ? "ปิด" : "แก้ไข"}
                    </button>
                  )}
                </div>

                {editable && isOpen && (isBanner ? (
                  <BannerEditor
                    cfg={cfg}
                    saving={update.isPending}
                    onSave={saveBanner}
                    onReset={() => saveBanner(BANNER_DEFAULT)}
                  />
                ) : (
                  <RowEditor
                    cfg={cfg}
                    saving={update.isPending}
                    booksEditable={booksEditable}
                    note={ROW_NOTE[key]}
                    onSave={(next) => (cust ? saveCustom(cfg.id, next) : saveRow(key, next))}
                    onReset={cust ? undefined : () => saveRow(key, ROW_DEFAULTS[key])}
                    onDelete={cust ? () => deleteCustom(cfg.id) : undefined}
                  />
                ))}
              </li>
            );
          })}
        </ul>
      </div>

      <button type="button" onClick={() => update.mutate({ homeSectionOrder: "" })} className="text-[13px] text-sub hover:text-ink">
        คืนค่าลำดับเริ่มต้น
      </button>
    </div>
  );
}

function RowEditor({ cfg, onSave, onReset, onDelete, saving, booksEditable = true, note }) {
  const [title, setTitle] = useState(cfg.title);
  const [subtitle, setSubtitle] = useState(cfg.subtitle);
  const [mode, setMode] = useState(cfg.mode);
  const [sort, setSort] = useState(cfg.sort);
  const [limit, setLimit] = useState(cfg.limit ?? 12);
  const [bookIds, setBookIds] = useState(cfg.bookIds);
  const [q, setQ] = useState("");

  const { data: selData } = useBooks({ ids: bookIds.join(",") });
  const selBooks = bookIds.map((id) => selData?.items?.find((b) => b.id === id)).filter(Boolean);
  const { data: searchData } = useBooks(q.trim() ? { q: q.trim(), limit: 8 } : { ids: "" });
  const results = (q.trim() ? searchData?.items : []) || [];

  const add = (id) => { if (!bookIds.includes(id) && bookIds.length < ROW_LIMIT_MAX) setBookIds([...bookIds, id]); };
  const removeBook = (id) => setBookIds(bookIds.filter((x) => x !== id));
  const moveBook = (i, dir) => {
    const t = i + dir;
    if (t < 0 || t >= bookIds.length) return;
    const n = [...bookIds];
    [n[i], n[t]] = [n[t], n[i]];
    setBookIds(n);
  };

  const save = () => onSave({
    title: title.trim() || cfg.title,
    subtitle: subtitle.trim(),
    mode: booksEditable ? mode : "auto",
    sort: booksEditable ? sort : cfg.sort,
    limit: Math.min(ROW_LIMIT_MAX, Math.max(1, Math.round(Number(limit)) || 12)),
    bookIds: booksEditable ? bookIds : [],
  });

  return (
    <div className="mt-3 space-y-4 rounded-xl border border-line bg-mist/40 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[12px] text-sub">หัวข้อ</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inp} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] text-sub">คำโปรย (ใต้หัวข้อ)</span>
          <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className={inp} />
        </label>
      </div>

      {!booksEditable ? (
        <p className="text-[12px] text-sub">{note || "แถวนี้ดึงหนังสืออัตโนมัติ — แก้ได้เฉพาะหัวข้อ/คำโปรย"}</p>
      ) : (
        <>
          <div>
            <span className="mb-1.5 block text-[12px] text-sub">เลือกหนังสือ</span>
            <div className="flex gap-2">
              <ModeBtn active={mode === "auto"} onClick={() => setMode("auto")}>อัตโนมัติ</ModeBtn>
              <ModeBtn active={mode === "manual"} onClick={() => setMode("manual")}>เลือกเอง</ModeBtn>
            </div>
          </div>

          {mode === "auto" ? (
            <div className="grid max-w-md gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-[12px] text-sub">เรียงลำดับ</span>
                <select value={sort} onChange={(e) => setSort(e.target.value)} className={inp}>
                  {ROW_SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[12px] text-sub">จำนวนเล่ม (1–{ROW_LIMIT_MAX})</span>
                <input type="number" min={1} max={ROW_LIMIT_MAX} value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  onBlur={(e) => setLimit(Math.min(ROW_LIMIT_MAX, Math.max(1, Math.round(Number(e.target.value)) || 12)))}
                  className={inp} />
              </label>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="mb-1.5 text-[12px] text-sub">เล่มที่เลือก ({bookIds.length})</p>
                {bookIds.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-[13px] text-sub">ยังไม่ได้เลือก — ค้นหาแล้วกด “เพิ่ม” ด้านล่าง</p>
                ) : (
                  <ul className="space-y-2">
                    {selBooks.map((b, i) => (
                      <li key={b.id} className="flex items-center gap-3 rounded-lg border border-line bg-white px-2 py-2">
                        <div className="flex flex-col gap-0.5">
                          <button onClick={() => moveBook(i, -1)} disabled={i === 0} className="flex h-5 w-5 items-center justify-center rounded text-sub hover:bg-mist disabled:opacity-20" aria-label="ขึ้น">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M6 15l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          </button>
                          <button onClick={() => moveBook(i, 1)} disabled={i === selBooks.length - 1} className="flex h-5 w-5 items-center justify-center rounded text-sub hover:bg-mist disabled:opacity-20" aria-label="ลง">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          </button>
                        </div>
                        <div className="h-11 w-8 shrink-0 overflow-hidden rounded bg-mist">
                          {b.coverImage && <img src={img(b.coverImage, 120)} alt="" className="h-full w-full object-cover" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium text-ink">{b.title}</p>
                          <p className="truncate text-[12px] text-sub">{b.author}</p>
                        </div>
                        <button onClick={() => removeBook(b.id)} className="shrink-0 text-[13px] text-sub hover:text-red-600">ลบ</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาหนังสือ (ชื่อ/ผู้แต่ง/ISBN)" className={inp} />
                {results.length > 0 && (
                  <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto rounded-lg border border-line bg-white p-1">
                    {results.map((b) => {
                      const picked = bookIds.includes(b.id);
                      return (
                        <li key={b.id} className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-mist">
                          <div className="h-10 w-7 shrink-0 overflow-hidden rounded bg-mist">
                            {b.coverImage && <img src={img(b.coverImage, 120)} alt="" className="h-full w-full object-cover" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] text-ink">{b.title}</p>
                            <p className="truncate text-[12px] text-sub">{b.author}</p>
                          </div>
                          <button onClick={() => add(b.id)} disabled={picked} className="shrink-0 rounded-full border border-line px-3 py-1 text-[12px] font-medium text-ink transition hover:bg-mist disabled:opacity-40">
                            {picked ? "เพิ่มแล้ว" : "เพิ่ม"}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <div className="flex items-center gap-3 border-t border-line pt-3">
        <button onClick={save} disabled={saving} className="rounded-full bg-accent px-6 py-2 text-[14px] font-medium text-white transition hover:bg-accent/90 disabled:opacity-50">บันทึก</button>
        {onReset && <button onClick={onReset} disabled={saving} className="text-[13px] text-sub hover:text-ink">คืนค่าเริ่มต้น</button>}
        {onDelete && (
          <button onClick={() => confirm("ลบแถวนี้ออกจากหน้าแรก?") && onDelete()} disabled={saving} className="ml-auto text-[13px] text-sub hover:text-red-600">ลบแถวนี้</button>
        )}
      </div>
    </div>
  );
}

function BannerEditor({ cfg, onSave, onReset, saving }) {
  const [f, setF] = useState({ ...BANNER_DEFAULT, ...cfg });
  const [uploading, setUploading] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setF((s) => ({ ...s, image: url }));
    } catch {
      alert("อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="mt-3 space-y-4 rounded-xl border border-line bg-mist/40 p-4">
      <label className="flex items-center gap-2 text-[13px] font-medium text-ink">
        <input type="checkbox" checked={f.enabled} onChange={(e) => setF((s) => ({ ...s, enabled: e.target.checked }))} className="h-4 w-4 accent-accent" />
        แสดงแบนเนอร์นี้บนหน้าแรก
      </label>

      {/* รูปพื้นหลัง */}
      <div>
        <span className="mb-1.5 block text-[12px] text-sub">รูปพื้นหลัง (แนะนำแนวนอน กว้าง ≥ 1600px)</span>
        <div className="flex items-center gap-3">
          <div className="h-20 w-36 shrink-0 overflow-hidden rounded-lg border border-line bg-white">
            {f.image ? (
              <img src={img(f.image, 400)} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[11px] text-sub">ยังไม่มีรูป</div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label className="cursor-pointer rounded-full border border-line bg-white px-4 py-1.5 text-center text-[13px] font-medium text-ink transition hover:bg-mist">
              {uploading ? "กำลังอัปโหลด..." : f.image ? "เปลี่ยนรูป" : "อัปโหลดรูป"}
              <input type="file" accept="image/*" onChange={onFile} className="hidden" disabled={uploading} />
            </label>
            {f.image && <button type="button" onClick={() => setF((s) => ({ ...s, image: "" }))} className="text-[12px] text-sub hover:text-red-600">ลบรูป</button>}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[12px] text-sub">หัวข้อ</span>
          <input value={f.title} onChange={set("title")} className={inp} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] text-sub">คำโปรย (ใต้หัวข้อ)</span>
          <input value={f.subtitle} onChange={set("subtitle")} className={inp} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] text-sub">ข้อความปุ่ม (เว้นว่าง = ไม่แสดงปุ่ม)</span>
          <input value={f.buttonText} onChange={set("buttonText")} className={inp} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] text-sub">ลิงก์ปุ่ม</span>
          <input value={f.buttonLink} onChange={set("buttonLink")} placeholder="เช่น /books หรือ https://..." className={inp} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <span className="mb-1.5 block text-[12px] text-sub">ความสูง</span>
          <div className="flex gap-2">
            {BANNER_HEIGHTS.map((h) => (
              <ModeBtn key={h.value} active={f.height === h.value} onClick={() => setF((s) => ({ ...s, height: h.value }))}>{h.label}</ModeBtn>
            ))}
          </div>
        </div>
        <div>
          <span className="mb-1.5 block text-[12px] text-sub">แนวนอน</span>
          <div className="flex gap-2">
            <ModeBtn active={f.align === "left"} onClick={() => setF((s) => ({ ...s, align: "left" }))}>ชิดซ้าย</ModeBtn>
            <ModeBtn active={f.align === "center"} onClick={() => setF((s) => ({ ...s, align: "center" }))}>กึ่งกลาง</ModeBtn>
            <ModeBtn active={f.align === "right"} onClick={() => setF((s) => ({ ...s, align: "right" }))}>ชิดขวา</ModeBtn>
          </div>
        </div>
        <div>
          <span className="mb-1.5 block text-[12px] text-sub">แนวตั้ง</span>
          <div className="flex gap-2">
            <ModeBtn active={f.valign === "top"} onClick={() => setF((s) => ({ ...s, valign: "top" }))}>บน</ModeBtn>
            <ModeBtn active={f.valign === "middle"} onClick={() => setF((s) => ({ ...s, valign: "middle" }))}>กลาง</ModeBtn>
            <ModeBtn active={f.valign === "bottom"} onClick={() => setF((s) => ({ ...s, valign: "bottom" }))}>ล่าง</ModeBtn>
          </div>
        </div>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-[12px] text-sub">ความเข้มฉากมืด ({f.overlay}%)</span>
        <input type="range" min={0} max={60} value={f.overlay} onChange={(e) => setF((s) => ({ ...s, overlay: Number(e.target.value) }))} className="w-full accent-accent" />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[12px] text-sub">
          ความแรง Parallax ({f.parallax}px){f.parallax === 0 ? " · ปิด (ภาพนิ่ง)" : ""}
        </span>
        <input type="range" min={0} max={BANNER_PARALLAX_MAX} step={10} value={f.parallax} onChange={(e) => setF((s) => ({ ...s, parallax: Number(e.target.value) }))} className="w-full accent-accent" />
        <span className="mt-1 block text-[11px] text-sub">ยิ่งมาก ภาพยิ่งเลื่อนต่างจากเนื้อหาเวลา scroll · 0 = ปิดเอฟเฟกต์</span>
      </label>

      <div className="flex items-center gap-3 border-t border-line pt-3">
        <button onClick={() => onSave(f)} disabled={saving || uploading} className="rounded-full bg-accent px-6 py-2 text-[14px] font-medium text-white transition hover:bg-accent/90 disabled:opacity-50">บันทึก</button>
        <button onClick={onReset} disabled={saving} className="text-[13px] text-sub hover:text-ink">คืนค่าเริ่มต้น</button>
      </div>
    </div>
  );
}

function ModeBtn({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition ${active ? "bg-ink text-white" : "border border-line text-ink hover:bg-mist"}`}
    >
      {children}
    </button>
  );
}
