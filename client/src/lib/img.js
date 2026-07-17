// ย่อ/บีบอัดรูปผ่าน Supabase image transform (เสิร์ฟรูปเล็กตามที่ใช้จริง → โหลดไว)
// รูปที่ไม่ใช่ Supabase (local dev / ลิงก์นอก) คืนค่าเดิม
export function img(url, width, quality = 70) {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("/storage/v1/object/public/")) return url;
  const base = url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}width=${width}&quality=${quality}`;
}
