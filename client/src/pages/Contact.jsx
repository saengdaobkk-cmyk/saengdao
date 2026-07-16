import { useState } from "react";
import { useSettings } from "../api/settings";
import { useContent } from "../api/content";

export default function Contact() {
  const s = useSettings();
  const { t } = useContent();
  const CONTACT = {
    phone: s.contactPhone,
    email: s.contactEmail,
    line: s.contactLine,
    address: s.contactAddress,
    hours: s.contactHours,
  };
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const to = CONTACT.email || "";
    const body = `จาก: ${form.name} (${form.email})%0D%0A%0D%0A${encodeURIComponent(form.message)}`;
    window.location.href = `mailto:${to}?subject=ติดต่อจากเว็บ SAENGDAO&body=${body}`;
    setSent(true);
  };

  return (
    <div className="mx-auto max-w-page px-5 py-16 sm:py-20">
      {/* หัวเพจ */}
      <div className="mx-auto max-w-2xl text-center">
        {s.logoUrl ? (
          <img src={s.logoUrl} alt="SAENGDAO" className="mx-auto mb-6 h-14 w-auto object-contain" />
        ) : (
          <p className="mb-5 text-[15px] font-semibold tracking-[0.28em] text-ink">SAENGDAO</p>
        )}
        <p className="text-[13px] font-medium tracking-tight text-accent">{t("contact.eyebrow", "ติดต่อเรา")}</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tightest text-ink sm:text-5xl">
          {t("contact.heading", "ยินดีให้บริการ")}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-sub">
          {t("contact.subtitle", "มีคำถามเรื่องหนังสือ คำสั่งซื้อ หรือการจัดส่ง? ทักมาได้เลย เราตอบทุกข้อความ")}
        </p>
      </div>

      {/* การ์ด 2 ฝั่ง */}
      <div className="mt-14 grid overflow-hidden rounded-3xl border border-line shadow-sm lg:grid-cols-[0.95fr_1.05fr]">
        {/* ซ้าย: ข้อมูลติดต่อ */}
        <div className="bg-mist/60 p-8 sm:p-10">
          <div className="space-y-6">
            {CONTACT.phone && <Info icon={<PhoneIcon />} label="โทรศัพท์" value={CONTACT.phone} href={`tel:${CONTACT.phone}`} />}
            {CONTACT.email && <Info icon={<MailIcon />} label="อีเมล" value={CONTACT.email} href={`mailto:${CONTACT.email}`} />}
            {CONTACT.line && <Info icon={<ChatIcon />} label="LINE" value={CONTACT.line} href={s.socialLine || undefined} />}
            {CONTACT.address && <Info icon={<PinIcon />} label="ที่อยู่" value={CONTACT.address} />}
            {CONTACT.hours && <Info icon={<ClockIcon />} label="เวลาทำการ" value={CONTACT.hours} />}
            {!CONTACT.phone && !CONTACT.email && !CONTACT.address && (
              <p className="text-[14px] text-sub">ยังไม่ได้ตั้งค่าข้อมูลติดต่อ — เพิ่มได้ที่ จัดการร้าน → ตั้งค่า</p>
            )}
          </div>

          {(s.socialFacebook || s.socialInstagram || s.socialLine) && (
            <div className="mt-8 flex gap-3 border-t border-line pt-6">
              {s.socialFacebook && <Social href={s.socialFacebook} label="Facebook"><path d="M14 9V7c0-1 .5-1.5 1.5-1.5H17V2.5h-2.5C12 2.5 11 4 11 6v3H9v3h2v9h3v-9h2l.5-3H14Z" /></Social>}
              {s.socialInstagram && <Social href={s.socialInstagram} label="Instagram"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></Social>}
              {s.socialLine && <Social href={s.socialLine} label="LINE"><circle cx="12" cy="11" r="8" /><path d="M8 11h1M12 11h.01M15 9v4" /></Social>}
            </div>
          )}
        </div>

        {/* ขวา: ฟอร์ม */}
        <div className="bg-white p-8 sm:p-10">
          <h2 className="text-[18px] font-semibold text-ink">{t("contact.form_heading", "ส่งข้อความถึงเรา")}</h2>
          <p className="mt-1 text-[13px] text-sub">{t("contact.form_desc", "กรอกข้อความ เดี๋ยวเราติดต่อกลับโดยเร็ว")}</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label={t("contact.form_name", "ชื่อ")} value={form.name} onChange={set("name")} />
            <Field label={t("contact.form_email", "อีเมล")} type="email" value={form.email} onChange={set("email")} />
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink">{t("contact.form_message", "ข้อความ")}</span>
              <textarea value={form.message} onChange={set("message")} rows={5} required
                className="w-full resize-none rounded-xl border border-line px-4 py-2.5 text-[15px] text-ink outline-none transition focus:border-ink/30" />
            </label>
            <button type="submit" className="w-full rounded-full bg-accent px-7 py-3 text-[15px] font-medium text-white transition hover:bg-accent/90 active:scale-[0.99]">
              {t("contact.form_submit", "ส่งข้อความ")}
            </button>
            {sent && <p className="text-[13px] text-emerald-600">กำลังเปิดแอปอีเมลให้คุณส่ง…</p>}
          </form>
        </div>
      </div>
    </div>
  );
}

function Info({ icon, label, value, href }) {
  const inner = (
    <>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-accent shadow-sm ring-1 ring-line">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[12px] tracking-wide text-sub">{label}</span>
        <span className="text-[15px] text-ink">{value}</span>
      </span>
    </>
  );
  return href ? (
    <a href={href} className="flex items-start gap-4 transition hover:opacity-70">{inner}</a>
  ) : (
    <div className="flex items-start gap-4">{inner}</div>
  );
}

function Field({ label, type = "text", value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-ink">{label}</span>
      <input type={type} value={value} onChange={onChange} required
        className="w-full rounded-xl border border-line px-4 py-2.5 text-[15px] text-ink outline-none transition focus:border-ink/30" />
    </label>
  );
}

function Social({ href, label, children }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sub shadow-sm ring-1 ring-line transition hover:text-ink">
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
