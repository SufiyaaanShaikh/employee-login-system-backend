import { connectToDatabase } from "../utils/db.js";

export async function dbConnectMiddleware(req, res, next) {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    console.error("DB Middleware Error:", err);
    res.status(500).json({ success: false, message: "Database connection failed" });
  }
}
