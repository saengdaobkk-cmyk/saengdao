import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { AuthShell, Field } from "./Login";

export default function ResetPassword() {
  const { resetPassword, verify2fa, user } = useAuth();
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(null);
  const [code, setCode] = useState("");

  if (user) return <Navigate to="/" replace />;

  if (!token)
    return (
      <AuthShell title="ลิงก์ไม่ถูกต้อง">
        <p className="text-center text-[14px] text-sub">ลิงก์ตั้งรหัสผ่านไม่ถูกต้องหรือไม่สมบูรณ์</p>
        <Link to="/forgot-password" className="mt-6 block text-center text-[13px] text-accent">ขอลิงก์ใหม่</Link>
      </AuthShell>
    );

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) return setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
    if (password !== confirm) return setError("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
    setBusy(true);
    try {
      const r = await resetPassword(token, password);
      if (r.twoFactorRequired) setPending(r.pendingToken);
      else navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "ตั้งรหัสผ่านไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await verify2fa(pending, code);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "รหัสไม่ถูกต้อง");
    } finally {
      setBusy(false);
    }
  };

  if (pending)
    return (
      <AuthShell title="ยืนยันตัวตน 2 ชั้น" subtitle="กรอกรหัส 6 หลักจากแอป Authenticator">
        <form onSubmit={submitCode} className="space-y-4">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric" autoFocus placeholder="000000"
            className="w-full rounded-xl border border-line bg-mist px-4 py-3 text-center text-[22px] tracking-[0.5em] text-ink outline-none focus:border-ink/30 focus:bg-white"
          />
          {error && <p className="text-[13px] text-red-600">{error}</p>}
          <button type="submit" disabled={busy || code.length < 6}
            className="w-full rounded-full bg-accent py-3 text-[15px] font-medium text-white transition hover:bg-accent/90 disabled:opacity-50">
            {busy ? "กำลังตรวจสอบ..." : "ยืนยัน"}
          </button>
        </form>
      </AuthShell>
    );

  return (
    <AuthShell title="ตั้งรหัสผ่านใหม่" subtitle="ตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ">
      <form onSubmit={submit} className="space-y-4">
        <Field label="รหัสผ่านใหม่" type="password" value={password} onChange={setPassword} autoComplete="new-password" />
        <Field label="ยืนยันรหัสผ่านใหม่" type="password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
        {error && <p className="text-[13px] text-red-600">{error}</p>}
        <button type="submit" disabled={busy}
          className="w-full rounded-full bg-accent py-3 text-[15px] font-medium text-white transition hover:bg-accent/90 active:scale-[0.99] disabled:opacity-50">
          {busy ? "กำลังบันทึก..." : "ตั้งรหัสผ่านใหม่แล้วเข้าสู่ระบบ"}
        </button>
      </form>
      <Link to="/login" className="mt-6 block text-center text-[13px] text-sub transition hover:text-ink">← กลับไปเข้าสู่ระบบ</Link>
    </AuthShell>
  );
}
