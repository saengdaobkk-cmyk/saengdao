import { Router } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { prisma } from "../lib/prisma.js";
import { signToken, signPendingToken, authenticate } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { sendEmailVerification } from "../lib/email.js";
import { verifyTurnstile } from "../lib/turnstile.js";

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // ลิงก์ยืนยันอีเมลอายุ 24 ชม.
const newVerifyToken = () => ({ emailVerifyToken: crypto.randomBytes(32).toString("hex"), emailVerifyExpires: new Date(Date.now() + VERIFY_TTL_MS) });

const router = Router();

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// จำกัดคำขอต่อ IP — กัน spam/บอทกดรัวๆ และเดารหัสผ่าน
const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: "สมัครสมาชิกบ่อยเกินไป กรุณาลองใหม่ในอีก 1 ชั่วโมง" });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: "พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่" });
const twofaLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 15, message: "ยืนยันรหัสบ่อยเกินไป กรุณารอสักครู่" });
const resendLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 4, message: "ขอลิงก์ยืนยันบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่" });

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
  points: u.points ?? 0,
  twoFactorEnabled: u.totpEnabled ?? false,
});

// POST /api/auth/register
router.post("/register", registerLimiter, async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !emailRe.test(email))
      return res.status(400).json({ error: "อีเมลไม่ถูกต้อง" });
    if (!password || password.length < 6)
      return res.status(400).json({ error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" });

    // ตรวจ CAPTCHA (Turnstile) — ถ้ายังไม่ได้เปิดใช้ จะผ่านทันที
    const ts = await verifyTurnstile(req.body?.turnstileToken, req.ip);
    if (!ts.ok) return res.status(400).json({ error: ts.error });

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: "อีเมลนี้ถูกใช้งานแล้ว" });

    const { emailVerifyToken, emailVerifyExpires } = newVerifyToken();
    const user = await prisma.user.create({
      data: {
        email,
        password: await bcrypt.hash(password, 10),
        name: name?.trim() || null,
        emailVerified: false,
        emailVerifyToken,
        emailVerifyExpires,
      },
    });

    // ส่งอีเมลยืนยัน (best-effort — ไม่บล็อกการตอบกลับ)
    sendEmailVerification({ to: user.email, toName: user.name, token: emailVerifyToken }).catch(() => {});
    // ยังไม่ออก token — ต้องยืนยันอีเมลก่อนถึงเข้าใช้ได้
    res.status(201).json({ pendingVerification: true, email: user.email });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/verify-email — ยืนยันอีเมลจากลิงก์ แล้วเข้าสู่ระบบให้เลย
router.post("/verify-email", async (req, res, next) => {
  try {
    const token = String(req.body?.token || "").trim();
    if (!token) return res.status(400).json({ error: "ลิงก์ยืนยันไม่ถูกต้อง" });
    const user = await prisma.user.findFirst({ where: { emailVerifyToken: token } });
    if (!user) return res.status(400).json({ error: "ลิงก์ไม่ถูกต้องหรือถูกใช้ไปแล้ว" });
    if (user.emailVerifyExpires && user.emailVerifyExpires < new Date())
      return res.status(400).json({ error: "ลิงก์หมดอายุแล้ว กรุณาขอลิงก์ยืนยันใหม่", expired: true, email: user.email });

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerifyToken: null, emailVerifyExpires: null },
    });
    if (updated.totpEnabled) return res.json({ twoFactorRequired: true, pendingToken: signPendingToken(updated.id) });
    res.json({ token: signToken(updated), user: publicUser(updated) });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/resend-verification — ขอลิงก์ยืนยันใหม่ (ตอบเหมือนกันเสมอ กันเดาว่าอีเมลมีในระบบ)
router.post("/resend-verification", resendLimiter, async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").trim();
    if (email && emailRe.test(email)) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user && !user.emailVerified) {
        const t = newVerifyToken();
        await prisma.user.update({ where: { id: user.id }, data: t });
        sendEmailVerification({ to: user.email, toName: user.name, token: t.emailVerifyToken }).catch(() => {});
      }
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "กรอกอีเมลและรหัสผ่าน" });

    const user = await prisma.user.findUnique({ where: { email } });
    // ข้อความเดียวกันทั้งกรณีไม่มี user / รหัสผิด — กันการเดาบัญชี
    const ok = user && (await bcrypt.compare(password, user.password));
    if (!ok) return res.status(401).json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });

    // ยังไม่ยืนยันอีเมล → ยังเข้าใช้ไม่ได้
    if (!user.emailVerified)
      return res.status(403).json({ error: "กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ — เช็กกล่องจดหมาย (รวมถึง Junk/Spam)", verificationRequired: true, email: user.email });

    // เปิด 2FA อยู่ → ยังไม่ออก token เต็ม ให้ไปกรอกรหัส 6 หลักก่อน
    if (user.totpEnabled) return res.json({ twoFactorRequired: true, pendingToken: signPendingToken(user.id) });

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

