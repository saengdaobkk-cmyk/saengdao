import { useEffect, useState } from "react";
import { useSettings, useUpdateSettings } from "../../api/settings";
import { uploadImage } from "../../api/admin";

export default function AdminSettings() {
  const settings = useSettings();
  const update = useUpdateSettings();

  return (
    <div className="space-y-12">
      <BrandSettings settings={settings} save={update} />
      <FooterSettings settings={settings} save={update} />

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
            title="แสดงจำนวนหนังสือในหน้าเลือกซื้อ"
            desc="เปิด: โชว์ “X เล่ม” ใต้หัวข้อหน้าหนังสือ/หมวดหมู่ · ปิด: ซ่อน"
            checked={settings.showCollectionCount}
            disabled={update.isPending}
            onChange={(v) => update.mutate({ showCollectionCount: v })}
          />
          <ToggleRow
            title="แถบจุดเด่นในหน้าสินค้า"
            desc="เปิด: โชว์แถบ “จัดส่งฟรีทั่วประเทศ / รับประกันหลังการขาย” ใต้ปุ่มหยิบใส่ตะกร้า · ปิด: ซ่อน"
            checked={settings.showProductTrust}
            disabled={update.isPending}
            onChange={(v) => update.mutate({ showProductTrust: v })}
          />
          <ToggleRow
            title="ปุ่มแชร์ในหน้าบทความ"
            desc="เปิด: โชว์ปุ่มแชร์ Facebook / LINE / X / คัดลอกลิงก์ ใต้หัวข้อบทความ · ปิด: ซ่อน"
            checked={settings.showBlogShare}
            disabled={update.isPending}
            onChange={(v) => update.mutate({ showBlogShare: v })}
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
          <ToggleRow
            title="ปกสินค้าค้างตอนเลื่อน (Sticky)"
            desc="เปิด: รูปปกในหน้าสินค้าค้างอยู่กับที่ตอนเลื่อนอ่านรายละเอียด · ปิด: ปกเลื่อนไปตามหน้าปกติ"
            checked={settings.productStickyCover}
            disabled={update.isPending}
            onChange={(v) => update.mutate({ productStickyCover: v })}
          />
        </div>
      </section>

      <ProductSpecSettings settings={settings} save={update} />
      <LoyaltySettings settings={settings} save={update} />
      <OrderSettings settings={settings} save={update} />
      <ContactSettings settings={settings} save={update} />
      <TurnstileSettings settings={settings} save={update} />
      <PaymentSettings settings={settings} save={update} />
    </div>
  );
}

