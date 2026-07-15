import { useState } from "react";
import { useSettings } from "../api/settings";

export default function Contact() {
  const s = useSettings();
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
    // ยังไม่ต่อระบบส่งอีเมล — เปิดแอปเมลของผู้ใช้แทน
    const to = CONTACT.email || "";
    const body = `จาก: ${form.name} (${form.email})%0D%0A%0D%0A${encodeURIComponent(form.message)}`;
    window.location.href = `mailto:${to}?subject=ติดต่อจากเว็บ SAENGDAO&body=${body}`;
    setSent(true);
  };

  return (
    <div className="mx-auto max-w-page px-5 py-16 sm:py-24">
      <p className="text-[14px] font-medium tracking-tight text-sub">ติดต่อเรา</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tightest text-ink sm:text-5xl">ยินดีให้บริการ</h1>
      <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-sub">
        มีคำถามเรื่องหนังสือ คำสั่งซื้อ หรือการจัดส่ง? ทักมาได้เลย เราตอบทุกข้อความ
      </p>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        {/* ข้อมูลติดต่อ */}
        <div className="space-y-5">
          {CONTACT.phone && <Info icon="📞" label="โทรศัพท์" value={CONTACT.phone} href={`tel:${CONTACT.phone}`} />}
          {CONTACT.email && <Info icon="✉️" label="อีเมล" value={CONTACT.email} href={`mailto:${CONTACT.email}`} />}
          {CONTACT.line && <Info icon="💬" label="LINE" value={CONTACT.line} />}
          {CONTACT.address && <Info icon="📍" label="ที่อยู่" value={CONTACT.address} />}
          {CONTACT.hours && <Info icon="🕐" label="เวลาทำการ" value={CONTACT.hours} />}
          {!CONTACT.phone && !CONTACT.email && !CONTACT.address && (
            <p className="text-[15px] text-sub">ยังไม่ได้ตั้งค่าข้อมูลติดต่อ — เพิ่มได้ที่ จัดการร้าน → ตั้งค่า</p>
          )}
        </div>

        {/* ฟอร์ม */}
        <div className="rounded-2xl border border-line p-6 sm:p-8">
          <h2 className="text-[16px] font-semibold text-ink">ส่งข้อความถึงเรา</h2>
          <form onSubmit={submit} className="mt-4 space-y-4">
            <Field label="ชื่อ" value={form.name} onChange={set("name")} />
            <Field label="อีเมล" type="email" value={form.email} onChange={set("email")} />
            <label className="block">
              <span className="mb-1.5 block text-[14px] font-medium text-ink">ข้อความ</span>
              <textarea value={form.message} onChange={set("message")} rows={5} required
                className="w-full resize-none rounded-xl border border-line px-4 py-2.5 text-[16px] text-ink outline-none focus:border-ink/30" />
            </label>
            <button type="submit" className="rounded-full bg-accent px-7 py-3 text-[16px] font-medium text-white transition hover:bg-accent/90">
              ส่งข้อความ
            </button>
            {sent && <p className="text-[14px] text-emerald-600">กำลังเปิดแอปอีเมลให้คุณส่ง…</p>}
          </form>
        </div>
      </div>
    </div>
  );
}

function Info({ icon, label, value, href }) {
  const inner = (
    <>
      <span className="text-xl">{icon}</span>
      <span>
        <span className="block text-[13px] text-sub">{label}</span>
        <span className="text-[16px] text-ink">{value}</span>
      </span>
    </>
  );
  return href ? (
    <a href={href} className="flex items-start gap-3 transition hover:opacity-70">{inner}</a>
  ) : (
    <div className="flex items-start gap-3">{inner}</div>
  );
}

function Field({ label, type = "text", value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[14px] font-medium text-ink">{label}</span>
      <input type={type} value={value} onChange={onChange} required
        className="w-full rounded-xl border border-line px-4 py-2.5 text-[16px] text-ink outline-none focus:border-ink/30" />
    </label>
  );
}
