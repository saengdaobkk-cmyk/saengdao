import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

// สไลด์ hero ที่เปิดใช้งาน (หน้าแรก)
export function useSlides() {
  return useQuery({
    queryKey: ["slides"],
    queryFn: async () => (await api.get("/slides")).data,
    staleTime: 1000 * 30,
  });
}
