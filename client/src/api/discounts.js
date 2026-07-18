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

// ส่วนลดอัตโนมัติสำหรับ checkout (ส่งรายการสินค้าไปคิดตามขอบเขต)
export function useAutoDiscount(items) {
  const payload = (items || []).map((i) => ({ bookId: i.id, price: i.price, quantity: i.quantity }));
  return useQuery({
    queryKey: ["discount-preview", payload],
    queryFn: async () => (await api.post("/discounts/preview", { items: payload })).data,
    enabled: payload.length > 0,
    staleTime: 1000 * 30,
  });
}
