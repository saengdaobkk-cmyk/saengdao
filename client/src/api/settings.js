import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

// ค่า default ระหว่างที่ยังโหลดไม่เสร็จ
const FALLBACK = {
  cartDrawerEnabled: true,
  showCardCategory: false,
  showPublisherMarquee: true,
  showProductTrust: true,
  showPromoRibbon: false,
  showTextMarquee: false,
  transparentHeader: true,
  showCollectionCount: true,
  logoUrl: "",
  lineQrUrl: "",
  logoSize: "56",
  logoSizeHeader: "16",
  logoSizeFooter: "15",
  homeRows: "",
  homeCustomRows: "",
  headerLogoOnLight: "",
  headerLogoOnDark: "",
  headerLogoSize: "28",
  slideInterval: "6",
  slideAnimation: "fade",
  homeSectionOrder: "",
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
  loyaltyEnabled: false,
  loyaltyBahtPerPoint: "100",
  loyaltyPointValue: "1",
  orderExpiryDays: "7",
  footerLogoText: "SAENGDAO",
  footerLogoUrl: "",
  footerLogoSize: "36",
  footerNav: "",
};

function settingsQuery() {
  return {
    queryKey: ["settings"],
    queryFn: async () => (await api.get("/settings")).data,
    staleTime: 1000 * 60, // cache 1 นาที
  };
}

export function useSettings() {
  const { data } = useQuery(settingsQuery());
  return data || FALLBACK;
}

// โหลดค่าจริงจาก server เสร็จหรือยัง (ใช้กันโลโก้กระพริบ text ก่อนขึ้นรูป)
export function useSettingsLoaded() {
  const { data } = useQuery(settingsQuery());
  return !!data;
}

// สำหรับ admin — อัปเดตค่าแล้ว refresh cache
export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch) => (await api.patch("/settings", patch)).data,
    onSuccess: (data) => qc.setQueryData(["settings"], data),
  });
}
