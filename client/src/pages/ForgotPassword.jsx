import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { AuthShell, Field } from "./Login";

export default function ForgotPassword() {
  const { forgotPassword, user } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    // ตอบเหมือนกันเสมอ (กันเดาว่าอีเมลมีในระบบ) — สำเร็จหรือไม่ก็โชว์หน้า "ส่งแล้ว"
    try { await forgotPassword(email); } catch { /* เงียบไว้ */ } finally { setBusy(false); setSent(true); }
  };

  if (sent)
    return (
      <AuthShell title="ส่งลิงก์แล้ว" subtitle="เช็กอีเมลของคุณ">
        <p className="rounded-xl bg-mist px-4 py-4 text-center text-[14px] leading-relaxed text-ink">
          ถ้ามีบัญชีที่ใช้อีเมล <b>{email}</b><br />เราได้ส่งลิงก์ตั้งรหัสผ่านใหม่ไปให้แล้ว
          <span className="mt-2 block text-[13px] text-sub">เช็กกล่องจดหมาย (รวมถึง Junk/Spam) · ลิงก์ใช้ได้ภายใน 1 ชั่วโมง</span>
        </p>
        <Link to="/login" className="mt-6 block text-center text-[13px] text-accent">← กลับไปเข้าสู่ระบบ</Link>
      </AuthShell>
    );

  return (
    <AuthShell title="ลืมรหัสผ่าน" subtitle="กรอกอีเมล เราจะส่งลิงก์ตั้งรหัสผ่านใหม่ให้">
      <form onSubmit={submit} className="space-y-4">
        <Field label="อีเมล" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <button type="submit" disabled={busy}
          className="w-full rounded-full bg-accent py-3 text-[15px] font-medium text-white transition hover:bg-accent/90 active:scale-[0.99] disabled:opacity-50">
          {busy ? "กำลังส่ง..." : "ส่งลิงก์ตั้งรหัสผ่านใหม่"}
        </button>
      </form>
      <Link to="/login" className="mt-6 block text-center text-[13px] text-sub transition hover:text-ink">← กลับไปเข้าสู่ระบบ</Link>
    </AuthShell>
  );
}
