import { useSettings, useUpdateSettings } from "../../api/settings";
import { parseOrder, SECTION_LABEL } from "../../lib/homeSections";

export default function AdminHomeLayout() {
  const settings = useSettings();
  const update = useUpdateSettings();
  const order = parseOrder(settings.homeSectionOrder);

  const move = (i, dir) => {
    const next = [...order];
    const target = i + dir;
    if (target < 0 || target >= next.length) return;
    [next[i], next[target]] = [next[target], next[i]];
    update.mutate({ homeSectionOrder: JSON.stringify(next) });
  };

  return (
    <div className="w-full space-y-6">
      <p className="text-[13px] text-sub">
        เรียงลำดับ section บนหน้าแรกด้วยปุ่มลูกศร ▲▼ · บาง section ต้องเปิดใช้งานก่อนที่ ตั้งค่า → การแสดงผล (เช่น แถบตัวอักษร/โปรฯ/สำนักพิมพ์) และ Hot Deal จะขึ้นเมื่อมีสินค้าราคาพิเศษ
      </p>

      <div className="rounded-2xl border border-line bg-white p-2">
        <ul className="divide-y divide-line">
          {order.map((key, i) => (
            <li key={key} className="flex items-center gap-3 px-2 py-3">
              <div className="flex flex-col gap-0.5">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="flex h-6 w-6 items-center justify-center rounded-md text-sub transition hover:bg-mist hover:text-ink disabled:opacity-20 disabled:hover:bg-transparent" aria-label="เลื่อนขึ้น">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M6 15l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <button onClick={() => move(i, 1)} disabled={i === order.length - 1} className="flex h-6 w-6 items-center justify-center rounded-md text-sub transition hover:bg-mist hover:text-ink disabled:opacity-20 disabled:hover:bg-transparent" aria-label="เลื่อนลง">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
              <span className="w-6 text-center text-[13px] font-semibold text-sub">{i + 1}</span>
              <span className="flex-1 text-[14px] font-medium text-ink">{SECTION_LABEL[key] || key}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={() => update.mutate({ homeSectionOrder: "" })}
        className="text-[13px] text-sub hover:text-ink"
      >
        คืนค่าลำดับเริ่มต้น
      </button>
    </div>
  );
}
