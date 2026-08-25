import { useState } from "react";
import BookLoader from "../components/BookLoader";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import { api } from "../lib/api";
import { formatPrice } from "../lib/format";

export default function Account() {
  const { user, loading, updateUser, isStaff } = useAuth();

  if (loading) return <BookLoader />;
  if (!user) return <Navigate to="/login" state={{ from: "/account" }} replace />;

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ink text-xl font-semibold text-white">
          {(user.name || user.email)[0].toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tightest text-ink">{user.name || "สมาชิก"}</h1>
          <p className="text-[14px] text-sub">{user.email}</p>
        </div>
      </div>

      <div className="space-y-10">
        <LoyaltySection />
        <ProfileSection user={user} updateUser={updateUser} />
        <ReceiptAddressSection user={user} updateUser={updateUser} />
        <PasswordSection />
        {isStaff && <TwoFactorSection user={user} updateUser={updateUser} />}
        <OrdersLink />
        {!isStaff && <DeleteAccountSection />}
      </div>
    </div>
  );
}

function LoyaltySection() {
  const [open, setOpen] = useState(false);
  const { data } = useQuery({
    queryKey: ["loyalty"],
    queryFn: async () => (await api.get("/auth/loyalty")).data,
  });
  if (!data) return null;
  if (!data.enabled && data.points === 0) return null; // ระบบปิด + ยังไม่มีแต้ม → ซ่อน

  const worth = data.points * (data.pointValue || 1);
  return (
    <section className="overflow-hidden rounded-2xl border border-line">
      <div className="flex items-center justify-between gap-4 bg-ink px-6 py-5 text-white">
        <div>
          <p className="text-[12px] text-white/60">แต้มสะสม</p>
          <p className="text-[32px] font-semibold leading-tight">{data.points.toLocaleString()}</p>
          {data.enabled && worth > 0 && <p className="text-[12px] text-white/60">= ลดได้ {formatPrice(worth)} ตอนสั่งซื้อ</p>}
        </div>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="text-white/30">
          <path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17l-6 3.4 1.4-6.8L2.3 9l6.9-.7L12 2Z" strokeLinejoin="round" />
        </svg>
      </div>
      {data.enabled && (
        <p className="border-t border-line bg-mist/40 px-6 py-2.5 text-[12px] text-sub">
          ทุกยอดซื้อ {data.bahtPerPoint} บาท = 1 แต้ม · ใช้แต้มเป็นส่วนลดได้ที่หน้าชำระเงิน
        </p>
      )}
      {data.logs.length > 0 && (
        <div className="border-t border-line">
          <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between px-6 py-3 text-[13px] text-ink hover:bg-mist/40">
            <span>ประวัติแต้ม</span>
            <span className="text-sub">{open ? "ซ่อน" : "ดู"}</span>
          </button>
          {open && (
            <ul className="divide-y divide-line px-6 pb-2">
              {data.logs.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] text-ink">{l.reason}</p>
                    <p className="text-[11px] text-sub">{new Date(l.createdAt).toLocaleDateString("th-TH", { dateStyle: "medium" })}</p>
                  </div>
                  <span className={`shrink-0 text-[14px] font-semibold ${l.delta > 0 ? "text-emerald-600" : "text-rose-500"}`}>
                    {l.delta > 0 ? `+${l.delta}` : l.delta}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

function ProfileSection({ user, updateUser }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const startEdit = () => {
    setForm({ name: user.name || "", email: user.email || "", phone: user.phone || "", address: user.address || "" });
    setMsg("");
    setEditing(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    try {
      const { data } = await api.patch("/auth/profile", form);
      updateUser(data.user);
      setEditing(false);
      setMsg("บันทึกแล้ว");
    } catch (err) {
      setMsg(err.response?.data?.error || "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-line p-6">
      <SectionHead title="ข้อมูลบัญชี" subtitle="ข้อมูลนี้จะถูกเติมให้อัตโนมัติตอนสั่งซื้อ"
        editing={editing} onEdit={startEdit} msg={msg} />
      {editing ? (
        <form onSubmit={save} className="mt-4 space-y-4">
          <Field label="ชื่อ-นามสกุล" value={form.name} onChange={set("name")} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="อีเมล" type="email" value={form.email} onChange={set("email")} />
            <Field label="เบอร์โทรศัพท์" type="tel" value={form.phone} onChange={set("phone")} />
          </div>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink">ที่อยู่จัดส่ง</span>
            <textarea
              value={form.address}
              onChange={(e) => set("address")(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-line bg-white px-4 py-2.5 text-[15px] text-ink outline-none transition focus:border-ink/30"
            />
          </label>
          <EditActions busy={busy} onCancel={() => setEditing(false)} />
        </form>
      ) : (
        <dl className="mt-4 space-y-4">
          <ReadRow label="ชื่อ-นามสกุล" value={user.name} />
          <ReadRow label="อีเมล" value={user.email} />
          <ReadRow label="เบอร์โทรศัพท์" value={user.phone} />
          <ReadRow label="ที่อยู่จัดส่ง" value={user.address} />
        </dl>
      )}
    </section>
  );
}

function ReceiptAddressSection({ user, updateUser }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ receiptName: "", receiptTaxId: "", receiptAddress: "" });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const startEdit = () => {
    setForm({ receiptName: user.receiptName || "", receiptTaxId: user.receiptTaxId || "", receiptAddress: user.receiptAddress || "" });
    setMsg("");
    setEditing(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    try {
      const { data } = await api.patch("/auth/profile", form);
      updateUser(data.user);
      setEditing(false);
      setMsg("บันทึกแล้ว");
    } catch (err) {
      setMsg(err.response?.data?.error || "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const empty = !user.receiptName && !user.receiptTaxId && !user.receiptAddress;

  return (
    <section className="rounded-2xl border border-line p-6">
      <SectionHead title="ที่อยู่ออกใบเสร็จ" subtitle="สำหรับใบเสร็จ/ใบกำกับภาษี — เว้นว่างได้ถ้าใช้ที่อยู่จัดส่ง"
        editing={editing} onEdit={startEdit} editLabel={empty ? "เพิ่ม" : "แก้ไข"} msg={msg} />
      {editing ? (
        <form onSubmit={save} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="ชื่อ / บริษัท" value={form.receiptName} onChange={set("receiptName")} />
            <Field label="เลขประจำตัวผู้เสียภาษี (13 หลัก)" value={form.receiptTaxId} onChange={set("receiptTaxId")} />
          </div>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink">ที่อยู่ออกใบเสร็จ</span>
            <textarea
              value={form.receiptAddress}
              onChange={(e) => set("receiptAddress")(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-line bg-white px-4 py-2.5 text-[15px] text-ink outline-none transition focus:border-ink/30"
            />
          </label>
          <EditActions busy={busy} onCancel={() => setEditing(false)} />
        </form>
      ) : empty ? (
        <p className="mt-4 text-[14px] text-sub">ยังไม่ได้ระบุ</p>
      ) : (
        <dl className="mt-4 space-y-4">
          <ReadRow label="ชื่อ / บริษัท" value={user.receiptName} />
          <ReadRow label="เลขประจำตัวผู้เสียภาษี" value={user.receiptTaxId} />
          <ReadRow label="ที่อยู่ออกใบเสร็จ" value={user.receiptAddress} />
        </dl>
      )}
    </section>
  );
}

function TwoFactorSection({ user, updateUser }) {
  const [setup, setSetup] = useState(null); // { qr, secret } ระหว่างตั้งค่า
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const enabled = user.twoFactorEnabled;

  const refresh = async () => {
    const { data } = await api.get("/auth/me");
    updateUser(data.user);
  };

  const startSetup = async () => {
    setMsg(""); setBusy(true);
    try {
      const { data } = await api.post("/auth/2fa/setup");
      setSetup(data);
      setCode("");
    } catch (err) {
      setMsg(err.response?.data?.error || "เริ่มตั้งค่าไม่สำเร็จ");
    } finally { setBusy(false); }
  };

  const enable = async (e) => {
    e.preventDefault(); setMsg(""); setBusy(true);
    try {
      await api.post("/auth/2fa/enable", { code });
      await refresh();
      setSetup(null); setCode(""); setMsg("เปิดใช้งาน 2FA แล้ว");
    } catch (err) {
      setMsg(err.response?.data?.error || "รหัสไม่ถูกต้อง");
    } finally { setBusy(false); }
  };

  const disable = async () => {
    const c = prompt("กรอกรหัส 6 หลักจากแอป Authenticator เพื่อปิด 2FA");
    if (!c) return;
    setMsg(""); setBusy(true);
    try {
      await api.post("/auth/2fa/disable", { code: c });
      await refresh();
      setMsg("ปิด 2FA แล้ว");
    } catch (err) {
      setMsg(err.response?.data?.error || "รหัสไม่ถูกต้อง");
    } finally { setBusy(false); }
  };

  return (
    <section className="rounded-2xl border border-line p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-semibold text-ink">ยืนยันตัวตน 2 ชั้น (2FA)</h2>
          <p className="mt-0.5 text-[12px] text-sub">เพิ่มความปลอดภัยตอนเข้าหลังบ้าน ด้วยรหัส 6 หลักจากแอป Authenticator</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${enabled ? "bg-emerald-100 text-emerald-700" : "bg-mist text-sub"}`}>
          {enabled ? "เปิดใช้งาน" : "ปิดอยู่"}
        </span>
      </div>

      {enabled ? (
        <button onClick={disable} disabled={busy} className="mt-4 rounded-full border border-line px-5 py-2 text-[13px] text-ink transition hover:bg-mist disabled:opacity-50">
          ปิด 2FA
        </button>
      ) : setup ? (
        <form onSubmit={enable} className="mt-4 space-y-3">
          <p className="text-[13px] text-ink">1. สแกน QR ด้วยแอป Google/Microsoft Authenticator</p>
          <img src={setup.qr} alt="QR" className="rounded-xl border border-line" width={180} height={180} />
          <p className="text-[12px] text-sub">หรือกรอกคีย์เอง: <span className="select-all font-mono text-ink">{setup.secret}</span></p>
          <p className="text-[13px] text-ink">2. กรอกรหัส 6 หลักที่แอปแสดง</p>
          <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric" placeholder="000000"
            className="w-40 rounded-xl border border-line bg-white px-4 py-2.5 text-center text-[18px] tracking-[0.4em] text-ink outline-none focus:border-ink/30" />
          <div className="flex items-center gap-3">
            <button type="submit" disabled={busy || code.length < 6} className="rounded-full bg-ink px-6 py-2.5 text-[14px] font-medium text-white transition hover:bg-ink/90 disabled:opacity-50">
              {busy ? "กำลังเปิด..." : "เปิดใช้งาน"}
            </button>
            <button type="button" onClick={() => { setSetup(null); setMsg(""); }} className="text-[13px] text-sub hover:text-ink">ยกเลิก</button>
          </div>
        </form>
      ) : (
        <button onClick={startSetup} disabled={busy} className="mt-4 rounded-full bg-ink px-6 py-2.5 text-[14px] font-medium text-white transition hover:bg-ink/90 disabled:opacity-50">
          {busy ? "กำลังเตรียม..." : "ตั้งค่า 2FA"}
        </button>
      )}
      {msg && <p className={`mt-3 text-[13px] ${msg.includes("แล้ว") ? "text-emerald-600" : "text-red-600"}`}>{msg}</p>}
    </section>
  );
}

function PasswordSection() {
  const [editing, setEditing] = useState(false);
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const close = () => { setEditing(false); setCur(""); setNext(""); };
  const open = () => { setMsg(""); setEditing(true); };

  const save = async (e) => {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    try {
      await api.patch("/auth/profile", { currentPassword: cur, newPassword: next });
      setMsg("เปลี่ยนรหัสผ่านแล้ว");
      close();
    } catch (err) {
      setMsg(err.response?.data?.error || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-line p-6">
      <SectionHead title="รหัสผ่าน" subtitle="ตั้งรหัสผ่านใหม่สำหรับเข้าสู่ระบบ"
        editing={editing} onEdit={open} editLabel="เปลี่ยนรหัสผ่าน" msg={msg} />
      {editing ? (
        <form onSubmit={save} className="mt-4 space-y-4">
          <Field label="รหัสผ่านปัจจุบัน" type="password" value={cur} onChange={setCur} />
          <Field label="รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)" type="password" value={next} onChange={setNext} />
          <EditActions busy={busy} disabled={!cur || !next} saveLabel="เปลี่ยนรหัสผ่าน" busyLabel="กำลังเปลี่ยน..." onCancel={close} />
        </form>
      ) : (
        <p className="mt-4 text-[14px] text-sub">••••••••</p>
      )}
    </section>
  );
}

// ลบบัญชี (PDPA) — anonymize ข้อมูลส่วนตัว · เก็บประวัติออเดอร์แบบไม่ระบุตัวตนตามกฎหมายบัญชี
function DeleteAccountSection() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const del = async () => {
    setError(""); setBusy(true);
    try {
      await api.post("/auth/delete-account");
      logout();
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "ลบบัญชีไม่สำเร็จ");
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-red-200 bg-red-50/40 p-6">
      <h2 className="text-[15px] font-semibold text-red-700">ลบบัญชีของฉัน</h2>
      <p className="mt-1 text-[13px] leading-relaxed text-red-700/80">
        ลบข้อมูลส่วนบุคคลของคุณออกจากระบบอย่างถาวร (ชื่อ อีเมล เบอร์โทร ที่อยู่ รีวิว) และจะเข้าสู่ระบบด้วยบัญชีนี้ไม่ได้อีก ·
        ประวัติคำสั่งซื้อจะถูกเก็บแบบไม่ระบุตัวตนตามกฎหมายบัญชี/ภาษี — <b>การลบนี้ย้อนกลับไม่ได้</b>
      </p>
      <label className="mt-4 block max-w-xs">
        <span className="mb-1 block text-[12px] text-red-700/80">พิมพ์ “ลบบัญชี” เพื่อยืนยัน</span>
        <input value={confirm} onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-xl border border-red-300 bg-white px-4 py-2.5 text-[14px] text-ink outline-none focus:border-red-400" />
      </label>
      {error && <p className="mt-2 text-[13px] text-red-600">{error}</p>}
      <button onClick={del} disabled={busy || confirm.trim() !== "ลบบัญชี"}
        className="mt-3 rounded-full bg-red-600 px-6 py-2.5 text-[14px] font-medium text-white transition hover:bg-red-700 disabled:opacity-40">
        {busy ? "กำลังลบ..." : "ลบบัญชีถาวร"}
      </button>
    </section>
  );
}

function OrdersLink() {
  const { data } = useQuery({
    queryKey: ["my-orders", 1],
    queryFn: async () => (await api.get(`/orders?page=1&pageSize=10`)).data,
  });
  const total = data?.total;

  return (
    <Link
      to="/orders"
      className="flex items-center gap-4 rounded-2xl border border-line p-6 transition hover:border-ink/20 hover:bg-mist/30"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mist text-ink">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2h9l3 3v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z" />
          <path d="M9 8h6M9 12h6M9 16h4" />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold text-ink">ประวัติคำสั่งซื้อ</p>
        <p className="text-[12px] text-sub">
          {total > 0 ? `ดูคำสั่งซื้อทั้งหมด ${total} รายการ` : "ดูสถานะและรายละเอียดคำสั่งซื้อ"}
        </p>
      </div>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-sub">
        <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}

function SectionHead({ title, subtitle, editing, onEdit, editLabel = "แก้ไข", msg }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[12px] text-sub">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {!editing && msg && (
          <span className={`text-[13px] ${msg.includes("แล้ว") ? "text-emerald-600" : "text-red-600"}`}>{msg}</span>
        )}
        {!editing && (
          <button onClick={onEdit} className="rounded-full border border-line px-4 py-1.5 text-[13px] font-medium text-ink transition hover:bg-mist">
            {editLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function ReadRow({ label, value }) {
  return (
    <div>
      <dt className="text-[12px] text-sub">{label}</dt>
      <dd className={`mt-0.5 whitespace-pre-line text-[15px] ${value ? "text-ink" : "text-sub/70"}`}>{value || "—"}</dd>
    </div>
  );
}

function EditActions({ busy, disabled, onCancel, saveLabel = "บันทึก", busyLabel = "กำลังบันทึก..." }) {
  return (
    <div className="flex items-center gap-3">
      <button type="submit" disabled={busy || disabled} className="rounded-full bg-ink px-6 py-2.5 text-[14px] font-medium text-white transition hover:bg-ink/90 disabled:opacity-50">
        {busy ? busyLabel : saveLabel}
      </button>
      <button type="button" onClick={onCancel} className="rounded-full border border-line px-5 py-2.5 text-[14px] text-ink transition hover:bg-mist">
        ยกเลิก
      </button>
    </div>
  );
}

function Field({ label, type = "text", value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-ink">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-[15px] text-ink outline-none transition focus:border-ink/30"
      />
    </label>
  );
}
