import { useEffect, useState } from "react";
import { useSettings, useUpdateSettings } from "../../api/settings";
import { uploadImage } from "../../api/admin";

export default function AdminSettings() {
  const settings = useSettings();
  const update = useUpdateSettings();

  return (
    <div className="space-y-12">
      <BrandSettings settings={settings} save={update} />

      {/* การแสดงผล */}
      <section>
        <h2 className="mb-4 text-[15px] font-semibold text-ink">การแสดงผล</h2>
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
          <ToggleRow
            title="แถบโปรโมชั่นเอียง (ribbon)"
            desc="แถบไล่สีเอียง เลื่อนข้อความ+โลโก้ · แก้ข้อความได้ที่ ข้อความในเว็บ → ส่วนกลาง"
            checked={settings.showPromoRibbon}
            disabled={update.isPending}
            onChange={(v) => update.mutate({ showPromoRibbon: v })}
          />
          <ToggleRow
            title="แถบตัวอักษรใหญ่เลื่อน (2 แถว)"
            desc="ตัวอักษรใหญ่ 2 แถว เลื่อนสวนทาง (ฟ้า/เหลือง) · แก้ข้อความที่ ข้อความในเว็บ → ส่วนกลาง"
            checked={settings.showTextMarquee}
            disabled={update.isPending}
            onChange={(v) => update.mutate({ showTextMarquee: v })}
          />
          <ToggleRow
            title="แถบเมนูโปร่งใสทับสไลด์ (หน้าแรก)"
            desc="เปิด: เมนูบนโปร่งใสทับสไลด์ ตัวอักษรขาว แล้วทึบเมื่อเลื่อนลง · เหมาะกับสไลด์พื้นเข้ม/มีรูป · ปิดถ้าสไลด์พื้นสว่าง"
            checked={settings.transparentHeader}
            disabled={update.isPending}
            onChange={(v) => update.mutate({ transparentHeader: v })}
          />
        </div>
      </section>

      <LoyaltySettings settings={settings} save={update} />
      <ContactSettings settings={settings} save={update} />
      <PaymentSettings settings={settings} save={update} />
    </div>
  );
}

function LoyaltySettings({ settings, save }) {
  const [per, setPer] = useState(settings.loyaltyBahtPerPoint || "100");
  const [saved, setSaved] = useState(false);
  useEffect(() => { setPer(settings.loyaltyBahtPerPoint || "100"); }, [settings.loyaltyBahtPerPoint]);
  return (
    <section>
      <h2 className="mb-1 text-[15px] font-semibold text-ink">แต้มสะสม (Loyalty)</h2>
      <p className="mb-4 text-[12px] text-sub">ลูกค้าได้แต้มอัตโนมัติเมื่อออเดอร์ถูกยืนยันชำระเงิน · ปรับ/หักแต้มด้วยมือได้ที่หน้า “ลูกค้า”</p>
      <div className="divide-y divide-line rounded-2xl border border-line bg-white">
        <ToggleRow
          title="เปิดระบบแต้มสะสม"
          desc="เปิด: ทุกออเดอร์ที่ชำระเงินแล้วจะได้แต้มตามอัตราด้านล่างโดยอัตโนมัติ"
          checked={settings.loyaltyEnabled}
          disabled={save.isPending}
          onChange={(v) => save.mutate({ loyaltyEnabled: v })}
        />
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="text-[14px] font-medium text-ink">อัตราการได้แต้ม</p>
            <p className="text-[12px] text-sub">ยอดซื้อทุกๆ กี่บาท ได้ 1 แต้ม (ปัดลง)</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-sub">ทุก</span>
            <input type="number" min="1" value={per} onChange={(e) => { setPer(e.target.value); setSaved(false); }}
              className="w-24 rounded-lg border border-line px-3 py-2 text-center text-[14px] outline-none focus:border-ink/30" />
            <span className="text-[13px] text-sub">บาท = 1 แต้ม</span>
            <button
              onClick={() => save.mutate({ loyaltyBahtPerPoint: String(Math.max(1, parseInt(per) || 100)) }, { onSuccess: () => setSaved(true) })}
              className="rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-white hover:bg-accent/90">บันทึก</button>
            {saved && <span className="text-[13px] text-emerald-600">✓</span>}
          </div>
        </div>
      </div>
    </section>
  );
}

