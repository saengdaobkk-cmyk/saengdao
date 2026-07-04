import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

// เมนูหน้าร้าน (สาธารณะ)
export function useNav() {
  return useQuery({
    queryKey: ["nav"],
    queryFn: async () => (await api.get("/nav")).data,
    staleTime: 1000 * 60,
  });
}

/* ---------- Admin ---------- */
export const useAdminNav = () =>
  useQuery({ queryKey: ["admin", "nav"], queryFn: async () => (await api.get("/admin/nav")).data });

function invalidate(qc) {
  qc.invalidateQueries({ queryKey: ["admin", "nav"] });
  qc.invalidateQueries({ queryKey: ["nav"] });
}

export function useSaveNavItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }) =>
      id ? (await api.patch(`/admin/nav/${id}`, data)).data : (await api.post("/admin/nav", data)).data,
    onSuccess: () => invalidate(qc),
  });
}

export function useDeleteNavItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/admin/nav/${id}`)).data,
    onSuccess: () => invalidate(qc),
  });
}

export function useReorderNav() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids) => (await api.patch("/admin/nav-reorder", { ids })).data,
    onSuccess: () => invalidate(qc),
  });
}
