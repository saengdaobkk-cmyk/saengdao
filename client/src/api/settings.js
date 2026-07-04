import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

// ค่า default ระหว่างที่ยังโหลดไม่เสร็จ
const FALLBACK = {
  cartDrawerEnabled: true,
  showCardCategory: false,
  promptpayId: "",
  promptpayName: "",
  bankName: "",
  bankAccountNo: "",
  bankAccountName: "",
  contactPhone: "",
  contactEmail: "",
  contactLine: "",
  contactAddress: "",
  contactHours: "",
  socialFacebook: "",
  socialInstagram: "",
  socialLine: "",
};

export function useSettings() {
  const { data } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => (await api.get("/settings")).data,
    staleTime: 1000 * 60, // cache 1 นาที
  });
  return data || FALLBACK;
}

// สำหรับ admin — อัปเดตค่าแล้ว refresh cache
export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch) => (await api.patch("/settings", patch)).data,
    onSuccess: (data) => qc.setQueryData(["settings"], data),
  });
}