function BrandSettings({ settings, save }) {
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const logo = settings.logoUrl || "";

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setSaved(false);
    try {
      const url = await uploadImage(file);
      save.mutate({ logoUrl: url }, { onSuccess: () => setSaved(true) });
    } catch {
      /* ไม่สำเร็จ */
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      <h2 className="mb-1 text-[15px] font-semibold text-ink">โลโก้ร้าน</h2>
      <p className="mb-4 text-[12px] text-sub">ตัวอักษร SAENGDAO ใช้บนแถบเมนู + ท้ายเว็บ (ปรับขนาดได้) · รูปโลโก้ใช้บนหน้าติดต่อ</p>
      <div className="space-y-6 rounded-2xl border border-line bg-white p-6">
        {/* ขนาดตัวอักษรโลโก้ */}
        <div className="space-y-5">
          <p className="text-[13px] font-semibold text-ink">ขนาดตัวอักษร SAENGDAO</p>
          <LogoSizeSlider settings={settings} save={save} type="text" settingKey="logoSizeHeader" label="แถบเมนู (บนสุด)" def={16} min={12} max={28} />
          <LogoSizeSlider settings={settings} save={save} type="text" settingKey="logoSizeFooter" label="ท้ายเว็บ (footer)" def={15} min={12} max={28} />
        </div>

        {/* รูปโลโก้ (หน้าติดต่อ) */}
        <div className="space-y-5 border-t border-line pt-5">
          <p className="text-[13px] font-semibold text-ink">รูปโลโก้ (หน้าติดต่อ)</p>
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex h-24 w-40 items-center justify-center overflow-hidden rounded-2xl border border-line bg-mist">
              {logo ? <img src={logo} alt="โลโก้" className="max-h-16 w-auto object-contain p-2" /> : <span className="text-[12px] text-sub">ยังไม่มี</span>}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="cursor-pointer rounded-full border border-line px-5 py-2.5 text-[14px] font-medium text-ink transition hover:bg-mist">
                {busy ? "กำลังอัปโหลด..." : logo ? "เปลี่ยนโลโก้" : "อัปโหลดโลโก้"}
                <input type="file" accept="image/*" onChange={onFile} className="hidden" />
              </label>
              {logo && (
                <button type="button" onClick={() => { save.mutate({ logoUrl: "" }); setSaved(false); }} className="text-[13px] text-sub hover:text-red-600">
                  ลบโลโก้
                </button>
              )}
              {saved && <span className="text-[13px] text-emerald-600">บันทึกแล้ว</span>}
            </div>
          </div>
          {logo && <LogoSizeSlider settings={settings} save={save} type="image" settingKey="logoSize" label="ขนาดบนหน้าติดต่อ" def={56} min={28} max={140} />}
        </div>
      </div>
    </section>
  );
}

