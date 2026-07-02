import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { messageFor } from "../lib/validation";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="เข้าสู่ระบบ" subtitle="ยินดีต้อนรับกลับสู่ SAENGDAO">
      {location.state?.from === "/checkout" && (
        <p className="mb-5 rounded-xl bg-mist px-4 py-3 text-center text-[13px] text-ink">
          กรุณาเข้าสู่ระบบเพื่อดำเนินการสั่งซื้อ
        </p>
      )}
      <form onSubmit={submit} className="space-y-4">
        <Field label="อีเมล" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <Field label="รหัสผ่าน" type="password" value={password} onChange={setPassword} autoComplete="current-password" />

        {error && <p className="text-[13px] text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-accent py-3 text-[15px] font-medium text-white transition hover:bg-accent/90 active:scale-[0.99] disabled:opacity-50"
        >
          {busy ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>
      </form>

      <p className="mt-6 text-center text-[13px] text-sub">
        ยังไม่มีบัญชี?{" "}
        <Link to="/register" state={location.state} className="text-accent hover:underline">
          สมัครสมาชิก
        </Link>
      </p>
    </AuthShell>
  );
}

// ---- ใช้ร่วมกับหน้า Register ----
export function AuthShell({ title, subtitle, children }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-5 py-16">
      <h1 className="text-center text-3xl font-semibold tracking-tightest text-ink">{title}</h1>
      {subtitle && <p className="mb-8 mt-2 text-center text-[14px] text-sub">{subtitle}</p>}
      {children}
    </div>
  );
}

export function Field({ label, type = "text", value, onChange, autoComplete }) {
  const [error, setError] = useState("");

  const onInvalid = (e) => {
    e.preventDefault(); // ปิดป๊อปอัปเนทีฟ ใช้ของเราแทน
    setError(messageFor(e.target));
  };
  const onInput = (e) => {
    e.target.setCustomValidity("");
    if (error) setError("");
  };

  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-ink">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onInvalid={onInvalid}
        onInput={onInput}
        autoComplete={autoComplete}
        required
        className={`w-full rounded-xl border bg-mist px-4 py-3 text-[15px] text-ink outline-none transition focus:bg-white ${
          error ? "neon-error" : "border-line focus:border-ink/30"
        }`}
      />
      {error && <span className="mt-1.5 block text-[12px] text-red-500">{error}</span>}
    </label>
  );
}
