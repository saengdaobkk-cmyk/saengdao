# 🛡️ คู่มือสำรอง & กู้คืนเว็บ SAENGDAO

คู่มือกันเว็บพัง — อ่านไฟล์เดียวจบ กู้เว็บกลับมาได้ทุกกรณี
(อัปเดตล่าสุด: 2026-09-19)

---

## 📦 เว็บประกอบด้วย 4 ส่วน — ต้องเก็บให้ครบ

| ส่วน | เก็บที่ไหน | อยู่ใน backup ไหน |
|---|---|---|
| **1. โค้ดเว็บ** | GitHub (`saengdao.git`) | ✅ git เอง |
| **2. ฐานข้อมูล** (สินค้า/ออเดอร์/ลูกค้า/ตั้งค่า) | Supabase Postgres | ไฟล์ `backups/saengdao-db-*.json` |
| **3. รูปที่อัปโหลด** (สไลด์/ปก/สลิป) | Supabase Storage (bucket `uploads`) | โฟลเดอร์ `backups/storage-*/` |
| **4. ความลับ** (`DATABASE_URL` + keys) | ไฟล์ `server/.env` | ❌ **ไม่อยู่ใน git/backup ใดๆ — ต้องเก็บสำเนาเอง** |

> ⚠️ **ของ 3 อย่างที่ต้องก๊อปไปเก็บนอกเครื่อง** (Google Drive/ไดรฟ์นอก):
> `saengdao-db-*.json` + โฟลเดอร์ `storage-*/` + ไฟล์ `server/.env`
> มีครบ 3 อย่างนี้ = กู้เว็บกลับได้ทุกกรณี

---

## 🔧 ตั้งค่าครั้งแรก (ทำครั้งเดียว)

รันจากโฟลเดอร์ `server` เสมอ ต้องมี **Node.js** + ไฟล์ `server/.env`

`server/.env` ต้องมีอย่างน้อย:
```
DATABASE_URL=postgresql://...      # ต่อฐานข้อมูล (backup/restore DB)
DIRECT_URL=postgresql://...
SUPABASE_URL=https://xxxx.supabase.co     # backup/restore รูป
SUPABASE_SERVICE_KEY=eyJ...               # service_role key (เริ่ม eyJ มี 2 จุด) — เป็นความลับ!
```
> ดู `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` ได้ที่ Supabase Dashboard → Settings → API
> (หรือก๊อปจาก env ฝั่ง Hostinger ซึ่งเป็นค่าที่ใช้งานได้จริงอยู่แล้ว)

---

## 💾 วิธีสำรอง (Backup)

```bash
cd server
npm run db:backup        # ฐานข้อมูล → backups/saengdao-db-<วันเวลา>.json
npm run storage:backup   # รูปทั้งหมด → backups/storage-<วันเวลา>/
```
เสร็จแล้ว **ก๊อปไฟล์/โฟลเดอร์ที่ได้ไปเก็บนอกเครื่องด้วย**

> `backups/` ถูก .gitignore ไว้แล้ว (มีข้อมูลลูกค้า — ห้ามขึ้น git)

---

## ♻️ วิธีกู้คืน (Restore) — แยกตามอาการ

### กรณี A: ข้อมูลเพี้ยน/หาย แต่ตารางยังอยู่
(ลบสินค้าผิด, รัน SQL พลาด, ออเดอร์เพี้ยน — DB เดิมยังใช้ได้)
```bash
cd server
npm run db:restore -- ../backups/saengdao-db-2026-09-19T....json --yes
```
- **ลบข้อมูลปัจจุบันทั้งหมด** แล้วแทนที่ด้วยไฟล์ backup
- ทำใน transaction เดียว: พลาดกลางทางย้อนกลับให้เอง (ไม่พังครึ่งๆ)
- ไม่ใส่ `--yes` = แค่แสดงสรุปให้ดู ยังไม่ลงมือ

### กรณี B: รูปหาย
```bash
cd server
npm run storage:restore -- ../backups/storage-2026-09-19T.../
```
อัปรูปทุกไฟล์กลับเข้า bucket (ทับของเดิมชื่อเดียวกัน)

