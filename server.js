import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import employeeRoutes from "./routes/employee.js";
import adminRoutes from "./routes/admin.js";
import { dbConnectMiddleware } from "./middleware/dbConnect.js";

dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ✅ DB connect before any API route
app.use(dbConnectMiddleware);
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/admin", adminRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Employee Login System API is running!" });
});

const PORT = process.env.PORT || 5000;
(async () => {
  try {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection error:", error);
  }
})();

// Auto-delete photos after 7 days
import cron from "node-cron";
import { deleteExpiredPhotos } from "./utils/cleanup.js";

// Run cleanup every day at 2 AM
cron.schedule("0 2 * * *", async () => {
  console.log("Running photo cleanup...");
  await deleteExpiredPhotos();
});

export default app;
