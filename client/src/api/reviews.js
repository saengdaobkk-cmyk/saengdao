import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { api } from "../lib/api";

// รีวิวของสินค้า (แบ่งหน้า) — avg/count คิดจากทั้งหมด
export const useBookReviews = (id, page = 1, pageSize = 5) =>
  useQuery({
    queryKey: ["reviews", id, page, pageSize],
    queryFn: async () => (await api.get(`/books/${id}/reviews?page=${page}&pageSize=${pageSize}`)).data,
    enabled: !!id,
    placeholderData: keepPreviousData,
  });

// รีวิวของฉัน (prefill ฟอร์ม) — เฉพาะตอนล็อกอิน
export const useMyReview = (id, enabled) =>
  useQuery({ queryKey: ["reviews", id, "mine"], queryFn: async () => (await api.get(`/books/${id}/reviews/mine`)).data, enabled: !!id && !!enabled });

export function useSubmitReview(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ rating, comment }) => (await api.post(`/books/${id}/reviews`, { rating, comment })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", id] });
    },
  });
}

/* ---------- Admin ---------- */
export const useAdminReviews = () =>
  useQuery({ queryKey: ["admin", "reviews"], queryFn: async () => (await api.get("/admin/reviews")).data });

export function useModerateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, action, hidden }) =>
      action === "delete"
        ? (await api.delete(`/admin/reviews/${id}`)).data
        : (await api.patch(`/admin/reviews/${id}`, { hidden })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "reviews"] }),
  });
}
