import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // กำลังเช็ค session ตอนเปิดเว็บ

  // ตอนโหลดเว็บ ถ้ามี token ให้ดึงข้อมูล user มายืนยัน
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  const saveSession = ({ token, user }) => {
    localStorage.setItem("token", token);
    setUser(user);
  };

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    if (res.data.twoFactorRequired) return { twoFactorRequired: true, pendingToken: res.data.pendingToken };
    saveSession(res.data);
    return { user: res.data.user };
  };

  // ยืนยันรหัส 2FA แล้วเข้าสู่ระบบให้สมบูรณ์
  const verify2fa = async (pendingToken, code) => {
    const res = await api.post("/auth/2fa/verify", { pendingToken, code });
    saveSession(res.data);
    return res.data.user;
  };

  const register = async (email, password, name) => {
    const res = await api.post("/auth/register", { email, password, name });
    saveSession(res.data);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const isAdmin = user?.role === "ADMIN";
  const isStaff = user?.role === "STAFF" || isAdmin; // แอดมินนับเป็นเจ้าหน้าที่ด้วย

  return (
    <AuthContext.Provider
      value={{ user, loading, login, verify2fa, register, logout, updateUser: setUser, isAdmin, isStaff }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
