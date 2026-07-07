import { useState } from "react";
import { Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function AdminLogin() {
  const { user, login, logout, isStaff } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // ล็อกอินเป็นเจ้าหน้าที่อยู่แล้ว → เข้าหลังบ้านเลย
  if (user && isStaff) return <Navigate to={from} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const u = await login(email, password);
      if (u.role === "USER") {
        setError("บัญชีนี้เป็นลูกค้า ไม่มีสิทธิ์เข้าหลังบ้าน");
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.error || "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-2 inline-flex items-center gap-2">
            <span className="text-[18px] font-semibold tracking-[0.22em] text-white">SAENGDAO</span>
            <span className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-white">ADMIN</span>
          </div>
          <p className="text-[13px] text-white/50">เข้าสู่ระบบหลังบ้าน — เฉพาะเจ้าหน้าที่</p>
        </div>

        {/* ล็อกอินเป็นลูกค้าอยู่ → ปฏิเสธ + ให้ออกแล้วเข้าใหม่ */}
        {user && !isStaff ? (
          <div className="rounded-2xl bg-white/5 p-6 text-center">
            <p className="text-[14px] text-white/80">
              บัญชี <span className="font-medium text-white">{user.email}</span> ไม่มีสิทธิ์เข้าหลังบ้าน
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button onClick={() => { logout(); setEmail(""); setPassword(""); }}
                className="rounded-full bg-white py-2.5 text-[14px] font-medium text-ink hover:bg-white/90">
                ออกจากระบบ แล้วเข้าด้วยบัญชีเจ้าหน้าที่
              </button>
              <Link to="/" className="text-[13px] text-white/50 hover:text-white/80">← กลับหน้าร้าน</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="rounded-2xl bg-white/5 p-6">
            <label className="block">
              <span className="mb-1.5 block text-[13px] text-white/70">อีเมล</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required
                className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-[15px] text-white placeholder-white/30 outline-none focus:border-white/30" />
            </label>
            <label className="mt-4 block">
              <span className="mb-1.5 block text-[13px] text-white/70">รหัสผ่าน</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required
                className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-[15px] text-white placeholder-white/30 outline-none focus:border-white/30" />
            </label>

            {error && <p className="mt-3 text-[13px] text-red-400">{error}</p>}

            <button type="submit" disabled={busy}
              className="mt-5 w-full rounded-full bg-accent py-3 text-[15px] font-medium text-white transition hover:bg-accent/90 active:scale-[0.99] disabled:opacity-50">
              {busy ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>

            <Link to="/" className="mt-4 block text-center text-[13px] text-white/50 hover:text-white/80">← กลับหน้าร้าน</Link>
          </form>
        )}
      </div>
    </div>
  );
}
