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
          <p className="text-[16px] text-sub">{user.email}</p>
        </div>
      </div>

      <div className="space-y-10">
        <ProfileSection user={user} updateUser={updateUser} />
        <ReceiptAddressSection user={user} updateUser={updateUser} />
        <PasswordSection />
        <OrdersSection />
      </div>

      <button
        onClick={logout}
        className="mt-12 text-[16px] text-sub transition hover:text-red-600"
      >
        ออกจากระบบ
      </button>
    </div>
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
      <h2 className="mb-4 text-[17px] font-semibold text-ink">ข้อมูลบัญชี</h2>
      <p className="mb-4 -mt-2 text-[14px] text-sub">ข้อมูลนี้จะถูกเติมให้อัตโนมัติตอนสั่งซื้อ</p>
      <form onSubmit={save} className="space-y-4">
        <Field label="ชื่อ" value={form.name} onChange={set("name")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="อีเมล" type="email" value={form.email} onChange={set("email")} />
          <Field label="เบอร์โทรศัพท์" type="tel" value={form.phone} onChange={set("phone")} />
        </div>
        <label className="block">
          <span className="mb-1.5 block text-[15px] font-medium text-ink">ที่อยู่จัดส่ง</span>
          <textarea
            value={form.address}
            onChange={(e) => set("address")(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-xl border border-line bg-white px-4 py-2.5 text-[17px] text-ink outline-none transition focus:border-ink/30"
          />
        </label>
        <div className="flex items-center gap-4">
          <button type="submit" disabled={busy} className="rounded-full bg-ink px-6 py-2.5 text-[16px] font-medium text-white transition hover:bg-ink/90 disabled:opacity-50">
            {busy ? "กำลังบันทึก..." : "บันทึก"}
          </button>
          {msg && <span className={`text-[15px] ${msg === "บันทึกแล้ว" ? "text-emerald-600" : "text-red-600"}`}>{msg}</span>}
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
      <h2 className="mb-1 text-[17px] font-semibold text-ink">ที่อยู่ออกใบเสร็จ</h2>
      <p className="mb-4 text-[14px] text-sub">สำหรับใบเสร็จ/ใบกำกับภาษี — เว้นว่างได้ถ้าใช้ที่อยู่จัดส่ง</p>
      <form onSubmit={save} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="ชื่อ / บริษัท" value={form.receiptName} onChange={set("receiptName")} />
          <Field label="เลขประจำตัวผู้เสียภาษี (13 หลัก)" value={form.receiptTaxId} onChange={set("receiptTaxId")} />
        </div>
        <label className="block">
          <span className="mb-1.5 block text-[15px] font-medium text-ink">ที่อยู่ออกใบเสร็จ</span>
          <textarea
            value={form.receiptAddress}
            onChange={(e) => set("receiptAddress")(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-xl border border-line bg-white px-4 py-2.5 text-[17px] text-ink outline-none transition focus:border-ink/30"
          />
        </label>
        <div className="flex items-center gap-4">
          <button type="submit" disabled={busy} className="rounded-full bg-ink px-6 py-2.5 text-[16px] font-medium text-white transition hover:bg-ink/90 disabled:opacity-50">
            {busy ? "กำลังบันทึก..." : "บันทึก"}
          </button>
          {msg && <span className={`text-[15px] ${msg === "บันทึกแล้ว" ? "text-emerald-600" : "text-red-600"}`}>{msg}</span>}
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
      <h2 className="mb-4 text-[17px] font-semibold text-ink">เปลี่ยนรหัสผ่าน</h2>
      <form onSubmit={save} className="space-y-4">
        <Field label="รหัสผ่านปัจจุบัน" type="password" value={cur} onChange={setCur} />
        <Field label="รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)" type="password" value={next} onChange={setNext} />
        <div className="flex items-center gap-4">
          <button type="submit" disabled={busy || !cur || !next} className="rounded-full bg-ink px-6 py-2.5 text-[16px] font-medium text-white transition hover:bg-ink/90 disabled:opacity-50">
            {busy ? "กำลังเปลี่ยน..." : "เปลี่ยนรหัสผ่าน"}
          </button>
          {msg && <span className={`text-[15px] ${msg.includes("แล้ว") ? "text-emerald-600" : "text-red-600"}`}>{msg}</span>}
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
      <h2 className="mb-4 text-[17px] font-semibold text-ink">ประวัติคำสั่งซื้อ</h2>
      {isLoading ? (
        <p className="text-sub">กำลังโหลด...</p>
      ) : !orders?.length ? (
        <div className="rounded-2xl border border-line p-8 text-center">
          <p className="text-[16px] text-sub">ยังไม่มีคำสั่งซื้อ</p>
          <Link to="/" className="mt-3 inline-block text-[16px] text-accent">เลือกซื้อหนังสือ</Link>
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
                  <p className="text-[16px] font-medium text-ink">
                    #{o.id.slice(0, 8).toUpperCase()}
                    <span className="ml-2 text-[14px] font-normal text-sub">
                      {new Date(o.createdAt).toLocaleDateString("th-TH", { dateStyle: "medium" })}
                    </span>
                  </p>
                  <p className="text-[14px] text-sub">
                    {o.items.length} รายการ
                    {needPay && <span className="ml-2 text-accent">· ชำระเงิน/แนบสลิป →</span>}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[13px] font-medium ${st.cls}`}>{st.label}</span>
                <span className="w-20 shrink-0 text-right text-[16px] font-semibold text-ink">{formatPrice(o.total)}</span>
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
      <span className="mb-1.5 block text-[15px] font-medium text-ink">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-[17px] text-ink outline-none transition focus:border-ink/30"
      />
    </label>
  );
}
