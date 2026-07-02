import multer from "multer";

const imageFilter = (req, file, cb) => {
  if (/^image\/(jpe?g|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
  else cb(new Error("รองรับเฉพาะไฟล์รูปภาพ (JPG/PNG/WEBP)"));
};

// เก็บใน memory (buffer) แล้วส่งต่อให้ storeFile (Supabase/disk)
const storage = multer.memoryStorage();

// สลิปการโอน — field "slip"
export const uploadSlip = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: imageFilter }).single("slip");

// รูปเดี่ยว เช่น ปกหนังสือ — field "image"
export const uploadImage = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: imageFilter }).single("image");

// หลายรูป (แกลเลอรี) — field "images"
export const uploadImages = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: imageFilter }).array("images", 12);

// PDF ตัวอย่าง — field "pdf"
export const uploadPdf = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => (file.mimetype === "application/pdf" ? cb(null, true) : cb(new Error("รองรับเฉพาะไฟล์ PDF"))),
}).single("pdf");
