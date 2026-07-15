import { useState } from "react";
import { useAdminContent, useSaveContent } from "../../api/content";

export default function AdminContent() {
  const { data, isLoading } = useAdminContent();
  const save = useSaveContent();
  const [active, setActive] = useState(0);
  const [edits, setEdits] = useState({}); // key -> value ที่แก้
  const [savedFor, setSavedFor] = useState("");

  if (isLoading) return <p className="text-sub">กำลังโหลด...</p>;

  const sections = data.sections;
  const section = sections[active];
  const valueOf = (item) => (edits[item.key] != null ? edits[item.key] : item.value);
  const setValue = (key, v) => {
    setEdits((e) => ({ ...e, [key]: v }));
    setSavedFor("");
  };

  const saveSection = () => {
    // ส่งเฉพาะ key ในหมวดนี้ที่ถูกแก้
    const updates = {};
    for (const item of section.items) if (item.key in edits) updates[item.key] = edits[item.key];
    if (Object.keys(updates).length === 0) return;
    save.mutate(updates, { onSuccess: () => setSavedFor(section.key) });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
      {/* เลือกหน้า/section */}
      <aside className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1">
        {sections.map((s, idx) => (
          <button
            key={s.key}
            onClick={() => setActive(idx)}
            className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-left text-[17px] transition ${
              idx === active ? "bg-ink text-white" : "text-sub hover:bg-mist hover:text-ink"
            }`}
          >
            {s.label}
          </button>
        ))}
      </aside>

      {/* ข้อความในหมวดนั้น */}
      <div className="rounded-2xl border border-line bg-white p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[18px] font-semibold text-ink">{section.label}</h2>
          <p className="text-[15px] text-sub">{section.items.length} ข้อความ</p>
        </div>

        <div className="space-y-5">
          {section.items.map((item) => {
            const v = valueOf(item);
            const long = v.length > 45;
            return (
              <label key={item.key} className="block">
                <span className="mb-1.5 block text-[16px] font-medium text-ink">{item.label}</span>
                {long ? (
                  <textarea
                    value={v}
                    onChange={(e) => setValue(item.key, e.target.value)}
                    rows={2}
                    className="w-full resize-none rounded-xl border border-line px-4 py-2.5 text-[17px] text-ink outline-none focus:border-ink/30"
                  />
                ) : (
                  <input
                    value={v}
                    onChange={(e) => setValue(item.key, e.target.value)}
                    className="w-full rounded-xl border border-line px-4 py-2.5 text-[17px] text-ink outline-none focus:border-ink/30"
                  />
                )}
                <span className="mt-1 block text-[14px] text-sub/70">{item.key}</span>
              </label>
            );
          })}
        </div>

        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={saveSection}
            disabled={save.isPending}
            className="rounded-full bg-accent px-6 py-2.5 text-[17px] font-medium text-white transition hover:bg-accent/90 disabled:opacity-50"
          >
            {save.isPending ? "กำลังบันทึก..." : "บันทึกหมวดนี้"}
          </button>
          {savedFor === section.key && <span className="text-[16px] text-emerald-600">บันทึกแล้ว — หน้าร้านอัปเดตทันที</span>}
        </div>
      </div>
    </div>
  );
}
