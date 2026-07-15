import { useEffect, useState } from "react";
import { useSettings, useUpdateSettings } from "../../api/settings";

export default function AdminSettings() {
  const settings = useSettings();
  const update = useUpdateSettings();

  return (
    <div className="space-y-12">
      {/* การแสดงผล */}
      <section>
        <h2 className="mb-4 text-[17px] font-semibold text-ink">การแสดงผล</h2>
        <div className="divide-y divide-line rounded-2xl border border-line bg-white">
          <ToggleRow
            title="Cart Drawer"
            desc="เปิด: กดตะกร้าแล้วแผงเลื่อนออกจากด้านขวา · ปิด: ไปหน้าตะกร้าเต็มจอ"
            checked={settings.cartDrawerEnabled}
            disabled={update.isPending}
            onChange={(v) => update.mutate({ cartDrawerEnabled: v })}
          />
          <ToggleRow
            title="แสดงหมวดหมู่บนการ์ดสินค้า"
            desc="เปิด: โชว์ชื่อหมวดหมู่เหนือชื่อหนังสือในการ์ด · ปิด: ซ่อนไว้"
            checked={settings.showCardCategory}
            disabled={update.isPending}
            onChange={(v) => update.mutate({ showCardCategory: v })}
          />
          <ToggleRow
            title="แถบโลโก้สำนักพิมพ์ (หน้าแรก)"
            desc="เปิด: โชว์แถบโลโก้สำนักพิมพ์เลื่อนวนก่อน footer · ปิด: ซ่อน"
            checked={settings.showPublisherMarquee}
            disabled={update.isPending}
            onChange={(v) => update.mutate({ showPublisherMarquee: v })}
          />
        </div>
      </section>

      <ContactSettings settings={settings} save={update} />
      <PaymentSettings settings={settings} save={update} />
    </div>
  );
}

function ContactSettings({ settings, save }) {
  const keys = ["contactPhone", "contactEmail", "contactLine", "contactAddress", "contactHours", "socialFacebook", "socialInstagram", "socialLine"];
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(Object.fromEntries(keys.map((k) => [k, settings[k] || ""])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = (e) => {
    e.preventDefault();
    setSaved(false);
    save.mutate(form, { onSuccess: () => setSaved(true) });
  };

  return (
    <section>
      <h2 className="mb-1 text-[17px] font-semibold text-ink">ข้อมูลติดต่อ</h2>
      <p className="mb-4 text-[14px] text-sub">แสดงบนหน้า "ติดต่อเรา" และ footer</p>
      <form onSubmit={submit} className="space-y-6 rounded-2xl border border-line bg-white p-6">
        <div>
          <p className="mb-3 text-[15px] font-semibold text-ink">ติดต่อ</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="เบอร์โทรศัพท์" value={form.contactPhone} onChange={set("contactPhone")} placeholder="0812345678" />
            <Input label="อีเมล" value={form.contactEmail} onChange={set("contactEmail")} placeholder="hello@saengdao.com" />
            <Input label="LINE ID" value={form.contactLine} onChange={set("contactLine")} placeholder="@saengdao" />
            <Input label="เวลาทำการ" value={form.contactHours} onChange={set("contactHours")} placeholder="จ–ส 09:00–18:00" />
            <Input label="ที่อยู่" value={form.contactAddress} onChange={set("contactAddress")} placeholder="123 ถนน... กรุงเทพฯ" className="sm:col-span-2" />
          </div>
        </div>
        <div>
          <p className="mb-3 text-[15px] font-semibold text-ink">โซเชียล (ลิงก์เพจ)</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Facebook (URL)" value={form.socialFacebook} onChange={set("socialFacebook")} placeholder="https://facebook.com/..." />
            <Input label="Instagram (URL)" value={form.socialInstagram} onChange={set("socialInstagram")} placeholder="https://instagram.com/..." />
            <Input label="LINE (URL)" value={form.socialLine} onChange={set("socialLine")} placeholder="https://lin.ee/..." />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button type="submit" disabled={save.isPending} className="rounded-full bg-ink px-6 py-2.5 text-[16px] font-medium text-white transition hover:bg-ink/90 disabled:opacity-50">
            {save.isPending ? "กำลังบันทึก..." : "บันทึก"}
          </button>
          {saved && <span className="text-[15px] text-emerald-600">บันทึกแล้ว</span>}
        </div>
      </form>
    </section>
  );
}

function PaymentSettings({ settings, save }) {
  const [form, setForm] = useState({
    promptpayId: "",
    promptpayName: "",
    bankName: "",
    bankAccountNo: "",
    bankAccountName: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm({
      promptpayId: settings.promptpayId || "",
      promptpayName: settings.promptpayName || "",
      bankName: settings.bankName || "",
      bankAccountNo: settings.bankAccountNo || "",
      bankAccountName: settings.bankAccountName || "",
    });
  }, [settings]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = (e) => {
    e.preventDefault();
    setSaved(false);
    save.mutate(form, { onSuccess: () => setSaved(true) });
  };

  return (
    <section>
      <h2 className="mb-1 text-[17px] font-semibold text-ink">การชำระเงิน</h2>
      <p className="mb-4 text-[14px] text-sub">แสดงให้ลูกค้าเห็นตอนชำระเงิน (QR สร้างจากพร้อมเพย์อัตโนมัติ)</p>

      <form onSubmit={submit} className="space-y-6 rounded-2xl border border-line bg-white p-6">
        <div>
          <p className="mb-3 text-[15px] font-semibold text-ink">พร้อมเพย์</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="เบอร์ / เลขบัตรประชาชน" value={form.promptpayId} onChange={set("promptpayId")} placeholder="0812345678" />
            <Input label="ชื่อบัญชีพร้อมเพย์" value={form.promptpayName} onChange={set("promptpayName")} />
          </div>
        </div>
        <div>
          <p className="mb-3 text-[15px] font-semibold text-ink">บัญชีธนาคาร</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="ธนาคาร" value={form.bankName} onChange={set("bankName")} />
            <Input label="เลขบัญชี" value={form.bankAccountNo} onChange={set("bankAccountNo")} />
            <Input label="ชื่อบัญชี" value={form.bankAccountName} onChange={set("bankAccountName")} />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button type="submit" disabled={save.isPending} className="rounded-full bg-ink px-6 py-2.5 text-[16px] font-medium text-white transition hover:bg-ink/90 disabled:opacity-50">
            {save.isPending ? "กำลังบันทึก..." : "บันทึก"}
          </button>
          {saved && <span className="text-[15px] text-emerald-600">บันทึกแล้ว</span>}
        </div>
      </form>
    </section>
  );
}

function ToggleRow({ title, desc, checked, onChange, disabled }) {
  return (
    <div className="flex items-center justify-between gap-6 px-5 py-4">
      <div>
        <p className="text-[16px] font-medium text-ink">{title}</p>
        <p className="mt-0.5 text-[14px] leading-relaxed text-sub">{desc}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={title}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50 ${checked ? "bg-accent" : "bg-line"}`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[14px] font-medium text-sub">{label}</span>
      <input value={value} onChange={onChange} placeholder={placeholder} className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-[16px] text-ink outline-none transition placeholder:text-sub/50 focus:border-ink/30" />
    </label>
  );
}
