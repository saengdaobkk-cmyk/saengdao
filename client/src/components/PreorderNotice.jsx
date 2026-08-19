// แจ้งเตือนเมื่อมีสินค้าพรีออเดอร์ในตะกร้า — ทั้งออเดอร์จะจัดส่งพร้อมของพรีออเดอร์
export default function PreorderNotice({ items, className = "" }) {
  const pre = (items || []).filter((i) => i.preorder);
  if (pre.length === 0) return null;
  const notes = [...new Set(pre.map((i) => (i.preorderNote || "").trim()).filter(Boolean))];

  return (
    <div className={`flex gap-2.5 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3.5 py-3 text-[13px] ${className}`}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-indigo-600">
        <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
      </svg>
      <div className="text-indigo-700" lang="th">
        <p className="font-medium">มีสินค้า<span className="whitespace-nowrap">พรีออเดอร์</span>ในคำสั่งซื้อ</p>
        <p className="mt-0.5 text-indigo-600/90">สินค้าทั้งหมดในออเดอร์จะจัดส่งพร้อมกันเมื่อสินค้า<span className="whitespace-nowrap">พรีออเดอร์</span>พร้อมส่ง</p>
        {notes.length > 0 && (
          <p className="mt-1 font-medium">
            {notes.map((n, i) => <span key={i} className="whitespace-nowrap">{i > 0 ? " · " : ""}{n}</span>)}
          </p>
        )}
      </div>
    </div>
  );
}
