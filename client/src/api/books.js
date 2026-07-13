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

// Hot Deal ที่กำลัง active (section หน้าแรก) — refetch เป็นระยะให้ทันโปรที่เพิ่ง/หมด
export function useHotDeals() {
  return useQuery({
    queryKey: ["hot-deals"],
    queryFn: async () => (await api.get("/books/hot-deals")).data,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
    refetchOnWindowFocus: true,
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

// สำนักพิมพ์ (+ จำนวนหนังสือ) — ใช้หน้าแรก section
export function usePublishers() {
  return useQuery({
    queryKey: ["publishers"],
    queryFn: async () => (await api.get("/books/publishers")).data,
    staleTime: 1000 * 60,
  });
}

// directory: รายชื่อ term ทั้งหมด + slug + จำนวนเล่ม (สำหรับหน้ารวมสำนักพิมพ์/ผู้เขียน/ผู้แปล)
export function useTermDirectory(type) {
  return useQuery({
    queryKey: ["term-directory", type],
    queryFn: async () => (await api.get(`/terms/list/${type.toLowerCase()}`)).data,
    staleTime: 1000 * 60,
  });
}

// รายชื่อ term (PUBLISHER/AUTHOR/TRANSLATOR) สำหรับ datalist ในฟอร์ม
export function useTermList(type) {
  return useQuery({
    queryKey: ["terms", type],
    queryFn: async () => (await api.get(`/terms?type=${type}`)).data,
    staleTime: 1000 * 60,
  });
}
