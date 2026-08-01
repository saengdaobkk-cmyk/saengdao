import { useState } from "react";
import { useSettings, useUpdateSettings } from "../../api/settings";
import { useBooks } from "../../api/books";
import { parseOrder, parseRows, SECTION_LABEL, ROW_SORTS, ROW_KEYS, ROW_DEFAULTS } from "../../lib/homeSections";
import { img } from "../../lib/img";

const inp = "w-full rounded-lg border border-line bg-white px-3 py-2 text-[14px] outline-none focus:border-ink/30";

export default function AdminHomeLayout() {
  const settings = useSettings();
  const update = useUpdateSettings();
  const order = parseOrder(settings.homeSectionOrder);
  const rows = parseRows(settings.homeRows);
  const [editing, setEditing] = useState("");

  const move = (i, dir) => {
    const next = [...order];
    const target = i + dir;
    if (target < 0 || target >= next.length) return;
    [next[i], next[target]] = [next[target], next[i]];
    update.mutate({ homeSectionOrder: JSON.stringify(next) });
  };

  const saveRow = (key, cfg) => {
    const nextRows = { ...rows, [key]: cfg };
    update.mutate({ homeRows: JSON.stringify(nextRows) }, { onSuccess: () => setEditing("") });
  };

  return (
    <div className="w-full space-y-6">
      <p className="text-[13px] text-sub">
        เรียงลำดับ section ด้วยปุ่มลูกศร ▲▼ · แถวหนังสือ (มาใหม่/ขายดี) กด “แก้ไข” เพื่อตั้งหัวข้อ คำโปรย และเลือกหนังสือเอง/อัตโนมัติ · บาง section ต้องเปิดที่ ตั้งค่า → การแสดงผล
      </p>

      <div className="rounded-2xl border border-line bg-white p-2">
        <ul className="divide-y divide-line">
          {order.map((key, i) => {
            const editable = ROW_KEYS.includes(key);
            const isOpen = editing === key;
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
                    <span className="text-[14px] font-medium text-ink">{SECTION_LABEL[key] || key}</span>
                    {editable && (
                      <span className="ml-2 text-[12px] text-sub">
                        · {rows[key].title} {rows[key].mode === "manual" ? `(เลือกเอง ${rows[key].bookIds.length} เล่ม)` : "(อัตโนมัติ)"}
                      </span>
                    )}
                  </div>
                  {editable && (
                    <button onClick={() => setEditing(isOpen ? "" : key)} className="shrink-0 rounded-full border border-line px-4 py-1.5 text-[13px] font-medium text-ink transition hover:bg-mist">
                      {isOpen ? "ปิด" : "แก้ไข"}
                    </button>
                  )}
                </div>

                {editable && isOpen && (
                  <RowEditor cfg={rows[key]} saving={update.isPending} onSave={(cfg) => saveRow(key, cfg)} onReset={() => saveRow(key, ROW_DEFAULTS[key])} />
                )}
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

function RowEditor({ cfg, onSave, onReset, saving }) {
  const [title, setTitle] = useState(cfg.title);
  const [subtitle, setSubtitle] = useState(cfg.subtitle);
  const [mode, setMode] = useState(cfg.mode);
  const [sort, setSort] = useState(cfg.sort);
  const [bookIds, setBookIds] = useState(cfg.bookIds);
  const [q, setQ] = useState("");

  // รายละเอียดเล่มที่เลือก (โชว์ชื่อ/ปก) — คงลำดับตาม bookIds
  const { data: selData } = useBooks({ ids: bookIds.join(",") });
  const selBooks = bookIds.map((id) => selData?.items?.find((b) => b.id === id)).filter(Boolean);
  // ผลค้นหา
  const { data: searchData } = useBooks(q.trim() ? { q: q.trim(), limit: 8 } : { ids: "" });
  const results = (q.trim() ? searchData?.items : []) || [];

  const add = (id) => { if (!bookIds.includes(id)) setBookIds([...bookIds, id]); };
  const removeBook = (id) => setBookIds(bookIds.filter((x) => x !== id));
  const moveBook = (i, dir) => {
    const t = i + dir;
    if (t < 0 || t >= bookIds.length) return;
    const n = [...bookIds];
    [n[i], n[t]] = [n[t], n[i]];
    setBookIds(n);
  };

  const save = () => onSave({ title: title.trim() || cfg.title, subtitle: subtitle.trim(), mode, sort, bookIds });

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

      <div>
        <span className="mb-1.5 block text-[12px] text-sub">เลือกหนังสือ</span>
        <div className="flex gap-2">
          <ModeBtn active={mode === "auto"} onClick={() => setMode("auto")}>อัตโนมัติ</ModeBtn>
          <ModeBtn active={mode === "manual"} onClick={() => setMode("manual")}>เลือกเอง</ModeBtn>
        </div>
      </div>

      {mode === "auto" ? (
        <label className="block max-w-sm">
          <span className="mb-1 block text-[12px] text-sub">เรียงลำดับ</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className={inp}>
            {ROW_SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>
      ) : (
        <div className="space-y-3">
          {/* เล่มที่เลือก */}
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

          {/* ค้นหาเพิ่ม */}
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

      <div className="flex items-center gap-3 border-t border-line pt-3">
        <button onClick={save} disabled={saving} className="rounded-full bg-accent px-6 py-2 text-[14px] font-medium text-white transition hover:bg-accent/90 disabled:opacity-50">บันทึก</button>
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
