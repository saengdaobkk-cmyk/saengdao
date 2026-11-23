import { useEffect } from "react";
import { useSettings } from "../api/settings";
import { applyTheme } from "../lib/themeFonts";

// ตั้งสีหลัก (accent) + ฟอนต์ จาก settings → มีผลทั้งเว็บ (หน้าร้าน + หลังบ้าน)
export default function ThemeApplier() {
  const { themeAccentColor, themeFont, contentFontScale } = useSettings();
  useEffect(() => {
    applyTheme({ accent: themeAccentColor || "", font: themeFont || "", contentScale: contentFontScale });
  }, [themeAccentColor, themeFont, contentFontScale]);
  return null;
}
