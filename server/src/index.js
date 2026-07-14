import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { prisma } from "./lib/prisma.js";
import { UPLOAD_DIR } from "./lib/storage.js";
import authRouter from "./routes/auth.js";
import booksRouter from "./routes/books.js";
import categoriesRouter from "./routes/categories.js";
import ordersRouter from "./routes/orders.js";
import settingsRouter from "./routes/settings.js";
import couponsRouter from "./routes/coupons.js";
import slidesRouter from "./routes/slides.js";
import contentRouter from "./routes/content.js";
import termsRouter from "./routes/terms.js";
import navRouter from "./routes/nav.js";
import shippingRouter from "./routes/shipping.js";
import previewRouter from "./routes/preview.js";
import adminRouter from "./routes/admin.js";

const app = express();
const PORT = process.env.PORT || 4000;

// CLIENT_URL รับได้หลายค่า คั่นด้วย , (prod + preview domain) · เว้นว่าง = อนุญาตทุก origin
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json());
app.use(morgan("dev"));

// ไฟล์สลิปที่อัปโหลด
app.use("/uploads", express.static(UPLOAD_DIR));

// Health check — เช็คว่า server + DB ทำงาน
app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", db: "disconnected", message: err.message });
  }
});

app.use("/api/auth", authRouter);
app.use("/api/books", booksRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/coupons", couponsRouter);
app.use("/api/slides", slidesRouter);
app.use("/api/content", contentRouter);
app.use("/api/terms", termsRouter);
app.use("/api/nav", navRouter);
app.use("/api/shipping", shippingRouter);
app.use("/api/preview", previewRouter);
app.use("/api/admin", adminRouter);

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
