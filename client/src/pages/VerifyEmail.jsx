import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { AuthShell } from "./Login";

export default function VerifyEmail() {
  const { verifyEmail, resendVerification } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";

  const [status, setStatus] = useState("verifying"); // verifying | success | expired | error
  const [email, setEmail] = useState("");
  const [resent, setResent] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // กันยิงซ้ำตอน StrictMode
    ran.current = true;
    if (!token) { setStatus("error"); return; }
    (async () => {
      try {
        const r = await verifyEmail(token);
        if (r.twoFactorRequired) { navigate("/login", { replace: true }); return; }
        setStatus("success");
        setTimeout(() => navigate("/", { replace: true }), 1500);
      } catch (err) {
        const d = err.response?.data;
        setEmail(d?.email || "");
        setStatus(d?.expired ? "expired" : "error");
      }
    })();
  }, [token, verifyEmail, navigate]);

  const resend = async () => {
    try { await resendVerification(email); setResent(true); } catch { /* เงียบไว้ */ }
  };

  if (status === "verifying")
    return <AuthShell title="กำลังยืนยันอีเมล..." subtitle="รอสักครู่" />;

  if (status === "success")
    return (
      <AuthShell title="ยืนยันอีเมลสำเร็จ ✓" subtitle="กำลังพาเข้าสู่ระบบ...">
        <Link to="/" className="block text-center text-[13px] text-accent">ไปหน้าแรก</Link>
      </AuthShell>
    );

  // expired / error
  return (
    <AuthShell
      title={status === "expired" ? "ลิงก์หมดอายุ" : "ลิงก์ไม่ถูกต้อง"}
      subtitle={status === "expired" ? "ลิงก์ยืนยันนี้หมดอายุแล้ว" : "ลิงก์ยืนยันไม่ถูกต้องหรือถูกใช้ไปแล้ว"}
    >
      <div className="space-y-4 text-center">
        {email && (
          <button
            type="button"
            onClick={resend}
            disabled={resent}
            className="w-full rounded-full border border-line py-3 text-[14px] font-medium text-ink transition hover:bg-mist disabled:opacity-50"
          >
            {resent ? "ส่งลิงก์ยืนยันใหม่แล้ว ✓ เช็กอีเมล" : "ส่งลิงก์ยืนยันใหม่"}
          </button>
        )}
        <Link to="/login" className="block text-[13px] text-accent">ไปหน้าเข้าสู่ระบบ</Link>
      </div>
    </AuthShell>
  );
}
