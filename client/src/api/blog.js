import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { api } from "../lib/api";

// รายการบทความ (แบ่งหน้า)
export const useBlogPosts = (page = 1, pageSize = 9) =>
  useQuery({
    queryKey: ["blog", "list", page, pageSize],
    queryFn: async () => (await api.get(`/blog?page=${page}&pageSize=${pageSize}`)).data,
    placeholderData: keepPreviousData,
  });

// บทความเดียว (slug หรือ id)
export const useBlogPost = (key) =>
  useQuery({ queryKey: ["blog", "post", key], queryFn: async () => (await api.get(`/blog/${key}`)).data, enabled: !!key });

/* ---------- Admin ---------- */
export const useAdminBlog = () =>
  useQuery({ queryKey: ["admin", "blog"], queryFn: async () => (await api.get("/admin/blog")).data });

export function useSaveBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }) =>
      id ? (await api.patch(`/admin/blog/${id}`, data)).data : (await api.post("/admin/blog", data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "blog"] });
      qc.invalidateQueries({ queryKey: ["blog"] });
    },
  });
}

export function useDeleteBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/admin/blog/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "blog"] });
      qc.invalidateQueries({ queryKey: ["blog"] });
    },
  });
}
