// หัวข้อ section หน้าแรก — สไตล์ editorial: eyebrow ตัวเล็กเว้นระยะ + หัวข้อใหญ่บาง
// right = ปุ่ม/ลิงก์ที่วางชิดขวาระดับล่างของหัวข้อ (เช่น ลูกศรเลื่อน / ดูทั้งหมด)
export default function SectionHeading({ eyebrow, title, eyebrowClassName = "text-sub", right, className = "" }) {
  return (
    <div className={`flex items-end justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        {eyebrow && (
          <p className={`text-[12px] font-medium tracking-[0.16em] ${eyebrowClassName}`}>{eyebrow}</p>
        )}
        <h2 className="mt-2 text-3xl font-extralight tracking-tight text-ink sm:text-[40px]">{title}</h2>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}
