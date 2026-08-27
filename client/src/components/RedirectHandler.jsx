import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

// เช็ค path ปัจจุบันกับรายการ redirect (URL เก่า → ใหม่) แล้วพาไปปลายทาง
const norm = (p) => (p || "").replace(/\/+$/, "") || "/";

export default function RedirectHandler() {
  const { pathname } = useLocation();
  const { data } = useQuery({
    queryKey: ["redirects"],
    queryFn: async () => (await api.get("/redirects")).data,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!data?.length) return;
    const cur = norm(pathname);
    const hit = data.find((r) => norm(r.from) === cur);
    if (!hit) return;
    api.post("/redirects/hit", { from: hit.from }).catch(() => {});
    window.location.replace(hit.to); // ปลายทางเป็น URL เต็มหรือ path ก็ได้
  }, [pathname, data]);

  return null;
}
