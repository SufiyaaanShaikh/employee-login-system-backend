import mongoose from "mongoose";

let isConnected = false;

export async function connectToDatabase() {
  if (isConnected) return;

  if (!process.env.MONGODB_URI) {
    throw new Error("❌ Missing MONGODB_URI in environment");
  }

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      // ✅ Let mongoose buffer during cold start
      bufferCommands: true,
    });

    isConnected = db.connections[0].readyState === 1;
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
    throw err;
  }
}
