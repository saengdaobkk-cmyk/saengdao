import axios from "axios";

// dev: ใช้ vite proxy (/api → :4000)
// prod: ตั้ง VITE_API_URL = URL ของ backend (Railway) เช่น https://xxx.up.railway.app
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, "")}/api`
  : "/api";

export const api = axios.create({ baseURL: API_BASE });

// แนบ JWT ทุก request ถ้ามี (ใช้จริงตอน Phase 3)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// กัน LiteSpeed (Hostinger) cache API response เพี้ยน/ตัดขาด → axios parse JSON ไม่ได้ คืนเป็น string
// ตรวจเจอ → ยิงซ้ำครั้งเดียวด้วย cache-buster เพื่อข้าม cache ที่เสีย แล้วได้ข้อมูลครบ
api.interceptors.response.use((res) => {
  const ct = res.headers?.["content-type"] || "";
  const isJsonEndpoint = ct.includes("application/json");
  const method = (res.config?.method || "get").toLowerCase();
  if (isJsonEndpoint && typeof res.data === "string" && method === "get" && !res.config.__cbRetried) {
    const cfg = { ...res.config, __cbRetried: true };
    cfg.params = { ...(cfg.params || {}), _cb: Date.now() };
    return api.request(cfg); // ยิงใหม่แบบ cache miss → JSON ครบ
  }
  return res;
});
