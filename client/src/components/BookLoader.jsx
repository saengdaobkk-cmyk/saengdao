// โหลดเดอร์รูปหนังสือกำลังพลิกหน้า (CSS animation)
export default function BookLoader({ label = "กำลังโหลด", className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-5 py-16 ${className}`}>
      <div className="sd-bk" role="status" aria-label={label}>
        <span className="sd-bk__bar" />
        <span className="sd-bk__bar" />
        <span className="sd-bk__bar" />
        <span className="sd-bk__bar" />
        <span className="sd-bk__bar" />
      </div>
      {label && <p className="text-[13px] tracking-wide text-sub">{label}</p>}
    </div>
  );
}
