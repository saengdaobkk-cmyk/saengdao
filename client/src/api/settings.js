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

// cache ค่า settings (สาธารณะ ไม่มีความลับ) ลง localStorage → โหลดครั้งถัดไปขึ้นโลโก้ทันที
const LS_KEY = "sd_settings_v1";
function readCache() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function writeCache(data) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch { /* เต็ม/ปิดใช้ */ }
}

function settingsQuery() {
  return {
    queryKey: ["settings"],
    queryFn: async () => {
      const data = (await api.get("/settings")).data;
      writeCache(data); // อัปเดต cache ทุกครั้งที่ดึงสำเร็จ
      return data;
    },
    initialData: () => readCache() || undefined, // มี cache → มีค่าให้ใช้ตั้งแต่ render แรก
    initialDataUpdatedAt: 0, // ถือว่า cache เก่าเสมอ → refetch พื้นหลังทันที (โชว์ค่าเก่าไปก่อน)
    staleTime: 1000 * 60, // cache 1 นาที
  };
}

export function useSettings() {
  const { data } = useQuery(settingsQuery());
  return { ...FALLBACK, ...(data || {}) }; // เติม default ให้ key ที่ cache เก่าอาจยังไม่มี
}

// มีค่าให้ใช้แล้วหรือยัง (จาก cache หรือ server) — กันโลโก้กระพริบ text ก่อนขึ้นรูป
export function useSettingsLoaded() {
  const { data } = useQuery(settingsQuery());
  return !!data;
}

// สำหรับ admin — อัปเดตค่าแล้ว refresh cache
export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch) => (await api.patch("/settings", patch)).data,
    onSuccess: (data) => { qc.setQueryData(["settings"], data); writeCache(data); },
  });
}
