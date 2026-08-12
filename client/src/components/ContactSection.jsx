import { useSettings } from "../api/settings";
import { useContent } from "../api/content";

// ส่วนติดต่อเรา — ข้อมูลติดต่ออย่างเดียว (ไม่มีฟอร์ม) ใช้ในหน้า About
// ดีไซน์ editorial 2 คอลัมน์: ซ้าย = หัวข้อ+โซเชียล, ขวา = ช่องทางติดต่อเป็นลิสต์มีเส้นคั่น
export default function ContactSection({ id = "contact" }) {
  const s = useSettings();
  const { t } = useContent();
  const rows = [
    s.contactPhone && { icon: <PhoneIcon />, label: "โทรศัพท์", value: s.contactPhone, href: `tel:${s.contactPhone}` },
    s.contactEmail && { icon: <MailIcon />, label: "อีเมล", value: s.contactEmail, href: `mailto:${s.contactEmail}` },
    s.contactLine && { icon: <ChatIcon />, label: "LINE", value: s.contactLine, href: s.socialLine || undefined },
    s.contactAddress && { icon: <PinIcon />, label: "ที่อยู่", value: s.contactAddress },
    s.contactHours && { icon: <ClockIcon />, label: "เวลาทำการ", value: s.contactHours },
  ].filter(Boolean);
  const hasSocial = s.socialFacebook || s.socialInstagram || s.socialLine;

  // แผนที่: รองรับทั้ง URL และโค้ด <iframe> ที่แอดมินวาง
  const rawMap = (s.contactMapUrl || "").trim();
  const mapFromIframe = rawMap.match(/src=["']([^"']+)["']/i);
  const candidateMap = mapFromIframe ? mapFromIframe[1] : rawMap;
  // ใช้ลิงก์ที่ใส่ได้เฉพาะที่ฝัง iframe ได้จริง (embed) — ลิงก์แชร์/สั้น (maps.app.goo.gl) ฝังไม่ได้
  const customMap = /\/maps\/embed|output=embed/i.test(candidateMap) ? candidateMap : "";
  const autoMap = s.contactAddress ? `https://maps.google.com/maps?q=${encodeURIComponent(s.contactAddress)}&z=16&output=embed` : "";
  const mapSrc = customMap || autoMap; // ลิงก์ผิดประเภท → ตกไปใช้แผนที่จากที่อยู่
  const showMap = s.contactMapEnabled && mapSrc;

  return (
    <section id={id} className="scroll-mt-24 border-t border-line">
      <div className="mx-auto max-w-page px-5 py-20 sm:py-24">
        <div className={`grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20 ${showMap ? "lg:items-center" : ""}`}>
          {/* ซ้าย: หัวข้อ + โซเชียล */}
          <div>
            <p className="flex items-center gap-2.5 text-[13.5px] font-semibold tracking-[0.03em] text-accent">
              <span aria-hidden>✦</span> {t("contact.eyebrow", "ติดต่อเรา")}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tightest text-ink sm:text-[2.5rem] sm:leading-[1.08]">
              {t("contact.heading", "ยินดีให้บริการ")}
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-sub">
              {t("contact.subtitle", "มีคำถามเรื่องหนังสือ คำสั่งซื้อ หรือการจัดส่ง? ทักมาได้เลย เราตอบทุกข้อความ")}
            </p>

            {hasSocial && (
              <div className="mt-8 flex gap-3">
                {s.socialFacebook && <Social href={s.socialFacebook} label="Facebook"><path d="M14 9V7c0-1 .5-1.5 1.5-1.5H17V2.5h-2.5C12 2.5 11 4 11 6v3H9v3h2v9h3v-9h2l.5-3H14Z" /></Social>}
                {s.socialInstagram && <Social href={s.socialInstagram} label="Instagram"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></Social>}
                {s.socialLine && <Social href={s.socialLine} label="LINE"><circle cx="12" cy="11" r="8" /><path d="M8 11h1M12 11h.01M15 9v4" /></Social>}
              </div>
            )}

            {showMap && (
              <div className="mt-10 overflow-hidden rounded-2xl border border-line">
                <iframe
                  title="แผนที่ร้าน"
                  src={mapSrc}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                  className="block h-64 w-full sm:h-72"
                  style={{ border: 0 }}
                />
              </div>
            )}
          </div>

          {/* ขวา: ช่องทางติดต่อเป็นลิสต์มีเส้นคั่น */}
          {rows.length > 0 ? (
            <div className="lg:pt-1.5">
              {rows.map((r, i) => (
                <Row key={i} {...r} first={i === 0} />
              ))}
            </div>
          ) : (
            <p className="text-[14px] text-sub">ยังไม่ได้ตั้งค่าข้อมูลติดต่อ — เพิ่มได้ที่ จัดการร้าน → ตั้งค่า</p>
          )}
        </div>
      </div>
    </section>
  );
}

function Row({ icon, label, value, href, first }) {
  const inner = (
    <>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mist text-accent transition-colors group-hover:bg-accent group-hover:text-white">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] tracking-wide text-sub">{label}</span>
        <span className="mt-0.5 block text-[16px] leading-snug text-ink">{value}</span>
      </span>
      {href && (
        <svg className="mt-1 shrink-0 text-sub opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      )}
    </>
  );
  const cls = `group flex items-start gap-5 py-6 ${first ? "" : "border-t border-line"}`;
  return href ? (
    <a href={href} className={cls}>{inner}</a>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

function Social({ href, label, children }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-sub transition hover:border-ink/30 hover:text-ink">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
    </a>
  );
}

const ic = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" };
function PhoneIcon() { return <svg {...ic}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" /></svg>; }
function MailIcon() { return <svg {...ic}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>; }
function ChatIcon() { return <svg {...ic}><path d="M21 12a8 8 0 0 1-11.3 7.3L4 21l1.7-5.7A8 8 0 1 1 21 12Z" /></svg>; }
function PinIcon() { return <svg {...ic}><path d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10Z" /><circle cx="12" cy="11" r="2" /></svg>; }
function ClockIcon() { return <svg {...ic}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>; }
