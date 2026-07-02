// คืนข้อความ validation ภาษาไทยตามชนิดข้อผิดพลาดของ input
export function messageFor(el) {
  const v = el.validity;
  if (v.valueMissing) return "กรุณากรอกข้อมูลนี้";
  if (v.typeMismatch && el.type === "email") return "กรุณากรอกอีเมลให้ถูกต้อง";
  if (v.tooShort) return `กรุณากรอกอย่างน้อย ${el.minLength} ตัวอักษร`;
  if (v.patternMismatch) return "รูปแบบไม่ถูกต้อง";
  return "";
}
