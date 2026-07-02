import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

// ข้อความสาธารณะ — คืนฟังก์ชัน t(key, fallback)
export function useContent() {
  const { data } = useQuery({
    queryKey: ["content"],
    queryFn: async () => (await api.get("/content")).data,
    staleTime: 1000 * 60,
  });
  const map = data || {};
  const t = (key, fallback = "") => (map[key] != null ? map[key] : fallback);
  return { t };
}

/* ---------- Admin ---------- */
export const useAdminContent = () =>
  useQuery({ queryKey: ["admin", "content"], queryFn: async () => (await api.get("/admin/content")).data });

export function useSaveContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates) => (await api.patch("/admin/content", { updates })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "content"] });
      qc.invalidateQueries({ queryKey: ["content"] }); // อัปเดตหน้าร้านทันที
    },
  });
}
