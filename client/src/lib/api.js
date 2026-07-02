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