// ตัวเลือกข้อมูลจำเพาะสินค้า — ประเภทปก/กระดาษ (dropdown ในฟอร์มสินค้า) + หน่วยขนาด/น้ำหนัก
const parseOptList = (raw) => {
  try {
    const a = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(a) ? a.map((x) => String(x).trim()).filter(Boolean) : [];
  } catch {
    return [];
  }
};
function ProductSpecSettings({ settings, save }) {
  const [cover, setCover] = useState(() => parseOptList(settings.coverTypeOptions).join("\n"));
  const [paper, setPaper] = useState(() => parseOptList(settings.paperTypeOptions).join("\n"));
  const [dimU, setDimU] = useState(settings.dimensionUnit ?? "cm.");
  const [wU, setWU] = useState(settings.weightUnit ?? "g");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setCover(parseOptList(settings.coverTypeOptions).join("\n"));
    setPaper(parseOptList(settings.paperTypeOptions).join("\n"));
    setDimU(settings.dimensionUnit ?? "cm.");
    setWU(settings.weightUnit ?? "g");
  }, [settings.coverTypeOptions, settings.paperTypeOptions, settings.dimensionUnit, settings.weightUnit]);

  const toArr = (s) => s.split("\n").map((x) => x.trim()).filter(Boolean);
  const submit = () => {
    save.mutate(
      {
        coverTypeOptions: JSON.stringify(toArr(cover)),
        paperTypeOptions: JSON.stringify(toArr(paper)),
        dimensionUnit: dimU.trim(),
        weightUnit: wU.trim(),
      },
      { onSuccess: () => setSaved(true) }
    );
  };
  const ta = "w-full rounded-xl border border-line px-4 py-2.5 text-[14px] text-ink outline-none focus:border-ink/30 resize-none";
  const inp = "w-24 rounded-lg border border-line px-3 py-2 text-center text-[14px] outline-none focus:border-ink/30";

  return (
    <section>
      <h2 className="mb-1 text-[15px] font-semibold text-ink">ข้อมูลจำเพาะสินค้า</h2>
      <p className="mb-4 text-[12px] text-sub">ตัวเลือกที่จะขึ้นเป็น dropdown ในฟอร์มสินค้า (ปก/กระดาษ) และหน่วยที่เติมท้ายอัตโนมัติ (ขนาด/น้ำหนัก)</p>
      <div className="space-y-5 rounded-2xl border border-line bg-white p-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink">ประเภทปก <span className="font-normal text-sub">(บรรทัดละ 1 ตัวเลือก)</span></span>
            <textarea rows={4} value={cover} onChange={(e) => { setCover(e.target.value); setSaved(false); }} placeholder={"ปกอ่อน\nปกแข็ง"} className={ta} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink">กระดาษเนื้อใน <span className="font-normal text-sub">(บรรทัดละ 1 ตัวเลือก)</span></span>
            <textarea rows={4} value={paper} onChange={(e) => { setPaper(e.target.value); setSaved(false); }} placeholder={"กระดาษถนอมสายตา\nกระดาษปอนด์"} className={ta} />
          </label>
        </div>
        <div className="flex flex-wrap items-end gap-6">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink">หน่วยขนาด</span>
            <input value={dimU} onChange={(e) => { setDimU(e.target.value); setSaved(false); }} placeholder="cm." className={inp} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink">หน่วยน้ำหนัก</span>
            <input value={wU} onChange={(e) => { setWU(e.target.value); setSaved(false); }} placeholder="g" className={inp} />
          </label>
          <div className="flex items-center gap-2">
            <button onClick={submit} disabled={save.isPending} className="rounded-full bg-accent px-5 py-2.5 text-[14px] font-medium text-white hover:bg-accent/90 disabled:opacity-50">
              {save.isPending ? "กำลังบันทึก..." : "บันทึก"}
            </button>
            {saved && <span className="text-[13px] text-emerald-600">✓ บันทึกแล้ว</span>}
          </div>
        </div>
        <p className="text-[11px] text-sub">หน่วยจะถูกเติมท้ายอัตโนมัติเมื่อพิมพ์ค่าในฟอร์มสินค้า เช่น พิมพ์ “330” → บันทึกเป็น “330 {wU || "g"}” · เว้นหน่วยว่าง = ไม่เติม</p>
      </div>
    </section>
  );
}

function OrderSettings({ settings, save }) {
  const [days, setDays] = useState(settings.orderExpiryDays ?? "7");
  const [saved, setSaved] = useState(false);
  useEffect(() => { setDays(settings.orderExpiryDays ?? "7"); }, [settings.orderExpiryDays]);
  const n = parseInt(days);
  return (
    <section>
      <h2 className="mb-1 text-[15px] font-semibold text-ink">คำสั่งซื้อ</h2>
      <p className="mb-4 text-[12px] text-sub">ออเดอร์ที่ยังไม่ชำระเงินเกินกำหนดจะถูกยกเลิกอัตโนมัติ (ระบุว่า “ยกเลิกอัตโนมัติ”)</p>
      <div className="rounded-2xl border border-line bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="text-[14px] font-medium text-ink">ยกเลิกออเดอร์ค้างชำระอัตโนมัติ</p>
            <p className="text-[12px] text-sub">นับจากวันที่สั่งซื้อ · ใส่ 0 เพื่อปิดการยกเลิกอัตโนมัติ</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-sub">เกิน</span>
            <input type="number" min="0" value={days} onChange={(e) => { setDays(e.target.value); setSaved(false); }}
              className="w-20 rounded-lg border border-line px-3 py-2 text-center text-[14px] outline-none focus:border-ink/30" />
            <span className="text-[13px] text-sub">วัน</span>
            <button
              onClick={() => save.mutate({ orderExpiryDays: String(Math.max(0, parseInt(days) || 0)) }, { onSuccess: () => setSaved(true) })}
              className="rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-white hover:bg-accent/90">บันทึก</button>
            {saved && <span className="text-[13px] text-emerald-600">✓</span>}
          </div>
        </div>
        <p className="border-t border-line px-5 py-2.5 text-[12px] text-sub">
          {n > 0 ? `ปัจจุบัน: ยกเลิกออเดอร์ที่ยังไม่ชำระเกิน ${n} วันโดยอัตโนมัติ` : "ปัจจุบัน: ปิดการยกเลิกอัตโนมัติ"}
        </p>
      </div>
    </section>
  );
}

