import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import employeeRoutes from "./routes/employee.js";
import adminRoutes from "./routes/admin.js";
import { dbConnectMiddleware } from "./middleware/dbConnect.js";
import cron from "node-cron";
import { deleteExpiredPhotos } from "./utils/cleanup.js";

dotenv.config();
const app = express();

const CLIENT_URL =
  process.env.CLIENT_URL || "https://employee-login-system-frontend.vercel.app";

// ✅ Correct CORS setup for cross-site cookies
app.use(
  cors({
    origin: [CLIENT_URL, "http://localhost:3000"],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ✅ Required for Vercel proxy cookie support
app.set("trust proxy", 1);

// ✅ DB connect before any API routes
app.use(dbConnectMiddleware);

// ✅ Allow browsers to include cookies
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/admin", adminRoutes);

// ✅ Health check
app.get("/", (req, res) => {
  res.json({ message: "Employee Login System API is running!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

// Auto-delete photos every day at 2 AM
cron.schedule("0 2 * * *", async () => {
  console.log("Running photo cleanup...");
  await deleteExpiredPhotos();
});

export default app;
