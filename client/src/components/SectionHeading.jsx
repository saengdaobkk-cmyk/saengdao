// หัวข้อ section หน้าแรก — หัวข้อตัวหนาใหญ่ด้านบน + คำโปรยตัวเล็กด้านล่าง
// right = ปุ่ม/ลิงก์ที่วางชิดขวา (เช่น ลูกศรเลื่อน / ดูทั้งหมด)
export default function SectionHeading({ title, subtitle, subtitleClassName = "text-sub", right, className = "" }) {
  return (
    <div className={`flex items-end justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">{title}</h2>
        {subtitle && <p className={`mt-1.5 text-[14px] ${subtitleClassName}`}>{subtitle}</p>}
      </div>
      {right && <div className="shrink-0 pb-1">{right}</div>}
    </div>
  );
}
