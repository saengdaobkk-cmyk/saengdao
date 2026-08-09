import { useSettings } from "../api/settings";
import { useContent } from "../api/content";

// ส่วนติดต่อเรา — ข้อมูลติดต่ออย่างเดียว (ไม่มีฟอร์ม) ใช้ในหน้า About
export default function ContactSection({ id = "contact" }) {
  const s = useSettings();
  const { t } = useContent();
  const items = [
    s.contactPhone && { icon: <PhoneIcon />, label: "โทรศัพท์", value: s.contactPhone, href: `tel:${s.contactPhone}` },
    s.contactEmail && { icon: <MailIcon />, label: "อีเมล", value: s.contactEmail, href: `mailto:${s.contactEmail}` },
    s.contactLine && { icon: <ChatIcon />, label: "LINE", value: s.contactLine, href: s.socialLine || undefined },
    s.contactAddress && { icon: <PinIcon />, label: "ที่อยู่", value: s.contactAddress },
    s.contactHours && { icon: <ClockIcon />, label: "เวลาทำการ", value: s.contactHours },
  ].filter(Boolean);
  const hasSocial = s.socialFacebook || s.socialInstagram || s.socialLine;

  return (
    <section id={id} className="scroll-mt-24 border-t border-line">
      <div className="mx-auto max-w-page px-5 py-20 sm:py-24">
        <p className="flex items-center gap-2.5 text-[13px] font-medium tracking-[0.2em] text-accent">
          <span aria-hidden>✦</span> {t("contact.eyebrow", "ติดต่อเรา")}
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tightest text-ink sm:text-[2.5rem] sm:leading-[1.1]">
          {t("contact.heading", "ยินดีให้บริการ")}
        </h2>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-sub">
          {t("contact.subtitle", "มีคำถามเรื่องหนังสือ คำสั่งซื้อ หรือการจัดส่ง? ทักมาได้เลย เราตอบทุกข้อความ")}
        </p>

        {items.length > 0 ? (
          <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it, i) => (
              <Info key={i} {...it} />
            ))}
          </div>
        ) : (
          <p className="mt-8 text-[14px] text-sub">ยังไม่ได้ตั้งค่าข้อมูลติดต่อ — เพิ่มได้ที่ จัดการร้าน → ตั้งค่า</p>
        )}

        {hasSocial && (
          <div className="mt-8 flex gap-3">
            {s.socialFacebook && <Social href={s.socialFacebook} label="Facebook"><path d="M14 9V7c0-1 .5-1.5 1.5-1.5H17V2.5h-2.5C12 2.5 11 4 11 6v3H9v3h2v9h3v-9h2l.5-3H14Z" /></Social>}
            {s.socialInstagram && <Social href={s.socialInstagram} label="Instagram"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></Social>}
            {s.socialLine && <Social href={s.socialLine} label="LINE"><circle cx="12" cy="11" r="8" /><path d="M8 11h1M12 11h.01M15 9v4" /></Social>}
          </div>
        )}
      </div>
    </section>
  );
}

function Info({ icon, label, value, href }) {
  const inner = (
    <>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mist text-accent">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[12px] tracking-wide text-sub">{label}</span>
        <span className="text-[15px] leading-snug text-ink">{value}</span>
      </span>
    </>
  );
  const cls = "flex items-start gap-4 bg-white p-7";
  return href ? (
    <a href={href} className={`${cls} transition-colors hover:bg-mist/40`}>{inner}</a>
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
