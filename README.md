# 📚 Bookstore — React + Node.js Ecommerce

ร้านหนังสือออนไลน์ | React (Vite) + Node.js (Express) + Prisma + PostgreSQL (Supabase)

## โครงสร้าง
```
client/   → React + Vite + Tailwind + React Router + React Query
server/   → Express + Prisma + JWT
```

## Stack
- **Frontend:** React 18, Vite, Tailwind CSS, React Router, TanStack Query, Axios
- **Backend:** Express, Prisma ORM, JWT, bcrypt
- **Database:** PostgreSQL (Supabase)
- **Payment (Phase 5):** PromptPay QR (สร้างเอง + สลิป), Omise (บัตร), โอนเงิน + สลิป

---

## เริ่มใช้งาน (Phase 1)

### 1. ตั้งค่า Supabase
1. สร้างโปรเจกต์ที่ https://supabase.com
2. ไปที่ **Project Settings → Database → Connection string**
3. คัดลอกค่ามาใส่ใน `server/.env` (ดูตัวอย่างใน `server/.env.example`)

### 2. Backend
```bash
cd server
cp .env.example .env      # แล้วแก้ค่า DATABASE_URL / DIRECT_URL / JWT_SECRET
npm install
npm run db:push           # สร้างตารางใน Supabase
npm run db:seed           # ใส่ข้อมูลตัวอย่าง (หนังสือ + admin)
npm run dev               # http://localhost:4000
```

### 3. Frontend
```bash
cd client
npm install
npm run dev               # http://localhost:5173
```

เปิด http://localhost:5173 ควรเห็น "✅ Server: ok | Database: connected"

---

## Roadmap
- [x] **Phase 1** — Setup (โครงโปรเจกต์ + เชื่อม DB)
- [ ] **Phase 2** — สินค้า (list/search/detail)
- [ ] **Phase 3** — Auth (สมัคร/login + JWT + role)
- [ ] **Phase 4** — ตะกร้า + Checkout
- [ ] **Phase 5** — Payment (PromptPay / บัตร / โอน+สลิป)
- [ ] **Phase 6** — Admin panel
- [ ] **Phase 7** — Deploy

## บัญชีตัวอย่าง (หลัง seed)
- Admin: `admin@bookstore.com` / `admin1234`
