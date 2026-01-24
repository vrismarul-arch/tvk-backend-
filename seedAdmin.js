import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "./models/User.js";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

const exist = await User.findOne({ email: "admin@vrism.in" });

if (!exist) {
  const hash = await bcrypt.hash("admin123", 10);

  await User.create({
    name: "Super Admin",
    email: "admin@vrism.in",
    password: hash,
    role: "superadmin",
    mainRegion: "மாதவரம் பகுதி",
    subRegion: "வட்டம் 16"
  });

  console.log("✅ Super Admin created");
} else {
  console.log("⚠️ Admin already exists");
}

process.exit();
