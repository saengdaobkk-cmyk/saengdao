# สำรอง & กู้คืนเว็บ SAENGDAO

แผนกันเว็บพัง — แบ่งเป็น 3 ส่วน ต้องดูแลทั้งหมด

| ส่วน | เก็บที่ไหน | กู้อย่างไร |
|---|---|---|
| **โค้ดเว็บ** | GitHub (`saengdao.git`) | redeploy commit ที่ดีล่าสุด (Vercel/Hostinger) |
| **ฐานข้อมูล** | Supabase Postgres | ไฟล์ backup JSON → `npm run db:restore` |
| **รูปที่อัปโหลด** | Supabase Storage (bucket `uploads`) | ดาวน์โหลดจาก Supabase Dashboard |

---

## 1. ฐานข้อมูล (สำคัญสุด — สินค้า/ออเดอร์/ลูกค้า/ตั้งค่า)

### สำรอง (ทำสม่ำเสมอ)
```bash
cd server
npm run db:backup
```
- ได้ไฟล์ `backups/saengdao-db-<วันเวลา>.json` (ครบทุกตาราง)
- **เก็บไฟล์นี้ไว้นอกเครื่องด้วย** (Google Drive / ไดรฟ์นอก) — เผื่อเครื่องพัง
- ⚠️ ไฟล์นี้มีข้อมูลลูกค้า **ห้าม commit ขึ้น git** (ถูก .gitignore ไว้แล้ว)

### กู้คืน (เมื่อ DB พัง/ข้อมูลหาย)
```bash
cd server
npm run db:restore -- ../backups/saengdao-db-2026-09-10T16-46-15.json --yes
```
- ⚠️ **ลบข้อมูลปัจจุบันทั้งหมด** แล้วแทนที่ด้วยไฟล์ที่เลือก
- ทำงานแบบ transaction เดียว: ถ้าพลาดกลางทางจะย้อนกลับให้เอง (ไม่พังครึ่งๆ)
- ถ้าไม่ใส่ `--yes` จะแค่แสดงสรุปให้ดูก่อน ไม่ลงมือจริง

> ต้องมีไฟล์ `server/.env` (ที่มี `DATABASE_URL`) อยู่ — สคริปต์ใช้ตัวนี้ต่อ DB

---

## 2. โค้ดเว็บ
อยู่บน GitHub อยู่แล้ว → ถ้า deploy ตัวใหม่แล้วพัง:
- **Vercel (frontend):** เข้า Deployments → เลือก build เก่าที่ดี → **Promote to Production**
- **Hostinger (backend):** push commit ที่ดีขึ้น git (auto-deploy) หรือ `git revert` ตัวที่พัง

---

## 3. รูปที่อัปโหลด (Supabase Storage)
รูปสไลด์/ปกหนังสือ/สลิป เก็บใน bucket `uploads` บน Supabase
- Supabase Storage มีความทนทานสูงอยู่แล้ว (ไม่หายง่าย)
- สำรองเอง: Supabase Dashboard → Storage → bucket `uploads` → ดาวน์โหลด
- ในฐานข้อมูล รูปถูกอ้างเป็น URL เต็ม → กู้ DB กลับมาแล้วรูปยังชี้ที่เดิมได้ทันที (ตราบใดที่ bucket ยังอยู่)

---

## แนะนำจังหวะสำรอง
- **ก่อนแก้อะไรใหญ่ๆ** (เปลี่ยน schema / รัน SQL / อัปเดตชุดใหญ่) → `npm run db:backup` ก่อนเสมอ
- **สม่ำเสมอ** เช่น สัปดาห์ละครั้ง เก็บไฟล์ล่าสุด 3–4 ไฟล์ไว้
- เก็บสำเนาไว้**นอกเครื่อง** อย่างน้อย 1 ที่
