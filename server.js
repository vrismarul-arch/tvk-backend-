import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";

// Routes
import grievanceRoutes from "./routes/grievanceRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import regionRoutes from "./routes/regionRoutes.js";

// Load env
dotenv.config({
  path: path.resolve("./.env")
});

// Disable mongoose buffering (important)
mongoose.set("bufferCommands", false);

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Routes
app.use("/api/grievances", grievanceRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/regions", regionRoutes);

// Health check
app.get("/", (req, res) => {
  res.status(200).send("TVK Grievance Backend Running 🚀");
});

// Global error handler (optional but recommended)
app.use((err, req, res, next) => {
  console.error("🔥 Global Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal Server Error"
  });
});

// Start server ONLY after DB connects
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB Connected");

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
};

startServer();
