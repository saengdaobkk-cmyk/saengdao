// ฟอนต์ที่เลือกได้ (รองรับไทย ทั้งหมด จาก Google Fonts) → ค่า = family param ของ Google Fonts
export const THEME_FONTS = {
  "IBM Plex Sans Thai": "IBM+Plex+Sans+Thai:wght@300;400;500;600;700",
  "Noto Sans Thai": "Noto+Sans+Thai:wght@300;400;500;600;700",
  "Prompt": "Prompt:wght@300;400;500;600;700",
  "Kanit": "Kanit:wght@300;400;500;600;700",
  "Sarabun": "Sarabun:wght@300;400;500;600;700",
  "Mitr": "Mitr:wght@300;400;500;600;700",
  "Bai Jamjuree": "Bai+Jamjuree:wght@300;400;500;600;700",
  "Chakra Petch": "Chakra+Petch:wght@300;400;500;600;700",
  "Anuphan": "Anuphan:wght@300;400;500;600;700",
};

export const DEFAULT_FONT = "IBM Plex Sans Thai";
export const fontHref = (name) => `https://fonts.googleapis.com/css2?family=${THEME_FONTS[name] || THEME_FONTS[DEFAULT_FONT]}&display=swap`;

// ใช้ค่าธีมจาก settings → ตั้ง CSS variable + โหลดฟอนต์ (เรียกครั้งเดียวจาก ThemeApplier)
export function applyTheme({ accent, font }) {
  const root = document.documentElement;
  if (accent) root.style.setProperty("--color-accent", accent);
  else root.style.removeProperty("--color-accent");

  const f = THEME_FONTS[font] ? font : DEFAULT_FONT;
  root.style.setProperty("--font-sans", `'${f}'`);
  if (f !== DEFAULT_FONT) {
    // IBM Plex Sans Thai โหลดไว้ใน index.html แล้ว — ฟอนต์อื่นค่อยโหลดเพิ่ม
    let link = document.getElementById("theme-font");
    if (!link) { link = document.createElement("link"); link.id = "theme-font"; link.rel = "stylesheet"; document.head.appendChild(link); }
    link.href = fontHref(f);
  }
}
