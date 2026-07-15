import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useIntegrations, useSaveIntegrations, testZort, testThpost, syncZortStock } from "../../api/admin";

function fmtDateTime(d) {
  if (!d) return "";
  const t = new Date(d);
  return isNaN(t) ? "" : t.toLocaleString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function AdminIntegrations() {
  const { data, isLoading } = useIntegrations();

  if (isLoading) return <p className="text-sub">กำลังโหลด...</p>;

  return (
    <div className="space-y-6">
      <p className="text-[16px] text-sub">เชื่อม SAENGDAO กับแอปภายนอกผ่าน API</p>
      <ZortCard zort={data.zort} />
      <ThaipostCard thpost={data.thpost} />

      {/* ช่องทางอื่นในอนาคต */}
      <div className="rounded-2xl border border-dashed border-line bg-white p-6 text-center">
        <p className="text-[17px] font-medium text-ink">Shopee · Lazada · LINE Shopping</p>
        <p className="mt-1 text-[15px] text-sub">เร็วๆ นี้</p>
      </div>
    </div>
  );
}

function ZortCard({ zort }) {
  const save = useSaveIntegrations();
  const qc = useQueryClient();
  const [form, setForm] = useState({ storename: "", apikey: "", apisecret: "", baseUrl: "", enabled: false });
  const [savedMsg, setSavedMsg] = useState("");
  const [test, setTest] = useState(null); // { ok, message/error }
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);

  const runSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const r = await syncZortStock();
      setSyncMsg(r.ok
        ? { ok: true, text: `อัปเดตสต็อก ${r.updated} รายการ (จับคู่ ISBN ได้ ${r.matched} จาก ZORT ${r.zortProducts} สินค้า)` }
        : { ok: false, text: r.error || "ดึงสต็อกไม่สำเร็จ" });
      qc.invalidateQueries({ queryKey: ["admin", "integrations"] });
    } catch (err) {
      setSyncMsg({ ok: false, text: err.response?.data?.error || "ดึงสต็อกไม่สำเร็จ" });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    setForm({
      storename: zort.storename || "",
      apikey: zort.apikey || "",
      apisecret: "", // ไม่ดึงกลับมา — เว้นว่าง = คงเดิม
      baseUrl: zort.baseUrl || "",
      enabled: zort.enabled,
    });
  }, [zort]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSavedMsg("");
    setTest(null);
    // ไม่ส่ง apisecret ถ้าเว้นว่าง (คงของเดิม)
    const zortPayload = { ...form };
    if (!zortPayload.apisecret) delete zortPayload.apisecret;
    save.mutate({ zort: zortPayload }, { onSuccess: () => setSavedMsg("บันทึกแล้ว") });
  };

  const runTest = async () => {
    setTesting(true);
    setTest(null);
    try {
      setTest(await testZort());
    } catch (err) {
      setTest({ ok: false, error: err.response?.data?.error || "ทดสอบไม่สำเร็จ" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-white p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-[16px] font-bold text-white">Z</div>
          <div>
            <p className="text-[18px] font-semibold text-ink">ZORT</p>
            <p className="text-[15px] text-sub">ระบบจัดการออเดอร์ & สต็อก</p>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[14px] font-medium ${zort.connected ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
          {zort.connected ? "เชื่อมต่อแล้ว" : "ยังไม่เชื่อมต่อ"}
        </span>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <Field label="Store Name" value={form.storename} onChange={set("storename")} placeholder="ชื่อร้านใน ZORT" />
        <Field label="API Key" value={form.apikey} onChange={set("apikey")} />
        <Field
          label="API Secret"
          type="password"
          value={form.apisecret}
          onChange={set("apisecret")}
          autoComplete="new-password"
          placeholder={zort.hasSecret ? "•••••• (บันทึกไว้แล้ว — เว้นว่างถ้าไม่เปลี่ยน)" : "กรอก API Secret"}
        />
        <Field label="Base URL" value={form.baseUrl} onChange={set("baseUrl")} placeholder="https://open-api.zortout.com/v4" />

        <label className="flex items-center gap-2 text-[17px] text-ink">
          <input type="checkbox" checked={form.enabled} onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))} className="h-4 w-4 accent-accent" />
          เปิดใช้งานการเชื่อมต่อ ZORT
        </label>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button type="submit" disabled={save.isPending} className="rounded-full bg-ink px-6 py-2.5 text-[17px] font-medium text-white transition hover:bg-ink/90 disabled:opacity-50">
            {save.isPending ? "กำลังบันทึก..." : "บันทึก"}
          </button>
          <button type="button" onClick={runTest} disabled={testing} className="rounded-full border border-line px-5 py-2.5 text-[17px] font-medium text-ink transition hover:bg-mist disabled:opacity-50">
            {testing ? "กำลังทดสอบ..." : "ทดสอบการเชื่อมต่อ"}
          </button>
          {savedMsg && <span className="text-[16px] text-emerald-600">{savedMsg}</span>}
        </div>

        {test && (
          <p className={`text-[16px] ${test.ok ? "text-emerald-600" : "text-red-600"}`}>
            {test.ok ? `✓ ${test.message}` : `✕ ${test.error}`}
          </p>
        )}
      </form>

      {/* ดึงสต็อกจาก ZORT */}
      <div className="mt-5 border-t border-line pt-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[16px] font-medium text-ink">สต็อกจาก ZORT</p>
            <p className="text-[15px] text-sub">
              ZORT เป็นคลังหลัก · จับคู่ตาม SKU = ISBN · อัตโนมัติทุก 15 นาที
              {zort.stockSyncedAt && ` · ล่าสุด ${fmtDateTime(zort.stockSyncedAt)}`}
            </p>
          </div>
          <button
            type="button"
            onClick={runSync}
            disabled={syncing || !zort.connected}
            title={!zort.connected ? "เชื่อมต่อ ZORT ให้สำเร็จก่อน" : ""}
            className="shrink-0 rounded-full border border-line px-4 py-2 text-[16px] font-medium text-ink transition hover:bg-mist disabled:opacity-50"
          >
            {syncing ? "กำลังดึง..." : "ดึงสต็อกตอนนี้"}
          </button>
        </div>
        {syncMsg && <p className={`mt-2 text-[15px] ${syncMsg.ok ? "text-emerald-600" : "text-red-600"}`}>{syncMsg.text}</p>}
      </div>

      <p className="mt-4 border-t border-line pt-4 text-[15px] text-sub">
        หา storename / apikey / apisecret ได้ใน ZORT → Settings → API · เมื่ออนุมัติการชำระเงิน ระบบส่งออเดอร์ไป ZORT อัตโนมัติ
      </p>
    </div>
  );
}

