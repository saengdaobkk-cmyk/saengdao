import { useContent } from "../api/content";

// หน้ากฎหมาย (เงื่อนไข/นโยบาย) — เนื้อหาแก้ได้ที่ ข้อความในเว็บ → หน้ากฎหมาย
export default function LegalPage({ titleKey, bodyKey }) {
  const { t } = useContent();
  const title = t(titleKey, "");
  const body = t(bodyKey, "");
  return (
    <div className="mx-auto max-w-2xl px-5 py-16 sm:py-20">
      <h1 className="text-3xl font-semibold tracking-tightest text-ink">{title}</h1>
      <div className="mt-8 space-y-4 text-[15px] leading-relaxed text-ink/80">
        {body.split(/\n{2,}/).filter(Boolean).map((para, i) => (
          <p key={i} className="whitespace-pre-line">{para}</p>
        ))}
      </div>
    </div>
  );
}
