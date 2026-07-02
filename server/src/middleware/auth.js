import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

// สร้าง JWT จาก user
export function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

// ตรวจ token แล้วแนบ req.user — ใช้กับ route ที่ต้องล็อกอิน
export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "กรุณาเข้าสู่ระบบ" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true, email: true, name: true, phone: true, address: true,
        receiptName: true, receiptTaxId: true, receiptAddress: true, role: true,
      },
    });
    if (!user) return res.status(401).json({ error: "ไม่พบบัญชีผู้ใช้" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" });
  }
}

// ต้องเป็น ADMIN — ใช้ต่อจาก authenticate
export function requireAdmin(req, res, next) {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ error: "เฉพาะผู้ดูแลระบบเท่านั้น" });
  }
  next();
}
