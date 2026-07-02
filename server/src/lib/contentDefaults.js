// ข้อความเริ่มต้นทั้งเว็บ — จัดกลุ่มตาม section
// key รูปแบบ "<section>.<name>" · label = คำอธิบายให้ admin เข้าใจ
export const CONTENT_DEFAULTS = [
  // ===== ส่วนกลาง =====
  { key: "common.brand_tagline", section: "common", label: "สโลแกนใต้โลโก้ (footer)", value: "ร้านหนังสือแสงดาว คัดหนังสือดีมาเพื่อคุณ ส่งถึงบ้านทั่วประเทศ" },
  { key: "footer.copyright", section: "common", label: "ข้อความลิขสิทธิ์ (footer)", value: "© 2026 SAENGDAO — ร้านหนังสือออนไลน์" },

  // ===== ตะกร้า =====
  { key: "cart.empty_title", section: "cart", label: "หัวข้อเมื่อตะกร้าว่าง", value: "ตะกร้าว่างเปล่า" },
  { key: "cart.empty_desc", section: "cart", label: "คำอธิบายเมื่อตะกร้าว่าง", value: "เลือกหนังสือที่คุณชอบกันก่อนนะ" },
  { key: "cart.empty_cta", section: "cart", label: "ปุ่มเมื่อตะกร้าว่าง", value: "เลือกซื้อหนังสือ" },

  // ===== หน้าชำระเงิน =====
  { key: "checkout.title", section: "checkout", label: "หัวข้อหน้า", value: "ชำระเงิน", order: 1 },
  { key: "checkout.shipping_heading", section: "checkout", label: "หัวข้อ: ที่อยู่จัดส่ง", value: "ที่อยู่จัดส่ง", order: 2 },
  { key: "checkout.field_name", section: "checkout", label: "ป้ายช่อง: ชื่อผู้รับ", value: "ชื่อผู้รับ", order: 3 },
  { key: "checkout.field_email", section: "checkout", label: "ป้ายช่อง: อีเมล", value: "อีเมล", order: 4 },
  { key: "checkout.field_phone", section: "checkout", label: "ป้ายช่อง: เบอร์โทร", value: "เบอร์โทรศัพท์", order: 5 },
  { key: "checkout.field_address", section: "checkout", label: "ป้ายช่อง: ที่อยู่", value: "ที่อยู่", order: 6 },
  { key: "checkout.receipt_toggle", section: "checkout", label: "ข้อความติ๊กออกใบเสร็จ", value: "ออกใบเสร็จรับเงิน / ใบกำกับภาษี", order: 7 },
  { key: "checkout.payment_heading", section: "checkout", label: "หัวข้อ: วิธีชำระเงิน", value: "วิธีชำระเงิน", order: 8 },
  { key: "checkout.payment_note", section: "checkout", label: "หมายเหตุใต้วิธีชำระเงิน", value: "* ขั้นตอนชำระเงินจริง (QR / สลิป / บัตร) จะเปิดใช้งานใน Phase 5", order: 9 },
  { key: "checkout.note_heading", section: "checkout", label: "หัวข้อ: หมายเหตุ", value: "หมายเหตุถึงร้าน", order: 10 },
  { key: "checkout.note_placeholder", section: "checkout", label: "placeholder ช่องหมายเหตุ", value: "ระบุรายละเอียดเพิ่มเติม เช่น เวลาที่สะดวกรับของ (ถ้ามี)", order: 11 },
  { key: "checkout.summary_heading", section: "checkout", label: "หัวข้อ: สรุปคำสั่งซื้อ", value: "คำสั่งซื้อ", order: 12 },
  { key: "checkout.discount_label", section: "checkout", label: "ป้าย: โค้ดส่วนลด", value: "โค้ดส่วนลด", order: 13 },
  { key: "checkout.apply_code", section: "checkout", label: "ปุ่มใช้โค้ด", value: "ใช้โค้ด", order: 14 },
  { key: "checkout.subtotal", section: "checkout", label: "ป้าย: ยอดรวมสินค้า", value: "ยอดรวมสินค้า", order: 15 },
  { key: "checkout.discount", section: "checkout", label: "ป้าย: ส่วนลด", value: "ส่วนลด", order: 16 },
  { key: "checkout.shipping_fee", section: "checkout", label: "ป้าย: ค่าจัดส่ง", value: "ค่าจัดส่ง", order: 17 },
  { key: "checkout.shipping_free", section: "checkout", label: "ค่าจัดส่ง (ฟรี)", value: "ฟรี", order: 18 },
  { key: "checkout.total", section: "checkout", label: "ป้าย: ยอดชำระ", value: "ยอดชำระ", order: 19 },
  { key: "checkout.submit", section: "checkout", label: "ปุ่มยืนยันคำสั่งซื้อ", value: "ยืนยันคำสั่งซื้อ", order: 20 },
];

// ชื่อ section ที่โชว์ในหลังบ้าน
export const SECTION_LABELS = {
  common: "ส่วนกลาง (โลโก้/Footer)",
  cart: "ตะกร้าสินค้า",
  checkout: "หน้าชำระเงิน",
};
