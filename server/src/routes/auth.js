import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { signToken, authenticate } from "../middleware/auth.js";

const router = Router();

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ส่งข้อมูล user ที่ปลอดภัย (ไม่มี password)
const publicUser = (u) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  phone: u.phone ?? null,
  address: u.address ?? null,
  receiptName: u.receiptName ?? null,
  receiptTaxId: u.receiptTaxId ?? null,
  receiptAddress: u.receiptAddress ?? null,
  role: u.role,
});

// POST /api/auth/register
router.post("/register", async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !emailRe.test(email))
      return res.status(400).json({ error: "อีเมลไม่ถูกต้อง" });
    if (!password || password.length < 6)
      return res.status(400).json({ error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" });

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: "อีเมลนี้ถูกใช้งานแล้ว" });

    const user = await prisma.user.create({
      data: {
        email,
        password: await bcrypt.hash(password, 10),
        name: name?.trim() || null,
      },
    });

    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "กรอกอีเมลและรหัสผ่าน" });

    const user = await prisma.user.findUnique({ where: { email } });
    // ข้อความเดียวกันทั้งกรณีไม่มี user / รหัสผิด — กันการเดาบัญชี
    const ok = user && (await bcrypt.compare(password, user.password));
    if (!ok) return res.status(401).json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me — เช็คว่ายังล็อกอินอยู่
router.get("/me", authenticate, (req, res) => {
  res.json({ user: req.user });
});

// PATCH /api/auth/profile — แก้ชื่อ / เปลี่ยนรหัสผ่าน
router.patch("/profile", authenticate, async (req, res, next) => {
  try {
    const { name, email, phone, address, currentPassword, newPassword } = req.body;
    const data = {};

    const { receiptName, receiptTaxId, receiptAddress } = req.body;
    if (name !== undefined) data.name = name?.trim() || null;
    if (phone !== undefined) data.phone = phone?.trim() || null;
    if (address !== undefined) data.address = address?.trim() || null;
    if (receiptName !== undefined) data.receiptName = receiptName?.trim() || null;
    if (receiptAddress !== undefined) data.receiptAddress = receiptAddress?.trim() || null;
    if (receiptTaxId !== undefined) {
      const tid = receiptTaxId?.trim() || null;
      if (tid && !/^\d{13}$/.test(tid))
        return res.status(400).json({ error: "เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก" });
      data.receiptTaxId = tid;
    }

    // เปลี่ยนอีเมล — ตรวจรูปแบบ + กันซ้ำ
    if (email !== undefined && email !== req.user.email) {
      if (!emailRe.test(email)) return res.status(400).json({ error: "อีเมลไม่ถูกต้อง" });
      const exists = await prisma.user.findUnique({ where: { email } });
      if (exists && exists.id !== req.user.id)
        return res.status(409).json({ error: "อีเมลนี้ถูกใช้งานแล้ว" });
      data.email = email;
    }

    if (newPassword) {
      if (newPassword.length < 6)
        return res.status(400).json({ error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร" });
      const current = await prisma.user.findUnique({ where: { id: req.user.id } });
      const ok = await bcrypt.compare(currentPassword || "", current.password);
      if (!ok) return res.status(400).json({ error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" });
      data.password = await bcrypt.hash(newPassword, 10);
    }

    const user = await prisma.user.update({ where: { id: req.user.id }, data });
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

export default router;