function LogoSizeSlider({ settings, save, settingKey, label, def, min, max, type = "image" }) {
  const logo = settings.logoUrl || "";
  const [size, setSize] = useState(Number(settings[settingKey]) || def);
  useEffect(() => { setSize(Number(settings[settingKey]) || def); }, [settings, settingKey, def]);
  const commit = () => save.mutate({ [settingKey]: String(size) });
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[13px] text-ink">{label}</span>
        <span className="text-[13px] tabular-nums text-sub">{size}px</span>
      </div>
      <div className="flex items-center gap-4">
        <input
          type="range" min={min} max={max} step={type === "text" ? 1 : 2} value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          onMouseUp={commit}
          onTouchEnd={commit}
          className="w-full max-w-sm accent-accent"
        />
        <span className="flex h-10 shrink-0 items-center">
          {type === "text" ? (
            <span className="font-semibold tracking-[0.22em] text-ink" style={{ fontSize: `${size}px` }}>SAENGDAO</span>
          ) : (
            <img src={logo} alt="" style={{ height: `${size}px` }} className="w-auto object-contain" />
          )}
        </span>
      </div>
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
      <h2 className="mb-1 text-[15px] font-semibold text-ink">ข้อมูลติดต่อ</h2>
      <p className="mb-4 text-[12px] text-sub">แสดงบนหน้า "ติดต่อเรา" และ footer</p>
      <form onSubmit={submit} className="space-y-6 rounded-2xl border border-line bg-white p-6">
        <div>
          <p className="mb-3 text-[13px] font-semibold text-ink">ติดต่อ</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="เบอร์โทรศัพท์" value={form.contactPhone} onChange={set("contactPhone")} placeholder="0812345678" />
            <Input label="อีเมล" value={form.contactEmail} onChange={set("contactEmail")} placeholder="hello@saengdao.com" />
            <Input label="LINE ID" value={form.contactLine} onChange={set("contactLine")} placeholder="@saengdao" />
            <Input label="เวลาทำการ" value={form.contactHours} onChange={set("contactHours")} placeholder="จ–ส 09:00–18:00" />
            <Input label="ที่อยู่" value={form.contactAddress} onChange={set("contactAddress")} placeholder="123 ถนน... กรุงเทพฯ" className="sm:col-span-2" />
          </div>
        </div>
        <div>
          <p className="mb-3 text-[13px] font-semibold text-ink">โซเชียล (ลิงก์เพจ)</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Facebook (URL)" value={form.socialFacebook} onChange={set("socialFacebook")} placeholder="https://facebook.com/..." />
            <Input label="Instagram (URL)" value={form.socialInstagram} onChange={set("socialInstagram")} placeholder="https://instagram.com/..." />
            <Input label="LINE (URL)" value={form.socialLine} onChange={set("socialLine")} placeholder="https://lin.ee/..." />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button type="submit" disabled={save.isPending} className="rounded-full bg-ink px-6 py-2.5 text-[14px] font-medium text-white transition hover:bg-ink/90 disabled:opacity-50">
            {save.isPending ? "กำลังบันทึก..." : "บันทึก"}
          </button>
          {saved && <span className="text-[13px] text-emerald-600">บันทึกแล้ว</span>}
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
      <h2 className="mb-1 text-[15px] font-semibold text-ink">การชำระเงิน</h2>
      <p className="mb-4 text-[12px] text-sub">แสดงให้ลูกค้าเห็นตอนชำระเงิน (QR สร้างจากพร้อมเพย์อัตโนมัติ)</p>

      <form onSubmit={submit} className="space-y-6 rounded-2xl border border-line bg-white p-6">
        <div>
          <p className="mb-3 text-[13px] font-semibold text-ink">พร้อมเพย์</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="เบอร์ / เลขบัตรประชาชน" value={form.promptpayId} onChange={set("promptpayId")} placeholder="0812345678" />
            <Input label="ชื่อบัญชีพร้อมเพย์" value={form.promptpayName} onChange={set("promptpayName")} />
          </div>
        </div>
        <div>
          <p className="mb-3 text-[13px] font-semibold text-ink">บัญชีธนาคาร</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="ธนาคาร" value={form.bankName} onChange={set("bankName")} />
            <Input label="เลขบัญชี" value={form.bankAccountNo} onChange={set("bankAccountNo")} />
            <Input label="ชื่อบัญชี" value={form.bankAccountName} onChange={set("bankAccountName")} />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button type="submit" disabled={save.isPending} className="rounded-full bg-ink px-6 py-2.5 text-[14px] font-medium text-white transition hover:bg-ink/90 disabled:opacity-50">
            {save.isPending ? "กำลังบันทึก..." : "บันทึก"}
          </button>
          {saved && <span className="text-[13px] text-emerald-600">บันทึกแล้ว</span>}
        </div>
      </form>
    </section>
  );
}

function ToggleRow({ title, desc, checked, onChange, disabled }) {
  return (
    <div className="flex items-center justify-between gap-6 px-5 py-4">
      <div>
        <p className="text-[14px] font-medium text-ink">{title}</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-sub">{desc}</p>
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
      <span className="mb-1.5 block text-[12px] font-medium text-sub">{label}</span>
      <input value={value} onChange={onChange} placeholder={placeholder} className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-[14px] text-ink outline-none transition placeholder:text-sub/50 focus:border-ink/30" />
    </label>
  );
}
