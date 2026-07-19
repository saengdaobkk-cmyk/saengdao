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

/* ---------- Categories / Publishers ---------- */
export function useSaveCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c) =>
      c.id
        ? (await api.patch(`/admin/categories/${c.id}`, c)).data
        : (await api.post("/admin/categories", c)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}
export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/admin/categories/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["admin", "books"] });
    },
  });
}
// Terms: สำนักพิมพ์ / ผู้เขียน / ผู้แปล (collection)
export const useAdminTerms = (type) =>
  useQuery({ queryKey: ["admin", "terms", type], queryFn: async () => (await api.get(`/admin/terms?type=${type}`)).data });

export function useSaveTerm(type) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t) =>
      t.id
        ? (await api.patch(`/admin/terms/${t.id}`, { name: t.name, image: t.image })).data
        : (await api.post("/admin/terms", { type, name: t.name })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "terms", type] });
      qc.invalidateQueries({ queryKey: ["publishers"] });
      qc.invalidateQueries({ queryKey: ["admin", "books"] });
    },
  });
}

export function useDeleteTerm(type) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/admin/terms/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "terms", type] });
      qc.invalidateQueries({ queryKey: ["publishers"] });
      qc.invalidateQueries({ queryKey: ["admin", "books"] });
    },
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

export function useEditOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }) => (await api.patch(`/admin/orders/${id}/edit`, body)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      qc.invalidateQueries({ queryKey: ["admin", "books"] });
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
export const syncZortStock = async () => (await api.post("/admin/integrations/zort/sync-stock")).data;
export const testThpost = async () => (await api.post("/admin/integrations/thpost/test")).data;
export const refreshTracking = async (id) => (await api.post(`/admin/orders/${id}/tracking-refresh`)).data;

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

/* ---------- Users (จัดการผู้ใช้/สิทธิ์ — แอดมินเต็ม) ---------- */
export const useAdminUsers = () =>
  useQuery({ queryKey: ["admin", "users"], queryFn: async () => (await api.get("/admin/users")).data });

export function useSaveUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }) =>
      id ? (await api.patch(`/admin/users/${id}`, data)).data : (await api.post("/admin/users", data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/admin/users/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

/* ---------- Customers (ลูกค้า — เจ้าหน้าที่ดู/แก้ได้) ---------- */
export const useAdminCustomers = () =>
  useQuery({ queryKey: ["admin", "customers"], queryFn: async () => (await api.get("/admin/customers")).data });

export function useSaveCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }) => (await api.patch(`/admin/customers/${id}`, data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "customers"] }),
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/admin/customers/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "customers"] }),
  });
}

/* ---------- CRM: โปรไฟล์ 360 / โน้ต / แต้ม ---------- */
export const useCustomerTags = () =>
  useQuery({ queryKey: ["admin", "customer-tags"], queryFn: async () => (await api.get("/admin/customer-tags")).data });

export const useCustomerDetail = (id) =>
  useQuery({
    queryKey: ["admin", "customer", id],
    queryFn: async () => (await api.get(`/admin/customers/${id}`)).data,
    enabled: !!id,
  });

function useCrmMutation(mutationFn) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "customer", vars.id] });
      qc.invalidateQueries({ queryKey: ["admin", "customers"] });
      qc.invalidateQueries({ queryKey: ["admin", "customer-tags"] });
    },
  });
}

export const useAddNote = () =>
  useCrmMutation(async ({ id, ...data }) => (await api.post(`/admin/customers/${id}/notes`, data)).data);

export const useToggleNote = () =>
  useCrmMutation(async ({ noteId, ...data }) => (await api.patch(`/admin/customers/notes/${noteId}`, data)).data);

export const useDeleteNote = () =>
  useCrmMutation(async ({ noteId }) => (await api.delete(`/admin/customers/notes/${noteId}`)).data);

export const useAdjustPoints = () =>
  useCrmMutation(async ({ id, ...data }) => (await api.post(`/admin/customers/${id}/points`, data)).data);
