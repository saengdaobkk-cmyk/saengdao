/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  // hover: ทำงานเฉพาะอุปกรณ์ที่มีเมาส์จริง → กันสถานะ hover ค้างบนมือถือหลังแตะ
  future: { hoverOnlyWhenSupported: true },
  theme: {
    extend: {
      fontFamily: {
        sans: ["IBM Plex Sans Thai", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        ink: "#1d1d1f", // หมึกเข้ม (ตัวหนังสือหลัก)
        sub: "#86868b", // เทารอง
        line: "#e5e5e7", // เส้นแบ่ง
        mist: "#f5f5f7", // เทาหมอก (พื้นเซกชัน)
        accent: "#0071e3", // ฟ้า Apple
      },
      letterSpacing: {
        tightest: "-0.03em",
      },
      maxWidth: {
        page: "1120px",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both",
      },
    },
  },
  plugins: [],
};