### กรณี C: โค้ด/ดีพลอยพัง (เว็บขึ้นแต่เพี้ยน/error)
ไม่ใช้ไฟล์ backup — ใช้ GitHub:
- **Vercel (frontend):** Deployments → เลือก build เก่าที่ดี → **Promote to Production**
- **Hostinger (backend):** `git revert` commit ที่พัง แล้ว push (auto-deploy) หรือ push commit ที่แก้แล้ว

### กรณี D: หายหมด — Supabase ใหม่เอี่ยม / เครื่องใหม่ (พังยับสุด)
ทำตามลำดับ:
```bash
# 1. เอาโค้ดมา
git clone https://github.com/saengdaobkk-cmyk/saengdao.git
cd saengdao/server
npm install

# 2. สร้างไฟล์ server/.env (ใส่ DATABASE_URL/DIRECT_URL/SUPABASE_* จากสำเนาที่เก็บไว้)
#    ถ้า Supabase ใหม่จริง → สร้างโปรเจกต์ Supabase ใหม่ แล้วเอา connection string ใหม่มาใส่

# 3. สร้างโครงตาราง (สำคัญ! DB ใหม่ยังไม่มีตาราง)
npm run db:push

# 4. เติมข้อมูลกลับ
npm run db:restore -- <ไฟล์ saengdao-db-*.json> --yes

# 5. อัปรูปกลับ
npm run storage:restore -- <โฟลเดอร์ storage-*/>
```

---

## ⚠️ 3 ข้อสำคัญที่ต้องเข้าใจ

**1. Backup = ภาพ ณ เวลาที่รัน (ไม่ใช่ real-time)**
กู้กลับได้แค่ถึงจุดที่ backup ล่าสุด — ออเดอร์/ลูกค้าที่เข้ามาหลังจากนั้นจะไม่อยู่ในไฟล์
→ **ยิ่ง backup บ่อย ยิ่งเสียข้อมูลน้อยตอนกู้**

**2. `db:restore` เติมข้อมูลเข้าตารางที่มีอยู่ — ไม่ได้สร้างตารางเอง**
- ตารางยังอยู่ (ข้อมูลแค่เพี้ยน) → restore ได้เลย
- DB ใหม่ล้วน (ไม่มีตาราง) → ต้อง `npm run db:push` สร้างโครงก่อน แล้วค่อย restore

**3. `server/.env` ไม่ได้อยู่ในทั้ง git และ backup**
มันคือกุญแจต่อ DB/Storage — **ต้องเก็บสำเนาเอง** ไม่งั้นต่ออะไรไม่ได้เลย

---

## 📅 จังหวะที่ควร backup

- **ก่อนแก้ใหญ่ๆ ทุกครั้ง** (เปลี่ยน schema / รัน SQL / อัปเดตชุดใหญ่) → `db:backup` ก่อนเสมอ
- **สม่ำเสมอ** — DB สัปดาห์ละครั้ง / รูปตอนเพิ่มรูปเยอะๆ
- เก็บย้อนหลังไว้สัก **3–4 ชุด** (เผื่อชุดล่าสุดมีปัญหา)
- เก็บสำเนา **นอกเครื่องอย่างน้อย 1 ที่**

---

## 📁 คำสั่งทั้งหมด (สรุป)

| คำสั่ง (จากโฟลเดอร์ `server`) | ทำอะไร |
|---|---|
| `npm run db:backup` | สำรองฐานข้อมูล → ไฟล์ .json |
| `npm run db:restore -- <ไฟล์> --yes` | กู้ฐานข้อมูลจากไฟล์ |
| `npm run storage:backup` | สำรองรูปจาก Supabase Storage |
| `npm run storage:restore -- <โฟลเดอร์>` | อัปรูปกลับเข้า Storage |
| `npm run db:push` | สร้าง/อัปเดตโครงตาราง (ใช้ตอน DB ใหม่) |

สคริปต์อยู่ที่ `server/scripts/` — `backup-db.js`, `restore-db.js`, `backup-storage.js`, `restore-storage.js`