function ThaipostCard({ thpost }) {
  const save = useSaveIntegrations();
  const [apikey, setApikey] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [test, setTest] = useState(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    setApikey(""); // ไม่ดึง key กลับมา
    setEnabled(thpost.enabled);
  }, [thpost]);

  const submit = async (e) => {
    e.preventDefault();
    setSavedMsg("");
    setTest(null);
    const payload = { enabled };
    if (apikey.trim()) payload.apikey = apikey.trim();
    save.mutate({ thpost: payload }, { onSuccess: () => { setSavedMsg("บันทึกแล้ว"); setApikey(""); } });
  };

  const runTest = async () => {
    setTesting(true);
    setTest(null);
    try {
      setTest(await testThpost());
    } catch (err) {
      setTest({ ok: false, error: err.response?.data?.error || "ทดสอบไม่สำเร็จ" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-white p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ED1C24] text-[18px] font-bold text-white">฿</div>
          <div>
            <p className="text-[18px] font-semibold text-ink">ไปรษณีย์ไทย</p>
            <p className="text-[15px] text-sub">ติดตามสถานะพัสดุ (Track &amp; Trace)</p>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[14px] font-medium ${thpost.connected ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
          {thpost.connected ? "เชื่อมต่อแล้ว" : "ยังไม่เชื่อมต่อ"}
        </span>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <Field
          label="API Key (Token)"
          type="password"
          value={apikey}
          onChange={(e) => setApikey(e.target.value)}
          autoComplete="new-password"
          placeholder={thpost.hasKey ? "•••••• (บันทึกไว้แล้ว — เว้นว่างถ้าไม่เปลี่ยน)" : "วาง API key จากไปรษณีย์ไทย"}
        />

        <label className="flex items-center gap-2 text-[17px] text-ink">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-4 w-4 accent-accent" />
          เปิดใช้งานการติดตามพัสดุ
        </label>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button type="submit" disabled={save.isPending} className="rounded-full bg-ink px-6 py-2.5 text-[17px] font-medium text-white transition hover:bg-ink/90 disabled:opacity-50">
            {save.isPending ? "กำลังบันทึก..." : "บันทึก"}
          </button>
          <button type="button" onClick={runTest} disabled={testing} className="rounded-full border border-line px-5 py-2.5 text-[17px] font-medium text-ink transition hover:bg-mist disabled:opacity-50">
            {testing ? "กำลังทดสอบ..." : "ทดสอบการเชื่อมต่อ"}
          </button>
          {savedMsg && <span className="text-[16px] text-emerald-600">{savedMsg}</span>}
        </div>

        {test && (
          <p className={`text-[16px] ${test.ok ? "text-emerald-600" : "text-red-600"}`}>
            {test.ok ? `✓ ${test.message}` : `✕ ${test.error}`}
          </p>
        )}
      </form>

      <p className="mt-4 border-t border-line pt-4 text-[15px] text-sub">
        สมัคร API key ฟรีที่ track.thailandpost.co.th → Track &amp; Trace API · ใส่เลขพัสดุที่ออเดอร์แล้วระบบจะดึงสถานะล่าสุดให้ลูกค้าเห็นเองในหน้าติดตามคำสั่งซื้อ
      </p>
    </div>
  );
}

function Field({ label, type = "text", value, onChange, placeholder, autoComplete }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[15px] font-medium text-sub">{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-line px-4 py-2.5 text-[17px] text-ink outline-none transition placeholder:text-sub/50 focus:border-ink/30"
      />
    </label>
  );
}