function LoyaltySettings({ settings, save }) {
  const [per, setPer] = useState(settings.loyaltyBahtPerPoint || "100");
  const [val, setVal] = useState(settings.loyaltyPointValue || "1");
  const [saved, setSaved] = useState(false);
  const [savedVal, setSavedVal] = useState(false);
  useEffect(() => { setPer(settings.loyaltyBahtPerPoint || "100"); }, [settings.loyaltyBahtPerPoint]);
  useEffect(() => { setVal(settings.loyaltyPointValue || "1"); }, [settings.loyaltyPointValue]);
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
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="text-[14px] font-medium text-ink">มูลค่าแต้มเวลาแลก</p>
            <p className="text-[12px] text-sub">ลูกค้าใช้แต้มเป็นส่วนลดตอนชำระเงิน — 1 แต้ม = กี่บาท</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-sub">1 แต้ม =</span>
            <input type="number" min="1" value={val} onChange={(e) => { setVal(e.target.value); setSavedVal(false); }}
              className="w-24 rounded-lg border border-line px-3 py-2 text-center text-[14px] outline-none focus:border-ink/30" />
            <span className="text-[13px] text-sub">บาท</span>
            <button
              onClick={() => save.mutate({ loyaltyPointValue: String(Math.max(1, parseInt(val) || 1)) }, { onSuccess: () => setSavedVal(true) })}
              className="rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-white hover:bg-accent/90">บันทึก</button>
            {savedVal && <span className="text-[13px] text-emerald-600">✓</span>}
          </div>
        </div>
      </div>
    </section>
  );
}

const FINP = "w-full rounded-lg border border-line bg-white px-3 py-2 text-[14px] outline-none focus:border-ink/30";
function parseFooterNav(raw) {
  try {
    const p = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Array.isArray(p)) return p.filter((x) => x && (x.label || x.url)).map((x) => ({ label: x.label || "", url: x.url || "" }));
  } catch { /* ค่าเริ่มต้น */ }
  return [
    { label: "หนังสือ", url: "/books" },
    { label: "ติดตามคำสั่งซื้อ", url: "/track" },
    { label: "เกี่ยวกับเรา", url: "/about" },
    { label: "ติดต่อ", url: "/contact" },
  ];
}

