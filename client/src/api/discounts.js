import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export const useDiscountRules = () =>
  useQuery({ queryKey: ["admin", "discount-rules"], queryFn: async () => (await api.get("/admin/discount-rules")).data });

export function useSaveRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }) =>
      id ? (await api.patch(`/admin/discount-rules/${id}`, data)).data : (await api.post("/admin/discount-rules", data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "discount-rules"] }),
  });
}

export function useDeleteRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/admin/discount-rules/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "discount-rules"] }),
  });
}

// ส่วนลดอัตโนมัติสำหรับ checkout
export function useAutoDiscount(subtotal, qty) {
  return useQuery({
    queryKey: ["discount-preview", subtotal, qty],
    queryFn: async () => (await api.post("/discounts/preview", { subtotal, qty })).data,
    enabled: subtotal > 0,
    staleTime: 1000 * 30,
  });
}
