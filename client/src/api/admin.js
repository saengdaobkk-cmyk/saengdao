import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

/* ---------- Stats ---------- */
export const useAdminStats = () =>
  useQuery({ queryKey: ["admin", "stats"], queryFn: async () => (await api.get("/admin/stats")).data });

/* ---------- Books ---------- */
export const useAdminBooks = () =>
  useQuery({ queryKey: ["admin", "books"], queryFn: async () => (await api.get("/admin/books")).data });

export function useSaveBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (book) =>
      book.id
        ? (await api.patch(`/admin/books/${book.id}`, book)).data
        : (await api.post("/admin/books", book)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "books"] }),
  });
}

export function useDeleteBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/admin/books/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "books"] }),
  });
}

export function useImportBooks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows) => (await api.post("/admin/books/import", { rows })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "books"] }),
  });
}

/* ---------- Orders ---------- */
export const useAdminOrders = () =>
  useQuery({ queryKey: ["admin", "orders"], queryFn: async () => (await api.get("/admin/orders")).data });

export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }) => (await api.patch(`/admin/orders/${id}`, patch)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
}

export function useZortSyncOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.post(`/admin/orders/${id}/zort-sync`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "orders"] }),
  });
}

/* ---------- Coupons ---------- */
export const useAdminCoupons = () =>
  useQuery({ queryKey: ["admin", "coupons"], queryFn: async () => (await api.get("/admin/coupons")).data });

export function useSaveCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c) =>
      c.id
        ? (await api.patch(`/admin/coupons/${c.id}`, c)).data
        : (await api.post("/admin/coupons", c)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "coupons"] }),
  });
}

export function useDeleteCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/admin/coupons/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "coupons"] }),
  });
}

/* ---------- Slides ---------- */
export const useAdminSlides = () =>
  useQuery({ queryKey: ["admin", "slides"], queryFn: async () => (await api.get("/admin/slides")).data });

export function useSaveSlide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s) =>
      s.id
        ? (await api.patch(`/admin/slides/${s.id}`, s)).data
        : (await api.post("/admin/slides", s)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "slides"] });
      qc.invalidateQueries({ queryKey: ["slides"] });
    },
  });
}

export function useDeleteSlide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/admin/slides/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "slides"] });
      qc.invalidateQueries({ queryKey: ["slides"] });
    },
  });
}

/* ---------- Integrations ---------- */
export const useIntegrations = () =>
  useQuery({ queryKey: ["admin", "integrations"], queryFn: async () => (await api.get("/admin/integrations")).data });

export function useSaveIntegrations() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.patch("/admin/integrations", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "integrations"] }),
  });
}

export const testZort = async () => (await api.post("/admin/integrations/zort/test")).data;

/* ---------- Upload ---------- */
export async function uploadImage(file) {
  const fd = new FormData();
  fd.append("image", file);
  return (await api.post("/admin/upload", fd)).data.url;
}

export async function uploadImages(files) {
  const fd = new FormData();
  [...files].forEach((f) => fd.append("images", f));
  return (await api.post("/admin/upload-images", fd)).data.urls;
}

export async function uploadPdf(file) {
  const fd = new FormData();
  fd.append("pdf", file);
  return (await api.post("/admin/upload-pdf", fd)).data.url;
}
