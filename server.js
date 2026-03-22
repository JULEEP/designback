import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import mongoose from "mongoose";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import dns from "dns";

// 🔥 Fix MongoDB Atlas SRV DNS issue (local dev only)
dns.setServers(["8.8.8.8", "8.8.4.4"]);

dotenv.config();

const app = express();
const server = http.createServer(app);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================= ROUTES =================
import authRoutes from "./routes/AuthRoutes.js";
import adminRoutes from "./routes/AdminRoutes.js";

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

// Test Route
app.get("/", (req, res) => {
  res.json({
    message: "Server Running...",
    status: "OK"
  });
});

// ================= MONGODB CONNECTION =================
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Failed:", err.message);
  });

// ================= SERVER START =================
const PORT = process.env.PORT || 4050;

server.listen(PORT, () => {
  console.log("\n🚀 Server Running");
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`💻 Environment: ${process.env.NODE_ENV || "development"}\n`);
});

// ================= GRACEFUL SHUTDOWN =================
process.on("SIGINT", async () => {
  console.log("\n👋 Shutting down...");
  await mongoose.connection.close();
  process.exit(0);
});