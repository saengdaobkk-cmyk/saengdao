import { PrismaClient } from "@prisma/client";

// ใช้ singleton กัน connection ซ้ำตอน dev (nodemon reload)
const globalForPrisma = globalThis;

// ข้อความ error ที่บ่งบอกว่า connection หลุดชั่วคราว (Supabase pooler ปิด idle / เน็ต blip)
const TRANSIENT_RE =
  /connection.*closed|closed the connection|ConnectionReset|10054|Can't reach database|ECONNRESET|ETIMEDOUT|Timed out fetching a new connection/i;

function makeClient() {
  const client = new PrismaClient({ log: ["error", "warn"] });
  // retry อัตโนมัติเมื่อ connection หลุดชั่วคราว (สูงสุด 3 ครั้ง, หน่วงเพิ่มขึ้น)
  return client.$extends({
    query: {
      async $allOperations({ args, query }) {
        let lastErr;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            return await query(args);
          } catch (err) {
            lastErr = err;
            if (!TRANSIENT_RE.test(err?.message || "")) throw err; // error อื่นไม่ retry
            await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
          }
        }
        throw lastErr;
      },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
