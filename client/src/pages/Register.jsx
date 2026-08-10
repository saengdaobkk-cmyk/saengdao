import { useState } from "react";
import { Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { AuthShell, Field } from "./Login";

export default function Register() {
  const { register, resendVerification, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false); // สมัครเสร็จ รออีเมลยืนยัน
  const [resent, setResent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    setBusy(true);
    try {
      const res = await register(email, password, name);
      if (res?.pendingVerification) setSent(true);
      else navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "สมัครสมาชิกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    try { await resendVerification(email); setResent(true); } catch { /* เงียบไว้ */ }
  };

  if (user) return <Navigate to={from} replace />;

  // สมัครสำเร็จ → รอยืนยันอีเมล
  if (sent)
    return (
      <AuthShell title="ตรวจอีเมลของคุณ" subtitle={`เราส่งลิงก์ยืนยันไปที่ ${email} แล้ว`}>
        <div className="space-y-4 text-center">
          <p className="text-[14px] leading-relaxed text-sub">
            เปิดอีเมลแล้วกดปุ่ม “ยืนยันอีเมล” เพื่อเริ่มใช้งานบัญชี — ถ้าไม่เจอ ลองเช็กกล่อง Junk/Spam
          </p>
          <button
            type="button"
            onClick={resend}
            disabled={resent}
            className="w-full rounded-full border border-line py-3 text-[14px] font-medium text-ink transition hover:bg-mist disabled:opacity-50"
          >
            {resent ? "ส่งลิงก์ใหม่แล้ว ✓" : "ส่งลิงก์ยืนยันอีกครั้ง"}
          </button>
          <Link to="/login" className="block text-[13px] text-accent">ไปหน้าเข้าสู่ระบบ</Link>
        </div>
      </AuthShell>
    );

  return (
    <AuthShell title="สมัครสมาชิก" subtitle="สร้างบัญชีเพื่อเริ่มช้อปกับ SAENGDAO">
      <form onSubmit={submit} className="space-y-4">
        <Field label="ชื่อ" value={name} onChange={setName} autoComplete="name" />
        <Field label="อีเมล" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <Field label="รหัสผ่าน" type="password" value={password} onChange={setPassword} autoComplete="new-password" />

        {error && <p className="text-[13px] text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-accent py-3 text-[15px] font-medium text-white transition hover:bg-accent/90 active:scale-[0.99] disabled:opacity-50"
        >
          {busy ? "กำลังสมัคร..." : "สมัครสมาชิก"}
        </button>
      </form>

      <p className="mt-6 text-center text-[13px] text-sub">
        มีบัญชีอยู่แล้ว?{" "}
        <Link to="/login" state={location.state} className="text-accent">
          เข้าสู่ระบบ
        </Link>
      </p>
    </AuthShell>
  );
}
