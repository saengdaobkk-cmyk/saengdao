# 🚀 คู่มือ Deploy — SAENGDAO

Stack: **Frontend → Vercel** · **Backend → Railway** · **DB + ไฟล์ → Supabase**

---

## 0) เตรียม Git repo (ครั้งเดียว)

Vercel/Railway deploy จาก GitHub — ต้อง push โค้ดขึ้น GitHub ก่อน:
```bash
cd "E:/New web React + Node.js"
git init
git add .
git commit -m "SAENGDAO bookstore"
# สร้าง repo ใน github.com แล้ว:
git remote add origin https://github.com/<user>/saengdao.git
git push -u origin main
```
> `.env` และ `node_modules` ถูก gitignore แล้ว จะไม่ถูก push (ปลอดภัย)

---

## 1) Supabase Storage (ที่เก็บไฟล์อัปโหลด)

1. Supabase → **Storage** → **New bucket** → ชื่อ `uploads` → เลือก **Public bucket** ✅
2. เก็บค่าไว้ใส่ Railway (ขั้น 2):
   - `SUPABASE_URL` = Project Settings → API → Project URL
   - `SUPABASE_SERVICE_KEY` = Project Settings → API → **service_role** key 🔒 (ความลับ!)

---

## 2) Backend → Railway

1. [railway.app](https://railway.app) → New Project → **Deploy from GitHub repo** → เลือก repo
2. Settings → **Root Directory** = `server`
3. Variables → ใส่ env (ดู `server/.env.example`):
   ```
   DATABASE_URL, DIRECT_URL          (จาก Supabase)
   SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_BUCKET=uploads
   JWT_SECRET                        (สุ่มยาวๆ)
   CLIENT_URL                        (ใส่โดเมน Vercel ทีหลัง — ขั้น 4)
   ```
4. Railway จะรัน `npm install` (→ `prisma generate` อัตโนมัติ) แล้ว `npm start`
5. **สร้างตารางใน DB ครั้งแรก:** Railway → service → เปิด shell (หรือรันในเครื่อง) →
   ```bash
   npm run db:push
   npm run db:seed      # ข้อมูลตัวอย่าง + admin (ถ้าต้องการ)
   ```
6. คัดลอก **domain** ของ backend (เช่น `https://xxx.up.railway.app`) → Settings → Networking → Generate Domain

---

## 3) Frontend → Vercel

1. [vercel.com](https://vercel.com) → Add New Project → เลือก repo
2. **Root Directory** = `client` · Framework = Vite (auto)
3. Environment Variables:
   ```
   VITE_API_URL = https://xxx.up.railway.app   (domain จากขั้น 2)
   ```
4. Deploy → ได้โดเมน เช่น `https://saengdao.vercel.app`

---

## 4) เชื่อม CORS

กลับไป Railway → Variables → ตั้ง `CLIENT_URL` = โดเมน Vercel
```
CLIENT_URL=https://saengdao.vercel.app
```
(ใส่หลายโดเมนได้ คั่นด้วย `,`) → Railway redeploy อัตโนมัติ

---

## ✅ เช็คหลัง deploy
- เปิดโดเมน Vercel → หน้าร้านโหลดขึ้น
- `https://xxx.up.railway.app/api/health` → `{"status":"ok","db":"connected"}`
- login admin → อัปโหลดรูปปก → รูปโชว์ (URL เป็นของ Supabase)
- สั่งซื้อ → แนบสลิป → รูปเก็บใน Supabase Storage

## หมายเหตุ
- Railway free credit หมดแล้วแอปจะหยุด — ดูแพลนถ้าจะใช้ยาว
- Omise (บัตรเครดิต) ยังไม่เปิด — ใช้ PromptPay/โอนเงินได้เลย
