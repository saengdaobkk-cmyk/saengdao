import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import { api } from "../lib/api";
import { formatPrice } from "../lib/format";

// จ่ายแล้ว → โชว์สถานะจัดการออเดอร์ · ยังไม่จ่าย → โชว์สถานะการชำระเงิน (ให้ลูกค้ารู้ว่ายังต้องจ่าย)
const ORDER_STATUS_TH = {
  PENDING: { label: "กำลังดำเนินการ", cls: "bg-gray-100 text-gray-600" },
  PAID: { label: "กำลังดำเนินการ", cls: "bg-gray-100 text-gray-600" },
  SHIPPED: { label: "จัดส่งแล้ว", cls: "bg-blue-100 text-blue-700" },
  COMPLETED: { label: "สำเร็จ", cls: "bg-emerald-100 text-emerald-700" },
  CANCELLED: { label: "ยกเลิก", cls: "bg-red-100 text-red-600" },
};

const PAYMENT_STATUS_TH = {
  UNPAID: { label: "รอชำระเงิน", cls: "bg-amber-100 text-amber-700" },
  PENDING_REVIEW: { label: "รอตรวจสอบสลิป", cls: "bg-amber-100 text-amber-700" },
  FAILED: { label: "ชำระไม่สำเร็จ", cls: "bg-red-100 text-red-600" },
};

function orderBadge(o) {
  if (o.paymentStatus && o.paymentStatus !== "PAID")
    return PAYMENT_STATUS_TH[o.paymentStatus] || { label: o.paymentStatus, cls: "bg-gray-100 text-gray-600" };
  return ORDER_STATUS_TH[o.status] || ORDER_STATUS_TH.PENDING;
}

export default function Account() {
  const { user, loading, updateUser, logout } = useAuth();

  if (loading) return <div className="py-24 text-center text-sub">กำลังโหลด...</div>;
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
        <OrdersSection />
      </div>

      <button
        onClick={logout}
        className="mt-12 text-[14px] text-sub transition hover:text-red-600"
      >
        ออกจากระบบ
      </button>
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
  const [form, setForm] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    address: user.address || "",
  });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    try {
      const { data } = await api.patch("/auth/profile", form);
      updateUser(data.user);
      setMsg("บันทึกแล้ว");
    } catch (err) {
      setMsg(err.response?.data?.error || "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-line p-6">
      <h2 className="mb-4 text-[15px] font-semibold text-ink">ข้อมูลบัญชี</h2>
      <p className="mb-4 -mt-2 text-[12px] text-sub">ข้อมูลนี้จะถูกเติมให้อัตโนมัติตอนสั่งซื้อ</p>
      <form onSubmit={save} className="space-y-4">
        <Field label="ชื่อ" value={form.name} onChange={set("name")} />
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
        <div className="flex items-center gap-4">
          <button type="submit" disabled={busy} className="rounded-full bg-ink px-6 py-2.5 text-[14px] font-medium text-white transition hover:bg-ink/90 disabled:opacity-50">
            {busy ? "กำลังบันทึก..." : "บันทึก"}
          </button>
          {msg && <span className={`text-[13px] ${msg === "บันทึกแล้ว" ? "text-emerald-600" : "text-red-600"}`}>{msg}</span>}
        </div>
      </form>
    </section>
  );
}

function ReceiptAddressSection({ user, updateUser }) {
  const [form, setForm] = useState({
    receiptName: user.receiptName || "",
    receiptTaxId: user.receiptTaxId || "",
    receiptAddress: user.receiptAddress || "",
  });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    try {
      const { data } = await api.patch("/auth/profile", form);
      updateUser(data.user);
      setMsg("บันทึกแล้ว");
    } catch (err) {
      setMsg(err.response?.data?.error || "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-line p-6">
      <h2 className="mb-1 text-[15px] font-semibold text-ink">ที่อยู่ออกใบเสร็จ</h2>
      <p className="mb-4 text-[12px] text-sub">สำหรับใบเสร็จ/ใบกำกับภาษี — เว้นว่างได้ถ้าใช้ที่อยู่จัดส่ง</p>
      <form onSubmit={save} className="space-y-4">
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
        <div className="flex items-center gap-4">
          <button type="submit" disabled={busy} className="rounded-full bg-ink px-6 py-2.5 text-[14px] font-medium text-white transition hover:bg-ink/90 disabled:opacity-50">
            {busy ? "กำลังบันทึก..." : "บันทึก"}
          </button>
          {msg && <span className={`text-[13px] ${msg === "บันทึกแล้ว" ? "text-emerald-600" : "text-red-600"}`}>{msg}</span>}
        </div>
      </form>
    </section>
  );
}

function PasswordSection() {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    try {
      await api.patch("/auth/profile", { currentPassword: cur, newPassword: next });
      setMsg("เปลี่ยนรหัสผ่านแล้ว");
      setCur("");
      setNext("");
    } catch (err) {
      setMsg(err.response?.data?.error || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-line p-6">
      <h2 className="mb-4 text-[15px] font-semibold text-ink">เปลี่ยนรหัสผ่าน</h2>
      <form onSubmit={save} className="space-y-4">
        <Field label="รหัสผ่านปัจจุบัน" type="password" value={cur} onChange={setCur} />
        <Field label="รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)" type="password" value={next} onChange={setNext} />
        <div className="flex items-center gap-4">
          <button type="submit" disabled={busy || !cur || !next} className="rounded-full bg-ink px-6 py-2.5 text-[14px] font-medium text-white transition hover:bg-ink/90 disabled:opacity-50">
            {busy ? "กำลังเปลี่ยน..." : "เปลี่ยนรหัสผ่าน"}
          </button>
          {msg && <span className={`text-[13px] ${msg.includes("แล้ว") ? "text-emerald-600" : "text-red-600"}`}>{msg}</span>}
        </div>
      </form>
    </section>
  );
}

function OrdersSection() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => (await api.get("/orders")).data,
  });

  return (
    <section>
      <h2 className="mb-4 text-[15px] font-semibold text-ink">ประวัติคำสั่งซื้อ</h2>
      {isLoading ? (
        <p className="text-sub">กำลังโหลด...</p>
      ) : !orders?.length ? (
        <div className="rounded-2xl border border-line p-8 text-center">
          <p className="text-[14px] text-sub">ยังไม่มีคำสั่งซื้อ</p>
          <Link to="/" className="mt-3 inline-block text-[14px] text-accent">เลือกซื้อหนังสือ</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const st = orderBadge(o);
            const needPay = o.paymentStatus === "UNPAID";
            return (
              <Link
                key={o.id}
                to={`/orders/${o.id}`}
                className="flex items-center gap-4 rounded-2xl border border-line p-4 transition hover:border-ink/20"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium text-ink">
                    #{o.id.slice(0, 8).toUpperCase()}
                    <span className="ml-2 text-[12px] font-normal text-sub">
                      {new Date(o.createdAt).toLocaleDateString("th-TH", { dateStyle: "medium" })}
                    </span>
                  </p>
                  <p className="text-[12px] text-sub">
                    {o.items.length} รายการ
                    {needPay && <span className="ml-2 text-accent">· ชำระเงิน/แนบสลิป →</span>}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${st.cls}`}>{st.label}</span>
                <span className="w-20 shrink-0 text-right text-[14px] font-semibold text-ink">{formatPrice(o.total)}</span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
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
