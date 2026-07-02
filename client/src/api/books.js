import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { api } from "../lib/api";

// รายการหนังสือ (ค้นหา/กรอง/แบ่งหน้า)
export function useBooks(params) {
  return useQuery({
    queryKey: ["books", params],
    queryFn: async () => (await api.get("/books", { params })).data,
    placeholderData: keepPreviousData, // ไม่กระพริบตอนเปลี่ยนหน้า/ค้นหา
  });
}

// หนังสือเล่มเดียว
export function useBook(id) {
  return useQuery({
    queryKey: ["book", id],
    queryFn: async () => (await api.get(`/books/${id}`)).data,
    enabled: !!id,
  });
}

// เล่มใกล้เคียง (หมวดเดียวกัน)
export function useRelated(id) {
  return useQuery({
    queryKey: ["related", id],
    queryFn: async () => (await api.get(`/books/${id}/related`)).data,
    enabled: !!id,
  });
}

// หมวดหมู่
export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await api.get("/categories")).data,
  });
}

// สำนักพิมพ์ (+ จำนวนหนังสือ)
export function usePublishers() {
  return useQuery({
    queryKey: ["publishers"],
    queryFn: async () => (await api.get("/books/publishers")).data,
    staleTime: 1000 * 60,
  });
}
