import { PrismaClient } from "@prisma/client";

// ใช้ singleton กัน connection ซ้ำตอน dev (nodemon reload)
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["error", "warn"] });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