function FooterSettings({ settings, save }) {
  const [logo, setLogo] = useState(settings.footerLogoText ?? "SAENGDAO");
  const [rows, setRows] = useState(() => parseFooterNav(settings.footerNav));
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const logoUrl = settings.footerLogoUrl || "";

  const onLogoFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      save.mutate({ footerLogoUrl: url });
    } catch { /* ไม่สำเร็จ */ } finally { setUploading(false); }
  };
  useEffect(() => { setLogo(settings.footerLogoText ?? "SAENGDAO"); }, [settings.footerLogoText]);
  useEffect(() => { setRows(parseFooterNav(settings.footerNav)); }, [settings.footerNav]);

  const dirty = () => setSaved(false);
  const setRow = (i, k, v) => { setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [k]: v } : r))); dirty(); };
  const addRow = () => { setRows((rs) => [...rs, { label: "", url: "" }]); dirty(); };
  const delRow = (i) => { setRows((rs) => rs.filter((_, j) => j !== i)); dirty(); };

  const saveAll = () => {
    const nav = rows.filter((r) => r.label.trim() && r.url.trim()).map((r) => ({ label: r.label.trim(), url: r.url.trim() }));
    save.mutate({ footerLogoText: logo.trim() || "SAENGDAO", footerNav: JSON.stringify(nav) }, { onSuccess: () => setSaved(true) });
  };

  return (
    <section>
      <h2 className="mb-1 text-[15px] font-semibold text-ink">ท้ายเว็บ (Footer)</h2>
      <p className="mb-4 text-[12px] text-sub">แก้โลโก้และเมนูที่แสดงท้ายเว็บ · ลิงก์เงื่อนไข/นโยบายแก้เนื้อหาได้ที่ “ข้อความในเว็บ → หน้ากฎหมาย”</p>
      <div className="space-y-5 rounded-2xl border border-line bg-white p-6">
        {/* โลโก้รูปภาพ */}
        <div>
          <p className="mb-1 text-[13px] font-medium text-ink">โลโก้ (รูปภาพ)</p>
          <p className="mb-2 text-[12px] text-sub">footer พื้นดำ — แนะนำรูปพื้นโปร่ง/สีขาว · ถ้าไม่มีรูปจะใช้ข้อความด้านล่าง</p>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-16 w-40 items-center justify-center overflow-hidden rounded-xl bg-ink">
              {logoUrl ? <img src={logoUrl} alt="โลโก้ footer" className="max-h-10 w-auto object-contain" /> : <span className="text-[12px] text-white/50">ยังไม่มีรูป</span>}
            </div>
            <label className="cursor-pointer rounded-full border border-line px-5 py-2.5 text-[14px] font-medium text-ink transition hover:bg-mist">
              {uploading ? "กำลังอัปโหลด..." : logoUrl ? "เปลี่ยนรูป" : "อัปโหลดรูป"}
              <input type="file" accept="image/*" onChange={onLogoFile} className="hidden" />
            </label>
            {logoUrl && (
              <button type="button" onClick={() => save.mutate({ footerLogoUrl: "" })} className="text-[13px] text-sub hover:text-red-600">ลบรูป</button>
            )}
          </div>
          {logoUrl && (
            <div className="mt-4">
              <LogoSizeSlider settings={settings} save={save} type="image" settingKey="footerLogoSize" label="ขนาดโลโก้" def={36} min={20} max={80} previewSrc={logoUrl} dark />
            </div>
          )}
        </div>

        <label className="block border-t border-line pt-5">
          <span className="mb-1 block text-[13px] font-medium text-ink">ข้อความโลโก้ (ใช้เมื่อไม่มีรูป)</span>
          <input value={logo} onChange={(e) => { setLogo(e.target.value); dirty(); }} className={`${FINP} max-w-xs`} />
        </label>

        <div>
          <p className="mb-2 text-[13px] font-medium text-ink">เมนู footer</p>
          <div className="space-y-2">
            {rows.map((r, i) => (
              <div key={i} className="flex gap-2">
                <input placeholder="ชื่อเมนู" value={r.label} onChange={(e) => setRow(i, "label", e.target.value)} className={FINP} />
                <input placeholder="ลิงก์ เช่น /books หรือ https://…" value={r.url} onChange={(e) => setRow(i, "url", e.target.value)} className={FINP} />
                <button type="button" onClick={() => delRow(i)} className="shrink-0 rounded-lg border border-line px-3 text-[13px] text-sub hover:text-red-600">ลบ</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addRow} className="mt-2 text-[13px] text-accent">+ เพิ่มเมนู</button>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={saveAll} disabled={save.isPending} className="rounded-full bg-accent px-6 py-2.5 text-[14px] font-medium text-white hover:bg-accent/90 disabled:opacity-50">บันทึก Footer</button>
          {saved && <span className="text-[13px] text-emerald-600">บันทึกแล้ว — หน้าร้านอัปเดตทันที</span>}
        </div>
      </div>
    </section>
  );
}

function BrandSettings({ settings, save }) {
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [qrBusy, setQrBusy] = useState(false);
  const [hdrBusy, setHdrBusy] = useState("");
  const logo = settings.logoUrl || "";
  const qr = settings.lineQrUrl || "";
  const hdrLight = settings.headerLogoOnLight || "";
  const hdrDark = settings.headerLogoOnDark || "";

  // อัปโหลดโลโก้แถบเมนู (แยก key พื้นสว่าง/พื้นเข้ม)
  const onHeaderLogo = (key) => async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHdrBusy(key);
    try {
      const url = await uploadImage(file);
      save.mutate({ [key]: url });
    } catch { /* ไม่สำเร็จ */ } finally { setHdrBusy(""); }
  };

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

  const onQrFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrBusy(true);
    try {
      const url = await uploadImage(file);
      save.mutate({ lineQrUrl: url });
    } catch {
      /* ไม่สำเร็จ */
    } finally {
      setQrBusy(false);
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
          <p className="text-[12px] text-sub">* ใช้เมื่อยังไม่ได้อัปโหลดโลโก้รูปด้านล่าง</p>
        </div>

        {/* โลโก้รูปบนแถบเมนู — แยกพื้นสว่าง/พื้นเข้ม */}
        <div className="space-y-4 border-t border-line pt-5">
          <div>
            <p className="text-[13px] font-semibold text-ink">โลโก้รูปบนแถบเมนู (บนสุด)</p>
            <p className="mt-1 text-[12px] text-sub">มีรูปแล้วจะใช้แทนตัวอักษร · แถบเมนูหน้าแรกโปร่งใสทับสไลด์ (พื้นเข้ม) เมื่อเลื่อนลง/หน้าอื่นเป็นพื้นขาว — จึงแยกได้ 2 แบบ</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <HeaderLogoBox label="พื้นสว่าง (แถบขาว)" hint="โลโก้สีเข้ม" bg="light" url={hdrLight}
              busy={hdrBusy === "headerLogoOnLight"} onFile={onHeaderLogo("headerLogoOnLight")}
              onClear={() => save.mutate({ headerLogoOnLight: "" })} />
            <HeaderLogoBox label="พื้นเข้ม (ทับสไลด์หน้าแรก)" hint="โลโก้สีอ่อน/ขาว" bg="dark" url={hdrDark}
              busy={hdrBusy === "headerLogoOnDark"} onFile={onHeaderLogo("headerLogoOnDark")}
              onClear={() => save.mutate({ headerLogoOnDark: "" })} />
          </div>
          {(hdrLight || hdrDark) && (
            <LogoSizeSlider settings={settings} save={save} type="image" settingKey="headerLogoSize" label="ขนาดโลโก้แถบเมนู" def={28} min={16} max={64}
              previewSrc={hdrDark || hdrLight} dark={!!hdrDark} />
          )}
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

        {/* QR LINE (บนใบปะหน้าพัสดุ) */}
        <div className="space-y-3 border-t border-line pt-5">
          <p className="text-[13px] font-semibold text-ink">QR LINE (บนใบปะหน้าพัสดุ)</p>
          <p className="-mt-1 text-[12px] text-sub">อัปโหลดรูป QR เพิ่มเพื่อน LINE ของร้าน · จะแสดงมุมล่างของใบปะหน้าพัสดุ</p>
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-line bg-mist">
              {qr ? <img src={qr} alt="QR LINE" className="h-full w-full object-contain p-1.5" /> : <span className="text-[12px] text-sub">ยังไม่มี</span>}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="cursor-pointer rounded-full border border-line px-5 py-2.5 text-[14px] font-medium text-ink transition hover:bg-mist">
                {qrBusy ? "กำลังอัปโหลด..." : qr ? "เปลี่ยน QR" : "อัปโหลด QR"}
                <input type="file" accept="image/*" onChange={onQrFile} className="hidden" />
              </label>
              {qr && (
                <button type="button" onClick={() => save.mutate({ lineQrUrl: "" })} className="text-[13px] text-sub hover:text-red-600">
                  ลบ QR
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// กล่องอัปโหลดโลโก้แถบเมนู (พรีวิวบนพื้นสว่าง/เข้มตามการใช้งานจริง)
function HeaderLogoBox({ label, hint, bg, url, busy, onFile, onClear }) {
  const isDark = bg === "dark";
  return (
    <div className="rounded-xl border border-line p-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-ink">{label}</p>
        <span className="text-[11px] text-sub">{hint}</span>
      </div>
      <div className={`mt-2 flex h-16 items-center justify-center overflow-hidden rounded-lg ${isDark ? "bg-ink" : "border border-line bg-white"}`}>
        {url ? <img src={url} alt="" className="max-h-11 w-auto object-contain" /> : <span className={`text-[12px] ${isDark ? "text-white/50" : "text-sub"}`}>ยังไม่มีรูป</span>}
      </div>
      <div className="mt-2 flex items-center gap-3">
        <label className="cursor-pointer text-[13px] font-medium text-accent">
          {busy ? "กำลังอัปโหลด..." : url ? "เปลี่ยนรูป" : "อัปโหลดรูป"}
          <input type="file" accept="image/*" onChange={onFile} className="hidden" />
        </label>
        {url && <button type="button" onClick={onClear} className="text-[13px] text-sub hover:text-red-600">ลบ</button>}
      </div>
    </div>
  );
}

function LogoSizeSlider({ settings, save, settingKey, label, def, min, max, type = "image", previewSrc, dark = false }) {
  const logo = previewSrc ?? settings.logoUrl ?? "";
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
        <span className={`flex shrink-0 items-center ${dark ? "rounded-lg bg-ink px-3 py-2" : "h-10"}`}>
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
  const keys = ["contactPhone", "contactEmail", "contactLine", "contactAddress", "contactHours", "socialFacebook", "socialInstagram", "socialLine", "contactMapUrl"];
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
        <div>
          <div className="mb-3 flex items-center justify-between gap-4">
            <p className="text-[13px] font-semibold text-ink">แผนที่ (หน้าติดต่อเรา)</p>
            <button
              type="button" role="switch" aria-checked={settings.contactMapEnabled} aria-label="แสดงแผนที่" disabled={save.isPending}
              onClick={() => save.mutate({ contactMapEnabled: !settings.contactMapEnabled })}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50 ${settings.contactMapEnabled ? "bg-accent" : "bg-line"}`}
            >
              <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${settings.contactMapEnabled ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>
          <Input label="ลิงก์แผนที่ (เว้นว่าง = สร้างจากที่อยู่อัตโนมัติ)" value={form.contactMapUrl} onChange={set("contactMapUrl")} placeholder="วางลิงก์ Google Maps embed หรือโค้ด <iframe> ได้" />
          <p className="mt-1.5 text-[11px] leading-relaxed text-sub/80">เปิดสวิตช์เพื่อแสดงแผนที่ · ปักหมุดแม่นยำ: Google Maps → Share → Embed a map → คัดลอกมาวางในช่องนี้</p>
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

// ป้องกันบอทหน้าสมัคร — Cloudflare Turnstile (Site Key = public, Secret Key = ลับ)
function TurnstileSettings({ settings, save }) {
  const [siteKey, setSiteKey] = useState("");
  const [secret, setSecret] = useState("");
  const [saved, setSaved] = useState(false);
  useEffect(() => { setSiteKey(settings.turnstileSiteKey || ""); }, [settings.turnstileSiteKey]);

  const saveAll = () => {
    const payload = { turnstileSiteKey: siteKey.trim() };
    if (secret.trim()) payload.turnstileSecretKey = secret.trim(); // เว้นว่าง = คงของเดิม
    save.mutate(payload, { onSuccess: () => { setSaved(true); setSecret(""); } });
  };

  return (
    <section>
      <h2 className="mb-1 text-[15px] font-semibold text-ink">ป้องกันบอทหน้าสมัคร (Cloudflare Turnstile)</h2>
      <p className="mb-4 text-[12px] text-sub">CAPTCHA ฟรี · สร้าง widget ที่ dash.cloudflare.com → Turnstile (ใส่โดเมน saengdao.vercel.app)</p>
      <div className="space-y-5 rounded-2xl border border-line bg-white p-6">
        <div className="flex items-center justify-between gap-6">
          <div>
            <p className="text-[14px] font-medium text-ink">เปิดใช้ CAPTCHA</p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-sub">ต้องใส่ทั้ง Site Key + Secret Key ก่อนถึงจะบังคับใช้ · ปิดหรือใส่ไม่ครบ = สมัครได้ปกติ (ไม่พัง)</p>
          </div>
          <button
            role="switch" aria-checked={settings.turnstileEnabled} aria-label="เปิดใช้ CAPTCHA" disabled={save.isPending}
            onClick={() => save.mutate({ turnstileEnabled: !settings.turnstileEnabled })}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50 ${settings.turnstileEnabled ? "bg-accent" : "bg-line"}`}
          >
            <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${settings.turnstileEnabled ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Site Key (public)" value={siteKey} onChange={(e) => { setSiteKey(e.target.value); setSaved(false); }} placeholder="0x4AAAAAAA..." />
          <Input label="Secret Key (เว้นว่าง = คงของเดิม)" value={secret} onChange={(e) => { setSecret(e.target.value); setSaved(false); }} placeholder="ใส่เพื่อเปลี่ยน (ไม่แสดงของเดิม)" />
        </div>
        <div className="flex items-center gap-4">
          <button onClick={saveAll} disabled={save.isPending} className="rounded-full bg-ink px-6 py-2.5 text-[14px] font-medium text-white transition hover:bg-ink/90 disabled:opacity-50">
            {save.isPending ? "กำลังบันทึก..." : "บันทึก"}
          </button>
          {saved && <span className="text-[13px] text-emerald-600">บันทึกแล้ว</span>}
        </div>
      </div>
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
