import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

// ช่องทางจัดส่งที่เปิดใช้งาน (สาธารณะ — ใช้ตอน checkout)
export function useShipping() {
  return useQuery({
    queryKey: ["shipping"],
    queryFn: async () => (await api.get("/shipping")).data,
    staleTime: 1000 * 60,
  });
}

/* ---------- Admin ---------- */
export const useAdminShipping = () =>
  useQuery({
    queryKey: ["admin", "shipping"],
    queryFn: async () => (await api.get("/admin/shipping")).data,
  });

function invalidate(qc) {
  qc.invalidateQueries({ queryKey: ["admin", "shipping"] });
  qc.invalidateQueries({ queryKey: ["shipping"] });
}

export function useSaveShipping() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }) =>
      id ? (await api.patch(`/admin/shipping/${id}`, data)).data : (await api.post("/admin/shipping", data)).data,
    onSuccess: () => invalidate(qc),
  });
}

export function useDeleteShipping() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/admin/shipping/${id}`)).data,
    onSuccess: () => invalidate(qc),
  });
}

export function useReorderShipping() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids) => (await api.patch("/admin/shipping-reorder", { ids })).data,
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: ["admin", "shipping"] });
      await qc.cancelQueries({ queryKey: ["shipping"] });
      const prevAdmin = qc.getQueryData(["admin", "shipping"]);
      const prevPublic = qc.getQueryData(["shipping"]);
      const sortByIds = (list) => {
        if (!Array.isArray(list)) return list;
        const map = new Map(list.map((n) => [n.id, n]));
        return ids.map((id) => map.get(id)).filter(Boolean);
      };
      qc.setQueryData(["admin", "shipping"], sortByIds);
      qc.setQueryData(["shipping"], (list) =>
        Array.isArray(list) ? sortByIds(list.slice()).filter((n) => n.active) : list
      );
      return { prevAdmin, prevPublic };
    },
    onError: (_e, _ids, ctx) => {
      if (ctx?.prevAdmin) qc.setQueryData(["admin", "shipping"], ctx.prevAdmin);
      if (ctx?.prevPublic) qc.setQueryData(["shipping"], ctx.prevPublic);
    },
    onSettled: () => invalidate(qc),
  });
}
