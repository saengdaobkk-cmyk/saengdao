import { useContent } from "../api/content";

// หน้ากฎหมาย (เงื่อนไข/นโยบาย) — เนื้อหาแก้ได้ที่ ข้อความในเว็บ → หน้ากฎหมาย
// รองรับหัวข้อย่อยด้วยการขึ้นบรรทัดว่าง + ขึ้นต้นด้วย "## " · บุลเล็ตขึ้นต้นด้วย "- "
export default function LegalPage({ titleKey, bodyKey }) {
  const { t } = useContent();
  const title = t(titleKey, "");
  const body = t(bodyKey, "");
  const blocks = body.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);

  return (
    <div className="mx-auto max-w-2xl px-5 py-16 sm:py-20">
      <h1 className="text-3xl font-semibold tracking-tightest text-ink sm:text-4xl">{title}</h1>
      <div className="mt-8 space-y-5">
        {blocks.map((block, i) => {
          if (block.startsWith("## ")) {
            return <h2 key={i} className="pt-4 text-[18px] font-semibold tracking-tight text-ink">{block.slice(3).trim()}</h2>;
          }
          // บล็อกที่เป็นรายการบุลเล็ต ("- ...") → render เป็น <ul>
          const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
          if (lines.length && lines.every((l) => l.startsWith("- "))) {
            return (
              <ul key={i} className="space-y-2 pl-1">
                {lines.map((l, j) => (
                  <li key={j} className="flex gap-2.5 text-[15px] leading-relaxed text-ink/80">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ink/30" />
                    <span>{l.slice(2)}</span>
                  </li>
                ))}
              </ul>
            );
          }
          return <p key={i} className="whitespace-pre-line text-[15px] leading-relaxed text-ink/80">{block}</p>;
        })}
      </div>
    </div>
  );
}