// GET /api/auth/loyalty — แต้มสะสมของฉัน + ประวัติ
router.get("/loyalty", authenticate, async (req, res, next) => {
  try {
    const [user, logs, settings] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.user.id }, select: { points: true } }),
      prisma.pointEntry.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: "desc" }, take: 50 }),
      prisma.setting.findMany({ where: { key: { in: ["loyaltyEnabled", "loyaltyPointValue", "loyaltyBahtPerPoint"] } } }),
    ]);
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    res.json({
      points: user?.points || 0,
      enabled: map.loyaltyEnabled === "true",
      pointValue: Number(map.loyaltyPointValue) || 1,
      bahtPerPoint: Number(map.loyaltyBahtPerPoint) || 100,
      logs,
    });
  } catch (err) {
    next(err);
  }
});

/* ---------- ยืนยันตัวตน 2 ชั้น (TOTP) ---------- */
authenticator.options = { window: 1 }; // เผื่อคลาดเวลา ±1 ช่วง (30 วิ)
const TOTP_ISSUER = "SAENGDAO Admin";

// ยืนยันรหัส 6 หลักตอนล็อกอิน (ใช้ pendingToken จาก /login)
router.post("/2fa/verify", twofaLimiter, async (req, res, next) => {
  try {
    const { pendingToken, code } = req.body || {};
    let payload;
    try {
      payload = jwt.verify(pendingToken || "", process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: "หมดเวลา กรุณาเข้าสู่ระบบใหม่" });
    }
    if (!payload.twofa) return res.status(400).json({ error: "โทเคนไม่ถูกต้อง" });
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || !user.totpEnabled || !user.totpSecret) return res.status(400).json({ error: "บัญชีนี้ไม่ได้เปิด 2FA" });
    if (!authenticator.verify({ token: String(code || "").trim(), secret: user.totpSecret }))
      return res.status(401).json({ error: "รหัสไม่ถูกต้อง" });
    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

// เริ่มตั้งค่า 2FA — สร้าง secret + QR (ยังไม่เปิดใช้จนกว่าจะยืนยันรหัส)
router.post("/2fa/setup", authenticate, async (req, res, next) => {
  try {
    const secret = authenticator.generateSecret();
    await prisma.user.update({ where: { id: req.user.id }, data: { totpSecret: secret, totpEnabled: false } });
    const otpauth = authenticator.keyuri(req.user.email, TOTP_ISSUER, secret);
    const qr = await QRCode.toDataURL(otpauth, { margin: 1, width: 240 });
    res.json({ secret, otpauth, qr });
  } catch (err) {
    next(err);
  }
});

// ยืนยันรหัสเพื่อเปิดใช้งาน 2FA
router.post("/2fa/enable", authenticate, async (req, res, next) => {
  try {
    const u = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!u?.totpSecret) return res.status(400).json({ error: "ยังไม่ได้เริ่มตั้งค่า" });
    if (!authenticator.verify({ token: String(req.body?.code || "").trim(), secret: u.totpSecret }))
      return res.status(401).json({ error: "รหัสไม่ถูกต้อง ลองใหม่" });
    await prisma.user.update({ where: { id: u.id }, data: { totpEnabled: true } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ปิด 2FA — ต้องกรอกรหัสปัจจุบันยืนยัน
router.post("/2fa/disable", authenticate, async (req, res, next) => {
  try {
    const u = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!u?.totpEnabled) return res.json({ ok: true });
    if (!authenticator.verify({ token: String(req.body?.code || "").trim(), secret: u.totpSecret || "" }))
      return res.status(401).json({ error: "รหัสไม่ถูกต้อง" });
    await prisma.user.update({ where: { id: u.id }, data: { totpEnabled: false, totpSecret: null } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
