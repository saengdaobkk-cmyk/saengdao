// ดาวให้คะแนน — โหมดอ่าน (value) หรือกดเลือก (onChange)
export default function Stars({ value = 0, size = 16, onChange, className = "" }) {
  const interactive = !!onChange;
  const rounded = Math.round(value);
  return (
    <div className={`inline-flex items-center gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(n)}
          aria-label={`${n} ดาว`}
          className={interactive ? "cursor-pointer transition hover:scale-110" : "cursor-default"}
        >
          <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={n <= rounded ? "text-amber-400" : "text-line"}>
            <path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17l-6 3.4 1.4-6.8L2.3 9l6.9-.7L12 2Z" />
          </svg>
        </button>
      ))}
    </div>
  );
}
