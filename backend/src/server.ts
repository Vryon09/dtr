import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "https://hootiy.netlify.app"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/settings", settingsRoutes);

// Test route
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Server is running",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
