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

dotenv.config({
  path: path.resolve("./.env")
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ DB Error:", err));

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/grievances", grievanceRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/regions", regionRoutes);

// Test route
app.get("/", (_, res) => {
  res.send("TVK Grievance Backend Running 🚀");
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
