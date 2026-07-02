import { useEffect, useState } from "react";
import { useIntegrations, useSaveIntegrations, testZort } from "../../api/admin";

export default function AdminIntegrations() {
  const { data, isLoading } = useIntegrations();

  if (isLoading) return <p className="text-sub">กำลังโหลด...</p>;

  return (
    <div className="space-y-6">
      <p className="text-[13px] text-sub">เชื่อม SAENGDAO กับแอปภายนอกผ่าน API</p>
      <ZortCard zort={data.zort} />

      {/* ช่องทางอื่นในอนาคต */}
      <div className="rounded-2xl border border-dashed border-line bg-white p-6 text-center">
        <p className="text-[14px] font-medium text-ink">Shopee · Lazada · LINE Shopping</p>
        <p className="mt-1 text-[12px] text-sub">เร็วๆ นี้</p>
      </div>
    </div>
  );
}

function ZortCard({ zort }) {
  const save = useSaveIntegrations();
  const [form, setForm] = useState({ storename: "", apikey: "", apisecret: "", baseUrl: "", enabled: false });
  const [savedMsg, setSavedMsg] = useState("");
  const [test, setTest] = useState(null); // { ok, message/error }
  const [testing, setTesting] = useState(false);

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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-[13px] font-bold text-white">Z</div>
          <div>
            <p className="text-[15px] font-semibold text-ink">ZORT</p>
            <p className="text-[12px] text-sub">ระบบจัดการออเดอร์ & สต็อก</p>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${zort.connected ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
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

        <label className="flex items-center gap-2 text-[14px] text-ink">
          <input type="checkbox" checked={form.enabled} onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))} className="h-4 w-4 accent-accent" />
          เปิดใช้งานการเชื่อมต่อ ZORT
        </label>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button type="submit" disabled={save.isPending} className="rounded-full bg-ink px-6 py-2.5 text-[14px] font-medium text-white transition hover:bg-ink/90 disabled:opacity-50">
            {save.isPending ? "กำลังบันทึก..." : "บันทึก"}
          </button>
          <button type="button" onClick={runTest} disabled={testing} className="rounded-full border border-line px-5 py-2.5 text-[14px] font-medium text-ink transition hover:bg-mist disabled:opacity-50">
            {testing ? "กำลังทดสอบ..." : "ทดสอบการเชื่อมต่อ"}
          </button>
          {savedMsg && <span className="text-[13px] text-emerald-600">{savedMsg}</span>}
        </div>

        {test && (
          <p className={`text-[13px] ${test.ok ? "text-emerald-600" : "text-red-600"}`}>
            {test.ok ? `✓ ${test.message}` : `✕ ${test.error}`}
          </p>
        )}
      </form>

      <p className="mt-4 border-t border-line pt-4 text-[12px] text-sub">
        หา storename / apikey / apisecret ได้ใน ZORT → Settings → API · ขั้นต่อไปจะเพิ่มการส่งออเดอร์ไป ZORT อัตโนมัติเมื่อชำระเงินแล้ว
      </p>
    </div>
  );
}

function Field({ label, type = "text", value, onChange, placeholder, autoComplete }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-sub">{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-line px-4 py-2.5 text-[14px] text-ink outline-none transition placeholder:text-sub/50 focus:border-ink/30"
      />
    </label>
  );
}
